const STYLE = "\n.fs-route-public-profile{color-scheme:dark;--bg:#090910;--panel:#15121f;--line:#382b4b;--purple:#a66bff;--muted:#aaa0ba;--text:#f5f0ff}\n*{box-sizing:border-box}\n.fs-route-public-profile{margin:0;min-height:100vh;background:radial-gradient(ellipse at 20% 0%,#281342 0,transparent 38%),var(--bg);color:var(--text);font-family:Arial,sans-serif}\n.topbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px max(calc((100% - 900px)/2),16px);border-bottom:1px solid var(--line);background:#0b0a12ed;backdrop-filter:blur(12px)}\n.logo{font-size:20px;font-weight:900;letter-spacing:3px;color:#e9d8ff;text-shadow:0 0 18px #7b4bff}\n.topbar a,.topbar button{border:1px solid #65458a;border-radius:12px;background:#21172f;color:#eee2ff;padding:10px 13px;text-decoration:none;font-size:13px}\n.wrap{width:min(900px,100%);margin:24px auto;padding:0 16px}\n.profile{overflow:hidden;border:1px solid #49345f;border-radius:20px;background:linear-gradient(145deg,#171321,#0e0d16);box-shadow:0 12px 45px #0007}\n.cover{height:170px;background:radial-gradient(ellipse at 72% 30%,#a34bff66 0,transparent 34%),linear-gradient(125deg,#090912,#21102f 55%,#111b35)}\n.identity{display:flex;align-items:end;gap:16px;margin:-46px 22px 0;position:relative}\n.avatar{width:100px;height:100px;flex:0 0 100px;display:grid;place-items:center;overflow:hidden;border:3px solid #171321;border-radius:50%;background:#352044;font-size:32px;font-weight:700;box-shadow:0 0 18px #a66bff55}\n.avatar img{width:100%;height:100%;object-fit:cover}.avatar.has-original{cursor:zoom-in}.avatar.has-original:focus-visible{outline:3px solid #c5a4ff;outline-offset:4px}\n.name{min-width:0;padding-bottom:7px}.name h1{margin:0 0 5px;font-size:clamp(21px,4vw,29px);overflow-wrap:anywhere}.name p{margin:0;color:#c59aff;font-size:13px}\n.bio{margin:16px 22px 22px;color:#c9c0d8;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}\n.feed-section{margin-top:24px}.feed-title{margin:0 0 14px;font-size:19px}\n.feed{display:flex;flex-direction:column;gap:12px}\n.post{padding:16px;overflow:hidden;border:1px solid var(--line);border-radius:16px;background:linear-gradient(145deg,#191625,#101019)}\n.post-author-label{margin-bottom:2px;color:#a99bbd;font-size:10px;letter-spacing:.04em;text-transform:uppercase}\n.flow-banner{display:flex;align-items:center;gap:8px;margin:0 0 12px;padding:8px 11px;border:1px solid #63477f;border-radius:10px;background:linear-gradient(100deg,#281936,#171321);color:#d9baff;font-size:11px;font-weight:700}\n.flow-banner:before{content:\"↗\";display:grid;place-items:center;width:19px;height:19px;border-radius:50%;background:#593477;color:#fff;font-size:13px}\n.post-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}\n.post-avatar{width:40px;height:40px;flex:0 0 40px;display:grid;place-items:center;overflow:hidden;border-radius:50%;background:#302044;font-weight:700}\n.post-avatar img{width:100%;height:100%;object-fit:cover}\n.post-author{font-size:14px;font-weight:700}.post-date{margin-top:4px;color:var(--muted);font-size:11px}\n.post-content{color:#e9e4f2;font-size:14px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}\n.post-media{display:grid;gap:10px;margin-top:12px}.post-media img,.post-media video{display:block;width:100%;max-height:520px;object-fit:contain;border-radius:12px;background:#090910}.post-photo-open{display:block;position:relative;width:100%;margin:0;padding:0;overflow:hidden;border:1px solid #49385e;border-radius:12px;background:#090910;cursor:zoom-in;touch-action:manipulation;-webkit-tap-highlight-color:transparent;line-height:0}.post-photo-open img{display:block;width:100%;height:auto;max-height:520px;object-fit:contain;border-radius:11px;transition:filter .15s ease,transform .15s ease}.post-photo-open:active,.post-photo-open:focus-visible{outline:none;border-color:#c18aff;box-shadow:0 0 0 2px #a66bff66,0 0 18px #a66bff55}.post-photo-open:active img{filter:brightness(.88);transform:scale(.995)}.post-media audio{width:100%}\n.post-actions{display:flex;align-items:center;gap:10px;margin-top:14px;padding-top:11px;border-top:1px solid #342943}\n.flow-button{display:inline-flex;align-items:center;gap:7px;padding:8px 13px;border:1px solid #59436f;border-radius:999px;background:linear-gradient(135deg,#21192d,#15111e);color:#e5d4ff;font-size:12px;font-weight:800;letter-spacing:1px}\n.flow-button.active{border-color:#c18aff;background:linear-gradient(135deg,#49265f,#21152f);box-shadow:0 0 12px #a66bff38}\n.flow-button:disabled{opacity:.55}\n.status,.empty{padding:20px;text-align:center;color:var(--muted);line-height:1.6}\n.post-social-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px;padding-top:11px;border-top:1px solid #342943}\n.post-social-button{min-height:36px;padding:7px 11px;border:1px solid #49385e;border-radius:11px;background:#171321;color:#e9ddff;font-size:12px}\n.post-social-button.is-active{border-color:#b879ff;background:linear-gradient(135deg,#42245d,#21162f);color:#fff;box-shadow:0 0 12px #a66bff30}\n.post-reaction-wrap{position:relative;display:inline-flex}\n.post-reaction-picker{position:absolute;left:0;bottom:calc(100% + 9px);z-index:15;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;width:min(306px,calc(100vw - 58px));padding:9px;border:1px solid #7952a0;border-radius:15px;background:rgba(18,14,28,.98);box-shadow:0 12px 36px #000b}\n.post-reaction-picker[hidden],.post-comments-panel[hidden]{display:none}\n.post-reaction-option{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:0;min-height:49px;padding:5px 2px;border:1px solid #3c304d;border-radius:10px;background:#171321;color:#f5eaff}\n.post-reaction-option .reaction-emoji{font-size:21px;line-height:1.15}\n.post-reaction-option .reaction-count{font-size:10px;color:#b9a8cc}\n.post-reaction-option.is-active{border-color:#c18aff;background:linear-gradient(145deg,#42245d,#21162f)}\n.post-comments-panel{margin-top:12px;padding:12px;border:1px solid #49385e;border-radius:13px;background:#100e18}\n.post-comments-header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;color:#e9ddff;font-size:13px;font-weight:700}\n.post-comments-close{padding:6px 9px;border-radius:9px;font-size:11px}\n.post-comments-list{display:grid;gap:9px;max-height:300px;overflow:auto}\n.post-comment{padding:9px;border:1px solid #302640;border-radius:10px;background:#171321;font-size:12px;line-height:1.5;overflow-wrap:anywhere}\n.post-comment strong{display:block;margin-bottom:3px;color:#d9baff}\n.post-comment time{display:block;margin-top:5px;color:#8f849f;font-size:10px}\n.post-comment-form{display:grid;gap:8px;margin-top:10px}\n.post-comment-form textarea{width:100%;min-height:58px;resize:vertical;padding:10px;border:1px solid #49385e;border-radius:10px;background:#090811;color:#fff;font:inherit;font-size:13px}\n.post-comment-form button{justify-self:end;padding:8px 13px;border:1px solid #7952a0;border-radius:10px;background:#39204f;color:#fff;font-size:12px}\n.post-comment-note{margin-top:8px;color:#bda6d8;font-size:11px;line-height:1.5;overflow-wrap:anywhere}\n.post-social-button:disabled,.post-reaction-option:disabled,.post-comment-form button:disabled{opacity:.5}\n\n.photo-lightbox{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;box-sizing:border-box;padding:clamp(12px,3vw,24px);background:rgba(0,0,0,.96);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);touch-action:manipulation}\n.photo-lightbox.is-open{display:flex}\n.photo-lightbox img{display:block;box-sizing:border-box;width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain;border:2px solid #bd78ff;border-radius:8px;box-shadow:0 0 0 1px #f0d7ff66,0 0 18px #a64dffb3,0 0 42px #7628d966;background:#090910}\n.photo-lightbox-close{position:absolute;top: max(12px,env(safe-area-inset-top));right: max(12px,env(safe-area-inset-right));z-index:2;width:34px;height:34px;padding:0;border:1px solid #ffffff55;border-radius:50%;background:rgba(30,25,38,.48);color:#fff;font-size:23px;font-weight:300;line-height:30px;display:grid;place-items:center;backdrop-filter:blur(6px);cursor:pointer}\n.photo-lightbox-close:active{background:rgba(100,70,130,.7)}\n.fs-route-public-profile.lightbox-open{overflow:hidden}\n.avatar-photo-actions{position:absolute;left:50%;bottom:max(18px,env(safe-area-inset-bottom));z-index:3;display:flex;align-items:center;gap:12px;max-width:calc(100vw - 28px);padding:10px 13px;border:1px solid #7952a0;border-radius:16px;background:rgba(18,14,28,.94);box-shadow:0 8px 30px #0009;transform:translateX(-50%);backdrop-filter:blur(12px)}\n.avatar-photo-actions[hidden]{display:none}\n.avatar-photo-like-summary{display:grid;gap:3px;min-width:88px;color:#e9ddff;font-size:12px}\n#avatar-photo-like-note{color:#bda6d8;font-size:10px}\n.avatar-photo-like{min-height:40px;padding:8px 14px;border:1px solid #7952a0;border-radius:12px;background:linear-gradient(135deg,#39204f,#21152f);color:#fff;font-size:13px;font-weight:700;white-space:nowrap}\n.avatar-photo-like.liked{border-color:#e88bff;background:linear-gradient(135deg,#6a286f,#3a1c50);box-shadow:0 0 14px #c15bff55}\n.avatar-photo-like:disabled{opacity:.55}\n@media(max-width:480px){.avatar-photo-actions{gap:8px;padding:8px 10px}.avatar-photo-like{min-height:38px;padding:7px 11px}}\n\n.error{color:#ffb4c0}\n@media(max-width:600px){.topbar{padding:10px 12px}.logo{font-size:17px}.wrap{margin:14px auto;padding:0 10px}.cover{height:130px}.identity{margin:-39px 14px 0;gap:12px}.avatar{width:82px;height:82px;flex-basis:82px}.bio{margin:14px}.post{border-radius:0;border-left:0;border-right:0}.feed{gap:0}.post+.post{border-top:0}}\n/* FLOUSTREAM slide navigation */\n.quick-nav{display:none!important}\n.drawer-menu-button{position:fixed;z-index:83;left:14px;top:15px;width:44px;height:44px;display:grid;place-items:center;padding:0;border:1px solid #704b91;border-radius:14px;background:linear-gradient(145deg,#21152ff2,#100d19f2);box-shadow:0 0 16px #8d50e733,inset 0 0 12px #9b5bd511;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:1;transform:scale(1);visibility:visible;transition:opacity .18s ease,transform .18s ease,visibility .18s}\n.drawer-menu-button.is-hidden{opacity:0;transform:scale(.78);visibility:hidden;pointer-events:none}\n.sound-signal{display:flex;align-items:center;justify-content:center;gap:3px;width:22px;height:22px}\n.sound-signal i{display:block;width:3px;border-radius:3px;background:linear-gradient(180deg,#e9d5ff,#a66bff);box-shadow:0 0 7px #b879ff99}\n.sound-signal i{transform-origin:center;animation:signalEqualizer .78s ease-in-out infinite alternate}\n.sound-signal i:nth-child(1){height:8px;animation-delay:-.62s}\n.sound-signal i:nth-child(2){height:16px;animation-delay:-.38s}\n.sound-signal i:nth-child(3){height:21px;animation-delay:-.12s}\n.sound-signal i:nth-child(4){height:12px;animation-delay:-.5s}\n.sound-signal i:nth-child(5){height:6px;animation-delay:-.27s}\n@keyframes signalEqualizer{0%{transform:scaleY(.28);opacity:.68}100%{transform:scaleY(1);opacity:1}}\n@media(prefers-reduced-motion:reduce){.sound-signal i{animation:none}}\n.drawer-edge{position:fixed;z-index:81;left:0;top:0;bottom:0;width:22px;touch-action:pan-y}\n.drawer-backdrop{position:fixed;z-index:80;inset:0;background:#030209;opacity:0;pointer-events:none;transition:opacity .18s}\n.drawer-backdrop.visible{pointer-events:auto}\n.side-drawer{display:flex;flex-direction:column;--drawer-x:-100%;position:fixed;z-index:82;left:0;top:0;bottom:0;width:min(82vw,320px);padding:22px 16px max(22px,env(safe-area-inset-bottom));overflow-y:auto;overscroll-behavior:contain;background:linear-gradient(160deg,#1b1428,#0c0b14 72%);border-right:1px solid #8054aa;box-shadow:12px 0 42px #0009;transform:translate3d(var(--drawer-x),0,0);transition:transform .24s cubic-bezier(.2,.8,.2,1);will-change:transform;touch-action:pan-y}\n.side-drawer.dragging{transition:none}\n.side-drawer-head{display:flex;align-items:center;justify-content:space-between;margin:2px 2px 24px}\n.side-drawer-logo{font-size:21px;font-weight:900;letter-spacing:3px;color:#f5eaff;text-shadow:0 0 18px #9b55ff}\n.side-drawer-close{width:36px;height:36px;padding:0;border-radius:11px;background:#21172f;font-size:20px}\n.side-drawer-caption{margin:0 8px 9px;color:#8f83a5;font-size:10px;letter-spacing:1.5px;text-transform:uppercase}\n.side-drawer-links{display:grid;gap:7px}\n.side-drawer-link{display:flex;align-items:center;gap:13px;width:100%;min-height:49px;padding:10px 13px;border:1px solid transparent;border-radius:12px;background:transparent;color:#e9ddff;text-align:left;font-size:14px}\n.side-drawer-link:active,.side-drawer-link.active{background:linear-gradient(100deg,#392052aa,#1b1429);border-color:#68458d}\n.side-drawer-icon{width:23px;text-align:center;color:#c18aff;font-size:18px}\n.side-drawer-divider{height:1px;margin:17px 4px;background:#33283f}\n.nav-history{margin:13px 4px 2px;padding:11px 9px 10px;border:1px solid #342541;border-radius:13px;background:#110e19aa}\n.nav-history .side-drawer-caption{margin:0 0 8px 2px}\n.nav-history-items{display:grid;gap:6px}\n.nav-profile-visits{display:grid;gap:6px;margin:0 0 7px}.nav-profile-visit{display:flex;align-items:center;gap:9px;min-height:42px;padding:6px 8px;border:1px solid #352744;border-radius:9px;background:#1b1525;color:#e8dcf8;text-decoration:none;overflow:hidden}.nav-profile-visit:active{background:#352044}.nav-profile-visit-avatar{width:29px;height:29px;flex:0 0 29px;border-radius:50%;object-fit:cover;background:#30213e}.nav-profile-visit-copy{display:grid;min-width:0;gap:2px}.nav-profile-visit-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:650}.nav-profile-visit-time{color:#9586a8;font-size:10px}\n.nav-history-item{display:flex;align-items:center;gap:9px;width:100%;min-height:37px;padding:7px 8px;border:1px solid #352744;border-radius:9px;background:#1b1525;color:#d9c8f2;text-align:left;font-size:12px;overflow:hidden}\n.nav-history-item:active{background:#352044}\n.nav-history-item .side-drawer-icon{width:19px;font-size:15px}\n.nav-history-empty{padding:5px 2px;color:#81758f;font-size:11px}\n\n\n/* Drawer search menu */\n.drawer-search{margin:12px 4px 2px}\n.drawer-search-toggle{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:46px;padding:10px 13px;border:1px solid #654586;border-radius:12px;background:linear-gradient(110deg,#342044,#1a1426);color:#f0e4ff;font-size:14px;font-weight:700;box-shadow:0 5px 18px #0003;transition:border-color .18s,background .18s}\n.drawer-search-toggle:active,.drawer-search-toggle[aria-expanded=\"true\"]{border-color:#b17bea;background:linear-gradient(110deg,#492966,#241831)}\n.drawer-search-toggle .drawer-search-chevron{margin-left:auto;color:#bd8aff;transition:transform .18s}\n.drawer-search-toggle[aria-expanded=\"true\"] .drawer-search-chevron{transform:rotate(180deg)}\n.drawer-search-options{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}\n.drawer-search-options[hidden]{display:none}\n.drawer-search-option{display:flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:8px 6px;border:1px solid #49345f;border-radius:10px;background:#15101f;color:#e6d5fb;font-size:12px;font-weight:600}\n.drawer-search-option:active{background:#38214e;border-color:#9d69cf}\n.drawer-search-option span{font-size:16px;color:#c18aff}\n.side-drawer-foot{margin:22px 8px 0;color:#756b87;font-size:11px;line-height:1.5}\n@media(prefers-reduced-motion:reduce){.drawer-backdrop,.side-drawer{transition:none}}\n\n\n\n/* Unified FLOUSTREAM profile appearance */\n.fs-route-public-profile{background:radial-gradient(ellipse at 15% 0%,#281342 0,transparent 38%),#090910;color:#f7f4ff}\n.wrap{max-width:960px;margin:22px auto;padding:0 16px}\n.profile{border:1px solid #49345f;border-radius:22px;background:linear-gradient(145deg,#171321,#0e0d16);box-shadow:0 12px 45px #0007,0 0 28px #7d3fba12}\n.cover{height:210px;position:relative;overflow:hidden;background:radial-gradient(ellipse at 72% 30%,#a34bff66 0,transparent 34%),radial-gradient(ellipse at 22% 80%,#4626a966 0,transparent 42%),linear-gradient(125deg,#090912 5%,#21102f 48%,#111b35 100%)}\n.cover-photo{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;object-position:center;z-index:0}\n.cover-photo[hidden]{display:none}\n.cover:before{content:\"\";position:absolute;inset:0;z-index:1;background:linear-gradient(110deg,#09091022,#09091044);pointer-events:none}\n.cover:after{content:\"FLOUSTREAM\";position:absolute;right:22px;bottom:16px;z-index:2;font-size:clamp(24px,6vw,44px);font-weight:900;letter-spacing:.18em;color:#ffffff12;text-shadow:0 0 25px #a45bff55;pointer-events:none}\n.identity{align-items:flex-end;gap:18px;margin:-56px 22px 0}\n.avatar{width:124px;height:124px;position:relative;isolation:isolate;flex:0 0 124px;border:3px solid #b879e8;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#6336a3,#17152b);box-shadow:0 0 0 1px #e3c8ff66,0 0 7px #b879ff88,0 0 16px #9b55ff66;animation:avatarFrameGlow 3.4s ease-in-out infinite}\n.avatar img{position:absolute;inset:0;display:block;width:100%;height:100%;min-width:100%;min-height:100%;object-fit:cover;object-position:center;border-radius:50%}\n.name{padding-bottom:10px}\n.name h1{font-size:clamp(22px,4vw,30px);letter-spacing:.01em}\n.name p{color:#c59aff}.name .profile-presence{margin-top:5px;color:#a99bbd;font-size:11px}.profile-presence .dolby-online-indicator{margin:0 7px 0 0}.dolby-online-indicator{position:relative;display:inline-block;vertical-align:middle;width:8px;height:8px;border-radius:50%;background:#69ffd1;box-shadow:0 0 0 1px #b7ffe9,0 0 8px #4effc5,0 0 15px #936bff;animation:dolbyPublicPulse 1.8s ease-in-out infinite}.dolby-online-indicator:after{content:\"\";position:absolute;inset:-5px;border:1px solid #a66bff;border-radius:50%;opacity:0;animation:dolbyPublicRing 1.8s ease-out infinite}@keyframes dolbyPublicPulse{0%,100%{filter:brightness(.9)}50%{filter:brightness(1.45)}}@keyframes dolbyPublicRing{0%{transform:scale(.55);opacity:.75}85%,100%{transform:scale(1.8);opacity:0}}\n.bio{margin:16px 22px 22px;max-width:650px;color:#c9c0d8}\n.feed-section{margin-top:24px}\n.feed-title{font-size:19px}\n.post{border:1px solid #302b43;border-radius:16px;background:linear-gradient(145deg,#191625,#101019);box-shadow:0 8px 26px #0003}\n.post-media img,.post-media video{max-height:520px;object-fit:contain}\n@media(max-width:600px){.wrap{margin:14px auto;padding:0 11px}.cover{height:158px}.profile{padding:0 15px 18px}.identity{gap:12px;margin:-43px 14px 0}.avatar{width:96px;height:96px;flex-basis:96px}.name{padding-bottom:6px}.bio{margin:14px}.post{border-radius:0;border-left:0;border-right:0}.feed{gap:0}.post+.post{border-top:0}}\n@keyframes avatarFrameGlow{0%,100%{box-shadow:0 0 0 1px #e3c8ff44,0 0 5px #a66bff66,0 0 12px #8d50e733}50%{box-shadow:0 0 0 1px #f0dcff88,0 0 9px #c18aff99,0 0 22px #9b55ff77,0 0 30px #7b3fc933}}}\n\n/* Dolby404: единая геометрия и оформление аватара на обеих страницах */\n.avatar{\n box-sizing:border-box!important;\n width:124px!important;\n height:124px!important;\n min-width:124px!important;\n min-height:124px!important;\n flex:0 0 124px!important;\n aspect-ratio:1/1;\n border:3px solid #b879e8;\n border-radius:50%!important;\n overflow:hidden;\n position:relative;\n isolation:isolate;\n display:block;\n background:linear-gradient(135deg,#6336a3,#17152b);\n box-shadow:0 0 0 1px #e3c8ff66,0 0 7px #b879ff88,0 0 16px #9b55ff66;\n animation:avatarFrameGlow 3.4s ease-in-out infinite;\n z-index:2;\n}\n.avatar img{\n box-sizing:border-box;\n position:absolute;\n inset:0;\n display:block;\n width:100%;\n height:100%;\n min-width:100%;\n min-height:100%;\n max-width:none;\n max-height:none;\n object-fit:cover;\n object-position:center;\n border-radius:50%!important;\n margin:0;\n}\n@media(max-width:600px){\n .avatar{\n  width:96px!important;\n  height:96px!important;\n  min-width:96px!important;\n  min-height:96px!important;\n  flex:0 0 96px!important;\n }\n}\n\n/* FLOUSTREAM contact CTA — slow glossy shimmer + flowing gradient */\n.contact-cta{position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;width:calc(100% - 44px);max-width:650px;min-height:62px;margin:0 22px 22px;padding:14px 20px;overflow:hidden;border:1px solid #c5a0ff;border-radius:17px;background:linear-gradient(112deg,#5425a8 0%,#843fe0 28%,#4c36bd 58%,#252b75 100%);background-size:220% 100%;animation:contactCtaColors 9s ease-in-out infinite;color:#fff;text-decoration:none;text-align:center;font-size:16px;font-weight:850;letter-spacing:.035em;text-shadow:0 1px 8px #1c0b42aa;box-shadow:inset 0 1px 1px #ffffff80,inset 0 -4px 12px #160b493d,0 8px 25px #54218a66,0 0 22px #a66bff35;transition:transform .18s ease,filter .18s ease,border-color .18s ease}\n.contact-cta::before{content:\"\";position:absolute;z-index:1;top:-65%;left:-48%;width:34%;height:230%;transform:translateX(-220%) rotate(24deg);background:linear-gradient(90deg,transparent 0%,#ffffff20 25%,#ffffffc9 48%,#ffffff65 58%,transparent 100%);filter:blur(2px);animation:contactCtaShine 7s ease-in-out infinite;pointer-events:none}\n.contact-cta::after{content:\"\";position:absolute;z-index:0;inset:1px;border-radius:15px;background:linear-gradient(180deg,#ffffff20,transparent 48%,#09052c22);pointer-events:none}\n.contact-cta-label{position:relative;z-index:2}\n.contact-cta:active{transform:scale(.985);filter:brightness(1.18)}\n.contact-cta:focus-visible{outline:2px solid #e6d5ff;outline-offset:4px}\n@keyframes contactCtaColors{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}\n@keyframes contactCtaShine{0%,18%{transform:translateX(-220%) rotate(24deg);opacity:0}28%{opacity:1}66%{transform:translateX(520%) rotate(24deg);opacity:.9}78%,100%{transform:translateX(520%) rotate(24deg);opacity:0}}\n@media(prefers-reduced-motion:reduce){.contact-cta{animation:none}.contact-cta::before{animation:none;opacity:.35;transform:translateX(90%) rotate(24deg)}}\n@media(max-width:600px){.contact-cta{width:calc(100% - 28px);margin:0 14px 18px;min-height:58px}}\n\n.profile-actions{display:flex;gap:10px;width:calc(100% - 44px);max-width:650px;margin:0 22px 12px}\n.profile-actions[hidden]{display:none}.profile-actions .contact-cta{width:auto;max-width:none;min-width:0;flex:1;margin:0;padding:12px 10px;min-height:58px;font-size:14px}\n.friend-cta{position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;gap:7px;flex:1;min-width:0;min-height:58px;padding:12px 10px;overflow:hidden;border:1px solid #9b79d1;border-radius:17px;background:linear-gradient(125deg,#282044,#3b2860 55%,#20294f);box-shadow:inset 0 1px 1px #ffffff30,0 7px 20px #3d236b55,0 0 18px #8d62d733;color:#f4eaff;font-size:14px;font-weight:850;cursor:pointer;transition:transform .18s ease,filter .18s ease}\n.friend-cta span:first-child{font-size:17px;color:#d9b9ff}\n.friend-cta:active{transform:scale(.985);filter:brightness(1.18)}.friend-cta:disabled{opacity:.65;cursor:default}\n.friend-action-status{min-height:16px;margin:-5px 22px 16px;text-align:center;color:#c7a4ed;font-size:11px}\n@media(max-width:440px){.profile-actions{gap:7px}.profile-actions .contact-cta,.friend-cta{font-size:12px;padding:10px 7px;min-height:54px}}\n\n.public-albums{display:grid;gap:18px;margin:18px 0 24px;padding:18px;border:1px solid #382b4b;border-radius:18px;background:linear-gradient(145deg,#191625,#101019)}\n.public-album-section[hidden],.public-albums[hidden]{display:none!important}\n.public-album-title{margin:0 0 12px;color:#f2e9ff;font-size:18px}\n.public-album-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:10px}\n.public-album-photo{display:block;width:100%;aspect-ratio:1/1;padding:0;overflow:hidden;border:1px solid #62458b;border-radius:12px;background:#100d19;cursor:pointer}\n.public-album-photo img{display:block;width:100%;height:100%;object-fit:cover}\n.public-album-video{min-width:0;overflow:hidden;border:1px solid #49385e;border-radius:12px;background:#100d19}\n.public-album-video video{display:block;width:100%;aspect-ratio:4/5;object-fit:contain;background:#050509}\n.public-album-video-name{padding:7px 9px;color:#cfc2e4;font-size:11px;overflow-wrap:anywhere}\n@media(max-width:480px){.public-albums{padding:13px}.public-album-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}}\n";
const MARKUP = "<section class=\"fs-route-public-profile\">\n<button type=\"button\" class=\"drawer-menu-button\" id=\"drawer-menu-button\" aria-label=\"Открыть меню\" aria-controls=\"side-drawer\" aria-expanded=\"false\"><span class=\"sound-signal\" aria-hidden=\"true\"><i></i><i></i><i></i><i></i><i></i></span></button>\n<div class=\"drawer-edge\" id=\"drawer-edge\" aria-hidden=\"true\"></div><div class=\"drawer-backdrop\" id=\"drawer-backdrop\"></div>\n<aside class=\"side-drawer\" id=\"side-drawer\" aria-label=\"Навигация FLOUSTREAM\" aria-hidden=\"true\">\n <div class=\"drawer-shell\"><div class=\"side-drawer-head\"><div class=\"side-drawer-logo\">FLOUSTREAM</div><button type=\"button\" class=\"side-drawer-close\" id=\"drawer-close\" aria-label=\"Закрыть меню\">×</button></div>\n <p class=\"side-drawer-caption\">Навигация</p><nav class=\"side-drawer-links\"><a class=\"side-drawer-link active\" href=\"profile.html\"><span class=\"side-drawer-icon\">◉</span>Мой профиль</a></nav>\n <div class=\"nav-history\"><p class=\"side-drawer-caption\">Недавно посещали</p><div class=\"nav-profile-visits\" id=\"nav-profile-visits\"><span class=\"nav-history-empty\">Пока пусто</span></div></div>\n <section class=\"drawer-search\" aria-label=\"Поиск FLOUSTREAM\"><button type=\"button\" class=\"drawer-search-toggle\" id=\"drawer-search-toggle\" aria-expanded=\"false\" aria-controls=\"drawer-search-options\"><span aria-hidden=\"true\">⌕</span> Поиск <span class=\"drawer-search-chevron\" aria-hidden=\"true\">⌄</span></button><div class=\"drawer-search-options\" id=\"drawer-search-options\" hidden><a class=\"drawer-search-option\" href=\"profile.html\"><span>⌕</span>Поиск</a><a class=\"drawer-search-option\" href=\"profile.html\"><span>✧</span>Рекомендации</a></div></section>\n <div class=\"side-drawer-divider\"></div><p class=\"side-drawer-caption\">Медиа и общение</p><nav class=\"side-drawer-links\"><a class=\"side-drawer-link\" id=\"friends-nav-link\" href=\"friends.html?v=20261114-1\"><span class=\"side-drawer-icon\">♧</span>Друзья</a><a class=\"side-drawer-link\" id=\"messages-nav-link\" href=\"messages.html?v=20261119-realtime-2\"><span class=\"side-drawer-icon\">✉</span>Сообщения</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">◎</span>Сообщества</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">♫</span>Музыка</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">▶</span>Видео</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">▧</span>Фото</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">☆</span>Закладки</a></nav>\n <div class=\"drawer-bottom\"><button type=\"button\" class=\"side-drawer-link drawer-settings-button\" id=\"public-open-settings\"><span class=\"side-drawer-icon\">⚙</span>Настройки</button><button type=\"button\" class=\"drawer-logout-button\" id=\"drawer-logout\">↪ Выйти</button><div class=\"side-drawer-foot\">FLOUSTREAM · твоя цифровая территория</div></div></div>\n</aside>\n\n<main class=\"wrap\">\n<section class=\"profile\">\n <div class=\"cover\" id=\"cover\"><img class=\"cover-photo\" id=\"cover-photo\" alt=\"Обложка профиля\" hidden></div>\n <div class=\"identity\"><div class=\"avatar\" id=\"avatar\">◉</div><div class=\"name\"><h1 id=\"display-name\">Загружаем профиль…</h1><p id=\"username\"></p><p class=\"profile-presence\" id=\"profile-presence\" aria-live=\"polite\"></p></div></div>\n <p class=\"bio\" id=\"bio\"></p>\n <div class=\"profile-actions\" id=\"profile-actions\" hidden><a class=\"contact-cta\" id=\"contact-cta\" href=\"messages.html\"><span class=\"contact-cta-label\">Связаться</span></a><button class=\"friend-cta\" id=\"friend-cta\" type=\"button\"><span aria-hidden=\"true\">♧＋</span><span id=\"friend-cta-label\">В друзья</span></button></div><p class=\"friend-action-status\" id=\"friend-action-status\" aria-live=\"polite\"></p>\n</section>\n<section class=\"public-albums\" id=\"public-albums\" hidden aria-label=\"Публичный видеоальбом\">\n <div class=\"public-album-section\" id=\"public-videos-section\" hidden><h2 class=\"public-album-title\">Видеоальбом</h2><div class=\"public-album-grid\" id=\"public-video-grid\"></div></div>\n</section>\n<section class=\"feed-section\"><h2 class=\"feed-title\">Публикации</h2><div class=\"feed\" id=\"feed\"><div class=\"status\" id=\"status\">Загружаем публикации…</div></div></section>\n</main>\n<div class=\"photo-lightbox\" id=\"photo-lightbox\" aria-hidden=\"true\" role=\"dialog\" aria-label=\"Просмотр фотографии\">\n <button class=\"photo-lightbox-close\" id=\"photo-lightbox-close\" type=\"button\" aria-label=\"Закрыть просмотр\">×</button>\n <img id=\"photo-lightbox-image\" alt=\"Фото во весь экран\">\n <div class=\"avatar-photo-actions\" id=\"avatar-photo-actions\" hidden>\n  <div class=\"avatar-photo-like-summary\"><span id=\"avatar-photo-like-count\">0 лайков</span><span id=\"avatar-photo-like-note\" aria-live=\"polite\"></span></div>\n  <button class=\"avatar-photo-like\" id=\"avatar-photo-like\" type=\"button\">♡ Нравится</button>\n </div>\n</div>\n</section>";
let notificationScriptsPromise = null;
function ensureNotificationScripts() {
  if (window.initFloustreamMessageNotifications && window.initFloustreamFriendNotifications) return Promise.resolve();
  if (!notificationScriptsPromise) {
    const load = src => new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL(src, import.meta.url).href;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Не удалось загрузить модуль уведомлений FLOUSTREAM"));
      document.head.appendChild(script);
    });
    notificationScriptsPromise = Promise.all([
      window.initFloustreamMessageNotifications ? Promise.resolve() : load("../message-notifications.js"),
      window.initFloustreamFriendNotifications ? Promise.resolve() : load("../friend-notifications.js")
    ]).catch(error => { notificationScriptsPromise = null; throw error; });
  }
  return notificationScriptsPromise;
}
export const title = "Профиль · FLOUSTREAM";

