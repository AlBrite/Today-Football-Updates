import { useState, useCallback } from "react";
import {
  LEAGUE_IDS,
  fetchLeagueFixtures,
  fetchLiveFixtures,
  fetchStandings,
  fetchTopScorers,
  fetchTransfers,
  fetchUnsplashImage,
  generatePost,
} from "./api.js";
import { logout } from "./LoginGate.jsx";

/* ── Config ──────────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { id: "live",             label: "🟢 Live Now",       group: "live" },
  { id: "transfers",        label: "🔄 Transfers",       group: "transfers" },
  { id: "premier_league",   label: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League", group: "league", leagueId: LEAGUE_IDS.premier_league },
  { id: "la_liga",          label: "🇪🇸 La Liga",        group: "league", leagueId: LEAGUE_IDS.la_liga },
  { id: "serie_a",          label: "🇮🇹 Serie A",        group: "league", leagueId: LEAGUE_IDS.serie_a },
  { id: "bundesliga",       label: "🇩🇪 Bundesliga",     group: "league", leagueId: LEAGUE_IDS.bundesliga },
  { id: "ligue_1",          label: "🇫🇷 Ligue 1",        group: "league", leagueId: LEAGUE_IDS.ligue_1 },
  { id: "champions_league", label: "⭐ UCL",             group: "league", leagueId: LEAGUE_IDS.champions_league },
  { id: "europa_league",    label: "🟠 Europa",          group: "league", leagueId: LEAGUE_IDS.europa_league },
  { id: "conference_league",label: "🟢 Conference",      group: "league", leagueId: LEAGUE_IDS.conference_league },
  { id: "euro",             label: "🏆 EURO",            group: "league", leagueId: LEAGUE_IDS.euro },
  { id: "afcon",            label: "🌍 AFCON",           group: "league", leagueId: LEAGUE_IDS.afcon },
  { id: "world_cup",        label: "🌐 World Cup",       group: "league", leagueId: LEAGUE_IDS.world_cup },
];

const DATA_TYPES = [
  { id: "fixtures",   label: "📅 Fixtures / Results" },
  { id: "standings",  label: "📊 Standings" },
  { id: "scorers",    label: "🥅 Top Scorers" },
];

const TONES = ["Exciting", "Neutral", "Fan-friendly", "Analytical"];

/* ── Settings Modal ──────────────────────────────────────────────────────── */

