import { attachRouteStyles } from "../shared/route-styles.mjs";
import { getSupabaseClient, SUPABASE_URL, SUPABASE_KEY } from "../shared/supabase-client.mjs";


const MARKUP = "<div class=\"fs-route-profile\">\n<button type=\"button\" class=\"drawer-menu-button\" id=\"drawer-menu-button\" aria-label=\"Открыть меню\" aria-controls=\"side-drawer\" aria-expanded=\"false\"><span class=\"sound-signal\" aria-hidden=\"true\"><i></i><i></i><i></i><i></i><i></i></span></button>\n\n<div class=\"drawer-edge\" id=\"drawer-edge\" aria-hidden=\"true\"></div><div class=\"drawer-backdrop\" id=\"drawer-backdrop\"></div>\n<aside class=\"side-drawer\" id=\"side-drawer\" aria-label=\"Навигация FLOUSTREAM\" aria-hidden=\"true\">\n <div class=\"drawer-shell\"><div class=\"side-drawer-head\"><div class=\"side-drawer-logo\">FLOUSTREAM</div><button type=\"button\" class=\"side-drawer-close\" id=\"drawer-close\" aria-label=\"Закрыть меню\">×</button></div>\n <p class=\"side-drawer-caption\">Навигация</p><nav class=\"side-drawer-links\">\n <button class=\"side-drawer-link active\" data-drawer-action=\"profile\"><span class=\"side-drawer-icon\">◉</span>Мой профиль</button></nav>\n <div class=\"nav-history\" id=\"nav-history\"><p class=\"side-drawer-caption\" id=\"nav-history-title\">Недавно посещали</p><div class=\"nav-profile-visits\" id=\"nav-profile-visits\"></div><div class=\"nav-history-items\" id=\"nav-history-items\"><span class=\"nav-history-empty\">Пока пусто</span></div></div>\n \n  <section class=\"drawer-search\" aria-label=\"Поиск FLOUSTREAM\">\n   <button type=\"button\" class=\"drawer-search-toggle\" id=\"drawer-search-toggle\" aria-expanded=\"false\" aria-controls=\"drawer-search-options\"><span aria-hidden=\"true\">⌕</span> Поиск <span class=\"drawer-search-chevron\" aria-hidden=\"true\">⌄</span></button>\n   <div class=\"drawer-search-options\" id=\"drawer-search-options\" hidden>\n    <button type=\"button\" class=\"drawer-search-option\" data-drawer-search-action=\"search\"><span aria-hidden=\"true\">⌕</span>Поиск</button>\n    <button type=\"button\" class=\"drawer-search-option\" data-drawer-search-action=\"recommendations\"><span aria-hidden=\"true\">✧</span>Рекомендации</button>\n   </div>\n  </section>\n <div class=\"side-drawer-divider\"></div><p class=\"side-drawer-caption\">Медиа и общение</p><nav class=\"side-drawer-links\">\n <button class=\"side-drawer-link author-nav-link\" data-author-hub=\"true\" aria-label=\"AuTHOR\"><span class=\"side-drawer-icon\">▶</span><span class=\"author-label\" aria-label=\"AuTHOR\"><span>A</span><span>u</span><span>T</span><span>H</span><span>O</span><span>R</span></span></button>\n <a class=\"side-drawer-link\" id=\"messages-nav-link\" href=\"messages.html?v=20261119-realtime-2\"><span class=\"side-drawer-icon\">✉</span>Сообщения</a>\n <button class=\"side-drawer-link\" data-drawer-soon=\"Сообщества\"><span class=\"side-drawer-icon\">◎</span>Сообщества</button>\n <button class=\"side-drawer-link\" data-drawer-soon=\"Музыка\"><span class=\"side-drawer-icon\">♫</span>Музыка</button>\n <a class=\"side-drawer-link\" id=\"friends-nav-link\" href=\"friends.html?v=20261114-1\"><span class=\"side-drawer-icon\">♧</span>Друзья</a>\n  <button class=\"side-drawer-link\" data-drawer-soon=\"Закладки\"><span class=\"side-drawer-icon\">☆</span>Закладки</button></nav>\n <div class=\"drawer-bottom\"><button type=\"button\" class=\"side-drawer-link drawer-settings-button\" id=\"open-settings\"><span class=\"side-drawer-icon\">⚙</span>Настройки</button><button type=\"button\" class=\"drawer-logout-button\" id=\"drawer-logout\">↪ Выйти</button><div class=\"side-drawer-foot\">FLOUSTREAM · твоя цифровая территория</div></div></div>\n</aside>\n\n<div class=\"settings-backdrop\" id=\"settings-backdrop\" hidden>\n <section class=\"settings-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"settings-title\">\n  <div class=\"settings-head\"><h2 id=\"settings-title\">Настройки</h2><button type=\"button\" class=\"settings-close\" id=\"settings-close\" aria-label=\"Закрыть\">×</button></div>\n  <h3 style=\"margin:0 0 8px;color:#eee4ff;font-size:16px\">Профиль</h3>\n  <div class=\"settings-actions\"><button type=\"button\" class=\"primary\" id=\"open-profile-editor\">✎ Редактировать профиль</button></div>\n  <div class=\"settings-divider\"></div>\n  <label class=\"settings-label\" for=\"settings-language\">Язык интерфейса</label>\n  <select id=\"settings-language\"><option value=\"ru\">Русский</option><option value=\"en\">English</option></select>\n  <label class=\"settings-label\" for=\"settings-theme\">Стиль страницы</label>\n  <select id=\"settings-theme\"><option value=\"cyber\">Cyber violet — фиолетовый неон</option><option value=\"ocean\">Ocean — синий неон</option><option value=\"rose\">Rose — розовый неон</option><option value=\"mono\">Mono — монохромный</option></select>\n  <label class=\"settings-label\">Обложка профиля</label><div class=\"settings-actions\"><button type=\"button\" class=\"primary\" id=\"settings-change-cover\">✎ Изменить обложку</button></div>\n  <div class=\"settings-actions\"><button type=\"button\" class=\"primary\" id=\"save-preferences\">Сохранить настройки</button></div>\n  <p class=\"settings-help\">Выбранный стиль и язык сохраняются на этом устройстве.</p>\n  <div class=\"settings-divider\"></div>\n  <button type=\"button\" class=\"primary privacy-toggle\" id=\"privacy-toggle\" aria-expanded=\"false\" aria-controls=\"privacy-panel\">Приватность <span class=\"privacy-chevron\" aria-hidden=\"true\">⌄</span></button>\n  <div class=\"privacy-panel\" id=\"privacy-panel\" aria-hidden=\"true\">\n   <div class=\"privacy-panel-inner\" inert>\n    <p class=\"settings-help\">Фотоальбомы всегда доступны только владельцу. Здесь можно управлять видимостью видео, комментариев и публикаций.</p>\n     <label class=\"privacy-option\"><input id=\"privacy-video-visible\" type=\"checkbox\" checked> <span>Обычный видеоальбом — виден всем</span></label>\n    <label class=\"privacy-option\"><input id=\"privacy-comments-visible\" type=\"checkbox\" checked> <span>Комментарии — видны всем</span></label>\n    <label class=\"privacy-option\"><input id=\"privacy-feed-visible\" type=\"checkbox\" checked> <span>Публикации в ленте профиля — видны всем</span></label>\n    <div class=\"settings-actions\"><button type=\"button\" class=\"primary\" id=\"save-privacy-settings\">Сохранить приватность</button></div>\n   </div>\n  </div>\n  <div class=\"settings-divider\"></div>\n  <h3 style=\"margin:0;color:#eee4ff;font-size:16px\">Безопасность</h3>\n  <label class=\"settings-label\" for=\"new-password\">Введите новый пароль</label><input id=\"new-password\" type=\"password\" autocomplete=\"new-password\" minlength=\"8\" placeholder=\"Не менее 8 символов\">\n  <label class=\"settings-label\" for=\"confirm-password\">Повторите новый пароль</label><input id=\"confirm-password\" type=\"password\" autocomplete=\"new-password\" minlength=\"8\" placeholder=\"Повторите пароль\">\n  <div class=\"settings-actions\"><button type=\"button\" class=\"primary\" id=\"change-password\">Изменить пароль</button></div>\n  <p class=\"settings-help\">После смены пароля используй его при следующем входе в FLOUSTREAM.</p>\n  <div class=\"settings-divider\"></div>\n  <h3 style=\"margin:0;color:#ffb7c6;font-size:16px\">Удаление учётной записи</h3>\n  <p class=\"settings-help\">После подтверждения по email аккаунт будет деактивирован. В течение 30 дней можно восстановить именно прежний аккаунт. После этого личные данные и файлы будут удалены. Текст переписок останется у собеседников, имя будет заменено на «Удалённый аккаунт».</p>\n  <div class=\"settings-actions\"><button type=\"button\" class=\"primary\" id=\"delete-account-button\" style=\"background:#512033;border-color:#a84b68\">Удалить учётную запись</button></div>\n  <div class=\"settings-status\" id=\"settings-status\" aria-live=\"polite\"></div>\n </section>\n</div>\n<main class=\"wrap\">\n\n<section class=\"card\">\n<div class=\"cover\" id=\"cover\"><img class=\"cover-photo\" id=\"cover-photo\" alt=\"Обложка профиля\" hidden></div>\n<div class=\"profile\">\n<div class=\"identity\">\n<div class=\"avatar\" id=\"avatar\" role=\"button\" tabindex=\"0\" aria-label=\"Редактировать фото профиля\"></div>\n<div class=\"name\"><h1 id=\"display-name\">Загружаем профиль…</h1><p id=\"username\"></p></div>\n</div>\n<p class=\"bio\" id=\"bio\">Подготавливаем твою страницу…</p>\n<div class=\"editor\" id=\"editor\" hidden>\n<h2>Настроить профиль</h2>\n<input id=\"first-name-input\" maxlength=\"60\" autocomplete=\"given-name\" placeholder=\"Имя\">\n<input id=\"last-name-input\" maxlength=\"60\" autocomplete=\"family-name\" placeholder=\"Фамилия\">\n<input id=\"name-input\" maxlength=\"60\" placeholder=\"Отображаемое имя\">\n<input id=\"username-input\" maxlength=\"30\" placeholder=\"Например, flou_user\">\n<textarea id=\"bio-input\" maxlength=\"300\" placeholder=\"Расскажи немного о себе…\"></textarea>\n<p class=\"hint\">Чтобы изменить фотографию, просто нажми на круглый аватар.</p>\n<div class=\"actions\"><button class=\"primary\" id=\"save-button\">Сохранить</button><button id=\"cancel-button\">Отмена</button></div>\n<div id=\"message\"></div>\n</div>\n<div id=\"notice\" class=\"empty\" hidden></div>\n</div>\n</section>\n<nav class=\"quick-nav\" aria-label=\"Разделы FLOUSTREAM\">\n<button type=\"button\" data-soon=\"Видео\">▶ Видео</button>\n<button type=\"button\" data-soon=\"Музыка\">♫ Музыка</button>\n<a href=\"messages.html?v=20261119-realtime-2\">✉ Сообщения</a>\n<button type=\"button\" data-soon=\"Сообщества\">◎ Сообщества</button>\n</nav>\n<div class=\"quick-status\" id=\"quick-status\" aria-live=\"polite\"></div>\n<section class=\"feed-section\">\n<div class=\"feed-heading\">\n<h2 class=\"feed-title\">Лента публикаций</h2>\n<button type=\"button\" id=\"open-publish\" class=\"feed-compose-trigger\" aria-label=\"Создать публикацию\" title=\"Создать публикацию\">✎</button>\n</div>\n<div class=\"publish-box\">\n<div class=\"publish-editor\" id=\"publish-editor\" hidden>\n<div class=\"composer-top\"><button type=\"button\" class=\"composer-back\" id=\"composer-back\" aria-label=\"Свернуть редактор\">←</button><strong>Новая публикация</strong><span class=\"composer-top-spacer\"></span></div>\n<label for=\"post-text\">Текст публикации</label>\n<textarea id=\"post-text\" maxlength=\"5000\" placeholder=\"Что хочешь рассказать?\"></textarea>\n<div class=\"emoji-dock\" id=\"emoji-dock\"></div>\n<div class=\"hint\">Можно выбрать несколько форматов и опубликовать их вместе.</div>\n<div class=\"media-file\">\n<label for=\"post-files\">Фото, видео или музыка — можно выбрать несколько файлов</label>\n<input id=\"post-files\" type=\"file\" accept=\"image/*,video/*,audio/*\" multiple>\n</div>\n<div class=\"actions\"><button class=\"primary\" id=\"submit-post\">Опубликовать</button><button type=\"button\" id=\"cancel-publish\">Отмена</button></div>\n<div class=\"schedule-options\">\n<label class=\"schedule-toggle\" for=\"post-schedule-toggle\"><input type=\"checkbox\" id=\"post-schedule-toggle\"> Отложить публикацию</label>\n<div class=\"schedule-time-wrap\" id=\"schedule-time-wrap\" hidden>\n<label for=\"post-scheduled-at\">Дата и время выхода (Москва)</label>\n<input type=\"datetime-local\" id=\"post-scheduled-at\">\n<div class=\"schedule-help\">Публикации выходят по очереди, в порядке добавления.</div>\n</div>\n</div>\n<div id=\"publish-status\" aria-live=\"polite\"></div>\n</div>\n</div>\n<section class=\"scheduled-queue\" id=\"scheduled-queue\" hidden>\n<div class=\"scheduled-queue-head\"><h2>Отложенные публикации</h2><span id=\"scheduled-queue-count\"></span></div>\n<div id=\"scheduled-queue-list\"></div>\n</section>\n<div class=\"feed\" id=\"feed\" aria-live=\"polite\">\n<div id=\"feed-list\"></div>\n<div class=\"feed-loading\" id=\"feed-loading\">Загружаем публикации…</div>\n<div class=\"feed-empty\" id=\"feed-empty\" hidden><strong>Пока публикаций нет</strong>Здесь появятся записи пользователей FLOUSTREAM.</div>\n<div class=\"feed-error\" id=\"feed-error\" hidden></div>\n<div id=\"feed-sentinel\" aria-hidden=\"true\"></div>\n</div>\n</section>\n</main>\n<div class=\"photo-modal\" id=\"photo-modal\" hidden>\n <div class=\"photo-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"photo-title\">\n  <h2 id=\"photo-title\">Редактировать фото профиля</h2>\n  <p>Выбери фотографию из галереи телефона. Подойдут JPG, PNG или WebP размером до 10 МБ.</p>\n  <div class=\"actions\"><button class=\"primary\" id=\"choose-photo\">Выбрать из галереи</button><button id=\"open-photo-view\">Открыть</button><button id=\"close-photo\">Отмена</button></div>\n  <div id=\"photo-status\"></div>\n </div>\n</div>\n<div class=\"photo-viewer\" id=\"photo-viewer\" hidden>\n <img id=\"photo-view-image\" alt=\"Фотография профиля целиком\">\n <div class=\"photo-viewer-tools\"><button type=\"button\" class=\"photo-like\" id=\"photo-like\">♡ Нравится</button><button type=\"button\" class=\"photo-like-count-button\" id=\"photo-like-count\" aria-label=\"Открыть список лайков\">0 лайков</button><button type=\"button\" id=\"close-photo-view\">Закрыть</button></div>\n <div class=\"photo-likers\"><div class=\"photo-liker-avatars\" id=\"photo-liker-avatars\"></div></div>\n <div id=\"photo-view-status\" aria-live=\"polite\"></div>\n</div>\n<div class=\"post-photo-viewer\" id=\"post-photo-viewer\" hidden aria-label=\"Просмотр фотографии\">\n <button type=\"button\" class=\"post-photo-viewer-close\" id=\"close-post-photo\" aria-label=\"Закрыть\">×</button>\n <img id=\"post-photo-view-image\" alt=\"Фото публикации в полный экран\" draggable=\"false\">\n</div>\n<div class=\"likers-modal\" id=\"likers-modal\" hidden>\n <div class=\"likers-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"likers-title\">\n  <h2 id=\"likers-title\">Понравилось</h2>\n  <div class=\"likers-list\" id=\"likers-list\"></div>\n  <div class=\"actions\"><button type=\"button\" id=\"close-likers\">Закрыть</button></div>\n </div>\n</div>\n<div class=\"author-hub\" id=\"author-hub\" hidden>\n <header class=\"author-hub-head\"><button type=\"button\" id=\"author-hub-back\" aria-label=\"Назад\">←</button><div><strong>AuTHOR</strong><span>Твоя творческая территория</span></div><button type=\"button\" id=\"author-hub-close\" aria-label=\"Закрыть\">×</button></header>\n <main class=\"author-hub-stage\" id=\"author-hub-stage\" aria-label=\"Баннеры AuTHOR\">\n  <button type=\"button\" class=\"author-banner author-banner-photos\" id=\"author-photos-banner\" aria-label=\"Открыть фотогалерею\">\n   <img src=\"https://raw.githubusercontent.com/sergeybikov1991-create/Dolby404/design/author-banner-library/design/author-banners/02-my-photos/%2002-my-photos.jpg\" alt=\"\" fetchpriority=\"high\">\n   <span class=\"author-banner-shade\"></span>\n   <span class=\"author-banner-copy\"><small>AuTHOR · ГАЛЕРЕЯ</small><strong>МОИ ФОТО</strong><span>Все твои фотографии в одном месте</span></span>\n  \n   <span class=\"author-banner-tap\" role=\"button\" aria-label=\"ТЫК\">ТЫК</span></button>\n  <button type=\"button\" class=\"author-banner author-banner-videos\" id=\"author-videos-banner\" aria-label=\"Открыть мои видео\">\n   <img src=\"https://raw.githubusercontent.com/sergeybikov1991-create/Dolby404/design/author-banner-library/design/author-banners/01-my-videos/my-video.jpg\" alt=\"\" loading=\"lazy\">\n   <span class=\"author-banner-shade\"></span>\n   <span class=\"author-banner-copy\"><small>AuTHOR · ВИДЕОТЕКА</small><strong>МОИ ВИДЕО</strong><span>Твои видео в одном месте</span></span>\n  \n   <span class=\"author-banner-tap\" role=\"button\" aria-label=\"ТЫК\">ТЫК</span></button>\n  <button type=\"button\" class=\"author-banner author-banner-editor\" id=\"author-editor-banner\" aria-label=\"Video Editor\">\n   <img src=\"https://raw.githubusercontent.com/sergeybikov1991-create/Dolby404/design/author-banner-library/design/author-banners/03-video-editor/videoR.jpg\" alt=\"\" loading=\"lazy\">\n   <span class=\"author-banner-shade\"></span>\n   <span class=\"author-banner-copy\"><small>AuTHOR · CREATIVE STUDIO</small><strong>VIDEO EDITOR</strong><span>Твоя творческая студия видео</span></span>\n  \n   <span class=\"author-banner-tap\" role=\"button\" aria-label=\"ТЫК\">ТЫК</span></button>\n  <button type=\"button\" class=\"author-banner author-banner-loops\" id=\"author-loops-banner\" aria-label=\"Открыть lOOPS\">\n   <span class=\"loops-wordmark\" aria-label=\"lOOPS\"><span class=\"loops-letter loops-letter-l\">l</span><span class=\"loops-eyes\" aria-hidden=\"true\"><span class=\"loops-eye\"></span><span class=\"loops-eye\"></span></span><span class=\"loops-letter loops-letter-p\">P</span><span class=\"loops-letter loops-letter-s\">S</span></span>\n  \n   <span class=\"author-banner-tap\" role=\"button\" aria-label=\"ТЫК\">ТЫК</span></button>\n </main>\n <div class=\"author-hub-dots\" id=\"author-hub-dots\" aria-label=\"Переключение баннеров\"><span class=\"active\"></span><span></span><span></span><span></span></div>\n <p class=\"author-hub-hint\" id=\"author-hub-hint\">Листай баннеры свайпом</p>\n</div>\n<div class=\"loops-page\" id=\"loops-page\" hidden>\n <header class=\"loops-page-head\"><strong>FLOUSTREAM</strong><button type=\"button\" id=\"loops-page-back\" aria-label=\"Вернуться в AuTHOR\">←</button></header>\n <main class=\"loops-page-content\"><h1>lOOPS</h1><p>Пространство коротких видео FLOUSTREAM</p></main>\n</div>\n<div class=\"album-backdrop\" id=\"album-backdrop\" hidden>\n <section class=\"album-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"album-title\">\n  <div class=\"album-head album-head-centered\"><div class=\"album-head-actions\"><button type=\"button\" class=\"album-private-open\" id=\"album-private-open\" aria-label=\"Открыть приватный фотоальбом\" title=\"Приватный фотоальбом\">🔒</button><button type=\"button\" class=\"album-add-trigger\" id=\"album-add-open\" aria-label=\"Добавить фотографии\" title=\"Добавить фотографии\">+</button></div><button type=\"button\" class=\"settings-close album-head-close\" id=\"album-close\" aria-label=\"Закрыть\">×</button></div>\n  <div class=\"album-upload\" id=\"album-upload-panel\" hidden>\n   <strong style=\"color:#eee4ff\">Добавить фотографии</strong>\n   <input id=\"album-file\" type=\"file\" accept=\"image/jpeg,image/png,image/webp\" multiple>\n   <p class=\"album-note\" id=\"album-privacy-note\">Все фотографии сохраняются в личный альбом и доступны только тебе. Чтобы поделиться, открой фото и отправь его другу в личный чат.</p>\n   <button type=\"button\" class=\"primary\" id=\"album-upload-button\">Загрузить выбранные фото</button>\n   <button type=\"button\" class=\"album-cancel-upload\" id=\"album-add-cancel\">Отмена</button>\n  </div>\n  <div class=\"album-status\" id=\"album-status\" aria-live=\"polite\"></div>\n  <div class=\"album-grid\" id=\"album-grid\"></div>\n </section>\n</div>\n<div class=\"private-album-backdrop\" id=\"private-album-backdrop\" hidden><section class=\"private-album-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"private-album-title\"><div class=\"album-head\"><h2 id=\"private-album-title\">🔒 Приватный фотоальбом</h2><button type=\"button\" class=\"settings-close\" id=\"private-album-close\" aria-label=\"Закрыть приватный альбом\">×</button></div><p class=\"private-album-note\">Только ты можешь просматривать эти фотографии. Альбом не отображается в настройках приватности и обычном профиле.</p><div class=\"album-status\" id=\"private-album-status\" aria-live=\"polite\"></div><div class=\"album-grid\" id=\"private-album-grid\"></div></section></div>\n<div class=\"private-album-viewer\" id=\"private-album-viewer\" hidden><button type=\"button\" class=\"album-viewer-close\" id=\"private-album-viewer-close\" aria-label=\"Закрыть просмотр\">×</button><button type=\"button\" class=\"album-viewer-nav album-viewer-prev\" id=\"private-album-prev\" aria-label=\"Предыдущее фото\">‹</button><img id=\"private-album-image\" alt=\"Приватная фотография\" draggable=\"false\"><button type=\"button\" class=\"album-viewer-nav album-viewer-next\" id=\"private-album-next\" aria-label=\"Следующее фото\">›</button><div class=\"album-viewer-tools\" aria-label=\"Действия с приватной фотографией\"><button type=\"button\" id=\"private-album-share\" aria-label=\"Поделиться приватным фото\" title=\"Отправить фото другу\">flow</button><button type=\"button\" id=\"private-album-delete\" class=\"danger\" aria-label=\"Удалить приватное фото\" title=\"Удалить фото\">⌫</button></div><div class=\"album-viewer-counter\" id=\"private-album-counter\"></div><div class=\"album-viewer-thumbnails\" id=\"private-album-thumbnails\" hidden><div class=\"album-viewer-thumbnails-track\" id=\"private-album-thumbnails-track\"></div></div></div>\n<div class=\"album-viewer\" id=\"album-viewer\" hidden>\n <button type=\"button\" class=\"album-viewer-close\" id=\"album-viewer-close\" aria-label=\"Закрыть просмотр\">×</button>\n <button type=\"button\" class=\"album-viewer-nav album-viewer-prev\" id=\"album-viewer-prev\" aria-label=\"Предыдущее фото\">‹</button>\n <img id=\"album-viewer-image\" alt=\"Фотография в полном размере\">\n <button type=\"button\" class=\"album-viewer-nav album-viewer-next\" id=\"album-viewer-next\" aria-label=\"Следующее фото\">›</button>\n <div class=\"album-viewer-tools\" aria-label=\"Действия с фотографией\">\n  <button type=\"button\" id=\"album-viewer-share\" aria-label=\"Поделиться фото\" title=\"Отправить фото друзьям\">flow</button>\n  <button type=\"button\" id=\"album-viewer-delete\" class=\"danger\" aria-label=\"Удалить фото\" title=\"Удалить фото\">⌫</button>\n </div>\n <div class=\"album-viewer-counter\" id=\"album-viewer-counter\"></div>\n <div class=\"album-viewer-thumbnails\" id=\"album-viewer-thumbnails\" hidden><div class=\"album-viewer-thumbnails-track\" id=\"album-viewer-thumbnails-track\"></div></div>\n</div>\n<div class=\"album-share-backdrop\" id=\"album-share-backdrop\" hidden>\n <section class=\"album-share-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"album-share-title\">\n  <div class=\"album-head\"><h2 id=\"album-share-title\">Отправить фото</h2><button type=\"button\" class=\"settings-close\" id=\"album-share-close\" aria-label=\"Закрыть\">×</button></div>\n  <p class=\"album-note\">Выбери друга — на его аватаре появится отметка.</p>\n  <div class=\"album-share-friends\" id=\"album-share-friends\"><div class=\"album-empty\">Загружаем друзей…</div></div>\n  <button type=\"button\" class=\"album-share-send\" id=\"album-share-send\" disabled aria-label=\"Отправить выбранному пользователю\">➜</button>\n  <div class=\"album-status\" id=\"album-share-status\" aria-live=\"polite\"></div>\n </section>\n</div>\n\n<div class=\"video-album-backdrop\" id=\"video-album-backdrop\" hidden><section class=\"video-album-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"video-album-title\">\n<div class=\"album-head album-head-centered\"><div class=\"album-head-actions\"><button type=\"button\" class=\"album-private-open\" id=\"private-video-open\" aria-label=\"Открыть приватный видеоальбом\" title=\"Приватный видеоальбом\">🔒</button><button type=\"button\" class=\"album-add-trigger\" id=\"video-album-add-open\" aria-label=\"Добавить видео\" title=\"Добавить видео\">+</button></div><h2 id=\"video-album-title\" style=\"margin:0;color:#f2e9ff;font-size:20px\">Видео</h2><button type=\"button\" class=\"settings-close album-head-close\" id=\"video-album-close\" aria-label=\"Закрыть\">×</button></div>\n<div class=\"video-album-upload\" id=\"video-album-upload-panel\" hidden><strong style=\"color:#eee4ff\">Добавить видео</strong><input id=\"video-album-file\" type=\"file\" accept=\"video/mp4,video/webm,video/quicktime\" multiple><label><input id=\"video-album-private\" type=\"checkbox\"> <span>Приватный видеоальбом</span></label><p class=\"album-note\" id=\"video-album-privacy-note\">Обычные видео будут доступны в профиле согласно настройкам приватности. Если включить галочку, выбранные ролики попадут в секретный видеоальбом.</p><p class=\"album-note\">Форматы MP4, WebM и MOV. Максимальный размер одного видео — 50 МБ (лимит бесплатного тарифа).</p><button type=\"button\" class=\"primary\" id=\"video-album-upload-button\">Загрузить выбранные видео</button><button type=\"button\" class=\"album-cancel-upload\" id=\"video-album-add-cancel\">Отмена</button></div>\n<div class=\"album-status\" id=\"video-album-status\" aria-live=\"polite\"></div><div class=\"video-album-grid\" id=\"video-album-grid\"></div></section></div>\n<div class=\"private-video-backdrop\" id=\"private-video-backdrop\" hidden><section class=\"private-video-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"private-video-title\"><div class=\"album-head\"><h2 id=\"private-video-title\" style=\"margin:0;color:#f2e9ff;font-size:20px\">🔒 Приватный видеоальбом</h2><button type=\"button\" class=\"settings-close\" id=\"private-video-close\" aria-label=\"Закрыть приватный видеоальбом\">×</button></div><p class=\"private-album-note\">Только ты можешь просматривать эти видео. Альбом не отображается в настройках приватности и обычном профиле.</p><div class=\"album-status\" id=\"private-video-status\" aria-live=\"polite\"></div><div class=\"video-album-grid\" id=\"private-video-grid\"></div></section></div>\n<div class=\"video-album-viewer\" id=\"video-album-viewer\" hidden><div class=\"video-viewer-toolbar\"><button type=\"button\" id=\"video-album-viewer-delete\" class=\"danger\" aria-label=\"Удалить видео\" title=\"Удалить видео\">⌫</button><span id=\"video-album-viewer-counter\"></span><button type=\"button\" id=\"video-album-viewer-close\" aria-label=\"Закрыть просмотр\" title=\"Закрыть\">×</button></div><div class=\"video-viewer-stage\"><video id=\"video-album-player\" controls playsinline preload=\"metadata\"></video></div></div>\n<div class=\"private-video-viewer\" id=\"private-video-viewer\" hidden><div class=\"video-viewer-toolbar\"><button type=\"button\" id=\"private-video-viewer-delete\" class=\"danger\" aria-label=\"Удалить приватное видео\" title=\"Удалить видео\">⌫</button><span id=\"private-video-viewer-counter\"></span><button type=\"button\" id=\"private-video-viewer-close\" aria-label=\"Закрыть просмотр\" title=\"Закрыть\">×</button></div><div class=\"video-viewer-stage\"><video id=\"private-video-player\" controls playsinline preload=\"metadata\"></video></div></div>\n\n<div class=\"messages-backdrop\" id=\"messages-backdrop\" hidden>\n <section class=\"messages-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"messages-title\">\n  <div class=\"album-head\"><button type=\"button\" id=\"messages-back\" hidden>‹ Назад</button><h2 id=\"messages-title\">Сообщения</h2><button type=\"button\" class=\"settings-close\" id=\"messages-close\" aria-label=\"Закрыть\">×</button></div>\n  <div id=\"messages-list\" class=\"messages-list\"></div><div id=\"messages-thread\" class=\"messages-thread\" hidden></div>\n </section>\n</div>\n<input id=\"avatar-file\" type=\"file\" accept=\"image/jpeg,image/png,image/webp\" hidden>\n<input id=\"cover-file\" type=\"file\" accept=\"image/jpeg,image/png,image/webp\" hidden>\n<div class=\"album-backdrop\" id=\"music-backdrop\" hidden>\n <section class=\"album-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"music-title\">\n  <div class=\"album-head\"><h2 id=\"music-title\">Моя музыка</h2><button type=\"button\" class=\"settings-close\" id=\"music-close\" aria-label=\"Закрыть\">×</button></div>\n  <section class=\"music-upload-section\" aria-label=\"Добавление музыки\">\n   <button type=\"button\" class=\"primary music-upload-toggle\" id=\"music-upload-toggle\" aria-expanded=\"false\" aria-controls=\"music-upload-panel\"><span>＋ Добавить свой трек</span><span class=\"music-upload-chevron\" aria-hidden=\"true\">⌄</span></button>\n   <div class=\"music-upload-panel\" id=\"music-upload-panel\" aria-hidden=\"true\">\n    <div class=\"music-upload-panel-inner\">\n     <div class=\"album-upload\">\n      <label for=\"music-track-file\">Аудиофайл</label>\n      <input id=\"music-track-file\" type=\"file\" accept=\"audio/*\">\n      <button type=\"button\" class=\"primary\" id=\"music-upload-button\">Загрузить трек</button>\n     </div>\n    </div>\n   </div>\n   <div class=\"album-status\" id=\"music-status\" aria-live=\"polite\"></div>\n  </section>\n  <section class=\"music-tracks-section\" aria-label=\"Мои треки\">\n   <h3>Мои треки</h3>\n   <div class=\"music-track-list\" id=\"music-track-list\"></div>\n  </section>\n </section>\n</div>\n\n\n\n\n\n\n\n<div class=\"discovery-backdrop\" id=\"discovery-backdrop\" hidden>\n <section class=\"discovery-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"discovery-title\">\n  <header class=\"discovery-head\"><h2 id=\"discovery-title\">Поиск FLOUSTREAM</h2><button type=\"button\" class=\"discovery-close\" id=\"discovery-close\" aria-label=\"Закрыть\">×</button></header>\n  <div id=\"discovery-search-view\">\n   <form class=\"discovery-searchbar\" id=\"discovery-search-form\"><input id=\"discovery-query\" type=\"search\" placeholder=\"Люди, публикации, музыка, видео…\" autocomplete=\"off\" maxlength=\"100\"><button class=\"primary\" type=\"submit\">Найти</button></form>\n   <nav class=\"discovery-tabs\" id=\"discovery-tabs\" aria-label=\"Категории поиска\">\n    <button type=\"button\" class=\"discovery-tab\" data-category=\"all\" aria-pressed=\"true\">Всё</button>\n    <button type=\"button\" class=\"discovery-tab\" data-category=\"people\" aria-pressed=\"false\">Люди</button>\n    <button type=\"button\" class=\"discovery-tab\" data-category=\"posts\" aria-pressed=\"false\">Публикации</button>\n    <button type=\"button\" class=\"discovery-tab\" data-category=\"music\" aria-pressed=\"false\">Музыка</button>\n    <button type=\"button\" class=\"discovery-tab\" data-category=\"video\" aria-pressed=\"false\">Видео</button>\n   </nav>\n   <div class=\"discovery-results\" id=\"discovery-results\"><div class=\"discovery-empty\">Введи запрос, чтобы найти людей и открытый контент FLOUSTREAM.</div></div>\n  </div>\n  <div id=\"discovery-recommendations-view\" hidden><div class=\"discovery-results\" id=\"discovery-recommendations-results\"><div class=\"discovery-status\">Подбираем рекомендации…</div></div></div>\n </section>\n</div>\n\n\n\n\n\n\n</div>";
let profileScriptsPromise = null;
function ensureProfileScripts() {
  if (!profileScriptsPromise) {
    const load = src => new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL(src, import.meta.url).href;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Не удалось загрузить компонент профиля: " + src));
      document.head.appendChild(script);
    });
    profileScriptsPromise = (async () => {
      if (!window.initFloustreamMessageNotifications) await load("../message-notifications.js");
      if (!window.initFloustreamFriendNotifications) await load("../friend-notifications.js");
      await load("../floustream-player.js?v=20261114-11");
    })().catch(error => { profileScriptsPromise = null; throw error; });
  }
  return profileScriptsPromise;
}
export const stylesheet = new URL("./styles/profile.css?v=1", import.meta.url).href;
export const title = "Мой профиль · FLOUSTREAM";
export const shadow = false;

