/* ============================================================
   WARKOP KANG ASEP — script.js
   ============================================================ */

/* ===== NAVBAR HAMBURGER ===== */
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");

hamburger.addEventListener("click", () => {
  mobileMenu.classList.toggle("open");
});

hamburger.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    mobileMenu.classList.toggle("open");
  }
});

// Tutup mobile menu ketika link diklik
mobileMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => mobileMenu.classList.remove("open"));
});

// Tutup menu ketika klik di luar navbar
document.addEventListener("click", (e) => {
  const navbar = document.getElementById("navbar");
  if (!navbar.contains(e.target)) {
    mobileMenu.classList.remove("open");
  }
});

/* ===== NAVBAR SCROLL EFFECT ===== */
const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
  if (window.scrollY > 60) {
    navbar.style.background = "rgba(28,15,7,0.97)";
    navbar.style.backdropFilter = "blur(8px)";
  } else {
    navbar.style.background = "var(--kopi)";
    navbar.style.backdropFilter = "none";
  }
});

/* ===== FILTER MENU ===== */
const filterBtns = document.querySelectorAll(".filter-btn");
const menuCards = document.querySelectorAll(".menu-card");

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Update active state
    filterBtns.forEach((b) => b.classList.remove("aktif"));
    btn.classList.add("aktif");

    const filter = btn.dataset.filter;

    menuCards.forEach((card) => {
      if (filter === "semua" || card.dataset.kategori === filter) {
        card.classList.remove("tersembunyi");
        // Re-trigger reveal animation
        card.classList.remove("visible");
        requestAnimationFrame(() => {
          setTimeout(() => card.classList.add("visible"), 50);
        });
      } else {
        card.classList.add("tersembunyi");
      }
    });
  });
});

/* ===== SCROLL REVEAL ===== */
const revealEls = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger effect untuk elemen yang muncul bersamaan
        setTimeout(
          () => {
            entry.target.classList.add("visible");
          },
          (i % 4) * 80,
        );

        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.1,
    rootMargin: "0px 0px -40px 0px",
  },
);

revealEls.forEach((el) => observer.observe(el));

/* ============================================================
   KERANJANG BELANJA
   ============================================================ */

// State keranjang disimpan in-memory (array of {nama, harga, qty})
let keranjang = [];

// Elemen DOM
const cartToggle = document.getElementById("cartToggle");
const cartPanel = document.getElementById("cartPanel");
const cartOverlay = document.getElementById("cartOverlay");
const cartClose = document.getElementById("cartClose");
const cartBadge = document.getElementById("cartBadge");
const cartItemsEl = document.getElementById("cartItems");
const cartKosongEl = document.getElementById("cartKosong");
const cartFooterEl = document.getElementById("cartFooter");
const cartTotalEl = document.getElementById("cartTotal");
const btnCheckout = document.getElementById("btnCheckout");
const btnKosongkan = document.getElementById("btnKosongkan");

const formatRupiah = (angka) => "Rp " + angka.toLocaleString("id-ID");

/* ---------- Buka / Tutup Panel ---------- */
function bukaKeranjang() {
  cartPanel.classList.add("terbuka");
  cartOverlay.classList.add("tampil");
  document.body.style.overflow = "hidden";
}

function tutupKeranjang() {
  cartPanel.classList.remove("terbuka");
  cartOverlay.classList.remove("tampil");
  document.body.style.overflow = "";
}

cartToggle.addEventListener("click", bukaKeranjang);
cartClose.addEventListener("click", tutupKeranjang);
cartOverlay.addEventListener("click", tutupKeranjang);

// Tutup dengan tombol Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && cartPanel.classList.contains("terbuka")) {
    tutupKeranjang();
  }
});

/* ---------- Tambah Item ke Keranjang ---------- */
function tambahKeranjang(nama, harga) {
  const itemAda = keranjang.find((item) => item.nama === nama);

  if (itemAda) {
    itemAda.qty += 1;
  } else {
    keranjang.push({ nama, harga, qty: 1 });
  }

  renderKeranjang();
  bumpBadge();

  // Notifikasi singkat lewat toast yang sudah ada
  const toast = document.getElementById("toast");
  toast.textContent = `✓ ${nama} ditambahkan ke keranjang!`;
  toast.classList.add("tampil");
  setTimeout(() => toast.classList.remove("tampil"), 2200);
}

/* ---------- Ubah Jumlah Item ---------- */
function ubahQty(nama, delta) {
  const item = keranjang.find((i) => i.nama === nama);
  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    hapusItem(nama);
    return;
  }

  renderKeranjang();
}

