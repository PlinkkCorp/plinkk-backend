/**
 * Module d'édition inline pour Plinkk
 * Permet l'édition directe des éléments dans l'iframe en mode preview
 */

const EDIT_MODE_CLASS = 'plinkk-edit-mode';
const EDITABLE_CLASS = 'plinkk-editable';
const EDITING_CLASS = 'plinkk-editing';

// Éléments éditables et leur mapping vers les champs de config
const EDITABLE_SELECTORS = {
  userName: {
    selector: '#profile-article > h1',
    type: 'text',
    field: 'userName',
    placeholder: 'Votre nom'
  },
  description: {
    selector: '.email-description-container .description, .email-description-container p:not(.email a)',
    type: 'textarea',
    field: 'description',
    placeholder: 'Votre description'
  },
  email: {
    selector: '.email-description-container .email a',
    type: 'text',
    field: 'affichageEmail',
    placeholder: 'votre@email.com'
  },
  profileSiteText: {
    selector: '.profile-link p, .profile-link-text',
    type: 'text',
    field: 'profileSiteText',
    placeholder: 'Texte du site'
  }
};

let isEditMode = false;
let currentEditingElement = null;
let originalValues = {};

/**
 * Initialise le mode édition si on est en preview
 */
export function initInlineEdit() {
  const isPreview = window.__PLINKK_IS_PREVIEW__ === true || 
    new URLSearchParams(window.location.search).get('preview') === '1';
  
  if (!isPreview) return;
  
  // Vérifier si c'est le propriétaire
  const isOwner = window.__PLINKK_IS_OWNER__ === true;
  if (!isOwner) return;

  // Écouter les messages du parent (dashboard)
  window.addEventListener('message', handleParentMessage);
  
  // Injecter les styles d'édition
  injectEditStyles();
  
  // Activer automatiquement le mode édition
  setTimeout(() => {
    enableEditMode();
    notifyParent({ type: 'plinkk:iframe-ready' });
  }, 200);
  
  console.log('[Plinkk] Mode édition inline initialisé');
}

/**
 * Gère les messages du dashboard parent
 */
function handleParentMessage(event) {
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  
  switch (data.type) {
    case 'plinkk:enable-edit':
      enableEditMode();
      break;
    case 'plinkk:disable-edit':
      disableEditMode();
      break;
    case 'plinkk:update-field':
      updateFieldValue(data.field, data.value);
      break;
    case 'plinkk:refresh':
      window.location.reload();
      break;
    case 'plinkk:get-current-values':
      sendCurrentValues();
      break;
  }
}

/**
 * Notifie le parent d'un changement
 */
function notifyParent(message) {
  if (window.parent && window.parent !== window) {
    try {
      window.parent.postMessage(message, '*');
    } catch (e) {
      console.warn('[Plinkk] postMessage failed', e);
    }
  }
}

/**
 * Active le mode édition
 */
function enableEditMode() {
  if (isEditMode) return;
  isEditMode = true;
  
  document.body.classList.add(EDIT_MODE_CLASS);
  
  // Sauvegarder les valeurs originales
  saveOriginalValues();
  
  // Rendre les éléments éditables
  Object.entries(EDITABLE_SELECTORS).forEach(([key, config]) => {
    const elements = document.querySelectorAll(config.selector);
    elements.forEach(el => {
      if (el) {
        setupEditableElement(el, key, config);
      }
    });
  });
  
  // Rendre les liens éditables
  setupEditableLinks();
  
  // Rendre les icônes sociales éditables
  setupEditableSocials();
  
  notifyParent({ type: 'plinkk:edit-mode-enabled' });
}

/**
 * Désactive le mode édition
 */
function disableEditMode() {
  if (!isEditMode) return;
  isEditMode = false;
  
  document.body.classList.remove(EDIT_MODE_CLASS);
  
  // Retirer les attributs éditables
  document.querySelectorAll(`.${EDITABLE_CLASS}`).forEach(el => {
    el.classList.remove(EDITABLE_CLASS, EDITING_CLASS);
    el.removeAttribute('contenteditable');
    el.removeAttribute('data-plinkk-field');
    el.style.outline = '';
    el.style.outlineOffset = '';
  });
  
  // Retirer la toolbar
  const toolbar = document.querySelector('.plinkk-edit-toolbar');
  if (toolbar) toolbar.remove();
  
  notifyParent({ type: 'plinkk:edit-mode-disabled' });
}

