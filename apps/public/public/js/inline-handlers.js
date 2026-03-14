(function () {
  function stripQuotes(s){ return String(s).replace(/^\s*['"]?|['"]?\s*$/g,''); }

  document.addEventListener('DOMContentLoaded', function () {
    // Handle declarative `data-action` attributes first
    function handleAction(el, action) {
      try {
        var parts = action.split(':');
        var verb = parts[0];
        var arg = parts.slice(1).join(':');
        if (verb === 'toggle') {
          var target = document.querySelector(arg);
          if (target) {
            target.classList.toggle('hidden');
            // update button text if caller is a button/link and toggles details
            if (el && (el.tagName === 'BUTTON' || el.tagName === 'A')) {
              try {
                var isHidden = target.classList.contains('hidden');
                if (isHidden) el.textContent = 'Voir les détails techniques';
                else el.textContent = 'Masquer les détails';
              } catch (e) {}
            }
          }
        } else if (verb === 'show') {
          var t = document.querySelector(arg); if (t) t.classList.remove('hidden');
        } else if (verb === 'hide') {
          var t2 = document.querySelector(arg); if (t2) t2.classList.add('hidden');
        } else if (verb === 'open') {
          window.open && window.open(arg, '_blank');
        } else if (verb === 'reload') {
          window.location.reload();
        } else if (verb === 'copy') {
          try {
            if (arg && arg[0] === '#') {
              var elTarget = document.querySelector(arg);
              if (elTarget) navigator.clipboard.writeText(elTarget.textContent || '');
            } else {
              navigator.clipboard.writeText(arg || '');
            }
          } catch (e) {}
        } else if (verb === 'openSupportModal') {
          window.openSupportModal && window.openSupportModal(arg || '');
        } else if (verb === 'completeQuest') {
          window.completeQuest && window.completeQuest(null, arg);
        } else if (verb === 'prevent-submit') {
          el.addEventListener('submit', function (e) { e.preventDefault(); });
          return; // already bound to submit
        }
        // bind generic click for other verbs
        if (!el._actionBound) {
          el._actionBound = true;
        }
      } catch (e) {}
    }

    document.querySelectorAll('[data-action]').forEach(function (el) {
      var spec = el.getAttribute('data-action') || '';
      if (!spec) return;
      // multiple actions separated by space
      var actions = spec.split(/\s+/);
      actions.forEach(function (a) {
        el.addEventListener('click', function (e) { handleAction(el, a); });
      });
    });

    // Convert remaining common onclick attributes to proper event listeners (fallback)
    document.querySelectorAll('[onclick]').forEach(function (el) {
      var code = (el.getAttribute('onclick') || '').trim();
      if (!code) return;

      try {
        // openSupportModal('...')
        var m = code.match(/^openSupportModal\((.*)\)$/);
        if (m) {
          var arg = stripQuotes(m[1]);
          el.addEventListener('click', function (e) { window.openSupportModal && window.openSupportModal(arg); e.preventDefault(); });
          el.removeAttribute('onclick');
          return;
        }

        // completeQuest(event, 'id')
        m = code.match(/^completeQuest\(event,\s*'([^']+)'\)$/);
        if (m) {
          var id = m[1];
          el.addEventListener('click', function (e) { window.completeQuest && window.completeQuest(e, id); });
          el.removeAttribute('onclick');
          return;
        }

        // window.open('url', '_blank') or window.open('url')
        m = code.match(/^window\.open\('\s*([^']+?)\s*'/);
        if (m) {
          var url = m[1];
          el.addEventListener('click', function (e) { window.open(url, '_blank'); });
          el.removeAttribute('onclick');
          return;
        }

        // show/hide #plinkkSelectorModal
        if (code.indexOf("document.getElementById('plinkkSelectorModal')") !== -1) {
          if (code.indexOf("remove('hidden')") !== -1) {
            el.addEventListener('click', function () { var m = document.getElementById('plinkkSelectorModal'); m && m.classList.remove('hidden'); });
            el.removeAttribute('onclick');
            return;
          }
          if (code.indexOf("add('hidden')") !== -1) {
            el.addEventListener('click', function () { var m = document.getElementById('plinkkSelectorModal'); m && m.classList.add('hidden'); });
            el.removeAttribute('onclick');
            return;
          }
        }

        // reload
        if (/^window\.location\.reload\(\)/.test(code)) {
          el.addEventListener('click', function () { window.location.reload(); });
          el.removeAttribute('onclick');
          return;
        }

        // clipboard writeText(...)
        m = code.match(/navigator\.clipboard\.writeText\((.+)\)/);
        if (m) {
          var arg = m[1].trim();
          var text = stripQuotes(arg);
          el.addEventListener('click', function () { try { navigator.clipboard.writeText(text); } catch (e) {} });
          el.removeAttribute('onclick');
          return;
        }

        // Fallback: attach code as function (unsafe) — try to avoid
        // keep attribute in place as last resort
      } catch (e) {
        // ignore
      }
    });

    // Images: replicate common onload/onerror behavior used in avatars
    document.querySelectorAll('img[onload]').forEach(function (img) {
      img.addEventListener('load', function () {
        try {
          this.classList.remove('opacity-0');
          if (this.parentElement) this.parentElement.classList.remove('animate-pulse', 'bg-slate-800');
        } catch (e) {}
      });
      img.removeAttribute('onload');
    });

    document.querySelectorAll('img[onerror]').forEach(function (img) {
      img.addEventListener('error', function () {
        try {
          this.onerror = null;
          this.style.display = 'none';
          if (this.parentElement) this.parentElement.classList.remove('animate-pulse', 'bg-slate-800');
          var initial = this.getAttribute('data-initial');
          if (this.parentNode && initial) this.parentNode.textContent = initial;
        } catch (e) {}
      });
      img.removeAttribute('onerror');
    });
  });
})();
