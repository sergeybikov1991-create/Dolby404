const STYLES = "\n*{box-sizing:border-box}\n:root{--bg:#090910;--panel:#141320;--line:#302b43;--purple:#a66bff;--muted:#a39db5;--text:#f7f4ff}\nbody{margin:0;min-height:100vh;background:radial-gradient(ellipse at 15% 0%,#281342 0,transparent 38%),var(--bg);color:var(--text);font-family:Arial,sans-serif}\n.topbar{height:68px;display:flex;align-items:center;justify-content:space-between;padding:0 max(calc((100% - 1050px)/2),18px);border-bottom:1px solid var(--line);background:#0b0b13eF;position:sticky;top:0}\n.logo{font-size:24px;font-weight:900;letter-spacing:3px;text-shadow:0 0 18px #7b4bff}\na{color:#d8c5ff;text-decoration:none}\n.wrap{max-width:900px;margin:24px auto;padding:0 16px}\n@media(max-width:700px){\n .wrap{width:100%;max-width:none;margin:0;padding:0}\n .card{border-left:0;border-right:0;border-radius:0}\n .profile{padding-left:14px;padding-right:14px}\n .quick-nav{margin-left:0;margin-right:0;padding-left:10px;padding-right:10px}\n .quick-status{padding-left:12px;padding-right:12px}\n .feed-section{margin-top:16px}\n .feed-title{padding-left:12px;padding-right:12px}\n .publish-box{padding-left:12px;padding-right:12px}\n .feed{gap:0}\n .post{border-left:0;border-right:0;border-radius:0}\n .post+.post{border-top:0;border-bottom:1px solid var(--line)}\n}\n.quick-nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0 0 18px}\n.quick-nav a,.quick-nav button{display:flex;align-items:center;justify-content:center;min-height:54px;padding:10px 8px;border:1px solid var(--line);border-radius:13px;background:#151321;color:#e9ddff;text-decoration:none;font-size:13px}\n.quick-status{min-height:18px;margin:0 0 14px;color:#c5a4ff;font-size:12px;text-align:center}\n.feed-section{margin-top:24px}\n.feed-title{font-size:19px;margin:0 0 14px}\n.feed{display:flex;flex-direction:column;gap:12px}\n.post{background:linear-gradient(145deg,#191625,#101019);border:1px solid var(--line);border-radius:16px;padding:16px;overflow:hidden}\n.post-head{display:flex;align-items:center;gap:11px;margin-bottom:12px}\n.post-avatar{width:42px;height:42px;border-radius:50%;background:#302044;border:1px solid #62458b;display:grid;place-items:center;overflow:hidden;flex-shrink:0;color:#e7d8ff;font-weight:bold}\n.post-avatar img{width:100%;height:100%;object-fit:cover}\n.post-author{font-size:14px;font-weight:700;overflow-wrap:anywhere}\n.post-date{font-size:11px;color:var(--muted);margin-top:4px}\n.post-content{font-size:14px;line-height:1.6;color:#e9e4f2;white-space:pre-wrap;overflow-wrap:anywhere}\n.post-image{display:block;width:100%;max-height:520px;object-fit:contain;border-radius:12px;margin-top:12px;background:#090910}\n.feed-loading,.feed-error{padding:14px;text-align:center;color:var(--muted);font-size:13px}\n.feed-error{color:#ffb4c0}\n.feed-empty{padding:22px;text-align:center;background:#141320;border:1px dashed #55456c;border-radius:15px;color:var(--muted);line-height:1.6}\n.feed-empty strong{display:block;color:#eee5ff;margin-bottom:7px}\n#feed-sentinel{height:1px}\n@media(max-width:380px){.quick-nav{grid-template-columns:repeat(2,minmax(0,1fr))}}\n.back{display:inline-block;margin-bottom:18px;color:#c7b2ed}\n.card{border:1px solid var(--line);border-radius:20px;background:linear-gradient(145deg,#191625,#101019);overflow:hidden}\n.cover{height:150px;background:radial-gradient(ellipse at 70% 20%,#7742b4 0,transparent 45%),linear-gradient(110deg,#201238,#17152a 55%,#101c35)}\n.profile{padding:0 26px 26px}\n.identity{display:flex;align-items:end;gap:18px;margin-top:-48px;position:relative}\n.avatar{width:112px;height:112px;position:relative;isolation:isolate;border-radius:50%;border:4px solid #c18aff;background:linear-gradient(135deg,#6336a3,#17152b);display:grid;place-items:center;font-size:42px;overflow:hidden;flex-shrink:0;animation:avatarFrameGlow 2.8s ease-in-out infinite}\n.avatar img{position:absolute;inset:0;display:block;width:100%;height:100%;min-width:100%;min-height:100%;object-fit:cover;object-position:center;border-radius:50%}\n.avatar{cursor:pointer;position:relative;outline:none}\n.avatar:focus-visible{box-shadow:0 0 0 3px #c5a4ff,0 0 24px #8d50e755}\n.avatar::after{content:\"Изменить фото\";position:absolute;inset:auto 0 0;background:#090910c9;color:#fff;font-size:10px;text-align:center;padding:5px 2px;opacity:0;transition:opacity .2s}\n.avatar:hover::after,.avatar:focus-visible::after{opacity:1}\n.photo-modal{position:fixed;inset:0;z-index:20;background:#05040bd9;display:grid;place-items:center;padding:20px}\n.photo-modal[hidden]{display:none}\n.photo-panel{width:min(100%,340px);padding:24px;border:1px solid #55416f;border-radius:18px;background:#171321;box-shadow:0 18px 60px #0009;text-align:center}\n.photo-panel h2{font-size:19px;margin:0 0 8px}\n.photo-panel p{font-size:13px;color:var(--muted);line-height:1.5;margin:0 0 18px}\n.photo-panel .actions{justify-content:center;margin-top:0}\n#photo-status{min-height:18px;margin-top:12px;color:#c5a4ff;font-size:12px}\n.photo-viewer{position:fixed;inset:0;z-index:30;background:#030208f2;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px;gap:18px}\n.photo-viewer[hidden]{display:none}\n.photo-viewer img{display:block;max-width:100%;max-height:72vh;object-fit:contain;border-radius:14px;box-shadow:0 0 34px #9b69d855}\n.photo-viewer-tools{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}\n.photo-like{min-width:120px;background:#321b43;border-color:#a66bff}\n.photo-like.liked{background:#65234c;border-color:#ff79bd;color:#fff}\n#photo-like-count{font-size:13px;color:#d8c5ff;min-width:72px;text-align:center}\n#photo-view-status{font-size:12px;color:#c5a4ff;min-height:16px;text-align:center}\n.name{padding-bottom:9px;min-width:0}\n.name h1{font-size:26px;margin:0 0 6px;overflow-wrap:anywhere}\n.name p{margin:0;color:var(--muted);font-size:13px;overflow-wrap:anywhere}\n.bio{color:#c9c2d7;line-height:1.6;margin:20px 0}\n.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}\nbutton{cursor:pointer;border:1px solid #62458b;border-radius:24px;padding:11px 18px;background:#2a1b3d;color:#f1e7ff;font-size:14px}\nbutton.primary{background:linear-gradient(100deg,#6335a0,#39205f);border-color:#9b69d8}\nbutton:disabled{opacity:.5;cursor:wait}\n.editor{margin-top:20px;padding:20px;border:1px solid var(--line);border-radius:16px;background:#100f19}\n.editor[hidden]{display:none}\n.editor h2{font-size:17px;margin:0 0 16px}\nlabel{display:block;color:#c9bddc;font-size:13px;margin:13px 0 7px}\ninput,textarea{width:100%;margin-top:12px;padding:12px 14px;border-radius:11px;border:1px solid #403653;background:#0b0a12;color:#fff;font:inherit;outline:none}\ntextarea{min-height:90px;resize:vertical}\n.hint{font-size:12px;color:var(--muted);line-height:1.5}\n#message{min-height:20px;margin-top:12px;color:#c5a4ff;font-size:13px;overflow-wrap:anywhere}\n.empty{padding:22px;border:1px dashed #55456c;border-radius:14px;color:var(--muted);margin-top:20px;line-height:1.55}\n@media(max-width:600px){.topbar{height:60px;padding:0 14px}.logo{font-size:20px}.wrap{margin:18px auto;padding:0 12px}.cover{height:115px}.profile{padding:0 16px 20px}.avatar{width:88px;height:88px;font-size:34px}.identity{gap:12px;margin-top:-38px}.name h1{font-size:21px}.stats{gap:18px}}\n\n.publish-box{margin:0 0 18px;padding:16px;border:1px solid #55416f;border-radius:16px;background:linear-gradient(145deg,#191625,#100f19)}\n.publish-box>button{width:100%;font-weight:700}\n.publish-editor{margin-top:14px}\n.publish-editor[hidden]{display:none}\n.publish-editor textarea{margin-top:0;min-height:110px}\n.media-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:12px 0}\n.media-option{display:flex;align-items:center;gap:8px;padding:10px;border:1px solid #403653;border-radius:11px;background:#0d0b15;color:#eee5ff;font-size:13px}\n.media-option input{width:auto;margin:0;accent-color:#a66bff}\n.media-file{margin:8px 0 12px;padding:10px;border:1px dashed #55456c;border-radius:10px}\n.media-file[hidden]{display:none}\n.media-file input{margin:0;padding:8px;font-size:12px}\n.post-media{display:grid;gap:10px;margin-top:12px}\n.post-media img,.post-media video{display:block;width:100%;max-height:520px;object-fit:contain;border-radius:12px;background:#090910}\n.post-media audio{width:100%}\n.post-photo-wrap{position:relative;display:block;width:100%;overflow:hidden;border-radius:12px;background:#090910;line-height:0}\n.post-photo-wrap>img{display:block;width:100%;max-height:520px;object-fit:contain;border-radius:12px;background:#090910}\n.post-photo-wrap>img{cursor:zoom-in}\n.post-photo-viewer{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(2,1,7,.98);touch-action:none;overscroll-behavior:contain}\n.post-photo-viewer[hidden]{display:none}\n.post-photo-viewer img{display:block;max-width:100vw;max-height:100dvh;width:auto;height:auto;object-fit:contain;user-select:none;-webkit-user-drag:none;touch-action:none}\n.post-photo-viewer-close{position:absolute;top:max(14px,env(safe-area-inset-top));right:14px;z-index:2;width:38px;height:38px;border:1px solid #ffffff30;border-radius:50%;background:#171321bb;color:#fff;font-size:22px;line-height:1}\n\n.mini-audio-bar{--player-rgb:8,7,13;--player-accent:166,107,255;position:absolute;left:0;right:0;bottom:0;z-index:2;display:flex;align-items:center;gap:8px;height:25px;padding:0 8px;border:0;border-top:1px solid rgba(255,255,255,.10);border-radius:0 0 10px 10px;background:rgba(var(--player-rgb),.34);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:rgba(255,255,255,.78);box-sizing:border-box;transition:background-color .45s ease}\n.mini-audio-play{flex:0 0 17px;width:17px;height:17px;padding:0;border:0;border-radius:50%;background:rgba(var(--player-accent),.42);color:rgba(255,255,255,.92);font-size:9px;line-height:17px;text-align:center}\n.mini-audio-progress{flex:1;min-width:20px;width:100%;height:2px;margin:0;accent-color:rgba(var(--player-accent),.9);cursor:pointer;opacity:.72}\n.mini-audio-time{flex:0 0 auto;color:rgba(255,255,255,.62);font-size:8px;font-variant-numeric:tabular-nums;white-space:nowrap}\n.mini-audio-standalone{position:relative;display:flex;align-items:center;min-height:34px;padding:0;border-radius:10px}\n.mini-audio-standalone .mini-audio-bar{position:relative;left:auto;right:auto;bottom:auto;width:100%;height:29px;background:rgba(30,22,43,.58)}\n\n@media(max-width:380px){.media-options{grid-template-columns:1fr}}\n\n\n/* Cyber profile refresh */\n.wrap{max-width:960px;margin:22px auto}\n.quick-nav{display:flex;gap:8px;overflow-x:auto;padding:3px 1px 12px;margin:0 0 14px;scrollbar-width:none}\n.quick-nav::-webkit-scrollbar{display:none}\n.quick-nav a,.quick-nav button{flex:0 0 auto;min-height:42px;padding:9px 15px;border-radius:12px;background:#11101b;border-color:#38304c;white-space:nowrap}\n.quick-nav a:first-child{background:linear-gradient(110deg,#382052,#1a1529);border-color:#8154ad}\n.card{border:1px solid #49345f;border-radius:22px;background:linear-gradient(145deg,#171321,#0e0d16);box-shadow:0 12px 45px #0007,0 0 28px #7d3fba12}\n.cover{height:210px;position:relative;overflow:hidden;background:radial-gradient(ellipse at 72% 30%,#a34bff66 0,transparent 34%),radial-gradient(ellipse at 22% 80%,#4626a966 0,transparent 42%),linear-gradient(125deg,#090912 5%,#21102f 48%,#111b35 100%)}\n.cover:before{content:\"\";position:absolute;inset:0;background:linear-gradient(110deg,transparent 0 35%,#c16aff18 36%,transparent 39% 62%,#8a50ff20 63%,transparent 67%),repeating-linear-gradient(135deg,transparent 0 24px,#ffffff08 25px,transparent 26px 48px)}\n.cover:after{content:\"FLOUSTREAM\";position:absolute;right:22px;bottom:16px;font-size:clamp(24px,6vw,44px);font-weight:900;letter-spacing:.18em;color:#ffffff12;text-shadow:0 0 25px #a45bff55;pointer-events:none}\n.cover-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}\n.cover-photo[hidden]{display:none}\n \n.profile{padding:0 28px 24px}\n.identity{align-items:flex-end;gap:18px;margin-top:-56px}\n.avatar{width:124px;height:124px;position:relative;isolation:isolate;flex:0 0 124px;border:3px solid #b879e8;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#6336a3,#17152b);box-shadow:0 0 0 1px #e3c8ff66,0 0 7px #b879ff88,0 0 16px #9b55ff66;animation:avatarFrameGlow 3.4s ease-in-out infinite;z-index:2;display:block}\n.avatar img{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover;border-radius:50%;margin:0;z-index:0}\n@keyframes avatarFrameFlow{0%{background-position:0 0,0% 50%}100%{background-position:0 0,100% 50%}}\n@media(prefers-reduced-motion:reduce){.avatar{animation:none}}\n.name{padding-bottom:10px}\n.name h1{font-size:clamp(22px,4vw,30px);letter-spacing:.01em}\n.name p{color:#c59aff}\n.bio{margin:16px 0 18px;max-width:650px;color:#c9c0d8}\n.profile .actions{margin-top:8px}\n.profile .actions button{border-radius:12px}\n#logout-button{background:#17131f;border-color:#393044;color:#bcb3ca}\n@media(max-width:600px){.wrap{margin:14px auto;padding:0 11px}.cover{height:158px}.profile{padding:0 15px 18px}.identity{gap:12px;margin-top:-43px}.avatar{width:96px;height:96px;font-size:32px}.name{padding-bottom:6px}}\n\n.photo-likers{display:flex;align-items:center;justify-content:center;gap:9px;flex-wrap:wrap}\n.photo-liker-avatars{display:flex;align-items:center;padding-left:5px}\n.photo-liker-avatar{width:30px;height:30px;border-radius:50%;border:2px solid #171321;margin-left:-6px;overflow:hidden;background:#39234f;display:grid;place-items:center;color:#f2e8ff;font-size:11px;font-weight:700}\n.photo-liker-avatar img{width:100%;height:100%;object-fit:cover}\n.photo-like-count-button{border:0;background:transparent;color:#d8c5ff;padding:7px 9px;min-width:0;text-decoration:underline;text-underline-offset:3px}\n.photo-like-count-button:hover{color:#fff}\n.likers-modal{position:fixed;inset:0;z-index:40;background:#05040be8;display:grid;place-items:center;padding:18px}\n.likers-modal[hidden]{display:none}\n.likers-panel{width:min(100%,390px);max-height:78vh;overflow:auto;padding:20px;border:1px solid #55416f;border-radius:18px;background:#171321;box-shadow:0 18px 60px #0009}\n.likers-panel h2{font-size:18px;margin:0 0 15px}\n.likers-list{display:flex;flex-direction:column;gap:10px}\n.liker-row{display:flex;align-items:center;gap:11px;padding:8px;border:1px solid #342943;border-radius:12px;background:#100f19}\n.liker-row .photo-liker-avatar{width:40px;height:40px;margin:0;flex:0 0 40px}\n.liker-name{font-size:14px;color:#f2eaff;overflow-wrap:anywhere}\n.likers-empty{color:var(--muted);font-size:13px;padding:12px 2px}\n\n\n.post-owner-tools{margin-left:auto;display:flex;align-items:center}\n.post-edit-button{padding:7px 10px;font-size:12px;border-radius:10px;background:#21172f;border-color:#65458a;color:#dfc9ff;white-space:nowrap}\n.post-edit-panel{display:grid;gap:10px;margin-top:12px;padding:13px;border:1px solid #65458a;border-radius:13px;background:#100d19}\n.post-edit-panel label{display:grid;gap:7px;font-size:12px;color:#cfc2e8}\n.post-edit-panel textarea{width:100%;min-height:100px;padding:11px;border:1px solid #49385e;border-radius:10px;background:#090811;color:#fff;font:inherit;resize:vertical}\n.post-edit-panel input[type=file]{width:100%;font-size:12px}\n.post-edit-label{font-size:12px;color:#cfc2e8}\n.post-edit-media-row{display:flex!important;align-items:center;justify-content:space-between;padding:8px 10px;border:1px solid #302640;border-radius:9px;background:#171321}\n.post-edit-media-row input{width:18px;height:18px;accent-color:#a66bff}\n.post-edit-status{font-size:12px;color:#c5a4ff;min-height:16px;overflow-wrap:anywhere}\n@media(max-width:380px){.post-edit-button{padding:6px 7px;font-size:11px}}\n\n/* FLOUSTREAM slide navigation */\n.quick-nav{display:none!important}\n.drawer-menu-button{position:fixed;z-index:83;left:14px;top:15px;width:44px;height:44px;display:grid;place-items:center;padding:0;border:1px solid #704b91;border-radius:14px;background:linear-gradient(145deg,#21152ff2,#100d19f2);box-shadow:0 0 16px #8d50e733,inset 0 0 12px #9b5bd511;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:1;transform:scale(1);visibility:visible;transition:opacity .18s ease,transform .18s ease,visibility .18s}\n.drawer-menu-button.is-hidden{opacity:0;transform:scale(.78);visibility:hidden;pointer-events:none}\n.sound-signal{display:flex;align-items:center;justify-content:center;gap:3px;width:22px;height:22px}\n.sound-signal i{display:block;width:3px;border-radius:3px;background:linear-gradient(180deg,#e9d5ff,#a66bff);box-shadow:0 0 7px #b879ff99}\n.sound-signal i{transform-origin:center;animation:signalEqualizer .78s ease-in-out infinite alternate}\n.sound-signal i:nth-child(1){height:8px;animation-delay:-.62s}\n.sound-signal i:nth-child(2){height:16px;animation-delay:-.38s}\n.sound-signal i:nth-child(3){height:21px;animation-delay:-.12s}\n.sound-signal i:nth-child(4){height:12px;animation-delay:-.5s}\n.sound-signal i:nth-child(5){height:6px;animation-delay:-.27s}\n@keyframes signalEqualizer{0%{transform:scaleY(.28);opacity:.68}100%{transform:scaleY(1);opacity:1}}\n@media(prefers-reduced-motion:reduce){.sound-signal i{animation:none}}\n.drawer-edge{position:fixed;z-index:81;left:0;top:0;bottom:0;width:22px;touch-action:pan-y}\n.drawer-backdrop{position:fixed;z-index:80;inset:0;background:#030209;opacity:0;pointer-events:none;transition:opacity .18s}\n.drawer-backdrop.visible{pointer-events:auto}\n.side-drawer{display:flex;flex-direction:column;--drawer-x:-100%;position:fixed;z-index:82;left:0;top:0;bottom:0;width:min(82vw,320px);padding:22px 16px max(22px,env(safe-area-inset-bottom));overflow-y:auto;overscroll-behavior:contain;background:linear-gradient(160deg,#1b1428,#0c0b14 72%);border-right:1px solid #8054aa;box-shadow:12px 0 42px #0009;transform:translate3d(var(--drawer-x),0,0);transition:transform .24s cubic-bezier(.2,.8,.2,1);will-change:transform;touch-action:pan-y}\n.side-drawer.dragging{transition:none}\n.side-drawer-head{display:flex;align-items:center;justify-content:space-between;margin:2px 2px 24px}\n.side-drawer-logo{font-size:21px;font-weight:900;letter-spacing:3px;color:#f5eaff;text-shadow:0 0 18px #9b55ff}\n.side-drawer-close{width:36px;height:36px;padding:0;border-radius:11px;background:#21172f;font-size:20px}\n.side-drawer-caption{margin:0 8px 9px;color:#8f83a5;font-size:10px;letter-spacing:1.5px;text-transform:uppercase}\n.side-drawer-links{display:grid;gap:7px}\n.side-drawer-link{display:flex;align-items:center;gap:13px;width:100%;min-height:49px;padding:10px 13px;border:1px solid transparent;border-radius:12px;background:transparent;color:#e9ddff;text-align:left;font-size:14px}\n.side-drawer-link:active,.side-drawer-link.active{background:linear-gradient(100deg,#392052aa,#1b1429);border-color:#68458d}\n.side-drawer-icon{width:23px;text-align:center;color:#c18aff;font-size:18px}\n@property --author-color{syntax:\"<color>\";inherits:false;initial-value:#ff4fd8}\n@property --author-deep{syntax:\"<color>\";inherits:false;initial-value:#8b2cff}\n.author-nav-link{gap:13px}\n.author-label{display:inline-flex;align-items:center;gap:0;font-size:15px;font-weight:900;letter-spacing:.035em}\n.author-label span{display:inline-block;color:var(--author-color,#ff4fd8);background:linear-gradient(180deg,#fff 0%,var(--author-color,#ff4fd8) 43%,var(--author-deep,#8b2cff) 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 4px var(--author-color,#ff4fd8)) drop-shadow(0 0 9px var(--author-color,#ff4fd8));transition:--author-color .9s ease,--author-deep .9s ease,filter .9s ease}\n@media(prefers-reduced-motion:reduce){.author-label span{transition:none}}\n.side-drawer-divider{height:1px;margin:17px 4px;background:#33283f}\n.nav-history{margin:13px 4px 2px;padding:11px 9px 10px;border:1px solid #342541;border-radius:13px;background:#110e19aa}\n.nav-history .side-drawer-caption{margin:0 0 8px 2px}\n.nav-history-items{display:grid;gap:6px}\n.nav-profile-visits{display:grid;gap:6px;margin:0 0 7px}.nav-profile-visit{display:flex;align-items:center;gap:9px;min-height:42px;padding:6px 8px;border:1px solid #352744;border-radius:9px;background:#1b1525;color:#e8dcf8;text-decoration:none;overflow:hidden}.nav-profile-visit:active{background:#352044}.nav-profile-visit-avatar{width:29px;height:29px;flex:0 0 29px;border-radius:50%;object-fit:cover;background:#30213e}.nav-profile-visit-copy{display:grid;min-width:0;gap:2px}.nav-profile-visit-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:650}.nav-profile-visit-time{color:#9586a8;font-size:10px}\n.nav-history-item{display:flex;align-items:center;gap:9px;width:100%;min-height:37px;padding:7px 8px;border:1px solid #352744;border-radius:9px;background:#1b1525;color:#d9c8f2;text-align:left;font-size:12px;overflow:hidden}\n.nav-history-item:active{background:#352044}\n.nav-history-item .side-drawer-icon{width:19px;font-size:15px}\n.nav-history-empty{padding:5px 2px;color:#81758f;font-size:11px}\n\n\n/* Drawer search menu */\n.drawer-search{margin:12px 4px 2px}\n.drawer-search-toggle{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:46px;padding:10px 13px;border:1px solid #654586;border-radius:12px;background:linear-gradient(110deg,#342044,#1a1426);color:#f0e4ff;font-size:14px;font-weight:700;box-shadow:0 5px 18px #0003;transition:border-color .18s,background .18s}\n.drawer-search-toggle:active,.drawer-search-toggle[aria-expanded=\"true\"]{border-color:#b17bea;background:linear-gradient(110deg,#492966,#241831)}\n.drawer-search-toggle .drawer-search-chevron{margin-left:auto;color:#bd8aff;transition:transform .18s}\n.drawer-search-toggle[aria-expanded=\"true\"] .drawer-search-chevron{transform:rotate(180deg)}\n.drawer-search-options{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}\n.drawer-search-options[hidden]{display:none}\n.drawer-search-option{display:flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:8px 6px;border:1px solid #49345f;border-radius:10px;background:#15101f;color:#e6d5fb;font-size:12px;font-weight:600}\n.drawer-search-option:active{background:#38214e;border-color:#9d69cf}\n.drawer-search-option span{font-size:16px;color:#c18aff}\n.side-drawer-foot{margin:22px 8px 0;color:#756b87;font-size:11px;line-height:1.5}\n@media(prefers-reduced-motion:reduce){.drawer-backdrop,.side-drawer{transition:none}}\n\n\n/* Настройки аккаунта и внешний вид */\n.drawer-bottom{margin-top:auto;padding-top:18px}\n.drawer-settings-button{margin-bottom:9px}\n.drawer-logout-button{width:100%;min-height:48px;border:1px solid #633746;border-radius:12px;background:#24131d;color:#ffb9c7;text-align:left;padding:10px 13px;font-size:14px}\n.drawer-shell{min-height:100%;display:flex;flex-direction:column}\n.settings-backdrop{position:fixed;z-index:110;inset:0;display:grid;place-items:center;padding:18px;background:#05030bd9;backdrop-filter:blur(8px)}\n.settings-backdrop[hidden]{display:none}\n.settings-panel{width:min(100%,440px);max-height:min(88vh,760px);overflow:auto;padding:20px;border:1px solid #76519d;border-radius:19px;background:linear-gradient(155deg,#1c1729,#0d0c15);box-shadow:0 0 38px #8d50e733}\n.settings-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}\n.settings-head h2{margin:0;font-size:20px;color:#f2e9ff}\n.settings-close{width:36px;height:36px;display:flex;align-items:center;justify-content:center;padding:0;line-height:1;border:1px solid #49375f;border-radius:10px;background:#21172f;color:#eee;font-size:21px}\n.settings-label{display:block;margin:16px 0 7px;color:#cbb9e6;font-size:13px}\n.settings-panel select,.settings-panel input{width:100%;min-height:44px;padding:10px 12px;border:1px solid #514264;border-radius:11px;background:#100e19;color:#f5efff;font-size:14px}\n.settings-help{margin:7px 0 0;color:#8f849f;font-size:11px;line-height:1.5}\n.settings-actions{display:flex;gap:9px;margin-top:15px}\n.settings-actions button{flex:1;min-height:43px}\n.settings-divider{height:1px;margin:21px 0;background:#382d49}\n.settings-status{min-height:18px;margin:12px 0 0;color:#c5a4ff;font-size:12px;line-height:1.5}\n.album-backdrop{position:fixed;inset:0;z-index:125;background:#05030beF;backdrop-filter:blur(9px);display:grid;place-items:center;padding:14px}\n.album-backdrop[hidden]{display:none}\n.album-panel{width:min(100%,620px);max-height:92vh;overflow:auto;padding:20px;border:1px solid #76519d;border-radius:19px;background:linear-gradient(155deg,#1c1729,#0d0c15);box-shadow:0 0 38px #8d50e733}\n.album-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}\n.album-head h2{margin:0;color:#f2e9ff;font-size:20px}\n.album-upload{display:grid;gap:12px;padding:14px;border:1px solid #49375f;border-radius:14px;background:#120f1c}\n.album-upload label{display:flex;align-items:center;gap:10px;color:#eee4ff;font-size:14px}\n.album-upload input[type=checkbox]{width:19px;height:19px;accent-color:#a66bff}\n.album-upload input[type=file]{width:100%;color:#cbb9e6}\n.album-note{margin:0;color:#9e91af;font-size:12px;line-height:1.5}\n.album-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:2px;margin-top:12px}\n.album-item{aspect-ratio:1;border:0!important;border-radius:3px!important;min-width:0}\n.album-item img{width:100%;height:100%;object-fit:cover}\n.album-item small{display:none}\n@media(max-width:700px){.album-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:2px;margin-top:10px}}\n@media(max-width:420px){.album-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:2px}}\n.album-viewer-tools{position:absolute;top:14px;right:68px;left:auto;bottom:auto;transform:none;z-index:6;display:flex;gap:8px;align-items:center}\n.album-viewer-tools button{width:48px;height:48px;padding:0;border-radius:50%;font-size:23px;display:grid;place-items:center;background:#21172eea;border:1px solid #a66bff88;box-shadow:0 5px 22px #0009}\n.album-viewer-tools button.danger{border-color:#ff718b99;background:#401b2bea;color:#ffe2e8}\n#album-viewer-share,#private-album-share{position:relative;isolation:isolate;overflow:visible;border:1px solid #d9b5ff;background:linear-gradient(145deg,#d7a8ff 0%,#9252e8 42%,#4a2a91 100%);color:#fff;box-shadow:0 0 0 1px #a66bff55,0 0 18px #a66bff99,0 7px 24px #000b;transition:transform .18s ease,box-shadow .18s ease}\n#album-viewer-share::before,#private-album-share::before{content:\"\";position:absolute;inset:-5px;border-radius:50%;z-index:-1;background:radial-gradient(circle,#b77aff55 0%,transparent 70%);filter:blur(4px)}\n#album-viewer-share,#private-album-share{width:44px;min-width:44px;padding:0;border-radius:14px;font-size:12px;font-weight:900;letter-spacing:.3px;text-transform:none;text-shadow:0 1px 3px #3c176e99}\n#album-viewer-share:active,#private-album-share:active{transform:scale(.92);box-shadow:0 0 0 2px #d9b5ff66,0 0 24px #b77affcc,0 5px 16px #000b}\n@media(hover:hover){#album-viewer-share:hover,#private-album-share:hover{transform:translateY(-2px);box-shadow:0 0 0 1px #e6cfff,0 0 25px #b77affcc,0 9px 26px #000b}}\n.album-viewer-tools button:active{transform:scale(.94)}\n.album-viewer-counter{bottom:max(14px,env(safe-area-inset-bottom))!important}\n.album-item{position:relative;aspect-ratio:1;border:1px solid #49375f;border-radius:10px;overflow:hidden;background:#100e19}\n.album-item img{width:100%;height:100%;object-fit:cover;display:block}\n.album-item small{position:absolute;left:5px;bottom:5px;padding:3px 6px;border-radius:6px;background:#08060dcc;color:#fff;font-size:10px}\n.album-empty{padding:24px 8px;text-align:center;color:#9589a6;font-size:13px}\n.album-status{min-height:18px;margin-top:10px;color:#c5a4ff;font-size:12px}\n@media(max-width:420px){.album-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}\nbody[data-theme=\"ocean\"]{--purple:#54bfff}\nbody[data-theme=\"ocean\"] .cover{background:radial-gradient(ellipse at 70% 20%,#236caa 0,transparent 45%),linear-gradient(110deg,#102b42,#151b32 55%,#101c35)}\nbody[data-theme=\"ocean\"] .avatar{box-shadow:0 0 24px #249be777}\nbody[data-theme=\"rose\"]{--purple:#ff79b7}\nbody[data-theme=\"rose\"] .cover{background:radial-gradient(ellipse at 70% 20%,#a83d79 0,transparent 45%),linear-gradient(110deg,#35142c,#26152b 55%,#171323)}\nbody[data-theme=\"rose\"] .avatar{box-shadow:0 0 24px #ff69ae77}\nbody[data-theme=\"mono\"]{--purple:#c5c5d4;--line:#454552}\nbody[data-theme=\"mono\"] .cover{background:radial-gradient(ellipse at 70% 20%,#666676 0,transparent 45%),linear-gradient(110deg,#262630,#171720 55%,#101019)}\n\n\n@media(max-width:700px){\n .wrap{width:100%;max-width:none;margin:0;padding:0}\n .card{border-left:0;border-right:0;border-radius:0}\n .profile{padding:0 14px 22px}\n .quick-nav{margin-left:0;margin-right:0;padding-left:10px;padding-right:10px}\n .quick-status{padding-left:12px;padding-right:12px}\n .feed-section{margin-top:16px}\n .feed-title{padding-left:12px;padding-right:12px}\n .publish-box{padding-left:12px;padding-right:12px}\n .feed{gap:0}\n .post{border-left:0;border-right:0;border-radius:0}\n .post+.post{border-top:0;border-bottom:1px solid var(--line)}\n}\n\n@media(max-width:700px){\n .card{width:calc(100% - 14px);margin-left:7px;margin-right:7px;border:1px solid var(--line);border-radius:19px;overflow:hidden}\n .post{width:calc(100% - 14px);margin-left:7px;margin-right:7px;border:1px solid var(--line);border-radius:17px}\n .post+.post{border-top:1px solid var(--line)}\n}\n\n/* DOLBY EMOJI STATION */\n.emoji-picker{position:relative;margin:8px 0 12px}\n.emoji-picker-trigger{display:inline-flex;align-items:center;justify-content:center;width:39px;height:36px;border:1px solid #594078;border-radius:11px;background:linear-gradient(145deg,#21172f,#100d19);color:#eadcff;font-size:21px;box-shadow:0 0 13px #8d50e722}\n.emoji-picker-trigger:active{transform:scale(.94)}\n.emoji-picker-panel{margin-top:8px;padding:10px;border:1px solid #63458b;border-radius:15px;background:linear-gradient(145deg,#171222,#0b0a12);box-shadow:0 12px 35px #0009,0 0 18px #8d50e722}\n.emoji-picker-panel[hidden]{display:none}\n.emoji-category-tabs{display:flex;gap:6px;overflow-x:auto;padding:1px 1px 9px;scrollbar-width:thin;scrollbar-color:#65458a transparent}\n.emoji-category-tab{flex:0 0 37px;width:37px;height:36px;padding:0;border:1px solid #342943;border-radius:10px;background:#100d19;color:#fff;font-size:20px}\n.emoji-category-tab[aria-pressed=\"true\"]{border-color:#b47aff;background:linear-gradient(145deg,#38204f,#1b1428);box-shadow:0 0 12px #a66bff55}\n.emoji-grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:4px;max-height:190px;overflow-y:auto;padding:2px;overscroll-behavior:contain}\n.emoji-item{min-width:0;aspect-ratio:1;border:0;border-radius:9px;background:transparent;color:#fff;font-size:24px;display:grid;place-items:center;padding:0}\n.emoji-item:active{background:#a66bff33;transform:scale(.9)}\n@media(max-width:380px){.emoji-grid{grid-template-columns:repeat(7,minmax(0,1fr))}.emoji-item{font-size:22px}}\n\n\n/* Compact emoji layout: keep every row inside the screen */\n.emoji-picker-panel{width:100%;max-width:100%;min-width:0;padding:8px;overflow:hidden}\n.emoji-category-tabs{width:100%;max-width:100%;min-width:0;gap:4px}\n.emoji-grid{width:100%;min-width:0;grid-template-columns:repeat(9,minmax(0,1fr));gap:2px;padding:0;overflow-x:hidden}\n.emoji-item{width:100%;min-width:0;max-width:100%;font-size:clamp(16px,4.8vw,20px);line-height:1;overflow:hidden}\n@media(max-width:360px){.emoji-grid{grid-template-columns:repeat(8,minmax(0,1fr))}.emoji-item{font-size:18px}}\n\n\n/* FLOUSTREAM fullscreen composer */\n.publish-editor.composer-fullscreen{position:fixed;inset:0;z-index:1200;display:flex;flex-direction:column;gap:10px;margin:0;padding:calc(16px + env(safe-area-inset-top)) 14px calc(12px + env(safe-area-inset-bottom));background:radial-gradient(ellipse at 20% 0%,#29133f 0,transparent 38%),#090910;overflow:auto;border:0;border-radius:0}\n.publish-editor.composer-fullscreen[hidden]{display:none}\n.composer-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex:0 0 auto}\n.composer-top strong{font-size:17px;letter-spacing:.03em}\n.composer-close{width:38px;height:38px;padding:0;border-radius:50%;font-size:22px}\n.publish-editor.composer-fullscreen>label{margin:2px 0 0}\n.publish-editor.composer-fullscreen>#post-text{flex:1 1 auto;min-height:140px;height:auto;resize:none;margin:0;padding:16px;border-radius:16px;font-size:17px;line-height:1.65;background:#100e19;border-color:#65458a}\n.composer-tools{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:9px;border:1px solid #40304f;border-radius:15px;background:#15111f;flex:0 0 auto}\n.composer-tools button,.composer-tools select{min-height:36px;padding:7px 10px;border:1px solid #59406f;border-radius:10px;background:#21182e;color:#f1e7ff;font-size:13px}\n.composer-tools select{width:auto;margin:0}\n.composer-colors{display:flex;align-items:center;gap:6px}\n.composer-color{width:25px!important;min-width:25px;height:25px!important;min-height:25px!important;padding:0!important;border:2px solid #ffffff70!important;border-radius:50%!important}\n.publish-editor.composer-fullscreen .emoji-picker{order:0;flex:1 1 100%;width:100%;min-width:0}\n.publish-editor.composer-fullscreen .emoji-picker-panel{max-height:28vh;overflow:auto}\n.publish-editor.composer-fullscreen .hint{display:none}\n.publish-editor.composer-fullscreen .media-file{margin:0;flex:0 0 auto}\n.publish-editor.composer-fullscreen .actions{margin:0;flex:0 0 auto}\n@media(max-width:420px){.composer-tools{gap:5px;padding:7px}.composer-tools button,.composer-tools select{font-size:12px;padding:7px 8px}.publish-editor.composer-fullscreen>#post-text{font-size:16px}}\n\n/* Composer v2: focus-first, emoji dock */\n.publish-editor.composer-fullscreen{position:fixed;inset:0;z-index:1200;display:flex;flex-direction:column;gap:9px;margin:0;padding:calc(10px + env(safe-area-inset-top)) 12px calc(10px + env(safe-area-inset-bottom));background:radial-gradient(ellipse at 20% 0%,#29133f 0,transparent 38%),#090910;overflow:hidden;border:0;border-radius:0;height:100dvh;box-sizing:border-box}\n.publish-editor.composer-fullscreen[hidden]{display:none}\n.composer-top{display:flex;align-items:center;justify-content:flex-start;gap:12px;flex:0 0 42px}\n.composer-top strong{font-size:16px;letter-spacing:.03em}\n.composer-back{display:none;width:40px;height:40px;min-width:40px;padding:0;border:1px solid #68458a;border-radius:13px;background:#1b1427;color:#fff;font-size:26px;line-height:1}.composer-fullscreen .composer-back{display:block}\n.composer-top-spacer{flex:1}\n.publish-editor.composer-fullscreen>label{display:none}\n.publish-editor.composer-fullscreen>#post-text{display:block;flex:1 1 0;min-height:0!important;height:auto!important;width:100%;box-sizing:border-box;resize:none;margin:0;padding:16px;border-radius:17px;font-size:17px;line-height:1.65;background:#100e19;border:1px solid #65458a;color:#fff;outline:none}\n.emoji-dock{display:none}\n.publish-editor.composer-fullscreen .emoji-dock{display:flex;flex:0 0 auto;flex-direction:column;gap:7px;min-height:48px}\n.publish-editor.composer-fullscreen .emoji-picker{display:flex;flex-direction:column;width:100%;min-width:0;gap:7px}\n.publish-editor.composer-fullscreen .emoji-picker-trigger{width:100%;height:46px;min-height:46px;border:1px solid #7951a1;border-radius:14px;background:linear-gradient(110deg,#21142f,#171321);color:#e6caff;font-size:23px;box-shadow:0 0 16px #9c55ff22}\n.publish-editor.composer-fullscreen .emoji-picker-panel{position:relative;inset:auto;width:100%;max-width:100%;min-width:0;max-height:32dvh;overflow:auto;padding:8px;border:1px solid #65458a;border-radius:15px;background:#100d18;box-sizing:border-box}\n.publish-editor.composer-fullscreen .emoji-category-tabs{display:flex;flex-wrap:nowrap;overflow-x:auto;gap:5px;padding-bottom:7px}\n.publish-editor.composer-fullscreen .emoji-category-tab{flex:0 0 34px;width:34px;height:34px;min-width:34px;border-radius:10px}\n.publish-editor.composer-fullscreen .emoji-grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:4px}\n.publish-editor.composer-fullscreen .emoji-item{min-width:0;width:100%;height:36px;min-height:36px;padding:0;font-size:19px;line-height:1;overflow:hidden}\n.publish-editor.composer-fullscreen .hint{display:none}\n.publish-editor.composer-fullscreen .media-file{flex:0 0 auto;margin:0}\n.publish-editor.composer-fullscreen .actions{flex:0 0 auto;margin:0}\n.publish-editor.composer-fullscreen #publish-status{flex:0 0 auto;max-height:36px;overflow:auto}\n@media(max-width:380px){.publish-editor.composer-fullscreen .emoji-grid{grid-template-columns:repeat(7,minmax(0,1fr))}.publish-editor.composer-fullscreen .emoji-item{font-size:18px}}\n\n/* FLOUSTREAM scheduled publishing queue */\n.schedule-options{display:flex;flex-direction:column;gap:10px;margin:12px 0;padding:12px;border:1px solid #4c3764;border-radius:13px;background:#120f1c}\n.schedule-toggle{display:flex;align-items:center;gap:9px;color:#e8dcf7;font-size:13px}\n.schedule-toggle input{width:18px;height:18px;accent-color:#a66bff}\n.schedule-time-wrap{display:flex;flex-direction:column;gap:7px}\n.schedule-time-wrap[hidden]{display:none}\n.schedule-time-wrap label,.scheduled-edit-panel label{color:#cdb9e8;font-size:12px}\n.schedule-time-wrap input,.scheduled-edit-panel input[type=\"datetime-local\"],.scheduled-edit-panel textarea{width:100%;min-height:43px;padding:10px;border:1px solid #594273;border-radius:10px;background:#0b0a12;color:#f5efff;font:inherit}\n.schedule-help{color:#9385a7;font-size:11px;line-height:1.5}\n.scheduled-queue{margin:0 0 18px;padding:13px;border:1px solid #76519d;border-radius:17px;background:linear-gradient(155deg,#1b1527,#0d0c15);box-shadow:0 0 22px #8d50e722}\n.scheduled-queue[hidden]{display:none}\n.scheduled-queue-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}\n.scheduled-queue-head h2{margin:0;color:#eadcff;font-size:16px}\n.scheduled-queue-head span{color:#bda0e7;font-size:11px}\n#scheduled-queue-list{display:flex;flex-direction:column;gap:12px}\n.scheduled-item{padding:12px;border:1px solid #3f3151;border-radius:13px;background:#100e18}\n.scheduled-item-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:9px}\n.scheduled-item-head strong{color:#f1e8ff;font-size:13px}\n.scheduled-item-head time{color:#bca2df;font-size:11px;text-align:right}\n.scheduled-content{color:#e8e0f2;font-size:14px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}\n.scheduled-media{display:flex;flex-direction:column;gap:8px;margin-top:10px}\n.scheduled-media img,.scheduled-media video{display:block;width:100%;max-height:320px;object-fit:contain;border-radius:10px;background:#08070c}\n.scheduled-media audio{width:100%}\n.scheduled-failed{margin:8px 0;padding:9px;border:1px solid #8d4b4b;border-radius:9px;background:#351919;color:#ffcaca;font-size:11px;line-height:1.45;overflow-wrap:anywhere}\n.scheduled-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}\n.scheduled-actions button{min-height:36px;padding:7px 12px;border:1px solid #594273;border-radius:9px;background:#21172f;color:#eee;font-size:12px}\n.scheduled-actions button.primary{background:linear-gradient(120deg,#6938a1,#9b5de5);border-color:#a66bff}\n.scheduled-edit-panel{display:flex;flex-direction:column;gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid #443454}\n.scheduled-edit-panel textarea{min-height:100px;resize:vertical}\n.scheduled-edit-panel input[type=\"file\"]{display:block;width:100%;margin-top:6px;color:#cdb9e8;font-size:12px}\n.scheduled-edit-label{color:#cdb9e8;font-size:12px}\n.scheduled-file-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px;border:1px solid #352a43;border-radius:9px;background:#15111e}\n.scheduled-file-row input{width:18px;height:18px;accent-color:#a66bff}\n.scheduled-edit-status{min-height:16px;color:#c9a8ff;font-size:12px;overflow-wrap:anywhere}\n#feed-list{display:flex;flex-direction:column;gap:16px}\n#feed-list>.post{margin:0 auto}\n\n\n.post-social-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px;padding-top:11px;border-top:1px solid #342943}\n.post-reaction-wrap{position:relative;display:inline-flex}\n.post-reaction-impact{position:relative;isolation:isolate}\n.post-reaction-impact::after{content:\"\";position:absolute;inset:-9px;border:2px solid #c18aff;border-radius:50%;pointer-events:none;animation:reactionImpactRing .62s ease-out forwards}\n@keyframes reactionImpactRing{0%{transform:scale(.35);opacity:0;box-shadow:0 0 0 #a66bff}25%{opacity:1;box-shadow:0 0 22px #b879ff}100%{transform:scale(1.65);opacity:0;box-shadow:0 0 34px #a66bff}}\n@keyframes reactionButtonPulse{0%{transform:scale(1)}35%{transform:scale(1.2);filter:brightness(1.65);box-shadow:0 0 24px #b879ff}100%{transform:scale(1);filter:none}}\n.post-reaction-toggle.reaction-button-pulse{animation:reactionButtonPulse .55s cubic-bezier(.2,.8,.2,1)}\n.reaction-flight{position:fixed;z-index:99999;left:0;top:0;pointer-events:none;font-size:30px;line-height:1;filter:drop-shadow(0 0 9px #c18aff);will-change:transform,opacity}\n.reaction-spark{position:fixed;z-index:99998;left:0;top:0;width:5px;height:5px;border-radius:50%;background:#e7c7ff;box-shadow:0 0 8px 2px #a66bff;pointer-events:none;will-change:transform,opacity}\n@media(prefers-reduced-motion:reduce){.post-reaction-impact::after,.post-reaction-toggle.reaction-button-pulse{animation:none}.reaction-flight,.reaction-spark{display:none}}\n\n.post-reaction-picker{position:absolute;left:0;bottom:calc(100% + 9px);z-index:15;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;width:min(306px,calc(100vw - 58px));padding:9px;border:1px solid #7952a0;border-radius:15px;background:rgba(18,14,28,.97);box-shadow:0 12px 36px #000b,0 0 22px #9b5bff22;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}\n.post-reaction-picker[hidden]{display:none}\n.post-reaction-option{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:0;min-height:49px;padding:5px 2px;border:1px solid #3c304d;border-radius:10px;background:#171321;color:#f5eaff}\n.post-reaction-option .reaction-emoji{font-size:21px;line-height:1.15;filter:drop-shadow(0 0 5px #a66bff55);transition:transform .2s,filter .2s}\n.post-reaction-option .reaction-count{font-size:10px;color:#b9a8cc;font-variant-numeric:tabular-nums}\n.post-reaction-option:hover .reaction-emoji{transform:translateY(-3px) scale(1.16);filter:drop-shadow(0 0 8px #d8aaff)}\n.post-reaction-option.is-active{border-color:#c18aff;background:linear-gradient(145deg,#42245d,#21162f);box-shadow:0 0 13px #a66bff44}\n.post-reaction-option.is-active .reaction-emoji{animation:reactionPop .42s cubic-bezier(.2,.8,.2,1)}\n@keyframes reactionPop{0%{transform:scale(.55) rotate(-14deg)}65%{transform:scale(1.28) rotate(7deg)}100%{transform:scale(1) rotate(0)}}\n.post-reaction-option[data-reaction=\"fire\"].is-active .reaction-emoji{animation:firePulse .7s ease-in-out}\n.post-reaction-option[data-reaction=\"love\"].is-active .reaction-emoji{animation:heartBeat .65s ease-in-out}\n.post-reaction-option[data-reaction=\"lol\"].is-active .reaction-emoji{animation:lolBounce .55s ease-out}\n.post-reaction-option[data-reaction=\"cool\"].is-active .reaction-emoji{animation:coolTilt .6s ease-in-out}\n.post-reaction-option[data-reaction=\"mind\"].is-active .reaction-emoji{animation:mindGlitch .42s steps(2,end)}\n.post-reaction-option[data-reaction=\"sad\"].is-active .reaction-emoji{animation:sadDrop .65s ease-out}\n.post-reaction-option[data-reaction=\"rock\"].is-active .reaction-emoji{animation:rockSwing .55s ease-in-out}\n.post-reaction-option[data-reaction=\"respect\"].is-active .reaction-emoji{animation:respectClap .5s ease-out}\n.post-reaction-option[data-reaction=\"wow\"].is-active .reaction-emoji{animation:wowFlash .5s ease-out}\n.post-reaction-option[data-reaction=\"dark\"].is-active .reaction-emoji{animation:darkPulse .75s ease-in-out}\n.post-reaction-option[data-reaction=\"eyes\"].is-active .reaction-emoji{animation:eyesBlink .55s ease-in-out}\n.post-reaction-option[data-reaction=\"diamond\"].is-active .reaction-emoji{animation:diamondTurn .7s ease-out}\n@keyframes firePulse{0%{transform:scale(.6);filter:drop-shadow(0 0 0 #ff7a18)}55%{transform:scale(1.35);filter:drop-shadow(0 0 12px #ff7a18)}100%{transform:scale(1);filter:drop-shadow(0 0 5px #ffcf70)}}\n@keyframes heartBeat{0%,100%{transform:scale(1)}25%{transform:scale(1.32)}45%{transform:scale(.92)}65%{transform:scale(1.2)}}\n@keyframes lolBounce{0%{transform:translateY(0) rotate(0)}35%{transform:translateY(-8px) rotate(-12deg)}70%{transform:translateY(2px) rotate(10deg)}100%{transform:translateY(0)}}\n@keyframes coolTilt{0%,100%{transform:rotate(0) scale(1)}35%{transform:rotate(-16deg) scale(1.2)}70%{transform:rotate(12deg) scale(1.08)}}\n@keyframes mindGlitch{0%,100%{transform:translateX(0);filter:hue-rotate(0)}25%{transform:translateX(-4px);filter:hue-rotate(100deg)}50%{transform:translateX(4px);filter:hue-rotate(-100deg)}75%{transform:translateX(-2px)}}\n@keyframes sadDrop{0%{transform:translateY(-7px);opacity:.55}65%{transform:translateY(3px);opacity:1}100%{transform:translateY(0)}}\n@keyframes rockSwing{0%,100%{transform:rotate(0)}30%{transform:rotate(-22deg)}65%{transform:rotate(18deg)}}\n@keyframes respectClap{0%{transform:scale(.75)}40%{transform:scale(1.3) rotate(-8deg)}75%{transform:scale(.94) rotate(7deg)}100%{transform:scale(1)}}\n@keyframes wowFlash{0%{transform:scale(.7);filter:brightness(1)}45%{transform:scale(1.35);filter:brightness(2.2) drop-shadow(0 0 9px #fff)}100%{transform:scale(1);filter:brightness(1)}}\n@keyframes darkPulse{0%,100%{transform:scale(1);filter:brightness(.8)}50%{transform:scale(1.25);filter:brightness(1.8) drop-shadow(0 0 9px #a66bff)}}\n@keyframes eyesBlink{0%,100%{transform:scaleY(1)}45%{transform:scaleY(.12)}70%{transform:scaleY(1.12)}}\n@keyframes diamondTurn{0%{transform:rotateY(0) scale(.7)}60%{transform:rotateY(190deg) scale(1.25)}100%{transform:rotateY(360deg) scale(1)}}\n@media(prefers-reduced-motion:reduce){.post-reaction-option .reaction-emoji{animation:none!important;transition:none!important}}\n.post-social-button{min-height:36px;padding:7px 13px;border:1px solid #49385e;border-radius:11px;background:#171321;color:#d9c9f0;font-size:13px}\n.post-social-button.is-active{border-color:#a66bff;background:#38204e;color:#fff;box-shadow:0 0 12px #9d5bff22}\n.post-social-button.repost-flow{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-width:0;padding:6px 10px;border:1px solid #59436f;border-radius:999px;background:linear-gradient(135deg,#21192d,#15111e);color:#d9c9f0;transition:border-color .22s,background .22s,box-shadow .22s,transform .22s}\n.repost-flow .flow-label{font-size:10px;font-weight:800;letter-spacing:1.15px;line-height:1;text-transform:uppercase}\n.repost-flow .flow-count{font-size:10px;font-variant-numeric:tabular-nums;line-height:1;color:#a99bbd}\n.repost-flow:hover{transform:translateY(-1px);border-color:#b48aff;background:linear-gradient(135deg,#342044,#1b1426);box-shadow:0 0 12px #a66bff26}\n.repost-flow.is-active{border-color:#c18aff;background:linear-gradient(135deg,#49265f,#21152f);color:#f3ddff;box-shadow:0 0 12px #a66bff38}\n.repost-flow.is-active .flow-count{color:#e6caff}\n.post-author-label{margin-bottom:2px;color:#a99bbd;font-size:10px;letter-spacing:.04em;text-transform:uppercase}\n.post-flow-attribution{display:flex;align-items:center;gap:7px;margin:0 0 11px;padding:8px 11px;border:1px solid #63477f;border-radius:10px;background:linear-gradient(100deg,#281936,#171321);color:#d9baff;font-size:11px;font-weight:700;letter-spacing:.02em}\n.post-flow-attribution::before{content:\"↗\";display:grid;place-items:center;width:19px;height:19px;border-radius:50%;background:#593477;color:#fff;font-size:13px}\n\n@media(prefers-reduced-motion:reduce){.repost-flow{transition:none}.repost-flow:hover{transform:none}}\n.post-comments-panel{margin-top:10px;padding:12px;border:1px solid #3c2d50;border-radius:13px;background:#0e0c16}\n.post-comments-panel[hidden]{display:none}\n.post-comments-header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;color:#d9c4f3;font-size:13px;font-weight:700}\n.post-comments-close{min-height:30px;padding:5px 10px;border:1px solid #49385e;border-radius:9px;background:#171321;color:#cdb8e8;font-size:11px}\n.post-comments-list{display:flex;flex-direction:column;gap:8px;max-height:280px;overflow:auto}\n.post-comment{padding:9px 10px;border:1px solid #302640;border-radius:10px;background:#171321;color:#e9e1f5;font-size:13px;overflow-wrap:anywhere}\n.post-comment strong{display:block;margin-bottom:5px;color:#d7baff}\n.post-comment time{display:block;margin-top:5px;color:#8f879d;font-size:10px}\n.post-comment-form{display:grid;grid-template-columns:1fr auto;align-items:end;gap:8px;margin-top:10px}\n.post-comment-form textarea{min-height:40px;max-height:110px;margin:0;padding:10px;border:1px solid #403653;border-radius:10px;background:#090811;color:#fff;font:inherit;resize:vertical}\n.post-comment-form button{padding:9px 12px;border-radius:10px;font-size:12px}\n.post-comment-note{margin-top:7px;color:#bda1ff;font-size:11px;overflow-wrap:anywhere}\n@media(max-width:380px){.post-social-actions{gap:6px}.post-social-button{padding:7px 10px;font-size:12px}.post-comment-form{grid-template-columns:1fr}.post-comment-form button{justify-self:end}}\n\n\n/* FLOUSTREAM PULSE online status */\n.dolby-online-indicator{position:relative;display:inline-block;vertical-align:middle;width:8px;height:8px;flex:0 0 8px;margin-left:8px;border-radius:50%;background:#716b7b;box-shadow:0 0 0 1px #a69bb8;transition:background .2s ease,box-shadow .2s ease}\n.dolby-online-indicator.is-online{background:#69ffd1;box-shadow:0 0 0 1px #b7ffe9,0 0 8px #4effc5,0 0 15px #936bff;animation:dolbyPulseCore 1.8s ease-in-out infinite}\n.dolby-online-indicator[hidden],.dolby-online-last-seen[hidden]{display:none!important}\n.dolby-online-last-seen{display:inline-block;vertical-align:middle;margin-left:8px;color:#a99bbd;font-size:11px;font-weight:400;letter-spacing:0}\n.dolby-online-indicator.is-online::after{content:\"\";position:absolute;inset:-5px;border:1px solid #a66bff;border-radius:50%;opacity:0;animation:dolbyPulseRing 1.8s ease-out infinite}\n@keyframes dolbyPulseCore{0%,100%{filter:brightness(.9)}50%{filter:brightness(1.45)}}\n@keyframes dolbyPulseRing{0%{transform:scale(.55);opacity:.75}85%,100%{transform:scale(1.8);opacity:0}}\n@media(prefers-reduced-motion:reduce){.dolby-online-indicator.is-online,.dolby-online-indicator.is-online::after{animation:none}.dolby-online-indicator.is-online::after{opacity:.35;transform:scale(1.2)}}\n\n/* Final compact album layout overrides */\n.album-grid{grid-template-columns:repeat(6,minmax(0,1fr));gap:2px!important}\n.album-item{aspect-ratio:1;border:0!important;border-radius:3px!important}\n.album-item small{display:none!important}\n@media(max-width:700px){.album-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:2px!important}}\n@media(max-width:420px){.album-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:2px!important}}\n\n/* Compact compose control beside the feed heading */\n.feed-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px;padding:0 4px}\n.feed-heading .feed-title{margin:0;padding:0}\n.publish-box{margin:0;padding:0;border:0;border-radius:0;background:transparent}\n.publish-box>button{display:none}\n.publish-editor{margin:0 0 16px}\n.feed-compose-trigger{display:grid!important;place-items:center;width:28px!important;min-width:28px!important;height:28px!important;min-height:28px!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#c59aff!important;font-size:20px!important;font-weight:400!important;line-height:1!important;box-shadow:none!important}\n.feed-compose-trigger:hover,.feed-compose-trigger:focus-visible{color:#fff!important;background:transparent!important;outline:0; text-shadow:0 0 12px #a66bff99}\n@media(max-width:700px){.feed-heading{padding:0 12px}.feed-heading .feed-title{padding:0}.publish-box{padding:0}}\n\n\n/* FLOUSTREAM video albums */\n.video-album-backdrop,.private-video-backdrop{position:fixed;inset:0;z-index:126;background:#05030bef;backdrop-filter:blur(9px);display:grid;place-items:center;padding:14px}\n.video-album-backdrop[hidden],.private-video-backdrop[hidden],.video-album-viewer[hidden],.private-video-viewer[hidden]{display:none}\n.video-album-panel,.private-video-panel{width:min(100%,620px);max-height:92vh;overflow:auto;padding:20px;border:1px solid #76519d;border-radius:19px;background:linear-gradient(155deg,#1c1729,#0d0c15);box-shadow:0 0 38px #8d50e733}\n.video-album-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:2px;margin-top:12px}\n.video-album-item{position:relative;display:block;aspect-ratio:1;min-width:0;padding:0!important;border:0!important;border-radius:3px!important;overflow:hidden;background:linear-gradient(145deg,#21172f,#0b0912);cursor:pointer}\n.video-album-frame{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#100c18;pointer-events:none}\n\n.video-album-empty{grid-column:1/-1;padding:24px 8px;text-align:center;color:#9589a6;font-size:13px}\n.video-album-upload{display:grid;gap:12px;margin-top:8px;padding:14px;border:1px solid #49375f;border-radius:14px;background:#120f1c}\n.video-album-upload[hidden]{display:none}\n.video-album-upload label{display:flex;align-items:center;gap:10px;color:#eee4ff;font-size:14px}\n.video-album-upload input[type=checkbox]{width:19px;height:19px;accent-color:#a66bff}\n.video-album-upload input[type=file]{width:100%;color:#cbb9e6}\n.video-album-viewer,.private-video-viewer{position:fixed;inset:0;z-index:185;background:#05030bf7;display:grid;grid-template-rows:auto minmax(0,1fr) auto;align-items:center;justify-items:center;gap:10px;padding:14px 14px max(14px,env(safe-area-inset-bottom));overflow:hidden}\n.video-viewer-toolbar{width:min(100%,900px);display:flex;align-items:center;justify-content:space-between;gap:10px;color:#eee;font-size:12px}\n.video-viewer-toolbar button,.video-viewer-nav{width:44px!important;min-width:44px!important;height:44px!important;min-height:44px!important;padding:0!important;border-radius:14px!important;display:grid;place-items:center;background:#21172eea;border:1px solid #ffffff35;color:#fff;font-size:25px}\n.video-viewer-toolbar .danger{border-color:#ff718b99;background:#401b2bea;color:#ffe2e8}\n.video-viewer-stage{display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-height:0;gap:10px}\n.video-viewer-stage video{display:block;width:min(100%,900px);height:100%;max-height:100%;object-fit:contain;background:#000;border-radius:8px}\n.video-viewer-stage .video-viewer-nav{flex:0 0 44px}\n\n\n\n\n\n\n@media(max-width:700px){.video-album-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.video-album-viewer,.private-video-viewer{padding:10px 8px max(10px,env(safe-area-inset-bottom));gap:8px}.video-viewer-stage{gap:4px}.video-viewer-stage .video-viewer-nav{width:36px!important;min-width:36px!important;height:42px!important;min-height:42px!important}.video-viewer-stage video{width:calc(100% - 80px)}}\n@media(max-width:420px){.video-album-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}\n\n\n.video-album-panel .album-head-centered{grid-template-columns:auto minmax(0,1fr) auto!important}\n.video-album-panel .album-head-centered h2{grid-column:2;grid-row:1;text-align:center}\n.video-album-panel .album-head-centered .album-head-close{grid-column:3!important;grid-row:1!important}\n\n/* FLOUSTREAM search and discovery */\n.discovery-backdrop{position:fixed;inset:0;z-index:160;display:grid;place-items:center;padding:14px;background:#05030bf2;backdrop-filter:blur(10px)}\n.discovery-backdrop[hidden]{display:none}\n.discovery-panel{width:min(100%,680px);max-height:min(92dvh,850px);display:flex;flex-direction:column;overflow:hidden;border:1px solid #76519d;border-radius:20px;background:linear-gradient(155deg,#1c1729,#0d0c15);box-shadow:0 18px 70px #000b}\n.discovery-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 18px;border-bottom:1px solid #382d49}\n.discovery-head h2{margin:0;font-size:19px;color:#f2e9ff}\n.discovery-close{width:36px;height:36px;padding:0;border:1px solid #49375f;border-radius:10px;background:#21172f;color:#eee;font-size:22px}\n.discovery-searchbar{display:flex;gap:8px;padding:14px 16px 10px}\n.discovery-searchbar input{flex:1;min-width:0;margin:0;min-height:44px;padding:10px 13px;border:1px solid #514264;border-radius:11px;background:#100e19;color:#fff;font-size:14px}\n.discovery-searchbar button{min-height:44px;padding:9px 15px;border-radius:11px}\n.discovery-tabs{display:flex;gap:7px;overflow-x:auto;padding:0 16px 12px;scrollbar-width:none}\n.discovery-tabs::-webkit-scrollbar{display:none}\n.discovery-tab{flex:0 0 auto;min-height:34px;padding:7px 12px;border:1px solid #423352;border-radius:10px;background:#14101d;color:#bdb0d0;font-size:12px}\n.discovery-tab[aria-pressed=\"true\"]{border-color:#9b69d8;background:#38204f;color:#fff}\n.discovery-results{overflow:auto;overscroll-behavior:contain;padding:0 16px 18px}\n.discovery-status{padding:18px 8px;text-align:center;color:#a99bb9;font-size:13px;line-height:1.5}\n.discovery-result{display:flex;align-items:center;gap:11px;margin:0 0 9px;padding:11px;border:1px solid #382d49;border-radius:13px;background:#12101b}\n.discovery-avatar{width:42px;height:42px;flex:0 0 42px;display:grid;place-items:center;overflow:hidden;border-radius:50%;background:#39234f;color:#f2e8ff;font-weight:700}\n.discovery-avatar img{width:100%;height:100%;object-fit:cover}\n.discovery-copy{min-width:0;flex:1}\n.discovery-title{display:block;color:#f2eaff;font-size:13px;font-weight:700;overflow-wrap:anywhere;text-decoration:none;cursor:pointer}\n.discovery-title:hover,.discovery-subtitle:hover{color:#d4aaff;text-decoration:underline;text-underline-offset:3px}\n.discovery-subtitle{display:block;margin-top:4px;color:#a99bb9;font-size:11px;line-height:1.45;overflow-wrap:anywhere;text-decoration:none;cursor:pointer}\n.discovery-follow{flex:0 0 auto;min-height:34px;padding:7px 10px;border-radius:10px;font-size:11px}\n.discovery-music-result{display:flex;align-items:center;justify-content:space-between;gap:12px}\n.discovery-music-result>.discovery-title{flex:1;min-width:0}\n.discovery-music-actions{display:flex;flex:0 0 auto;gap:7px;align-items:center}\n.discovery-music-actions button{min-height:32px;padding:6px 9px;font-size:11px}\n@media(max-width:380px){.discovery-music-result{align-items:flex-start;flex-direction:column}.discovery-music-actions{width:100%}.discovery-music-actions button{flex:1}}\n.discovery-section-title{margin:14px 2px 9px;color:#cdb8e9;font-size:13px;font-weight:700}\n.discovery-post{display:block;margin-bottom:9px;padding:12px;border:1px solid #382d49;border-radius:13px;background:#12101b}\n.discovery-post p{margin:0;color:#e9e2f2;font-size:13px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}\n.discovery-post small{display:block;margin-top:8px;color:#9f91b0;font-size:11px}\n.discovery-empty{padding:22px 10px;text-align:center;color:#a99bb9;font-size:13px;line-height:1.5}\n@media(max-width:520px){.discovery-backdrop{padding:0;align-items:end}.discovery-panel{width:100%;max-height:94dvh;border-radius:20px 20px 0 0;border-bottom:0}.discovery-head{padding-top:max(16px,env(safe-area-inset-top))}}\n\n@keyframes avatarFrameGlow{0%,100%{box-shadow:0 0 0 1px #e3c8ff44,0 0 5px #a66bff66,0 0 12px #8d50e733}50%{box-shadow:0 0 0 1px #f0dcff88,0 0 9px #c18aff99,0 0 22px #9b55ff77,0 0 30px #7b3fc933}}}\n\n\n.privacy-option{display:flex;align-items:center;gap:11px;padding:11px 12px;margin:8px 0;border:1px solid #403653;border-radius:11px;background:#100e18;color:#eee5ff;font-size:13px}\n.privacy-option input{width:19px;height:19px;margin:0;accent-color:#a66bff;flex:0 0 auto}\n.privacy-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;margin:0}\n.privacy-chevron{display:inline-block;font-size:22px;line-height:1;transition:transform .25s ease}\n.privacy-toggle[aria-expanded=\"true\"] .privacy-chevron{transform:rotate(180deg)}\n.privacy-panel{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .32s ease,opacity .25s ease}\n.privacy-panel.is-open{grid-template-rows:1fr;opacity:1}\n.privacy-panel-inner{min-height:0;overflow:hidden}\n@media(prefers-reduced-motion:reduce){.privacy-panel,.privacy-chevron{transition:none}}\n.music-upload-section,.music-tracks-section{padding:13px;border:1px solid #49375f;border-radius:14px;background:#120f1c}\n.music-upload-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;padding:12px 14px}\n.music-upload-chevron{font-size:20px;line-height:1;transition:transform .25s ease}\n.music-upload-toggle[aria-expanded=\"true\"] .music-upload-chevron{transform:rotate(180deg)}\n.music-upload-panel{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .32s ease,opacity .25s ease,margin .25s ease}\n.music-upload-panel.is-open{grid-template-rows:1fr;opacity:1;margin-top:10px}\n.music-upload-panel-inner{min-height:0;overflow:hidden}\n.music-upload-panel .album-upload{margin:0}\n.music-tracks-section{margin-top:12px}\n.music-tracks-section h3{margin:0 0 10px;color:#eee4ff;font-size:15px}\n.music-track-list{display:grid;gap:10px;margin-top:0}\n.music-track{padding:12px;border:1px solid #49375f;border-radius:13px;background:#100e18}\n.music-track-head{display:flex;justify-content:flex-start;align-items:center;gap:10px;margin-bottom:8px;color:#f2e9ff;font-size:14px}\n.music-track audio{display:block;width:100%;height:38px}\n.music-track button{margin-top:8px;min-height:30px;padding:5px 9px;border-radius:8px;font-size:11px}\n@media(prefers-reduced-motion:reduce){.music-upload-panel,.music-upload-chevron{transition:none}}\n\n\n.album-head-actions{display:flex;align-items:center;justify-content:flex-start;gap:10px}\n .album-head-centered{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px}\n .album-head-centered .album-head-actions{grid-column:1;grid-row:1;justify-self:start}\n .album-head-centered .album-head-close{grid-column:2;grid-row:1;justify-self:end}\n .album-private-open,.album-add-trigger{display:grid;place-items:center;align-items:center;justify-items:center;padding:0!important;text-align:center;line-height:1;box-sizing:border-box}\n .album-private-open{font-size:19px}\n .album-add-trigger{font-size:27px}\n .album-viewer-thumbnails{position:absolute;left:0;right:0;bottom:0;z-index:8;padding:22px 10px calc(18px + env(safe-area-inset-bottom));background:linear-gradient(180deg,transparent 0%,#080610ef 28%)}\n .album-viewer-thumbnails[hidden]{display:none}\n .album-viewer-thumbnails-track{display:flex;gap:7px;overflow-x:auto;overscroll-behavior-x:contain;padding:8px 2px;scrollbar-width:none}\n .album-viewer-thumbnails-track::-webkit-scrollbar{display:none}\n .album-viewer-thumb{flex:0 0 62px;width:62px;height:62px;padding:0;border:2px solid #ffffff55;border-radius:8px;overflow:hidden;background:#171321;opacity:.78}\n .album-viewer-thumb.active{border-color:#d5aaff;opacity:1;box-shadow:0 0 0 2px #a66bff66}\n .album-viewer-thumb img{width:100%;height:100%;object-fit:cover;display:block}\n .album-viewer,.private-album-viewer{touch-action:none}\n.album-add-trigger{width:42px;height:42px;display:grid;place-items:center;border:1px solid #9a69cb;border-radius:12px;background:linear-gradient(145deg,#6e3fa1,#39234f);color:#fff;font-size:29px;line-height:1;cursor:pointer;box-shadow:0 0 16px #9d5fe633}\n .album-private-open{width:42px;height:42px;display:grid;place-items:center;border:1px solid #b18bda;border-radius:12px;background:linear-gradient(145deg,#342344,#1b1528);color:#f4e7ff;font-size:19px;cursor:pointer}\n .private-album-backdrop{position:fixed;inset:0;z-index:150;background:#05030bf2;backdrop-filter:blur(12px);display:grid;place-items:center;padding:14px}\n .private-album-backdrop[hidden],.private-album-viewer[hidden]{display:none}\n .private-album-panel{width:min(100%,620px);max-height:92vh;overflow:auto;padding:20px;border:1px solid #a77bd0;border-radius:19px;background:linear-gradient(155deg,#20172e,#0b0a12);box-shadow:0 0 44px #a66bff33}\n .private-album-note{margin:0;color:#b9a8cc;font-size:12px;line-height:1.5}\n .private-album-viewer{position:fixed;inset:0;z-index:190;background:#030208f8;display:grid;place-items:center;padding:55px 14px 20px;touch-action:pan-y;overflow:hidden}\n .private-album-viewer img{max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;user-select:none;-webkit-user-drag:none;touch-action:pan-y}\n .private-album-viewer .album-viewer-tools{bottom:max(48px,calc(env(safe-area-inset-bottom) + 42px))}\n.album-upload[hidden]{display:none}\n.album-upload{margin-top:8px}\n.album-cancel-upload{min-height:40px;border:1px solid #59466f;border-radius:10px;background:#171321;color:#d9c9ec}\n.album-item{cursor:zoom-in}\n.album-item:focus-visible{outline:2px solid #c49aff;outline-offset:2px}\n.album-viewer{position:fixed;inset:0;z-index:180;background:#05030bf5;display:grid;place-items:center;padding:55px 14px 20px}\n.album-viewer[hidden]{display:none}\n.album-viewer img{max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;box-shadow:0 12px 60px #000a}\n.album-viewer-close{position:absolute;z-index:6;top:14px;right:16px;width:44px;height:44px;padding:0;border:1px solid #ffffff35;border-radius:12px;background:#21172ebd;color:#fff;font-size:27px;line-height:1;display:grid;place-items:center;text-align:center;box-sizing:border-box;cursor:pointer}\n.album-viewer{touch-action:pan-y;overflow:hidden}.album-viewer-nav{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:54px;padding:0;border:1px solid #ffffff35;border-radius:14px;background:#21172ebd;color:#fff;font-size:38px;line-height:1;z-index:2}.album-viewer-prev{left:12px}.album-viewer-next{right:12px}.album-viewer-counter{position:absolute;bottom:max(16px,env(safe-area-inset-bottom));left:0;right:0;text-align:center;color:#eee;font-size:13px;text-shadow:0 1px 5px #000}.album-viewer img{user-select:none;-webkit-user-drag:none;touch-action:pan-y}\n.album-share-backdrop{position:fixed;inset:0;z-index:220;background:#05030be8;display:grid;place-items:center;padding:18px}\n.album-share-backdrop[hidden]{display:none}\n.album-share-panel{width:min(100%,420px);padding:18px;border:1px solid #59436f;border-radius:20px;background:linear-gradient(155deg,#1b1727,#0e0c15);box-shadow:0 20px 70px #000b}\n.album-share-panel{position:relative}\n.album-share-friends{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0;max-height:48vh;overflow:auto}\n.album-share-friend{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;padding:8px 4px;border:1px solid transparent;border-radius:14px;background:#171321;color:#eee;font-size:11px;overflow-wrap:anywhere}\n.album-share-friend.selected{border-color:#bd8cff;background:#382451;box-shadow:0 0 0 2px #a66bff55}\n.album-share-avatar{width:54px;height:54px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:#39234f;color:#fff;font-size:20px;font-weight:700}\n.album-share-avatar img{width:100%;height:100%;object-fit:cover}\n.album-share-send{display:block;margin:0 auto;width:54px;height:54px;border-radius:50%;font-size:28px;padding:0;background:linear-gradient(145deg,#7546ad,#39205f)}\n.album-share-send:disabled{opacity:.35}\n.messages-backdrop{position:fixed;inset:0;z-index:225;background:#05030bf0;display:grid;place-items:center;padding:12px}.messages-backdrop[hidden]{display:none}\n.messages-panel{width:min(100%,560px);height:min(82vh,720px);display:flex;flex-direction:column;padding:16px;border:1px solid #59436f;border-radius:20px;background:linear-gradient(155deg,#1b1727,#0e0c15)}\n.messages-list,.messages-thread{min-height:0;overflow:auto;flex:1;margin-top:12px}\n.message-conversation{width:100%;display:flex;align-items:center;gap:12px;text-align:left;margin:5px 0;padding:10px;border-radius:13px;background:#171321}\n.message-conversation .album-share-avatar{width:44px;height:44px;flex:0 0 44px}.message-conversation small{display:block;color:#aa9bbd;margin-top:3px}\n.message-bubble{max-width:88%;margin:8px 0;padding:10px 12px;border:1px solid #47375a;border-radius:14px;background:#191523;color:#f3eaff;overflow-wrap:anywhere}\n.message-bubble.mine{margin-left:auto;background:#382451}.message-bubble img{display:block;max-width:100%;max-height:360px;object-fit:contain;border-radius:9px;margin-top:5px}\n\n.album-share-friends .album-empty{grid-column:1/-1}\n@media(max-width:600px){.album-viewer-nav{width:36px;height:46px;font-size:31px}.album-viewer-prev{left:5px}.album-viewer-next{right:5px}}\n\n/* Единый размер интерактивных кнопок сайта */\nbutton:not(.composer-color):not(.message-conversation):not(.album-share-friend){\n box-sizing:border-box!important;\n width:auto;\n min-width:44px!important;\n height:44px!important;\n min-height:44px!important;\n padding-top:0!important;\n padding-bottom:0!important;\n}\n.album-viewer-close,.album-viewer-nav,.album-viewer-tools button{\n width:44px!important;\n min-width:44px!important;\n height:44px!important;\n min-height:44px!important;\n padding:0!important;\n border-radius:14px!important;\n display:grid;\n place-items:center;\n box-sizing:border-box!important;\n}\n.album-viewer-tools{top:14px!important;right:68px!important;left:auto!important;bottom:auto!important;gap:8px!important;z-index:6!important}\n.album-viewer-tools button{font-size:23px!important}\n#album-viewer-share{font-size:12px!important;font-weight:900!important;letter-spacing:.3px!important;text-transform:none!important}\n.album-viewer-nav{font-size:34px!important}\n.album-viewer-close{font-size:27px!important}\n\n/* Dolby404: единая геометрия и оформление аватара на обеих страницах */\n.avatar{\n box-sizing:border-box!important;\n width:124px!important;\n height:124px!important;\n min-width:124px!important;\n min-height:124px!important;\n flex:0 0 124px!important;\n aspect-ratio:1/1;\n border:3px solid #b879e8;\n border-radius:50%!important;\n overflow:hidden;\n position:relative;\n isolation:isolate;\n display:block;\n background:linear-gradient(135deg,#6336a3,#17152b);\n box-shadow:0 0 0 1px #e3c8ff66,0 0 7px #b879ff88,0 0 16px #9b55ff66;\n animation:avatarFrameGlow 3.4s ease-in-out infinite;\n z-index:2;\n}\n.avatar img{\n box-sizing:border-box;\n position:absolute;\n inset:0;\n display:block;\n width:100%;\n height:100%;\n min-width:100%;\n min-height:100%;\n max-width:none;\n max-height:none;\n object-fit:cover;\n object-position:center;\n border-radius:50%!important;\n margin:0;\n}\n@media(max-width:600px){\n .avatar{\n  width:96px!important;\n  height:96px!important;\n  min-width:96px!important;\n  min-height:96px!important;\n  flex:0 0 96px!important;\n }\n}\n\n\n.author-hub[hidden]{display:none!important}\n.author-hub{position:fixed;inset:0;z-index:240;display:flex;flex-direction:column;overflow:hidden;background:radial-gradient(ellipse at 50% 15%,#302047 0%,#100d19 58%,#05040a 100%);color:#fff}\n.author-hub-head{position:relative;z-index:3;display:flex;align-items:center;gap:12px;padding:max(12px,env(safe-area-inset-top)) 14px 12px;border-bottom:1px solid #ffffff20;background:#0a0713d9;backdrop-filter:blur(16px)}\n.author-hub-head>div{display:flex;flex:1;min-width:0;flex-direction:column;gap:2px}\n.author-hub-head strong{font-size:17px;letter-spacing:.14em;background:linear-gradient(90deg,#fff,#d9a8ff,#7be9ff);-webkit-background-clip:text;background-clip:text;color:transparent}\n.author-hub-head span{font-size:11px;color:#b9a9cb}\n.author-hub-head button{width:42px;height:42px;min-width:42px;border:1px solid #ffffff35;border-radius:13px;background:#21172f;color:#fff;font-size:23px}\n.author-hub-stage{position:relative;flex:1;min-height:0;display:flex;align-items:stretch;justify-content:flex-start;gap:2px;padding:2px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}\n.author-hub-stage::-webkit-scrollbar{display:none}\n.author-banner{position:relative;display:block;flex:0 0 calc(100% - 4px);width:calc(100% - 4px);height:100%;min-height:0;padding:0;overflow:hidden;border:1px solid #caa4ff66;border-radius:18px;background:#171020;box-shadow:0 18px 65px #000a,0 0 32px #a66bff25;text-align:left;color:#fff;isolation:isolate;scroll-snap-align:center}\n@media(min-width:760px){.author-banner{flex-basis:min(100%,900px)}}\n.author-banner>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;transition:transform .7s ease}\n.author-banner:active>img{transform:scale(1.025)}\n.author-banner-shade{position:absolute;inset:0;background:linear-gradient(180deg,#05030b08 20%,#09051040 48%,#080510ed 100%);z-index:1}\n.author-banner-copy{position:absolute;z-index:2;left:clamp(20px,5vw,38px);right:20px;bottom:clamp(30px,8vh,66px);display:flex;flex-direction:column;align-items:flex-start;gap:10px;text-shadow:0 2px 16px #000}\n.author-banner-copy small{font-size:11px;font-weight:800;letter-spacing:.2em;color:#e5c8ff}\n.author-banner-copy strong{font-size:clamp(34px,8vw,58px);line-height:.98;font-weight:950;letter-spacing:.025em}\n.author-banner-copy>span{font-size:14px;color:#f1e9fa}\n.author-banner-copy b{display:inline-flex;align-items:center;gap:12px;margin-top:12px;padding:13px 17px;border:1px solid #ffffff8a;border-radius:13px;background:linear-gradient(110deg,#9d56dfed,#5134a8ed);box-shadow:0 0 25px #9d56df77;font-size:11px;letter-spacing:.09em}\n.author-banner-copy i{font-size:17px;font-style:normal}\n.author-banner-tap{position:absolute;z-index:4;left:50%;bottom:18px;transform:translateX(-50%);display:inline-flex;align-items:center;justify-content:center;min-width:112px;min-height:42px;padding:10px 26px;border:1px solid #ffffffbd;border-radius:14px;background:linear-gradient(110deg,#9d56dfed,#5134a8ed);box-shadow:0 0 24px #9d56df88;color:#fff;font-size:14px;font-weight:900;letter-spacing:.16em;text-align:center;text-shadow:0 1px 8px #0008;pointer-events:auto}\n.author-hub-dots{display:flex;justify-content:center;gap:7px;padding:12px 0 4px}\n.author-hub-dots span{width:7px;height:7px;border-radius:99px;background:#ffffff45}\n.author-hub-dots span.active{width:23px;background:linear-gradient(90deg,#c18aff,#54dfff);box-shadow:0 0 12px #a66bff99}\n.author-hub-hint{margin:0;padding:4px 12px max(12px,env(safe-area-inset-bottom));text-align:center;color:#8f829f;font-size:10px}\n@media(min-width:760px){.author-hub-stage{padding:2px;gap:2px}.author-banner{flex-basis:calc(100% - 4px);width:calc(100% - 4px)}}\n@media(prefers-reduced-motion:reduce){.author-banner>img{transition:none}}\n\n/* lOOPS — animated eyes banner and simple destination shell */\n.author-banner-loops{display:flex;align-items:center;justify-content:center;text-align:center;background:#fff;border-color:#eee;box-shadow:0 18px 65px #0002}\n.author-banner-loops:before{content:\"\";position:absolute;z-index:0;left:50%;top:50%;width:min(88%,650px);height:min(58%,520px);transform:translate(-50%,-50%) rotate(-5deg);background:#8b42d6;clip-path:polygon(7% 28%,17% 13%,31% 17%,40% 5%,55% 12%,69% 4%,79% 17%,94% 18%,90% 35%,99% 49%,88% 62%,92% 79%,74% 82%,62% 96%,47% 87%,31% 96%,22% 82%,7% 82%,12% 63%,1% 48%);filter:drop-shadow(0 12px 24px #7026bd33);pointer-events:none}\n.author-banner-loops:after{content:\"\";position:absolute;z-index:0;left:50%;top:50%;width:min(78%,590px);height:min(48%,440px);transform:translate(-50%,-50%) rotate(4deg);border-radius:44% 56% 62% 38% / 54% 38% 62% 46%;background:#9a55e2;opacity:.55;pointer-events:none}\n.loops-wordmark{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;gap:.025em;font-size:clamp(72px,19vw,150px);font-weight:1000;line-height:1;letter-spacing:-.065em;filter:drop-shadow(0 3px 2px #32104a55)}\n.loops-letter{display:inline-block}\n.loops-letter-l{color:#21c7b7}\n.loops-letter-p{color:#ff704f}\n.loops-letter-s{color:#ffd43b}\n.loops-eyes{display:inline-flex;align-items:center;gap:.045em;margin:0 .005em;transform:translateY(.015em)}\n.loops-eye{position:relative;display:inline-block;flex:0 0 .48em;width:.48em;height:.62em;overflow:hidden;border:0;border-radius:48% 48% 46% 46%;background:linear-gradient(180deg,#fff 0 72%,#e8f7ff 100%);box-shadow:inset 0 -.025em .035em #7da6c855,0 .025em .035em #32104a55;transform-origin:50% 55%}\n.loops-eye:before{content:\"\";position:absolute;left:31%;top:29%;width:43%;height:48%;border-radius:50%;background:radial-gradient(circle at 34% 25%,#fff 0 10%,#26384b 13%,#101a2b 65%,#050912 100%);box-shadow:0 0 .025em #07111f}\n.loops-eye:after{content:\"\";position:absolute;z-index:2;left:-3%;right:-3%;top:-2%;height:0;border-radius:0 0 48% 48%;background:linear-gradient(180deg,#fff 0 72%,#e8f7ff 100%);box-shadow:0 .018em .025em #7da6c855;animation:loops-blink 4.9s infinite}\n.loops-eye:before{animation:loops-gaze 4.8s ease-in-out infinite}\n.loops-eye:nth-child(2):before{animation-delay:.12s}\n.loops-eye:nth-child(2):after{animation-delay:.14s}\n@keyframes loops-gaze{0%,12%,100%{transform:translateX(0)}25%,38%{transform:translateX(-45%)}52%,68%{transform:translateX(45%)}82%{transform:translateX(0)}}\n@keyframes loops-blink{0%,43%,47%,91%,95%,100%{height:0}45%,93%{height:110%}}\n.loops-page[hidden]{display:none!important}\n.loops-page{position:fixed;inset:0;z-index:260;display:flex;flex-direction:column;overflow:auto;background:radial-gradient(ellipse at 50% 12%,#302047 0%,#100d19 58%,#05040a 100%);color:#fff}\n.loops-page-head{display:flex;align-items:center;justify-content:space-between;padding:max(12px,env(safe-area-inset-top)) 16px 12px;border-bottom:1px solid #ffffff20;background:#0a0713d9}\n.loops-page-head strong{font-size:20px;font-weight:950;letter-spacing:.08em;color:#e9d9ff;text-shadow:0 0 18px #9b55ff}\n.loops-page-head button{width:42px;height:42px;border:1px solid #ffffff35;border-radius:13px;background:#21172f;color:#fff;font-size:23px}\n.loops-page-content{flex:1;display:grid;place-content:center;gap:12px;padding:28px;text-align:center}\n.loops-page-content h1{margin:0;font-size:clamp(42px,12vw,76px);letter-spacing:-.04em;background:linear-gradient(90deg,#ff71d2,#a98aff,#55dfff);-webkit-background-clip:text;background-clip:text;color:transparent}\n.loops-page-content p{margin:0;color:#b9a9cb;font-size:14px;line-height:1.6}\n@media(prefers-reduced-motion:reduce){.loops-eye:before,.loops-eye:after{animation:none}}\n\n";
const MARKUP = "<div class=\"fs-route-profile\">\n<button type=\"button\" class=\"drawer-menu-button\" id=\"drawer-menu-button\" aria-label=\"Открыть меню\" aria-controls=\"side-drawer\" aria-expanded=\"false\"><span class=\"sound-signal\" aria-hidden=\"true\"><i></i><i></i><i></i><i></i><i></i></span></button>\n\n<div class=\"drawer-edge\" id=\"drawer-edge\" aria-hidden=\"true\"></div><div class=\"drawer-backdrop\" id=\"drawer-backdrop\"></div>\n<aside class=\"side-drawer\" id=\"side-drawer\" aria-label=\"Навигация FLOUSTREAM\" aria-hidden=\"true\">\n <div class=\"drawer-shell\"><div class=\"side-drawer-head\"><div class=\"side-drawer-logo\">FLOUSTREAM</div><button type=\"button\" class=\"side-drawer-close\" id=\"drawer-close\" aria-label=\"Закрыть меню\">×</button></div>\n <p class=\"side-drawer-caption\">Навигация</p><nav class=\"side-drawer-links\">\n <button class=\"side-drawer-link active\" data-drawer-action=\"profile\"><span class=\"side-drawer-icon\">◉</span>Мой профиль</button></nav>\n <div class=\"nav-history\" id=\"nav-history\"><p class=\"side-drawer-caption\" id=\"nav-history-title\">Недавно посещали</p><div class=\"nav-profile-visits\" id=\"nav-profile-visits\"></div><div class=\"nav-history-items\" id=\"nav-history-items\"><span class=\"nav-history-empty\">Пока пусто</span></div></div>\n \n  <section class=\"drawer-search\" aria-label=\"Поиск FLOUSTREAM\">\n   <button type=\"button\" class=\"drawer-search-toggle\" id=\"drawer-search-toggle\" aria-expanded=\"false\" aria-controls=\"drawer-search-options\"><span aria-hidden=\"true\">⌕</span> Поиск <span class=\"drawer-search-chevron\" aria-hidden=\"true\">⌄</span></button>\n   <div class=\"drawer-search-options\" id=\"drawer-search-options\" hidden>\n    <button type=\"button\" class=\"drawer-search-option\" data-drawer-search-action=\"search\"><span aria-hidden=\"true\">⌕</span>Поиск</button>\n    <button type=\"button\" class=\"drawer-search-option\" data-drawer-search-action=\"recommendations\"><span aria-hidden=\"true\">✧</span>Рекомендации</button>\n   </div>\n  </section>\n <div class=\"side-drawer-divider\"></div><p class=\"side-drawer-caption\">Медиа и общение</p><nav class=\"side-drawer-links\">\n <button class=\"side-drawer-link author-nav-link\" data-author-hub=\"true\" aria-label=\"AuTHOR\"><span class=\"side-drawer-icon\">▶</span><span class=\"author-label\" aria-label=\"AuTHOR\"><span>A</span><span>u</span><span>T</span><span>H</span><span>O</span><span>R</span></span></button>\n <a class=\"side-drawer-link\" id=\"messages-nav-link\" href=\"messages.html?v=20261119-realtime-2\"><span class=\"side-drawer-icon\">✉</span>Сообщения</a>\n <button class=\"side-drawer-link\" data-drawer-soon=\"Сообщества\"><span class=\"side-drawer-icon\">◎</span>Сообщества</button>\n <button class=\"side-drawer-link\" data-drawer-soon=\"Музыка\"><span class=\"side-drawer-icon\">♫</span>Музыка</button>\n <a class=\"side-drawer-link\" id=\"friends-nav-link\" href=\"friends.html?v=20261114-1\"><span class=\"side-drawer-icon\">♧</span>Друзья</a>\n  <button class=\"side-drawer-link\" data-drawer-soon=\"Закладки\"><span class=\"side-drawer-icon\">☆</span>Закладки</button></nav>\n <div class=\"drawer-bottom\"><button type=\"button\" class=\"side-drawer-link drawer-settings-button\" id=\"open-settings\"><span class=\"side-drawer-icon\">⚙</span>Настройки</button><button type=\"button\" class=\"drawer-logout-button\" id=\"drawer-logout\">↪ Выйти</button><div class=\"side-drawer-foot\">FLOUSTREAM · твоя цифровая территория</div></div></div>\n</aside>\n\n<div class=\"settings-backdrop\" id=\"settings-backdrop\" hidden>\n <section class=\"settings-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"settings-title\">\n  <div class=\"settings-head\"><h2 id=\"settings-title\">Настройки</h2><button type=\"button\" class=\"settings-close\" id=\"settings-close\" aria-label=\"Закрыть\">×</button></div>\n  <h3 style=\"margin:0 0 8px;color:#eee4ff;font-size:16px\">Профиль</h3>\n  <div class=\"settings-actions\"><button type=\"button\" class=\"primary\" id=\"open-profile-editor\">✎ Редактировать профиль</button></div>\n  <div class=\"settings-divider\"></div>\n  <label class=\"settings-label\" for=\"settings-language\">Язык интерфейса</label>\n  <select id=\"settings-language\"><option value=\"ru\">Русский</option><option value=\"en\">English</option></select>\n  <label class=\"settings-label\" for=\"settings-theme\">Стиль страницы</label>\n  <select id=\"settings-theme\"><option value=\"cyber\">Cyber violet — фиолетовый неон</option><option value=\"ocean\">Ocean — синий неон</option><option value=\"rose\">Rose — розовый неон</option><option value=\"mono\">Mono — монохромный</option></select>\n  <label class=\"settings-label\">Обложка профиля</label><div class=\"settings-actions\"><button type=\"button\" class=\"primary\" id=\"settings-change-cover\">✎ Изменить обложку</button></div>\n  <div class=\"settings-actions\"><button type=\"button\" class=\"primary\" id=\"save-preferences\">Сохранить настройки</button></div>\n  <p class=\"settings-help\">Выбранный стиль и язык сохраняются на этом устройстве.</p>\n  <div class=\"settings-divider\"></div>\n  <button type=\"button\" class=\"primary privacy-toggle\" id=\"privacy-toggle\" aria-expanded=\"false\" aria-controls=\"privacy-panel\">Приватность <span class=\"privacy-chevron\" aria-hidden=\"true\">⌄</span></button>\n  <div class=\"privacy-panel\" id=\"privacy-panel\" aria-hidden=\"true\">\n   <div class=\"privacy-panel-inner\" inert>\n    <p class=\"settings-help\">Фотоальбомы всегда доступны только владельцу. Здесь можно управлять видимостью видео, комментариев и публикаций.</p>\n     <label class=\"privacy-option\"><input id=\"privacy-video-visible\" type=\"checkbox\" checked> <span>Обычный видеоальбом — виден всем</span></label>\n    <label class=\"privacy-option\"><input id=\"privacy-comments-visible\" type=\"checkbox\" checked> <span>Комментарии — видны всем</span></label>\n    <label class=\"privacy-option\"><input id=\"privacy-feed-visible\" type=\"checkbox\" checked> <span>Публикации в ленте профиля — видны всем</span></label>\n    <div class=\"settings-actions\"><button type=\"button\" class=\"primary\" id=\"save-privacy-settings\">Сохранить приватность</button></div>\n   </div>\n  </div>\n  <div class=\"settings-divider\"></div>\n  <h3 style=\"margin:0;color:#eee4ff;font-size:16px\">Безопасность</h3>\n  <label class=\"settings-label\" for=\"new-password\">Введите новый пароль</label><input id=\"new-password\" type=\"password\" autocomplete=\"new-password\" minlength=\"8\" placeholder=\"Не менее 8 символов\">\n  <label class=\"settings-label\" for=\"confirm-password\">Повторите новый пароль</label><input id=\"confirm-password\" type=\"password\" autocomplete=\"new-password\" minlength=\"8\" placeholder=\"Повторите пароль\">\n  <div class=\"settings-actions\"><button type=\"button\" class=\"primary\" id=\"change-password\">Изменить пароль</button></div>\n  <p class=\"settings-help\">После смены пароля используй его при следующем входе в FLOUSTREAM.</p>\n  <div class=\"settings-divider\"></div>\n  <h3 style=\"margin:0;color:#ffb7c6;font-size:16px\">Удаление учётной записи</h3>\n  <p class=\"settings-help\">После подтверждения по email аккаунт будет деактивирован. В течение 30 дней можно восстановить именно прежний аккаунт. После этого личные данные и файлы будут удалены. Текст переписок останется у собеседников, имя будет заменено на «Удалённый аккаунт».</p>\n  <div class=\"settings-actions\"><button type=\"button\" class=\"primary\" id=\"delete-account-button\" style=\"background:#512033;border-color:#a84b68\">Удалить учётную запись</button></div>\n  <div class=\"settings-status\" id=\"settings-status\" aria-live=\"polite\"></div>\n </section>\n</div>\n<main class=\"wrap\">\n\n<section class=\"card\">\n<div class=\"cover\" id=\"cover\"><img class=\"cover-photo\" id=\"cover-photo\" alt=\"Обложка профиля\" hidden></div>\n<div class=\"profile\">\n<div class=\"identity\">\n<div class=\"avatar\" id=\"avatar\" role=\"button\" tabindex=\"0\" aria-label=\"Редактировать фото профиля\"></div>\n<div class=\"name\"><h1 id=\"display-name\">Загружаем профиль…</h1><p id=\"username\"></p></div>\n</div>\n<p class=\"bio\" id=\"bio\">Подготавливаем твою страницу…</p>\n<div class=\"editor\" id=\"editor\" hidden>\n<h2>Настроить профиль</h2>\n<input id=\"first-name-input\" maxlength=\"60\" autocomplete=\"given-name\" placeholder=\"Имя\">\n<input id=\"last-name-input\" maxlength=\"60\" autocomplete=\"family-name\" placeholder=\"Фамилия\">\n<input id=\"name-input\" maxlength=\"60\" placeholder=\"Отображаемое имя\">\n<input id=\"username-input\" maxlength=\"30\" placeholder=\"Например, flou_user\">\n<textarea id=\"bio-input\" maxlength=\"300\" placeholder=\"Расскажи немного о себе…\"></textarea>\n<p class=\"hint\">Чтобы изменить фотографию, просто нажми на круглый аватар.</p>\n<div class=\"actions\"><button class=\"primary\" id=\"save-button\">Сохранить</button><button id=\"cancel-button\">Отмена</button></div>\n<div id=\"message\"></div>\n</div>\n<div id=\"notice\" class=\"empty\" hidden></div>\n</div>\n</section>\n<nav class=\"quick-nav\" aria-label=\"Разделы FLOUSTREAM\">\n<button type=\"button\" data-soon=\"Видео\">▶ Видео</button>\n<button type=\"button\" data-soon=\"Музыка\">♫ Музыка</button>\n<button type=\"button\" data-soon=\"Сообщения\">✉ Сообщения</button>\n<button type=\"button\" data-soon=\"Сообщества\">◎ Сообщества</button>\n</nav>\n<div class=\"quick-status\" id=\"quick-status\" aria-live=\"polite\"></div>\n<section class=\"feed-section\">\n<div class=\"feed-heading\">\n<h2 class=\"feed-title\">Лента публикаций</h2>\n<button type=\"button\" id=\"open-publish\" class=\"feed-compose-trigger\" aria-label=\"Создать публикацию\" title=\"Создать публикацию\">✎</button>\n</div>\n<div class=\"publish-box\">\n<div class=\"publish-editor\" id=\"publish-editor\" hidden>\n<div class=\"composer-top\"><button type=\"button\" class=\"composer-back\" id=\"composer-back\" aria-label=\"Свернуть редактор\">←</button><strong>Новая публикация</strong><span class=\"composer-top-spacer\"></span></div>\n<label for=\"post-text\">Текст публикации</label>\n<textarea id=\"post-text\" maxlength=\"5000\" placeholder=\"Что хочешь рассказать?\"></textarea>\n<div class=\"emoji-dock\" id=\"emoji-dock\"></div>\n<div class=\"hint\">Можно выбрать несколько форматов и опубликовать их вместе.</div>\n<div class=\"media-file\">\n<label for=\"post-files\">Фото, видео или музыка — можно выбрать несколько файлов</label>\n<input id=\"post-files\" type=\"file\" accept=\"image/*,video/*,audio/*\" multiple>\n</div>\n<div class=\"actions\"><button class=\"primary\" id=\"submit-post\">Опубликовать</button><button type=\"button\" id=\"cancel-publish\">Отмена</button></div>\n<div class=\"schedule-options\">\n<label class=\"schedule-toggle\" for=\"post-schedule-toggle\"><input type=\"checkbox\" id=\"post-schedule-toggle\"> Отложить публикацию</label>\n<div class=\"schedule-time-wrap\" id=\"schedule-time-wrap\" hidden>\n<label for=\"post-scheduled-at\">Дата и время выхода (Москва)</label>\n<input type=\"datetime-local\" id=\"post-scheduled-at\">\n<div class=\"schedule-help\">Публикации выходят по очереди, в порядке добавления.</div>\n</div>\n</div>\n<div id=\"publish-status\" aria-live=\"polite\"></div>\n</div>\n</div>\n<section class=\"scheduled-queue\" id=\"scheduled-queue\" hidden>\n<div class=\"scheduled-queue-head\"><h2>Отложенные публикации</h2><span id=\"scheduled-queue-count\"></span></div>\n<div id=\"scheduled-queue-list\"></div>\n</section>\n<div class=\"feed\" id=\"feed\" aria-live=\"polite\">\n<div id=\"feed-list\"></div>\n<div class=\"feed-loading\" id=\"feed-loading\">Загружаем публикации…</div>\n<div class=\"feed-empty\" id=\"feed-empty\" hidden><strong>Пока публикаций нет</strong>Здесь появятся записи пользователей FLOUSTREAM.</div>\n<div class=\"feed-error\" id=\"feed-error\" hidden></div>\n<div id=\"feed-sentinel\" aria-hidden=\"true\"></div>\n</div>\n</section>\n</main>\n<div class=\"photo-modal\" id=\"photo-modal\" hidden>\n <div class=\"photo-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"photo-title\">\n  <h2 id=\"photo-title\">Редактировать фото профиля</h2>\n  <p>Выбери фотографию из галереи телефона. Подойдут JPG, PNG или WebP размером до 10 МБ.</p>\n  <div class=\"actions\"><button class=\"primary\" id=\"choose-photo\">Выбрать из галереи</button><button id=\"open-photo-view\">Открыть</button><button id=\"close-photo\">Отмена</button></div>\n  <div id=\"photo-status\"></div>\n </div>\n</div>\n<div class=\"photo-viewer\" id=\"photo-viewer\" hidden>\n <img id=\"photo-view-image\" alt=\"Фотография профиля целиком\">\n <div class=\"photo-viewer-tools\"><button type=\"button\" class=\"photo-like\" id=\"photo-like\">♡ Нравится</button><button type=\"button\" class=\"photo-like-count-button\" id=\"photo-like-count\" aria-label=\"Открыть список лайков\">0 лайков</button><button type=\"button\" id=\"close-photo-view\">Закрыть</button></div>\n <div class=\"photo-likers\"><div class=\"photo-liker-avatars\" id=\"photo-liker-avatars\"></div></div>\n <div id=\"photo-view-status\" aria-live=\"polite\"></div>\n</div>\n<div class=\"post-photo-viewer\" id=\"post-photo-viewer\" hidden aria-label=\"Просмотр фотографии\">\n <button type=\"button\" class=\"post-photo-viewer-close\" id=\"close-post-photo\" aria-label=\"Закрыть\">×</button>\n <img id=\"post-photo-view-image\" alt=\"Фото публикации в полный экран\" draggable=\"false\">\n</div>\n<div class=\"likers-modal\" id=\"likers-modal\" hidden>\n <div class=\"likers-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"likers-title\">\n  <h2 id=\"likers-title\">Понравилось</h2>\n  <div class=\"likers-list\" id=\"likers-list\"></div>\n  <div class=\"actions\"><button type=\"button\" id=\"close-likers\">Закрыть</button></div>\n </div>\n</div>\n<div class=\"author-hub\" id=\"author-hub\" hidden>\n <header class=\"author-hub-head\"><button type=\"button\" id=\"author-hub-back\" aria-label=\"Назад\">←</button><div><strong>AuTHOR</strong><span>Твоя творческая территория</span></div><button type=\"button\" id=\"author-hub-close\" aria-label=\"Закрыть\">×</button></header>\n <main class=\"author-hub-stage\" id=\"author-hub-stage\" aria-label=\"Баннеры AuTHOR\">\n  <button type=\"button\" class=\"author-banner author-banner-photos\" id=\"author-photos-banner\" aria-label=\"Открыть фотогалерею\">\n   <img src=\"https://raw.githubusercontent.com/sergeybikov1991-create/Dolby404/design/author-banner-library/design/author-banners/02-my-photos/%2002-my-photos.jpg\" alt=\"\" fetchpriority=\"high\">\n   <span class=\"author-banner-shade\"></span>\n   <span class=\"author-banner-copy\"><small>AuTHOR · ГАЛЕРЕЯ</small><strong>МОИ ФОТО</strong><span>Все твои фотографии в одном месте</span></span>\n  \n   <span class=\"author-banner-tap\" role=\"button\" aria-label=\"ТЫК\">ТЫК</span></button>\n  <button type=\"button\" class=\"author-banner author-banner-videos\" id=\"author-videos-banner\" aria-label=\"Открыть мои видео\">\n   <img src=\"https://raw.githubusercontent.com/sergeybikov1991-create/Dolby404/design/author-banner-library/design/author-banners/01-my-videos/my-video.jpg\" alt=\"\" loading=\"lazy\">\n   <span class=\"author-banner-shade\"></span>\n   <span class=\"author-banner-copy\"><small>AuTHOR · ВИДЕОТЕКА</small><strong>МОИ ВИДЕО</strong><span>Твои видео в одном месте</span></span>\n  \n   <span class=\"author-banner-tap\" role=\"button\" aria-label=\"ТЫК\">ТЫК</span></button>\n  <button type=\"button\" class=\"author-banner author-banner-editor\" id=\"author-editor-banner\" aria-label=\"Video Editor\">\n   <img src=\"https://raw.githubusercontent.com/sergeybikov1991-create/Dolby404/design/author-banner-library/design/author-banners/03-video-editor/videoR.jpg\" alt=\"\" loading=\"lazy\">\n   <span class=\"author-banner-shade\"></span>\n   <span class=\"author-banner-copy\"><small>AuTHOR · CREATIVE STUDIO</small><strong>VIDEO EDITOR</strong><span>Твоя творческая студия видео</span></span>\n  \n   <span class=\"author-banner-tap\" role=\"button\" aria-label=\"ТЫК\">ТЫК</span></button>\n  <button type=\"button\" class=\"author-banner author-banner-loops\" id=\"author-loops-banner\" aria-label=\"Открыть lOOPS\">\n   <span class=\"loops-wordmark\" aria-label=\"lOOPS\"><span class=\"loops-letter loops-letter-l\">l</span><span class=\"loops-eyes\" aria-hidden=\"true\"><span class=\"loops-eye\"></span><span class=\"loops-eye\"></span></span><span class=\"loops-letter loops-letter-p\">P</span><span class=\"loops-letter loops-letter-s\">S</span></span>\n  \n   <span class=\"author-banner-tap\" role=\"button\" aria-label=\"ТЫК\">ТЫК</span></button>\n </main>\n <div class=\"author-hub-dots\" id=\"author-hub-dots\" aria-label=\"Переключение баннеров\"><span class=\"active\"></span><span></span><span></span><span></span></div>\n <p class=\"author-hub-hint\" id=\"author-hub-hint\">Листай баннеры свайпом</p>\n</div>\n<div class=\"loops-page\" id=\"loops-page\" hidden>\n <header class=\"loops-page-head\"><strong>FLOUSTREAM</strong><button type=\"button\" id=\"loops-page-back\" aria-label=\"Вернуться в AuTHOR\">←</button></header>\n <main class=\"loops-page-content\"><h1>lOOPS</h1><p>Пространство коротких видео FLOUSTREAM</p></main>\n</div>\n<div class=\"album-backdrop\" id=\"album-backdrop\" hidden>\n <section class=\"album-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"album-title\">\n  <div class=\"album-head album-head-centered\"><div class=\"album-head-actions\"><button type=\"button\" class=\"album-private-open\" id=\"album-private-open\" aria-label=\"Открыть приватный фотоальбом\" title=\"Приватный фотоальбом\">🔒</button><button type=\"button\" class=\"album-add-trigger\" id=\"album-add-open\" aria-label=\"Добавить фотографии\" title=\"Добавить фотографии\">+</button></div><button type=\"button\" class=\"settings-close album-head-close\" id=\"album-close\" aria-label=\"Закрыть\">×</button></div>\n  <div class=\"album-upload\" id=\"album-upload-panel\" hidden>\n   <strong style=\"color:#eee4ff\">Добавить фотографии</strong>\n   <input id=\"album-file\" type=\"file\" accept=\"image/jpeg,image/png,image/webp\" multiple>\n   <p class=\"album-note\" id=\"album-privacy-note\">Все фотографии сохраняются в личный альбом и доступны только тебе. Чтобы поделиться, открой фото и отправь его другу в личный чат.</p>\n   <button type=\"button\" class=\"primary\" id=\"album-upload-button\">Загрузить выбранные фото</button>\n   <button type=\"button\" class=\"album-cancel-upload\" id=\"album-add-cancel\">Отмена</button>\n  </div>\n  <div class=\"album-status\" id=\"album-status\" aria-live=\"polite\"></div>\n  <div class=\"album-grid\" id=\"album-grid\"></div>\n </section>\n</div>\n<div class=\"private-album-backdrop\" id=\"private-album-backdrop\" hidden><section class=\"private-album-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"private-album-title\"><div class=\"album-head\"><h2 id=\"private-album-title\">🔒 Приватный фотоальбом</h2><button type=\"button\" class=\"settings-close\" id=\"private-album-close\" aria-label=\"Закрыть приватный альбом\">×</button></div><p class=\"private-album-note\">Только ты можешь просматривать эти фотографии. Альбом не отображается в настройках приватности и обычном профиле.</p><div class=\"album-status\" id=\"private-album-status\" aria-live=\"polite\"></div><div class=\"album-grid\" id=\"private-album-grid\"></div></section></div>\n<div class=\"private-album-viewer\" id=\"private-album-viewer\" hidden><button type=\"button\" class=\"album-viewer-close\" id=\"private-album-viewer-close\" aria-label=\"Закрыть просмотр\">×</button><button type=\"button\" class=\"album-viewer-nav album-viewer-prev\" id=\"private-album-prev\" aria-label=\"Предыдущее фото\">‹</button><img id=\"private-album-image\" alt=\"Приватная фотография\" draggable=\"false\"><button type=\"button\" class=\"album-viewer-nav album-viewer-next\" id=\"private-album-next\" aria-label=\"Следующее фото\">›</button><div class=\"album-viewer-tools\" aria-label=\"Действия с приватной фотографией\"><button type=\"button\" id=\"private-album-share\" aria-label=\"Поделиться приватным фото\" title=\"Отправить фото другу\">flow</button><button type=\"button\" id=\"private-album-delete\" class=\"danger\" aria-label=\"Удалить приватное фото\" title=\"Удалить фото\">⌫</button></div><div class=\"album-viewer-counter\" id=\"private-album-counter\"></div><div class=\"album-viewer-thumbnails\" id=\"private-album-thumbnails\" hidden><div class=\"album-viewer-thumbnails-track\" id=\"private-album-thumbnails-track\"></div></div></div>\n<div class=\"album-viewer\" id=\"album-viewer\" hidden>\n <button type=\"button\" class=\"album-viewer-close\" id=\"album-viewer-close\" aria-label=\"Закрыть просмотр\">×</button>\n <button type=\"button\" class=\"album-viewer-nav album-viewer-prev\" id=\"album-viewer-prev\" aria-label=\"Предыдущее фото\">‹</button>\n <img id=\"album-viewer-image\" alt=\"Фотография в полном размере\">\n <button type=\"button\" class=\"album-viewer-nav album-viewer-next\" id=\"album-viewer-next\" aria-label=\"Следующее фото\">›</button>\n <div class=\"album-viewer-tools\" aria-label=\"Действия с фотографией\">\n  <button type=\"button\" id=\"album-viewer-share\" aria-label=\"Поделиться фото\" title=\"Отправить фото друзьям\">flow</button>\n  <button type=\"button\" id=\"album-viewer-delete\" class=\"danger\" aria-label=\"Удалить фото\" title=\"Удалить фото\">⌫</button>\n </div>\n <div class=\"album-viewer-counter\" id=\"album-viewer-counter\"></div>\n <div class=\"album-viewer-thumbnails\" id=\"album-viewer-thumbnails\" hidden><div class=\"album-viewer-thumbnails-track\" id=\"album-viewer-thumbnails-track\"></div></div>\n</div>\n<div class=\"album-share-backdrop\" id=\"album-share-backdrop\" hidden>\n <section class=\"album-share-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"album-share-title\">\n  <div class=\"album-head\"><h2 id=\"album-share-title\">Отправить фото</h2><button type=\"button\" class=\"settings-close\" id=\"album-share-close\" aria-label=\"Закрыть\">×</button></div>\n  <p class=\"album-note\">Выбери друга — на его аватаре появится отметка.</p>\n  <div class=\"album-share-friends\" id=\"album-share-friends\"><div class=\"album-empty\">Загружаем друзей…</div></div>\n  <button type=\"button\" class=\"album-share-send\" id=\"album-share-send\" disabled aria-label=\"Отправить выбранному пользователю\">➜</button>\n  <div class=\"album-status\" id=\"album-share-status\" aria-live=\"polite\"></div>\n </section>\n</div>\n\n<div class=\"video-album-backdrop\" id=\"video-album-backdrop\" hidden><section class=\"video-album-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"video-album-title\">\n<div class=\"album-head album-head-centered\"><div class=\"album-head-actions\"><button type=\"button\" class=\"album-private-open\" id=\"private-video-open\" aria-label=\"Открыть приватный видеоальбом\" title=\"Приватный видеоальбом\">🔒</button><button type=\"button\" class=\"album-add-trigger\" id=\"video-album-add-open\" aria-label=\"Добавить видео\" title=\"Добавить видео\">+</button></div><h2 id=\"video-album-title\" style=\"margin:0;color:#f2e9ff;font-size:20px\">Видео</h2><button type=\"button\" class=\"settings-close album-head-close\" id=\"video-album-close\" aria-label=\"Закрыть\">×</button></div>\n<div class=\"video-album-upload\" id=\"video-album-upload-panel\" hidden><strong style=\"color:#eee4ff\">Добавить видео</strong><input id=\"video-album-file\" type=\"file\" accept=\"video/mp4,video/webm,video/quicktime\" multiple><label><input id=\"video-album-private\" type=\"checkbox\"> <span>Приватный видеоальбом</span></label><p class=\"album-note\" id=\"video-album-privacy-note\">Обычные видео будут доступны в профиле согласно настройкам приватности. Если включить галочку, выбранные ролики попадут в секретный видеоальбом.</p><p class=\"album-note\">Форматы MP4, WebM и MOV. Максимальный размер одного видео — 50 МБ (лимит бесплатного тарифа).</p><button type=\"button\" class=\"primary\" id=\"video-album-upload-button\">Загрузить выбранные видео</button><button type=\"button\" class=\"album-cancel-upload\" id=\"video-album-add-cancel\">Отмена</button></div>\n<div class=\"album-status\" id=\"video-album-status\" aria-live=\"polite\"></div><div class=\"video-album-grid\" id=\"video-album-grid\"></div></section></div>\n<div class=\"private-video-backdrop\" id=\"private-video-backdrop\" hidden><section class=\"private-video-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"private-video-title\"><div class=\"album-head\"><h2 id=\"private-video-title\" style=\"margin:0;color:#f2e9ff;font-size:20px\">🔒 Приватный видеоальбом</h2><button type=\"button\" class=\"settings-close\" id=\"private-video-close\" aria-label=\"Закрыть приватный видеоальбом\">×</button></div><p class=\"private-album-note\">Только ты можешь просматривать эти видео. Альбом не отображается в настройках приватности и обычном профиле.</p><div class=\"album-status\" id=\"private-video-status\" aria-live=\"polite\"></div><div class=\"video-album-grid\" id=\"private-video-grid\"></div></section></div>\n<div class=\"video-album-viewer\" id=\"video-album-viewer\" hidden><div class=\"video-viewer-toolbar\"><button type=\"button\" id=\"video-album-viewer-delete\" class=\"danger\" aria-label=\"Удалить видео\" title=\"Удалить видео\">⌫</button><span id=\"video-album-viewer-counter\"></span><button type=\"button\" id=\"video-album-viewer-close\" aria-label=\"Закрыть просмотр\" title=\"Закрыть\">×</button></div><div class=\"video-viewer-stage\"><video id=\"video-album-player\" controls playsinline preload=\"metadata\"></video></div></div>\n<div class=\"private-video-viewer\" id=\"private-video-viewer\" hidden><div class=\"video-viewer-toolbar\"><button type=\"button\" id=\"private-video-viewer-delete\" class=\"danger\" aria-label=\"Удалить приватное видео\" title=\"Удалить видео\">⌫</button><span id=\"private-video-viewer-counter\"></span><button type=\"button\" id=\"private-video-viewer-close\" aria-label=\"Закрыть просмотр\" title=\"Закрыть\">×</button></div><div class=\"video-viewer-stage\"><video id=\"private-video-player\" controls playsinline preload=\"metadata\"></video></div></div>\n\n<div class=\"messages-backdrop\" id=\"messages-backdrop\" hidden>\n <section class=\"messages-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"messages-title\">\n  <div class=\"album-head\"><button type=\"button\" id=\"messages-back\" hidden>‹ Назад</button><h2 id=\"messages-title\">Сообщения</h2><button type=\"button\" class=\"settings-close\" id=\"messages-close\" aria-label=\"Закрыть\">×</button></div>\n  <div id=\"messages-list\" class=\"messages-list\"></div><div id=\"messages-thread\" class=\"messages-thread\" hidden></div>\n </section>\n</div>\n<input id=\"avatar-file\" type=\"file\" accept=\"image/jpeg,image/png,image/webp\" hidden>\n<input id=\"cover-file\" type=\"file\" accept=\"image/jpeg,image/png,image/webp\" hidden>\n<div class=\"album-backdrop\" id=\"music-backdrop\" hidden>\n <section class=\"album-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"music-title\">\n  <div class=\"album-head\"><h2 id=\"music-title\">Моя музыка</h2><button type=\"button\" class=\"settings-close\" id=\"music-close\" aria-label=\"Закрыть\">×</button></div>\n  <section class=\"music-upload-section\" aria-label=\"Добавление музыки\">\n   <button type=\"button\" class=\"primary music-upload-toggle\" id=\"music-upload-toggle\" aria-expanded=\"false\" aria-controls=\"music-upload-panel\"><span>＋ Добавить свой трек</span><span class=\"music-upload-chevron\" aria-hidden=\"true\">⌄</span></button>\n   <div class=\"music-upload-panel\" id=\"music-upload-panel\" aria-hidden=\"true\">\n    <div class=\"music-upload-panel-inner\">\n     <div class=\"album-upload\">\n      <label for=\"music-track-file\">Аудиофайл</label>\n      <input id=\"music-track-file\" type=\"file\" accept=\"audio/*\">\n      <button type=\"button\" class=\"primary\" id=\"music-upload-button\">Загрузить трек</button>\n     </div>\n    </div>\n   </div>\n   <div class=\"album-status\" id=\"music-status\" aria-live=\"polite\"></div>\n  </section>\n  <section class=\"music-tracks-section\" aria-label=\"Мои треки\">\n   <h3>Мои треки</h3>\n   <div class=\"music-track-list\" id=\"music-track-list\"></div>\n  </section>\n </section>\n</div>\n</div>";
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
export const title = "Мой профиль · FLOUSTREAM";
export const shadow = false;

