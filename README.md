# Lucky Traders — Grocery Shop

A complete online grocery shop for a Sri Lankan neighbourhood store: a fast,
mobile-first customer website plus an admin panel the shop owner can run
without a developer.

Orders are sent to the owner's WhatsApp as a ready-made message using the free
click-to-chat link — no WhatsApp Business API subscription required.

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The catalog (293 demo products across 21
categories) seeds itself into a local SQLite database on first run — **no
database setup, no signup, nothing to configure**.

Admin panel: <http://localhost:3000/admin>

| | |
|---|---|
| Email | `admin@luckytraders.lk` |
| Password | `change-this-password` |

Both come from `.env.local`, which was created for you from `.env.example`
with a random `ADMIN_SESSION_SECRET` already filled in. **Change the email and
password before deploying.**

---

## How the data layer works

The app talks to one interface, `DataStore` (`lib/db/types.ts`), and picks an
implementation at runtime:

| Condition | Adapter | Storage |
|---|---|---|
| default | `lib/db/sqlite.ts` | `.data/lucky-traders.db` |
| `DATA_BACKEND=json` | `lib/db/local.ts` | `.data/store.json` |
| Supabase env vars present | `lib/db/supabase.ts` | Supabase Postgres |

Nothing above that layer knows which is active, so switching backends is an
environment-variable change, not a rewrite.

### SQLite is the default, and it is enough

The shop runs on **one SQLite file**. That means:

- **Free forever.** No subscription, no trial, no usage tier.
- **Nothing to keep awake.** It cannot be paused or idled out the way a hosted
  Postgres project can.
- **No server process.** SQLite is a file, read and written in-process.
- **Backups are a file copy.** `copy .data\lucky-traders.db somewhere-safe.db`
  and you have the entire shop — products, orders, settings, admin accounts.
- **Plenty fast.** SQLite comfortably handles a catalog far larger than a
  grocery shop needs, with indexes on price, discount, category, brand and the
  search column.

It uses `@libsql/client`, which ships prebuilt binaries — so it installs on
Windows without Visual Studio build tools. The schema (`lib/db/sqlite-schema.ts`)
mirrors the Postgres one, generated columns included, so query behaviour matches
whichever backend you run.

If you ever outgrow one machine, the same adapter talks to a hosted libSQL /
Turso database: set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. No code change.

### Switching to Supabase (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. SQL editor → run **`supabase/schema.sql`** (tables, indexes, RLS, storage
   bucket, stock functions).
3. Generate and run the demo catalog:
   ```bash
   npm run seed:sql          # writes supabase/seed.sql
   ```
   Paste `supabase/seed.sql` into the SQL editor. It is idempotent — safe to
   re-run.
4. Fill in `.env.local`:
   ```ini
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...     # server only, never commit
   SUPABASE_STORAGE_BUCKET=product-images
   ```
5. Create your admin: Authentication → Users → add an email + password, then
   in the SQL editor:
   ```sql
   insert into public.admins (email, name, role)
   values ('owner@luckytraders.lk', 'Shop Owner', 'owner');
   ```
   Both the auth user **and** the `admins` row are required to sign in.
6. Restart the dev server.

---

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
npm run seed -- --force  # reset the demo data (stop the server first)
npm run seed:sql         # regenerate supabase/seed.sql
```

`npm run test:e2e` drives a running server the way a browser would — storefront
routes, multilingual search, filters, checkout with stock reservation, the whole
admin surface and the auth guards. Start the app, then run it in a second
terminal.

---

## Deploying

The right host depends on one thing: **whether the filesystem is writable.**

### Serverless (Vercel, Netlify) — use a hosted database

Their project directories are read-only, so the built-in SQLite file cannot be
created and the app will refuse to start. Point it at a hosted libSQL database
instead — free, and unlike a paused Postgres project it stays awake:

1. Create a database at [turso.tech](https://turso.tech) and copy its URL and
   auth token.
2. In your host's environment variables, set:
   ```ini
   TURSO_DATABASE_URL=libsql://your-db-name.turso.io
   TURSO_AUTH_TOKEN=your-token
   ADMIN_SESSION_SECRET=<a long random string>
   ADMIN_EMAIL=you@example.com
   ADMIN_PASSWORD=<a real password>
   ```
   Generate the secret with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
3. Deploy. The catalog seeds itself into the hosted database on first boot.

Supabase works the same way — set the three `SUPABASE_*` variables after running
`supabase/schema.sql`, and it takes precedence over libSQL.

### A host with a real disk — nothing to configure

Railway, Fly.io, Render with a disk, a VPS, or a Raspberry Pi in the shop: the
local SQLite file works as-is. Set `ADMIN_SESSION_SECRET`, `ADMIN_EMAIL` and
`ADMIN_PASSWORD`, and make sure `.data/` is on persistent storage rather than a
container layer that is wiped on redeploy.

### If it fails to start

The server log names the exact problem and the variables to set. A generic
"Application error: a server-side exception has occurred" in the browser with no
detail means the log is where to look — Vercel shows it under the deployment's
Functions tab.

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
