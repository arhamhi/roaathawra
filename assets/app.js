/* Roaathawra site interactions
   Scroll reveal, collection filtering, gallery controls, and page utilities. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var catalog = window.ROAATHAWRA_CATALOG;
  var catalogPreviewLimit = 12;
  var catalogExpanded = false;

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

  function carouselIcon(direction) {
    if (direction === 'prev') {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
    }
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
  }

  function orderText(product) {
    return encodeURIComponent("Hi Roaathawra, I'd like to order " + product.title + ".");
  }

  function productMedia(product, featured, productIndex) {
    var sizes = featured ? '(max-width: 760px) 78vw, 360px' : '(max-width: 760px) 100vw, (max-width: 1024px) 46vw, 31vw';
    var hasGallery = product.images.length > 1;
    var slides = product.images.map(function (image, imageIndex) {
      var loading = featured && productIndex < 3 && imageIndex === 0 ? 'eager' : 'lazy';
      return [
        '<picture class="carousel-slide">',
          '<source srcset="' + escapeHtml(image.srcset) + '" sizes="' + sizes + '" type="image/webp">',
          '<img data-zoom src="' + escapeHtml(image.src) + '" alt="' + escapeHtml(image.alt || product.title) + '" loading="' + loading + '">',
        '</picture>'
      ].join('');
    }).join('');

    if (!hasGallery) {
      return '<div class="zoom-wrap product-media product-carousel">' + slides + '</div>';
    }

    return [
      '<div class="zoom-wrap product-media product-carousel has-gallery" data-carousel data-current="0" aria-label="' + escapeHtml(product.title) + ' image gallery">',
        '<div class="carousel-track" data-carousel-track>',
          slides,
        '</div>',
        '<div class="carousel-ui" aria-hidden="false">',
          '<button type="button" class="carousel-btn carousel-prev" data-carousel-prev aria-label="Previous image for ' + escapeHtml(product.title) + '">' + carouselIcon('prev') + '</button>',
          '<button type="button" class="carousel-btn carousel-next" data-carousel-next aria-label="Next image for ' + escapeHtml(product.title) + '">' + carouselIcon('next') + '</button>',
          '<div class="carousel-dots" role="tablist" aria-label="Image choices for ' + escapeHtml(product.title) + '">',
            product.images.map(function (_, imageIndex) {
              return '<button type="button" class="carousel-dot' + (imageIndex === 0 ? ' is-active' : '') + '" data-carousel-dot="' + imageIndex + '" aria-label="Show image ' + (imageIndex + 1) + '"></button>';
            }).join(''),
          '</div>',
        '</div>',
      '</div>'
    ].join('');
  }

  function productCard(product, index, featured) {
    var cats = product.categories.join(' ');
    var delay = (index % 12) * 45;
    var classes = 'card product-card' + (featured ? ' featured-card' : '') + (product.images.length > 1 ? ' has-gallery-card' : '');

    return [
      '<article data-cats="' + escapeHtml(cats) + '" data-card data-reveal class="' + classes + '" style="transition-delay:' + delay + 'ms;">',
        productMedia(product, featured, index),
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

  function applyCatalogLimit(root) {
    if (!root) return;
    var cards = [].slice.call(root.querySelectorAll('[data-product-grid] .product-card'))
      .filter(function (el) { return el.style.display !== 'none'; });
    var shouldLimit = !catalogExpanded && cards.length > catalogPreviewLimit;
    var reveal = root.querySelector('[data-catalog-reveal]');
    var button = root.querySelector('[data-view-all-products]');

    root.classList.toggle('catalog-limited', shouldLimit);
    root.classList.toggle('catalog-expanded', catalogExpanded);
    if (reveal) reveal.hidden = !shouldLimit;
    if (button) button.textContent = 'View all ' + cards.length + ' pieces';
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
    applyCatalogLimit(document.querySelector('[data-collection]'));
  }

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
    setTimeout(function () {
      document.querySelectorAll('[data-reveal]:not(.rt-in)').forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('rt-in');
      });
    }, 1600);
  }

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
        var vis = [].slice.call(root.querySelectorAll('[data-card]'))
          .filter(function (el) { return el.style.display !== 'none'; });
        vis.forEach(function (el) { el.classList.remove('rt-in'); });
        applyCatalogLimit(root);
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

  function setCarouselIndex(carousel, nextIndex) {
    var slides = carousel.querySelectorAll('.carousel-slide');
    if (!slides.length) return;
    var count = slides.length;
    var index = ((nextIndex % count) + count) % count;
    var track = carousel.querySelector('[data-carousel-track]');
    if (track) track.style.transform = 'translate3d(' + (-index * 100) + '%,0,0)';
    carousel.setAttribute('data-current', index);
    carousel.querySelectorAll('[data-carousel-dot]').forEach(function (dot, dotIndex) {
      dot.classList.toggle('is-active', dotIndex === index);
    });
  }

  function initProductCarousels() {
    document.querySelectorAll('[data-carousel]').forEach(function (carousel) {
      var slides = carousel.querySelectorAll('.carousel-slide');
      if (slides.length < 2) return;

      carousel.addEventListener('click', function (ev) {
        if (ev.target.closest('button')) return;
        carousel.classList.add('is-carousel-active');
      });
      carousel.addEventListener('mouseenter', function () {
        carousel.classList.add('is-carousel-active');
      });

      var prev = carousel.querySelector('[data-carousel-prev]');
      var next = carousel.querySelector('[data-carousel-next]');
      if (prev) {
        prev.addEventListener('click', function (ev) {
          ev.stopPropagation();
          carousel.classList.add('is-carousel-active');
          setCarouselIndex(carousel, Number(carousel.getAttribute('data-current') || 0) - 1);
        });
      }
      if (next) {
        next.addEventListener('click', function (ev) {
          ev.stopPropagation();
          carousel.classList.add('is-carousel-active');
          setCarouselIndex(carousel, Number(carousel.getAttribute('data-current') || 0) + 1);
        });
      }
      carousel.querySelectorAll('[data-carousel-dot]').forEach(function (dot) {
        dot.addEventListener('click', function (ev) {
          ev.stopPropagation();
          carousel.classList.add('is-carousel-active');
          setCarouselIndex(carousel, Number(dot.getAttribute('data-carousel-dot') || 0));
        });
      });
    });

    document.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-carousel]')) return;
      document.querySelectorAll('[data-carousel].is-carousel-active').forEach(function (carousel) {
        carousel.classList.remove('is-carousel-active');
      });
    });
  }

  function initCatalogReveal() {
    var root = document.querySelector('[data-collection]');
    if (!root) return;
    var button = root.querySelector('[data-view-all-products]');
    if (!button) return;
    button.addEventListener('click', function () {
      catalogExpanded = true;
      applyCatalogLimit(root);
    });
  }

  function initScrollTop() {
    var buttons = document.querySelectorAll('[data-scroll-top]');
    if (!buttons.length) return;
    var ticking = false;
    function update() {
      var visible = window.scrollY > 680;
      buttons.forEach(function (button) {
        button.classList.toggle('is-visible', visible);
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    var collection = document.getElementById('collection');
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var top = collection ? collection.getBoundingClientRect().top + window.scrollY - 12 : 0;
        window.scrollTo({ top: Math.max(top, 0), behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    update();
  }

  function initCurtain() {
    var curtain = document.getElementById('rt-curtain');
    if (!curtain) return;
    document.querySelectorAll('a[data-internal]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        var href = a.getAttribute('href');
        if (!href || ev.metaKey || ev.ctrlKey || ev.shiftKey || a.target === '_blank') return;
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

  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  function init() {
    renderCatalog();
    initReveal();
    initFilter();
    initProductCarousels();
    initCatalogReveal();
    initCurtain();
    initScrollTop();
    initYear();
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();