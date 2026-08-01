import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createBlogPost, listTags, uploadMedia } from "./microcms";
import type { Env } from "./types";

function textResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2)
      }
    ]
  };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true
  };
}

export function createServer(env: Env) {
  const server = new McpServer({
    name: "microcms-blog-site-mcp",
    version: "0.1.0"
  });

  server.registerTool(
    "list_tags",
    {
      description:
        "microCMS の tags API からタグ一覧を取得します。記事作成時の tagId 指定に使います。",
      inputSchema: z.object({})
    },
    async () => {
      try {
        const tags = await listTags(env);
        return textResult(tags);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "upload_media",
    {
      description:
        "画像を microCMS メディアへアップロードします。公開画像URL、または base64 データを渡せます。返ってきた url を create_blog_post の eyecatchUrl や本文HTMLに使えます。",
      inputSchema: z.object({
        imageUrl: z
          .string()
          .url()
          .optional()
          .describe("ダウンロードしてアップロードする画像URL"),
        base64Data: z
          .string()
          .optional()
          .describe("画像の base64（data URL 可）"),
        filename: z.string().optional().describe("保存ファイル名"),
        mimeType: z
          .string()
          .optional()
          .describe("base64Data 利用時の MIME type（例: image/png）")
      })
    },
    async ({ imageUrl, base64Data, filename, mimeType }) => {
      try {
        if (!imageUrl && !base64Data) {
          return errorResult("imageUrl または base64Data を指定してください");
        }
        const result = await uploadMedia(env, {
          imageUrl,
          base64Data,
          filename,
          mimeType
        });
        return textResult(result);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "create_blog_post",
    {
      description:
        "microCMS の blogs エンドポイントへ記事を作成します。tagId は必須です（先に list_tags で取得）。デフォルトは下書き。eyecatchUrl 省略時は既存記事と同じデフォルト画像を設定します。",
      inputSchema: z.object({
        title: z.string().min(1).describe("記事タイトル"),
        content: z
          .string()
          .min(1)
          .describe("本文（HTML）。画像は upload_media の url を img で埋め込めます"),
        tagId: z
          .string()
          .min(1)
          .describe("必須。tags API のコンテンツID（list_tags で取得）"),
        eyecatchUrl: z
          .string()
          .url()
          .optional()
          .describe("アイキャッチ画像URL（microCMS メディアURL）"),
        status: z
          .enum(["draft", "published"])
          .optional()
          .describe("draft（既定）または published")
      })
    },
    async (input) => {
      try {
        const result = await createBlogPost(env, input);
        return textResult({
          id: result.id,
          status: input.status === "published" ? "published" : "draft",
          message: "記事を作成しました"
        });
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  return server;
}
