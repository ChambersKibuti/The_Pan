import { MongoClient } from "mongodb";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
const g = globalThis;
export const db = async () => (await (g._m ??= new MongoClient(process.env.MONGODB_URI).connect())).db();
const key = () => new TextEncoder().encode(process.env.JWT_SECRET);
export const sign = (u) => new SignJWT(u).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(key());
export const who = async (req) => {
  const t = req.cookies.get("pan")?.value; if (!t) return null;
  try { const { payload } = await jwtVerify(t, key()); return payload; } catch { return null; }
};
export { bcrypt };
