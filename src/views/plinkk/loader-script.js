(function () {
    // Use the overlay as the element to hide/remove so the whole screen is covered
    const overlay = document.querySelector('.loader-overlay');
    const returnBtn = document.querySelector('a[aria-label="Retour vers Plinkk"]');
    if (!overlay && !returnBtn) return;
    const loader = overlay.querySelector('.loader');

    // Utility: detect prefers-reduced-motion
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Fade out function
    function hideLoader(options = {}) {
        const { immediate = false } = options;
        if (overlay.dataset.hidden === 'true') return;
        overlay.dataset.hidden = 'true';

        if (immediate || prefersReduced) {
            // Remove immediately to avoid animation
            overlay.style.display = 'none';
            if (returnBtn) returnBtn.style.display = 'none';
            removeFromDom();
            return;
        }

        // Gentle fade-out using CSS transition on the overlay
        overlay.style.transition = 'opacity 300ms ease, visibility 300ms';
        overlay.style.opacity = '1';
        // trigger reflow
        // eslint-disable-next-line no-unused-expressions
        loader.offsetWidth;
        overlay.style.opacity = '0';
        // after transition end, remove from DOM
        const onEnd = function () {
            overlay.removeEventListener('transitionend', onEnd);
            removeFromDom();
        };
        overlay.addEventListener('transitionend', onEnd);
        // Safety fallback: if transitionend doesn't fire
        setTimeout(() => {
            if (document.body.contains(overlay)) removeFromDom();
        }, 600);
    }

    function removeFromDom() {
        if (!overlay.parentNode) return;
        try {
            overlay.parentNode.removeChild(overlay);
        } catch (e) {
            // ignore
        }
    }

    // When the page is fully loaded, hide the loader
    if (document.readyState === 'complete') {
        hideLoader();
    } else {
        window.addEventListener('load', () => hideLoader());
    }

    // Allow dismiss with Escape
    function onKey(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            hideLoader({ immediate: true });
        }
    }
    window.addEventListener('keydown', onKey, { passive: true });

    // Fallback timeout in case load never fires (e.g., SPA navigation)
    const FALLBACK_TIMEOUT = 5000; // ms
    const fallbackTimer = setTimeout(() => {
        hideLoader();
    }, FALLBACK_TIMEOUT);

    // Clear fallback if loader removed earlier
    const observer = new MutationObserver(() => {
        if (!document.body.contains(overlay)) {
            clearTimeout(fallbackTimer);
            observer.disconnect();
            window.removeEventListener('keydown', onKey);
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();