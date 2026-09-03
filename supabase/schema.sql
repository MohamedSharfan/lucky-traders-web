-- ===========================================================================
--  Lucky Traders — Grocery Shop
--  Supabase / PostgreSQL schema
-- ===========================================================================
--  Run this once in the Supabase SQL editor (or `supabase db push`).
--  Then run `npm run seed:sql` and paste the generated supabase/seed.sql to
--  load the demo catalog.
--
--  Security model
--  --------------
--  * Anonymous visitors may READ active products, categories, brands and the
--    settings row. They may INSERT an order and its items (that is checkout).
--  * Nobody may UPDATE or DELETE anything with the anon key.
--  * The Next.js server routes use the service-role key, which bypasses RLS,
--    and enforce admin access themselves via a signed session cookie.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- categories
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  name_si     text,
  name_ta     text,
  image_url   text,
  icon        text,
  parent_id   uuid references public.categories(id) on delete restrict,
  is_active   boolean not null default true,
  sort_order  integer not null default 100,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists categories_parent_idx on public.categories(parent_id);
create index if not exists categories_active_idx on public.categories(is_active, sort_order);

-- -------------------------------------------------------------------- brands
create table if not exists public.brands (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  is_active  boolean not null default true
);

-- ------------------------------------------------------------------ products
create table if not exists public.products (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  sku                  text not null,
  name                 text not null,
  name_si              text,
  name_ta              text,
  description          text,
  category_id          uuid not null references public.categories(id) on delete restrict,
  subcategory_id       uuid references public.categories(id) on delete set null,
  brand_id             uuid references public.brands(id) on delete set null,
  price                numeric(12,2) not null check (price >= 0),
  sale_price           numeric(12,2) check (sale_price >= 0),
  stock                integer not null default 0 check (stock >= 0),
  low_stock_threshold  integer not null default 10,
  unit                 text not null default '1 piece',
  weight               text,
  image_url            text,
  gallery              text[] not null default '{}',
  is_featured          boolean not null default false,
  is_new               boolean not null default false,
  is_best_seller       boolean not null default false,
  is_active            boolean not null default true,
  popularity           integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- The price the customer actually pays. Generated so it can be filtered and
  -- sorted on directly, with an index, instead of in application code.
  effective_price numeric(12,2)
    generated always as (
      case
        when sale_price is not null and sale_price > 0 and sale_price < price
          then sale_price
        else price
      end
    ) stored,

  -- Whole-number discount percentage, used for the "biggest discount" sort.
  discount_percent integer
    generated always as (
      case
        when sale_price is not null and sale_price > 0 and sale_price < price and price > 0
          then round(((price - sale_price) / price) * 100)::int
        else 0
      end
    ) stored,

  -- One column holding every searchable string, so a single ILIKE matches
  -- English, Sinhala and Tamil names as well as the SKU.
  search_text text
    generated always as (
      lower(
        coalesce(name, '') || ' ' ||
        coalesce(name_si, '') || ' ' ||
        coalesce(name_ta, '') || ' ' ||
        coalesce(sku, '') || ' ' ||
        coalesce(description, '')
      )
    ) stored
);

create index if not exists products_category_idx      on public.products(category_id);
create index if not exists products_subcategory_idx   on public.products(subcategory_id);
create index if not exists products_brand_idx         on public.products(brand_id);
create index if not exists products_active_idx        on public.products(is_active);
create index if not exists products_effective_price_idx on public.products(effective_price);
create index if not exists products_discount_idx      on public.products(discount_percent desc);
create index if not exists products_popularity_idx    on public.products(stock desc, popularity desc);
create index if not exists products_flags_idx         on public.products(is_featured, is_new, is_best_seller);

-- Trigram index makes the multilingual ILIKE search fast at catalog scale.
create extension if not exists pg_trgm;
create index if not exists products_search_trgm_idx
  on public.products using gin (search_text gin_trgm_ops);

-- -------------------------------------------------------------------- orders
do $$ begin
  create type order_status as enum (
    'new', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type delivery_method as enum ('delivery', 'pickup');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('cod', 'pay_at_store');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique,
  customer_name    text not null,
  phone            text not null,
  whatsapp         text,
  email            text,
  address_line     text,
  street           text,
  area             text,
  city             text,
  district         text,
  notes            text,
  delivery_method  delivery_method not null default 'delivery',
  payment_method   payment_method  not null default 'cod',
  subtotal         numeric(12,2) not null default 0,
  delivery_fee     numeric(12,2) not null default 0,
  discount         numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,
  status           order_status not null default 'new',
  -- Unguessable key for the customer's confirmation link. Order numbers are
  -- sequential, so they alone must never unlock an order's personal details.
  access_token     text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_status_idx  on public.orders(status);
create index if not exists orders_phone_idx   on public.orders(phone);

create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  -- The name and price are copied, not joined: an order must still read
  -- correctly years later even if the product is renamed or deleted.
  product_name  text not null,
  unit          text not null default '',
  quantity      integer not null check (quantity > 0),
  unit_price    numeric(12,2) not null,
  total         numeric(12,2) not null
);

