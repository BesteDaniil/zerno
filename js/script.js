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

    var showToast = function (name) {
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
      }
      toast.innerHTML =
        '<span class="toast__icon">' + infoIcon + '</span>' +
        '<span>Это <b>демо-сайт</b> для портфолио — «' + name + '» здесь условный. ' +
        'В реальном проекте тут будет живая ссылка ☕</span>';
      // reflow, чтобы анимация сработала при повторном клике
      void toast.offsetWidth;
      toast.classList.add('show');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { toast.classList.remove('show'); }, 4000);
    };

    demoLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        showToast(link.getAttribute('data-demo') || 'Соцсеть');
      });
    });
  }
})();
