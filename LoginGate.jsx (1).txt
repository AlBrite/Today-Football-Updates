import { useState } from "react";

/* ── Password gate ────────────────────────────────────────────────────────
 * This is a CLIENT-SIDE gate only. It's enough to stop random visitors
 * from landing on the page and seeing/using it, but since this is a static
 * site, anyone who really wants to could read the hash out of the JS bundle
 * and brute-force a weak password offline. Don't rely on this to protect
 * anything more sensitive than "keep casual visitors out" — your real
 * secrets (API keys / FB token) live in each visitor's own browser storage
 * via the Settings modal, not in this code.
 *
 * TO SET YOUR OWN PASSWORD:
 * 1. Open any page in your browser, open DevTools console, and run:
 *      crypto.subtle.digest("SHA-256", new TextEncoder().encode("YOUR_PASSWORD"))
 *        .then(b => console.log(Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("")))
 * 2. Copy the printed hash and paste it below as PASSWORD_HASH.
 * 3. Rebuild and redeploy.
 *
 * Default password below is "changeme123" — change it before you deploy!
 */
const PASSWORD_HASH = "494a715f7e9b4071aca61bac42ca858a309524e5864f0920030862a4ae7589be";

const AUTH_KEY = "fp2_auth";

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  location.reload();
}

export default function LoginGate({ children }) {
  const [authed, setAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === "1");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChecking(true);
    setError("");
    const hash = await sha256Hex(pw);
    if (hash === PASSWORD_HASH) {
      localStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
    } else {
      setError("Incorrect password.");
      setPw("");
    }
    setChecking(false);
  };

  if (authed) return children;

  return (
    <div style={S.wrap}>
      <form onSubmit={handleSubmit} style={S.box}>
        <div style={S.icon}>⚽</div>
        <h1 style={S.title}>FootballPost</h1>
        <p style={S.sub}>Enter the password to continue</p>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          style={S.input}
          placeholder="Password"
        />
        {error && <div style={S.error}>⚠️ {error}</div>}
        <button type="submit" disabled={checking || !pw} style={S.btn}>
          {checking ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}

const S = {
  wrap: {
    minHeight: "100vh",
    background: "#06080f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  box: {
    width: "100%",
    maxWidth: 360,
    background: "#0f172a",
    border: "1px solid #1e3a5f",
    borderRadius: 16,
    padding: "32px 28px",
    textAlign: "center",
  },
  icon: { fontSize: 40, marginBottom: 8 },
  title: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 900,
    fontSize: 24,
    color: "#fff",
    margin: 0,
  },
  sub: { fontSize: 13, color: "#6b7280", marginTop: 6, marginBottom: 20 },
  input: {
    width: "100%",
    background: "#06080f",
    border: "1px solid #1e3a5f",
    borderRadius: 8,
    padding: "11px 14px",
    color: "#e2e8f0",
    fontSize: 15,
    textAlign: "center",
    boxSizing: "border-box",
  },
  error: { color: "#fca5a5", fontSize: 13, marginTop: 10 },
  btn: {
    width: "100%",
    marginTop: 14,
    background: "linear-gradient(135deg,#1d4ed8,#6d28d9)",
    border: "none",
    borderRadius: 10,
    padding: "11px 0",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
};