create index if not exists order_items_order_idx on public.order_items(order_id);

-- Monotonic order sequence, so order numbers never collide under load.
create sequence if not exists public.order_number_seq start 1;

create or replace function public.next_order_sequence()
returns integer
language sql
security definer
set search_path = public
as $$
  select nextval('public.order_number_seq')::int;
$$;

-- -------------------------------------------------------------------- admins
create table if not exists public.admins (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  name       text not null,
  role       text not null default 'manager' check (role in ('owner', 'manager')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ settings
-- A single JSON row keeps store settings flexible: adding a new setting never
-- needs a migration, and the app merges it over its defaults.
create table if not exists public.settings (
  id         smallint primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.settings (id, data) values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- ------------------------------------------------------- stock reservation
-- Checkout decrements stock through this function so two customers cannot buy
-- the same last item: the UPDATE ... where stock >= quantity is atomic.
create or replace function public.reserve_stock(lines jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  line   jsonb;
  rows_hit integer;
begin
  for line in select * from jsonb_array_elements(lines) loop
    update public.products
       set stock      = stock - (line->>'quantity')::int,
           popularity = popularity + (line->>'quantity')::int,
           updated_at = now()
     where id = (line->>'product_id')::uuid
       and stock >= (line->>'quantity')::int;

    get diagnostics rows_hit = row_count;
    if rows_hit = 0 then
      raise exception 'Not enough stock for product %', line->>'product_id'
        using errcode = 'check_violation';
    end if;
  end loop;
end;
$$;

-- Cancelling an order puts its stock back on the shelf.
create or replace function public.release_stock(lines jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  line jsonb;
begin
  for line in select * from jsonb_array_elements(lines) loop
    update public.products
       set stock = stock + (line->>'quantity')::int,
           updated_at = now()
     where id = (line->>'product_id')::uuid;
  end loop;
end;
$$;

-- -------------------------------------------------------- updated_at triggers
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_touch on public.categories;
create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ===========================================================================
--  Row Level Security
-- ===========================================================================
alter table public.categories  enable row level security;
alter table public.brands      enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.settings    enable row level security;
alter table public.admins      enable row level security;

-- Public catalog reads -------------------------------------------------------
drop policy if exists "categories are publicly readable" on public.categories;
create policy "categories are publicly readable"
  on public.categories for select to anon, authenticated
  using (is_active = true);

drop policy if exists "brands are publicly readable" on public.brands;
create policy "brands are publicly readable"
  on public.brands for select to anon, authenticated
  using (is_active = true);

drop policy if exists "active products are publicly readable" on public.products;
create policy "active products are publicly readable"
  on public.products for select to anon, authenticated
  using (is_active = true);

drop policy if exists "settings are publicly readable" on public.settings;
create policy "settings are publicly readable"
  on public.settings for select to anon, authenticated
  using (true);

-- Checkout -------------------------------------------------------------------
-- Guests can create an order, but never read anyone's orders back. Order
-- lookup on the confirmation page goes through the server (service role).
drop policy if exists "anyone may place an order" on public.orders;
create policy "anyone may place an order"
  on public.orders for insert to anon, authenticated
  with check (true);

drop policy if exists "anyone may add items to their new order" on public.order_items;
create policy "anyone may add items to their new order"
  on public.order_items for insert to anon, authenticated
  with check (true);

-- Admin table ----------------------------------------------------------------
-- A signed-in admin may read only their own row; the server uses the service
-- role for everything else.
drop policy if exists "admins read their own row" on public.admins;
create policy "admins read their own row"
  on public.admins for select to authenticated
  using (email = auth.jwt() ->> 'email');

-- Deliberately no UPDATE/DELETE policies anywhere: with the anon key those
-- operations return zero rows. All writes happen server-side.

-- ===========================================================================
--  Storage bucket for product images
-- ===========================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product images are publicly readable" on storage.objects;
create policy "product images are publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

-- Uploads go through the server route with the service-role key, so no
-- anon-key insert policy is granted here.

-- ===========================================================================
--  First admin
-- ===========================================================================
--  1. Create the user in Supabase → Authentication → Users (email + password).
--  2. Insert the matching row below. Both are required to sign in.
--
--  insert into public.admins (email, name, role)
--  values ('owner@luckytraders.lk', 'Shop Owner', 'owner')
--  on conflict (email) do nothing;
