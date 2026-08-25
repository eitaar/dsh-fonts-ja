<div align="center">

# dsh-fonts-ja

**DeepSeek Harness のフォントシステムプラグイン** — UI・チャット・コードを個別に切り替え、OFLフォントをオフラインで配布します。

[![GitHub stars](https://img.shields.io/github/stars/eitaar/dsh-fonts-ja)](https://github.com/eitaar/dsh-fonts-ja/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/eitaar/dsh-fonts-ja)](https://github.com/eitaar/dsh-fonts-ja/issues)
[![License](https://img.shields.io/github/license/eitaar/dsh-fonts-ja)](./LICENSE)

[English](./README.en.md) | [中文](./README.cn.md) | 日本語

</div>

## 概要

DeepSeek Harness の Web UI は標準ではシステムフォントを使います。このフォークは日本語表示とチャット本文の切り替えを重視し、次の3つの役割を独立して設定できます。

- **UI** — 設定画面やアプリケーションの外枠
- **チャット** — メッセージ本文と Markdown の文章
- **コード** — コードブロック

標準プリセットには JetBrains Mono + Inter、Fira Code + IBM Plex Sans、Cascadia Code、そして日本語用の Noto Sans JP Regular が含まれます。フォントファイルはプラグインに同梱されるため、外部CDNへのアクセスなしで利用できます。

## インストール

```sh
# GitHub
dsh plugin --profile web add github:eitaar/dsh-fonts-ja

# ローカルディレクトリ（pnpm workspace のルートとして -w が必要）
dsh plugin --profile web add -w /path/to/dsh-fonts-ja

# npm
dsh plugin --profile web add dsh-fonts-ja
```

インストール後に `dsh web` を再起動し、**設定 → 一般 → フォント**を開いてください。

## 日本語プリセット

- **日本語ゴシック** — UI とチャットに同梱の Noto Sans JP Regular を優先し、コードには日本語対応の等幅フォント候補を使います。
- **日本語明朝（チャット）** — UI は Noto Sans JP のゴシック体、チャット本文は Yu Mincho / Hiragino Mincho / Noto Serif JP などの明朝体候補、コードは等幅フォントです。

「デフォルト」を選ぶとシステムフォントスタックに戻ります。端末に候補フォントがない場合は、スタックの次の候補へ自動的にフォールバックします。

## カスタムフォント

設定行の編集欄で UI・チャット・コードごとにフォントを追加できます。

| ソース | 説明 |
| --- | --- |
| インストール済みフォント | フォントファミリー名だけを入力します。フォントファイルはダウンロードしません。 |
| リモート WOFF2 | `.woff2` で終わる `http(s)` の直リンクを指定します。URLにユーザー名・パスワードを含めることはできません。 |
| ウェイト | フォントファイル本来の太さを指定します。Regular=400、Medium=500、Semibold=600、Bold=700 が目安です。 |

リモートフォントを使うと、ブラウザーが指定先へ接続するため、IPアドレスやリクエスト時刻などが相手に伝わる場合があります。信頼できる配布元を使うか、同梱プリセット・インストール済みフォントを選んでください。

## 開発

`lib/client.js` は `lib/client.tpl.js` と `data/presets.json` から生成されます。生成物を直接編集せず、次を実行してください。

```sh
npm run check
```

日本語の開発手順は [CONTRIBUTING.ja.md](./CONTRIBUTING.ja.md) を参照してください。

## ライセンス

プラグインのソースコードと改変部分は [MIT License](./LICENSE) です。`data/fonts/` に同梱するフォントは個別のライセンスに従います。

Noto Sans JP は [Noto CJK](https://github.com/notofonts/noto-cjk) の日本語配布物をWOFF2化したものです。プリセットではCSS上のファミリー名として `Noto Sans JP` を使いますが、フォント内部のメタデータは上流の `Noto Sans CJK JP` を保持しています。[SIL Open Font License 1.1](./data/fonts/LICENSE-noto-sans-jp-OFL.txt) で配布し、すべてのフォントの帰属とライセンス本文は [LICENSE-FONTS.md](./LICENSE-FONTS.md) と `data/fonts/LICENSE-*.txt` に記載しています。

## API

他のプラグインは `ctx.get("fonts")` からフォントレジストリを取得し、プリセットを登録・購読できます。型定義は `lib/types/client/index.d.ts` にあります。

```ts
const dispose = ctx.get("fonts")?.register({
  id: "my-preset",
  ui: ["My Font", "sans-serif"],
  chat: ["My Chat Font", "serif"],
  code: ["My Mono", "monospace"],
  faces: [{ family: "My Font", weight: "400", src: ["https://example.com/my-font.woff2"] }],
});
```

## 謝辞

DeepSeek Harness のプラグイン機構、[zhijun-dai/dsh-Fonts](https://github.com/zhijun-dai/dsh-Fonts) の実装、各フォントプロジェクトの作者に感謝します。

<div align="center">

**dsh-fonts-ja** · Fork of [zhijun-dai/dsh-Fonts](https://github.com/zhijun-dai/dsh-Fonts) · [MIT License](./LICENSE)

</div>
