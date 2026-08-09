// =============================================
// scripts/ui.js - UI Rendering & DOM Updates
// =============================================

/**
 * UI module - handles all DOM rendering and updates.
 */

// --- Toast Notifications ---

let toastTimer = null;

function showToast(message, type = 'success', duration = 2500) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'status');

    const iconSvg = type === 'success'
        ? '<svg class="toast__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<svg class="toast__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

    toast.innerHTML = `${iconSvg}<span>${escapeHTML(message)}</span>`;
    container.appendChild(toast);

    const removeToast = () => {
        toast.classList.add('toast--removing');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    };

    toast.addEventListener('click', removeToast);
    setTimeout(removeToast, duration);
}

/**
 * Animate a product image flying from its current position to the cart icon.
 * Returns a Promise that resolves when the animation finishes (or immediately if reduced motion).
 * @param {HTMLImageElement} sourceImg - The product image element to clone
 * @param {HTMLElement} cartTarget - The cart icon element (destination)
 * @returns {Promise<void>}
 */
function animateProductToCart(sourceImg, cartTarget) {
  return new Promise((resolve) => {
    if (!sourceImg || !cartTarget) {
      resolve();
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      resolve();
      return;
    }

    const sourceRect = sourceImg.getBoundingClientRect();
    const targetRect = cartTarget.getBoundingClientRect();

    const sourceCenterX = sourceRect.left + sourceRect.width / 2;
    const sourceCenterY = sourceRect.top + sourceRect.height / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    const deltaX = targetCenterX - sourceCenterX;
    const deltaY = targetCenterY - sourceCenterY;

    const clone = sourceImg.cloneNode(true);
    clone.classList.add('fly-to-cart-clone');
    clone.style.left = `${sourceRect.left}px`;
    clone.style.top = `${sourceRect.top}px`;
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;
    clone.style.setProperty('--fly-x', `${deltaX}px`);
    clone.style.setProperty('--fly-y', `${deltaY}px`);

    document.body.appendChild(clone);

    const onEnd = () => {
      clone.remove();
      resolve();
    };

    clone.addEventListener('animationend', onEnd, { once: true });

    setTimeout(() => {
      if (clone.parentNode) {
        clone.remove();
        resolve();
      }
    }, 450);
  });
}

// --- Category Chips ---

function renderCategories(categories, activeCategoryId) {
    const container = document.getElementById('category-chips');
    container.innerHTML = categories.map(cat => {
        const isActive = cat.id === activeCategoryId;
        return `
            <button
                class="category-chip ${isActive ? 'category-chip--active' : ''}"
                data-category="${escapeHTML(cat.id)}"
                aria-pressed="${isActive}"
                type="button"
            >${escapeHTML(cat.name)}</button>
        `;
    }).join('');
}

// --- Featured Product ---

function renderFeatured(product) {
    const section = document.getElementById('featured-section');
    if (!product) {
        section.innerHTML = '';
        return;
    }

    const priceFormatted = formatPriceCompact(product.price);

    section.innerHTML = `
        <div class="featured-card" data-product-id="${escapeHTML(product.id)}" role="button" tabindex="0" aria-label="مشاهده جزئیات ${escapeHTML(product.name)}">
            <div class="featured-card__image-wrapper">
                <img
                    src="${escapeHTML(product.image)}"
                    alt="${escapeHTML(product.name)}"
                    class="featured-card__image"
                    loading="eager"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                >
                <div class="featured-card__image--fallback img-fallback" style="display:none; height:200px;">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21,15 16,10 5,21"/>
                    </svg>
                </div>
                ${product.badge ? `<span class="featured-card__badge">${escapeHTML(product.badge)}</span>` : ''}
            </div>
            <div class="featured-card__content">
                <h3 class="featured-card__title">${escapeHTML(product.name)}</h3>
                <p class="featured-card__desc">${escapeHTML(product.description)}</p>
                <div class="featured-card__footer">
                    <span class="featured-card__price">${priceFormatted} <span class="featured-card__price-unit">تومان</span></span>
                    <button class="btn btn--primary btn--sm featured-add-btn" data-product-id="${escapeHTML(product.id)}">افزودن به سبد</button>
                </div>
            </div>
        </div>
    `;
}

// --- Product Grid ---

