import { Router, type IRouter } from "express";
import {
  GetMeResponse,
  LoginBody,
  LoginResponse,
  LogoutResponse,
} from "@workspace/api-zod";
import { createSession, revokeSession } from "../auth/sessions";
import { toAuthUser, validateCredentials } from "../auth/users";
import { requireAuthContext, requireAuthenticated } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res) => {
  const body = LoginBody.parse(req.body);
  const user = await validateCredentials(body.email, body.password);

  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const session = await createSession({ userId: user.id });

  const data = LoginResponse.parse({
    accessToken: session.token,
    expiresAt: session.expiresAt,
    user: toAuthUser(user),
  });

  res.json(data);
});

router.post("/auth/logout", requireAuthenticated, async (_req, res) => {
  const auth = requireAuthContext(res);
  if (!auth) {
    return;
  }

  await revokeSession(auth.token);
  const data = LogoutResponse.parse({ success: true });
  res.json(data);
});

router.get("/auth/me", requireAuthenticated, (_req, res) => {
  const auth = requireAuthContext(res);
  if (!auth) {
    return;
  }

  const data = GetMeResponse.parse({
    user: auth.user,
    expiresAt: auth.session.expiresAt,
  });

  res.json(data);
});

export default router;