export async function mount(root, { signal, navigate, url }) {
  const originalBodyStyle = document.body.getAttribute("style");
  const originalBodyClass = document.body.className;
  const originalTheme = document.body.dataset.theme;
  const style = document.createElement("style");
  style.dataset.floustreamRouteStyle = "profile";
  style.textContent = STYLES;
  root.innerHTML = MARKUP;
  const routeRoot = root.querySelector(".fs-route-profile");
  document.head.appendChild(style);

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
      document.body.style.cssText = originalBodyStyle || "";
      document.body.className = originalBodyClass;
      if (originalTheme === undefined) delete document.body.dataset.theme;
      else document.body.dataset.theme = originalTheme;
      root.replaceChildren();
    }
    style.remove();
  };

  await ensureProfileScripts();
  if (signal.aborted) return restoreProfileShell;

  
const SUPABASE_URL="https://qhpobdktlbhdqsnajypr.supabase.co";
const SUPABASE_KEY="sb_publishable_tzG1qVsbjaW8YE_LBVN87Q_v0CahKN5";
let client,user,profile={},columns=[];
const $=id=>root.querySelector("#"+id);
function loadLibrary(){return new Promise((resolve,reject)=>{if(window.supabase?.createClient){resolve();return;}const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";s.onload=()=>window.supabase?.createClient?resolve():reject(new Error("Supabase не загрузился"));s.onerror=()=>reject(new Error("Нет подключения к библиотеке Supabase"));document.head.appendChild(s);});}
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


let videoAlbumItems=[],videoAlbumIndex=0,privateVideoItems=[],privateVideoIndex=0;
function videoAlbumMessage(id,message){const node=$(id);if(node)node.textContent=message||"";}
function addVideoFrameThumbnail(tile,item){
 const frame=document.createElement("video");
 frame.className="video-album-frame";
 frame.muted=true;frame.defaultMuted=true;frame.playsInline=true;
 frame.preload="metadata";frame.setAttribute("aria-hidden","true");
 frame.addEventListener("loadedmetadata",()=>{
  if(!Number.isFinite(frame.duration)||frame.duration<=0)return;
  try{frame.currentTime=Math.min(0.25,frame.duration/2);}catch(_){}
 },{once:true});
 frame.addEventListener("error",()=>{frame.removeAttribute("src");frame.load();},{once:true});
 frame.src=item.url;
 tile.append(frame);
}
function stopVideoPlayer(id){const player=$(id);if(player){player.pause();player.removeAttribute("src");player.load();}}
async function openVideoAlbum(){
 $("video-album-backdrop").hidden=false;
 $("video-album-upload-panel").hidden=true;
 $("video-album-viewer").hidden=true;
 $("video-album-file").value="";
 $("video-album-private").checked=false;
 videoAlbumMessage("video-album-status","");
 await loadVideoAlbum();
}
async function loadVideoAlbum(){
 const grid=$("video-album-grid");grid.replaceChildren();
 const loading=document.createElement("div");loading.className="album-empty";loading.textContent="Загружаем видео…";grid.append(loading);
 try{
  const result=await client.from("video_album_videos").select("id,object_path,file_name,mime_type,created_at").eq("owner_id",user.id).order("created_at",{ascending:false});
  if(result.error)throw result.error;
  const rows=result.data||[];
  if(!rows.length){videoAlbumItems=[];grid.replaceChildren();const empty=document.createElement("div");empty.className="album-empty";empty.textContent="Здесь пока нет видео. Добавь первое!";grid.append(empty);return;}
  const signed=await client.storage.from("video-albums").createSignedUrls(rows.map(item=>item.object_path),3600);
  if(signed.error)throw signed.error;
  const urls=new Map((signed.data||[]).filter(x=>x.signedUrl&&!x.error).map(x=>[x.path,x.signedUrl]));
  videoAlbumItems=rows.filter(item=>urls.has(item.object_path)).map(item=>({...item,url:urls.get(item.object_path)}));
  grid.replaceChildren();
  if(!videoAlbumItems.length){const empty=document.createElement("div");empty.className="album-empty";empty.textContent="Не удалось получить ссылки на видео. Попробуй обновить альбом.";grid.append(empty);return;}
  videoAlbumItems.forEach((item,index)=>{
   const tile=document.createElement("button");tile.type="button";tile.className="video-album-item";tile.setAttribute("aria-label","Открыть видео: "+(item.file_name||"видео"));
   addVideoFrameThumbnail(tile,item);
   tile.addEventListener("click",()=>showVideoAlbumItem(index,false,true));grid.append(tile);
  });
  videoAlbumMessage("video-album-status","");
 }catch(error){grid.replaceChildren();const empty=document.createElement("div");empty.className="album-empty";empty.textContent="Не удалось загрузить видео: "+error.message;grid.append(empty);}
}
async function loadPrivateVideoAlbum(){
 const grid=$("private-video-grid");grid.replaceChildren();
 const loading=document.createElement("div");loading.className="album-empty";loading.textContent="Загружаем приватные видео…";grid.append(loading);
 try{
  const result=await client.from("private_video_album_videos").select("id,object_path,file_name,mime_type,created_at").eq("owner_id",user.id).order("created_at",{ascending:false});
  if(result.error)throw result.error;
  const rows=result.data||[];
  if(!rows.length){privateVideoItems=[];grid.replaceChildren();const empty=document.createElement("div");empty.className="album-empty";empty.textContent="В приватном видеоальбоме пока нет видео.";grid.append(empty);return;}
  const signed=await client.storage.from("private-video-albums").createSignedUrls(rows.map(item=>item.object_path),3600);
  if(signed.error)throw signed.error;
  const urls=new Map((signed.data||[]).filter(x=>x.signedUrl&&!x.error).map(x=>[x.path,x.signedUrl]));
  privateVideoItems=rows.filter(item=>urls.has(item.object_path)).map(item=>({...item,url:urls.get(item.object_path)}));
  grid.replaceChildren();
  if(!privateVideoItems.length){const empty=document.createElement("div");empty.className="album-empty";empty.textContent="Не удалось получить ссылки на приватные видео.";grid.append(empty);return;}
  privateVideoItems.forEach((item,index)=>{
   const tile=document.createElement("button");tile.type="button";tile.className="video-album-item";tile.setAttribute("aria-label","Открыть приватное видео");
   addVideoFrameThumbnail(tile,item);
   tile.addEventListener("click",()=>showVideoAlbumItem(index,true,true));grid.append(tile);
  });
  videoAlbumMessage("private-video-status","");
 }catch(error){grid.replaceChildren();const empty=document.createElement("div");empty.className="album-empty";empty.textContent="Не удалось открыть приватный видеоальбом: "+error.message;grid.append(empty);}
}
async function openPrivateVideoAlbum(){
 $("private-video-backdrop").hidden=false;
 await loadPrivateVideoAlbum();
}
function showVideoAlbumItem(index,isPrivate,openFullscreen=false){
 const items=isPrivate?privateVideoItems:videoAlbumItems;
 if(!items.length)return;
 const next=Math.max(0,Math.min(index,items.length-1));
 if(isPrivate)privateVideoIndex=next;else videoAlbumIndex=next;
 const item=items[next],player=$(isPrivate?"private-video-player":"video-album-player");
 player.pause();player.src=item.url;player.load();
 $(isPrivate?"private-video-viewer-counter":"video-album-viewer-counter").textContent=(next+1)+" / "+items.length;
 $(isPrivate?"private-video-viewer":"video-album-viewer").hidden=false;
 if(openFullscreen){
  const playRequest=player.play();
  if(playRequest&&typeof playRequest.catch==="function")playRequest.catch(()=>{});
 }
}
function bindVideoSwipe(viewerId,playerId,isPrivate){
 const stage=$(viewerId).querySelector(".video-viewer-stage");
 if(!stage||stage.dataset.swipeBound)return;
 stage.dataset.swipeBound="true";
 let start=null;
 stage.addEventListener("touchstart",event=>{
  if(event.touches.length!==1)return;
  const touch=event.touches[0];start={x:touch.clientX,y:touch.clientY};
 },{passive:true});
 stage.addEventListener("touchend",event=>{
  if(!start||!event.changedTouches.length)return;
  const touch=event.changedTouches[0],dx=touch.clientX-start.x,dy=touch.clientY-start.y;start=null;
  if(Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.25)return;
  const items=isPrivate?privateVideoItems:videoAlbumItems;
  const current=isPrivate?privateVideoIndex:videoAlbumIndex;
  const next=current+(dx<0?1:-1);
  if(next<0||next>=items.length)return;
  showVideoAlbumItem(next,isPrivate,true);
 },{passive:true});
}
bindVideoSwipe("video-album-viewer","video-album-player",false);
bindVideoSwipe("private-video-viewer","private-video-player",true);
function closeVideoAlbumViewer(isPrivate){
 const viewer=isPrivate?"private-video-viewer":"video-album-viewer";
 const player=isPrivate?"private-video-player":"video-album-player";
 $(viewer).hidden=true;stopVideoPlayer(player);
}
async function deleteCurrentVideo(isPrivate){
 const items=isPrivate?privateVideoItems:videoAlbumItems;
 const index=isPrivate?privateVideoIndex:videoAlbumIndex;
 const item=items[index];if(!item)return;
 if(!confirm("Удалить это видео без возможности восстановления?"))return;
 const button=$(isPrivate?"private-video-viewer-delete":"video-album-viewer-delete");button.disabled=true;
 const bucket=isPrivate?"private-video-albums":"video-albums";
 const table=isPrivate?"private_video_album_videos":"video_album_videos";
 try{
  const removed=await client.storage.from(bucket).remove([item.object_path]);if(removed.error)throw removed.error;
  const deleted=await client.from(table).delete().eq("id",item.id).eq("owner_id",user.id);if(deleted.error)throw deleted.error;
  closeVideoAlbumViewer(isPrivate);
  if(isPrivate)await loadPrivateVideoAlbum();else await loadVideoAlbum();
 }catch(error){alert("Не удалось удалить видео: "+error.message);}
 finally{button.disabled=false;}
}
$("video-album-close").addEventListener("click",()=>{$("video-album-backdrop").hidden=true;closeVideoAlbumViewer(false);});
$("video-album-backdrop").addEventListener("click",e=>{if(e.target===$("video-album-backdrop"))$("video-album-backdrop").hidden=true;});
$("video-album-add-open").addEventListener("click",()=>{$("video-album-upload-panel").hidden=!$("video-album-upload-panel").hidden;if(!$("video-album-upload-panel").hidden)$("video-album-file").focus();});
$("video-album-add-cancel").addEventListener("click",()=>{$("video-album-upload-panel").hidden=true;$("video-album-file").value="";videoAlbumMessage("video-album-status","");});
$("video-album-private").addEventListener("change",()=>{videoAlbumMessage("video-album-privacy-note",$("video-album-private").checked?"🔒 Видео сохранится в закрытом хранилище. Только твой аккаунт сможет его открыть.":"Обычные видео будут доступны в профиле согласно настройкам приватности. Если включить галочку, выбранные ролики попадут в секретный видеоальбом.");});
let tusLibraryPromise=null;
function loadTusLibrary(){
 if(window.tus&&window.tus.Upload)return Promise.resolve();
 if(!tusLibraryPromise){
  tusLibraryPromise=new Promise((resolve,reject)=>{
   const script=document.createElement("script");
   script.src="https://cdn.jsdelivr.net/npm/tus-js-client@4/dist/tus.min.js";
   script.onload=()=>window.tus&&window.tus.Upload?resolve():reject(new Error("Библиотека возобновляемой загрузки не загрузилась."));
   script.onerror=()=>reject(new Error("Не удалось загрузить модуль загрузки видео."));
   document.head.appendChild(script);
  });
 }
 return tusLibraryPromise;
}
async function uploadVideoResumable(bucket,path,file,onProgress){
 await loadTusLibrary();
 const sessionResult=await client.auth.getSession();
 if(sessionResult.error)throw sessionResult.error;
 const token=sessionResult.data&&sessionResult.data.session&&sessionResult.data.session.access_token;
 if(!token)throw new Error("Сессия истекла. Войди в аккаунт заново.");
 const ext=(file.name.split(".").pop()||"mp4").toLowerCase();
 const contentType=file.type||"video/"+(ext==="mov"?"quicktime":ext);
 const endpoint=SUPABASE_URL.replace(".supabase.co",".storage.supabase.co")+"/storage/v1/upload/resumable";
 return await new Promise((resolve,reject)=>{
  let settled=false;
  const finish=(error,value)=>{if(settled)return;settled=true;error?reject(error):resolve(value);};
  const upload=new window.tus.Upload(file,{
   endpoint,
   retryDelays:[0,3000,5000,10000,20000],
   headers:{authorization:"Bearer "+token,apikey:SUPABASE_KEY},
   metadata:{bucketName:bucket,objectName:path,contentType,cacheControl:"3600"},
   chunkSize:6*1024*1024,
   uploadDataDuringCreation:true,
   removeFingerprintOnSuccess:true,
   onError:error=>finish(error),
   onProgress:(uploaded,total)=>onProgress(uploaded,total),
   onSuccess:()=>finish(null,path)
  });
  upload.findPreviousUploads().then(previous=>{
   const match=previous.find(item=>item.metadata&&item.metadata.bucketName===bucket&&item.metadata.objectName&&item.metadata.objectName.startsWith(user.id+"/"));
   if(match){
    path=match.metadata.objectName;
    upload.resumeFromPreviousUpload(match);
   }
   upload.start();
  }).catch(error=>finish(error));
 });
}
$("video-album-upload-button").addEventListener("click",async()=>{
 const files=Array.from($("video-album-file").files||[]);
 if(!files.length){videoAlbumMessage("video-album-status","Сначала выбери одно или несколько видео.");return;}
 const allowed=["video/mp4","video/webm","video/quicktime"];
 const extAllowed=/\.(mp4|webm|mov)$/i;
 const invalid=files.find(file=>!(allowed.includes(file.type)||(!file.type&&extAllowed.test(file.name))));
 if(invalid){videoAlbumMessage("video-album-status","Файл «"+invalid.name+"» имеет неподдерживаемый формат. Подойдут MP4, WebM и MOV.");return;}
 const tooLarge=files.find(file=>file.size>50*1024*1024);
 if(tooLarge){videoAlbumMessage("video-album-status","Файл «"+tooLarge.name+"» превышает лимит бесплатного тарифа — 50 МБ.");return;}
 const isPrivate=$("video-album-private").checked;
 const bucket=isPrivate?"private-video-albums":"video-albums";
 const table=isPrivate?"private_video_album_videos":"video_album_videos";
 const button=$("video-album-upload-button");button.disabled=true;let count=0;const failures=[];
 try{
  for(let i=0;i<files.length;i++){
   const file=files[i];videoAlbumMessage("video-album-status","Подготавливаем загрузку "+(i+1)+" из "+files.length+": "+file.name);
   const ext=(file.name.split(".").pop()||"mp4").toLowerCase();
   let path=user.id+"/"+Date.now()+"-"+(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2))+"."+ext;
   try{
    path=await uploadVideoResumable(bucket,path,file,(uploaded,total)=>{
     const percent=total?Math.floor(uploaded/total*100):0;
     const mb=(uploaded/1024/1024).toFixed(1),totalMb=(total/1024/1024).toFixed(1);
     videoAlbumMessage("video-album-status","Загружаем "+(i+1)+" из "+files.length+": "+file.name+" — "+percent+"% ("+mb+" / "+totalMb+" МБ)");
    });
    const saved=await client.from(table).insert({owner_id:user.id,object_path:path,file_name:file.name,mime_type:file.type||null});
    if(saved.error){await client.storage.from(bucket).remove([path]);throw saved.error;}
    count++;
   }catch(error){failures.push(file.name+": "+error.message);}
  }
  $("video-album-file").value="";$("video-album-upload-panel").hidden=true;
  videoAlbumMessage("video-album-status",(count?"Загружено видео: "+count+". ":"")+(failures.length?"Ошибки: "+failures.join(" | "):"Готово!"));
  if(isPrivate)await loadPrivateVideoAlbum();else await loadVideoAlbum();
 }catch(error){videoAlbumMessage("video-album-status","Не удалось загрузить видео: "+error.message);}
 finally{button.disabled=false;}
});
$("private-video-open").addEventListener("click",openPrivateVideoAlbum);
$("private-video-close").addEventListener("click",()=>{$("private-video-backdrop").hidden=true;closeVideoAlbumViewer(true);});
$("private-video-backdrop").addEventListener("click",e=>{if(e.target===$("private-video-backdrop"))$("private-video-backdrop").hidden=true;});
$("video-album-viewer-close").addEventListener("click",()=>closeVideoAlbumViewer(false));
$("private-video-viewer-close").addEventListener("click",()=>closeVideoAlbumViewer(true));
$("video-album-viewer-delete").addEventListener("click",()=>deleteCurrentVideo(false));
$("private-video-viewer-delete").addEventListener("click",()=>deleteCurrentVideo(true));
$("video-album-viewer").addEventListener("click",e=>{if(e.target===$("video-album-viewer"))closeVideoAlbumViewer(false);});
$("private-video-viewer").addEventListener("click",e=>{if(e.target===$("private-video-viewer"))closeVideoAlbumViewer(true);});

async function openPhotoAlbum(){
 $("album-backdrop").hidden=false;
 $("album-file").value="";$("album-status").textContent="";
 $("album-upload-panel").hidden=true;$("album-viewer").hidden=true;
 await loadPhotoAlbum();
}

let privateAlbumItems=[],privateAlbumIndex=0;
async function openPrivateAlbum(){$("private-album-backdrop").hidden=false;await loadPrivateAlbum();}
async function loadPrivateAlbum(){
 const grid=$("private-album-grid"),status=$("private-album-status");grid.replaceChildren();status.textContent="Загружаем приватные фотографии…";
 try{
  const result=await client.from("private_album_photos").select("id,object_path,file_name,mime_type,created_at").eq("owner_id",user.id).order("created_at",{ascending:false});
  if(result.error)throw result.error;const rows=result.data||[];
  if(!rows.length){privateAlbumItems=[];status.textContent="В приватном альбоме пока нет фотографий.";return;}
  const signed=await client.storage.from("private-albums").createSignedUrls(rows.map(item=>item.object_path),3600);
  if(signed.error)throw signed.error;
  const urls=new Map((signed.data||[]).filter(x=>x.signedUrl&&!x.error).map(x=>[x.path,x.signedUrl]));
  privateAlbumItems=rows.filter(x=>urls.has(x.object_path)).map(x=>({...x,url:urls.get(x.object_path)}));status.textContent="";
  if(!privateAlbumItems.length){status.textContent="Не удалось получить ссылки на приватные фотографии.";return;}
  privateAlbumItems.forEach((item,i)=>{const tile=document.createElement("button");tile.type="button";tile.className="album-item";tile.setAttribute("aria-label","Открыть приватное фото");const img=document.createElement("img");img.alt="Приватная фотография";img.loading="lazy";tile.append(img);queueAlbumThumb(img,item,"private-albums",false);tile.addEventListener("click",()=>showPrivateAlbumPhoto(i));grid.append(tile);});
 }catch(e){privateAlbumItems=[];status.textContent="Не удалось загрузить приватный альбом: "+e.message;}
}
function renderPrivateAlbumThumbnails(){
 const host=$("private-album-thumbnails-track");if(!host)return;host.replaceChildren();
 privateAlbumItems.forEach((item,i)=>{const b=document.createElement("button");b.type="button";b.className="album-viewer-thumb"+(i===privateAlbumIndex?" active":"");b.setAttribute("aria-label","Перейти к приватному фото "+(i+1));const img=document.createElement("img");img.alt="";img.loading="lazy";b.append(img);queueAlbumThumb(img,item,"private-albums",false);b.addEventListener("click",()=>{showPrivateAlbumPhoto(i);$("private-album-thumbnails").hidden=true;});host.append(b);});
 const active=host.children[privateAlbumIndex];if(active)active.scrollIntoView({block:"nearest",inline:"center"});
}
let privateAlbumDisplayRequest=0,privateAlbumPendingIndex=null;
async function showPrivateAlbumPhoto(i){
 if(!privateAlbumItems.length)return;
 const index=(i+privateAlbumItems.length)%privateAlbumItems.length,item=privateAlbumItems[index],request=++privateAlbumDisplayRequest;
 privateAlbumPendingIndex=index;
 $("private-album-prev").hidden=privateAlbumItems.length<2;$("private-album-next").hidden=privateAlbumItems.length<2;$("private-album-viewer").hidden=false;
 let url=item.url;try{url=await getAlbumDisplayUrl(item,"private-albums");}catch(_){}
 if(request!==privateAlbumDisplayRequest)return;
 try{await preloadAlbumImage(url);}catch(_){url=item.url;try{await preloadAlbumImage(url);}catch(__){}}
 if(request!==privateAlbumDisplayRequest)return;
 privateAlbumIndex=index;privateAlbumPendingIndex=null;
 const image=$("private-album-image");image.src=url;image.alt=item.file_name||"Приватная фотография";
 $("private-album-counter").textContent=(index+1)+" / "+privateAlbumItems.length;
 renderPrivateAlbumThumbnails();preloadAlbumNeighbors(privateAlbumItems,index,"private-albums");
}
function stepPrivateAlbumPhoto(delta){
 const base=privateAlbumPendingIndex===null?privateAlbumIndex:privateAlbumPendingIndex;
 showPrivateAlbumPhoto(base+delta);
}
function closePrivateAlbumViewer(){$("private-album-viewer").hidden=true;$("private-album-image").removeAttribute("src");}
$("album-private-open").addEventListener("click",openPrivateAlbum);
$("private-album-close").addEventListener("click",()=>$("private-album-backdrop").hidden=true);
$("private-album-backdrop").addEventListener("click",e=>{if(e.target===$("private-album-backdrop"))$("private-album-backdrop").hidden=true;});
$("private-album-viewer-close").addEventListener("click",closePrivateAlbumViewer);
$("private-album-prev").addEventListener("click",()=>stepPrivateAlbumPhoto(-1));
$("private-album-next").addEventListener("click",()=>stepPrivateAlbumPhoto(1));
$("private-album-viewer").addEventListener("click",e=>{if(e.target===$("private-album-viewer"))closePrivateAlbumViewer();});
$("private-album-delete").addEventListener("click",async()=>{
 const item=privateAlbumItems[privateAlbumIndex];if(!item)return;if(!confirm("Удалить эту приватную фотографию без возможности восстановления?"))return;
 const b=$("private-album-delete");b.disabled=true;
 try{const a=await client.storage.from("private-albums").remove([item.object_path]);if(a.error)throw a.error;const d=await client.from("private_album_photos").delete().eq("id",item.id).eq("owner_id",user.id);if(d.error)throw d.error;closePrivateAlbumViewer();await loadPrivateAlbum();}
 catch(e){alert("Не удалось удалить приватное фото: "+e.message);}finally{b.disabled=false;}
});
let privateSwipe=null;
$("private-album-viewer").addEventListener("pointerdown",e=>{if(e.target.closest("button")||(e.pointerType==="mouse"&&e.button!==0))return;privateSwipe={id:e.pointerId,x:e.clientX,y:e.clientY};try{$("private-album-viewer").setPointerCapture(e.pointerId);}catch(_){}});
$("private-album-viewer").addEventListener("pointerup",e=>{if(!privateSwipe||privateSwipe.id!==e.pointerId)return;const dx=e.clientX-privateSwipe.x,dy=e.clientY-privateSwipe.y;privateSwipe=null;if(Math.abs(dy)>=55&&Math.abs(dy)>Math.abs(dx)*1.2){if(dy<0){renderPrivateAlbumThumbnails();$("private-album-thumbnails").hidden=false;}else $("private-album-thumbnails").hidden=true;return;}if(Math.abs(dx)>=32&&Math.abs(dx)>=Math.abs(dy)*1.15){$("private-album-thumbnails").hidden=true;stepPrivateAlbumPhoto(dx<0?1:-1);}});
$("private-album-viewer").addEventListener("pointercancel",()=>{privateSwipe=null;});
$("private-album-viewer").addEventListener("lostpointercapture",()=>{privateSwipe=null;});
$("album-add-open").addEventListener("click",()=>{
 $("album-upload-panel").hidden=!$("album-upload-panel").hidden;
 if(!$("album-upload-panel").hidden)$("album-file").focus();
});
$("album-add-cancel").addEventListener("click",()=>{
 $("album-upload-panel").hidden=true;$("album-file").value="";$("album-status").textContent="";
});
let albumViewerItems=[],albumViewerIndex=0,albumTouchStartX=0,albumTouchStartY=0;
function closeAlbumViewer(){$("album-viewer").hidden=true;$("album-viewer-image").removeAttribute("src");}
$("album-share-close").addEventListener("click",()=>{$("album-share-backdrop").hidden=true;albumShareSource=null;albumSelectedFriend=null;});
$("album-share-backdrop").addEventListener("click",e=>{if(e.target===$("album-share-backdrop")){$("album-share-backdrop").hidden=true;albumShareSource=null;albumSelectedFriend=null;}});
async function loadAlbumShareFriends(){
 const host=$("album-share-friends");host.replaceChildren();
 try{
  const following=await client.from("follows").select("following_id").eq("follower_id",user.id);
  if(following.error)throw following.error;
  const ids=(following.data||[]).map(x=>x.following_id);
  if(!ids.length){host.innerHTML='<div class="album-empty">Пока нет друзей для отправки.</div>';return;}
  const mutual=await client.from("follows").select("follower_id").eq("following_id",user.id).in("follower_id",ids);
  if(mutual.error)throw mutual.error;
  const friendIds=(mutual.data||[]).map(x=>x.follower_id);
  if(!friendIds.length){host.innerHTML='<div class="album-empty">Пока нет взаимных друзей.</div>';return;}
  const profiles=await client.from("profiles").select("id,username,display_name,avatar_url,last_activity_at,time_zone").in("id",friendIds);
  if(profiles.error)throw profiles.error;
  host.replaceChildren();
  profiles.data.forEach(friend=>{
   const button=document.createElement("button");button.type="button";button.className="album-share-friend";
   const avatar=document.createElement("span");avatar.className="album-share-avatar";
   if(friend.avatar_url){const img=document.createElement("img");img.src=friend.avatar_url;img.alt="";avatar.append(img);}
   else avatar.textContent=(friend.display_name||friend.username||"?").slice(0,1).toUpperCase();
   const name=document.createElement("span");name.textContent=friend.display_name||friend.username||"Пользователь";
   button.append(avatar,name);
   button.addEventListener("click",()=>{
    albumSelectedFriend=friend;
    host.querySelectorAll(".album-share-friend").forEach(x=>x.classList.remove("selected"));
    button.classList.add("selected");$("album-share-send").disabled=false;
   });
   host.append(button);
  });
 }catch(error){host.innerHTML='<div class="album-empty">Не удалось загрузить друзей: '+String(error.message||error).replace(/[<>]/g,"")+'</div>';}
}
$("album-share-send").addEventListener("click",async()=>{
 const friend=albumSelectedFriend,share=albumShareSource,item=share?.item;
 if(!friend||!item||!share?.bucket)return;
 const button=$("album-share-send");button.disabled=true;$("album-share-status").textContent="Отправляем фото…";
 let newPath=null;
 try{
  const downloaded=await client.storage.from(share.bucket).download(item.object_path);
  if(downloaded.error)throw downloaded.error;
  const ext=(item.mime_type||"image/jpeg").split("/")[1]||"jpg";
  newPath=user.id+"/"+crypto.randomUUID()+"."+ext;
  const uploaded=await client.storage.from("message-media").upload(newPath,downloaded.data,{upsert:false,contentType:item.mime_type||"image/jpeg"});
  if(uploaded.error)throw uploaded.error;
  const sent=await client.from("direct_messages").insert({sender_id:user.id,recipient_id:friend.id,content:"",attachment_path:newPath,attachment_name:item.file_name||"Фото",attachment_mime:item.mime_type||"image/jpeg"});
  if(sent.error)throw sent.error;
  $("album-share-status").textContent="Фото отправлено пользователю "+(friend.display_name||friend.username||"");
  button.disabled=true;
  profileTimeout(()=>{$("album-share-backdrop").hidden=true;albumShareSource=null;albumSelectedFriend=null;},900);
 }catch(error){
  if(newPath)await client.storage.from("message-media").remove([newPath]);
  $("album-share-status").textContent="Не удалось отправить фото: "+error.message;button.disabled=false;
 }
});
function renderAlbumViewerThumbnails(){
 const host=$("album-viewer-thumbnails-track");if(!host)return;host.replaceChildren();
 albumViewerItems.forEach((item,i)=>{const b=document.createElement("button");b.type="button";b.className="album-viewer-thumb"+(i===albumViewerIndex?" active":"");b.setAttribute("aria-label","Перейти к фото "+(i+1));const img=document.createElement("img");img.alt="";img.loading="lazy";b.append(img);queueAlbumThumb(img,item,"photo-albums",true);b.addEventListener("click",()=>{showAlbumViewerPhoto(i);$("album-viewer-thumbnails").hidden=true;});host.append(b);});
 const active=host.children[albumViewerIndex];if(active)active.scrollIntoView({block:"nearest",inline:"center"});
}
let albumDisplayRequest=0,albumViewerPendingIndex=null;
async function showAlbumViewerPhoto(index){
 if(!albumViewerItems.length)return;
 const currentIndex=(index+albumViewerItems.length)%albumViewerItems.length,item=albumViewerItems[currentIndex],request=++albumDisplayRequest;
 albumViewerPendingIndex=currentIndex;
 $("album-viewer-prev").hidden=albumViewerItems.length<2;$("album-viewer-next").hidden=albumViewerItems.length<2;
 let url=item.url;try{url=await getAlbumDisplayUrl(item,"photo-albums");}catch(_){}
 if(request!==albumDisplayRequest)return;
 try{await preloadAlbumImage(url);}catch(_){url=item.url;try{await preloadAlbumImage(url);}catch(__){}}
 if(request!==albumDisplayRequest)return;
 albumViewerIndex=currentIndex;albumViewerPendingIndex=null;
 const image=$("album-viewer-image");image.src=url;image.alt=item.file_name||"Фотография";
 $("album-viewer-counter").textContent=(currentIndex+1)+" / "+albumViewerItems.length;
 renderAlbumViewerThumbnails();preloadAlbumNeighbors(albumViewerItems,currentIndex,"photo-albums");
}
function stepAlbumViewerPhoto(delta){
 const base=albumViewerPendingIndex===null?albumViewerIndex:albumViewerPendingIndex;
 showAlbumViewerPhoto(base+delta);
}
let albumSelectedFriend=null,albumShareSource=null;
async function openAlbumShare(source){if(!source?.item)return;albumShareSource=source;$("album-share-backdrop").hidden=false;$("album-share-status").textContent="";$("album-share-send").disabled=true;albumSelectedFriend=null;await loadAlbumShareFriends();}
$("album-viewer-delete").addEventListener("click",async()=>{
 const item=albumViewerItems[albumViewerIndex];if(!item)return;
 if(!confirm("Удалить эту фотографию без возможности восстановления?"))return;
 const button=$("album-viewer-delete");button.disabled=true;
 try{
  const isCurrentAvatar=profile?.avatar_photo_id===item.id;
  const oldAvatarUrl=isCurrentAvatar?profile.avatar_url:null;
  const row=await client.from("photo_album_photos").delete().eq("id",item.id).eq("owner_id",user.id).select("id").maybeSingle();
  if(row.error)throw row.error;
  if(!row.data)throw new Error("Фотография уже удалена или недоступна.");
  if(isCurrentAvatar){
   profile.avatar_photo_id=null;profile.avatar_url=null;columns=Object.keys(profile);render();
   const marker="/storage/v1/object/public/avatars/";
   const markerIndex=oldAvatarUrl?oldAvatarUrl.indexOf(marker):-1;
   if(markerIndex>=0){
    try{const avatarPath=decodeURIComponent(oldAvatarUrl.slice(markerIndex+marker.length).split("?")[0]);await client.storage.from("avatars").remove([avatarPath]);}catch(_){}
   }
  }
  const removed=await client.storage.from("photo-albums").remove([item.object_path]);
  if(removed.error)console.warn("FLOUSTREAM album file cleanup:",removed.error);
  albumViewerItems.splice(albumViewerIndex,1);
  if(!albumViewerItems.length){closeAlbumViewer();await loadPhotoAlbum();return;}
  if(albumViewerIndex>=albumViewerItems.length)albumViewerIndex=albumViewerItems.length-1;
  await loadPhotoAlbum();
  if(albumViewerItems.length){$("album-viewer").hidden=false;showAlbumViewerPhoto(albumViewerIndex);}else closeAlbumViewer();
 }catch(error){$("album-status").textContent="Не удалось удалить фото: "+error.message;}
 finally{button.disabled=false;}
});
$("album-viewer-share").addEventListener("click",()=>openAlbumShare({item:albumViewerItems[albumViewerIndex],bucket:"photo-albums"}));
$("private-album-share").addEventListener("click",()=>openAlbumShare({item:privateAlbumItems[privateAlbumIndex],bucket:"private-albums"}));
$("album-viewer-close").addEventListener("click",closeAlbumViewer);
$("album-viewer-prev").addEventListener("click",()=>stepAlbumViewerPhoto(-1));
$("album-viewer-next").addEventListener("click",()=>stepAlbumViewerPhoto(1));
$("album-viewer").addEventListener("click",e=>{if(e.target===$("album-viewer"))closeAlbumViewer();});
let albumSwipeStart=null;
$("album-viewer").addEventListener("pointerdown",e=>{
 if($("album-viewer").hidden||e.target.closest("button"))return;
 if(e.pointerType==="mouse"&&e.button!==0)return;
 albumSwipeStart={id:e.pointerId,x:e.clientX,y:e.clientY};
 try{$("album-viewer").setPointerCapture(e.pointerId);}catch(_){}
});
$("album-viewer").addEventListener("pointerup",e=>{
 if(!albumSwipeStart||albumSwipeStart.id!==e.pointerId)return;
 const dx=e.clientX-albumSwipeStart.x,dy=e.clientY-albumSwipeStart.y;albumSwipeStart=null;
 if(Math.abs(dy)>=55&&Math.abs(dy)>Math.abs(dx)*1.2){if(dy<0){renderAlbumViewerThumbnails();$("album-viewer-thumbnails").hidden=false;}else $("album-viewer-thumbnails").hidden=true;return;}
 if(Math.abs(dx)<32||Math.abs(dx)<Math.abs(dy)*1.15)return;
 $("album-viewer-thumbnails").hidden=true;stepAlbumViewerPhoto(dx<0?1:-1);
});
$("album-viewer").addEventListener("pointercancel",()=>{albumSwipeStart=null;});
$("album-viewer").addEventListener("lostpointercapture",()=>{albumSwipeStart=null;});
document.addEventListener("keydown",e=>{if($("album-viewer").hidden)return;if(e.key==="Escape")closeAlbumViewer();else if(e.key==="ArrowLeft")stepAlbumViewerPhoto(1);else if(e.key==="ArrowRight")stepAlbumViewerPhoto(-1);},{signal});

// Миниатюры обычного альбома хранятся в Cache API браузера между посещениями.
// Приватные миниатюры остаются только в памяти текущего сеанса.
const albumThumbMemory=new Map();
const albumDisplayUrlMemory=new Map();
let albumThumbQueue=[],albumThumbActive=0;
function runAlbumThumbQueue(){
 while(albumThumbActive<4&&albumThumbQueue.length){
  const task=albumThumbQueue.shift();albumThumbActive++;
  Promise.resolve().then(task).finally(()=>{albumThumbActive--;runAlbumThumbQueue();});
 }
}
const albumImagePreloadCache=new Map();
function preloadAlbumImage(url){
 if(albumImagePreloadCache.has(url))return albumImagePreloadCache.get(url);
 const promise=new Promise((resolve,reject)=>{
  const probe=new Image();probe.decoding="async";
  probe.onload=async()=>{try{if(probe.decode)await probe.decode();resolve(probe);}catch(_){resolve(probe);}};
  probe.onerror=()=>{albumImagePreloadCache.delete(url);reject(new Error("Не удалось загрузить фотографию"));};
  probe.src=url;if(probe.complete&&probe.naturalWidth)resolve(probe);
 });
 albumImagePreloadCache.set(url,promise);return promise;
}
async function getAlbumDisplayUrl(item,bucket){
 const key=user.id+"|"+bucket+"|"+item.object_path;
 if(albumDisplayUrlMemory.has(key))return albumDisplayUrlMemory.get(key);
 const signed=await client.storage.from(bucket).createSignedUrl(item.object_path,3600,{transform:{width:1600,height:1600,resize:"contain",quality:82}});
 if(signed.error||!signed.data?.signedUrl)throw signed.error||new Error("Не удалось подготовить фотографию");
 albumDisplayUrlMemory.set(key,signed.data.signedUrl);return signed.data.signedUrl;
}
function preloadAlbumNeighbors(items,index,bucket){
 [index-1,index+1].forEach(n=>{
  const item=items[(n+items.length)%items.length];if(!item)return;
  getAlbumDisplayUrl(item,bucket).then(preloadAlbumImage).catch(()=>{});
 });
}
const albumThumbCacheName="floustream-album-thumbnails-v1";
async function getAlbumThumbUrl(item,bucket,persist){
 const key=user.id+"|"+bucket+"|"+item.object_path;
 const remembered=albumThumbMemory.get(key);
 if(remembered){
  if(typeof remembered==="string")return remembered;
  if(remembered.expiresAt>Date.now())return remembered.url;
  albumThumbMemory.delete(key);
 }
 const cacheKey=new URL("/__floustream_thumb_cache__/"+encodeURIComponent(user.id)+"/"+encodeURIComponent(bucket)+"/"+encodeURIComponent(item.object_path),location.origin).href;
 try{
  if(persist&&"caches" in window){
   const cache=await caches.open(albumThumbCacheName);
   const cached=await cache.match(cacheKey);
   if(cached){
    const cachedUrl=URL.createObjectURL(await cached.blob());
    albumThumbMemory.set(key,cachedUrl);
    return cachedUrl;
   }
  }
 }catch(_){}
 const signed=await client.storage.from(bucket).createSignedUrl(item.object_path,3600,{transform:{width:180,height:180,resize:"cover",quality:55}});
 if(signed.error||!signed.data?.signedUrl)throw signed.error||new Error("Не удалось создать миниатюру");
 const url=signed.data.signedUrl;
 // Показываем подписанный URL сразу: браузер сам загружает изображение одним запросом.
 // Не делаем второй fetch/blob-запрос перед отображением.
 albumThumbMemory.set(key,{url,expiresAt:Date.now()+50*60*1000});
 return url;
}
function queueAlbumThumb(img,item,bucket,persist){
 const load=()=>{
  albumThumbQueue.push(async()=>{
   if(!img.isConnected)return;
   try{const src=await getAlbumThumbUrl(item,bucket,persist);if(img.isConnected)img.src=src;}
   catch(_){if(img.isConnected)img.src=item.url;}
  });
  runAlbumThumbQueue();
 };
 if("IntersectionObserver" in window){
  if(!window.albumThumbObserver)window.albumThumbObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){window.albumThumbObserver.unobserve(entry.target);entry.target._loadAlbumThumb?.();}}),{rootMargin:"180px"});
  if(!profileObservers.includes(window.albumThumbObserver))profileObservers.push(window.albumThumbObserver);
  img._loadAlbumThumb=load;window.albumThumbObserver.observe(img);
 }else load();
}

