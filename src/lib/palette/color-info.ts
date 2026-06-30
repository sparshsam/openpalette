import { normalizeHex, hexToHsl } from "./color";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ColorInfo = {
  name: string;
  hex: string;
  psychology: string;
  meaning: string;
  applications: string[];
};

// ---------------------------------------------------------------------------
// Static color database
// ---------------------------------------------------------------------------

const COLOR_DB: ColorInfo[] = [
  {
    name: "Red",
    hex: "#FF0000",
    psychology: "Increases heart rate and creates urgency; the most attention-grabbing hue.",
    meaning: "Passion, danger, energy, power, love, and excitement.",
    applications: ["Call-to-action buttons", "Sale banners", "Warning indicators"],
  },
  {
    name: "Orange",
    hex: "#FF7F00",
    psychology: "Stimulates enthusiasm and appetite without the aggression of red.",
    meaning: "Creativity, warmth, enthusiasm, adventure, and success.",
    applications: ["Food branding", "Sports teams", "Youth-oriented apps"],
  },
  {
    name: "Amber",
    hex: "#FFBF00",
    psychology: "Captures attention with a warm glow; signals caution rather than danger.",
    meaning: "Caution, optimism, warmth, and transition.",
    applications: ["Traffic warnings", "Notification badges", "Autumn themes"],
  },
  {
    name: "Gold",
    hex: "#FFD700",
    psychology: "Associated with achievement and celebration; conveys prestige.",
    meaning: "Wealth, success, luxury, quality, and accomplishment.",
    applications: ["Award badges", "Premium tiers", "Luxury branding"],
  },
  {
    name: "Yellow",
    hex: "#FFFF00",
    psychology: "The most visible color; boosts optimism and mental clarity.",
    meaning: "Happiness, optimism, clarity, intellect, and energy.",
    applications: ["Highlighting", "Children's products", "Taxi cabs"],
  },
  {
    name: "Lime",
    hex: "#BFFF00",
    psychology: "Fresh and invigorating; feels natural yet artificial simultaneously.",
    meaning: "Freshness, vitality, green energy, and zesty innovation.",
    applications: ["Energy drinks", "Eco-tech brands", "Health apps"],
  },
  {
    name: "Chartreuse",
    hex: "#7FFF00",
    psychology: "Unusual and attention-grabbing; associated with the avant-garde.",
    meaning: "Boldness, uniqueness, nature, and unconventional thinking.",
    applications: ["Art direction", "Alternative branding", "Nature signage"],
  },
  {
    name: "Green",
    hex: "#00FF00",
    psychology: "Creates calm and balance; most restful color for the human eye.",
    meaning: "Growth, nature, health, harmony, renewal, and prosperity.",
    applications: ["Environmental brands", "Healthcare", "Finance (money)"],
  },
  {
    name: "Teal",
    hex: "#008080",
    psychology: "Sophisticated and calming; combines the stability of blue with the renewal of green.",
    meaning: "Serenity, sophistication, healing, emotional balance, and clarity.",
    applications: ["Wellness apps", "Corporate branding", "Meditation tools"],
  },
  {
    name: "Cyan",
    hex: "#00FFFF",
    psychology: "Open and airy; suggests precision and cleanliness.",
    meaning: "Clarity, communication, sterility, freshness, and technology.",
    applications: ["Healthcare UI", "Water brands", "Tech interfaces"],
  },
  {
    name: "Azure",
    hex: "#007FFF",
    psychology: "Trustworthy and dependable; evokes open skies and reliability.",
    meaning: "Trust, loyalty, confidence, intelligence, and stability.",
    applications: ["Enterprise software", "Banking", "Cloud services"],
  },
  {
    name: "Blue",
    hex: "#0000FF",
    psychology: "Lowers heart rate and promotes focus; universally liked across cultures.",
    meaning: "Trust, intelligence, calm, professionalism, and security.",
    applications: ["Social media", "Corporate websites", "Productivity tools"],
  },
  {
    name: "Indigo",
    hex: "#4B0082",
    psychology: "Deep and introspective; bridges the logical mind and spiritual intuition.",
    meaning: "Wisdom, depth, spirituality, mystery, and integrity.",
    applications: ["Luxury branding", "Spiritual apps", "Night mode themes"],
  },
  {
    name: "Violet",
    hex: "#8800FF",
    psychology: "Stimulates imagination and creativity; historically associated with royalty.",
    meaning: "Royalty, creativity, mystery, inspiration, and dignity.",
    applications: ["Creative tools", "Beauty products", "Event branding"],
  },
  {
    name: "Purple",
    hex: "#800080",
    psychology: "Balances the stimulation of red and the calm of blue; feels luxurious.",
    meaning: "Luxury, mystery, spirituality, creativity, and wisdom.",
    applications: ["Beauty branding", "Prestige memberships", "Fantasy genres"],
  },
  {
    name: "Magenta",
    hex: "#FF00FF",
    psychology: "Bold and non-conformist; breaks expectations with its intensity.",
    meaning: "Boldness, universal harmony, non-conformity, and artistic expression.",
    applications: ["Creative software", "Music branding", "Fashion campaigns"],
  },
  {
    name: "Pink",
    hex: "#FFC0CB",
    psychology: "Gentle and soothing; associated with nurturing and tenderness.",
    meaning: "Femininity, compassion, love, playfulness, and sweetness.",
    applications: ["Children's brands", "Breast cancer awareness", "Romantic themes"],
  },
  {
    name: "Crimson",
    hex: "#DC143C",
    psychology: "Intense and commanding; darker than red with a sense of gravitas.",
    meaning: "Leadership, nobility, passion, courage, and determination.",
    applications: ["Academic regalia", "Sports teams", "Luxury packaging"],
  },
  {
    name: "Coral",
    hex: "#FF7F50",
    psychology: "Warm and inviting without being aggressive; feels approachable and friendly.",
    meaning: "Warmth, sociability, comfort, vitality, and community.",
    applications: ["Social platforms", "Travel sites", "Hospitality branding"],
  },
  {
    name: "Brown",
    hex: "#8B4513",
    psychology: "Grounding and stabilizing; connects to the physical world and nature.",
    meaning: "Reliability, stability, earth, comfort, and authenticity.",
    applications: ["Outdoor brands", "Coffee shops", "Wood product marketing"],
  },
  {
    name: "Tan",
    hex: "#D2B48C",
    psychology: "Soft and neutral; feels timeless and understated.",
    meaning: "Simplicity, neutrality, warmth, classicism, and comfort.",
    applications: ["Fashion neutrals", "Interior design", "Packaging substrates"],
  },
  {
    name: "Beige",
    hex: "#F5F5DC",
    psychology: "Understated and calm; supports other colors without competing.",
    meaning: "Simplicity, purity, calmness, minimalism, and reliability.",
    applications: ["Minimalist design", "Background walls", "Print substrates"],
  },
  {
    name: "Khaki",
    hex: "#F0E68C",
    psychology: "Practical and durable; carries associations with the outdoors.",
    meaning: "Utility, earthiness, reliability, practicality, and warmth.",
    applications: ["Military wear", "Outdoor gear", "Travel branding"],
  },
  {
    name: "Olive",
    hex: "#808000",
    psychology: "Subtle and organic; earthy without the dullness of pure brown.",
    meaning: "Peace, nature, endurance, wisdom, and military service.",
    applications: ["Military branding", "Organic products", "Camouflage patterns"],
  },
  {
    name: "Maroon",
    hex: "#800000",
    psychology: "Serious and controlled; deep red that commands respect without shouting.",
    meaning: "Sophistication, control, passion, tradition, and reserved power.",
    applications: ["University branding", "Theater curtains", "Premium packaging"],
  },
  {
    name: "Navy",
    hex: "#000080",
    psychology: "Authoritative and conservative; the safest choice for serious contexts.",
    meaning: "Authority, tradition, confidence, discipline, and stability.",
    applications: ["Corporate uniforms", "Legal branding", "Government sites"],
  },
  {
    name: "Slate",
    hex: "#708090",
    psychology: "Steady and impartial; a neutral that takes direction from surrounding colors.",
    meaning: "Neutrality, balance, strength, professionalism, and timelessness.",
    applications: ["UI sidebars", "Technical docs", "Architecture"],
  },
  {
    name: "Silver",
    hex: "#C0C0C0",
    psychology: "Futuristic and polished; suggests high-tech and premium quality.",
    meaning: "Modernity, sophistication, technology, precision, and achievement.",
    applications: ["Tech branding", "Award medals", "Automotive finishes"],
  },
  {
    name: "Gray",
    hex: "#808080",
    psychology: "Safe and neutral; recedes into the background and reduces visual noise.",
    meaning: "Neutrality, conservatism, balance, maturity, and practicality.",
    applications: ["Typography", "Form fields", "Disabled states"],
  },
  {
    name: "Charcoal",
    hex: "#36454F",
    psychology: "Strong and grounded; provides depth without the harshness of pure black.",
    meaning: "Strength, sophistication, depth, formality, and authority.",
    applications: ["Dark mode backgrounds", "Editorial layouts", "Premium UI"],
  },
  {
    name: "Black",
    hex: "#000000",
    psychology: "Absorbs all light; creates contrast and a sense of infinite depth.",
    meaning: "Power, elegance, mystery, formality, and authority.",
    applications: ["Luxury branding", "Photography backdrops", "High-contrast UI"],
  },
  {
    name: "White",
    hex: "#FFFFFF",
    psychology: "Clean and pure; the blank canvas that maximizes readability.",
    meaning: "Purity, cleanliness, simplicity, peace, and perfection.",
    applications: ["Page backgrounds", "Medical branding", "Minimalist design"],
  },
  {
    name: "Firebrick",
    hex: "#B22222",
    psychology: "Strong and assertive; darker than red with a grounded warmth.",
    meaning: "Strength, determination, confidence, and resilience.",
    applications: ["Error states", "Strong accents", "Sports branding"],
  },
  {
    name: "Tomato",
    hex: "#FF6347",
    psychology: "Warm and approachable; less aggressive than pure red.",
    meaning: "Vitality, friendliness, approachability, and warmth.",
    applications: ["Food apps", "Call-to-action buttons", "Social platforms"],
  },
  {
    name: "Dark Orange",
    hex: "#FF8C00",
    psychology: "Energetic and earthy; conveys warmth without urgency.",
    meaning: "Energy, determination, warmth, and harvest.",
    applications: ["Autumn themes", "Sports branding", "Youthful products"],
  },
  {
    name: "Lime",
    hex: "#32CD32",
    psychology: "Fresh and vibrant; combines the energy of yellow with the growth of green.",
    meaning: "Freshness, vitality, nature, and renewal.",
    applications: ["Eco-friendly brands", "Health apps", "Organic products"],
  },
  {
    name: "Forest Green",
    hex: "#228B22",
    psychology: "Stable and grounded; evokes deep woods and natural stability.",
    meaning: "Growth, stability, nature, tradition, and wealth.",
    applications: ["Environmental brands", "Finance", "Outdoor products"],
  },
  {
    name: "Dark Green",
    hex: "#006400",
    psychology: "Solid and conservative; the deepest green before black.",
    meaning: "Authority, tradition, stability, and endurance.",
    applications: ["Government sites", "Academic institutions", "Classic branding"],
  },
  {
    name: "Spring Green",
    hex: "#00FF7F",
    psychology: "Bright and refreshing; the green of new growth.",
    meaning: "Renewal, freshness, growth, and vitality.",
    applications: ["Wellness apps", "Spring campaigns", "Natural products"],
  },
  {
    name: "Turquoise",
    hex: "#00CED1",
    psychology: "Calming and sophisticated; bridges blue and green.",
    meaning: "Clarity, sophistication, calm, and emotional balance.",
    applications: ["Spa branding", "Travel sites", "Wellness apps"],
  },
  {
    name: "Dark Cyan",
    hex: "#008B8B",
    psychology: "Deep and serene; a stable alternative to bright cyan.",
    meaning: "Depth, trust, sophistication, and tranquility.",
    applications: ["Corporate sites", "Technical products", "Premium apps"],
  },
  {
    name: "Medium Blue",
    hex: "#0000CD",
    psychology: "Strong and dependable; more vivid than navy but still authoritative.",
    meaning: "Trust, authority, clarity, and confidence.",
    applications: ["Corporate branding", "Financial services", "Tech products"],
  },
  {
    name: "Dark Blue",
    hex: "#00008B",
    psychology: "Deep and conservative; conveys stability and seriousness.",
    meaning: "Authority, intelligence, stability, and professionalism.",
    applications: ["Legal sites", "Banking", "Enterprise software"],
  },
  {
    name: "Blue Violet",
    hex: "#8A2BE2",
    psychology: "Creative and spiritual; blends blue stability with violet imagination.",
    meaning: "Creativity, spirituality, mystery, and transformation.",
    applications: ["Creative tools", "Spiritual apps", "Art portfolios"],
  },
  {
    name: "Dark Violet",
    hex: "#9400D3",
    psychology: "Intense and dramatic; the most saturated violet.",
    meaning: "Luxury, mystery, creativity, and ambition.",
    applications: ["Music platforms", "Luxury brands", "Nightlife apps"],
  },
  {
    name: "Orchid",
    hex: "#DA70D6",
    psychology: "Delicate and feminine; softer than magenta with a floral warmth.",
    meaning: "Elegance, beauty, femininity, and refinement.",
    applications: ["Beauty brands", "Floral design", "Fashion e-commerce"],
  },
  {
    name: "Deep Pink",
    hex: "#FF1493",
    psychology: "Bold and playful; more intense than standard pink.",
    meaning: "Passion, playfulness, excitement, and confidence.",
    applications: ["Social media", "Entertainment", "Youth branding"],
  },
  {
    name: "Hot Pink",
    hex: "#FF69B4",
    psychology: "Energetic and youthful; stands out without aggression.",
    meaning: "Fun, confidence, playfulness, and modernity.",
    applications: ["Fashion retail", "Beauty products", "Music festivals"],
  },
  {
    name: "Salmon",
    hex: "#FA8072",
    psychology: "Warm and inviting; a softer, friendlier coral.",
    meaning: "Warmth, compassion, approachability, and comfort.",
    applications: ["Food delivery", "Health sites", "Children's apps"],
  },
  {
    name: "Peach",
    hex: "#FFDAB9",
    psychology: "Soft and nurturing; conveys sweetness without being childish.",
    meaning: "Gentleness, sincerity, warmth, and sweetness.",
    applications: ["Parenting apps", "Beauty products", "Wedding sites"],
  },
  {
    name: "Sienna",
    hex: "#A0522D",
    psychology: "Earthy and rustic; feels natural and unpretentious.",
    meaning: "Stability, earthiness, warmth, and tradition.",
    applications: ["Rustic branding", "Coffee shops", "Outdoor apparel"],
  },
  {
    name: "Saddle Brown",
    hex: "#8B4513",
    psychology: "Warm and grounded; evokes aged leather and natural materials.",
    meaning: "Reliability, comfort, tradition, and craftsmanship.",
    applications: ["Leather goods", "Furniture", "Vintage brands"],
  },
  {
    name: "Dim Gray",
    hex: "#696969",
    psychology: "Neutral and stable; softer than true gray with subtle warmth.",
    meaning: "Neutrality, balance, practicality, and timelessness.",
    applications: ["UI borders", "Secondary text", "Form backgrounds"],
  },
  {
    name: "Gainsboro",
    hex: "#DCDCDC",
    psychology: "Light and airy; almost white but softer on the eyes.",
    meaning: "Subtlety, cleanliness, sophistication, and space.",
    applications: ["Page backgrounds", "Card surfaces", "Subtle dividers"],
  },
  {
    name: "White Smoke",
    hex: "#F5F5F5",
    psychology: "Near-white with a whisper of warmth; bright without being stark.",
    meaning: "Purity, clarity, simplicity, and modernity.",
    applications: ["App backgrounds", "Clean layouts", "Modern interfaces"],
  },
  {
    name: "Lavender",
    hex: "#E6E6FA",
    psychology: "Soft and calming; the gentlest purple tint.",
    meaning: "Calm, grace, elegance, and tranquility.",
    applications: ["Meditation apps", "Wedding sites", "Beauty products"],
  },
  {
    name: "Sky Blue",
    hex: "#87CEEB",
    psychology: "Open and airy; evokes clear skies and freedom.",
    meaning: "Openness, peace, reliability, and serenity.",
    applications: ["Travel apps", "Weather apps", "Healthcare sites"],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Circular hue distance on 0-360. */
function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, 360 - diff);
}

