// =============================================
// scripts/utils.js - Utility Functions
// =============================================

/**
 * Format a number as a Persian price string with تومان suffix.
 * @param {number} price - The price value
 * @returns {string} Formatted price string
 */
function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) return '۰ تومان';
    const formatted = price.toLocaleString('fa-IR');
    return `${formatted} تومان`;
}

/**
 * Format a number as a compact Persian price (without suffix).
 * @param {number} price
 * @returns {string}
 */
function formatPriceCompact(price) {
    if (typeof price !== 'number' || isNaN(price)) return '۰';
    return price.toLocaleString('fa-IR');
}

/**
 * Debounce a function call.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay = 250) {
    let timer = null;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Generate a simple unique ID.
 * @returns {string} Unique ID string
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Escape HTML to prevent XSS in rendered content.
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

/**
 * Check if the device supports touch events.
 * @returns {boolean}
 */
function isTouchDevice() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

/**
 * Get the cart data from localStorage.
 * @returns {object} Cart data object
 */
function getStoredCart() {
    try {
        const stored = localStorage.getItem('tab_doner_cart');
        return stored ? JSON.parse(stored) : { items: [], updatedAt: null };
    } catch (e) {
        return { items: [], updatedAt: null };
    }
}

/**
 * Save cart data to localStorage.
 * @param {object} cartData
 */
function setStoredCart(cartData) {
    try {
        cartData.updatedAt = Date.now();
        localStorage.setItem('tab_doner_cart', JSON.stringify(cartData));
    } catch (e) {
        // localStorage might be full or unavailable
        console.warn('Could not save cart to localStorage:', e);
    }
}

/**
 * Clear cart data from localStorage.
 */
function clearStoredCart() {
    try {
        localStorage.removeItem('tab_doner_cart');
    } catch (e) {
        console.warn('Could not clear cart from localStorage:', e);
    }
}

/**
 * Clamp a number between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Trigger a custom event on an element.
 * @param {HTMLElement} el
 * @param {string} eventName
 * @param {object} detail
 */
function triggerEvent(el, eventName, detail = {}) {
    el.dispatchEvent(new CustomEvent(eventName, { bubbles: true, detail }));
}