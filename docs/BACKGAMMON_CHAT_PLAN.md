# FLOUSTREAM — длинные нарды в чате и мгновенная синхронизация

## Зафиксированные требования
- Реализовать только длинные нарды.
- Игровой режим открывается из существующей личной переписки переключателем «Чат / Играть».
- Организатор выбирает друга галочкой из списка друзей и отправляет приглашение.
- У друга в переписке появляется приглашение «Принять / Отклонить».
- После принятия у обоих участников эта же переписка переключается на одну общую игровую доску.
- На доске видны обе стороны, кнопка броска двух кубиков, чей ход и значения броска.
- Первая схема управления: нажать свою фишку → подсветить её и легальные пункты → нажать пункт назначения → сервер проверяет правила → фишка плавно перемещается у обоих игроков.
- Нелегальные ходы не выполняются. Сервер является авторитетным источником результата броска, очереди и допустимости хода.
- Состояние партии сохраняется; после перезагрузки/обрыва игрок возвращается к той же партии.
- Возврат из игрового режима в переписку не теряет историю сообщений.
- Экономика, ставки и внутриигровая валюта в этом этапе не разрабатываются.

## Правила длинных нард — базовая спецификация движка

Основа: спортивные правила длинных нард, раздел 5.4 (пункты 5.4.9–5.4.39) документа, утверждённого приказом Минспорта РФ от 15.07.2025 № 561. Перед реализацией отдельно зафиксировать выбранный регламент первого броска и турнирные/домашние варианты.

### Доска и старт
- Два игрока, у каждого 15 шашек своего цвета.
- Всего 24 пункта; у каждого игрока своя нумерация относительно его дома.
- Все 15 шашек каждого игрока в начале стоят стопкой на его голове.
- Игроки ведут шашки по кругу в одном направлении; для каждой стороны направление от головы к своему дому.
- Дом игрока — последние шесть пунктов его маршрута.
- Игрок управляет только шашками своего цвета.

### Занятие пунктов — без боя
- На пункте может стоять любое количество шашек одного игрока.
- Пункт, на котором есть хотя бы одна шашка соперника, закрыт для игрока.
- Нельзя поставить свою шашку на занятый соперником пункт, даже если там всего одна шашка.
- Выбивания, взятия шашек соперника и бара в длинных нардах нет.
- Нельзя ходить назад или перемещать чужие шашки.

### Кости и перемещения
- Два значения на костях — отдельные перемещения.
- Их можно разыграть разными шашками или одной шашкой последовательно; при ходе одной шашкой промежуточный пункт тоже должен быть открыт.
- Дубль даёт четыре перемещения соответствующего значения.
- Если можно использовать оба значения (или все четыре при дубле), игрок обязан использовать максимально возможное количество ходов.
- Если из двух разных значений доступно только одно, применяется правило старшего значения согласно выбранному спортивному регламенту.
- Если легальных перемещений нет, ход пропускается.
- Бросок костей и переход хода должны быть подтверждены сервером; клиент не может сам назначать результат броска.

### Голова
- Обычно за один ход с головы можно вывести только одну шашку.
- Исключение спортивного регламента: в первом броске второго игрока при дубле 3-3, 4-4 или 6-6 допускается вывести с головы две шашки.
- Точный протокол определения первого хода и применения исключения должен быть одинаковым для обеих сторон и будет закреплён до реализации движка.

### Блоки
- Шесть последовательных закрытых пунктов могут образовывать блок.
- Нельзя построить блок, который запирает все 15 шашек соперника; запрет действует и на промежуточное состояние внутри одного хода, если после завершения хода такой блок был бы создан.
- Движок должен проверять это правило для всей последовательности перемещений, а не только для конечной позиции.

### Дом и снятие шашек
- Снимать шашки разрешается только после того, как все 15 шашек игрока находятся в его доме.
- Снятие выполняется по значениям костей; если на соответствующем пункте шашки нет, применяются правила снятия с более дальнего занятого пункта.
- Если есть допустимое обычное перемещение, игрок не обязан снимать шашку.
- Побеждает игрок, первым снявший все 15 шашек.

