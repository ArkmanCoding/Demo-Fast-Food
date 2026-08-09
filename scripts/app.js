// =============================================
// scripts/app.js - Main Application Controller
// =============================================

(function () {
    'use strict';

    let activeCategory = 'all';
    let searchQuery = '';

    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const categoryChipsContainer = document.getElementById('category-chips');
    const headerCartBtn = document.getElementById('header-cart-btn');
    const cartCloseBtn = document.getElementById('cart-close-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartClearBtn = document.getElementById('cart-clear-btn');
    const cartCheckoutBtn = document.getElementById('cart-checkout-btn');
    const productsGrid = document.getElementById('products-grid');
    const featuredSection = document.getElementById('featured-section');

    let selectedService = 'dine-in';
    let selectedTable = null;

    function init() {
        initImageFallback();
        renderInitialUI();
        bindGlobalEvents();
        bindCartEvents();
        syncCartUI(Cart.getSnapshot());

        Cart.subscribe(syncCartUI);
        renderCart(Cart.getSnapshot());
        updateFeaturedVisibility(activeCategory);
        initTableSelector();
        initBottomNav();
        initScrollToTop();
    }

    function renderInitialUI() {
        const availableCategories = getAvailableCategories();
        renderCategories(availableCategories, activeCategory);
        const featuredProduct = PRODUCTS.find(p => p.isFeatured) || PRODUCTS[0];
        renderFeatured(featuredProduct);
        updateProductDisplay(searchQuery, activeCategory);
    }

    function syncCartUI(snapshot) {
        renderCart(snapshot);
    }

    function updateFeaturedVisibility(categoryId) {
        if (categoryId === 'all') {
            featuredSection.style.display = '';
        } else {
            featuredSection.style.display = 'none';
        }
    }

    function bindGlobalEvents() {
        const debouncedSearch = debounce((query) => {
            searchQuery = query;
            updateProductDisplay(searchQuery, activeCategory);
            searchClearBtn.style.display = query ? 'flex' : 'none';
        }, 200);

        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });

        searchClearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            updateProductDisplay(searchQuery, activeCategory);
            searchClearBtn.style.display = 'none';
            searchInput.focus();
        });

        categoryChipsContainer.addEventListener('click', (e) => {
            const chip = e.target.closest('.category-chip');
            if (!chip) return;
            const categoryId = chip.dataset.category;
            if (categoryId === activeCategory) return;
            activeCategory = categoryId;
            const availableCategories = getAvailableCategories();
            renderCategories(availableCategories, activeCategory);
            updateProductDisplay(searchQuery, activeCategory);
            updateFeaturedVisibility(activeCategory);
            chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });

        productsGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (!card) return;
            if (e.target.closest('.product-card__add-btn')) return;
            const productId = card.dataset.productId;
            const product = getProductById(productId);
            if (product) Modal.open(product);
        });

        productsGrid.addEventListener('click', (e) => {
            const addBtn = e.target.closest('.product-card__add-btn');
            if (!addBtn) return;
            e.stopPropagation();
            const productId = addBtn.dataset.productId;
            const product = getProductById(productId);
            if (product) {
                Cart.addItem(product, 1);
                const card = addBtn.closest('.product-card');
                const sourceImg = card?.querySelector('.product-card__image');
                const cartTarget = document.getElementById('header-cart-btn');
                const animationPromise = (sourceImg && cartTarget)
                    ? animateProductToCart(sourceImg, cartTarget)
                    : Promise.resolve();
                animationPromise.then(() => {
                    showToast(`«${product.name}» به سبد اضافه شد. برای ادامه سبد را باز کنید.`, 'success');
                });
            }
        });

        featuredSection.addEventListener('click', (e) => {
            const featuredCard = e.target.closest('.featured-card');
            if (!featuredCard) return;
            if (e.target.closest('.featured-add-btn')) return;
            const productId = featuredCard.dataset.productId;
            const product = getProductById(productId);
            if (product) Modal.open(product);
        });

        featuredSection.addEventListener('click', (e) => {
            const addBtn = e.target.closest('.featured-add-btn');
            if (!addBtn) return;
            e.stopPropagation();
            const productId = addBtn.dataset.productId;
            const product = getProductById(productId);
            if (product) {
                Cart.addItem(product, 1);
                const featuredCard = addBtn.closest('.featured-card');
                const sourceImg = featuredCard?.querySelector('.featured-card__image');
                const cartTarget = document.getElementById('header-cart-btn');
                const animationPromise = (sourceImg && cartTarget)
                    ? animateProductToCart(sourceImg, cartTarget)
                    : Promise.resolve();
                animationPromise.then(() => {
                    showToast(`«${product.name}» به سبد اضافه شد. برای ادامه سبد را باز کنید.`, 'success');
                });
            }
        });

        headerCartBtn.addEventListener('click', () => {
            openCartDrawer();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !Modal.isOpen()) {
                const focused = document.activeElement;
                if (focused && (focused.closest('.product-card') || focused.closest('.featured-card'))) {
                    const card = focused.closest('.product-card') || focused.closest('.featured-card');
                    const productId = card.dataset.productId;
                    const product = getProductById(productId);
                    if (product) {
                        e.preventDefault();
                        Modal.open(product);
                    }
                }
            }
        });
    }

    function bindCartEvents() {
        cartCloseBtn.addEventListener('click', closeCartDrawer);
        cartOverlay.addEventListener('click', (e) => {
            if (e.target === cartOverlay) closeCartDrawer();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const drawer = document.getElementById('cart-drawer');
                if (drawer.classList.contains('cart-drawer--open') && !Modal.isOpen()) {
                    closeCartDrawer();
                }
            }
        });

        const cartItemsContainer = document.getElementById('cart-items-container');
        cartItemsContainer.addEventListener('click', (e) => {
            const incBtn = e.target.closest('.cart-qty-inc');
            if (incBtn) {
                Cart.incrementItem(incBtn.dataset.productId);
                return;
            }
            const decBtn = e.target.closest('.cart-qty-dec');
            if (decBtn) {
                Cart.decrementItem(decBtn.dataset.productId);
                return;
            }
            const removeBtn = e.target.closest('.cart-remove-btn');
            if (removeBtn) {
                const productId = removeBtn.dataset.productId;
                const product = getProductById(productId);
                Cart.removeItem(productId);
                if (product) showToast(`«${product.name}» از سبد حذف شد`, 'error');
            }
        });

        cartClearBtn.addEventListener('click', () => {
            if (Cart.getSnapshot().isEmpty) return;
            Cart.clearCart();
            showToast('سبد سفارش خالی شد', 'error');
        });

        const serviceBtns = document.querySelectorAll('.cart-service-btn');
        serviceBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const service = btn.dataset.service;
                if (service === selectedService) return;
                serviceBtns.forEach(b => {
                    b.classList.remove('cart-service-btn--active');
                    b.setAttribute('aria-checked', 'false');
                });
                btn.classList.add('cart-service-btn--active');
                btn.setAttribute('aria-checked', 'true');
                selectedService = service;
            });
        });

        cartCheckoutBtn.addEventListener('click', () => {
            const snapshot = Cart.getSnapshot();
            if (snapshot.isEmpty) return;
            openCheckoutModal(snapshot);
        });
    }