export async function mount(root, { signal, navigate, url }) {
  const originalBodyStyle = document.body.getAttribute("style");
  const originalBodyClass = document.body.className;
  const originalTheme = document.body.dataset.theme;
  const originalRootVisibility = root.style.visibility;
  root.style.visibility = "hidden";
  let style = null;
  const stylePromise = attachRouteStyles(document.head, stylesheet, "profile", signal).then(value => {
    style = value;
    return value;
  });
  root.innerHTML = MARKUP;
  const routeRoot = root.querySelector(".fs-route-profile");

  const profileTimerKinds = new Map();
  const profileObservers = [];
  function profileTimeout(callback, delay, ...args) {
    let id;
    id = window.setTimeout(() => {
      profileTimerKinds.delete(id);
      if (!signal.aborted) callback(...args);
    }, delay);
    profileTimerKinds.set(id, "timeout");
    return id;
  }
  function profileInterval(callback, delay, ...args) {
    const id = window.setInterval(() => {
      if (!signal.aborted) callback(...args);
    }, delay);
    profileTimerKinds.set(id, "interval");
    return id;
  }
  function profileClearTimeout(id) { window.clearTimeout(id); profileTimerKinds.delete(id); }
  function profileClearInterval(id) { window.clearInterval(id); profileTimerKinds.delete(id); }

  const restoreProfileShell = () => {
    const ownsRoot = routeRoot.isConnected && routeRoot.parentNode === root;
    if (ownsRoot) {
      root.style.visibility = originalRootVisibility;
      document.body.style.cssText = originalBodyStyle || "";
      document.body.className = originalBodyClass;
      if (originalTheme === undefined) delete document.body.dataset.theme;
      else document.body.dataset.theme = originalTheme;
      root.replaceChildren();
    }
    style?.remove();
  };

  if (signal.aborted) return restoreProfileShell;

  
let client,user,profile={},columns=[];
const $=id=>root.querySelector("#"+id)||root.querySelector("."+id);

function firstKey(keys){return keys.find(k=>columns.includes(k));}
function setAvatar(url){const box=$("avatar");box.innerHTML="";if(url){const img=document.createElement("img");img.src=url;img.alt="Аватар";img.onerror=()=>{box.innerHTML="";};box.appendChild(img);}}
function render(){
 const nameKey=firstKey(["display_name","full_name","name"]);
 const usernameKey=firstKey(["username","handle","nickname"]);
 const bioKey=firstKey(["bio","about","description"]);
 const avatarKey=firstKey(["avatar_url","avatar"]);
 const display=(nameKey&&profile[nameKey])||user.email||"Мой профиль";
 $("display-name").textContent=display;appendDolbyOnlineIndicator($("display-name"),user.id);
 $("username").textContent=usernameKey&&profile[usernameKey]?"@"+profile[usernameKey]:"";
 $("bio").textContent=(bioKey&&profile[bioKey])||"Здесь скоро появится рассказ о тебе. Открой меню → Настройки → Профиль, чтобы заполнить страницу.";
 setAvatar(avatarKey&&profile[avatarKey]);
 const coverKey=firstKey(["cover_url","banner_url","cover"]);const coverUrl=coverKey&&profile[coverKey];const coverImage=$("cover-photo");if(coverUrl){coverImage.src=coverUrl;coverImage.hidden=false;}else{coverImage.removeAttribute("src");coverImage.hidden=true;}
 $("first-name-input").value=profile.first_name||"";
 $("last-name-input").value=profile.last_name||"";
 $("name-input").value=((nameKey&&profile[nameKey])==="Новый пользователь")?"":((nameKey&&profile[nameKey])||"");
 $("username-input").value=(usernameKey&&profile[usernameKey]&&!/^user_[a-f0-9]{12,}$/i.test(profile[usernameKey]))?profile[usernameKey]:"";
 $("bio-input").value=(bioKey&&profile[bioKey])||"";

}
const navigationNames={profile:["Мой профиль","My profile","◉"],feed:["Лента публикаций","Posts feed","▤"],settings:["Настройки","Settings","⚙"],friends:["Друзья","Friends","♧"],messages:["Сообщения","Messages","✉"],communities:["Сообщества","Communities","◎"],music:["Музыка","Music","♫"],video:["Видео","Videos","▶"],photos:["Фото","Photos","▧"],bookmarks:["Закладки","Bookmarks","☆"]};
async function loadProfileVisitHistory(){
 const host=$("nav-profile-visits");if(!host||!client||!user)return;
 try{
  const visits=await client.from("profile_visits").select("visited_profile_id,last_visited_at").eq("visitor_id",user.id).order("last_visited_at",{ascending:false}).limit(5);
  if(signal.aborted)return;
  if(visits.error)throw visits.error;
  const rows=visits.data||[];host.replaceChildren();if(!rows.length)return;
  const ids=rows.map(row=>row.visited_profile_id);
  const profiles=await client.from("profiles").select("id,username,display_name,avatar_url,last_activity_at,time_zone").in("id",ids);
  if(signal.aborted)return;
  if(profiles.error)throw profiles.error;
  const byId=new Map((profiles.data||[]).map(profile=>[profile.id,profile]));
  rows.forEach(row=>{
   const profile=byId.get(row.visited_profile_id);if(!profile)return;
   const name=profile.display_name||profile.username||"Пользователь";
   const link=document.createElement("a");link.className="nav-profile-visit";link.href="public-profile.html?id="+encodeURIComponent(profile.id);
   if(profile.avatar_url){const avatar=document.createElement("img");avatar.className="nav-profile-visit-avatar";avatar.src=profile.avatar_url;avatar.alt="";avatar.loading="lazy";link.append(avatar);}
   else{const avatar=document.createElement("span");avatar.className="nav-profile-visit-avatar";avatar.style.display="grid";avatar.style.placeItems="center";avatar.textContent=name.slice(0,1).toUpperCase();link.append(avatar);}
   const copy=document.createElement("span");copy.className="nav-profile-visit-copy";
   const title=document.createElement("span");title.className="nav-profile-visit-name";title.textContent=name;
   const time=document.createElement("span");time.className="nav-profile-visit-time";time.textContent=row.last_visited_at?new Date(row.last_visited_at).toLocaleString("ru-RU",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"";
   copy.append(title,time);link.append(copy);host.append(link);
  });
 }catch(error){console.warn("FLOUSTREAM visit history:",error);}
}
window.addEventListener("pageshow",()=>{if(user&&client)loadProfileVisitHistory();},{signal});
function navigationHistoryKey(){return "dolby404-nav-history-"+(user?.id||"guest");}
function renderNavigationHistory(){
 const host=$("nav-history-items");if(!host)return;host.replaceChildren();
 let entries=[];try{entries=JSON.parse(localStorage.getItem(navigationHistoryKey())||"[]");if(!Array.isArray(entries))entries=[];}catch(_){}
 if(!entries.length){if(!$("nav-profile-visits")?.children.length){const empty=document.createElement("span");empty.className="nav-history-empty";empty.textContent=localStorage.getItem("dolby404-language")==="en"?"No recent places yet":"Пока пусто";host.append(empty);}return;}
 entries.slice(0,2).forEach(entry=>{const meta=navigationNames[entry.action]||[entry.label||"Раздел",entry.label||"Section",entry.icon||"•"];const b=document.createElement("button");b.type="button";b.className="nav-history-item";b.dataset.historyAction=entry.action;const icon=document.createElement("span");icon.className="side-drawer-icon";icon.textContent=meta[2];const label=document.createElement("span");label.textContent=localStorage.getItem("dolby404-language")==="en"?meta[1]:meta[0];b.append(icon,label);host.append(b);});
}
function recordNavigation(action,label,icon){
 let entries=[];try{entries=JSON.parse(localStorage.getItem(navigationHistoryKey())||"[]");if(!Array.isArray(entries))entries=[];}catch(_){}
 entries=entries.filter(item=>item.action!==action);entries.unshift({action,label:label||"",icon:icon||""});localStorage.setItem(navigationHistoryKey(),JSON.stringify(entries.slice(0,2)));renderNavigationHistory();
}

async function loadPrivacySettings(){
 const defaults={owner_id:user.id,video_album_visible:true,music_visible:true,comments_visible:true,feed_posts_visible:true};
 const saved=await client.from("profile_privacy_settings").upsert(defaults,{onConflict:"owner_id",ignoreDuplicates:true});
 if(saved.error)throw saved.error;
 const result=await client.from("profile_privacy_settings").select("*").eq("owner_id",user.id).single();
 if(result.error)throw result.error;
 const row=result.data;
  $("privacy-video-visible").checked=row.video_album_visible!==false;
 $("privacy-comments-visible").checked=row.comments_visible;
 $("privacy-feed-visible").checked=row.feed_posts_visible;
}
const privacyToggle=$("privacy-toggle");
const privacyPanel=$("privacy-panel");
function setPrivacyPanelOpen(open){
 privacyToggle.setAttribute("aria-expanded",String(open));
 privacyPanel.setAttribute("aria-hidden",String(!open));
 privacyPanel.classList.toggle("is-open",open);
 const inner=privacyPanel.querySelector(".privacy-panel-inner");
 if(inner)inner.inert=!open;
}
privacyToggle.addEventListener("click",()=>{
 setPrivacyPanelOpen(privacyToggle.getAttribute("aria-expanded")!=="true");
});
$("save-privacy-settings").addEventListener("click",async()=>{
 const button=$("save-privacy-settings");button.disabled=true;
 $("settings-status").textContent="Сохраняем настройки приватности…";
 try{
  const result=await client.from("profile_privacy_settings").upsert({
   owner_id:user.id,
    video_album_visible:$("privacy-video-visible").checked,
   music_visible:true,
   comments_visible:$("privacy-comments-visible").checked,
   feed_posts_visible:$("privacy-feed-visible").checked,
   updated_at:new Date().toISOString()
  },{onConflict:"owner_id"});
  if(result.error)throw result.error;
  $("settings-status").textContent="Настройки приватности сохранены.";
  setPrivacyPanelOpen(false);
 }catch(error){$("settings-status").textContent="Не удалось сохранить приватность: "+error.message;}
 finally{button.disabled=false;}
});
async function openMusicSection(){
 $("music-backdrop").hidden=false;
 $("music-status").textContent="";
 $("music-track-file").value="";
 await loadMusicTracks();
}
async function loadMusicTracks(){
 const host=$("music-track-list");host.replaceChildren();
 const empty=document.createElement("div");empty.className="album-empty";empty.textContent="Загружаем музыку…";host.append(empty);
 try{
  const result=await client.from("music_tracks").select("id,owner_id,title,object_path,visibility,created_at").eq("owner_id",user.id).order("created_at",{ascending:false});
  if(result.error)throw result.error;
  host.replaceChildren();
  if(!result.data?.length){const e=document.createElement("div");e.className="album-empty";e.textContent="Здесь пока нет треков. Добавь свою музыку!";host.append(e);return;}
  const playableTracks=[];
  for(const track of result.data){
   const bucket=track.visibility==="private"?"music-private":"music-public";
   const signed=track.visibility==="private"?await client.storage.from(bucket).createSignedUrl(track.object_path,3600):null;
   if(signed?.error)throw signed.error;
   const publicSigned=track.visibility==="public"?await client.storage.from(bucket).createSignedUrl(track.object_path,3600):null;if(publicSigned?.error)throw publicSigned.error;const url=track.visibility==="private"?signed.data.signedUrl:publicSigned.data.signedUrl;
   const card=document.createElement("article");card.className="music-track";
   const head=document.createElement("div");head.className="music-track-head";
   const title=document.createElement("strong");title.textContent=track.title;
   head.append(title);
   const listen=document.createElement("button");listen.type="button";listen.textContent="▶ Слушать";
   const queueIndex=playableTracks.length;playableTracks.push({id:track.id,title:track.title,url,visibility:track.visibility});
   listen.addEventListener("click",()=>window.FloustreamPlayer?.playQueue(playableTracks,queueIndex));
   const remove=document.createElement("button");remove.type="button";remove.textContent="Удалить";
   remove.addEventListener("click",()=>deleteMusicTrack(track,bucket,card));
   card.append(head,listen,remove);host.append(card);
  }
 }catch(error){host.replaceChildren();const e=document.createElement("div");e.className="album-empty";e.textContent="Не удалось загрузить музыку: "+error.message;host.append(e);}
}
async function deleteMusicTrack(track,bucket,card){
 if(!confirm("Удалить этот трек?"))return;
 try{
  const removed=await client.storage.from(bucket).remove([track.object_path]);if(removed.error)throw removed.error;
  const row=await client.from("music_tracks").delete().eq("id",track.id).eq("owner_id",user.id);if(row.error)throw row.error;
  card.remove();
  if(!$("music-track-list").children.length)await loadMusicTracks();
 }catch(error){$("music-status").textContent="Не удалось удалить трек: "+error.message;}
}
$("music-upload-button").addEventListener("click",async()=>{
 const file=$("music-track-file").files[0];
 if(!file){$("music-status").textContent="Сначала выбери аудиофайл.";return;}
 if(!file.type.startsWith("audio/")){$("music-status").textContent="Нужен аудиофайл.";return;}
 if(file.size>100*1024*1024){$("music-status").textContent="Максимальный размер файла — 100 МБ.";return;}
 const title=(file.name||"").replace(/\.[^.]+$/,"").trim()||"Аудиозапись";
 const visibility="public",bucket="music-public";
 const ext=(file.name.split(".").pop()||"audio").replace(/[^a-z0-9]/gi,"").toLowerCase()||"audio";
 const path=user.id+"/"+crypto.randomUUID()+"."+ext,button=$("music-upload-button");button.disabled=true;
 $("music-status").textContent="Загружаем трек…";
 try{
  const uploaded=await client.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type});if(uploaded.error)throw uploaded.error;
  const saved=await client.from("music_tracks").insert({owner_id:user.id,title,object_path:path,visibility});
  if(saved.error){await client.storage.from(bucket).remove([path]);throw saved.error;}
  $("music-track-file").value="";
  $("music-status").textContent="Трек добавлен.";
  await loadMusicTracks();
 }catch(error){$("music-status").textContent="Не удалось добавить трек: "+error.message;}
 finally{button.disabled=false;}
});
$("music-upload-toggle").addEventListener("click",()=>{
 const toggle=$("music-upload-toggle"),panel=$("music-upload-panel"),open=toggle.getAttribute("aria-expanded")!=="true";
 toggle.setAttribute("aria-expanded",String(open));panel.setAttribute("aria-hidden",String(!open));panel.classList.toggle("is-open",open);
});
$("music-close").addEventListener("click",()=>$("music-backdrop").hidden=true);
$("music-backdrop").addEventListener("click",e=>{if(e.target===$("music-backdrop"))$("music-backdrop").hidden=true;});


