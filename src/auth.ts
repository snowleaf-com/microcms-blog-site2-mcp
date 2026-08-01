import type {
  AuthRequest,
  OAuthHelpers
} from "@cloudflare/workers-oauth-provider";
import { Hono } from "hono";
import type { Env } from "./types";

type AuthEnv = Env & {
  OAUTH_PROVIDER: OAuthHelpers;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const app = new Hono<{ Bindings: AuthEnv }>();

app.get("/", (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>microCMS Blog MCP</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 720px; margin: 48px auto; padding: 0 20px; line-height: 1.6; color: #172033; }
      code, .endpoint { background: #f3f5f9; padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      .endpoint { display: block; padding: 10px 12px; margin: 8px 0; }
    </style>
  </head>
  <body>
    <h1>microCMS Blog MCP</h1>
    <p>ChatGPT などから microCMS へ記事投稿・画像アップロードするための Remote MCP サーバーです。</p>
    <h2>Endpoints</h2>
    <div class="endpoint">/mcp</div>
    <div class="endpoint">/authorize</div>
    <div class="endpoint">/token</div>
    <div class="endpoint">/register</div>
  </body>
</html>`);
});

app.get("/authorize", async (c) => {
  const oauthReqInfo = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw);
  const clientInfo = await c.env.OAUTH_PROVIDER.lookupClient(
    oauthReqInfo.clientId
  );

  if (!clientInfo) {
    return c.text("Invalid client_id", 400);
  }

  const clientName = escapeHtml(clientInfo.clientName || "MCP Client");
  const clientId = escapeHtml(clientInfo.clientId);
  const scopes = escapeHtml(oauthReqInfo.scope.join(", ") || "none");
  const state = btoa(JSON.stringify(oauthReqInfo));

  return c.html(`<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Authorize ${clientName}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 560px; margin: 48px auto; padding: 0 20px; color: #172033; }
      .card { border: 1px solid #d9dee8; border-radius: 12px; padding: 28px; box-shadow: 0 8px 24px rgba(23,32,51,0.06); }
      .meta { background: #f5f7fb; border-radius: 8px; padding: 14px; margin: 18px 0; }
      label { display: block; font-weight: 600; margin-bottom: 6px; }
      input[type="password"] { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #c9d1de; border-radius: 8px; font-size: 16px; }
      .actions { display: flex; gap: 10px; margin-top: 20px; }
      button { flex: 1; padding: 12px 16px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
      .approve { background: #1f6feb; color: white; }
      .deny { background: #eef1f6; color: #334155; }
      .error { color: #b42318; margin-top: 12px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>認可リクエスト</h1>
      <p><strong>${clientName}</strong> が microCMS Blog MCP へのアクセスを要求しています。</p>
      <div class="meta">
        <p><strong>Client ID:</strong> ${clientId}</p>
        <p><strong>Scopes:</strong> ${scopes}</p>
      </div>
      <form method="POST" action="/authorize">
        <input type="hidden" name="state" value="${state}" />
        <label for="password">MCP パスワード</label>
        <input id="password" name="password" type="password" required autocomplete="current-password" />
        <div class="actions">
          <button type="button" class="deny" onclick="history.back()">キャンセル</button>
          <button type="submit" class="approve">許可する</button>
        </div>
      </form>
    </div>
  </body>
</html>`);
});

app.post("/authorize", async (c) => {
  const formData = await c.req.formData();
  const state = formData.get("state");
  const password = formData.get("password");

  if (!state || typeof state !== "string") {
    return c.text("Missing state parameter", 400);
  }

  if (
    typeof password !== "string" ||
    !c.env.MCP_PASSWORD ||
    password !== c.env.MCP_PASSWORD
  ) {
    return c.text("パスワードが正しくありません", 401);
  }

  let oauthReqInfo: AuthRequest;
  try {
    oauthReqInfo = JSON.parse(atob(state)) as AuthRequest;
  } catch {
    return c.text("Invalid state parameter", 400);
  }

  const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
    request: oauthReqInfo,
    userId: "owner",
    metadata: {
      label: "microCMS Blog MCP",
      clientName:
        (await c.env.OAUTH_PROVIDER.lookupClient(oauthReqInfo.clientId))
          ?.clientName || "Unknown Client"
    },
    scope: oauthReqInfo.scope,
    props: {
      userId: "owner"
    }
  });

  return c.redirect(redirectTo, 302);
});

export { app as AuthHandler };
