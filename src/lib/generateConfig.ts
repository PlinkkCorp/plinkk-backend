import {
  Link,
  BackgroundColor,
  Label,
  NeonColor,
  SocialIcon,
  PlinkkStatusbar,
} from "../../generated/prisma";

export function generateProfileConfig(
  profile: any,
  links: Link[],
  backgroundColors: BackgroundColor[],
  labels: Label[],
  neonColors: NeonColor[],
  socialIcons: SocialIcon[],
  statusBar: PlinkkStatusbar,
  injectedTheme?: any
) {
  return `
    export const injectedTheme = ${injectedTheme ? JSON.stringify(injectedTheme) : 'null'};
    export const profileData = {
        profileLink: ${JSON.stringify(profile.profileLink || "")}, // Lien du profil 
        profileImage: ${JSON.stringify(profile.profileImage || "")}, // Image de profil
        profileIcon: ${JSON.stringify(profile.profileIcon || "")}, // Icone derrière le profil
        profileSiteText: ${JSON.stringify(profile.profileSiteText || "")}, // Nom derrière le profil
        userName: ${JSON.stringify(profile.userName || "User")}, // Nom affiché sur la page et dans le titre de l'onglet
  email: ${JSON.stringify(profile.publicEmail || "")}, // Adresse mail publique affichée sur la page (découplée)
        links: ${JSON.stringify(
          links.map((l) => ({
            icon: l.icon,
            url: l.url,
            id: l.id,
            text: l.text,
            name: l.name,
            description: l.description,
            showDescriptionOnHover: l.showDescriptionOnHover,
            showDescription: l.showDescription
          }))
        )},
        // Fond de la page si une liste est utilisée alors le fond sera via les couleurs que vous mettez dedans
        background: ${JSON.stringify(backgroundColors.map((c) => c.color))}, //"https://static.vecteezy.com/ti/vecteur-libre/p1/12697876-motif-geometriquele-continue-noir-et-blanc-motif-repetitif-monochrome-arriere-plan-abstrait-optique-tridimensionnel-avec-cubes-troues-vectoriel.jpg",
        degBackgroundColor: ${
          profile.degBackgroundColor
        }, // inclinaison du degradé
        profileHoverColor: ${JSON.stringify(profile.profileHoverColor)}, // Couleur de hover sur l'article (l'élément principal)
        neonColors: ${JSON.stringify(neonColors.map((c) => c.color))}, // Couleurs du neon de profil
        iconUrl: ${JSON.stringify(profile.iconUrl || "")}, // Icone de l'onglet
        description: ${JSON.stringify(profile.description || "")}, // Description affichée sur la page, display: none si vide
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
          statusBar ?? { text: "", colorBg: "#222222", fontTextColor: 1, statusText: "offline" }
        )}, // Barre de statut , fontTextColor : 1 = borderColor, 0 = colorBg
        neonEnable: ${profile.neonEnable ?? 1}, // 1 : Enable, 0 : Disable
        buttonThemeEnable: ${
          profile.buttonThemeEnable ?? 1
        }, // 1 : Enable, 0 : Disable
        EnableAnimationArticle: ${
          profile.EnableAnimationArticle ?? 1
        }, // 1 : Enable, 0 : Disable
        EnableAnimationButton: ${
          profile.EnableAnimationButton ?? 1
        }, // 1 : Enable, 0 : Disable
        EnableAnimationBackground: ${
          profile.EnableAnimationBackground ?? 1
        }, // 1 : Enable, 0 : Disable
        backgroundSize: ${profile.backgroundSize ?? 50}, // En pourcentage
        selectedThemeIndex: ${
          profile.selectedThemeIndex ?? 13
        }, // Thème sélectionné            (voir ci-dessous)
        selectedAnimationIndex: ${
          profile.selectedAnimationIndex ?? 0
        }, // Animation de l'article       (voir ci-dessous)
        selectedAnimationButtonIndex: ${
          profile.selectedAnimationButtonIndex ?? 10
        }, // Animation des boutons        (voir ci-dessous)
        selectedAnimationBackgroundIndex: ${
          profile.selectedAnimationBackgroundIndex ?? 10
        }, // Animation de l'arrière-plan  (voir ci-dessous)
        animationDurationBackground: ${
          profile.animationDurationBackground ?? 30
        }, // Durée de l'animation en secondes
        delayAnimationButton: ${
          profile.delayAnimationButton ?? 0.1
        }, // Délai de l'animation en secondes
        canvaEnable: ${profile.canvaEnable ?? 1}, // 1 : Enable, 0 : Disable
        selectedCanvasIndex: ${
          profile.selectedCanvasIndex ?? 16
        }, // Animation du canva (voir ci-dessous) - Matrix Effect
    };
    export default profileData;
    `;
}
