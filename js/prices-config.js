/**
 * =====================================
 * CAPE METADATA (prices, names, copy)
 * Images are resolved from data/cape-assets.json
 * =====================================
 */

const CAPES = [
  {
    id: 'home',
    name: 'Home Cape',
    price: '$2',
    description:
      'Promotional cape for A Minecraft Movie, earned via a Twitch WatchTime reward (March 18–April 6, 2025). New codes can no longer be obtained from the promotion. Redeem at minecraft.net/redeem.',
    glow: '#5a8f3c',
  },
  {
    id: 'menace',
    name: 'Menace Cape',
    price: '$3',
    description:
      'Promotional cape for A Minecraft Movie, earned via a TikTok WatchTime reward (through April 20, 2025). New codes can no longer be obtained from the promotion. Redeem at minecraft.net/redeem.',
    glow: '#dc2626',
  },
  {
    id: 'copper',
    name: 'Copper Cape',
    price: '$2',
    description:
      'Reward from the Copper Cape Quest (Copper Age update, October 2025)—via Twitch/TikTok drops, in-game Bedrock activity, or TwitchCon codes. Code earning ended; unused codes may still redeem while valid.',
    glow: '#c87533',
  },
  {
    id: 'purpleHeart',
    name: 'Purple Heart Cape',
    price: '$8',
    description:
      '15th Anniversary Twitch drop (May 15–31, 2024): watch 15 minutes of Minecraft on Twitch to earn a code. New codes can no longer be obtained; unused codes may still work at minecraft.net/redeem.',
    glow: '#a855f7',
  },
  {
    id: 'experience',
    name: 'Experience Cape',
    price: '$40',
    description:
      'Exclusive cape from Minecraft Experience: Villager Rescue—issued after attending the in-person event (ticket scanned, experience completed). Not sold in-game; new codes only from event attendance.',
    glow: '#22c55e',
  },
  {
    id: 'builder',
    name: 'Builder Cape',
    price: '$2',
    description:
      'TwitchCon 2026 / Minecraft Live promotion—earned by watching Minecraft on Twitch (5 min) or TikTok (3 min) between May 30 and mid-June 2026. New codes can no longer be obtained from the drop.',
    glow: '#eab308',
  },
  {
    id: 'moonlight',
    name: 'Moonlight Cape',
    price: '$150',
    description:
      'Exclusive to Minecraft Experience: Moonlight Trail in Buenos Aires—code emailed within 72 hours after completing the event. Requires in-person attendance; not available through in-game purchase.',
    glow: '#93c5fd',
    assetSlug: 'moonlight-trail',
  },
  {
    id: 'crafter',
    name: 'Crafter Cape',
    price: '$600',
    description:
      'TwitchCon Rotterdam 2026 in-person exclusive—earned by collecting three Emerald stickers at the event. Online drops were not offered; new codes only came from attendance.',
    glow: '#d97706',
  },
];

const SHOWCASE_CAPES = CAPES;

/** Homepage index only — order preserved */
const INDEX_SHOWCASE_CAPE_IDS = ['moonlight', 'crafter', 'experience'];

const SITE_LINKS = {
  discord: 'https://discord.gg/vTCPxq9zAT',
};

/** Shown on verification / contact sections — username must match exactly */
const DISCORD_VERIFY_USERNAME = 'getmeintogaming';

/** User-provided seller track record */
const SELLER_STATS = {
  dealtValue: '$40K+',
  dealtLabel: 'Dealt over',
  vouchesValue: '300+',
  vouchesLabel: 'Vouches',
};

/**
 * Site configuration
 * ──────────────────
 * supportEmail: displayed on support page and used for mailto / copy actions
 */
const SITE_CONFIG = {
  supportEmail: 'Hvtdevil@gmail.com',
};

/** Payment methods — PayPal is Friends & Family only */
const PAYMENT_METHODS = {
  paypal: {
    id: 'paypal',
    name: 'PayPal',
    shortLabel: 'PayPal (Friends & Family)',
    friendsAndFamilyOnly: true,
    description:
      'PayPal Friends & Family (F&F) only. Goods & Services or other payment types are not accepted and may delay your order while we verify or refund the payment.',
    checkoutNotice:
      'When paying with PayPal, you must send payment as Friends & Family (F&F). Using Goods & Services or selecting the wrong payment type may delay your order.',
    bullets: [
      'Friends & Family (F&F) only — not Goods & Services',
      'Send only after your order is confirmed in Discord',
      'Include the agreed reference note if requested',
    ],
  },
  crypto: {
    id: 'crypto',
    name: 'Cryptocurrency',
    shortLabel: 'Cryptocurrency',
    description:
      'Cryptocurrency is accepted for purchases initiated through Discord. The specific coin and wallet address will be provided when your order is confirmed.',
    checkoutNotice:
      'When paying with cryptocurrency, send only to the wallet address provided in Discord for your confirmed order.',
    bullets: [
      'Wallet address provided in Discord after order confirmation',
      'Send the exact amount quoted for your order',
      'Network fees are your responsibility',
    ],
  },
};

/** Set false after verifying asset detection in the browser console */
const CAPE_ASSET_DEBUG = false;
