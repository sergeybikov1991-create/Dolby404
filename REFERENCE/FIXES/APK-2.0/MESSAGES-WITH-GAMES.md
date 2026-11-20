# Эталон APK 2.0 — Сообщения с играми

Статус: зафиксировано по прямому указанию пользователя («фиксируй в эталон»).
Дата фиксации: 2026-11-20.
Рабочая ветка: `APK-2.0`.
Базовый коммит реализации: `ccad630d7d0692da8890562d3d8f4a797325d6de`.

## Что входит в эталон

- Экран «Сообщения» в APK использует актуальную веб-реализацию FLOUSTREAM, перенесённую в локальные Android assets.
- В диалогах предусмотрен встроенный раздел/вызов игры «Нарды» (Backgammon), без добавления второго дублирующего игрового интерфейса.
- В APK добавлена обработка WebView-запросов, чтобы соответствующие HTML/JS-модули обслуживались из локальных assets при сохранении HTTPS-адреса/ориджина приложения.
- Ветка и изменения относятся только к APK-2.0. Сайт и его ветка `main` не изменялись и не деплоились.

## Сверенные файлы веб-реализации и APK assets

Для перечисленных ниже пар SHA Git blob совпадают — содержимое идентично на момент проверки:

| Файл | SHA |
|---|---|
| `messages.html` | `a12c8347d17a1895e36be51a1ca3cfd8470e83fc` |
| `backgammon.html` | `df1eb1e75fc0ee9bf3a051513267f3053b207cc3` |
| `backgammon.js` | `5cbebab4d20e61d514e9387d4c3fdd11e2b64e0e` |
| `backgammon/dice.js` | `c61fbceea82492bc4b4203b1ad3f02f69098b749` |
| `backgammon/engine.js` | `39231b12d17bd0fe39b36c246642b0ff8a8cdf1b` |
| `backgammon/rules.js` | `2901e08bfe3b4c7599801fe8e5924819695fa189` |
| `supabase/functions/_shared/dice.mjs` | `dbc2231b3b0f20e2cdad624b2ca1f5028c35e0f9` |
| `supabase/functions/_shared/engine.mjs` | `ca896e290adb81d62f82a88b6ee3bd1271243c88` |
| `supabase/functions/_shared/rules.mjs` | `e7b13889d9efa61701397dc4f48a471bb6352f67` |

Основные APK asset paths:
- `android-web-shell-test/app/src/main/assets/messages.html`
- `android-web-shell-test/app/src/main/assets/backgammon.html`
- `android-web-shell-test/app/src/main/assets/backgammon.js`
- `android-web-shell-test/app/src/main/assets/backgammon/`

APK-only WebView mapping находится в:
`android-web-shell-test/app/src/main/java/com/floustream/webshelltest/MainActivity.kt`.

## Сборка, связанная с эталоном

- GitHub Actions run: [44707228456](https://github.com/sergeybikov1991-create/Dolby404/actions/runs/44707228456)
- Artifact: [FLOUSTREAM-WebShell-Test-debug](https://github.com/sergeybikov1991-create/Dolby404/actions/runs/44707228456/artifacts/14615048260)
- Artifact ID: `14615048260`
- Сборка Debug завершилась успешно; APK загружен как workflow artifact.

## Границы проверки

Успешная CI-сборка подтверждает компиляцию и публикацию тестового APK, но сама по себе не подтверждает работу на физическом устройстве. Необходимо отдельно проверить на устройстве:
- вход/сессию пользователя и список диалогов;
- открытие переписки и загрузку вложений;
- отображение игры «Нарды» внутри нужного диалога;
- ход игры и синхронизацию между двумя участниками;
- загрузку всех относительных JS-модулей и сетевых ресурсов в WebView.

Код развернутой Supabase Edge Function не объявляется идентичным GitHub-исходникам: серверную функцию и миграции эта фиксация не меняет и не деплоит.

## Правило сохранения

Эта запись — эталон для раздела «Сообщения с играми» в APK 2.0. При дальнейшей работе:
1. Не переписывать и не удалять зафиксированную реализацию без отдельного согласования.
2. Не менять сайт/ветку `main` в рамках задач APK 2.0.
3. Сохранять совпадение перечисленных файлов с веб-реализацией, если пользователь отдельно не утвердит изменение.
4. Любые дальнейшие доработки делать отдельным коммитом в `APK-2.0`, не затирая эту контрольную точку.
