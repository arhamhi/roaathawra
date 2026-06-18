/* Roaathawra site interactions
   Scroll reveal, collection filtering, and the page-exit curtain. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var catalog = window.ROAATHAWRA_CATALOG;

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function instaIcon(size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>';
  }

  function waIcon(size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5Z"/></svg>';
  }

  function orderText(product) {
    return encodeURIComponent("Hi Roaathawra, I'd like to order " + product.title + ".");
  }

  function productCard(product, index, featured) {
    var image = product.images[0];
    var cats = product.categories.join(' ');
    var sizes = featured ? '(max-width: 760px) 78vw, 360px' : '(max-width: 760px) 100vw, (max-width: 1024px) 46vw, 31vw';
    var delay = (index % 12) * 45;

    return [
      '<article data-cats="' + escapeHtml(cats) + '" data-card data-reveal class="card product-card' + (featured ? ' featured-card' : '') + '" style="transition-delay:' + delay + 'ms;">',
        '<div class="zoom-wrap product-media">',
          '<picture>',
            '<source srcset="' + escapeHtml(image.srcset) + '" sizes="' + sizes + '" type="image/webp">',
            '<img data-zoom src="' + escapeHtml(image.src) + '" alt="' + escapeHtml(image.alt || product.title) + '" loading="' + (featured && index < 3 ? 'eager' : 'lazy') + '">',
          '</picture>',
        '</div>',
        '<div class="meta">',
          '<div class="row"><h3>' + escapeHtml(product.title) + '</h3><span class="price">' + escapeHtml(product.price) + '</span></div>',
          '<div class="sub">' + escapeHtml(product.type || 'Furniture') + ' &middot; Made to order</div>',
          product.description ? '<p class="product-desc">' + escapeHtml(product.description) + '</p>' : '',
          '<div class="product-actions">',
            '<a href="https://ig.me/m/roaathawra" target="_blank" rel="noopener" class="dm">' + instaIcon(14) + ' DM to order</a>',
            '<a href="https://wa.me/923208572698?text=' + orderText(product) + '" target="_blank" rel="noopener" class="dm wa-link">' + waIcon(14) + ' WhatsApp</a>',
          '</div>',
        '</div>',
      '</article>'
    ].join('');
  }

  function renderCatalog() {
    if (!catalog || !catalog.products) return;

    var featuredRoot = document.querySelector('[data-featured-products]');
    var gridRoot = document.querySelector('[data-product-grid]');
    var chipRoot = document.querySelector('[data-filter-chips]');
    var countRoot = document.querySelector('[data-product-count]');

    if (countRoot) countRoot.textContent = catalog.products.length;
    if (featuredRoot) {
      featuredRoot.innerHTML = catalog.products
        .filter(function (product) { return product.featured; })
        .map(function (product, index) { return productCard(product, index, true); })
        .join('');
    }
    if (gridRoot) {
      gridRoot.innerHTML = catalog.products
        .map(function (product, index) { return productCard(product, index, false); })
        .join('');
    }
    if (chipRoot) {
      chipRoot.innerHTML = catalog.filters.map(function (filter, index) {
        return '<button data-chip="' + escapeHtml(filter[0]) + '" class="chip' + (index === 0 ? ' is-active' : '') + '">' + escapeHtml(filter[1]) + '</button>';
      }).join('');
    }
  }

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
        root.querySelectorAll('[data-cats]').forEach(function (el) {
          var cats = (el.getAttribute('data-cats') || '').split(/\s+/);
          el.style.display = (cat === 'all' || cats.indexOf(cat) !== -1) ? '' : 'none';
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
    renderCatalog();
    initReveal();
    initFilter();
    initCurtain();
    initYear();
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
