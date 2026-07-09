/* ==========================================================
   Кофейня «Зерно» — интерактив
   Без библиотек: бургер-меню, анимации появления, мелочи.
   ========================================================== */

(function () {
  'use strict';

  /* ---- Мобильное меню (бургер) ---- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  if (burger && nav) {
    var toggleMenu = function (open) {
      var isOpen = open === undefined ? !nav.classList.contains('open') : open;
      nav.classList.toggle('open', isOpen);
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    burger.addEventListener('click', function () { toggleMenu(); });

    // Закрываем меню при клике по ссылке
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { toggleMenu(false); });
    });

    // Закрываем по Esc
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') toggleMenu(false);
    });
  }

  /* ---- Плавное появление секций при скролле ---- */
  var revealItems = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && revealItems.length) {
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealItems.forEach(function (el) { observer.observe(el); });
  } else {
    // Фолбэк: если IntersectionObserver недоступен — просто показываем всё
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- Год в подвале ---- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Демо-уведомление для соцсетей ---- */
  var demoLinks = document.querySelectorAll('[data-demo]');
  if (demoLinks.length) {
    var toast = null;
    var hideTimer = null;
    var infoIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';

    var showToast = function (messageHtml) {
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
      }
      toast.innerHTML = '<span class="toast__icon">' + infoIcon + '</span><span>' + messageHtml + '</span>';
      // reflow, чтобы анимация сработала при повторном клике
      void toast.offsetWidth;
      toast.classList.add('show');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { toast.classList.remove('show'); }, 4200);
    };

    demoLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var href = link.getAttribute('href') || '';
        var name = link.getAttribute('data-demo') || 'Ссылка';
        var msg = href.indexOf('tel:') === 0
          ? 'Это <b>демо-сайт</b> для портфолио — телефон вымышленный, заказ и звонок не сработают. В реальном проекте здесь будет настоящий номер ☕'
          : 'Это <b>демо-сайт</b> для портфолио — «' + name + '» здесь условный. В реальном проекте тут будет живая ссылка ☕';
        showToast(msg);
      });
    });
  }
})();


/* ==========================================================
   Корзина заказа (демо) — состояние живёт в JS-переменной
   ========================================================== */
