(function () {
    const overlay = document.querySelector('.loader-overlay');
    const returnBtn = document.querySelector('a[aria-label="Retour vers Plinkk"]');
    if (!overlay && !returnBtn) return;
    const loader = overlay.querySelector('.loader');
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function hideLoader(options = {}) {
        const { immediate = false } = options;
        if (overlay.dataset.hidden === 'true') return;
        overlay.dataset.hidden = 'true';

        if (immediate || prefersReduced) {
            overlay.style.display = 'none';
            if (returnBtn) returnBtn.style.display = 'none';
            removeFromDom();
            return;
        }

        overlay.style.transition = 'opacity 300ms ease, visibility 300ms';
        overlay.style.opacity = '1';
        loader.offsetWidth;
        overlay.style.opacity = '0';
        const onEnd = function () {
            overlay.removeEventListener('transitionend', onEnd);
            removeFromDom();
        };
        overlay.addEventListener('transitionend', onEnd);
        setTimeout(() => {
            if (document.body.contains(overlay)) removeFromDom();
        }, 600);
    }

    function removeFromDom() {
        if (!overlay.parentNode) return;
        try {
            overlay.parentNode.removeChild(overlay);
        } catch (e) {}
    }

    if (document.readyState === 'complete') {
        hideLoader();
    } else {
        window.addEventListener('load', () => hideLoader());
    }

    function onKey(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            hideLoader({ immediate: true });
        }
    }
    window.addEventListener('keydown', onKey, { passive: true });

    const FALLBACK_TIMEOUT = 5000; // ms
    const fallbackTimer = setTimeout(() => {
        hideLoader();
    }, FALLBACK_TIMEOUT);

    const observer = new MutationObserver(() => {
        if (!document.body.contains(overlay)) {
            clearTimeout(fallbackTimer);
            observer.disconnect();
            window.removeEventListener('keydown', onKey);
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();