## Принцип скорости для всего FLOUSTREAM
- Не использовать периодический опрос (polling) как основной механизм обновления сообщений, приглашений, игровых событий или статусов.
- Для событий реального времени использовать постоянное WebSocket-соединение через Supabase Realtime: Postgres Changes для надёжных событий БД, Broadcast для частых игровых событий, Presence для присутствия/подключения игроков.
- При открытии экрана выполнить один первоначальный запрос, затем получать изменения по подписке.
- При переподключении WebSocket выполнять синхронизацию состояния, а не возвращаться к постоянному опросу.
- Интерфейс должен немедленно подтверждать локальное действие (optimistic UI), затем согласовывать его с сервером; при отказе — откатывать и показывать причину.
- Не обещать нулевую сетевую задержку: измерять задержку, не блокировать UI ожиданием, корректно показывать reconnect/offline.
- Не менять рабочие функции чата и не ломать вложения, read receipts, RLS или существующую авторизацию.

## Этапы
1. Зафиксировать и проверить правила длинных нард и спорные варианты регламента.
2. Спроектировать чистый детерминированный движок правил и модель состояния партии.
3. Реализовать движок и автоматические тесты: старт, направление, открытые/закрытые пункты, голова, дубль, обязательность костей, блоки, дом и снятие.
4. Проверить движок на граничных позициях и последовательностях ходов.
5. После отдельного анализа схемы/RLS добавить безопасные игровые комнаты и приглашения.
6. Реализовать игровой UI и плавные анимации на телефоне и desktop.
7. Добавить тесты синхронизации двух игроков, отказа/повторного подключения и мобильной раскладки.
8. Только после тестов подключать функцию к production-сайту.

## Технические решения-кандидаты
- Текущий frontend: существующие статические HTML/JS страницы; чат находится в messages.html.
- Backend: существующий Supabase project qhpobdktlbhdqsnajypr.
- Supabase Realtime: Postgres Changes для сообщений и критичных DB-событий; Broadcast для игровых событий/анимаций; Presence для online state.
- Игровые ходы и кубики всегда проверяются сервером. Клиент не генерирует доверенный бросок и не определяет победителя.
- Не добавлять новые таблицы/функции в production до отдельной проверки схемы, RLS и согласования миграции.

## Безопасность и сохранность
- Работать только в feature/floustream-backgammon-chat, основанной на main.
- Не менять main напрямую.
- Не менять существующие таблицы и политики без анализа.
- Не сохранять содержимое личных переписок в диагностические логи.
- Существующие рабочие чат-функции, медиа и вложения должны остаться нетронутыми.

## Источник правил
- Приказ Минспорта РФ от 15.07.2025 № 561, раздел 5.4: https://base.garant.ru/412371634/5633a92d35b966c2ba2f1e859e7bdd69/
- Сверка правил и пояснений: https://narde.games/ru/long-narde/rules/


## Шаг 2 — модель состояния и контракт чистого движка

### Каноническая геометрия доски
- Доска хранится как 24 пункта с фиксированной нумерацией 0..23.
- Игрок A движется к увеличению индекса: голова 0, дом 18..23.
- Игрок B движется к уменьшению индекса: голова 23, дом 0..5.
- Значение пункта — знаковое целое: положительное число означает шашки A, отрицательное — шашки B, ноль — пусто. Так на одном пункте физически невозможно хранить шашки двух сторон.
- Отдельно хранятся снятые шашки каждого игрока (borneOff). Для каждого игрока инвариант: шашки на доске + снятые = 15.
- Направление и дом задаются конфигурацией стороны, а не вычисляются из DOM или визуального расположения доски.

### Состояние партии
Минимальная сериализуемая модель:
- schemaVersion — версия формата состояния.
- matchId — идентификатор партии.
- players — соответствие сторон A/B идентификаторам игроков.
- points[24] — состояние пунктов.
- borneOff.A/B — число снятых шашек.
- turn.player — сторона, которая ходит.
- turn.phase — awaiting_roll, moving или finished.
- turn.dice — подтверждённый сервером бросок (два значения).
- turn.remainingDice — ещё не использованные значения, включая четыре одинаковых значения при дубле.
- turn.movesApplied — уже выполненные перемещения в этом ходу, включая вывод с головы.
- opening — состояние стартового броска и флаги исключения первого хода; конкретный протокол открытия задаётся отдельной конфигурацией правил.
- winner — сторона-победитель или null.

В клиент не передаются секреты и доверие к клиенту не предполагается. Результат броска, проверка хода, смена очереди и победитель подтверждаются сервером.

