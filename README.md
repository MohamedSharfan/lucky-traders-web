# Lucky Traders — Grocery Shop

A complete online grocery shop for a Sri Lankan neighbourhood store: a fast,
mobile-first customer website plus an admin panel the shop owner can run
without a developer.

Orders are sent to the owner's WhatsApp as a ready-made message using the free
click-to-chat link — no WhatsApp Business API subscription required.

---

## Quick start

This app runs on Supabase and needs a project before it will start. Setup is
about five minutes:

```bash
npm install
cp .env.example .env.local     # then fill in the Supabase values
npm run dev
```

Full walkthrough in [Setting up Supabase](#setting-up-supabase) below - create a
project, run `supabase/schema.sql`, run `supabase/seed.sql`, paste three keys.

Once it is up, <http://localhost:3000> shows the shop with 293 demo products
across 21 categories, and <http://localhost:3000/admin> is the admin panel.
Sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you set.

If a page errors, open <http://localhost:3000/api/health> - it names exactly
which piece is missing rather than making you guess.

---

## How the data layer works

Every query goes through one interface, `DataStore` (`lib/db/types.ts`), backed
by a single adapter: `lib/db/supabase.ts`.

There is deliberately **no local or file-based fallback**. A shop that quietly
served a different database than the one it was pointed at would accept orders
the owner never sees, so a misconfigured or unreachable project fails loudly
instead. `GET /api/health` reports exactly which part is wrong.

---

## Setting up Supabase

1. Create a project at [supabase.com](https://supabase.com).

2. **SQL Editor -> run `supabase/schema.sql`.** This creates the tables,
   indexes, Row Level Security policies, the storage bucket, and the stock
   reservation functions. It is idempotent, so re-running it is safe.

3. **SQL Editor -> run `supabase/seed.sql`** to load the demo catalog: 21
   categories, 63 brands, 293 products. Regenerate it any time with
   `npm run seed:sql`. Also idempotent - every statement upserts on its slug.

4. **Project Settings -> API** gives you three values for `.env.local`:

   ```ini
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / public key>
   SUPABASE_SERVICE_ROLE_KEY=<service_role key — server only>
   ```

5. Set the admin variables too:

   ```ini
   ADMIN_EMAIL=you@example.com
   ADMIN_PASSWORD=<a real password>
   ADMIN_SESSION_SECRET=<long random string>
   ```

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

6. `npm run dev`, then `npm run test:e2e` in a second terminal. That runs 73
   end-to-end checks against your project and is the fastest way to confirm the
   whole stack works before deploying.

### Signing in

`ADMIN_EMAIL` / `ADMIN_PASSWORD` is the owner account. It is checked **first**
and always works, so you can reach the admin panel on a fresh deployment before
any Supabase Auth user exists.

Additional staff accounts are created in **Admin -> Admin Users**. Those live in
Supabase Auth and also need a row in the `admins` table - the app creates both
together. Because access needs both, revoking someone is a single row delete.

## What the owner can do without touching code

Everything the brief asked for is wired to the database, not to constants:

| Screen | What it changes |
|---|---|
| **Dashboard** | Today's sales, orders, pending, low stock, best sellers, category performance |
| **Products** | Add, edit, delete. **Price and stock are editable inline** — type, press Enter |
| **Categories** | Two-level tree, Sinhala/Tamil names, icons, images, sort order, show/hide |
| **Orders** | Full detail, one-select status change, WhatsApp the customer |
| **Customers** | Built from orders — guests never need an account |
| **Offers** | Discount a category or the whole shop in one step; clear individually or all |
| **Inventory** | Restock view sorted by urgency, colour-coded, keyboard-driven |
| **Delivery Settings** | Fee, free-delivery threshold, per-area fees, enable/disable delivery or pickup |
| **Store Settings** | Name, subtitle, tagline, logo, phone, address, hours, socials, maps, currency, order prefix |
| **WhatsApp Settings** | The owner's number and greeting — plus a test-message button |
| **Admin Users** | Add/remove staff accounts, set owner vs manager, reset passwords |
| **Reports** | Revenue/orders by period, daily breakdown, CSV export |

Change a price in the admin and the customer site shows it on the next page
load: every storefront route is `force-dynamic` and reads from the same store.

---

## Customer flow

```
Home → browse / search / filter → product → add to cart
     → cart → checkout (guest) → order created → WhatsApp opens pre-filled
     → confirmation page with order number
```

- **No account required.** Guests order with no sign-up, no password and no
  email verification. Details are remembered per browser for repeat visits.
- **Confirmation links are private.** Order numbers are sequential, so they are
  not treated as a credential: each order also gets a random token, and the
  confirmation page and public order API return 404 without it. Shop staff see
  every order through their admin session instead.
- **Product galleries.** The main photo plus up to six extra images, uploaded
  and re-ordered from the product editor.
- **Payment follows the order type.** Home delivery is cash on arrival; store
  pickup is paid at the counter. The contradictory pairs are not offered, and
  the API rejects them even if a request is crafted by hand.
- **Cart is re-validated** against live prices and stock when the cart and
  checkout pages open; removed or out-of-stock items are dropped with a message.
- **Stock is reserved server-side** at order time. In Supabase this happens in a
  single atomic `UPDATE ... WHERE stock >= quantity`, so the last bag of rice
  cannot be sold twice. Cancelling an order returns the stock.
- **Delivery fee** resolves as: pickup → free; over the threshold → free;
  matching delivery area → that area's fee; otherwise the default.

### The WhatsApp message

Generated by `lib/whatsapp.ts` from the saved order:

```
*NEW ORDER - LUCKY TRADERS*
Order No: LT-10001

*Customer:* Mohamed Sharfan
*Phone:* 0771234567

*Delivery Address:*
No 45, Main Street, Akurana, Kandy

*Items:*
1. Nadu Rice 5kg x 2
   Rs. 1,390 each = Rs. 2,780
...
Subtotal: Rs. 3,650
Delivery: Rs. 300
*TOTAL: Rs. 3,950*

Payment: Cash on Delivery

Please confirm this order.
```

The destination number always comes from settings — it is never hard-coded.

---

## Languages

English, Sinhala and Tamil. UI strings live in `lib/i18n/dictionaries.ts`;
product and category names are translated **per record** in the database
(`name_si`, `name_ta`), which the owner fills in from the admin forms.

Search matches all three languages at once — searching `හාල්` finds rice
products, `அரிசி` does too. In Supabase this is a single indexed `ILIKE` against
a generated `search_text` column.

Adding a fourth language means one entry in `dictionaries.ts` and one line in
`LOCALES` — no component changes.

---

## Security

- Admin sign-in issues an **HMAC-signed, httpOnly** session cookie. No token,
  key or password ever reaches client JavaScript.
- Every mutating API route calls `assertAdmin()`. Middleware additionally
  bounces signed-out visitors from `/admin`, and the protected layout verifies
  the signature (middleware runs on the Edge and can only check presence).
- Sign-in attempts are rate-limited, and failures are deliberately vague about
  whether the email exists.
- Row Level Security: anonymous keys can read active catalog rows and insert an
  order. **No anon UPDATE or DELETE policy exists anywhere.** All writes go
  through the server with the service-role key.
- Order creation re-reads prices and stock from the database and ignores
  anything the client claims about them.
- Uploads are checked for MIME type and capped at 5 MB.
- Settings updates accept only a known allow-list of keys.
- An order's personal details (name, phone, address) require the order's random
  access token, compared in constant time. A wrong token returns 404 rather
  than 403, so the endpoint cannot be used to discover which orders exist.

### Roles

| | Owner | Manager |
|---|---|---|
| Products, categories, orders, inventory, offers, settings | yes | yes |
| Add / remove / re-role admin users | yes | no |
| Change own name and password | yes | yes |

Roles are enforced on the server in the route handlers, not just hidden in the
UI. An owner cannot delete their own account, and the last remaining owner
cannot be removed — both would lock everyone out.

In local mode extra admins are stored with **scrypt** hashes and per-user salts;
plain passwords are never written to disk or returned by any API. Under Supabase
the password lives in Supabase Auth and the `admins` table holds only name and
role — an account needs a row in **both** to sign in, so revoking access is one
delete.

Before deploying, set `ADMIN_SESSION_SECRET` to a long random string — the app
refuses to start in production without it.

---

## Product images

Products ship without photographs, and the shop still looks like a shop.

Every product without an uploaded photo is drawn as an **illustration of the
right kind of package** — a sack for rice, a bottle for oil, a tin for canned
fish, a pouch for spices, a carton for eggs — tinted per product and printed
with the pack size. It is inline SVG, so it costs no network request, never
404s, and scales to any size.

**Why not real product photos?** Brand packshots on Google, Daraz or a
supplier's site are owned by those companies. Republishing them on a commercial
shop is copyright infringement and a takedown risk, so this project does not
ship them.

To use real photos, either is fine:

1. **Photograph the shelf.** A phone camera against a white wall is genuinely
   enough, and your own photos of your own stock are unambiguously yours.
   Admin → Products → Edit → upload. Up to 5 MB each.
2. **Ask your suppliers.** Distributors normally hand out official product
   images and are glad to have them used — get it in writing, then upload.

Photos replace the illustration the moment they are uploaded; nothing else
needs to change. Mixing the two looks fine, so you can photograph your
best-sellers first and leave the long tail illustrated.

---

## Accessibility

Checked against the rendered pages, not just intended:

- Every image has `alt`; every button, link and form control has an accessible
  name and an associated label.
- Heading outline is continuous on every page — no skipped levels.
- Colour contrast meets WCAG AA: muted body text 4.83:1, red CTAs 5.19:1, blue
  links 6.87:1, headings 14.97:1.
- Modals and drawers (filters, category editor, admin user editor, both mobile
  menus) trap focus, wrap Tab and Shift+Tab, close on Escape, and return focus
  to whatever opened them.
- Visible focus rings throughout, a skip-to-content link, and
  `prefers-reduced-motion` honoured.
- Touch targets are at least 32px, except inline text links, which WCAG 2.5.8
  exempts.

---

## Performance

Built for a mid-range phone on mobile data:

- ~87 kB shared JS. No charting, icon or UI library — icons are inline SVG and
  the admin charts are plain CSS.
- Images lazy-load through `next/image`; products without a photo render an
  instant tinted placeholder rather than a broken image or a network request.
- Server-rendered listings with pagination — no client-side search index.
- Skeleton loading states on the cart, checkout and product grid.
- Filters and sort live in the URL, so results are shareable, work with the back
  button, and are rendered on the server.

---

## Project layout

```
app/
  (shop)/            customer site — home, products, product, cart,
                     checkout, order, categories, offers, new arrivals,
                     about, contact
  admin/
    login/           unprotected sign-in
    (dashboard)/     protected: dashboard, products, categories, orders,
                     customers, offers, inventory, delivery, settings,
                     whatsapp, reports
  api/               products, categories, orders, settings, upload,
                     cart validation, admin auth
components/
  admin/             admin-only screens and forms
  cart/ checkout/    cart view, checkout form, confirmation
  home/ filters/     homepage sections, filter panel
  layout/ ui/        header, footer, nav, icons, toasts, primitives
lib/
  db/                DataStore interface + local and Supabase adapters
  i18n/              dictionaries and language provider
  cart/              cart state (localStorage)
  auth.ts            admin sessions
  whatsapp.ts        order message + click-to-chat links
data/                seed catalog (categories, products, builder)
scripts/             seed-local.mjs, generate-sql.mjs
supabase/            schema.sql, generated seed.sql
```

---

## Scripts

```bash
npm run dev              # development server
npm run build            # production build
npm run start            # run the production build
npm run typecheck        # TypeScript, no emit
npm run lint             # ESLint
npm run test:e2e         # 63-check regression suite against a running server
npm run seed:sql         # regenerate supabase/seed.sql from the demo catalog
```

`npm run test:e2e` drives a running server the way a browser would — storefront
routes, multilingual search, filters, checkout with stock reservation, the whole
admin surface and the auth guards. Start the app, then run it in a second
terminal.

---

## Deploying

Any Node host works, including serverless ones - the app keeps no local state,
so a read-only filesystem is fine.

1. Push the repository and import it on your host.
2. Set the six environment variables from `.env.example`.
   On Vercel these apply **per environment**: tick Production, Preview *and*
   Development. A variable scoped to Production only leaves preview builds with
   nothing, which is a common cause of a preview deployment failing while
   production works.
3. Deploy. Environment variables do not reach a build that has already run, so
   after changing them use **Redeploy**.

Builds never contact the database. If the project is unreachable at build time
the shop chrome falls back to packaged defaults and the build still succeeds -
a database outage should not be able to block a deployment.

### If it fails to start

Open `/api/health`. It reports which variables are present (presence only,
never values), whether the project is reachable, and how many products it can
see. It returns 503 with the cause when something is wrong, so it is safe to
share when asking for help.

Common answers:

| Health says | Fix |
|---|---|
| `Supabase is not configured` | Variables missing for that environment; add them and redeploy |
| Cannot reach the project | Free projects pause after inactivity - open the dashboard to resume |
| `relation ... does not exist` | `supabase/schema.sql` has not been run |
| `productCount: 0` | Schema is there but `supabase/seed.sql` has not been run |

---

## Extending it

The architecture is meant to grow from one shop to a marketplace:

- **Online payments** — checkout already separates order creation from
  confirmation. Add a provider between the two; `payment_method` is an enum
  with room for more values.
- **Customer accounts** — Supabase Auth is already wired for admins. Orders are
  keyed by phone number, so linking historical orders to a new account is a
  single query.
- **Multiple branches** — add a `branch_id` to `products` and `orders`; the
  `DataStore` interface is the only thing that needs to learn about it.
- **A second shop** — the settings row and category tree are entirely
  data-driven, so nothing in the UI assumes this particular shop.
