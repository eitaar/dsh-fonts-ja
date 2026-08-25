# コントリビューションガイド

このリポジトリでは、DeepSeek Harness の UI・チャット・コードフォントを安全に配布できる形で改善します。大きな変更を始める前に Issue で目的と互換性への影響を共有してください。

## 開発環境

```sh
npm install
npm run check
```

`lib/client.js` は生成物です。`lib/client.tpl.js`、`scripts/font-config.mjs`、`data/presets.json` を変更したら、リポジトリのルートで次を実行して生成物を更新します。

```sh
npm run generate
npm run check
```

## フォントを追加・更新する

1. 再配布が許可されたフォントだけを `data/fonts/` に追加します。OFL 1.1、Apache-2.0 などのライセンスを確認し、フォント単体の販売を制限する条項や予約フォント名なども尊重してください。
2. フォントファイルと同じディレクトリに完全なライセンス本文を置きます。既存の命名に合わせて `LICENSE-<font>-OFL.txt` のようにし、`LICENSE-FONTS.md` に作者・配布元・ライセンスを追記します。
3. WOFF2 のファイル名は安全な単一 basename（`A-Za-z0-9`、`.`、`_`、`-`）にし、`data/presets.json` の `faces` に `family`、`weight`、`file` を登録します。`file` は `data/fonts/` 内のファイル名だけを指定します。
4. UI・チャット・コードのどの役割で使うかをスタックにも追加します。日本語用プリセットでは、同梱フォントの後ろに端末依存のフォールバックを残してください。
5. 新しいプリセットを追加した場合は、`lib/client.tpl.js` の zh/en/ja 辞書に `font.<id>` の表示名を追加します。
6. `npm run generate` で `lib/client.js` を更新し、テストとパッケージ内容を確認します。

### Noto Sans JP の扱い

このフォークには Noto CJK の日本語 Regular を `noto-sans-jp-400-normal.woff2` として同梱しています。元データは [notofonts/noto-cjk](https://github.com/notofonts/noto-cjk) の公式配布物を使い、`data/fonts/LICENSE-noto-sans-jp-OFL.txt` の SIL Open Font License 1.1 を必ず一緒に配布します。

Noto Sans JP は日本語グリフを広く含むため、Latin サブセットよりファイルサイズが大きくなります。不要な重みや重複したサブセットを追加せず、変更時は `npm pack --dry-run` でパッケージサイズと同梱ファイルを確認してください。

Windows/macOS に付属する Yu Gothic、Meiryo、Hiragino などのシステムフォントは、ライセンスを確認せずバイナリ化して同梱しないでください。プリセットのフォールバック名として列挙するだけにします。

## 動作確認

変更前後で次を実行してください。

```sh
npm run check
npm pack --dry-run
git diff --check
```

プリセット変更では、少なくとも次を手動でも確認します。

- 日本語ゴシックで UI とチャット本文の両方に Noto Sans JP が適用される
- 日本語明朝（チャット）で UI とチャット本文が別のスタックになる
- デフォルトへ戻すとシステムフォントへ復元される
- リロード後も選択状態が保持される

## プルリクエスト

- 変更理由と対象ロール（UI / chat / code）を説明する
- フォントファイル、ライセンス本文、帰属表記、プリセット、生成物を同じ変更に含める
- `npm run check` の結果と、フォントを実際に表示した環境を記載する
- 生成された `lib/client.js` を手編集していないことを確認する

不明なライセンスや配布元がある場合は、ファイルをコミットする前に Issue で相談してください。
