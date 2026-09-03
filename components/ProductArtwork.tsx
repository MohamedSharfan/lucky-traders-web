import { placeholderTint } from '@/lib/format';

/**
 * Generated product artwork.
 *
 * Real product photography has to be shot or licensed — brand packshots found
 * online belong to those brands and cannot be republished here. So until the
 * owner uploads their own photos, every product gets a drawn illustration of
 * the right *kind* of package: a sack for rice, a bottle for oil, a tin for
 * canned fish, a pouch for spices.
 *
 * It costs nothing to download (inline SVG, no request), never 404s, and makes
 * a 293-product catalog read as a shop rather than a wall of letter tiles.
 * The moment a real photo is uploaded in Admin → Products it takes over.
 */

export type ArtworkKind =
  | 'sack' | 'bottle' | 'tin' | 'pouch' | 'box' | 'jar' | 'tub'
  | 'bar' | 'produce' | 'meat' | 'eggs' | 'spray' | 'diaper'
  | 'stationery' | 'pet' | 'bag';

/**
 * Which illustration suits each category. Subcategory wins over category, so
 * "Cooking Essentials → Salt" gets a pouch while "→ Coconut Oil" gets a bottle.
 */
const BY_SLUG: Record<string, ArtworkKind> = {
  // rice, grains and anything sold by the kilo in a sack
  'rice-grains': 'sack', 'nadu-rice': 'sack', 'samba-rice': 'sack', 'keeri-samba': 'sack',
  'red-rice': 'sack', 'white-rice': 'sack', 'basmati-rice': 'sack', 'raw-rice': 'sack',
  'brown-rice': 'sack', 'wheat-flour': 'sack', 'kurakkan': 'sack', 'corn-flour': 'sack',
  'semolina-oats': 'sack', 'string-hopper-flour': 'sack',

  // pulses
  'dhal-pulses': 'pouch', 'red-dhal': 'pouch', 'green-gram': 'pouch', 'chickpeas': 'pouch',
  'cowpea': 'pouch', 'black-gram': 'pouch', 'lentils': 'pouch', 'soya': 'pouch',

  // sugar
  'sugar-sweeteners': 'sack', 'white-sugar': 'sack', 'brown-sugar': 'sack',
  'icing-sugar': 'pouch', 'jaggery': 'box', 'treacle': 'bottle',

  // cooking
  'cooking-essentials': 'bottle', 'coconut-oil': 'bottle', 'vegetable-oil': 'bottle',
  'palm-olive-oil': 'bottle', 'ghee': 'jar', 'vinegar': 'bottle', 'salt': 'pouch',
  'baking': 'pouch',

  // spices
  'spices': 'pouch', 'chili': 'pouch', 'turmeric': 'pouch', 'curry-powder': 'pouch',
  'pepper': 'pouch', 'cinnamon-cardamom': 'pouch', 'whole-spices': 'pouch',
  'tamarind-goraka': 'pouch',

  // tea, coffee, drinks
  'tea-coffee': 'box', 'tea': 'box', 'tea-bags': 'box', 'green-tea': 'box',
  'coffee': 'jar', 'milk-powder': 'pouch',
  'beverages': 'bottle', 'soft-drinks': 'bottle', 'fruit-drinks': 'bottle',
  'energy-drinks': 'tin', 'bottled-water': 'bottle', 'cordials-syrups': 'bottle',

  // snacks
  'biscuits-snacks': 'box', 'cream-biscuits': 'box', 'crackers': 'box',
  'cookies-wafers': 'box', 'chips': 'pouch', 'nuts-mixture': 'pouch',
  'chocolates-candy': 'bar',

  // breakfast
  'breakfast': 'box', 'cereals': 'box', 'jam-honey': 'jar', 'spreads': 'jar',

  // canned
  'canned-packaged': 'tin', 'canned-fish': 'tin', 'canned-fruit-veg': 'tin',
  'sauces': 'bottle', 'mayo-mustard': 'bottle',

  // noodles
  'noodles-pasta': 'pouch', 'instant-noodles': 'pouch', 'pasta': 'pouch',

  // dairy and frozen
  'dairy-chilled': 'tub', 'milk': 'box', 'yogurt-curd': 'tub', 'cheese-butter': 'tub',
  'frozen': 'box', 'frozen-meat': 'meat', 'frozen-veg': 'pouch',
  'frozen-snacks': 'box', 'ice-cream': 'tub',

  // fresh
  'fresh-produce': 'produce', 'vegetables': 'produce', 'leafy': 'produce',
  'fruits': 'produce', 'coconut-eggs': 'eggs',

  // meat
  'meat-seafood': 'meat', 'chicken': 'meat', 'red-meat': 'meat',
  'fish-prawns': 'meat', 'dry-fish': 'pouch',

  // personal care
  'personal-care': 'bottle', 'hair-care': 'bottle', 'soap-body': 'bar',
  'oral-care': 'box', 'face-care': 'bottle', 'deo-shaving': 'spray',
  'sanitary': 'box',

  // cleaning
  'household-cleaning': 'spray', 'washing-powder': 'pouch', 'dishwashing': 'bottle',
  'floor-toilet': 'spray', 'bleach': 'bottle', 'sponges': 'box',

  // baby
  'baby': 'diaper', 'diapers': 'diaper', 'baby-bath': 'bottle', 'baby-food': 'tin',

  // stationery and household
  'stationery': 'stationery', 'pens-pencils': 'stationery', 'books': 'box',
  'school-supplies': 'stationery',
  'kitchen-household': 'box', 'storage': 'box', 'foil-wrap': 'box',
  'paper-goods': 'box', 'matches-batteries': 'box',

  // pets
  'pet-supplies': 'pet', 'pet-food': 'pet', 'pet-care': 'bottle',
};