let videoAlbumControllerPromise = null;
let videoAlbumController = null;
let videoAlbumDisposed = false;
async function openProfileVideoAlbum() {
  if (videoAlbumDisposed) return;
  if (!videoAlbumControllerPromise) {
    videoAlbumControllerPromise = import("./profile/video-album.mjs").then(({ initProfileVideoAlbum }) => {
      if (videoAlbumDisposed) return null;
      videoAlbumController = initProfileVideoAlbum({
        getClient: () => client,
        getUser: () => user,
        $
      });
      return videoAlbumController;
    }).catch(error => {
      videoAlbumControllerPromise = null;
      console.error("FLOUSTREAM video album module:", error);
      throw error;
    });
  }
  const controller = await videoAlbumControllerPromise;
  if (controller) return controller.openVideoAlbum();
}

let photoAlbumControllerPromise = null;
let photoAlbumController = null;
let photoAlbumDisposed = false;
async function openProfilePhotoAlbum() {
  if (photoAlbumDisposed) return;
  if (!photoAlbumControllerPromise) {
    photoAlbumControllerPromise = import("./profile/photo-album.mjs").then(({ initProfilePhotoAlbum }) => {
      if (photoAlbumDisposed) return null;
      photoAlbumController = initProfilePhotoAlbum({
        getClient: () => client,
        getUser: () => user,
        getProfile: () => profile,
        $,
        signal
      });
      return photoAlbumController;
    }).catch(error => {
      photoAlbumControllerPromise = null;
      console.error("FLOUSTREAM photo album module:", error);
      throw error;
    });
  }
  const controller = await photoAlbumControllerPromise;
  if (controller) return controller.openPhotoAlbum();
}

async function openMessagesSection(){
 $("messages-backdrop").hidden=false;$("messages-list").hidden=false;$("messages-thread").hidden=true;$("messages-back").hidden=true;$("messages-title").textContent="Сообщения";
 await loadMessageConversations();
}
$("messages-close").addEventListener("click",()=>$("messages-backdrop").hidden=true);
$("messages-backdrop").addEventListener("click",e=>{if(e.target===$("messages-backdrop"))$("messages-backdrop").hidden=true;});
$("messages-back").addEventListener("click",()=>{activeMessageFriend=null;$("messages-list").hidden=false;$("messages-thread").hidden=true;$("messages-back").hidden=true;$("messages-title").textContent="Сообщения";});
async function loadMessageConversations(){
 const host=$("messages-list");host.replaceChildren();const loading=document.createElement("div");loading.className="album-empty";loading.textContent="Загружаем сообщения…";host.append(loading);
 try{
  const [sent,received]=await Promise.all([
   client.from("direct_messages").select("id,sender_id,recipient_id,content,attachment_path,attachment_name,attachment_mime,created_at").eq("sender_id",user.id).order("created_at",{ascending:false}),
   client.from("direct_messages").select("id,sender_id,recipient_id,content,attachment_path,attachment_name,attachment_mime,created_at").eq("recipient_id",user.id).order("created_at",{ascending:false})
  ]);
  if(sent.error)throw sent.error;if(received.error)throw received.error;
  const all=[...(sent.data||[]),...(received.data||[])].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const latest=new Map();all.forEach(m=>{const id=m.sender_id===user.id?m.recipient_id:m.sender_id;if(!latest.has(id))latest.set(id,m);});
  const ids=[...latest.keys()];host.replaceChildren();
  if(!ids.length){host.innerHTML='<div class="album-empty">Пока нет сообщений. Отправь фото другу из фотоальбома.</div>';return;}
  const prof=await client.from("profiles").select("id,username,display_name,avatar_url").in("id",ids);if(prof.error)throw prof.error;
  const byId=new Map((prof.data||[]).map(p=>[p.id,p]));
  for(const id of ids){
   const friend=byId.get(id)||{id,display_name:"Пользователь"};const last=latest.get(id);
   const btn=document.createElement("button");btn.type="button";btn.className="message-conversation";
   const avatar=document.createElement("span");avatar.className="album-share-avatar";
   if(friend.avatar_url){const img=document.createElement("img");img.src=friend.avatar_url;img.alt="";avatar.append(img);}else avatar.textContent=(friend.display_name||friend.username||"?").slice(0,1).toUpperCase();
   const details=document.createElement("span"),name=document.createElement("strong"),preview=document.createElement("small");
   name.textContent=friend.display_name||friend.username||"Пользователь";preview.textContent=last.attachment_path?"📷 Фото":(last.content||"Сообщение");details.append(name,preview);btn.append(avatar,details);
   btn.addEventListener("click",()=>openMessageThread(friend));host.append(btn);
  }
 }catch(error){host.replaceChildren();const e=document.createElement("div");e.className="album-empty";e.textContent="Не удалось загрузить сообщения: "+error.message;host.append(e);}
}
async function openMessageThread(friend){
 activeMessageFriend=friend;$("messages-title").textContent=friend.display_name||friend.username||"Переписка";$("messages-list").hidden=true;$("messages-thread").hidden=false;$("messages-back").hidden=false;
 const host=$("messages-thread");host.replaceChildren();const loading=document.createElement("div");loading.className="album-empty";loading.textContent="Загружаем переписку…";host.append(loading);
 try{
  const [sent,received]=await Promise.all([
   client.from("direct_messages").select("id,sender_id,recipient_id,content,attachment_path,attachment_name,created_at").eq("sender_id",user.id).eq("recipient_id",friend.id).order("created_at",{ascending:true}),
   client.from("direct_messages").select("id,sender_id,recipient_id,content,attachment_path,attachment_name,created_at").eq("sender_id",friend.id).eq("recipient_id",user.id).order("created_at",{ascending:true})
  ]);
  if(sent.error)throw sent.error;if(received.error)throw received.error;
  const all=[...(sent.data||[]),...(received.data||[])].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));host.replaceChildren();
  if(!all.length){host.innerHTML='<div class="album-empty">Пока нет сообщений.</div>';return;}
  for(const msg of all){
   const bubble=document.createElement("div");bubble.className="message-bubble"+(msg.sender_id===user.id?" mine":"");
   if(msg.content){const p=document.createElement("div");p.textContent=msg.content;bubble.append(p);}
   if(msg.attachment_path){const signed=await client.storage.from("message-media").createSignedUrl(msg.attachment_path,3600);
    if(!signed.error){const img=document.createElement("img");img.src=signed.data.signedUrl;img.alt=msg.attachment_name||"Отправленное фото";bubble.append(img);}
    else{const note=document.createElement("small");note.textContent="Фото недоступно";bubble.append(note);}
   }
   host.append(bubble);
  }
  host.scrollTop=host.scrollHeight;
 }catch(error){host.replaceChildren();const e=document.createElement("div");e.className="album-empty";e.textContent="Не удалось открыть переписку: "+error.message;host.append(e);}
}
function openNavigationDestination(action,label,icon){
 if(action==="profile"){$("cover").scrollIntoView({behavior:"smooth"});}
 else if(action==="feed"){$("feed-section").scrollIntoView({behavior:"smooth"});}
 else if(action==="settings"){openSettingsPanel();}
 else if(action==="author"){openAuthorHub();}
 else if(action==="photos"){openProfilePhotoAlbum();}
  else if(action==="video"){openProfileVideoAlbum();}
 else if(action==="music"){openMusicSection();} else if(action==="messages"){openMessagesSection();}
 else {const meta=navigationNames[action];const title=meta?(localStorage.getItem("dolby404-language")==="en"?meta[1]:meta[0]):(label||"Раздел");$("quick-status").textContent=(localStorage.getItem("dolby404-language")==="en"?"The section “":"Раздел «")+title+(localStorage.getItem("dolby404-language")==="en"?"” will be connected in a later stage.":"» подключим следующим этапом.");}
 recordNavigation(action,label,icon);
}

const dolbyOnlineUsers = new Set();
const dolbyLastSeenByUser = new Map();
const dolbyTimeZoneByUser = new Map();
let dolbyOnlineChannel = null;
let dolbyPresenceUserId = null;
let dolbyPresenceChannelReady = false;
let dolbyPresenceActive = false;
let dolbyLastActionAt = 0;
let dolbyLastPointerAt = 0;
let dolbyIdleTimer = null;
let dolbyActivityWriteTimer = null;
function dolbyCurrentTimeZone(){
 try{return Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC";}catch(_){return "UTC";}
}
function dolbyFormatLastSeen(userId){
 const value=dolbyLastSeenByUser.get(userId);
 if(!value)return "Время последнего визита пока неизвестно";
 const zone=dolbyTimeZoneByUser.get(userId)||dolbyCurrentTimeZone();
 try{return "Был(а) в сети: "+new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:zone}).format(new Date(value));}
 catch(_){return "Был(а) в сети: "+new Date(value).toLocaleString("ru-RU");}
}
function setDolbyLastSeen(userId,value,zone){
 if(value)dolbyLastSeenByUser.set(userId,value);
 if(zone)dolbyTimeZoneByUser.set(userId,zone);
 refreshDolbyOnlineIndicators();
}
function refreshDolbyOnlineIndicators(){
 root.querySelectorAll(".dolby-online-indicator[data-user-id]").forEach(dot=>{
  const active=dolbyOnlineUsers.has(dot.dataset.userId);
  const label=dot.parentElement?.querySelector(":scope > .dolby-online-last-seen[data-user-id=\""+dot.dataset.userId+"\"]");
  dot.classList.toggle("is-online",active);
  dot.hidden=!active;
  dot.title=active?"В сети":dolbyFormatLastSeen(dot.dataset.userId);
  dot.setAttribute("aria-label",active?"В сети":dolbyFormatLastSeen(dot.dataset.userId));
  if(label){label.hidden=active;label.textContent=active?"":dolbyFormatLastSeen(dot.dataset.userId);}
 });
}
function appendDolbyOnlineIndicator(element,userId){
 if(!element||!userId)return;
 element.querySelectorAll(":scope > .dolby-online-indicator,:scope > .dolby-online-last-seen").forEach(node=>node.remove());
 const dot=document.createElement("span");
 dot.className="dolby-online-indicator";
 dot.dataset.userId=userId;
 dot.setAttribute("role","img");
 dot.hidden=true;
 const label=document.createElement("span");
 label.className="dolby-online-last-seen";
 label.dataset.userId=userId;
 label.hidden=false;
 label.textContent=dolbyFormatLastSeen(userId);
 element.append(dot,label);
 refreshDolbyOnlineIndicators();
}
async function persistDolbyActivity(){
 if(!client||!dolbyPresenceUserId||!dolbyLastActionAt)return;
 const timestamp=new Date(dolbyLastActionAt).toISOString();
 const zone=dolbyCurrentTimeZone();
 const saved=await client.from("profiles").update({last_activity_at:timestamp,time_zone:zone}).eq("id",dolbyPresenceUserId).or("last_activity_at.is.null,last_activity_at.lte."+timestamp).select("last_activity_at,time_zone").maybeSingle();
 if(saved.error){console.warn("FLOUSTREAM activity timestamp:",saved.error);return;}
 if(saved.data)setDolbyLastSeen(dolbyPresenceUserId,saved.data.last_activity_at,saved.data.time_zone);
 else{
  const latest=await client.from("profiles").select("last_activity_at,time_zone").eq("id",dolbyPresenceUserId).maybeSingle();
  if(!latest.error&&latest.data)setDolbyLastSeen(dolbyPresenceUserId,latest.data.last_activity_at,latest.data.time_zone);
 }
}
function scheduleDolbyActivityWrite(){
 if(dolbyActivityWriteTimer)return;
 dolbyActivityWriteTimer=profileTimeout(async()=>{
  dolbyActivityWriteTimer=null;
  await persistDolbyActivity();
 },4000);
}
async function trackDolbyPresence(){
 if(!dolbyPresenceChannelReady||!dolbyOnlineChannel||dolbyPresenceActive)return;
 dolbyPresenceActive=true;
 dolbyOnlineUsers.add(dolbyPresenceUserId);
 refreshDolbyOnlineIndicators();
 const tracked=await dolbyOnlineChannel.track({userId:dolbyPresenceUserId,onlineAt:new Date().toISOString(),lastActivityAt:new Date(dolbyLastActionAt).toISOString()});
 if(tracked?.error){dolbyPresenceActive=false;dolbyOnlineUsers.delete(dolbyPresenceUserId);refreshDolbyOnlineIndicators();console.warn("FLOUSTREAM presence:",tracked.error);}
}
function scheduleDolbyIdleTimeout(){
 profileClearTimeout(dolbyIdleTimer);
 dolbyIdleTimer=profileTimeout(async()=>{
  await persistDolbyActivity();
  if(dolbyOnlineChannel&&dolbyPresenceActive)await dolbyOnlineChannel.untrack();
  dolbyPresenceActive=false;
  dolbyOnlineUsers.delete(dolbyPresenceUserId);
  refreshDolbyOnlineIndicators();
 },30*60*1000);
}
function recordDolbyActivity(){
 if(!dolbyPresenceUserId)return;
 dolbyLastActionAt=Date.now();
 setDolbyLastSeen(dolbyPresenceUserId,new Date(dolbyLastActionAt).toISOString(),dolbyCurrentTimeZone());
 scheduleDolbyIdleTimeout();
 scheduleDolbyActivityWrite();
 if(dolbyPresenceChannelReady&&!dolbyPresenceActive)trackDolbyPresence();
}
function startDolbyOnlinePresence(client,userId){
 if(!client||!userId||dolbyOnlineChannel)return;
 dolbyPresenceUserId=userId;
 dolbyLastActionAt=Date.now();
 const channel=client.channel("dolby404:online");
 channel.on("presence",{event:"sync"},()=>{
  dolbyOnlineUsers.clear();
  const state=channel.presenceState()||{};
  Object.values(state).forEach(entries=>(entries||[]).forEach(entry=>{
   if(entry?.userId)dolbyOnlineUsers.add(entry.userId);
  }));
  refreshDolbyOnlineIndicators();
 });
 dolbyOnlineChannel=channel;
 channel.subscribe(async status=>{
  if(status==="SUBSCRIBED"){
   dolbyPresenceChannelReady=true;
   await trackDolbyPresence();
   scheduleDolbyIdleTimeout();
   scheduleDolbyActivityWrite();
  }
 });
 const activityEvents=["pointerdown","keydown","touchstart","wheel","scroll","input","change","click"];
 activityEvents.forEach(type=>window.addEventListener(type,recordDolbyActivity,{passive:true,capture:true,signal}));
 window.addEventListener("pointermove",()=>{
  const now=Date.now();
  if(now-dolbyLastPointerAt<8000)return;
  dolbyLastPointerAt=now;
  recordDolbyActivity();
 },{passive:true,signal});
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")persistDolbyActivity();},{signal});
 window.addEventListener("pagehide",()=>{
  persistDolbyActivity();
  if(dolbyOnlineChannel)dolbyOnlineChannel.untrack();
  dolbyPresenceActive=false;
  dolbyOnlineUsers.delete(userId);
  refreshDolbyOnlineIndicators();
 },{once:true,signal});
 window.addEventListener("pageshow",()=>recordDolbyActivity(),{signal});
 recordDolbyActivity();
}

