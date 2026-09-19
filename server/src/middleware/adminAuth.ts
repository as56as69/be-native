import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const DEFAULT_ADMIN_TOKEN = "dev-admin-token";

function safeEqual(a: string, b: string): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/**
 * Minimal admin gate: compares the provided token against ADMIN_TOKEN
 * (env) with a timing-safe check. Accepts `Authorization: Bearer <t>` or
 * an `x-admin-token` header. No sessions — good enough for local ops.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_TOKEN ?? DEFAULT_ADMIN_TOKEN;
  const header = req.headers["x-admin-token"] ?? (Array.isArray(req.headers.authorization)
    ? undefined
    : (req.headers.authorization ?? "").replace(/^Bearer\s+/i, ""));
  const provided = Array.isArray(header)
    ? undefined
    : typeof header === "string" && header.length > 0
      ? header
      : undefined;

  if (!provided || !safeEqual(provided, expected)) {
    res.status(401).json({ error: "ADMIN_UNAUTHORIZED" });
    return;
  }
  next();
}