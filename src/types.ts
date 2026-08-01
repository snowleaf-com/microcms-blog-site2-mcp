export type MicroCmsEnv = {
  MICROCMS_SERVICE_DOMAIN: string;
  MICROCMS_API_KEY: string;
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
