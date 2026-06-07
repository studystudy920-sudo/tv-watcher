# プロジェクト指針

## Claude Design ⇄ Claude Code 循環ワークフロー

このリポジトリは **Claude Design と Claude Code の双方向連携の起点**として使う。
デザイン制作とコード実装を1本のループにつなげる。

### 標準フロー（6ステップ）

| # | 場所 | 作業 |
|---|------|------|
| 1 | Claude Code（このセッション） | 設計ドキュメント・ルール（`CLAUDE.md`、スタイルガイド等）を書く |
| 2 | GitHub | コミット → push（ブランチ運用） |
| 3 | Claude Design | `Import → GitHub` でこのリポジトリを選択 |
| 4 | Claude Design | 既存ルールを踏まえてデザイン作成（例：新画面、新コンポーネント） |
| 5 | Claude Design | `Export → Send to Claude Code Web` でハンドオフバンドルを送信 |
| 6 | Claude Code（このセッション） | バンドルを取り込んで実装（差分のみ反映が原則） |

### 適用できる用途

- **TV視聴管理UI**：新画面・新機能のデザイン → 実装
- **ランディングページ／告知ページ**：LP草案 → デザイン → 実装
- **ダッシュボード／統計画面**：UI仕様 → モックアップ → 実装
- **学習・教材コンテンツ**：要件 → インタラクティブプロトタイプ → 実装
- **ドキュメント・ヘルプページ**：構成案 → ビジュアル化 → 静的ページ化
- **新機能のUI設計**：既存コードベースのスタイル踏襲 → 差分実装

### ハンドオフバンドルの読み方（重要）

Claude Design から届くバンドルには必ず以下が含まれる：
- `README.md` — コーディングエージェント向けの実装指示（**最初に必ず読む**）
- `chats/*.md` — ユーザーとデザインAIの会話履歴（**意図はここに**）
- `project/CLAUDE.md` — プロジェクト固有のデザイン指針
- `project/*.html/css/js` — 実装すべき成果物
- `project/uploads/` — 元素材（PPTX、画像など）
- `project/screenshots/` — デザイン作業中のスクショ

**鉄則**：HTMLだけ見て実装しない。READMEとチャット履歴を読んで「ユーザーが本当に欲しかったもの」を理解してから実装する。

### 実装方針の判断軸

このリポジトリは **vanilla HTML/CSS/JS のフラット構成PWA** なので：

| デザインの性質 | 実装方法 |
|----------------|---------|
| 完成済みプロトタイプ（自己完結HTML/CSS/JS） | `pages/<name>/` または `assets/<name>/` に配置（ピクセルパーフェクト維持） |
| 既存UIに統合するコンポーネント | `app.js` / `style.css` に**直接追記**（既存スタイル踏襲） |
| 独立した静的ページ | リポジトリ直下に `<name>.html` として配置 |

判断に迷ったら、バンドル内の README の「Match the visual output; don't copy the prototype's internal structure unless it happens to fit」に従う。

---

## このリポジトリについて

Vanilla HTML/CSS/JS の PWA（tv-watcher）。
- `index.html` — エントリーポイント
- `app.js` — メインロジック
- `style.css` — スタイル
- `manifest.json` — PWAマニフェスト
- `sw.js` — Service Worker

ビルドツール（webpack/vite/Next.js等）は使っていない。**フレームワーク非依存の素直なPWA**として保つ。
