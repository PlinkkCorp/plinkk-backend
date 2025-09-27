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
        profileLink: "${profile.profileLink}", // Lien du profil 
        profileImage: "${profile.profileImage}", // Image de profil
        profileIcon: "${profile.profileIcon}", // Icone derrière le profil
        profileSiteText: "${profile.profileSiteText}", // Nom derrière le profil
        userName: "${
          profile.userName
        }", // Nom affiché sur la page et dans le titre de l'onglet
        email: "${profile.email}", // Adresse mail affichée sur la page
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
        iconUrl: "${profile.iconUrl}", // Icone de l'onglet
        description: "${
          profile.description
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
        neonEnable: ${profile.neonEnable}, // 1 : Enable, 0 : Disable
        buttonThemeEnable: ${
          profile.buttonThemeEnable
        }, // 1 : Enable, 0 : Disable
        EnableAnimationArticle: ${
          profile.EnableAnimationArticle
        }, // 1 : Enable, 0 : Disable
        EnableAnimationButton: ${
          profile.EnableAnimationButton
        }, // 1 : Enable, 0 : Disable
        EnableAnimationBackground: ${
          profile.EnableAnimationBackground
        }, // 1 : Enable, 0 : Disable
        backgroundSize: ${profile.backgroundSize}, // En pourcentage
        selectedThemeIndex: ${
          profile.selectedThemeIndex
        }, // Thème sélectionné            (voir ci-dessous)
        selectedAnimationIndex: ${
          profile.selectedAnimationIndex
        }, // Animation de l'article       (voir ci-dessous)
        selectedAnimationButtonIndex: ${
          profile.selectedAnimationButtonIndex
        }, // Animation des boutons        (voir ci-dessous)
        selectedAnimationBackgroundIndex: ${
          profile.selectedAnimationBackgroundIndex
        }, // Animation de l'arrière-plan  (voir ci-dessous)
        animationDurationBackground: ${
          profile.animationDurationBackground
        }, // Durée de l'animation en secondes
        delayAnimationButton: ${
          profile.delayAnimationButton
        }, // Délai de l'animation en secondes
        canvaEnable: ${profile.canvaEnable}, // 1 : Enable, 0 : Disable
        selectedCanvasIndex: ${
          profile.selectedCanvasIndex
        }, // Animation du canva (voir ci-dessous) - Matrix Effect
    };
    export default profileData;
    `;
}
