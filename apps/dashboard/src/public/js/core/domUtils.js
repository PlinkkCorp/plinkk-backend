export function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'text') {
            el.textContent = value;
        } else if (key === 'html') {
            el.innerHTML = value;
        } else if (key === 'class' || key === 'className') {
            el.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key === 'dataset' && typeof value === 'object') {
            Object.assign(el.dataset, value);
        } else {
            el.setAttribute(key, value);
        }
    }
    
    if (children) {
        const childArray = Array.isArray(children) ? children : [children];
        for (const child of childArray) {
            if (child instanceof Node) {
                el.appendChild(child);
            } else if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            }
        }
    }
    
    return el;
}

export const el = createElement;

export function createFragment(elements) {
    const fragment = document.createDocumentFragment();
    elements.forEach(element => {
        if (element instanceof Node) {
            fragment.appendChild(element);
        }
    });
    return fragment;
}

export function qs(selector, parent = document) {
    return parent.querySelector(selector);
}

export function qsa(selector, parent = document) {
    return parent.querySelectorAll(selector);
}

export function toggleClass(el, className, condition) {
    if (condition) {
        el.classList.add(className);
    } else {
        el.classList.remove(className);
    }
}

export function clearChildren(el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}

export function hide(el) {
    if (el) el.style.display = 'none';
}

export function show(el, display = 'block') {
    if (el) el.style.display = display;
}

export default {
    createElement,
    el,
    createFragment,
    qs,
    qsa,
    toggleClass,
    clearChildren,
    hide,
    show
};
