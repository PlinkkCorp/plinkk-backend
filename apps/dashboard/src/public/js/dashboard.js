/*
 Frontend logic for Plinkk dashboard editor (Monaco + JSON config)
*/
(function () {
  const saveBtn = document.getElementById("saveBtn");
  const formatBtn = document.getElementById("formatBtn");
  const saveStatus = document.getElementById("saveStatus");
  const preview = document.getElementById("preview");
  const refreshPreview = document.getElementById("refreshPreview");

  let editor;
  let latestValue = "{}";

  function setStatus(text, type) {
    saveStatus.textContent = text || "";
    saveStatus.className = `text-xs ${
      type === "error"
        ? "text-red-400"
        : type === "success"
        ? "text-emerald-400"
        : "text-slate-400"
    }`;
  }

  function loadConfig() {
    return fetch("/api/me/config").then(async (r) => {
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    });
  }

  function saveConfig(obj) {
    return fetch("/api/me/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(obj),
    }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    });
  }

  function toJSON(value) {
    try {
      return [JSON.parse(value), null];
    } catch (e) {
      return [null, e];
    }
  }

  function bootstrapMonaco(initial) {
    if (!window.require) return;
    window.require(["vs/editor/editor.main"], function () {
      editor = monaco.editor.create(document.getElementById("editor"), {
        value: JSON.stringify(initial, null, 2),
        language: "json",
        theme: "vs-dark",
        automaticLayout: true,
        minimap: { enabled: false },
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        tabSize: 2,
        formatOnPaste: true,
        formatOnType: true,
      });
      latestValue = editor.getValue();

      formatBtn?.addEventListener("click", () => {
        if (!editor) return;
        const model = editor.getModel();
        if (!model) return;
        const fullRange = model.getFullModelRange();
        const text = editor.getValue();
        const [obj, err] = toJSON(text);
        if (err) {
          setStatus("JSON invalide: " + err.message, "error");
          return;
        }
        editor.executeEdits("format", [
          { range: fullRange, text: JSON.stringify(obj, null, 2) },
        ]);
        setStatus("Formaté", "");
      });

      saveBtn?.addEventListener("click", async () => {
        if (!editor) return;
        const value = editor.getValue();
        const [obj, err] = toJSON(value);
        if (err) {
          setStatus("JSON invalide: " + err.message, "error");
          return;
        }
        setStatus("Enregistrement...", "");
        try {
          await saveConfig(obj);
          latestValue = value;
          setStatus("Enregistré ✓", "success");
          // Option: rafraîchir l'aperçu automatiquement
          if (preview) {
            const url = new URL(preview.src, window.location.origin);
            url.searchParams.set("t", Date.now().toString());
            preview.src = url.toString();
          }
        } catch (e) {
          setStatus("Erreur: " + (e?.message || ""), "error");
        }
      });

      refreshPreview?.addEventListener("click", () => {
        if (!preview) return;
        const url = new URL(preview.src, window.location.origin);
        url.searchParams.set("t", Date.now().toString());
        preview.src = url.toString();
      });
    });
  }

  // Initial load
  setStatus("Chargement de la configuration...", "");
  loadConfig()
    .then((cfg) => {
      setStatus("Configuration chargée", "success");
      bootstrapMonaco(cfg);
    })
    .catch((e) => {
      setStatus("Impossible de charger la configuration: " + (e?.message || ""), "error");
      bootstrapMonaco({});
    });
})();
