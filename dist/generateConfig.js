"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateProfileConfig = generateProfileConfig;
function generateProfileConfig(profile, links, backgroundColors, labels, neonColors, socialIcons, statusBar) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    return `
    export const profileData = {
        profileLink: "${profile.profileLink || "https://github.com"}", // Lien du profil 
        profileImage: "${profile.profileImage || "https://avatars.githubusercontent.com/u/9919?s=200&v=4"}", // Image de profil
        profileIcon: "${profile.profileIcon || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"}", // Icone derrière le profil
        profileSiteText: "${profile.profileSiteText || "Github"}", // Nom derrière le profil
        userName: "${profile.userName || "Github"}", // Nom affiché sur la page et dans le titre de l'onglet
        email: "${profile.email || "example@example.fr"}", // Adresse mail affichée sur la page
        links: ${JSON.stringify(links.map((l) => ({
        icon: l.icon,
        url: l.url,
        text: l.text,
        name: l.name,
        description: l.description,
        showDescriptionOnHover: l.showDescriptionOnHover,
        showDescription: l.showDescription
    })))},
        // Fond de la page si une liste est utilisée alors le fond sera via les couleurs que vous mettez dedans
        background: [${backgroundColors.map((c) => '"' + c.color + '"')}], //"https://static.vecteezy.com/ti/vecteur-libre/p1/12697876-motif-geometriquele-continue-noir-et-blanc-motif-repetitif-monochrome-arriere-plan-abstrait-optique-tridimensionnel-avec-cubes-troues-vectoriel.jpg",
        degBackgroundColor: ${profile.degBackgroundColor}, // inclinaison du degradé
        profileHoverColor: "${profile.profileHoverColor}", // Couleur de hover sur l'article (l'élément principal)
        neonColors: [${neonColors.map((c) => '"' + c.color + '"')}], // Couleurs du neon de profil
        iconUrl: "${profile.iconUrl || "https://avatars.githubusercontent.com/u/9919?s=200&v=4"}", // Icone de l'onglet
        description: "${profile.description || "Mollit laboris cupidatat do enim nulla ex laborum. Nulla labore reprehenderit nisi non anim aute."}", // Description affichée sur la page, display: none si vide
        labels: ${JSON.stringify(labels.map((l) => ({
        data: l.data,
        color: l.color,
        fontColor: l.fontColor,
    })))},
        socialIcon: ${JSON.stringify(socialIcons.map((l) => ({ url: l.url, icon: l.icon })))},
        statusbar: ${JSON.stringify(statusBar)}, // Barre de statut , fontTextColor : 1 = borderColor, 0 = colorBg
        neonEnable: ${(_a = profile.neonEnable) !== null && _a !== void 0 ? _a : 1}, // 1 : Enable, 0 : Disable
        buttonThemeEnable: ${(_b = profile.buttonThemeEnable) !== null && _b !== void 0 ? _b : 1}, // 1 : Enable, 0 : Disable
        EnableAnimationArticle: ${(_c = profile.EnableAnimationArticle) !== null && _c !== void 0 ? _c : 1}, // 1 : Enable, 0 : Disable
        EnableAnimationButton: ${(_d = profile.EnableAnimationButton) !== null && _d !== void 0 ? _d : 1}, // 1 : Enable, 0 : Disable
        EnableAnimationBackground: ${(_e = profile.EnableAnimationBackground) !== null && _e !== void 0 ? _e : 1}, // 1 : Enable, 0 : Disable
        backgroundSize: ${(_f = profile.backgroundSize) !== null && _f !== void 0 ? _f : 50}, // En pourcentage
        selectedThemeIndex: ${(_g = profile.selectedThemeIndex) !== null && _g !== void 0 ? _g : 13}, // Thème sélectionné            (voir ci-dessous)
        selectedAnimationIndex: ${(_h = profile.selectedAnimationIndex) !== null && _h !== void 0 ? _h : 0}, // Animation de l'article       (voir ci-dessous)
        selectedAnimationButtonIndex: ${(_j = profile.selectedAnimationButtonIndex) !== null && _j !== void 0 ? _j : 10}, // Animation des boutons        (voir ci-dessous)
        selectedAnimationBackgroundIndex: ${(_k = profile.selectedAnimationBackgroundIndex) !== null && _k !== void 0 ? _k : 10}, // Animation de l'arrière-plan  (voir ci-dessous)
        animationDurationBackground: ${(_l = profile.animationDurationBackground) !== null && _l !== void 0 ? _l : 30}, // Durée de l'animation en secondes
        delayAnimationButton: ${(_m = profile.delayAnimationButton) !== null && _m !== void 0 ? _m : 0.1}, // Délai de l'animation en secondes
        canvaEnable: ${(_o = profile.canvaEnable) !== null && _o !== void 0 ? _o : 1}, // 1 : Enable, 0 : Disable
        selectedCanvasIndex: ${(_p = profile.selectedCanvasIndex) !== null && _p !== void 0 ? _p : 16}, // Animation du canva (voir ci-dessous) - Matrix Effect
    };
    export default profileData;
    `;
}