export function mount(root, { signal, navigate, url }) {
  const style = document.createElement("style");
  style.dataset.floustreamRouteStyle = "public-profile";
  style.textContent = STYLE;
  root.innerHTML = "<section class=\"fs-route-public-profile\">\n<button type=\"button\" class=\"drawer-menu-button\" id=\"drawer-menu-button\" aria-label=\"Открыть меню\" aria-controls=\"side-drawer\" aria-expanded=\"false\"><span class=\"sound-signal\" aria-hidden=\"true\"><i></i><i></i><i></i><i></i><i></i></span></button>\n<div class=\"drawer-edge\" id=\"drawer-edge\" aria-hidden=\"true\"></div><div class=\"drawer-backdrop\" id=\"drawer-backdrop\"></div>\n<aside class=\"side-drawer\" id=\"side-drawer\" aria-label=\"Навигация FLOUSTREAM\" aria-hidden=\"true\">\n <div class=\"drawer-shell\"><div class=\"side-drawer-head\"><div class=\"side-drawer-logo\">FLOUSTREAM</div><button type=\"button\" class=\"side-drawer-close\" id=\"drawer-close\" aria-label=\"Закрыть меню\">×</button></div>\n <p class=\"side-drawer-caption\">Навигация</p><nav class=\"side-drawer-links\"><a class=\"side-drawer-link active\" href=\"profile.html\"><span class=\"side-drawer-icon\">◉</span>Мой профиль</a></nav>\n <div class=\"nav-history\"><p class=\"side-drawer-caption\">Недавно посещали</p><div class=\"nav-profile-visits\" id=\"nav-profile-visits\"><span class=\"nav-history-empty\">Пока пусто</span></div></div>\n <section class=\"drawer-search\" aria-label=\"Поиск FLOUSTREAM\"><button type=\"button\" class=\"drawer-search-toggle\" id=\"drawer-search-toggle\" aria-expanded=\"false\" aria-controls=\"drawer-search-options\"><span aria-hidden=\"true\">⌕</span> Поиск <span class=\"drawer-search-chevron\" aria-hidden=\"true\">⌄</span></button><div class=\"drawer-search-options\" id=\"drawer-search-options\" hidden><a class=\"drawer-search-option\" href=\"profile.html\"><span>⌕</span>Поиск</a><a class=\"drawer-search-option\" href=\"profile.html\"><span>✧</span>Рекомендации</a></div></section>\n <div class=\"side-drawer-divider\"></div><p class=\"side-drawer-caption\">Медиа и общение</p><nav class=\"side-drawer-links\"><a class=\"side-drawer-link\" id=\"friends-nav-link\" href=\"friends.html?v=20261114-1\"><span class=\"side-drawer-icon\">♧</span>Друзья</a><a class=\"side-drawer-link\" id=\"messages-nav-link\" href=\"messages.html?v=20261119-realtime-2\"><span class=\"side-drawer-icon\">✉</span>Сообщения</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">◎</span>Сообщества</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">♫</span>Музыка</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">▶</span>Видео</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">▧</span>Фото</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">☆</span>Закладки</a></nav>\n <div class=\"drawer-bottom\"><button type=\"button\" class=\"side-drawer-link drawer-settings-button\" id=\"public-open-settings\"><span class=\"side-drawer-icon\">⚙</span>Настройки</button><button type=\"button\" class=\"drawer-logout-button\" id=\"drawer-logout\">↪ Выйти</button><div class=\"side-drawer-foot\">FLOUSTREAM · твоя цифровая территория</div></div></div>\n</aside>\n\n<main class=\"wrap\">\n<section class=\"profile\">\n <div class=\"cover\" id=\"cover\"><img class=\"cover-photo\" id=\"cover-photo\" alt=\"Обложка профиля\" hidden></div>\n <div class=\"identity\"><div class=\"avatar\" id=\"avatar\">◉</div><div class=\"name\"><h1 id=\"display-name\">Загружаем профиль…</h1><p id=\"username\"></p><p class=\"profile-presence\" id=\"profile-presence\" aria-live=\"polite\"></p></div></div>\n <p class=\"bio\" id=\"bio\"></p>\n <div class=\"profile-actions\" id=\"profile-actions\" hidden><a class=\"contact-cta\" id=\"contact-cta\" href=\"messages.html\"><span class=\"contact-cta-label\">Связаться</span></a><button class=\"friend-cta\" id=\"friend-cta\" type=\"button\"><span aria-hidden=\"true\">♧＋</span><span id=\"friend-cta-label\">В друзья</span></button></div><p class=\"friend-action-status\" id=\"friend-action-status\" aria-live=\"polite\"></p>\n</section>\n<section class=\"public-albums\" id=\"public-albums\" hidden aria-label=\"Публичный видеоальбом\">\n <div class=\"public-album-section\" id=\"public-videos-section\" hidden><h2 class=\"public-album-title\">Видеоальбом</h2><div class=\"public-album-grid\" id=\"public-video-grid\"></div></div>\n</section>\n<section class=\"feed-section\"><h2 class=\"feed-title\">Публикации</h2><div class=\"feed\" id=\"feed\"><div class=\"status\" id=\"status\">Загружаем публикации…</div></div></section>\n</main>\n<div class=\"photo-lightbox\" id=\"photo-lightbox\" aria-hidden=\"true\" role=\"dialog\" aria-label=\"Просмотр фотографии\">\n <button class=\"photo-lightbox-close\" id=\"photo-lightbox-close\" type=\"button\" aria-label=\"Закрыть просмотр\">×</button>\n <img id=\"photo-lightbox-image\" alt=\"Фото во весь экран\">\n <div class=\"avatar-photo-actions\" id=\"avatar-photo-actions\" hidden>\n  <div class=\"avatar-photo-like-summary\"><span id=\"avatar-photo-like-count\">0 лайков</span><span id=\"avatar-photo-like-note\" aria-live=\"polite\"></span></div>\n  <button class=\"avatar-photo-like\" id=\"avatar-photo-like\" type=\"button\">♡ Нравится</button>\n </div>\n</div>\n</section>";
  root.appendChild(style);
  const profileRoot = root.querySelector(".fs-route-public-profile");
  let presenceChannel = null;
  let client = null;

  
const SUPABASE_URL="https://qhpobdktlbhdqsnajypr.supabase.co";
const SUPABASE_KEY="sb_publishable_tzG1qVsbjaW8YE_LBVN87Q_v0CahKN5";
const $=id=>root.querySelector("#"+id);
let viewer,target;
function loadLibrary(){return new Promise((resolve,reject)=>{if(window.supabase?.createClient){resolve();return;}const script=document.createElement("script");script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";script.onload=()=>window.supabase?.createClient?resolve():reject(new Error("Supabase не загрузился"));script.onerror=()=>reject(new Error("Не удалось загрузить библиотеку Supabase"));document.head.append(script);});}
function safeUrl(value){if(!value)return "";try{const url=new URL(value,location.href);return ["http:","https:"].includes(url.protocol)?url.href:"";}catch(_){return "";}}
function dateText(value){if(!value)return "";const d=new Date(value);return Number.isNaN(d.getTime())?"":d.toLocaleString("ru-RU",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});}
function showError(message){$("feed").replaceChildren();const box=document.createElement("div");box.className="status error";box.textContent=message;$("feed").append(box);}
function renderTargetPresence(online){
 const host=$("profile-presence");if(!host||!target)return;
 host.replaceChildren();
 if(online){
  const dot=document.createElement("span");dot.className="dolby-online-indicator is-online";dot.setAttribute("role","img");dot.setAttribute("aria-label","В сети");
  host.append(dot,document.createTextNode("В сети"));
  return;
 }
 if(!target.last_activity_at){host.textContent="Время последнего визита пока неизвестно";return;}
 const zone=target.time_zone||"UTC";
 let formatted="";
 try{formatted=new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:zone}).format(new Date(target.last_activity_at));}
 catch(_){formatted=new Date(target.last_activity_at).toLocaleString("ru-RU");}
 host.textContent="Был(а) в сети: "+formatted;
}
function watchTargetPresence(){
 if(!client||!target)return;
 presenceChannel=client.channel("dolby404:online");
 const refresh=async()=>{
  const state=presenceChannel.presenceState()||{};
  const online=Object.values(state).some(entries=>(entries||[]).some(entry=>entry?.userId===target.id));
  if(online){renderTargetPresence(true);return;}
  const latest=await client.from("profiles").select("last_activity_at,time_zone").eq("id",target.id).maybeSingle();
  if(!latest.error&&latest.data)Object.assign(target,latest.data);
  renderTargetPresence(false);
 };
 presenceChannel.on("presence",{event:"sync"},refresh);
 presenceChannel.subscribe(status=>{if(status==="SUBSCRIBED")refresh();});
}
let avatarPhotoViewerOpen=false;
function openPhotoViewer(src,options={}){
 const viewer=$("photo-lightbox"),image=$("photo-lightbox-image"),actions=$("avatar-photo-actions");
 if(!viewer||!image||!src)return;
 avatarPhotoViewerOpen=!!options.profilePhoto;
 if(actions)actions.hidden=!avatarPhotoViewerOpen;
 image.src=src;viewer.classList.add("is-open");viewer.setAttribute("aria-hidden","false");profileRoot.classList.add("lightbox-open");
 if(avatarPhotoViewerOpen)refreshAvatarPhotoLikes();
}
function closePhotoViewer(){
 const viewer=$("photo-lightbox"),image=$("photo-lightbox-image"),actions=$("avatar-photo-actions");
 if(!viewer||!image)return;
 viewer.classList.remove("is-open");viewer.setAttribute("aria-hidden","true");image.removeAttribute("src");profileRoot.classList.remove("lightbox-open");
 avatarPhotoViewerOpen=false;if(actions)actions.hidden=true;
}
async function resolveAvatarSource(profile){
 if(!profile)return "";
 // The avatar copy lives in the public "avatars" bucket. Prefer it for guest display;
 // the original photo-album object is private and may only be readable under album policy.
 const publicAvatar=safeUrl(profile.avatar_url);
 if(publicAvatar)return publicAvatar;
 if(profile.avatar_photo_id){
  try{
   const photo=await client.from("photo_album_photos").select("object_path").eq("id",profile.avatar_photo_id).eq("owner_id",profile.id).maybeSingle();
   if(photo.error)throw photo.error;
   if(photo.data?.object_path){
    const signed=await client.storage.from("photo-albums").createSignedUrl(photo.data.object_path,3600);
    if(signed.error)throw signed.error;
    if(signed.data?.signedUrl)return safeUrl(signed.data.signedUrl);
   }
  }catch(error){console.warn("FLOUSTREAM profile avatar source:",error);}
 }
 return "";
}
async function openAvatarOriginal(){
 if(!target)return;
 const src=await resolveAvatarSource(target);
 if(src)openPhotoViewer(src,{profilePhoto:true});
}
function formatAvatarPhotoLikeCount(count){const value=Math.abs(Number(count)||0),lastTwo=value%100,last=value%10,word=lastTwo>=11&&lastTwo<=14?"лайков":last===1?"лайк":last>=2&&last<=4?"лайка":"лайков";return value+" "+word;}
async function refreshAvatarPhotoLikes(){
 const actions=$("avatar-photo-actions"),button=$("avatar-photo-like"),count=$("avatar-photo-like-count"),note=$("avatar-photo-like-note");
 if(!actions||!button||!count||!note||!target)return;
 let loaded=false;button.disabled=true;note.textContent="Загружаем…";
 try{
  const rows=await client.from("profile_photo_likes").select("user_id,created_at").eq("profile_id",target.id).order("created_at",{ascending:false});
  if(rows.error)throw rows.error;
  const likes=rows.data||[];loaded=true;
  count.textContent=formatAvatarPhotoLikeCount(likes.length);
  if(!viewer){button.textContent="♡ Нравится";button.dataset.liked="false";button.disabled=true;note.textContent="Войдите, чтобы поставить лайк";return;}
  const mine=likes.some(row=>row.user_id===viewer.id);
  button.textContent=mine?"♥ Нравится":"♡ Нравится";button.dataset.liked=mine?"true":"false";button.classList.toggle("liked",mine);note.textContent="";
 }catch(error){note.textContent="Не удалось загрузить лайки";console.warn("FLOUSTREAM avatar likes:",error);}
 finally{button.disabled=!viewer||!loaded;}
}
$("avatar-photo-like").addEventListener("click",async()=>{
 if(!viewer||!target)return;
 const button=$("avatar-photo-like"),note=$("avatar-photo-like-note"),liked=button.dataset.liked==="true";
 button.disabled=true;note.textContent="Сохраняем…";
 try{
  if(liked){
   const result=await client.from("profile_photo_likes").delete().eq("profile_id",target.id).eq("user_id",viewer.id);
   if(result.error)throw result.error;
  }else{
   const result=await client.from("profile_photo_likes").insert({profile_id:target.id,user_id:viewer.id});
   if(result.error&&result.error.code!=="23505")throw result.error;
  }
  await refreshAvatarPhotoLikes();
 }catch(error){note.textContent="Не удалось поставить лайк";button.disabled=false;console.warn("FLOUSTREAM avatar like:",error);}
});
$("avatar").addEventListener("click",()=>{if($("avatar").classList.contains("has-original"))openAvatarOriginal();});
$("avatar").addEventListener("keydown",event=>{if((event.key==="Enter"||event.key===" ")&&$("avatar").classList.contains("has-original")){event.preventDefault();openAvatarOriginal();}});
$("photo-lightbox-close").addEventListener("click",closePhotoViewer);
$("photo-lightbox").addEventListener("click",event=>{if(event.target===$("photo-lightbox"))closePhotoViewer();});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&$("photo-lightbox").classList.contains("is-open"))closePhotoViewer();},{signal});

