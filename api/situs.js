// ============================================================
// API Situs SDN 1 Klambu (Vercel Serverless Function)
// Penyimpanan: data/situs.json di repo GitHub
// Mengelola: logo, hero, foto kepsek, data guru (nama/jabatan/foto)
// Autentikasi: X-Admin-Password
// ============================================================
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const SITUS_PATH = "data/situs.json";
const UPLOAD_DIR = "assets/uploads";

function gh(path, opts = {}) {
  return fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
}

async function readSitus() {
  const res = await gh(`${SITUS_PATH}?ref=${BRANCH}&t=${Date.now()}`);
  if (res.status === 404) return { logo: null, hero: null, kepsek: null, guru: [] };
  if (!res.ok) throw new Error(`GitHub read gagal (${res.status})`);
  const json = await res.json();
  return JSON.parse(Buffer.from(json.content, "base64").toString("utf-8"));
}

async function writeSitus(situs, sha) {
  const body = {
    message: `Update gambar situs via admin (${new Date().toISOString()})`,
    content: Buffer.from(JSON.stringify(situs, null, 2)).toString("base64"),
    branch: BRANCH,
    ...(sha ? { sha } : {}),
  };
  const res = await gh(SITUS_PATH, { method: "PUT", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`GitHub write gagal (${res.status})`);
}

async function uploadImage(path, dataBase64) {
  const body = {
    message: `Unggah gambar ${path} via admin`,
    content: dataBase64,
    branch: BRANCH,
  };
  // perlu sha bila file sudah ada (update)
  const cek = await gh(path + `?ref=${BRANCH}`);
  if (cek.ok) {
    const j = await cek.json();
    body.sha = j.sha;
  }
  const res = await gh(path, { method: "PUT", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Unggah gambar gagal (${res.status})`);
  const j = await res.json();
  return j.content.download_url; // URL publik raw
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Password");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    // ---- GET: konfigurasi situs saat ini (publik) ----
    if (req.method === "GET") {
      const situs = await readSitus();
      return res.status(200).json(situs);
    }

    // ---- POST: aksi admin ----
    if (req.method === "POST") {
      const pwd = req.headers["x-admin-password"] || "";
      if (!ADMIN_PASSWORD || pwd !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Password admin salah" });
      }
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { action } = body;
      const situs = await readSitus();

      // ---- upload-slot: ganti logo / hero / foto kepsek ----
      if (action === "upload-slot") {
        const slot = body.slot; // "logo" | "hero" | "kepsek"
        if (!["logo", "hero", "kepsek"].includes(slot)) {
          return res.status(400).json({ error: "Slot tidak dikenal" });
        }
        const url = await uploadImage(`${UPLOAD_DIR}/situs-${slot}.jpg`, body.dataBase64);
        situs[slot] = url;
        // foto kepsek juga menyimpan nama jika disertakan
        if (slot === "kepsek" && body.nama) {
          situs.kepsek = { ...(situs.kepsek || {}), foto: url, nama: body.nama };
        }
        await writeSitus(situs);
        return res.status(200).json({ ok: true, url, situs });
      }

      // ---- set-guru: ubah nama/jabatan/foto guru per indeks ----
      if (action === "set-guru") {
        const idx = Number(body.index);
        if (!Array.isArray(situs.guru) || idx < 0 || idx >= situs.guru.length) {
          return res.status(404).json({ error: "Guru tidak ditemukan" });
        }
        const g = situs.guru[idx];
        if (typeof body.nama === "string") g.nama = body.nama;
        if (typeof body.jabatan === "string") g.jabatan = body.jabatan;
        if (body.fotoBase64) {
          const url = await uploadImage(`${UPLOAD_DIR}/guru-${idx}-${Date.now()}.jpg`, body.fotoBase64);
          g.foto = url;
        }
        await writeSitus(situs);
        return res.status(200).json({ ok: true, guru: g });
      }

      // ---- add-guru: tambah guru baru (nama, jabatan, foto opsional) ----
      if (action === "add-guru") {
        const guruBaru = { nama: body.nama || "Guru", jabatan: body.jabatan || "Guru", foto: "" };
        if (body.fotoBase64) {
          guruBaru.foto = await uploadImage(`${UPLOAD_DIR}/guru-${Date.now()}.jpg`, body.fotoBase64);
        }
        situs.guru = Array.isArray(situs.guru) ? situs.guru : [];
        situs.guru.push(guruBaru);
        await writeSitus(situs);
        return res.status(200).json({ ok: true, guru: guruBaru });
      }

      // ---- delete-guru ----
      if (action === "delete-guru") {
        const idx = Number(body.index);
        if (!Array.isArray(situs.guru) || idx < 0 || idx >= situs.guru.length) {
          return res.status(404).json({ error: "Guru tidak ditemukan" });
        }
        situs.guru.splice(idx, 1);
        await writeSitus(situs);
        return res.status(200).json({ ok: true });
      }


      // ---- reset-slot: kembalikan ke gambar bawaan ----
      if (action === "reset-slot") {
        const slot = body.slot;
        const def = { logo: null, hero: null, kepsek: null };
        situs[slot] = def[slot];
        await writeSitus(situs);
        return res.status(200).json({ ok: true, situs });
      }
      return res.status(400).json({ error: "Aksi tidak dikenal" });
    }

    return res.status(405).json({ error: "Method tidak diizinkan" });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Terjadi kesalahan" });
  }
}
