// ── API-Football ────────────────────────────────────────────────────────────
// All free-tier endpoints (no Anthropic key needed)

const AF_BASE = "https://v3.football.api-sports.io";

const LEAGUE_IDS = {
  premier_league:    39,
  la_liga:           140,
  serie_a:           135,
  bundesliga:        78,
  ligue_1:           61,
  champions_league:  2,
  europa_league:     3,
  conference_league: 848,
  world_cup:         1,
  euro:              4,
  afcon:             6,
};

async function afFetch(endpoint, params, apiKey) {
  const url = new URL(`${AF_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": apiKey },
  });
  if (!res.ok) throw new Error(`API-Football error: ${res.status}`);
  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(Object.values(data.errors)[0]);
  }
  return data.response || [];
}

export async function fetchLeagueFixtures(leagueId, apiKey) {
  const season = new Date().getFullYear();
  // Get recent + upcoming fixtures
  const data = await afFetch("/fixtures", { league: leagueId, season, last: 5 }, apiKey);
  return data;
}

export async function fetchLiveFixtures(apiKey) {
  return await afFetch("/fixtures", { live: "all" }, apiKey);
}

export async function fetchStandings(leagueId, apiKey) {
  const season = new Date().getFullYear();
  const data = await afFetch("/standings", { league: leagueId, season }, apiKey);
  return data[0]?.league?.standings?.[0]?.slice(0, 5) || [];
}

export async function fetchTopScorers(leagueId, apiKey) {
  const season = new Date().getFullYear();
  const data = await afFetch("/players/topscorers", { league: leagueId, season }, apiKey);
  return data.slice(0, 5);
}

export async function fetchTransfers(apiKey) {
  // Get transfers for major clubs (we pick a few popular ones)
  const clubIds = [33, 40, 50, 49, 541, 529, 530, 157, 165]; // Man Utd, Liverpool, Man City, Chelsea, Real, Barca, Atletico, Bayern, PSG
  const results = [];
  for (const team of clubIds.slice(0, 3)) {
    try {
      const data = await afFetch("/transfers", { team }, apiKey);
      if (data.length > 0) results.push(...data[0]?.transfers?.slice(0, 2) || []);
    } catch { /* skip */ }
  }
  return results;
}

// ── Post Generator (no AI API needed — runs locally) ────────────────────────

function formatFixture(f) {
  const home = f.teams?.home?.name;
  const away = f.teams?.away?.name;
  const hg = f.goals?.home ?? "?";
  const ag = f.goals?.away ?? "?";
  const status = f.fixture?.status?.short;
  const date = new Date(f.fixture?.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  if (["FT", "AET", "PEN"].includes(status)) {
    return { type: "result", home, away, hg, ag, date, venue: f.fixture?.venue?.name };
  }
  if (["1H", "2H", "HT", "ET", "BT", "P"].includes(status)) {
    return { type: "live", home, away, hg, ag, elapsed: f.fixture?.status?.elapsed };
  }
  return { type: "upcoming", home, away, date, venue: f.fixture?.venue?.name };
}

const TONE_TEMPLATES = {
  Exciting: {
    result: (f) => `🔥 FULL TIME! ${f.home} ${f.hg} - ${f.ag} ${f.away}! What a match at ${f.venue || "the stadium"}! 💥 #Football #${f.home?.replace(/\s/g,"")} #${f.away?.replace(/\s/g,"")}`,
    live:     (f) => `⚡ LIVE UPDATE! ${f.home} ${f.hg} - ${f.ag} ${f.away} (${f.elapsed}') 🟢 It's heating up! Follow the action! #LiveFootball #Football`,
    upcoming: (f) => `🗓️ NEXT UP! ${f.home} vs ${f.away} on ${f.date}! Who's taking the 3 points? 🏆 Drop your prediction below! 👇 #Football #Preview`,
    standing: (s) => `📊 TOP 5 STANDINGS UPDATE!\n${s.map((t,i) => `${i+1}. ${t.team.name} — ${t.points} pts`).join("\n")}\n🔥 Who wins the title? #Standings #Football`,
    scorer:   (p) => `🥅 TOP SCORER ALERT! ${p.player.name} leads with ${p.statistics[0]?.goals?.total} goals this season! 🔥 What a player! #TopScorer #Football`,
    transfer: (t) => `🔄 TRANSFER NEWS! ${t.player?.name} moves to ${t.teams?.in?.name} from ${t.teams?.out?.name}! 💸 The window is heating up! #TransferNews #Football`,
  },
  Neutral: {
    result:   (f) => `Full-time result: ${f.home} ${f.hg}–${f.ag} ${f.away}. Match played at ${f.venue || "home ground"} on ${f.date}. #Football`,
    live:     (f) => `${f.home} ${f.hg}–${f.ag} ${f.away} — ${f.elapsed} minutes played. Live match update. #Football #LiveScore`,
    upcoming: (f) => `Upcoming fixture: ${f.home} vs ${f.away}, ${f.date}. #Football #Fixtures`,
    standing: (s) => `Current top 5:\n${s.map((t,i) => `${i+1}. ${t.team.name} – ${t.points} pts (${t.goalsDiff > 0 ? "+" : ""}${t.goalsDiff} GD)`).join("\n")}\n#Standings #Football`,
    scorer:   (p) => `${p.player.name} (${p.statistics[0]?.team?.name}) leads the scoring charts with ${p.statistics[0]?.goals?.total} goals. #TopScorers`,
    transfer: (t) => `${t.player?.name} has completed a move to ${t.teams?.in?.name} from ${t.teams?.out?.name}. #Transfers #Football`,
  },
  "Fan-friendly": {
    result:   (f) => `Oi oi! ${f.home} ${f.hg} - ${f.ag} ${f.away}! 😮 The boys did it (or didn't 😅)! Chat below mates ⬇️ #Football #Matchday`,
    live:     (f) => `IT'S LIVE! ⚽ ${f.home} ${f.hg} - ${f.ag} ${f.away} | ${f.elapsed}' in! Glued to the screen rn 👀 #LiveFootball`,
    upcoming: (f) => `Big one coming up! 😤 ${f.home} vs ${f.away} on ${f.date}! Your score prediction? 🔮 #Football #Banter`,
    standing: (s) => `Table check! 👇\n${s.map((t,i) => `${i+1}. ${t.team.name} ${t.points}pts`).join("\n")}\nWho's winning it all?? 🏆 #Football`,
    scorer:   (p) => `${p.player.name} is BALLING! 🎯 ${p.statistics[0]?.goals?.total} goals this season!! Send this to someone who doubted him 😤 #Football`,
    transfer: (t) => `DEAL DONE! 🤝 ${t.player?.name} is officially a ${t.teams?.in?.name} player! From ${t.teams?.out?.name}! What do you think? 💬 #Transfers`,
  },
  Analytical: {
    result:   (f) => `Result analysis: ${f.home} ${f.hg}–${f.ag} ${f.away}. The scoreline reflects the balance of play at ${f.venue || "the ground"}. Key tactical battles decided this one. #TacticsThread #Football`,
    live:     (f) => `${f.elapsed}' — ${f.home} ${f.hg}–${f.ag} ${f.away}. Tracking shape, transitions and set-piece patterns in this one. #TacticsLive #Football`,
    upcoming: (f) => `Previewing ${f.home} vs ${f.away} (${f.date}). Formation matchup, key duels and expected goals breakdown incoming. Who has the tactical edge? #Preview #Football`,
    standing: (s) => `Standings breakdown — points, goal difference and form all factor in:\n${s.map((t,i) => `${i+1}. ${t.team.name} | P${t.all?.played} W${t.all?.win} D${t.all?.draw} L${t.all?.lose} | ${t.points}pts`).join("\n")}\n#Analysis #Football`,
    scorer:   (p) => `${p.player.name}: ${p.statistics[0]?.goals?.total} goals, ${p.statistics[0]?.goals?.assists ?? 0} assists in ${p.statistics[0]?.games?.appearences ?? "?"} appearances. Minutes per goal ratio makes for impressive reading. #Stats #Football`,
    transfer: (t) => `Transfer breakdown: ${t.player?.name} (${t.teams?.out?.name} → ${t.teams?.in?.name}). What tactical need does this signing address? #TransferAnalysis #Football`,
  },
};