/* ---------- Hapus Item ---------- */
function hapusItem(nama) {
  const elId = `cart-item-${slug(nama)}`;
  const el = document.getElementById(elId);

  if (el) {
    el.classList.add("item-keluar");
    setTimeout(() => {
      keranjang = keranjang.filter((i) => i.nama !== nama);
      renderKeranjang();
    }, 220);
  } else {
    keranjang = keranjang.filter((i) => i.nama !== nama);
    renderKeranjang();
  }
}

/* ---------- Kosongkan Keranjang ---------- */
btnKosongkan.addEventListener("click", () => {
  if (keranjang.length === 0) return;
  if (confirm("Yakin ingin mengosongkan keranjang?")) {
    keranjang = [];
    renderKeranjang();
  }
});

/* ---------- Slug helper untuk id elemen ---------- */
function slug(teks) {
  return teks.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/* ---------- Render Ulang Tampilan Keranjang ---------- */
function renderKeranjang() {
  // Hitung total qty & total harga
  const totalQty = keranjang.reduce((sum, i) => sum + i.qty, 0);
  const totalHarga = keranjang.reduce((sum, i) => sum + i.qty * i.harga, 0);

  // Update badge
  cartBadge.textContent = totalQty;

  // Tampilkan / sembunyikan state kosong
  if (keranjang.length === 0) {
    cartKosongEl.style.display = "flex";
    cartItemsEl.innerHTML = "";
    cartFooterEl.classList.add("tersembunyi");
    cartTotalEl.textContent = formatRupiah(0);
    return;
  }

  cartKosongEl.style.display = "none";
  cartFooterEl.classList.remove("tersembunyi");

  // Render setiap item
  cartItemsEl.innerHTML = keranjang
    .map(
      (item) => `
    <div class="cart-item" id="cart-item-${slug(item.nama)}">
      <div class="cart-item-info">
        <p class="cart-item-nama">${item.nama}</p>
        <p class="cart-item-harga">${formatRupiah(item.harga)} / item</p>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="ubahQty('${item.nama.replace(/'/g, "\\'")}', -1)" aria-label="Kurangi">−</button>
        <span class="qty-angka">${item.qty}</span>
        <button class="qty-btn" onclick="ubahQty('${item.nama.replace(/'/g, "\\'")}', 1)" aria-label="Tambah">+</button>
      </div>
      <button class="cart-item-hapus" onclick="hapusItem('${item.nama.replace(/'/g, "\\'")}')" aria-label="Hapus item">🗑️</button>
    </div>
  `,
    )
    .join("");

  cartTotalEl.textContent = formatRupiah(totalHarga);
}

/* ---------- Animasi Badge saat item bertambah ---------- */
function bumpBadge() {
  cartBadge.classList.remove("bump");
  void cartBadge.offsetWidth; // restart animasi
  cartBadge.classList.add("bump");
}

/* ---------- Checkout via WhatsApp ---------- */
btnCheckout.addEventListener("click", () => {
  if (keranjang.length === 0) return;

  const totalHarga = keranjang.reduce((sum, i) => sum + i.qty * i.harga, 0);

  let pesanText = "Halo Warkop Kang Asep, saya mau pesan:%0A%0A";

  keranjang.forEach((item, i) => {
    const subtotal = item.qty * item.harga;
    pesanText += `${i + 1}. ${item.nama} x${item.qty} - ${formatRupiah(subtotal)}%0A`;
  });

  pesanText += `%0A*Total: ${formatRupiah(totalHarga)}*%0A%0ATerima kasih!`;

  const nomorWa = "6281234567890";
  window.open(`https://wa.me/${nomorWa}?text=${pesanText}`, "_blank");
});

// Inisialisasi tampilan keranjang saat halaman dimuat
renderKeranjang();

/* ============================================================
   HIGHLIGHT HARI INI (JAM BUKA)
   ============================================================ */
const hariList = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
const hariIni = hariList[new Date().getDay()];
const jamItems = document.querySelectorAll(".jam-tabel li");

jamItems.forEach((item) => {
  const hariEl = item.querySelector(".hari");
  if (hariEl && hariEl.textContent.trim() === hariIni) {
    item.classList.add("hari-ini");

    const jamEl = item.querySelector(".jam");
    if (jamEl) {
      jamEl.style.color = "#C8841A";

      const label = document.createElement("span");
      label.textContent = "← Hari ini";
      label.style.cssText =
        "font-size:0.72rem; color:var(--amber); font-weight:700;" +
        "margin-left:0.5rem; letter-spacing:1px;";
      jamEl.appendChild(label);
    }
  }
});
