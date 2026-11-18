# FLOUSTREAM VOICE — технический отбор технологий

Дата проверки: 2026-11-18  
Рабочая ветка: `feature/floustream-voice-foundation`  
База: `release/floustream-0.4.28`

## Решение верхнего уровня

Голосовой помощник строится local-first: обработка речи и диалога на устройстве, без обязательных платных API и без передачи аудио в облако. Модели не включать в APK: скачивать по запросу в приватное хранилище приложения после показа размера, проверки свободного места, контрольной суммы и лицензии. При отсутствии модели — понятное сообщение и возможность повторить загрузку.

## 1. Распознавание речи (STT)

**Основной кандидат для прототипа: sherpa-onnx + T-one Russian streaming CTC.**

Подтверждено первоисточниками:
- sherpa-onnx v1.13.5 Android Kotlin API содержит `OnlineToneCtcModelConfig` и `OnlineRecognizer`; проверен именно tag v1.13.5, а не только текущий master.
- T-one — потоковая русская ASR-модель CTC, пакет `sherpa-onnx-streaming-t-one-russian-2025-09-08`.
- Архив релиза: 128,468,156 байт; распакованный `model.onnx` около 138 MB; в архиве также `tokens.txt` и `LICENSE`.
- Официальный SHA-256 архива: `b9c907450e99a6e5049e279bf18368a17db0bdc5e63b7fa978943138debbe3ae`.
- Модель ожидает 8 kHz. Для неё в приложении сделан настраиваемый AudioRecord sample rate, без неявного неправильного 16→8 kHz преобразования.
- Это основной прототипный кандидат, но не утверждённая модель релиза: проверить качество на обычном микрофоне телефона, имена контактов, шум, задержку, RAM и нагрев на OnePlus 10T.

Реализация прототипного слоя уже добавлена в ветку:
1. `RussianAsrModelInstaller` загружает официальный архив только по вызову пользователя, проверяет SHA-256, распаковывает только `model.onnx`, `tokens.txt`, `LICENSE` и блокирует path traversal.
2. `SherpaTOneRussianRecognizer` создаёт streaming recognizer через API sherpa-onnx v1.13.5 и требует 8 kHz.
3. `AndroidPcmAudioCapture` поддерживает конфигурируемую частоту захвата; для T-one задаётся 8 kHz.
4. Следующие проверки: сборка AAR, работа native JNI, лицензия в экране модели, качество распознавания на OnePlus 10T, WER/CER, partial/final latency, RAM и нагрев.
5. Сравнить на том же наборе фраз с GigaAM-v2 и небольшим zipformer-ru, если они дают более подходящее качество/ресурсный профиль.

## 2. Озвучивание (TTS)

**Первый выбор: Android TextToSpeech с русским голосом, который реально установлен и работает офлайн.**

Не обещать офлайн до проверки конкретного движка/голоса на телефоне: Android TTS может зависеть от установленных голосовых данных и настроек поставщика. В приложении предусмотреть проверку доступности русского языка и офлайн-статуса; если нет подходящего голоса — предложить загрузить голосовые данные или включить проверенную локальную sherpa-onnx TTS-модель.

В sherpa-onnx есть каталог TTS-моделей, включая русский язык, но конкретную модель пока не выбираем: нужно отдельно проверить её карточку, размер, качество и лицензию весов/голосового датасета.

## 3. Локальная языковая модель (LLM)

**Основной кандидат после актуальной проверки: Qwen3.5-2B, GGUF Q4_K_M, через llama.cpp.**

Почему:
- официальный Qwen3.5-2B model family заявляет 201 язык, tool calling и контекст до 262K; лицензия исходной модели Apache-2.0.
- Проверенный GGUF-пакет Q4_K_M весит примерно 1.28 GB; опубликован SHA-256 `aaf42c8b7c3cab2bf3d69c355048d4a0ee9973d48f16c731c0520ee914699223`.
- Вариант 2B предпочтительнее прежнего Qwen3-1.7B как более свежий кандидат для многошагового диалога и структурированных команд.
- Квантованный GGUF опубликован Unsloth; оригинальные веса Qwen3.5 и конвертация/квантование должны быть указаны в notices.

