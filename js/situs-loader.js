/* ============================================================
   Situs Loader — SDN 1 Klambu
   - Menerapkan gambar dinamis dari /api/situs
   - Menerapkan pengaturan dari /api/pengaturan:
     tombol WA (nomor + ON/OFF), form PPDB ON/OFF, kontak
   ============================================================ */
(function () {
  async function get(url) {
    const res = await fetch(url + '?t=' + Date.now());
    if (!res.ok) throw new Error('gagal');
    return res.json();
  }

  function applySitus(s) {
    if (s.logo) {
      document.querySelectorAll('header.nav .brand img, .f-brand img').forEach(img => img.src = s.logo);
    }
    if (s.hero) {
      const slide1 = document.querySelector('.hero-slide');
      if (slide1) slide1.style.backgroundImage = `url('${s.hero}')`;
      const hero = document.querySelector('.hero-bg');
      if (hero) hero.style.backgroundImage = `url('${s.hero}')`;
    }
    if (s.kepsek) {
      document.querySelectorAll('img[src*="kepsek-asli"]').forEach(img => img.src = s.kepsek);
    }
    if (Array.isArray(s.guru)) {
      document.querySelectorAll('.grid-4 .card img').forEach((img, i) => {
        // hanya ganti bila URL foto guru benar-benar ada (tidak kosong)
        if (s.guru[i] && s.guru[i].foto) img.src = s.guru[i].foto;
      });
    }
  }

  function applyPengaturan(p) {
    // Tombol WhatsApp mengambang
    const wa = document.querySelector('.wa-float');
    if (wa) {
      if (p.waNomor) {
        wa.href = 'https://wa.me/' + p.waNomor.replace(/^0/, '62').replace(/[^0-9]/g, '');
        document.querySelectorAll('#waForm')?.forEach(f => f.dataset.wa = p.waNomor);
      }
      if (p.waTampil === false) wa.style.display = 'none';
    }

    // Kontak di topbar & footer
    const setTxt = (id, v) => { const el = document.getElementById(id); if (el && v) el.textContent = el.textContent.replace(/(Jl\..*|sdn1klambu@gmail\.com|\(\d+\)?[\s\d-]*)/, v); };
    if (p.alamat) setTxt('tb-alamat', '📍 ' + p.alamat);
    if (p.email) setTxt('tb-email', '✉ ' + p.email);
    if (p.telepon) setTxt('tb-telp', '☎ ' + p.telepon);

    // Form PPDB: sembunyikan bila ditutup
    if (p.ppdbTerbuka === false) {
      const form = document.getElementById('formPendaftaran');
      if (form) {
        form.innerHTML = `<h3>🔒 Pendaftaran Belum Dibuka</h3>
          <p style="color:var(--mute);font-size:.92rem;margin-top:.5rem">${p.ppdbInfo || 'Pendaftaran siswa baru saat ini belum dibuka. Silakan pantau halaman ini atau hubungi sekolah.'}</p>`;
      }
    }
  }

  async function init() {
    try { applySitus(await get('/api/situs')); } catch {}
    try { applyPengaturan(await get('/api/pengaturan')); } catch {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
