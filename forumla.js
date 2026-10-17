// Forumla app helpers – injected at document start on every forumla.de page.
(function () {
  if (window.__fa) return;
  window.__fa = true;

  function fixViewport() {
    var m = document.querySelector('meta[name=viewport]');
    if (!m) {
      m = document.createElement('meta');
      m.name = 'viewport';
      (document.head || document.documentElement).appendChild(m);
    }
    var want = 'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover';
    if (m.content !== want) m.content = want;
  }

  function cleanup(root) {
    root = root || document;
    // empty wrappers around hidden ad slots
    root.querySelectorAll('[id^="FORUMLA_"], ins.adsbygoogle').forEach(function (ad) {
      var p = ad.parentElement;
      if (p && p !== document.body && p.children.length === 1) p.style.display = 'none';
      else if (p && p.parentElement && p.style.float === 'left') p.style.display = 'none';
    });
    // lazy-load and tap-to-zoom post images
    root.querySelectorAll('blockquote.postcontent img:not([data-fa])').forEach(function (img) {
      img.setAttribute('data-fa', '1');
      img.loading = 'lazy';
      if (/smilies|statusicon|inlineimg/.test(img.src + ' ' + img.className)) return;
      if (img.closest('a')) return;
      img.addEventListener('click', function () { openViewer(img.currentSrc || img.src); });
    });
  }

  // ---------- XenForo-style posts ----------
  var MONTHS = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];

  // "10.10.2020 22:30" -> "10. Okt. 2020"; "Heute, 14:52" -> "Heute um 14:52"
  function niceDate(dateEl) {
    var time = dateEl.querySelector('.time');
    var t = time ? time.textContent.trim() : '';
    var raw = dateEl.textContent.replace(t, '').replace(/ /g, ' ').trim().replace(/,$/, '');
    var m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(raw);
    var nice = m ? parseInt(m[1], 10) + '. ' + MONTHS[parseInt(m[2], 10) - 1] + ' ' + m[3] : raw + (t ? ' um ' + t : '');
    dateEl.title = raw + (t ? ' ' + t : '');
    var link = dateEl.querySelector('a');
    if (time) time.remove();
    if (link) link.textContent = nice;
    else dateEl.textContent = nice;
  }

  // post number ("#12") from the page number; posts per page is learned from full pages
  function postNumberer() {
    var nav = document.querySelector('.ui-page-active .pagenav[data-pagenumber]') || document.querySelector('.pagenav[data-pagenumber]');
    var page = nav ? parseInt(nav.getAttribute('data-pagenumber'), 10) || 1 : 1;
    var total = nav ? parseInt(nav.getAttribute('data-totalpages'), 10) || 1 : 1;
    var count = document.querySelectorAll('ol#posts > li.postbit[id^="post_"]').length;
    var per = null;
    try {
      if (total > 1 && page < total && count) localStorage.setItem('fa-perpage', String(count));
      per = parseInt(localStorage.getItem('fa-perpage'), 10) || null;
    } catch (e) {}
    if (page > 1 && !per) return function () { return null; };
    return function (i) { return (page - 1) * (per || 0) + i + 1; };
  }

  function attribution(root) {
    var number = null;
    var all = Array.prototype.slice.call(document.querySelectorAll('ol#posts > li.postbit[id^="post_"]'));
    root.querySelectorAll('ol#posts > li.postbit[id]:not([data-fa])').forEach(function (li) {
      li.setAttribute('data-fa', '1');
      var date = li.querySelector('.posthead .postdate');
      var body = li.querySelector('.postbody');
      if (!date || !body) return;
      var bar = document.createElement('div');
      bar.className = 'fa-attribution';
      var dateEl = date.querySelector('.date') || date;
      niceDate(dateEl);
      bar.appendChild(date);
      var right = document.createElement('span');
      right.className = 'fa-attribution-right';
      // moderators: the inline-moderation checkbox goes to the right, like XenForo
      var mod = li.querySelector('.posthead .inlinemodcheckboxradio');
      var id = /^post_(\d+)$/.exec(li.id);
      if (id) {
        number = number || postNumberer();
        var n = number(all.indexOf(li));
        if (n) {
          var a = document.createElement('a');
          a.className = 'fa-postnum';
          a.href = 'showthread.php?p=' + id[1] + '#post' + id[1];
          a.rel = 'external';
          a.textContent = '#' + n;
          right.appendChild(a);
        }
      }
      if (mod) right.appendChild(mod);
      bar.appendChild(right);
      body.insertBefore(bar, body.firstChild);
    });
  }

  // the 136x40 logo image is replaced by a sharp text wordmark in the same style (see forumla.css)
  function logo() {
    document.querySelectorAll('#header-left a.logo-image:not([data-fa])').forEach(function (a) {
      a.setAttribute('data-fa', '1');
      a.setAttribute('aria-label', 'Forumla.de');
      a.innerHTML = '<span class="fa-logo"><span class="fa-logo-word">FORUMLA<span class="fa-logo-tld">.DE</span></span>' +
        '<span class="fa-logo-tag">KONSOLEN, COMPUTER &amp; ENTERTAINMENT TALK</span></span>';
      var word = a.querySelector('.fa-logo-word');
      var tag = a.querySelector('.fa-logo-tag');
      var fit = function () {
        // scale the tagline to the wordmark's width (both depend on the font being loaded)
        if (tag.scrollWidth && word.offsetWidth) tag.style.setProperty('--fa-tag-scale', String(word.offsetWidth / tag.scrollWidth));
      };
      fit();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    });
  }

  // stable hue per user name (letter avatars, private message history)
  function nameHue(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return h;
  }

  function letterAvatar(name) {
    var h = nameHue(name);
    var span = document.createElement('span');
    span.className = 'fa-letter';
    span.textContent = (name.charAt(0) || '?').toUpperCase();
    span.style.background = 'hsl(' + h + ', 45%, 42%)';
    span.style.color = 'hsl(' + h + ', 70%, 88%)';
    return span;
  }

  // Private messages: replies quote the whole previous message, so the history ends up as quotes
  // nested in quotes. Unpack that chain into separate boxes ("Bisheriger Verlauf"), newest first.
  // Only a quote at the very start of a message counts as history; quotes in the middle stay.
  function leadingQuote(holder) {
    for (var n = holder.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 && !n.nodeValue.trim()) continue;
      if (n.nodeName === 'BR') continue;
      return n.nodeType === 1 && n.classList.contains('bbcode_container') && n.querySelector(':scope > .bbcode_quote') ? n : null;
    }
    return null;
  }

  function trimBreaks(el) {
    var isBlank = function (n) { return n && (n.nodeName === 'BR' || (n.nodeType === 3 && !n.nodeValue.trim())); };
    while (isBlank(el.firstChild)) el.removeChild(el.firstChild);
    while (isBlank(el.lastChild)) el.removeChild(el.lastChild);
  }

  function pmHistory() {
    if (!/private\.php/.test(location.href)) return;
    document.querySelectorAll('blockquote.postcontent:not([data-fa-pm])').forEach(function (bq) {
      bq.setAttribute('data-fa-pm', '1');
      var chain = [];
      var holder = bq;
      for (var q = leadingQuote(holder); q; q = leadingQuote(holder)) {
        var qc = q.querySelector(':scope > .bbcode_quote > .quote_container');
        if (!qc) break;
        var who = qc.querySelector(':scope > .bbcode_postedby strong');
        var body = qc.querySelector(':scope > .message') || qc;
        q.remove();
        chain.push({ name: who ? who.textContent.trim() : '', body: body });
        holder = body;
      }
      if (!chain.length) return;
      trimBreaks(bq);
      var hist = document.createElement('div');
      hist.className = 'fa-pm-history';
      var head = document.createElement('div');
      head.className = 'fa-pm-history-head';
      head.textContent = 'Bisheriger Verlauf (' + chain.length + ')';
      hist.appendChild(head);
      chain.forEach(function (c) {
        var card = document.createElement('div');
        card.className = 'fa-pm-msg';
        card.style.setProperty('--fa-author', 'hsl(' + nameHue(c.name) + ', 45%, 50%)');
        var h = document.createElement('div');
        h.className = 'fa-pm-msg-head';
        h.appendChild(letterAvatar(c.name || '?'));
        var nm = document.createElement('span');
        nm.textContent = c.name || 'Unbekannt';
        h.appendChild(nm);
        var b = document.createElement('div');
        b.className = 'fa-pm-msg-body';
        while (c.body.firstChild) b.appendChild(c.body.firstChild);
        trimBreaks(b);
        card.appendChild(h);
        card.appendChild(b);
        hist.appendChild(card);
      });
      bq.parentNode.insertBefore(hist, bq.nextSibling);
    });
  }

  // users without an avatar get a colored letter, like XenForo
  function letterAvatars(root) {
    root.querySelectorAll('.posthead a.postuseravatarlink:not([data-fa-la])').forEach(function (a) {
      a.setAttribute('data-fa-la', '1');
      var img = a.querySelector('img');
      if (img && !/unknown\.gif/.test(img.getAttribute('src') || '')) return;
      var nameEl = a.closest('.posthead').querySelector('.xsaid a, .xsaid');
      var name = ((nameEl && nameEl.textContent) || (img && img.alt.replace(/^Avatar von /, '')) || '?').replace(/:$/, '').trim();
      var holder = a.querySelector('p') || a;
      holder.innerHTML = '';
      holder.appendChild(letterAvatar(name));
    });
  }

  // XenForo-style quick reply under the last post. vBulletin's mobile thread page ships a complete
  // quick-reply form (#quick_reply) that is hidden until a per-post reply button is tapped:
  // show it permanently there. Without that form (logged out, closed thread) a placeholder box
  // links to the full reply page instead.
  function quickReplyBox() {
    var posts = document.querySelector('.ui-page-active ol#posts') || document.querySelector('ol#posts');
    if (!posts) return;
    var qr = document.querySelector('.ui-page-active #qr_defaultcontainer') || document.querySelector('#qr_defaultcontainer');
    if (qr && qr.querySelector('form#quick_reply textarea[name="message"]')) {
      if (!qr.hasAttribute('data-fa')) {
        qr.setAttribute('data-fa', '1');
        qr.classList.add('fa-qr-live');
        posts.parentNode.insertBefore(qr, posts.nextSibling);
      }
      return;
    }
    if (posts.nextElementSibling && posts.nextElementSibling.classList.contains('fa-qr')) return;
    var reply = document.querySelector('.ui-page-active .modbuttongroup a[href*="newreply.php"]') ||
      document.querySelector('.modbuttongroup a[href*="newreply.php"]');
    if (!reply) return;
    var box = document.createElement('a');
    box.className = 'fa-qr';
    box.href = reply.getAttribute('href');
    box.rel = 'external';
    box.innerHTML = '<span class="fa-qr-editor"><span class="fa-qr-toolbar"><b>B</b><i>I</i><u>U</u></span>' +
      '<span class="fa-qr-placeholder">Schreibe eine Antwort …</span></span><span class="fa-qr-btn">Antworten</span>';
    posts.parentNode.insertBefore(box, posts.nextSibling);
  }

  // The mobile "Direkt antworten" form under a private message ships without a text field
  // (template bug). Add the "message" field the desktop quick reply uses, plus a link to the
  // full reply form (with quote, preview and options).
  function pmQuickReply(root) {
    root.querySelectorAll('form[action*="do=insertpm"]:not([data-fa])').forEach(function (form) {
      form.setAttribute('data-fa', '1');
      if (form.querySelector('textarea[name="message"]')) return;
      var ta = document.createElement('textarea');
      ta.name = 'message';
      ta.rows = 8;
      ta.required = true;
      var submit = form.querySelector('[type=submit]');
      var anchor = submit ? (submit.closest('.ui-btn') || submit) : null;
      form.insertBefore(ta, anchor);
      var pmid = /pmid=(\d+)/.exec(form.getAttribute('action'));
      if (pmid) {
        var full = document.createElement('a');
        full.className = 'fa-fullreply';
        full.rel = 'external';
        full.href = 'private.php?do=newpm&pmid=' + pmid[1];
        full.textContent = 'Mit Zitat / erweitert antworten';
        form.appendChild(full);
      }
    });
  }

  // In the mobile templates (e.g. Pinnwand / visitor messages) the avatar links to the profile
  // being viewed instead of the author. Use the author's name link, which is correct.
  function avatarLinks(root) {
    root.querySelectorAll('li.postbit .posthead:not([data-fa-av])').forEach(function (head) {
      head.setAttribute('data-fa-av', '1');
      var avatar = head.querySelector('a.postuseravatarlink');
      var name = head.querySelector('.xsaid a[href]');
      if (!avatar || !name) return;
      if (/\/member\.php$/.test(name.getAttribute('href'))) {
        avatar.removeAttribute('href'); // author without a profile (deleted account)
      } else {
        avatar.setAttribute('href', name.getAttribute('href'));
      }
    });
  }

  // YouTube embeds become a small preview card (thumbnail, title, channel).
  // Tapping it opens the video in the YouTube app (external link) instead of a full player in the page.
  var YT_ID = /(?:youtube(?:-nocookie)?\.com\/embed\/|youtube\.com\/v\/)([\w-]{11})/;
  var ytTitles = {};

  function ytCards(root) {
    root.querySelectorAll('iframe[src*="youtube"], embed[src*="youtube"], object[data*="youtube"]').forEach(function (frame) {
      var m = YT_ID.exec(frame.getAttribute('src') || frame.getAttribute('data') || '');
      if (!m) return;
      var id = m[1];
      var card = document.createElement('a');
      card.className = 'fa-yt';
      card.href = 'https://www.youtube.com/watch?v=' + id;
      card.innerHTML =
        '<span class="fa-yt-thumb"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/' + id + '/mqdefault.jpg">' +
        '<span class="fa-yt-play"></span></span>' +
        '<span class="fa-yt-meta"><span class="fa-yt-title">YouTube-Video</span><span class="fa-yt-author">YouTube</span></span>';
      // an <object> wraps an <embed>: replace the outermost one
      var target = frame.closest('object') || frame;
      target.parentNode.replaceChild(card, target);
      ytMeta(id, card);
    });
  }

  function ytMeta(id, card) {
    var fill = function (info) {
      if (!info) return;
      card.querySelector('.fa-yt-title').textContent = info.title;
      card.querySelector('.fa-yt-author').textContent = info.author;
    };
    if (ytTitles[id]) {
      ytTitles[id].then(fill);
      return;
    }
    ytTitles[id] = fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j ? { title: j.title, author: j.author_name } : null; })
      .catch(function () { return null; });
    ytTitles[id].then(fill);
  }

  // BBCode toolbar for the reply / new thread textarea (XenForo editor look)
  var ICONS = {
    b: '<b>B</b>',
    i: '<i style="font-family:Georgia,serif">I</i>',
    u: '<u>U</u>',
    s: '<s>S</s>',
    url: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
    img: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
    quote: '<svg viewBox="0 0 24 24"><path d="M3 21c3 0 7-1 7-8V5H3v7h4c0 3-1 5-4 5zm11 0c3 0 7-1 7-8V5h-7v7h4c0 3-1 5-4 5z"/></svg>',
    spoiler: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    code: '<svg viewBox="0 0 24 24"><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>'
  };
  var TOOLS = [
    ['b', 'Fett', 'B'], ['i', 'Kursiv', 'I'], ['u', 'Unterstrichen', 'U'], ['s', 'Durchgestrichen', 'S'], '|',
    ['url', 'Link einfügen', 'URL'], ['img', 'Bild einfügen', 'IMG'], '|',
    ['quote', 'Zitat', 'QUOTE'], ['spoiler', 'Spoiler', 'SPOILER'], ['code', 'Code', 'CODE'], ['list', 'Liste', 'LIST']
  ];

  function wrap(ta, tag) {
    var start = ta.selectionStart, end = ta.selectionEnd, v = ta.value, sel = v.slice(start, end);
    var open = '[' + tag + ']', close = '[/' + tag + ']', text = sel;
    if (tag === 'URL') {
      var url = prompt('Link-Adresse:', /^https?:\/\//.test(sel) ? sel : 'https://');
      if (!url) return;
      open = '[URL="' + url + '"]';
      if (!sel) text = url;
    } else if (tag === 'IMG' && !sel) {
      var src = prompt('Bild-Adresse:', 'https://');
      if (!src) return;
      text = src;
    } else if (tag === 'LIST') {
      text = (sel || '').split('\n').map(function (l) { return '[*]' + l; }).join('\n');
      open = '[LIST]\n'; close = '\n[/LIST]';
    }
    ta.value = v.slice(0, start) + open + text + close + v.slice(end);
    var caret = sel || tag === 'URL' || tag === 'IMG' ? start + open.length + text.length + close.length : start + open.length + text.length;
    ta.focus();
    ta.setSelectionRange(caret, caret);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function editors(root) {
    root.querySelectorAll('textarea[name="message"]:not([data-fa])').forEach(function (ta) {
      ta.setAttribute('data-fa', '1');
      if (!ta.placeholder) ta.placeholder = 'Schreibe eine Antwort …';
      var box = document.createElement('div');
      box.className = 'fa-editor';
      var bar = document.createElement('div');
      bar.className = 'fa-toolbar';
      TOOLS.forEach(function (t) {
        if (t === '|') {
          var sep = document.createElement('span');
          sep.className = 'fa-sep';
          bar.appendChild(sep);
          return;
        }
        var b = document.createElement('button');
        b.type = 'button';
        b.title = t[1];
        b.setAttribute('aria-label', t[1]);
        b.innerHTML = ICONS[t[0]];
        // keep the keyboard open and the selection intact
        b.addEventListener('mousedown', function (e) { e.preventDefault(); });
        b.addEventListener('click', function () { wrap(ta, t[2]); });
        bar.appendChild(b);
      });
      ta.parentNode.insertBefore(box, ta);
      box.appendChild(bar);
      box.appendChild(ta);
      autoSize(ta, box);
    });
  }

  // Grow the text field with its content (CSS gives the screen-relative start height), capped at
  // 60% of the visible height, which shrinks while the keyboard is open. When the keyboard opens,
  // keep the whole editor (toolbar + text) in view.
  function autoSize(ta, box) {
    ta.removeAttribute('rows');
    ta.removeAttribute('cols');
    var fit = function () {
      var max = Math.max(80, Math.round(window.innerHeight * 0.6));
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight + 2, max) + 'px';
      ta.style.maxHeight = max + 'px';
    };
    var reveal = function () {
      if (document.activeElement === ta) box.scrollIntoView({ block: 'nearest' });
    };
    ta.addEventListener('input', fit);
    ta.addEventListener('focus', function () { setTimeout(function () { fit(); reveal(); }, 350); });
    window.addEventListener('resize', function () { fit(); reveal(); });
    fit();
  }

  // ---------- XenForo-style off-canvas menu (replaces the vBulletin grid menu page) ----------
  var MENU_URL = '/mobile.php?do=gridmenu';
  var SVG = function (d) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  };
  var MENU_ICONS = [
    [/blog/i, SVG('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>')],
    [/alb/i, SVG('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>')],
    [/buddy|freund|friend/i, SVG('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>')],
    // notifications before messages: "Benachrichtigungen" contains "nachricht"
    [/usercp|benachricht|notif/i, SVG('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>')],
    [/private|nachricht/i, SVG('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>')],
    [/getnew|neu|activity/i, SVG('<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>')],
    [/member|profil|\/u\d/i, SVG('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>')],
    [/.*/, SVG('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>')]
  ];
  var FALLBACK_MENU = [['Foren', '/'], ['Was ist neu?', '/search.php?do=getnew&contenttype=vBForum_Post']];
  var menuEl = null;

  function menuIcon(label, href) {
    for (var i = 0; i < MENU_ICONS.length; i++) {
      if (MENU_ICONS[i][0].test(label + ' ' + href)) return MENU_ICONS[i][1];
    }
  }

  function isGuest() {
    return !!document.querySelector('#header a.headericon[href*="do=login"]');
  }

  function buildMenu() {
    menuEl = document.createElement('div');
    menuEl.id = 'fa-menu';
    menuEl.innerHTML =
      '<div class="fa-menu-backdrop"></div>' +
      '<nav class="fa-menu-panel" aria-label="Menü">' +
      '  <div class="fa-menu-header"><span>Menü</span><button type="button" class="fa-menu-close" aria-label="Schließen">' +
      SVG('<path d="M18 6 6 18M6 6l12 12"/>') + '</button></div>' +
      '  <div class="fa-menu-account"></div>' +
      '  <div class="fa-menu-search"></div>' +
      '  <ul class="fa-menu-list"></ul>' +
      '</nav>';
    document.body.appendChild(menuEl);
    menuEl.querySelector('.fa-menu-backdrop').addEventListener('click', closeMenu);
    menuEl.querySelector('.fa-menu-close').addEventListener('click', closeMenu);
  }

  function renderItems(items) {
    var list = menuEl.querySelector('.fa-menu-list');
    list.innerHTML = '';
    items.forEach(function (it) {
      var label = it[0], href = it[1];
      var m = /\((\d+)\)\s*$/.exec(label);
      var count = m ? parseInt(m[1], 10) : 0;
      label = label.replace(/\s*\(\d+\)\s*$/, '');
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = href;
      a.setAttribute('rel', 'external'); // full page load, not a jQuery Mobile AJAX transition
      a.className = 'fa-menu-link';
      a.innerHTML = '<span class="fa-menu-icon">' + menuIcon(label, href) + '</span><span class="fa-menu-label"></span>' +
        (count > 0 ? '<span class="fa-menu-badge">' + count + '</span>' : '');
      a.querySelector('.fa-menu-label').textContent = label;
      if (location.href === a.href) a.classList.add('is-selected');
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  function renderAccount() {
    var box = menuEl.querySelector('.fa-menu-account');
    if (isGuest()) {
      box.innerHTML = '<a class="fa-menu-btn fa-menu-btn--primary" rel="external" href="/mobile.php?do=login">Anmelden</a>' +
        '<a class="fa-menu-btn" rel="external" href="/register.php">Registrieren</a>';
      box.style.display = '';
    } else {
      box.innerHTML = '';
      box.style.display = 'none';
    }
  }

  function loadMenu() {
    fetch(MENU_URL, { credentials: 'same-origin' })
      .then(function (r) { return r.text().then(function (t) { return [r.url, t]; }); })
      .then(function (res) {
        var doc = new DOMParser().parseFromString(res[1], 'text/html');
        var items = [];
        doc.querySelectorAll('.gridmenu .iconcontainer').forEach(function (c) {
          var link = c.querySelector('a:not(.gridmenuicon)') || c.querySelector('a');
          if (!link) return;
          items.push([link.textContent.trim(), new URL(link.getAttribute('href'), res[0]).href]);
        });
        if (!items.length) throw new Error('no grid menu');
        renderItems(items);
        var form = doc.querySelector('form#navbar_search');
        if (form) {
          var search = menuEl.querySelector('.fa-menu-search');
          var f = document.createElement('form');
          f.method = 'post';
          f.action = new URL(form.getAttribute('action'), res[0]).href;
          f.setAttribute('data-ajax', 'false');
          form.querySelectorAll('input[type=hidden]').forEach(function (h) { f.appendChild(h.cloneNode()); });
          var input = document.createElement('input');
          input.type = 'search';
          input.name = 'query';
          input.placeholder = 'Suchen …';
          input.setAttribute('enterkeyhint', 'search');
          f.appendChild(input);
          search.innerHTML = '';
          search.appendChild(f);
        }
      })
      .catch(function () {
        if (!menuEl.querySelector('.fa-menu-list li')) renderItems(FALLBACK_MENU.map(function (i) { return [i[0], new URL(i[1], location.origin).href]; }));
      });
  }

  function openMenu() {
    if (!menuEl) buildMenu();
    renderAccount();
    loadMenu();
    // force a reflow so the slide-in transition runs
    void menuEl.offsetWidth;
    document.documentElement.classList.add('fa-menu-open');
  }

  function closeMenu() {
    if (!document.documentElement.classList.contains('fa-menu-open')) return false;
    document.documentElement.classList.remove('fa-menu-open');
    return true;
  }
  // called by the app's back button handler
  window.__faCloseMenu = closeMenu;

  // capture phase: runs before jQuery Mobile's own link handling
  window.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="do=gridmenu"]');
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    openMenu();
  }, true);

  // ---------- "Aktuelle Informationen" at the bottom of the front page ----------
  // Only forumla's desktop style has this panel; the app loads it natively (FaApp.loadInfoPanel)
  // and it is rebuilt here as XenForo-style blocks. The symbol legend (desktop icons) is left out.
  var INFO_KEY = 'fa-info';
  var INFO_MAX_AGE = 2 * 60 * 1000;

  function infoBlocks(html) {
    var doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
    var out = document.createElement('div');
    out.className = 'fa-info';
    var lastBody = null;
    doc.querySelectorAll('.wgo_subblock').forEach(function (sub) {
      var h = sub.querySelector('h3, .blocksubhead');
      var title = h ? h.textContent.replace(/\s+/g, ' ').trim() : '';
      if (h) h.remove();
      sub.querySelectorAll('script, .collapse, img[src*="images/misc/"], img[src*="images/buttons/"]').forEach(function (n) { n.remove(); });
      // vBulletin's own member list stays empty; forumla's plugin renders it in its own part
      sub.querySelectorAll('ol.commalist:empty, ol.commalist:not(:has(li))').forEach(function (n) { n.remove(); });
      // links and images relative to the forum root
      sub.querySelectorAll('a[href]').forEach(function (a) {
        a.setAttribute('href', new URL(a.getAttribute('href'), 'https://www.forumla.de/').href);
        a.setAttribute('rel', 'external');
      });
      sub.querySelectorAll('img[src]').forEach(function (i) {
        i.setAttribute('src', new URL(i.getAttribute('src'), 'https://www.forumla.de/').href);
        i.removeAttribute('width');
        i.removeAttribute('height');
      });
      if (/legende/i.test(title)) return;
      // a part without a heading (team / members online list) belongs to the block above it
      if (!title) {
        if (lastBody) while (sub.firstChild) lastBody.appendChild(sub.firstChild);
        return;
      }
      var block = document.createElement('section');
      block.className = 'fa-info-block';
      var head = document.createElement('div');
      head.className = 'fa-info-title';
      head.textContent = title;
      var body = document.createElement('div');
      body.className = 'fa-info-body';
      while (sub.firstChild) body.appendChild(sub.firstChild);
      block.appendChild(head);
      block.appendChild(body);
      out.appendChild(block);
      lastBody = body;
    });
    return out.children.length ? out : null;
  }

  function showInfo(html) {
    var page = document.getElementById('page-home');
    if (!page || !html) return;
    var blocks = infoBlocks(html);
    if (!blocks) return;
    blocks.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('error', function () { img.remove(); }); // missing avatar: no empty gap
    });
    var old = page.querySelector('.fa-info');
    if (old) old.replaceWith(blocks);
    else {
      var anchor = page.querySelector('#footer, [data-role=footer]');
      if (anchor) anchor.parentNode.insertBefore(blocks, anchor);
      else page.appendChild(blocks);
    }
  }

  // called by the app with the panel HTML (or null)
  window.__faInfoPanel = function (html) {
    if (!html) return;
    try { sessionStorage.setItem(INFO_KEY, JSON.stringify({ t: Date.now(), html: html })); } catch (e) {}
    showInfo(html);
  };

  function infoPanel() {
    var page = document.getElementById('page-home');
    if (!page || page.hasAttribute('data-fa-info') || !window.FaApp || !FaApp.loadInfoPanel) return;
    page.setAttribute('data-fa-info', '1');
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(INFO_KEY) || 'null'); } catch (e) {}
    if (cached && cached.html) showInfo(cached.html);
    if (!cached || Date.now() - cached.t > INFO_MAX_AGE) FaApp.loadInfoPanel();
  }


  function openViewer(src) {
    var v = document.createElement('div');
    v.id = 'fa-viewer';
    var i = document.createElement('img');
    i.src = src;
    v.appendChild(i);
    v.addEventListener('click', function () { v.remove(); });
    document.body.appendChild(v);
  }

  function run() {
    fixViewport();
    if (!document.body) return;
    cleanup(document);
    logo();
    avatarLinks(document);
    letterAvatars(document);
    attribution(document);
    pmHistory();
    quickReplyBox();
    ytCards(document);
    pmQuickReply(document);
    editors(document);
    infoPanel();
  }

  document.addEventListener('DOMContentLoaded', function () {
    run();
    // jQuery Mobile loads pages via AJAX: re-apply on DOM changes
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; run(); });
    }).observe(document.body, { childList: true, subtree: true });
  });
  if (document.readyState !== 'loading') run();
})();
