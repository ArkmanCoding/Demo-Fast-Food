// =============================================
// scripts/cart.js - Cart State Management
// =============================================

const Cart = (function () {
    let _items = [];
    let _listeners = [];

    function init() {
        const stored = getStoredCart();
        _items = Array.isArray(stored.items) ? stored.items : [];
        _notify();
    }

    function subscribe(callback) {
        _listeners.push(callback);
        return () => {
            _listeners = _listeners.filter(l => l !== callback);
        };
    }

    function _notify() {
        const snapshot = getSnapshot();
        _listeners.forEach(cb => {
            try { cb(snapshot); } catch (e) { }
        });
    }

    function _persist() {
        setStoredCart({ items: _items });
    }

    function getSnapshot() {
        const totalItems = _items.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = _items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return {
            items: [..._items],
            totalItems,
            subtotal,
            total: subtotal,
            isEmpty: _items.length === 0,
        };
    }

    function addItem(product, quantity = 1) {
        const existingIndex = _items.findIndex(item => item.id === product.id);
        if (existingIndex >= 0) {
            _items[existingIndex].quantity += quantity;
        } else {
            _items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image || '',
                quantity: quantity,
                addedAt: Date.now(),
            });
        }
        _persist();
        _notify();
    }

    function removeItem(productId) {
        _items = _items.filter(item => item.id !== productId);
        _persist();
        _notify();
    }

    function updateQuantity(productId, newQuantity) {
        const qty = Math.max(0, Math.floor(newQuantity));
        if (qty === 0) {
            removeItem(productId);
            return;
        }
        const item = _items.find(i => i.id === productId);
        if (item) {
            item.quantity = qty;
            _persist();
            _notify();
        }
    }

    function incrementItem(productId) {
        const item = _items.find(i => i.id === productId);
        if (item) {
            updateQuantity(productId, item.quantity + 1);
        }
    }

    function decrementItem(productId) {
        const item = _items.find(i => i.id === productId);
        if (item) {
            updateQuantity(productId, item.quantity - 1);
        }
    }

    function getItemQuantity(productId) {
        const item = _items.find(i => i.id === productId);
        return item ? item.quantity : 0;
    }

    function hasItem(productId) {
        return _items.some(i => i.id === productId);
    }

    function clearCart() {
        _items = [];
        _persist();
        _notify();
    }

    init();

    return {
        subscribe,
        getSnapshot,
        addItem,
        removeItem,
        updateQuantity,
        incrementItem,
        decrementItem,
        getItemQuantity,
        hasItem,
        clearCart,
    };
})();