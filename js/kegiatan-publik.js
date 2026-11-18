/* ============================================================
   Kegiatan publik — diambil dari /api/kegiatan (GitHub storage)
   Ditampilkan di beranda & halaman berita secara otomatis.
   ============================================================ */
(async function(){
  const fmt = t => new Date(t).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});

  async function load(){
    try{
      const res = await fetch('/api/kegiatan?t=' + Date.now());
      if(!res.ok) return null;
      return (await res.json()).items || [];
    }catch{ return null; }
  }

  /* ----- Beranda: 3 kartu terbaru menggantikan statis ----- */
  const homeGrid = document.querySelector('#kegiatan-grid');
  if(homeGrid){
    const items = (await load()) || [];
    if(items.length){
      homeGrid.innerHTML = items.slice(0,3).map(it=>`
        <article class="card news-card reveal visible">
          <img src="${it.gambar || 'assets/img/berita1.svg'}" alt="${it.judul}" style="object-fit:cover">
          <div class="card-body">
            <div class="meta"><span>📅 ${fmt(it.tanggal)}</span><span>🏷 ${it.kategori||'Kegiatan'}</span></div>
            <h3>${it.judul}</h3>
            <p>${(it.isi||'').slice(0,110)}${(it.isi||'').length>110?'…':''}</p>
          </div>
        </article>`).join('');
    }
  }

  /* ----- Halaman berita: sisipkan kegiatan admin di atas berita statis ----- */
  const newsPage = document.querySelector('#daftar-kegiatan');
  if(newsPage){
    const items = (await load()) || [];
    if(items.length){
      const html = items.map(it=>`
        <article class="card news-card reveal visible">
          <img src="${it.gambar || 'assets/img/berita1.svg'}" alt="${it.judul}" style="object-fit:cover">
          <div class="card-body">
            <div class="meta"><span>📅 ${fmt(it.tanggal)}</span><span>🏷 ${it.kategori||'Kegiatan'}</span></div>
            <h3>${it.judul}</h3>
            <p>${(it.isi||'').slice(0,140)}${(it.isi||'').length>140?'…':''}</p>
          </div>
        </article>`).join('');
      newsPage.insertAdjacentHTML('afterbegin', html);
    }
  }
})();