async function ensureAvatarOriginalInAlbum(){
 if(!profile?.avatar_url||profile.avatar_photo_id||!profile.avatar_url.includes("/storage/v1/object/public/avatars/"))return;
 const response=await fetch(profile.avatar_url,{cache:"no-store"});
 if(!response.ok)throw new Error("Не удалось получить исходный файл текущего аватара.");
 const blob=await response.blob();
 const mime=(blob.type||"").split(";")[0].toLowerCase();
 if(!["image/jpeg","image/png","image/webp"].includes(mime))return;
 if(blob.size>50*1024*1024)return;
 const ext=mime==="image/jpeg"?"jpg":mime.split("/")[1];
 const path=`${user.id}/avatar-original-migrated-${Date.now()}-${crypto.randomUUID()}.${ext}`;
 let uploaded=false,photoId=null;
 try{
  const upload=await client.storage.from("photo-albums").upload(path,blob,{upsert:false,contentType:mime});
  if(upload.error)throw upload.error;
  uploaded=true;
  const row=await client.from("photo_album_photos").insert({owner_id:user.id,object_path:path,file_name:"Оригинал фотографии профиля."+ext,mime_type:mime}).select("id").single();
  if(row.error)throw row.error;
  photoId=row.data.id;
  const saved=await client.from("profiles").update({avatar_photo_id:photoId}).eq("id",user.id).select("*").single();
  if(saved.error)throw saved.error;
  profile=saved.data;columns=Object.keys(profile);
 }catch(error){
  if(photoId)await client.from("photo_album_photos").delete().eq("id",photoId).eq("owner_id",user.id);
  if(uploaded)await client.storage.from("photo-albums").remove([path]);
  throw error;
 }
}

async function start(){
 try{
  client=await getSupabaseClient({signal});if(signal.aborted)return;
  const stored=await client.auth.getSession();if(signal.aborted)return;if(stored.error)throw stored.error;if(!stored.data?.session){navigate("portal.html?reauth=1");return;}const auth=await client.auth.getUser();if(signal.aborted)return;if(auth.error)throw auth.error;user=auth.data.user;
  if(!user){navigate("portal.html");return;}
  await ensureProfileScripts();if(signal.aborted)return;
  const lifecycleParams=new URLSearchParams(url.search);
  const lifecycleAction=lifecycleParams.has("confirm_delete")?"request_delete":(lifecycleParams.has("restore")?"restore":null);
  if(lifecycleAction){
   const lifecycle=await client.functions.invoke("account-lifecycle",{body:{action:lifecycleAction}});
   if(signal.aborted)return;
   if(lifecycle.error)throw lifecycle.error;
   if(lifecycleAction==="request_delete"){
    await client.auth.signOut();
    if(signal.aborted)return;
    navigate("portal.html?deletion_requested=1");
    return;
   }
   history.replaceState({},document.title,location.pathname);
   alert("Прежний аккаунт восстановлен. Добро пожаловать обратно в FLOUSTREAM!");
  }
  window.initFloustreamMessageNotifications?.(client,user.id,{signal,root});
  window.initFloustreamFriendNotifications?.(client,user.id,{signal,root});
  startDolbyOnlinePresence(client,user.id);
  loadProfileVisitHistory();
  const result=await client.from("profiles").select("*").eq("id",user.id).maybeSingle();
  if(signal.aborted)return;
  if(result.error)throw result.error;
  profile=result.data||{};columns=Object.keys(profile);if(profile.last_activity_at)setDolbyLastSeen(user.id,profile.last_activity_at,profile.time_zone);
  if(result.data&&!profile.avatar_photo_id){try{await ensureAvatarOriginalInAlbum();if(signal.aborted)return;}catch(error){if(signal.aborted)return;console.warn("FLOUSTREAM avatar original migration:",error);}}
  if(!columns.length){
    const probe=await client.from("profiles").select("*").limit(1);
    if(signal.aborted)return;
    if(probe.error)throw probe.error;
    columns=Object.keys(probe.data?.[0]||{});
  }
  render();
  recordNavigation("profile");
  initProfileFeed(client);
  if(!result.data){$("notice").hidden=false;$("notice").textContent="Профиль ещё не найден в таблице. Страница открыта, но для сохранения сначала нужно проверить структуру таблицы profiles.";}
 }catch(e){if(signal.aborted)return;$("display-name").textContent="Не удалось загрузить профиль";$("bio").textContent=e.message;$("notice").hidden=false;$("notice").textContent="Проверь подключение и настройки доступа к таблице profiles.";}
}
attachEmojiPicker($("post-text"));attachEmojiPicker($("bio-input"));
(function setupComposer(){
 const editor=$("publish-editor"),field=$("post-text"),dock=$("emoji-dock"),host=field.nextElementSibling;
 if(host&&host.classList.contains("emoji-picker"))dock.append(host);
 $("composer-back").addEventListener("click",()=>{editor.classList.remove("composer-fullscreen");field.blur();const panel=host&&host.querySelector(".emoji-picker-panel");if(panel)panel.hidden=true;});
 field.addEventListener("focus",()=>{if(!editor.hidden){editor.classList.add("composer-fullscreen");const panel=host&&host.querySelector(".emoji-picker-panel");if(panel)panel.hidden=true;const trigger=host&&host.querySelector(".emoji-picker-trigger");if(trigger)trigger.setAttribute("aria-expanded","false");}});
})();
$("open-profile-editor").addEventListener("click",()=>{closeSettings();$("editor").hidden=false;$("message").textContent="";$("editor").scrollIntoView({behavior:"smooth",block:"center"});});


function attachEmojiPicker(field){
 if(!field||field.dataset.emojiReady==="1")return;
 field.dataset.emojiReady="1";
 const categories=[
  {icon:"😎",name:"faces",items:"😀 😃 😄 😁 😆 😅 😂 🤣 🥲 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🫢 🫣 🤫 🤔 🫡 🤐 🤨 😐 😑 😶 🫥 😏 😒 🙄 😬 🤥 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🥳 🥸 😎 🤓 🧐 😕 🫤 😟 🙁 ☹️ 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 ☠️ 👻 👽 🤖 🎃"},
  {icon:"💜",name:"love",items:"❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 🩷 🩵 🩶 💔 ❤️‍🔥 ❤️‍🩹 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 💌 💋 💍 💎 🌹 🥀 🌷 🌸 🌺 🌻 🌼 🪷 💐 🫶 💑 💏"},
  {icon:"👋",name:"hands",items:"👋 🤚 🖐️ ✋ 🖖 🫱 🫲 🫳 🫴 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦾 🦿 🦵 🦶 👂 🦻 👃 🧠 👀 👁️ 👅 👄 🫦"},
  {icon:"🐈",name:"animals",items:"🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐻‍❄️ 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐒 🐔 🐧 🐦 🐤 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🪱 🦋 🐌 🐞 🐜 🪰 🪲 🕷️ 🦂 🐢 🐍 🦎 🦖 🦕 🐙 🦑 🦀 🦞 🦐 🐠 🐟 🐬 🐳 🦈 🐊 🦩 🦚 🦜 🦢 🦃 🦤 🦥 🦦 🦨 🦘 🦬 🐘 🦒 🦓 🦍 🦧 🐪 🐫 🦙 🐄 🐎 🐖 🐏 🐑 🦌 🐕 🐈 🐓"},
  {icon:"🌌",name:"nature",items:"🌍 🌎 🌏 🌕 🌖 🌗 🌘 🌑 🌒 🌓 🌔 🌙 🌚 🌛 🌜 🌞 ☀️ 🌤️ ⛅ 🌥️ 🌦️ 🌧️ ⛈️ 🌩️ 🌨️ ❄️ ☃️ ⛄ 🌬️ 💨 🌪️ 🌫️ 🌈 ☔ ⚡ 🔥 💧 🌊 🌫️ 🌲 🌳 🌴 🌵 🌱 🌿 ☘️ 🍀 🎋 🍃 🍂 🍁 🪴 🌾 🌻 🌼 🌷 🌹 🪻 🌺 🪷"},
  {icon:"🍕",name:"food",items:"🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🥑 🍆 🥔 🥕 🌽 🌶️ 🫑 🥒 🥬 🥦 🧄 🧅 🍄 🥜 🌰 🍞 🥐 🥖 🥨 🧀 🥚 🍳 🧈 🥞 🧇 🥓 🥩 🍗 🍖 🌭 🍔 🍟 🍕 🫓 🥪 🌮 🌯 🫔 🥙 🧆 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🍤 🍙 🍚 🍘 🍥 🥠 🍡 🍧 🍨 🍦 🥧 🧁 🍰 🎂 🍮 🍭 🍬 🍫 🍿 🍩 🍪 ☕ 🫖 🍵 🧃 🥤 🧋 🍺 🍻 🥂 🍷 🍸 🍹"},
  {icon:"⚽",name:"activity",items:"⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🎱 🏓 🏸 🏒 🏑 🥍 🏏 🥊 🥋 🥅 ⛳ ⛸️ 🎣 🤿 🎽 🎿 🛷 🥌 🎯 🪀 🪁 🎮 🕹️ 🎲 ♟️ 🧩 🎭 🎨 🧵 🪡 🧶 🎼 🎹 🥁 🪘 🎷 🎺 🎸 🪕 🎻 🪈 🎤 🎧 🎬 🎟️ 🎪 🎫 🏆 🥇 🥈 🥉 🏅"},
  {icon:"🚀",name:"travel",items:"🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚐 🛻 🚚 🚛 🚜 🛵 🏍️ 🚲 🛴 🛹 🛼 🚏 🛣️ 🛤️ 🚦 🚥 🚧 ⚓ ⛵ 🚤 🛳️ 🚢 ✈️ 🛩️ 🛫 🛬 🚁 🚟 🚠 🚡 🛰️ 🚀 🛸 🌠 🎇 🎆 🌃 🌆 🌇 🌉 🏙️ 🌄 🌅 🏖️ 🏝️ 🏜️ 🏕️ 🏟️ 🏛️ 🏰 🏯 🗼 🗽 🏠 🏡 🏢 🏬 🏭 🏥 🏦 🏫 🏩"},
  {icon:"🎧",name:"objects",items:"⌚ 📱 📲 💻 ⌨️ 🖥️ 🖨️ 🖱️ 🖲️ 💽 💾 💿 📀 🧮 🎥 📷 📸 📹 📼 🔍 🔎 💡 🔦 🕯️ 🪔 🧯 🛢️ 💸 💵 💴 💶 💷 💰 🪙 💳 🧾 💎 ⚖️ 🪜 🧰 🔧 🔨 ⚒️ 🛠️ ⛏️ 🔩 ⚙️ 🧲 🪛 🧪 🧫 🧬 🔬 🔭 📡 💊 🩹 🩺 🚪 🪞 🪟 🛏️ 🛋️ 🪑 🚽 🚿 🛁 🧴 🧷 🧹 🧺 🧻 🪣 🧼 🪥"},
  {icon:"⚡",name:"symbols",items:"✨ ⭐ 🌟 💫 ⚡ ☄️ 💥 🔥 🌈 ☀️ 🌙 ☁️ ❄️ 💧 💦 🫧 🎉 🎊 🎈 🎀 🪄 🧿 🔮 🪬 🕯️ 💯 💢 💨 💤 💬 🗯️ 💭 🗨️ 🖤 🩶 🤍 ❗ ❕ ❓ ❔ ⁉️ ‼️ ♻️ ⚠️ 🚫 ⛔ 🔞 ♠️ ♥️ ♦️ ♣️ 🃏 🎴 🔱 ⚜️ 🔰 ☢️ ☣️ 🆘 🆙 🆒 🆕 🆓 🆗 🆖 🆔 🔟 🔢 🔣 🔤 🔡 🔠"},
  {icon:"👾",name:"cyber",items:"👾 🤖 👽 🛸 💻 🖥️ 📟 📡 🔋 🪫 ⚙️ 🧬 🔬 🔭 💿 📀 💽 🕹️ 🎮 🧩 🌀 💠 🔷 🔹 🔶 🔸 🔺 🔻 🔲 🔳 ▪️ ◾ ◼️ ⬛ 🟪 🟣 🟦 🟩 🟨 🟥 🟧 ⬜ ⬜ 🔘 🔮 🪩 ✨ 💫 ⚡ 💥 🌐 🛰️ 🚀"},
  {icon:"D",name:"FLOUSTREAM",items:"◉_◉ ◉‿◉ ◉ᴗ◉ ◉益◉ ◉皿◉ ◉_• ◉‿• •_• x_x X_X O_O 0_0 >_< ^_^ T_T D404 404 ⟡ ⟢ ⟣ ◈ ◆ ◇ ▣ ▤ ▥ ⌁ ⌬ ⛭ ⛧ ⚡"}
 ];
 const host=document.createElement("div");host.className="emoji-picker";
 const trigger=document.createElement("button");trigger.type="button";trigger.className="emoji-picker-trigger";trigger.textContent="☺";trigger.setAttribute("aria-label","Открыть смайлы FLOUSTREAM");trigger.setAttribute("aria-expanded","false");
 const panel=document.createElement("div");panel.className="emoji-picker-panel";panel.hidden=true;
 const tabs=document.createElement("div");tabs.className="emoji-category-tabs";tabs.setAttribute("role","group");tabs.setAttribute("aria-label","Категории смайлов");
 const grid=document.createElement("div");grid.className="emoji-grid";
 let active=0;
 function renderCategory(index){
  active=index;tabs.querySelectorAll("button").forEach((b,i)=>b.setAttribute("aria-pressed",String(i===index)));
  grid.replaceChildren();
  categories[index].items.split(/\s+/).filter(Boolean).forEach(symbol=>{
   const item=document.createElement("button");item.type="button";item.className="emoji-item";item.textContent=symbol;item.setAttribute("aria-label",symbol);item.addEventListener("click",()=>{
    const start=field.dataset.emojiStart!==undefined?Number(field.dataset.emojiStart):(field.selectionStart??field.value.length);
    const end=field.dataset.emojiEnd!==undefined?Number(field.dataset.emojiEnd):start;
    const value=field.value;field.value=value.slice(0,start)+symbol+value.slice(end);
    const cursor=start+symbol.length;field.dataset.emojiStart=String(cursor);field.dataset.emojiEnd=String(cursor);
    field.dispatchEvent(new Event("input",{bubbles:true}));
   });grid.append(item);
  });
 }
 categories.forEach((category,index)=>{
  const tab=document.createElement("button");tab.type="button";tab.className="emoji-category-tab";tab.textContent=category.icon;tab.setAttribute("aria-label","Категория "+(index+1));tab.setAttribute("aria-pressed",String(index===0));tab.addEventListener("click",()=>renderCategory(index));tabs.append(tab);
 });
 panel.append(tabs,grid);host.append(trigger,panel);field.insertAdjacentElement("afterend",host);
 field.addEventListener("click",()=>{field.dataset.emojiStart=String(field.selectionStart??field.value.length);field.dataset.emojiEnd=String(field.selectionEnd??field.selectionStart??field.value.length);panel.hidden=true;trigger.setAttribute("aria-expanded","false");});
 field.addEventListener("keyup",()=>{field.dataset.emojiStart=String(field.selectionStart??field.value.length);field.dataset.emojiEnd=String(field.selectionEnd??field.value.length);});
 field.addEventListener("input",()=>{field.dataset.emojiStart=String(field.selectionStart??field.value.length);field.dataset.emojiEnd=String(field.selectionEnd??field.value.length);});
 field.addEventListener("select",()=>{field.dataset.emojiStart=String(field.selectionStart??field.value.length);field.dataset.emojiEnd=String(field.selectionEnd??field.value.length);});
 trigger.addEventListener("click",e=>{e.preventDefault();field.dataset.emojiStart=String(field.selectionStart??field.dataset.emojiStart??field.value.length);field.dataset.emojiEnd=String(field.selectionEnd??field.dataset.emojiEnd??field.value.length);field.blur();panel.hidden=!panel.hidden;trigger.setAttribute("aria-expanded",String(!panel.hidden));if(!panel.hidden)renderCategory(active);});

 field.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden){panel.hidden=true;trigger.setAttribute("aria-expanded","false");}});
}

function renderFormattedText(target,value){
 const pattern=/\[c=(#[0-9a-fA-F]{6})\]([\s\S]*?)\[\/c\]/g;let last=0,match;const source=String(value||"");
 while((match=pattern.exec(source))){if(match.index>last)target.append(document.createTextNode(source.slice(last,match.index)));const span=document.createElement("span");span.style.color=match[1];span.textContent=match[2];target.append(span);last=pattern.lastIndex;}
 if(last<source.length)target.append(document.createTextNode(source.slice(last)));
}
function moscowInputToIso(value){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value||""))return null;
 const date=new Date(value+":00+03:00");
 return Number.isNaN(date.getTime())?null:date.toISOString();
}
function moscowInputValue(value){
 const date=value instanceof Date?value:new Date(value);
 if(Number.isNaN(date.getTime()))return "";
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Moscow",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date);
 const part=k=>parts.find(x=>x.type===k)?.value||"";
 return part("year")+"-"+part("month")+"-"+part("day")+"T"+part("hour")+":"+part("minute");
}
function moscowDateText(value){
 if(!value)return "";
 const date=new Date(value);
 return Number.isNaN(date.getTime())?"":new Intl.DateTimeFormat("ru-RU",{timeZone:"Europe/Moscow",day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(date)+" · Москва";
}
function postFileType(file){
 return file.type.startsWith("image/")?"photo":file.type.startsWith("audio/")?"music":file.type.startsWith("video/")?"video":null;
}

async function initProfileFeed(client){
 const list=$("feed-list"),loading=$("feed-loading"),empty=$("feed-empty"),errorBox=$("feed-error"),sentinel=$("feed-sentinel");
 const seen=new Set();let offset=0,flowOffset=0,busy=false,done=false,postsDone=false,flowsDone=false,feedAuthorIds=null;
 const batchSize=10;
 function safeUrl(value){if(!value)return "";try{const u=new URL(value,location.href);return ["http:","https:"].includes(u.protocol)?u.href:"";}catch(_){return "";}}
 function dateText(value){if(!value)return "";const d=new Date(value);return Number.isNaN(d.getTime())?"":d.toLocaleString("ru-RU",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});}
 function makeMiniAudio(audio,photo){
  const bar=document.createElement("div");bar.className="mini-audio-bar";
  const play=document.createElement("button");play.type="button";play.className="mini-audio-play";play.textContent="▶";play.setAttribute("aria-label","Воспроизвести");
  const progress=document.createElement("input");progress.type="range";progress.className="mini-audio-progress";progress.min="0";progress.max="1000";progress.value="0";progress.setAttribute("aria-label","Позиция аудио");
  const time=document.createElement("span");time.className="mini-audio-time";time.textContent="0:00 / 0:00";
  const fmt=value=>{if(!Number.isFinite(value)||value<0)return "0:00";const m=Math.floor(value/60),sec=Math.floor(value%60);return m+":"+String(sec).padStart(2,"0");};
  const sync=()=>{const duration=audio.duration||0;progress.value=duration?String(Math.round(audio.currentTime/duration*1000)):"0";time.textContent=fmt(audio.currentTime)+" / "+fmt(duration);};
  const applyPhotoColor=()=>{
   if(!photo||!photo.naturalWidth||!photo.naturalHeight)return;
   try{
    const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});
    const w=28,h=Math.max(1,Math.round(28*photo.naturalHeight/photo.naturalWidth));
    canvas.width=w;canvas.height=Math.min(28,h);ctx.drawImage(photo,0,0,canvas.width,canvas.height);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data,bins=new Map();
    for(let i=0;i<pixels.length;i+=16){
     const a=pixels[i+3];if(a<180)continue;
     const r=pixels[i],g=pixels[i+1],b=pixels[i+2],max=Math.max(r,g,b),min=Math.min(r,g,b);
     if(max<35||max-min<16)continue;
     const key=[r>>5,g>>5,b>>5].join(",");
     const item=bins.get(key)||{count:0,r:0,g:0,b:0};
     item.count++;item.r+=r;item.g+=g;item.b+=b;bins.set(key,item);
    }
    let best=null,bestScore=-1;
    for(const item of bins.values()){
     const r=item.r/item.count,g=item.g/item.count,b=item.b/item.count;
     const saturation=Math.max(r,g,b)-Math.min(r,g,b);
     const score=item.count*(.65+saturation/255);
     if(score>bestScore){bestScore=score;best={r:Math.round(r),g:Math.round(g),b:Math.round(b)};}
    }
    if(best){
     bar.style.setProperty("--player-rgb",best.r+","+best.g+","+best.b);
     bar.style.setProperty("--player-accent",Math.round(best.r*.72+255*.28)+","+Math.round(best.g*.72+255*.28)+","+Math.round(best.b*.72+255*.28));
    }
   }catch(e){/* Если браузер запрещает чтение изображения, остаётся базовый фиолетовый стиль. */}
  };
  play.addEventListener("click",async()=>{if(audio.paused){try{await audio.play();}catch(e){time.textContent="Ошибка";}}else audio.pause();});
  audio.addEventListener("play",()=>{play.textContent="Ⅱ";play.setAttribute("aria-label","Пауза");});
  audio.addEventListener("pause",()=>{play.textContent="▶";play.setAttribute("aria-label","Воспроизвести");});
  audio.addEventListener("ended",()=>{play.textContent="▶";play.setAttribute("aria-label","Воспроизвести");});
  audio.addEventListener("timeupdate",sync);audio.addEventListener("loadedmetadata",sync);audio.addEventListener("durationchange",sync);
  progress.addEventListener("input",()=>{if(audio.duration)audio.currentTime=Number(progress.value)/1000*audio.duration;});
  bar.append(play,progress,time);
  if(photo){
   const wrap=document.createElement("div");wrap.className="post-photo-wrap";photo.parentNode.insertBefore(wrap,photo);wrap.append(photo,bar);
   photo.addEventListener("load",applyPhotoColor,{once:true});if(photo.complete)applyPhotoColor();
  }else{const wrap=document.createElement("div");wrap.className="mini-audio-standalone";audio.parentNode.insertBefore(wrap,audio);wrap.append(bar);}
  audio.preload="metadata";audio.style.display="none";sync();
 }
 function openPostPhotoView(url){
 const viewer=$("post-photo-viewer"),image=$("post-photo-view-image");
 if(!viewer||!image)return;
 image.src=url;viewer.hidden=false;document.body.style.overflow="hidden";
}
function closePostPhotoView(){
 const viewer=$("post-photo-viewer"),image=$("post-photo-view-image");
 if(!viewer||viewer.hidden)return;
 viewer.hidden=true;image.removeAttribute("src");document.body.style.overflow="";
}
$("close-post-photo").addEventListener("click",closePostPhotoView);
$("post-photo-viewer").addEventListener("click",e=>{if(e.target===$("post-photo-viewer"))closePostPhotoView();});
let postPhotoSwipeStart=null;
$("post-photo-viewer").addEventListener("pointerdown",e=>{
 if(e.pointerType==="mouse")return;
 postPhotoSwipeStart={x:e.clientX,y:e.clientY,id:e.pointerId};
 try{$("post-photo-viewer").setPointerCapture(e.pointerId);}catch(_){}
});
$("post-photo-viewer").addEventListener("pointerup",e=>{
 if(!postPhotoSwipeStart||postPhotoSwipeStart.id!==e.pointerId){postPhotoSwipeStart=null;return;}
 const dx=e.clientX-postPhotoSwipeStart.x,dy=e.clientY-postPhotoSwipeStart.y;
 postPhotoSwipeStart=null;
 if(Math.abs(dy)>60&&Math.abs(dy)>Math.abs(dx)*1.15)closePostPhotoView();
});
$("post-photo-viewer").addEventListener("pointercancel",()=>{postPhotoSwipeStart=null;});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closePostPhotoView();},{signal});