/**
 * Sauvegarde les valeurs originales
 */
function saveOriginalValues() {
  Object.entries(EDITABLE_SELECTORS).forEach(([key, config]) => {
    const element = document.querySelector(config.selector);
    if (element) {
      originalValues[config.field] = getElementText(element);
    }
  });
}

/**
 * Récupère le texte d'un élément
 */
function getElementText(element) {
  // Pour les h1 avec des badges, ne récupérer que le texte principal
  if (element.tagName === 'H1') {
    const clone = element.cloneNode(true);
    clone.querySelectorAll('.badge').forEach(b => b.remove());
    return clone.textContent.trim();
  }
  return element.textContent.trim();
}

/**
 * Configure un élément pour être éditable
 */
function setupEditableElement(element, key, config) {
  if (element.classList.contains(EDITABLE_CLASS)) return;
  
  element.classList.add(EDITABLE_CLASS);
  element.setAttribute('data-plinkk-field', config.field);
  element.setAttribute('data-plinkk-type', config.type);
  element.setAttribute('data-plinkk-key', key);
  
  // Gérer le clic pour l'édition
  element.addEventListener('click', handleElementClick);
  
  // Indicateur visuel au survol
  element.addEventListener('mouseenter', handleElementHover);
  element.addEventListener('mouseleave', handleElementLeave);
}

function handleElementClick(e) {
  if (!isEditMode) return;
  e.preventDefault();
  e.stopPropagation();
  
  const element = e.currentTarget;
  const key = element.getAttribute('data-plinkk-key');
  const config = EDITABLE_SELECTORS[key];
  
  if (config) {
    startEditing(element, config);
  }
}

function handleElementHover(e) {
  const element = e.currentTarget;
  if (isEditMode && !element.classList.contains(EDITING_CLASS)) {
    element.style.outline = '2px dashed rgba(139, 92, 246, 0.6)';
    element.style.outlineOffset = '4px';
    element.style.cursor = 'pointer';
  }
}

function handleElementLeave(e) {
  const element = e.currentTarget;
  if (!element.classList.contains(EDITING_CLASS)) {
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.style.cursor = '';
  }
}

/**
 * Démarre l'édition d'un élément
 */
