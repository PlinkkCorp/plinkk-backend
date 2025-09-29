import {
  User,
  Link,
  BackgroundColor,
  Label,
  NeonColor,
  SocialIcon,
  Statusbar,
} from "../generated/prisma";

export function generateProfileConfig(
  profile: User,
  links: Link[],
  backgroundColors: BackgroundColor[],
  labels: Label[],
  neonColors: NeonColor[],
  socialIcons: SocialIcon[],
  statusBar: Statusbar
) {
  return `
    export const profileData = {
        profileLink: "${profile.profileLink || "https://github.com"}", // Lien du profil 
        profileImage: "${profile.profileImage || "https://avatars.githubusercontent.com/u/9919?s=200&v=4"}", // Image de profil
        profileIcon: "${profile.profileIcon || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"}", // Icone derrière le profil
        profileSiteText: "${profile.profileSiteText || "Github"}", // Nom derrière le profil
        userName: "${
          profile.userName || "Github"
        }", // Nom affiché sur la page et dans le titre de l'onglet
        email: "${profile.email || "example@example.fr"}", // Adresse mail affichée sur la page
        links: ${JSON.stringify(
          links.map((l) => ({
            icon: l.icon,
            url: l.url,
            text: l.text,
            name: l.name,
            description: l.description,
            showDescriptionOnHover: l.showDescriptionOnHover,
            showDescription: l.showDescription
          }))
        )},
        // Fond de la page si une liste est utilisée alors le fond sera via les couleurs que vous mettez dedans
        background: [${backgroundColors.map(
          (c) => '"' + c.color + '"'
        )}], //"https://static.vecteezy.com/ti/vecteur-libre/p1/12697876-motif-geometriquele-continue-noir-et-blanc-motif-repetitif-monochrome-arriere-plan-abstrait-optique-tridimensionnel-avec-cubes-troues-vectoriel.jpg",
        degBackgroundColor: ${
          profile.degBackgroundColor
        }, // inclinaison du degradé
        profileHoverColor: "${
          profile.profileHoverColor
        }", // Couleur de hover sur l'article (l'élément principal)
        neonColors: [${neonColors.map(
          (c) => '"' + c.color + '"'
        )}], // Couleurs du neon de profil
        iconUrl: "${profile.iconUrl || "https://avatars.githubusercontent.com/u/9919?s=200&v=4"}", // Icone de l'onglet
        description: "${
          profile.description || "Mollit laboris cupidatat do enim nulla ex laborum. Nulla labore reprehenderit nisi non anim aute."
        }", // Description affichée sur la page, display: none si vide
        labels: ${JSON.stringify(
          labels.map((l) => ({
            data: l.data,
            color: l.color,
            fontColor: l.fontColor,
          }))
        )},
        socialIcon: ${JSON.stringify(
          socialIcons.map((l) => ({ url: l.url, icon: l.icon }))
        )},
        statusbar: ${JSON.stringify(
          statusBar
        )}, // Barre de statut , fontTextColor : 1 = borderColor, 0 = colorBg
        neonEnable: ${profile.neonEnable || 1}, // 1 : Enable, 0 : Disable
        buttonThemeEnable: ${
          profile.buttonThemeEnable || 1
        }, // 1 : Enable, 0 : Disable
        EnableAnimationArticle: ${
          profile.EnableAnimationArticle || 1
        }, // 1 : Enable, 0 : Disable
        EnableAnimationButton: ${
          profile.EnableAnimationButton || 1
        }, // 1 : Enable, 0 : Disable
        EnableAnimationBackground: ${
          profile.EnableAnimationBackground || 1
        }, // 1 : Enable, 0 : Disable
        backgroundSize: ${profile.backgroundSize || 50}, // En pourcentage
        selectedThemeIndex: ${
          profile.selectedThemeIndex || 13
        }, // Thème sélectionné            (voir ci-dessous)
        selectedAnimationIndex: ${
          profile.selectedAnimationIndex || 0
        }, // Animation de l'article       (voir ci-dessous)
        selectedAnimationButtonIndex: ${
          profile.selectedAnimationButtonIndex || 10
        }, // Animation des boutons        (voir ci-dessous)
        selectedAnimationBackgroundIndex: ${
          profile.selectedAnimationBackgroundIndex || 10
        }, // Animation de l'arrière-plan  (voir ci-dessous)
        animationDurationBackground: ${
          profile.animationDurationBackground || 30
        }, // Durée de l'animation en secondes
        delayAnimationButton: ${
          profile.delayAnimationButton || 0.1
        }, // Délai de l'animation en secondes
        canvaEnable: ${profile.canvaEnable || 1}, // 1 : Enable, 0 : Disable
        selectedCanvasIndex: ${
          profile.selectedCanvasIndex || 16
        }, // Animation du canva (voir ci-dessous) - Matrix Effect
    };
    export default profileData;
    `;
}
