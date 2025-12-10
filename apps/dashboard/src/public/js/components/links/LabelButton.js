import { el } from '../../core/domUtils.js';
import { isSafeUrl, isSafeColor, setSafeText } from '../../security.js';

export function createLabelButton(labelData) {
    const button = el('div', {
        class: 'label-button',
        role: 'button',
        tabindex: '0'
    });
    
    const text = el('span');
    setSafeText(text, labelData.text || 'Label');
    button.appendChild(text);
    
    if (labelData.color && isSafeColor(labelData.color)) {
        button.style.backgroundColor = labelData.color;
    }
    
    if (labelData.onClick) {
        button.addEventListener('click', labelData.onClick);
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                labelData.onClick(e);
            }
        });
    }
    
    return button;
}

export default createLabelButton;
