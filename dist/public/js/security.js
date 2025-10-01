export function isSafeUrl(url) {
    if (typeof url !== "string") return false;
    const s = url.trim();
    // Autoriser les data URLs d'images (avatar, favicon, etc.)
    if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(s)) return true;
    // Autoriser les URLs relatives au même domaine (ex: /public/uploads/...)
    if (s.startsWith('/')) return true;
    // Autoriser http/https explicites
    return /^https?:\/\//i.test(s);
}
// Empêche l'injection de HTML (XSS) en forçant l'utilisation de textContent
export function setSafeText(element, text) {
    element.textContent = typeof text === "string" ? text : "";
}
// Valide les couleurs CSS pour éviter les injections de code CSS malicieux
export function isSafeColor(color) {
    return /^#[0-9A-Fa-f]{3,8}$/.test(color) || /^(rgb|rgba|hsl|hsla)\(/.test(color);
}
// Limite la taille d'un texte pour éviter les attaques DoS ou les débordements d'UI
export function limitTextLength(text, maxLength) {
    if (typeof text !== "string")
        return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}
// Désactive le drag & drop sur une image pour éviter certains détournements
export function disableDrag(imgElement) {
    if (imgElement instanceof HTMLImageElement) {
        imgElement.draggable = false;
    }
}
// Nettoie une URL pour éviter les caractères spéciaux dangereux
export function sanitizeUrl(url) {
    try {
        if (typeof url !== 'string') return '#';
        const s = url.trim();
        // Conserver les chemins relatifs et data URLs tels quels
        if (s.startsWith('/') || s.startsWith('data:')) return s;
        const u = new URL(s);
        return u.href;
    }
    catch (_a) {
        return "#";
    }
}
// Empêche le clic droit sur les images (anti-vol basique)
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
