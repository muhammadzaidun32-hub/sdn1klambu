/* ============================================================
   Situs Loader — SDN 1 Klambu
   Mengambil konfigurasi gambar dari /api/situs dan menerapkannya
   ke halaman publik (logo navbar, hero, foto kepsek).
   ============================================================ */
(function () {
  const API = '/api/situs';

  function applySitus(s) {
    // 1) Logo navbar + footer
    if (s.logo) {
      document.querySelectorAll('header.nav .brand img, .f-brand img').forEach(img => {
        img.src = s.logo;
      });
    }
    // 2) Hero beranda (CSS background)
    if (s.hero) {
      const hero = document.querySelector('.hero-bg');
      if (hero) hero.style.backgroundImage = `url('${s.hero}')`;
    }
    // 3) Foto kepala sekolah (beranda + profil)
    if (s.kepsek) {
      document.querySelectorAll('img[src*="kepsek-asli"]').forEach(img => {
        img.src = s.kepsek;
      });
    }
    // 4) Foto guru kartu di profil (bila URL disediakan per urutan)
    if (Array.isArray(s.guru)) {
      const cards = document.querySelectorAll('.grid-4 .card img');
      cards.forEach((img, i) => {
        if (s.guru[i]) img.src = s.guru[i];
      });
    }
  }

  async function init() {
    try {
      const res = await fetch(API + '?t=' + Date.now());
      if (!res.ok) return;
      const situs = await res.json();
      // api/situs mengembalikan { logo, hero, kepsek, guru }
      applySitus(situs);
    } catch (e) {
      /* diam: pakai gambar bawaan */
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