async function loadPhotoAlbum(){
 const grid=$("album-grid");grid.replaceChildren();
 const loading=document.createElement("div");loading.className="album-empty";loading.textContent="Загружаем фотографии…";grid.append(loading);
 try{
  // Обычный альбом изолирован: секретные фото здесь никогда не запрашиваются.
  const result=await client.from("photo_album_photos").select("id,object_path,file_name,mime_type,created_at").eq("owner_id",user.id).order("created_at",{ascending:false});
  if(result.error)throw result.error;
  const rows=result.data||[];
  if(!rows.length){albumViewerItems=[];grid.replaceChildren();const empty=document.createElement("div");empty.className="album-empty";empty.textContent="Здесь пока нет фотографий. Добавь первую!";grid.append(empty);return;}
  // Один пакетный запрос вместо последовательного запроса URL для каждого файла.
  const signed=await client.storage.from("photo-albums").createSignedUrls(rows.map(item=>item.object_path),3600);
  if(signed.error)throw signed.error;
  const byPath=new Map((signed.data||[]).filter(x=>x.signedUrl&&!x.error).map(x=>[x.path,x.signedUrl]));
  albumViewerItems=rows.filter(item=>byPath.has(item.object_path)).map(item=>({...item,url:byPath.get(item.object_path),thumbUrl:byPath.get(item.object_path)}));
  grid.replaceChildren();
  if(!albumViewerItems.length){const empty=document.createElement("div");empty.className="album-empty";empty.textContent="Не удалось получить ссылки на фотографии. Попробуй обновить альбом.";grid.append(empty);return;}
  albumViewerItems.forEach((item,index)=>{
   const tile=document.createElement("button");tile.type="button";tile.className="album-item";tile.setAttribute("aria-label","Открыть фотографию: "+(item.file_name||"фотография"));tile.style.padding="0";tile.style.width="100%";tile.style.cursor="zoom-in";
   const img=document.createElement("img");img.alt=item.file_name||"Фотография";img.loading="lazy";img.decoding="async";
   tile.append(img);queueAlbumThumb(img,item,"photo-albums",true);
   tile.addEventListener("click",()=>{$("album-viewer").hidden=false;showAlbumViewerPhoto(index);});
   grid.append(tile);
  });
 }catch(e){albumViewerItems=[];grid.replaceChildren();const error=document.createElement("div");error.className="album-empty";error.textContent="Не удалось загрузить фотоальбом: "+e.message;grid.append(error);}
}
$("album-close").addEventListener("click",()=>$("album-backdrop").hidden=true);
$("album-backdrop").addEventListener("click",e=>{if(e.target===$("album-backdrop"))$("album-backdrop").hidden=true;});
$("album-upload-button").addEventListener("click",async()=>{
 const files=Array.from($("album-file").files||[]);
 if(!files.length){$("album-status").textContent="Сначала выбери одну или несколько фотографий.";return;}
 const invalid=files.find(file=>!["image/jpeg","image/png","image/webp"].includes(file.type));
 if(invalid){$("album-status").textContent="Файл «"+invalid.name+"» имеет неподдерживаемый формат. Подойдут JPG, PNG и WebP.";return;}
 const tooLarge=files.find(file=>file.size>50*1024*1024);
 if(tooLarge){$("album-status").textContent="Файл «"+tooLarge.name+"» больше 50 МБ.";return;}
 const bucket="photo-albums";
 const table="photo_album_photos";
 const button=$("album-upload-button");button.disabled=true;
 let uploadedCount=0;const failures=[];
 try{
  for(let index=0;index<files.length;index++){
   const file=files[index];
   $("album-status").textContent="Загружаем "+(index+1)+" из "+files.length+": "+file.name;
   const ext=file.type==="image/jpeg"?"jpg":file.type.split("/")[1];
   const path=user.id+"/"+Date.now()+"-"+crypto.randomUUID()+"."+ext;
   try{
    const uploaded=await client.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type});
    if(uploaded.error)throw uploaded.error;
    const saved=await client.from(table).insert({owner_id:user.id,object_path:path,file_name:file.name,mime_type:file.type});
    if(saved.error){await client.storage.from(bucket).remove([path]);throw saved.error;}
    uploadedCount++;
   }catch(error){failures.push(file.name+": "+error.message);}
  }
  $("album-file").value="";
  $("album-status").textContent="Добавлено фотографий: "+uploadedCount+" из "+files.length+(failures.length?". Не удалось загрузить: "+failures.length+".":"." );
  if(failures.length)$("album-status").title=failures.join("\n");
  await loadPhotoAlbum();
  if(uploadedCount===files.length)$("album-upload-panel").hidden=true;
 }catch(error){$("album-status").textContent="Ошибка загрузки: "+error.message;}
 finally{button.disabled=false;}
});
let activeMessageFriend=null;
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
 else if(action==="photos"){openPhotoAlbum();}
  else if(action==="video"){openVideoAlbum();}
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
  await loadLibrary();if(signal.aborted)return;client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage,storageKey:"sb-qhpobdktlbhdqsnajypr-auth-token"}});
  const stored=await client.auth.getSession();if(signal.aborted)return;if(stored.error)throw stored.error;if(!stored.data?.session){navigate("portal.html?reauth=1");return;}const auth=await client.auth.getUser();if(signal.aborted)return;if(auth.error)throw auth.error;user=auth.data.user;
  if(!user){navigate("portal.html");return;}
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
 const $id=id=>root.querySelector("#"+id);
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
  await openPhotoAlbum();
 });
 root.querySelector("#"+"author-videos-banner").addEventListener("click",(event)=>{
  if(!event.target.closest(".author-banner-tap"))return;
  closeAuthorHub();
  openVideoAlbum();
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
    try { await client?.auth?.stopAutoRefresh?.(); } catch (_) {}
    const ownsRoot = !!root.querySelector(".fs-route-profile");
    if (ownsRoot) {
      document.body.style.cssText = originalBodyStyle || "";
      document.body.className = originalBodyClass;
      if (originalTheme === undefined) delete document.body.dataset.theme;
      else document.body.dataset.theme = originalTheme;
      root.replaceChildren();
    }
    style.remove();
  };

  return cleanup;
}