/** Weighted HSL similarity score — lower is more similar. */
function colorDistance(
  hslA: { h: number; s: number; l: number },
  hslB: { h: number; s: number; l: number },
): number {
  const hDist = hueDistance(hslA.h, hslB.h);
  const sDist = Math.abs(hslA.s - hslB.s);
  const lDist = Math.abs(hslA.l - hslB.l);
  // Hue weighted 3x; saturation and lightness 1x each.
  return hDist * 3 + sDist + lDist;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// ── Memoization cache ──
const colorInfoCache = new Map<string, ColorInfo>();

/**
 * Find the nearest named color from the database and return its full info.
 * Falls back to black if the hex is invalid.
 */
export function getColorInfo(hex: string): ColorInfo {
  const cached = colorInfoCache.get(hex);
  if (cached) return cached;
  const normalized = normalizeHex(hex);
  if (!normalized) {
    return COLOR_DB.find((c) => c.hex === "#000000")!;
  }

  // Exact match shortcut
  const exact = COLOR_DB.find((c) => c.hex === normalized);
  if (exact) { colorInfoCache.set(hex, exact); return exact; }

  const targetHsl = hexToHsl(normalized);
  let best = COLOR_DB[0];
  let bestDistance = Infinity;

  for (const color of COLOR_DB) {
    const dbHsl = hexToHsl(color.hex);
    const dist = colorDistance(targetHsl, dbHsl);
    if (dist < bestDistance) {
      bestDistance = dist;
      best = color;
    }
  }

  colorInfoCache.set(hex, best);
  return best;
}

/**
 * Find the `count` most similar colors from the database, ordered by
 * perceptual similarity (closest first). Excludes the input color itself
 * if it exactly matches a database entry.
 */
export function getSimilarColors(
  hex: string,
  count: number = 5,
): { hex: string; name: string; distance: number }[] {
  const normalized = normalizeHex(hex) ?? "#000000";
  const targetHsl = hexToHsl(normalized);

  const scored = COLOR_DB.map((color) => ({
    hex: color.hex,
    name: color.name,
    distance: colorDistance(targetHsl, hexToHsl(color.hex)),
  }));

  // Sort by ascending distance
  scored.sort((a, b) => a.distance - b.distance);

  // Remove the exact-match entry (distance === 0) if present
  const filtered = scored[0]?.distance === 0 ? scored.slice(1) : scored;

  return filtered.slice(0, count);
}
