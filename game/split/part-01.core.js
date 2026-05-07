// Core constants, shared state, assets, audio, level factories, and Stage 2 physics.
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = 960;
const HEIGHT = 540;
const BUILD_ID = "20260510-mobile-canvas-sharp";

/** true = 先彈弓（原第二關）再 Boss（原第一關） */
const SLINGSHOT_FIRST_ORDER = true;

function hudSlingStageName() {
  return SLINGSHOT_FIRST_ORDER ? "第一階段" : "第二階段";
}

function hudBossStageName() {
  return SLINGSHOT_FIRST_ORDER ? "第二階段" : "第一階段";
}

/** 手機／高分螢幕提高清晰度：較高 DPR 上限 + 像素對齊避免糊邊 */
const CANVAS_MAX_DEVICE_PIXEL_RATIO = 4;

function configureCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return;
  }

  const raw =
    typeof window.devicePixelRatio === "number" && window.devicePixelRatio > 0
      ? window.devicePixelRatio
      : 1;
  const dpr = Math.min(Math.max(raw, 1), CANVAS_MAX_DEVICE_PIXEL_RATIO);

  const backingWidth = Math.ceil(rect.width * dpr);
  const backingHeight = Math.ceil(rect.height * dpr);

  if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
    canvas.width = backingWidth;
    canvas.height = backingHeight;
  }

  ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
  ctx.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in ctx) {
    ctx.imageSmoothingQuality = "high";
  }
}

const statusPill = document.getElementById("statusPill");
const coinsPill = document.getElementById("coinsPill");
const livesPill = document.getElementById("livesPill");
const timerPill = document.getElementById("timerPill");
const restartButton = document.getElementById("restartButton");
const skipButton = document.getElementById("skipButton");
const killBossButton = document.getElementById("killBossButton");
const touchControlsEl = document.getElementById("touchControls");
let touchChromeWasVisible = false;
const cutsceneVideoOverlay = document.getElementById("cutsceneVideoOverlay");
const cutsceneVideoStage = document.querySelector(".video-overlay__stage");
const cutsceneVideo = document.getElementById("cutsceneVideo");
const cutsceneVideoHint = document.getElementById("cutsceneVideoHint");
const FLOOR_Y = 408;
const GRAVITY = 0.56;
const MAX_FALL_SPEED = 16;
const PLAYER_JUMP_VY = -10.9;
const PLAYER_DOUBLE_JUMP_VY = -9.6;
const BOSS_DRAW_SCALE = 1.45;
const BOSS_DRAW_BASE_HEIGHT = 66;
const BOSS_BODY_HITBOX_INSET_X_RATIO = 0.18;
const BOSS_BODY_HITBOX_INSET_TOP_RATIO = 0.08;
const BOSS_BODY_HITBOX_INSET_BOTTOM_RATIO = 0.12;
const WORLD_WIDTH = 7680;
const COIN_RADIUS = 16;
const COIN_DRAW_WIDTH = 32;
const COIN_DRAW_HEIGHT = 58;
const ENEMY_SQUASH_FRAMES = 22;
const STAGE_ONE_TIME_LIMIT = 78;
const PLAYER_START_LIVES = 5;
const MAX_BOSS_MINIONS = 8;
/** Boss battle is relocated into the parkour lane after the intro cutscene. */
const BOSS_ARENA_GROUND_X = 3160;
const BOSS_ARENA_GROUND_W = 1060;
const BOSS_CHASE_LEFT_BOUND = 3180;
const BOSS_ARENA_MINION_MIN_X = BOSS_CHASE_LEFT_BOUND;
const BOSS_ARENA_MINION_MAX_X = BOSS_ARENA_GROUND_X + BOSS_ARENA_GROUND_W - 28;
const BOSS_ENGAGED_LEASH_PAD_RIGHT = 240;
const BOSS_BATTLE_TRANSFER_PLAYER_X = 3232;
const BOSS_BATTLE_TRANSFER_BOSS_X = 3908;
const BOSS_PROJECTILE_LIFE_FRAMES = 118;
const BOSS_PROJECTILE_LIFE_HOMING_FRAMES = 150;
const BOSS_PHASE_SHIFT_FRAMES = 84;
const BOSS_INTRO_TRIGGER_PAD = 72;
/** Frames per subtitle line (~60fps); long dialogue needs time to read */
const BOSS_INTRO_LINE_HOLD_FRAMES = 268;
const BOSS_INTRO_BOSS_ZOOM_FRAMES = 92;
const BOSS_INTRO_PLAYER_ZOOM_FRAMES = 78;
const BOSS_INTRO_OUTRO_FRAMES = 64;
const BOSS_INTRO_OUTRO_ZOOM_BLEND_FRAMES = 58;
const BOSS_INTRO_BOUNCE_DURATION = 17;
const BOSS_INTRO_VIDEO_PHASE = "playerVideo";
const BOSS_PHASE_SHIFT_CUTSCENE_FRAMES = 210;
const BOSS_VICTORY_CUTSCENE_FRAMES = 420;
// Opening prologue is now longer to include essential player instructions.
const PROLOGUE_TOTAL_FRAMES = 1050;
const ENDING_RESCUE_TOTAL_FRAMES = 600;
const ENDING_RESCUE_WALK_FRAMES = 160;
const ENDING_RESCUE_REUNION_START = 230;
const ENDING_RESCUE_REUNION_FRAMES = 130;
const SPRING_TRIGGER_PAD = 8;
const SPRING_TRIGGER_SIDE_INSET = 6;
const SPIKE_KILL_HEIGHT = 36;
const SPIKE_KILL_SIDE_INSET = 4;
const BOSS_RISING_STOMP_SPEED = 2.4;
const BOSS_RISING_STOMP_BAND = 22;
const BOSS_RISING_STOMP_CENTER_INSET = 6;
const HIDDEN_BOSS_SKIP_KEY = "Backquote";
const BOSS_INTRO_LINES_BOSS = [
  "「能闖上能量巨塔，你這間邊緣小廠還算有骨氣。可惜通路、速度、天空，全都在紅牛帝國的資本版圖裡。康貝特，你的上架權早就被我們買斷了。」",
  "「別搞錯，紅牛帝國跟魔爪本來就各自為王。只是這個市場太擠了，你們那瓶終極配方『康貝特200p』，只配被封在塔頂金庫，永遠變成舊時代標本！」",
  "「上班族、學生、基層勞工的疲憊不值錢，值錢的是我們包裝過的菁英速度。想救配方？先從我的極限狂牛衝撞下活下來！」",
];
const BOSS_INTRO_LINES_PLAYER = [
  "「你們買斷貨架，卻買不走民眾真正需要的底氣。康貝特不是豪華招牌，是累到快倒的人還能再站起來的那一口。」",
  "「200p 不該被封印在你們的能量巨塔，它是本土小廠的心臟，也是高 CP 值提神的證明。今天我來奪回上架權，也奪回被壟斷的市場視野！」",
  "「紅牛要打、魔爪也要搶，那就一個一個來。只要生產線還能轟鳴，只要有人還在撐，我就會把康貝特200p帶回大街小巷——喝、了、再、上！」",
];
const BOSS_INTRO_EXCHANGE = [
  { speaker: "boss", line: BOSS_INTRO_LINES_BOSS[0] },
  { speaker: "player", line: BOSS_INTRO_LINES_PLAYER[0] },
  { speaker: "boss", line: BOSS_INTRO_LINES_BOSS[1] },
  { speaker: "player", line: BOSS_INTRO_LINES_PLAYER[1] },
  { speaker: "boss", line: BOSS_INTRO_LINES_BOSS[2] },
  { speaker: "player", line: BOSS_INTRO_LINES_PLAYER[2] },
];

const BOSS_VICTORY_EXCHANGE = SLINGSHOT_FIRST_ORDER
  ? [
      { speaker: "player", line: "「通路高牆碎了，能量巨塔也倒了。」" },
      { speaker: "player", line: "「學生和上班族的疲憊，不該只剩兩大霸主能定價。」" },
      { speaker: "player", line: "「康貝特200p，回到大家手上的時間到了！」" },
    ]
  : [
      { speaker: "player", line: "「能量巨塔破口打開了。」" },
      { speaker: "player", line: "「接下來就砸碎通路封鎖，奪回上架權。」" },
      { speaker: "player", line: "「康貝特200p，準備重見天日！」" },
    ];
const DEATH_AD_DURATION = 360;
const DEATH_AD_SKIP_AT = 90;
const AUDIO_MASTER_GAIN = 0.16;
const AUDIO_REVERB_MIX = 0.14;
const AUDIO_DELAY_TIME = 0.12;
const AUDIO_DELAY_FEEDBACK = 0.25;
const COIN_TIME_BONUS = 1.05;

const STAGE_ONE_DIFFICULTY = {
  enemySpeedMultiplier: 1.22,
  movingPlatformSpeedMultiplier: 1.28,
  movingPlatformRangeMultiplier: 1.12,
  playerMaxSpeedMultiplier: 0.96,
};

const BOSS_BALANCE = {
  enragedThreshold: 0.6,
  berserkThreshold: 0.3,
  engagedMinActionCooldown: 132,
  engagedActionCooldown: 102,
  engagedRecoveryActionCooldown: 24,
  engagedSummonChancePatrol: 0.07,
  engagedShootChancePatrol: 0.18,
  engagedChargeChancePatrol: 0.44,
  engagedChargeFollowupSummonChance: 0.02,
  engagedShootFollowupSummonChance: 0.024,
  engagedProjectileShots: 2,
  engagedProjectileSpread: 0.18,
  engagedHomingChance: 0.08,
  engagedHomingStrength: 0.048,
  summonCount: 1,
  slamStunnedFrames: 24,
  summonStunnedFrames: 18,
  chargeEndStunnedFrames: 20,
  shootEndStunnedFrames: 24,
  wallCrashStunnedFrames: 22,
  jumpKickBase: 1.9,
  jumpKickBerserk: 2.8,
  engagedInitialAirShootCooldown: 56,
  engagedAirShootInterval: 48,
  chargeSpeedBase: 4.2,
  chargeSpeedEnraged: 5.0,
  chargeSpeedBerserk: 5.8,
  shakenSpeedBase: 2.2,
  shakenSpeedEnraged: 3.0,
  shakenSpeedBerserk: 3.8,
  shakenShootInterval: 30,
};

const STAGE_TWO_MATERIALS = {
  wood: {
    density: 0.0022,
    friction: 0.62,
    frictionStatic: 0.85,
    restitution: 0.06,
    hp: 2,
    chamfer: 4,
    breakImpactBonus: 6.5,
    palette: { face: "#d4965d", edge: "#8a4d22", grain: "rgba(95, 49, 18, 0.45)" },
  },
  glass: {
    density: 0.0014,
    friction: 0.18,
    frictionStatic: 0.32,
    restitution: 0.32,
    hp: 1,
    chamfer: 2,
    breakImpactBonus: 3.2,
    palette: { face: "#bce8f7", edge: "#5d9bb2", grain: "rgba(255, 255, 255, 0.7)" },
  },
  stone: {
    density: 0.0048,
    friction: 0.85,
    frictionStatic: 1.05,
    restitution: 0.04,
    hp: 4,
    chamfer: 6,
    breakImpactBonus: 9.5,
    palette: { face: "#9aa6bd", edge: "#3f4861", grain: "rgba(28, 36, 60, 0.35)" },
  },
};

const STAGE_TWO_PROJECTILE = {
  width: 30,
  height: 56,
  density: 0.0028,
  friction: 0.32,
  frictionAir: 0.012,
  restitution: 0.22,
  velocityScale: 0.18,
  maxLaunchSpeed: 26,
};

const STAGE_TWO_FX = {
  cameraShake: 0,
  cameraShakeX: 0,
  cameraShakeY: 0,
  particles: [],
  flashes: [],
};

const STAGE_ONE_FX = {
  cameraShake: 0,
  cameraShakeX: 0,
  cameraShakeY: 0,
  cameraZoom: 1,
  cameraZoomTarget: 1,
  speedLines: [],
  particles: [],
  popups: [],
};

const PLAYER_DASH = {
  duration: 14,
  cooldown: 38,
  speedBoost: 1.85,
  airSpeedBoost: 1.5,
  invincibility: 12,
};

const COIN_COMBO = {
  windowFrames: 130,
  maxMultiplier: 5,
};

function triggerStageOneShake(intensity) {
  STAGE_ONE_FX.cameraShake = Math.min(20, STAGE_ONE_FX.cameraShake + intensity);
}

function spawnStageOneParticle(particle) {
  STAGE_ONE_FX.particles.push(particle);
}

function getBossFxPalette(enemyOrBrand) {
  const brand = typeof enemyOrBrand === "string" ? enemyOrBrand : enemyOrBrand?.brand;
  if (brand === "redbull") {
    return {
      edge: "#ff7b20",
      core: "#ffd2bd",
      spark: "#fff3d6",
      glow: "255, 194, 150",
    };
  }
  return {
    edge: "#19d96b",
    core: "#b8ff9c",
    spark: "#f1ffe6",
    glow: "156, 255, 166",
  };
}

function spawnBossBurst(x, y, enemyOrBrand, count = 16, options = {}) {
  const palette = getBossFxPalette(enemyOrBrand);
  const spread = options.spread ?? Math.PI * 2;
  const angle = options.angle ?? -Math.PI / 2;
  const speed = options.speed ?? 4.8;
  const gravity = options.gravity ?? 0.16;
  const drag = options.drag ?? 0.95;
  const life = options.life ?? 18;
  const size = options.size ?? 2.2;
  const radiusX = options.radiusX ?? 10;
  const radiusY = options.radiusY ?? 10;
  for (let i = 0; i < count; i += 1) {
    const theta = angle + (Math.random() - 0.5) * spread;
    const burstSpeed = speed * (0.5 + Math.random() * 0.8);
    const hue = i % 3 === 0 ? palette.spark : i % 2 === 0 ? palette.core : palette.edge;
    spawnStageOneParticle({
      x: x + (Math.random() - 0.5) * radiusX,
      y: y + (Math.random() - 0.5) * radiusY,
      vx: Math.cos(theta) * burstSpeed,
      vy: Math.sin(theta) * burstSpeed - Math.random() * 0.6,
      gravity,
      drag,
      life: life + Math.random() * 8,
      maxLife: life + 10,
      size: size + Math.random() * 1.8,
      color: hue,
    });
  }
}

function spawnStageOnePopup(text, x, y, color = "#fff7e8") {
  STAGE_ONE_FX.popups.push({ text, x, y, vy: -1.2, life: 50, maxLife: 50, color });
}

function spawnStageOneSpeedLine(player) {
  STAGE_ONE_FX.speedLines.push({
    x: player.x + Math.random() * player.w,
    y: player.y + Math.random() * player.h,
    vx: -player.vx * 0.4 - 4 * Math.sign(player.vx || 1),
    life: 12 + Math.random() * 6,
    maxLife: 18,
  });
}

function updateStageOneFx(frameScale) {
  if (STAGE_ONE_FX.cameraShake > 0) {
    STAGE_ONE_FX.cameraShake = Math.max(0, STAGE_ONE_FX.cameraShake - 0.55 * frameScale);
    const m = STAGE_ONE_FX.cameraShake;
    STAGE_ONE_FX.cameraShakeX = (Math.random() - 0.5) * m;
    STAGE_ONE_FX.cameraShakeY = (Math.random() - 0.5) * m;
  } else {
    STAGE_ONE_FX.cameraShakeX = 0;
    STAGE_ONE_FX.cameraShakeY = 0;
  }

  STAGE_ONE_FX.cameraZoom += (STAGE_ONE_FX.cameraZoomTarget - STAGE_ONE_FX.cameraZoom) * 0.06 * frameScale;

  for (let i = STAGE_ONE_FX.particles.length - 1; i >= 0; i -= 1) {
    const p = STAGE_ONE_FX.particles[i];
    p.vy = (p.vy ?? 0) + (p.gravity ?? 0.32) * frameScale;
    p.vx = (p.vx ?? 0) * (p.drag ?? 0.985);
    p.vy *= p.drag ?? 0.985;
    p.x += (p.vx ?? 0) * frameScale;
    p.y += (p.vy ?? 0) * frameScale;
    p.life -= frameScale;
    if (p.life <= 0) {
      STAGE_ONE_FX.particles.splice(i, 1);
    }
  }

  for (let i = STAGE_ONE_FX.speedLines.length - 1; i >= 0; i -= 1) {
    const line = STAGE_ONE_FX.speedLines[i];
    line.x += line.vx * frameScale;
    line.life -= frameScale;
    if (line.life <= 0) {
      STAGE_ONE_FX.speedLines.splice(i, 1);
    }
  }

  for (let i = STAGE_ONE_FX.popups.length - 1; i >= 0; i -= 1) {
    const popup = STAGE_ONE_FX.popups[i];
    popup.y += popup.vy * frameScale;
    popup.vy *= 0.97;
    popup.life -= frameScale;
    if (popup.life <= 0) {
      STAGE_ONE_FX.popups.splice(i, 1);
    }
  }
}

function resetStageOneFx() {
  STAGE_ONE_FX.cameraShake = 0;
  STAGE_ONE_FX.cameraShakeX = 0;
  STAGE_ONE_FX.cameraShakeY = 0;
  STAGE_ONE_FX.cameraZoom = 1;
  STAGE_ONE_FX.cameraZoomTarget = 1;
  STAGE_ONE_FX.speedLines.length = 0;
  STAGE_ONE_FX.particles.length = 0;
  STAGE_ONE_FX.popups.length = 0;
}

function triggerStageTwoShake(intensity) {
  STAGE_TWO_FX.cameraShake = Math.min(22, STAGE_TWO_FX.cameraShake + intensity);
}

function spawnStageTwoDebris(x, y, color, count = 8, options = {}) {
  const baseSpeed = options.speed ?? 4.2;
  const spread = options.spread ?? Math.PI * 2;
  const baseAngle = options.angle ?? -Math.PI / 2;
  for (let i = 0; i < count; i += 1) {
    const angle = baseAngle + (Math.random() - 0.5) * spread;
    const speed = baseSpeed * (0.5 + Math.random() * 0.85);
    const life = 26 + Math.random() * 18;
    STAGE_TWO_FX.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.4,
      life,
      maxLife: life,
      size: 2.2 + Math.random() * 3.4,
      color,
      gravity: options.gravity ?? 0.34,
      drag: options.drag ?? 0.985,
    });
  }
}

function spawnStageTwoFlash(x, y, radius = 36) {
  STAGE_TWO_FX.flashes.push({ x, y, radius, life: 14, maxLife: 14 });
}

function updateStageTwoFx(frameScale) {
  if (STAGE_TWO_FX.cameraShake > 0) {
    STAGE_TWO_FX.cameraShake = Math.max(0, STAGE_TWO_FX.cameraShake - 0.6 * frameScale);
    const magnitude = STAGE_TWO_FX.cameraShake;
    STAGE_TWO_FX.cameraShakeX = (Math.random() - 0.5) * magnitude;
    STAGE_TWO_FX.cameraShakeY = (Math.random() - 0.5) * magnitude;
  } else {
    STAGE_TWO_FX.cameraShakeX = 0;
    STAGE_TWO_FX.cameraShakeY = 0;
  }

  for (let i = STAGE_TWO_FX.particles.length - 1; i >= 0; i -= 1) {
    const particle = STAGE_TWO_FX.particles[i];
    particle.vy += particle.gravity * frameScale;
    particle.vx *= particle.drag;
    particle.vy *= particle.drag;
    particle.x += particle.vx * frameScale;
    particle.y += particle.vy * frameScale;
    particle.life -= frameScale;
    if (particle.life <= 0) {
      STAGE_TWO_FX.particles.splice(i, 1);
    }
  }

  for (let i = STAGE_TWO_FX.flashes.length - 1; i >= 0; i -= 1) {
    const flash = STAGE_TWO_FX.flashes[i];
    flash.life -= frameScale;
    if (flash.life <= 0) {
      STAGE_TWO_FX.flashes.splice(i, 1);
    }
  }
}

