/**
 * Tutoriel interactif Plinkk — guide multi-pages dashboard
 * Conserve l'experience de la page edit et l'etend aux autres vues.
 */
(function () {
  'use strict';

  function detectPageKey() {
    const path = (window.location.pathname || '').toLowerCase();
    if (path.startsWith('/edit')) return 'edit';
    if (path.startsWith('/stats')) return 'stats';
    if (path.startsWith('/plinkks')) return 'plinkks';
    if (path.startsWith('/account') || path.startsWith('/settings')) return 'account';
    if (path.startsWith('/leads')) return 'leads';
    if (path.startsWith('/redirects')) return 'redirects';
    if (path.startsWith('/qrcode/edit')) return 'qrcode-edit';
    if (path.startsWith('/qrcodes')) return 'qrcodes';
    if (path.startsWith('/themes')) return 'themes';
    if (path.startsWith('/sessions')) return 'sessions';
    if (path === '/dashboard' || path === '/') return 'dashboard';
    return 'generic';
  }

  function ensureTutorialCssLoaded() {
    const existing = document.querySelector('link[data-plinkk-tour-css="1"]')
      || document.querySelector('link[href="/public/css/tutorial.css"]');
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/public/css/tutorial.css';
    link.setAttribute('data-plinkk-tour-css', '1');
    document.head.appendChild(link);
  }

  const EDIT_STEPS = [
    {
      target: '#save-status-container',
      activeTab: null,
      position: 'bottom',
      title: 'Statut d\'enregistrement',
      description:
        'Ce voyant te confirme en temps réel que tes modifications sont <strong>sauvegardées automatiquement</strong>. ' +
        'Un point <code>vert</code> = tout est enregistré. Un point <code>orange</code> = sauvegarde en cours. Un point <code>rouge</code> = erreur.',
    },
    {
      target: '[onclick*="plinkkSelectorModal"]',
      fallbackTarget: '#tourLaunchBtn',
      activeTab: null,
      position: 'bottom',
      title: 'Changer de Plinkk',
      description:
        'Tu peux avoir <strong>plusieurs pages Plinkk</strong> (portfolio, streaming, pro…). ' +
        'Ce menu te permet de passer de l\'une à l\'autre instantanément sans quitter l\'éditeur.',
    },
    {
      target: '#tabs',
      activeTab: null,
      position: 'bottom',
      title: 'Les sections de l\'éditeur',
      description:
        'L\'éditeur est divisé en <strong>7 sections</strong> accessibles via ces onglets. ' +
        'Chaque onglet correspond à une catégorie de personnalisation : profil, apparence, arrière-plan, liens, disposition, animations et status.',
    },
    {
      target: '#section-profile',
      activeTab: '#section-profile',
      position: 'right',
      title: 'Section Profil',
      description:
        'Configure les <strong>informations de base</strong> de ta page : ton nom affiché, ton email, ta bio, ton avatar, et le lien de ton profil principal. ' +
        'Toutes ces infos sont visibles publiquement.',
    },
    {
      target: '#userName',
      activeTab: '#section-profile',
      position: 'bottom',
      title: 'Nom affiché',
      description:
        'Ce champ définit le <strong>nom visible</strong> sur ta page publique. ' +
        'Il peut être différent de ton pseudo de connexion. Tu peux y mettre ton nom réel, ton pseudo, ou ta marque.',
    },
    {
      target: '#section-appearance',
      activeTab: '#section-appearance',
      position: 'right',
      title: 'Section Apparence',
      description:
        'Personnalise le <strong>style visuel</strong> de ta page : choix du thème, couleurs primaire et d\'accent, ' +
        'style des boutons, taille et forme de l\'avatar. C\'est ici que ta page prend vraiment ton identité.',
    },
    {
      target: '#openThemePicker',
      activeTab: '#section-appearance',
      position: 'bottom',
      title: 'Choisir un thème',
      description:
        'Clique ici pour ouvrir le <strong>sélecteur de thème</strong>. Plinkk propose des dizaines de thèmes prédéfinis, ' +
        'de l\'élégant minimaliste au style néon flashy. Tu peux aussi créer un thème 100% personnalisé.',
    },
    {
      target: '#section-background',
      activeTab: '#section-background',
      position: 'right',
      title: 'Section Arrière-plan',
      description:
        'Choisis l\'<strong>arrière-plan de ta page</strong> : couleur unie, dégradé, image, vidéo, ou effet animé. ' +
        'L\'arrière-plan est la première chose que tes visiteurs remarquent — fais-le mémorable !',
    },
    {
      target: '#section-links',
      activeTab: '#section-links',
      position: 'right',
      title: 'Section Liens',
      description:
        'Au cœur de Plinkk : tes <strong>liens</strong>. Ajoute des boutons cliquables vers tes réseaux, sites, ' +
        'projets… Tu peux aussi ajouter des <strong>icônes de réseaux sociaux</strong> et des <strong>en-têtes de section</strong> pour organiser ton contenu.',
    },
    {
      target: '#addSocialIcon',
      activeTab: '#section-links',
      position: 'bottom',
      title: 'Ajouter un réseau social',
      description:
        'Ce bouton ouvre la liste de tous les <strong>réseaux sociaux</strong> supportés. ' +
        'Sélectionne-en un, entre ton identifiant ou URL, et une petite icône apparaît sur ta page.',
    },
    {
      target: '#section-layout',
      activeTab: '#section-layout',
      position: 'right',
      title: 'Section Disposition',
      description:
        'Configure la <strong>mise en page globale</strong> de ta page : largeur du contenu, alignement du texte, ' +
        'espacement entre les éléments, et le style global (compact, confortable…).',
    },
    {
      target: '#section-animations',
      activeTab: '#section-animations',
      position: 'right',
      title: 'Section Animations',
      description:
        'Ajoute de la vie à ta page avec des <strong>animations</strong> sur l\'entrée des éléments. ' +
        'Fondu, glissement, rebond… Choisis l\'animation et sa durée pour impressionner tes visiteurs dès leur arrivée.',
    },
    {
      target: '#previewCard',
      activeTab: null,
      position: 'left',
      title: 'Aperçu en direct',
      description:
        'Ce panneau affiche ta page en <strong>temps réel</strong>, exactement comme la voient tes visiteurs. ' +
        'Il se met à jour automatiquement à chaque modification. Tu peux aussi l\'ouvrir en plein écran avec le bouton ' +
        '<code>↗</code>.',
    },
    {
      target: '#btnHistory',
      activeTab: null,
      position: 'bottom',
      title: 'Historique des modifications',
      description:
        'Plinkk garde un <strong>historique de toutes tes sauvegardes</strong>. ' +
        'Si tu fais une erreur ou changes d\'avis, tu peux restaurer n\'importe quelle version précédente en un clic.',
    },
    {
      target: '#previewReload',
      activeTab: null,
      position: 'top',
      title: 'Recharger l\'aperçu',
      description:
        'Ce bouton <strong>recharge l\'aperçu</strong> manuellement. ' +
        'Utile si l\'aperçu ne s\'est pas mis à jour automatiquement après une modification complexe.',
    },
  ];

  const DASHBOARD_STEPS = [
    {
      target: 'main h1',
      position: 'bottom',
      title: 'Bienvenue sur ton dashboard',
      description:
        'Ici, tu retrouves un resume rapide de ton activite et les actions les plus utiles pour gerer ton univers Plinkk.',
    },
    {
      target: '#premiumBanner',
      fallbackTarget: '[href="/premium/configure"], [href="/premium"]',
      position: 'bottom',
      title: 'Offre Premium',
      description:
        'Ce bloc met en avant les options Premium quand elles sont disponibles pour ton compte.',
    },
    {
      target: '#stat-views-value',
      fallbackTarget: '#stat-views-skeleton',
      position: 'bottom',
      title: 'Statistiques rapides',
      description:
        'Tu suis ici les vues, clics et le taux de clic global pour ton profil.',
    },
    {
      target: 'a[href="/edit#add-link"]',
      fallbackTarget: 'a[href^="/edit"]',
      position: 'top',
      title: 'Actions rapides',
      description:
        'Ces raccourcis te font gagner du temps: ajout de lien, apparence, stats ou parametres.',
    },
  ];

  const STATS_STEPS = [
    {
      target: 'main h1',
      position: 'bottom',
      title: 'Page Statistiques',
      description:
        'Vue detaillee des performances de ton profil, de tes liens, redirections et QR codes.',
    },
    {
      target: '#btnExportCSV',
      position: 'left',
      title: 'Exporter les donnees',
      description:
        'Exporte tes stats en CSV pour les analyser ailleurs.',
    },
    {
      target: '[data-tab="overview"]',
      position: 'bottom',
      title: 'Onglets d analyse',
      description:
        'Navigue entre Apercu, Tendances, Liens, Categories, Redirections, QR Codes et Tunnel.',
    },
    {
      target: '#panel-overview',
      position: 'top',
      title: 'Vue d ensemble',
      description:
        'Ce panneau centralise les KPI les plus importants pour piloter ta croissance.',
    },
  ];

  const PLINKKS_STEPS = [
    {
      target: 'main h1',
      position: 'bottom',
      title: 'Gestion de tes Plinkks',
      description:
        'Tu peux creer plusieurs pages selon tes usages: perso, pro, portfolio, evenement.',
    },
    {
      target: '#btnCreatePlinkk',
      fallbackTarget: '[href="/premium"]',
      position: 'left',
      title: 'Creer une nouvelle page',
      description:
        'Utilise ce bouton pour ajouter un nouveau Plinkk en quelques secondes.',
    },
    {
      target: 'a[href*="/edit?plinkkId="]',
      position: 'top',
      title: 'Editer un Plinkk',
      description:
        'Accede directement a l editeur pour modifier le contenu, le style et les liens.',
    },
    {
      target: 'a[href*="/stats?plinkkId="]',
      position: 'top',
      title: 'Analyser les performances',
      description:
        'Chaque Plinkk possede ses propres stats pour mesurer son impact.',
    },
  ];

  const ACCOUNT_STEPS = [
    {
      target: 'main h1',
      position: 'bottom',
      title: 'Mon compte',
      description:
        'Gère tes informations, ta sécurité et tes préférences ici. Tu peux aussi configurer des intégrations et accéder aux outils développeur.',
    },
    {
      target: '[data-tab="profile"]',
      activeTab: null,
      position: 'bottom',
      title: 'Profil Public',
      description:
        'Personnalise ton nom public, ta biographie et ton avatar. Ces infos sont visibles sur ta page Plinkk.',
    },
    {
      target: '[data-tab="security"]',
      activeTab: null,
      position: 'bottom',
      title: 'Sécurité & Confidentialité',
      description:
        'Active 2FA pour plus de sécurité. Contrôle aussi ta visibilité publique et les actions sensibles.',
    },
    {
      target: '[data-tab="settings"]',
      activeTab: null,
      position: 'bottom',
      title: 'Paramètres',
      description:
        'Gère tes paramètres généraux, ta langue et tes préférences de notification.',
    },
    {
      target: '[data-tab="preferences"]',
      activeTab: null,
      position: 'bottom',
      title: 'Préférences',
      description:
        'Configure tes préférences d\'utilisation pour personnaliser ton expérience Plinkk.',
    },
    {
      target: '[data-tab="developer"]',
      activeTab: null,
      position: 'bottom',
      title: 'Espace Développeur',
      description:
        'Génère et gère ta clé API pour intégrer Plinkk dans tes applications. Découvre aussi la Documentation API.',
    },
    {
      target: '[data-tab="subscription"]',
      activeTab: null,
      position: 'bottom',
      title: 'Abonnement',
      description:
        'Vois ton plan actuel, tes limites d\'utilisation et mets à jour vers une formule premium si besoin.',
    },
  ];

  const LEADS_STEPS = [
    {
      target: 'main h1',
      position: 'bottom',
      title: 'Soumissions Formulaire',
      description:
        'Retrouve ici toutes les reponses envoyees depuis tes formulaires de contact.',
    },
    {
      target: '#fSearch',
      position: 'bottom',
      title: 'Recherche instantanee',
      description:
        'Filtre rapidement par nom, email ou contenu de message.',
    },
    {
      target: '#fLink',
      position: 'bottom',
      title: 'Filtre par formulaire',
      description:
        'Isole les leads d un formulaire precis pour un suivi plus simple.',
    },
    {
      target: '#btnExportCSV',
      position: 'left',
      title: 'Exporter les leads',
      description:
        'Telecharge toutes les soumissions en CSV pour ton CRM ou tes analyses.',
    },
  ];

  const REDIRECTS_STEPS = [
    {
      target: 'main',
      position: 'bottom',
      title: 'Redirections courtes',
      description:
        'Crée des URLs courtes (https://plinkk.fr/r/...) faciles à partager, tracker et personnaliser. Parfait pour simplifier tes liens publics.',
    },
    {
      target: 'button[onclick*="openCreateModal"], #createRedirectBtn',
      fallbackTarget: 'main',
      position: 'left',
      title: '📌 Créer ta première redirection',
      description:
        'Clique pour créer une nouvelle URL courte. Tu définis un slug personnalisé, l\'URL cible, et tu contrôles si elle est active ou non.',
    },
    {
      target: 'table tbody',
      fallbackTarget: 'table',
      position: 'bottom',
      title: 'Liste de tes redirections',
      description:
        'Vois toutes tes redirections ici avec le nombre de clics, la date de création et les options pour modifier ou supprimer.',
    },
    {
      target: 'button[onclick*="copyToClipboard"]',
      fallbackTarget: 'table',
      position: 'top',
      title: '📋 Copie rapide',
      description:
        'Copie le lien court en un seul clic pour le partager immédiatement sur les réseaux ou par mail.',
    },
  ];

  const QRCODES_STEPS = [
    {
      target: 'main',
      position: 'bottom',
      title: 'Codes QR',
      description:
        'Crée des codes QR personnalisés pour diriger ton audience vers tes pages Plinkk. Avec statistiques de scan intégrées.',
    },
    {
      target: 'main .grid',
      fallbackTarget: 'main',
      position: 'bottom',
      title: '📊 Statistiques QR',
      description:
        'Vois le nombre total de codes QR, le nombre de scans et l\'utilisation de ta limite.',
    },
    {
      target: '#btnCreateQrCode',
      fallbackTarget: 'main',
      position: 'left',
      title: '⚡ Créer ton premier QR Code',
      description:
        'Clique pour créer un code QR. Tu pourras ensuite choisir si c\'est un lien vers ta page Plinkk ou une URL personnalisée.',
    },
    {
      target: '#createQrPlinkk, select',
      fallbackTarget: 'main',
      position: 'bottom',
      title: 'Sélectionne ta page Plinkk',
      description:
        'Choisis quelle page Plinkk le QR code doit pointer. Tu peux ensuite en créer d\'autres pour différentes pages.',
    },
    {
      target: 'table tbody tr',
      fallbackTarget: 'table',
      position: 'bottom',
      title: 'Tes QR Codes créés',
      description:
        'Tu vois tous tes codes QR avec leurs stats de scans. Tu peux les copier, les télécharger ou les modifier.',
    },
    {
      target: 'button[onclick*="downloadQrCode"]',
      fallbackTarget: '#btnCreateQrCode',
      position: 'top',
      title: '⬇️ Télécharger',
      description:
        'Une fois créé, télécharge ton QR Code en PNG pour l\'imprimer ou le partager sur les réseaux sociaux.',
    },
    {
      target: 'button[onclick*="editQrCode"]',
      fallbackTarget: '#btnCreateQrCode',
      position: 'top',
      title: '✨ Personnaliser',
      description:
        'Modifie les couleurs, le logo et le style de ton QR Code pour qu\'il s\'harmonise avec ta charte graphique.',
    },
  ];

  const QRCODE_EDIT_STEPS = [
    {
      target: '#qrCodeForm',
      position: 'right',
      title: 'Editeur QR',
      description:
        'Configure ici le nom, la cible et les options de rendu de ton QR code.',
    },
    {
      target: '#qrCodeTargetType',
      position: 'bottom',
      title: 'Type de cible',
      description:
        'Choisis vers quoi pointe le code: profil, page Plinkk, redirection ou URL perso.',
    },
    {
      target: '#qrCodeIncludeImage',
      position: 'bottom',
      title: 'Logo au centre',
      description:
        'Active un logo pour renforcer ton branding tout en gardant un scan fiable.',
    },
    {
      target: '#qrCodePreview',
      position: 'left',
      title: 'Apercu en direct',
      description:
        'Visualise le rendu final avant de sauvegarder ou de telecharger.',
    },
    {
      target: '#btnDownloadQrCode',
      position: 'top',
      title: 'Telecharger',
      description:
        'Exporte ton QR code final en un clic.',
    },
  ];

  const THEMES_STEPS = [
    {
      target: '#themeForm',
      position: 'right',
      title: 'Creation de theme',
      description:
        'Concois ton theme avec couleurs, boutons et style global.',
    },
    {
      target: '#createAndSubmitBtn',
      position: 'top',
      title: 'Soumettre un theme',
      description:
        'Envoie ton theme pour publication quand il est pret.',
    },
    {
      target: '#saveDraftBtn',
      position: 'top',
      title: 'Brouillon',
      description:
        'Sauvegarde sans publier pour reprendre plus tard.',
    },
    {
      target: '#previewLight',
      fallbackTarget: '#previewDark',
      position: 'left',
      title: 'Previsualisations',
      description:
        'Verifie le rendu en mode clair et sombre avant validation.',
    },
  ];

  const SESSIONS_STEPS = [
    {
      target: 'main h1',
      position: 'bottom',
      title: 'Sessions actives',
      description:
        'Controle les appareils connectes a ton compte pour rester en securite.',
    },
    {
      target: '#revokeModal',
      fallbackTarget: '#confirmRevoke',
      position: 'top',
      title: 'Revocation',
      description:
        'Tu peux deconnecter une session distante en cas de doute.',
    },
  ];

  const GENERIC_STEPS = [
    {
      target: 'main h1',
      fallbackTarget: 'main',
      position: 'bottom',
      title: 'Guide Dashboard',
      description:
        'Bienvenue dans ton espace Plinkk. Ce guide t aide a reperer les actions essentielles de la page actuelle.',
    },
    {
      target: 'aside',
      fallbackTarget: 'nav',
      position: 'right',
      title: 'Navigation laterale',
      description:
        'Utilise le menu pour passer rapidement entre edition, stats, compte et outils.',
    },
  ];

  const TOUR_STEPS_BY_PAGE = {
    edit: EDIT_STEPS,
    dashboard: DASHBOARD_STEPS,
    stats: STATS_STEPS,
    plinkks: PLINKKS_STEPS,
    account: ACCOUNT_STEPS,
    leads: LEADS_STEPS,
    redirects: REDIRECTS_STEPS,
    qrcodes: QRCODES_STEPS,
    'qrcode-edit': QRCODE_EDIT_STEPS,
    themes: THEMES_STEPS,
    sessions: SESSIONS_STEPS,
    generic: GENERIC_STEPS,
  };

  /* =============================================
     Variables d'état
     ============================================= */
  const PAGE_KEY = detectPageKey();
  const GLOBAL_STORAGE_KEY = 'plinkk_tour_seen_v3_global';
  const STORAGE_KEY = `plinkk_tour_seen_v3_${PAGE_KEY}`;
  const TOUR_STEPS = TOUR_STEPS_BY_PAGE[PAGE_KEY] || TOUR_STEPS_BY_PAGE.generic;
  let currentStep = 0;
  let isActive = false;
  let highlightEl, cardEl, welcomeEl, launcherEl;
  let resizeTimer;

  /* =============================================
     Utilitaires
     ============================================= */
  function $(sel) { return document.querySelector(sel); }

  /** Résoud la cible d'une étape en essayant le `target` puis le `fallbackTarget`. */
  function resolveTarget(step) {
    if (!step.target) return null;
    let el = document.querySelector(step.target);
    if (!el && step.fallbackTarget) el = document.querySelector(step.fallbackTarget);
    return el;
  }

  /** Active un onglet par son `data-target` si différent du panneau actif. */
  function activateTab(sectionId) {
    if (!sectionId) return;
    // Cherche le bouton onglet correspondant
    const tabBtn = document.querySelector(`[data-target="${sectionId}"]`);
    if (tabBtn) tabBtn.click();
    // Donne le temps à l'animation de se faire
  }

  /** Retourne le rect d'un élément avec padding optionnel. */
  function getRectWithPadding(el, padding = 10) {
    const r = el.getBoundingClientRect();
    return {
      top:    r.top    - padding,
      left:   r.left   - padding,
      width:  r.width  + padding * 2,
      height: r.height + padding * 2,
      bottom: r.bottom + padding,
      right:  r.right  + padding,
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
    };
  }

  /** Scroll instantané vers l'élément si nécessaire (smooth casse le timing fixed). */
  function scrollIntoViewIfNeeded(el) {
    const r = el.getBoundingClientRect();
    const margin = 140;
    if (r.top < margin || r.bottom > window.innerHeight - margin) {
      const target = window.scrollY + r.top - window.innerHeight / 2 + r.height / 2;
      window.scrollTo({ top: Math.max(0, target), behavior: 'instant' });
    }
  }

  /* =============================================
     Construction du DOM
     ============================================= */
  function buildDOM() {
    /* --- Highlight --- */
    highlightEl = document.createElement('div');
    highlightEl.id = 'plinkk-tour-highlight';
    highlightEl.style.display = 'none';
    document.body.appendChild(highlightEl);

    /* --- Carte tooltip --- */
    cardEl = document.createElement('div');
    cardEl.id = 'plinkk-tour-card';
    cardEl.style.display = 'none';
    cardEl.setAttribute('role', 'dialog');
    cardEl.setAttribute('aria-modal', 'false');
    cardEl.setAttribute('aria-label', 'Tutoriel Plinkk');
    document.body.appendChild(cardEl);

    /* --- Écran de bienvenue --- */
    welcomeEl = document.createElement('div');
    welcomeEl.id = 'plinkk-tour-welcome';
    welcomeEl.classList.add('hidden');
    welcomeEl.style.display = 'none';
    welcomeEl.innerHTML = buildWelcomeHTML();
    document.body.appendChild(welcomeEl);

    /* --- Bouton de lancement --- */
    launcherEl = document.createElement('button');
    launcherEl.id = 'plinkk-tour-launcher';
    launcherEl.setAttribute('aria-label', 'Lancer le tutoriel');
    launcherEl.innerHTML = `
      <span class="launcher-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
        </svg>
      </span>
      <span class="launcher-text">Guide interactif</span>
    `;
    launcherEl.addEventListener('click', startTour);
    document.body.appendChild(launcherEl);
  }

  function buildWelcomeHTML() {
    const welcome = getWelcomeCopy();
    return `
      <div class="tour-welcome-card">
        <div class="tour-welcome-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </div>
        <h2 class="tour-welcome-title">${welcome.title}</h2>
        <p class="tour-welcome-subtitle">
          ${welcome.subtitle}
        </p>
        <div class="tour-welcome-features">
          <div class="tour-welcome-feature">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Profil & avatar</span>
          </div>
          <div class="tour-welcome-feature">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l4 8h8l-6 5 2 9-8-5-8 5 2-9-6-5h8z"/></svg>
            <span>Thèmes & couleurs</span>
          </div>
          <div class="tour-welcome-feature">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span>Liens & réseaux</span>
          </div>
          <div class="tour-welcome-feature">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            <span>Aperçu live</span>
          </div>
          <div class="tour-welcome-feature">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16v12H4zM7 9h10v6H7z"/></svg>
            <span>Arrière-plan</span>
          </div>
          <div class="tour-welcome-feature">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <span>Historique</span>
          </div>
        </div>
        <div class="tour-welcome-actions">
          <button class="tour-welcome-start" id="tourWelcomeStart">
            Commencer le guide →
          </button>
          <button class="tour-welcome-skip" id="tourWelcomeSkip">
            Je connais déjà, pas maintenant
          </button>
        </div>
      </div>
    `;
  }

  function getWelcomeCopy() {
    const byPage = {
      edit: {
        title: 'Bienvenue dans l\'editeur Plinkk ✨',
        subtitle:
          'Ce guide rapide te montre comment configurer ton profil, tes liens et ton style en <strong>moins de 3 minutes</strong>.',
      },
      dashboard: {
        title: 'Bienvenue sur ton dashboard ✨',
        subtitle:
          'Ce guide te presente les zones importantes pour piloter ton activite Plinkk en quelques etapes.',
      },
      stats: {
        title: 'Bienvenue dans tes statistiques ✨',
        subtitle:
          'Ce guide te montre les KPI essentiels et les exports pour analyser ta croissance efficacement.',
      },
      generic: {
        title: 'Bienvenue sur Plinkk ✨',
        subtitle:
          'Ce guide rapide te fait decouvrir les principales actions de cette page.',
      },
    };

    return byPage[PAGE_KEY] || byPage.generic;
  }

  /* =============================================
     Positionnement de la carte
     ============================================= */
  function positionCard(step, targetEl) {
    const pref = step.position || 'bottom';
    // Forcer recalcul de la hauteur après rendu
    cardEl.style.visibility = 'hidden';
    cardEl.style.display = 'block';
    const cardW = Math.min(360, window.innerWidth - 24);
    cardEl.style.width = cardW + 'px';
    const cardH = cardEl.offsetHeight || 240;
    cardEl.style.visibility = '';
    const gap = 16;
    const vW = window.innerWidth;
    const vH = window.innerHeight;
    // getBoundingClientRect() = coordonnées viewport, parfait pour position:fixed
    const r = targetEl.getBoundingClientRect();

    let top = null, left = null, arrowClass = '';

    const positions = [pref, 'bottom', 'top', 'right', 'left'];
    for (const pos of positions) {
      let t, l, aC;
      if (pos === 'bottom') {
        t = r.bottom + gap;
        l = clamp(r.left + r.width / 2 - cardW / 2, 12, vW - cardW - 12);
        aC = 'arrow-top arrow-center';
        if (t + cardH + 12 <= vH) { top = t; left = l; arrowClass = aC; break; }
      } else if (pos === 'top') {
        t = r.top - cardH - gap;
        l = clamp(r.left + r.width / 2 - cardW / 2, 12, vW - cardW - 12);
        aC = 'arrow-bottom arrow-center';
        if (t >= 12) { top = t; left = l; arrowClass = aC; break; }
      } else if (pos === 'right') {
        t = r.top + r.height / 2 - cardH / 2;
        l = r.right + gap;
        aC = 'arrow-left';
        if (l + cardW + 12 <= vW) { top = t; left = l; arrowClass = aC; break; }
      } else if (pos === 'left') {
        t = r.top + r.height / 2 - cardH / 2;
        l = r.left - cardW - gap;
        aC = 'arrow-right';
        if (l >= 12) { top = t; left = l; arrowClass = aC; break; }
      }
    }
    // Fallback si aucune position n'est assez grande
    if (top === null) {
      top = clamp(r.bottom + gap, 12, vH - cardH - 12);
      left = clamp(r.left + r.width / 2 - cardW / 2, 12, vW - cardW - 12);
      arrowClass = 'arrow-top arrow-center';
    }
    // Clamp final pour ne jamais sortir du viewport
    top  = clamp(top,  12, vH - cardH - 12);
    left = clamp(left, 12, vW - cardW - 12);

    cardEl.style.top  = top  + 'px';
    cardEl.style.left = left + 'px';

    // Flèche
    const existingArrow = cardEl.querySelector('.tour-arrow');
    if (existingArrow) existingArrow.className = 'tour-arrow ' + arrowClass;
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(val, max));
  }

  /* =============================================
     Rendu de la carte
     ============================================= */
  function renderCard(step, index, total) {
    const isLast = index === total - 1;

    cardEl.innerHTML = `
      <div class="tour-arrow"></div>
      <div class="tour-step-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
        Guide Plinkk
      </div>
      <div class="tour-progress-bar">
        ${Array.from({ length: total }, (_, i) =>
          `<div class="tour-progress-dot${i === index ? ' active' : i < index ? ' done' : ''}"></div>`
        ).join('')}
      </div>
      <div class="tour-title">${step.title}</div>
      <div class="tour-description">${step.description}</div>
      <div class="tour-actions">
        <button class="tour-skip-btn" id="tourSkipBtn">Quitter le guide</button>
        <div class="tour-nav">
          ${index > 0 ? '<button class="tour-btn-prev" id="tourPrevBtn">← Précédent</button>' : ''}
          <button class="tour-btn-next ${isLast ? 'tour-btn-finish' : ''}" id="tourNextBtn">
            ${isLast ? 'Terminer le guide' : 'Suivant →'}
          </button>
        </div>
      </div>
    `;

    cardEl.querySelector('#tourSkipBtn').addEventListener('click', stopTour);
    cardEl.querySelector('#tourNextBtn').addEventListener('click', isLast ? finishTour : nextStep);
    const prevBtn = cardEl.querySelector('#tourPrevBtn');
    if (prevBtn) prevBtn.addEventListener('click', prevStep);
  }

  /* =============================================
     Mise à jour du highlight
     ============================================= */
  function updateHighlight(el) {
    const r = el.getBoundingClientRect();
    const pad = 8;
    // position:fixed → coordonnées viewport directes, pas de scrollY
    highlightEl.style.top    = (r.top    - pad) + 'px';
    highlightEl.style.left   = (r.left   - pad) + 'px';
    highlightEl.style.width  = (r.width  + pad * 2) + 'px';
    highlightEl.style.height = (r.height + pad * 2) + 'px';
    highlightEl.style.display = 'block';
  }

  /* =============================================
     Affichage d'une étape
     ============================================= */
  function showStep(index) {
    if (index < 0 || index >= TOUR_STEPS.length) return;
    currentStep = index;
    const step = TOUR_STEPS[index];

    // Active l'onglet si nécessaire
    if (step.activeTab) {
      activateTab(step.activeTab);
    }

    // Délai pour laisser l'onglet s'afficher (si changement d'onglet)
    setTimeout(function () {
      const targetEl = resolveTarget(step);
      if (!targetEl) {
        // Élément introuvable → étape suivante
        if (index < TOUR_STEPS.length - 1) showStep(index + 1);
        return;
      }

      // Scroll instantané pour avoir getBoundingClientRect() fiable
      scrollIntoViewIfNeeded(targetEl);

      // 1) Rendre la carte (hors-écran) pour mesurer sa vraie hauteur
      cardEl.classList.remove('visible', 'entering');
      cardEl.style.opacity = '0';
      cardEl.style.display = 'block';
      renderCard(step, index, TOUR_STEPS.length);

      // 2) Laisser un frame pour que le layout soit calculé
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          // 3) Positionner highlight + carte (offsetHeight est maintenant réel)
          updateHighlight(targetEl);
          positionCard(step, targetEl);

          // 4) Animer l'apparition
          cardEl.style.opacity = '';
          cardEl.classList.add('entering');
          requestAnimationFrame(function () {
            cardEl.classList.remove('entering');
            cardEl.classList.add('visible');
          });
        });
      });
    }, step.activeTab ? 250 : 40);
  }

  /* =============================================
     Contrôles du tour
     ============================================= */
  function nextStep() {
    if (currentStep < TOUR_STEPS.length - 1) showStep(currentStep + 1);
  }

  function prevStep() {
    if (currentStep > 0) showStep(currentStep - 1);
  }

  function startTour() {
    // Ferme l'écran de bienvenue si ouvert
    if (welcomeEl) {
      welcomeEl.style.display = 'none';
      welcomeEl.classList.add('hidden');
    }
    isActive = true;
    launcherEl.classList.add('launcher-hidden');
    currentStep = 0;
    showStep(0);

    // Événement clavier
    document.addEventListener('keydown', onKeyDown);
    // Recalcul au resize et au scroll
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function stopTour() {
    isActive = false;
    highlightEl.style.display = 'none';
    cardEl.style.display = 'none';
    cardEl.classList.remove('visible', 'entering');
    launcherEl.classList.remove('launcher-hidden');
    document.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('scroll', onScroll);
    // Marque le tour comme vu globalement
    try { localStorage.setItem(GLOBAL_STORAGE_KEY, '1'); } catch (e) { /* ignore */ }
  }

  function finishTour() {
    stopTour();
    showFinishToast();
  }

  function getFinishCopy() {
    const byPage = {
      edit: {
        title: 'Tu es prêt à publier',
        subtitle: 'Continue dans l\'éditeur pour finaliser ton profil, tes liens et ton style.',
      },
      dashboard: {
        title: 'Tu maîtrises ton dashboard',
        subtitle: 'Passe à l\'action avec les raccourcis pour éditer, analyser et faire grandir ton audience.',
      },
      stats: {
        title: 'Tu es prêt à analyser',
        subtitle: 'Utilise les onglets et exports pour suivre précisément ta croissance.',
      },
      qrcodes: {
        title: 'Tu es prêt à créer tes QR codes',
        subtitle: 'Génère des visuels efficaces et commence à suivre tes scans en temps réel.',
      },
      'qrcode-edit': {
        title: 'Ton QR code est prêt à briller',
        subtitle: 'Ajuste les derniers détails visuels puis télécharge-le en PNG.',
      },
      generic: {
        title: 'Tu es prêt',
        subtitle: 'Tu peux maintenant utiliser cette page avec confiance.',
      },
    };

    return byPage[PAGE_KEY] || byPage.generic;
  }

  /* =============================================
     Toast de fin
     ============================================= */
  function showFinishToast() {
    const copy = getFinishCopy();
    const toast = document.createElement('div');
    toast.className = 'tour-finish-toast';
    toast.innerHTML = `
      <span class="tour-finish-toast-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"></path></svg>
      </span>
      <div class="tour-finish-toast-copy">
        <p class="tour-finish-toast-title">${copy.title}</p>
        <p class="tour-finish-toast-subtitle">${copy.subtitle}</p>
      </div>
      <span class="tour-finish-toast-progress" aria-hidden="true"></span>
    `;
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('visible');
    }, 30);

    setTimeout(function () {
      toast.classList.remove('visible');
      setTimeout(function () { toast.remove(); }, 350);
    }, 3500);
  }

  /* =============================================
     Événements
     ============================================= */
  function onScroll() {
    if (!isActive) return;
    const step = TOUR_STEPS[currentStep];
    const el = resolveTarget(step);
    if (el) {
      updateHighlight(el);
      positionCard(step, el);
    }
  }

  function onKeyDown(e) {
    if (!isActive) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextStep(); }
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); prevStep(); }
    if (e.key === 'Escape') { e.preventDefault(); stopTour(); }
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!isActive) return;
      const step = TOUR_STEPS[currentStep];
      const el = resolveTarget(step);
      if (el) {
        updateHighlight(el);
        positionCard(step, el);
      }
    }, 120);
  }

  /* =============================================
     Écran de bienvenue
     ============================================= */
  function showWelcome() {
    welcomeEl.style.display = 'flex';
    setTimeout(function () {
      welcomeEl.classList.remove('hidden');
    }, 30);

    const startBtn = welcomeEl.querySelector('#tourWelcomeStart');
    const skipBtn  = welcomeEl.querySelector('#tourWelcomeSkip');

    if (startBtn) startBtn.addEventListener('click', function () {
      welcomeEl.style.opacity = '0';
      setTimeout(function () {
        welcomeEl.style.display = 'none';
        try { localStorage.setItem(GLOBAL_STORAGE_KEY, '1'); } catch (e) { /* ignore */ }
        startTour();
      }, 280);
    });

    if (skipBtn) skipBtn.addEventListener('click', function () {
      welcomeEl.style.opacity = '0';
      setTimeout(function () {
        welcomeEl.style.display = 'none';
        try { localStorage.setItem(GLOBAL_STORAGE_KEY, '1'); } catch (e) { /* ignore */ }
      }, 280);
    });
  }

  /* =============================================
     Initialisation
     ============================================= */
  function init() {
    ensureTutorialCssLoaded();
    buildDOM();

    // Vérifie si l'utilisateur a JAMAIS vu le tutoriel (clé globale)
    let seen = false;
    try { seen = localStorage.getItem(GLOBAL_STORAGE_KEY) === '1'; } catch (e) { /* ignore */ }

    if (!seen) {
      // DASHBOARD: affiche l'écran de bienvenue
      if (PAGE_KEY === 'dashboard') {
        setTimeout(showWelcome, 900);
      }
      // AUTRES PAGES: démarre directement le tutoriel
      else {
        setTimeout(startTour, 900);
      }
    }

    // Expose l'API globale
    window.plinkkTour = {
      start: startTour,
      stop: stopTour,
      next: nextStep,
      prev: prevStep,
      goTo: showStep,
      reset: function () {
        try { localStorage.removeItem(GLOBAL_STORAGE_KEY); } catch (e) { /* ignore */ }
        stopTour();
        setTimeout(showWelcome, 200);
      },
    };
  }

  /* Attendre que le DOM soit chargé */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