function SettingsModal({ settings, onSave, onClose }) {
  const [s, setS] = useState(settings);
  const set = (k, v) => setS(p => ({ ...p, [k]: v }));
  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <span style={{ fontSize: 20 }}>⚙️</span>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#60a5fa", flex: 1 }}>API Settings</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {[
          { key: "afKey",       label: "API-FOOTBALL KEY",    hint: "Get free at api-sports.io (100 req/day)",          link: "https://www.api-football.com", pw: true },
          { key: "unsplashKey", label: "UNSPLASH ACCESS KEY", hint: "Free at unsplash.com/developers (50 req/hr)",       link: "https://unsplash.com/developers", pw: true },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={S.label}>{f.label}</label>
            <input
              type={f.pw ? "password" : "text"}
              value={s[f.key] || ""}
              onChange={e => set(f.key, e.target.value)}
              style={S.input}
              placeholder={f.label}
            />
            <p style={S.hint}>
              {f.hint}{f.link && <> — <a href={f.link} target="_blank" rel="noreferrer" style={{ color: "#3b82f6" }}>open site</a></>}
            </p>
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={() => onSave(s)} style={S.btnPrimary}>Save</button>
          <button onClick={onClose} style={S.btnGhost}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ── Post Card ───────────────────────────────────────────────────────────── */

function PostCard({ article, image, index }) {
  const [text, setText] = useState(article.post);
  const [editing, setEditing] = useState(false);
  const [showImg, setShowImg] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div style={S.card}>
      {image && showImg && (
        <div style={{ position: "relative", height: 170, overflow: "hidden", borderRadius: "12px 12px 0 0" }}>
          <img src={image.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(6,8,15,.75) 0%, transparent 55%)" }} />
          <a href={image.authorUrl} target="_blank" rel="noreferrer"
            style={{ position: "absolute", bottom: 8, left: 12, fontSize: 10, color: "rgba(255,255,255,.55)", textDecoration: "none" }}>
            📷 {image.author} / Unsplash
          </a>
        </div>
      )}

      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontSize: 10, color: "#4b5563", fontWeight: 700, letterSpacing: "1px", marginBottom: 5 }}>
          {article.source}
        </div>
        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 18, color: "#e2e8f0", lineHeight: 1.2, marginBottom: 10 }}>
          {article.headline}
        </h3>

        {editing ? (
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={4}
            style={S.textarea}
          />
        ) : (
          <div style={S.postText}>{text}</div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setEditing(e => !e)} style={S.btnSmall}>{editing ? "✓ Done" : "✏️ Edit"}</button>
          {image && <button onClick={() => setShowImg(v => !v)} style={S.btnSmall}>{showImg ? "🚫 No Image" : "🖼️ Show Image"}</button>}
          <button onClick={handleCopy} style={{ ...S.btnSmall, marginLeft: "auto", borderColor: copied ? "#14532d" : "#374151", color: copied ? "#6ee7b7" : "#9ca3af" }}>
            {copied ? "✅ Copied" : "📋 Copy Text"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── App ─────────────────────────────────────────────────────────────────── */

const DEFAULT_SETTINGS = { afKey: "", unsplashKey: "" };

export default function App() {
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fp2_settings") || "{}") || DEFAULT_SETTINGS; }
    catch { return DEFAULT_SETTINGS; }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [category, setCategory] = useState("premier_league");
  const [dataType, setDataType] = useState("fixtures");
  const [tone, setTone] = useState("Exciting");
  const [articles, setArticles] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiUsage, setApiUsage] = useState(null);

  const saveSettings = s => {
    setSettings(s);
    localStorage.setItem("fp2_settings", JSON.stringify(s));
    setShowSettings(false);
  };

  const cat = CATEGORIES.find(c => c.id === category);
  const afReady = !!settings.afKey;

  const fetchData = useCallback(async () => {
    if (!settings.afKey) { setShowSettings(true); return; }
    setLoading(true);
    setError("");
    setArticles([]);
    setImages([]);

    try {
      let rawItems = [];
      let dtype = dataType;

      if (category === "live") {
        rawItems = await fetchLiveFixtures(settings.afKey);
        dtype = "fixture";
      } else if (category === "transfers") {
        rawItems = await fetchTransfers(settings.afKey);
        dtype = "transfer";
      } else {
        const leagueId = cat?.leagueId;
        if (!leagueId) throw new Error("Unknown league");
        if (dataType === "fixtures") {
          rawItems = await fetchLeagueFixtures(leagueId, settings.afKey);
          dtype = "fixture";
        } else if (dataType === "standings") {
          const rows = await fetchStandings(leagueId, settings.afKey);
          // standings = one post with top 5
          rawItems = rows.length > 0 ? [rows] : [];
          dtype = "standing";
        } else if (dataType === "scorers") {
          rawItems = await fetchTopScorers(leagueId, settings.afKey);
          dtype = "scorer";
        }
      }

      if (!rawItems || rawItems.length === 0) {
        setError("No data found for this selection. Try another category or data type.");
        return;
      }

      // Build up to 4 posts
      const items = rawItems.slice(0, 4);
      const posts = items.map(item => generatePost(dtype, item, tone, cat?.label?.replace(/^.{1,3}\s/, "") || "Football"));

      // Fetch unsplash images in parallel
      const imgs = await Promise.all(
        posts.map(p => fetchUnsplashImage(p.imageKeyword, settings.unsplashKey))
      );

      setArticles(posts);
      setImages(imgs);
      setApiUsage(prev => ({ calls: (prev?.calls || 0) + 1, remaining: "~" + (100 - ((prev?.calls || 0) + 1)) + "/day" }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [category, dataType, tone, settings, cat]);

  const handleExportJson = () => {
    const payload = articles.map((a, i) => ({
      headline: a.headline,
      post: a.post,
      source: a.source,
      image_url: images[i]?.url || null,
      image_credit: images[i]?.author || null,
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${category}-${dataType}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showDataTypes = category !== "live" && category !== "transfers";

  return (
    <div style={{ minHeight: "100vh", background: "#06080f" }}>
      {showSettings && <SettingsModal settings={settings} onSave={saveSettings} onClose={() => setShowSettings(false)} />}

      {/* Header */}
      <header style={{ background: "#0f172a", borderBottom: "1px solid #1e3a5f", padding: "0 20px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>⚽</span>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20, color: "#fff", letterSpacing: "0.5px" }}>FootballPost</div>
              <div style={{ fontSize: 8, color: "#3b82f6", letterSpacing: "2px", fontWeight: 700 }}>100% FREE · API-FOOTBALL + UNSPLASH</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {apiUsage && <span style={{ fontSize: 11, color: "#4b5563" }}>API: {apiUsage.remaining}</span>}
            <button
              onClick={() => setShowSettings(true)}
              style={{ ...S.btnSmall, borderColor: afReady ? "#14532d" : "#7f1d1d", color: afReady ? "#6ee7b7" : "#fca5a5" }}
            >
              {afReady ? "✅ API Connected" : "⚙️ Connect APIs"}
            </button>
            <button onClick={logout} style={S.btnSmall} title="Log out">🔒 Log out</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "20px 16px 60px" }}>
        {/* Free badge */}
        <div style={{ background: "#042f1b", border: "1px solid #14532d", borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#6ee7b7" }}>
          <span style={{ fontSize: 18 }}>🆓</span>
          <span><strong>100% Free</strong> — API-Football (100 req/day) + Unsplash (50 req/hr). No paid AI API needed.</span>
        </div>

        {/* Controls */}
        <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
          {/* Categories */}
          <div style={{ marginBottom: 14 }}>
            <div style={S.label}>CATEGORY</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)} style={{
                  ...S.pill,
                  background: category === c.id ? "#1d4ed8" : "#111827",
                  borderColor: category === c.id ? "#3b82f6" : "#1f2937",
                  color: category === c.id ? "#fff" : "#6b7280",
                }}>{c.label}</button>
              ))}
            </div>
          </div>

          {/* Data type (only for leagues) */}
          {showDataTypes && (
            <div style={{ marginBottom: 14 }}>
              <div style={S.label}>DATA TYPE</div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {DATA_TYPES.map(d => (
                  <button key={d.id} onClick={() => setDataType(d.id)} style={{
                    ...S.pill,
                    background: dataType === d.id ? "#065f46" : "#111827",
                    borderColor: dataType === d.id ? "#10b981" : "#1f2937",
                    color: dataType === d.id ? "#6ee7b7" : "#6b7280",
                  }}>{d.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Tone + Fetch */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={S.label}>TONE</div>
              <div style={{ display: "flex", gap: 7 }}>
                {TONES.map(t => (
                  <button key={t} onClick={() => setTone(t)} style={{
                    ...S.pill,
                    background: tone === t ? "#1e3a5f" : "#111827",
                    borderColor: tone === t ? "#3b82f6" : "#1f2937",
                    color: tone === t ? "#93c5fd" : "#6b7280",
                  }}>{t}</button>
                ))}
              </div>
            </div>
            <button onClick={fetchData} disabled={loading} style={{ ...S.btnPrimary, marginLeft: "auto", opacity: loading ? .7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "⏳ Loading…" : `🔍 Fetch ${cat?.label}`}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#450a0a", border: "1px solid #991b1b", borderRadius: 10, padding: "14px 16px", marginBottom: 16, color: "#fca5a5", fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {articles.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: 14 }}>{cat?.label} — {articles.length} posts ready</span>
              <button onClick={handleExportJson} style={{ ...S.btnSmall, borderColor: "#10b981", color: "#6ee7b7" }}>⬇️ Export JSON</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {articles.map((a, i) => (
                <PostCard
                  key={i}
                  article={a}
                  image={images[i]}
                  index={i}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty */}
        {!loading && articles.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: "70px 20px" }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>⚽</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Select a category and fetch live data</div>
            <div style={{ fontSize: 13, color: "#1f2937", lineHeight: 1.7 }}>
              Pulls real data from API-Football, writes posts automatically,<br />adds Unsplash images — ready to copy or export.
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

/* ── Shared styles ───────────────────────────────────────────────────────── */
const S = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modal: { background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 16, padding: "24px 28px", width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" },
  label: { display: "block", fontSize: 10, color: "#4b5563", fontWeight: 700, letterSpacing: "1.5px", marginBottom: 6 },
  input: { width: "100%", background: "#06080f", border: "1px solid #1e3a5f", borderRadius: 8, padding: "9px 12px", color: "#e2e8f0", fontSize: 14 },
  hint: { fontSize: 11, color: "#4b5563", marginTop: 4, lineHeight: 1.5 },
  card: { background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 14, overflow: "hidden" },
  postText: { background: "#06080f", borderLeft: "3px solid #1d4ed8", borderRadius: "0 8px 8px 0", padding: "11px 14px", fontSize: 14, color: "#94a3b8", lineHeight: 1.6 },
  textarea: { width: "100%", background: "#06080f", border: "1px solid #3b82f6", borderRadius: 8, padding: 12, color: "#e2e8f0", fontSize: 14, lineHeight: 1.6, resize: "vertical" },
  pill: { border: "1px solid", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  btnPrimary: { background: "linear-gradient(135deg,#1d4ed8,#6d28d9)", border: "none", borderRadius: 10, padding: "10px 22px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  btnGhost: { background: "#1f2937", border: "1px solid #374151", borderRadius: 10, padding: "10px 16px", color: "#9ca3af", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  btnSmall: { background: "transparent", border: "1px solid #374151", borderRadius: 8, padding: "6px 12px", color: "#9ca3af", fontSize: 12, fontWeight: 600, cursor: "pointer" },
};
