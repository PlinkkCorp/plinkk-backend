// Module de pagination réutilisable
// Exporte une fonction createPaginator(container, options)
// options: { pageSize, selectors: { items: string, prev, next, current, total }, onRender: function(pageItems, meta) }

(function(global){
  function createPaginator(root, opts){
    let pageSize = (opts && opts.pageSize) || 21;
    const selectors = (opts && opts.selectors) || {};
    const itemsSelector = selectors.items || 'li';
    const onRender = opts.onRender || function(){};
    const urlParamName = (opts && opts.urlParamName) || 'page';

    let items = Array.from(root.querySelectorAll(itemsSelector));
    let filtered = items.slice();
    let currentPage = 1;

    // url sync helpers
    function getPageFromUrl(){
      try{
        const params = new URLSearchParams(window.location.search);
        const p = parseInt(params.get(urlParamName), 10);
        return (!isNaN(p) && p > 0) ? p : null;
      }catch(e){ return null; }
    }

    function updateUrlWithPage(page, push){
      try{
        const url = new URL(window.location.href);
        const params = url.searchParams;
        if (page && page > 1) params.set(urlParamName, String(page));
        else params.delete(urlParamName);
        url.search = params.toString();
        if (push) window.history.pushState({[urlParamName]: page}, '', url.toString());
        else window.history.replaceState({[urlParamName]: page}, '', url.toString());
      }catch(e){ /* ignore */ }
    }

    // react to back/forward
    window.addEventListener('popstate', () => {
      const p = getPageFromUrl();
      if (p) {
        currentPage = p;
      } else {
        currentPage = 1;
      }
      render();
    });

    // initial page from url (before first render)
    const initial = getPageFromUrl();
    if (initial) currentPage = initial;

    // build controls if not present
    let controls = root.querySelector('.paginator-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'paginator-controls mt-4 flex items-center gap-3';
    controls.innerHTML = `
      <style>
        /* Masquer les flèches du input number pour Chrome/Safari */
        .paginator-controls [data-role="current"]::-webkit-outer-spin-button,
        .paginator-controls [data-role="current"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        /* Masquer pour Firefox */
        .paginator-controls [data-role="current"] {
          -moz-appearance: textfield;
          appearance: textfield;
        }
      </style>

      <div class="flex items-center gap-3 w-full">
        <div class="flex gap-2 items-center">
        <button data-role="first" class="paginator-first px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700 text-sm" aria-label="Première page" title="Première">«</button>
        <button data-role="prev" class="paginator-prev px-3 py-1 rounded-md bg-slate-800/60 border border-slate-700 text-sm" aria-label="Page précédente" title="Précédente">Préc</button>
        </div>

        <div class="flex items-center gap-2 text-sm text-slate-400">
        <span>Page</span>
        <input data-role="current" type="number" min="1" value="1" class="w-12 text-center bg-transparent border-b border-slate-700 focus:outline-none" aria-label="Numéro de page"/>
        <span>/</span>
        <span data-role="total">1</span>
        </div>

        <div class="flex gap-2 items-center ml-auto">
        <label class="text-sm text-slate-400 flex items-center gap-2">
          <span class="hidden sm:inline">Par page</span>
          <select data-role="pagesize" class="bg-slate-800/60 border border-slate-700 rounded-md px-2 py-1 text-sm">
            <option value="9">9</option>
            <option value="21" selected>21</option>
            <option value="60">60</option>
          </select>
        </label>

        <button data-role="next" class="paginator-next px-3 py-1 rounded-md bg-slate-800/60 border border-slate-700 text-sm" aria-label="Page suivante" title="Suivante">Suiv</button>
        <button data-role="last" class="paginator-last px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700 text-sm" aria-label="Dernière page" title="Dernière">»</button>
        </div>
      </div>
    `;
      root.parentNode.insertBefore(controls, root.nextSibling);
    }

    const btnPrev = controls.querySelector(selectors.prev || '[data-role="prev"]');
    const btnNext = controls.querySelector(selectors.next || '[data-role="next"]');
    const elCurrent = controls.querySelector(selectors.current || '[data-role="current"]');
    const elTotal = controls.querySelector(selectors.total || '[data-role="total"]');

    function updateMeta(){
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      if (elCurrent) {
        // update input value for inputs, otherwise update text content
        if (elCurrent.tagName === 'INPUT') elCurrent.value = String(currentPage);
        else elCurrent.textContent = String(currentPage);
      }
      if (elTotal) elTotal.textContent = String(totalPages);
      if (btnPrev) btnPrev.disabled = currentPage <= 1;
      if (btnNext) btnNext.disabled = currentPage >= totalPages;
    }

    function render(){
      const start = (currentPage -1) * pageSize;
      const end = start + pageSize;
      items.forEach(i => i.style.display = 'none');
      filtered.forEach((i, idx) => {
        i.style.display = (idx >= start && idx < end) ? '' : 'none';
      });
      onRender(filtered.slice(start, end), { currentPage, pageSize, totalItems: filtered.length });
      updateMeta();
      // update url (replace state to avoid flooding history on initial renders)
      updateUrlWithPage(currentPage, false);
    }

    // wire current page input (if present) and page size selector
    if (elCurrent) {
      if (elCurrent.tagName === 'INPUT') {
        elCurrent.addEventListener('change', () => {
          let n = parseInt(elCurrent.value, 10);
          if (isNaN(n) || n < 1) n = 1;
          currentPage = n;
          updateUrlWithPage(currentPage, true);
          render();
        });
        elCurrent.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            let n = parseInt(elCurrent.value, 10);
            if (isNaN(n) || n < 1) n = 1;
            currentPage = n;
            updateUrlWithPage(currentPage, true);
            render();
          }
        });
      }
    }

    const elPageSize = controls.querySelector('[data-role="pagesize"]');
    if (elPageSize) {
      elPageSize.addEventListener('change', () => {
        const val = parseInt(elPageSize.value, 10);
        if (!isNaN(val) && val > 0) {
          pageSize = val;
          currentPage = 1;
          updateUrlWithPage(currentPage, true);
          render();
        }
      });
    }

    function setFiltered(list){ filtered = list.slice(); currentPage = 1; render(); }
    function sortWith(compareFn){
      // reorder items in DOM according to compareFn
      const sorted = items.slice().sort(compareFn);
      const frag = document.createDocumentFragment();
      sorted.forEach(i => frag.appendChild(i));
      root.appendChild(frag);
      items = Array.from(root.querySelectorAll(itemsSelector));
      // re-apply filter using current filter criteria
      setFiltered(filtered);
    }

  const btnFirst = controls.querySelector('[data-role="first"]');
  const btnLast = controls.querySelector('[data-role="last"]');
  if (btnPrev) btnPrev.addEventListener('click', () => { if (currentPage>1) { currentPage--; updateUrlWithPage(currentPage, true); render(); } });
  if (btnNext) btnNext.addEventListener('click', () => { const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)); if (currentPage<totalPages) { currentPage++; updateUrlWithPage(currentPage, true); render(); } });
  if (btnFirst) btnFirst.addEventListener('click', () => { if (currentPage !== 1) { currentPage = 1; updateUrlWithPage(currentPage, true); render(); } });
  if (btnLast) btnLast.addEventListener('click', () => { const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)); if (currentPage !== totalPages) { currentPage = totalPages; updateUrlWithPage(currentPage, true); render(); } });

    // public API
    return {
      render,
      setFiltered,
      getFiltered: () => filtered.slice(),
      getAll: () => items.slice(),
  goToPage: (n, push) => { currentPage = Math.max(1, Math.floor(n)); updateUrlWithPage(currentPage, !!push); render(); },
      next: () => { const total = Math.max(1, Math.ceil(filtered.length / pageSize)); if (currentPage < total) { currentPage++; render(); } },
      prev: () => { if (currentPage > 1) { currentPage--; render(); } },
      sort: sortWith,
      pageSize
    };
  }

  // expose
  global.__PlinkkPaginator = { createPaginator };
})(window);
