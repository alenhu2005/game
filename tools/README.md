# 開發用小工具

## `capture-scenes.mjs`

用 Playwright 開啟根目錄的 `index.html`，對各種 `game` 狀態截圖，輸出到 **`output/scene-review/`**（已列入根目錄 `.gitignore`，不進版控）。

### 使用方式

在專案根目錄：

```bash
npm install playwright
npx playwright install chromium
node tools/capture-scenes.mjs
```

需已安裝 Node.js。若 `require("playwright")` 失敗，請確認已在**專案根目錄**執行過 `npm install playwright`。
