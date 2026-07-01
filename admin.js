/* ============================================================
   WARKOP KANG ASEP — admin.js
   Panel staff: login, kelola pesanan, kelola menu
   ============================================================ */

const layarLogin = document.getElementById('layarLogin');
const dashboard  = document.getElementById('dashboard');
const emailTag   = document.getElementById('emailTag');

const formatRupiah = (angka) => 'Rp ' + Number(angka).toLocaleString('id-ID');

/* ============================================================
   AUTENTIKASI
   ============================================================ */

async function cekSesiLogin() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    tampilkanDashboard(session.user.email);
  } else {
    tampilkanLogin();
  }
}

function tampilkanLogin() {
  layarLogin.style.display = 'flex';
  dashboard.classList.remove('tampil');
}

function tampilkanDashboard(email) {
  layarLogin.style.display = 'none';
  dashboard.classList.add('tampil');
  emailTag.textContent = email;
  muatPesanan();
  muatMenuAdmin();
  pantauPesananRealtime();
}

document.getElementById('btnLogin').addEventListener('click', login);
document.getElementById('inputPassword').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') login();
});

async function login() {
  const email    = document.getElementById('inputEmail').value.trim();
  const password = document.getElementById('inputPassword').value;
  const errorEl  = document.getElementById('loginError');
  const btn      = document.getElementById('btnLogin');

  errorEl.textContent = '';

  if (!email || !password) {
    errorEl.textContent = 'Email dan password wajib diisi.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Memproses...';

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  btn.disabled = false;
  btn.textContent = 'Masuk';

  if (error) {
    errorEl.textContent = 'Email atau password salah. Hubungi owner untuk buat akun staff.';
    return;
  }

  tampilkanDashboard(data.user.email);
}

document.getElementById('btnLogout').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  if (channelPesanan) {
    supabaseClient.removeChannel(channelPesanan);
    channelPesanan = null;
  }
  tampilkanLogin();
});

/* ============================================================
   TAB SWITCHING
   ============================================================ */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('aktif'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('aktif'));
    btn.classList.add('aktif');
    document.getElementById('tab' + capitalize(btn.dataset.tab)).classList.add('aktif');
  });
});

function capitalize(teks) {
  return teks.charAt(0).toUpperCase() + teks.slice(1);
}

/* ============================================================
   TAB PESANAN
   ============================================================ */

let semuaPesanan = [];
let filterStatusAktif = 'semua';

async function muatPesanan() {
  const listEl = document.getElementById('orderList');
  listEl.innerHTML = '<div class="kosong-state">Memuat pesanan...</div>';

  const { data, error } = await supabaseClient
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    listEl.innerHTML = `<div class="kosong-state">⚠️ Gagal memuat pesanan: ${error.message}</div>`;
    return;
  }

  semuaPesanan = data || [];
  renderPesanan();
}

document.querySelectorAll('#statusFilter button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#statusFilter button').forEach(b => b.classList.remove('aktif'));
    btn.classList.add('aktif');
    filterStatusAktif = btn.dataset.status;
    renderPesanan();
  });
});

