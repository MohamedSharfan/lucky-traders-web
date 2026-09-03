/**
 * Matches uploaded photo filenames to products.
 *
 * The owner photographs the shelf, names each file after the product (or just
 * lets the camera name it and renames in bulk), and drops the whole folder in.
 * This works out which photo belongs to which product so 293 uploads take one
 * pass instead of 293 trips through the edit form.
 *
 * Matching is deliberately conservative: a wrong photo on a listing causes a
 * delivery dispute, so anything below a confident match is left for the owner
 * to assign by hand rather than guessed at.
 */

export interface MatchableProduct {
  id: string;
  name: string;
  sku: string;
  slug: string;
  brand_name: string | null;
  unit: string;
  image_url: string | null;
}

export type MatchConfidence = 'exact' | 'strong' | 'weak' | 'none';

export interface FileMatch {
  fileName: string;
  productId: string | null;
  confidence: MatchConfidence;
  reason: string;
}

/** Lowercase, drop the extension and any camera suffix, collapse separators. */
export function normalizeFileName(fileName: string): string {
  return fileName
    .replace(/\.[a-z0-9]+$/i, '')
    // "IMG_2043 (1)" and "rice-5kg copy" are common camera / OS artefacts.
    .replace(/\s*\(\d+\)\s*$/, '')
    .replace(/[\s_]*copy[\s_]*$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(value: string): string[] {
  return normalizeFileName(value).split(' ').filter(Boolean);
}

/** Jaccard-style overlap, weighted so a longer shared prefix counts for more. */
function overlapScore(fileTokens: string[], productTokens: string[]): number {
  if (!fileTokens.length || !productTokens.length) return 0;
  const productSet = new Set(productTokens);
  const shared = fileTokens.filter((t) => productSet.has(t)).length;
  if (!shared) return 0;
  const union = new Set([...fileTokens, ...productTokens]).size;
  return shared / union;
}

/**
 * Resolves one filename against the catalog.
 *
 * Tried in order of how much we trust it:
 *   1. SKU appears in the name        — unambiguous, the owner meant it
 *   2. the slug appears in the name   — unambiguous
 *   3. strong token overlap + the unit agrees (5kg vs 1kg must not swap)
 *   4. weaker overlap                 — surfaced, but not auto-applied
 */
export function matchFile(fileName: string, products: MatchableProduct[]): FileMatch {
  const normalized = normalizeFileName(fileName);
  const fileTokens = tokens(fileName);

  if (!normalized) {
    return { fileName, productId: null, confidence: 'none', reason: 'Empty file name' };
  }

  // 1. SKU
  for (const product of products) {
    const sku = normalizeFileName(product.sku);
    if (sku && normalized.includes(sku)) {
      return { fileName, productId: product.id, confidence: 'exact', reason: `SKU ${product.sku}` };
    }
  }

  // 2. Slug
  for (const product of products) {
    const slug = normalizeFileName(product.slug);
    if (slug && (normalized === slug || normalized.includes(slug))) {
      return { fileName, productId: product.id, confidence: 'exact', reason: 'Matched product link' };
    }
  }

  // 3 & 4. Name / brand overlap
  let best: { product: MatchableProduct; score: number } | null = null;

  for (const product of products) {
    const productTokens = tokens(
      [product.brand_name, product.name].filter(Boolean).join(' '),
    );
    const score = overlapScore(fileTokens, productTokens);
    if (!best || score > best.score) best = { product, score };
  }

  if (!best || best.score === 0) {
    return { fileName, productId: null, confidence: 'none', reason: 'No match found' };
  }

  // The pack size must not disagree. "nadu rice 1kg" must never land on the
  // 5kg product just because every other word lines up.
  const fileUnit = normalized.match(/\b(\d+(?:\.\d+)?)\s?(kg|g|ml|l|pack|piece|pieces|bunch|set|box|bottle|rolls?|bags?|sheets?)\b/);
  const productUnit = normalizeFileName(best.product.unit).match(/\b(\d+(?:\.\d+)?)\s?([a-z]+)\b/);
  const unitsDisagree = Boolean(
    fileUnit && productUnit && (fileUnit[1] !== productUnit[1] || fileUnit[2] !== productUnit[2]),
  );

  if (unitsDisagree) {
    return {
      fileName,
      productId: best.product.id,
      confidence: 'weak',
      reason: `Pack size in the file name does not match ${best.product.unit}`,
    };
  }

  if (best.score >= 0.6) {
    return { fileName, productId: best.product.id, confidence: 'strong', reason: 'Name and brand match' };
  }
  if (best.score >= 0.3) {
    return { fileName, productId: best.product.id, confidence: 'weak', reason: 'Partial name match' };
  }

  return { fileName, productId: null, confidence: 'none', reason: 'No confident match' };
}

/**
 * Matches a whole batch, never assigning the same product twice — two files
 * competing for one product would otherwise silently overwrite each other.
 */
export function matchFiles(fileNames: string[], products: MatchableProduct[]): FileMatch[] {
  const taken = new Set<string>();
  const results: FileMatch[] = [];

  // Confident matches claim their product first.
  const initial = fileNames.map((name) => matchFile(name, products));
  const order = [...initial].sort(
    (a, b) => rank(b.confidence) - rank(a.confidence),
  );

  for (const match of order) {
    if (match.productId && taken.has(match.productId)) {
      results.push({
        ...match,
        productId: null,
        confidence: 'none',
        reason: 'Another file already matched this product',
      });
    } else {
      if (match.productId) taken.add(match.productId);
      results.push(match);
    }
  }

  // Restore the order the files were dropped in.
  return fileNames.map((name) => results.find((r) => r.fileName === name)!);
}

function rank(confidence: MatchConfidence): number {
  return { exact: 3, strong: 2, weak: 1, none: 0 }[confidence];
}
