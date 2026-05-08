# Game File Layout

使用方式（如何開啟、鍵位、觸控操作、部署、聲音／語音開關）請先看根目錄 **`README.md`**（完整說明）。

這個遊戲目前以 `index.html` 依序載入 `game/split` 內的拆分檔案，仍維持一般 `<script>` 的同一個 global scope，避免一次大改成 ES modules 造成既有全域狀態失效。

- `split/part-01.core.js`：核心常數、共用狀態、素材、音效與 **語音旁白開關**（`audio.narrationEnabled`）、關卡工廠、彈弓階段物理（Matter）、過場與場景轉換相關共用函式。
- `split/part-02.stage.js`：Stage 1 / Boss 戰流程、Boss 動畫與過場、世界更新、`stage2Outro` 等狀態機銜接。
- `split/part-03.render-loop.js`：畫面繪製、彈弓場景 UI、測試跳關、主迴圈與多數 cutscene 繪製。
- `split/part-04.input-boot.js`：鍵盤、滑鼠、手機觸控、影片事件、啟動流程。

載入順序很重要：後面的檔案會使用前面宣告好的函式與狀態。根目錄不再保留舊的整包 `game.js`，避免之後維護時改錯檔案。
