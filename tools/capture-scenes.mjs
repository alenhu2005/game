import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error("請先安裝 Playwright：npm install playwright && npx playwright install chromium");
  process.exit(1);
}

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "output", "scene-review");
const PAGE_URL = pathToFileURL(path.join(ROOT, "index.html")).href;

const VIEWPORT = { width: 1400, height: 900 };

const SCENES = [
  {
    id: "01-intro-start",
    note: "開始畫面",
    setup: () => {
      game.state = "intro";
      game.overlayTimer = 0;
      game.overlayText = "";
    },
  },
  {
    id: "02-prologue-dark-age",
    note: "開場動畫：暗黑時代",
    setup: () => {
      startStageOneRun();
      game.prologueTimer = PROLOGUE_TOTAL_FRAMES * 0.08;
    },
  },
  {
    id: "03-prologue-rival-pressure",
    note: "開場動畫：兩強擠壓",
    setup: () => {
      startStageOneRun();
      game.prologueTimer = PROLOGUE_TOTAL_FRAMES * 0.28;
    },
  },
  {
    id: "04-prologue-formula-sealed",
    note: "開場動畫：200P 被封印",
    setup: () => {
      startStageOneRun();
      game.prologueTimer = PROLOGUE_TOTAL_FRAMES * 0.52;
    },
  },
  {
    id: "05-prologue-mission",
    note: "開場動畫：逆襲任務",
    setup: () => {
      startStageOneRun();
      game.prologueTimer = PROLOGUE_TOTAL_FRAMES * 0.7;
    },
  },
  {
    id: "06-prologue-controls",
    note: "開場動畫：操作提示",
    setup: () => {
      startStageOneRun();
      game.prologueTimer = PROLOGUE_TOTAL_FRAMES * 0.92;
    },
  },
  {
    id: "07-stage-card-phase-1",
    note: "第一關黑幕卡",
    setup: () => {
      startStageOneRun();
      startPrologueStageCard();
      game.prologueStageCardTimer = PROLOGUE_STAGE_CARD_FRAMES * 0.52;
    },
  },
  {
    id: "08-stage-1-sling-intro",
    note: "第一關起始",
    setup: () => {
      enterStageTwo();
      game.state = "stage2Intro";
      game.overlayTimer = 0;
      game.overlayText = "";
    },
  },
  {
    id: "09-stage-1-sling-aim",
    note: "第一關拉彈弓",
    setup: () => {
      enterStageTwo();
      game.state = "stage2Playing";
      const stageTwo = game.stageTwo;
      stageTwo.dragging = true;
      stageTwo.projectile.state = "dragging";
      stageTwo.projectile.x = stageTwo.sling.x - 126;
      stageTwo.projectile.y = stageTwo.sling.y + 46;
      stageTwo.dragPoint = { x: stageTwo.projectile.x, y: stageTwo.projectile.y };
      game.overlayTimer = 0;
      game.overlayText = "";
    },
  },
  {
    id: "10-bridge-impact",
    note: "第一關結尾：命中特寫",
    setup: () => {
      enterStageTwo();
      game.stageTwo.lastImpactX = 768;
      game.stageTwo.lastImpactY = 276;
      startStageTwoToBossCutscene(game.stageTwo);
      game.stageTwoOutro.timer = 146;
    },
  },
  {
    id: "11-bridge-smoke",
    note: "第一關結尾：煙霧殘場",
    setup: () => {
      enterStageTwo();
      game.stageTwo.lastImpactX = 768;
      game.stageTwo.lastImpactY = 276;
      startStageTwoToBossCutscene(game.stageTwo);
      game.stageTwoOutro.timer = 280;
    },
  },
  {
    id: "12-bridge-run",
    note: "第一關結尾：主角衝出廢墟",
    setup: () => {
      enterStageTwo();
      game.stageTwo.lastImpactX = 768;
      game.stageTwo.lastImpactY = 276;
      startStageTwoToBossCutscene(game.stageTwo);
      game.stageTwoOutro.timer = 420;
    },
  },
  {
    id: "13-bridge-look-up",
    note: "第一關結尾：塔下仰望",
    setup: () => {
      enterStageTwo();
      game.stageTwo.lastImpactX = 768;
      game.stageTwo.lastImpactY = 276;
      startStageTwoToBossCutscene(game.stageTwo);
      game.stageTwoOutro.timer = 680;
    },
  },
  {
    id: "14-bridge-climb",
    note: "第一關結尾：孤膽登頂",
    setup: () => {
      enterStageTwo();
      game.stageTwo.lastImpactX = 768;
      game.stageTwo.lastImpactY = 276;
      startStageTwoToBossCutscene(game.stageTwo);
      game.stageTwoOutro.timer = 960;
    },
  },
  {
    id: "15-bridge-black-card",
    note: "第二關黑幕卡",
    setup: () => {
      enterStageTwo();
      game.stageTwo.lastImpactX = 768;
      game.stageTwo.lastImpactY = 276;
      startStageTwoToBossCutscene(game.stageTwo);
      game.stageTwoOutro.timer = STAGE_TWO_OUTRO_TOTAL_FRAMES - 72;
    },
  },
  {
    id: "16-boss-arrival",
    note: "第二關進場：塔下喘氣",
    setup: () => {
      enterBossStageFromSlingshot();
      game.bossArrivalScene.phase = "pant";
      game.bossArrivalScene.phaseTimer = 24;
      game.player.x = game.bossArrivalScene.walkToX;
      game.player.prevX = game.player.x;
      game.player.prevY = game.player.y;
      game.cameraX = clamp(game.player.x - WIDTH * 0.28, 0, level.worldWidth - WIDTH);
      game.overlayTimer = 0;
      game.overlayText = "";
    },
  },
  {
    id: "17-boss-dialogue-redbull",
    note: "第二關對話：Bluebull 開場",
    setup: () => {
      enterBossStageFromSlingshot();
      game.state = "running";
      game.bossArrivalScene = null;
      game.player.x = 3528;
      game.player.prevX = game.player.x;
      game.cameraX = clamp(game.player.x - WIDTH * 0.24, 0, level.worldWidth - WIDTH);
      game.bossCutscene = {
        active: true,
        phase: "exchangeTalk",
        timer: 84,
        talkIdx: 0,
        lineHold: BOSS_INTRO_LINE_HOLD_FRAMES - 128,
        bounceWho: "boss",
        bounceTicks: 10,
        videoStarted: false,
        videoPlaying: false,
      };
    },
  },
  {
    id: "18-boss-battle-redbull",
    note: "第二關戰鬥：Bluebull 型態",
    setup: () => {
      enterBossStageFromSlingshot();
      game.state = "running";
      game.bossArrivalScene = null;
      game.bossCutscene = null;
      level.bossEngaged = true;
      const boss = getStageOneBoss();
      game.player.x = 3468;
      game.player.prevX = game.player.x;
      game.player.y = FLOOR_Y - game.player.h;
      game.player.prevY = game.player.y;
      game.player.vx = 0;
      game.player.vy = 0;
      boss.x = 3868;
      boss.y = FLOOR_Y - boss.h;
      boss.vx = -1.2;
      boss.brand = "redbull";
      boss.phase = "charge";
      boss.chargeTimer = 18;
      boss.transformTimer = 0;
      game.cameraX = clamp(game.player.x - WIDTH * 0.22, 0, level.worldWidth - WIDTH);
      game.overlayTimer = 0;
      game.overlayText = "";
    },
  },
  {
    id: "19-boss-phase-shift",
    note: "第二關對話：魔瓜接手",
    setup: () => {
      enterBossStageFromSlingshot();
      game.state = "running";
      game.bossArrivalScene = null;
      game.player.x = 3528;
      game.player.prevX = game.player.x;
      game.cameraX = clamp(game.player.x - WIDTH * 0.24, 0, level.worldWidth - WIDTH);
      const boss = getStageOneBoss();
      boss.brand = "redbull";
      boss.phase = "transform";
      boss.transformTimer = 40;
      boss.transformTotal = BOSS_PHASE_SHIFT_FRAMES;
      boss.transformFromBrand = "redbull";
      boss.transformToBrand = "monster";
      game.bossCutscene = {
        active: true,
        phase: "phaseShift",
        timer: 92,
        talkIdx: 0,
        lineHold: 0,
        bounceWho: "boss",
        bounceTicks: 10,
        videoStarted: false,
        videoPlaying: false,
      };
    },
  },
  {
    id: "20-boss-battle-monster",
    note: "第二關戰鬥：魔瓜型態",
    setup: () => {
      enterBossStageFromSlingshot();
      game.state = "running";
      game.bossArrivalScene = null;
      game.bossCutscene = null;
      level.bossEngaged = true;
      const boss = getStageOneBoss();
      game.player.x = 3500;
      game.player.prevX = game.player.x;
      game.player.y = FLOOR_Y - game.player.h;
      game.player.prevY = game.player.y;
      boss.x = 3864;
      boss.y = FLOOR_Y - boss.h - 12;
      boss.vx = -0.6;
      boss.brand = "monster";
      boss.phase = "shoot";
      boss.actionTimer = 12;
      boss.transformTimer = 0;
      boss.hp = Math.min(boss.maxHp || 5, 3);
      game.cameraX = clamp(game.player.x - WIDTH * 0.22, 0, level.worldWidth - WIDTH);
      game.overlayTimer = 0;
      game.overlayText = "";
    },
  },
  {
    id: "21-ending-rescue",
    note: "結尾動畫：救回 200P",
    setup: () => {
      startEndingRescueScene();
      game.endingScene.timer = 316;
    },
  },
  {
    id: "22-result-retry",
    note: "失敗結算",
    setup: () => {
      game.stage = 1;
      game.state = "gameover";
      game.stageTwo = null;
      game.winFx = null;
      game.coins = 0;
      game.deaths = 5;
      game.elapsed = 36.3;
      game.overlayTimer = 0;
      game.overlayText = "";
    },
  },
  {
    id: "23-result-victory",
    note: "勝利結算",
    setup: () => {
      game.stage = 2;
      game.state = "won";
      game.winFx = createWinFx();
      game.stageTwo = createStageTwo();
      game.stageTwo.score = 480;
      game.stageTwo.shotsLeft = 6;
      game.stageTwo.startingShots = 6;
      game.stageTwo.bestImpact = 168;
      game.coins = 1;
      game.timeBoostEarned = 8.6;
      game.comboBest = 3;
      game.stageOneRating = 3;
      game.overlayTimer = 0;
      game.overlayText = "";
    },
  },
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function loadFreshPage(page) {
  await page.goto(PAGE_URL, { waitUntil: "load" });
  await page.waitForFunction(() => typeof game !== "undefined" && typeof render === "function");
  await page.waitForFunction(() => {
    const canvas = document.getElementById("game");
    return canvas && canvas.width > 0 && canvas.height > 0;
  });
  await page.waitForTimeout(180);
}

async function freezeForCapture(page) {
  await page.evaluate(() => {
    try {
      stopSubtitleNarration?.();
    } catch (_) {}
    try {
      soundFx?.stopAll?.();
    } catch (_) {}
    try {
      resetCutsceneVideoUi?.();
    } catch (_) {}
    try {
      if (typeof cutsceneVideo !== "undefined" && cutsceneVideo) {
        cutsceneVideo.pause();
        cutsceneVideo.currentTime = 0;
      }
    } catch (_) {}

    if (typeof audio === "object" && audio) {
      audio.enabled = false;
    }
    if (typeof skipButton !== "undefined" && skipButton) {
      skipButton.style.display = "none";
    }
    if (typeof killBossButton !== "undefined" && killBossButton) {
      killBossButton.style.display = "none";
    }

    if (!window.__captureStepFrozen && typeof step === "function") {
      window.__captureStepFrozen = true;
      window.__captureOriginalStep = step;
      step = () => {};
    }
    if (!window.__captureBgmFrozen && typeof updateBackgroundMusic === "function") {
      window.__captureBgmFrozen = true;
      window.__captureOriginalBgm = updateBackgroundMusic;
      updateBackgroundMusic = () => {};
    }
  });
}

async function prepareScene(page, scene) {
  await loadFreshPage(page);
  await freezeForCapture(page);
  await page.evaluate(scene.setup);
  await page.evaluate(() => {
    configureCanvas?.();
    updateHud?.();
    render?.();
  });
  await page.waitForTimeout(80);
}

async function main() {
  await ensureDir(OUT_DIR);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.error("[page:error]", msg.text());
    }
  });
  page.on("pageerror", (error) => {
    console.error("[pageexception]", error);
  });

  const manifest = [];

  for (const scene of SCENES) {
    process.stdout.write(`Capturing ${scene.id}...\n`);
    await prepareScene(page, scene);
    const filePath = path.join(OUT_DIR, `${scene.id}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    manifest.push({
      id: scene.id,
      note: scene.note,
      file: filePath,
    });
  }

  await fs.writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  await browser.close();
  process.stdout.write(`Saved ${manifest.length} captures to ${OUT_DIR}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
