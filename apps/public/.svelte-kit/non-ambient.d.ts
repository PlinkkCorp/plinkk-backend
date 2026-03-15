
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/about" | "/api" | "/api/partners" | "/api/partners/[partnerId]" | "/api/partners/[partnerId]/view" | "/api/quests" | "/api/quests/[questId]" | "/api/quests/[questId]/complete" | "/api/track-click" | "/api/track-click/[linkId]" | "/api/track-view" | "/api/track-view/[plinkkId]" | "/a" | "/a/[slug]" | "/cgv" | "/cookies" | "/docs" | "/features" | "/legal" | "/partners" | "/patch-notes" | "/patch-notes/[version]" | "/pricing" | "/privacy" | "/p" | "/p/[slug]" | "/terms" | "/users";
		RouteParams(): {
			"/api/partners/[partnerId]": { partnerId: string };
			"/api/partners/[partnerId]/view": { partnerId: string };
			"/api/quests/[questId]": { questId: string };
			"/api/quests/[questId]/complete": { questId: string };
			"/api/track-click/[linkId]": { linkId: string };
			"/api/track-view/[plinkkId]": { plinkkId: string };
			"/a/[slug]": { slug: string };
			"/patch-notes/[version]": { version: string };
			"/p/[slug]": { slug: string }
		};
		LayoutParams(): {
			"/": { partnerId?: string; questId?: string; linkId?: string; plinkkId?: string; slug?: string; version?: string };
			"/about": Record<string, never>;
			"/api": { partnerId?: string; questId?: string; linkId?: string; plinkkId?: string };
			"/api/partners": { partnerId?: string };
			"/api/partners/[partnerId]": { partnerId: string };
			"/api/partners/[partnerId]/view": { partnerId: string };
			"/api/quests": { questId?: string };
			"/api/quests/[questId]": { questId: string };
			"/api/quests/[questId]/complete": { questId: string };
			"/api/track-click": { linkId?: string };
			"/api/track-click/[linkId]": { linkId: string };
			"/api/track-view": { plinkkId?: string };
			"/api/track-view/[plinkkId]": { plinkkId: string };
			"/a": { slug?: string };
			"/a/[slug]": { slug: string };
			"/cgv": Record<string, never>;
			"/cookies": Record<string, never>;
			"/docs": Record<string, never>;
			"/features": Record<string, never>;
			"/legal": Record<string, never>;
			"/partners": Record<string, never>;
			"/patch-notes": { version?: string };
			"/patch-notes/[version]": { version: string };
			"/pricing": Record<string, never>;
			"/privacy": Record<string, never>;
			"/p": { slug?: string };
			"/p/[slug]": { slug: string };
			"/terms": Record<string, never>;
			"/users": Record<string, never>
		};
		Pathname(): "/" | "/about" | `/api/partners/${string}/view` & {} | `/api/quests/${string}/complete` & {} | `/api/track-click/${string}` & {} | `/api/track-view/${string}` & {} | `/a/${string}` & {} | "/cgv" | "/cookies" | "/docs" | "/features" | "/legal" | "/partners" | "/patch-notes" | `/patch-notes/${string}` & {} | "/pricing" | "/privacy" | `/p/${string}` & {} | "/terms" | "/users";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/canvaAnimation/boomclick.js" | "/canvaAnimation/bubble.js" | "/canvaAnimation/cloud.js" | "/canvaAnimation/colorwars.js" | "/canvaAnimation/confetti.js" | "/canvaAnimation/crowd.js" | "/canvaAnimation/fireworks.js" | "/canvaAnimation/galaxy.js" | "/canvaAnimation/hexagone.js" | "/canvaAnimation/liquidslights.js" | "/canvaAnimation/matrix-effect/app.js" | "/canvaAnimation/matrix-effect/effect.js" | "/canvaAnimation/matrix-effect/symbol.js" | "/canvaAnimation/neuronal.js" | "/canvaAnimation/particule.js" | "/canvaAnimation/purpletree.js" | "/canvaAnimation/rain.js" | "/canvaAnimation/snow.js" | "/canvaAnimation/space.js" | "/canvaAnimation/starsarray.js" | "/canvaAnimation/storm.js" | "/config/animationConfig.js" | "/config/btnIconThemeConfig.js" | "/config/canvaConfig.js" | "/config/labelPresets.js" | "/config/themeConfig.js" | "/css/button.css" | "/css/landing.css" | "/css/styles.css" | "/html/canva-preview.html" | "/images/baniere.svg" | "/images/default_profile.png" | "/images/gems.svg" | "/images/icons/amazon-music.svg" | "/images/icons/amazon.svg" | "/images/icons/apple-music-alt.svg" | "/images/icons/apple-music.svg" | "/images/icons/apple-podcasts-alt.svg" | "/images/icons/apple-podcasts.svg" | "/images/icons/apple.svg" | "/images/icons/artstation.svg" | "/images/icons/bandcamp.svg" | "/images/icons/behance.svg" | "/images/icons/blog.svg" | "/images/icons/bluesky-alt.svg" | "/images/icons/bluesky.svg" | "/images/icons/buy-me-a-coffee.svg" | "/images/icons/cal.svg" | "/images/icons/calendly.svg" | "/images/icons/cash-app-btc.svg" | "/images/icons/cash-app-dollar.svg" | "/images/icons/cash-app-pound.svg" | "/images/icons/dev-to.svg" | "/images/icons/discogs-alt.svg" | "/images/icons/discogs.svg" | "/images/icons/discord.svg" | "/images/icons/dribbble.svg" | "/images/icons/email-alt.svg" | "/images/icons/email.svg" | "/images/icons/etsy.svg" | "/images/icons/facebook.svg" | "/images/icons/figma.svg" | "/images/icons/fiverr.svg" | "/images/icons/flickr.svg" | "/images/icons/generic-blog.svg" | "/images/icons/generic-calendar.svg" | "/images/icons/generic-cloud.svg" | "/images/icons/generic-code.svg" | "/images/icons/generic-computer.svg" | "/images/icons/generic-email-alt.svg" | "/images/icons/generic-email.svg" | "/images/icons/generic-homepage.svg" | "/images/icons/generic-map.svg" | "/images/icons/generic-phone.svg" | "/images/icons/generic-review.svg" | "/images/icons/generic-rss.svg" | "/images/icons/generic-shopping-bag.svg" | "/images/icons/generic-shopping-tag.svg" | "/images/icons/generic-sms.svg" | "/images/icons/generic-website.svg" | "/images/icons/github.svg" | "/images/icons/gitlab.svg" | "/images/icons/gofundme.svg" | "/images/icons/goodreads.svg" | "/images/icons/google-alt.svg" | "/images/icons/google-drive.svg" | "/images/icons/google-play.svg" | "/images/icons/google-podcasts.svg" | "/images/icons/google-scholar.svg" | "/images/icons/google.svg" | "/images/icons/hashnode.svg" | "/images/icons/instagram.svg" | "/images/icons/kick-alt.svg" | "/images/icons/kick.svg" | "/images/icons/kickstarter.svg" | "/images/icons/kit.svg" | "/images/icons/ko-fi.svg" | "/images/icons/last-fm.svg" | "/images/icons/letterboxd.svg" | "/images/icons/line.svg" | "/images/icons/linkedin.svg" | "/images/icons/littlelink.svg" | "/images/icons/mailchimp.svg" | "/images/icons/mastodon.svg" | "/images/icons/medium.svg" | "/images/icons/messenger.svg" | "/images/icons/microsoft.svg" | "/images/icons/ngl.svg" | "/images/icons/notion.svg" | "/images/icons/obsidian.svg" | "/images/icons/onlyfans.svg" | "/images/icons/patreon.svg" | "/images/icons/paypal.svg" | "/images/icons/pinterest.svg" | "/images/icons/product-hunt.svg" | "/images/icons/read-cv.svg" | "/images/icons/reddit.svg" | "/images/icons/shop.svg" | "/images/icons/signal.svg" | "/images/icons/slack.svg" | "/images/icons/snapchat.svg" | "/images/icons/soundcloud.svg" | "/images/icons/spotify-alt.svg" | "/images/icons/spotify.svg" | "/images/icons/square.svg" | "/images/icons/stack-overflow.svg" | "/images/icons/steam.svg" | "/images/icons/strava.svg" | "/images/icons/substack.svg" | "/images/icons/telegram.svg" | "/images/icons/threads.svg" | "/images/icons/threema.svg" | "/images/icons/tiktok.svg" | "/images/icons/trello.svg" | "/images/icons/tumblr.svg" | "/images/icons/twitch.svg" | "/images/icons/unsplash.svg" | "/images/icons/venmo.svg" | "/images/icons/vimeo.svg" | "/images/icons/vrchat.svg" | "/images/icons/vsco.svg" | "/images/icons/web.svg" | "/images/icons/whatsapp.svg" | "/images/icons/wordpress.svg" | "/images/icons/x.svg" | "/images/icons/youtube-alt.svg" | "/images/icons/youtube-music.svg" | "/images/icons/youtube.svg" | "/images/icons/zoom.svg" | "/images/landing/dashboard.svg" | "/images/landing/editor.svg" | "/images/landing/profile.svg" | "/images/logo-klay.png" | "/images/logo.svg" | "/js/cookies.js" | "/js/dashboard-stats.js" | "/js/dashboard-ui/canvas.js" | "/js/dashboard-ui/index.js" | "/js/dashboard-ui/pickers.js" | "/js/dashboard-ui/renderers.js" | "/js/dashboard-ui/status.js" | "/js/dashboard-ui/utils.js" | "/js/dashboard.js" | "/js/easterEggs.js" | "/js/init.js" | "/js/inlineEdit.js" | "/js/pagination.js" | "/js/security.js" | "/js/styleTools.js" | "/js/themesStore.js" | "/js/tools.js" | "/uploads/avatars/marvideo.png" | string & {};
	}
}