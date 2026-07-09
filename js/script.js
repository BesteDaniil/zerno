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
})();