/**
 * Overrides for products whose category is too broad to pick a package from.
 * "Coconut & Eggs" holds both whole coconuts and egg cartons, so the name has
 * to break the tie. Checked before the category mapping; kept deliberately
 * short and specific.
 */
const NAME_OVERRIDES: [RegExp, ArtworkKind][] = [
  // Deliberately escape-free patterns. The trailing space distinguishes
  // "Eggs (White) 6 pack" from "Egg Noodles 400g", which is a pasta pouch.
  [/^eggs /i, 'eggs'],
  [/fresh coconut/i, 'produce'],
  [/coconut (oil|treacle)/i, 'bottle'],
];

export function artworkKindFor(
  categorySlug?: string | null,
  subcategorySlug?: string | null,
  name?: string | null,
): ArtworkKind {
  if (name) {
    for (const [pattern, kind] of NAME_OVERRIDES) {
      if (pattern.test(name)) return kind;
    }
  }
  if (subcategorySlug && BY_SLUG[subcategorySlug]) return BY_SLUG[subcategorySlug];
  if (categorySlug && BY_SLUG[categorySlug]) return BY_SLUG[categorySlug];
  return 'bag';
}

/**
 * Draws the package. `seed` (the product name) picks the hue, so two products
 * in the same category are still visually distinct on a grid.
 */
