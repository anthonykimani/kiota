import { Request, Response, NextFunction } from "express";

type AuthPayload = {
  userId: string;
  iat: number;
  exp: number;
};

export function requireInternalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      status: 401,
      message: "Unauthorized",
      data: null,
      errors: ["Authorization header required"],
    });
  }

  const token = authHeader.slice(7);

  let payload: AuthPayload;
  try {
    payload = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
  } catch {
    return res.status(401).json({
      status: 401,
      message: "Unauthorized",
      data: null,
      errors: ["Invalid token format"],
    });
  }

  if (!payload?.userId || !payload?.exp) {
    return res.status(401).json({
      status: 401,
      message: "Unauthorized",
      data: null,
      errors: ["Invalid token payload"],
    });
  }

  if (Date.now() > payload.exp) {
    return res.status(401).json({
      status: 401,
      message: "Unauthorized",
      data: null,
      errors: ["Token expired"],
    });
  }

  // Attach to request
  (req as any).userId = payload.userId;

  next();
}
