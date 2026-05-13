# Snake Game

一個使用 React 和 Canvas 打造的經典貪食蛇遊戲，具備現代化的介面設計與流暢的遊戲體驗。

## 功能特色

- 經典貪食蛇遊戲邏輯
- 現代化 UI 設計
- 鍵盤控制（方向鍵）
- 暫停/繼續功能
- 分數記錄與最高分儲存
- 響應式設計

## 本地運行

**前置條件：** Node.js

1. 安裝依賴：
   ```bash
   npm install
   ```

2. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

3. 開啟瀏覽器訪問 `http://localhost:3000`

## 建置

```bash
npm run build
```

## 部署到GitHub Pages

專案已配置GitHub Actions自動部署到GitHub Pages。

1. 在GitHub repo設定中，前往 "Pages" 頁面
2. 將Source設定為 "Deploy from a branch"
3. 選擇 "gh-pages" 分支和 "/ (root)" 資料夾
4. 推送程式碼到main分支，Actions會自動建置並部署
5. 遊戲將可在 `https://asia17242.github.io/Snake_01/` 訪問

## 遊戲控制

- **方向鍵**：控制蛇的移動方向
- **空白鍵**：暫停/繼續遊戲
- **Enter鍵**：遊戲結束後重新開始

## 技術棧

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Motion (動畫)