export function ProductArtwork({
  kind,
  seed,
  label,
}: {
  kind: ArtworkKind;
  seed: string;
  /** Short text printed on the pack, e.g. the unit "5kg". */
  label?: string | null;
}) {
  const tint = placeholderTint(seed);
  const body = tint.fg;
  const light = tint.bg;

  // A darker shade of the same hue for caps, lids and shadows.
  const dark = body.replace(/hsl\((\d+) (\d+)% (\d+)%\)/, (_m, h) => `hsl(${h} 48% 30%)`);

  const shapes: Record<ArtworkKind, React.ReactNode> = {
    // ---------------------------------------------------------------- sack
    sack: (
      <>
        {/* Gathered corners of the folded top */}
        <path d="M31 24l9-9 6 9z" fill={dark} opacity=".65" />
        <path d="M89 24l-9-9-6 9z" fill={dark} opacity=".65" />
        {/* Stitched fold */}
        <rect x="31" y="22" width="58" height="14" rx="4" fill={dark} />
        {/* Body: narrower at the top, settling wider at the base like filled grain */}
        <path d="M38 36h44l6 50c1 8-5 14-13 14H45c-8 0-14-6-13-14z" fill={body} />
        <rect x="40" y="56" width="40" height="22" rx="3" fill="#fff" opacity=".92" />
      </>
    ),
    // -------------------------------------------------------------- bottle
    bottle: (
      <>
        <rect x="52" y="18" width="16" height="14" rx="3" fill={dark} />
        <path d="M50 32h20c8 0 14 8 14 16v44c0 6-4 10-10 10H46c-6 0-10-4-10-10V48c0-8 6-16 14-16z" fill={body} />
        <rect x="40" y="56" width="40" height="22" rx="3" fill="#fff" opacity=".92" />
      </>
    ),
    // ----------------------------------------------------------------- tin
    tin: (
      <>
        <rect x="34" y="30" width="52" height="66" rx="6" fill={body} />
        <ellipse cx="60" cy="30" rx="26" ry="7" fill={dark} />
        <rect x="34" y="52" width="52" height="24" fill="#fff" opacity=".92" />
      </>
    ),
    // --------------------------------------------------------------- pouch
    pouch: (
      <>
        <path d="M36 30h48c3 0 5 2 5 5v58c0 4-3 7-7 7H38c-4 0-7-3-7-7V35c0-3 2-5 5-5z" fill={body} />
        <path d="M36 30l6-8h36l6 8z" fill={dark} />
        <rect x="38" y="54" width="44" height="22" rx="3" fill="#fff" opacity=".92" />
      </>
    ),
    // ----------------------------------------------------------------- box
    box: (
      <>
        <rect x="32" y="26" width="56" height="72" rx="5" fill={body} />
        <rect x="32" y="26" width="56" height="12" rx="5" fill={dark} />
        <rect x="38" y="52" width="44" height="24" rx="3" fill="#fff" opacity=".92" />
      </>
    ),
    // ----------------------------------------------------------------- jar
    jar: (
      <>
        <rect x="42" y="20" width="36" height="12" rx="4" fill={dark} />
        <path d="M40 32h40c4 0 8 4 8 9v49c0 6-4 10-10 10H42c-6 0-10-4-10-10V41c0-5 4-9 8-9z" fill={body} />
        <rect x="38" y="56" width="44" height="22" rx="3" fill="#fff" opacity=".92" />
      </>
    ),
    // ----------------------------------------------------------------- tub
    tub: (
      <>
        <path d="M34 40h52l-6 52c-.5 5-4 8-9 8H49c-5 0-8.5-3-9-8z" fill={body} />
        <rect x="30" y="30" width="60" height="12" rx="5" fill={dark} />
        <rect x="40" y="58" width="40" height="20" rx="3" fill="#fff" opacity=".92" />
      </>
    ),
    // ----------------------------------------------------------------- bar
    bar: (
      <>
        <rect x="26" y="42" width="68" height="40" rx="8" fill={body} />
        <path d="M26 56h68M26 68h68" stroke={dark} strokeWidth="3" />
        <rect x="38" y="52" width="44" height="18" rx="3" fill="#fff" opacity=".9" />
      </>
    ),
    // ------------------------------------------------------------- produce
    produce: (
      <>
        <circle cx="48" cy="66" r="24" fill={body} />
        <circle cx="76" cy="72" r="17" fill={dark} opacity=".85" />
        <path d="M48 42c0-8 4-14 10-16-2 8-4 12-4 16z" fill="#4CAF50" />
        <path d="M76 55c0-6 3-10 8-12-2 6-3 9-3 12z" fill="#4CAF50" />
      </>
    ),
    // ---------------------------------------------------------------- meat
    meat: (
      <>
        <rect x="26" y="46" width="68" height="42" rx="6" fill="#fff" opacity=".95" />
        <rect x="26" y="46" width="68" height="42" rx="6" fill="none" stroke={dark} strokeWidth="3" />
        <path d="M40 64c6-10 20-12 28-4 6 6 4 16-4 18-10 2-28-4-24-14z" fill={body} />
      </>
    ),
    // ---------------------------------------------------------------- eggs
    eggs: (
      <>
        <rect x="24" y="52" width="72" height="34" rx="7" fill={body} />
        <ellipse cx="42" cy="50" rx="12" ry="15" fill="#FFF8E7" stroke={dark} strokeWidth="2" />
        <ellipse cx="60" cy="46" rx="12" ry="15" fill="#FFF8E7" stroke={dark} strokeWidth="2" />
        <ellipse cx="78" cy="50" rx="12" ry="15" fill="#FFF8E7" stroke={dark} strokeWidth="2" />
      </>
    ),
    // --------------------------------------------------------------- spray
    spray: (
      <>
        <path d="M56 20h12v12H56z" fill={dark} />
        <path d="M68 22h14l-4 10H68z" fill={dark} />
        <path d="M46 32h32c6 0 10 5 10 11v47c0 6-4 10-10 10H46c-6 0-10-4-10-10V43c0-6 4-11 10-11z" fill={body} />
        <rect x="40" y="58" width="44" height="22" rx="3" fill="#fff" opacity=".92" />
      </>
    ),
    // -------------------------------------------------------------- diaper
    diaper: (
      <>
        <rect x="28" y="34" width="64" height="58" rx="10" fill={body} />
        <path d="M28 60c14 8 50 8 64 0" stroke="#fff" strokeWidth="4" fill="none" opacity=".8" />
        <circle cx="46" cy="50" r="5" fill="#fff" opacity=".9" />
        <circle cx="60" cy="46" r="4" fill="#fff" opacity=".7" />
        <circle cx="74" cy="50" r="5" fill="#fff" opacity=".9" />
      </>
    ),
    // ---------------------------------------------------------- stationery
    stationery: (
      <>
        <path d="M46 24h10a4 4 0 0 1 4 4v56l-9 14-9-14V28a4 4 0 0 1 4-4z" fill={body} />
        <path d="M42 84h18l-9 14z" fill={dark} />
        <path d="M64 30h14a4 4 0 0 1 4 4v58a4 4 0 0 1-4 4H64z" fill={dark} opacity=".7" />
      </>
    ),
    // ----------------------------------------------------------------- pet
    pet: (
      <>
        <path d="M32 60h56c2 0 3 2 2 4l-6 24c-1 4-4 6-8 6H44c-4 0-7-2-8-6l-6-24c-1-2 0-4 2-4z" fill={body} />
        <circle cx="48" cy="40" r="7" fill={dark} />
        <circle cx="60" cy="34" r="7" fill={dark} />
        <circle cx="72" cy="40" r="7" fill={dark} />
        <ellipse cx="60" cy="52" rx="11" ry="9" fill={dark} />
      </>
    ),
    // ----------------------------------------------------------------- bag
    bag: (
      <>
        <path d="M34 40h52c3 0 5 2 5 5v48c0 5-4 9-9 9H38c-5 0-9-4-9-9V45c0-3 2-5 5-5z" fill={body} />
        <path d="M46 40V32a14 14 0 0 1 28 0v8" stroke={dark} strokeWidth="5" fill="none" />
        <rect x="40" y="62" width="40" height="20" rx="3" fill="#fff" opacity=".92" />
      </>
    ),
  };

  // Shapes that carry a white panel can print the pack size on it.
  const labelled: ArtworkKind[] = ['sack', 'bottle', 'tin', 'pouch', 'box', 'jar', 'tub', 'bar', 'spray', 'bag'];
  const showLabel = Boolean(label) && labelled.includes(kind);

  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true" focusable="false">
      <rect width="120" height="120" fill={light} />
      {shapes[kind]}
      {showLabel && (
        <text
          x="60"
          y={kind === 'bar' ? 65 : 71}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill={dark}
          fontFamily="system-ui, sans-serif"
        >
          {label}
        </text>
      )}
    </svg>
  );
}
