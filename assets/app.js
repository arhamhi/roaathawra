/* Roaathawra — site interactions
   Scroll reveal, collection filtering, and the page-exit curtain. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Scroll reveal ---- */
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('rt-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('rt-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    items.forEach(function (el) { io.observe(el); });
    // Safety net: reveal anything already on-screen that didn't trigger.
    setTimeout(function () {
      document.querySelectorAll('[data-reveal]:not(.rt-in)').forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('rt-in');
      });
    }, 1600);
  }

  /* ---- Collection filter ---- */
  function initFilter() {
    var root = document.querySelector('[data-collection]');
    if (!root) return;
    var chips = root.querySelectorAll('[data-chip]');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var cat = chip.getAttribute('data-chip');
        chips.forEach(function (c) {
          c.classList.toggle('is-active', c.getAttribute('data-chip') === cat);
        });
        root.querySelectorAll('[data-cat]').forEach(function (el) {
          el.style.display = (cat === 'all' || el.getAttribute('data-cat') === cat) ? '' : 'none';
        });
        // Re-cascade visible cards.
        var vis = [].slice.call(root.querySelectorAll('[data-card]'))
          .filter(function (el) { return el.style.display !== 'none'; });
        vis.forEach(function (el) { el.classList.remove('rt-in'); });
        void root.offsetWidth;
        requestAnimationFrame(function () {
          vis.forEach(function (el, i) {
            el.style.transitionDelay = (i * 55) + 'ms';
            el.classList.add('rt-in');
          });
        });
      });
    });
  }

  /* ---- Page-exit curtain on internal navigation ---- */
  function initCurtain() {
    var curtain = document.getElementById('rt-curtain');
    if (!curtain) return;
    document.querySelectorAll('a[data-internal]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        var href = a.getAttribute('href');
        if (!href || ev.metaKey || ev.ctrlKey || ev.shiftKey || a.target === '_blank') return;
        // Same-page hash links scroll smoothly instead of navigating.
        if (href.charAt(0) === '#') return;
        ev.preventDefault();
        curtain.style.animation = 'none';
        curtain.style.transform = 'translateY(101%)';
        void curtain.offsetWidth;
        curtain.style.animation = 'rtCurtainIn .5s cubic-bezier(.2,.8,.2,1) forwards';
        setTimeout(function () { window.location.href = href; }, 520);
      });
    });
  }

  /* ---- Current year in footer ---- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  function init() {
    initReveal();
    initFilter();
    initCurtain();
    initYear();
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
