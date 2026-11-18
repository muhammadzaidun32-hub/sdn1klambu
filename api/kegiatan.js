// ============================================================
// API Kegiatan SDN 1 Klambu (Vercel Serverless Function)
// Penyimpanan: data/kegiatan.json di repo GitHub (Contents API)
// Autentikasi: header X-Admin-Password dibandingkan ADMIN_PASSWORD
// ============================================================
const REPO = process.env.GITHUB_REPO;            // "muhammadzaidun32-hub/sdn1klambu"
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const DATA_PATH = "data/kegiatan.json";
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

async function readData() {
  const res = await gh(`${DATA_PATH}?ref=${BRANCH}&t=${Date.now()}`);
  if (res.status === 404) return { items: [], sha: null };
  if (!res.ok) throw new Error(`GitHub read gagal (${res.status})`);
  const json = await res.json();
  const content = Buffer.from(json.content, "base64").toString("utf-8");
  return { items: JSON.parse(content).items || [], sha: json.sha };
}

async function writeData(items, sha) {
  const body = {
    message: `Update kegiatan via admin (${new Date().toISOString()})`,
    content: Buffer.from(JSON.stringify({ items }, null, 2)).toString("base64"),
    branch: BRANCH,
    ...(sha ? { sha } : {}),
  };
  const res = await gh(DATA_PATH, { method: "PUT", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`GitHub write gagal (${res.status})`);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Password");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    // ---- GET: daftar kegiatan (publik) ----
    if (req.method === "GET") {
      const { items } = await readData();
      return res.status(200).json({ items });
    }

    // ---- POST: aksi admin ----
    if (req.method === "POST") {
      const pwd = req.headers["x-admin-password"] || "";
      if (!ADMIN_PASSWORD || pwd !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Password admin salah" });
      }
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { action } = body;
      const { items, sha } = await readData();

      // Cek password saja (untuk tombol login)
      if (action === "check") {
        return res.status(200).json({ ok: true });
      }

      // Unggah gambar (base64) ke repo, kembalikan URL publiknya
      if (action === "upload") {
        const safe = (body.filename || "gambar.jpg").replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${UPLOAD_DIR}/${Date.now()}-${safe}`;
        const resUp = await gh(path, {
          method: "PUT",
          body: JSON.stringify({
            message: `Unggah gambar ${safe} via admin`,
            content: body.dataBase64,
            branch: BRANCH,
          }),
        });
        if (!resUp.ok) throw new Error(`Unggah gambar gagal (${resUp.status})`);
        const j = await resUp.json();
        return res.status(200).json({ url: j.content.download_url });
      }

      if (action === "add") {
        const item = { ...body.item, id: Date.now().toString(36) };
        items.unshift(item);
        await writeData(items, sha);
        return res.status(200).json({ item });
      }

      if (action === "update") {
        const idx = items.findIndex((i) => i.id === body.item.id);
        if (idx < 0) return res.status(404).json({ error: "Kegiatan tidak ditemukan" });
        items[idx] = body.item;
        await writeData(items, sha);
        return res.status(200).json({ item: body.item });
      }

      if (action === "delete") {
        const sisa = items.filter((i) => i.id !== body.id);
        await writeData(sisa, sha);
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: "Aksi tidak dikenal" });
    }

    return res.status(405).json({ error: "Method tidak diizinkan" });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Terjadi kesalahan" });
  }
}
