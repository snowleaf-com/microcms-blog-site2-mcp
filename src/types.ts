export const DEFAULT_EYECATCH_URL =
  "https://images.microcms-assets.io/assets/be98a728f87c41ae9463c07722e0bc60/e90ce35d1d4d466abe621b81540ec718/snowleaf-eyecatch-default.jpg";

export type MicroCmsEnv = {
  MICROCMS_SERVICE_DOMAIN: string;
  MICROCMS_API_KEY: string;
  DEFAULT_EYECATCH_URL?: string;
};

export type Env = MicroCmsEnv & {
  MCP_PASSWORD: string;
  OAUTH_KV: KVNamespace;
};

export type Tag = {
  id: string;
  name: string;
};

export type CreateBlogInput = {
  title: string;
  content: string;
  excerpt?: string;
  eyecatchUrl?: string;
  tagId?: string;
  authorId?: string;
  status?: "draft" | "published";
};
