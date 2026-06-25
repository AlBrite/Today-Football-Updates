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
  { id: "live", label: "🟢 Live Now", group: "live" },
  { id: "transfers", label: "🔄 Transfers", group: "transfers" },
  { id: "premier_league", label: "🏴 Premier League", group: "league", leagueId: LEAGUE_IDS.premier_league },
  { id: "la_liga", label: "🇪🇸 La Liga", group: "league", leagueId: LEAGUE_IDS.la_liga },
  { id: "serie_a", label: "🇮🇹 Serie A", group: "league", leagueId: LEAGUE_IDS.serie_a },
  { id: "bundesliga", label: "🇩🇪 Bundesliga", group: "league", leagueId: LEAGUE_IDS.bundesliga },
  { id: "ligue_1", label: "🇫🇷 Ligue 1", group: "league", leagueId: LEAGUE_IDS.ligue_1 },
  { id: "champions_league", label: "⭐ UCL", group: "league", leagueId: LEAGUE_IDS.champions_league },
  { id: "europa_league", label: "🟠 Europa", group: "league", leagueId: LEAGUE_IDS.europa_league },
  { id: "conference_league", label: "🟢 Conference", group: "league", leagueId: LEAGUE_IDS.conference_league },
  { id: "euro", label: "🏆 EURO", group: "league", leagueId: LEAGUE_IDS.euro },
  { id: "afcon", label: "🌍 AFCON", group: "league", leagueId: LEAGUE_IDS.afcon },
  { id: "world_cup", label: "🌐 World Cup", group: "league", leagueId: LEAGUE_IDS.world_cup },
];

const DATA_TYPES = [
  { id: "fixtures", label: "📅 Fixtures / Results" },
  { id: "standings", label: "📊 Standings" },
  { id: "scorers", label: "🥅 Top Scorers" },
];

const TONES = ["Exciting", "Neutral", "Fan-friendly", "Analytical"];

/* ── Settings ─────────────────────────────────────────────────────────────── */

function SettingsModal({ settings, onSave, onClose }) {
  const [s, setS] = useState(settings);
  const set = (k, v) => setS(p => ({ ...p, [k]: v }));

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <h2 style={{ color: "#60a5fa" }}>API Settings</h2>

        {[
          { key: "afKey", label: "API-FOOTBALL KEY", pw: true },
          { key: "unsplashKey", label: "UNSPLASH KEY", pw: true },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <label style={S.label}>{f.label}</label>
            <input
              type="password"
              value={s[f.key] || ""}
              onChange={e => set(f.key, e.target.value)}
              style={S.input}
            />
          </div>
        ))}

        <button onClick={() => onSave(s)} style={S.btnPrimary}>Save</button>
        <button onClick={onClose} style={S.btnGhost}>Cancel</button>
      </div>
    </div>
  );
}

/* ── App ─────────────────────────────────────────────────────────────────── */

const DEFAULT_SETTINGS = { afKey: "", unsplashKey: "" };

export default function App() {
  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fp2_settings")) || DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [showSettings, setShowSettings] = useState(false);
  const [category, setCategory] = useState("premier_league");
  const [dataType, setDataType] = useState("fixtures");
  const [tone, setTone] = useState("Exciting");

  const [articles, setArticles] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cat = CATEGORIES.find(c => c.id === category);

  const saveSettings = (s) => {
    setSettings(s);
    localStorage.setItem("fp2_settings", JSON.stringify(s));
    setShowSettings(false);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    setArticles([]);
    setImages([]);

    try {
      if (!settings.afKey) {
        setShowSettings(true);
        throw new Error("Missing API key");
      }

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
        if (!leagueId) throw new Error("Invalid league");

        if (dataType === "fixtures") {
          rawItems = await fetchLeagueFixtures(leagueId, settings.afKey);
          dtype = "fixture";
        } else if (dataType === "standings") {
          const rows = await fetchStandings(leagueId, settings.afKey);
          rawItems = Array.isArray(rows) ? rows : [];
          dtype = "standing";
        } else if (dataType === "scorers") {
          rawItems = await fetchTopScorers(leagueId, settings.afKey);
          dtype = "scorer";
        }
      }

      if (!Array.isArray(rawItems) || rawItems.length === 0) {
        setError("No data found.");
        return;
      }

      const items = rawItems.slice(0, 4);

      const posts = items.map(item => {
        try {
          return generatePost(dtype, item, tone, cat?.label || "Football");
        } catch (e) {
          console.error("generatePost error:", e);
          return {
            headline: "Error",
            post: "Could not generate post",
            source: "system",
            imageKeyword: "football",
          };
        }
      });

      const imgs = await Promise.all(
        posts.map(p =>
          fetchUnsplashImage(p.imageKeyword, settings.unsplashKey)
            .catch(() => null)
        )
      );

      setArticles(posts);
      setImages(imgs);

    } catch (e) {
      console.error(e);
      setError(e.message || "Unexpected error");
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
    }));

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `posts-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={S.wrap}>
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      <header style={S.header}>
        <h1>⚽ FootballPost</h1>
        <button onClick={logout} style={S.btnSmall}>Logout</button>
      </header>

      <main style={S.main}>
        <button onClick={fetchData} style={S.btnPrimary}>
          {loading ? "Loading..." : "Fetch Data"}
        </button>

        {error && <div style={S.error}>⚠️ {error}</div>}

        {articles.map((a, i) => (
          <div key={i} style={S.card}>
            <h3>{a.headline}</h3>
            <p>{a.post}</p>
          </div>
        ))}

        {articles.length > 0 && (
          <button onClick={handleExportJson} style={S.btnGhost}>
            Export JSON
          </button>
        )}
      </main>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const S = {
  wrap: { minHeight: "100vh", background: "#06080f", color: "#fff", padding: 20 },
  header: { display: "flex", justifyContent: "space-between", marginBottom: 20 },
  main: { maxWidth: 800, margin: "0 auto" },

  card: { background: "#0f172a", padding: 15, marginTop: 10, borderRadius: 10 },

  btnPrimary: {
    background: "#2563eb",
    color: "#fff",
    padding: 10,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },

  btnGhost: {
    background: "transparent",
    border: "1px solid #444",
    color: "#ccc",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
  },

  btnSmall: {
    background: "transparent",
    border: "1px solid #444",
    color: "#ccc",
    padding: "5px 10px",
    borderRadius: 6,
  },

  error: {
    background: "#7f1d1d",
    color: "#fecaca",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    background: "#0f172a",
    padding: 20,
    borderRadius: 12,
    width: 400,
  },

  label: { fontSize: 12, color: "#aaa" },

  input: {
    width: "100%",
    padding: 10,
    marginTop: 5,
    borderRadius: 6,
    border: "1px solid #333",
    background: "#06080f",
    color: "#fff",
  },
};
