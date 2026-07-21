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

  // Product forms (PDP + quick add)
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-product-form]');
    if (!form) return;
    e.preventDefault();
    var button = form.querySelector('[type="submit"]');
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

  // Bundle: add multiple items in one request
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-bundle-add]');
    if (!btn) return;
    e.preventDefault();
    var items;
    try { items = JSON.parse(btn.getAttribute('data-bundle-add')); }
    catch (err) { return; }
    btn.classList.add('is-disabled');
    btn.setAttribute('data-original-text', btn.textContent);
    btn.textContent = 'Adding…';
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ items: items })
    })
      .then(function (r) { if (!r.ok) return r.json().then(function (x) { throw x; }); return r.json(); })
      .then(function () { return refreshCart(true); })
      .catch(function (err) { alert((err && err.description) || 'Could not add the bundle.'); })
      .finally(function () {
        btn.classList.remove('is-disabled');
        btn.textContent = btn.getAttribute('data-original-text');
      });
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
        }
      })
      .catch(function () { /* leave section empty on failure */ });
  });
})();
