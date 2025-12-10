const SPAM_MESSAGES = [
    "Tu copies beaucoup dis donc ! 📋",
    "C'est bon, tu l'as copié ! 😅",
    "Encore ?! Tu collectionnes les emails ? 📧",
    "Ctrl+C champion du monde ! 🏆",
    "Tu veux pas l'apprendre par cœur tant qu'à faire ? 🧠",
    "C'est la 10ème fois... 🔟",
    "Tu testes si ça change ? Spoiler: non 😄",
    "Copier-coller professionnel détecté ! 💼",
    "L'email n'a pas changé hein 😉",
    "Tu me fais peur là... 👀"
];

let spamCount = 0;

export function handleCopySpam() {
    const message = SPAM_MESSAGES[spamCount % SPAM_MESSAGES.length];
    spamCount++;
    
    const toast = document.createElement('div');
    toast.className = 'spam-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--theme-secondary, #2d2d44);
        color: var(--theme-text, #fff);
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideUp 0.3s ease, fadeOut 0.3s ease 2.7s;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

export function resetSpamCount() {
    spamCount = 0;
}

export default {
    handleCopySpam,
    resetSpamCount,
    SPAM_MESSAGES
};