function resetStageTwoFx() {
  STAGE_TWO_FX.cameraShake = 0;
  STAGE_TWO_FX.cameraShakeX = 0;
  STAGE_TWO_FX.cameraShakeY = 0;
  STAGE_TWO_FX.particles.length = 0;
  STAGE_TWO_FX.flashes.length = 0;
}

function easeOutCubic(t) {
  const k = clamp(t, 0, 1);
  return 1 - (1 - k) * (1 - k) * (1 - k);
}

const input = {
  left: false,
  right: false,
  jump: false,
  jumpPressed: false,
  dash: false,
  dashPressed: false,
  touchLeft: false,
  touchRight: false,
  touchDash: false,
  touchDashPressed: false,
};

const audio = {
  enabled: true,
  context: null,
  master: null,
  musicGain: null,
  musicStarted: false,
  musicNextTime: 0,
  musicStep: 0,
  noiseBuffer: null,
};

function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

const art = {
  face: loadImage("assets/marketing/face-closeup.jpg"),
  player: loadImage("assets/marketing/player-direct-cutout.png"),
  pose: loadImage("assets/marketing/drink-pose.jpg"),
  billboardRef: loadImage("assets/marketing/billboard-reference.jpeg"),
  product: loadImage("assets/marketing/product-can-cutout.png"),
  enemyRedBull: loadImage("assets/marketing/enemy-redbull-cutout.png"),
  enemyMonster: loadImage("assets/marketing/enemy-monster-cutout.png"),
};

const palette = {
  skyTop: "#bde6ff",
  skyBottom: "#fff0ca",
  haze: "rgba(255,255,255,0.72)",
  stripeBlue: "#1946b8",
  stripeRed: "#ef2a3e",
  stripeOrange: "#ff7b20",
  farHill: "#b2c6e8",
  nearHill: "#6f8fd4",
  ground: "#17326f",
  grass: "#ff7b20",
  blockFace: "#ffffff",
  blockEdge: "#ef2a3e",
  stoneFace: "#dee6f6",
  stoneEdge: "#8295c2",
  coin: "#ffffff",
  coinShade: "#b7c4ea",
  heroCoat: "#624331",
  heroScarf: "#ef2a3e",
  heroHair: "#1a1d27",
  enemyBody: "#ef2a3e",
  enemyShade: "#9f1321",
  enemyText: "#fff7e8",
  goalPole: "#ffffff",
  goalFlag: "#1946b8",
  hud: "rgba(15, 23, 51, 0.62)",
};

/**
 * 康貝特200p 廣告文案（中等強度用）：提供「一行輪播」與「3-5 行賣點」素材。
 * 長文（完整成分表）先不進遊戲畫面，避免擠版/干擾操作；之後若要加「詳細頁」再擴充。
 */
const COMBAT_200P_TAGLINES = [
  "這時候你需要來一瓶【康貝特200P】",
  "咖啡因增量 1.5 倍，活力更到位",
  "容量增加 1.25 倍，續航力十足",
  "經典香氣 + 微氣泡，順口好喝",
  "輕巧瓶身，隨時補充能量",
  "健康黃金比例：7種維他命 + 牛磺酸 + 胺基酸",
  "滿足一天活力，喝了再上",
];

const COMBAT_200P_BENEFITS = [
  "咖啡因 1.5 倍，提神更有感",
  "容量 1.25 倍，續航更久",
  "7 種維他命 + 胺基酸 + 牛磺酸",
  "活力氣泡，清爽順口好喝",
  "高 CP 值，本土底氣補滿",
];

function getRotatingCopy(frame, list, secondsPer = 3) {
  if (!Array.isArray(list) || list.length === 0) return "";
  const framesPer = Math.max(1, Math.round(secondsPer * 60));
  const idx = Math.floor(Math.max(0, frame || 0) / framesPer) % list.length;
  return list[idx];
}

function getAdTagline(frame) {
  return getRotatingCopy(frame, COMBAT_200P_TAGLINES, 3.2);
}

function getAdBenefits(frame, maxLines = 4) {
  const lines = COMBAT_200P_BENEFITS.slice(0, Math.max(1, maxLines));
  // 輪播：每次把清單往前 shift 一格，讓重複曝光沒那麼死板
  const shift = Math.floor(Math.max(0, frame || 0) / Math.round(4.2 * 60)) % COMBAT_200P_BENEFITS.length;
  if (!shift) return lines;
  const rotated = COMBAT_200P_BENEFITS.slice(shift).concat(COMBAT_200P_BENEFITS.slice(0, shift));
  return rotated.slice(0, Math.max(1, maxLines));
}

function drawCornerBug(x, y, text, subText = "") {
  const padX = 12;
  const padY = 9;
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "bold 14px Avenir Next, sans-serif";
  const mainW = Math.ceil(ctx.measureText(text).width);
  ctx.font = "12px Avenir Next, sans-serif";
  const subW = subText ? Math.ceil(ctx.measureText(subText).width) : 0;
  const w = Math.max(mainW, subW) + padX * 2 + 18;
  const h = subText ? 44 : 34;

  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, palette.stripeRed);
  grad.addColorStop(1, palette.stripeOrange);
  ctx.shadowColor = "rgba(239, 42, 62, 0.35)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = grad;
  roundRect(x, y, w, h, 14);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#fff7e8";
  ctx.font = "bold 14px Avenir Next, sans-serif";
  ctx.fillText(text, x + padX, y + (subText ? 16 : h / 2));
  if (subText) {
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = "12px Avenir Next, sans-serif";
    ctx.fillText(subText, x + padX, y + 32);
  }

  // 右側小圓點（像「貼紙」）
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.arc(x + w - 14, y + 14, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPillSticker(cx, cy, text, opts = {}) {
  const {
    font = "bold 13px Avenir Next, sans-serif",
    fill = "rgba(12, 18, 35, 0.66)",
    stroke = "rgba(255,255,255,0.18)",
    textFill = "#fff7e8",
    padX = 14,
    h = 30,
  } = opts;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + padX * 2;
  const x = cx - w / 2;
  const y = cy - h / 2;
  ctx.fillStyle = fill;
  roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  roundRect(x, y, w, h, h / 2);
  ctx.stroke();
  ctx.fillStyle = textFill;
  ctx.fillText(text, cx, cy + 0.5);
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function pointInRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h
  );
}

function getEnemyImageForBrand(brand) {
  return brand === "monster" ? art.enemyMonster : art.enemyRedBull;
}

function getBossRenderRect(enemy, bounceDy = 0) {
  const enemyImage = getEnemyImageForBrand(enemy.brand);
  const imageRatio = canDrawImage(enemyImage)
    ? enemyImage.naturalWidth / enemyImage.naturalHeight
    : Math.max(0.34, enemy.w / Math.max(enemy.h, 1));
  const drawW = BOSS_DRAW_BASE_HEIGHT * imageRatio * BOSS_DRAW_SCALE;
  const drawH = BOSS_DRAW_BASE_HEIGHT * BOSS_DRAW_SCALE;
  const centerX = enemy.x + enemy.w / 2;
  return {
    x: centerX - drawW / 2,
    y: enemy.y + enemy.h - drawH + bounceDy,
    w: drawW,
    h: drawH,
  };
}

function getEnemyCollisionRect(enemy) {
  if (enemy.role !== "boss") {
    return enemy;
  }

  const renderRect = getBossRenderRect(enemy);
  const insetX = renderRect.w * BOSS_BODY_HITBOX_INSET_X_RATIO;
  const insetTop = renderRect.h * BOSS_BODY_HITBOX_INSET_TOP_RATIO;
  const insetBottom = renderRect.h * BOSS_BODY_HITBOX_INSET_BOTTOM_RATIO;
  return {
    x: renderRect.x + insetX,
    y: renderRect.y + insetTop,
    w: Math.max(22, renderRect.w - insetX * 2),
    h: Math.max(48, renderRect.h - insetTop - insetBottom),
  };
}

function isBossRisingFootStomp(player, enemy) {
  if (!player || !enemy || enemy.role !== "boss") {
    return false;
  }

  if ((enemy.vy ?? 0) >= -BOSS_RISING_STOMP_SPEED) {
    return false;
  }

  const enemyRect = getEnemyCollisionRect(enemy);
  const playerBottom = player.y + player.h;
  const playerBottomPrev = player.prevY + player.h;
  const feetMin = Math.min(playerBottomPrev, playerBottom);
  const feetMax = Math.max(playerBottomPrev, playerBottom);
  const feetBandTop = enemyRect.y - 4;
  const feetBandBottom = enemyRect.y + BOSS_RISING_STOMP_BAND;
  const playerCenterX = player.x + player.w / 2;
  const centerAligned =
    playerCenterX >= enemyRect.x + BOSS_RISING_STOMP_CENTER_INSET &&
    playerCenterX <= enemyRect.x + enemyRect.w - BOSS_RISING_STOMP_CENTER_INSET;
  const playerMostlyAbove = player.y + player.h * 0.58 <= enemyRect.y + enemyRect.h * 0.72;

  return centerAligned && playerMostlyAbove && feetMax >= feetBandTop && feetMin <= feetBandBottom;
}

function getSpikeCollisionRect(platform) {
  return {
    x: platform.x + SPIKE_KILL_SIDE_INSET,
    y: platform.y + platform.h - SPIKE_KILL_HEIGHT,
    w: Math.max(12, platform.w - SPIKE_KILL_SIDE_INSET * 2),
    h: SPIKE_KILL_HEIGHT,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatStatNumber(value) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }
  if (!audio.context) {
    audio.context = new AudioContextClass();

    // Master bus (dry)
    audio.master = audio.context.createGain();
    audio.master.gain.value = AUDIO_MASTER_GAIN;

    // Reverb bus (wet) - creates spatial depth
    audio.reverbGain = audio.context.createGain();
    audio.reverbGain.gain.value = AUDIO_REVERB_MIX;
    audio.reverbSend = audio.context.createGain();
    audio.reverbSend.gain.value = 0.35;

    // Simple convolution-like reverb via filtered noise tail
    const revLen = Math.max(1, Math.floor(audio.context.sampleRate * 0.32));
    audio.reverbBuffer = audio.context.createBuffer(1, revLen, audio.context.sampleRate);
    const revData = audio.reverbBuffer.getChannelData(0);
    let revVal = 0;
    for (let i = 0; i < revLen; i += 1) {
      revVal += (Math.random() - 0.5) * 0.2;
      revVal *= 0.997;
      revData[i] = revVal * 0.15;
    }

    // Delay effect for epic moments
    audio.delayGain = audio.context.createGain();
    audio.delayGain.gain.value = AUDIO_DELAY_FEEDBACK;
    audio.delayTime = AUDIO_DELAY_TIME;

    // Effects send bus
    audio.effectsBus = audio.context.createGain();
    audio.effectsBus.gain.value = 1.0;
    audio.effectsBus.connect(audio.master);

    audio.master.connect(audio.context.destination);

    audio.musicGain = audio.context.createGain();
    audio.musicGain.gain.value = 0.0001;
    audio.musicGain.connect(audio.master);

    const noiseLength = Math.max(1, Math.floor(audio.context.sampleRate * 0.5));
    audio.noiseBuffer = audio.context.createBuffer(1, noiseLength, audio.context.sampleRate);
    const noiseData = audio.noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i += 1) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    // Reverb convolver
    try {
      const convolver = audio.context.createConvolver();
      convolver.buffer = audio.reverbBuffer;
      audio.reverbNode = convolver;
      audio.reverbSend.connect(convolver);
      convolver.connect(audio.reverbGain);
      audio.reverbGain.connect(audio.master);
    } catch (_) { /* fallback: skip reverb */ }
  }
  return audio.context;
}

function scheduleToneWithEffects({
  freq,
  endFreq = freq,
  offset = 0,
  startTime = null,
  duration = 0.08,
  volume = 0.1,
  type = "triangle",
  attack = 0.008,
  release = 0.12,
  bus = null,
  reverb = 0,
  delay = 0,
}) {
  scheduleTone({ freq, endFreq, offset, startTime, duration, volume, type, attack, release, bus });
  if (reverb > 0.001) {
    scheduleTone({ freq: freq * 0.98, endFreq: endFreq * 0.96, offset: offset + 0.012, startTime, duration: duration * 1.4, volume: volume * reverb * 0.35, type, attack: attack * 2, release: release * 2.2, bus: audio.effectsBus });
    scheduleNoiseBurst({ startTime: (startTime ?? 0) + offset + 0.018, duration: duration * 0.7, volume: volume * reverb * 0.08, highpass: 800, lowpass: 4000, bus: audio.effectsBus });
  }
  if (delay > 0.001) {
    const dt = AUDIO_DELAY_TIME;
    const fb = AUDIO_DELAY_FEEDBACK * delay;
    scheduleTone({ freq: freq * 0.97, endFreq: endFreq * 0.94, offset: offset + dt, startTime, duration: duration * 0.6, volume: volume * fb * 0.4, type, attack, release: release * 1.2, bus: audio.effectsBus });
    scheduleTone({ freq: freq * 0.95, endFreq: endFreq * 0.92, offset: offset + dt * 2, startTime, duration: duration * 0.4, volume: volume * fb * 0.2, type, attack, release: release * 1.5, bus: audio.effectsBus });
  }
}

function startBackgroundMusic() {
  const context = audio.context;
  if (!context || context.state !== "running" || audio.musicStarted) {
    return;
  }
  audio.musicStarted = true;
  audio.musicStep = 0;
  audio.musicNextTime = context.currentTime + 0.06;
}

function unlockAudio() {
  const context = getAudioContext();
  if (!context) {
    return;
  }
  if (context.state === "suspended") {
    context.resume().then(() => {
      startBackgroundMusic();
    }).catch(() => {});
    return;
  }
  startBackgroundMusic();
}

function scheduleTone({
  freq,
  endFreq = freq,
  offset = 0,
  startTime = null,
  duration = 0.08,
  volume = 0.1,
  type = "triangle",
  attack = 0.008,
  release = 0.12,
  bus = null,
}) {
  const context = getAudioContext();
  if (!context || !audio.enabled || !audio.master || context.state !== "running") {
    return;
  }

  const toneStartTime = (startTime ?? context.currentTime) + offset;
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(40, freq), toneStartTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(40, endFreq),
    toneStartTime + duration
  );

  gainNode.gain.setValueAtTime(0.0001, toneStartTime);
  gainNode.gain.linearRampToValueAtTime(volume, toneStartTime + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, toneStartTime + duration + release);

  oscillator.connect(gainNode);
  gainNode.connect(bus || audio.master);
  oscillator.start(toneStartTime);
  oscillator.stop(toneStartTime + duration + release + 0.03);
}