async function attachPostActions(post,card){
 const bar=document.createElement("div");bar.className="post-social-actions";
 const reactionWrap=document.createElement("div");reactionWrap.className="post-reaction-wrap";
 const reactionToggle=document.createElement("button");reactionToggle.type="button";reactionToggle.className="post-social-button";reactionToggle.classList.add("post-reaction-toggle");reactionToggle.textContent="＋ 0";reactionToggle.setAttribute("aria-label","Выбрать реакцию");reactionToggle.setAttribute("aria-expanded","false");
 const reactionPanel=document.createElement("div");reactionPanel.className="post-reaction-picker";reactionPanel.hidden=true;
 const reactionNote=document.createElement("div");reactionNote.className="post-comment-note";reactionNote.setAttribute("aria-live","polite");
 const reactionOptions=[
  {key:"fire",emoji:"🔥",name:"Огонь"},
  {key:"love",emoji:"❤️",name:"Любовь"},
  {key:"lol",emoji:"😂",name:"Смешно"},
  {key:"cool",emoji:"😎",name:"Круто"},
  {key:"mind",emoji:"🤯",name:"Взрыв"},
  {key:"sad",emoji:"😢",name:"Грустно"},
  {key:"rock",emoji:"🤘",name:"Рок"},
  {key:"respect",emoji:"👏",name:"Респект"},
  {key:"wow",emoji:"⚡",name:"Вау"},
  {key:"dark",emoji:"🖤",name:"Dark"},
  {key:"eyes",emoji:"👀",name:"Смотрю"},
  {key:"diamond",emoji:"💎",name:"Бриллиант"}
 ];
 const optionButtons={};
 for(const item of reactionOptions){
  const option=document.createElement("button");option.type="button";option.className="post-reaction-option";option.dataset.reaction=item.key;option.setAttribute("aria-label",item.name);option.title=item.name;
  const emoji=document.createElement("span");emoji.className="reaction-emoji";emoji.textContent=item.emoji;
  const count=document.createElement("span");count.className="reaction-count";count.textContent="0";
  option.append(emoji,count);reactionPanel.append(option);optionButtons[item.key]={button:option,count};
 }
 
function playReactionFlight(emoji,source){
 if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
 const from=source.getBoundingClientRect(),to=reactionToggle.getBoundingClientRect();
 const startX=from.left+from.width/2-15,startY=from.top+from.height/2-15;
 const endX=to.left+to.width/2-15,endY=to.top+to.height/2-15;
 const dx=endX-startX,dy=endY-startY;
 const flyer=document.createElement("span");flyer.className="reaction-flight";flyer.textContent=emoji;
 flyer.style.transform="translate("+startX+"px,"+startY+"px) scale(.35)";
 root.append(flyer);
 flyer.animate([
  {transform:"translate("+startX+"px,"+startY+"px) scale(.35) rotate(-12deg)",opacity:0,offset:0},
  {transform:"translate("+startX+"px,"+startY+"px) scale(1.05) rotate(0deg)",opacity:1,offset:.12},
  {transform:"translate("+(startX-4)+"px,"+(startY-12)+"px) scale(2.25) rotate(-9deg)",opacity:1,offset:.27},
  {transform:"translate("+(startX+5)+"px,"+(startY-8)+"px) scale(1.72) rotate(8deg)",opacity:1,offset:.39},
  {transform:"translate("+(startX+dx*.42)+"px,"+(startY+dy*.42-72)+"px) scale(1.28) rotate(-7deg)",opacity:1,offset:.66},
  {transform:"translate("+(startX+dx*.78)+"px,"+(startY+dy*.78-24)+"px) scale(.9) rotate(5deg)",opacity:1,offset:.88},
  {transform:"translate("+endX+"px,"+endY+"px) scale(.42) rotate(0deg)",opacity:0,offset:1}
 ],{duration:880,easing:"cubic-bezier(.2,.72,.22,1)",fill:"forwards"}).onfinish=()=>flyer.remove();
 reactionToggle.classList.remove("reaction-button-pulse","post-reaction-impact");
 void reactionToggle.offsetWidth;
 reactionToggle.classList.add("reaction-button-pulse","post-reaction-impact");
 profileTimeout(()=>reactionToggle.classList.remove("reaction-button-pulse","post-reaction-impact"),700);
 for(let n=0;n<10;n++){
  const spark=document.createElement("i");spark.className="reaction-spark";
  spark.style.left=(endX+15)+"px";spark.style.top=(endY+15)+"px";root.append(spark);
  const angle=(Math.PI*2*n)/10, distance=24+(n%3)*9;
  spark.animate([
   {transform:"translate(0,0) scale(.45)",opacity:1},
   {transform:"translate("+Math.cos(angle)*distance+"px,"+Math.sin(angle)*distance+"px) scale(0)",opacity:0}
  ],{duration:520,easing:"cubic-bezier(.16,.8,.3,1)",fill:"forwards"}).onfinish=()=>spark.remove();
 }
}
reactionWrap.append(reactionToggle,reactionPanel);
 const like=document.createElement("button");like.type="button";like.className="post-social-button";like.textContent="♡ 0";
 const commentToggle=document.createElement("button");commentToggle.type="button";commentToggle.className="post-social-button";commentToggle.textContent="💬 0";
 const repost=document.createElement("button");repost.type="button";repost.className="post-social-button repost-flow";repost.setAttribute("aria-label","Сделать репост");repost.title="Репост Floustream";repost.innerHTML='<span class="flow-label">FLOW</span><span class="flow-count">0</span>';
 const panel=document.createElement("section");panel.className="post-comments-panel";panel.hidden=true;
 const commentsHeader=document.createElement("div");commentsHeader.className="post-comments-header";
 const commentsTitle=document.createElement("span");commentsTitle.textContent="Комментарии";
 const commentsClose=document.createElement("button");commentsClose.type="button";commentsClose.className="post-comments-close";commentsClose.textContent="Свернуть";commentsClose.setAttribute("aria-label","Свернуть комментарии");
 commentsHeader.append(commentsTitle,commentsClose);
 const list=document.createElement("div");list.className="post-comments-list";
 const form=document.createElement("form");form.className="post-comment-form";
 const input=document.createElement("textarea");input.maxLength=2000;input.rows=2;input.placeholder="Написать комментарий…";
 const send=document.createElement("button");send.type="submit";send.className="primary";send.textContent="Отправить";
 const note=document.createElement("div");note.className="post-comment-note";
 form.append(input,send);panel.append(commentsHeader,list,form,note);bar.append(reactionWrap,like,commentToggle,repost);card.append(bar,reactionNote,panel);
 commentToggle.setAttribute("aria-expanded","false");
 commentsClose.addEventListener("click",()=>{panel.hidden=true;commentToggle.setAttribute("aria-expanded","false");});
 let liked=false,reposted=false,ownReaction=null;
 async function refreshCounts(){
  const [likes,ownLike,comments,reposts,ownRepost,reactions,ownReactionResult]=await Promise.all([
   client.from("likes").select("id",{count:"exact",head:true}).eq("post_id",post.id),
   client.from("likes").select("id").eq("post_id",post.id).eq("user_id",user.id).maybeSingle(),
   client.from("comments").select("id",{count:"exact",head:true}).eq("post_id",post.id),
   client.from("reposts").select("id",{count:"exact",head:true}).eq("post_id",post.id),
   client.from("reposts").select("id").eq("post_id",post.id).eq("user_id",user.id).maybeSingle(),
   client.from("post_reactions").select("reaction_key").eq("post_id",post.id),
   client.from("post_reactions").select("id,reaction_key").eq("post_id",post.id).eq("user_id",user.id).maybeSingle()
  ]);
  if(likes.error||comments.error||reposts.error||reactions.error||ownReactionResult.error){reactionNote.textContent="Не удалось загрузить взаимодействия публикации.";return;}
  liked=!!ownLike.data;reposted=!!ownRepost.data;ownReaction=ownReactionResult.data||null;
  like.textContent=(liked?"♥ ":"♡ ")+(likes.count||0);like.classList.toggle("is-active",liked);
  commentToggle.textContent="💬 "+(comments.count||0);
  repost.querySelector(".flow-count").textContent=String(reposts.count||0);repost.classList.toggle("is-active",reposted);repost.setAttribute("aria-label",reposted?"Отменить репост":"Сделать репост");repost.title=reposted?"Вы уже сделали репост — нажмите, чтобы отменить":"Репост Floustream";
  const counts={};for(const row of reactions.data||[])counts[row.reaction_key]=(counts[row.reaction_key]||0)+1;
  let total=0;for(const key of Object.keys(counts))total+=counts[key];
  const selected=reactionOptions.find(item=>item.key===ownReaction?.reaction_key);
  reactionToggle.textContent=(selected?selected.emoji:"＋")+" "+total;
  reactionToggle.classList.toggle("is-active",!!selected);
  reactionToggle.setAttribute("aria-label",selected?"Твоя реакция: "+selected.name+". Изменить реакцию":"Выбрать реакцию");
  for(const item of reactionOptions){
   const option=optionButtons[item.key];option.count.textContent=String(counts[item.key]||0);option.button.classList.toggle("is-active",ownReaction?.reaction_key===item.key);
   option.button.setAttribute("aria-pressed",String(ownReaction?.reaction_key===item.key));
  }
 }
 reactionToggle.addEventListener("click",()=>{reactionPanel.hidden=!reactionPanel.hidden;reactionToggle.setAttribute("aria-expanded",String(!reactionPanel.hidden));});
 document.addEventListener("click",event=>{if(!reactionWrap.contains(event.target)&&!reactionPanel.hidden){reactionPanel.hidden=true;reactionToggle.setAttribute("aria-expanded","false");}},{signal});
 for(const item of reactionOptions){
  optionButtons[item.key].button.addEventListener("click",async()=>{
   const previousReaction=ownReaction?.reaction_key;
   const isRemoving=previousReaction===item.key;
   for(const option of Object.values(optionButtons))option.button.disabled=true;
   reactionNote.textContent="";
   let result;
   if(ownReaction?.reaction_key===item.key){
    result=await client.from("post_reactions").delete().eq("post_id",post.id).eq("user_id",user.id);
   }else if(ownReaction){
    result=await client.from("post_reactions").update({reaction_key:item.key,updated_at:new Date().toISOString()}).eq("post_id",post.id).eq("user_id",user.id);
   }else{
    result=await client.from("post_reactions").insert({post_id:post.id,user_id:user.id,reaction_key:item.key});
   }
   if(result.error)reactionNote.textContent="Не удалось изменить реакцию: "+result.error.message;
   else{if(!isRemoving)playReactionFlight(item.emoji,optionButtons[item.key].button);reactionPanel.hidden=true;reactionToggle.setAttribute("aria-expanded","false");}
   await refreshCounts();
   for(const option of Object.values(optionButtons))option.button.disabled=false;
  });
 }
 like.addEventListener("click",async()=>{
  like.disabled=true;note.textContent="";
  const result=liked?await client.from("likes").delete().eq("post_id",post.id).eq("user_id",user.id):await client.from("likes").insert({post_id:post.id,user_id:user.id});
  if(result.error)note.textContent="Не удалось изменить лайк: "+result.error.message;
  await refreshCounts();like.disabled=false;
 });
 repost.addEventListener("click",async()=>{
  repost.disabled=true;note.textContent="";const wasReposted=reposted;
  const result=wasReposted?await client.from("reposts").delete().eq("post_id",post.id).eq("user_id",user.id):await client.from("reposts").insert({post_id:post.id,user_id:user.id});
  if(result.error)note.textContent="Не удалось изменить FLOW: "+result.error.message;
  else{
   let attribution=card.querySelector(".post-flow-attribution");
   if(!wasReposted){if(!attribution){attribution=document.createElement("div");attribution.className="post-flow-attribution";}const flowName=profile.display_name||profile.username||profile.name||"Пользователь";attribution.textContent="FLOW · "+flowName+" · "+dateText(new Date().toISOString());card.prepend(attribution);const feed=$("feed-list");if(feed&&card.parentElement===feed)feed.prepend(card);}
   else if(attribution)attribution.remove();
   note.textContent=wasReposted?"FLOW отменён.":"Публикация добавлена в твои публикации через FLOW.";
  }
  await refreshCounts();repost.disabled=false;
 });
 async function loadComments(){
  list.replaceChildren();const loading=document.createElement("div");loading.className="post-comment-note";loading.textContent="Загружаем комментарии…";list.append(loading);
  const result=await client.from("comments").select("id,user_id,content,created_at").eq("post_id",post.id).order("created_at",{ascending:true}).limit(100);
  if(result.error){loading.textContent="Не удалось загрузить комментарии: "+result.error.message;return;}
  list.replaceChildren();const ids=[...new Set((result.data||[]).map(x=>x.user_id).filter(Boolean))];let profiles={};
  if(ids.length){const p=await client.from("profiles").select("id,username,display_name,last_activity_at,time_zone").in("id",ids);if(!p.error)for(const item of p.data||[]){profiles[item.id]=item;setDolbyLastSeen(item.id,item.last_activity_at,item.time_zone);}}
  if(!result.data?.length){const empty=document.createElement("div");empty.className="post-comment-note";empty.textContent="Пока нет комментариев. Будь первым!";list.append(empty);return;}
  for(const item of result.data){
   const row=document.createElement("article");row.className="post-comment";const author=document.createElement("strong");const p=profiles[item.user_id]||{};author.textContent=p.display_name||p.username||"Пользователь";appendDolbyOnlineIndicator(author,item.user_id);
   const body=document.createElement("div");body.textContent=item.content;const time=document.createElement("time");time.textContent=new Date(item.created_at).toLocaleString("ru-RU",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
   row.append(author,body,time);list.append(row);
  }
 }
 commentToggle.addEventListener("click",async()=>{
  reactionPanel.hidden=true;reactionToggle.setAttribute("aria-expanded","false");
  panel.hidden=!panel.hidden;commentToggle.setAttribute("aria-expanded",String(!panel.hidden));
  if(!panel.hidden){await loadComments();input.focus();}
 });
 form.addEventListener("submit",async event=>{
  event.preventDefault();const content=input.value.trim();if(!content)return;
  send.disabled=true;note.textContent="Отправляем…";const result=await client.from("comments").insert({post_id:post.id,user_id:user.id,content});
  if(result.error){note.textContent="Не удалось отправить комментарий: "+result.error.message;send.disabled=false;return;}
  input.value="";note.textContent="Комментарий добавлен.";await loadComments();await refreshCounts();send.disabled=false;
 });
 refreshCounts();
}
function renderPost(post,profiles,flowMeta=null){
  const profile=profiles[post.user_id]||{},author=profile.name||profile.display_name||profile.full_name||profile.username||"Пользователь";
  const card=document.createElement("article");card.className="post";
  const head=document.createElement("div");head.className="post-head";
  const avatar=document.createElement("div");avatar.className="post-avatar";const avatarUrl=safeUrl(profile.avatar_url||profile.avatar);
  if(avatarUrl){const img=document.createElement("img");img.src=avatarUrl;img.alt="";img.loading="lazy";avatar.appendChild(img);}else avatar.textContent=(String(author).trim()[0]||"◉").toUpperCase();
  const identity=document.createElement("div");const name=document.createElement("div");name.className="post-author";name.textContent=author;appendDolbyOnlineIndicator(name,post.user_id);
  if(flowMeta){const authorLabel=document.createElement("div");authorLabel.className="post-author-label";authorLabel.textContent="Автор оригинала";identity.append(authorLabel);}
  const date=document.createElement("div");date.className="post-date";date.textContent=dateText(post.created_at);identity.append(name,date);head.append(avatar,identity);
  if(post.user_id===user.id){const tools=document.createElement("div");tools.className="post-owner-tools";const edit=document.createElement("button");edit.type="button";edit.className="post-edit-button";edit.textContent="✎";edit.addEventListener("click",()=>startEditPost(post,card));tools.append(edit);head.append(tools);}
  if(flowMeta){const flowProfile=profiles[flowMeta.user_id]||{};const flowName=flowProfile.display_name||flowProfile.username||flowProfile.name||"Пользователь";const attribution=document.createElement("div");attribution.className="post-flow-attribution";attribution.textContent="FLOW · "+flowName+(flowMeta.created_at?" · "+dateText(flowMeta.created_at):"");card.append(attribution);}
  card.append(head);
  if(post.content){const content=document.createElement("div");content.className="post-content";renderFormattedText(content,post.content);card.append(content);}
  const mediaItems=Array.isArray(post.media)&&post.media.length?post.media:(post.image_url?[{type:"photo",url:post.image_url,name:"Фото"}]:[]);
  if(mediaItems.length){const mediaBox=document.createElement("div");mediaBox.className="post-media";let firstPhoto=null,firstAudio=null;for(const item of mediaItems){const url=safeUrl(item.url);if(!url)continue;let node;if(item.type==="photo"){node=document.createElement("img");node.alt="Фото публикации";node.loading="lazy";node.decoding="async";if(!firstPhoto)firstPhoto=node;}else if(item.type==="music"){node=document.createElement("audio");node.controls=true;if(!firstAudio)firstAudio=node;}else{node=document.createElement("video");node.controls=true;node.playsInline=true;node.preload="metadata";}if(node.tagName==="IMG")node.crossOrigin="anonymous";node.src=url;
    if(node.tagName==="IMG")node.addEventListener("click",()=>openPostPhotoView(url));
    mediaBox.appendChild(node);}if(firstAudio)makeMiniAudio(firstAudio,firstPhoto);if(mediaBox.children.length)card.append(mediaBox);}
  attachPostActions(post,card);
  return card;
 }
 function startEditPost(post,card){
  if(post.user_id!==user.id)return;
  if(card.querySelector(".post-edit-panel"))return;
  const originalMedia=Array.isArray(post.media)&&post.media.length?post.media.slice():(post.image_url?[{type:"photo",url:post.image_url,name:"Фото"}]:[]);
  const panel=document.createElement("div");panel.className="post-edit-panel";
  const label=document.createElement("label");label.textContent="Текст публикации";
  const textarea=document.createElement("textarea");textarea.maxLength=5000;textarea.value=post.content||"";label.append(textarea);panel.append(label);attachEmojiPicker(textarea);
  const mediaTitle=document.createElement("div");mediaTitle.className="post-edit-label";mediaTitle.textContent="Прикреплённые файлы — отметь, что убрать";panel.append(mediaTitle);
  const rows=[];
  originalMedia.forEach((item,index)=>{
   const row=document.createElement("label");row.className="post-edit-media-row";
   const name=document.createElement("span");name.textContent=(item.name||({photo:"Фото",video:"Видео",music:"Музыка"}[item.type]||"Файл"))+" · "+(index+1);
   const remove=document.createElement("input");remove.type="checkbox";remove.setAttribute("aria-label","Убрать файл "+(index+1));
   row.append(name,remove);panel.append(row);rows.push({item,remove});
  });
  const fileLabel=document.createElement("label");fileLabel.textContent="Добавить фото, видео или музыку";
  const fileInput=document.createElement("input");fileInput.type="file";fileInput.accept="image/*,video/*,audio/*";fileInput.multiple=true;fileLabel.append(fileInput);panel.append(fileLabel);
  const status=document.createElement("div");status.className="post-edit-status";status.setAttribute("aria-live","polite");panel.append(status);
  const actions=document.createElement("div");actions.className="actions";
  const save=document.createElement("button");save.type="button";save.className="primary";save.textContent="Сохранить";
  const del=document.createElement("button");del.type="button";del.textContent="Удалить публикацию";
  const cancel=document.createElement("button");cancel.type="button";cancel.textContent="Отмена";
  actions.append(save,del,cancel);panel.append(actions);card.append(panel);
  cancel.addEventListener("click",()=>panel.remove());
  del.addEventListener("click",async()=>{
   if(!confirm("Удалить эту публикацию без возможности восстановления?"))return;
   del.disabled=true;save.disabled=true;cancel.disabled=true;status.textContent="Удаляем публикацию…";
   const removed=await client.from("posts").delete().eq("id",post.id).eq("user_id",user.id);
   if(removed.error){status.textContent="Не удалось удалить: "+removed.error.message;del.disabled=false;save.disabled=false;cancel.disabled=false;return;}
   card.remove();
  });
  save.addEventListener("click",async()=>{
   const content=textarea.value.trim();
   const kept=rows.filter(row=>!row.remove.checked).map(row=>row.item);
   const files=Array.from(fileInput.files||[]).map(file=>({file,type:file.type.startsWith("image/")?"photo":file.type.startsWith("video/")?"video":file.type.startsWith("audio/")?"music":null}));
   if(files.some(item=>!item.type)){status.textContent="Выбери фото, видео или аудиофайл.";return;}
   if(!content&&!kept.length&&!files.length){status.textContent="В публикации должен остаться текст или хотя бы один файл.";return;}
   save.disabled=true;cancel.disabled=true;status.textContent="Сохраняем изменения…";
   try{
    for(let i=0;i<files.length;i++){
     const {file,type}=files[i],safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-80);
     const path=`${user.id}/${Date.now()}-edit-${i}-${safeName}`;
     status.textContent=`Загружаем новые файлы: ${i+1} из ${files.length}…`;
     const uploaded=await client.storage.from("posts").upload(path,file,{upsert:false,contentType:file.type||undefined});
     if(uploaded.error)throw uploaded.error;
     const url=client.storage.from("posts").getPublicUrl(path).data.publicUrl;
     kept.push({type,url,name:file.name});
    }
    const firstPhoto=kept.find(item=>item.type==="photo");
    const updated=await client.from("posts").update({content:content||null,image_url:firstPhoto?.url||null,media:kept}).eq("id",post.id).eq("user_id",user.id).select("*").single();
    if(updated.error)throw updated.error;
    const replacement=renderPost(updated.data,{[user.id]:profile});card.replaceWith(replacement);
   }catch(e){status.textContent="Не удалось сохранить: "+e.message;save.disabled=false;cancel.disabled=false;}
  });
 }

 const queue=$("scheduled-queue"),queueList=$("scheduled-queue-list"),queueCount=$("scheduled-queue-count");
 let queueRefreshing=false,scheduledOwnerProfile=null;
 async function refreshPublishedScheduledPosts(){
  const queued=await client.from("scheduled_posts").select("published_post_id").eq("user_id",user.id).eq("status","published").not("published_post_id","is",null).order("published_at",{ascending:false}).limit(50);
  if(queued.error)return;
  const ids=[...new Set((queued.data||[]).map(x=>x.published_post_id).filter(Boolean))];
  if(!ids.length)return;
  const result=await client.from("posts").select("*").in("id",ids);
  if(result.error)return;
  const posts=(result.data||[]).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  if(!scheduledOwnerProfile){
   const owner=await client.from("profiles").select("*").eq("id",user.id).maybeSingle();
   scheduledOwnerProfile=owner.data||{};
  }
  for(const post of posts){
   if(seen.has(post.id))continue;
   seen.add(post.id);list.prepend(renderPost(post,{[user.id]:scheduledOwnerProfile}));empty.hidden=true;
  }
 }
 function renderScheduledMedia(container,item){
  const media=Array.isArray(item.media)&&item.media.length?item.media:(item.image_url?[{type:"photo",url:item.image_url,name:"Фото"}]:[]);
  if(!media.length)return;
  const box=document.createElement("div");box.className="scheduled-media";
  let firstPhoto=null,firstAudio=null;
  for(const file of media){
   const url=safeUrl(file.url);if(!url)continue;
   let node;
   if(file.type==="photo"){node=document.createElement("img");node.alt="Фото отложенной публикации";node.loading="lazy";if(!firstPhoto)firstPhoto=node;}
   else if(file.type==="music"){node=document.createElement("audio");node.controls=true;if(!firstAudio)firstAudio=node;}
   else{node=document.createElement("video");node.controls=true;node.playsInline=true;node.preload="metadata";}
   node.src=url;
   if(node.tagName==="IMG")node.addEventListener("click",()=>openPostPhotoView(url));
   box.append(node);
  }
  if(firstAudio)makeMiniAudio(firstAudio,firstPhoto);
  if(box.children.length)container.append(box);
 }
 async function deleteScheduledPost(item,card){
  if(!confirm("Удалить эту отложенную публикацию?"))return;
  const result=await client.from("scheduled_posts").delete().eq("id",item.id).eq("user_id",user.id);
  if(result.error){alert("Не удалось удалить: "+result.error.message);return;}
  card.remove();await refreshScheduledQueue();
 }
 function editScheduledPost(item,card){
  if(card.querySelector(".scheduled-edit-panel"))return;
  const original=Array.isArray(item.media)&&item.media.length?item.media.slice():(item.image_url?[{type:"photo",url:item.image_url,name:"Фото"}]:[]);
  const panel=document.createElement("div");panel.className="scheduled-edit-panel";
  const textLabel=document.createElement("label");textLabel.textContent="Текст публикации";
  const textarea=document.createElement("textarea");textarea.maxLength=5000;textarea.value=item.content||"";textLabel.append(textarea);panel.append(textLabel);attachEmojiPicker(textarea);
  const filesTitle=document.createElement("div");filesTitle.className="scheduled-edit-label";filesTitle.textContent="Прикреплённые файлы — отметь, что убрать";panel.append(filesTitle);
  const rows=[];
  original.forEach((file,index)=>{
   const row=document.createElement("label");row.className="scheduled-file-row";
   const name=document.createElement("span");name.textContent=(file.name||({photo:"Фото",video:"Видео",music:"Музыка"}[file.type]||"Файл"))+" · "+(index+1);
   const remove=document.createElement("input");remove.type="checkbox";remove.setAttribute("aria-label","Убрать файл "+(index+1));
   row.append(name,remove);panel.append(row);rows.push({file,remove});
  });
  const addLabel=document.createElement("label");addLabel.textContent="Добавить фото, видео или музыку";
  const fileInput=document.createElement("input");fileInput.type="file";fileInput.accept="image/*,video/*,audio/*";fileInput.multiple=true;addLabel.append(fileInput);panel.append(addLabel);
  const timeLabel=document.createElement("label");timeLabel.textContent="Дата и время выхода (Москва)";
  const timeInput=document.createElement("input");timeInput.type="datetime-local";timeInput.value=moscowInputValue(item.scheduled_at);timeInput.min=moscowInputValue(new Date(Date.now()+60000));timeLabel.append(timeInput);panel.append(timeLabel);
  const help=document.createElement("div");help.className="schedule-help";help.textContent="Порядок публикаций сохраняется. Время должно оставаться между соседними записями очереди.";panel.append(help);
  const status=document.createElement("div");status.className="scheduled-edit-status";status.setAttribute("aria-live","polite");panel.append(status);
  const actions=document.createElement("div");actions.className="scheduled-actions";
  const save=document.createElement("button");save.type="button";save.className="primary";save.textContent=item.status==="failed"?"Сохранить и повторить":"Сохранить";
  const removePost=document.createElement("button");removePost.type="button";removePost.textContent="Удалить";
  const cancel=document.createElement("button");cancel.type="button";cancel.textContent="Отмена";
  actions.append(save,removePost,cancel);panel.append(actions);card.append(panel);
  cancel.addEventListener("click",()=>panel.remove());
  removePost.addEventListener("click",()=>deleteScheduledPost(item,card));
  save.addEventListener("click",async()=>{
   const content=textarea.value.trim(),scheduledAt=moscowInputToIso(timeInput.value);
   const newFiles=Array.from(fileInput.files||[]).map(file=>({type:postFileType(file),file}));
   if(newFiles.some(x=>!x.type)){status.textContent="Выбери фото, видео или аудиофайл.";return;}
   if(!scheduledAt||new Date(scheduledAt).getTime()<=Date.now()){status.textContent="Укажи будущее время по Москве.";return;}
   const kept=rows.filter(x=>!x.remove.checked).map(x=>x.file);
   if(!content&&!kept.length&&!newFiles.length){status.textContent="Добавь текст или хотя бы один файл.";return;}
   save.disabled=true;removePost.disabled=true;cancel.disabled=true;status.textContent="Сохраняем изменения…";
   try{
    for(let i=0;i<newFiles.length;i++){
     const {type,file}=newFiles[i],safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-80);
     const path=`${user.id}/${Date.now()}-${i}-scheduled-${safeName}`;
     status.textContent=`Загружаем файлы: ${i+1} из ${newFiles.length}…`;
     const upload=await client.storage.from("posts").upload(path,file,{upsert:false,contentType:file.type||undefined});
     if(upload.error)throw upload.error;
     kept.push({type,url:client.storage.from("posts").getPublicUrl(path).data.publicUrl,name:file.name});
    }
    const firstPhoto=kept.find(x=>x.type==="photo");
    const updated=await client.from("scheduled_posts").update({content:content||null,image_url:firstPhoto?.url||null,media:kept,scheduled_at:scheduledAt}).eq("id",item.id).eq("user_id",user.id).select("*").single();
    if(updated.error)throw updated.error;
    if(item.status==="failed"){
     const retry=await client.rpc("retry_scheduled_post",{p_post_id:item.id});
     if(retry.error)throw retry.error;
    }
    await refreshScheduledQueue();
   }catch(error){status.textContent="Не удалось сохранить: "+error.message;save.disabled=false;removePost.disabled=false;cancel.disabled=false;}
  });
 }
 async function refreshScheduledQueue(){
  if(queueRefreshing)return;queueRefreshing=true;
  try{
   const result=await client.from("scheduled_posts").select("*").in("status",["pending","failed"]).order("queue_order",{ascending:true});
   if(result.error)throw result.error;
   const items=result.data||[];
   queueList.replaceChildren();queue.hidden=items.length===0;
   queueCount.textContent=items.length?items.length+" в очереди":"";
   items.forEach((item,index)=>{
    const card=document.createElement("article");card.className="scheduled-item";
    const head=document.createElement("div");head.className="scheduled-item-head";
    const title=document.createElement("strong");title.textContent="Публикация "+(index+1);
    const time=document.createElement("time");time.textContent=moscowDateText(item.scheduled_at);head.append(title,time);card.append(head);
    if(item.status==="failed"){
     const warning=document.createElement("div");warning.className="scheduled-failed";warning.textContent="Не удалось опубликовать. Исправь запись и нажми «Сохранить и повторить»."+(item.last_error?" Причина: "+item.last_error:"");card.append(warning);
    }
    if(item.content){const body=document.createElement("div");body.className="scheduled-content";renderFormattedText(body,item.content);card.append(body);}
    renderScheduledMedia(card,item);
    const actions=document.createElement("div");actions.className="scheduled-actions";
    const edit=document.createElement("button");edit.type="button";edit.textContent="✎ Изменить";edit.addEventListener("click",()=>editScheduledPost(item,card));
    const del=document.createElement("button");del.type="button";del.textContent="Удалить";del.addEventListener("click",()=>deleteScheduledPost(item,card));
    actions.append(edit,del);card.append(actions);queueList.append(card);
   });
   await refreshPublishedScheduledPosts();
  }catch(error){
   queue.hidden=false;queueList.textContent="Не удалось загрузить отложенные публикации: "+error.message;
  }finally{queueRefreshing=false;}
 }
 window.dolbyRefreshScheduledQueue=refreshScheduledQueue;

 async function loadBatch(){
  if(signal.aborted||busy||done)return;busy=true;loading.hidden=false;
  try{
   if(!feedAuthorIds){
    const followed=await client.from("follows").select("following_id").eq("follower_id",user.id);
    if(signal.aborted)return;
    if(followed.error)throw followed.error;
    feedAuthorIds=[...new Set([user.id,...(followed.data||[]).map(row=>row.following_id).filter(Boolean)])];
   }
   const [postResult,flowResult]=await Promise.all([
    postsDone?Promise.resolve({data:[],error:null}):client.from("posts").select("*").in("user_id",feedAuthorIds).order("created_at",{ascending:false}).order("id",{ascending:false}).range(offset,offset+batchSize-1),
    flowsDone?Promise.resolve({data:[],error:null}):client.from("reposts").select("id,user_id,post_id,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).order("id",{ascending:false}).range(flowOffset,flowOffset+batchSize-1)
   ]);
   if(signal.aborted)return;
   if(postResult.error)throw postResult.error;if(flowResult.error)throw flowResult.error;
   const posts=postResult.data||[],flowRows=flowResult.data||[];
   offset+=posts.length;flowOffset+=flowRows.length;
   if(posts.length<batchSize)postsDone=true;if(flowRows.length<batchSize)flowsDone=true;
   const flowIds=flowRows.map(row=>row.post_id).filter(Boolean);
   const flowPostResult=flowIds.length?await client.from("posts").select("*").in("id",flowIds):{data:[],error:null};
   if(signal.aborted)return;
   if(flowPostResult.error)throw flowPostResult.error;
   const flowByPostId=new Map(flowRows.map(row=>[String(row.post_id),row]));
   const merged=new Map();
   for(const post of posts)merged.set(String(post.id),{post,sortAt:post.created_at||"",flowMeta:null});
   for(const post of flowPostResult.data||[]){
    const flowMeta=flowByPostId.get(String(post.id));if(!flowMeta)continue;
    const key=String(post.id),existing=merged.get(key);
    if(!existing||new Date(flowMeta.created_at||0)>new Date(existing.sortAt||0))merged.set(key,{post,sortAt:flowMeta.created_at||post.created_at||"",flowMeta});
   }
   const entries=[...merged.values()].sort((a,b)=>new Date(b.sortAt||0)-new Date(a.sortAt||0));
   if(!entries.length&&postsDone&&flowsDone){done=true;if(!list.children.length)empty.hidden=false;loading.hidden=true;return;}
   const ids=[...new Set([...entries.map(x=>x.post.user_id),...entries.filter(x=>x.flowMeta).map(x=>x.flowMeta.user_id)].filter(Boolean))];let profiles={};
   if(ids.length){const res=await client.from("profiles").select("*").in("id",ids);if(signal.aborted)return;if(res.error)throw res.error;for(const p of res.data||[])profiles[p.id]=p;}
   if(profile)profiles[user.id]=profile;
   let added=0;
   for(const entry of entries){const key=String(entry.post.id);if(seen.has(key))continue;seen.add(key);list.appendChild(renderPost(entry.post,profiles,entry.flowMeta));added++;}
   done=postsDone&&flowsDone;loading.hidden=done;
   if(added===0&&!done){busy=false;await loadBatch();return;}
  }catch(e){if(signal.aborted)return;errorBox.hidden=false;errorBox.textContent="Не удалось загрузить публикации: "+e.message;loading.hidden=true;done=true;}
  finally{busy=false;}
 }
 if("IntersectionObserver" in window){
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))loadBatch();},{rootMargin:"700px 0px"});
  profileObservers.push(observer);observer.observe(sentinel);
 }else{
  window.addEventListener("scroll",()=>{if(window.innerHeight+window.scrollY>=document.body.offsetHeight-700)loadBatch();},{passive:true,signal});
 }
 await loadBatch();if(signal.aborted)return;
 await refreshScheduledQueue();if(signal.aborted)return;
 profileInterval(refreshScheduledQueue,30000);
}

