import { createClient, createManagementClient } from "microcms-js-sdk";
import {
  DEFAULT_EYECATCH_URL,
  type CreateBlogInput,
  type MicroCmsEnv,
  type Tag
} from "./types";

function normalizeServiceDomain(value?: string) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim().replace(/\/+$/, "");

  if (/^[a-z0-9-]+$/i.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(
    /^(?:https?:\/\/)?([a-z0-9-]+)\.microcms(?:-management)?\.io$/i
  );
  if (match) {
    return match[1];
  }

  return undefined;
}

function requireConfig(env: MicroCmsEnv) {
  const serviceDomain = normalizeServiceDomain(env.MICROCMS_SERVICE_DOMAIN);
  const apiKey = env.MICROCMS_API_KEY?.trim();

  if (!serviceDomain || !apiKey) {
    throw new Error(
      "MICROCMS_SERVICE_DOMAIN と MICROCMS_API_KEY を設定してください"
    );
  }

  return { serviceDomain, apiKey };
}

export function createContentClient(env: MicroCmsEnv) {
  const { serviceDomain, apiKey } = requireConfig(env);
  return createClient({ serviceDomain, apiKey });
}

export function createMediaClient(env: MicroCmsEnv) {
  const { serviceDomain, apiKey } = requireConfig(env);
  return createManagementClient({ serviceDomain, apiKey });
}

export async function listTags(env: MicroCmsEnv) {
  const client = createContentClient(env);
  const data = await client.getList<Tag>({
    endpoint: "tags",
    queries: {
      limit: 100,
      orders: "name"
    }
  });
  return data.contents;
}

export async function uploadMedia(
  env: MicroCmsEnv,
  input: {
    imageUrl?: string;
    base64Data?: string;
    filename?: string;
    mimeType?: string;
  }
) {
  const client = createMediaClient(env);

  if (input.imageUrl) {
    return client.uploadMedia({
      data: input.imageUrl,
      name: input.filename
    });
  }

  if (!input.base64Data) {
    throw new Error("imageUrl または base64Data のどちらかが必要です");
  }

  const base64 = input.base64Data.replace(/^data:[^;]+;base64,/, "");
  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const mimeType = input.mimeType || "image/png";
  const filename = input.filename || `upload-${Date.now()}.png`;

  return client.uploadMedia({
    data: new Blob([binary], { type: mimeType }),
    name: filename
  });
}

function normalizePublishedAt(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error(
      "publishedAt は ISO 8601 形式で指定してください（例: 2024-01-01T12:00:00+09:00）"
    );
  }

  return date.toISOString();
}

export async function createBlogPost(env: MicroCmsEnv, input: CreateBlogInput) {
  const client = createContentClient(env);
  const publishedAt = normalizePublishedAt(input.publishedAt);
  const isDraft = input.status !== "published" && !publishedAt;

  if (publishedAt && input.status === "draft") {
    throw new Error(
      "publishedAt は下書きには指定できません。status を published にするか省略してください"
    );
  }

  const content: Record<string, unknown> = {
    title: input.title,
    content: input.content,
    tag: input.tagId,
    eyecatch:
      input.eyecatchUrl?.trim() ||
      env.DEFAULT_EYECATCH_URL?.trim() ||
      DEFAULT_EYECATCH_URL
  };

  if (publishedAt) {
    content.publishedAt = publishedAt;
  }

  const result = await client.create({
    endpoint: "blogs",
    content,
    isDraft
  });

  return {
    ...result,
    publishedAt,
    status: isDraft ? ("draft" as const) : ("published" as const)
  };
}
