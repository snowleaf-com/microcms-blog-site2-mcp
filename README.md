# microcms-blog-site-mcp

ChatGPT などから microCMS（`hono-blog-app` / SnowLeaf）へ記事投稿・画像アップロードするための Remote MCP サーバーです。Cloudflare Workers 上で動きます。

## できること

| Tool | 説明 |
| --- | --- |
| `create_blog_post` | `blogs` へ記事作成（既定は下書き） |
| `upload_media` | 画像URL / base64 を microCMS メディアへアップロード |
| `list_tags` | `tags` 一覧取得（`tagId` 指定用） |

記事スキーマは既存ブログと同じです。

- `title` / `content` / `tag`（必須）
- `eyecatch`（任意。`eyecatchUrl` 省略時はデフォルト画像を自動設定）
- `publishedAt`（任意。ISO 8601。過去・未来の公開日時を指定可。下書きには指定不可）

## セットアップ

```bash
npm install
cp .dev.vars.example .dev.vars
```

`.dev.vars` に以下を設定します（`hono_blog_app/.dev.vars` と同じ microCMS 値でOK）。

```env
MICROCMS_SERVICE_DOMAIN=your-service-domain
MICROCMS_API_KEY=your-api-key
MCP_PASSWORD=任意のパスワード
DEFAULT_EYECATCH_URL=https://images.microcms-assets.io/assets/.../no_image_yoko.jpg
```

`DEFAULT_EYECATCH_URL` は省略可です。未設定の場合はコード内の既定値（既存公開記事と同じ `no_image_yoko.jpg`）を使います。

APIキーには次の権限が必要です（`hono_blog_app` の読み取り専用キーのままだと投稿できません）。

- Content API: `POST`（記事作成）
- Management API: `メディアのアップロード`

microCMS 管理画面 → APIキー設定 で上記を有効化したキーを `.dev.vars` の `MICROCMS_API_KEY` に設定してください。

### OAuth 用 KV

```bash
npx wrangler kv namespace create OAUTH_KV
```

出力された id を `wrangler.jsonc` の `kv_namespaces[0].id` に設定してください。ローカル開発だけなら preview 用の仮 id でも動作します。

## ローカル起動

```bash
npm run dev
```

MCP endpoint: `http://localhost:8787/mcp`

## デプロイ

```bash
npm run deploy
```

本番 URL 例: `https://microcms-blog-site-mcp.<account>.workers.dev/mcp`

## ChatGPT からの接続

1. ChatGPT で Developer Mode（カスタム MCP）を有効化
2. MCP サーバー URL に `https://...workers.dev/mcp` を追加
3. 認可画面で `.dev.vars` の `MCP_PASSWORD` を入力して許可

### 使い方の例

1. `upload_media` でアイキャッチ画像をアップロード
2. 返ってきた `url` を `create_blog_post` の `eyecatchUrl` に渡す
3. 必要なら本文 HTML にも同じ画像 URL を埋め込む
4. `status: "draft"` のまま作成し、microCMS 管理画面で確認

過去日付で公開する場合:

```json
{
  "title": "昔食べたカレーの話",
  "content": "<p>...</p>",
  "tagId": "wlfs4kve4",
  "status": "published",
  "publishedAt": "2024-03-15T12:00:00+09:00"
}
```

## 動作確認（MCP Inspector）

```bash
npx @modelcontextprotocol/inspector
```

Transport に Streamable HTTP、URL に `/mcp` を指定して接続します。OAuth フローでパスワード承認が必要です。
