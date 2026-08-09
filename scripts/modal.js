// =============================================
// scripts/modal.js - Modal Management
// =============================================

const Modal = (function () {
    let _isOpen = false;
    let _currentProductId = null;
    let _onCloseCallback = null;

    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('product-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const contentContainer = document.getElementById('modal-content');

    function open(product) {
        if (!product) return;

        _currentProductId = product.id;
        _isOpen = true;

        contentContainer.innerHTML = buildModalHTML(product);

        overlay.classList.add('modal-overlay--visible');
        overlay.setAttribute('aria-hidden', 'false');
        modal.classList.add('product-modal--open');
        modal.setAttribute('aria-hidden', 'false');

        document.body.style.overflow = 'hidden';

        setTimeout(() => closeBtn.focus(), 100);

        const modalAddBtn = contentContainer.querySelector('.modal-add-btn');
        if (modalAddBtn) {
            modalAddBtn.addEventListener('click', () => {
                Cart.addItem(product, 1);
                showToast(`«${product.name}» به سبد سفارش اضافه شد`, 'success');
                close();
            });
        }
    }

    function close() {
        if (!_isOpen) return;

        _isOpen = false;
        _currentProductId = null;

        overlay.classList.remove('modal-overlay--visible');
        overlay.setAttribute('aria-hidden', 'true');
        modal.classList.remove('product-modal--open');
        modal.setAttribute('aria-hidden', 'true');

        document.body.style.overflow = '';

        if (_onCloseCallback) {
            _onCloseCallback();
            _onCloseCallback = null;
        }

        setTimeout(() => {
            if (!_isOpen) {
                contentContainer.innerHTML = '';
            }
        }, 400);
    }

    function onClose(cb) {
        _onCloseCallback = cb;
    }

    function isOpen() {
        return _isOpen;
    }

    function buildModalHTML(product) {
        const priceFormatted = formatPriceCompact(product.price);
        const badgeHTML = product.badge
            ? `<span class="modal-product-badge">${escapeHTML(product.badge)}</span>`
            : '';
        const ratingStars = buildRatingStars(product.rating);

        return `
            <div class="modal-product-image-wrapper">
                <img
                    src="${escapeHTML(product.image)}"
                    alt="${escapeHTML(product.name)}"
                    class="modal-product-image"
                    loading="eager"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                >
                <div class="modal-product-image--fallback img-fallback" style="display:none; height:240px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21,15 16,10 5,21"/>
                    </svg>
                </div>
            </div>
            <div class="modal-product-body">
                ${badgeHTML}
                <h3 class="modal-product-title">${escapeHTML(product.name)}</h3>
                <p class="modal-product-desc">${escapeHTML(product.description)}</p>
                <div class="modal-product-meta">
                    <span class="modal-product-meta-item">
                        ⏱ ${escapeHTML(product.prepTime)}
                    </span>
                    <span class="modal-product-meta-item">
                        ${ratingStars} ${product.rating}
                    </span>
                </div>
                <div class="modal-product-price-row">
                    <div>
                        <span class="modal-product-price">${priceFormatted}</span>
                        <span class="modal-product-price-unit"> تومان</span>
                    </div>
                    <button class="modal-add-btn">افزودن به سبد</button>
                </div>
            </div>
        `;
    }

    function buildRatingStars(rating) {
        const full = Math.floor(rating);
        const half = rating - full >= 0.5;
        let stars = '';
        for (let i = 0; i < full; i++) stars += '★';
        if (half) stars += '½';
        return `<span style="color:#F59E0B;">${stars}</span>`;
    }

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && _isOpen) {
            close();
        }
    });

    return { open, close, isOpen, onClose };
})();