**Лёгкий fallback:** Qwen3.5-0.8B Q4_0 из официального аккаунта ggml-org, 563 MB, SHA-256 `57d1997790d1744fba5b40a7317df71ea5e2acee28c47e78f0cce39c0703f8cf`. Использовать при недостатке свободной RAM или как быстрый режим. Его меньшая ёмкость может хуже справляться с неоднозначным русским диалогом.

**Runtime-кандидат: llama.cpp Android JNI/Kotlin binding.**
- GGUF architecture `qwen35` уже присутствует в официальном ggml-org model catalog.
- В Android интеграции использовать только официальный llama.cpp runtime, закреплённый на конкретном commit, с CPU arm64 first; Vulkan/GPU — отдельная измеряемая оптимизация.
- Не использовать выдуманные Maven-координаты. Проверить актуальный Android sample, JNI API, native build и совместимость Qwen3.5 на том же pinned commit до добавления в Gradle.
- `StructuredLocalVoiceDialogueEngine` уже отделяет LLM от приложения через prompt builder + strict JSON decoder; конкретный JNI runtime должен реализовать только `LocalVoiceLanguageModel`.

Ограничения и политика:
- Модельные веса не включать в APK и не загружать автоматически. Отдельный экран с точным размером, лицензией, свободным местом, отменой и проверкой SHA-256.
- Для Qwen3.5-2B закладывать не менее 2.5 GB свободного места на модель и запас RAM для KV cache/runtime; точные пороги подобрать после диагностики свободной памяти OnePlus 10T.
- Не открывать модели 256K контекст на телефоне по умолчанию: ограничить контекст диалога до небольшого окна и генерировать только короткий JSON intent.
- Qwen3.5-2B и 0.8B — кандидаты, не прошедшие пока тест на OnePlus 10T. Проверить русский язык, JSON-valid rate, точность tool intent, tokens/sec, peak RAM, нагрев и батарею.

Источники:
- Qwen3.5-0.8B official model card / Apache-2.0: https://huggingface.co/Qwen/Qwen3.5-0.8B
- ggml-org Qwen3.5-0.8B GGUF, Q4_0 size + SHA-256: https://huggingface.co/ggml-org/Qwen3.5-0.8B-GGUF/blob/main/Qwen3.5-0.8B-Q4_0.gguf
- Qwen3.5-2B GGUF Q4_K_M + SHA-256: https://huggingface.co/unsloth/Qwen3.5-2B-GGUF
- Official llama.cpp Android/Kotlin sample: https://github.com/ggml-org/llama.cpp/tree/master/examples
- llama.cpp Android build documentation: https://github.com/ggml-org/llama.cpp/blob/master/docs/android.md

## 4. Команды приложения и безопасность

LLM никогда не получает прямой доступ к Android API, shell, базе данных или Supabase. Она формирует только структурированное намерение. Отдельный Command Router проверяет тип, параметры, состояние приложения и разрешённость действия.

Без дополнительного подтверждения разрешены только безопасные действия: открыть раздел чатов, открыть список контактов, показать медиа, подготовить текст в черновике. Отправка сообщения, звонок, удаление и изменение настроек — только после явного подтверждения пользователя. Контакты и доступные действия проверяются самим приложением, а не моделью.

## 5. Wake phrase

Фразу «Привет, Флоу» не включать в первый прототип. Сначала push-to-talk. Затем — локальный keyword spotting и только при явном включении пользователем, с постоянным уведомлением Android и видимым индикатором микрофона. Никакого скрытого фонового прослушивания.

## 6. План проверки на OnePlus 10T

