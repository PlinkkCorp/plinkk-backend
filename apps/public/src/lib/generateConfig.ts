import {
  Link,
  BackgroundColor,
  Label,
  NeonColor,
  SocialIcon,
  PlinkkStatusbar,
  PlinkkSettings,
  User,
} from "@plinkk/prisma/generated/prisma";

export function generateProfileConfig(
  profile: User & PlinkkSettings,
  links: Link[],
  backgroundColors: BackgroundColor[],
  labels: Label[],
  neonColors: NeonColor[],
  socialIcons: SocialIcon[],
  statusBar: PlinkkStatusbar,
  injectedTheme?: JSON
) {
  return `
    export const injectedTheme = ${injectedTheme ? JSON.stringify(injectedTheme) : 'null'};
    export const profileData = {
        profileLink: ${JSON.stringify(profile.profileLink || "")},
        profileImage: ${JSON.stringify(profile.profileImage || "")},
        profileIcon: ${JSON.stringify(profile.profileIcon || "")},
        profileSiteText: ${JSON.stringify(profile.profileSiteText || "")},
        userName: ${JSON.stringify(profile.userName || "User")},
  email: ${JSON.stringify(profile.publicEmail || "")},
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
        background: ${JSON.stringify(backgroundColors.map((c) => c.color))},
        degBackgroundColor: ${
          profile.degBackgroundColor ?? 45
        },
        profileHoverColor: ${JSON.stringify(profile.profileHoverColor)},
        neonColors: ${JSON.stringify(neonColors.map((c) => c.color))},
        iconUrl: ${JSON.stringify(profile.iconUrl || "")},
        description: ${JSON.stringify(profile.description || "")},
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
        )},
        neonEnable: ${profile.neonEnable ?? 1},
        buttonThemeEnable: ${
          profile.buttonThemeEnable ?? 1
        },
        EnableAnimationArticle: ${
          profile.EnableAnimationArticle ?? 1
        },
        EnableAnimationButton: ${
          profile.EnableAnimationButton ?? 1
        },
        EnableAnimationBackground: ${
          profile.EnableAnimationBackground ?? 1
        },
        backgroundSize: ${profile.backgroundSize ?? 50},
        selectedThemeIndex: ${
          profile.selectedThemeIndex ?? 13
        },
        selectedAnimationIndex: ${
          profile.selectedAnimationIndex ?? 0
        },
        selectedAnimationButtonIndex: ${
          profile.selectedAnimationButtonIndex ?? 10
        },
        selectedAnimationBackgroundIndex: ${
          profile.selectedAnimationBackgroundIndex ?? 10
        },
        animationDurationBackground: ${
          profile.animationDurationBackground ?? 30
        },
        delayAnimationButton: ${
          profile.delayAnimationButton ?? 0.1
        },
        canvaEnable: ${profile.canvaEnable ?? 1},
        selectedCanvasIndex: ${
          profile.selectedCanvasIndex ?? 16
        },
        layoutOrder: ${JSON.stringify((profile).layoutOrder ?? null)},
        cosmetics: ${JSON.stringify((profile as any).cosmetics || {})},
    };
    export default profileData;
    `;
}
