/* ==========================================================
   Кофейня «Зерно» — интерактив
   Без библиотек: бургер-меню, анимации появления, мелочи.
   ========================================================== */

(function () {
  'use strict';

  /* ---- Мобильное меню (бургер) ---- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  var header = document.querySelector('.header');
  var root = document.documentElement;

  if (burger && nav) {
    // Меню — оверлей на весь экран; пока оно открыто, страница не прокручивается
    var toggleMenu = function (open) {
      var isOpen = open === undefined ? !nav.classList.contains('open') : open;
      if (isOpen === nav.classList.contains('open')) return;
      nav.classList.toggle('open', isOpen);
      burger.classList.toggle('open', isOpen);
      if (header) header.classList.toggle('menu-open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
      root.classList.toggle('is-locked', isOpen);
    };

    burger.addEventListener('click', function () { toggleMenu(); });

    // Закрываем меню при клике по ссылке
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { toggleMenu(false); });
    });

    // Закрываем по Esc и возвращаем фокус на бургер
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        toggleMenu(false);
        burger.focus({ preventScroll: true });
      }
    });

    // Корзина открывается поверх — меню закрываем
    ['cartBtn', 'orderBtn'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', function () { toggleMenu(false); });
    });

    // Выросли до десктопа — оверлей больше не нужен
    if (window.matchMedia) {
      var desktop = window.matchMedia('(min-width: 901px)');
      var onDesktop = function (e) { if (e.matches) toggleMenu(false); };
      if (desktop.addEventListener) desktop.addEventListener('change', onDesktop);
      else if (desktop.addListener) desktop.addListener(onDesktop);
    }
  }

  /* ---- Плавное появление секций при скролле ---- */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var revealObserver = null;

  function showReveal(el) {
    el.classList.add('is-visible');
    if (revealObserver) revealObserver.unobserve(el);
  }

  if ('IntersectionObserver' in window && revealItems.length) {
    // Срабатываем заранее: нижняя граница области видимости сдвинута на 15% вниз
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) showReveal(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px 15% 0px' });

    revealItems.forEach(function (el) { revealObserver.observe(el); });

    // Страховка: при быстрой прокрутке или переходе по якорю показываем всё,
    // что уже выше нижнего края экрана — «пустого экрана» быть не должно
    var revealTick = false;
    var revealSweep = function () {
      revealTick = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      revealItems = revealItems.filter(function (el) {
        if (el.classList.contains('is-visible')) return false;
        if (el.getBoundingClientRect().top < vh) { showReveal(el); return false; }
        return true;
      });
    };
    var requestSweep = function () {
      if (!revealTick) { revealTick = true; window.requestAnimationFrame(revealSweep); }
    };
    window.addEventListener('scroll', requestSweep, { passive: true });
    window.addEventListener('resize', requestSweep);
    window.addEventListener('load', requestSweep);
  } else {
    // Фолбэк: если IntersectionObserver недоступен — просто показываем всё
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- Вкладки категорий меню ---- */
  var tabsBar = document.getElementById('menuTabs');
  if (tabsBar) {
    var chips = Array.prototype.slice.call(tabsBar.querySelectorAll('.chip'));
    var tabsInner = tabsBar.querySelector('.menu__tabs-inner');
    var cats = [];
    chips.forEach(function (chip) {
      var target = document.getElementById((chip.getAttribute('href') || '').slice(1));
      if (target) cats.push({ chip: chip, el: target });
    });

    var currentChip = null;
    var holdUntil = 0; // после клика по чипсу не даём прокрутке перебивать выбор
    var setActive = function (chip) {
      if (chip === currentChip) return;
      currentChip = chip;
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-active', on);
        if (on) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
      });
      // На узких экранах доводим активный чипс до центра полоски (только по горизонтали)
      if (chip && tabsInner && tabsInner.scrollWidth > tabsInner.clientWidth) {
        tabsInner.scrollTo({ left: chip.offsetLeft - (tabsInner.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
      }
    };

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        holdUntil = Date.now() + 900;
        setActive(chip);
      });
    });

    if ('IntersectionObserver' in window && cats.length) {
      var visibleCats = [];
      var catObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var i = visibleCats.indexOf(entry.target);
          if (entry.isIntersecting && i === -1) visibleCats.push(entry.target);
          if (!entry.isIntersecting && i !== -1) visibleCats.splice(i, 1);
          // Прокрутили выше меню — подсветку снимаем
          if (!entry.isIntersecting && entry.target === cats[0].el && entry.boundingClientRect.top > 0) setActive(null);
        });
        if (Date.now() < holdUntil || !visibleCats.length) return;
        // Из попавших в «рабочую полосу» берём самую нижнюю по порядку на странице
        var pick = null;
        cats.forEach(function (c) { if (visibleCats.indexOf(c.el) !== -1) pick = c; });
        if (pick) setActive(pick.chip);
      }, { rootMargin: '-160px 0px -50% 0px', threshold: 0 });
      cats.forEach(function (c) { catObserver.observe(c.el); });
    }

    // Тень и граница у полоски, когда она «прилипла» под шапкой
    var stickTick = false;
    var updateStuck = function () {
      stickTick = false;
      var stuck = tabsBar.getBoundingClientRect().top <= 73;
      tabsBar.classList.toggle('is-stuck', stuck);
      // Рывок наверх (логотип, якорь) наблюдатель может не заметить — сбрасываем подсветку сами
      if (cats.length && Date.now() >= holdUntil && cats[0].el.getBoundingClientRect().top > window.innerHeight / 2) setActive(null);
    };
    window.addEventListener('scroll', function () {
      if (!stickTick) { stickTick = true; window.requestAnimationFrame(updateStuck); }
    }, { passive: true });
    updateStuck();
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
    document.documentElement.classList.add('is-locked');
    setTimeout(function () { var cl = cartEl.querySelector('.cart__close'); if (cl) cl.focus(); }, 60);
  }
  function closeCart() {
    cartEl.classList.remove('open');
    cartEl.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('is-locked');
    // preventScroll: иначе браузер подкручивает страницу к кнопке корзины
    cartBtn.focus({ preventScroll: true });
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

  /* ===== Маска телефона ===== */
  // Формат +7 (999) 123-45-67. «Национальные» цифры — 10 цифр после +7.
  var PREFIX = '+7 (';
  var NATIONAL_LENGTH = 10;

  // Цифры номера без кода страны (ввод с 8, 7, +7). Ведущая 7/8 — код страны, только если
  // строка начинается с «+7» или «7 (» / «8 (», номер набран целиком (11 цифр) или это первая цифра
  function extractPhoneDigits(raw) {
    var text = String(raw);
    var digits = text.replace(/\D/g, '');
    var startsWithCode = /^\s*(\+\s*7|[78]\s*\()/.test(text);
    var looksLikeCode = digits.length > 0 && (digits.charAt(0) === '7' || digits.charAt(0) === '8') &&
      (digits.length === 1 || digits.length > NATIONAL_LENGTH);
    var hasCountryCode = startsWithCode || looksLikeCode;
    if (hasCountryCode) digits = digits.slice(1);
    return { digits: digits.slice(0, NATIONAL_LENGTH), hasCountryCode: hasCountryCode };
  }

  // Разделители появляются только перед следующей цифрой — в конце строки не висит «) » или «-»
  function formatPhone(digits) {
    if (digits.length === 0) return '';
    var result = PREFIX + digits.slice(0, 3);
    if (digits.length > 3) result += ') ' + digits.slice(3, 6);
    if (digits.length > 6) result += '-' + digits.slice(6, 8);
    if (digits.length > 8) result += '-' + digits.slice(8, 10);
    return result;
  }

  // Позиция курсора сразу после N-й национальной цифры отформатированной строки
  function caretAfterDigit(formatted, digitCount) {
    if (digitCount <= 0) return formatted.length === 0 ? 0 : PREFIX.length;
    var seen = 0;
    for (var i = PREFIX.length; i < formatted.length; i++) {
      if (/\d/.test(formatted.charAt(i))) {
        seen++;
        if (seen === digitCount) return i + 1;
      }
    }
    return formatted.length;
  }

  // Сколько национальных цифр стоит левее позиции в отформатированной строке
  function nationalDigitsBefore(formatted, position) {
    var n = 0;
    for (var i = PREFIX.length; i < Math.min(position, formatted.length); i++) {
      if (/\d/.test(formatted.charAt(i))) n++;
    }
    return n;
  }

  // Обычный ввод: сырое значение поля + позиция курсора → маска + новый курсор
  function maskPhoneInput(raw, caret) {
    raw = String(raw);
    // Набрали перед «+7 (» (курсор в начале) — переносим набранное за префикс
    var prefixIndex = raw.indexOf(PREFIX);
    if (prefixIndex > 0) {
      var typed = raw.slice(0, prefixIndex);
      raw = PREFIX + typed + raw.slice(prefixIndex + PREFIX.length);
      caret = PREFIX.length + typed.length;
    }
    var parsed = extractPhoneDigits(raw);
    // Поле уже начинается с «+7 (», а человек набирает 8 или 7 — это код страны, а не цифра номера
    if (parsed.hasCountryCode && (parsed.digits === '7' || parsed.digits === '8')) parsed.digits = '';
    var value = parsed.digits.length === 0 && parsed.hasCountryCode ? PREFIX : formatPhone(parsed.digits);
    var digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length;
    if (parsed.hasCountryCode) digitsBeforeCaret--;
    digitsBeforeCaret = Math.max(0, Math.min(digitsBeforeCaret, parsed.digits.length));
    return { value: value, caret: caretAfterDigit(value, digitsBeforeCaret) };
  }

  // Вставка: целый номер (8…, 7…, +7…, 9…) заменяет поле, кусок цифр — вставляется в позицию
  function maskPhonePaste(current, selectionStart, selectionEnd, pasted) {
    var pastedDigits = String(pasted).replace(/\D/g, '');
    if (pastedDigits.length >= NATIONAL_LENGTH) {
      var value = formatPhone(extractPhoneDigits(pasted).digits);
      return { value: value, caret: value.length };
    }
    var raw = String(current).slice(0, selectionStart) + pastedDigits + String(current).slice(selectionEnd);
    return maskPhoneInput(raw, selectionStart + pastedDigits.length);
  }

  // Backspace: стирает ближайшую цифру слева, даже если слева «) », «-» или пробел
  function deleteDigitBefore(formatted, caret) {
    var digits = extractPhoneDigits(formatted).digits;
    var before = nationalDigitsBefore(formatted, caret);
    if (before === 0) {
      // Слева только «+7 (» — стирать нечего; если цифр нет совсем, очищаем поле
      return digits.length === 0 ? { value: '', caret: 0 } : { value: formatted, caret: PREFIX.length };
    }
    var value = formatPhone(digits.slice(0, before - 1) + digits.slice(before));
    return { value: value, caret: caretAfterDigit(value, before - 1) };
  }

  // Delete: стирает ближайшую цифру справа от курсора
  function deleteDigitAfter(formatted, caret) {
    var digits = extractPhoneDigits(formatted).digits;
    var before = nationalDigitsBefore(formatted, caret);
    if (before >= digits.length) return { value: formatted, caret: caret };
    var value = formatPhone(digits.slice(0, before) + digits.slice(before + 1));
    return { value: value, caret: caretAfterDigit(value, before) };
  }

  // DOM-обвязка маски
  function attachPhoneMask(input) {
    if (!input) return;
    var valueBefore = '';
    var caretBefore = 0;

    function apply(result) {
      input.value = result.value;
      if (document.activeElement === input) input.setSelectionRange(result.caret, result.caret);
      // Ошибка гаснет по событию input; после программной записи значения сообщаем об изменении сами
      if (input.classList.contains('invalid')) setError(input, false);
    }

    // Курсор не пускаем внутрь «+7 (» — иначе цифра встанет перед кодом страны
    function keepCaretAfterPrefix() {
      if (input.value.indexOf(PREFIX) === 0 && input.selectionStart < PREFIX.length && input.selectionStart === input.selectionEnd) {
        input.setSelectionRange(PREFIX.length, PREFIX.length);
      }
    }

    // Удаление перехватываем до браузера: иначе Backspace по «) » или «-» стирает разделитель,
    // маска возвращает его — и курсор «застревает»
    input.addEventListener('beforeinput', function (event) {
      valueBefore = input.value;
      caretBefore = input.selectionStart;
      var isBackward = event.inputType === 'deleteContentBackward';
      var isForward = event.inputType === 'deleteContentForward';
      if (!isBackward && !isForward) return;
      if (!event.cancelable || input.selectionStart !== input.selectionEnd) return;
      event.preventDefault();
      apply(isBackward ? deleteDigitBefore(input.value, caretBefore) : deleteDigitAfter(input.value, caretBefore));
    });

    input.addEventListener('paste', function (event) {
      var text = event.clipboardData ? event.clipboardData.getData('text') : '';
      if (!text) return;
      event.preventDefault();
      apply(maskPhonePaste(input.value, input.selectionStart, input.selectionEnd, text));
    });

    input.addEventListener('input', function (event) {
      // Страховка для клавиатур, где beforeinput нельзя отменить (часть Android IME):
      // браузер стёр только разделитель — стираем цифру сами
      var deletedBackward = event.inputType === 'deleteContentBackward';
      if (deletedBackward && valueBefore && extractPhoneDigits(input.value).digits === extractPhoneDigits(valueBefore).digits) {
        apply(deleteDigitBefore(valueBefore, caretBefore));
        return;
      }
      apply(maskPhoneInput(input.value, input.selectionStart));
    });

    input.addEventListener('focus', function () {
      if (input.value === '') input.value = PREFIX;
      window.requestAnimationFrame(function () {
        if (input.value === PREFIX) input.setSelectionRange(PREFIX.length, PREFIX.length);
        keepCaretAfterPrefix();
      });
    });
    input.addEventListener('click', keepCaretAfterPrefix);
    input.addEventListener('keyup', keepCaretAfterPrefix);

    input.addEventListener('blur', function () {
      if (input.value === PREFIX) input.value = '';
    });
  }

  /* ===== Проверка формы ===== */
  // Каждая функция возвращает текст ошибки или пустую строку
  function validateName(value) {
    var name = String(value).trim();
    if (name.length === 0) return 'Пожалуйста, введите имя';
    if (!/^[A-Za-zА-Яа-яЁё\s-]+$/.test(name)) return 'Только буквы, пробел и дефис';
    if (name.length < 2) return 'Имя — минимум 2 символа';
    return '';
  }

  function validatePhone(value) {
    var digits = extractPhoneDigits(value).digits;
    if (digits.length === 0) return 'Введите телефон';
    if (digits.length !== NATIONAL_LENGTH) return 'Номер неполный — нужно 10 цифр после +7';
    if (digits.charAt(0) !== '9') return 'Мобильный номер начинается с 9: +7 (9…)';
    return '';
  }

  function setError(input, show, message) {
    if (!input) return;
    input.classList.toggle('invalid', show);
    var err = form.querySelector('[data-error="' + input.name + '"]');
    if (!err) return;
    if (show && message) err.textContent = message;
    err.classList.toggle('show', show);
  }

  if (form) {
    var nameInput = form.elements['name'];
    var phoneInput = form.elements['phone'];
    attachPhoneMask(phoneInput);
    [nameInput, phoneInput].forEach(function (inp) {
      inp.addEventListener('input', function () { if (inp.classList.contains('invalid')) setError(inp, false); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var nameError = validateName(nameInput.value);
      if (nameError) { setError(nameInput, true, nameError); ok = false; }
      var phoneError = validatePhone(phoneInput.value);
      if (phoneError) { setError(phoneInput, true, phoneError); ok = false; }
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
