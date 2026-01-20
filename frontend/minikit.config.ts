/**
 * Base Mini App Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Deploy your app to a public domain (e.g., Vercel)
 * 2. Disable deployment protection in your hosting provider
 * 3. Go to https://base.dev and use the account association tool
 * 4. Enter your domain and complete the verification flow
 * 5. Copy the returned accountAssociation values below
 * 6. Replace YOUR_DOMAIN with your actual production domain
 */

export const minikitConfig = {
  // Account association - Required for verification
  // Get these values from https://base.dev after domain verification
  accountAssociation: {
    header: "REPLACE_WITH_YOUR_HEADER",
    payload: "REPLACE_WITH_YOUR_PAYLOAD",
    signature: "REPLACE_WITH_YOUR_SIGNATURE",
  },

  // Mini App configuration
  miniapp: {
    version: "1",
    name: "BaseRPS",
    subtitle: "Battle for ETH",
    description:
      "PvP Rock Paper Scissors on Base. Commit-reveal mechanics, overtime system, instant payouts.",

    // URLs - Replace YOUR_DOMAIN with your production domain
    homeUrl: "https://YOUR_DOMAIN",
    iconUrl: "https://YOUR_DOMAIN/icon.png",
    splashImageUrl: "https://YOUR_DOMAIN/splash.png",
    heroImageUrl: "https://YOUR_DOMAIN/hero.png",

    // Screenshots (portrait orientation, 9:16 aspect ratio recommended)
    screenshotUrls: [
      "https://YOUR_DOMAIN/screenshots/screenshot-1.png",
      "https://YOUR_DOMAIN/screenshots/screenshot-2.png",
      "https://YOUR_DOMAIN/screenshots/screenshot-3.png",
    ],

    // Appearance
    splashBackgroundColor: "#1e3a8a",

    // Discovery
    primaryCategory: "games",
    tags: [
      "game",
      "pvp",
      "rock-paper-scissors",
      "eth",
      "base",
      "betting",
      "web3",
      "competitive",
    ],

    // Open Graph (social sharing)
    ogTitle: "BaseRPS - Battle for ETH",
    ogDescription:
      "PvP Rock Paper Scissors on Base Network. Challenge opponents, bet ETH, win big!",
    ogImageUrl: "https://YOUR_DOMAIN/og-image.png",

    // Push notifications (optional)
    webhookUrl: "https://YOUR_DOMAIN/api/webhooks/miniapp",
  },
};

export default minikitConfig;
