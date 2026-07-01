-- ============================================================
-- WARKOP KANG ASEP — Skema Database (Supabase / PostgreSQL)
-- ============================================================
-- Cara pakai:
-- 1. Buka project Supabase kamu → menu "SQL Editor"
-- 2. Copy-paste seluruh isi file ini → klik "Run"
-- 3. Tabel, aturan akses (RLS), dan data menu awal akan otomatis dibuat
-- ============================================================

-- Aktifkan ekstensi untuk generate UUID (biasanya sudah aktif di Supabase)
create extension if not exists "pgcrypto";

-- ============================================================
-- TABEL: menu_items
-- ============================================================
create table if not exists menu_items (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null,
  deskripsi   text not null default '',
  harga       integer not null check (harga >= 0),
  kategori    text not null check (kategori in ('kopi-panas','kopi-dingin','non-kopi','makanan','cemilan')),
  ikon        text not null default '☕',
  andalan     boolean not null default false,
  urutan      integer not null default 0,
  aktif       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table menu_items is 'Daftar menu warkop yang tampil di halaman utama';
comment on column menu_items.aktif is 'Kalau false, menu disembunyikan dari pengunjung (soft delete)';
comment on column menu_items.andalan is 'Tampilkan badge "Andalan/Hits/Favorit" di kartu menu';

-- ============================================================
-- TABEL: orders (pesanan dari pelanggan)
-- ============================================================
create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  nama_pelanggan   text not null default 'Tanpa Nama',
  no_wa            text,
  items            jsonb not null,       -- contoh: [{"nama":"Kopi Susu","harga":14000,"qty":2}]
  total            integer not null check (total >= 0),
  status           text not null default 'baru' check (status in ('baru','diproses','selesai','dibatalkan')),
  catatan          text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table orders is 'Riwayat pesanan yang masuk lewat keranjang belanja di web';
comment on column orders.items is 'Array JSON berisi item yang dipesan beserta qty & harga saat itu';
comment on column orders.status is 'baru -> diproses -> selesai (atau dibatalkan)';

-- Index biar query staff (lihat pesanan terbaru / status) lebih cepat
create index if not exists idx_orders_created_at on orders (created_at desc);
create index if not exists idx_orders_status on orders (status);
create index if not exists idx_menu_kategori on menu_items (kategori);

-- ============================================================
-- TRIGGER: auto-update kolom updated_at
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_menu_updated_at on menu_items;
create trigger trg_menu_updated_at
  before update on menu_items
  for each row execute function set_updated_at();

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Prinsip:
--   - Pengunjung umum (anon)  : boleh BACA menu aktif, boleh BUAT pesanan baru
--   - Staff yang login (auth) : boleh BACA/UBAH semua menu & semua pesanan
-- ============================================================

alter table menu_items enable row level security;
alter table orders enable row level security;

-- ---------- Kebijakan menu_items ----------

-- Siapa saja boleh melihat menu yang aktif
drop policy if exists "Publik bisa lihat menu aktif" on menu_items;
create policy "Publik bisa lihat menu aktif"
  on menu_items for select
  to anon, authenticated
  using (aktif = true);

-- Staff (sudah login) boleh melihat SEMUA menu, termasuk yang nonaktif
drop policy if exists "Staff bisa lihat semua menu" on menu_items;
create policy "Staff bisa lihat semua menu"
  on menu_items for select
  to authenticated
  using (true);

-- Staff boleh tambah / ubah / hapus menu
drop policy if exists "Staff kelola menu" on menu_items;
create policy "Staff kelola menu"
  on menu_items for all
  to authenticated
  using (true)
  with check (true);

-- ---------- Kebijakan orders ----------

-- Pengunjung umum boleh MEMBUAT pesanan (insert saja, tidak bisa baca punya orang lain)
drop policy if exists "Publik bisa checkout" on orders;
create policy "Publik bisa checkout"
  on orders for insert
  to anon, authenticated
  with check (true);

-- Hanya staff yang login yang boleh melihat daftar pesanan
drop policy if exists "Staff bisa lihat pesanan" on orders;
create policy "Staff bisa lihat pesanan"
  on orders for select
  to authenticated
  using (true);

-- Hanya staff yang boleh update status pesanan (baru -> diproses -> selesai)
drop policy if exists "Staff bisa update pesanan" on orders;
create policy "Staff bisa update pesanan"
  on orders for update
  to authenticated
  using (true)
  with check (true);

-- Hanya staff yang boleh hapus pesanan (misal salah input / spam)
drop policy if exists "Staff bisa hapus pesanan" on orders;
create policy "Staff bisa hapus pesanan"
  on orders for delete
  to authenticated
  using (true);

-- ============================================================
-- SEED DATA: isi awal menu (19 item, sama seperti versi statis)
-- ============================================================
insert into menu_items (nama, deskripsi, harga, kategori, ikon, andalan, urutan) values
  ('Kopi Tubruk Original',     'Kopi robusta Pengalengan diseduh tradisional, pekat dan harum. Klasik tak tergantikan.', 8000,  'kopi-panas', '☕', true,  1),
  ('Kopi Susu Kang Asep',      'Espresso double shot dengan susu segar full cream, disajikan hangat-hangat kuku.',       14000, 'kopi-panas', '🫙', false, 2),
  ('Cappuccino Kayu Manis',    'Cappuccino lembut dengan taburan kayu manis bubuk. Aroma yang menghangatkan pagi.',      18000, 'kopi-panas', '🍂', false, 3),
  ('Americano Garut',          'Arabika single origin Garut, diseduh pour-over. Profil coklat hitam dan asam buah ringan.', 16000, 'kopi-panas', '🌿', false, 4),

  ('Es Kopi Susu Aren',        'Espresso, susu segar, dan gula aren asli Cianjur. Manis alami tanpa gula pasir.',        16000, 'kopi-dingin', '🧊', true,  5),
  ('Cold Brew 18 Jam',         'Diseduh dingin selama 18 jam. Smooth, kaya rasa, dan low-acid.',                        20000, 'kopi-dingin', '🥛', false, 6),
  ('Affogato',                 'Satu scoop es krim vanilla ditenggelamkan espresso panas. Kontras yang bikin nagih.',    22000, 'kopi-dingin', '🍦', false, 7),
  ('Dalgona Kopi',             'Busa kopi manis lembut di atas susu segar dingin. Cantik dan enak.',                    18000, 'kopi-dingin', '🫧', false, 8),

  ('Teh Tarik Bandung',        'Teh hitam kuat ditarik dengan susu kental manis, berbusa dan harum.',                    9000,  'non-kopi', '🍵', false, 9),
  ('Matcha Latte',             'Matcha grade premium, dipadukan susu segar. Bisa panas atau dingin.',                   19000, 'non-kopi', '🍃', false, 10),
  ('Wedang Jahe Rempah',       'Jahe merah, kayu manis, cengkeh, kapulaga — resep warisan.',                            10000, 'non-kopi', '🌸', false, 11),
  ('Es Jeruk Peras',           'Jeruk segar diperas langsung di hadapanmu. Segar alami tanpa sirup.',                    8000,  'non-kopi', '🍹', false, 12),

  ('Nasi Goreng Kang Asep',    'Nasi goreng teri Medan dengan telur ceplok, acar timun, dan kerupuk. Menu paling dipesan.', 18000, 'makanan', '🍳', true,  13),
  ('Mie Rebus Spesial',        'Mie kuning dengan kuah kaldu ayam, sawi, tahu, telur, dan bawang goreng renyah.',        15000, 'makanan', '🍜', false, 14),
  ('Roti Bakar Coklat Keju',   'Roti tawar tebal dibakar sempurna, dilapisi selai coklat dan keju parut.',               12000, 'makanan', '🥪', false, 15),
  ('Indomie Goreng Telur',     'Indomie goreng spesial dengan extra telur orak-arik, sosis, dan bawang goreng.',         11000, 'makanan', '🍳', false, 16),

  ('Kacang Rebus',             'Kacang tanah rebus dengan garam kasar. Cocok nemenin ngobrol sambil ngopi.',             5000,  'cemilan', '🥜', false, 17),
  ('Pisang Goreng Madu',       'Pisang kepok setengah matang, digoreng crispy, disiram madu asli.',                     10000, 'cemilan', '🍪', false, 18),
  ('Singkong Goreng Sambal',   'Singkong empuk gurih digoreng garing, disajikan dengan sambal kacang pedas.',            8000,  'cemilan', '🧇', false, 19)
on conflict do nothing;

-- ============================================================
-- SELESAI
-- Langkah selanjutnya:
-- 1. Buka menu "Authentication" di Supabase, tambahkan akun staff
--    (email + password) yang boleh akses admin.html
-- 2. Salin "Project URL" dan "anon public key" dari menu Settings > API
--    ke file js/supabase-client.js
-- ============================================================