$("settings-change-cover").addEventListener("click",()=>$("cover-file").click());
$("cover-file").addEventListener("change",async()=>{
 const file=$("cover-file").files[0];if(!file)return;
 const coverKey=firstKey(["cover_url","banner_url","cover"]);
 if(!coverKey){$("quick-status").textContent="Сначала добавим поле cover_url в таблицу profiles.";return;}
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)){$("quick-status").textContent="Выбери JPG, PNG или WebP.";return;}
 if(file.size>10*1024*1024){$("quick-status").textContent="Обложка должна быть не больше 10 МБ.";return;}
 const ext=file.type==="image/jpeg"?"jpg":file.type.split("/")[1],path=`${user.id}/cover-${Date.now()}.${ext}`;
 $("settings-change-cover").disabled=true;$("quick-status").textContent="Загружаем обложку…";
 try{
  const upload=await client.storage.from("avatars").upload(path,file,{upsert:false,contentType:file.type});if(upload.error)throw upload.error;
  const url=client.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  const saved=await client.from("profiles").update({[coverKey]:url}).eq("id",user.id).select("*").single();if(saved.error)throw saved.error;
  profile=saved.data;columns=Object.keys(profile);render();$("quick-status").textContent="Обложка обновлена!";
 }catch(e){$("quick-status").textContent="Не удалось обновить обложку: "+e.message;}
 finally{$("settings-change-cover").disabled=false;$("cover-file").value="";}
});
function currentAvatarUrl(){const key=firstKey(["avatar_url","avatar"]);return key&&profile[key]?profile[key]:null;}
function openPhotoEditor(){$("photo-modal").hidden=false;$("photo-status").textContent="";$("open-photo-view").disabled=!currentAvatarUrl();}
function closePhotoEditor(){$("photo-modal").hidden=true;}
function likerAvatar(profile){
 const holder=document.createElement("div");holder.className="photo-liker-avatar";
 const url=profile?.avatar_url||profile?.avatar||"";
 if(url){const img=document.createElement("img");img.src=url;img.alt="";img.loading="lazy";img.onerror=()=>{holder.textContent=(profile?.name||profile?.display_name||profile?.username||"П")[0].toUpperCase();};holder.appendChild(img);}
 else holder.textContent=String(profile?.name||profile?.display_name||profile?.full_name||profile?.username||"П").trim()[0].toUpperCase();
 return holder;
}
async function fetchPhotoLikers(){
 const result=await client.from("profile_photo_likes").select("user_id,created_at").eq("profile_id",user.id).order("created_at",{ascending:false});
 if(result.error)throw result.error;
 const rows=result.data||[],ids=[...new Set(rows.map(row=>row.user_id).filter(Boolean))];
 let profilesById={};
 if(ids.length){
  const profilesResult=await client.from("profiles").select("*").in("id",ids);
  if(profilesResult.error)throw profilesResult.error;
  for(const p of profilesResult.data||[])profilesById[p.id]=p;
 }
 return rows.map(row=>({user_id:row.user_id,profile:profilesById[row.user_id]||{}}));
}
async function refreshPhotoLikes(){
 $("photo-like").disabled=true;$("photo-view-status").textContent="Загружаем лайки…";
 try{
  const [likers,mineResult]=await Promise.all([
   fetchPhotoLikers(),
   client.from("profile_photo_likes").select("user_id").eq("profile_id",user.id).eq("user_id",user.id).maybeSingle()
  ]);
  if(mineResult.error)throw mineResult.error;
  const liked=!!mineResult.data;
  $("photo-like-count").textContent=likers.length+" "+(likers.length===1?"лайк":"лайков");
  $("photo-like").textContent=liked?"♥ Нравится":"♡ Нравится";
  $("photo-like").classList.toggle("liked",liked);
  $("photo-like").dataset.liked=liked?"true":"false";
  const avatars=$("photo-liker-avatars");avatars.replaceChildren();
  likers.slice(0,3).forEach(item=>avatars.appendChild(likerAvatar(item.profile)));
  $("photo-view-status").textContent="";
 }catch(e){$("photo-view-status").textContent="Не удалось загрузить лайки или аватары. Проверь доступ к таблице profiles.";}
 finally{$("photo-like").disabled=false;}
}
async function openLikersList(){
 $("likers-modal").hidden=false;$("likers-list").innerHTML='<div class="likers-empty">Загружаем список…</div>';
 try{
  const likers=await fetchPhotoLikers(),list=$("likers-list");list.replaceChildren();
  $("likers-title").textContent="Понравилось · "+likers.length;
  if(!likers.length){const empty=document.createElement("div");empty.className="likers-empty";empty.textContent="Пока никто не поставил лайк.";list.appendChild(empty);return;}
  likers.forEach(item=>{
   const row=document.createElement("div");row.className="liker-row";row.appendChild(likerAvatar(item.profile));
   const name=document.createElement("div");name.className="liker-name";
   name.textContent=item.profile.name||item.profile.display_name||item.profile.full_name||item.profile.username||"Пользователь";
   row.appendChild(name);list.appendChild(row);
  });
 }catch(e){$("likers-list").textContent="Не удалось загрузить список лайков. Проверь доступ к таблице profiles.";}
}

