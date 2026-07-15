/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { verifyToken } from "../utils/jwt.js";

/**
 * Verifies the Bearer JWT on the request and attaches the decoded
 * payload to req.user. Rejects with 401 if missing/invalid/expired.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session token." });
  }
}

/**
 * Restricts a route to one or more roles. Must run after requireAuth.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    return next();
  };
}