function startEditing(element, config) {
  if (currentEditingElement) {
    finishEditing(currentEditingElement);
  }
  
  currentEditingElement = element;
  element.classList.add(EDITING_CLASS);
  element.setAttribute('contenteditable', 'true');
  element.style.outline = '2px solid rgba(139, 92, 246, 0.8)';
  element.style.outlineOffset = '4px';
  element.style.background = 'rgba(139, 92, 246, 0.1)';
  element.style.borderRadius = '4px';
  element.style.padding = '4px 8px';
  element.style.minWidth = '100px';
  element.style.minHeight = '24px';
  element.style.cursor = 'text';
  
  // Pour les h1, ne garder que le texte
  if (element.tagName === 'H1') {
    const text = getElementText(element);
    element.innerHTML = text || config.placeholder;
  }
  
  // Placer le placeholder si vide
  if (!element.textContent.trim()) {
    element.textContent = config.placeholder;
    element.style.opacity = '0.5';
  } else {
    element.style.opacity = '1';
  }
  
  element.focus();
  
  // Sélectionner tout le texte
  try {
    const range = document.createRange();
    range.selectNodeContents(element);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (e) {}
  
  // Écouter les changements
  element._inputHandler = (e) => handleEditInput(e);
  element._blurHandler = () => finishEditing(element);
  element._keydownHandler = (e) => {
    if (e.key === 'Enter' && config.type === 'text') {
      e.preventDefault();
      finishEditing(element);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing(element);
    }
  };
  
  element.addEventListener('input', element._inputHandler);
  element.addEventListener('blur', element._blurHandler);
  element.addEventListener('keydown', element._keydownHandler);
}

/**
 * Gère les entrées pendant l'édition
 */
function handleEditInput(e) {
  const element = e.target;
  element.style.opacity = '1';
  
  const field = element.getAttribute('data-plinkk-field');
  const value = element.textContent.trim();
  
  // Notifier le parent du changement en temps réel
  notifyParent({
    type: 'plinkk:field-changed',
    field: field,
    value: value,
    realtime: true
  });
}

/**
 * Termine l'édition d'un élément
 */
function finishEditing(element) {
  if (!element || !element.classList.contains(EDITING_CLASS)) return;
  
  // Nettoyer les event listeners
  if (element._inputHandler) element.removeEventListener('input', element._inputHandler);
  if (element._blurHandler) element.removeEventListener('blur', element._blurHandler);
  if (element._keydownHandler) element.removeEventListener('keydown', element._keydownHandler);
  
  element.classList.remove(EDITING_CLASS);
  element.setAttribute('contenteditable', 'false');
  element.style.outline = '';
  element.style.outlineOffset = '';
  element.style.background = '';
  element.style.borderRadius = '';
  element.style.padding = '';
  element.style.minWidth = '';
  element.style.minHeight = '';
  element.style.opacity = '1';
  element.style.cursor = '';
  
  const field = element.getAttribute('data-plinkk-field');
  const value = element.textContent.trim();
  
  // Notifier le parent de la valeur finale
  notifyParent({
    type: 'plinkk:field-changed',
    field: field,
    value: value,
    realtime: false
  });
  
  currentEditingElement = null;
}

/**
 * Annule l'édition
 */
function cancelEditing(element) {
  const field = element.getAttribute('data-plinkk-field');
  if (originalValues[field] !== undefined) {
    element.textContent = originalValues[field];
  }
  
  // Nettoyer les event listeners
  if (element._inputHandler) element.removeEventListener('input', element._inputHandler);
  if (element._blurHandler) element.removeEventListener('blur', element._blurHandler);
  if (element._keydownHandler) element.removeEventListener('keydown', element._keydownHandler);
  
  element.classList.remove(EDITING_CLASS);
  element.setAttribute('contenteditable', 'false');
  element.style.outline = '';
  element.style.outlineOffset = '';
  element.style.background = '';
  element.style.cursor = '';
  
  currentEditingElement = null;
}

/**
 * Configure les liens pour être éditables
 */
function setupEditableLinks() {
  const linkBoxes = document.querySelectorAll('.button, .discord-box');
  
  linkBoxes.forEach((box, index) => {
    if (box.classList.contains(EDITABLE_CLASS)) return;
    
    box.classList.add(EDITABLE_CLASS);
    box.setAttribute('data-plinkk-field', `link-${index}`);
    box.setAttribute('data-plinkk-type', 'link');
    box.setAttribute('data-plinkk-index', index);
    
    // Trouver le lien et le texte
    const link = box.querySelector('a') || box;
    const textEl = box.querySelector('span') || link;
    
    // Empêcher la navigation en mode édition
    const clickHandler = (e) => {
      if (!isEditMode) return;
      e.preventDefault();
      e.stopPropagation();
      
      // Notifier le parent pour ouvrir le modal d'édition
      notifyParent({
        type: 'plinkk:edit-link',
        index: index,
        currentText: textEl.textContent.trim(),
        currentUrl: link.href || ''
      });
    };
    
    box.addEventListener('click', clickHandler, true);
    
    box.addEventListener('mouseenter', () => {
      if (isEditMode) {
        box.style.outline = '2px dashed rgba(139, 92, 246, 0.6)';
        box.style.outlineOffset = '4px';
        box.style.cursor = 'pointer';
      }
    });
    
    box.addEventListener('mouseleave', () => {
      box.style.outline = '';
      box.style.outlineOffset = '';
      box.style.cursor = '';
    });
  });
}

/**
 * Configure les icônes sociales pour être éditables
 */
function setupEditableSocials() {
  const socialIcons = document.querySelectorAll('.icon-list a, .social-icon, .icon-list > *');
  
  socialIcons.forEach((icon, index) => {
    if (icon.classList.contains(EDITABLE_CLASS)) return;
    
    icon.classList.add(EDITABLE_CLASS);
    icon.setAttribute('data-plinkk-field', `social-${index}`);
    icon.setAttribute('data-plinkk-type', 'social');
    icon.setAttribute('data-plinkk-index', index);
    
    const clickHandler = (e) => {
      if (!isEditMode) return;
      e.preventDefault();
      e.stopPropagation();
      
      notifyParent({
        type: 'plinkk:edit-social',
        index: index,
        currentUrl: icon.href || ''
      });
    };
    
    icon.addEventListener('click', clickHandler, true);
    
    icon.addEventListener('mouseenter', () => {
      if (isEditMode) {
        icon.style.outline = '2px dashed rgba(139, 92, 246, 0.6)';
        icon.style.outlineOffset = '4px';
        icon.style.cursor = 'pointer';
        icon.style.transform = 'scale(1.1)';
        icon.style.transition = 'transform 0.2s';
      }
    });
    
    icon.addEventListener('mouseleave', () => {
      icon.style.outline = '';
      icon.style.outlineOffset = '';
      icon.style.cursor = '';
      icon.style.transform = '';
    });
  });
}

/**
 * Met à jour la valeur d'un champ depuis le parent
 */
function updateFieldValue(field, value) {
  const element = document.querySelector(`[data-plinkk-field="${field}"]`);
  if (element) {
    element.textContent = value;
  }
}

/**
 * Envoie les valeurs actuelles au parent
 */
function sendCurrentValues() {
  const values = {};
  
  Object.entries(EDITABLE_SELECTORS).forEach(([key, config]) => {
    const element = document.querySelector(config.selector);
    if (element) {
      values[config.field] = getElementText(element);
    }
  });
  
  notifyParent({
    type: 'plinkk:current-values',
    values: values
  });
}

/**
 * Crée la toolbar d'édition flottante complète
 */
function createEditToolbar() {
  // Ne pas recréer si elle existe
  if (document.querySelector('.plinkk-edit-toolbar')) return;
  
  const pageName = window.__PLINKK_PAGE_NAME__ || 'Ma page';
  const pageSlug = window.__PLINKK_PAGE_SLUG__ || '';
  const publicPath = window.__PLINKK_PUBLIC_PATH__ || pageSlug;
  
  const toolbar = document.createElement('div');
  toolbar.className = 'plinkk-edit-toolbar';
  toolbar.innerHTML = `
    <div class="plinkk-toolbar-info">
      <span class="plinkk-toolbar-name">${pageName}</span>
      <span class="plinkk-toolbar-separator">/</span>
      <span class="plinkk-toolbar-slug">${pageSlug}</span>
      <span class="plinkk-toolbar-status" id="plinkk-status">Prêt — édition directe activée</span>
    </div>
    
    <div class="plinkk-toolbar-actions">
      <button type="button" class="plinkk-toolbar-btn plinkk-btn-edit active" data-action="toggle-edit" title="Mode édition">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        <span class="btn-label">Édition directe</span>
      </button>
      
      <button type="button" class="plinkk-toolbar-btn" data-action="refresh" title="Rafraîchir">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
        </svg>
      </button>
      
      <a href="/${publicPath}" target="_blank" class="plinkk-toolbar-btn plinkk-btn-open" title="Ouvrir dans un nouvel onglet">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>
      
      <div class="plinkk-toolbar-divider"></div>
      
      <button type="button" class="plinkk-toolbar-btn" data-action="open-forms" title="Options avancées">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
    </div>
  `;
  
  document.body.appendChild(toolbar);
  
  // Gérer les clics sur les boutons
  toolbar.querySelectorAll('.plinkk-toolbar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = btn.getAttribute('data-action');
      if (!action) return;
      
      if (action === 'toggle-edit') {
        const wasActive = btn.classList.contains('active');
        btn.classList.toggle('active');
        const label = btn.querySelector('.btn-label');
        if (label) {
          label.textContent = wasActive ? 'Aperçu' : 'Édition directe';
        }
        const status = document.getElementById('plinkk-status');
        if (status) {
          status.textContent = wasActive ? 'Mode aperçu' : 'Prêt — édition directe activée';
        }
        
        if (wasActive) {
          disableEditMode();
        } else {
          enableEditMode();
        }
      } else if (action === 'refresh') {
        btn.querySelector('svg').classList.add('spin');
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } else {
        notifyParent({
          type: 'plinkk:toolbar-action',
          action: action
        });
      }
    });
  });
}