function midiToFreq(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

function scheduleNoteStack(notes, settings = {}) {
  if (!notes || notes.length === 0) {
    return;
  }

  const {
    startTime = null,
    duration = 0.18,
    volume = 0.04,
    type = "triangle",
    attack = 0.006,
    release = 0.08,
    spread = 0.005,
    bus = audio.musicGain,
  } = settings;

  const noteVolume = volume / Math.sqrt(notes.length);
  notes.forEach((note, index) => {
    scheduleTone({
      freq: midiToFreq(note),
      startTime,
      offset: index * spread,
      duration,
      volume: noteVolume,
      type,
      attack,
      release,
      bus,
    });
  });
}

function scheduleNoiseBurst({
  startTime = null,
  duration = 0.05,
  volume = 0.015,
  attack = 0.002,
  highpass = 2400,
  lowpass = 9200,
  bus = audio.musicGain,
}) {
  const context = getAudioContext();
  if (
    !context ||
    !audio.enabled ||
    !audio.noiseBuffer ||
    !audio.master ||
    context.state !== "running"
  ) {
    return;
  }

  const burstStartTime = startTime ?? context.currentTime;
  const source = context.createBufferSource();
  source.buffer = audio.noiseBuffer;

  let output = source;
  if (highpass) {
    const hp = context.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(highpass, burstStartTime);
    output.connect(hp);
    output = hp;
  }

  if (lowpass) {
    const lp = context.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(lowpass, burstStartTime);
    output.connect(lp);
    output = lp;
  }

  const gainNode = context.createGain();
  gainNode.gain.setValueAtTime(0.0001, burstStartTime);
  gainNode.gain.linearRampToValueAtTime(volume, burstStartTime + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, burstStartTime + duration);

  output.connect(gainNode);
  gainNode.connect(bus || audio.master);
  source.start(burstStartTime);
  source.stop(burstStartTime + duration + 0.04);
}

function scheduleKick(startTime, volume = 0.036) {
  scheduleTone({
    freq: 148,
    endFreq: 44,
    startTime,
    duration: 0.12,
    volume,
    type: "sine",
    attack: 0.002,
    release: 0.08,
    bus: audio.musicGain,
  });
}

function scheduleSnare(startTime, volume = 0.018) {
  scheduleNoiseBurst({
    startTime,
    duration: 0.11,
    volume,
    highpass: 1800,
    lowpass: 7000,
    bus: audio.musicGain,
  });
  scheduleTone({
    freq: 220,
    endFreq: 132,
    startTime,
    duration: 0.08,
    volume: volume * 0.55,
    type: "triangle",
    attack: 0.002,
    release: 0.05,
    bus: audio.musicGain,
  });
}

function scheduleHat(startTime, open = false, accent = false) {
  scheduleNoiseBurst({
    startTime,
    duration: open ? 0.085 : 0.03,
    volume: accent ? (open ? 0.016 : 0.011) : open ? 0.013 : 0.008,
    attack: 0.0015,
    highpass: 5200,
    lowpass: 11200,
    bus: audio.musicGain,
  });
}

const bossMusicLoop = {
  tempo: 168,
  stepsPerBeat: 4,
  lookAhead: 0.42,
  swing: 0,
  intensity: 1.6,
  lead: [
    62, null, 62, null, 65, null, 67, null,
    62, null, 67, null, 68, null, 65, null,
    62, null, 65, null, 67, null, 70, null,
    72, null, 70, null, 67, null, 65, null,
    74, null, 72, null, 70, null, 65, null,
    62, null, 65, null, 67, null, 65, null,
    62, null, 65, null, 67, null, 70, null,
    74, null, 70, null, 67, null, 62, null,
  ],
  bass: [
    38, null, null, null, 38, null, 38, null,
    36, null, null, null, 36, null, 36, null,
    38, null, null, null, 38, null, 41, null,
    36, null, null, null, 36, null, 33, null,
    38, null, null, null, 38, null, 41, null,
    36, null, null, null, 36, null, 36, null,
    38, null, null, null, 38, null, 41, null,
    36, null, null, null, 36, null, 33, null,
  ],
  arp: [
    50, null, 53, null, 57, null, 53, null,
    50, null, 53, null, 56, null, 53, null,
    50, null, 53, null, 57, null, 60, null,
    48, null, 51, null, 55, null, 51, null,
    50, null, 53, null, 57, null, 60, null,
    50, null, 53, null, 56, null, 53, null,
    50, null, 53, null, 57, null, 60, null,
    48, null, 51, null, 55, null, 51, null,
  ],
  chords: [
    [50, 53, 57],
    [50, 53, 57],
    [48, 51, 55],
    [48, 51, 55],
    [50, 53, 57],
    [50, 53, 57],
    [50, 54, 57],
    [50, 54, 57],
    [50, 53, 57],
    [50, 53, 57],
    [48, 51, 55],
    [48, 51, 55],
    [50, 53, 57],
    [50, 53, 57],
    [50, 54, 57],
    [50, 54, 57],
  ],
};

const musicLoop = {
  tempo: 136,
  stepsPerBeat: 4,
  lookAhead: 0.42,
  swing: 0.018,
  intensity: 1.0,
  lead: [
    79, null, 79, null, 81, null, 83, null,
    81, null, 79, null, 76, null, 74, null,
    76, null, 76, null, 74, null, 76, null,
    79, null, 81, null, 79, null, 74, null,
    79, null, 79, null, 81, null, 83, null,
    86, null, 83, null, 81, null, 79, null,
    76, null, 74, null, 72, null, 74, null,
    76, null, 79, null, 74, null, 72, null,
  ],
  bass: [
    43, null, null, null, 43, null, 50, null,
    36, null, null, null, 36, null, 43, null,
    43, null, null, null, 43, null, 47, null,
    38, null, null, null, 38, null, 45, null,
    40, null, null, null, 40, null, 47, null,
    36, null, null, null, 36, null, 43, null,
    43, null, null, null, 43, null, 47, null,
    38, null, null, null, 38, null, 45, null,
  ],
  arp: [
    67, null, 71, null, 74, null, 71, null,
    64, null, 67, null, 72, null, 67, null,
    67, null, 71, null, 74, null, 78, null,
    66, null, 69, null, 74, null, 69, null,
    64, null, 67, null, 71, null, 67, null,
    60, null, 64, null, 67, null, 64, null,
    67, null, 71, null, 74, null, 78, null,
    66, null, 69, null, 74, null, 69, null,
  ],
  chords: [
    [67, 71, 74],
    [67, 71, 74],
    [64, 67, 72],
    [64, 67, 72],
    [67, 71, 74],
    [67, 71, 74],
    [66, 69, 74],
    [66, 69, 74],
    [64, 67, 71],
    [64, 67, 71],
    [60, 64, 67],
    [60, 64, 67],
    [67, 71, 74],
    [67, 71, 74],
    [66, 69, 74],
    [66, 69, 74],
  ],
};

function scheduleMusicStep(step, startTime, loop = musicLoop) {
  const stepIndex = step % loop.lead.length;
  const stepInBar = stepIndex % 16;
  const stepDuration = 60 / loop.tempo / loop.stepsPerBeat;
  const leadNote = loop.lead[stepIndex];
  const bassNote = loop.bass[stepIndex];
  const arpNote = loop.arp[stepIndex];
  const chord = loop.chords[Math.floor(stepIndex / 4) % loop.chords.length];
  const intensity = loop.intensity ?? 1;
  const isBoss = loop === bossMusicLoop;

  if (leadNote) {
    scheduleTone({
      freq: midiToFreq(leadNote),
      startTime,
      duration: 0.105,
      volume: 0.046 * intensity,
      type: isBoss ? "sawtooth" : "square",
      attack: 0.004,
      release: 0.05,
      bus: audio.musicGain,
    });
    if (isBoss) {
      scheduleTone({
        freq: midiToFreq(leadNote - 12),
        startTime,
        duration: 0.12,
        volume: 0.025,
        type: "square",
        attack: 0.005,
        release: 0.06,
        bus: audio.musicGain,
      });
    }
  }

  if (bassNote) {
    scheduleTone({
      freq: midiToFreq(bassNote),
      endFreq: midiToFreq(bassNote - 0.5),
      startTime,
      duration: isBoss ? 0.18 : 0.16,
      volume: (isBoss ? 0.058 : 0.042) * (isBoss ? 1 : intensity),
      type: isBoss ? "sawtooth" : "triangle",
      attack: 0.01,
      release: 0.07,
      bus: audio.musicGain,
    });
  }

  if (arpNote) {
    scheduleTone({
      freq: midiToFreq(arpNote),
      startTime,
      duration: 0.07,
      volume: 0.024 * intensity,
      type: "triangle",
      attack: 0.003,
      release: 0.04,
      bus: audio.musicGain,
    });
  }

  if (stepIndex % 4 === 0) {
    scheduleNoteStack(chord, {
      startTime,
      duration: stepDuration * 1.8,
      volume: 0.025 * intensity,
      type: "triangle",
      attack: 0.01,
      release: 0.08,
      spread: 0.004,
      bus: audio.musicGain,
    });
  }

  if (stepIndex % 2 === 0) {
    scheduleHat(startTime, stepInBar === 14, stepInBar === 4 || stepInBar === 12);
  }

  if (isBoss) {
    if (stepInBar % 4 === 0) {
      scheduleKick(startTime, 0.05);
    }
    if (stepInBar === 4 || stepInBar === 12) {
      scheduleSnare(startTime, 0.03);
    }
    if (stepInBar === 8) {
      scheduleSnare(startTime, 0.025);
      scheduleNoiseBurst({
        startTime,
        duration: 0.12,
        volume: 0.025,
        highpass: 200,
        lowpass: 1200,
      });
    }
  } else {
    if (stepInBar === 0 || stepInBar === 6 || stepInBar === 10 || stepInBar === 12) {
      scheduleKick(startTime, stepInBar === 0 ? 0.04 : 0.032);
    }
    if (stepInBar === 8) {
      scheduleSnare(startTime, 0.02);
    }
  }
}

let activeMusicLoop = musicLoop;

const BOSS_GATE_ID = "plate2";

function isBossGateOpen() {
  if (!level || !level.platforms) return false;
  const bossGates = level.platforms.filter(
    (p) => p.type === "gate" && p.gateLink && p.gateLink.id === BOSS_GATE_ID
  );
  if (bossGates.length === 0) {
    return true;
  }
  return bossGates.some((p) => p.broken);
}

function isBossActive() {
  if (game.stage !== 1) return false;
  if (game.state !== "running") return false;
  if (!level || !level.enemies) return false;
  const boss = level.enemies.find((e) => e.role === "boss");
  if (!boss || !boss.alive) return false;
  if (level.bossEngaged) return true;
  const playerX = game.player.x;
  if (playerX > boss.minX - 120 && playerX < boss.maxX + 120 && isBossGateOpen()) {
    return true;
  }
  return false;
}

function updateBackgroundMusic() {
  const context = audio.context;
  if (!context || !audio.enabled || !audio.musicGain || context.state !== "running") {
    return;
  }

  startBackgroundMusic();

  const desiredLoop = isBossActive() ? bossMusicLoop : musicLoop;
  if (desiredLoop !== activeMusicLoop) {
    activeMusicLoop = desiredLoop;
    audio.musicStep = 0;
    audio.musicNextTime = context.currentTime + 0.06;
    if (desiredLoop === bossMusicLoop) {
      soundFx.bossRoar();
    }
  }

  const isBossVideoPlaying =
    game.bossCutscene?.active && game.bossCutscene.phase === BOSS_INTRO_VIDEO_PHASE;
  const baseMix =
    isBossVideoPlaying
      ? 0.03
      : game.state === "ad"
      ? 0.2
      : game.state === "won" || game.state === "gameover"
        ? 0.12
        : game.state === "intro" || game.state === "stage2Intro"
          ? 0.16
          : 0.28;
  const mixTarget = activeMusicLoop === bossMusicLoop ? Math.min(0.42, baseMix + 0.08) : baseMix;

  audio.musicGain.gain.cancelScheduledValues(context.currentTime);
  audio.musicGain.gain.linearRampToValueAtTime(mixTarget, context.currentTime + 0.12);

  const stepDuration = 60 / activeMusicLoop.tempo / activeMusicLoop.stepsPerBeat;
  while (audio.musicNextTime < context.currentTime + activeMusicLoop.lookAhead) {
    const swingOffset =
      audio.musicStep % 4 === 2 || audio.musicStep % 4 === 3
        ? stepDuration * (activeMusicLoop.swing ?? 0)
        : 0;
    scheduleMusicStep(audio.musicStep, audio.musicNextTime + swingOffset, activeMusicLoop);
    audio.musicNextTime += stepDuration;
    audio.musicStep = (audio.musicStep + 1) % activeMusicLoop.lead.length;
  }
}

const soundFx = {
  start() {
    scheduleTone({ freq: 392, endFreq: 523, duration: 0.08, volume: 0.08, type: "triangle" });
    scheduleTone({ freq: 523, endFreq: 659, offset: 0.09, duration: 0.1, volume: 0.09, type: "triangle" });
  },
  jump() {
    scheduleTone({ freq: 330, endFreq: 520, duration: 0.1, volume: 0.08, type: "square", release: 0.08 });
  },
  coin() {
    scheduleTone({ freq: 880, endFreq: 1180, duration: 0.06, volume: 0.08, type: "triangle", release: 0.06 });
    scheduleTone({ freq: 1180, endFreq: 1480, offset: 0.05, duration: 0.07, volume: 0.075, type: "triangle", release: 0.07 });
  },
  glassHit() {
    const t = audio.context ? audio.context.currentTime : 0;
    scheduleTone({ freq: 1560, endFreq: 2400, startTime: t, duration: 0.04, volume: 0.07, type: "triangle", attack: 0.002, release: 0.03 });
    scheduleTone({ freq: 2200, endFreq: 1200, startTime: t + 0.015, duration: 0.06, volume: 0.05, type: "square", attack: 0.002, release: 0.05 });
    scheduleNoiseBurst({ startTime: t, duration: 0.055, volume: 0.03, highpass: 2200, lowpass: 9000 });
  },
  canCollapse() {
    const t = audio.context ? audio.context.currentTime : 0;
    scheduleNoiseBurst({ startTime: t + 0.02, duration: 0.38, volume: 0.075, highpass: 140, lowpass: 2600 });
    scheduleTone({ freq: 140, endFreq: 64, startTime: t + 0.02, duration: 0.34, volume: 0.085, type: "sawtooth", attack: 0.01, release: 0.26 });
    scheduleTone({ freq: 220, endFreq: 92, startTime: t + 0.06, duration: 0.3, volume: 0.06, type: "square", attack: 0.01, release: 0.24 });
  },
  stomp() {
    scheduleTone({ freq: 240, endFreq: 170, duration: 0.07, volume: 0.09, type: "square", release: 0.05 });
    scheduleTone({ freq: 360, endFreq: 300, offset: 0.04, duration: 0.06, volume: 0.055, type: "triangle", release: 0.05 });
  },
  checkpoint() {
    scheduleTone({ freq: 494, endFreq: 554, duration: 0.08, volume: 0.07, type: "triangle" });
    scheduleTone({ freq: 622, endFreq: 698, offset: 0.08, duration: 0.08, volume: 0.075, type: "triangle" });
    scheduleTone({ freq: 784, endFreq: 880, offset: 0.16, duration: 0.1, volume: 0.085, type: "triangle" });
  },
  lose() {
    scheduleTone({ freq: 280, endFreq: 170, duration: 0.13, volume: 0.11, type: "sawtooth", release: 0.1 });
    scheduleTone({ freq: 180, endFreq: 96, offset: 0.08, duration: 0.18, volume: 0.09, type: "square", release: 0.12 });
  },
  respawn() {
    scheduleTone({ freq: 392, endFreq: 523, duration: 0.08, volume: 0.075, type: "triangle" });
    scheduleTone({ freq: 523, endFreq: 698, offset: 0.08, duration: 0.09, volume: 0.08, type: "triangle" });
  },
  win() {
    scheduleTone({ freq: 523, endFreq: 587, duration: 0.08, volume: 0.075, type: "triangle" });
    scheduleTone({ freq: 659, endFreq: 740, offset: 0.08, duration: 0.08, volume: 0.08, type: "triangle" });
    scheduleTone({ freq: 784, endFreq: 880, offset: 0.17, duration: 0.1, volume: 0.09, type: "triangle" });
    scheduleTone({ freq: 1046, endFreq: 1174, offset: 0.28, duration: 0.16, volume: 0.095, type: "triangle", release: 0.14 });
  },
  switchPress() {
    scheduleTone({ freq: 660, endFreq: 880, duration: 0.05, volume: 0.06, type: "square", release: 0.04 });
    scheduleTone({ freq: 880, endFreq: 1180, offset: 0.04, duration: 0.05, volume: 0.05, type: "triangle", release: 0.04 });
  },
  switchLock() {
    scheduleTone({ freq: 200, endFreq: 460, duration: 0.08, volume: 0.08, type: "square", release: 0.06 });
    scheduleTone({ freq: 460, endFreq: 740, offset: 0.06, duration: 0.08, volume: 0.07, type: "triangle", release: 0.05 });
    scheduleTone({ freq: 880, endFreq: 1320, offset: 0.13, duration: 0.1, volume: 0.075, type: "triangle", release: 0.07 });
  },
  gateOpen() {
    const t = audio.context ? audio.context.currentTime : 0;
    scheduleTone({ freq: 110, endFreq: 60, duration: 0.32, volume: 0.075, type: "sawtooth", release: 0.18 });
    scheduleTone({ freq: 220, endFreq: 110, offset: 0.05, duration: 0.28, volume: 0.06, type: "square", release: 0.16 });
    scheduleNoiseBurst({ startTime: t + 0.02, duration: 0.18, volume: 0.045, highpass: 800, lowpass: 4000 });
  },
  cratePush() {
    const t = audio.context ? audio.context.currentTime : 0;
    scheduleNoiseBurst({ startTime: t, duration: 0.06, volume: 0.025, highpass: 600, lowpass: 3200 });
    scheduleTone({ freq: 220, endFreq: 180, duration: 0.06, volume: 0.04, type: "triangle", release: 0.05 });
  },
  crateLand() {
    const t = audio.context ? audio.context.currentTime : 0;
    scheduleNoiseBurst({ startTime: t, duration: 0.18, volume: 0.06, highpass: 200, lowpass: 2400 });
    scheduleTone({ freq: 130, endFreq: 80, duration: 0.12, volume: 0.06, type: "sawtooth", release: 0.1 });
  },
  bossRoar() {
    const t = audio.context ? audio.context.currentTime : 0;
    scheduleTone({ freq: 95, endFreq: 60, startTime: t, duration: 0.5, volume: 0.13, type: "sawtooth", attack: 0.04, release: 0.4 });
    scheduleTone({ freq: 145, endFreq: 92, startTime: t + 0.04, duration: 0.42, volume: 0.09, type: "square", attack: 0.05, release: 0.32 });
    scheduleTone({ freq: 65, endFreq: 38, startTime: t + 0.02, duration: 0.55, volume: 0.1, type: "triangle", attack: 0.03, release: 0.4 });
    scheduleTone({ freq: 210, endFreq: 132, startTime: t + 0.03, duration: 0.28, volume: 0.05, type: "square", attack: 0.02, release: 0.2 });
    scheduleNoiseBurst({ startTime: t + 0.04, duration: 0.34, volume: 0.065, highpass: 160, lowpass: 2200 });
  },
  bossCharge() {
    const t = audio.context ? audio.context.currentTime : 0;
    scheduleTone({ freq: 220, endFreq: 980, startTime: t, duration: 0.18, volume: 0.085, type: "sawtooth", attack: 0.005, release: 0.08 });
    scheduleTone({ freq: 120, endFreq: 210, startTime: t, duration: 0.16, volume: 0.045, type: "triangle", attack: 0.01, release: 0.08 });
    scheduleTone({ freq: 980, endFreq: 680, startTime: t + 0.15, duration: 0.08, volume: 0.05, type: "square", attack: 0.004, release: 0.06 });
    scheduleNoiseBurst({ startTime: t + 0.04, duration: 0.14, volume: 0.045, highpass: 1000, lowpass: 7000 });
  },
  bossShoot() {
    const t = audio.context ? audio.context.currentTime : 0;
    scheduleTone({ freq: 1480, endFreq: 420, startTime: t, duration: 0.2, volume: 0.095, type: "square", attack: 0.005, release: 0.12 });
    scheduleTone({ freq: 720, endFreq: 200, startTime: t + 0.02, duration: 0.18, volume: 0.065, type: "triangle", attack: 0.01, release: 0.12 });
    scheduleTone({ freq: 2600, endFreq: 920, startTime: t, duration: 0.06, volume: 0.04, type: "sawtooth", attack: 0.002, release: 0.04 });
    scheduleNoiseBurst({ startTime: t, duration: 0.08, volume: 0.035, highpass: 1600, lowpass: 8600 });
  },
  bossSlam() {
    const t = audio.context ? audio.context.currentTime : 0;
    scheduleTone({ freq: 110, endFreq: 44, startTime: t, duration: 0.3, volume: 0.18, type: "square", attack: 0.005, release: 0.24 });
    scheduleTone({ freq: 60, endFreq: 24, startTime: t + 0.02, duration: 0.38, volume: 0.15, type: "triangle", attack: 0.01, release: 0.3 });
    scheduleTone({ freq: 180, endFreq: 72, startTime: t + 0.015, duration: 0.16, volume: 0.06, type: "sawtooth", attack: 0.005, release: 0.1 });
    scheduleNoiseBurst({ startTime: t, duration: 0.46, volume: 0.095, highpass: 90, lowpass: 1800 });
  },
  bossHit() {
    const t = audio.context ? audio.context.currentTime : 0;
    scheduleTone({ freq: 820, endFreq: 260, startTime: t, duration: 0.11, volume: 0.11, type: "square", attack: 0.005, release: 0.07 });
    scheduleTone({ freq: 420, endFreq: 140, startTime: t + 0.03, duration: 0.13, volume: 0.08, type: "sawtooth", attack: 0.005, release: 0.08 });
    scheduleNoiseBurst({ startTime: t, duration: 0.06, volume: 0.03, highpass: 1200, lowpass: 5600 });
  },
  bossPhaseShift() {
    const t = audio.context ? audio.context.currentTime : 0;
    scheduleTone({ freq: 160, endFreq: 320, startTime: t, duration: 0.18, volume: 0.11, type: "sawtooth", attack: 0.01, release: 0.12 });
    scheduleTone({ freq: 320, endFreq: 120, startTime: t + 0.16, duration: 0.32, volume: 0.12, type: "square", attack: 0.005, release: 0.22 });
    scheduleTone({ freq: 1040, endFreq: 1720, startTime: t + 0.04, duration: 0.16, volume: 0.055, type: "triangle", attack: 0.005, release: 0.08 });
    scheduleNoiseBurst({ startTime: t + 0.02, duration: 0.22, volume: 0.06, highpass: 800, lowpass: 6200 });
  },
  bossDefeat() {
    const t = audio.context ? audio.context.currentTime : 0;
    scheduleTone({ freq: 220, endFreq: 82, startTime: t, duration: 0.56, volume: 0.15, type: "sawtooth", attack: 0.005, release: 0.44 });
    scheduleTone({ freq: 110, endFreq: 44, startTime: t + 0.1, duration: 0.68, volume: 0.12, type: "square", attack: 0.01, release: 0.54 });
    scheduleTone({ freq: 54, endFreq: 28, startTime: t + 0.02, duration: 0.64, volume: 0.08, type: "triangle", attack: 0.01, release: 0.5 });
    scheduleNoiseBurst({ startTime: t + 0.04, duration: 0.56, volume: 0.1, highpass: 180, lowpass: 2600 });
    scheduleTone({ freq: 880, endFreq: 1320, startTime: t + 0.58, duration: 0.18, volume: 0.085, type: "triangle", release: 0.14 });
    scheduleTone({ freq: 1320, endFreq: 1760, startTime: t + 0.74, duration: 0.18, volume: 0.085, type: "triangle", release: 0.14 });
    scheduleTone({ freq: 1760, endFreq: 2200, startTime: t + 0.9, duration: 0.18, volume: 0.075, type: "triangle", release: 0.16 });
  },
  bonusPickup() {
    const t = audio.context ? audio.context.currentTime : 0;
    scheduleTone({ freq: 660, endFreq: 880, startTime: t, duration: 0.06, volume: 0.07, type: "triangle", release: 0.05 });
    scheduleTone({ freq: 880, endFreq: 1320, startTime: t + 0.05, duration: 0.07, volume: 0.07, type: "triangle", release: 0.06 });
    scheduleTone({ freq: 1320, endFreq: 1760, startTime: t + 0.12, duration: 0.08, volume: 0.075, type: "triangle", release: 0.07 });
    scheduleTone({ freq: 1760, endFreq: 2200, startTime: t + 0.2, duration: 0.1, volume: 0.07, type: "triangle", release: 0.08 });
  },
  spring() {
    const t = audio.context ? audio.context.currentTime : 0;
    scheduleTone({ freq: 220, endFreq: 880, startTime: t, duration: 0.1, volume: 0.07, type: "triangle", release: 0.08 });
    scheduleTone({ freq: 880, endFreq: 1480, startTime: t + 0.06, duration: 0.08, volume: 0.06, type: "square", release: 0.06 });
  },
  dash() {
    const t = audio.context ? audio.context.currentTime : 0;
    scheduleNoiseBurst({ startTime: t, duration: 0.08, volume: 0.04, highpass: 1200, lowpass: 9000 });
    scheduleTone({ freq: 880, endFreq: 320, startTime: t, duration: 0.1, volume: 0.07, type: "sawtooth", release: 0.08 });
  },
};

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function canDrawImage(image) {
  return image && image.complete && image.naturalWidth > 0;
}

function drawCoverImage(image, x, y, w, h, rotation = 0, scale = 1, offsetX = 0, offsetY = 0) {
  if (!canDrawImage(image)) {
    return false;
  }

  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = w / h;
  let drawW;
  let drawH;

  if (sourceRatio > targetRatio) {
    drawH = h * scale;
    drawW = drawH * sourceRatio;
  } else {
    drawW = w * scale;
    drawH = drawW / sourceRatio;
  }

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotation);
  ctx.drawImage(image, -drawW / 2 + offsetX * w, -drawH / 2 + offsetY * h, drawW, drawH);
  ctx.restore();
  return true;
}

