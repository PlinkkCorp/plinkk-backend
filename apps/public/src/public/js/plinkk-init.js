(function () {
  try {
    // Read JSON data injected in the page
    const u = document.getElementById('plinkk-ctx-username')?.textContent || '';
    const s = document.getElementById('plinkk-ctx-identifier')?.textContent || '';
    const pid = document.getElementById('plinkk-page-id')?.textContent || '';

    try {
      window.__PLINKK_USERNAME__ = JSON.parse(u || '""');
    } catch (_) { window.__PLINKK_USERNAME__ = ''; }
    try {
      window.__PLINKK_IDENTIFIER__ = JSON.parse(s || '""');
    } catch (_) { window.__PLINKK_IDENTIFIER__ = ''; }

    // Export mode provided via body data attribute to avoid inline scripts
    window.__PLINKK_EXPORT_MODE__ = (document.body.dataset.export === 'true');
    window.__PLINKK_IS_PREVIEW__ = (new URLSearchParams(location.search).get('preview') === '1');

    if (!window.__PLINKK_IDENTIFIER__) {
      try {
        const parts = location.pathname.split('/').filter(Boolean);
        if (parts[1] === '0') window.__PLINKK_IDENTIFIER__ = '';
      } catch (_) { }
    }

    // Tracking: localStorage-based simple view + click tracking
    try {
      const pageId = JSON.parse(pid || '""');
      if (pageId) {
        const isPreview = window.__PLINKK_IS_PREVIEW__;
        const ttl = isPreview ? 1000 : 10000; // 1s en preview, 10s sinon

        const viewKey = `plinkk_view_${pageId}`;
        const lastView = localStorage.getItem(viewKey);
        const now = Date.now();

        if (!lastView || now - parseInt(lastView, 10) > ttl) {
          fetch(`/api/track-view/${pageId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
            .then(() => localStorage.setItem(viewKey, String(now)))
            .catch(() => {});
        }

        document.addEventListener('click', function (e) {
          const link = e.target.closest && e.target.closest('a[href^="/click/"]');
          if (!link) return;

          const href = link.getAttribute('href');
          const match = href?.match(/^\/click\/([^/?&#]+)/);
          if (!match) return;

          const linkId = match[1];
          const clickKey = `plinkk_click_${linkId}`;
          const lastClick = localStorage.getItem(clickKey);
          const now2 = Date.now();

          if (lastClick && now2 - parseInt(lastClick, 10) <= ttl) return;

          e.preventDefault();
          fetch(`/api/track-click/${linkId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
            .then(res => res.json())
            .then(data => {
              localStorage.setItem(clickKey, String(now2));
              if (data.url) window.location.href = data.url;
            })
            .catch(() => { window.location.href = href; });
        });
      }
    } catch (err) {
      console.warn('Tracking initialization failed:', err);
    }
  } catch (err) {
    // swallow any error to avoid breaking page
    console.warn('Plinkk init failed', err);
  }
})();
