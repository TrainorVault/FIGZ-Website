/* ==========================================================================
   FIGZ Collect — global.js
   Vanilla JS only. Drawers, AJAX cart, variant picker, sticky ATC,
   countdowns, scroll reveal, announcement rotation, gallery.
   ========================================================================== */
(function () {
  'use strict';

  var moneyFormat = document.documentElement.getAttribute('data-money-format') || '${{amount}}';

  function formatMoney(cents) {
    var amount = (cents / 100).toFixed(2);
    return moneyFormat
      .replace(/\{\{\s*amount\s*\}\}/, amount)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, Math.round(cents / 100).toString());
  }

  /* ---------- Drawers (mobile menu + cart) ---------- */
  var openDrawer = null;

  function drawerOpen(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (openDrawer && openDrawer !== el) drawerClose();
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drawer-open');
    openDrawer = el;
    var focusable = el.querySelector('button, a, input');
    if (focusable) focusable.focus({ preventScroll: true });
  }

  function drawerClose() {
    if (!openDrawer) return;
    openDrawer.classList.remove('is-open');
    openDrawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('drawer-open');
    openDrawer = null;
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-drawer-open]');
    if (opener) {
      e.preventDefault();
      drawerOpen(opener.getAttribute('data-drawer-open'));
      return;
    }
    if (e.target.closest('[data-drawer-close]') || e.target.classList.contains('drawer__overlay')) {
      drawerClose();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') drawerClose();
  });

  /* ---------- Cart: AJAX add / change + drawer re-render ---------- */
  function refreshCart(openAfter) {
    var drawer = document.getElementById('CartDrawer');
    var sectionId = drawer ? drawer.getAttribute('data-section-id') : null;
    var requests = [fetch('/cart.js').then(function (r) { return r.json(); })];
    if (sectionId) {
      requests.push(fetch('/?sections=' + sectionId).then(function (r) { return r.json(); }));
    }
    return Promise.all(requests).then(function (results) {
      var cart = results[0];
      document.querySelectorAll('[data-cart-count]').forEach(function (el) {
        el.textContent = cart.item_count;
        el.setAttribute('data-count', cart.item_count);
      });
      if (results[1] && sectionId) {
        var html = new DOMParser().parseFromString(results[1][sectionId], 'text/html');
        var fresh = html.getElementById('CartDrawer');
        if (fresh && drawer) {
          drawer.querySelector('.drawer__panel').innerHTML = fresh.querySelector('.drawer__panel').innerHTML;
        }
      }
      if (openAfter) drawerOpen('CartDrawer');
      return cart;
    });
  }

  function addToCart(body, button) {
    if (button) { button.classList.add('is-disabled'); button.setAttribute('data-original-text', button.textContent); button.textContent = 'Adding…'; }
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (r) {
        if (!r.ok) return r.json().then(function (err) { throw err; });
        return r.json();
      })
      .then(function () { return refreshCart(true); })
      .catch(function (err) {
        alert((err && err.description) || 'Could not add to cart.');
      })
      .finally(function () {
        if (button) { button.classList.remove('is-disabled'); button.textContent = button.getAttribute('data-original-text'); }
      });
  }

  // Product forms (PDP + quick add). If the bundle is selected, add the bundle instead of the single item.
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-product-form]');
    if (!form) return;
    e.preventDefault();
    var button = form.querySelector('[type="submit"]');
    var toggle = document.querySelector('[data-bundle-toggle]');
    var bundleEl = document.querySelector('[data-bundle-items]');
    if (toggle && toggle.checked && bundleEl) {
      var items = null;
      try { items = JSON.parse(bundleEl.getAttribute('data-bundle-items')); } catch (err) { items = null; }
      if (items && items.length) { addToCart({ items: items }, button); return; }
    }
    var id = form.querySelector('[name="id"]').value;
    var qtyEl = form.querySelector('[name="quantity"]');
    addToCart({ id: Number(id), quantity: qtyEl ? Number(qtyEl.value) : 1 }, button);
  });

  // Quick add buttons (single-variant products) + cart upsell
  document.addEventListener('click', function (e) {
    var quick = e.target.closest('[data-quick-add]');
    if (quick) {
      e.preventDefault();
      addToCart({ id: Number(quick.getAttribute('data-quick-add')), quantity: 1 }, null);
    }
  });

  // Bundle toggle: reflect selection state on the card + swap the Add-to-Cart label
  document.addEventListener('change', function (e) {
    var toggle = e.target.closest('[data-bundle-toggle]');
    if (!toggle) return;
    var card = toggle.closest('[data-bundle-select]');
    if (card) card.classList.toggle('is-selected', toggle.checked);
    document.querySelectorAll('[data-atc-bundle-text]').forEach(function (btn) {
      if (btn.disabled) return;
      var normal = btn.getAttribute('data-atc-text') || 'Add to Cart';
      var bundleText = btn.getAttribute('data-atc-bundle-text') || 'Add Bundle to Cart';
      btn.textContent = toggle.checked ? bundleText : normal;
    });
    // Express/dynamic checkout can only buy the single item — hide it while the bundle is selected
    var dc = document.querySelector('[data-dynamic-checkout]');
    if (dc) dc.hidden = toggle.checked;
  });

  // PDP quantity stepper (distinct from cart-line steppers)
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-qty-adjust]');
    if (!btn) return;
    var input = btn.parentElement.querySelector('input[name="quantity"]');
    if (!input) return;
    input.value = Math.max(1, Number(input.value || 1) + Number(btn.getAttribute('data-qty-adjust')));
  });

  // Cart line quantity / remove (event delegation survives drawer re-render)
  document.addEventListener('click', function (e) {
    var qtyBtn = e.target.closest('[data-qty-change]');
    var removeBtn = e.target.closest('[data-line-remove]');
    var target = qtyBtn || removeBtn;
    if (!target) return;
    e.preventDefault();
    var line = Number(target.getAttribute('data-line'));
    var quantity = 0;
    if (qtyBtn) {
      var current = Number(qtyBtn.getAttribute('data-current'));
      quantity = Math.max(0, current + Number(qtyBtn.getAttribute('data-qty-change')));
    }
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line: line, quantity: quantity })
    }).then(function () { refreshCart(false); });
  });

  /* ---------- Variant picker ---------- */
  document.querySelectorAll('[data-variant-picker]').forEach(function (picker) {
    var jsonEl = document.getElementById(picker.getAttribute('data-variant-picker'));
    if (!jsonEl) return;
    var variants = JSON.parse(jsonEl.textContent);
    var form = document.querySelector('form[data-product-form][data-main]');
    if (!form) return;
    var idInput = form.querySelector('[name="id"]');
    var priceEl = document.querySelector('[data-price]');
    var button = form.querySelector('[type="submit"]');
    var stickyPrice = document.querySelector('[data-sticky-price]');

    picker.addEventListener('change', function () {
      var selected = [];
      picker.querySelectorAll('.option-group').forEach(function (group) {
        var checked = group.querySelector('input:checked');
        if (checked) selected.push(checked.value);
      });
      var match = variants.find(function (v) {
        return selected.every(function (val, i) { return v.options[i] === val; });
      });
      if (!match) return;
      idInput.value = match.id;
      if (priceEl) priceEl.textContent = formatMoney(match.price);
      if (stickyPrice) stickyPrice.textContent = formatMoney(match.price);
      if (button) {
        if (match.available) {
          button.disabled = false;
          button.textContent = button.getAttribute('data-atc-text') || 'Add to Cart';
        } else {
          button.disabled = true;
          button.textContent = 'Sold Out';
        }
      }
      var url = new URL(window.location.href);
      url.searchParams.set('variant', match.id);
      window.history.replaceState({}, '', url.toString());
    });
  });

  /* ---------- Product gallery thumbs ---------- */
  document.addEventListener('click', function (e) {
    var thumb = e.target.closest('[data-gallery-thumb]');
    if (!thumb) return;
    var index = Number(thumb.getAttribute('data-gallery-thumb'));
    var track = document.querySelector('[data-gallery-track]');
    if (!track) return;
    track.scrollTo({ left: track.clientWidth * index, behavior: 'smooth' });
    document.querySelectorAll('[data-gallery-thumb]').forEach(function (t) { t.classList.remove('is-active'); });
    thumb.classList.add('is-active');
  });

  var galleryTrack = document.querySelector('[data-gallery-track]');
  if (galleryTrack) {
    galleryTrack.addEventListener('scroll', function () {
      var index = Math.round(galleryTrack.scrollLeft / galleryTrack.clientWidth);
      document.querySelectorAll('[data-gallery-thumb]').forEach(function (t, i) {
        t.classList.toggle('is-active', i === index);
      });
    }, { passive: true });
  }

  /* ---------- Sticky add-to-cart ---------- */
  var stickyBar = document.querySelector('[data-sticky-atc]');
  var buyBox = document.querySelector('[data-buy-actions]');
  if (stickyBar && buyBox && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      stickyBar.classList.toggle('is-visible', !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0);
    }, { threshold: 0 }).observe(buyBox);
  }

  /* ---------- Countdowns ---------- */
  function tickCountdowns() {
    document.querySelectorAll('[data-countdown]').forEach(function (el) {
      var end = new Date(el.getAttribute('data-countdown')).getTime();
      if (isNaN(end)) return;
      var diff = end - Date.now();
      if (diff <= 0) {
        var live = el.getAttribute('data-countdown-live');
        if (live) el.innerHTML = live;
        return;
      }
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      var units = el.querySelectorAll('[data-cd-unit]');
      if (units.length === 4) {
        units[0].textContent = d;
        units[1].textContent = String(h).padStart(2, '0');
        units[2].textContent = String(m).padStart(2, '0');
        units[3].textContent = String(s).padStart(2, '0');
      }
    });
  }
  if (document.querySelector('[data-countdown]')) {
    tickCountdowns();
    setInterval(tickCountdowns, 1000);
  }

  /* ---------- Bundle urgency timer (evergreen MM:SS, persists per session) ---------- */
  (function () {
    var el = document.querySelector('[data-bundle-timer]');
    if (!el) return;
    var out = el.querySelector('[data-bundle-timer-out]') || el;
    var dur = (Number(el.getAttribute('data-duration')) || 900) * 1000;
    var key = 'figz_bundletimer_' + (el.getAttribute('data-key') || 'p');
    var start = Number(sessionStorage.getItem(key));
    if (!start) { start = Date.now(); try { sessionStorage.setItem(key, String(start)); } catch (e) {} }
    function render() {
      var left = start + dur - Date.now();
      if (left <= 0) { start = Date.now(); try { sessionStorage.setItem(key, String(start)); } catch (e) {} left = dur; }
      var m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
      out.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    render();
    setInterval(render, 1000);
  })();

  /* ---------- Announcement rotation ---------- */
  var announcements = document.querySelectorAll('.announcement-bar__item');
  if (announcements.length > 1) {
    var current = 0;
    setInterval(function () {
      announcements[current].classList.remove('is-active');
      current = (current + 1) % announcements.length;
      announcements[current].classList.add('is-active');
    }, 4500);
  }

  /* ---------- Scroll reveal ---------- */
  var revealObserver = null;
  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
  }

  function observeReveals(root) {
    (root || document).querySelectorAll('.reveal:not(.is-visible)').forEach(function (el) {
      if (revealObserver) revealObserver.observe(el);
      else el.classList.add('is-visible');
    });
  }
  observeReveals(document);

  /* ---------- Product recommendations (Section Rendering API) ---------- */
  document.querySelectorAll('[data-recommendations]').forEach(function (el) {
    fetch(el.getAttribute('data-url'))
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var fresh = doc.querySelector('[data-recommendations]');
        if (fresh && fresh.innerHTML.trim()) {
          el.innerHTML = fresh.innerHTML;
          observeReveals(el);
          document.dispatchEvent(new CustomEvent('figz:cards'));
        }
      })
      .catch(function () { /* leave section empty on failure */ });
  });

  /* ---------- Cart reservation timer (evergreen, loops at zero) ---------- */
  (function () {
    var KEY = 'figz_carttimer';
    var start = Number(sessionStorage.getItem(KEY));
    if (!start) { start = Date.now(); try { sessionStorage.setItem(KEY, String(start)); } catch (e) {} }
    function tick() {
      var outs = document.querySelectorAll('[data-cart-timer-out]');
      if (!outs.length) return;
      var host = document.querySelector('[data-cart-timer]');
      var dur = (host ? Number(host.getAttribute('data-duration')) || 600 : 600) * 1000;
      var left = start + dur - Date.now();
      if (left <= 0) { start = Date.now(); try { sessionStorage.setItem(KEY, String(start)); } catch (e) {} left = dur; }
      var m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
      var txt = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
      outs.forEach(function (o) { o.textContent = txt; });
    }
    tick();
    setInterval(tick, 1000);
  })();

  /* ---------- Currency floater ---------- */
  (function () {
    var floater = document.querySelector('[data-currency-floater]');
    if (!floater) return;
    var toggle = floater.querySelector('[data-cf-toggle]');
    var menu = floater.querySelector('[data-cf-menu]');
    if (!toggle || !menu) return;
    function close() { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); floater.classList.remove('is-open'); }
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = menu.hidden;
      menu.hidden = !willOpen;
      toggle.setAttribute('aria-expanded', String(willOpen));
      floater.classList.toggle('is-open', willOpen);
    });
    document.addEventListener('click', function (e) { if (!floater.contains(e.target)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  })();

  /* ---------- Language detection prompt ---------- */
  (function () {
    var prompt = document.querySelector('[data-lang-prompt]');
    if (!prompt) return;
    var KEY = 'figz_lang_prompt';
    function remember() { try { localStorage.setItem(KEY, 'done'); } catch (e) {} }
    function dismiss() {
      remember();
      prompt.classList.remove('is-visible');
      setTimeout(function () { prompt.hidden = true; }, 220);
    }
    try { if (localStorage.getItem(KEY) === 'done') return; } catch (e) {}
    var nav = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
    if (!nav) return;
    var opt = prompt.querySelector('[data-lang-opt="' + nav + '"]');
    if (!opt) return; // browser language isn't an available (non-current) language
    opt.hidden = false;
    prompt.hidden = false;
    requestAnimationFrame(function () { prompt.classList.add('is-visible'); });
    prompt.querySelectorAll('[data-lang-dismiss]').forEach(function (b) { b.addEventListener('click', dismiss); });
    prompt.querySelectorAll('form').forEach(function (f) { f.addEventListener('submit', remember); });
  })();

  /* ---------- Premium wishlist (localStorage, guest-friendly) ---------- */
  (function () {
    var KEY = 'figz_wishlist';
    function read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
    function write(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }
    function indexOf(list, handle) { for (var i = 0; i < list.length; i++) { if (list[i].handle === handle) return i; } return -1; }
    function syncCount() {
      var n = read().length;
      document.querySelectorAll('[data-wishlist-count]').forEach(function (el) {
        el.textContent = n; el.setAttribute('data-count', n); el.hidden = n === 0;
      });
      document.querySelectorAll('[data-wishlist-link]').forEach(function (link) {
        link.setAttribute('aria-label', n > 0 ? 'My Collection (' + n + ' saved)' : 'My Collection');
      });
    }
    function syncButtons() {
      var list = read();
      document.querySelectorAll('[data-wishlist-toggle]').forEach(function (btn) {
        var on = indexOf(list, btn.getAttribute('data-wish-handle')) > -1;
        btn.setAttribute('aria-pressed', String(on));
        var label = btn.querySelector('[data-wish-label]');
        if (label) label.textContent = on ? 'Saved to Collection' : 'Save to Collection';
      });
    }
    function toggle(btn) {
      var list = read();
      var handle = btn.getAttribute('data-wish-handle');
      var idx = indexOf(list, handle);
      if (idx > -1) {
        list.splice(idx, 1);
      } else {
        list.unshift({
          handle: handle,
          title: btn.getAttribute('data-wish-title'),
          url: btn.getAttribute('data-wish-url'),
          image: btn.getAttribute('data-wish-image'),
          price: Number(btn.getAttribute('data-wish-price')) || 0,
          priceFmt: btn.getAttribute('data-wish-price-fmt') || '',
          currency: btn.getAttribute('data-wish-currency') || ''
        });
        btn.classList.remove('is-pop'); void btn.offsetWidth; btn.classList.add('is-pop');
      }
      write(list); syncButtons(); syncCount();
      var removed = idx > -1;
      renderPage();
      // Keep keyboard focus somewhere sensible after a wishlist-page removal
      // re-renders the grid and destroys the focused button.
      if (removed && document.querySelector('[data-wishlist-page]')) {
        var next = document.querySelector('[data-wishlist-grid] [data-wishlist-toggle]') ||
                   document.querySelector('[data-wishlist-empty] a');
        if (next) next.focus();
      }
    }
    function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function renderPage() {
      var page = document.querySelector('[data-wishlist-page]');
      if (!page) return;
      var grid = page.querySelector('[data-wishlist-grid]');
      var empty = page.querySelector('[data-wishlist-empty]');
      var list = read();
      if (!list.length) { grid.hidden = true; grid.innerHTML = ''; empty.hidden = false; return; }
      empty.hidden = true; grid.hidden = false;
      // Prices were snapshotted in the market currency active at save time.
      // Only render one when it still matches the active market — reformatting
      // foreign cents with the shop's AUD format would show a wrong price.
      var activeCur = document.documentElement.getAttribute('data-currency') || '';
      grid.innerHTML = list.map(function (it) {
        var price = (it.priceFmt && it.currency === activeCur)
          ? '<p class="product-card__price">' + esc(it.priceFmt) + '</p>' : '';
        var img = it.image ? '<img src="' + esc(it.image) + '" alt="' + esc(it.title) + '" loading="lazy">' : '';
        return '<article class="product-card">' +
            '<div class="product-card__media">' +
              '<button type="button" class="wishlist-btn wishlist-btn--card" data-wishlist-toggle aria-pressed="true"' +
                ' data-wish-handle="' + esc(it.handle) + '" data-wish-title="' + esc(it.title) + '" data-wish-url="' + esc(it.url) + '"' +
                ' data-wish-image="' + esc(it.image) + '" data-wish-price="' + (Number(it.price) || 0) + '"' +
                ' data-wish-price-fmt="' + esc(it.priceFmt) + '" data-wish-currency="' + esc(it.currency) + '"' +
                ' aria-label="Remove ' + esc(it.title) + ' from collection">' +
                '<svg class="wishlist-btn__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.6 4.1 12.7A4.7 4.7 0 0 1 10.8 6l1.2 1.2L13.2 6a4.7 4.7 0 0 1 6.7 6.7L12 20.6Z"/></svg>' +
              '</button>' +
              '<a href="' + esc(it.url) + '" tabindex="-1" aria-hidden="true">' + img + '</a>' +
            '</div>' +
            '<div class="product-card__info">' +
              '<h2 class="product-card__title"><a href="' + esc(it.url) + '">' + esc(it.title) + '</a></h2>' + price +
            '</div>' +
          '</article>';
      }).join('');
    }
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-wishlist-toggle]');
      if (!btn) return;
      e.preventDefault();
      toggle(btn);
    });
    // Hearts injected after load (e.g. the related-products refresh) start
    // unpressed — resync whenever a section re-renders product cards.
    document.addEventListener('figz:cards', syncButtons);
    syncButtons(); syncCount(); renderPage();
  })();

  /* ---------- Automatic currency detection (suggest, never force) ---------- */
  (function () {
    var box = document.querySelector('[data-cur-detect]');
    if (!box) return;
    var KEY = 'figz_cur_choice';
    try { if (localStorage.getItem(KEY)) return; } catch (e) {}
    // At most once per session: if the visitor ignores the prompt, don't
    // re-open it on every page view.
    try { if (sessionStorage.getItem('figz_cur_prompt')) return; } catch (e) {}
    var mapEl = box.querySelector('[data-cur-detect-map]');
    var map;
    try { map = JSON.parse(mapEl.textContent); } catch (e) { return; }
    var currentCur = box.getAttribute('data-current-cur');
    var langs = navigator.languages || [navigator.language || ''];
    var region = '';
    for (var i = 0; i < langs.length; i++) {
      var m = (langs[i] || '').match(/[-_]([A-Za-z]{2})\b/);
      if (m) { region = m[1].toUpperCase(); break; }
    }
    if (!/^[A-Z]{2}$/.test(region)) return;
    var match = null;
    for (var j = 0; j < map.length; j++) { if (map[j].country === region) { match = map[j]; break; } }
    if (!match || match.cur === currentCur) return;
    function regionFlag(cc) {
      return String.fromCodePoint(0x1F1E6 + cc.charCodeAt(0) - 65, 0x1F1E6 + cc.charCodeAt(1) - 65);
    }
    function remember() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }
    function hide() { box.classList.remove('is-visible'); setTimeout(function () { box.hidden = true; }, 240); }
    var msg = box.querySelector('[data-cur-detect-msg]');
    var accept = box.querySelector('[data-cur-detect-accept]');
    var flag = box.querySelector('[data-cur-detect-flag]');
    var countryInput = box.querySelector('[data-cur-detect-country]');
    if (accept) accept.textContent = 'Switch to ' + match.cur;
    if (countryInput) countryInput.value = match.country;
    if (flag) flag.textContent = regionFlag(region);
    var keep = box.querySelector('[data-cur-detect-keep]');
    if (keep) keep.addEventListener('click', function () { remember(); hide(); });
    var form = box.querySelector('form');
    if (form) form.addEventListener('submit', remember);
    try { sessionStorage.setItem('figz_cur_prompt', '1'); } catch (e) {}
    box.hidden = false;
    requestAnimationFrame(function () {
      box.classList.add('is-visible');
      // Written while visible so the aria-live region actually announces it.
      if (msg) msg.innerHTML = 'Shopping from <strong>' + match.name + '</strong>? See prices in <strong>' + match.cur + (match.symbol ? ' (' + match.symbol + ')' : '') + '</strong>.';
    });
    // Never park a floating prompt over the page indefinitely.
    setTimeout(function () { if (!box.hidden) hide(); }, 15000);
  })();

  /* ---------- Live purchase notifications (social proof) ---------- */
  (function () {
    var box = document.querySelector('[data-pp]');
    if (!box) return;
    if (/\/(cart|checkout|account)(\/|$)/.test(location.pathname)) return;
    var isMobile = window.matchMedia('(max-width: 749px)').matches;
    if (isMobile && box.getAttribute('data-mobile') !== 'true') return;
    var shoppers, products;
    try {
      shoppers = JSON.parse(document.querySelector('[data-pp-shoppers]').textContent);
      products = JSON.parse(document.querySelector('[data-pp-products]').textContent);
    } catch (e) { return; }
    if (!shoppers.length || !products.length) return;
    var min = (Number(box.getAttribute('data-min')) || 20) * 1000;
    var max = (Number(box.getAttribute('data-max')) || 60) * 1000;
    var first = (Number(box.getAttribute('data-first')) || 6) * 1000;
    var card = box.querySelector('[data-pp-card]');
    var link = box.querySelector('[data-pp-link]');
    var img = box.querySelector('[data-pp-img]');
    var line = box.querySelector('[data-pp-line]');
    var timeEl = box.querySelector('[data-pp-time]');
    var closed = false, paused = false, hideT, nextT;
    box.querySelector('[data-pp-close]').addEventListener('click', function (e) {
      e.preventDefault(); closed = true; clearTimeout(hideT); clearTimeout(nextT); doHide();
    });
    card.addEventListener('mouseenter', function () { paused = true; clearTimeout(hideT); });
    card.addEventListener('mouseleave', function () { if (!paused) return; paused = false; hideT = setTimeout(doHide, 2500); });
    function rand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function show() {
      if (closed) return;
      var s = pick(shoppers), p = pick(products), mins = rand(3, 58);
      img.src = p.img; img.alt = p.title; link.href = p.url;
      line.innerHTML = '<strong>' + s.name + '</strong> from ' + s.place + ' bought <strong>' + p.title + '</strong>';
      timeEl.textContent = mins + ' min' + (mins === 1 ? '' : 's') + ' ago';
      box.hidden = false;
      requestAnimationFrame(function () { box.classList.add('is-visible'); });
      hideT = setTimeout(doHide, 6000);
    }
    function doHide() {
      box.classList.remove('is-visible');
      // Restore [hidden] after the slide-out so the invisible link/close
      // button leave the tab order and the accessibility tree.
      setTimeout(function () { if (!box.classList.contains('is-visible')) box.hidden = true; }, 450);
      if (closed) return;
      nextT = setTimeout(show, rand(min, max));
    }
    nextT = setTimeout(show, first);
  })();
})();