function makePlatform(x, y, w, h, type = "ground", move = null, extra = {}) {
  return {
    x,
    y,
    w,
    h,
    type,
    move,
    baseX: x,
    baseY: y,
    prevX: x,
    prevY: y,
    dx: 0,
    dy: 0,
    spring: extra.spring ?? null,
    crumble: extra.crumble ?? null,
    spike: extra.spike ?? null,
    switchId: extra.switchId ?? null,
    switchState: extra.switchState ?? null,
    gateLink: extra.gateLink ?? null,
    coinGate: extra.coinGate ?? null,
    broken: false,
  };
}

function buildLevel() {
  const platforms = [];
  const coins = [];
  const enemies = [];
  const decorations = {
    clouds: [],
    hillsFar: [],
    hillsNear: [],
    towers: [],
    signs: [],
    stars: [],
  };
  const checkpoints = [];
  const switches = [];
  const crates = [];
  const bonusCoins = [];
  const bossProjectiles = [];
  const bossShockwaves = [];

  function addGround(x, width, y = FLOOR_Y) {
    platforms.push(makePlatform(x, y, width, HEIGHT - y, "ground"));
  }

  function addBrickRow(x, y, count, gap = 0, type = "brick") {
    for (let i = 0; i < count; i += 1) {
      platforms.push(makePlatform(x + i * (48 + gap), y, 48, 48, type));
    }
  }

  function addStoneColumn(x, y, levels) {
    for (let i = 0; i < levels; i += 1) {
      platforms.push(makePlatform(x, y - i * 48, 48, 48, "stone"));
    }
  }

  function addCoinsLine(x, y, count, spacing = 44) {
    for (let i = 0; i < count; i += 1) {
      coins.push({ x: x + i * spacing, y, r: COIN_RADIUS, collected: false, bob: i * 0.45 });
    }
  }

  function addEnemy(x, y, minX, maxX, speed = 1.35, label = "睏", brand = null) {
    enemies.push({
      x,
      y,
      w: 40,
      h: 32,
      minX,
      maxX,
      vx: speed * STAGE_ONE_DIFFICULTY.enemySpeedMultiplier,
      alive: true,
      squashTimer: 0,
      label,
      brand: brand || (enemies.length % 2 === 0 ? "redbull" : "monster"),
      role: "patrol",
      hp: 1,
    });
  }

  function addChargingEnemy(x, y, minX, maxX, speed = 1.55, label = "衝", brand = "monster") {
    enemies.push({
      x,
      y,
      w: 44,
      h: 36,
      minX,
      maxX,
      vx: speed * STAGE_ONE_DIFFICULTY.enemySpeedMultiplier,
      alive: true,
      squashTimer: 0,
      label,
      brand,
      role: "charger",
      hp: 1,
      sightRange: 280,
      chargeMultiplier: 2.4,
    });
  }

  function addBoss(x, y, minX, maxX) {
    enemies.push({
      x,
      y,
      w: 78,
      h: 76,
      baseY: y,
      minX,
      maxX,
      engagedMinX: BOSS_CHASE_LEFT_BOUND,
      engagedMaxX: Math.min(BOSS_ARENA_GROUND_X + BOSS_ARENA_GROUND_W - 20, maxX + BOSS_ENGAGED_LEASH_PAD_RIGHT),
      vx: 0,
      vy: 0,
      onGround: true,
      alive: true,
      squashTimer: 0,
      label: "終",
      brand: "redbull",
      baseBrand: "redbull",
      secondFormBrand: "monster",
      secondFormActive: false,
      formHp: 5,
      transformTimer: 0,
      transformTotal: 0,
      transformFromBrand: null,
      transformToBrand: null,
      role: "boss",
      hp: 5,
      maxHp: 5,
      cooldown: 0,
      phase: "patrol",
      phaseTimer: 0,
      actionCooldown: 280,
      enraged: false,
      tellTimer: 0,
      lastBouncedAt: 0,
    });
  }

  function addSpring(x, surfaceY, w = 64) {
    platforms.push(makePlatform(x, surfaceY, w, 10, "spring", null, { spring: { power: 17.5 } }));
  }

  function addCrumblePlatform(x, y, w = 84, threshold = 28) {
    platforms.push(makePlatform(x, y, w, 16, "crumble", null, { crumble: { fallTimer: 0, threshold } }));
  }

  function addRotorPlatform(anchorX, anchorY, orbitRadius, w = 96, h = 18, phase = 0, speed = 0.032) {
    const startX = anchorX + Math.cos(phase) * orbitRadius - w / 2;
    const startY = anchorY + Math.sin(phase) * (orbitRadius * 0.72) - h / 2;
    platforms.push(
      makePlatform(
        startX,
        startY,
        w,
        h,
        "rotor",
        {
          phase,
          speed,
          anchorX,
          anchorY,
          orbitRadiusX: orbitRadius,
          orbitRadiusY: orbitRadius * 0.72,
          spinSpeed: 2.2,
        }
      )
    );
  }

  function addSpikeStrip(x, w, y = FLOOR_Y) {
    platforms.push(
      makePlatform(x, y - 2, w, HEIGHT - y + 2, "spike", null, { spike: true })
    );
  }

  function addSwitch(id, x, y, w = 60, mode = "press") {
    const state = { id, active: false, locked: false, mode };
    switches.push(state);
    platforms.push(
      makePlatform(x, y, w, 12, "switch", null, {
        switchId: id,
        switchState: state,
      })
    );
  }

  function addGate(x, y, w, h, linkedId, label = "閘") {
    platforms.push(
      makePlatform(x, y, w, h, "gate", null, { gateLink: { id: linkedId, label } })
    );
  }

  function addCoinGate(x, y, w, h, threshold) {
    platforms.push(
      makePlatform(x, y, w, h, "coinGate", null, {
        coinGate: { threshold, opened: false },
      })
    );
  }

  function addCrate(x, y, w = 42, h = 42) {
    crates.push({
      x,
      y,
      w,
      h,
      vx: 0,
      vy: 0,
      prevX: x,
      prevY: y,
      onGround: false,
    });
  }

  function addBonusCoin(x, y, value = 5) {
    bonusCoins.push({
      x,
      y,
      r: 22,
      collected: false,
      bob: Math.random() * Math.PI * 2,
      value,
    });
  }

  function addCloud(x, y, scale) {
    decorations.clouds.push({ x, y, scale });
  }

  function addHill(x, w, h, near = false) {
    const target = near ? decorations.hillsNear : decorations.hillsFar;
    target.push({ x, w, h });
  }

  function addTower(x, y, w, h, color) {
    decorations.towers.push({ x, y, w, h, color });
  }

  function addBillboard(x, y, w = 218, h = 132, caption = "喝一口，繼續衝", tag = "提神", lines = []) {
    decorations.signs.push({ x, y, w, h, caption, tag, lines });
  }

  function addCheckpoint(x, spawnX, label) {
    checkpoints.push({ x, spawnX, spawnY: 318, label, active: false });
  }

  // Stage 1 is boss-only: keep arena ground + billboard.
  addGround(3000, 1540);
  // Background billboards: worldbuilding (not sponsorship). Keep above playfield.
  addBillboard(3150, 154, 250, 136, "國民底氣回歸", "康貝特200P", [
    "7維他命補給",
    "胺基酸 + 牛磺酸",
  ]);
  addBillboard(3430, 176, 230, 120, "配方雙重升級", "喝了再上", [
    "咖啡因 1.5倍",
    "容量 1.25倍",
  ]);
  addBillboard(3688, 150, 244, 134, "清爽氣泡補能", "活力氣泡", [
    "順口不膩",
    "學生上班族都撐",
  ]);
  addBillboard(4048, 162, 236, 128, "奪回塔頂配方", "市場逆襲", [
    "高CP值提神",
    "送回大街小巷",
  ]);
  addBoss(3908, FLOOR_Y - 76, 3844, 4184);

  const stageOneWorldWidth = 4680;
  const goal = null;
  const finishArch = null;

  // Keep background layers (clouds / hills) as a backdrop.
  [
    [3050, 74, 1.05],
    [3360, 88, 1.28],
    [3720, 66, 1.02],
    [4090, 92, 1.34],
    [4480, 72, 1.1],
  ].forEach(([x, y, scale]) => addCloud(x, y, scale));

  [
    [2920, 520, 84],
    [3480, 460, 102],
    [4040, 560, 92],
  ].forEach(([x, w, h]) => addHill(x, w, h, false));

  [
    [3040, 420, 108],
    [3650, 480, 138],
    [4250, 430, 116],
  ].forEach(([x, w, h]) => addHill(x, w, h, true));

  const visiblePlatforms = platforms.filter((platform) => platform.x < stageOneWorldWidth + 120);
  const visibleCoins = coins.filter((coin) => coin.x < stageOneWorldWidth - 80);
  const visibleEnemies = enemies.filter((enemy) => enemy.x < stageOneWorldWidth - 120);
  const visibleCheckpoints = checkpoints.filter((checkpoint) => checkpoint.x < stageOneWorldWidth - 120);
  const visibleDecorations = {
    ...decorations,
    clouds: decorations.clouds.filter((cloud) => cloud.x < stageOneWorldWidth + 400),
    hillsFar: decorations.hillsFar.filter((hill) => hill.x < stageOneWorldWidth + 500),
    hillsNear: decorations.hillsNear.filter((hill) => hill.x < stageOneWorldWidth + 420),
    signs: decorations.signs.filter((sign) => sign.x < stageOneWorldWidth + 220),
  };

  return {
    spawn: { x: 3218, y: 318 },
    platforms: visiblePlatforms,
    coins: visibleCoins,
    enemies: visibleEnemies,
    decorations: visibleDecorations,
    checkpoints: visibleCheckpoints,
    switches,
    crates,
    bonusCoins,
    bossProjectiles,
    bossShockwaves,
    bossEngaged: false,
    bossIntroDone: false,
    initialCrates: crates.map((c) => ({ x: c.x, y: c.y })),
    goal,
    finishArch,
    worldWidth: stageOneWorldWidth,
  };
}

const level = buildLevel();

function createPlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    prevX: spawn.x,
    prevY: spawn.y,
    w: 48,
    h: 46,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    jumpBuffer: 0,
    coyote: 0,
    jumpsRemaining: 2,
    invincible: 0,
    landingDust: 0,
    dashTimer: 0,
    dashCooldown: 0,
    runDustTimer: 0,
  };
}

const game = {
  player: createPlayer(level.spawn),
  stage: 1,
  state: "intro",
  pendingStageTransition: null,
  pendingStageTransitionTimer: 0,
  sceneTransition: null,
  winFx: null,
  finalVictoryVideo: null,
  prologueTimer: 0,
  stageTwoClearedAt: null,
  stageTwoClearedFrames: 0,
  stageTwoClearHandled: false,
  coins: 0,
  totalCoins:
    level.coins.length +
    ((level.bonusCoins || []).reduce((sum, c) => sum + (c.value || 1), 0)),
  lives: PLAYER_START_LIVES,
  elapsed: 0,
  timeLeft: STAGE_ONE_TIME_LIMIT,
  cameraX: 0,
  checkpoint: { x: level.spawn.x, y: level.spawn.y },
  checkpointLabel: "起點",
  overlayTimer: 0,
  overlayText: "點一下進入提神宇宙",
  flashTimer: 0,
  timeBoostEarned: 0,
  adTimer: 0,
  adDuration: DEATH_AD_DURATION,
  adSkippableAt: DEATH_AD_SKIP_AT,
  adImpression: 0,
  pendingAdOutcome: null,
  pendingDeathReason: null,
  pendingDeathBrand: null,
  stageTwo: null,
  stageTwoOutro: null,
  comboCount: 0,
  comboTimer: 0,
  comboBest: 0,
  stomps: 0,
  deaths: 0,
  startedAt: 0,
  bossCutscene: null,
  pausedFromState: null,
  bossWarningShown: false,
  bossShockwaveHintShown: false,
  endingScene: null,
};

const STAGE_TWO_OUTRO_TOTAL_FRAMES = 780;

function startStageTwoToBossCutscene(stageTwo) {
  const projectileBody = stageTwo?.projectile?.body;
  const impactX =
    stageTwo?.lastImpactX ??
    projectileBody?.position?.x ??
    stageTwo?.sling?.x ??
    WIDTH * 0.6;
  const impactY =
    stageTwo?.lastImpactY ??
    projectileBody?.position?.y ??
    stageTwo?.sling?.y ??
    HEIGHT * 0.5;
  game.stageTwoOutro = {
    timer: 0,
    impactX,
    impactY,
    sfxPlayed: false,
    glassPlayed: false,
    collapsePlayed: false,
    slowmo: 0,
  };
  game.state = "stage2Outro";
  game.overlayTimer = 0;
  game.overlayText = "";
}

function finishStageTwoToBossCutscene() {
  if (game.state !== "stage2Outro") return;
  game.stageTwoOutro = null;
  enterBossStageFromSlingshot();
}

function enterWonResults() {
  if (game.stageTwo) {
    game.stage = 2;
  }
  game.state = "won";
  game.winFx = createWinFx();
  game.overlayTimer = 9999;
  game.overlayText = "康貝特200p 重見天日！";
  soundFx.win();
  updateHud();
}

/** Softer scene fades (frames @ ~60fps). Longer + ease curves feel less abrupt than quick cuts. */
const SCENE_TR_DEFAULT = { outFrames: 46, holdFrames: 28, inFrames: 46 };
const SCENE_TR_BOSS_TO_STAGE2 = {
  outFrames: 48,
  holdFrames: 26,
  inFrames: 48,
  caption: "前往第二階段",
  captionSub: "擊碎通路高牆",
};
const SCENE_TR_SLINGSHOT_TO_BOSS = {
  // ~13.7s @ 60fps (used as the long storyboard bridge to the tower).
  outFrames: 200,
  holdFrames: 420,
  inFrames: 200,
  caption: "殺出一條血路",
  captionSub: "仰望能量巨塔 → 登頂救出200p",
  variant: "tower",
};
const SCENE_TR_TO_ENDING = {
  outFrames: 52,
  holdFrames: 30,
  inFrames: 52,
  caption: "壟斷結界碎裂",
  captionSub: "拯救康貝特200p",
};
const SCENE_TR_ENDING_TO_FINAL = {
  outFrames: 44,
  holdFrames: 24,
  inFrames: 44,
  caption: "準備結算",
  captionSub: "完整勝利回放",
};

function easeSceneFadeOut(t) {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function easeSceneFadeIn(t) {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 4);
}

function startSceneTransition(action, opts = {}) {
  const outFrames = opts.outFrames ?? SCENE_TR_DEFAULT.outFrames;
  const inFrames = opts.inFrames ?? SCENE_TR_DEFAULT.inFrames;
  const holdFrames = opts.holdFrames ?? SCENE_TR_DEFAULT.holdFrames;
  game.sceneTransition = {
    phase: "out",
    timer: 0,
    outFrames,
    holdFrames,
    inFrames,
    alpha: 0,
    actionDone: false,
    action,
    caption: opts.caption ?? "",
    captionSub: opts.captionSub ?? "",
    variant: opts.variant ?? "",
  };
}

function updateSceneTransition(frameScale) {
  const tr = game.sceneTransition;
  if (!tr) return false;

  tr.timer += frameScale;
  if (tr.phase === "out") {
    const t = clamp(tr.timer / Math.max(1, tr.outFrames), 0, 1);
    tr.alpha = easeSceneFadeOut(t);
    if (tr.timer >= tr.outFrames && !tr.actionDone) {
      tr.actionDone = true;
      try {
        tr.action?.();
      } catch {
        // ignore transition action errors to avoid breaking the render loop
      }
      tr.phase = tr.holdFrames > 0 ? "hold" : "in";
      tr.timer = 0;
    }
  } else if (tr.phase === "hold") {
    tr.alpha = 1;
    if (tr.timer >= tr.holdFrames) {
      tr.phase = "in";
      tr.timer = 0;
    }
  } else {
    const t = clamp(tr.timer / Math.max(1, tr.inFrames), 0, 1);
    tr.alpha = 1 - easeSceneFadeIn(t);
    if (tr.timer >= tr.inFrames) {
      game.sceneTransition = null;
      return false;
    }
  }
  return true;
}

