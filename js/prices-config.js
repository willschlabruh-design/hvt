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
    description: 'Official Minecraft Home Cape — cozy house emblem on warm cream fabric.',
    glow: '#5a8f3c',
  },
  {
    id: 'menace',
    name: 'Menace Cape',
    price: '$3',
    description: 'Official Minecraft Menace Cape — dark void fabric with glowing crimson eyes.',
    glow: '#dc2626',
  },
  {
    id: 'copper',
    name: 'Copper Cape',
    price: '$2',
    description: 'Official Minecraft Copper Cape — oxidized copper plating with teal patina.',
    glow: '#c87533',
  },
  {
    id: 'purpleHeart',
    name: 'Purple Heart Cape',
    price: '$8',
    description: 'Official Minecraft Purple Heart Cape — rich violet with a pixel heart crest.',
    glow: '#a855f7',
  },
  {
    id: 'experience',
    name: 'Experience Cape',
    price: '$40',
    description: 'Official Minecraft Experience Cape — emerald tones with luminous XP orbs.',
    glow: '#22c55e',
  },
  {
    id: 'builder',
    name: 'Builder Cape',
    price: '$24.99',
    description: 'Official Minecraft Builder Cape — golden brickwork with builder tools motif.',
    glow: '#eab308',
  },
  {
    id: 'moonlight',
    name: 'Moonlight Cape',
    price: '$200',
    description: 'Official Minecraft Moonlight Cape — midnight blue with silver crescent and stars.',
    glow: '#93c5fd',
    assetSlug: 'moonlight-trail',
  },
  {
    id: 'crafter',
    name: 'Crafter Cape',
    price: '$350',
    description: 'Official Minecraft Crafter Cape — crafting table grid on warm oak fabric.',
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

/** Set false after verifying asset detection in the browser console */
const CAPE_ASSET_DEBUG = false;
