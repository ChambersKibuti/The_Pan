"use client";
import { useEffect, useRef, useState } from "react";
const api = (p, body) => fetch("/api/" + p, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}).then((r) => r.json());
const EMO = ["🔥", "😂", "😮", "😢", "👏", "💯"];
const css = `:root{--iron:#232b30;--pan:#323c42;--ember:#ff6a2b;--butter:#ffd87a;--ash:#e9e4dc}
*{box-sizing:border-box}body{font-family:Georgia,serif;background:var(--iron);color:var(--ash)}
button,input,textarea{font:inherit}input,textarea{width:100%;padding:10px;margin:4px 0;border-radius:8px;border:1px solid #556;background:#1a2024;color:var(--ash)}
button{background:var(--ember);color:#1a1008;border:0;padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:700}button.g{background:var(--pan);color:var(--ash)}
button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid var(--butter)}
main{max-width:640px;margin:auto;padding:12px 12px 90px}nav{position:fixed;bottom:0;left:0;right:0;display:flex;background:#161c20;justify-content:center;gap:4px;padding:8px}
nav button{background:none;color:var(--ash)}nav .on{background:var(--ember);color:#1a1008}
.c{background:var(--pan);border-radius:14px;padding:14px;margin:10px 0}h1{font-size:2rem;margin:8px 0}.b{height:8px;background:var(--ember);border-radius:4px}
.fl{position:fixed;bottom:80px;font-size:2rem;animation:up 3s ease-out forwards;pointer-events:none}@keyframes up{to{transform:translateY(-60vh);opacity:0}}
@media(prefers-reduced-motion:reduce){.fl{animation:none;opacity:0}}`;

