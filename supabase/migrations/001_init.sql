-- ─────────────────────────────────────────────────────────────
-- 001_init.sql  –  Banyan Deal Engine core schema
-- ─────────────────────────────────────────────────────────────

-- ── Organizations ─────────────────────────────────────────────
create table organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz default now()
);

-- ── Profiles (extends auth.users) ────────────────────────────
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  org_id     uuid not null references organizations(id) on delete cascade,
  full_name  text,
  email      text not null,
  role       text not null default 'owner' check (role in ('owner','admin','member')),
  created_at timestamptz default now()
);

-- ── Deals ─────────────────────────────────────────────────────
create table deals (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  created_by uuid not null references profiles(id),
  name       text not null,
  address    text,
  mode       text not null check (mode in ('brrrr','nnn')),
  status     text not null default 'analyzing'
             check (status in ('analyzing','pass','negotiate','loi','under_contract','closed','dead')),
  inputs     jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Deal versions (snapshot history) ─────────────────────────
create table deal_versions (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references deals(id) on delete cascade,
  version_num integer not null,
  inputs      jsonb not null,
  result      jsonb not null,
  created_by  uuid not null references profiles(id),
  created_at  timestamptz default now()
);

-- ── Rent roll tenants (NNN / multi-tenant) ────────────────────
create table rent_roll_tenants (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references deals(id) on delete cascade,
  tenant_name text not null,
  sf          numeric not null default 0,
  rent_per_sf numeric not null default 0,
  lease_start date,
  lease_end   date,
  lease_type  text check (lease_type in ('nnn','nn','gross')),
  options     text,
  created_at  timestamptz default now()
);

-- ── Debt tranches ─────────────────────────────────────────────
create table debt_tranches (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid not null references deals(id) on delete cascade,
  name       text not null,
  amount     numeric not null default 0,
  rate       numeric not null default 0,
  amort      integer not null default 30,
  position   integer not null default 1,
  created_at timestamptz default now()
);

-- ── Scenarios ─────────────────────────────────────────────────
create table scenarios (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid not null references deals(id) on delete cascade,
  name       text not null,
  inputs     jsonb not null,
  result     jsonb not null,
  created_at timestamptz default now()
);

-- ── Comparables ───────────────────────────────────────────────
create table comparables (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid not null references deals(id) on delete cascade,
  address    text,
  price      numeric,
  sf         numeric,
  cap_rate   numeric,
  sale_date  date,
  source     text,
  notes      text,
  created_at timestamptz default now()
);

-- ── Activity log ──────────────────────────────────────────────
create table activity_log (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  user_id    uuid references profiles(id),
  deal_id    uuid references deals(id) on delete set null,
  action     text not null,
  metadata   jsonb default '{}',
  created_at timestamptz default now()
);

-- ── updated_at trigger ────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger deals_updated_at
  before update on deals
  for each row execute function update_updated_at();

-- ── Row Level Security ────────────────────────────────────────
alter table organizations     enable row level security;
alter table profiles          enable row level security;
alter table deals             enable row level security;
alter table deal_versions     enable row level security;
alter table rent_roll_tenants enable row level security;
alter table debt_tranches     enable row level security;
alter table scenarios         enable row level security;
alter table comparables       enable row level security;
alter table activity_log      enable row level security;

-- Helper: current user's org_id
create or replace function auth_org_id()
returns uuid language sql security definer stable as $$
  select org_id from profiles where id = auth.uid();
$$;

-- ── Policies: organizations ───────────────────────────────────
create policy "org_select" on organizations for select
  using (id = auth_org_id());

-- ── Policies: profiles ────────────────────────────────────────
create policy "profiles_select" on profiles for select
  using (org_id = auth_org_id());

create policy "profiles_insert" on profiles for insert
  with check (id = auth.uid());

create policy "profiles_update" on profiles for update
  using (id = auth.uid());

-- ── Policies: deals ───────────────────────────────────────────
create policy "deals_select" on deals for select using (org_id = auth_org_id());
create policy "deals_insert" on deals for insert with check (org_id = auth_org_id());
create policy "deals_update" on deals for update using (org_id = auth_org_id());
create policy "deals_delete" on deals for delete using (org_id = auth_org_id());

-- ── Policies: deal_versions ───────────────────────────────────
create policy "dv_select" on deal_versions for select
  using (deal_id in (select id from deals where org_id = auth_org_id()));
create policy "dv_insert" on deal_versions for insert
  with check (deal_id in (select id from deals where org_id = auth_org_id()));

-- ── Policies: rent_roll_tenants ───────────────────────────────
create policy "rr_select" on rent_roll_tenants for select
  using (deal_id in (select id from deals where org_id = auth_org_id()));
create policy "rr_insert" on rent_roll_tenants for insert
  with check (deal_id in (select id from deals where org_id = auth_org_id()));
create policy "rr_update" on rent_roll_tenants for update
  using (deal_id in (select id from deals where org_id = auth_org_id()));
create policy "rr_delete" on rent_roll_tenants for delete
  using (deal_id in (select id from deals where org_id = auth_org_id()));

-- ── Policies: debt_tranches ───────────────────────────────────
create policy "dt_select" on debt_tranches for select
  using (deal_id in (select id from deals where org_id = auth_org_id()));
create policy "dt_insert" on debt_tranches for insert
  with check (deal_id in (select id from deals where org_id = auth_org_id()));
create policy "dt_update" on debt_tranches for update
  using (deal_id in (select id from deals where org_id = auth_org_id()));
create policy "dt_delete" on debt_tranches for delete
  using (deal_id in (select id from deals where org_id = auth_org_id()));

-- ── Policies: scenarios ───────────────────────────────────────
create policy "sc_select" on scenarios for select
  using (deal_id in (select id from deals where org_id = auth_org_id()));
create policy "sc_insert" on scenarios for insert
  with check (deal_id in (select id from deals where org_id = auth_org_id()));
create policy "sc_update" on scenarios for update
  using (deal_id in (select id from deals where org_id = auth_org_id()));
create policy "sc_delete" on scenarios for delete
  using (deal_id in (select id from deals where org_id = auth_org_id()));

-- ── Policies: comparables ─────────────────────────────────────
create policy "comp_select" on comparables for select
  using (deal_id in (select id from deals where org_id = auth_org_id()));
create policy "comp_insert" on comparables for insert
  with check (deal_id in (select id from deals where org_id = auth_org_id()));
create policy "comp_update" on comparables for update
  using (deal_id in (select id from deals where org_id = auth_org_id()));
create policy "comp_delete" on comparables for delete
  using (deal_id in (select id from deals where org_id = auth_org_id()));

-- ── Policies: activity_log ────────────────────────────────────
create policy "al_select" on activity_log for select using (org_id = auth_org_id());
create policy "al_insert" on activity_log for insert with check (org_id = auth_org_id());
