export function isSafeUrl(url) {
    if (typeof url !== "string") return false;
    const s = url.trim();
    if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(s)) return true;
    if (s.startsWith('/')) return true;
    return /^https?:\/\//i.test(s);
}

export function setSafeText(element, text) {
    element.textContent = typeof text === "string" ? text : "";
}

export function isSafeColor(color) {
    return /^#[0-9A-Fa-f]{3,8}$/.test(color) || /^(rgb|rgba|hsl|hsla)\(/.test(color);
}

export function limitTextLength(text, maxLength) {
    if (typeof text !== "string")
        return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}

export function disableDrag(imgElement) {
    if (imgElement instanceof HTMLImageElement) {
        imgElement.draggable = false;
    }
}

export function sanitizeUrl(url) {
    try {
        if (typeof url !== 'string') return '#';
        const s = url.trim();
        if (s.startsWith('/') || s.startsWith('data:')) return s;
        const u = new URL(s);
        return u.href;
    }
    catch (_a) {
        return "#";
    }
}

export function disableContextMenuOnImage(imgElement) {
    if (imgElement instanceof HTMLImageElement) {
        imgElement.addEventListener("contextmenu", e => e.preventDefault());
    }
}
export default {
    isSafeUrl,
    setSafeText,
    isSafeColor,
    limitTextLength
};