### Чистый API движка (без DOM, Supabase и случайных чисел)
- createInitialState(config) — создаёт валидную стартовую позицию.
- validateState(state, rules) — проверяет структуру, количество шашек, допустимые фазы и инварианты.
- getLegalTurnSequences(state, dice, rules) — перечисляет допустимые полные последовательности хода с учётом порядка костей, дубля, головы, блоков, обязательного использования костей и правила старшего значения.
- getLegalMoves(state, dice, rules) — возвращает доступные первые действия из всех допустимых последовательностей; это источник подсветки на доске.
- applyMove(state, move, rules) — применяет только ход, который входит в допустимую последовательность; возвращает новое состояние, исходное не мутирует.
- finishTurn(state, rules) — разрешает завершение только когда обязательные кости использованы либо легальных ходов больше нет; затем переключает сторону.
- getWinner(state) — возвращает победителя только при снятии всех 15 шашек.

Движок не бросает кости сам. Он получает два значения от вызывающего доверенного серверного слоя, поэтому один и тот же вход всегда даёт один и тот же результат. Никакой сетевой, временной или случайной зависимости внутри правил.

### Обязательные инварианты и тестовые группы
1. Старт: ровно 15 шашек на каждой голове, ноль снятых, 24 пункта.
2. Баланс: после любого допустимого хода у каждой стороны на доске + снято ровно 15.
3. Запрет смешанного пункта: шашки двух цветов никогда не стоят вместе.
4. Направление: A не идёт к меньшему индексу, B — к большему; исключений для обратного хода нет.
5. Закрытый пункт: даже одна шашка соперника запрещает вход.
6. Голова: ограничение вывода проверяется на весь ход, а не на каждый отдельный вызов UI.
7. Кости: дубль даёт четыре шага; движок выбирает максимально возможное число шагов; для разных значений применяется правило старшего значения, если доступен только один бросок.
8. Последовательность: если одна шашка идёт двумя костями подряд, промежуточный пункт также должен быть открыт.
9. Блок: проверяется каждое промежуточное состояние последовательности, включая запрет запереть все 15 шашек соперника.
10. Дом и снятие: снятие невозможно до сбора всех 15 шашек в доме; победа невозможна до снятия всех 15.
11. Иммутабельность: применение хода не изменяет переданный исходный объект.
12. Повторяемость: одинаковые state + dice + rules дают одинаковый список легальных ходов.

### Разделение модулей
- backgammon/engine.js — чистые правила и переходы состояния.
- backgammon/rules.js — неизменяемые настройки выбранного регламента; варианты открытия партии не зашиваются скрыто в алгоритм.
- tests/backgammon-engine.test.js — модульные тесты на встроенном Node.js test runner; без новых npm-зависимостей.
- Игровой UI, Supabase, realtime и анимации не импортируются движком и подключаются только на следующих этапах.

### Решения, которые остаются явными до реализации
- Протокол определения первого игрока и точное применение исключения первого броска второго игрока.
- Подтверждение спортивного варианта правила блока на промежуточных позициях.
- Эти параметры должны быть явно записаны в rules и покрыты тестами; нельзя угадывать их по умолчанию.


## Шаг 3 — первая реализация движка (в работе)

Добавлены отдельные файлы:
- backgammon/rules.js — явная конфигурация длинных нард и стартовое исключение второго игрока на дублях 3, 4 и 6.
- backgammon/engine.js — чистая модель доски, проверка состояния, генерация последовательностей костей, применение допустимого хода, вывод шашек и завершение хода.
- tests/backgammon-engine.test.js — тесты стартовой позиции, баланса шашек, направления, закрытого пункта одной чужой шашкой, постановки на свои шашки, ограничения головы, стартового исключения, дубля, снятия и иммутабельности.
- package.json — команда npm run test:unit на встроенном Node.js test runner.
- .github/workflows/browser-tests.yml — unit-тесты запускаются перед браузерными smoke-тестами.

Важно: реализация пока первая и не считается завершённой или проверенной в CI. Ограничение полного шестипунктового блока оставлено выключенным (forbidFullBlockade: false), пока не зафиксируем точную трактовку спортивного регламента и не добавим отдельные тестовые позиции. Перед подключением интерфейса нужно проверить граничные сценарии и все последовательности костей.

## Дополнительные требования интерфейса: кости и рестарт партии