async function openPhotoView(){
 const url=currentAvatarUrl();if(!url)return;
 $("photo-modal").hidden=true;
 $("photo-view-image").src=url;$("photo-viewer").hidden=false;
 await refreshPhotoLikes();
}
function closePhotoView(){$("photo-viewer").hidden=true;$("photo-view-image").removeAttribute("src");closePhotoEditor();}
let photoSwipeStart=null;
$("photo-view-image").style.touchAction="none";
$("photo-view-image").addEventListener("pointerdown",e=>{
 if(e.pointerType==="mouse")return;
 photoSwipeStart={x:e.clientX,y:e.clientY,id:e.pointerId};
 try{$("photo-view-image").setPointerCapture(e.pointerId);}catch(_){}
});
$("photo-view-image").addEventListener("pointerup",e=>{
 if(!photoSwipeStart||photoSwipeStart.id!==e.pointerId){photoSwipeStart=null;return;}
 const dx=e.clientX-photoSwipeStart.x;
 const dy=e.clientY-photoSwipeStart.y;
 photoSwipeStart=null;
 if(dy < -55 && Math.abs(dy)>Math.abs(dx)*1.15)closePhotoView();
});
$("photo-view-image").addEventListener("pointercancel",()=>{photoSwipeStart=null;});
$("avatar").addEventListener("click",openPhotoEditor);
$("avatar").addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openPhotoEditor();}});
$("close-photo").addEventListener("click",closePhotoEditor);
$("open-photo-view").addEventListener("click",openPhotoView);
$("close-photo-view").addEventListener("click",closePhotoView);
$("photo-like-count").addEventListener("click",openLikersList);
$("close-likers").addEventListener("click",()=>$("likers-modal").hidden=true);
$("likers-modal").addEventListener("click",e=>{if(e.target===$("likers-modal"))$("likers-modal").hidden=true;});
$("photo-like").addEventListener("click",async()=>{
 const liked=$("photo-like").dataset.liked==="true";
 $("photo-like").disabled=true;$("photo-view-status").textContent="Сохраняем…";
 try{
  if(liked){
   const result=await client.from("profile_photo_likes").delete().eq("profile_id",user.id).eq("user_id",user.id);
   if(result.error)throw result.error;
  }else{
   const result=await client.from("profile_photo_likes").insert({profile_id:user.id,user_id:user.id});
   if(result.error&&result.error.code!=="23505")throw result.error;
  }
  await refreshPhotoLikes();
 }catch(e){$("photo-view-status").textContent="Не удалось поставить лайк. Проверь настройки таблицы в Supabase.";$("photo-like").disabled=false;}
});
$("photo-modal").addEventListener("click",e=>{if(e.target===$("photo-modal"))closePhotoEditor();});
$("choose-photo").addEventListener("click",()=>$("avatar-file").click());
$("avatar-file").addEventListener("change",async()=>{
 const file=$("avatar-file").files[0];if(!file)return;
 const avatarKey=firstKey(["avatar_url","avatar"]);
 if(!avatarKey){$("photo-status").textContent="В профиле не найдено поле для фотографии.";return;}
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)){$("photo-status").textContent="Выбери JPG, PNG или WebP."; $("avatar-file").value="";return;}
 if(file.size>10*1024*1024){$("photo-status").textContent="Файл больше 10 МБ. Выбери фото до 10 МБ."; $("avatar-file").value="";return;}
 const ext=file.type==="image/jpeg"?"jpg":file.type.split("/")[1];
 const token=Date.now()+"-"+crypto.randomUUID();
 const originalPath=`${user.id}/avatar-original-${token}.${ext}`;
 const avatarPath=`${user.id}/avatar-${token}.${ext}`;
 let originalUploaded=false,avatarUploaded=false,albumPhotoId=null;
 $("choose-photo").disabled=true;$("photo-status").textContent="Сохраняем оригинал в фотоальбом…";
 try{
  const original=await client.storage.from("photo-albums").upload(originalPath,file,{upsert:false,contentType:file.type});
  if(original.error)throw original.error;
  originalUploaded=true;
  const albumRow=await client.from("photo_album_photos").insert({owner_id:user.id,object_path:originalPath,file_name:file.name,mime_type:file.type}).select("id").single();
  if(albumRow.error)throw albumRow.error;
  albumPhotoId=albumRow.data.id;
  $("photo-status").textContent="Готовим фотографию профиля…";
  const avatarUpload=await client.storage.from("avatars").upload(avatarPath,file,{upsert:false,contentType:file.type});
  if(avatarUpload.error)throw avatarUpload.error;
  avatarUploaded=true;
  const publicUrl=client.storage.from("avatars").getPublicUrl(avatarPath).data.publicUrl;
  const saved=await client.from("profiles").update({[avatarKey]:publicUrl,avatar_photo_id:albumPhotoId}).eq("id",user.id).select("*").single();
  if(saved.error)throw saved.error;
  profile=saved.data;columns=Object.keys(profile);render();
  $("open-photo-view").disabled=!currentAvatarUrl();$("photo-status").textContent="Оригинал добавлен в открытый фотоальбом, аватар обновлён!";
  await loadPhotoAlbum();
  profileTimeout(()=>{closePhotoEditor();$("avatar-file").value="";},900);
 }catch(e){
  if(albumPhotoId)await client.from("photo_album_photos").delete().eq("id",albumPhotoId).eq("owner_id",user.id);
  if(originalUploaded)await client.storage.from("photo-albums").remove([originalPath]);
  if(avatarUploaded)await client.storage.from("avatars").remove([avatarPath]);
  $("photo-status").textContent="Не удалось обновить фото: "+e.message;
 }
 finally{$("choose-photo").disabled=false;}
});
$("cancel-button").addEventListener("click",()=>{$("editor").hidden=true;});
$("save-button").addEventListener("click",async()=>{
 const nameKey=firstKey(["display_name","full_name","name"]);
 const usernameKey=firstKey(["username","handle","nickname"]);
 const bioKey=firstKey(["bio","about","description"]);
 const patch={};
 if(columns.includes("first_name"))patch.first_name=$("first-name-input").value.trim();
 if(columns.includes("last_name"))patch.last_name=$("last-name-input").value.trim();
 if(nameKey)patch[nameKey]=$("name-input").value.trim();
 if(usernameKey)patch[usernameKey]=$("username-input").value.trim().replace(/^@/,"");
 if(bioKey)patch[bioKey]=$("bio-input").value.trim();
 if(!Object.keys(patch).length){$("message").textContent="В таблице пока не найдены поля для имени, никнейма, описания или аватара. Нужна небольшая настройка базы данных.";return;}
 $("save-button").disabled=true;$("message").textContent="Сохраняем…";
 try{
  const result=await client.from("profiles").update(patch).eq("id",user.id).select("*").single();
  if(result.error)throw result.error;profile=result.data;columns=Object.keys(profile);render();$("editor").hidden=true;$("message").textContent="Профиль сохранён!";
 }catch(e){$("message").textContent="Не удалось сохранить: "+e.message;}
 finally{$("save-button").disabled=false;}
});

// Редактор публикаций: типы файлов определяются автоматически.
$("open-publish").addEventListener("click",()=>{$("publish-editor").hidden=false;$("publish-editor").classList.remove("composer-fullscreen");$("publish-status").textContent="";$("post-schedule-toggle").checked=false;$("schedule-time-wrap").hidden=true;$("submit-post").textContent="Опубликовать";});
$("cancel-publish").addEventListener("click",()=>{$("publish-editor").hidden=true;$("publish-editor").classList.remove("composer-fullscreen");$("post-schedule-toggle").checked=false;$("schedule-time-wrap").hidden=true;$("submit-post").textContent="Опубликовать";});
$("post-schedule-toggle").addEventListener("change",async()=>{
 const enabled=$("post-schedule-toggle").checked,wrap=$("schedule-time-wrap"),input=$("post-scheduled-at");
 wrap.hidden=!enabled;$("submit-post").textContent=enabled?"В отложенные":"Опубликовать";
 if(!enabled)return;
 const now=Date.now()+60000;
 let min=now;
 try{
  const latest=await client.from("scheduled_posts").select("scheduled_at").in("status",["pending","failed"]).order("queue_order",{ascending:false}).limit(1).maybeSingle();
  if(latest.error)throw latest.error;
  if(latest.data?.scheduled_at)min=Math.max(min,new Date(latest.data.scheduled_at).getTime()+60000);
 }catch(error){$("publish-status").textContent="Не удалось проверить очередь: "+error.message;return;}
 input.min=moscowInputValue(min);
 input.value=moscowInputValue(Math.max(min,Date.now()+3600000));
});
$("submit-post").addEventListener("click",async()=>{
 const text=$("post-text").value.trim();
 const files=Array.from($("post-files").files||[]).map(file=>({type:postFileType(file),file}));
 const isScheduled=$("post-schedule-toggle").checked;
 let scheduledAt=null;
 if(isScheduled){
  scheduledAt=moscowInputToIso($("post-scheduled-at").value);
  if(!scheduledAt||new Date(scheduledAt).getTime()<=Date.now()){$("publish-status").textContent="Укажи будущее время публикации по Москве.";return;}
  const latest=await client.from("scheduled_posts").select("scheduled_at").in("status",["pending","failed"]).order("queue_order",{ascending:false}).limit(1).maybeSingle();
  if(latest.error){$("publish-status").textContent="Не удалось проверить очередь: "+latest.error.message;return;}
  if(latest.data?.scheduled_at&&new Date(scheduledAt).getTime()<=new Date(latest.data.scheduled_at).getTime()){$("publish-status").textContent="Для следующей публикации выбери время позже предыдущей.";return;}
 }
 if(files.some(item=>!item.type)){$("publish-status").textContent="Выбери фото, видео или аудиофайл.";return;}
 if(!text&&!files.length){$("publish-status").textContent="Добавь текст или выбери хотя бы один файл.";return;}
 $("submit-post").disabled=true;$("publish-status").textContent="Подготавливаем публикацию…";
 try{
  const media=[];
  for(let i=0;i<files.length;i++){
   const {type,file}=files[i];
   const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-80);
   const path=`${user.id}/${Date.now()}-${i}-${safeName}`;
   $("publish-status").textContent=`Загружаем файлы: ${i+1} из ${files.length}…`;
   const uploaded=await client.storage.from("posts").upload(path,file,{upsert:false,contentType:file.type||undefined});
   if(uploaded.error)throw uploaded.error;
   const url=client.storage.from("posts").getPublicUrl(path).data.publicUrl;
   media.push({type,url,name:file.name});
  }
  const firstPhoto=media.find(item=>item.type==="photo");
  if(isScheduled){
   const queued=await client.from("scheduled_posts").insert({user_id:user.id,content:text||null,image_url:firstPhoto?.url||null,media,scheduled_at:scheduledAt}).select("*").single();
   if(queued.error)throw queued.error;
   $("publish-status").textContent="Добавлено в отложенные публикации!";
   $("post-text").value="";$("post-files").value="";$("post-schedule-toggle").checked=false;$("schedule-time-wrap").hidden=true;$("submit-post").textContent="Опубликовать";
   $("publish-editor").hidden=true;$("publish-editor").classList.remove("composer-fullscreen");
   if(window.dolbyRefreshScheduledQueue)await window.dolbyRefreshScheduledQueue();
   return;
  }
  const inserted=await client.from("posts").insert({user_id:user.id,content:text||null,image_url:firstPhoto?.url||null,media}).select("*").single();
  if(inserted.error)throw inserted.error;
  $("publish-status").textContent="Публикация размещена!";
  $("post-text").value="";$("post-files").value="";
  $("publish-editor").hidden=true;$("publish-editor").classList.remove("composer-fullscreen");$("feed-empty").hidden=true;
  const card=document.createElement("article");card.className="post";
  const head=document.createElement("div");head.className="post-head";
  const av=document.createElement("div");av.className="post-avatar";av.textContent=(($("display-name").textContent||"П")[0]).toUpperCase();
  const ident=document.createElement("div");const author=document.createElement("div");author.className="post-author";author.textContent=$("display-name").textContent;
  const date=document.createElement("div");date.className="post-date";date.textContent="только что";ident.append(author,date);head.append(av,ident);card.append(head);
  if(text){const body=document.createElement("div");body.className="post-content";renderFormattedText(body,text);card.append(body);}
  if(media.length){const box=document.createElement("div");box.className="post-media";let firstPhoto=null,firstAudio=null;media.forEach(item=>{const node=document.createElement(item.type==="photo"?"img":item.type==="music"?"audio":"video");if(node.tagName==="IMG"){node.alt="Фото публикации";if(!firstPhoto)firstPhoto=node;}else{node.controls=true;if(node.tagName==="VIDEO")node.playsInline=true;if(node.tagName==="AUDIO"&&!firstAudio)firstAudio=node;}if(node.tagName==="IMG")node.crossOrigin="anonymous";node.src=item.url;box.append(node);});if(firstAudio)makeMiniAudio(firstAudio,firstPhoto);card.append(box);}
  $("feed-list").prepend(card);
 }catch(e){$("publish-status").textContent="Не удалось опубликовать: "+e.message;}
 finally{$("submit-post").disabled=false;}
});

function signOutFromDrawer(){client.auth.signOut().then(({error})=>{if(error){$("quick-status").textContent="Не удалось выйти: "+error.message;return;}navigate("portal.html");});}
$("drawer-logout").addEventListener("click",signOutFromDrawer);
const settingsBackdrop=$("settings-backdrop");
function closeSettings(){settingsBackdrop.hidden=true;}
async function openSettingsPanel(){$("settings-language").value=localStorage.getItem("dolby404-language")||"ru";$("settings-theme").value=localStorage.getItem("dolby404-theme")||"cyber";$("settings-status").textContent="";settingsBackdrop.hidden=false;try{await loadPrivacySettings();}catch(error){$("settings-status").textContent="Не удалось загрузить приватность: "+error.message;}}
$("open-settings").addEventListener("click",()=>{$("drawer-close").click();openNavigationDestination("settings");});
$("settings-close").addEventListener("click",closeSettings);
settingsBackdrop.addEventListener("click",e=>{if(e.target===settingsBackdrop)closeSettings();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!settingsBackdrop.hidden)closeSettings();},{signal});
function applyTheme(theme){const allowed=["cyber","ocean","rose","mono"];document.body.dataset.theme=allowed.includes(theme)?theme:"cyber";}
function applyLanguage(language){
 const en=language==="en";document.documentElement.lang=en?"en":"ru";
 $("side-drawer").querySelector(".side-drawer-caption").textContent=en?"Navigation":"Навигация";
 $("side-drawer").querySelectorAll("[data-drawer-action]").forEach(b=>{b.innerHTML='<span class="side-drawer-icon">◉</span>'+(en?"My profile":"Мой профиль");});
 $("nav-history-title").textContent=en?"Recently visited":"Недавно посещали";renderNavigationHistory();
 $("side-drawer").querySelectorAll("[data-drawer-soon]").forEach(b=>{const key=b.dataset.drawerSoon;const names=en?{"Друзья":"Friends","Сообщения":"Messages","Сообщества":"Communities","Музыка":"Music","Видео":"Videos","Фото":"Photos","Закладки":"Bookmarks"}:{"Друзья":"Друзья","Сообщения":"Сообщения","Сообщества":"Сообщества","Музыка":"Музыка","Видео":"Видео","Фото":"Фото","Закладки":"Закладки"};const icon=b.querySelector(".side-drawer-icon")?.textContent||"•";if(key==="Видео"){b.innerHTML='<span class="side-drawer-icon">'+icon+'</span><span class="author-label" aria-label="AuTHOR"><span>A</span><span>u</span><span>T</span><span>H</span><span>O</span><span>R</span></span>';b.setAttribute("aria-label","AuTHOR");}else{b.innerHTML='<span class="side-drawer-icon">'+icon+'</span>'+(names[key]||key);}});
 $("open-settings").innerHTML='<span class="side-drawer-icon">⚙</span>'+(en?"Settings":"Настройки");
 $("drawer-logout").textContent=en?"↪ Sign out":"↪ Выйти";
 $("settings-title").textContent=en?"Settings":"Настройки";
 $("open-profile-editor").textContent=en?"✎ Edit profile":"✎ Редактировать профиль";
 const labels=$("settings-backdrop").querySelectorAll(".settings-label");
 if(labels[0])labels[0].textContent=en?"Interface language":"Язык интерфейса";
 if(labels[1])labels[1].textContent=en?"Page appearance":"Стиль страницы";
 if(labels[3])labels[3].textContent=en?"Enter new password":"Введите новый пароль";
 if(labels[4])labels[4].textContent=en?"Repeat new password":"Повторите новый пароль";
 $("settings-change-cover").textContent=en?"✎ Change cover":"✎ Изменить обложку";
 $("save-preferences").textContent=en?"Save preferences":"Сохранить настройки";
 $("change-password").textContent=en?"Change password":"Изменить пароль";
}
applyTheme(localStorage.getItem("dolby404-theme")||"cyber");
applyLanguage(localStorage.getItem("dolby404-language")||"ru");
$("save-preferences").addEventListener("click",()=>{
 const language=$("settings-language").value,theme=$("settings-theme").value;
 localStorage.setItem("dolby404-language",language);localStorage.setItem("dolby404-theme",theme);applyTheme(theme);
 applyLanguage(language);
 $("settings-status").textContent=language==="en"?"Preferences saved on this device.":"Настройки сохранены на этом устройстве.";
});
$("delete-account-button").addEventListener("click",async()=>{
 if(!user?.email){$("settings-status").textContent="Не удалось определить email аккаунта.";return;}
 const confirmed=confirm("Удалить учётную запись? После подтверждения по email доступ будет отключён. В течение 30 дней ты сможешь восстановить прежний аккаунт. По истечении срока личные данные и файлы будут удалены, а текст переписок останется у собеседников.");
 if(!confirmed)return;
 const button=$("delete-account-button");button.disabled=true;
 $("settings-status").textContent="Отправляем письмо для подтверждения…";
 try{
  const redirectTo=new URL("profile.html?confirm_delete=1",location.href).href;
  const result=await client.auth.signInWithOtp({email:user.email,options:{shouldCreateUser:false,emailRedirectTo:redirectTo}});
  if(result.error)throw result.error;
  $("settings-status").textContent="Письмо отправлено. Открой ссылку из письма на этом устройстве. Только после этого аккаунт будет деактивирован на 30 дней.";
 }catch(error){$("settings-status").textContent="Не удалось отправить письмо: "+error.message;}
 finally{button.disabled=false;}
});
$("change-password").addEventListener("click",async()=>{
 const password=$("new-password").value,confirm=$("confirm-password").value;
 if(password.length<8){$("settings-status").textContent="Пароль должен содержать не менее 8 символов.";return;}
 if(password!==confirm){$("settings-status").textContent="Пароли не совпадают.";return;}
 $("change-password").disabled=true;$("settings-status").textContent="Обновляем пароль…";
 try{const result=await client.auth.updateUser({password});if(result.error)throw result.error;
 $("new-password").value="";$("confirm-password").value="";$("settings-status").textContent="Пароль успешно изменён.";
 }catch(error){$("settings-status").textContent="Не удалось изменить пароль: "+error.message;}
 finally{$("change-password").disabled=false;}
});
root.querySelectorAll("[data-soon]").forEach(button=>button.addEventListener("click",()=>{$("quick-status").textContent="Раздел «"+button.dataset.soon+"» подключим следующим этапом.";}));


(function initSideDrawer(){
 const d=$("side-drawer"),shade=$("drawer-backdrop"),edge=$("drawer-edge"),btn=$("drawer-menu-button");
 let opened=false,g=null;const w=()=>d.getBoundingClientRect().width,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function paint(x){const width=w(),v=clamp(x,-width,0),p=(v+width)/width;d.style.setProperty("--drawer-x",v+"px");shade.style.opacity=String(p*.68);shade.classList.toggle("visible",p>.01);}
 function toggle(v){opened=v;d.classList.remove("dragging");d.style.setProperty("--drawer-x",v?"0px":"-100%");shade.style.opacity=v?".68":"0";shade.classList.toggle("visible",v);d.setAttribute("aria-hidden",String(!v));btn.setAttribute("aria-expanded",String(v));btn.classList.toggle("is-hidden",v);btn.setAttribute("aria-hidden",String(v));document.body.style.overflow=v?"hidden":"";}
 function down(e,fromEdge){if(e.pointerType==="mouse"&&e.button!==0)return;if(fromEdge&&!opened&&e.clientX>28)return;if(!fromEdge&&!opened)return;g={id:e.pointerId,x:e.clientX,y:e.clientY,last:e.clientX,t:performance.now(),vel:0,edge:fromEdge,drag:false};try{(fromEdge?edge:d).setPointerCapture(e.pointerId);}catch(_){}}
 function move(e){if(!g||g.id!==e.pointerId)return;const dx=e.clientX-g.x,dy=e.clientY-g.y;if(!g.drag){if(Math.abs(dy)>Math.abs(dx)*1.15&&Math.abs(dy)>8){g=null;return;}if(Math.abs(dx)<4)return;if((g.edge&&dx<0)||(!g.edge&&dx>0)){g=null;return;}g.drag=true;d.classList.add("dragging");}const now=performance.now();g.vel=(e.clientX-g.last)/Math.max(1,now-g.t);g.last=e.clientX;g.t=now;paint(g.edge?-w()+Math.max(0,dx):Math.min(0,dx));}
 function up(e){if(!g||g.id!==e.pointerId)return;const q=g;g=null;if(!q.drag){d.classList.remove("dragging");return;}const x=parseFloat(d.style.getPropertyValue("--drawer-x"))||-w();toggle((x+w())/w()>.42||q.vel>.45);}
 edge.addEventListener("pointerdown",e=>down(e,true));d.addEventListener("pointerdown",e=>down(e,false));
 [edge,d].forEach(el=>{el.addEventListener("pointermove",move);el.addEventListener("pointerup",up);el.addEventListener("pointercancel",()=>{g=null;toggle(opened);});});
 btn.addEventListener("click",()=>toggle(!opened));$("drawer-close").addEventListener("click",()=>toggle(false));shade.addEventListener("click",()=>toggle(false));document.addEventListener("keydown",e=>{if(e.key==="Escape"&&opened)toggle(false);},{signal});
 function toggleDrawerFromSettings(){$("drawer-menu-button").click();}
 d.addEventListener("click",e=>{const recent=e.target.closest("[data-history-action]");if(recent){toggle(false);openNavigationDestination(recent.dataset.historyAction);return;}const a=e.target.closest("[data-drawer-action],[data-drawer-soon],[data-author-hub]");if(!a)return;toggle(false);const action=a.dataset.authorHub==="true"?"author":(a.dataset.drawerAction||({Друзья:"friends",Сообщения:"messages",Сообщества:"communities",Музыка:"music",Видео:"video",Фото:"photos",Закладки:"bookmarks"}[a.dataset.drawerSoon]||""));openNavigationDestination(action,a.dataset.drawerSoon,a.querySelector(".side-drawer-icon")?.textContent);});
 toggle(false);
})();

