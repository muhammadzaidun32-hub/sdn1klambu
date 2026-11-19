/* ============================================================
   SDN 1 KLAMBU — Global JS
   Navigasi mobile, header shadow, reveal on scroll,
   lightbox galeri, back-to-top, counter animasi, form WhatsApp
   Pola init: idempotent — jalan kapan pun script dimuat.
   ============================================================ */
function initSdnMain() {

  /* ----- Navbar mobile ----- */
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('nav.menu');
  const backdrop = document.querySelector('.menu-backdrop');
  if (burger && menu && !burger.dataset.inited) {
    burger.dataset.inited = '1';
    const setMenu = (open) => {
      menu.classList.toggle('open', open);
      burger.classList.toggle('on', open);
      if (backdrop) backdrop.classList.toggle('show', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      a.classList.add('clicked');
      setTimeout(() => a.classList.remove('clicked'), 320);
      setMenu(false);
    }));
    if (backdrop) backdrop.addEventListener('click', () => setMenu(false));
  }


  /* ----- Hero slider (5 gambar, autoplay + panah + dots) ----- */
  const slides = document.querySelectorAll('.hero-slide');
  const track = document.querySelector('.hero-slider');
  const dotsWrap = document.getElementById('hsDots');
  if (slides.length && dotsWrap && track) {
    let cur = 0, timer;
    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'hs-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Ke slide ' + (i + 1));
      d.addEventListener('click', () => { go(i); restart(); });
      dotsWrap.appendChild(d);
    });
    const dots = dotsWrap.querySelectorAll('.hs-dot');
    function go(n) {
      cur = (n + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + cur * 100 + '%)';
      dots.forEach((d, i) => d.classList.toggle('active', i === cur));
    }
    function restart() { clearInterval(timer); timer = setInterval(() => go(cur + 1), 5000); }
    const prev = document.getElementById('hsPrev');
    const next = document.getElementById('hsNext');
    if (prev) prev.addEventListener('click', () => { go(cur - 1); restart(); });
    if (next) next.addEventListener('click', () => { go(cur + 1); restart(); });
    restart();
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
    // delegasi: bekerja untuk galeri statis maupun yang dimuat dari admin
    document.addEventListener('click', e => {
      const item = e.target.closest('.galeri-item');
      if (!item) return;
      const img = item.querySelector('img');
      if (!img) return;
      lbImg.src = img.src;
      lbImg.alt = img.alt || '';
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
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
}

/* Jalankan sekarang bila DOM sudah siap; kalau belum, tunggu event-nya */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSdnMain);
} else {
  initSdnMain();
}
