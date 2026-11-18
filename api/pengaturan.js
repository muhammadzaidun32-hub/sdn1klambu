// ============================================================
// API Pengaturan Situs: ON/OFF PPDB, nomor WA, teks kontak, dsb.
// ============================================================
const { readJson, writeJson, ok, bad, checkAuth, readBody } = require('./_lib.js');
const FILE = 'data/pengaturan.json';

const DEFAULTS = {
  waNomor: "6281234567890",
  waTampil: true,
  ppdbTerbuka: true,
  ppdbTahun: "2026/2027",
  ppdbInfo: "Pendaftaran siswa baru dibuka Juni–Juli. Hubungi sekolah untuk info lengkap.",
  email: "sdn1klambu@gmail.com",
  telepon: "(0292) 123-456",
  alamat: "Jl. Raya Klambu, Desa Klambu, Kec. Klambu, Kab. Grobogan, Jawa Tengah 58155",
};

async function bacaPengaturan() {
  const r = await readJson(FILE, {});
  return { ...DEFAULTS, ...(r.data || {}) };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Password");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    const p = await bacaPengaturan();
    return ok(res, p);
  }

  if (req.method === "POST") {
    if (!checkAuth(req)) return bad(res, 401, "Password admin salah");
    const body = readBody(req);
    const cur = await bacaPengaturan();
    const updated = { ...cur, ...body };   // merge field yang dikirim
    await writeJson(FILE, updated);
    return ok(res, { ok: true, pengaturan: updated });
  }

  return bad(res, 405, "Method tidak diizinkan");
}
