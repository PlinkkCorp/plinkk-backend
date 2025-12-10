const listenersMap = new WeakMap();

export function addTrackedListener(element, event, handler, options = {}) {
    if (!element) return;
    
    let elementListeners = listenersMap.get(element);
    if (!elementListeners) {
        elementListeners = [];
        listenersMap.set(element, elementListeners);
    }
    
    const existing = elementListeners.find(l => l.event === event && l.handler === handler);
    if (existing) return;
    
    element.addEventListener(event, handler, options);
    elementListeners.push({ event, handler, options });
}

export function removeTrackedListeners(element, eventType = null) {
    if (!element) return;
    
    const listeners = listenersMap.get(element);
    if (!listeners) return;
    
    const toRemove = eventType 
        ? listeners.filter(l => l.event === eventType)
        : listeners;
    
    toRemove.forEach(({ event, handler, options }) => {
        element.removeEventListener(event, handler, options);
    });
    
    if (eventType) {
        listenersMap.set(element, listeners.filter(l => l.event !== eventType));
    } else {
        listenersMap.delete(element);
    }
}

export function delegate(parent, event, selector, handler) {
    if (!parent) return;
    
    const delegatedHandler = (e) => {
        const target = e.target.closest(selector);
        if (target && parent.contains(target)) {
            handler(e, target);
        }
    };
    
    addTrackedListener(parent, event, delegatedHandler);
    return delegatedHandler;
}

export function addHoverListeners(element, onEnter, onLeave) {
    if (!element) return;
    
    removeTrackedListeners(element, 'mouseenter');
    removeTrackedListeners(element, 'mouseleave');
    
    addTrackedListener(element, 'mouseenter', onEnter);
    addTrackedListener(element, 'mouseleave', onLeave);
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

export function onReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

export default {
    addTrackedListener,
    removeTrackedListeners,
    delegate,
    addHoverListeners,
    debounce,
    throttle,
    onReady
};
