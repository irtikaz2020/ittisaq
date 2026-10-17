/* اتساق — الدوال المشتركة بين الموقع وأداة التضمين */
(function () {
  'use strict';
  var NS = 'ittisaq:v1:';

  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem(NS + k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem(NS + k, JSON.stringify(v)); return true; } catch (e) { return false; }
    },
    remove: function (k) { try { localStorage.removeItem(NS + k); } catch (e) {} }
  };

  var KINDS = {
    series: 'سلاسل',
    ongoing: 'حلقات مستمرة',
    podcast: 'بودكاست'
  };
  var KIND_ONE = { series: 'سلسلة', ongoing: 'حلقات مستمرة', podcast: 'بودكاست' };
  var KIND_ORDER = ['series', 'ongoing', 'podcast'];

  function validYt(id) { return id && /^[\w-]{11}$/.test(id) ? id : null; }

  function ytId(input) {
    if (!input) return null;
    input = String(input).trim();
    try {
      var u = new URL(input);
      var h = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
      if (h === 'youtu.be') return validYt(u.pathname.slice(1).split('/')[0]);
      if (h === 'youtube.com' || h === 'music.youtube.com' || h === 'youtube-nocookie.com') {
        if (u.pathname === '/watch') return validYt(u.searchParams.get('v'));
        var m = u.pathname.match(/^\/(shorts|embed|live|v)\/([^/?]+)/);
        if (m) return validYt(m[2]);
      }
      return null;
    } catch (e) {
      return validYt(input);
    }
  }

  function isHttpUrl(s) {
    try { var u = new URL(String(s).trim()); return u.protocol === 'https:' || u.protocol === 'http:'; } catch (e) { return false; }
  }

  /* يحوّل أي رابط يلصقه المحرر إلى مصدر معروف النوع */
  function classify(input) {
    if (!input) return null;
    input = String(input).trim();
    var id = ytId(input);
    if (id) return { type: 'youtube', id: id };
    if (!isHttpUrl(input)) return null;
    var u = new URL(input);
    var host = u.hostname.replace(/^www\./, '');
    if (host === 'soundcloud.com' || host === 'on.soundcloud.com') return { type: 'soundcloud', url: input };
    return { type: 'audio', url: input };
  }

  function sourceLabel(s) {
    return s.type === 'youtube' ? 'يوتيوب' : s.type === 'soundcloud' ? 'ساوند كلاود' : 'ملف صوتي';
  }
  function isVideo(s) { return s.type === 'youtube'; }
  function isAudio(s) { return s.type === 'audio' || s.type === 'soundcloud'; }

  function normalize(lib) {
    lib = lib && typeof lib === 'object' ? lib : {};
    lib.version = 1;
    lib.shows = Array.isArray(lib.shows) ? lib.shows : [];
    lib.shows.forEach(function (s) {
      s.episodes = Array.isArray(s.episodes) ? s.episodes : [];
      s.kind = KINDS[s.kind] ? s.kind : 'series';
      s.status = s.status === 'complete' ? 'complete' : 'ongoing';
      s.episodes.forEach(function (e) { e.sources = Array.isArray(e.sources) ? e.sources : []; });
    });
    return lib;
  }

  function fetchJson(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  /* يحمّل المكتبة المنشورة، ويدعم تقسيم حلقات عمل كبير إلى ملف خاص (episodesFile) */
  function loadPublished() {
    return fetchJson('library.json').then(function (lib) {
      lib = normalize(lib);
      return Promise.all(lib.shows.map(function (s) {
        if (!s.episodesFile) return null;
        return fetchJson(s.episodesFile).then(function (eps) {
          s.episodes = Array.isArray(eps) ? eps : (eps.episodes || []);
          s.episodes.forEach(function (e) { e.sources = Array.isArray(e.sources) ? e.sources : []; });
        }).catch(function () {});
      })).then(function () { return lib; });
    });
  }

  function loadDraft() {
    var d = store.get('draft', null);
    return d ? normalize(d) : null;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function el(tag, attrs) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      if (Array.isArray(c)) c.forEach(function (x) { if (x != null) n.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
      else n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return n;
  }

  window.Ittisaq = {
    store: store, KINDS: KINDS, KIND_ONE: KIND_ONE, KIND_ORDER: KIND_ORDER,
    ytId: ytId, classify: classify, isHttpUrl: isHttpUrl,
    sourceLabel: sourceLabel, isVideo: isVideo, isAudio: isAudio,
    normalize: normalize, loadPublished: loadPublished, loadDraft: loadDraft,
    esc: esc, hash: hash, el: el
  };
})();