### Бросок костей — живой игровой процесс
- Игрок видит две объёмные 3D-кости с естественным вращением, отскоком и остановкой на выпавших гранях; анимация не должна выглядеть как простая смена картинки.
- Результат определяется доверенным серверным слоем до начала анимации. Для каждой кости используется криптографически стойкий равномерный генератор случайных чисел с устранением modulo bias; каждая грань имеет вероятность 1/6, все 36 упорядоченных пар — вероятность 1/36.
- Не применять «выравнивание удачи», подкрутку проигрывающему или балансировку результатов по игрокам/партиям. Не гарантировать одинаковое количество удачных бросков в короткой серии: это нарушило бы независимость случайных бросков.
- Клиент получает уже зафиксированный результат, проигрывает анимацию именно к нему и показывает итог. Повторный запрос, двойное нажатие, обновление страницы или переподключение не должны создавать второй бросок для одного хода.
- После броска интерфейс естественно показывает доступные ходы; при дубле визуально и механически доступны четыре шага.
- Не показывать игрокам панели статистики случайности, проверки, криптографические доказательства или отчёты. Защита и корректность работают незаметно внутри системы.

### Новая партия / рестарт
- На игровом экране есть заметная, но не мешающая кнопка «Рестарт».
- По нажатию показывается простое подтверждение: «Начать новую партию?» с кнопками «ОК» и «Отмена».
- «Отмена» закрывает диалог и не меняет текущую партию.
- «ОК» создаёт новую стартовую позицию, сбрасывает кости, очередь, историю ходов и состояние победы.
- Для онлайн-партии подтверждение должно быть безопасным для обоих участников: инициатор подтверждает действие в диалоге, затем сопернику показывается запрос начать новую партию; доска сбрасывается только после согласия обоих игроков. Отказ соперника оставляет текущую партию без изменений.
- Повторные нажатия и сетевые повторы обрабатываются идемпотентно, чтобы одна заявка не запускала несколько рестартов.

## Реализация костей — первый изолированный модуль

Добавлен `backgammon/dice.js`:
- использует Web Crypto (`crypto.getRandomValues`), а не `Math.random`;
- отбрасывает байты 252–255, чтобы исключить modulo bias: 252 допустимых значения делятся на 6 без остатка, каждая грань имеет ровно 42 исходных значения;
- два значения генерируются отдельными выборками; дубль возвращает четыре одинаковых шага;
- не содержит искусственной балансировки удачи между игроками;
- не показывает статистику или проверки игрокам.

Добавлены `tests/backgammon-dice.test.js` с проверками отклонения смещённого хвоста, равного отображения всех шести граней, обработки дубля и отказа при отсутствии Web Crypto. Команда `npm run test:unit` теперь запускает тесты движка и костей.

**Граница текущего этапа:** это только безопасный генератор. Он ещё не подключён к серверному игровому ходу и сам по себе не обеспечивает защиту от повторного запроса/переброса. До онлайн-интеграции необходима серверная атомарная операция: проверить участника и фазу хода, зафиксировать один бросок для конкретного turn_id/idempotency key, сохранить результат и вернуть тот же результат при повторе. Нельзя выдавать клиенту возможность самостоятельно вызывать генератор для выбора результата.

### Следующий серверный этап: защита броска от повторов и гонок

При проверке подключённого Supabase-проекта `qhpobdktlbhdqsnajypr` обнаружено, что игровых таблиц длинных нард пока нет. Существующие таблицы сайта не менялись.

Целевая схема интеграции (пока проектирование, не применено к базе):
1. Авторизованный игрок вызывает серверную Edge Function с идентификатором партии и текущего хода; число костей клиент не передаёт.
2. Сервер проверяет JWT, получает пользователя из проверенной сессии и генерирует бросок через `backgammon/dice.js`.
3. Одна атомарная Postgres RPC блокирует строку партии, проверяет активного игрока и фазу `awaiting_roll`, сохраняет бросок с уникальностью по `(match_id, turn_number)` и переводит ход в фазу перемещения.
4. При одновременных запросах, повторном нажатии или сетевом retry возвращается уже сохранённый бросок; второй результат для того же хода не создаётся.
5. Сервер публикует сохранённое состояние сопернику через Supabase Realtime. Клиент только отображает подтверждённые сервером кости и анимирует их.

Функция БД должна работать с минимальными привилегиями, с явной проверкой `auth.uid()`, RLS и ограниченными EXECUTE grants; не использовать широкую SECURITY DEFINER-функцию как обход RLS.

### Рестарт онлайн-партии — серверное состояние

