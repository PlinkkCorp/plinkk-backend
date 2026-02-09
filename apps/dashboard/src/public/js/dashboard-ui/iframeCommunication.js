/**
 * Module de communication avec l'iframe pour l'édition directe
 * Gère la synchronisation entre le dashboard et l'iframe de preview
 */

import { qs } from './utils.js';

let iframeReady = false;
let editModeEnabled = false;
let onFieldChangeCallback = null;
let onLinkEditCallback = null;
let onSocialEditCallback = null;

const preview = () => qs('#preview');

/**
 * Initialise la communication avec l'iframe
 */
export function initIframeCommunication(options = {}) {
  const { onFieldChange, onLinkEdit, onSocialEdit, onReady } = options;
  
  onFieldChangeCallback = onFieldChange;
  onLinkEditCallback = onLinkEdit;
  onSocialEditCallback = onSocialEdit;
  
  // Écouter les messages de l'iframe
  window.addEventListener('message', (event) => {
    handleIframeMessage(event, { onReady });
  });
  
  // Attendre que l'iframe soit chargée
  const iframe = preview();
  if (iframe) {
    iframe.addEventListener('load', () => {
      // Petit délai pour s'assurer que le JS de l'iframe est chargé
      setTimeout(() => {
        sendToIframe({ type: 'plinkk:get-current-values' });
      }, 500);
    });
  }
  
  console.log('[Dashboard] Communication iframe initialisée');
}

/**
 * Gère les messages reçus de l'iframe
 */
function handleIframeMessage(event, options = {}) {
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  
  switch (data.type) {
    case 'plinkk:iframe-ready':
      iframeReady = true;
      console.log('[Dashboard] Iframe prête');
      if (options.onReady) options.onReady();
      // Activer automatiquement le mode édition
      if (editModeEnabled) {
        sendToIframe({ type: 'plinkk:enable-edit' });
      }
      break;
      
    case 'plinkk:edit-mode-enabled':
      console.log('[Dashboard] Mode édition activé dans l\'iframe');
      break;
      
    case 'plinkk:edit-mode-disabled':
      console.log('[Dashboard] Mode édition désactivé dans l\'iframe');
      break;
      
    case 'plinkk:field-changed':
      if (onFieldChangeCallback) {
        onFieldChangeCallback(data.field, data.value, data.realtime);
      }
      break;
      
    case 'plinkk:edit-link':
      if (onLinkEditCallback) {
        onLinkEditCallback(data.index, data.currentText, data.currentUrl);
      }
      break;
      
    case 'plinkk:edit-social':
      if (onSocialEditCallback) {
        onSocialEditCallback(data.index, data.currentUrl);
      }
      break;
      
    case 'plinkk:current-values':
      console.log('[Dashboard] Valeurs actuelles reçues:', data.values);
      break;
  }
}

/**
 * Envoie un message à l'iframe
 */
export function sendToIframe(message) {
  const iframe = preview();
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(message, '*');
  }
}

/**
 * Active le mode édition dans l'iframe
 */
export function enableEditMode() {
  editModeEnabled = true;
  sendToIframe({ type: 'plinkk:enable-edit' });
}

/**
 * Désactive le mode édition dans l'iframe
 */
export function disableEditMode() {
  editModeEnabled = false;
  sendToIframe({ type: 'plinkk:disable-edit' });
}

/**
 * Toggle le mode édition
 */
export function toggleEditMode() {
  if (editModeEnabled) {
    disableEditMode();
  } else {
    enableEditMode();
  }
  return editModeEnabled;
}

/**
 * Met à jour un champ dans l'iframe
 */
export function updateIframeField(field, value) {
  sendToIframe({
    type: 'plinkk:update-field',
    field: field,
    value: value
  });
}

/**
 * Rafraîchit l'iframe
 */
export function refreshIframe() {
  sendToIframe({ type: 'plinkk:refresh' });
}

/**
 * Vérifie si l'iframe est prête
 */
export function isIframeReady() {
  return iframeReady;
}

/**
 * Vérifie si le mode édition est actif
 */
export function isEditModeActive() {
  return editModeEnabled;
}

export default {
  initIframeCommunication,
  sendToIframe,
  enableEditMode,
  disableEditMode,
  toggleEditMode,
  updateIframeField,
  refreshIframe,
  isIframeReady,
  isEditModeActive
};
