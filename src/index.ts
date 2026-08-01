import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { createMcpHandler } from "agents/mcp/server";
import { AuthHandler } from "./auth";
import { createServer } from "./mcp";
import type { Env } from "./types";

const apiHandler = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const handler = createMcpHandler(() => createServer(env));
    return handler(request, env, ctx);
  }
};

export default new OAuthProvider({
  apiRoute: "/mcp",
  apiHandler,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
  defaultHandler: {
    async fetch(request: Request, env: Env, ctx: ExecutionContext) {
      return AuthHandler.fetch(request, env, ctx);
    }
  }
});
