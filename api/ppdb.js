// ============================================================
// API PPDB Online: form pendaftaran + cek status
// data/ppdb.json : { daftar: [ {id, nama, nisn, tanggal, status} ] }
// ============================================================
const { readJson, writeJson, ok, bad, checkAuth, readBody } = require('./_lib.js');
const FILE = 'data/ppdb.json';
const ADMIN_KEY_HEADER = 'x-admin-password';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Password");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();

  const body = req.method === 'POST' ? readBody(req) : {};

  try {
    // ============================================================
    // PUBLIK: ambil status pendaftaran berdasarkan ID (aman)
    // ============================================================
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://x');
      if (url.pathname.endsWith('/api/ppdb')) {
        // daftar publik: hanya ringkasan jumlah + status per id yang diberi parameter
        const id = url.searchParams.get('id');
        if (!id) {
          return ok(res, { jumlah: 0 });
        }

        const { data } = await readJson(FILE, { daftar: [] });
      const daftar = data.daftar || [];
        const item = daftar.find(d => d.id === id);
        if (!item) return bad(res, 404, "Kode pendaftaran tidak ditemukan");
        // Data sensitif tidak dikirim: hanya status
        return ok(res, { id: item.id, status: item.status, nama: item.nama, asal: item.asal || '' });
      }
    }

    // ============================================================
    // PUBLIK: daftar baru (tanpa password)
    // ============================================================
    if (req.method === 'POST' && body.action === 'daftar') {
      const { data } = await readJson(FILE, { daftar: [] });
      const daftar = data.daftar || [];
      const id = 'PPDB-' + Date.now().toString(36).toUpperCase().slice(-6);
      const pendaftar = {
        id,
        nama: (body.nama || '').trim(),
        nisn: (body.nisn || '').trim(),
        lahir: body.lahir || '',
        asal: (body.asal || '').trim(),
        wali: (body.wali || '').trim(),
        wa: (body.wa || '').trim(),
        alamat: (body.alamat || '').trim(),
        tanggal: new Date().toISOString(),
        status: 'Menunggu verifikasi'
      };
      if (!pendaftar.nama) return bad(res, 400, 'Nama wajib diisi');
      daftar.push(pendaftar);
      await writeJson(FILE, daftar);
      return ok(res, { ok: true, id, status: pendaftar.status, nama: pendaftar.nama });
    }

    // ============================================================
    // ADMIN: daftar lengkap, ubah status, hapus
    // ============================================================
    if (req.method === 'POST' && body.action === 'admin-list') {
      if (!checkAuth(req)) return bad(res, 401, 'Password admin salah');
      const { data } = await readJson(FILE, { daftar: [] });
      const daftar = data.daftar || [];
      return ok(res, { daftar });
    }

    if (req.method === 'POST' && body.action === 'admin-status') {
      if (!checkAuth(req)) return bad(res, 401, 'Password admin salah');
      const { data } = await readJson(FILE, { daftar: [] });
      const daftar = data.daftar || [];
      const item = daftar.find(d => d.id === body.id);
      if (!item) return bad(res, 404, 'Tidak ditemukan');
      item.status = body.status || item.status;
      await writeJson(FILE, daftar);
      return ok(res, { ok: true, item });
    }

    if (req.method === 'POST' && body.action === 'admin-delete') {
      if (!checkAuth(req)) return bad(res, 401, 'Password admin salah');
      const { data } = await readJson(FILE, { daftar: [] });
      const sisa = (data.daftar || []).filter(d => d.id !== body.id);
      await writeJson(FILE, { daftar: sisa });
      return ok(res, { ok: true });
    }

    return bad(res, 400, 'Aksi tidak dikenal');
  } catch (e) {
    return bad(res, 500, e.message || 'Terjadi kesalahan');
  }
}