function avatarNode(url,name){const node=document.createElement("div");node.className="post-avatar";const src=safeUrl(url);if(src){const img=document.createElement("img");img.src=src;img.alt="";node.append(img);}else node.textContent=(name||"◉").trim().slice(0,1).toUpperCase();return node;}

async function attachPublicPostInteractions(post,card){
 const bar=document.createElement("div");bar.className="post-social-actions";
 const reactionWrap=document.createElement("div");reactionWrap.className="post-reaction-wrap";
 const reactionToggle=document.createElement("button");reactionToggle.type="button";reactionToggle.className="post-social-button";reactionToggle.textContent="＋ 0";reactionToggle.setAttribute("aria-label","Выбрать реакцию");reactionToggle.setAttribute("aria-expanded","false");
 const reactionPanel=document.createElement("div");reactionPanel.className="post-reaction-picker";reactionPanel.hidden=true;
 const reactionNote=document.createElement("div");reactionNote.className="post-comment-note";
 const reactionOptions=[
  {key:"fire",emoji:"🔥",name:"Огонь"},{key:"love",emoji:"❤️",name:"Любовь"},{key:"lol",emoji:"😂",name:"Смешно"},{key:"cool",emoji:"😎",name:"Круто"},
  {key:"mind",emoji:"🤯",name:"Взрыв"},{key:"sad",emoji:"😢",name:"Грустно"},{key:"rock",emoji:"🤘",name:"Рок"},{key:"respect",emoji:"👏",name:"Респект"},
  {key:"wow",emoji:"⚡",name:"Вау"},{key:"dark",emoji:"🖤",name:"Dark"},{key:"eyes",emoji:"👀",name:"Смотрю"},{key:"diamond",emoji:"💎",name:"Бриллиант"}
 ];
 const optionButtons={};
 for(const item of reactionOptions){const button=document.createElement("button");button.type="button";button.className="post-reaction-option";button.dataset.reaction=item.key;button.title=item.name;button.setAttribute("aria-label",item.name);const emoji=document.createElement("span");emoji.className="reaction-emoji";emoji.textContent=item.emoji;const count=document.createElement("span");count.className="reaction-count";count.textContent="0";button.append(emoji,count);reactionPanel.append(button);optionButtons[item.key]={button,count};}
 reactionWrap.append(reactionToggle,reactionPanel);
 const like=document.createElement("button");like.type="button";like.className="post-social-button";like.textContent="♡ 0";
 const commentsToggle=document.createElement("button");commentsToggle.type="button";commentsToggle.className="post-social-button";commentsToggle.textContent="💬 0";commentsToggle.setAttribute("aria-expanded","false");
 const flow=document.createElement("button");flow.type="button";flow.className="flow-button";flow.textContent="FLOW";
 bar.append(reactionWrap,like,commentsToggle,flow);card.append(bar,reactionNote);
 const panel=document.createElement("section");panel.className="post-comments-panel";panel.hidden=true;
 const header=document.createElement("div");header.className="post-comments-header";const heading=document.createElement("span");heading.textContent="Комментарии";
 const close=document.createElement("button");close.type="button";close.className="post-comments-close";close.textContent="Свернуть";header.append(heading,close);
 const list=document.createElement("div");list.className="post-comments-list";
 const form=document.createElement("form");form.className="post-comment-form";
 const input=document.createElement("textarea");input.maxLength=2000;input.rows=2;input.placeholder="Написать комментарий…";
 const send=document.createElement("button");send.type="submit";send.textContent="Отправить";
 const commentNote=document.createElement("div");commentNote.className="post-comment-note";
 form.append(input,send);panel.append(header,list,form,commentNote);card.append(panel);
 let liked=false,activeFlow=false,ownReaction=null;
 const refresh=async()=>{
  const [likes,ownLike,comments,totalFlow,ownFlow,reactions,mine]=await Promise.all([
   client.from("likes").select("id",{count:"exact",head:true}).eq("post_id",post.id),
   viewer?client.from("likes").select("id").eq("post_id",post.id).eq("user_id",viewer.id).maybeSingle():Promise.resolve({data:null}),
   client.from("comments").select("id",{count:"exact",head:true}).eq("post_id",post.id),
   client.from("reposts").select("id",{count:"exact",head:true}).eq("post_id",post.id),
   viewer?client.from("reposts").select("id").eq("post_id",post.id).eq("user_id",viewer.id).maybeSingle():Promise.resolve({data:null}),
   client.from("post_reactions").select("reaction_key").eq("post_id",post.id),
   viewer?client.from("post_reactions").select("id,reaction_key").eq("post_id",post.id).eq("user_id",viewer.id).maybeSingle():Promise.resolve({data:null})
  ]);
  const err=[likes,comments,totalFlow,reactions,mine].find(x=>x.error);if(err){commentNote.textContent="Не удалось загрузить действия: "+err.error.message;return;}
  liked=!!ownLike.data;activeFlow=!!ownFlow.data;ownReaction=mine.data||null;
  like.textContent=(liked?"♥ ":"♡ ")+(likes.count||0);like.classList.toggle("is-active",liked);
  commentsToggle.textContent="💬 "+(comments.count||0);
  flow.textContent="FLOW · "+(totalFlow.count||0);flow.classList.toggle("active",activeFlow);flow.setAttribute("aria-pressed",String(activeFlow));flow.title=activeFlow?"Отменить FLOW":"Добавить оригинальную публикацию в свои публикации";
  const counts={};for(const row of reactions.data||[])counts[row.reaction_key]=(counts[row.reaction_key]||0)+1;
  const total=Object.values(counts).reduce((a,b)=>a+b,0),selected=reactionOptions.find(x=>x.key===ownReaction?.reaction_key);
  reactionToggle.textContent=(selected?selected.emoji:"＋")+" "+total;reactionToggle.classList.toggle("is-active",!!selected);reactionToggle.setAttribute("aria-label",selected?"Твоя реакция: "+selected.name+". Изменить реакцию":"Выбрать реакцию");
  for(const item of reactionOptions){const option=optionButtons[item.key];option.count.textContent=String(counts[item.key]||0);option.button.classList.toggle("is-active",ownReaction?.reaction_key===item.key);option.button.setAttribute("aria-pressed",String(ownReaction?.reaction_key===item.key));}
 };
 if(!viewer){for(const button of [like,commentsToggle,flow,reactionToggle]){button.disabled=true;button.title="Войди в аккаунт, чтобы взаимодействовать с публикациями";}commentNote.textContent="Войди в аккаунт, чтобы ставить лайки, выбирать реакции и комментировать.";form.hidden=true;}
 await refresh();
 reactionToggle.addEventListener("click",()=>{if(!viewer)return;reactionPanel.hidden=!reactionPanel.hidden;reactionToggle.setAttribute("aria-expanded",String(!reactionPanel.hidden));});
 document.addEventListener("click",event=>{if(!reactionWrap.contains(event.target)&&!reactionPanel.hidden){reactionPanel.hidden=true;reactionToggle.setAttribute("aria-expanded","false");}},{signal});
 for(const item of reactionOptions){optionButtons[item.key].button.addEventListener("click",async()=>{
  if(!viewer)return;for(const x of Object.values(optionButtons))x.button.disabled=true;reactionNote.textContent="";
  let result;if(ownReaction?.reaction_key===item.key)result=await client.from("post_reactions").delete().eq("post_id",post.id).eq("user_id",viewer.id);
  else if(ownReaction)result=await client.from("post_reactions").update({reaction_key:item.key,updated_at:new Date().toISOString()}).eq("post_id",post.id).eq("user_id",viewer.id);
  else result=await client.from("post_reactions").insert({post_id:post.id,user_id:viewer.id,reaction_key:item.key});
  if(result.error)reactionNote.textContent="Не удалось изменить реакцию: "+result.error.message;else{reactionPanel.hidden=true;reactionToggle.setAttribute("aria-expanded","false");}
  await refresh();for(const x of Object.values(optionButtons))x.button.disabled=false;
 });}
 like.addEventListener("click",async()=>{if(!viewer)return;like.disabled=true;const result=liked?await client.from("likes").delete().eq("post_id",post.id).eq("user_id",viewer.id):await client.from("likes").insert({post_id:post.id,user_id:viewer.id});if(result.error)commentNote.textContent="Не удалось изменить лайк: "+result.error.message;await refresh();like.disabled=false;});
 flow.addEventListener("click",async()=>{if(!viewer)return;flow.disabled=true;const result=activeFlow?await client.from("reposts").delete().eq("post_id",post.id).eq("user_id",viewer.id):await client.from("reposts").insert({post_id:post.id,user_id:viewer.id});if(result.error)commentNote.textContent="Не удалось выполнить FLOW: "+result.error.message;await refresh();flow.disabled=false;});
 async function loadComments(){
  list.replaceChildren();const loading=document.createElement("div");loading.className="post-comment-note";loading.textContent="Загружаем комментарии…";list.append(loading);
  const result=await client.from("comments").select("id,user_id,content,created_at").eq("post_id",post.id).order("created_at",{ascending:true}).limit(100);
  if(result.error){loading.textContent="Не удалось загрузить комментарии: "+result.error.message;return;}
  list.replaceChildren();const ids=[...new Set((result.data||[]).map(x=>x.user_id).filter(Boolean))];
  const profiles=ids.length?await client.from("profiles").select("id,username,display_name").in("id",ids):{data:[],error:null};
  const byId=new Map((profiles.data||[]).map(x=>[x.id,x]));
  if(!result.data?.length){const empty=document.createElement("div");empty.className="post-comment-note";empty.textContent="Пока нет комментариев. Будь первым!";list.append(empty);return;}
  for(const item of result.data){const row=document.createElement("article");row.className="post-comment";const name=document.createElement("strong");const profile=byId.get(item.user_id)||{};name.textContent=profile.display_name||profile.username||"Пользователь";const body=document.createElement("div");body.textContent=item.content;const time=document.createElement("time");time.textContent=dateText(item.created_at);row.append(name,body,time);list.append(row);}
 }
 commentsToggle.addEventListener("click",async()=>{if(!viewer)return;panel.hidden=!panel.hidden;commentsToggle.setAttribute("aria-expanded",String(!panel.hidden));if(!panel.hidden){await loadComments();input.focus();}});
 close.addEventListener("click",()=>{panel.hidden=true;commentsToggle.setAttribute("aria-expanded","false");});
 form.addEventListener("submit",async event=>{event.preventDefault();if(!viewer)return;const content=input.value.trim();if(!content)return;send.disabled=true;commentNote.textContent="Отправляем…";const result=await client.from("comments").insert({post_id:post.id,user_id:viewer.id,content});if(result.error){commentNote.textContent="Не удалось отправить комментарий: "+result.error.message;send.disabled=false;return;}input.value="";commentNote.textContent="Комментарий добавлен.";await loadComments();await refresh();send.disabled=false;});
}

