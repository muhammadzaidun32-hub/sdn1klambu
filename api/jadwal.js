// ============================================================
// API Jadwal Pelajaran (kelas 1-6) & Kalender Akademik
// data/jadwal.json : { kelas: [ {hari, jam, mapel, guru} ] }
// ============================================================
const { readJson, writeJson, ok, bad, checkAuth, readBody } = require('./_lib.js');
const FILE = 'data/jadwal.json';

const DEFAULT = {
  kelas: {
    "1": [
      { hari: "Senin", jam: "07.00-08.30", mapel: "Matematika", guru: "" },
      { hari: "Senin", jam: "08.30-10.00", mapel: "Bahasa Indonesia", guru: "" }
    ],
    "2": [{ hari: "Senin", jam: "07.00-08.30", mapel: "Matematika", guru: "" }],
    "3": [{ hari: "Senin", jam: "07.00-08.30", mapel: "Matematika", guru: "" }],
    "4": [{ hari: "Senin", jam: "07.00-08.30", mapel: "Matematika", guru: "" }],
    "5": [{ hari: "Senin", jam: "07.00-08.30", mapel: "Matematika", guru: "" }],
    "6": [{ hari: "Senin", jam: "07.00-08.30", mapel: "Matematika", guru: "" }]
  },
  kalender: [
    { tanggal: "2026-07-13", kegiatan: "Hari pertama masuk sekolah TA 2026/2027" },
    { tanggal: "2026-08-17", kegiatan: "Upacara HUT RI ke-81" }
  ]
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Password");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    const r = await readJson(FILE, DEFAULT);
    return ok(res, r.data || DEFAULT);
  }

  if (req.method === "POST") {
    if (!checkAuth(req)) return bad(res, 401, "Password admin salah");
    const body = readBody(req);
    const r = await readJson(FILE, DEFAULT);
    const jadwal = { ...DEFAULT, ...(r.data || {}) };

    // ---- simpan jadwal kelas tertentu ----
    if (body.action === 'simpan-kelas') {
      if (!body.kelas || !Array.isArray(body.baris)) return bad(res, 400, "Data tidak lengkap");
      jadwal.kelas[body.kelas] = body.baris.map(b => ({
        hari: b.hari || "Senin",
        jam: b.jam || "07.00-08.30",
        mapel: b.mapel || "-",
        guru: b.guru || ""
      }));
      await writeJson(FILE, jadwal);
      return ok(res, { ok: true, jadwal });
    }

    // ---- kalender: tambah ----
    if (body.action === 'tambah-kalender') {
      jadwal.kalender = Array.isArray(jadwal.kalender) ? jadwal.kalender : [];
      jadwal.kalender.push({ tanggal: body.tanggal || '', kegiatan: body.kegiatan || '-' });
      jadwal.kalender.sort((a, b) => (a.tanggal > b.tanggal ? 1 : -1));
      await writeJson(FILE, jadwal);
      return ok(res, { ok: true, jadwal });
    }

    // ---- kalender: hapus per index ----
    if (body.action === 'hapus-kalender') {
      const idx = Number(body.index);
      if (!Array.isArray(jadwal.kalender) || idx < 0 || idx >= jadwal.kalender.length)
        return bad(res, 404, "Item kalender tidak ditemukan");
      jadwal.kalender.splice(idx, 1);
      await writeJson(FILE, jadwal);
      return ok(res, { ok: true, jadwal });
    }

    return bad(res, 400, "Aksi tidak dikenal");
  }

  return bad(res, 405, "Method tidak diizinkan");
}
