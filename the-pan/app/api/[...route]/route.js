import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db, sign, who, bcrypt } from "@/lib/db";
const J = (d, s = 200) => NextResponse.json(d, { status: s });
const clean = (s, n = 500) => String(s ?? "").trim().slice(0, n);
const oid = (s) => new ObjectId(s);

async function handle(req, { params }) {
  const [a, b, c] = params.route, M = req.method, D = await db();
  const body = M === "POST" ? await req.json().catch(() => ({})) : {};
  const q = req.nextUrl.searchParams;

  if (a === "auth") {
    const username = clean(body.username, 24).toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(username) || clean(body.password).length < 6) return J({ error: "Username 3-24 letters/numbers/_, password 6+ chars" }, 400);
    let u;
    if (b === "register") {
      if (await D.collection("users").findOne({ username })) return J({ error: "Username taken" }, 409);
      u = { username, hash: await bcrypt.hash(body.password, 10), role: username === process.env.ADMIN_USERNAME?.toLowerCase() ? "admin" : "user", created: new Date() };
      await D.collection("users").insertOne(u);
    } else {
      u = await D.collection("users").findOne({ username });
      if (!u || u.banned || !(await bcrypt.compare(body.password, u.hash))) return J({ error: "Wrong username or password" }, 401);
    }
    const r = J({ username: u.username, role: u.role });
    r.cookies.set("pan", await sign({ username: u.username, role: u.role }), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 2592000 });
    return r;
  }
  const me = await who(req);
  if (a === "me") return J(me ?? {});
  if (!me) return J({ error: "Log in first" }, 401);

  if (a === "news") return J(await D.collection("news").find().sort({ count: -1, last: -1 }).limit(30).toArray());

  if (a === "posts") {
    if (M === "GET") {
      const f = q.get("news") ? { news: q.get("news") } : {};
      return J(await D.collection("posts").find({ ...f, hidden: { $ne: true } }).sort({ created: -1 }).limit(50).toArray());
    }
    const area = clean(body.area, 40), topic = clean(body.topic, 60);
    if (!area || !topic) return J({ error: "Area and topic are required" }, 400);
    const news = `${area} ${topic}`.replace(/\s+/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());
    const opts = (body.options ?? []).map((o) => clean(o, 60)).filter(Boolean).slice(0, 6);
    const post = { user: me.username, area, topic, news, text: clean(body.text, 1000), mediaUrl: clean(body.mediaUrl, 500), repostOf: body.repostOf ?? null,
      poll: opts.length > 1 ? { options: opts.map((t) => ({ t, votes: 0 })), voters: [] } : null, reacts: {}, created: new Date() };
    await D.collection("posts").insertOne(post);
    await D.collection("news").updateOne({ _id: news.toLowerCase() }, { $set: { title: news, area, topic, last: new Date() }, $inc: { count: 1 } }, { upsert: true });
    return J({ ok: 1 }, 201);
  }
  if (a === "react") return J(await D.collection("posts").updateOne({ _id: oid(body.id) }, { $inc: { [`reacts.${clean(body.emoji, 4)}`]: 1 } }));
  if (a === "vote") {
    const r = await D.collection("posts").updateOne({ _id: oid(body.id), "poll.voters": { $ne: me.username } },
      { $inc: { [`poll.options.${+body.index}.votes`]: 1 }, $push: { "poll.voters": me.username } });
    return r.modifiedCount ? J({ ok: 1 }) : J({ error: "Already voted" }, 409);
  }
  if (a === "toasts") {
    const C = D.collection("toasts"), item = { user: me.username, text: clean(body.text, 400), at: new Date() };
    if (M === "GET") return J(await C.find().sort({ last: -1 }).limit(30).toArray());
    if (body.id) return J(await C.updateOne({ _id: oid(body.id) }, { $push: { items: item }, $set: { last: new Date() } }));
    return J(await C.insertOne({ topic: clean(body.topic, 100), items: [item], last: new Date() }), 201);
  }
  if (a === "dm") {
    const C = D.collection("dms"), other = clean(q.get("with") || body.to, 24).toLowerCase(), pair = [me.username, other].sort().join("|");
    if (M === "GET") return J(await C.find({ pair }).sort({ at: 1 }).limit(200).toArray());
    return J(await C.insertOne({ pair, from: me.username, text: clean(body.text, 1000), at: new Date() }), 201);
  }
  if (a === "kikao") {
    const C = D.collection("kikaos");
    if (!b) {
      if (M === "GET") return J(await C.find({ live: true }).sort({ created: -1 }).limit(30).toArray());
      return J(await C.insertOne({ title: clean(body.title, 100), host: me.username, live: true, created: new Date() }), 201);
    }
    if (c === "end") return J(await C.updateOne({ _id: oid(b), host: me.username }, { $set: { live: false } }));
    const CH = D.collection("kikao_chat");
    if (M === "GET") return J(await CH.find({ kid: b, at: { $gt: new Date(+q.get("since") || 0) } }).sort({ at: 1 }).limit(100).toArray());
    return J(await CH.insertOne({ kid: b, user: me.username, text: clean(body.text, 300), emoji: clean(body.emoji, 4), at: new Date() }), 201);
  }
  if (a === "admin") {
    if (me.role !== "admin") return J({ error: "Admins only" }, 403);
    if (b === "hide") return J(await D.collection("posts").updateOne({ _id: oid(body.id) }, { $set: { hidden: true } }));
    if (b === "ban") return J(await D.collection("users").updateOne({ username: clean(body.username, 24).toLowerCase() }, { $set: { banned: true } }));
  }
  return J({ error: "Not found" }, 404);
}
export { handle as GET, handle as POST };
