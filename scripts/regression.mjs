/**
 * End-to-end regression suite.
 *
 *   node scripts/regression.mjs [baseUrl]
 *
 * Exercises the running server exactly as a browser would: storefront routes,
 * multilingual search, filters, checkout with stock reservation, the whole
 * admin surface, and the auth guards. Point it at a dev server or a deployed
 * URL; either way it proves the Supabase project behind it.
 */

import { loadEnv } from './load-env.mjs';

const BASE = process.argv[2] ?? 'http://localhost:3000';

await loadEnv();

// The suite signs in with whatever owner account the server is actually
// configured with, so it keeps working once the shop owner sets a real
// password. Hard-coding the sample credentials made every admin check fail
// against a properly configured deployment.
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? 'admin@luckytraders.lk').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'change-this-password';

let pass = 0;
let fail = 0;

const ok = (condition, message) => {
  if (condition) pass++;
  else fail++;
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${message}`);
};

const json = async (path, init) => (await fetch(BASE + path, init)).json();
const lkr = (n) => n.toLocaleString('en-LK');

async function main() {
  console.log(`Running against ${BASE}\n`);

  // ------------------------------------------------------------ storefront
  console.log('--- storefront routes ---');
  const routes = [
    ['/', 200], ['/products', 200], ['/offers', 200], ['/new-arrivals', 200],
    ['/categories', 200], ['/about', 200], ['/contact', 200], ['/cart', 200],
    ['/checkout', 200], ['/admin/login', 200], ['/robots.txt', 200],
    ['/product/does-not-exist', 404], ['/no-such-page', 404],
  ];
  for (const [path, want] of routes) {
    const res = await fetch(BASE + path, { redirect: 'manual' });
    ok(res.status === want, `${path} -> ${res.status}`);
  }
  ok((await fetch(BASE + '/admin', { redirect: 'manual' })).status === 307, '/admin redirects when signed out');

  // ---------------------------------------------------------------- search
  console.log('\n--- multilingual search ---');
  for (const [label, term] of [
    ['English', 'rice'], ['Sinhala', 'හාල්'], ['Tamil', 'அரிசி'],
    ['brand', 'araliya'], ['SKU prefix', 'SK-RG'], ['two words', 'nadu rice'],
  ]) {
    const d = (await json(`/api/products?pageSize=1&q=${encodeURIComponent(term)}`)).data;
    ok(d.total > 0, `${label} "${term}" -> ${d.total} results`);
  }

  // --------------------------------------------------------------- filters
  console.log('\n--- filters, sorting, pagination ---');
  const sale = (await json('/api/products?sale=true&sort=discount&pageSize=3')).data;
  ok(
    sale.total > 0 && sale.items[0].discount_percent >= sale.items[sale.items.length - 1].discount_percent,
    `sale filter + discount sort (${sale.total} on sale, top ${sale.items[0].discount_percent}%)`,
  );

  const asc = (await json('/api/products?sort=price_asc&pageSize=8')).data;
  ok(asc.items.every((p, i, a) => i === 0 || a[i - 1].effective_price <= p.effective_price), 'price ascending');

  const desc = (await json('/api/products?sort=price_desc&pageSize=8')).data;
  ok(desc.items.every((p, i, a) => i === 0 || a[i - 1].effective_price >= p.effective_price), 'price descending');

  const parent = (await json('/api/products?category=rice-grains&pageSize=1')).data;
  const child = (await json('/api/products?category=nadu-rice&pageSize=1')).data;
  ok(parent.total > 0, `parent category expands to subcategories (${parent.total} products)`);
  ok(child.total > 0 && child.total < parent.total, `subcategory is narrower (${child.total} < ${parent.total})`);

  const range = (await json('/api/products?min=100&max=300&pageSize=50')).data;
  ok(range.items.every((p) => p.effective_price >= 100 && p.effective_price <= 300), 'price range filter');

  const inStock = (await json('/api/products?inStock=true&pageSize=50')).data;
  ok(inStock.items.every((p) => p.stock > 0), 'in-stock filter');

  const page3 = (await json('/api/products?page=3&pageSize=10')).data;
  ok(page3.page === 3 && page3.items.length === 10, 'pagination reaches page 3');

  // -------------------------------------------------------------- checkout
  console.log('\n--- checkout ---');
  const product = (await json('/api/products?inStock=true&pageSize=1')).data.items[0];

  const invalid = await json('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_name: 'X', phone: '1', delivery_method: 'delivery', payment_method: 'cod', items: [] }),
  });
  ok(!invalid.ok, `invalid order rejected: "${invalid.error}"`);

  const order = await json('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: 'Nimali Perera', phone: '0712223334',
      address_line: '12 Temple Road', area: 'Akurana', city: 'Akurana', district: 'Kandy',
      delivery_method: 'delivery', payment_method: 'cod',
      items: [{ product_id: product.id, quantity: 2 }],
    }),
  });
  ok(order.ok, `order placed ${order.ok ? `${order.data.order.order_number} total Rs.${lkr(order.data.order.total)} (delivery Rs.${order.data.order.delivery_fee})` : order.error}`);
  ok(order.ok && order.data.order.items.length === 1, 'order items persisted');
  ok(order.ok && order.data.whatsapp_message.includes('NEW ORDER'), 'WhatsApp message generated');

  const afterOrder = (await json(`/api/products/${product.id}`)).data.stock;
  ok(afterOrder === product.stock - 2, `stock reserved ${product.stock} -> ${afterOrder}`);

  const greedy = await json('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: 'Greedy Buyer', phone: '0712223335', address_line: '1', city: 'Kandy',
      delivery_method: 'delivery', payment_method: 'cod',
      items: [{ product_id: product.id, quantity: 999999 }],
    }),
  });
  ok(!greedy.ok, `over-ordering blocked: "${greedy.error}"`);

  // The confirmation link must be private: order numbers are sequential, and an
  // order carries the customer's name, phone and home address.
  const num = order.data.order.order_number;
  const tok = order.data.order.access_token;
  ok(Boolean(tok) && tok.length >= 20, `order carries an access token (${tok?.length} chars)`);
  ok((await fetch(`${BASE}/api/orders/${num}`)).status === 404, 'order API without a token -> 404');
  ok((await fetch(`${BASE}/api/orders/${num}?token=wrong`)).status === 404, 'order API with a wrong token -> 404');
  ok((await fetch(`${BASE}/api/orders/${num}?token=${encodeURIComponent(tok)}`)).status === 200, 'order API with the right token -> 200');
  ok((await fetch(`${BASE}/order/${num}`)).status === 404, 'confirmation page without a token -> 404');
  ok((await fetch(`${BASE}/order/${num}?t=${encodeURIComponent(tok)}`)).status === 200, 'confirmation page with the token -> 200');

  const pickup = await json('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: 'Pickup Customer', phone: '0712223336',
      delivery_method: 'pickup', payment_method: 'pay_at_store',
      items: [{ product_id: product.id, quantity: 1 }],
    }),
  });
  ok(pickup.ok && pickup.data.order.delivery_fee === 0, 'pickup order has no delivery fee');

  // Payment method must match the order type: a delivery cannot be paid for at
  // the counter, and a pickup cannot be cash-on-delivery.
  const badPair = await json('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: 'Bad Pair', phone: '0771112223', address_line: '1 Test Rd', city: 'Kandy',
      delivery_method: 'delivery', payment_method: 'pay_at_store',
      items: [{ product_id: product.id, quantity: 1 }],
    }),
  });
  ok(!badPair.ok, `delivery + pay-at-store rejected: "${badPair.error}"`);

  const badPair2 = await json('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: 'Bad Pair', phone: '0771112223',
      delivery_method: 'pickup', payment_method: 'cod',
      items: [{ product_id: product.id, quantity: 1 }],
    }),
  });
  ok(!badPair2.ok, `pickup + cash-on-delivery rejected: "${badPair2.error}"`);

  // ----------------------------------------------------------------- admin
  console.log('\n--- admin ---');
  // --------------------------------------------------------- edge cases
  // A query of only LIKE wildcards must match nothing, not the whole
  // catalog - stripping them and searching the remainder would.
  for (const term of ['%%%', '___']) {
    const d = (await json(`/api/products?pageSize=1&q=${encodeURIComponent(term)}`)).data;
    ok(d.total === 0, `search "${term}" matches nothing (${d.total} results)`);
  }

  const login = await fetch(BASE + '/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const H = { 'Content-Type': 'application/json', Cookie: (login.headers.get('set-cookie') ?? '').split(';')[0] };
  ok(login.status === 200, 'owner login');
  ok(
    (await fetch(BASE + '/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD + '-wrong' }),
    })).status === 401,
    'wrong password rejected',
  );

  const bumped = product.price + 99;
  await json(`/api/products/${product.id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ price: bumped, sale_price: null }) });
  const shopHtml = await (await fetch(`${BASE}/product/${product.slug}`)).text();
  ok(shopHtml.includes(`Rs. ${lkr(bumped)}`), 'price edit is live on the shop immediately');
  await json(`/api/products/${product.id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ price: product.price, sale_price: product.sale_price }) });

  const categories = (await json('/api/categories')).data;
  const created = await json('/api/products', {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      name: 'Regression Kurakkan Flour', name_si: 'පරීක්ෂණ කුරක්කන් පිටි', name_ta: 'சோதனை கேழ்வரகு மாவு',
      category_id: categories[0].id, price: 640, sale_price: 560, stock: 25, unit: '1kg',
      gallery: ['/uploads/a.png', '/uploads/b.png'],
    }),
  });
  ok(created.ok, `product created${created.ok ? ` (${created.data.slug})` : `: ${created.error}`}`);
  ok(created.ok && created.data.gallery.length === 2, 'gallery persisted');

  const lookup = (await json('/api/products?pageSize=1&q=Regression%20Kurakkan')).data;
  ok(lookup.total === 1 && lookup.items[0].discount_percent === 13, `discount computed by the database = ${lookup.items[0]?.discount_percent}%`);

  const sinhalaLookup = (await json(`/api/products?pageSize=1&q=${encodeURIComponent('පරීක්ෂණ කුරක්කන්')}`)).data;
  ok(sinhalaLookup.total === 1, 'new product findable by its Sinhala name');

  ok((await json(`/api/products/${created.data.id}`, { method: 'DELETE', headers: H })).ok, 'product deleted');

  ok((await json(`/api/orders/${order.data.order.id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ status: 'cancelled' }) })).ok, 'order status changed');
  const restored = (await json(`/api/products/${product.id}`)).data.stock;
  ok(restored === afterOrder + 2 - 1, `cancelling restored stock (now ${restored}, one still held by the pickup order)`);

  const staff = await json('/api/admin/users', {
    method: 'POST', headers: H,
    body: JSON.stringify({ email: 'staff@luckytraders.lk', name: 'Staff Member', role: 'manager', password: 'a-good-password' }),
  });
  ok(staff.ok, 'admin user created');
  ok(!('password_hash' in (staff.data ?? {})), 'password hash never returned');
  ok(
    (await fetch(BASE + '/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@luckytraders.lk', password: 'a-good-password' }),
    })).status === 200,
    'new admin can sign in (scrypt verified)',
  );
  ok((await json(`/api/admin/users/${staff.data.id}`, { method: 'DELETE', headers: H })).ok, 'admin user removed');

  const bulk = await json('/api/products/bulk', { method: 'POST', headers: H, body: JSON.stringify({ action: 'discount_percent', category: 'stationery', percent: 15 }) });
  ok(bulk.ok, `bulk offer applied to ${bulk.ok ? bulk.data.updated : bulk.error} products`);
  ok((await json('/api/products/bulk', { method: 'POST', headers: H, body: JSON.stringify({ action: 'clear_discount', category: 'stationery' }) })).ok, 'bulk discount cleared');

  const cat = await json('/api/categories', { method: 'POST', headers: H, body: JSON.stringify({ name: 'Regression Category', icon: '🧪' }) });
  ok(cat.ok, 'category created');
  const inUse = categories.find((c) => !c.parent_id);
  ok(!(await json(`/api/categories/${inUse.id}`, { method: 'DELETE', headers: H })).ok, 'in-use category protected from deletion');
  ok((await json(`/api/categories/${cat.data.id}`, { method: 'DELETE', headers: H })).ok, 'category deleted');

  const saved = await json('/api/settings', { method: 'PUT', headers: H, body: JSON.stringify({ whatsapp: '0759998887' }) });
  ok(saved.data.whatsapp === '0759998887', 'settings saved');
  ok((await (await fetch(BASE + '/')).text()).includes('94759998887'), 'settings reflected on the shop');
  await json('/api/settings', { method: 'PUT', headers: H, body: JSON.stringify({ whatsapp: '+94771234567' }) });

  // ------------------------------------------------------------ auth guards
  console.log('\n--- auth guards (no session) ---');
  const guarded = [
    ['POST', '/api/products'], ['POST', '/api/products/bulk'], ['GET', '/api/orders'],
    ['PUT', '/api/settings'], ['GET', '/api/admin/users'], ['POST', '/api/upload'],
    ['POST', '/api/categories'],
  ];
  for (const [method, path] of guarded) {
    const res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : '{}',
    });
    ok(res.status === 401, `${method} ${path} -> ${res.status}`);
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