(function () {
  'use strict';

  var cartEl = document.getElementById('cart');
  var cartBtn = document.getElementById('cartBtn');
  if (!cartEl || !cartBtn) return;

  var badge = document.getElementById('cartBadge');
  var itemsEl = document.getElementById('cartItems');
  var emptyEl = document.getElementById('cartEmpty');
  var footEl = document.getElementById('cartFoot');
  var totalEl = document.getElementById('cartTotal');
  var headingEl = document.getElementById('cartHeading');
  var checkoutBtn = document.getElementById('checkoutBtn');
  var form = document.getElementById('orderForm');
  var successMsg = document.getElementById('successMsg');
  var orderDone = document.getElementById('orderDone');

  var steps = {};
  var stepNodes = cartEl.querySelectorAll('[data-step]');
  for (var s = 0; s < stepNodes.length; s++) steps[stepNodes[s].getAttribute('data-step')] = stepNodes[s];

  var cart = [];
  var NBSP = ' ';

  function money(n) { return n.toLocaleString('ru-RU') + NBSP + '₽'; }
  function count() { var t = 0; for (var i = 0; i < cart.length; i++) t += cart[i].qty; return t; }
  function total() { var t = 0; for (var i = 0; i < cart.length; i++) t += cart[i].qty * cart[i].price; return t; }
  function find(id) { for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i]; return null; }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  var icons = {
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
  };

  function renderBadge() {
    var c = count();
    if (c > 0) { badge.textContent = c; badge.hidden = false; }
    else { badge.hidden = true; }
  }

  function renderItems() {
    itemsEl.innerHTML = '';
    if (cart.length === 0) {
      emptyEl.hidden = false;
      itemsEl.hidden = true;
    } else {
      emptyEl.hidden = true;
      itemsEl.hidden = false;
      cart.forEach(function (it) {
        var row = document.createElement('div');
        row.className = 'cart__item';
        row.innerHTML =
          '<div class="cart__item-main">' +
            '<div class="cart__item-name"></div>' +
            '<div class="cart__item-price"></div>' +
          '</div>' +
          '<div class="cart__qty">' +
            '<button type="button" data-act="dec" aria-label="Уменьшить количество">' + icons.minus + '</button>' +
            '<span></span>' +
            '<button type="button" data-act="inc" aria-label="Увеличить количество">' + icons.plus + '</button>' +
          '</div>' +
          '<button type="button" class="cart__item-remove" data-act="rm" aria-label="Удалить позицию">' + icons.trash + '</button>';
        row.querySelector('.cart__item-name').textContent = it.name;
        row.querySelector('.cart__item-price').textContent = money(it.price) + ' × ' + it.qty + ' = ' + money(it.price * it.qty);
        row.querySelector('.cart__qty span').textContent = it.qty;
        row.querySelector('[data-act="dec"]').addEventListener('click', function () { setQty(it.id, -1); });
        row.querySelector('[data-act="inc"]').addEventListener('click', function () { setQty(it.id, 1); });
        row.querySelector('[data-act="rm"]').addEventListener('click', function () { removeItem(it.id); });
        itemsEl.appendChild(row);
      });
    }
    totalEl.textContent = money(total());
  }

  function updateFoot() {
    footEl.hidden = !(steps.cart && !steps.cart.hidden && cart.length > 0);
  }

  function renderAll() { renderBadge(); renderItems(); updateFoot(); }

  function showStep(name) {
    for (var k in steps) { if (steps.hasOwnProperty(k)) steps[k].hidden = (k !== name); }
    if (headingEl) {
      headingEl.textContent = name === 'checkout' ? 'Оформление' : (name === 'success' ? 'Заказ принят' : 'Ваш заказ');
    }
    updateFoot();
  }

  function addItem(id, name, price) {
    var it = find(id);
    if (it) { it.qty += 1; } else { cart.push({ id: id, name: name, price: price, qty: 1 }); }
    renderAll();
    cartBtn.classList.remove('bump'); void cartBtn.offsetWidth; cartBtn.classList.add('bump');
  }
  function setQty(id, delta) {
    var it = find(id); if (!it) return;
    it.qty += delta;
    if (it.qty <= 0) { removeItem(id); return; }
    renderAll();
  }
  function removeItem(id) {
    var next = [];
    for (var i = 0; i < cart.length; i++) { if (cart[i].id !== id) next.push(cart[i]); }
    cart = next; renderAll();
  }

  function openCart() {
    showStep('cart'); renderAll();
    cartEl.classList.add('open');
    cartEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { var cl = cartEl.querySelector('.cart__close'); if (cl) cl.focus(); }, 60);
  }
  function closeCart() {
    cartEl.classList.remove('open');
    cartEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    cartBtn.focus();
  }

  cartBtn.addEventListener('click', openCart);
  var orderBtn = document.getElementById('orderBtn');
  if (orderBtn) orderBtn.addEventListener('click', openCart);
  var closers = cartEl.querySelectorAll('[data-close]');
  for (var c = 0; c < closers.length; c++) closers[c].addEventListener('click', function () { closeCart(); });
  var backs = cartEl.querySelectorAll('[data-back]');
  for (var bk = 0; bk < backs.length; bk++) backs[bk].addEventListener('click', function () { showStep('cart'); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && cartEl.classList.contains('open')) closeCart();
  });

  if (checkoutBtn) checkoutBtn.addEventListener('click', function () { if (cart.length) showStep('checkout'); });

  var addBtns = document.querySelectorAll('.card__add');
  for (var a = 0; a < addBtns.length; a++) {
    (function (btn) {
      var span = btn.querySelector('span');
      var label = span ? span.textContent : 'В корзину';
      btn.addEventListener('click', function () {
        var card = btn.closest ? btn.closest('.card') : null;
        if (!card) { var p = btn.parentNode; while (p && !(p.classList && p.classList.contains('card'))) p = p.parentNode; card = p; }
        if (!card) return;
        addItem(card.getAttribute('data-id'), card.getAttribute('data-name'), parseInt(card.getAttribute('data-price'), 10));
        btn.classList.add('is-added');
        if (span) span.textContent = 'Добавлено';
        clearTimeout(btn._t);
        btn._t = setTimeout(function () { btn.classList.remove('is-added'); if (span) span.textContent = label; }, 1100);
      });
    })(addBtns[a]);
  }

  function setError(input, show) {
    if (!input) return;
    input.classList.toggle('invalid', show);
    var err = form.querySelector('[data-error="' + input.name + '"]');
    if (err) err.classList.toggle('show', show);
  }

  if (form) {
    var nameInput = form.elements['name'];
    var phoneInput = form.elements['phone'];
    [nameInput, phoneInput].forEach(function (inp) {
      inp.addEventListener('input', function () { if (inp.classList.contains('invalid')) setError(inp, false); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      if (!nameInput.value.trim()) { setError(nameInput, true); ok = false; }
      var digits = (phoneInput.value.match(/\d/g) || []).length;
      if (digits < 10) { setError(phoneInput, true); ok = false; }
      if (!ok) { var bad = form.querySelector('.invalid'); if (bad) bad.focus(); return; }
      successMsg.innerHTML = 'Спасибо, <b>' + escapeHtml(nameInput.value.trim()) + '</b>! Заказ на <b>' + money(total()) + '</b> принят.';
      showStep('success');
    });
  }

  if (orderDone) orderDone.addEventListener('click', function () {
    cart = [];
    renderAll();
    if (form) { form.reset(); setError(form.elements['name'], false); setError(form.elements['phone'], false); }
    closeCart();
    showStep('cart');
  });

  renderAll();
})();