function Auth({ done }) {
  const [u, su] = useState(""), [p, sp] = useState(""), [e, se] = useState("");
  const go = async (m) => { const r = await api("auth/" + m, { username: u, password: p }); r.error ? se(r.error) : done(r); };
  return <div className="c"><h1>🍳 The Pan</h1><p>What's cooking where you are.</p>
    <input placeholder="Username" value={u} onChange={(x) => su(x.target.value)} />
    <input type="password" placeholder="Password" value={p} onChange={(x) => sp(x.target.value)} />
    <p style={{ color: "var(--butter)" }}>{e}</p><button onClick={() => go("login")}>Log in</button> <button className="g" onClick={() => go("register")}>Create account</button></div>;
}
function Post({ p, me, reload }) {
  const [voted, sv] = useState(false);
  const tot = p.poll?.options.reduce((s, o) => s + o.votes, 0) || 0;
  return <div className="c"><b>@{p.user}</b> · {p.news}<p>{p.text}</p>
    {p.mediaUrl && (/\.(mp4|webm)$/i.test(p.mediaUrl) ? <video src={p.mediaUrl} controls style={{ width: "100%" }} /> : <img src={p.mediaUrl} alt="" style={{ width: "100%", borderRadius: 8 }} />)}
    {p.poll?.options.map((o, i) => <div key={i} style={{ margin: "6px 0" }}><button className="g" disabled={voted} onClick={async () => { await api("vote", { id: p._id, index: i }); sv(true); reload(); }}>{String.fromCharCode(65 + i)}. {o.t}</button>
      <div className="b" style={{ width: tot ? (o.votes / tot) * 100 + "%" : 0 }} /> <small>{o.votes} votes</small></div>)}
    <div>{EMO.map((e) => <button key={e} className="g" onClick={async () => { await api("react", { id: p._id, emoji: e }); reload(); }}>{e} {p.reacts?.[e] || ""}</button>)}
      <button className="g" onClick={async () => { await api("posts", { area: p.area, topic: p.topic, text: "🔁 @" + p.user + ": " + p.text, repostOf: p._id }); reload(); }}>Repost</button>
      {me.role === "admin" && <button className="g" onClick={async () => { await api("admin/hide", { id: p._id }); reload(); }}>Hide</button>}</div></div>;
}
function News({ me }) {
  const [news, sn] = useState([]), [posts, sp] = useState([]), [f, sf] = useState(""), [d, sd] = useState({ options: ["", ""] });
  const load = async () => { sn(await api("news")); sp(await api("posts" + (f ? "?news=" + encodeURIComponent(f) : ""))); };
  useEffect(() => { load(); }, [f]);
  const set = (k) => (x) => sd({ ...d, [k]: x.target.value });
  return <><h1>🔥 Smoking News</h1><div className="c"><b>Trending</b><br />{news.map((n) => <button key={n._id} className="g" style={{ margin: 3 }} onClick={() => sf(f === n.title ? "" : n.title)}>{n.title} · {n.count}</button>)}</div>
    <div className="c"><input placeholder="Area (e.g. Nairobi)" onChange={set("area")} /><input placeholder="Topic (e.g. Accident)" onChange={set("topic")} />
      <textarea placeholder="What's happening? Or ask a voting question…" onChange={set("text")} /><input placeholder="Image or video link (optional)" onChange={set("mediaUrl")} />
      {d.options.map((o, i) => <input key={i} placeholder={"Vote option " + String.fromCharCode(65 + i) + " (optional)"} onChange={(x) => { const n = [...d.options]; n[i] = x.target.value; sd({ ...d, options: n }); }} />)}
      <button className="g" onClick={() => sd({ ...d, options: [...d.options, ""] })}>+ option</button> <button onClick={async () => { const r = await api("posts", d); r.error ? alert(r.error) : load(); }}>Post</button></div>
    {posts.map((p) => <Post key={p._id} p={p} me={me} reload={load} />)}</>;
}
function Toast({ x, reload }) {
  const [o, so] = useState(false), [v, sv] = useState("");
  return <div className="c"><b onClick={() => so(!o)} style={{ cursor: "pointer" }}>{x.topic} ({x.items.length})</b>
    {o && <>{x.items.map((i, k) => <p key={k}>@{i.user}: {i.text}</p>)}<input placeholder="Add your toast" value={v} onChange={(e) => sv(e.target.value)} />
      <button onClick={async () => { await api("toasts", { id: x._id, text: v }); sv(""); reload(); }}>Toast</button></>}</div>;
}
function Toasting() {
  const [t, st] = useState([]), [topic, sp] = useState(""), [txt, sx] = useState("");
  const load = async () => st(await api("toasts")); useEffect(() => { load(); }, []);
  return <><h1>🥂 Toasting</h1><div className="c"><input placeholder="Vice to roast (e.g. Potholes on Thika Road)" value={topic} onChange={(x) => sp(x.target.value)} />
    <textarea placeholder="Your toast" value={txt} onChange={(x) => sx(x.target.value)} /><button onClick={async () => { await api("toasts", { topic, text: txt }); sp(""); sx(""); load(); }}>Start toast</button></div>
    {t.map((x) => <Toast key={x._id} x={x} reload={load} />)}</>;
}
function Dm({ me }) {
  const [w, sw] = useState(""), [m, sm] = useState([]), [t, st] = useState("");
  const load = async () => w && sm(await api("dm?with=" + w));
  useEffect(() => { load(); const i = setInterval(load, 3000); return () => clearInterval(i); }, [w]);
  return <><h1>💬 DMs</h1><input placeholder="Chat with username" value={w} onChange={(x) => sw(x.target.value)} />
    {m.map((x) => <p key={x._id} style={{ textAlign: x.from === me.username ? "right" : "left" }}><span className="c" style={{ display: "inline-block", margin: 2 }}>{x.text}</span></p>)}
    <input value={t} onChange={(x) => st(x.target.value)} placeholder="Message" /><button onClick={async () => { await api("dm", { to: w, text: t }); st(""); load(); }}>Send</button></>;
}
function Room({ k, me, leave }) {
  const [m, sm] = useState([]), [t, st] = useState(""), [fl, sf] = useState([]), since = useRef(0);
  useEffect(() => { const i = setInterval(async () => { const r = await api(`kikao/${k._id}?since=${since.current}`); if (!r.length) return;
    since.current = new Date(r.at(-1).at).getTime(); sm((o) => [...o, ...r.filter((x) => x.text)].slice(-100));
    sf((o) => [...o, ...r.filter((x) => x.emoji).map((x) => ({ id: x._id, e: x.emoji, l: 10 + Math.random() * 80 }))].slice(-30)); }, 1500); return () => clearInterval(i); }, []);
  return <><h1>🎙️ {k.title}</h1><p>Host: @{k.host}</p>
    <div className="c" style={{ minHeight: 160 }}>Live audio/video connects here via LiveKit or Agora (see README).</div>
    {fl.map((f) => <span key={f.id} className="fl" style={{ left: f.l + "%" }}>{f.e}</span>)}
    <div className="c" style={{ maxHeight: 220, overflow: "auto" }}>{m.map((x) => <div key={x._id}><b>@{x.user}</b> {x.text}</div>)}</div>
    <div>{EMO.map((e) => <button key={e} className="g" onClick={() => api(`kikao/${k._id}`, { emoji: e })}>{e}</button>)}</div>
    <input value={t} onChange={(x) => st(x.target.value)} placeholder="Say something" /><button onClick={() => { api(`kikao/${k._id}`, { text: t }); st(""); }}>Send</button>{" "}
    {k.host === me.username && <button className="g" onClick={() => { api(`kikao/${k._id}/end`, {}); leave(); }}>End Kikao</button>} <button className="g" onClick={leave}>Leave</button></>;
}
function Kikao({ me }) {
  const [l, sl] = useState([]), [t, st] = useState(""), [r, sr] = useState(null);
  const load = async () => sl(await api("kikao")); useEffect(() => { load(); }, [r]);
  if (r) return <Room k={r} me={me} leave={() => sr(null)} />;
  return <><h1>🎙️ Kikao</h1><div className="c"><input placeholder="Kikao topic to discuss" value={t} onChange={(x) => st(x.target.value)} />
    <button onClick={async () => { await api("kikao", { title: t }); st(""); load(); }}>Go live</button></div>
    {l.map((k) => <div className="c" key={k._id}><b>{k.title}</b> · @{k.host} <button onClick={() => sr(k)}>Join</button></div>)}</>;
}
export default function App() {
  const [me, sm] = useState(null), [tab, st] = useState("news");
  useEffect(() => { api("me").then((r) => sm(r.username ? r : false)); }, []);
  if (me === null) return null;
  const T = { news: ["🔥", "News", <News me={me} />], kikao: ["🎙️", "Kikao", <Kikao me={me} />], toast: ["🥂", "Toasting", <Toasting />], dm: ["💬", "DM", <Dm me={me} />] };
  return <><style>{css}</style><main>{!me ? <Auth done={sm} /> : T[tab][2]}</main>
    {me && <nav>{Object.entries(T).map(([k, v]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => st(k)}>{v[0]} {v[1]}</button>)}</nav>}</>;
}
