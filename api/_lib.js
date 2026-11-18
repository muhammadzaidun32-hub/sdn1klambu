// ============================================================
// Util bersama untuk API SDN 1 Klambu
// ============================================================
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function gh(path, opts = {}) {
  return fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN()}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
}
function GITHUB_TOKEN() {
  return process.env.GITHUB_TOKEN;
}

async function readJson(file, fallback) {
  const res = await gh(`${file}?ref=${GITHUB_BRANCH}&t=${Date.now()}`);
  if (res.status === 404) return fallback;
  if (!res.ok) throw new Error(`GitHub read gagal (${res.status})`);
  const json = await res.json();
  return { data: JSON.parse(Buffer.from(json.content, "base64").toString("utf-8")), sha: json.sha };
}

async function writeJson(file, obj) {
  // Coba sampai 2x (race saat commit bertumpuk)
  for (let attempt = 0; attempt < 2; attempt++) {
    // ambil sha terpotong
    const cur = await gh(`${file}?ref=${GITHUB_BRANCH}`).catch(() => null);
    let sha;
    if (cur && cur.ok) {
      try { const j = await cur.json(); sha = j.sha; } catch {}
    }
    const res = await gh(file, {
      method: "PUT",
      body: JSON.stringify({
        message: `Update ${file} via admin (${new Date().toISOString()})`,
        content: Buffer.from(JSON.stringify(obj, null, 2)).toString("base64"),
        branch: GITHUB_BRANCH,
        ...(sha ? { sha } : {}),
      }),
    }).catch(() => null);
    if (res && res.ok) return true;
    // tunggu sedikit, coba lagi
    await new Promise(r => setTimeout(r, 700));
  }
  throw new Error("GitHub write gagal (mencoba beberapa kali)");
}

function ok(res, data) { return res.status(200).json(data); }
function bad(res, code, msg) { return res.status(code).json({ error: msg }); }
function checkAuth(req) { return !!(req.headers["x-admin-password"] && req.headers["x-admin-password"] === ADMIN_PASSWORD); }

function readBody(req) { return req.body || {}; }

export { gh, readJson, writeJson, ok, bad, checkAuth, readBody };