Для запроса рестарта хранится инициатор, статус и версия партии. Оба игрока должны подтвердить один и тот же запрос. Только атомарная операция при двух согласиях сбрасывает доску, очередь, кости, номер хода и историю текущей партии. Отказ, истечение запроса или уход игрока не сбрасывают доску. Клиентское подтверждение «ОК» само по себе не изменяет игровое состояние.


## Rule clarification — six-point blockade

The engine now follows the International Backgammon Federation Rules (2025), Article 4.4: a six-point block is not prohibited by itself; it is illegal only when it traps all 15 opposing checkers. The prohibition applies even to a temporary intermediate position during the same turn. A block is allowed when at least one opposing checker has already passed it. This is intentionally stricter and more precise than the simplified “never make six in a row” interpretation.

Implementation: `rules.forbidFullBlockade = true`; legal move generation checks every intermediate board position before allowing the next die to be played. Tests cover both a full lock and the passed-checker exception. No live Supabase schema or production data was changed.


## Shared board coordinates — corrected to the long-nardy layout

The engine uses one shared 24-point board, not two mirrored player-local arrays:
- A starts on point 24 (array index 23); B starts on point 12 (index 11).
- Both players travel counterclockwise in the same direction.
- A's home is points 1–6 (indexes 0–5); B's home is points 13–18 (indexes 12–17).
- B's route crosses point 1 to point 24 before entering its home. Each player's exit is handled at the end of that player's own route.
- The head exception applies to the second player on the opening turn for doubles 3-3, 4-4 and 6-6.

This coordinate convention follows the Russian sport rules approved by Ministry of Sport Order No. 347 of 30 April 2025, Articles 20.2–20.6. The earlier prototype coordinates (heads at indexes 0 and 23 with opposite directions) are superseded.


## Server persistence and security boundary — implementation contract

The production project currently has no `private` schema, no backgammon tables, and no development branches. The existing `public` application tables are RLS-enabled and must remain untouched by the game migration.

Planned isolated game storage:
- `public.backgammon_matches`: match id, player A/B auth UUIDs, status, authoritative engine state JSON, turn number, revision, restart request, timestamps. RLS is enabled. Authenticated players receive SELECT only when their UUID is one of the two participants; they receive no direct INSERT/UPDATE/DELETE.
- `private.backgammon_actions`: idempotency ledger keyed by (match_id, action_id), with actor, action type, committed result and timestamp. The `private` schema is created by the game migration and is not exposed through the Data API.
- The match table is added to `supabase_realtime` publication only after checking publication membership. Realtime SELECT is limited to the two participants by RLS.

Trusted action path:
1. Edge Function validates the bearer token with Supabase Auth `getUser(token)`; it derives the actor UUID from the verified user, never from request JSON.
2. The Edge Function's server-only `SUPABASE_SERVICE_ROLE_KEY` is used only inside the function, never sent to a browser. This matches the existing `account-lifecycle` server-side pattern.
3. The Edge Function reads the current match, applies `engine.js` / `dice.js`, then calls one database transaction RPC with the expected revision and a client-generated action UUID.
4. The RPC locks the match row with `FOR UPDATE`, checks the action ledger first (a retry returns the original committed result), validates participant and revision, writes the next state and action result atomically, and increments revision. Competing actions based on stale state receive a conflict and must reload.
5. The RPC is `SECURITY INVOKER`, executable only by `service_role`; no `SECURITY DEFINER` escape hatch and no direct client write grants. The service-role key remains exclusively server-side.
6. A separate action-result lookup lets the Edge Function return a prior response before it re-evaluates a retried roll. A second action UUID cannot create a second roll for the same turn because the locked row and expected revision serialize the race.

Restart protocol:
- Store a pending request id, initiator, base revision, expiry and both participants' decisions.
- The initiator's UI confirmation creates the request; the opponent must accept the same request id.
- Only the transaction that observes both approvals may reset the board, dice, turn, winner and move history. Decline, expiry or a stale revision leaves the current board unchanged.
- Keep the players' A/B sides fixed across a restart; only reset the game state.

No SQL has been applied to the production project and no Edge Function has been deployed. A separate development branch costs $0.01344/hour and is awaiting explicit approval before creation.


### Opening roll

The opening is not a normal two-dice roll: each player rolls one secure die; if the values tie, both roll again. The player with the higher value moves first and uses both opening values as that turn's two dice. The server uses `rollOpeningDice()` for this, then records the first player and starts the first turn with those exact values. Subsequent turns use `rollDice()`; doubles expand to four moves. The opening-tie rule is covered by a unit test.