/**
 * Injecte les styles CSS pour le mode édition
 */
function injectEditStyles() {
  if (document.getElementById('plinkk-edit-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'plinkk-edit-styles';
  style.textContent = `
    .${EDIT_MODE_CLASS} {
      cursor: default;
    }
    
    .${EDIT_MODE_CLASS} .${EDITABLE_CLASS} {
      cursor: pointer;
      transition: outline 0.2s ease, background 0.2s ease, transform 0.2s ease;
    }
    
    .${EDIT_MODE_CLASS} .${EDITING_CLASS} {
      cursor: text !important;
    }
    
    .${EDIT_MODE_CLASS} a {
      pointer-events: auto;
    }
    
    /* Toolbar principale */
    .plinkk-edit-toolbar {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 20px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 9999;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.15);
      backdrop-filter: blur(16px);
      animation: plinkk-toolbar-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    @keyframes plinkk-toolbar-in {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0) scale(1);
      }
    }
    
    .plinkk-toolbar-info {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(30, 41, 59, 0.8);
      border-radius: 12px;
      border: 1px solid rgba(51, 65, 85, 0.5);
    }
    
    .plinkk-toolbar-name {
      color: white;
      font-size: 13px;
      font-weight: 600;
    }
    
    .plinkk-toolbar-separator {
      color: rgba(100, 116, 139, 0.6);
      font-size: 13px;
    }
    
    .plinkk-toolbar-slug {
      color: rgb(139, 92, 246);
      font-size: 13px;
      font-weight: 500;
    }
    
    .plinkk-toolbar-status {
      color: rgb(52, 211, 153);
      font-size: 11px;
      font-weight: 500;
      margin-left: 8px;
      padding-left: 8px;
      border-left: 1px solid rgba(51, 65, 85, 0.5);
    }
    
    .plinkk-toolbar-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .plinkk-toolbar-divider {
      width: 1px;
      height: 24px;
      background: rgba(51, 65, 85, 0.5);
      margin: 0 4px;
    }
    
    .plinkk-toolbar-btn {
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 0 12px;
      background: rgba(51, 65, 85, 0.5);
      border: 1px solid rgba(71, 85, 105, 0.5);
      color: rgba(203, 213, 225, 0.9);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
    }
    
    .plinkk-toolbar-btn:hover {
      background: rgba(71, 85, 105, 0.6);
      color: white;
      transform: translateY(-1px);
    }
    
    .plinkk-toolbar-btn:active {
      transform: translateY(0);
    }
    
    .plinkk-toolbar-btn.active,
    .plinkk-btn-edit.active {
      background: linear-gradient(135deg, rgb(124, 58, 237), rgb(139, 92, 246));
      border-color: transparent;
      color: white;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
    }
    
    .plinkk-btn-open {
      background: linear-gradient(135deg, rgb(16, 185, 129), rgb(52, 211, 153)) !important;
      border-color: transparent !important;
      color: white !important;
    }
    
    .plinkk-btn-open:hover {
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }
    
    .plinkk-toolbar-btn svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    
    .plinkk-toolbar-btn svg.spin {
      animation: spin 0.6s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .btn-label {
      white-space: nowrap;
    }
    
    /* Badge "cliquez pour éditer" au survol des éléments */
    .${EDIT_MODE_CLASS} .${EDITABLE_CLASS}:hover::after {
      content: 'Cliquer pour modifier';
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.95);
      color: white;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
      z-index: 9998;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    /* Responsive - réduire sur mobile */
    @media (max-width: 768px) {
      .plinkk-edit-toolbar {
        top: auto;
        bottom: 16px;
        padding: 6px 10px;
        gap: 8px;
        max-width: calc(100% - 32px);
        flex-wrap: wrap;
        justify-content: center;
      }
      
      .plinkk-toolbar-info {
        padding: 4px 8px;
      }
      
      .plinkk-toolbar-status {
        display: none;
      }
      
      .btn-label {
        display: none;
      }
      
      .plinkk-toolbar-btn {
        padding: 0 10px;
        height: 32px;
      }
    }
  `;
  document.head.appendChild(style);
}

// Auto-initialisation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInlineEdit);
} else {
  // Petit délai pour s'assurer que tout est chargé
  setTimeout(initInlineEdit, 100);
}

export default { initInlineEdit, enableEditMode, disableEditMode };