async function renderPost(post,authors,flowMeta){
 const author=authors.get(post.user_id)||{};const authorName=author.display_name||author.username||"Пользователь";
 const card=document.createElement("article");card.className="post";
 if(flowMeta){const banner=document.createElement("div");banner.className="flow-banner";banner.textContent="FLOW · "+(target.display_name||target.username||"Пользователь")+(flowMeta.created_at?" · "+dateText(flowMeta.created_at):"");card.append(banner);}
 const head=document.createElement("div");head.className="post-head";head.append(avatarNode(author.avatar_url,authorName));
 const identity=document.createElement("div"),name=document.createElement("div"),date=document.createElement("div");if(flowMeta){const authorLabel=document.createElement("div");authorLabel.className="post-author-label";authorLabel.textContent="Автор оригинала";identity.append(authorLabel);}name.className="post-author";name.textContent=authorName;date.className="post-date";date.textContent=dateText(post.created_at);identity.append(name,date);head.append(identity);card.append(head);
 if(post.content){const body=document.createElement("div");body.className="post-content";body.textContent=post.content;card.append(body);}
 const media=Array.isArray(post.media)&&post.media.length?post.media:(post.image_url?[{type:"photo",url:post.image_url}]:[]);
 if(media.length){const box=document.createElement("div");box.className="post-media";for(const item of media){let url=safeUrl(item.url||item.public_url||item.signedUrl);if(!url&&item.object_path){const signed=await client.storage.from("posts").createSignedUrl(item.object_path,3600);if(!signed.error)url=safeUrl(signed.data?.signedUrl);}if(!url)continue;let node;if(item.type==="photo"){const photoButton=document.createElement("button");photoButton.type="button";photoButton.className="post-photo-open";photoButton.setAttribute("aria-label","Открыть фотографию на весь экран");node=document.createElement("img");node.alt="Фото публикации";node.loading="lazy";node.decoding="async";node.src=url;photoButton.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();openPhotoViewer(node.currentSrc||node.src);});photoButton.append(node);box.append(photoButton);continue;}else if(item.type==="music"){node=document.createElement("audio");node.controls=true;}else{node=document.createElement("video");node.controls=true;node.playsInline=true;node.preload="metadata";if(item.mime_type||item.mimeType)node.setAttribute("type",item.mime_type||item.mimeType);}node.src=url;node.load();box.append(node);}if(box.children.length)card.append(box);}
 attachPublicPostInteractions(post,card);
 return card;
}
async function loadProfileVisitHistory(){
 const host=$("nav-profile-visits");if(!host||!client||!viewer)return;
 try{
  const visits=await client.from("profile_visits").select("visited_profile_id,last_visited_at").eq("visitor_id",viewer.id).order("last_visited_at",{ascending:false}).limit(5);
  if(visits.error)throw visits.error;
  const rows=visits.data||[];host.replaceChildren();if(!rows.length){const empty=document.createElement("span");empty.className="nav-history-empty";empty.textContent="Пока пусто";host.append(empty);return;}
  const ids=rows.map(row=>row.visited_profile_id);
  const profiles=await client.from("profiles").select("id,username,display_name,avatar_url").in("id",ids);
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
window.addEventListener("pageshow",()=>{if(viewer&&client)loadProfileVisitHistory();},{signal});
async function loadPublicAlbums(){
 const host=$("public-albums"),videoSection=$("public-videos-section"),videoGrid=$("public-video-grid");
 videoGrid.replaceChildren();videoSection.hidden=true;host.hidden=true;
 try{
  // Photo albums are owner-only. Public profiles expose videos only; profile avatars remain a separate public profile asset.
  const videoResult=await client.from("video_album_videos").select("id,object_path,file_name,created_at").eq("owner_id",target.id).order("created_at",{ascending:false}).limit(18);
  if(videoResult.error)throw videoResult.error;
  const videos=videoResult.data||[];
  if(videos.length){
   const signed=await client.storage.from("video-albums").createSignedUrls(videos.map(item=>item.object_path),3600);
   if(signed.error)throw signed.error;
   const urls=new Map((signed.data||[]).filter(item=>item.signedUrl&&!item.error).map(item=>[item.path,item.signedUrl]));
   for(const item of videos){const url=urls.get(item.object_path);if(!url)continue;const card=document.createElement("article");card.className="public-album-video";const video=document.createElement("video");video.src=url;video.controls=true;video.playsInline=true;video.preload="metadata";video.setAttribute("aria-label",item.file_name||"Видео");const name=document.createElement("div");name.className="public-album-video-name";name.textContent=item.file_name||"Видео";card.append(video,name);videoGrid.append(card);}
   videoSection.hidden=!videoGrid.childElementCount;
  }
  host.hidden=videoSection.hidden;
 }catch(error){console.warn("FLOUSTREAM public videos:",error);host.hidden=true;}
}

async function start(){
 try{
  await loadLibrary();if(signal.aborted)return;client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage,storageKey:"sb-qhpobdktlbhdqsnajypr-auth-token"}});
  // Public profiles must remain readable when there is no signed-in user.
  // getUser() without a session returns "Auth session missing!" and must never gate guest access.
  try{
   const stored=await client.auth.getSession();
   if(signal.aborted)return;
   if(stored.error)throw stored.error;
   if(stored.data?.session){
    const auth=await client.auth.getUser();
    if(signal.aborted)return;
    if(auth.error)throw auth.error;
    viewer=auth.data.user;
   }else viewer=null;
  }catch(authError){
   console.warn("FLOUSTREAM optional profile viewer session:",authError);
   // A stale/broken local token must not block public profile reads. Keep local storage untouched.
   client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
   viewer=null;
  }
  if(viewer){
   await ensureNotificationScripts();if(signal.aborted)return;
   window.initFloustreamMessageNotifications?.(client,viewer.id,{signal,root});
   window.initFloustreamFriendNotifications?.(client,viewer.id,{signal,root});
  }
  const targetId=new URLSearchParams(url.search).get("id");if(!targetId){showError("Не указан профиль для просмотра.");return;}
  if(viewer&&targetId===viewer.id){navigate("profile.html");return;}
  const profileResult=await client.from("profiles").select("id,username,display_name,bio,avatar_url,avatar_photo_id,cover_url,last_activity_at,time_zone").eq("id",targetId).maybeSingle();
  if(signal.aborted)return;if(profileResult.error)throw profileResult.error;if(!profileResult.data){showError("Профиль не найден или недоступен.");return;}
  target=profileResult.data;
  await loadPublicAlbums();if(signal.aborted)return;
  renderTargetPresence(false);
  watchTargetPresence();
  if(viewer){
   const recorded=await client.from("profile_visits").upsert({visitor_id:viewer.id,visited_profile_id:target.id,last_visited_at:new Date().toISOString()},{onConflict:"visitor_id,visited_profile_id"});
   if(recorded.error)console.warn("FLOUSTREAM visit recording:",recorded.error);
   loadProfileVisitHistory();
  }
  const contact=$("contact-cta"),actions=$("profile-actions"),friendButton=$("friend-cta"),friendLabel=$("friend-cta-label"),friendStatus=$("friend-action-status");
  if(viewer&&viewer.id!==target.id){
   contact.href="messages.html?with="+encodeURIComponent(target.id);actions.hidden=false;
   const low=viewer.id<target.id?viewer.id:target.id,high=viewer.id<target.id?target.id:viewer.id;
   async function refreshFriendState(){
    const result=await client.from("friend_requests").select("id,requester_id,recipient_id,status").eq("user_low_id",low).eq("user_high_id",high).maybeSingle();
    if(result.error)throw result.error;const row=result.data;
    friendButton.disabled=false;friendButton.onclick=null;friendStatus.textContent="";
    if(!row){friendLabel.textContent="В друзья";friendButton.onclick=sendFriendRequest;}
    else if(row.status==="accepted"){friendLabel.textContent="Вы друзья";friendButton.disabled=true;}
    else if(row.requester_id===viewer.id){friendLabel.textContent="Заявка отправлена";friendButton.onclick=cancelFriendRequest;}
    else{friendLabel.textContent="Принять приглашение";friendButton.onclick=acceptFriendRequest;}
   }
   async function sendFriendRequest(){
    friendButton.disabled=true;friendStatus.textContent="Отправляем приглашение…";
    const result=await client.from("friend_requests").insert({requester_id:viewer.id,recipient_id:target.id,user_low_id:low,user_high_id:high});
    if(result.error){friendStatus.textContent=result.error.code==="23505"?"Приглашение уже существует.":result.error.message;friendButton.disabled=false;await refreshFriendState();return;}
    friendStatus.textContent="Приглашение отправлено.";await refreshFriendState();
   }
   async function cancelFriendRequest(){
    friendButton.disabled=true;const current=await client.from("friend_requests").select("id").eq("user_low_id",low).eq("user_high_id",high).eq("requester_id",viewer.id).eq("status","pending").maybeSingle();
    if(current.error||!current.data){friendStatus.textContent=current.error?.message||"Заявка уже обработана.";await refreshFriendState();return;}
    const result=await client.from("friend_requests").delete().eq("id",current.data.id).eq("requester_id",viewer.id);
    if(result.error){friendStatus.textContent=result.error.message;friendButton.disabled=false;return;}
    friendStatus.textContent="Приглашение отменено.";await refreshFriendState();
   }
   async function acceptFriendRequest(){
    friendButton.disabled=true;const current=await client.from("friend_requests").select("id").eq("user_low_id",low).eq("user_high_id",high).eq("recipient_id",viewer.id).eq("status","pending").maybeSingle();
    if(current.error||!current.data){friendStatus.textContent=current.error?.message||"Заявка уже обработана.";await refreshFriendState();return;}
    const result=await client.from("friend_requests").update({status:"accepted"}).eq("id",current.data.id).eq("recipient_id",viewer.id).eq("status","pending");
    if(result.error){friendStatus.textContent=result.error.message;friendButton.disabled=false;return;}
    friendStatus.textContent="Теперь вы друзья!";await refreshFriendState();
   }
   try{await refreshFriendState();}catch(error){friendStatus.textContent="Не удалось проверить статус дружбы: "+error.message;}
  }
    $("display-name").textContent=target.display_name||target.username||"Пользователь";
  $("username").textContent=target.username?"@"+target.username:"";
  $("bio").textContent=target.bio||"";
  const avatar=await resolveAvatarSource(target);if(avatar){$("avatar").replaceChildren();const img=document.createElement("img");img.src=avatar;img.alt="Аватар";img.onerror=()=>{img.remove();$("avatar").textContent=(target.display_name||target.username||"◉").slice(0,1).toUpperCase();};$("avatar").append(img);$("avatar").classList.add("has-original");$("avatar").setAttribute("role","button");$("avatar").tabIndex=0;$("avatar").setAttribute("aria-label","Открыть оригинал фотографии профиля");}else{$("avatar").textContent=(target.display_name||target.username||"◉").slice(0,1).toUpperCase();$("avatar").classList.remove("has-original");$("avatar").removeAttribute("role");$("avatar").removeAttribute("tabindex");$("avatar").removeAttribute("aria-label");}
  const cover=safeUrl(target.cover_url),coverImage=$("cover-photo");if(cover){coverImage.onerror=()=>{coverImage.hidden=true;};coverImage.onload=()=>{coverImage.hidden=false;};coverImage.src=cover;coverImage.hidden=false;}else{coverImage.removeAttribute("src");coverImage.hidden=true;}
  const [ownPosts,flows]=await Promise.all([
   client.from("posts").select("*").eq("user_id",targetId).order("created_at",{ascending:false}).limit(50),
   client.from("reposts").select("id,user_id,post_id,created_at").eq("user_id",targetId).order("created_at",{ascending:false}).limit(50)
  ]);
  if(ownPosts.error)throw ownPosts.error;if(flows.error)throw flows.error;
  const flowRows=flows.data||[],flowIds=flowRows.map(row=>row.post_id).filter(Boolean);
  const flowPosts=flowIds.length?await client.from("posts").select("*").in("id",flowIds):{data:[],error:null};
  if(flowPosts.error)throw flowPosts.error;
  const flowById=new Map(flowRows.map(row=>[String(row.post_id),row])),merged=new Map();
  for(const post of ownPosts.data||[])merged.set(String(post.id),{post,sortAt:post.created_at||"",flowMeta:null});
  for(const post of flowPosts.data||[]){const meta=flowById.get(String(post.id));if(!meta)continue;const key=String(post.id),existing=merged.get(key);if(!existing||new Date(meta.created_at||0)>new Date(existing.sortAt||0))merged.set(key,{post,sortAt:meta.created_at||post.created_at||"",flowMeta:meta});}
  const entries=[...merged.values()].sort((a,b)=>new Date(b.sortAt||0)-new Date(a.sortAt||0));
  if(!entries.length){$("feed").replaceChildren();const empty=document.createElement("div");empty.className="empty";empty.textContent="Пока нет доступных публикаций."; $("feed").append(empty);return;}
  const authorIds=[...new Set(entries.map(x=>x.post.user_id).filter(Boolean))];
  const authorResult=authorIds.length?await client.from("profiles").select("id,username,display_name,avatar_url").in("id",authorIds):{data:[],error:null};
  if(authorResult.error)throw authorResult.error;
  const authors=new Map((authorResult.data||[]).map(p=>[p.id,p]));$("feed").replaceChildren();
  for(const entry of entries)$("feed").append(await renderPost(entry.post,authors,entry.flowMeta));
 }catch(error){showError("Не удалось открыть страницу: "+error.message);}
}
(function initPublicSideDrawer(){
 const button=$("drawer-menu-button"),drawer=$("side-drawer"),backdrop=$("drawer-backdrop"),edge=$("drawer-edge"),close=$("drawer-close");
 if(!button||!drawer||!backdrop||!close)return;
 let opened=false;
 function setOpen(value){opened=!!value;drawer.style.setProperty("--drawer-x",opened?"0%":"-100%");backdrop.classList.toggle("visible",opened);backdrop.style.opacity=opened?"1":"0";button.classList.toggle("is-hidden",opened);button.setAttribute("aria-expanded",String(opened));drawer.setAttribute("aria-hidden",String(!opened));profileRoot.style.overflow=opened?"hidden":"";}
 button.addEventListener("click",()=>setOpen(!opened));close.addEventListener("click",()=>setOpen(false));backdrop.addEventListener("click",()=>setOpen(false));
 document.addEventListener("keydown",event=>{if(event.key==="Escape"&&opened)setOpen(false);},{signal});
 const searchToggle=$("drawer-search-toggle"),searchOptions=$("drawer-search-options");if(searchToggle&&searchOptions)searchToggle.addEventListener("click",()=>{const expanded=searchToggle.getAttribute("aria-expanded")==="true";searchToggle.setAttribute("aria-expanded",String(!expanded));searchOptions.hidden=expanded;});
  const settingsButton=$("public-open-settings");if(settingsButton)settingsButton.addEventListener("click",()=>{navigate("profile.html?openSettings=1");});
  const logoutButton=$("drawer-logout");if(logoutButton)logoutButton.addEventListener("click",async()=>{if(!client)return;logoutButton.disabled=true;const result=await client.auth.signOut();if(result.error){logoutButton.disabled=false;logoutButton.title="Не удалось выйти: "+result.error.message;return;}navigate("portal.html");});
 let startX=null;edge.addEventListener("touchstart",event=>{startX=event.touches[0].clientX;},{passive:true});edge.addEventListener("touchend",event=>{if(startX!==null&&event.changedTouches[0].clientX-startX>45)setOpen(true);startX=null;},{passive:true});
})();
void start();


  return async () => {
    if (presenceChannel && client) {
      try { await client.removeChannel(presenceChannel); } catch (_) {}
      presenceChannel = null;
    }
    try { await client?.auth?.stopAutoRefresh?.(); } catch (_) {}
    root.querySelectorAll("video,audio").forEach(media => {
      try { media.pause(); media.removeAttribute("src"); media.load(); } catch (_) {}
    });
    root.replaceChildren();
  };
}
