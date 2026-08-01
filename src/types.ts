export const DEFAULT_EYECATCH_URL =
  "https://images.microcms-assets.io/assets/be98a728f87c41ae9463c07722e0bc60/41d55133950e49c081c39614d9a72c4f/no_image_yoko.jpg";

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
  tagId: string;
  eyecatchUrl?: string;
  status?: "draft" | "published";
  /**
   * 公開日時（ISO 8601）。過去・未来いずれも指定可。
   * 下書きには指定できないため、指定時は公開として作成する。
   */
  publishedAt?: string;
};