export function generatePost(dataType, dataItem, tone, leagueLabel) {
  const tmpl = TONE_TEMPLATES[tone] || TONE_TEMPLATES["Exciting"];
  let text = "";
  let imageKeyword = "football stadium";
  let headline = "";

  if (dataType === "fixture") {
    const f = formatFixture(dataItem);
    text = tmpl[f.type]?.(f) || `${f.home} vs ${f.away}`;
    imageKeyword = `${f.home} ${f.away} football`;
    headline = f.type === "result"
      ? `${f.home} ${f.hg}–${f.ag} ${f.away}`
      : f.type === "live"
      ? `LIVE: ${f.home} ${f.hg}–${f.ag} ${f.away}`
      : `${f.home} vs ${f.away} — ${f.date}`;
  } else if (dataType === "standing") {
    text = tmpl.standing(dataItem);
    imageKeyword = `${leagueLabel} football standings trophy`;
    headline = `${leagueLabel} Top 5 Standings`;
  } else if (dataType === "scorer") {
    text = tmpl.scorer(dataItem);
    imageKeyword = `${dataItem.player?.name} goal celebration`;
    headline = `Top Scorer: ${dataItem.player?.name}`;
  } else if (dataType === "transfer") {
    text = tmpl.transfer(dataItem);
    imageKeyword = `${dataItem.teams?.in?.name} football signing`;
    headline = `${dataItem.player?.name} → ${dataItem.teams?.in?.name}`;
  }

  return { headline, post: text, imageKeyword, source: leagueLabel };
}

// ── Unsplash ─────────────────────────────────────────────────────────────────

export async function fetchUnsplashImage(query, accessKey) {
  if (!accessKey) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    );
    const data = await res.json();
    const r = data.results?.[0];
    if (!r) return null;
    return { url: r.urls.regular, thumb: r.urls.small, author: r.user.name, authorUrl: r.user.links.html };
  } catch { return null; }
}

export { LEAGUE_IDS };