Перед выбором окончательных весов нужно узнать фактическую конфигурацию памяти телефона через обычные системные сведения/диагностику, не требуя root или компьютера. Затем тестировать в таком порядке:

1. sherpa-onnx Android arm64 + русская STT-модель.
2. Android TTS: наличие русского голоса и работа без сети.
3. llama.cpp Android binding + Qwen3-1.7B quantized GGUF.
4. Сквозной сценарий: нажал микрофон → произнёс фразу → увидел распознанный текст → получил короткий ответ голосом.
5. Только после измерений — подключение белого списка команд FLOUSTREAM.

Метрики: размер загрузки, SHA256, лицензия, время инициализации, задержка распознавания, скорость генерации токенов, пиковая RAM, нагрев, расход батареи, качество русского языка.

## 7. Источники первоисточников

- sherpa-onnx: https://github.com/k2-fsa/sherpa-onnx
- sherpa-onnx T-one Russian model: https://k2-fsa.github.io/sherpa/onnx/pretrained_models/online-ctc/t-one-ctc-models.html
- T-one author repository and Apache-2.0 statement: https://github.com/voicekit-team/T-one
- Qwen3-1.7B model card and Apache-2.0: https://huggingface.co/Qwen/Qwen3-1.7B
- llama.cpp Android/Kotlin sample: https://github.com/ggml-org/llama.cpp/blob/master/docs/android.md
- llama.cpp Android arm64 build notes: https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md
- Google LiteRT / LiteRT-LM: https://developers.google.com/edge/litert

## Статус

Это технический отбор и план проверки, не готовая интеграция. Никакие зависимости, модели, разрешения Android или существующие экраны приложения этим документом не меняются. Существующие голосовые сообщения, чат-кэш, F-кнопка/веер и работа фото/видео остаются неприкосновенными.


## Дополнение после проверки upstream Android packaging (2026-11-18)

Проверен официальный Android AAR-проект sherpa-onnx и актуальная инструкция сборки Android runtime:

- У проекта есть отдельный модуль `android/SherpaOnnxAar`, который собирает `sherpa_onnx-release.aar`.
- Официальный релизный Android archive содержит предварительно собранные native libraries; upstream инструкция копирует их по ABI в `jniLibs`, после чего собирает AAR.
- Поэтому не добавляем выдуманную Maven-координату sherpa-onnx. Интеграция должна брать AAR и Kotlin API из официального релизного архива/сборки, фиксировать версию и SHA-256, и включать только `arm64-v8a` для первого теста на OnePlus 10T. Если позднее понадобится поддержка других устройств, добавим ABI отдельно.
- Runtime и модель остаются разными загрузками: AAR — часть приложения/модуля; модельные веса — отдельный opt-in download с checksum и лицензией.

Проверенные upstream материалы:
- https://github.com/k2-fsa/sherpa-onnx/tree/master/android/SherpaOnnxAar
- https://github.com/k2-fsa/sherpa-onnx/blob/master/android/SherpaOnnxAar/README.md
- https://k2-fsa.github.io/sherpa/onnx/android/build-sherpa-onnx.html
- https://github.com/k2-fsa/sherpa-onnx/releases

## Статус реализации после этого дополнения

- Добавлен общий координатор эксклюзивного владения микрофоном.
- Добавлен Android PCM capture: mono / 16 kHz / PCM16, кадры по 100 ms, преобразование в FloatArray для streaming recognizer.
- Capture получает lease координатора до открытия AudioRecord и освобождает его после остановки reader thread и AudioRecord.
- Добавлены unit tests для маршрутизатора команд и координатора аудиосессий.
- AAR sherpa-onnx v1.13.5 скачивается CI с SHA-256; T-one streaming recognizer и opt-in installer добавлены в отдельные классы.
- UI интеграция и запуск native JNI на OnePlus 10T ещё не подтверждены; модель не загружается автоматически.
