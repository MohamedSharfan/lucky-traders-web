/**
 * Expands the compact seed files into a full, database-shaped catalog.
 *
 * Everything here is deterministic: running it twice produces identical ids,
 * SKUs and stock levels, so re-seeding never creates duplicates.
 */

import { categories as categoryTree, brands as brandNames } from './categories.mjs';
import { productSeeds } from './products.mjs';

/** Deterministic UUID-v4-shaped id derived from a string key. */
export function uid(key) {
  // xorshift-ish mix; stable across runs and platforms.
  let h1 = 0x9e3779b9 ^ key.length;
  let h2 = 0x85ebca6b;
  for (let i = 0; i < key.length; i++) {
    const c = key.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (c + i), 0x85ebca6b) >>> 0;
  }
  const chunk = (n, salt) => {
    let x = (n ^ salt) >>> 0;
    let out = '';
    while (out.length < 8) {
      x ^= x << 13; x >>>= 0;
      x ^= x >> 17;
      x ^= x << 5; x >>>= 0;
      out += x.toString(16).padStart(8, '0');
    }
    return out.slice(0, 8);
  };
  const a = chunk(h1, 0x1);
  const b = chunk(h2, 0x2);
  const c = chunk(h1 + h2, 0x3);
  const d = chunk(h1 ^ h2, 0x4);
  const hex = (a + b + c + d).slice(0, 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    '4' + hex.slice(13, 16),
    ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join('-');
}

/** Deterministic pseudo-random float in [0,1) from a string key. */
function rand(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0;
  h ^= h << 13; h >>>= 0;
  h ^= h >> 17;
  h ^= h << 5; h >>>= 0;
  return h / 4294967296;
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const ISO = '2026-01-15T08:00:00.000Z';

export function buildCatalog() {
  // ---------------------------------------------------------------- categories
  const categories = [];
  const subIdBySlug = new Map();
  const parentIdBySlug = new Map();

  categoryTree.forEach((cat, i) => {
    const id = uid(`category:${cat.slug}`);
    parentIdBySlug.set(cat.slug, id);
    categories.push({
      id,
      slug: cat.slug,
      name: cat.name,
      name_si: cat.name_si,
      name_ta: cat.name_ta,
      image_url: null,
      icon: cat.icon,
      parent_id: null,
      is_active: true,
      sort_order: (i + 1) * 10,
      created_at: ISO,
      updated_at: ISO,
    });
    (cat.children ?? []).forEach((sub, j) => {
      const subId = uid(`category:${cat.slug}/${sub.slug}`);
      subIdBySlug.set(`${cat.slug}/${sub.slug}`, subId);
      categories.push({
        id: subId,
        slug: sub.slug,
        name: sub.name,
        name_si: sub.name_si,
        name_ta: sub.name_ta,
        image_url: null,
        icon: null,
        parent_id: id,
        is_active: true,
        sort_order: (j + 1) * 10,
        created_at: ISO,
        updated_at: ISO,
      });
    });
  });

  // ---------------------------------------------------------------- brands
  const brands = brandNames.map((name) => ({
    id: uid(`brand:${name}`),
    slug: slugify(name),
    name,
    is_active: true,
  }));
  const brandIdByName = new Map(brands.map((b) => [b.name, b.id]));

  // ---------------------------------------------------------------- products
  const products = [];
  const usedSlugs = new Set();

  for (const seed of productSeeds) {
    const categoryId = parentIdBySlug.get(seed.cat);
    if (!categoryId) throw new Error(`Unknown category "${seed.cat}" for ${seed.n}`);
    const subcategoryId = subIdBySlug.get(`${seed.cat}/${seed.sub}`) ?? null;
    if (seed.sub && !subcategoryId) throw new Error(`Unknown subcategory "${seed.sub}" for ${seed.n}`);

    for (const [unit, price] of seed.sizes) {
      const label = seed.b ? `${seed.b} ${seed.n} ${unit}` : `${seed.n} ${unit}`;
      let slug = slugify(label);
      let n = 2;
      while (usedSlugs.has(slug)) slug = `${slugify(label)}-${n++}`;
      usedSlugs.add(slug);

      const key = `product:${slug}`;
      const r = rand(key);
      const tags = seed.tags ?? [];

      // Stock: mostly healthy, a deliberate slice low / out so the inventory
      // and "out of stock" states are visible in the demo.
      let stock;
      if (r < 0.05) stock = 0;
      else if (r < 0.14) stock = 2 + Math.floor(rand(key + ':low') * 6);
      else stock = 20 + Math.floor(rand(key + ':qty') * 180);

      const salePrice = seed.sale ? Math.round((price * (100 - seed.sale)) / 100 / 5) * 5 : null;

      products.push({
        id: uid(key),
        slug,
        sku: makeSku(seed, unit, slug),
        name: `${seed.n} ${unit}`,
        name_si: seed.si ? `${seed.si} ${unit}` : null,
        name_ta: seed.ta ? `${seed.ta} ${unit}` : null,
        description: seed.d ?? null,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        brand_id: seed.b ? brandIdByName.get(seed.b) ?? null : null,
        price,
        sale_price: salePrice,
        stock,
        low_stock_threshold: 10,
        unit,
        weight: unit,
        image_url: null,
        gallery: [],
        is_featured: tags.includes('featured'),
        is_new: tags.includes('new'),
        is_best_seller: tags.includes('best'),
        is_active: true,
        popularity: Math.round(rand(key + ':pop') * 900) + (tags.includes('best') ? 500 : 0),
        created_at: ISO,
        updated_at: ISO,
      });
    }
  }

  return { categories, brands, products };
}

function makeSku(seed, unit, slug) {
  const catCode = seed.cat.split('-').map((w) => w[0]).join('').toUpperCase().padEnd(2, 'X');
  const nameCode = seed.n.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
  const unitCode = unit.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 5);
  const check = Math.floor(rand('sku:' + slug) * 90 + 10);
  return `SK-${catCode}${nameCode}-${unitCode}-${check}`;
}

