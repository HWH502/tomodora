# 番茄鐘

一個會養寵物的番茄鐘網頁 App。

專心工作 25 分鐘、休息一下，這是一般的番茄鐘。這個 App 多了一件事：你每完成一個工作時段，就會賺到金錢和技能點，還能養一隻寵物——牠會隨著你累積的專注時間慢慢長大。

用 React + Vite 打造，**不需要後端**，所有設定與進度都存在瀏覽器的 localStorage 裡。

## 開發

```bash
npm install
npm run dev     # 啟動開發伺服器
npm test        # 跑自動化測試
npm run build   # 打包
```

## 文件地圖

每份文件只負責一件事，需要什麼看什麼：

| 我想知道… | 看這份 |
|---|---|
| **現在做到哪了？能用了嗎？** | [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) |
| 這個 App 最終想變成什麼樣子 | [`docs/ROADMAP.md`](./docs/ROADMAP.md) |
| 寵物系統要分哪幾階段做、下一步做什麼 | [`docs/PET_SYSTEM_ROADMAP.md`](./docs/PET_SYSTEM_ROADMAP.md) |
| 已經談定的遊戲規則與數字（動工時照著實作） | [`docs/specs/`](./docs/specs/) |
| 已經做過什麼、當時為什麼那樣決定 | [`docs/HISTORY.md`](./docs/HISTORY.md) |
| 改完東西要人工測哪些 | [`docs/TEST_CHECKLIST.md`](./docs/TEST_CHECKLIST.md) |
| 寵物圖要怎麼畫、存哪裡 | [`src/assets/pets/STYLE_GUIDE.md`](./src/assets/pets/STYLE_GUIDE.md) |

## 專案結構

```
src/
  utils/       純規則與資料存取（沒有畫面，最好測）
  hooks/       把規則接上 React 狀態
  components/  畫面
  assets/pets/ 寵物圖片素材（依 物種/品種/成長階段 分類）
docs/          規劃、規格、歷史
```

每個 `utils`／`hooks`／`components` 檔案都有同名的 `.test.js(x)` 測試檔。
