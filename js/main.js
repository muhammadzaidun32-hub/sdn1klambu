/* ============================================================
   SDN 1 KLAMBU — Global JS
   Navigasi mobile, header shadow, reveal on scroll,
   lightbox galeri, back-to-top, counter animasi, form WhatsApp
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ----- Navbar mobile ----- */
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('nav.menu');
  const backdrop = document.querySelector('.menu-backdrop');
  if (burger && menu) {
    const sync = () => {
      const open = menu.classList.contains('open');
      burger.classList.toggle('on', open);
      menu.classList.toggle('open', open);
      if (backdrop) backdrop.classList.toggle('show', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', sync);
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      menu.classList.remove('open');
      burger.classList.remove('on');
      if (backdrop) backdrop.classList.remove('show');
      document.body.style.overflow = '';
    }));
  }

  /* ----- Header shadow saat scroll ----- */
  const nav = document.querySelector('header.nav');
  const toTop = document.getElementById('toTop');
  const onScroll = () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 10);
    if (toTop) toTop.classList.toggle('show', window.scrollY > 500);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ----- Reveal on scroll ----- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ----- Counter animasi ----- */
  const counters = document.querySelectorAll('[data-count]');
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.count;
      const dur = 1600; const t0 = performance.now();
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3))).toLocaleString('id-ID');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      cio.unobserve(el);
    });
  }, { threshold: 0.4 });
  counters.forEach(c => cio.observe(c));

  /* ----- Lightbox galeri ----- */
  const lb = document.getElementById('lightbox');
  if (lb) {
    const lbImg = lb.querySelector('img');
    document.querySelectorAll('.galeri-item').forEach(item => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        lbImg.src = img.src;
        lbImg.alt = img.alt || '';
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });
    const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* ----- Form kontak / PPDB -> WhatsApp ----- */
  const waForm = document.getElementById('waForm');
  if (waForm) {
    waForm.addEventListener('submit', e => {
      e.preventDefault();
      const nama = waForm.querySelector('[name="nama"]').value.trim();
      const pesan = waForm.querySelector('[name="pesan"]').value.trim();
      const no = waForm.dataset.wa; // nomor tujuan
      const text = encodeURIComponent(`Assalamualaikum, saya ${nama || 'wali murid'}.\n\n${pesan || 'Saya ingin bertanya tentang sekolah.'}`);
      window.open(`https://wa.me/${no}?text=${text}`, '_blank');
    });
  }

  /* ----- Tahun footer otomatis ----- */
  const yr = document.getElementById('tahun');
  if (yr) yr.textContent = new Date().getFullYear();
});
