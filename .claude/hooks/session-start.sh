#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

write_global_claude_md() {
  local target="$HOME/.claude/CLAUDE.md"
  mkdir -p "$(dirname "$target")"

  local tmp
  tmp="$(mktemp)"
  cat > "$tmp" << 'CLAUDE_MD_EOF'
# グローバル指針：Claude Design ⇄ Claude Code 循環ワークフロー

このファイルは SessionStart フックによって自動配置される。
リポジトリ横断で **Claude Design と Claude Code の双方向連携**を標準化する。

## 標準フロー（6ステップ）

| # | 場所 | 作業 |
|---|------|------|
| 1 | Claude Code（このセッション） | 設計ドキュメント・ルール（`CLAUDE.md`、スタイルガイド等）を書く |
| 2 | GitHub | コミット → push（ブランチ運用） |
| 3 | Claude Design | `Import → GitHub` でリポジトリを選択 |
| 4 | Claude Design | 既存ルールを踏まえてデザイン作成 |
| 5 | Claude Design | `Export → Send to Claude Code Web` でハンドオフバンドルを送信 |
| 6 | Claude Code（このセッション） | バンドルを取り込んで実装（差分のみ反映が原則） |

## 適用できる用途（任意のリポジトリで）

- スライド資料（CAMS等の試験対策、社内研修資料）
- ランディングページ／マーケサイト
- ダッシュボード／管理画面
- 学習用Webアプリ
- ドキュメントサイト
- 新機能のUI設計（既存コードベースのスタイル踏襲）

## ハンドオフバンドルの読み方（鉄則）

Claude Design から届くバンドルには必ず以下が含まれる：

- `README.md` — コーディングエージェント向けの実装指示（**最初に必ず読む**）
- `chats/*.md` — ユーザーとデザインAIの会話履歴（**意図はここに**）
- `project/CLAUDE.md` — プロジェクト固有のデザイン指針
- `project/*.html/css/js` — 実装すべき成果物
- `project/uploads/` — 元素材（PPTX、画像など）
- `project/screenshots/` — デザイン作業中のスクショ

**HTMLだけ見て実装しない。READMEとチャット履歴を読んで「ユーザーが本当に欲しかったもの」を理解してから実装する。**

## 実装方針の判断軸

| デザインの性質 | 実装方法 |
|----------------|---------|
| 完成済みプロトタイプ（自己完結HTML/CSS/JS） | 静的アセットとして配置（ピクセルパーフェクト維持） |
| Reactコンポーネント化が自然なUI | フレームワークで再構築（既存スタイル踏襲） |
| 既存UIに統合するコンポーネント | 既存ファイルに直接追記（既存スタイル踏襲） |
| 単一ページ | ルートまたはトップレベルに配置 |

**判断に迷ったら**：バンドル内 README の「Match the visual output; don't copy the prototype's internal structure unless it happens to fit」に従う。

## リポジトリ固有の指針

各リポジトリのルートに `CLAUDE.md` がある場合、**そちらが優先**される。
このグローバル指針はリポジトリ固有のルールがない場合のフォールバック。
CLAUDE_MD_EOF

  if [ -f "$target" ] && cmp -s "$tmp" "$target"; then
    rm -f "$tmp"
  else
    mv "$tmp" "$target"
    echo "[session-start] Updated $target" >&2
  fi
}

write_global_claude_md

if [ -f package.json ]; then
  npm install --no-audit --no-fund --loglevel=error >&2 || true
fi