function getTransitionVisualProgress(tr) {
  if (tr.phase === "out") {
    return clamp((tr.timer / Math.max(1, tr.outFrames)) * 0.34, 0, 0.34);
  }
  if (tr.phase === "hold") {
    return 0.34 + clamp(tr.timer / Math.max(1, tr.holdFrames), 0, 1) * 0.46;
  }
  return 0.8 + clamp(tr.timer / Math.max(1, tr.inFrames), 0, 1) * 0.2;
}

function drawTransitionCan(image, x, y, h, rotation = 0, fallback = "#ef2a3e") {
  const w = h * 0.43;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.shadowColor = "rgba(255, 216, 102, 0.35)";
  ctx.shadowBlur = 18;
  if (canDrawImage(image)) {
    ctx.drawImage(image, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = fallback;
    roundRect(-w / 2, -h / 2, w, h, 8);
    ctx.fill();
  }
  ctx.restore();
}

function drawTowerSceneTransition(tr, alpha) {
  const p = getTransitionVisualProgress(tr);
  const open = easeOutCubic(clamp((p - 0.12) / 0.44, 0, 1));
  const towerGlow = clamp((p - 0.44) / 0.42, 0, 1);
  // Beat 3: hero at the base, then a fast pan-up to reveal the glowing dome/cage.
  const panUp = easeOutCubic(clamp((p - 0.08) / 0.22, 0, 1));
  const panYOffset = -220 + panUp * 260; // from base view (up) → top view (down)
  const panSpeed = clamp((p - 0.09) / 0.12, 0, 1) * clamp((0.26 - p) / 0.12, 0, 1);

  ctx.save();
  ctx.globalAlpha = alpha * 0.92;
  ctx.translate(0, panYOffset);

  // Cinematic sky + atmosphere (no gameplay bleed-through).
  const sky = ctx.createLinearGradient(0, -120, 0, 620);
  sky.addColorStop(0, "rgba(18, 28, 72, 1)");
  sky.addColorStop(0.48, "rgba(12, 18, 35, 1)");
  sky.addColorStop(1, "rgba(6, 10, 22, 1)");
  ctx.fillStyle = sky;
  ctx.fillRect(0, -120, WIDTH, HEIGHT + 240);

  // Stars (subtle, deterministic pattern).
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "rgba(255, 252, 245, 1)";
  for (let i = 0; i < 70; i += 1) {
    const x = (i * 73) % 980;
    const y = ((i * 131) % 420) - 40;
    const r = 0.9 + ((i * 17) % 10) * 0.06;
    ctx.globalAlpha = 0.12 + (((i * 29) % 10) / 10) * 0.22;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Film grain (very subtle; sells the “cinematic” look).
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = "rgba(255,255,255,1)";
  for (let i = 0; i < 180; i += 1) {
    const x = (i * 53 + 17) % 980;
    const y = ((i * 97 + 31) % 620) - 60;
    const s = 1 + ((i * 19) % 3);
    ctx.globalAlpha = 0.02 + (((i * 31) % 10) / 10) * 0.05;
    ctx.fillRect(x, y, s, 1);
  }
  ctx.restore();

  // Ground haze / dust band (gives depth and scale).
  ctx.save();
  const haze = ctx.createLinearGradient(0, 360, 0, 610);
  haze.addColorStop(0, "rgba(255, 216, 102, 0)");
  haze.addColorStop(0.35, "rgba(255, 216, 102, 0.08)");
  haze.addColorStop(1, "rgba(12, 18, 35, 0.72)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 340, WIDTH, 280);
  ctx.restore();

  const towerX = 654;
  // Taller tower so the base reads before we pan up.
  const towerY = -40;
  const towerW = 182;
  const towerH = 440;
  const towerRight = towerX + towerW;

  // Cast shadow to ground haze (anchors tower in space).
  ctx.save();
  ctx.globalAlpha = 0.55;
  const shadowGrad = ctx.createRadialGradient(
    towerX + towerW / 2,
    510,
    40,
    towerX + towerW / 2,
    510,
    340
  );
  shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.42)");
  shadowGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.18)");
  shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(towerX + towerW / 2, 510, 220, 76, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Tower base platform + railing silhouette (adds realism/scale).
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "rgba(6, 10, 22, 0.95)";
  roundRect(towerX - 64, towerY + towerH - 44, towerW + 128, 64, 22);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 216, 102, 0.12)";
  roundRect(towerX - 58, towerY + towerH - 40, towerW + 116, 8, 8);
  ctx.fill();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "rgba(255, 252, 245, 0.55)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i += 1) {
    const rx = towerX - 44 + i * 30;
    ctx.beginPath();
    ctx.moveTo(rx, towerY + towerH - 32);
    ctx.lineTo(rx, towerY + towerH - 8);
    ctx.stroke();
  }
  ctx.restore();

  // Tower crown (top cap + antenna), with warm rim light.
  ctx.save();
  const crownY = towerY - 26;
  ctx.globalAlpha = 0.9;
  const crownGrad = ctx.createLinearGradient(towerX, crownY, towerRight, crownY);
  crownGrad.addColorStop(0, "rgba(36, 72, 170, 0.85)");
  crownGrad.addColorStop(0.55, "rgba(10, 16, 40, 0.92)");
  crownGrad.addColorStop(1, "rgba(6, 10, 22, 0.96)");
  ctx.fillStyle = crownGrad;
  roundRect(towerX + 18, crownY, towerW - 36, 34, 14);
  ctx.fill();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = `rgba(255, 216, 102, ${0.10 + towerGlow * 0.18})`;
  ctx.lineWidth = 3;
  roundRect(towerX + 18, crownY, towerW - 36, 34, 14);
  ctx.stroke();
  // Antenna / spire
  const spx = towerX + towerW / 2;
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = "rgba(255, 252, 245, 0.22)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(spx, crownY);
  ctx.lineTo(spx, crownY - 38);
  ctx.stroke();
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = `rgba(255, 216, 102, ${0.18 + towerGlow * 0.18})`;
  ctx.beginPath();
  ctx.arc(spx, crownY - 42, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Tower body (multi-layer: core, edge highlights, panel seams, windows).
  const bodyGrad = ctx.createLinearGradient(towerX, towerY, towerX + towerW, towerY);
  bodyGrad.addColorStop(0, "rgba(36, 72, 170, 0.92)");
  bodyGrad.addColorStop(0.22, "rgba(18, 38, 92, 0.92)");
  bodyGrad.addColorStop(0.55, "rgba(10, 16, 40, 0.94)");
  bodyGrad.addColorStop(1, "rgba(6, 10, 22, 0.96)");
  // Perspective taper (top slightly narrower) for realism.
  const taper = 10;
  const topInset = taper;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(towerX + topInset, towerY + 6);
  ctx.lineTo(towerRight - topInset, towerY + 6);
  ctx.lineTo(towerRight, towerY + towerH - 10);
  ctx.lineTo(towerX, towerY + towerH - 10);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = bodyGrad;
  roundRect(towerX, towerY, towerW, towerH, 26);
  ctx.fill();
  ctx.restore();

  // Inner bevel / depth.
  ctx.save();
  ctx.globalAlpha = 0.9;
  const innerGrad = ctx.createLinearGradient(towerX, towerY, towerX, towerY + towerH);
  innerGrad.addColorStop(0, "rgba(255, 252, 245, 0.08)");
  innerGrad.addColorStop(0.35, "rgba(255, 252, 245, 0.02)");
  innerGrad.addColorStop(1, "rgba(0, 0, 0, 0.18)");
  ctx.fillStyle = innerGrad;
  roundRect(towerX + 10, towerY + 10, towerW - 20, towerH - 20, 20);
  ctx.fill();
  ctx.restore();

  // Edge highlights (left cool, right warm rim).
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 3;
  const leftRim = ctx.createLinearGradient(towerX, towerY, towerX + 26, towerY);
  leftRim.addColorStop(0, "rgba(180, 220, 255, 0.42)");
  leftRim.addColorStop(1, "rgba(180, 220, 255, 0)");
  ctx.strokeStyle = leftRim;
  ctx.beginPath();
  ctx.moveTo(towerX + 10, towerY + 18);
  ctx.lineTo(towerX + 10, towerY + towerH - 18);
  ctx.stroke();
  const rightRim = ctx.createLinearGradient(towerRight - 26, towerY, towerRight, towerY);
  rightRim.addColorStop(0, "rgba(255, 216, 102, 0)");
  rightRim.addColorStop(1, `rgba(255, 216, 102, ${0.22 + towerGlow * 0.25})`);
  ctx.strokeStyle = rightRim;
  ctx.beginPath();
  ctx.moveTo(towerRight - 10, towerY + 26);
  ctx.lineTo(towerRight - 10, towerY + towerH - 26);
  ctx.stroke();
  ctx.restore();

  // Panel seams (suggest realism).
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "rgba(255, 252, 245, 1)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i += 1) {
    const yy = towerY + 54 + i * 36;
    ctx.beginPath();
    ctx.moveTo(towerX + 18, yy);
    ctx.lineTo(towerRight - 18, yy);
    ctx.stroke();
  }
  ctx.restore();

  // Subtle material texture (micro speckle + faint vertical streaks).
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.beginPath();
  roundRect(towerX + 10, towerY + 12, towerW - 20, towerH - 24, 20);
  ctx.clip();
  for (let i = 0; i < 140; i += 1) {
    const x = towerX + 14 + ((i * 37) % (towerW - 28));
    const y = towerY + 18 + ((i * 71) % (towerH - 40));
    const r = 0.6 + ((i * 13) % 10) * 0.05;
    const a = 0.06 + (((i * 19) % 10) / 10) * 0.10;
    ctx.globalAlpha = a;
    ctx.fillStyle = i % 3 === 0 ? "rgba(255, 252, 245, 1)" : "rgba(0,0,0,1)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = "rgba(255, 252, 245, 1)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i += 1) {
    const sx = towerX + 22 + i * 22 + ((i % 2) * 4);
    ctx.beginPath();
    ctx.moveTo(sx, towerY + 30);
    ctx.lineTo(sx, towerY + towerH - 44);
    ctx.stroke();
  }
  ctx.restore();

  // Windows: warm scattered lights (pixel-clean rectangles).
  ctx.save();
  const winFlicker = 0.75 + 0.25 * Math.sin(p * 12);
  ctx.globalAlpha = 0.62 * winFlicker;
  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      const seed = r * 17 + c * 41;
      const on = (seed % 5) !== 0;
      if (!on) continue;
      const wx = towerX + 38 + c * 38;
      const wy = towerY + 160 + r * 26;
      const w = 16;
      const h = 8;
      const a = 0.10 + ((seed % 7) / 7) * 0.18 + towerGlow * 0.18;
      ctx.fillStyle = `rgba(255, 216, 102, ${a})`;
      roundRect(wx, wy, w, h, 3);
      ctx.fill();
    }
  }
  ctx.restore();

  // Vertical structure ribs (parallax-friendly, subtle).
  ctx.save();
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 3; i += 1) {
    const rx = towerX + 28 + i * 50;
    const ribGrad = ctx.createLinearGradient(rx - 6, towerY, rx + 6, towerY);
    ribGrad.addColorStop(0, "rgba(255, 252, 245, 0)");
    ribGrad.addColorStop(0.5, "rgba(255, 252, 245, 0.32)");
    ribGrad.addColorStop(1, "rgba(255, 252, 245, 0)");
    ctx.fillStyle = ribGrad;
    ctx.fillRect(rx - 3, towerY + 24, 6, towerH - 72);
  }
  ctx.restore();

  // Beat 3: hero stands at the base and looks up.
  const baseHold = clamp((0.18 - p) / 0.18, 0, 1);
  if (baseHold > 0.001) {
    const x = towerX - 112;
    const y = towerY + towerH - 36 + Math.sin(p * 8) * 2;
    const r = 18;
    ctx.save();
    ctx.globalAlpha = 0.45 + baseHold * 0.55;
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.55 + baseHold * 0.45;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    if (!drawCoverImage(art.face, x - r, y - r, r * 2, r * 2, -Math.PI / 2, 1.45, 0.07, -0.03)) {
      ctx.fillStyle = "#f4cfaa";
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.55 * baseHold;
    ctx.fillStyle = "rgba(12, 18, 35, 0.72)";
    roundRect(x - 92, y - 58, 184, 36, 14);
    ctx.fill();
    ctx.fillStyle = "#fff7e8";
    ctx.font = "bold 14px Avenir Next, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("（仰望能量巨塔…）", x, y - 40);
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  // Beat 4: hero head climbing the tower (simple, readable motion).
  const climb = easeOutCubic(clamp((p - 0.26) / 0.54, 0, 1));
  let heroX = null;
  let heroY = null;
  if (climb > 0.001) {
    // Continuous climb (avoid “steppy” motion).
    const bob = Math.sin(p * Math.PI * 16) * 2.8;
    const fromX = towerX - 28;
    const toX = towerRight - 18;
    const x = fromX + (toX - fromX) * (0.25 + climb * 0.75);
    const y = (towerY + towerH - 36) - (towerH - 120) * climb + bob;
    const r = 18;
    heroX = x;
    heroY = y;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    if (!drawCoverImage(art.face, x - r, y - r, r * 2, r * 2, -Math.PI / 2, 1.45, 0.07, -0.03)) {
      ctx.fillStyle = "#f4cfaa";
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();

    // Tiny “handhold” ticks on the tower edge for clarity.
    ctx.save();
    ctx.globalAlpha = 0.35 + climb * 0.25;
    ctx.strokeStyle = "rgba(255, 247, 232, 0.65)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i += 1) {
      const yy = towerY + 70 + i * 38;
      ctx.beginPath();
      ctx.moveTo(towerRight - 10, yy);
      ctx.lineTo(towerRight + 6, yy - 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.fillStyle = `rgba(255, 216, 102, ${0.12 + towerGlow * 0.38})`;
  ctx.beginPath();
  ctx.arc(towerX + towerW / 2, towerY + 120, 96 + towerGlow * 38, 0, Math.PI * 2);
  ctx.fill();

  // Make the cage window readable: remove the heavy white glass.
  const cageX = towerX + 46;
  const cageY = towerY + 92;
  const cageW = 90;
  const cageH = 156;
  const cageCX = cageX + cageW / 2;
  const cageCY = cageY + cageH / 2;

  // Interior shadow (gives depth behind bars/can).
  ctx.save();
  ctx.globalAlpha = 0.55;
  const innerShadow = ctx.createRadialGradient(
    cageX + cageW / 2,
    cageY + cageH / 2 + 18,
    10,
    cageX + cageW / 2,
    cageY + cageH / 2 + 18,
    120
  );
  innerShadow.addColorStop(0, "rgba(0, 0, 0, 0)");
  innerShadow.addColorStop(0.55, "rgba(0, 0, 0, 0.22)");
  innerShadow.addColorStop(1, "rgba(0, 0, 0, 0.5)");
  ctx.fillStyle = innerShadow;
  roundRect(cageX + 6, cageY + 10, cageW - 12, cageH - 20, 12);
  ctx.fill();
  ctx.restore();

  // Cage glow bed (warm) behind bars.
  ctx.save();
  const cageGlow = ctx.createRadialGradient(
    cageCX,
    cageCY,
    10,
    cageCX,
    cageCY,
    140
  );
  cageGlow.addColorStop(0, `rgba(255, 216, 102, ${0.18 + towerGlow * 0.22})`);
  cageGlow.addColorStop(0.55, `rgba(255, 216, 102, ${0.05 + towerGlow * 0.10})`);
  cageGlow.addColorStop(1, "rgba(255, 216, 102, 0)");
  ctx.fillStyle = cageGlow;
  ctx.beginPath();
  ctx.arc(cageCX, cageCY, 130, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Bloom pass (screen blend) for premium glow.
  const bloom = clamp((p - 0.12) / 0.22, 0, 1) * (0.25 + towerGlow * 0.75);
  if (bloom > 0.001) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.18 * bloom;
    const bloomGrad = ctx.createRadialGradient(cageCX, cageCY, 0, cageCX, cageCY, 220);
    bloomGrad.addColorStop(0, "rgba(255, 252, 245, 0.95)");
    bloomGrad.addColorStop(0.28, "rgba(255, 216, 102, 0.55)");
    bloomGrad.addColorStop(0.7, "rgba(255, 168, 96, 0.12)");
    bloomGrad.addColorStop(1, "rgba(255, 168, 96, 0)");
    ctx.fillStyle = bloomGrad;
    ctx.beginPath();
    ctx.arc(cageCX, cageCY, 220, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Glass panel (subtle refraction).
  ctx.save();
  const glassGrad = ctx.createLinearGradient(cageX, cageY, cageX + cageW, cageY + cageH);
  glassGrad.addColorStop(0, "rgba(255, 252, 245, 0.10)");
  glassGrad.addColorStop(0.35, "rgba(180, 220, 255, 0.06)");
  glassGrad.addColorStop(0.65, "rgba(255, 216, 102, 0.07)");
  glassGrad.addColorStop(1, "rgba(255, 252, 245, 0.14)");
  ctx.fillStyle = glassGrad;
  roundRect(cageX, cageY, cageW, cageH, 16);
  ctx.fill();
  ctx.restore();

  // Outer frame with thickness + shadow.
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.32)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = "rgba(255, 216, 102, 0.12)";
  roundRect(cageX - 3, cageY - 3, cageW + 6, cageH + 6, 18);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = `rgba(255, 216, 102, ${0.72 + towerGlow * 0.20})`;
  ctx.lineWidth = 4;
  roundRect(cageX, cageY, cageW, cageH, 16);
  ctx.stroke();
  ctx.restore();

  // Bars: thicker with inner highlight to read as metal.
  const barCount = 5;
  for (let i = 0; i < barCount; i += 1) {
    const bx = cageX + 14 + i * 15;
    const by1 = cageY + 10;
    const by2 = cageY + cageH - 10;
    const metal = ctx.createLinearGradient(bx - 3, 0, bx + 3, 0);
    metal.addColorStop(0, `rgba(10, 16, 40, ${0.55 + towerGlow * 0.10})`);
    metal.addColorStop(0.45, `rgba(255, 252, 245, ${0.06 + towerGlow * 0.06})`);
    metal.addColorStop(1, `rgba(10, 16, 40, ${0.62 + towerGlow * 0.12})`);
    ctx.strokeStyle = metal;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(bx, by1);
    ctx.lineTo(bx, by2);
    ctx.stroke();

    // Specular tick highlight (feels like metal catching light).
    ctx.save();
    ctx.globalAlpha = (0.10 + towerGlow * 0.12) * (0.6 + 0.4 * Math.sin(p * 10 + i));
    ctx.strokeStyle = "rgba(255, 252, 245, 0.9)";
    ctx.lineWidth = 1.6;
    const hy = cageY + 32 + ((i * 23) % 80);
    ctx.beginPath();
    ctx.moveTo(bx - 2, hy);
    ctx.lineTo(bx + 3, hy - 6);
    ctx.stroke();
    ctx.restore();
  }
  ctx.lineCap = "butt";

  // Ambient occlusion at frame edges (adds depth).
  ctx.save();
  ctx.globalAlpha = 0.55;
  const ao = ctx.createRadialGradient(
    cageX + cageW / 2,
    cageY + cageH / 2,
    30,
    cageX + cageW / 2,
    cageY + cageH / 2,
    120
  );
  ao.addColorStop(0, "rgba(0,0,0,0)");
  ao.addColorStop(0.55, "rgba(0,0,0,0.10)");
  ao.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = ao;
  roundRect(cageX, cageY, cageW, cageH, 16);
  ctx.fill();
  ctx.restore();

  // Glass streak highlight (animated sweep for polish).
  const sweep = clamp((p - 0.18) / 0.5, 0, 1);
  if (sweep > 0.001) {
    const sx = cageX - 30 + sweep * (cageW + 80);
    ctx.save();
    ctx.globalAlpha = (0.08 + towerGlow * 0.06) * (0.35 + 0.65 * Math.sin(p * Math.PI));
    ctx.fillStyle = "rgba(255, 252, 245, 1)";
    ctx.beginPath();
    ctx.moveTo(sx, cageY + 8);
    ctx.lineTo(sx + 26, cageY + 8);
    ctx.lineTo(sx - 12, cageY + cageH - 8);
    ctx.lineTo(sx - 38, cageY + cageH - 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Glass dome highlight (Beat 3 reveal target).
  const domeReveal = clamp((p - 0.12) / 0.18, 0, 1);
  if (domeReveal > 0.001) {
    const cx = towerX + towerW / 2;
    const cy = towerY + 170;
    ctx.save();
    ctx.globalAlpha = 0.22 + domeReveal * 0.30;
    const dome = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120);
    dome.addColorStop(0, `rgba(255, 216, 102, ${0.38 + towerGlow * 0.18})`);
    dome.addColorStop(0.48, `rgba(255, 216, 102, ${0.12 + towerGlow * 0.12})`);
    dome.addColorStop(1, "rgba(255, 216, 102, 0)");
    ctx.fillStyle = dome;
    ctx.beginPath();
    ctx.arc(cx, cy, 120, 0, Math.PI * 2);
    ctx.fill();
    // Specular arcs (glass realism).
    ctx.globalAlpha = 0.28 + domeReveal * 0.45;
    ctx.strokeStyle = "rgba(255, 252, 245, 0.62)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(cx - 10, cy - 10, 74, 56, 0.08, Math.PI * 1.12, Math.PI * 1.92);
    ctx.stroke();
    ctx.globalAlpha = 0.18 + domeReveal * 0.28;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(cx + 6, cy + 8, 64, 46, 0.08, Math.PI * 0.92, Math.PI * 1.58);
    ctx.stroke();
    ctx.restore();

    // Refraction ring (adds “real glass” feel).
    ctx.save();
    ctx.globalAlpha = (0.10 + towerGlow * 0.12) * domeReveal;
    const ring = ctx.createRadialGradient(cx, cy, 30, cx, cy, 96);
    ring.addColorStop(0, "rgba(255, 252, 245, 0)");
    ring.addColorStop(0.55, "rgba(180, 220, 255, 0.14)");
    ring.addColorStop(0.75, "rgba(255, 216, 102, 0.10)");
    ring.addColorStop(1, "rgba(255, 252, 245, 0)");
    ctx.strokeStyle = ring;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 78, 60, 0.08, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Glass thickness edge + moving light sweep (final polish).
    ctx.save();
    ctx.globalAlpha = (0.14 + towerGlow * 0.14) * domeReveal;
    ctx.strokeStyle = "rgba(255, 252, 245, 0.45)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 84, 64, 0.08, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = (0.08 + towerGlow * 0.10) * domeReveal;
    ctx.strokeStyle = "rgba(90, 180, 255, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy + 2, 80, 60, 0.08, 0, Math.PI * 2);
    ctx.stroke();
    const sweepP = clamp((p - 0.14) / 0.5, 0, 1);
    const sweepX = cx - 120 + sweepP * 240;
    ctx.globalAlpha = (0.09 + towerGlow * 0.10) * domeReveal;
    ctx.fillStyle = "rgba(255, 252, 245, 1)";
    ctx.beginPath();
    ctx.moveTo(sweepX - 22, cy - 70);
    ctx.lineTo(sweepX + 14, cy - 70);
    ctx.lineTo(sweepX + 56, cy + 70);
    ctx.lineTo(sweepX + 20, cy + 70);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Volumetric beam + gold dust around the cage (premium look).
  const beam = clamp((p - 0.14) / 0.22, 0, 1);
  if (beam > 0.001) {
    const cx = towerX + towerW / 2;
    const topY = cageY - 26;
    const bottomY = cageY + cageH + 70;
    ctx.save();
    ctx.globalAlpha = (0.10 + towerGlow * 0.10) * beam;
    const beamGrad = ctx.createLinearGradient(cx, topY, cx, bottomY);
    beamGrad.addColorStop(0, "rgba(255, 216, 102, 0)");
    beamGrad.addColorStop(0.28, "rgba(255, 216, 102, 0.22)");
    beamGrad.addColorStop(0.7, "rgba(255, 216, 102, 0.08)");
    beamGrad.addColorStop(1, "rgba(255, 216, 102, 0)");
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 70, topY);
    ctx.lineTo(cx + 70, topY);
    ctx.lineTo(cx + 120, bottomY);
    ctx.lineTo(cx - 120, bottomY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    const dustAlpha = (0.18 + towerGlow * 0.22) * beam;
    for (let i = 0; i < 24; i += 1) {
      const ang = p * 7 + i * 0.9;
      const rr = 22 + ((i * 19) % 30);
      const dx = cx + Math.cos(ang) * rr + (i % 3) * 8;
      // Drift upwards for a “holy dust” feel.
      const up = (p * 120 + i * 9) % 120;
      const dy =
        cageY +
        cageH / 2 +
        Math.sin(ang * 1.12) * rr * 0.8 +
        ((i * 23) % 60) -
        30 -
        up * (0.55 + towerGlow * 0.15);
      ctx.globalAlpha = dustAlpha * (0.35 + ((i * 37) % 10) / 10);
      ctx.fillStyle = "rgba(255, 216, 102, 1)";
      ctx.beginPath();
      ctx.arc(dx, dy, 1.2 + ((i * 13) % 10) * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Rescue target in the cage (the only “product” shown here).
  const canX = towerX + towerW / 2;
  const canY = towerY + 170;
  // Shadow to anchor the can inside the cage.
  ctx.save();
  ctx.globalAlpha = 0.35 + towerGlow * 0.25;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(canX + 2, canY + 44, 36, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawTransitionCan(art.product, canX, canY, 104, Math.sin(p * 8) * 0.04, "#f7fbff");
  // Warm rim light on the can (feels like the dome is emitting light).
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = (0.10 + towerGlow * 0.12) * domeReveal;
  const rim = ctx.createRadialGradient(canX - 10, canY - 10, 10, canX, canY, 90);
  rim.addColorStop(0, "rgba(255, 252, 245, 0.9)");
  rim.addColorStop(0.35, "rgba(255, 216, 102, 0.35)");
  rim.addColorStop(1, "rgba(255, 216, 102, 0)");
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(canX, canY, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Lens flare hints around the golden cage glow (very subtle, premium feel).
  const flare = clamp((p - 0.16) / 0.18, 0, 1) * (0.25 + towerGlow * 0.75);
  if (flare > 0.001) {
    const fx = cageX + cageW / 2;
    const fy = cageY + cageH / 2 - 8;
    ctx.save();
    ctx.globalAlpha = 0.12 * flare;
    ctx.strokeStyle = "rgba(255, 252, 245, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx - 120, fy);
    ctx.lineTo(fx + 120, fy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(fx, fy - 90);
    ctx.lineTo(fx, fy + 90);
    ctx.stroke();
    ctx.restore();
  }

  // Pan-up motion lines (cinematic camera feel; only during fast pan window).
  if (panSpeed > 0.001) {
    ctx.save();
    ctx.globalAlpha = 0.22 * panSpeed;
    ctx.strokeStyle = "rgba(255, 252, 245, 0.5)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i += 1) {
      const x = 40 + i * 68 + ((i % 3) - 1) * 8;
      const y = -40 + ((i * 97) % 520);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 70 + (i % 4) * 16);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Final vignette + subtle color separation glow (post-process feel).
  ctx.save();
  const post = clamp((p - 0.02) / 0.18, 0, 1);
  ctx.globalAlpha = 0.55 * post;
  const vig = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2 - 40, 120, WIDTH / 2, HEIGHT / 2, 820);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(0.55, "rgba(0,0,0,0.18)");
  vig.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, -120, WIDTH, HEIGHT + 240);
  ctx.restore();

  // Subtle chroma-ish halo around the cage glow.
  const chroma = clamp((p - 0.16) / 0.18, 0, 1) * (0.35 + towerGlow * 0.65);
  if (chroma > 0.001) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.06 * chroma;
    ctx.fillStyle = "rgba(90, 180, 255, 1)";
    ctx.beginPath();
    ctx.arc(cageX + cageW / 2 - 6, cageY + cageH / 2 - 2, 170, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.05 * chroma;
    ctx.fillStyle = "rgba(255, 148, 96, 1)";
    ctx.beginPath();
    ctx.arc(cageX + cageW / 2 + 6, cageY + cageH / 2 + 2, 170, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Beat 5: exhausted line after reaching the top.
  const pant = clamp((p - 0.86) / 0.12, 0, 1);
  if (pant > 0.001 && heroX != null && heroY != null) {
    ctx.save();
    ctx.globalAlpha = pant;
    const bubbleW = 204;
    const bubbleH = 44;
    const bubbleX = heroX - bubbleW / 2;
    const bubbleY = heroY - 74;

    // Speech bubble body.
    ctx.shadowColor = "rgba(0,0,0,0.28)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = "rgba(255, 252, 246, 0.96)";
    roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 18);
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Tail pointing to the actual hero head.
    ctx.fillStyle = "rgba(255, 252, 246, 0.96)";
    ctx.beginPath();
    ctx.moveTo(heroX - 10, bubbleY + bubbleH - 2);
    ctx.lineTo(heroX + 8, bubbleY + bubbleH - 2);
    ctx.lineTo(heroX - 2, heroY - 24);
    ctx.closePath();
    ctx.fill();

    // Outline (subtle).
    ctx.strokeStyle = "rgba(25, 70, 184, 0.18)";
    ctx.lineWidth = 2;
    roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 18);
    ctx.stroke();

    // Text.
    ctx.fillStyle = "#16203d";
    ctx.font = "bold 14px Avenir Next, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("哈…哈…終於爬上來了…", heroX, bubbleY + bubbleH / 2 + 1);
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  ctx.fillStyle = "#fff7e8";
  ctx.font = "bold 16px Avenir Next, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("能量巨塔", towerX + towerW / 2, towerY + 340);
  ctx.fillStyle = "rgba(255, 247, 232, 0.72)";
  ctx.font = "12px Avenir Next, sans-serif";
  ctx.fillText("康貝特200p封印處", towerX + towerW / 2, towerY + 364);

  const sparkCount = 7;
  for (let i = 0; i < sparkCount; i += 1) {
    const angle = p * Math.PI * 2 + i * ((Math.PI * 2) / sparkCount);
    const radius = 70 + Math.sin(p * 7 + i) * 12;
    const sx = towerX + towerW / 2 + Math.cos(angle) * radius;
    const sy = towerY + 142 + Math.sin(angle) * radius * 0.58;
    ctx.fillStyle = `rgba(255, 216, 102, ${0.32 + towerGlow * 0.42})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 3 + towerGlow * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSceneTransition() {
  const tr = game.sceneTransition;
  if (!tr) return;
  const a = clamp(tr.alpha, 0, 1);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a * 0.94;
  const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 80, WIDTH / 2, HEIGHT / 2, 760);
  vignette.addColorStop(0, "rgba(25, 42, 92, 0.78)");
  vignette.addColorStop(0.55, "rgba(12, 18, 35, 0.94)");
  vignette.addColorStop(1, "rgba(6, 10, 22, 1)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (tr.variant === "tower") {
    drawTowerSceneTransition(tr, a);
  }

  const cap = tr.caption || "";
  const sub = tr.captionSub || "";
  if (cap || sub) {
    let capAlpha = a;
    if (tr.phase === "out") capAlpha = clamp((a - 0.35) / 0.55, 0, 1);
    else if (tr.phase === "in") capAlpha = clamp(a / 0.65, 0, 1);
    ctx.globalAlpha = capAlpha * 0.98;
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff7e8";
    ctx.font = "bold 26px Avenir Next, sans-serif";
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 12;
    ctx.fillText(cap, WIDTH / 2, HEIGHT / 2 - 12);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 247, 232, 0.82)";
    ctx.font = "600 15px Avenir Next, sans-serif";
    ctx.fillText(sub, WIDTH / 2, HEIGHT / 2 + 18);
  }
  ctx.restore();
}

function createStageTwoProjectile(anchor) {
  return {
    state: "ready",
    x: anchor.x,
    y: anchor.y,
    vx: 0,
    vy: 0,
    r: 18,
    rotation: 0,
  };
}

function isMatterAvailable() {
  return typeof window !== "undefined" && !!window.Matter;
}

function makeBlockBody(block) {
  const { Bodies } = window.Matter;
  const def = STAGE_TWO_MATERIALS[block.material] || STAGE_TWO_MATERIALS.wood;
  return Bodies.rectangle(
    block.x + block.w / 2,
    block.y + block.h / 2,
    block.w,
    block.h,
    {
      density: def.density,
      friction: def.friction,
      frictionStatic: def.frictionStatic,
      restitution: def.restitution,
      slop: 0.01,
      chamfer: { radius: def.chamfer },
      sleepThreshold: 30,
      label: `block:${block.material}`,
    }
  );
}

function makeTargetBody(target) {
  const { Bodies, Sleeping } = window.Matter;
  const body = Bodies.rectangle(
    target.x + target.w / 2,
    target.y + target.h / 2,
    target.w,
    target.h,
    {
      density: 0.0017,
      friction: 0.55,
      frictionStatic: 0.7,
      restitution: 0.08,
      slop: 0.01,
      chamfer: { radius: 10 },
      label: `target:${target.brand}`,
    }
  );
  if (Sleeping) {
    body.sleepThreshold = Infinity;
  }
  return body;
}

function makeProjectileBody(projectile) {
  const { Bodies } = window.Matter;
  return Bodies.rectangle(
    projectile.x,
    projectile.y,
    STAGE_TWO_PROJECTILE.width,
    STAGE_TWO_PROJECTILE.height,
    {
      density: STAGE_TWO_PROJECTILE.density,
      friction: STAGE_TWO_PROJECTILE.friction,
      frictionAir: STAGE_TWO_PROJECTILE.frictionAir,
      restitution: STAGE_TWO_PROJECTILE.restitution,
      slop: 0.01,
      chamfer: { radius: 12 },
      label: "projectile",
    }
  );
}

function createStageTwoPhysics(stageTwo) {
  if (!isMatterAvailable()) {
    return null;
  }

  const { Engine, World, Bodies, Body, Constraint, Events } = window.Matter;

  const engine = Engine.create({
    enableSleeping: true,
    positionIterations: 10,
    velocityIterations: 8,
    constraintIterations: 4,
  });

  const world = engine.world;
  world.gravity.x = 0;
  world.gravity.y = 1.05;

  const ground = Bodies.rectangle(WIDTH / 2, stageTwo.groundY + 90, WIDTH + 400, 180, {
    isStatic: true,
    friction: 0.95,
    frictionStatic: 1.1,
    restitution: 0.02,
    label: "ground",
  });

  const leftWall = Bodies.rectangle(-200, HEIGHT / 2, 360, HEIGHT * 2, { isStatic: true, label: "wall" });
  const rightWall = Bodies.rectangle(WIDTH + 200, HEIGHT / 2, 360, HEIGHT * 2, { isStatic: true, label: "wall" });

  World.add(world, [ground, leftWall, rightWall]);

  stageTwo.blocks.forEach((block) => {
    block.body = makeBlockBody(block);
    World.add(world, block.body);
  });

  stageTwo.targets.forEach((target) => {
    target.body = makeTargetBody(target);
    World.add(world, target.body);
  });

  const physics = {
    engine,
    world,
    ground,
    slingConstraint: null,
    projectileBody: null,
    spentFrames: 0,
    flightFrames: 0,
    impactEvents: [],
    fuseFrames: null,
    fuseSpeed: 0,
  };

  Events.on(engine, "collisionStart", (event) => {
    for (const pair of event.pairs) {
      physics.impactEvents.push(pair);

      if (
        physics.fuseFrames == null &&
        physics.projectileBody &&
        stageTwo.projectile.state === "flying"
      ) {
        const a = pair.bodyA;
        const b = pair.bodyB;
        const projectileBody = physics.projectileBody;
        const involves = a === projectileBody || b === projectileBody;
        if (involves) {
          const other = a === projectileBody ? b : a;
          if (other.label !== "wall") {
            const collisionSpeed = Math.hypot(
              a.velocity.x - b.velocity.x,
              a.velocity.y - b.velocity.y
            );
            physics.fuseFrames = STAGE_TWO_FUSE_FRAMES;
            physics.fuseSpeed = collisionSpeed;
            stageTwo.bestImpact = Math.max(stageTwo.bestImpact, collisionSpeed);
            stageTwo.lastImpactTimer = 24;
            // Lock the cinematic outro camera to the actual impact point (not the sling after reset).
            stageTwo.lastImpactX = projectileBody.position.x;
            stageTwo.lastImpactY = projectileBody.position.y;
            spawnStageTwoFlash(
              projectileBody.position.x,
              projectileBody.position.y,
              28
            );
            for (let i = 0; i < 8; i += 1) {
              spawnStageTwoDebris(
                projectileBody.position.x,
                projectileBody.position.y,
                "#ffe6a3",
                1,
                {
                  speed: 3 + Math.random() * 3,
                  spread: Math.PI * 2,
                  drag: 0.9,
                  angle: 0,
                  gravity: 0.05,
                }
              );
            }
            soundFx.coin();
            triggerStageTwoShake(Math.min(7, collisionSpeed * 0.45));
          }
        }
      }
    }
  });

  function createProjectileBody() {
    const { projectile } = stageTwo;
    const body = makeProjectileBody(projectile);
    physics.projectileBody = body;
    projectile.body = body;
    World.add(world, body);
    return body;
  }

  function attachSling() {
    const { sling } = stageTwo;
    const body = physics.projectileBody || createProjectileBody();
    const constraint = Constraint.create({
      pointA: { x: sling.x, y: sling.y },
      bodyB: body,
      pointB: { x: 0, y: 0 },
      stiffness: 0.018,
      damping: 0.06,
      length: 0,
    });
    physics.slingConstraint = constraint;
    World.add(world, constraint);
  }

  createProjectileBody();
  attachSling();

  physics.resetProjectile = () => {
    const { projectile } = stageTwo;
    if (physics.slingConstraint) {
      World.remove(world, physics.slingConstraint);
      physics.slingConstraint = null;
    }
    if (physics.projectileBody) {
      World.remove(world, physics.projectileBody);
      physics.projectileBody = null;
    }
    projectile.rotation = 0;
    projectile.state = "ready";
    projectile.x = stageTwo.sling.x;
    projectile.y = stageTwo.sling.y;
    projectile.body = null;
    physics.spentFrames = 0;
    physics.flightFrames = 0;
    physics.impactEvents.length = 0;
    physics.fuseFrames = null;
    physics.fuseSpeed = 0;
    createProjectileBody();
    attachSling();
  };

  physics.cancelSling = () => {
    if (physics.slingConstraint) {
      World.remove(world, physics.slingConstraint);
      physics.slingConstraint = null;
    }
  };

  physics.holdProjectile = (x, y, rotation = 0) => {
    if (!physics.projectileBody) {
      return;
    }
    Body.setStatic(physics.projectileBody, true);
    Body.setPosition(physics.projectileBody, { x, y });
    Body.setAngle(physics.projectileBody, rotation);
    Body.setVelocity(physics.projectileBody, { x: 0, y: 0 });
    Body.setAngularVelocity(physics.projectileBody, 0);
    physics.projectileBody.collisionFilter = { category: 0x0002, mask: 0x0000 };
  };

  physics.releaseProjectileFromHold = () => {
    if (physics.projectileBody) {
      Body.setStatic(physics.projectileBody, false);
      physics.projectileBody.collisionFilter = { category: 0x0001, mask: 0xffffffff };
    }
  };

  physics.releaseSling = () => {
    const { projectile, sling } = stageTwo;
    const body = physics.projectileBody;
    if (!body) {
      return;
    }

    const dx = sling.x - projectile.x;
    const dy = sling.y - projectile.y;
    const distance = Math.hypot(dx, dy);
    const pull = clamp(distance / sling.maxPull, 0, 1);
    const launchPower = easeOutCubic(pull) * STAGE_TWO_PROJECTILE.maxLaunchSpeed;
    const angle = distance > 0.0001 ? Math.atan2(dy, dx) : -Math.PI / 2;
    const vx = Math.cos(angle) * launchPower;
    const vy = Math.sin(angle) * launchPower;

    physics.cancelSling();
    physics.releaseProjectileFromHold();

    Body.setVelocity(body, { x: vx, y: vy });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2);
    projectile.state = "flying";
    physics.flightFrames = 0;
  };

  physics.syncToGameObjects = () => {
    const { projectile } = stageTwo;
    if (physics.projectileBody) {
      projectile.x = physics.projectileBody.position.x;
      projectile.y = physics.projectileBody.position.y;
      projectile.rotation = physics.projectileBody.angle;
    }

    stageTwo.blocks.forEach((block) => {
      if (!block.body || block.broken) {
        return;
      }
      block.x = block.body.position.x - block.w / 2;
      block.y = block.body.position.y - block.h / 2;
      block.rotation = block.body.angle;
    });

    stageTwo.targets.forEach((target) => {
      if (target.state !== "alive" || !target.body) {
        return;
      }
      target.x = target.body.position.x - target.w / 2;
      target.y = target.body.position.y - target.h / 2;
      target.rotation = target.body.angle;
      target.vx = target.body.velocity.x;
      target.vy = target.body.velocity.y;
      target.angVel = target.body.angularVelocity;
    });
  };

  physics.tickFuse = (frameScale) => {
    if (physics.fuseFrames == null) return;
    physics.fuseFrames -= frameScale;
    if (physics.fuseFrames <= 0) {
      const body = physics.projectileBody;
      const x = body ? body.position.x : stageTwo.projectile.x;
      const y = body ? body.position.y : stageTwo.projectile.y;
      stageTwo.bestImpact = Math.max(stageTwo.bestImpact, physics.fuseSpeed || 0);
      stageTwo.lastImpactTimer = 24;
      stageTwo.projectile.x = x;
      stageTwo.projectile.y = y;
      triggerStageTwoExplosion(stageTwo, x, y);
      physics.fuseFrames = null;
      physics.fuseSpeed = 0;
      physics.impactEvents.length = 0;
    }
  };

  physics.processImpacts = () => {
    const projectileBody = physics.projectileBody;

    for (const pair of physics.impactEvents) {
      const a = pair.bodyA;
      const b = pair.bodyB;
      const collisionSpeed = Math.hypot(
        a.velocity.x - b.velocity.x,
        a.velocity.y - b.velocity.y
      );

      const involvesProjectile = projectileBody && (a === projectileBody || b === projectileBody);

      if (collisionSpeed > 6) {
        const cx = (a.position.x + b.position.x) / 2;
        const cy = (a.position.y + b.position.y) / 2;
        triggerStageTwoShake(Math.min(8, collisionSpeed * 0.6));
        spawnStageTwoFlash(cx, cy, 18 + collisionSpeed * 1.6);
      }

      if (!involvesProjectile) {
        const blockA = stageTwo.blocks.find((b1) => b1.body === a);
        const blockB = stageTwo.blocks.find((b1) => b1.body === b);
        const heavyHit = collisionSpeed > 8;
        if (heavyHit) {
          if (blockA && !blockA.broken) damageBlock(stageTwo, blockA, collisionSpeed * 0.5);
          if (blockB && !blockB.broken) damageBlock(stageTwo, blockB, collisionSpeed * 0.5);
          const targetA = stageTwo.targets.find((t) => t.body === a);
          const targetB = stageTwo.targets.find((t) => t.body === b);
          if (collisionSpeed > 11) {
            if (targetA && targetA.state === "alive") destroyStageTwoTargetWithBody(stageTwo, targetA, 70);
            if (targetB && targetB.state === "alive") destroyStageTwoTargetWithBody(stageTwo, targetB, 70);
          }
        }
      }
    }

    physics.impactEvents.length = 0;
  };

  physics.checkProjectileSpent = (frameScale) => {
    const { projectile } = stageTwo;
    if (!physics.projectileBody) {
      return;
    }
    if (projectile.state !== "flying") {
      physics.spentFrames = 0;
      return;
    }

    physics.flightFrames += frameScale;

    const speed = Math.hypot(physics.projectileBody.velocity.x, physics.projectileBody.velocity.y);
    if (speed < 0.5 && physics.flightFrames > 12) {
      physics.spentFrames += frameScale;
    } else {
      physics.spentFrames = 0;
    }

    if (physics.spentFrames > 36 || physics.flightFrames > 720) {
      projectile.state = "spent";
    }
  };

  physics.step = (deltaMs) => {
    const clampedDelta = Math.min(20, deltaMs);
    const subSteps = 2;
    const subDelta = clampedDelta / subSteps;
    for (let i = 0; i < subSteps; i += 1) {
      window.Matter.Engine.update(engine, subDelta);
    }
  };

  return physics;
}

function wakeAllStageTwoBodies(stageTwo) {
  if (!stageTwo || !stageTwo.physics) return;
  const Sleeping = window.Matter && window.Matter.Sleeping;
  if (!Sleeping) return;
  const wake = (body) => {
    if (!body || body.isStatic) return;
    if (body.isSleeping) Sleeping.set(body, false);
  };
  stageTwo.blocks.forEach((b) => {
    if (!b.broken && b.body) wake(b.body);
  });
  stageTwo.targets.forEach((t) => {
    if (t.state === "alive" && t.body) wake(t.body);
  });
  if (stageTwo.projectile && stageTwo.projectile.body) {
    wake(stageTwo.projectile.body);
  }
}

function damageBlock(stageTwo, block, impactSpeed) {
  if (!block || block.broken) {
    return;
  }
  const def = STAGE_TWO_MATERIALS[block.material] || STAGE_TWO_MATERIALS.wood;
  const damage = impactSpeed > def.breakImpactBonus ? 2 : 1;
  block.hp -= damage;
  if (block.hp <= 0) {
    breakStageTwoBlock(stageTwo, block);
    if (stageTwo.physics && block.body) {
      window.Matter.World.remove(stageTwo.physics.world, block.body);
      block.body = null;
    }
    wakeAllStageTwoBodies(stageTwo);
  }
}

function destroyStageTwoTargetWithBody(stageTwo, target, bonus) {
  destroyStageTwoTarget(stageTwo, target, bonus);
  if (stageTwo.physics && target.body) {
    window.Matter.World.remove(stageTwo.physics.world, target.body);
    target.body = null;
  }
  wakeAllStageTwoBodies(stageTwo);
}

const STAGE_TWO_EXPLOSION = {
  radius: 150,
  killRadius: 96,
  impulseSpeed: 22,
  upwardKick: 9,
  blockDamage: 7.5,
};

const STAGE_TWO_FUSE_FRAMES = 9;

function triggerStageTwoExplosion(stageTwo, x, y) {
  const physics = stageTwo.physics;
  const radius = STAGE_TWO_EXPLOSION.radius;
  const killRadius = STAGE_TWO_EXPLOSION.killRadius;

  spawnStageTwoFlash(x, y, radius * 1.6);
  spawnStageTwoFlash(x, y, radius * 1.0);
  spawnStageTwoFlash(x, y, radius * 0.5);
  spawnStageTwoDebris(x, y, "#fff1a8", 26, {
    speed: 11,
    spread: Math.PI * 2,
    drag: 0.96,
    angle: 0,
    gravity: 0.18,
  });
  spawnStageTwoDebris(x, y, "#ff8a3d", 22, {
    speed: 8,
    spread: Math.PI * 2,
    drag: 0.965,
    angle: 0,
    gravity: 0.2,
  });
  spawnStageTwoDebris(x, y, "#c33a1f", 16, {
    speed: 5.2,
    spread: Math.PI * 2,
    drag: 0.97,
    angle: 0,
    gravity: 0.22,
  });
  spawnStageTwoDebris(x, y, "rgba(45, 30, 20, 0.92)", 14, {
    speed: 3.2,
    spread: Math.PI * 2,
    drag: 0.972,
    angle: 0,
    gravity: 0.32,
  });
  triggerStageTwoShake(20);
  soundFx.stomp();
  soundFx.coin();
  soundFx.lose();

  const collected = [];
  if (physics) {
    stageTwo.blocks.forEach((block) => {
      if (block.broken || !block.body) return;
      const dx = block.body.position.x - x;
      const dy = block.body.position.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist <= radius) {
        collected.push({ kind: "block", ref: block, dx, dy, dist });
      }
    });
    stageTwo.targets.forEach((target) => {
      if (target.state !== "alive" || !target.body) return;
      const dx = target.body.position.x - x;
      const dy = target.body.position.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist <= radius) {
        collected.push({ kind: "target", ref: target, dx, dy, dist });
      }
    });
  }

  collected.forEach(({ kind, ref, dx, dy, dist }) => {
    const fall = 1 - clamp(dist / radius, 0, 1);
    const eased = easeOutCubic(fall);
    const angle = dist > 0.001 ? Math.atan2(dy, dx) : -Math.PI / 2;
    const speed = STAGE_TWO_EXPLOSION.impulseSpeed * (0.5 + eased * 1.4);
    const upward = STAGE_TWO_EXPLOSION.upwardKick * eased;

    if (ref.body) {
      const newVx = ref.body.velocity.x + Math.cos(angle) * speed;
      const newVy = ref.body.velocity.y + Math.sin(angle) * speed - upward;
      window.Matter.Body.setVelocity(ref.body, { x: newVx, y: newVy });
      window.Matter.Body.setAngularVelocity(
        ref.body,
        ref.body.angularVelocity + (Math.random() - 0.5) * 0.5 * eased
      );
    }

    if (kind === "block") {
      damageBlock(stageTwo, ref, STAGE_TWO_EXPLOSION.blockDamage * (0.6 + eased * 1.6));
    } else if (kind === "target" && dist <= killRadius) {
      destroyStageTwoTargetWithBody(stageTwo, ref, 180);
    }
  });

  if (physics && physics.projectileBody) {
    window.Matter.World.remove(physics.world, physics.projectileBody);
    physics.projectileBody = null;
    stageTwo.projectile.body = null;
  }
  stageTwo.projectile.state = "spent";
  stageTwo.resetDelay = 24;
  wakeAllStageTwoBodies(stageTwo);
}

function makeStageTwoBlock(x, y, w, h, material) {
  const def = STAGE_TWO_MATERIALS[material] || STAGE_TWO_MATERIALS.wood;
  return {
    x,
    y,
    w,
    h,
    material,
    hp: def.hp,
    maxHp: def.hp,
    broken: false,
    rotation: 0,
    body: null,
  };
}

function makeStageTwoTarget(x, y, brand) {
  return {
    x,
    y,
    w: 36,
    h: 64,
    brand,
    state: "alive",
    vx: 0,
    vy: 0,
    rotation: 0,
    angVel: 0,
    poofTimer: 0,
    body: null,
  };
}

function buildStageTwoFortress() {
  const blocks = [];
  const targets = [];
  const targetW = 36;
  const targetH = 64;

  function tower(baseX, baseY, levels, materials) {
    let cursorY = baseY;
    levels.forEach((level, idx) => {
      const material = materials[idx] || materials[materials.length - 1];
      const colW = level.colW ?? 18;
      const slabH = level.slabH ?? 18;
      const colH = level.colH ?? 60;

      blocks.push(makeStageTwoBlock(baseX, cursorY - colH, colW, colH, material));
      blocks.push(
        makeStageTwoBlock(baseX + level.span - colW, cursorY - colH, colW, colH, material)
      );
      blocks.push(
        makeStageTwoBlock(baseX, cursorY - colH - slabH, level.span, slabH, material)
      );

      if (level.target) {
        targets.push(
          makeStageTwoTarget(
            baseX + (level.span - targetW) / 2,
            cursorY - targetH,
            level.target
          )
        );
      }

      cursorY -= colH + slabH;
    });
  }

  tower(560, 414, [
    { span: 132, colH: 64, slabH: 16, target: "redbull" },
    { span: 132, colH: 56, slabH: 14, target: "monster" },
  ], ["wood", "wood"]);

  tower(740, 414, [
    { span: 110, colH: 70, slabH: 18, target: "monster" },
    { span: 110, colH: 60, slabH: 16, target: "redbull" },
    { span: 110, colH: 50, slabH: 14, target: "monster" },
  ], ["stone", "wood", "glass"]);

  tower(880, 414, [
    { span: 120, colH: 64, slabH: 18, target: "redbull" },
    { span: 120, colH: 56, slabH: 14 },
  ], ["wood", "glass"]);

  blocks.push(makeStageTwoBlock(516, 396, 50, 18, "stone"));
  blocks.push(makeStageTwoBlock(694, 396, 46, 18, "stone"));

  return { blocks, targets };
}

function createStageTwo() {
  const sling = { x: 168, y: 354, maxPull: 108 };

  const fortress = buildStageTwoFortress();
  const startingShots = 6;

  const stageTwo = {
    sling,
    groundY: 430,
    startingShots,
    shotsLeft: startingShots,
    score: 0,
    resetDelay: 0,
    dragging: false,
    projectile: createStageTwoProjectile(sling),
    blocks: fortress.blocks,
    targets: fortress.targets,
    bestImpact: 0,
    consecutiveHits: 0,
    lastImpactTimer: 0,
  };

  stageTwo.physics = createStageTwoPhysics(stageTwo);
  return stageTwo;
}

function resetStageTwoProjectile(stageTwo) {
  stageTwo.projectile = createStageTwoProjectile(stageTwo.sling);
  stageTwo.dragging = false;
  stageTwo.resetDelay = 0;
  if (stageTwo.physics) {
    stageTwo.physics.resetProjectile();
  }
  if (
    game.stageTwo === stageTwo &&
    game.state === "stage2Playing" &&
    stageTwo.shotsLeft > 0 &&
    countStageTwoActiveTargets(stageTwo) > 0
  ) {
    game.overlayTimer = 54;
    game.overlayText =
      stageTwo.shotsLeft === 1 ? "最後一發上架砲彈，瞄準再射" : "下一發上架砲彈就緒，繼續砸牆";
  }
}

function countStageTwoActiveTargets(stageTwo) {
  return stageTwo.targets.filter((target) => target.state !== "dead").length;
}

function isStageTwoCleared(stageTwo) {
  return countStageTwoActiveTargets(stageTwo) <= 0;
}

function breakStageTwoBlock(stageTwo, block) {
  if (block.broken) {
    return;
  }
  block.broken = true;
  const def = STAGE_TWO_MATERIALS[block.material] || STAGE_TWO_MATERIALS.wood;
  const points = block.material === "stone" ? 35 : block.material === "glass" ? 28 : 20;
  stageTwo.score += points;
  const cx = block.x + block.w / 2;
  const cy = block.y + block.h / 2;
  const debrisCount = block.material === "glass" ? 14 : block.material === "stone" ? 10 : 9;
  spawnStageTwoDebris(cx, cy, def.palette.face, debrisCount, {
    speed: block.material === "glass" ? 5.6 : 3.6,
    spread: Math.PI * 1.6,
    drag: block.material === "glass" ? 0.97 : 0.984,
  });
  spawnStageTwoFlash(cx, cy, block.material === "glass" ? 48 : 30);
  triggerStageTwoShake(block.material === "stone" ? 6 : 3.5);
  soundFx.coin();
}

function destroyStageTwoTarget(stageTwo, target, bonus = 140) {
  if (target.state !== "alive") {
    return;
  }
  target.state = "poof";
  target.poofTimer = 22;
  target.vx = 0;
  target.vy = -1.4;
  target.angVel = 0;
  stageTwo.score += bonus;
  const cx = target.x + target.w / 2;
  const cy = target.y + target.h / 2;
  spawnStageTwoFlash(cx, cy, 56);
  spawnStageTwoDebris(
    cx,
    cy,
    target.brand === "monster" ? "#9bff8a" : "#ffd2bd",
    12,
    { speed: 5.2, spread: Math.PI * 1.6, drag: 0.978 }
  );
  triggerStageTwoShake(7);
  soundFx.stomp();
  if (game.stageTwo === stageTwo && game.state === "stage2Playing") {
    const remainingTargets = stageTwo.targets.filter(
      (t) => t !== target && t.state !== "dead" && t.state !== "poof"
    ).length;
    game.overlayTimer = 58;
    game.overlayText = remainingTargets > 0 ? `通路破口擴大！剩餘封鎖 ${remainingTargets}` : "通路高牆全破！";
  }
}

function enterStageTwo() {
  game.stage = 2;
  game.state = "stage2Intro";
  resetStageTwoFx();
  game.stageTwo = createStageTwo();
  game.stageTwoClearedAt = null;
  game.stageTwoClearedFrames = 0;
  game.stageTwoClearHandled = false;
  game.cameraX = 0;
  game.overlayTimer = 0;
  game.overlayText = SLINGSHOT_FIRST_ORDER ? "第一階段：擊碎！通路高牆" : "第二階段：擊碎！通路高牆";
}

function enterBossStageFromSlingshot() {
  resetStageOneWorldEntities();
  resetStageOneFx();
  game.player = createPlayer(level.spawn);
  game.player.prevX = game.player.x;
  game.player.prevY = game.player.y;
  game.stage = 1;
  game.state = "running";
  game.coins = 0;
  game.elapsed = 0;
  game.timeLeft = STAGE_ONE_TIME_LIMIT;
  game.cameraX = 0;
  game.checkpoint = { x: level.spawn.x, y: level.spawn.y };
  game.checkpointLabel = "起點";
  game.comboCount = 0;
  game.comboTimer = 0;
  game.comboBest = 0;
  game.stomps = 0;
  game.timeBoostEarned = 0;
  game.stageOneRating = 0;
  game.overlayTimer = 110;
  game.overlayText = `${hudBossStageName()}：決戰！能量之巔`;
  game.bossWarningShown = false;
  game.bossShockwaveHintShown = false;
  game.bossCutscene = null;
  game.pendingStageTransition = null;
  game.pendingStageTransitionTimer = 0;
  updateHud();
  soundFx.start();
}

function updateStageTwo(frameScale) {
  const stageTwo = game.stageTwo;
  if (!stageTwo) {
    return;
  }

  if (game.state === "stage2Intro") {
    return;
  }

  if (game.state === "stage2Outro") {
    const outro = game.stageTwoOutro;
    if (!outro) {
      game.state = "stage2Playing";
      return;
    }

    outro.timer += frameScale;
    const t = outro.timer;

    if (!outro.sfxPlayed) {
      outro.sfxPlayed = true;
      soundFx.glassHit?.();
      soundFx.canCollapse?.();
      triggerStageTwoShake(8);
      spawnStageTwoFlash(outro.impactX, outro.impactY, 42);
      for (let i = 0; i < 22; i += 1) {
        spawnStageTwoDebris(outro.impactX, outro.impactY, "#cfd6de", 1, {
          speed: 3 + Math.random() * 6,
          spread: Math.PI * 2,
          drag: 0.9,
          angle: 0,
          gravity: 0.06,
        });
      }
      for (let i = 0; i < 14; i += 1) {
        spawnStageTwoDebris(outro.impactX, outro.impactY, "#ffe6a3", 1, {
          speed: 2 + Math.random() * 5,
          spread: Math.PI * 2,
          drag: 0.9,
          angle: 0,
          gravity: 0.05,
        });
      }
    }

    // Glass shatter sound at t=15
    if (t >= 15 && t < 17 && !outro.glassPlayed) {
      outro.glassPlayed = true;
      soundFx.glassHit?.();
      spawnStageTwoFlash(outro.impactX + 8, outro.impactY - 4, 36);
    }

    // Collapse rumble sound at t=40
    if (t >= 40 && t < 44 && !outro.collapsePlayed) {
      outro.collapsePlayed = true;
      soundFx.canCollapse?.();
      triggerStageTwoShake(6);
      for (let i = 0; i < 16; i += 1) {
        spawnStageTwoDebris(outro.impactX, outro.impactY, "#9aa6bd", 1, {
          speed: 2 + Math.random() * 4,
          spread: Math.PI * 2,
          drag: 0.9,
          angle: 0,
          gravity: 0.06,
        });
      }
    }

    // Slow-motion curve: deep freeze → gradual ramp
    const slowmo = t < 100 ? 0.10 : t < 260 ? 0.18 : t < 420 ? 0.32 : t < 560 ? 0.55 : 0.75;
    outro.slowmo = slowmo;
    if (stageTwo.physics) {
      stageTwo.physics.step(frameScale * slowmo * (1000 / 60));
      stageTwo.physics.processImpacts();
      stageTwo.physics.syncToGameObjects();
      stageTwo.physics.tickFuse(frameScale * slowmo);
      stageTwo.physics.checkProjectileSpent(frameScale * slowmo);
    }

    // Multi-pulse explosion bursts
    if (t >= 10 && t < 12) {
      spawnStageTwoFlash(outro.impactX, outro.impactY, 56);
      triggerStageTwoShake(9);
    }
    if (t >= 28 && t < 30) {
      spawnStageTwoFlash(outro.impactX + 12, outro.impactY - 8, 44);
      triggerStageTwoShake(7);
      for (let i = 0; i < 12; i += 1) {
        spawnStageTwoDebris(outro.impactX, outro.impactY, "#ffe6a3", 1, {
          speed: 3.5 + Math.random() * 4.5,
          spread: Math.PI * 2,
          drag: 0.9,
          angle: 0,
          gravity: 0.05,
        });
      }
    }
    if (t >= 46 && t < 48) {
      spawnStageTwoFlash(outro.impactX - 10, outro.impactY + 6, 38);
      triggerStageTwoShake(6);
      for (let i = 0; i < 14; i += 1) {
        spawnStageTwoDebris(outro.impactX, outro.impactY, "#cfd6de", 1, {
          speed: 3 + Math.random() * 5.2,
          spread: Math.PI * 2,
          drag: 0.9,
          angle: 0,
          gravity: 0.06,
        });
      }
    }

    // Continuous debris during collapse phase
    if (t < 320 && Math.random() < 0.55) {
      const x = outro.impactX + (Math.random() - 0.5) * 200;
      const y = outro.impactY + (Math.random() - 0.5) * 110;
      spawnStageTwoDebris(x, y, "rgba(210, 218, 230, 0.9)", 1, {
        speed: 1.5 + Math.random() * 2.6,
        spread: Math.PI * 2,
        drag: 0.92,
        angle: 0,
        gravity: 0.04,
      });
    }

    updateStageTwoFx(frameScale);

    if (t >= STAGE_TWO_OUTRO_TOTAL_FRAMES) {
      game.stageTwoOutro = null;
      enterBossStageFromSlingshot();
    }
    return;
  }

  const projectile = stageTwo.projectile;

  if (stageTwo.lastImpactTimer > 0) {
    stageTwo.lastImpactTimer -= frameScale;
  }

  if (stageTwo.physics) {
    stageTwo.physics.step(frameScale * (1000 / 60));
    stageTwo.physics.processImpacts();
    stageTwo.physics.syncToGameObjects();
    stageTwo.physics.tickFuse(frameScale);
    stageTwo.physics.checkProjectileSpent(frameScale);
  }

  updateStageTwoFx(frameScale);

  if (projectile.state === "flying") {
    if (
      projectile.x > WIDTH + 200 ||
      projectile.x < -200 ||
      projectile.y > HEIGHT + 260
    ) {
      projectile.state = "spent";
      stageTwo.resetDelay = 8;
      if (game.state === "stage2Playing") {
        game.overlayTimer = 52;
        game.overlayText = "這發偏了，角度再修一下";
      }
    }
  } else if (projectile.state === "spent") {
    stageTwo.resetDelay -= frameScale;
    if (stageTwo.resetDelay <= 0 && stageTwo.shotsLeft > 0) {
      resetStageTwoProjectile(stageTwo);
    }
  }

  stageTwo.targets.forEach((target) => {
    if (target.state === "poof") {
      target.poofTimer -= frameScale;
      if (target.poofTimer <= 0) {
        target.state = "dead";
      }
      return;
    }

    if (target.state !== "alive") {
      return;
    }

    if (stageTwo.physics) {
      const body = target.body;
      if (!body) {
        // If physics body is missing, treat the target as cleared so the stage can finish.
        target.state = "dead";
        return;
      }
      if (
        body.position.x > WIDTH + 200 ||
        body.position.x < -200 ||
        body.position.y > HEIGHT + 260
      ) {
        destroyStageTwoTarget(stageTwo, target, 90);
        if (target.body) {
          window.Matter.World.remove(stageTwo.physics.world, target.body);
          target.body = null;
        }
      }
      return;
    }

    target.vy += 0.32 * frameScale;
    target.x += target.vx * frameScale;
    target.y += target.vy * frameScale;
    target.rotation += target.angVel * frameScale;
    target.vx *= 0.985;
    target.angVel *= 0.965;

    let landed = false;
    for (const block of stageTwo.blocks) {
      if (block.broken) {
        continue;
      }
      const overlapsHorizontally =
        target.x + target.w > block.x + 6 && target.x < block.x + block.w - 6;
      const fallingThroughTop =
        target.vy >= 0 && target.y + target.h >= block.y && target.y + target.h <= block.y + 16;
      if (overlapsHorizontally && fallingThroughTop) {
        target.y = block.y - target.h;
        target.vy = 0;
        landed = true;
        break;
      }
    }

    if (!landed && target.y + target.h >= stageTwo.groundY) {
      if (Math.abs(target.vy) > 2.8 || Math.abs(target.vx) > 2.2) {
        destroyStageTwoTarget(stageTwo, target, 90);
      } else {
        target.y = stageTwo.groundY - target.h;
        target.vy = 0;
        target.vx *= 0.82;
      }
    }

    if (target.x > WIDTH + 100 || target.x + target.w < -100 || target.y > HEIGHT + 120) {
      destroyStageTwoTarget(stageTwo, target, 90);
    }
  });

  if (isStageTwoCleared(stageTwo)) {
    if (!game.stageTwoClearHandled) {
      game.stageTwoClearHandled = true;
      if (SLINGSHOT_FIRST_ORDER) {
        startStageTwoToBossCutscene(stageTwo);
      } else {
        startSceneTransition(() => startEndingRescueScene(), SCENE_TR_TO_ENDING);
      }
    }
    return;
  }

  if (
    game.state === "stage2Playing" &&
    stageTwo.shotsLeft <= 0 &&
    projectile.state === "spent" &&
    stageTwo.resetDelay <= 0
  ) {
    game.state = "gameover";
    game.overlayTimer = 9999;
    game.overlayText = `${hudSlingStageName()}彈藥打完了`;
  }
}

function getStageOneProgress() {
  if (!level.goal) {
    const boss = getStageOneBoss();
    if (!boss) return 1;
    const span = Math.max(1, boss.x - level.spawn.x);
    return clamp((game.player.x - level.spawn.x) / span, 0, 1);
  }
  const span = Math.max(1, level.goal.x - level.spawn.x);
  return clamp((game.player.x - level.spawn.x) / span, 0, 1);
}

function isNearBossArena() {
  if (game.stage !== 1 || game.state !== "running" || level.bossEngaged) {
    return false;
  }
  const boss = getStageOneBoss();
  if (!boss || !boss.alive || !isBossGateOpen()) {
    return false;
  }
  const playerCenterX = game.player.x + game.player.w / 2;
  return playerCenterX >= boss.minX - 360 && playerCenterX < boss.minX - 165;
}

function getStageTwoProgress() {
  if (!game.stageTwo) {
    return 0;
  }
  const totalTargets = Math.max(1, game.stageTwo.targets.length);
  return clamp(
    (totalTargets - countStageTwoActiveTargets(game.stageTwo)) / totalTargets,
    0,
    1
  );
}

function getStageTwoPullRatio() {
  if (!game.stageTwo) {
    return 0;
  }
  const { sling, projectile } = game.stageTwo;
  const dx = projectile.x - sling.x;
  const dy = projectile.y - sling.y;
  return clamp(Math.hypot(dx, dy) / sling.maxPull, 0, 1);
}

function startEndingRescueScene() {
  game.endingScene = {
    timer: 0,
    playerStartX: -88,
    playerTargetX: 324,
    canPedestalX: 744,
    canTargetX: 472,
    groundY: 410,
  };
  game.state = "ending";
  game.overlayTimer = 0;
  game.overlayText = "";
  soundFx.win();
}

function finishEndingRescueScene() {
  game.endingScene = null;
  startFinalVictoryVideo();
}

function startFinalVictoryVideo() {
  if (!cutsceneVideo || !cutsceneVideoOverlay) {
    enterWonResults();
    return;
  }
  game.finalVictoryVideo = { active: true };
  game.state = "finalVideo";
  setCutsceneVideoVisible(true);
  cutsceneVideo.currentTime = 0;
  cutsceneVideo.style.width = "";
  cutsceneVideo.style.height = "";
  layoutCutsceneVideo();
  requestAnimationFrame(() => {
    layoutCutsceneVideo();
    void playCutsceneVideoAutoplay();
  });
  scheduleCutsceneVideoWatchdog();
  if (cutsceneVideoHint) {
    cutsceneVideoHint.textContent = CUTSCENE_VIDEO_HINT_PLAYING;
  }
}

function finishFinalVictoryVideo() {
  if (!game.finalVictoryVideo?.active) return;
  game.finalVictoryVideo = null;
  resetCutsceneVideoUi();
  enterWonResults();
}

function createWinFx() {
  const pieces = [];
  const stars = [];
  const paletteColors = ["#ff7b20", "#ffd166", "#1946b8", "#fff7e8", "#ef2a3e", "#9bff8a"];
  const count = 90;
  for (let i = 0; i < count; i += 1) {
    pieces.push({
      x: Math.random() * WIDTH,
      y: -20 - Math.random() * HEIGHT * 0.4,
      vx: (Math.random() - 0.5) * 2.2,
      vy: 1.6 + Math.random() * 3.4,
      size: 6 + Math.random() * 8,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.22,
      wobble: Math.random() * Math.PI * 2,
      color: paletteColors[i % paletteColors.length],
      alpha: 1,
    });
  }
  for (let i = 0; i < 26; i += 1) {
    const angle = (i / 26) * Math.PI * 2 + Math.random() * 0.18;
    stars.push({
      angle,
      r: 0,
      speed: 3.6 + Math.random() * 3.2,
      size: 2.4 + Math.random() * 2.6,
      alpha: 1,
      color: i % 3 === 0 ? "#ffec8c" : i % 3 === 1 ? "#ffd166" : "#fff7e8",
    });
  }
  return { timer: 0, pieces, stars };
}

function updateWinFx(frameScale) {
  const fx = game.winFx;
  if (!fx) return;
  fx.timer += frameScale;
  const fadeStart = 220;
  const fadeTotal = 160;
  const fade = clamp((fx.timer - fadeStart) / fadeTotal, 0, 1);
  const burstFade = clamp((fx.timer - 18) / 92, 0, 1);
  fx.pieces.forEach((p) => {
    p.wobble += 0.08 * frameScale;
    p.rot += p.rotV * frameScale;
    p.x += (p.vx + Math.sin(p.wobble) * 0.35) * frameScale;
    p.y += p.vy * frameScale;
    p.vy += 0.03 * frameScale;
    p.alpha = 1 - fade;
    if (p.y > HEIGHT + 40) {
      p.y = -30 - Math.random() * 80;
      p.x = Math.random() * WIDTH;
      p.vy = 1.6 + Math.random() * 3.4;
    }
    if (p.x < -40) p.x = WIDTH + 40;
    if (p.x > WIDTH + 40) p.x = -40;
  });
  if (fx.stars) {
    fx.stars.forEach((s) => {
      s.r += s.speed * frameScale;
      s.alpha = (1 - burstFade) * (1 - fade);
    });
  }
  if (fade >= 1) {
    game.winFx = null;
  }
}

function drawWinFx() {
  const fx = game.winFx;
  if (!fx) return;

  // Initial flash.
  if (fx.timer < 20) {
    const a = clamp(1 - fx.timer / 20, 0, 1) * 0.55;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "#fff7e8";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }

  // Starburst behind the result panel.
  const burstCx = WIDTH / 2;
  const burstCy = HEIGHT / 2 + 28;
  if (fx.stars) {
    fx.stars.forEach((s) => {
      const a = clamp(s.alpha, 0, 1);
      if (a <= 0) return;
      const x = burstCx + Math.cos(s.angle) * s.r;
      const y = burstCy + Math.sin(s.angle) * (s.r * 0.72);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // Victory title pop (short; fades out to avoid covering the panel).
  if (fx.timer < 140) {
    const t = clamp(fx.timer / 42, 0, 1);
    const settle = clamp((fx.timer - 42) / 80, 0, 1);
    const pop = 0.92 + (1.22 - 0.92) * (1 - Math.pow(1 - t, 3));
    const scale = pop - settle * 0.18;
    const a = clamp(1 - (fx.timer - 90) / 50, 0, 1);
    const title = game.stage === 2 ? "200p重見天日" : "壟斷碎裂！";
    ctx.save();
    ctx.translate(WIDTH / 2, 126);
    ctx.scale(scale, scale);
    ctx.globalAlpha = a * 0.92;
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = "#ffec8c";
    ctx.font = "800 44px Avenir Next, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, 0, 0);
    ctx.restore();
  }

  fx.pieces.forEach((p) => {
    const a = clamp(p.alpha, 0, 1);
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    roundRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6, 3);
    ctx.fill();
    ctx.restore();
  });
}

function updateEndingRescueScene(frameScale) {
  if (!game.endingScene) {
    return;
  }
  game.endingScene.timer += frameScale;
  if (game.endingScene.timer >= ENDING_RESCUE_TOTAL_FRAMES) {
    startSceneTransition(() => finishEndingRescueScene(), SCENE_TR_ENDING_TO_FINAL);
  }
}

function startStageOneRun() {
  if (game.state !== "intro") {
    return;
  }
  game.state = "prologue";
  game.prologueTimer = 0;
  game.overlayTimer = 0;
  game.overlayText = "";
  soundFx.start();
}

function finishPrologueIntro() {
  if (game.state !== "prologue") {
    return;
  }
  if (SLINGSHOT_FIRST_ORDER) {
    enterStageTwo();
    game.overlayTimer = 118;
    game.overlayText = "第一階段：發射僅存產品，擊碎通路高牆";
    soundFx.start();
    return;
  }
  game.state = "running";
  game.overlayTimer = 84;
  game.overlayText = "往右攻頂能量巨塔，準備面對兩大霸主";
  soundFx.start();
}

function updatePrologueIntro(frameScale) {
  if (game.state !== "prologue") {
    return;
  }
  game.prologueTimer += frameScale;
  if (game.prologueTimer >= PROLOGUE_TOTAL_FRAMES) {
    finishPrologueIntro();
  }
}

function enterStageTwoPlaying() {
  if (game.state !== "stage2Intro") {
    return;
  }
  game.state = "stage2Playing";
  game.overlayTimer = 110;
  game.overlayText = `${hudSlingStageName()}：奪回上架權，發射 200p`;
  soundFx.start();
}

function canSkipDeathAd() {
  return game.state === "ad" && game.adTimer >= game.adSkippableAt;
}

function toggleAudioEnabled() {
  audio.enabled = !audio.enabled;
  if (audio.context && audio.master) {
    audio.master.gain.setValueAtTime(
      audio.enabled ? AUDIO_MASTER_GAIN : 0.0001,
      audio.context.currentTime
    );
  }
  if (audio.enabled) {
    unlockAudio();
  }
  game.overlayTimer = 72;
  game.overlayText = audio.enabled ? "聲音已開啟" : "聲音已靜音";
}

function clearInputState() {
  input.left = false;
  input.right = false;
  input.jump = false;
  input.jumpPressed = false;
  input.dash = false;
  input.dashPressed = false;
  input.touchLeft = false;
  input.touchRight = false;
  input.touchDash = false;
  input.touchDashPressed = false;
  clearTouchPadPressedUi();
}

function clearTouchPadPressedUi() {
  if (!touchControlsEl) return;
  touchControlsEl.querySelectorAll(".touch-pad--pressed").forEach((el) => {
    el.classList.remove("touch-pad--pressed");
  });
}

function shouldShowTouchChrome() {
  return (
    window.matchMedia("(max-width: 820px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

function syncMobileControlsVisibility() {
  if (!touchControlsEl) return;
  const chrome = shouldShowTouchChrome();
  const visible =
    chrome &&
    game.stage === 1 &&
    !game.bossCutscene?.active &&
    (game.state === "running" || game.state === "ad");
  touchControlsEl.classList.toggle("touch-controls--visible", visible);
  touchControlsEl.setAttribute("aria-hidden", visible ? "false" : "true");
  if (touchChromeWasVisible && !visible) {
    input.touchLeft = false;
    input.touchRight = false;
    input.touchDash = false;
    input.touchDashPressed = false;
    clearTouchPadPressedUi();
    setJumpKey(false);
  }
  touchChromeWasVisible = visible;
}

function togglePause() {
  if (game.state === "paused") {
    game.state = game.pausedFromState || "running";
    game.pausedFromState = null;
    game.overlayTimer = 48;
    game.overlayText = "回到遊戲";
    return true;
  }

  if (
    game.state !== "running" &&
    game.state !== "stage2Playing" &&
    game.state !== "stage2Intro"
  ) {
    return false;
  }
  if (game.bossCutscene?.active || game.state === "ad") {
    return false;
  }
  if (game.stage === 2 && game.stageTwo?.dragging) {
    return false;
  }

  game.pausedFromState = game.state;
  game.state = "paused";
  clearInputState();
  return true;
}