function renderProducts(products, totalCount) {
    const grid = document.getElementById('products-grid');
    const countEl = document.getElementById('products-count');
    const titleEl = document.getElementById('products-title');
    const noResults = document.getElementById('no-results');

    countEl.textContent = `${products.length} محصول`;

    if (products.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'flex';
        titleEl.textContent = 'نتایج جستجو';
        return;
    }

    noResults.style.display = 'none';
    titleEl.textContent = 'محبوب‌ترین‌ها';

    grid.innerHTML = products.map(product => {
        const priceFormatted = formatPriceCompact(product.price);

        return `
            <div class="product-card" data-product-id="${escapeHTML(product.id)}" role="button" tabindex="0" aria-label="${escapeHTML(product.name)} - ${priceFormatted} تومان">
                <div class="product-card__image-wrapper">
                    <img
                        src="${escapeHTML(product.image)}"
                        alt="${escapeHTML(product.name)}"
                        class="product-card__image"
                        loading="lazy"
                        onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                    >
                    <div class="product-card__image--fallback img-fallback" style="display:none;">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21,15 16,10 5,21"/>
                        </svg>
                    </div>
                    ${product.badge ? `<span class="product-card__badge">${escapeHTML(product.badge)}</span>` : ''}
                </div>
                <div class="product-card__body">
                    <h4 class="product-card__title">${escapeHTML(product.name)}</h4>
                    <p class="product-card__desc">${escapeHTML(product.description)}</p>
                    <div class="product-card__footer">
                        <span class="product-card__price">${priceFormatted} <span class="product-card__price-unit">تومان</span></span>
                        <button class="product-card__add-btn" data-product-id="${escapeHTML(product.id)}" aria-label="افزودن ${escapeHTML(product.name)} به سبد" title="افزودن به سبد">+ افزودن</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- Cart UI ---

function renderCart(cartSnapshot) {
    const itemsContainer = document.getElementById('cart-items-container');
    const emptyState = document.getElementById('cart-empty-state');
    const footer = document.getElementById('cart-footer');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const badge = document.getElementById('cart-badge');

    if (cartSnapshot.totalItems > 0) {
        badge.textContent = cartSnapshot.totalItems > 99 ? '99+' : cartSnapshot.totalItems;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }

    if (cartSnapshot.isEmpty) {
        itemsContainer.innerHTML = '';
        emptyState.style.display = 'flex';
        footer.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    footer.style.display = 'flex';
    subtotalEl.textContent = formatPrice(cartSnapshot.subtotal);
    totalEl.textContent = formatPrice(cartSnapshot.total);

    itemsContainer.innerHTML = cartSnapshot.items.map(item => {
        const itemTotal = formatPriceCompact(item.price * item.quantity);
        const unitPrice = formatPriceCompact(item.price);

        return `
            <div class="cart-item" data-cart-item-id="${escapeHTML(item.id)}">
                <img
                    src="${escapeHTML(item.image)}"
                    alt="${escapeHTML(item.name)}"
                    class="cart-item__image"
                    loading="lazy"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                >
                <div class="cart-item__image--fallback img-fallback" style="display:none; width:56px; height:56px; min-height:56px; border-radius:var(--radius-md);">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                </div>
                <div class="cart-item__info">
                    <span class="cart-item__name">${escapeHTML(item.name)}</span>
                    <span class="cart-item__price">${unitPrice} تومان × ${item.quantity} = ${itemTotal} تومان</span>
                </div>
                <div class="cart-item__actions">
                    <div class="quantity-control">
                        <button class="quantity-control__btn cart-qty-dec" data-product-id="${escapeHTML(item.id)}" aria-label="کاهش تعداد">−</button>
                        <span class="quantity-control__value">${item.quantity}</span>
                        <button class="quantity-control__btn cart-qty-inc" data-product-id="${escapeHTML(item.id)}" aria-label="افزایش تعداد">+</button>
                    </div>
                    <button class="cart-item__remove cart-remove-btn" data-product-id="${escapeHTML(item.id)}" aria-label="حذف ${escapeHTML(item.name)}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// --- Cart Drawer Open/Close ---

function openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    drawer.classList.add('cart-drawer--open');
    overlay.classList.add('cart-overlay--visible');
    overlay.setAttribute('aria-hidden', 'false');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    renderCart(Cart.getSnapshot());
}

function closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    drawer.classList.remove('cart-drawer--open');
    overlay.classList.remove('cart-overlay--visible');
    overlay.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// --- Filter & Search ---

function getFilteredProducts(query, categoryId) {
    let filtered = [...PRODUCTS];

    if (categoryId && categoryId !== 'all') {
        filtered = filtered.filter(p => p.category === categoryId);
    }

    if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );
    }

    return filtered;
}

function updateProductDisplay(query, categoryId) {
    const filtered = getFilteredProducts(query, categoryId);
    renderProducts(filtered, filtered.length);
}

// --- Image Fallback Handling ---

function initImageFallback() {
    document.addEventListener('error', function (e) {
        if (e.target.tagName === 'IMG' && !e.target.dataset.failed) {
            e.target.dataset.failed = '1';
        }
    }, true);
}