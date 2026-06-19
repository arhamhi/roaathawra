/* Roaathawra — static site interactions.
   Renders shared header/drawer/search/footer + per-page content from
   window.ROAATHAWRA_CATALOG. No Shopify: ordering via Instagram DM / WhatsApp.
   XSS note: renders the client's own catalog data. product.bodyHtml is
   sanitized to an allow-list at build time (scripts/import-catalog.mjs); all
   other interpolated values pass through esc(). */
(function () {
  'use strict';

  var CATALOG = window.ROAATHAWRA_CATALOG || { products: [], filters: [], brand: {}, video: {} };
  var PRODUCTS = CATALOG.products || [];
  var IG_DM = 'https://ig.me/m/roaathawra';
  var WA = '923208572698';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function base() { return location.pathname.indexOf('/products/') !== -1 ? '../' : ''; }
  function productUrl(p) { return base() + 'product.html?handle=' + encodeURIComponent(p.handle); }
  function assetUrl(src) { return base() + src; }
  function orderText(p) { return encodeURIComponent("Hi Roaathawra, I'd like to order the " + p.title + " (" + p.price + ")."); }
  function waUrl(p) { return 'https://wa.me/' + WA + '?text=' + orderText(p); }
  function srcsetUrl(set) { return String(set || '').split(/,\s*/).map(function (s) { return base() + s; }).join(', '); }

  var ICON = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    insta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5Z"/></svg>',
    arrowL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    arrowR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>'
  };

  function cardHtml(p) {
    var img1 = p.images[0];
    var img2 = p.images[1];
    var second = img2 ? '<img class="img-2" src="' + assetUrl(img2.src) + '" alt="" loading="lazy">' : '';
    return '<article class="card" data-cats="' + esc((p.categories || []).join(' ')) + '" data-title="' + esc(p.title.toLowerCase()) + '" data-reveal>' +
      '<a class="card-media" href="' + productUrl(p) + '" aria-label="' + esc(p.title) + '">' +
        '<img src="' + assetUrl(img1.src) + '" srcset="' + esc(srcsetUrl(img1.srcset)) + '" sizes="(max-width:760px) 46vw, 22vw" alt="' + esc(img1.alt || p.title) + '" loading="lazy">' + second +
      '</a>' +
      '<div class="card-body">' +
        '<a class="card-title" href="' + productUrl(p) + '">' + esc(p.title) + '</a>' +
        '<span class="card-price">' + esc(p.price) + '</span>' +
        '<a class="card-dm" href="' + IG_DM + '" target="_blank" rel="noopener">' + ICON.insta + ' DM to order</a>' +
      '</div></article>';
  }
  function renderCards(container, list) { if (container) container.innerHTML = list.map(cardHtml).join(''); }

  function buildChrome() {
    var mount = document.querySelector('[data-site-header]');
    if (!mount) return;
    var b = base();
    var cats = (CATALOG.filters || []).filter(function (f) { return f[0] !== 'all'; });
    var navLinks =
      '<a href="' + b + 'index.html">Home</a>' +
      '<a href="' + b + 'shop.html">Shop All</a>' +
      cats.map(function (f) { return '<a href="' + b + 'shop.html?cat=' + f[0] + '">' + esc(f[1]) + '</a>'; }).join('') +
      '<a href="' + b + 'about.html">About Us</a>';
    var header =
      '<div class="announce">Straightforward pricing. Custom designs. Made proudly in Pakistan.</div>' +
      '<header class="site-header">' +
        '<div class="header-inner">' +
          '<div class="header-left">' +
            '<button class="icon-btn only-mobile" data-open-drawer aria-label="Open menu">' + ICON.menu + '</button>' +
            '<button class="icon-btn" data-open-search aria-label="Search">' + ICON.search + '</button>' +
          '</div>' +
          '<a class="header-brand" href="' + b + 'index.html">Roaathawra</a>' +
          '<div class="header-right"><a class="icon-btn" href="' + IG_DM + '" target="_blank" rel="noopener" aria-label="Instagram">' + ICON.insta + '</a></div>' +
        '</div>' +
        '<nav class="header-nav only-desktop">' + navLinks + '</nav>' +
      '</header>';
    var drawerLinks =
      '<a href="' + b + 'index.html">Home</a>' +
      '<a href="' + b + 'shop.html">Shop All <small>' + PRODUCTS.length + ' pieces</small></a>' +
      cats.map(function (f) { return '<a href="' + b + 'shop.html?cat=' + f[0] + '">' + esc(f[1]) + '</a>'; }).join('') +
      '<a href="' + b + 'about.html">About</a>';
    var drawer =
      '<div class="drawer-overlay" data-drawer-overlay></div>' +
      '<aside class="drawer" data-drawer aria-label="Menu">' +
        '<div class="drawer-head"><span>Menu</span><button class="icon-btn" data-close-drawer aria-label="Close menu">' + ICON.close + '</button></div>' +
        '<nav class="drawer-nav">' + drawerLinks + '</nav>' +
        '<div class="drawer-foot"><a href="' + IG_DM + '" target="_blank" rel="noopener">Instagram</a><a href="https://wa.me/' + WA + '" target="_blank" rel="noopener">WhatsApp</a></div>' +
      '</aside>';
    var search =
      '<div class="search-overlay" data-search><div class="search-top">' + ICON.search +
        '<input type="search" placeholder="Search furniture" data-search-input aria-label="Search products">' +
        '<button class="icon-btn" data-close-search aria-label="Close search">' + ICON.close + '</button></div>' +
        '<div class="search-results"><div class="grid grid--4" data-search-grid></div></div></div>';
    mount.innerHTML = header + drawer + search;
    wireChrome();
  }

  function wireChrome() {
    var overlay = document.querySelector('[data-drawer-overlay]');
    var drawer = document.querySelector('[data-drawer]');
    var search = document.querySelector('[data-search]');
    function openDrawer() { overlay.classList.add('is-open'); drawer.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
    function closeDrawer() { overlay.classList.remove('is-open'); drawer.classList.remove('is-open'); document.body.style.overflow = ''; }
    function openSearch() { search.classList.add('is-open'); document.body.style.overflow = 'hidden'; var i = search.querySelector('[data-search-input]'); setTimeout(function () { if (i) i.focus(); }, 60); }
    function closeSearch() { search.classList.remove('is-open'); document.body.style.overflow = ''; }
    document.querySelector('[data-open-drawer]').addEventListener('click', openDrawer);
    document.querySelector('[data-close-drawer]').addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
    document.querySelector('[data-open-search]').addEventListener('click', openSearch);
    document.querySelector('[data-close-search]').addEventListener('click', closeSearch);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDrawer(); closeSearch(); } });
    var input = search.querySelector('[data-search-input]');
    var grid = search.querySelector('[data-search-grid]');
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      if (!q) { grid.innerHTML = ''; return; }
      var hits = PRODUCTS.filter(function (p) { return p.title.toLowerCase().indexOf(q) !== -1 || (p.type || '').toLowerCase().indexOf(q) !== -1 || (p.categories || []).join(' ').indexOf(q) !== -1; }).slice(0, 12);
      renderCards(grid, hits); revealAll(grid);
    });
  }

  function buildFooter() {
    var mount = document.querySelector('[data-site-footer]');
    if (!mount) return;
    var b = base();
    var cats = (CATALOG.filters || []).filter(function (f) { return f[0] !== 'all'; }).slice(0, 6);
    mount.innerHTML =
      '<footer class="site-footer"><div class="page"><div class="footer-grid">' +
        '<div><div class="brand">Roaathawra</div><p style="margin-top:14px;max-width:34ch;color:#b9b4aa">Contemporary, made-to-order furniture handcrafted in Pakistan. Less is more.</p></div>' +
        '<div><h4>Shop</h4><a href="' + b + 'shop.html">All furniture</a>' + cats.map(function (f) { return '<a href="' + b + 'shop.html?cat=' + f[0] + '">' + esc(f[1]) + '</a>'; }).join('') + '</div>' +
        '<div><h4>Connect</h4><a href="' + b + 'about.html">About us</a><a href="' + IG_DM + '" target="_blank" rel="noopener">Instagram</a><a href="https://wa.me/' + WA + '" target="_blank" rel="noopener">WhatsApp</a></div>' +
      '</div><div class="footer-bottom"><span>&copy; ' + new Date().getFullYear() + ' Roaathawra. The Revolution of Imagination.</span><span>Made to order &middot; DM to order</span></div></div></footer>' +
      '<a class="fab" href="' + IG_DM + '" target="_blank" rel="noopener" aria-label="DM on Instagram">' + ICON.insta + '</a>';
  }

  function revealAll(scope) { (scope || document).querySelectorAll('[data-reveal]:not(.in)').forEach(function (n) { n.classList.add('in'); }); }
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (reduce || !('IntersectionObserver' in window)) { revealAll(); return; }
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (i) { io.observe(i); });
  }

  function initHome() { var grid = document.querySelector('[data-featured-grid]'); if (grid) renderCards(grid, PRODUCTS.slice(0, 6)); }

  function initShop() {
    var grid = document.querySelector('[data-shop-grid]');
    if (!grid) return;
    var cat = qs('cat');
    var list = cat ? PRODUCTS.filter(function (p) { return (p.categories || []).indexOf(cat) !== -1; }) : PRODUCTS;
    var title = document.querySelector('[data-shop-title]');
    var count = document.querySelector('[data-shop-count]');
    if (title) { var label = 'All Furniture'; (CATALOG.filters || []).forEach(function (f) { if (f[0] === cat) label = f[1]; }); title.textContent = label; }
    if (count) count.textContent = list.length + ' pieces';
    renderCards(grid, list); initReveal();
  }

  function galleryHtml(p) {
    var slides = p.images.map(function (im, i) { return '<div class="slide' + (i === 0 ? ' is-active' : '') + '"><img src="' + assetUrl(im.src) + '" alt="' + esc(im.alt || p.title) + '"></div>'; }).join('');
    var thumbs = p.images.length > 1 ? p.images.map(function (im, i) { return '<button class="thumb' + (i === 0 ? ' is-active' : '') + '" data-thumb="' + i + '"><img src="' + assetUrl(im.src) + '" alt=""></button>'; }).join('') : '';
    var arrows = p.images.length > 1 ? '<button class="gallery-arrow prev" data-prev aria-label="Previous">' + ICON.arrowL + '</button><button class="gallery-arrow next" data-next aria-label="Next">' + ICON.arrowR + '</button>' : '';
    return '<div class="gallery" data-gallery><div class="gallery-main">' + slides + arrows + '</div>' + (thumbs ? '<div class="gallery-thumbs">' + thumbs + '</div>' : '') + '</div>';
  }
  function specRows(p) {
    var list = (p.specs && p.specs.length)
      ? '<ul class="spec-list">' + p.specs.map(function (s) { return '<li><b>' + esc(s.label) + '</b><span>' + esc(s.value) + '</span></li>'; }).join('') + '</ul>'
      : '';
    var text = p.specsText ? '<p>' + esc(p.specsText) + '</p>' : '';
    if (!list && !text) return '';
    return '<details><summary>Materials + Specifications<span class="plus"></span></summary><div class="acc-body">' + list + text +
      '<p style="margin-top:10px;color:var(--c-muted);font-size:.85rem">Made to order — sizes and finishes can be customised. Message us for full dimensions.</p></div></details>';
  }
  function detailsHtml(p) {
    var SHIPPING = 'Once your order is confirmed and advance payment received, please allow 18-21 days for delivery. Before we begin production, one of our representatives will contact you to confirm all details and ensure your complete satisfaction. Your comfort is our priority.<br><br><strong>Please note: Custom-made pieces are non-returnable.</strong>';
    return '<div class="product-details sticky">' +
      '<h1>' + esc(p.title) + '</h1>' +
      '<div class="price">' + esc(p.price) + '</div>' +
      '<div class="tax-note">Taxes included.</div>' +
      '<div class="dm-actions">' +
        '<a class="btn btn--block" href="' + IG_DM + '" target="_blank" rel="noopener">' + ICON.insta + ' DM to order</a>' +
        '<a class="btn btn--secondary btn--block" href="' + waUrl(p) + '" target="_blank" rel="noopener">' + ICON.wa + ' Order on WhatsApp</a>' +
      '</div>' +
      '<div class="accordion">' +
        '<details open><summary>Details<span class="plus"></span></summary><div class="acc-body">' + (p.bodyHtml || ('<p>' + esc(p.description) + '</p>')) + '</div></details>' +
        specRows(p) +
        '<details><summary>Shipping + Returns<span class="plus"></span></summary><div class="acc-body"><p>' + SHIPPING + '</p></div></details>' +
      '</div>' +
      '<p class="tax-note" style="margin-top:14px"><em>Please note: Actual colour may vary slightly from the image due to natural wood variations and screen settings.</em></p>' +
      '</div>';
  }
  function initProduct() {
    var mount = document.querySelector('[data-product]');
    if (!mount) return;
    var handle = qs('handle');
    var matches = PRODUCTS.filter(function (x) { return x.handle === handle; });
    var p = matches[0] || PRODUCTS[0];
    if (!p) { mount.innerHTML = '<p class="page">Product not found.</p>'; return; }
    document.title = p.title + ' — Roaathawra';
    mount.innerHTML = '<div class="page section--tight"><div class="product-layout">' + galleryHtml(p) + detailsHtml(p) + '</div></div>';
    var recMount = document.querySelector('[data-recommendations]');
    if (recMount) {
      var cat = (p.categories || [])[0];
      var rel = PRODUCTS.filter(function (x) { return x.handle !== p.handle && (x.categories || []).indexOf(cat) !== -1; });
      PRODUCTS.forEach(function (x) { if (x.handle !== p.handle && rel.indexOf(x) === -1) rel.push(x); });
      renderCards(recMount, rel.slice(0, 4));
    }
    wireGallery(); initReveal();
  }

  function wireGallery() {
    var g = document.querySelector('[data-gallery]');
    if (!g) return;
    var slides = [].slice.call(g.querySelectorAll('.slide'));
    var thumbs = [].slice.call(g.querySelectorAll('[data-thumb]'));
    var idx = 0;
    function show(n) { idx = (n + slides.length) % slides.length; slides.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); }); thumbs.forEach(function (t, i) { t.classList.toggle('is-active', i === idx); }); }
    var prev = g.querySelector('[data-prev]'); var next = g.querySelector('[data-next]');
    if (prev) prev.addEventListener('click', function () { show(idx - 1); });
    if (next) next.addEventListener('click', function () { show(idx + 1); });
    thumbs.forEach(function (t) { t.addEventListener('click', function () { show(Number(t.getAttribute('data-thumb'))); }); });
  }
  function initMarquee() { document.querySelectorAll('[data-marquee] .marquee-track').forEach(function (track) { track.innerHTML = track.innerHTML + track.innerHTML; }); }

  function init() { buildChrome(); buildFooter(); initHome(); initShop(); initProduct(); initMarquee(); initReveal(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