profileTimeout(()=>void start(),0);


(()=>{
 const toggle=root.querySelector("#"+"drawer-search-toggle");
 const options=root.querySelector("#"+"drawer-search-options");
 if(!toggle||!options)return;
 toggle.addEventListener("click",()=>{
  const expanded=toggle.getAttribute("aria-expanded")==="true";
  toggle.setAttribute("aria-expanded",String(!expanded));
  options.hidden=expanded;
 });
 options.querySelectorAll("[data-drawer-search-action]").forEach(button=>button.addEventListener("click",()=>{
  const action=button.dataset.drawerSearchAction;
  const message=action==="search"?"Раздел поиска подготовим следующим этапом.":"Раздел рекомендаций подготовим следующим этапом.";
  button.setAttribute("aria-label",message);
  let note=options.querySelector(".drawer-search-note");
  if(!note){note=document.createElement("p");note.className="drawer-search-note";note.style.cssText="grid-column:1/-1;margin:2px 2px 0;color:#a997bd;font-size:10px;line-height:1.4";options.appendChild(note);}
  note.textContent=message;
 }));
})();


(()=> {
 const $id=id=>root.querySelector("#"+id)||root.querySelector("."+id);
 const backdrop=$id("discovery-backdrop"),title=$id("discovery-title");
 const searchView=$id("discovery-search-view"),recommendView=$id("discovery-recommendations-view");
 const queryInput=$id("discovery-query"),results=$id("discovery-results");
 const recommendationResults=$id("discovery-recommendations-results");
 let category="all",busy=false,lastQuery="";
 const safeText=value=>String(value??"").trim();
 function status(host,message){host.replaceChildren();const node=document.createElement("div");node.className="discovery-status";node.textContent=message;host.append(node);}
 function avatarNode(url,name){const box=document.createElement("div");box.className="discovery-avatar";if(url){const img=document.createElement("img");img.src=url;img.alt="";img.loading="lazy";img.onerror=()=>{box.textContent=(name[0]||"◉").toUpperCase();};box.append(img);}else box.textContent=(name[0]||"◉").toUpperCase();return box;}
 function resultRow(host,{name,sub,avatar,href,action,buttonText,buttonLabel}){const row=document.createElement("article");row.className="discovery-result";row.append(avatarNode(avatar,name));const copy=document.createElement("div");copy.className="discovery-copy";const titleNode=document.createElement(href?"a":"strong");titleNode.className="discovery-title";titleNode.textContent=name;if(href){titleNode.href=href;titleNode.setAttribute("aria-label","Открыть страницу "+name);}const subtitle=document.createElement(href?"a":"span");subtitle.className="discovery-subtitle";subtitle.textContent=sub||"";if(href){subtitle.href=href;subtitle.setAttribute("aria-label","Открыть страницу "+name);}copy.append(titleNode,subtitle);row.append(copy);if(action){const button=document.createElement("button");button.type="button";button.className="discovery-follow";button.textContent=buttonText||"Открыть";button.setAttribute("aria-label",buttonLabel||buttonText||"Действие");button.addEventListener("click",action);row.append(button);}host.append(row);return row;}
 function postCard(host,post,author){const card=document.createElement("article");card.className="discovery-post";const body=document.createElement("p");body.textContent=post.content||"Публикация с медиафайлом";const meta=document.createElement("small");const date=post.created_at?new Date(post.created_at).toLocaleString("ru-RU",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"";meta.textContent=(author||"Пользователь")+(date?" · "+date:"");card.append(body,meta);host.append(card);}
 function openDiscovery(mode){if(!client||!user)return;$id("drawer-search-options").hidden=false;$id("drawer-search-toggle").setAttribute("aria-expanded","true");backdrop.hidden=false;const isRec=mode==="recommendations";searchView.hidden=isRec;recommendView.hidden=!isRec;title.textContent=isRec?"Рекомендации":"Поиск FLOUSTREAM";if(isRec)loadRecommendations();else{queryInput.focus();if(queryInput.value.trim())runSearch();}}
 function closeDiscovery(){backdrop.hidden=true;}
 $id("discovery-close").addEventListener("click",closeDiscovery);
 backdrop.addEventListener("click",event=>{if(event.target===backdrop)closeDiscovery();});
 document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!backdrop.hidden)closeDiscovery();},{signal});
 $id("discovery-search-form").addEventListener("submit",event=>{event.preventDefault();runSearch();});
 $id("discovery-tabs").querySelectorAll("[data-category]").forEach(button=>button.addEventListener("click",()=>{category=button.dataset.category;$id("discovery-tabs").querySelectorAll("[data-category]").forEach(item=>item.setAttribute("aria-pressed",String(item===button)));if(queryInput.value.trim())runSearch();}));
 $id("drawer-search-options").querySelectorAll("[data-drawer-search-action]").forEach(button=>button.addEventListener("click",()=>openDiscovery(button.dataset.drawerSearchAction)));
 async function runSearch(){
  const term=queryInput.value.trim();if(!term){status(results,"Введи слово или фразу для поиска.");return;}if(busy)return;busy=true;lastQuery=term;status(results,"Ищем…");
  const pattern="%"+term.replace(/[\\%_]/g,"\\$&")+"%";
  try{
   const tasks=[];
   if(category==="all"||category==="people"){
    tasks.push(client.from("profiles").select("id,username,display_name,bio,avatar_url").ilike("username",pattern).limit(12).then(r=>({type:"people",...r})));
    tasks.push(client.from("profiles").select("id,username,display_name,bio,avatar_url").ilike("display_name",pattern).limit(12).then(r=>({type:"people",...r})));
   }
   if(category==="all"||category==="posts")tasks.push(client.from("posts").select("id,user_id,content,created_at").ilike("content",pattern).order("created_at",{ascending:false}).limit(20).then(r=>({type:"posts",...r})));
   if(category==="all"||category==="music")tasks.push(client.from("music_tracks").select("id,owner_id,title,object_path,created_at").eq("visibility","public").ilike("title",pattern).order("created_at",{ascending:false}).limit(12).then(r=>({type:"music",...r})));
   if(category==="all"||category==="video")tasks.push(client.from("video_album_videos").select("id,owner_id,file_name,created_at").ilike("file_name",pattern).order("created_at",{ascending:false}).limit(12).then(r=>({type:"video",...r})));
   const settled=await Promise.all(tasks);const errors=settled.filter(r=>r.error);if(errors.length)throw errors[0].error;
   const users=new Map();settled.filter(r=>r.type==="people").forEach(r=>(r.data||[]).forEach(p=>users.set(p.id,p)));
   const ownerIds=[...new Set(settled.filter(r=>r.type==="posts"||r.type==="video").flatMap(r=>(r.data||[]).map(x=>x.user_id||x.owner_id)).filter(Boolean))];
   if(ownerIds.length){const owners=await client.from("profiles").select("id,username,display_name,avatar_url").in("id",ownerIds);if(owners.error)throw owners.error;(owners.data||[]).forEach(p=>users.set(p.id,p));}
   results.replaceChildren();let count=0;
   const showPeople=category==="all"||category==="people";
   if(showPeople){const people=[...users.values()].filter(p=>settled.filter(r=>r.type==="people").some(r=>(r.data||[]).some(x=>x.id===p.id)));if(people.length){const h=document.createElement("h3");h.className="discovery-section-title";h.textContent="Люди";results.append(h);people.forEach(p=>{const name=p.display_name||p.username||"Пользователь";resultRow(results,{name,sub:(p.username?"@"+p.username+" · ":"")+(p.bio||"Профиль FLOUSTREAM"),avatar:p.avatar_url,href:"public-profile.html?id="+encodeURIComponent(p.id)});count++;});}}
   for(const type of ["posts","music","video"]){if(category!=="all"&&category!==type)continue;const group=settled.find(r=>r.type===type);if(!group?.data?.length)continue;const h=document.createElement("h3");h.className="discovery-section-title";h.textContent=type==="posts"?"Публикации":type==="music"?"Музыка":"Видео";results.append(h);for(const item of group.data){if(type==="posts"){const owner=users.get(item.user_id||item.owner_id);const author=owner?.display_name||owner?.username||"Пользователь";postCard(results,item,author);}else if(type==="music"){const card=document.createElement("article");card.className="discovery-result discovery-music-result";const name=document.createElement("strong");name.className="discovery-title";name.textContent=item.title||"Без названия";card.append(name);const controls=document.createElement("div");controls.className="discovery-music-actions";const playButton=document.createElement("button");playButton.type="button";playButton.className="discovery-follow";playButton.textContent="▶ ПЛЕЙ";playButton.addEventListener("click",async()=>{playButton.disabled=true;try{if(!window.FloustreamPlayer)throw new Error("Плеер пока недоступен");const signed=await client.storage.from("music-public").createSignedUrl(item.object_path,3600);if(signed.error)throw signed.error;window.FloustreamPlayer.playQueue([{id:item.id,title:item.title||"Без названия",url:signed.data.signedUrl,visibility:"public"}],0);}catch(error){playButton.textContent="Ошибка";playButton.title=error.message;}finally{playButton.disabled=false;}});const addButton=document.createElement("button");addButton.type="button";addButton.className="discovery-follow";addButton.textContent="＋ Добавить";addButton.addEventListener("click",async(event)=>{event.preventDefault();event.stopPropagation();addButton.disabled=true;try{const signed=await client.storage.from("music-public").createSignedUrl(item.object_path,3600);if(signed.error)throw signed.error;if(!window.FloustreamPlayer?.addToQueue)throw new Error("Функция плейлиста пока недоступна");window.FloustreamPlayer.addToQueue({id:item.id,title:item.title||"Без названия",url:signed.data.signedUrl,visibility:"public"});addButton.textContent="✓ Добавлено";}catch(error){addButton.textContent="Ошибка";addButton.title=error.message;}finally{addButton.disabled=false;}});controls.append(playButton,addButton);card.append(controls);results.append(card);}else{const owner=users.get(item.user_id||item.owner_id);const author=owner?.display_name||owner?.username||"Пользователь";resultRow(results,{name:item.title||item.file_name||"Без названия",sub:"Видео · "+author,avatar:owner?.avatar_url});}count++;}}
   if(!count)status(results,"Ничего не найдено. Попробуй другой запрос.");
  }catch(error){status(results,"Не удалось выполнить поиск: "+error.message);}finally{busy=false;}
 }
 function showProfilePreview(profile){const name=profile.display_name||profile.username||"Пользователь";status(results,"");const card=document.createElement("article");card.className="discovery-result";card.append(avatarNode(profile.avatar_url,name));const copy=document.createElement("div");copy.className="discovery-copy";const h=document.createElement("strong");h.className="discovery-title";h.textContent=name;const p=document.createElement("span");p.className="discovery-subtitle";p.textContent=(profile.username?"@"+profile.username+" · ":"")+(profile.bio||"Профиль FLOUSTREAM");copy.append(h,p);card.append(copy);const back=document.createElement("button");back.type="button";back.className="discovery-follow";back.textContent="Назад";back.addEventListener("click",()=>{queryInput.value=lastQuery;runSearch();});card.append(back);results.prepend(card);}
 async function loadRecommendations(){
  if(!client||!user)return;status(recommendationResults,"Подбираем людей на основе открытой активности…");
  try{
   const [follows,posts]=await Promise.all([client.from("follows").select("following_id").eq("follower_id",user.id),client.from("posts").select("user_id,created_at").order("created_at",{ascending:false}).limit(100)]);
   if(follows.error)throw follows.error;if(posts.error)throw posts.error;
   const excluded=new Set([user.id,...(follows.data||[]).map(x=>x.following_id)]);
   const scores=new Map();(posts.data||[]).forEach(post=>{if(!excluded.has(post.user_id))scores.set(post.user_id,(scores.get(post.user_id)||0)+1);});
   let ids=[...scores.entries()].sort((a,b)=>b[1]-a[1]).slice(0,15).map(x=>x[0]);
   if(!ids.length){const recent=await client.from("profiles").select("id").neq("id",user.id).order("created_at",{ascending:false}).limit(12);if(recent.error)throw recent.error;ids=(recent.data||[]).map(x=>x.id).filter(id=>!excluded.has(id));}
   recommendationResults.replaceChildren();const heading=document.createElement("h3");heading.className="discovery-section-title";heading.textContent="Люди, за которыми может быть интересно следить";recommendationResults.append(heading);
   if(!ids.length){const e=document.createElement("div");e.className="discovery-empty";e.textContent="Пока мало открытой активности для рекомендаций. Загляни сюда чуть позже.";recommendationResults.append(e);return;}
   const profiles=await client.from("profiles").select("id,username,display_name,bio,avatar_url").in("id",ids);if(profiles.error)throw profiles.error;
   const byId=new Map((profiles.data||[]).map(p=>[p.id,p]));
   ids.forEach(id=>{const p=byId.get(id);if(!p)return;const name=p.display_name||p.username||"Пользователь";resultRow(recommendationResults,{name,sub:(p.username?"@"+p.username+" · ":"")+(p.bio||"Активный участник FLOUSTREAM"),avatar:p.avatar_url,buttonText:"Подписаться",action:async event=>{}});const row=recommendationResults.lastElementChild,button=row.querySelector("button");button.addEventListener("click",async()=>{button.disabled=true;try{const existing=await client.from("follows").select("id").eq("follower_id",user.id).eq("following_id",id).maybeSingle();if(existing.error)throw existing.error;if(!existing.data){const added=await client.from("follows").insert({follower_id:user.id,following_id:id});if(added.error)throw added.error;}button.textContent="Вы подписаны";}catch(error){button.textContent="Повторить";button.disabled=false;button.title=error.message;}});});
   if(!recommendationResults.querySelector(".discovery-result")){const e=document.createElement("div");e.className="discovery-empty";e.textContent="Пока нет подходящих рекомендаций.";recommendationResults.append(e);}
  }catch(error){status(recommendationResults,"Не удалось загрузить рекомендации: "+error.message);}
 }
 window.openFloustreamDiscovery=openDiscovery;
})();


(()=>{
 const palette=[
  ["#ff4fd8","#9b1dff"],["#39e7ff","#0879ff"],["#ffe45e","#ff8a00"],
  ["#75ff6b","#00b86b"],["#ff668a","#d91b65"],["#b58cff","#6b35e8"],
  ["#f7fbff","#4f8dff"],["#ff9f43","#ef3d92"],["#65ffd5","#00a9a0"]
 ];
 const letters=[...root.querySelectorAll(".author-label span")];
 if(!letters.length)return;
 const paint=()=>letters.forEach(letter=>{
  let pick=Math.floor(Math.random()*palette.length);
  if(String(pick)===letter.dataset.palette)pick=(pick+1+Math.floor(Math.random()*(palette.length-1)))%palette.length;
  const [bright,deep]=palette[pick];
  letter.dataset.palette=String(pick);
  letter.style.setProperty("--author-color",bright);
  letter.style.setProperty("--author-deep",deep);
 });
 paint();
 profileInterval(paint,950);
})();


function openAuthorHub(){
 const hub=root.querySelector("#"+"author-hub");
 if(!hub)return;
 hub.hidden=false;
 document.body.style.overflow="hidden";
}
function closeAuthorHub(){
 const hub=root.querySelector("#"+"author-hub");
 if(hub)hub.hidden=true;
 document.body.style.overflow="";
}
(()=>{
 const hub=root.querySelector("#"+"author-hub");
 if(!hub)return;
 root.querySelector("#"+"author-hub-back").addEventListener("click",closeAuthorHub);
 root.querySelector("#"+"author-hub-close").addEventListener("click",closeAuthorHub);
 root.querySelector("#"+"author-photos-banner").addEventListener("click",async(event)=>{
  if(!event.target.closest(".author-banner-tap"))return;
  closeAuthorHub();
  await openProfilePhotoAlbum();
 });
 root.querySelector("#"+"author-videos-banner").addEventListener("click",(event)=>{
  if(!event.target.closest(".author-banner-tap"))return;
  closeAuthorHub();
  openProfileVideoAlbum();
 });
 root.querySelector("#"+"author-editor-banner").addEventListener("click",(event)=>{
  if(!event.target.closest(".author-banner-tap"))return;
  root.querySelector("#"+"author-hub-hint").textContent="Video Editor подключим следующим этапом.";
 });
 const loopsPage=root.querySelector("#"+"loops-page");
 root.querySelector("#"+"author-loops-banner").addEventListener("click",(event)=>{
  if(!event.target.closest(".author-banner-tap"))return;
  closeAuthorHub();
  loopsPage.hidden=false;
  document.body.style.overflow="hidden";
 });
 root.querySelector("#"+"loops-page-back").addEventListener("click",()=>{
  loopsPage.hidden=true;
  openAuthorHub();
 });
 const stage=root.querySelector("#"+"author-hub-stage");
 const slides=[...stage.querySelectorAll(".author-banner")];
 const dots=[...root.querySelectorAll("#author-hub-dots span")];
 let dotFrame=0;
 const syncDots=()=>{
  const stageRect=stage.getBoundingClientRect();
  const center=stageRect.left+stage.clientWidth/2;
  let active=0,best=Infinity;
  slides.forEach((slide,index)=>{
   const rect=slide.getBoundingClientRect();
   const distance=Math.abs(rect.left+rect.width/2-center);
   if(distance<best){best=distance;active=index;}
  });
  dots.forEach((dot,index)=>dot.classList.toggle("active",index===active));
 };
 stage.addEventListener("scroll",()=>{
  if(dotFrame)cancelAnimationFrame(dotFrame);
  dotFrame=requestAnimationFrame(syncDots);
 },{passive:true});
 dots.forEach((dot,index)=>dot.addEventListener("click",()=>{
  const first=slides[0],target=slides[index];
  if(!first||!target)return;
  stage.scrollTo({left:Math.max(0,target.offsetLeft-first.offsetLeft),behavior:"smooth"});
 }));
 hub.addEventListener("click",event=>{if(event.target===hub)closeAuthorHub();});
 document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!hub.hidden)closeAuthorHub();},{signal});
})();


  const cleanup = async () => {
    videoAlbumDisposed = true;
    photoAlbumDisposed = true;
    try { videoAlbumController?.dispose(); } catch (_) {}
    try { photoAlbumController?.dispose(); } catch (_) {}
    if (typeof persistDolbyActivity === "function") {
      try { await persistDolbyActivity(); } catch (_) {}
    }
    if (typeof dolbyOnlineChannel !== "undefined" && dolbyOnlineChannel && client) {
      try { await dolbyOnlineChannel.untrack(); } catch (_) {}
      try { await client.removeChannel(dolbyOnlineChannel); } catch (_) {}
      dolbyOnlineChannel = null;
    }
    if (typeof dolbyPresenceActive !== "undefined") dolbyPresenceActive = false;
    if (typeof dolbyOnlineUsers !== "undefined" && typeof user !== "undefined" && user?.id) dolbyOnlineUsers.delete(user.id);
    for (const [id, kind] of profileTimerKinds) {
      if (kind === "interval") window.clearInterval(id);
      else window.clearTimeout(id);
    }
    profileTimerKinds.clear();
    profileObservers.forEach(observer => { try { observer.disconnect(); } catch (_) {} });
    if (window.albumThumbObserver) {
      try { window.albumThumbObserver.disconnect(); } catch (_) {}
      delete window.albumThumbObserver;
    }
const ownsRoot = !!root.querySelector(".fs-route-profile");
    if (ownsRoot) {
      document.body.style.cssText = originalBodyStyle || "";
      document.body.className = originalBodyClass;
      if (originalTheme === undefined) delete document.body.dataset.theme;
      else document.body.dataset.theme = originalTheme;
      root.replaceChildren();
    }
    style?.remove();
  };

  await stylePromise;
  if (!signal.aborted) root.style.visibility = originalRootVisibility;
  return cleanup;
}