### Restart is a casual-mode feature, not a tournament rule

The 2025 International Backgammon Federation rules, Article 15.3, state that a party may not be cancelled, replayed or completed by agreement (apart from the specified resignation case). The requested two-player restart is therefore implemented only for explicitly casual/unrated matches. Tournament/rated matches must not expose or accept restart actions. This preserves the user's convenient restart in friendly play without silently violating the competition rules.


Rules source: [International Backgammon Federation — Rules of Backgammon (2025)](https://i-bg-federation.com/upload/iblock/b82/kvrmfzcgvr0pm63huk0khx17v0n9uo0j.pdf). Relevant provisions: long-nardy setup and movement (Articles 4 and 12), bearing off (Article 13), and no agreement-based replay in competition (Article 15.3).


## Free server implementation — feature branch only

The first online-server slice is now authored in this branch:
- `supabase/migrations/20261119030000_backgammon_match_actions.sql` creates isolated match storage, participant-only SELECT RLS, a private idempotency ledger, atomic row-locked commit RPCs, and a Realtime publication entry when that publication exists.
- `supabase/functions/backgammon-action/index.ts` authenticates the bearer token with Supabase Auth, derives the actor from the verified user, handles match invitations, opening roll, normal rolls, validated moves, turn completion, and casual-only mutual restart.
- The Edge Function uses the same canonical CommonJS engine/rules/dice files under `supabase/functions/_shared`; `backgammon/*.js` are thin Node wrappers for unit tests.
- Every state-changing request includes an action UUID and expected revision. The database locks the match row, rechecks the idempotency ledger after acquiring the lock, rejects stale revisions, and returns the first committed response for a retry.
- A unique partial index permits only one opening/normal roll per match turn. Match-wide turn numbers remain monotonic across casual restarts.
- `tests/backgammon-migration.test.sql` checks idempotent retries, stale revision rejection, one roll per turn, participant-only RLS, and denial of client writes/private-ledger reads.

Validation is performed on free GitHub-hosted runners with a disposable PostgreSQL 16 service. The migration and Edge Function have **not** been applied/deployed to the live Supabase project; the existing site/chat tables and production data remain untouched.


## First game-room UI

A responsive `backgammon.html` and `backgammon.js` game room now exist on the feature branch and are linked from the FLOUSTREAM home page. The page includes:
- username-based invitations, incoming accept/decline, and a list of a user's matches;
- a shared 24-point board with the correct two heads and player homes;
- selection of a checker and legal destination, plus bearing-off;
- opening roll, normal dice roll, automatic turn completion when no dice remain, and mutual casual restart controls;
- Realtime refresh of match state for both participants.

The browser test checks the signed-out redirect and the board/action surface. The page is ready to use once the isolated migration and `backgammon-action` Edge Function are deployed to the existing free Supabase project. The migration and function are still not applied/deployed to the live project.


## Free deployment status — 19 Nov 2026

The isolated game schema has now been applied to the existing FLOUSTREAM Supabase project (migration recorded as `20261119023324 / backgammon_match_actions`). The new `public.backgammon_matches` table is RLS-enabled and currently empty. It is included in `supabase_realtime`. Existing public site/chat tables were not altered.

Live privilege verification:
- `authenticated` has SELECT only on `public.backgammon_matches`; no direct INSERT/UPDATE/DELETE.
- `service_role` has the server-side table privileges.
- `backgammon_get_action_result` and `backgammon_commit_action` are SECURITY INVOKER, use an empty search_path, and are executable by `service_role` only.
- Participant RLS is the sole SELECT policy.

The `backgammon-action` Edge Function is ACTIVE, version 3, with JWT verification enabled. Version 3 includes the casual rematch option after a finished game. It uses the shared ESM rules, engine and Web Crypto dice modules; the service-role secret is never sent to the browser.

The game-room UI now shows real pip faces and animates only after a server-confirmed opening/normal roll. Mutual restart is available in casual matches both during a game and after it finishes; tournament matches do not allow restart.

Latest GitHub Actions run `#174` validates 25 Node unit tests, Chromium smoke/game-room tests, Deno type-checking, and the migration/idempotency/RLS checks against disposable PostgreSQL 16. No paid Supabase branch or paid test server was created.