/** Default store settings written on first seed. */
export const defaultSettings = {
  shop_name: 'Lucky Traders',
  shop_subtitle: 'Grocery Shop',
  tagline: 'Everything You Need, Right at Your Door.',
  logo_url: '/logo.svg',
  phone: '+94 77 123 4567',
  whatsapp: '+94771234567',
  whatsapp_greeting: 'Hello Lucky Traders, I would like to inquire about your products.',
  email: 'hello@luckytraders.lk',
  address: 'No. 45, Main Street, Akurana, Kandy, Sri Lanka',
  opening_hours: 'Monday - Saturday: 7.00 AM - 8.30 PM\nSunday: 8.00 AM - 6.00 PM',
  facebook: 'https://facebook.com/luckytraders',
  instagram: 'https://instagram.com/luckytraders',
  maps_url: 'https://maps.google.com/?q=Akurana+Kandy+Sri+Lanka',
  maps_embed_url: 'https://www.google.com/maps?q=Akurana,+Kandy,+Sri+Lanka&output=embed',
  currency: 'Rs.',
  delivery_enabled: true,
  pickup_enabled: true,
  delivery_fee: 300,
  free_delivery_threshold: 5000,
  delivery_areas: [
    { id: 'area-akurana', name: 'Akurana', fee: 200, is_active: true },
    { id: 'area-kandy', name: 'Kandy Town', fee: 350, is_active: true },
    { id: 'area-katugastota', name: 'Katugastota', fee: 300, is_active: true },
    { id: 'area-peradeniya', name: 'Peradeniya', fee: 400, is_active: true },
    { id: 'area-matale', name: 'Matale', fee: 500, is_active: true },
  ],
  order_prefix: 'LT',
  announcement: 'Free delivery on orders above Rs. 5,000 · Order on WhatsApp 7 days a week',
};