function renderPesanan() {
  const listEl = document.getElementById('orderList');

  const daftar = filterStatusAktif === 'semua'
    ? semuaPesanan
    : semuaPesanan.filter(o => o.status === filterStatusAktif);

  if (daftar.length === 0) {
    listEl.innerHTML = '<div class="kosong-state">Belum ada pesanan di kategori ini.</div>';
    return;
  }

  listEl.innerHTML = daftar.map(order => {
    const waktu = new Date(order.created_at).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const itemsHtml = (order.items || []).map(i =>
      `<li>${escapeHtml(i.nama)} × ${i.qty} — ${formatRupiah(i.harga * i.qty)}</li>`
    ).join('');

    return `
      <div class="order-card">
        <div class="order-top">
          <div>
            <div class="order-nama">${escapeHtml(order.nama_pelanggan || 'Tanpa Nama')}${order.no_meja ? `<span class="order-meja">Meja ${escapeHtml(order.no_meja)}</span>` : ''}</div>
            <div class="order-waktu">${waktu}</div>
          </div>
          <div class="order-total">${formatRupiah(order.total)}</div>
        </div>
        <ul class="order-items">${itemsHtml}</ul>
        <div class="order-bottom">
          <span class="badge-status ${order.status}">${labelStatus(order.status)}</span>
          <div class="order-actions">
            <select onchange="ubahStatusPesanan('${order.id}', this.value)">
              <option value="baru" ${order.status === 'baru' ? 'selected' : ''}>Baru</option>
              <option value="diproses" ${order.status === 'diproses' ? 'selected' : ''}>Diproses</option>
              <option value="selesai" ${order.status === 'selesai' ? 'selected' : ''}>Selesai</option>
              <option value="dibatalkan" ${order.status === 'dibatalkan' ? 'selected' : ''}>Dibatalkan</option>
            </select>
            <button onclick="hapusPesanan('${order.id}')">Hapus</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function labelStatus(status) {
  const label = { baru: 'Baru', diproses: 'Diproses', selesai: 'Selesai', dibatalkan: 'Dibatalkan' };
  return label[status] || status;
}

async function ubahStatusPesanan(id, statusBaru) {
  const { error } = await supabaseClient
    .from('orders')
    .update({ status: statusBaru })
    .eq('id', id);

  if (error) {
    alert('Gagal mengubah status: ' + error.message);
    return;
  }

  const item = semuaPesanan.find(o => o.id === id);
  if (item) item.status = statusBaru;
  renderPesanan();
}

async function hapusPesanan(id) {
  if (!confirm('Hapus pesanan ini secara permanen?')) return;

  const { error } = await supabaseClient.from('orders').delete().eq('id', id);

  if (error) {
    alert('Gagal menghapus pesanan: ' + error.message);
    return;
  }

  semuaPesanan = semuaPesanan.filter(o => o.id !== id);
  renderPesanan();
}

/* ---------- Realtime: pesanan baru langsung muncul tanpa refresh ---------- */
let channelPesanan = null;

function pantauPesananRealtime() {
  if (channelPesanan) return; // sudah aktif, jangan dobel-subscribe

  channelPesanan = supabaseClient
    .channel('admin-orders-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
      semuaPesanan.unshift(payload.new);
      renderPesanan();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
      const idx = semuaPesanan.findIndex(o => o.id === payload.new.id);
      if (idx !== -1) semuaPesanan[idx] = payload.new;
      renderPesanan();
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' }, (payload) => {
      semuaPesanan = semuaPesanan.filter(o => o.id !== payload.old.id);
      renderPesanan();
    })
    .subscribe();
}

/* ============================================================
   TAB KELOLA MENU
   ============================================================ */

let semuaMenu = [];

async function muatMenuAdmin() {
  const gridEl = document.getElementById('menuAdminGrid');
  gridEl.innerHTML = '<div class="kosong-state">Memuat menu...</div>';

  const { data, error } = await supabaseClient
    .from('menu_items')
    .select('*')
    .order('urutan', { ascending: true });

  if (error) {
    gridEl.innerHTML = `<div class="kosong-state">⚠️ Gagal memuat menu: ${error.message}</div>`;
    return;
  }

  semuaMenu = data || [];
  renderMenuAdmin();
}

/* Cek apakah nilai ikon berupa URL gambar (bukan emoji) */
function isUrlGambar(nilai) {
  if (!nilai) return false;
  return /^https?:\/\//i.test(nilai) || nilai.startsWith('/') || nilai.startsWith('data:image');
}

function renderMenuAdmin() {
  const gridEl = document.getElementById('menuAdminGrid');

  if (semuaMenu.length === 0) {
    gridEl.innerHTML = '<div class="kosong-state">Belum ada menu. Klik "+ Tambah Menu" untuk mulai.</div>';
    return;
  }

  gridEl.innerHTML = semuaMenu.map(item => {
    const thumb = isUrlGambar(item.ikon)
      ? `<img class="menu-admin-thumb" src="${escapeHtml(item.ikon)}" alt="${escapeHtml(item.nama)}" onerror="this.style.display='none'" />`
      : `<div class="menu-admin-thumb">☕</div>`;

    return `
    <div class="menu-admin-card ${item.aktif ? '' : 'nonaktif'}">
      <div class="menu-admin-top">
        ${thumb}
        <div>
          <div class="menu-admin-nama">${escapeHtml(item.nama)}</div>
          <div class="menu-admin-kategori">${escapeHtml(item.kategori)}${item.andalan ? ' · ⭐ Andalan' : ''}</div>
        </div>
      </div>
      <div class="menu-admin-harga">${formatRupiah(item.harga)}</div>
      <div class="menu-admin-actions">
        <button class="btn-edit" onclick="bukaModalEdit('${item.id}')">Edit</button>
        <button class="btn-toggle" onclick="toggleAktifMenu('${item.id}', ${!item.aktif})">
          ${item.aktif ? 'Sembunyikan' : 'Aktifkan'}
        </button>
        <button class="btn-hapus" onclick="hapusMenu('${item.id}')">Hapus</button>
      </div>
    </div>
  `;
  }).join('');
}

async function toggleAktifMenu(id, statusBaru) {
  const { error } = await supabaseClient
    .from('menu_items')
    .update({ aktif: statusBaru })
    .eq('id', id);

  if (error) {
    alert('Gagal mengubah status menu: ' + error.message);
    return;
  }

  const item = semuaMenu.find(m => m.id === id);
  if (item) item.aktif = statusBaru;
  renderMenuAdmin();
}

async function hapusMenu(id) {
  if (!confirm('Hapus menu ini secara permanen? Tindakan tidak bisa dibatalkan.')) return;

  const { error } = await supabaseClient.from('menu_items').delete().eq('id', id);

  if (error) {
    alert('Gagal menghapus menu: ' + error.message);
    return;
  }

  semuaMenu = semuaMenu.filter(m => m.id !== id);
  renderMenuAdmin();
}

/* ---------- Modal Tambah/Edit Menu ---------- */
const modalOverlay = document.getElementById('modalOverlay');

document.getElementById('btnTambahMenu').addEventListener('click', () => bukaModalTambah());
document.getElementById('btnBatalModal').addEventListener('click', tutupModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) tutupModal();
});

function bukaModalTambah() {
  document.getElementById('modalJudul').textContent = 'Tambah Menu';
  document.getElementById('formId').value = '';
  document.getElementById('formNama').value = '';
  document.getElementById('formDeskripsi').value = '';
  document.getElementById('formHarga').value = '';
  document.getElementById('formKategori').value = 'kopi-panas';
  document.getElementById('formIkon').value = '';
  document.getElementById('formUrutan').value = semuaMenu.length + 1;
  document.getElementById('formAndalan').checked = false;
  perbaruiPreviewIkon();
  modalOverlay.classList.add('tampil');
}

function bukaModalEdit(id) {
  const item = semuaMenu.find(m => m.id === id);
  if (!item) return;

  document.getElementById('modalJudul').textContent = 'Edit Menu';
  document.getElementById('formId').value = item.id;
  document.getElementById('formNama').value = item.nama;
  document.getElementById('formDeskripsi').value = item.deskripsi || '';
  document.getElementById('formHarga').value = item.harga;
  document.getElementById('formKategori').value = item.kategori;
  document.getElementById('formIkon').value = item.ikon || '';
  document.getElementById('formUrutan').value = item.urutan || 0;
  document.getElementById('formAndalan').checked = !!item.andalan;
  perbaruiPreviewIkon();
  modalOverlay.classList.add('tampil');
}

/* Pratinjau gambar menu saat URL diketik/ditempel */
const inputFormIkon  = document.getElementById('formIkon');
const previewIkonEl  = document.getElementById('previewIkon');

function perbaruiPreviewIkon() {
  const url = inputFormIkon.value.trim();
  if (isUrlGambar(url)) {
    previewIkonEl.src = url;
    previewIkonEl.style.display = 'block';
  } else {
    previewIkonEl.style.display = 'none';
  }
}

inputFormIkon.addEventListener('input', perbaruiPreviewIkon);
previewIkonEl.addEventListener('error', () => { previewIkonEl.style.display = 'none'; });

function tutupModal() {
  modalOverlay.classList.remove('tampil');
}

document.getElementById('btnSimpanModal').addEventListener('click', simpanMenu);

async function simpanMenu() {
  const id         = document.getElementById('formId').value;
  const nama       = document.getElementById('formNama').value.trim();
  const deskripsi  = document.getElementById('formDeskripsi').value.trim();
  const harga      = parseInt(document.getElementById('formHarga').value, 10);
  const kategori   = document.getElementById('formKategori').value;
  const ikon       = document.getElementById('formIkon').value.trim();
  const urutan     = parseInt(document.getElementById('formUrutan').value, 10) || 0;
  const andalan    = document.getElementById('formAndalan').checked;

  if (!nama || isNaN(harga) || harga < 0) {
    alert('Nama menu dan harga wajib diisi dengan benar.');
    return;
  }

  const payload = { nama, deskripsi, harga, kategori, ikon, urutan, andalan };
  const btn = document.getElementById('btnSimpanModal');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  let error;
  if (id) {
    ({ error } = await supabaseClient.from('menu_items').update(payload).eq('id', id));
  } else {
    ({ error } = await supabaseClient.from('menu_items').insert([{ ...payload, aktif: true }]));
  }

  btn.disabled = false;
  btn.textContent = 'Simpan';

  if (error) {
    alert('Gagal menyimpan menu: ' + error.message);
    return;
  }

  tutupModal();
  muatMenuAdmin();
}

/* ============================================================
   HELPER
   ============================================================ */
function escapeHtml(teks) {
  const div = document.createElement('div');
  div.textContent = teks;
  return div.innerHTML;
}

/* ============================================================
   MULAI
   ============================================================ */
cekSesiLogin();
