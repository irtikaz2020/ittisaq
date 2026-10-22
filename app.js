/* إلصاق v1 — لوحة شخصية: تدوينة وتنوينة. كل شيء محفوظ في متصفحك فقط. */
(function () {
  'use strict';
  var NS = 'ilsaq:v1:';

  /* ---------- تخزين آمن ---------- */
  var mem = {};
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(NS + k); return v == null ? d : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : d; } },
    set: function (k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) { mem[k] = v; } }
  };

  /* ---------- القوائم (قابلة للتعديل بسهولة) ---------- */
  var TYPES = {
    lahza:    { kind: 'tadwina', name: 'لحظة',  shape: 'round', sub: 'إحساس عابر في وقته' },
    molahaza: { kind: 'tadwina', name: 'ملاحظة', shape: 'sq',    sub: 'فكرة أو معلومة تبقى بعده' },
    khotwa:   { kind: 'tanwina', name: 'خطوة',  icon: '👣',     sub: 'فعل واحد تقرر أن تفعله' },
    khotta:   { kind: 'tanwina', name: 'خطة',   icon: '🗺️',    sub: 'عدة خطوات تُنجزها واحدة واحدة' }
  };
  var CATS_T = [
    { id: 'i-info', name: 'معلومة' }, { id: 'i-idea', name: 'فكرة' }, { id: 'i-ask', name: 'سؤال' },
    { id: 'i-object', name: 'اعتراض' }, { id: 'i-quote', name: 'اقتباس' }, { id: 'i-lesson', name: 'عبرة' },
    { id: 'i-memory', name: 'ذكرى' }, { id: 'i-verify', name: 'للتحقق' }, { id: 'i-none', name: 'غير مصنّف' }
  ];
  var CATS_N = [
    { id: 'g-learn', name: 'تعلّم' }, { id: 'g-work', name: 'عمل ومشروع' }, { id: 'g-worship', name: 'عبادة' },
    { id: 'g-health', name: 'صحة وبدن' }, { id: 'g-family', name: 'أسرة وعلاقات' }, { id: 'g-money', name: 'مال وتدبير' },
    { id: 'g-habit', name: 'عادة وسلوك' }, { id: 'g-create', name: 'إبداع' }, { id: 'g-none', name: 'غير مصنّف' }
  ];
  var FEELINGS = [
    { id: 'happy', e: '😊', name: 'سعيد' }, { id: 'inspired', e: '🤩', name: 'مُلهَم' }, { id: 'admire', e: '😍', name: 'معجَب' },
    { id: 'love', e: '❤️', name: 'محبّ' }, { id: 'grateful', e: '🙏🏻', name: 'ممتنّ' }, { id: 'laugh', e: '😄', name: 'ضاحك' },
    { id: 'surprised', e: '😮', name: 'مندهش' }, { id: 'curious', e: '🤔', name: 'فضولي' }, { id: 'interested', e: '🙂', name: 'مهتم' },
    { id: 'content', e: '😌', name: 'راضٍ' }, { id: 'moved', e: '😭', name: 'متأثّر' }, { id: 'sad', e: '😢', name: 'حزين' },
    { id: 'angry', e: '😠', name: 'غاضب' }, { id: 'worried', e: '😟', name: 'قلِق' }, { id: 'upset', e: '😒', name: 'مستاء' },
    { id: 'bored', e: '😑', name: 'ملول' }
  ];
  var TORCHES = [
    { id: 1, e: '❄️', name: 'هادئة', sub: 'مرّت عليّ عادي' },
    { id: 2, e: '🕯️', name: 'دافئة', sub: 'لفتت نظري' },
    { id: 3, e: '🔥', name: 'متوقدة', sub: 'شغلتني' },
    { id: 4, e: '💥', name: 'متوهجة', sub: 'غيّرت فيّ شيئاً' }
  ];
  var STATUSES = [
    { id: 'todo', e: '⬜', name: 'لم تبدأ' }, { id: 'doing', e: '⏳', name: 'جارية' }, { id: 'done', e: '✅', name: 'تمت' }
  ];
  var INFO = {
    tadwina: 'تدوينة: ما خطر لك أو أحسست به وأنت تشاهد أو تسمع. لها نوعان: لحظة وملاحظة.',
    tanwina: 'تنوينة: ما قررته بعد أن سمعت: خطوة تفعلها، أو خطة من عدة خطوات.',
    dawwinha: 'دوِّنها: اكتب ما عندك كما هو، بلا تنسيق. اللحظة ● إحساس عابر في وقته، والملاحظة ■ فكرة أو معلومة تبقى بعده.',
    lawwinha: 'لوِّنها: أعطها قسماً (القسم هو الذي يمنحها لونها)، وشعوراً، ومشعلاً. كلها اختيارية.',
    nawwinha: 'نوِّنها: اكتب ما قررته. الخطوة فعل واحد، والخطة عدة خطوات مرتبة تُنجزها واحدة واحدة.',
    awnin: 'عنوِنها: اختر قسمها (له لونه)، وأعطها اسماً قصيراً واحداً، وأضف وسوماً تساعدك على البحث عنها لاحقاً.',
    mashael: 'المشاعل: شدة الأثر. ❄️ هادئة: مرّت عادي · 🕯️ دافئة: لفتت نظرك · 🔥 متوقدة: شغلتك · 💥 متوهجة: غيّرت فيك شيئاً.',
    feeling: 'الشعور: ما أحسسته. الصورة والاسم معاً، حتى لا يختلط المعنى.',
    status: 'الحالة: أين وصلت في هذه التنوينة: لم تبدأ، جارية، أو تمت.',
    ihala: 'الإحالة: ربط هذه بتدوينة أو تنوينة أخرى كتبتها، مثل خطة خرجت من ملاحظة.',
    wasm: 'الوسم: كلمات قصيرة تساعدك على البحث. (اسم القسم ليس وسماً، فلا تكرره.)',
    time: 'الوقت: موضع الكلام في الفيديو أو الصوت، فيرجعك إليه الزر لاحقاً. يُسجَّل تلقائياً عند الكتابة من اتساق، وتقدر تكتبه بيدك (مثل 12:35).',
    due: 'الموعد: تاريخ تريد أن تُنجز فيه. لا يصلك تنبيه به؛ يظهر لك فقط هنا.'
  };

  /* ---------- أدوات ---------- */
  function el(tag, attrs) {
    var n = document.createElement(tag);
    for (var k in (attrs || {})) {
      var v = attrs[k]; if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (var i = 2; i < arguments.length; i++) add(n, arguments[i]);
    return n;
  }
  function add(n, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { add(n, x); });
    else n.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
  }
  function uid() { return 'e' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36); }
  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function toLatin(s) { return String(s).replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 1632; }).replace(/[۰-۹]/g, function (d) { return d.charCodeAt(0) - 1776; }); }

  // وقت: ثوانٍ <-> نص
  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec)); var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    var p = function (x) { return (x < 10 ? '0' : '') + x; };
    return h ? h + ':' + p(m) + ':' + p(s) : m + ':' + p(s);
  }
  function parseTime(txt) {
    txt = toLatin(String(txt || '')).trim(); if (!txt) return null;
    if (!/^\d+(:\d{1,2}){0,2}$/.test(txt)) return NaN;
    var p = txt.split(':').map(Number), s = 0;
    if (p.length === 1) s = p[0];
    else if (p.length === 2) { if (p[1] > 59) return NaN; s = p[0] * 60 + p[1]; }
    else { if (p[1] > 59 || p[2] > 59) return NaN; s = p[0] * 3600 + p[1] * 60 + p[2]; }
    return s;
  }
  function fmtDate(iso) {
    try { return new Date(iso).toLocaleString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }
    catch (e) { return iso; }
  }
  function fmtDay(ymd) {
    try { var p = ymd.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ymd; }
  }
  function todayYmd() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function safeUrl(u) { try { var x = new URL(u, location.href); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; } }
  function backUrl(src) {
    var u = safeUrl(src.url); if (!u) return '';
    if (src.t == null) return u;
    var i = u.indexOf('#'), base = i < 0 ? u : u.slice(0, i), hash = i < 0 ? '' : u.slice(i);
    return base + (base.indexOf('?') > -1 ? '&' : '?') + 't=' + Math.floor(src.t) + hash;
  }

  var toastT;
  function say(msg, bad) {
    var old = document.querySelector('.toast'); if (old) old.remove();
    var t = el('div', { class: 'toast' + (bad ? ' bad' : ''), role: 'status', text: msg });
    document.body.appendChild(t); clearTimeout(toastT); toastT = setTimeout(function () { t.remove(); }, bad ? 6000 : 3500);
  }

  /* ---------- حرف i ---------- */
  function withInfo(text, key, tag) {
    var box = el('div', { class: 'info', hidden: true, text: INFO[key] });
    var b = el('button', { class: 'i', type: 'button', 'aria-expanded': 'false', 'aria-label': 'شرح: ' + text, text: 'i' });
    b.addEventListener('click', function () { var open = box.hidden; box.hidden = !open; b.setAttribute('aria-expanded', String(open)); });
    var wrap = el('span', { style: 'display:inline-flex;align-items:center;gap:6px' }, el(tag || 'span', { text: text }), b);
    return { head: wrap, box: box };
  }
  function lbl(text, key) { var w = withInfo(text, key); return [el('div', { class: 'lbl' }, w.head), w.box]; }

  /* ---------- البيانات ---------- */
  var entries = store.get('entries', []);
  function save() { store.set('entries', entries); }
  function byId(id) { return find(entries, id); }
  function catsFor(kind) { return kind === 'tadwina' ? CATS_T : CATS_N; }
  function catOf(e) { return find(catsFor(e.kind), e.cat) || catsFor(e.kind)[catsFor(e.kind).length - 1]; }
  function shortLabel(e) { var s = e.kind === 'tanwina' && e.name ? e.name : e.text; s = String(s || '').replace(/\s+/g, ' '); return (TYPES[e.type].name) + ': ' + (s.length > 40 ? s.slice(0, 40) + '…' : s); }

  /* ---------- التوجيه ---------- */
  var app = document.getElementById('app');
  var pre = null; // مصدر قادم من اتساق
  var F = { kind: '', cat: '', feeling: '', torch: '', status: '', q: '' };
  var draft = null, step = 1;

  function route() {
    var h = location.hash.replace(/^#/, '') || '/';
    var m;
    if ((m = h.match(/^\/new\/(tadwina|tanwina)$/))) return compose(m[1], null);
    if ((m = h.match(/^\/edit\/(.+)$/))) { var e = byId(m[1]); return e ? compose(e.kind, e) : board(); }
    if (h === '/me') return me();
    return board();
  }
  function go(h) { if (location.hash === '#' + h) route(); else location.hash = h; }
  window.addEventListener('hashchange', function () { draft = null; step = 1; route(); window.scrollTo(0, 0); });

  function shell(children) {
    app.textContent = '';
    app.appendChild(el('header', { class: 'top' },
      el('h1', null, el('a', { href: '#/', text: 'إلصاق' })),
      el('span', { class: 'sub', text: 'لوحتك الخاصة: ما أحسسته وما قررته' }),
      el('nav', { class: 'mini' }, el('a', { class: 'btn small', href: '#/me', text: 'نسخة احتياطية' }))));
    add(app, children);
    app.appendChild(el('footer', null, 'كل ما تكتبه هنا محفوظ في متصفحك فقط، ولا يصل إلينا.'));
  }

  /* ---------- اللوحة ---------- */
  function board() {
    var out = [];
    // بابان
    var d1 = withInfo('تدوينة', 'tadwina', 'span'), d2 = withInfo('تنوينة', 'tanwina', 'span');
    out.push(el('div', { class: 'doors' },
      el('section', { class: 'door' },
        el('h2', null, d1.head), d1.box,
        el('p', { text: 'ما خطر لك وأحسست به' }),
        el('div', { class: 'verbs' }, el('a', { class: 'btn primary', href: '#/new/tadwina', text: 'دوِّنها' }), el('a', { class: 'btn', href: '#/new/tadwina', text: 'لوِّنها' }))),
      el('section', { class: 'door' },
        el('h2', null, d2.head), d2.box,
        el('p', { text: 'ما قررته بعد أن سمعت' }),
        el('div', { class: 'verbs' }, el('a', { class: 'btn primary', href: '#/new/tanwina', text: 'نوِّنها' }), el('a', { class: 'btn', href: '#/new/tanwina', text: 'عنوِنها' })))));

    // تذكير النسخة الاحتياطية
    var lb = store.get('lastBackup', 0);
    if (entries.length && (!lb || Date.now() - lb > 14 * 86400000))
      out.push(el('div', { class: 'banner' }, 'بياناتك في هذا المتصفح فقط وتضيع لو مُسحت بيانات الموقع. ', el('a', { href: '#/me', text: 'احفظ نسخة احتياطية' }), '.'));

    if (!entries.length) {
      out.push(el('div', { class: 'empty' }, el('p', { text: 'لوحتك فاضية بعد.' }), el('p', { class: 'hint', text: 'اضغط «دوِّنها» أو «نوِّنها» لتلصق أول ورقة.' })));
      return shell(out);
    }
    out.push(filtersView());
    var list = entries.filter(passes).sort(function (a, b) { return Date.parse(b.created) - Date.parse(a.created); });
    out.push(el('p', { class: 'hint', text: list.length + ' من ' + entries.length }));
    if (!list.length) out.push(el('div', { class: 'empty', text: 'لا شيء يطابق هذا التصفية.' }));
    list.forEach(function (e) { out.push(card(e)); });
    shell(out);
  }
  function passes(e) {
    if (F.kind && e.kind !== F.kind) return false;
    if (F.cat && e.cat !== F.cat) return false;
    if (F.feeling && e.feeling !== F.feeling) return false;
    if (F.torch && String(e.torch) !== String(F.torch)) return false;
    if (F.status && e.status !== F.status) return false;
    if (F.q) {
      var hay = [e.text, e.name, (e.tags || []).join(' '), (e.src && e.src.title) || '', (e.steps || []).map(function (s) { return s.t; }).join(' ')].join(' ').toLowerCase();
      if (hay.indexOf(F.q.toLowerCase()) < 0) return false;
    }
    return true;
  }
  function filtersView() {
    var q = el('input', { type: 'search', placeholder: 'ابحث في كل ما كتبت', 'aria-label': 'بحث', value: F.q });
    q.addEventListener('change', function () { F.q = q.value.trim(); board(); });
    var kinds = el('div', { class: 'chips' }, [['', 'الكل'], ['tadwina', 'تدوينات'], ['tanwina', 'تنويناتي']].map(function (k) {
      return el('button', { class: 'chip', type: 'button', 'aria-pressed': String(F.kind === k[0]), text: k[1], onclick: function () { F.kind = k[0]; if (F.cat && !find(catsFor(F.kind || 'tadwina').concat(F.kind ? [] : CATS_N), F.cat)) F.cat = ''; board(); } });
    }));
    var cats = (F.kind === 'tadwina' ? CATS_T : F.kind === 'tanwina' ? CATS_N : CATS_T.concat(CATS_N));
    var used = {}; entries.forEach(function (e) { used[e.cat] = 1; });
    var catChips = el('div', { class: 'chips' }, cats.filter(function (c) { return used[c.id]; }).map(function (c) {
      return el('button', { class: 'chip', type: 'button', style: '--c:var(--c-' + c.id + ')', 'aria-pressed': String(F.cat === c.id), onclick: function () { F.cat = F.cat === c.id ? '' : c.id; board(); } },
        el('span', { class: 'dot' }), c.name);
    }));
    function sel(label, val, opts, key) {
      var s = el('select', { 'aria-label': label }, el('option', { value: '', text: label + ': الكل' }), opts.map(function (o) { return el('option', { value: o.id, text: (o.e ? o.e + ' ' : '') + o.name }); }));
      s.value = val; s.addEventListener('change', function () { F[key] = s.value; board(); }); return s;
    }
    return el('div', { class: 'filters' }, q, kinds, catChips,
      el('div', { class: 'row' }, sel('الشعور', F.feeling, FEELINGS, 'feeling'), sel('المشعل', F.torch, TORCHES, 'torch'), sel('الحالة', F.status, STATUSES, 'status')));
  }

  function card(e) {
    var t = TYPES[e.type], c = catOf(e);
    var head = el('div', { class: 'head' },
      el('span', { class: 'kind' }, t.shape ? el('span', { class: 'shape ' + t.shape, 'aria-hidden': 'true' }) : el('span', { 'aria-hidden': 'true', text: t.icon }), t.name),
      el('span', { class: 'pill' }, el('span', { class: 'shape round', 'aria-hidden': 'true' }), c.name));
    var node = el('article', { class: 'entry', style: '--c:var(--c-' + c.id + ')' }, head);
    if (e.kind === 'tanwina' && e.name) node.appendChild(el('div', { class: 'title', text: e.name }));
    if (e.text) node.appendChild(el('div', { class: 'body', text: e.text }));
    if (e.type === 'khotta' && e.steps && e.steps.length) {
      var done = e.steps.filter(function (s) { return s.done; }).length;
      node.appendChild(el('div', { class: 'hint', text: 'الخطوات: ' + done + ' من ' + e.steps.length }));
      node.appendChild(el('ul', { class: 'steps' }, e.steps.map(function (s, i) {
        var cb = el('input', { type: 'checkbox', 'aria-label': s.t }); cb.checked = !!s.done;
        cb.addEventListener('change', function () { s.done = cb.checked; e.updated = new Date().toISOString(); save(); board(); });
        return el('li', { class: s.done ? 'done' : '' }, cb, el('span', { text: s.t }));
      })));
    }
    if (e.tags && e.tags.length) node.appendChild(el('div', { class: 'tags' }, e.tags.map(function (x) { return el('span', { class: 'tag', text: '#' + x }); })));
    var meta = el('div', { class: 'meta' });
    if (e.feeling) { var f = find(FEELINGS, e.feeling); if (f) meta.appendChild(el('span', { class: 'pill', text: f.e + ' ' + f.name })); }
    if (e.torch) { var tc = find(TORCHES, e.torch); if (tc) meta.appendChild(el('span', { class: 'pill', text: tc.e + ' ' + tc.name })); }
    if (e.kind === 'tanwina') {
      var st = find(STATUSES, e.status) || STATUSES[0];
      meta.appendChild(el('button', { class: 'btn small', type: 'button', 'aria-label': 'تغيير الحالة', text: st.e + ' ' + st.name, onclick: function () {
        var i = STATUSES.indexOf(st); e.status = STATUSES[(i + 1) % STATUSES.length].id; e.updated = new Date().toISOString(); save(); board();
      } }));
      if (e.due) {
        var late = e.status !== 'done' && e.due < todayYmd();
        meta.appendChild(el('span', { class: 'pill' + (late ? ' late' : '') , text: '📅 ' + fmtDay(e.due) + (late ? ' (تجاوز الموعد)' : '') }));
      }
    }
    node.appendChild(meta);
    // المصدر والوقت
    if (e.src && (e.src.url || e.src.title || e.src.t != null)) {
      var line = el('div', { class: 'meta' });
      var label = (e.src.title || 'المصدر') + (e.src.t != null ? ' — عند ' + fmtTime(e.src.t) : '');
      var bu = backUrl(e.src);
      line.appendChild(bu ? el('a', { class: 'btn small', href: bu, target: '_blank', rel: 'noopener', text: (e.src.t != null ? '⏱ ارجع للثانية: ' : '↗ ') + label }) : el('span', { class: 'pill', text: '⏱ ' + label }));
      node.appendChild(line);
    }
    // الإحالة
    var ref = e.ref && byId(e.ref);
    var back = entries.filter(function (x) { return x.ref === e.id; });
    if (ref || back.length) {
      var l = el('div', { class: 'meta' });
      if (ref) l.appendChild(el('span', { text: 'تحيل إلى: ' }));
      if (ref) l.appendChild(el('a', { href: '#/edit/' + ref.id, text: shortLabel(ref) }));
      back.forEach(function (x) { l.appendChild(el('span', null, 'أُحيل إليها من: ', el('a', { href: '#/edit/' + x.id, text: shortLabel(x) }))); });
      node.appendChild(l);
    }
    node.appendChild(el('div', { class: 'meta', text: 'كُتبت ' + fmtDate(e.created) + (e.updated && e.updated !== e.created ? ' · عُدّلت ' + fmtDate(e.updated) : '') }));
    node.appendChild(el('div', { class: 'actions' },
      el('a', { class: 'btn small', href: '#/edit/' + e.id, text: 'تعديل' }),
      el('button', { class: 'btn small danger', type: 'button', text: 'حذف', onclick: function () {
        if (!confirm('حذف هذه الورقة نهائياً؟')) return;
        entries = entries.filter(function (x) { return x !== e; }); entries.forEach(function (x) { if (x.ref === e.id) x.ref = ''; }); save(); board(); say('تم الحذف.');
      } })));
    return node;
  }

  /* ---------- الكتابة ---------- */
  function compose(kind, existing) {
    var isT = kind === 'tadwina';
    if (!draft) {
      draft = existing ? JSON.parse(JSON.stringify(existing)) : {
        id: uid(), kind: kind, type: isT ? 'lahza' : 'khotwa', text: '', cat: catsFor(kind)[catsFor(kind).length - 1].id,
        feeling: '', torch: '', name: '', tags: [], status: 'todo', due: '', steps: [], ref: '', src: pre ? { url: pre.url, title: pre.title, t: pre.t } : null
      };
      draft._isNew = !existing;
    }
    var d = draft, errBox = el('div', { class: 'err', role: 'alert', text: d._err || '' }); d._err = '';
    var types = Object.keys(TYPES).filter(function (k) { return TYPES[k].kind === kind; });

    var s1 = el('div'), s2 = el('div');
    // ---- الخطوة 1 ----
    add(s1, lbl(isT ? 'دوِّنها' : 'نوِّنها', isT ? 'dawwinha' : 'nawwinha'));
    s1.appendChild(el('div', { class: 'opts' }, types.map(function (k) {
      var t = TYPES[k];
      var b = el('button', { class: 'opt', type: 'button', 'aria-pressed': String(d.type === k) },
        el('b', null, t.shape ? el('span', { class: 'shape ' + t.shape, style: '--c:var(--ink)', 'aria-hidden': 'true' }) : el('span', { 'aria-hidden': 'true', text: t.icon }), t.name),
        el('small', { text: t.sub }));
      b.addEventListener('click', function () { d.type = k; sync(); renderParts(); });
      return b;
    })));
    var ta = el('textarea', { 'aria-label': 'النص', placeholder: isT ? 'اكتب ما عندك…' : 'اكتب ما قررته…', value: d.text });
    ta.value = d.text; ta.addEventListener('input', function () { d.text = ta.value; });
    s1.appendChild(el('div', { style: 'margin-top:12px' }, ta));
    var planBox = el('div'); s1.appendChild(planBox);
    // المصدر والوقت
    if (!d.srcRaw) d.srcRaw = {
      u: (d.src && d.src.url) || '', ti: (d.src && d.src.title) || '', tt: d.src && d.src.t != null ? fmtTime(d.src.t) : ''
    };
    var R = d.srcRaw;
    var srcUrl = el('input', { type: 'text', dir: 'ltr', placeholder: 'https://… (اختياري)', 'aria-label': 'رابط المصدر', value: R.u });
    var srcTitle = el('input', { type: 'text', placeholder: 'اسم الحلقة أو المقطع (اختياري)', 'aria-label': 'اسم المصدر', value: R.ti });
    var srcT = el('input', { type: 'text', dir: 'ltr', inputmode: 'numeric', placeholder: '12:35', 'aria-label': 'الوقت', value: R.tt });
    srcUrl.addEventListener('input', function () { R.u = srcUrl.value; });
    srcTitle.addEventListener('input', function () { R.ti = srcTitle.value; });
    srcT.addEventListener('input', function () { R.tt = srcT.value; });
    add(s1, lbl('الوقت والمصدر', 'time'));
    s1.appendChild(el('div', { class: 'row2' }, srcTitle, srcT));
    s1.appendChild(el('div', { style: 'margin-top:8px' }, srcUrl));
    s1.appendChild(el('p', { class: 'hint', text: 'وقت الكتابة وتاريخها يُسجَّلان تلقائياً.' }));

    // ---- الخطوة 2 ----
    add(s2, lbl(isT ? 'لوِّنها' : 'عنوِنها', isT ? 'lawwinha' : 'awnin'));
    s2.appendChild(el('div', { class: 'hint', text: 'القسم' }));
    var catWrap = el('div', { class: 'chips' }, catsFor(kind).map(function (c) {
      var b = el('button', { class: 'chip', type: 'button', style: '--c:var(--c-' + c.id + ')', 'aria-pressed': String(d.cat === c.id) }, el('span', { class: 'dot' }), c.name);
      b.addEventListener('click', function () { d.cat = c.id; Array.prototype.forEach.call(catWrap.children, function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); });
      return b;
    }));
    s2.appendChild(catWrap);
    if (isT) {
      add(s2, lbl('الشعور', 'feeling'));
      s2.appendChild(pickGrid(FEELINGS, 'feeling', 'grid4', function (f) { return [el('span', { class: 'e', text: f.e }), f.name]; }));
      add(s2, lbl('المشعل', 'mashael'));
      s2.appendChild(pickGrid(TORCHES, 'torch', 'opts', function (t) { return [el('b', { text: t.e + ' ' + t.name }), el('small', { text: t.sub })]; }, 'opt'));
    } else {
      var nm = el('input', { type: 'text', maxlength: '80', placeholder: 'اسم قصير واحد', 'aria-label': 'الاسم', value: d.name });
      nm.addEventListener('input', function () { d.name = nm.value; });
      s2.appendChild(el('div', { class: 'lbl', text: 'الاسم' })); s2.appendChild(nm);
      var tagIn = el('input', { type: 'text', placeholder: 'اكتب وسماً ثم اضغط إضافة', 'aria-label': 'وسم' });
      var tagList = el('div', { class: 'tags', style: 'margin-top:8px' });
      var drawTags = function () {
        tagList.textContent = '';
        d.tags.forEach(function (x, i) { tagList.appendChild(el('button', { class: 'chip', type: 'button', 'aria-label': 'حذف الوسم ' + x, text: '#' + x + ' ✕', onclick: function () { d.tags.splice(i, 1); drawTags(); } })); });
      };
      var addTag = function () { var v = tagIn.value.trim().replace(/^#/, ''); if (v && d.tags.indexOf(v) < 0) d.tags.push(v); tagIn.value = ''; drawTags(); };
      tagIn.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); addTag(); } });
      add(s2, lbl('الوسم', 'wasm'));
      s2.appendChild(el('div', { class: 'stepadd' }, tagIn, el('button', { class: 'btn', type: 'button', text: 'إضافة', onclick: addTag })));
      s2.appendChild(tagList); drawTags();
      add(s2, lbl('الحالة', 'status'));
      s2.appendChild(pickGrid(STATUSES, 'status', 'opts', function (s) { return [el('b', { text: s.e + ' ' + s.name })]; }, 'opt'));
      add(s2, lbl('الموعد', 'due'));
      var due = el('input', { type: 'date', 'aria-label': 'الموعد', value: d.due || '' });
      due.addEventListener('change', function () { d.due = due.value; });
      s2.appendChild(due);
    }
    // إحالة (للنوعين)
    var others = entries.filter(function (x) { return x.id !== d.id; }).sort(function (a, b) { return Date.parse(b.created) - Date.parse(a.created); });
    add(s2, lbl('الإحالة', 'ihala'));
    var refSel = el('select', { 'aria-label': 'الإحالة' }, el('option', { value: '', text: 'بلا إحالة' }), others.map(function (x) { return el('option', { value: x.id, text: shortLabel(x) }); }));
    refSel.value = d.ref || ''; refSel.addEventListener('change', function () { d.ref = refSel.value; });
    s2.appendChild(refSel);

    function pickGrid(list, key, cls, inner, itemCls) {
      var g = el('div', { class: cls });
      list.forEach(function (o) {
        var b = el('button', { class: itemCls || 'emo', type: 'button', 'aria-pressed': String(String(d[key]) === String(o.id)) }, inner(o));
        b.addEventListener('click', function () {
          var was = String(d[key]) === String(o.id);
          d[key] = was && key !== 'status' ? '' : o.id;
          Array.prototype.forEach.call(g.children, function (x) { x.setAttribute('aria-pressed', 'false'); });
          if (d[key] !== '') b.setAttribute('aria-pressed', 'true');
        });
        g.appendChild(b);
      });
      return g;
    }

    // خطة: قائمة الخطوات
    function renderParts() {
      planBox.textContent = '';
      if (d.type !== 'khotta') return;
      planBox.appendChild(el('div', { class: 'lbl', text: 'خطوات الخطة' }));
      var inp = el('input', { type: 'text', placeholder: 'خطوة صغيرة', 'aria-label': 'خطوة' });
      var ul = el('ul', { class: 'plan', style: 'list-style:none;padding:0' });
      var draw = function () {
        ul.textContent = '';
        d.steps.forEach(function (s, i) { ul.appendChild(el('li', null, el('span', { text: (i + 1) + '. ' + s.t }), el('button', { class: 'btn small', type: 'button', 'aria-label': 'حذف الخطوة', text: '✕', onclick: function () { d.steps.splice(i, 1); draw(); } }))); });
      };
      var addStep = function () { var v = inp.value.trim(); if (v) { d.steps.push({ t: v, done: false }); inp.value = ''; draw(); } };
      inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); addStep(); } });
      planBox.appendChild(el('div', { class: 'stepadd' }, inp, el('button', { class: 'btn', type: 'button', text: 'إضافة', onclick: addStep })));
      planBox.appendChild(ul); draw();
    }
    function sync() { /* يعيد رسم أزرار النوع */ compose(kind, existing); }
    renderParts();

    // ---- الشريط والأزرار ----
    var bar = el('div', { class: 'stepbar' },
      el('div', { class: 's' + (step === 1 ? ' on' : ''), text: '١ ' + (isT ? 'دوِّنها' : 'نوِّنها') }),
      el('div', { class: 's' + (step === 2 ? ' on' : ''), text: '٢ ' + (isT ? 'لوِّنها' : 'عنوِنها') }));
    function fail(msg, st) { d._err = msg; step = st; compose(kind, existing); }
    function commit() {
      errBox.textContent = '';
      var t = parseTime(R.tt);
      if (Number.isNaN(t)) { return fail('الوقت غير مفهوم. اكتبه مثل 12:35 أو 1:02:10.', 1); }
      if (!d.text.trim()) { return fail('اكتب شيئاً أولاً.', 1); }
      if (!isT && !(d.name || '').trim()) { return fail('الاسم مطلوب للتنوينة (قصير وواحد).', 2); }
      var url = R.u.trim();
      if (url && !safeUrl(url)) { return fail('رابط المصدر لا يبدو رابطاً صحيحاً (يبدأ بـhttps://).', 1); }
      d.src = (url || R.ti.trim() || t != null) ? { url: url, title: R.ti.trim(), t: t } : null;
      delete d.srcRaw; delete d._err;
      var now = new Date().toISOString();
      var isNew = d._isNew; delete d._isNew;
      d.text = d.text.trim();
      if (d.type !== 'khotta') d.steps = [];
      if (isNew) { d.created = now; d.updated = now; entries.push(d); }
      else { var i = entries.map(function (x) { return x.id; }).indexOf(d.id); d.created = (existing && existing.created) || now; d.updated = now; entries[i] = d; }
      save(); pre = null; draft = null; step = 1; say(isNew ? 'أُلصقت على اللوحة.' : 'تم التعديل.'); go('/');
    }
    var nav = el('div', { class: 'row2', style: 'margin-top:16px' });
    if (step === 1) {
      nav.appendChild(el('button', { class: 'btn primary', type: 'button', text: 'التالي: ' + (isT ? 'لوِّنها' : 'عنوِنها'), onclick: function () { if (!d.text.trim()) { errBox.textContent = 'اكتب شيئاً أولاً.'; return; } step = 2; compose(kind, existing); window.scrollTo(0, 0); } }));
      nav.appendChild(el('button', { class: 'btn', type: 'button', text: 'حفظ الآن', onclick: commit }));
    } else {
      nav.appendChild(el('button', { class: 'btn', type: 'button', text: 'رجوع', onclick: function () { step = 1; compose(kind, existing); window.scrollTo(0, 0); } }));
      nav.appendChild(el('button', { class: 'btn primary', type: 'button', text: 'حفظ', onclick: commit }));
    }
    var form = el('section', { class: 'form' }, bar, step === 1 ? s1 : s2, errBox, nav,
      el('p', null, el('a', { href: '#/', text: 'إلغاء' })));
    shell([form]);
  }

  /* ---------- نسخة احتياطية ---------- */
  function me() {
    var lb = store.get('lastBackup', 0);
    var file = el('input', { type: 'file', accept: 'application/json,.json', class: 'sr', id: 'imp' });
    file.addEventListener('change', function () {
      var f = file.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var j = JSON.parse(r.result);
          if (!j || j.app !== 'ilsaq' || !Array.isArray(j.entries)) throw new Error('bad');
          if (!confirm('سيُدمج محتوى الملف مع لوحتك (الأحدث تعديلاً يفوز عند التطابق). متابعة؟')) return;
          var n = 0;
          j.entries.forEach(function (x) {
            if (!x || !x.id || !TYPES[x.type]) return;
            var cur = byId(x.id);
            if (!cur) { entries.push(x); n++; }
            else if (Date.parse(x.updated || 0) > Date.parse(cur.updated || 0)) { entries[entries.indexOf(cur)] = x; n++; }
          });
          save(); me(); say('تم الدمج: ' + n + ' ورقة جديدة أو محدَّثة.');
        } catch (e) { say('هذا الملف ليس نسخة من إلصاق.', true); }
      };
      r.readAsText(f);
    });
    var json = function () { return JSON.stringify({ app: 'ilsaq', version: 1, exportedAt: new Date().toISOString(), entries: entries }, null, 1); };
    shell([el('section', { class: 'form' },
      el('h2', { text: 'نسخة احتياطية' }),
      el('p', { text: 'عندك ' + entries.length + ' ورقة. تُحفظ في هذا المتصفح فقط، وتضيع لو مسحت بيانات الموقع أو بدّلت الجهاز.' }),
      el('p', { class: 'hint', text: lb ? 'آخر نسخة: ' + fmtDate(new Date(lb).toISOString()) : 'لم تحفظ نسخة بعد.' }),
      el('div', { class: 'row2' },
        el('button', { class: 'btn primary', type: 'button', text: 'تنزيل النسخة', onclick: function () {
          var a = el('a', { href: URL.createObjectURL(new Blob([json()], { type: 'application/json' })), download: 'ilsaq-backup.json' });
          document.body.appendChild(a); a.click(); a.remove(); store.set('lastBackup', Date.now()); say('تم تجهيز الملف.'); me();
        } }),
        el('button', { class: 'btn', type: 'button', text: 'نسخ المحتوى', onclick: function () {
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(json()).then(function () { store.set('lastBackup', Date.now()); say('تم النسخ.'); }, function () { say('تعذّر النسخ.', true); });
          else say('المتصفح لا يسمح بالنسخ، استخدم التنزيل.', true);
        } })),
      el('div', { class: 'tools', style: 'margin-top:12px' }, el('label', { class: 'btn', for: 'imp', text: 'استرجاع نسخة' }), file),
      el('p', null, el('a', { href: '#/', text: 'رجوع إلى اللوحة' })))]);
  }

  /* ---------- بدء التشغيل ---------- */
  function init() {
    try {
      var q = new URLSearchParams(location.search), nk = q.get('new');
      if (nk === 'tadwina' || nk === 'tanwina') {
        var t = parseTime(q.get('t'));
        pre = { url: safeUrl(q.get('link') || ''), title: (q.get('title') || '').slice(0, 200), t: (t == null || Number.isNaN(t)) ? null : t };
        history.replaceState(null, '', location.pathname + '#/new/' + nk);
      }
    } catch (e) {}
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
    route();
  }
  init();
})();