function openCheckoutModal(cartSnapshot) {
    const modal = document.getElementById('checkout-modal');
    const closeBtn = modal.querySelector('.checkout-modal__close');
    const overlay = modal.querySelector('.checkout-modal__overlay');
    const form = document.getElementById('checkout-form');
    const nameInput = document.getElementById('cf-name');
    const phoneInput = document.getElementById('cf-phone');

    function closeModal() {
        modal.classList.remove('checkout-modal--open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    modal.classList.add('checkout-modal--open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    closeBtn.onclick = closeModal;
    overlay.onclick = closeModal;

    form.onsubmit = (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();

        if (!name || !phone) {
            showToast('لطفاً نام و شماره تماس را وارد کنید', 'error');
            return;
        }
        if (!/^09\d{9}$/.test(phone)) {
            showToast('شماره موبایل معتبر نیست', 'error');
            return;
        }

        // بستن فرم چک‌اوت و نمایش مودال دموی پایین
        closeModal();
        showDemoOrderModal(cartSnapshot);
    };
}

    // --- Table Selector ---
    function initTableSelector() {
        const trigger = document.getElementById('table-selector-trigger');
        const dropdown = document.getElementById('table-dropdown');
        const currentNumberEl = document.getElementById('current-table-number');

        selectedTable = null;
        currentNumberEl.textContent = 'انتخاب';

        for (let i = 1; i <= 8; i++) {
            const option = document.createElement('div');
            option.className = 'table-option';
            option.setAttribute('role', 'option');
            option.setAttribute('data-table', i);
            option.innerHTML = `
                <svg class="table-option__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7"/>
                    <path d="M3 7l9-4 9 4"/>
                    <line x1="9" y1="11" x2="9" y2="13"/>
                    <line x1="15" y1="11" x2="15" y2="13"/>
                </svg>
                <span>میز شماره ${i}</span>
            `;
            option.addEventListener('click', () => {
                selectTable(i);
            });
            dropdown.appendChild(option);
        }

        function selectTable(tableNumber) {
            selectedTable = tableNumber;
            currentNumberEl.textContent = tableNumber;
            updateDropdownHighlight(tableNumber);
            closeDropdown();
        }

        function updateDropdownHighlight(number) {
            const options = dropdown.querySelectorAll('.table-option');
            options.forEach(opt => {
                const table = parseInt(opt.dataset.table, 10);
                if (table === number) {
                    opt.classList.add('table-option--selected');
                } else {
                    opt.classList.remove('table-option--selected');
                }
            });
        }

        function openDropdown() {
            dropdown.classList.add('table-selector__dropdown--open');
            trigger.setAttribute('aria-expanded', 'true');
        }

        function closeDropdown() {
            dropdown.classList.remove('table-selector__dropdown--open');
            trigger.setAttribute('aria-expanded', 'false');
        }

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropdown.classList.contains('table-selector__dropdown--open')) {
                closeDropdown();
            } else {
                openDropdown();
            }
        });

        document.addEventListener('click', (e) => {
            if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
                closeDropdown();
            }
        });

        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeDropdown();
        });

        dropdown.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeDropdown();
                trigger.focus();
            }
        });
    }

    // --- Bottom Navigation ---
    function initBottomNav() {
        const items = document.querySelectorAll('.bottom-nav__item');

        function setActive(target) {
            items.forEach(item => {
                item.classList.remove('bottom-nav__item--active');
                item.removeAttribute('aria-current');
            });
            target.classList.add('bottom-nav__item--active');
            target.setAttribute('aria-current', 'page');
        }

        items.forEach(item => {
            item.addEventListener('click', () => {
                const nav = item.dataset.nav;
                if (nav === 'orders' || nav === 'profile') {
                    showDemoModal();
                } else if (nav === 'menu') {
                    setActive(item);
                }
            });
        });
    }

    // --- Demo Modal ---
    function showDemoModal() {
        const modal = document.getElementById('demo-modal');
        const closeBtn = modal.querySelector('.demo-modal__close');
        const confirmBtn = modal.querySelector('.demo-modal__confirm');
        const overlay = modal.querySelector('.demo-modal__overlay');

        function closeModal() {
            modal.classList.remove('demo-modal--open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        modal.classList.add('demo-modal--open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        closeBtn.onclick = closeModal;
        confirmBtn.onclick = closeModal;
        overlay.onclick = closeModal;

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }

    // --- Scroll to Top Button ---
    function initScrollToTop() {
        const btn = document.getElementById('scroll-to-top');
        let ticking = false;

        function updateVisibility() {
            const scrollY = window.scrollY || window.pageYOffset;
            if (scrollY > 300) {
                btn.classList.add('scroll-to-top-btn--visible');
                if (!btn.classList.contains('bouncing')) {
                    btn.classList.add('bouncing');
                }
            } else {
                btn.classList.remove('scroll-to-top-btn--visible');
                btn.classList.remove('bouncing');
            }
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateVisibility();
                    ticking = false;
                });
                ticking = true;
            }
        });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

function showDemoOrderModal(cartSnapshot) {
    const modal = document.getElementById('demo-order-modal');
    const continueBtn = document.getElementById('demo-order-continue');
    const overlay = modal.querySelector('.demo-order-modal__overlay');

    function closeDemo() {
        modal.classList.remove('demo-order-modal--open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    modal.classList.add('demo-order-modal--open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    overlay.onclick = closeDemo;

    continueBtn.onclick = () => {
        closeDemo();
        showToast('سفارش شما ثبت شد!', 'success');
        Cart.clearCart();
        closeCartDrawer();
    };
}
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();