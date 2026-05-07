const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = 960;
const HEIGHT = 540;
const BUILD_ID = "20260507-no-zoom";

function configureCanvas() {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return;
  }

  const backingWidth = Math.round(rect.width * dpr);
  const backingHeight = Math.round(rect.height * dpr);

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
const portraitBlockerEl = document.getElementById("portraitBlocker");
const gameShellEl = document.getElementById("gameShell");
const fullscreenButton = document.getElementById("fullscreenButton");

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
const ENDING_RESCUE_TOTAL_FRAMES = 390;
const ENDING_RESCUE_WALK_FRAMES = 116;
const ENDING_RESCUE_REUNION_START = 150;
const ENDING_RESCUE_REUNION_FRAMES = 84;
const SPRING_TRIGGER_PAD = 8;
const SPRING_TRIGGER_SIDE_INSET = 6;
const SPIKE_KILL_HEIGHT = 36;
const SPIKE_KILL_SIDE_INSET = 4;
const BOSS_RISING_STOMP_SPEED = 2.4;
const BOSS_RISING_STOMP_BAND = 22;
const BOSS_RISING_STOMP_CENTER_INSET = 6;
const HIDDEN_BOSS_SKIP_KEY = "Backquote";
const BOSS_INTRO_LINES_BOSS = [
  "「能一路殺到我的冷藏王座前，我該誇獎你的韌性嗎？康貝特。看看你，為了迎戰我，甚至褪去了那身沉重的玻璃外殼，換上了和我一樣的鋁罐武裝。但這改變不了你只是個『舊時代勞工補給品』的事實！在這極限運動與電競稱霸的新世界，我才是唯一的真理！」",
  "「無知的挑戰者！你根本不懂什麼叫真正的力量！我體內流淌著瓜拿納、牛磺酸與極限咖啡因的狂暴血液，我的存在就是為了『釋放野性 (Unleash the Beast)』！當我的碳酸氣泡直衝腦門的那一刻，能瞬間撕裂人類感官的極限！而你那股溫吞的藥水味，連給我塞牙縫都不配！」",
  "「那就用你的廢鐵裝甲來證明吧！我要用最純粹的美式爆發力，把你這自以為是的台式情懷徹底碾碎！受死吧，時代的眼淚！」",
];
const BOSS_INTRO_LINES_PLAYER = [
  "「新世界？你所謂的統治，不過是靠著過量的糖水和打氣筒般的二氧化碳，製造出來的『短暫亢奮』罷了！我換上這身鋁罐裝甲，不是為了模仿你，而是為了將我體內高濃度的多種胺基酸與維生素B群，以最輕量化、最具破壞力的方式全數爆發！魔爪，你的帝國今天就要終結！」",
  "「瞬間的極限又怎樣？煙火再絢爛，也只有一瞬間的壽命！真正的強大，是撐過地獄般的消耗後，依然能站著揮出最後一拳！我體內這200P的極致馬力，是經歷幾十年淬鍊的黃金比例！你那短暫的暴走，根本無法擊穿我深不見底的修復力與持久續航！」",
  "「時代的眼淚？不，這叫世代傳承的硬底子！不管對手是誰，不管世界怎麼變，只要引擎還有最後一滴油，我就會讓你見識到什麼是真正的——喝、了、再、上！！！」",
];
const BOSS_INTRO_EXCHANGE = [
  { speaker: "boss", line: BOSS_INTRO_LINES_BOSS[0] },
  { speaker: "player", line: BOSS_INTRO_LINES_PLAYER[0] },
  { speaker: "boss", line: BOSS_INTRO_LINES_BOSS[1] },
  { speaker: "player", line: BOSS_INTRO_LINES_PLAYER[1] },
  { speaker: "boss", line: BOSS_INTRO_LINES_BOSS[2] },
  { speaker: "player", line: BOSS_INTRO_LINES_PLAYER[2] },
];

const BOSS_VICTORY_EXCHANGE = [
  { speaker: "player", line: "「呼——搞定。壓力沒了，腦袋反而更清醒。」" },
  { speaker: "player", line: "「剩下的就用彈弓收工，把競品堡壘清到一塊不剩。」" },
  { speaker: "player", line: "「喝了再上——這次是最後衝刺！」" },
];
const DEATH_AD_DURATION = 360;
const DEATH_AD_SKIP_AT = 90;
const AUDIO_MASTER_GAIN = 0.16;
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
    audio.master = audio.context.createGain();
    audio.master.gain.value = AUDIO_MASTER_GAIN;
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
  }
  return audio.context;
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

function tryLockLandscape() {
  try {
    const o = screen.orientation;
    if (o && typeof o.lock === "function") {
      o.lock("landscape").catch(() => {});
    }
  } catch (_) {}
}

function isViewportPortraitLayout() {
  const vv = window.visualViewport;
  const w = vv ? vv.width : window.innerWidth;
  const h = vv ? vv.height : window.innerHeight;
  if (h > w + 12) {
    return true;
  }
  try {
    const o = screen.orientation;
    if (o && typeof o.type === "string") {
      return o.type.startsWith("portrait");
    }
  } catch (_) {}
  return false;
}

function shouldForceLandscapeOnThisDevice() {
  try {
    if (window.matchMedia("(pointer: coarse)").matches) return true;
  } catch (_) {}
  try {
    if (
      window.matchMedia("(hover: none)").matches &&
      window.matchMedia("(max-width: 1024px)").matches
    ) {
      return true;
    }
  } catch (_) {}
  return window.innerWidth <= 1024;
}

function syncPortraitBlockerA11y() {
  if (!portraitBlockerEl) return;
  const blocked = isViewportPortraitLayout() && shouldForceLandscapeOnThisDevice();
  portraitBlockerEl.classList.toggle("portrait-blocker--visible", blocked);
  portraitBlockerEl.setAttribute("aria-hidden", blocked ? "false" : "true");
  document.documentElement.classList.toggle("portrait-lock-active", blocked);
  if (blocked) {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }
}

function unlockAudio() {
  tryLockLandscape();
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
      brand: "monster",
      baseBrand: "monster",
      secondFormBrand: "redbull",
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

  function addBillboard(x, y, w = 218, h = 132, caption = "喝一口，繼續衝", tag = "提神") {
    decorations.signs.push({ x, y, w, h, caption, tag });
  }

  function addCheckpoint(x, spawnX, label) {
    checkpoints.push({ x, spawnX, spawnY: 318, label, active: false });
  }

  // Stage 1 is boss-only: keep arena ground + billboard.
  addGround(3000, 1540);
  addBillboard(3336, 156, 224, 132, "喝一口，繼續衝", "");
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
  overlayText: "點一下或按 Space 開始",
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

function enterWonResults() {
  game.state = "won";
  game.winFx = createWinFx();
  game.overlayTimer = 9999;
  game.overlayText = "成功救到康貝特 200P！";
  soundFx.win();
  updateHud();
}

/** Softer scene fades (frames @ ~60fps). Longer + ease curves feel less abrupt than quick cuts. */
const SCENE_TR_DEFAULT = { outFrames: 46, holdFrames: 28, inFrames: 46 };
const SCENE_TR_BOSS_TO_STAGE2 = {
  outFrames: 48,
  holdFrames: 26,
  inFrames: 48,
  caption: "前往第二關",
  captionSub: "彈弓清場",
};
const SCENE_TR_TO_ENDING = {
  outFrames: 52,
  holdFrames: 30,
  inFrames: 52,
  caption: "兩關全破",
  captionSub: "勝利結局演出",
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
      stageTwo.shotsLeft === 1 ? "最後一發就緒，瞄準再射" : "下一發就緒，拖曳 200P 繼續";
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
    game.overlayText = remainingTargets > 0 ? `命中！剩餘目標 ${remainingTargets}` : "全清空！";
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
  game.overlayText = "第二關：彈弓打競品";
}

function updateStageTwo(frameScale) {
  const stageTwo = game.stageTwo;
  if (!stageTwo) {
    return;
  }

  if (game.state === "stage2Intro") {
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
      startSceneTransition(() => startEndingRescueScene(), SCENE_TR_TO_ENDING);
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
    game.overlayText = "第二關彈藥打完了";
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
  cutsceneVideo.muted = !audio.enabled;
  cutsceneVideo.currentTime = 0;
  cutsceneVideo.style.width = "";
  cutsceneVideo.style.height = "";
  layoutCutsceneVideo();
  requestAnimationFrame(() => {
    layoutCutsceneVideo();
  });
  if (cutsceneVideoHint) {
    cutsceneVideoHint.textContent = "勝利回放 · 點一下可略過";
  }
  const playPromise = cutsceneVideo.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
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
    const title = game.stage === 2 ? "兩關全破" : "勝利！";
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
  game.state = "running";
  game.overlayTimer = 84;
  game.overlayText = "往右走靠近 Boss，會先播對話再開打";
  soundFx.start();
}

function enterStageTwoPlaying() {
  if (game.state !== "stage2Intro") {
    return;
  }
  game.state = "stage2Playing";
  game.overlayTimer = 110;
  game.overlayText = "抓住左下角 200P 發射";
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
    (game.state === "running" || game.state === "intro" || game.state === "ad");
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

function resetRun() {
  for (let ei = level.enemies.length - 1; ei >= 0; ei -= 1) {
    if (level.enemies[ei].bossMinion) {
      level.enemies.splice(ei, 1);
    }
  }
  level.coins.forEach((coin) => {
    coin.collected = false;
  });
  level.enemies.forEach((enemy) => {
    enemy.alive = true;
    enemy.squashTimer = 0;
    enemy.vx = Math.abs(enemy.vx) || 1;
    if (enemy.role === "boss") {
      enemy.brand = enemy.baseBrand || "monster";
      enemy.secondFormActive = false;
      enemy.transformTimer = 0;
      enemy.transformTotal = 0;
      enemy.transformFromBrand = null;
      enemy.transformToBrand = null;
      enemy.maxHp = enemy.formHp ?? enemy.maxHp;
      enemy.hp = enemy.maxHp;
      enemy.cooldown = 0;
      enemy.phase = "patrol";
      enemy.phaseTimer = 0;
      enemy.actionCooldown = 280;
      enemy.tellTimer = 0;
      enemy.enraged = false;
      enemy.berserk = false;
      enemy.didEnragedRoar = false;
      enemy.shakenDir = 0;
      enemy.airShootCooldown = 0;
      enemy.vy = 0;
      enemy.onGround = true;
      if (typeof enemy.baseY === "number") {
        enemy.y = enemy.baseY;
      }
    }
  });
  if (level.bossProjectiles) level.bossProjectiles.length = 0;
  if (level.bossShockwaves) level.bossShockwaves.length = 0;
  level.bossEngaged = false;
  level.bossIntroDone = false;
  level.checkpoints.forEach((checkpoint) => {
    checkpoint.active = false;
  });
  level.platforms.forEach((platform) => {
    platform.broken = false;
    if (platform.crumble) {
      platform.crumble.fallTimer = 0;
    }
    if (platform.spring) {
      platform.spring.compressed = 0;
    }
    if (platform.coinGate) {
      platform.coinGate.opened = false;
    }
  });
  if (level.switches) {
    level.switches.forEach((sw) => {
      sw.active = false;
      sw.locked = false;
      sw.touching = false;
      sw.openTimer = 0;
    });
  }
  if (level.crates && level.initialCrates) {
    level.crates.forEach((crate, idx) => {
      const init = level.initialCrates[idx];
      if (init) {
        crate.x = init.x;
        crate.y = init.y;
        crate.prevX = init.x;
        crate.prevY = init.y;
        crate.vx = 0;
        crate.vy = 0;
        crate.onGround = false;
      }
    });
  }
  if (level.bonusCoins) {
    level.bonusCoins.forEach((bc) => {
      bc.collected = false;
    });
  }
  resetStageOneFx();
  resetStageTwoFx();
  game.player = createPlayer(level.spawn);
  game.stage = 1;
  game.state = "intro";
  game.coins = 0;
  game.lives = PLAYER_START_LIVES;
  game.elapsed = 0;
  game.timeLeft = STAGE_ONE_TIME_LIMIT;
  game.cameraX = 0;
  game.checkpoint = { x: level.spawn.x, y: level.spawn.y };
  game.checkpointLabel = "起點";
  game.overlayTimer = 0;
  game.overlayText = "點一下或按 Space 開始";
  game.flashTimer = 0;
  game.timeBoostEarned = 0;
  game.adTimer = 0;
  game.adImpression = 0;
  game.pendingAdOutcome = null;
  game.pendingDeathReason = null;
  game.pendingDeathBrand = null;
  game.stageTwo = null;
  game.comboCount = 0;
  game.comboTimer = 0;
  game.comboBest = 0;
  game.stomps = 0;
  game.deaths = 0;
  game.startedAt = 0;
  game.stageOneRating = 0;
  resetCutsceneVideoUi();
  game.bossCutscene = null;
  game.pausedFromState = null;
  game.bossWarningShown = false;
  game.bossShockwaveHintShown = false;
  game.endingScene = null;
}

function respawnPlayer() {
  game.player = createPlayer(game.checkpoint);
  game.player.invincible = 120;
  game.cameraX = clamp(game.checkpoint.x - WIDTH * 0.28, 0, level.worldWidth - WIDTH);
  game.bossWarningShown = false;
  game.overlayTimer = 110;
  game.overlayText = `${game.checkpointLabel} 續杯成功`;
  soundFx.respawn();
}

function getDeathAdCopy(reason, brand) {
  if (reason === "hit" && brand === "redbull") {
    return {
      kicker: "競品碰撞實測",
      headline: "有翅膀沒錯，但你先摔下去了",
      lines: [
        "紅牛飛得起來，你的作業不一定。",
        "提神感受先不提，精神值是真的歸零。",
        "還是回來喝 200P，比較像在救火。",
      ],
      gameOverText: "被紅牛撞到斷電",
    };
  }

  if (reason === "hit" && brand === "monster") {
    return {
      kicker: "競品碰撞實測",
      headline: "魔爪很兇，你的進度先被抓走",
      lines: [
        "氣勢很滿，不代表報告會自己寫完。",
        "帥是帥，期末先活下來比較重要。",
        "回來補 200P，至少像真的在續命。",
      ],
      gameOverText: "被魔爪抓到當機",
    };
  }

  if (reason === "time") {
    return {
      kicker: "截止時間已到",
      headline: "廣告先看，交件剛剛已經先飛走",
      lines: [
        "時間比疲勞還狠，直接把你送去重來。",
        "咖啡因再多，deadline 還是不會等等你。",
        "下次早點補 200P，別讓時程先爆掉。",
      ],
      gameOverText: "截止時間到了",
    };
  }

  if (reason === "fall") {
    return {
      kicker: "腳步失誤",
      headline: "人還沒交件，先從平台滑下去了",
      lines: [
        "手滑可以理解，精神值一起下去就有點痛。",
        "再強的飲料，也接不住這個失足瞬間。",
        "喝口 200P，重整一下再衝一次。",
      ],
      gameOverText: "失足掉下去了",
    };
  }

  return {
    kicker: "精神值歸零",
    headline: "先看一下廣告，再把狀態拉回來",
    lines: [
      "剛剛那口沒救到你，這次換 200P 上場。",
      "7 種維他命 + 胺基酸 + 牛磺酸。",
      "活力氣泡，清爽順口好喝。",
    ],
    gameOverText: "精神值歸零",
  };
}

function getEnemyStompText(brand) {
  if (brand === "redbull") {
    return "紅牛先扁掉";
  }
  if (brand === "monster") {
    return "魔爪被踩熄火";
  }
  return "競品被踩掉";
}

function finishDeathAd() {
  const outcome = game.pendingAdOutcome;
  const reason = game.pendingDeathReason;
  const brand = game.pendingDeathBrand;
  const copy = getDeathAdCopy(reason, brand);

  game.pendingAdOutcome = null;
  game.pendingDeathReason = null;
  game.pendingDeathBrand = null;
  game.adTimer = 0;

  if (outcome === "gameover") {
    game.state = "gameover";
    game.overlayTimer = 9999;
    game.overlayText = copy.gameOverText;
    return;
  }

  respawnPlayer();
  game.state = "running";
}

function loseLife(reason, brand = null) {
  if (game.state === "won" || game.state === "gameover" || game.state === "ad") {
    return;
  }
  game.lives -= 1;
  game.deaths = (game.deaths || 0) + 1;
  game.comboCount = 0;
  game.comboTimer = 0;
  game.flashTimer = 18;
  game.state = "ad";
  game.adTimer = 0;
  game.adImpression += 1;
  game.pendingAdOutcome = game.lives <= 0 || reason === "time" ? "gameover" : "respawn";
  game.pendingDeathReason = reason;
  game.pendingDeathBrand = brand;
  triggerStageOneShake(8);
  soundFx.lose();
}

function updateHud() {
  if (game.stage === 2 && game.stageTwo) {
    const clearedPercent = Math.round(getStageTwoProgress() * 100);
    const pullPercent = Math.round(getStageTwoPullRatio() * 100);
    const targetsLeft = countStageTwoActiveTargets(game.stageTwo);
    statusPill.textContent =
      game.state === "paused"
        ? "第二關已暫停"
        : game.state === "won"
        ? "兩關都過了"
        : game.state === "gameover"
          ? "第二關失手"
          : game.state === "stage2Intro"
            ? "點一下進場，再拖曳 200P"
            : game.stageTwo.dragging
              ? `第二關 拉力 ${pullPercent}%`
              : game.stageTwo.shotsLeft === 1
                ? "第二關 最後一發，瞄準一點"
            : `第二關 ${clearedPercent}% 已清場`;
    coinsPill.textContent = `彈藥 ${game.stageTwo.shotsLeft}`;
    livesPill.textContent = `目標 ${targetsLeft}`;
    timerPill.textContent = `分數 ${game.stageTwo.score}`;

    // Stage 2 completion is handled in step() fail-safe for reliability.
    return;
  }

  const stageOnePercent = Math.round(getStageOneProgress() * 100);
  statusPill.textContent =
    game.state === "paused"
      ? "第一關已暫停"
      : game.state === "won"
      ? "作業交件成功"
      : game.state === "gameover"
        ? "衝刺失敗"
        : game.state === "ad"
          ? "休息一下，馬上回來"
        : game.state === "intro"
          ? "點一下或按 Space 開始"
          : isNearBossArena()
            ? "前方 Boss 區，踩穩再進"
          : `${game.checkpointLabel} ${stageOnePercent}%`;
  coinsPill.textContent = `200P ${game.coins} / ${game.totalCoins}`;
  livesPill.textContent = `精神值 ${game.lives}`;
  timerPill.textContent = `剩餘時間 ${Math.max(0, Math.ceil(game.timeLeft))}秒`;
}

function updateMovingPlatforms(frameScale) {
  level.platforms.forEach((platform) => {
    platform.prevX = platform.x;
    platform.prevY = platform.y;
    platform.dx = 0;
    platform.dy = 0;

    if (platform.spring && platform.spring.compressed > 0) {
      platform.spring.compressed -= frameScale;
    }

    if (platform.type === "crumble" && platform.crumble) {
      if (!platform.broken) {
        if (platform.crumble.fallTimer > 0) {
          platform.crumble.fallTimer = Math.max(0, platform.crumble.fallTimer - frameScale * 0.4);
        }
      }
    }

    if (!platform.move) {
      return;
    }

    platform.move.phase += platform.move.speed * frameScale;
    if (platform.move.orbitRadiusX || platform.move.orbitRadiusY) {
      const anchorX = platform.move.anchorX ?? platform.baseX + platform.w / 2;
      const anchorY = platform.move.anchorY ?? platform.baseY + platform.h / 2;
      const orbitX = platform.move.orbitRadiusX ?? 0;
      const orbitY = platform.move.orbitRadiusY ?? orbitX;
      platform.x = anchorX + Math.cos(platform.move.phase) * orbitX - platform.w / 2;
      platform.y = anchorY + Math.sin(platform.move.phase) * orbitY - platform.h / 2;
    } else {
      platform.x = platform.baseX + Math.sin(platform.move.phase) * platform.move.range;
      platform.y = platform.baseY;
    }
    platform.dx = platform.x - platform.prevX;
    platform.dy = platform.y - platform.prevY;
  });
}

function updatePlayer(frameScale) {
  const player = game.player;
  player.prevX = player.x;
  player.prevY = player.y;

  const dashing = player.dashTimer > 0;

  if (player.dashCooldown > 0) {
    player.dashCooldown -= frameScale;
  }
  if (player.dashTimer > 0) {
    player.dashTimer -= frameScale;
  }
  if (player.runDustTimer > 0) {
    player.runDustTimer -= frameScale;
  }

  const moveLeft = input.left || input.touchLeft;
  const moveRight = input.right || input.touchRight;

  if (
    (input.dashPressed || input.touchDashPressed) &&
    !dashing &&
    player.dashCooldown <= 0 &&
    (moveLeft || moveRight || Math.abs(player.vx) > 1)
  ) {
    player.dashTimer = PLAYER_DASH.duration;
    player.dashCooldown = PLAYER_DASH.cooldown;
    player.invincible = Math.max(player.invincible, PLAYER_DASH.invincibility);
    soundFx.dash();
    const dir = moveLeft ? -1 : moveRight ? 1 : Math.sign(player.vx) || player.facing;
    player.facing = dir;
    player.vx = dir * 9.4;
    triggerStageOneShake(2.4);
    spawnStageOnePopup("DASH!", player.x + player.w / 2, player.y - 6, "#ffd166");
    for (let i = 0; i < 10; i += 1) {
      spawnStageOneParticle({
        x: player.x + player.w / 2,
        y: player.y + player.h - 6,
        vx: -dir * (3 + Math.random() * 4),
        vy: -1 - Math.random() * 2,
        gravity: 0.18,
        drag: 0.96,
        life: 14 + Math.random() * 8,
        maxLife: 22,
        size: 3 + Math.random() * 2,
        color: "#ffe5b3",
      });
    }
    soundFx.jump();
  }

  const moveAcceleration = player.onGround ? 0.74 : 0.46;
  const baseMax = (player.onGround ? 5.7 : 5.25) * STAGE_ONE_DIFFICULTY.playerMaxSpeedMultiplier;
  const maxSpeed = dashing
    ? baseMax * (player.onGround ? PLAYER_DASH.speedBoost : PLAYER_DASH.airSpeedBoost)
    : baseMax;

  if (moveLeft) {
    player.vx -= moveAcceleration * frameScale;
    player.facing = -1;
  }
  if (moveRight) {
    player.vx += moveAcceleration * frameScale;
    player.facing = 1;
  }
  if (!moveLeft && !moveRight && !dashing) {
    player.vx *= player.onGround ? 0.79 : 0.94;
  }

  player.vx = clamp(player.vx, -maxSpeed, maxSpeed);

  if (input.jumpPressed) {
    player.jumpBuffer = 8;
  }
  if (player.jumpBuffer > 0) {
    player.jumpBuffer -= frameScale;
  }
  if (player.coyote > 0) {
    player.coyote -= frameScale;
  }
  if (player.invincible > 0) {
    player.invincible -= frameScale;
  }
  if (player.landingDust > 0) {
    player.landingDust -= frameScale;
  }

  if (player.jumpBuffer > 0 && player.jumpsRemaining > 0) {
    const grounded = player.onGround || player.coyote > 0;
    if (grounded) {
      player.vy = PLAYER_JUMP_VY;
      player.onGround = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
      player.jumpsRemaining -= 1;
      soundFx.jump();
    } else if (player.jumpsRemaining === 2) {
      player.vy = PLAYER_JUMP_VY;
      player.jumpBuffer = 0;
      player.jumpsRemaining = 1;
      soundFx.jump();
    } else if (player.jumpsRemaining === 1) {
      player.vy = PLAYER_DOUBLE_JUMP_VY;
      player.jumpBuffer = 0;
      player.jumpsRemaining = 0;
      soundFx.jump();
    }
  }

  if (!input.jump && player.vy < -4.8) {
    player.vy += 0.38 * frameScale;
  }

  const wasOnGround = player.onGround;
  player.x += player.vx * frameScale;
  resolveHorizontalCollisions(player);

  player.vy += GRAVITY * frameScale;
  player.vy = Math.min(player.vy, MAX_FALL_SPEED);
  player.y += player.vy * frameScale;
  resolveVerticalCollisions(player, frameScale);

  if (!wasOnGround && player.onGround && player.vy === 0 && player.prevY < player.y) {
    if (Math.abs(player.prevY + player.h - player.y - player.h) > 4) {
      triggerStageOneShake(1.2);
    }
  }

  if (player.onGround) {
    player.coyote = 7;
    player.jumpsRemaining = 2;
    if (Math.abs(player.vx) > 3.4) {
      if (player.runDustTimer <= 0) {
        spawnStageOneParticle({
          x: player.x + player.w / 2 - Math.sign(player.vx) * 8,
          y: player.y + player.h - 2,
          vx: -player.vx * 0.18 + (Math.random() - 0.5) * 1.4,
          vy: -1 - Math.random() * 0.8,
          gravity: 0.12,
          drag: 0.94,
          life: 14 + Math.random() * 6,
          maxLife: 20,
          size: 2 + Math.random() * 2,
          color: "rgba(255, 240, 210, 0.85)",
        });
        player.runDustTimer = dashing ? 2 : 4;
      }
    }
  }
  if (!player.onGround && player.prevY === player.y) {
    player.coyote = Math.max(player.coyote - frameScale, 0);
  }

  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
  }

  if (player.y > HEIGHT + 160) {
    loseLife("fall");
  }

  const speedRatio = clamp(Math.abs(player.vx) / 7, 0, 1);
  STAGE_ONE_FX.cameraZoomTarget = 1 - speedRatio * 0.06;

  if (Math.abs(player.vx) > 6.2 && Math.random() < 0.35) {
    spawnStageOneSpeedLine(player);
  }
}

function resolveHorizontalCollisions(player) {
  for (const platform of level.platforms) {
    if (platform.broken) continue;
    if (platform.spike) continue;
    if (platform.type === "switch") continue;
    if (!rectsOverlap(player, platform)) {
      continue;
    }
    if (player.prevX + player.w <= platform.x + platform.dx) {
      player.x = platform.x - player.w;
      player.vx = 0;
    } else if (player.prevX >= platform.x + platform.w + platform.dx) {
      player.x = platform.x + platform.w;
      player.vx = 0;
    }
  }

  if (level.crates) {
    for (const crate of level.crates) {
      if (!rectsOverlap(player, crate)) continue;
      const playerWasLeft = player.prevX + player.w <= crate.prevX + 1;
      const playerWasRight = player.prevX >= crate.prevX + crate.w - 1;
      const playerWasAbove = player.prevY + player.h <= crate.prevY + 1;
      if (playerWasAbove) continue;
      if (playerWasLeft) {
        const overlap = player.x + player.w - crate.x;
        crate.x += overlap;
        crate.vx = Math.max(crate.vx, player.vx * 0.55, 1.4);
        player.x = crate.x - player.w;
        player.vx = Math.min(player.vx, crate.vx);
      } else if (playerWasRight) {
        const overlap = crate.x + crate.w - player.x;
        crate.x -= overlap;
        crate.vx = Math.min(crate.vx, player.vx * 0.55, -1.4);
        player.x = crate.x + crate.w;
        player.vx = Math.max(player.vx, crate.vx);
      } else {
        if (player.x + player.w / 2 < crate.x + crate.w / 2) {
          player.x = crate.x - player.w;
        } else {
          player.x = crate.x + crate.w;
        }
        player.vx = 0;
      }
    }
  }
}

function resolveVerticalCollisions(player, frameScale) {
  player.onGround = false;
  let rideDx = 0;
  let rideDy = 0;

  for (const platform of level.platforms) {
    if (platform.broken) continue;
    const isSpring = platform.type === "spring" && platform.spring;
    const spikeRect = platform.spike ? getSpikeCollisionRect(platform) : null;
    const springCrossed =
      isSpring &&
      player.vy >= 0 &&
      player.prevY + player.h <= platform.y + SPRING_TRIGGER_PAD &&
      player.y + player.h >= platform.y - SPRING_TRIGGER_PAD &&
      player.x + player.w > platform.x + SPRING_TRIGGER_SIDE_INSET &&
      player.x < platform.x + platform.w - SPRING_TRIGGER_SIDE_INSET;
    const touchesPlatform = platform.spike && spikeRect ? rectsOverlap(player, spikeRect) : rectsOverlap(player, platform);
    if (!springCrossed && !touchesPlatform) {
      continue;
    }

    if (platform.type === "switch") {
      if ((player.prevY + player.h) <= platform.y) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
      continue;
    }

    const prevBottom = player.prevY + player.h;
    const prevTop = player.prevY;

    if (platform.spike) {
      if (player.invincible <= 0) {
        loseLife("spike");
      }
      continue;
    }

    if (prevBottom <= platform.y) {
      player.y = platform.y - player.h;
      const landSpeed = player.vy;

      if (platform.type === "spring" && platform.spring) {
        const power = platform.spring.power || 16;
        player.vy = -power;
        player.onGround = false;
        player.jumpsRemaining = 2;
        platform.spring.compressed = 8;
        triggerStageOneShake(2.6);
        soundFx.spring();
        spawnStageOnePopup("BOING!", platform.x + platform.w / 2, platform.y - 12, "#ffd166");
        for (let i = 0; i < 8; i += 1) {
          spawnStageOneParticle({
            x: platform.x + platform.w / 2 + (Math.random() - 0.5) * 30,
            y: platform.y,
            vx: (Math.random() - 0.5) * 4,
            vy: -2 - Math.random() * 3,
            gravity: 0.18,
            drag: 0.96,
            life: 14,
            maxLife: 18,
            size: 2.6 + Math.random() * 2,
            color: "#ffe09a",
          });
        }
        continue;
      }

      if (landSpeed > 6) {
        player.landingDust = 12;
        triggerStageOneShake(Math.min(4.5, landSpeed * 0.4));
        for (let i = 0; i < 6; i += 1) {
          spawnStageOneParticle({
            x: player.x + player.w / 2 + (Math.random() - 0.5) * 16,
            y: platform.y + 1,
            vx: (Math.random() - 0.5) * 3,
            vy: -1 - Math.random() * 2,
            gravity: 0.22,
            drag: 0.96,
            life: 12 + Math.random() * 6,
            maxLife: 18,
            size: 2 + Math.random() * 2,
            color: "rgba(255, 240, 210, 0.85)",
          });
        }
      }

      player.vy = 0;
      player.onGround = true;
      rideDx = platform.dx;
      rideDy = platform.dy;

      if (platform.type === "crumble" && platform.crumble) {
        platform.crumble.fallTimer += frameScale ?? 1;
        const ratio = platform.crumble.fallTimer / platform.crumble.threshold;
        if (ratio >= 1) {
          platform.broken = true;
          platform.crumble.fallTimer = 0;
          spawnStageOnePopup("塌！", platform.x + platform.w / 2, platform.y - 4, "#ff7b20");
          for (let i = 0; i < 10; i += 1) {
            spawnStageOneParticle({
              x: platform.x + Math.random() * platform.w,
              y: platform.y + Math.random() * platform.h,
              vx: (Math.random() - 0.5) * 4,
              vy: 1 + Math.random() * 3,
              gravity: 0.4,
              drag: 0.97,
              life: 30,
              maxLife: 30,
              size: 3 + Math.random() * 2,
              color: "#7c5028",
            });
          }
        }
      }
    } else if (prevTop >= platform.y + platform.h) {
      player.y = platform.y + platform.h;
      player.vy = Math.max(player.vy, 0);
    }
  }

  if (level.crates) {
    for (const crate of level.crates) {
      if (!rectsOverlap(player, crate)) continue;
      const prevBottom = player.prevY + player.h;
      const prevTop = player.prevY;
      if (prevBottom <= crate.y) {
        player.y = crate.y - player.h;
        if (player.vy > 6) {
          player.landingDust = 12;
        }
        player.vy = 0;
        player.onGround = true;
        rideDx = (crate.x - crate.prevX);
        rideDy = (crate.y - crate.prevY);
      } else if (prevTop >= crate.y + crate.h) {
        player.y = crate.y + crate.h;
        player.vy = Math.max(player.vy, 0);
      }
    }
  }

  if (rideDx !== 0) {
    player.x += rideDx;
  }
  if (rideDy !== 0) {
    player.y += rideDy;
  }
}

function updateCrates(frameScale) {
  if (!level.crates) return;
  for (const crate of level.crates) {
    crate.prevX = crate.x;
    crate.prevY = crate.y;

    crate.vy += GRAVITY * frameScale;
    crate.vy = Math.min(crate.vy, MAX_FALL_SPEED);

    crate.x += crate.vx * frameScale;
    for (const platform of level.platforms) {
      if (platform.broken) continue;
      if (platform.type === "switch") continue;
      if (platform.type === "spike") continue;
      if (!rectsOverlap(crate, platform)) continue;
      if (crate.prevX + crate.w <= platform.x) {
        crate.x = platform.x - crate.w;
        crate.vx = 0;
      } else if (crate.prevX >= platform.x + platform.w) {
        crate.x = platform.x + platform.w;
        crate.vx = 0;
      }
    }

    crate.y += crate.vy * frameScale;
    crate.onGround = false;
    for (const platform of level.platforms) {
      if (platform.broken) continue;
      if (!rectsOverlap(crate, platform)) continue;

      const prevBottom = crate.prevY + crate.h;
      const prevTop = crate.prevY;

      if (platform.type === "switch") {
        if (prevBottom <= platform.y) {
          crate.y = platform.y - crate.h;
          crate.vy = 0;
          crate.onGround = true;
        }
        continue;
      }
      if (platform.type === "spike") continue;

      if (prevBottom <= platform.y) {
        const wasFalling = crate.vy > 4;
        crate.y = platform.y - crate.h;
        crate.vy = 0;
        crate.onGround = true;
        if (wasFalling && !crate._wasGround) {
          soundFx.crateLand();
        }
      } else if (prevTop >= platform.y + platform.h) {
        crate.y = platform.y + platform.h;
        crate.vy = Math.max(crate.vy, 0);
      }
    }

    if (crate.onGround && Math.abs(crate.vx) > 0.4 && !crate._wasMoving) {
      soundFx.cratePush();
    }
    crate._wasMoving = crate.onGround && Math.abs(crate.vx) > 0.3;
    crate._wasGround = crate.onGround;

    crate.vx *= crate.onGround ? 0.86 : 0.97;
    if (Math.abs(crate.vx) < 0.05) crate.vx = 0;
  }
}

function updateSwitches(frameScale) {
  if (!level.switches) return;
  const playerBox = game.player;

  level.switches.forEach((sw) => {
    sw.touching = false;
    sw.heldByCrate = false;
  });

  level.platforms.forEach((platform) => {
    if (platform.type !== "switch" || !platform.switchState) return;
    if (rectsOverlap(playerBox, platform)) {
      platform.switchState.touching = true;
    }
    if (level.crates) {
      for (const crate of level.crates) {
        if (rectsOverlap(crate, platform)) {
          platform.switchState.touching = true;
          platform.switchState.heldByCrate = true;
        }
      }
    }
  });

  level.switches.forEach((sw) => {
    const wasActive = !!sw.active;
    sw.active = !!sw.touching;
    if (sw.active && !wasActive && !sw.locked) {
      soundFx.switchPress();
    }
    if (sw.touching) {
      sw.openTimer = 60;
      if (sw.heldByCrate && !sw.locked) {
        sw.locked = true;
        const platform = level.platforms.find(
          (p) => p.type === "switch" && p.switchState === sw
        );
        if (platform) {
          spawnStageOnePopup("LOCKED!", platform.x + platform.w / 2, platform.y - 10, "#9bff8a");
          triggerStageOneShake(2.6);
          soundFx.switchLock();
        }
      }
    } else if ((sw.openTimer ?? 0) > 0) {
      sw.openTimer -= frameScale;
    }
  });

  level.platforms.forEach((platform) => {
    if (platform.type === "gate" && platform.gateLink) {
      const sw = level.switches.find((s) => s.id === platform.gateLink.id);
      const isOpen = sw && (sw.active || sw.locked || (sw.openTimer ?? 0) > 0);
      platform.broken = !!isOpen;
    } else if (platform.type === "coinGate" && platform.coinGate) {
      const opened = game.coins >= platform.coinGate.threshold;
      if (opened && !platform.coinGate.opened) {
        platform.coinGate.opened = true;
        spawnStageOnePopup("收齊條件，打開！", platform.x + platform.w / 2, platform.y - 10, "#ffd166");
        triggerStageOneShake(2.4);
        soundFx.gateOpen();
      }
      platform.broken = opened;
    }
  });
}

function updateBonusCoins(frameScale) {
  if (!level.bonusCoins) return;
  const playerBox = game.player;
  for (const coin of level.bonusCoins) {
    coin.bob += 0.06 * frameScale;
    if (coin.collected) continue;
    const coinBox = { x: coin.x - coin.r, y: coin.y - coin.r, w: coin.r * 2, h: coin.r * 2 };
    if (rectsOverlap(playerBox, coinBox)) {
      coin.collected = true;
      const bonus = COIN_TIME_BONUS * coin.value * 2;
      game.coins += coin.value;
      game.timeLeft = Math.min(99.9, game.timeLeft + bonus);
      game.timeBoostEarned += bonus;
      spawnStageOnePopup(`豪華 200P+！+${formatStatNumber(bonus)}s`, coin.x, coin.y - 24, "#ffd166");
      triggerStageOneShake(3.2);
      soundFx.bonusPickup();
      for (let i = 0; i < 16; i += 1) {
        spawnStageOneParticle({
          x: coin.x,
          y: coin.y,
          vx: (Math.random() - 0.5) * 6,
          vy: -2 - Math.random() * 4,
          gravity: 0.18,
          drag: 0.96,
          life: 22 + Math.random() * 10,
          maxLife: 32,
          size: 2.4 + Math.random() * 2,
          color: i % 3 === 0 ? "#ffd166" : i % 3 === 1 ? "#fff7e8" : "#ff7b20",
        });
      }
    }
  }
}

function updateCoins(frameScale) {
  const playerBox = game.player;

  if (game.comboTimer > 0) {
    game.comboTimer -= frameScale;
    if (game.comboTimer <= 0) {
      if (game.comboCount >= 3) {
        spawnStageOnePopup(`連招中斷 x${game.comboCount}`, game.player.x + game.player.w / 2, game.player.y - 22, "#9aa6bd");
      }
      game.comboCount = 0;
    }
  }

  for (const coin of level.coins) {
    coin.bob += 0.08 * frameScale;
    if (coin.collected) {
      continue;
    }
    const coinBox = { x: coin.x - coin.r, y: coin.y - coin.r, w: coin.r * 2, h: coin.r * 2 };
    if (rectsOverlap(playerBox, coinBox)) {
      coin.collected = true;
      game.coins += 1;

      game.comboCount += 1;
      game.comboTimer = COIN_COMBO.windowFrames;
      game.comboBest = Math.max(game.comboBest, game.comboCount);
      const multiplier = clamp(Math.ceil(game.comboCount / 2), 1, COIN_COMBO.maxMultiplier);
      const bonus = COIN_TIME_BONUS * multiplier;

      game.timeLeft = Math.min(99.9, game.timeLeft + bonus);
      game.timeBoostEarned += bonus;
      game.overlayTimer = 28;
      game.overlayText = `+1 罐 200P・x${multiplier}・截止 +${formatStatNumber(bonus)}`;

      spawnStageOnePopup(
        `+${formatStatNumber(bonus)}s${multiplier > 1 ? `  COMBO x${multiplier}` : ""}`,
        coin.x,
        coin.y - 18,
        multiplier >= 3 ? "#ffd166" : "#fff7e8"
      );

      for (let i = 0; i < 6; i += 1) {
        spawnStageOneParticle({
          x: coin.x,
          y: coin.y,
          vx: (Math.random() - 0.5) * 4,
          vy: -1 - Math.random() * 3,
          gravity: 0.18,
          drag: 0.96,
          life: 14 + Math.random() * 6,
          maxLife: 22,
          size: 1.6 + Math.random() * 1.4,
          color: multiplier >= 3 ? "#ffe28a" : "rgba(255,255,255,0.9)",
        });
      }
      if (multiplier >= 3) {
        triggerStageOneShake(1.4);
      }
      soundFx.coin();
    }
  }
}

function spawnBossProjectile(enemy, dir, opts = {}) {
  if (!level.bossProjectiles) return;
  const baseSpeed = enemy.berserk ? 6.4 : enemy.enraged ? 5.6 : 4.4;
  const speed = baseSpeed * (opts.speedMul ?? 1);
  const angleOffset = opts.angleOffset ?? 0;
  const baseAngleY = opts.baseAngleY ?? -0.32;
  const homing = opts.homing ?? false;
  const cosA = Math.cos(angleOffset);
  const sinA = Math.sin(angleOffset);
  const rawVx = dir * speed * cosA;
  const rawVy = dir * speed * sinA + speed * baseAngleY;
  level.bossProjectiles.push({
    x: enemy.x + enemy.w / 2 + dir * (enemy.w / 2 + 6),
    y: enemy.y + enemy.h * (opts.heightFrac ?? 0.42),
    vx: rawVx,
    vy: rawVy,
    r: opts.radius ?? 12,
    life: opts.life ?? BOSS_PROJECTILE_LIFE_FRAMES,
    spin: 0,
    homing,
    homingStrength: opts.homingStrength ?? 0.04,
    brand: enemy.brand,
  });
  triggerStageOneShake(2);
  soundFx.bossShoot();
  spawnBossBurst(
    enemy.x + enemy.w / 2 + dir * (enemy.w / 2 + 4),
    enemy.y + enemy.h * (opts.heightFrac ?? 0.42),
    enemy.brand,
    homing ? 13 : 10,
    {
      angle: dir < 0 ? Math.PI : 0,
      spread: homing ? 1.8 : 1.16,
      speed: homing ? 5.6 : 4.8,
      gravity: 0.08,
      drag: 0.93,
      life: 14,
      size: 1.8,
      radiusX: 4,
      radiusY: 4,
    }
  );
  for (let i = 0; i < 8; i += 1) {
    spawnStageOneParticle({
      x: enemy.x + enemy.w / 2 + dir * (enemy.w / 2),
      y: enemy.y + enemy.h * 0.42,
      vx: dir * (1 + Math.random() * 2),
      vy: -1.5 - Math.random() * 1.5,
      gravity: 0.16,
      drag: 0.96,
      life: 16,
      maxLife: 18,
      size: 1.6 + Math.random() * 1.6,
      color: i % 2 === 0 ? "#ff7b20" : "#ffd166",
    });
  }
}

function bossSeesPlayer(enemy, player) {
  if (!enemy || !player) return false;
  const cx = enemy.x + enemy.w / 2;
  const cy = enemy.y + enemy.h / 2;
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  const dx = px - cx;
  const dy = py - cy;
  if (Math.abs(dx) > 560) return false;
  if (Math.abs(dy) > 280) return false;
  return true;
}

function spawnBossShockwave(x, y, brand = "monster") {
  if (!level.bossShockwaves) return;
  level.bossShockwaves.push({
    x,
    y,
    leftX: x,
    rightX: x,
    speed: 4.6,
    life: 52,
    maxLife: 52,
    height: 42,
    width: 40,
    hitWidth: 34,
    trailWidth: 30,
    brand,
  });
  spawnBossBurst(x, y - 10, brand, 22, {
    angle: -Math.PI / 2,
    spread: Math.PI,
    speed: 5.8,
    gravity: 0.18,
    drag: 0.94,
    life: 18,
    size: 2.1,
    radiusX: 20,
    radiusY: 6,
  });
  if (level.bossEngaged && !game.bossShockwaveHintShown) {
    game.bossShockwaveHintShown = true;
    game.overlayTimer = Math.max(game.overlayTimer, 92);
    game.overlayText = "Boss 衝擊波來了，記得用跳的過";
  }
}

function countBossMinionsAlive() {
  if (!level.enemies) return 0;
  let n = 0;
  for (let i = 0; i < level.enemies.length; i += 1) {
    const e = level.enemies[i];
    if (e.bossMinion && e.alive) n += 1;
  }
  return n;
}

function spawnBossMinions(boss, count) {
  if (!level || !level.enemies || !boss) return;
  const room = MAX_BOSS_MINIONS - countBossMinionsAlive();
  const spawnCount = Math.min(Math.max(0, count), Math.max(0, room));
  if (spawnCount <= 0) return;
  const minionBrand = boss.secondFormActive
    ? boss.secondFormBrand || boss.transformToBrand || "redbull"
    : boss.brand || "monster";
  const speedMag = 1.85 * STAGE_ONE_DIFFICULTY.enemySpeedMultiplier;
  for (let i = 0; i < spawnCount; i += 1) {
    const spread = (i - (spawnCount - 1) / 2) * 44;
    const cx = boss.x + boss.w / 2 - 20 + spread;
    const x = clamp(cx, BOSS_ARENA_MINION_MIN_X + 8, BOSS_ARENA_MINION_MAX_X - 50);
    const y = FLOOR_Y - 32;
    level.enemies.push({
      x,
      y,
      w: 40,
      h: 32,
      minX: BOSS_ARENA_MINION_MIN_X,
      maxX: BOSS_ARENA_MINION_MAX_X,
      vx: speedMag * (i % 2 === 0 ? 1 : -1),
      alive: true,
      squashTimer: 0,
      label: "仆",
      brand: minionBrand,
      role: "patrol",
      hp: 1,
      bossMinion: true,
    });
  }
  spawnStageOnePopup("小怪增援！", boss.x + boss.w / 2, boss.y - 28, "#9bff8a");
  soundFx.bossShoot();
  triggerStageOneShake(4);
  spawnBossBurst(boss.x + boss.w / 2, boss.y + boss.h * 0.44, minionBrand, 18, {
    angle: -Math.PI / 2,
    spread: Math.PI * 1.1,
    speed: 5.2,
    gravity: 0.12,
    drag: 0.94,
    life: 16,
    size: 2,
    radiusX: 14,
    radiusY: 10,
  });
}

function getEnemyLeash(enemy) {
  if (enemy?.role === "boss" && level.bossEngaged) {
    return {
      minX: enemy.engagedMinX ?? enemy.minX,
      maxX: enemy.engagedMaxX ?? enemy.maxX,
    };
  }
  return {
    minX: enemy.minX,
    maxX: enemy.maxX,
  };
}

function updateBossAi(enemy, player, frameScale) {
  enemy.cooldown = Math.max(0, (enemy.cooldown ?? 0) - frameScale);
  enemy.phaseTimer = Math.max(0, (enemy.phaseTimer ?? 0) - frameScale);
  enemy.actionCooldown = Math.max(0, (enemy.actionCooldown ?? 0) - frameScale);
  enemy.tellTimer = Math.max(0, (enemy.tellTimer ?? 0) - frameScale);

  const cx = enemy.x + enemy.w / 2;
  const dx = player.x + player.w / 2 - cx;
  const dy = player.y + player.h / 2 - (enemy.y + enemy.h / 2);
  const dir = Math.sign(dx) || 1;
  const hpRatio = enemy.hp / enemy.maxHp;
  const playerCenterX = player.x + player.w / 2;
  let bossJustEngaged = false;
  if (
    !level.bossEngaged &&
    isBossGateOpen() &&
    level.bossIntroDone &&
    playerCenterX >= enemy.minX
  ) {
    level.bossEngaged = true;
    bossJustEngaged = true;
    spawnStageOnePopup("BOSS 開戰！", cx, enemy.y - 22, "#ff2244");
    triggerStageOneShake(9);
    soundFx.bossRoar();
    spawnBossBurst(cx, enemy.y + enemy.h * 0.4, enemy.brand, 28, {
      angle: -Math.PI / 2,
      spread: Math.PI * 1.25,
      speed: 6.2,
      gravity: 0.12,
      drag: 0.93,
      life: 20,
      size: 2.4,
      radiusX: 16,
      radiusY: 12,
    });
  }
  const engaged = !!level.bossEngaged;
  if (!engaged) {
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.onGround = true;
    if (typeof enemy.baseY === "number") {
      enemy.y = enemy.baseY;
    }
    enemy.phase = "idle";
    enemy.tellTimer = 0;
    enemy.shakenDir = 0;
    enemy.actionCooldown = Math.max(enemy.actionCooldown, 180);
    return;
  }
  if (enemy.phase === "idle") {
    enemy.phase = "patrol";
    enemy.actionCooldown = Math.max(enemy.actionCooldown, BOSS_BALANCE.engagedMinActionCooldown);
  }
  const sees = engaged && bossSeesPlayer(enemy, player);
  const wasBerserk = !!enemy.berserk;
  enemy.berserk = hpRatio <= BOSS_BALANCE.berserkThreshold;
  enemy.enraged = hpRatio <= BOSS_BALANCE.enragedThreshold;
  const damaged = hpRatio <= 0.75;
  if (enemy.berserk && !wasBerserk && !bossJustEngaged) {
    soundFx.bossRoar();
    spawnStageOnePopup("BERSERK!", cx, enemy.y - 18, "#ff5577");
    triggerStageOneShake(8);
    spawnBossBurst(cx, enemy.y + enemy.h * 0.35, enemy.brand, 30, {
      angle: -Math.PI / 2,
      spread: Math.PI * 1.4,
      speed: 6.4,
      gravity: 0.1,
      drag: 0.93,
      life: 22,
      size: 2.5,
      radiusX: 18,
      radiusY: 12,
    });
  }
  if (engaged) {
    enemy.actionCooldown = Math.min(enemy.actionCooldown, BOSS_BALANCE.engagedMinActionCooldown);
  }

  if ((enemy.transformTimer ?? 0) > 0) {
    const prevTransformBucket = Math.floor(enemy.transformTimer / 10);
    enemy.transformTimer = Math.max(0, enemy.transformTimer - frameScale);
    const nextTransformBucket = Math.floor(enemy.transformTimer / 10);
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.onGround = true;
    enemy.y = enemy.baseY;
    enemy.phase = "transform";
    enemy.tellTimer = Math.max(enemy.tellTimer ?? 0, 10);
    if (nextTransformBucket < prevTransformBucket) {
      spawnBossBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h * 0.42, enemy.transformToBrand || enemy.secondFormBrand || "redbull", 10, {
        angle: -Math.PI / 2,
        spread: Math.PI * 1.25,
        speed: 4.8,
        gravity: 0.1,
        drag: 0.93,
        life: 14,
        size: 1.8,
        radiusX: 12,
        radiusY: 10,
      });
    }
    if (enemy.transformTimer <= 0) {
      enemy.brand = enemy.transformToBrand || enemy.secondFormBrand || enemy.brand;
      enemy.transformTimer = 0;
      enemy.transformTotal = 0;
      enemy.transformFromBrand = null;
      enemy.transformToBrand = null;
      enemy.phase = "stunned";
      enemy.phaseTimer = 72;
      enemy.actionCooldown = 120;
      enemy.tellTimer = 16;
      triggerStageOneShake(5.2);
      spawnStageOnePopup("紅牛接手！", enemy.x + enemy.w / 2, enemy.y - 16, "#ffd166");
      spawnBossBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h * 0.42, enemy.brand, 24, {
        angle: -Math.PI / 2,
        spread: Math.PI * 1.6,
        speed: 6.2,
        gravity: 0.12,
        drag: 0.93,
        life: 18,
        size: 2.2,
        radiusX: 16,
        radiusY: 12,
      });
    }
    return;
  }

  if (!enemy.onGround) {
    enemy.vy += GRAVITY * 0.6 * frameScale;
    enemy.y += enemy.vy * frameScale;
    if (enemy.y >= enemy.baseY) {
      enemy.y = enemy.baseY;
      enemy.vy = 0;
      enemy.onGround = true;
      enemy.vx = 0;
      spawnBossShockwave(enemy.x + enemy.w / 2, FLOOR_Y, enemy.brand);
      triggerStageOneShake(7);
      soundFx.bossSlam();
      enemy.phase = "stunned";
      enemy.phaseTimer = level.bossEngaged ? BOSS_BALANCE.slamStunnedFrames : 36;
      for (let i = 0; i < 12; i += 1) {
        spawnStageOneParticle({
          x: enemy.x + enemy.w / 2,
          y: FLOOR_Y - 4,
          vx: (Math.random() - 0.5) * 8,
          vy: -1 - Math.random() * 3,
          gravity: 0.22,
          drag: 0.96,
          life: 22,
          maxLife: 26,
          size: 2 + Math.random() * 2,
          color: i % 2 === 0 ? "#a47148" : "#cbb89a",
        });
      }
    }
    return;
  }

  if (enemy.phase === "patrol") {
    const baseSpeed = (1.0 + (1 - hpRatio) * 1.6) * STAGE_ONE_DIFFICULTY.enemySpeedMultiplier;
    enemy.vx = dir * baseSpeed;

    const playerHigh = dy < -60 && Math.abs(dx) < 110 && player.vy < 4;
    if (playerHigh && enemy.actionCooldown < 88 && enemy.onGround) {
      enemy.phase = "jumpWindup";
      enemy.phaseTimer = 14;
      enemy.tellTimer = 14;
      enemy.vx = 0;
      enemy.actionCooldown = enemy.berserk ? 96 : enemy.enraged ? 148 : 192;
    } else if (enemy.actionCooldown <= 0) {
      const r = Math.random();
      const closeRange = Math.abs(dx) < 220;
      if (engaged) {
        const capRoom = countBossMinionsAlive() < MAX_BOSS_MINIONS;
        if (capRoom && r < BOSS_BALANCE.engagedSummonChancePatrol) {
          enemy.phase = "summonWindup";
          enemy.phaseTimer = 24;
          enemy.tellTimer = 24;
          enemy.vx = 0;
        } else if (sees && r < BOSS_BALANCE.engagedShootChancePatrol) {
          enemy.phase = "shootWindup";
          enemy.phaseTimer = 20;
          enemy.tellTimer = 20;
          enemy.vx = 0;
        } else if (closeRange && r < BOSS_BALANCE.engagedChargeChancePatrol) {
          enemy.phase = "chargeWindup";
          enemy.phaseTimer = 15;
          enemy.tellTimer = 15;
          enemy.vx = 0;
        } else {
          enemy.phase = "jumpWindup";
          enemy.phaseTimer = 13;
          enemy.tellTimer = 13;
          enemy.vx = 0;
        }
        enemy.actionCooldown = BOSS_BALANCE.engagedActionCooldown;
      } else if (r < (enemy.berserk ? 0.5 : 0.45) && closeRange) {
        enemy.phase = "chargeWindup";
        enemy.phaseTimer = enemy.berserk ? 16 : 22;
        enemy.tellTimer = enemy.berserk ? 16 : 22;
        enemy.vx = 0;
        enemy.actionCooldown = enemy.berserk ? 84 : enemy.enraged ? 132 : 198;
      } else if (r < (enemy.berserk ? 0.78 : 0.75) && damaged) {
        enemy.phase = "jumpWindup";
        enemy.phaseTimer = enemy.berserk ? 20 : 28;
        enemy.tellTimer = enemy.berserk ? 20 : 28;
        enemy.vx = 0;
        enemy.actionCooldown = enemy.berserk ? 84 : enemy.enraged ? 132 : 198;
      } else if (sees) {
        enemy.phase = "shootWindup";
        enemy.phaseTimer = enemy.berserk ? 22 : 30;
        enemy.tellTimer = enemy.berserk ? 22 : 30;
        enemy.vx = 0;
        enemy.actionCooldown = enemy.berserk ? 84 : enemy.enraged ? 132 : 198;
      } else {
        enemy.phase = "chargeWindup";
        enemy.phaseTimer = enemy.berserk ? 16 : 22;
        enemy.tellTimer = enemy.berserk ? 16 : 22;
        enemy.vx = 0;
        enemy.actionCooldown = enemy.berserk ? 84 : enemy.enraged ? 132 : 198;
      }
    }
  } else if (enemy.phase === "summonWindup") {
    enemy.vx = 0;
    if (enemy.phaseTimer <= 0) {
      spawnBossMinions(enemy, BOSS_BALANCE.summonCount);
      enemy.phase = "stunned";
      enemy.phaseTimer = engaged ? BOSS_BALANCE.summonStunnedFrames : 16;
    }
  } else if (enemy.phase === "chargeWindup") {
    enemy.vx = 0;
    if (enemy.phaseTimer <= 0) {
      enemy.phase = "charge";
      enemy.phaseTimer = enemy.enraged ? 60 : 70;
      soundFx.bossCharge();
      triggerStageOneShake(3.4);
      spawnBossBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h * 0.5, enemy.brand, 16, {
        angle: dir < 0 ? Math.PI : 0,
        spread: 1.45,
        speed: 5.6,
        gravity: 0.08,
        drag: 0.92,
        life: 16,
        size: 2,
        radiusX: 10,
        radiusY: 10,
      });
    }
  } else if (enemy.phase === "charge") {
    const chargeSpeed =
      (enemy.berserk
        ? BOSS_BALANCE.chargeSpeedBerserk
        : enemy.enraged
          ? BOSS_BALANCE.chargeSpeedEnraged
          : BOSS_BALANCE.chargeSpeedBase) * STAGE_ONE_DIFFICULTY.enemySpeedMultiplier;
    enemy.vx = (enemy.vx >= 0 ? 1 : -1) * chargeSpeed;
    if (enemy.phaseTimer <= 0) {
      if (engaged) {
        const r = Math.random();
        if (countBossMinionsAlive() < MAX_BOSS_MINIONS && r < BOSS_BALANCE.engagedChargeFollowupSummonChance) {
          enemy.phase = "summonWindup";
          enemy.phaseTimer = 16;
          enemy.tellTimer = 16;
          enemy.vx = 0;
        } else if (r < 0.4) {
          enemy.phase = "jumpWindup";
          enemy.phaseTimer = 13;
          enemy.tellTimer = 13;
          enemy.vx = 0;
        } else if (r < 0.54 && sees) {
          enemy.phase = "shootWindup";
          enemy.phaseTimer = 18;
          enemy.tellTimer = 18;
          enemy.vx = 0;
        } else {
          enemy.phase = "stunned";
          enemy.phaseTimer = BOSS_BALANCE.chargeEndStunnedFrames;
        }
      } else if (enemy.berserk && Math.random() < 0.55) {
        enemy.phase = "jumpWindup";
        enemy.phaseTimer = 12;
        enemy.tellTimer = 12;
        enemy.vx = 0;
      } else if (enemy.enraged && sees && Math.random() < 0.4) {
        enemy.phase = "shootWindup";
        enemy.phaseTimer = 18;
        enemy.tellTimer = 18;
        enemy.vx = 0;
      } else {
        enemy.phase = "stunned";
        enemy.phaseTimer = 32;
      }
    }
  } else if (enemy.phase === "shootWindup") {
    enemy.vx = 0;
    if (enemy.phaseTimer <= 0) {
      if (sees) {
        const shots = engaged ? BOSS_BALANCE.engagedProjectileShots : enemy.berserk ? 4 : enemy.enraged ? 3 : 1;
        const spread = engaged ? BOSS_BALANCE.engagedProjectileSpread : enemy.berserk ? 0.28 : enemy.enraged ? 0.22 : 0;
        for (let i = 0; i < shots; i += 1) {
          const offset = shots === 1 ? 0 : (i - (shots - 1) / 2) * spread;
          spawnBossProjectile(enemy, dir, { angleOffset: offset });
        }
        if ((engaged || enemy.berserk) && Math.random() < (engaged ? BOSS_BALANCE.engagedHomingChance : 0.35)) {
          spawnBossProjectile(enemy, dir, {
            homing: true,
            homingStrength: engaged ? BOSS_BALANCE.engagedHomingStrength : 0.06,
            speedMul: 0.7,
            life: BOSS_PROJECTILE_LIFE_HOMING_FRAMES,
            radius: 9,
            baseAngleY: -0.2,
          });
        }
      }
      if (
        engaged &&
        sees &&
        countBossMinionsAlive() < MAX_BOSS_MINIONS &&
        Math.random() < BOSS_BALANCE.engagedShootFollowupSummonChance
      ) {
        enemy.phase = "summonWindup";
        enemy.phaseTimer = 16;
        enemy.tellTimer = 16;
      } else if (engaged && sees) {
        const r = Math.random();
        if (r < 0.22) {
          enemy.phase = "chargeWindup";
          enemy.phaseTimer = 14;
          enemy.tellTimer = 14;
        } else if (r < 0.44) {
          enemy.phase = "jumpWindup";
          enemy.phaseTimer = 13;
          enemy.tellTimer = 13;
        } else {
          enemy.phase = "stunned";
          enemy.phaseTimer = BOSS_BALANCE.shootEndStunnedFrames;
        }
      } else if (sees && enemy.berserk && Math.random() < 0.4) {
        enemy.phase = "chargeWindup";
        enemy.phaseTimer = 14;
        enemy.tellTimer = 14;
      } else {
        enemy.phase = "stunned";
        enemy.phaseTimer = sees ? 22 : 12;
      }
    }
  } else if (enemy.phase === "jumpWindup") {
    enemy.vx = 0;
    if (enemy.phaseTimer <= 0) {
      enemy.vy = -11.9;
      enemy.onGround = false;
      const horizontalKick = enemy.berserk ? BOSS_BALANCE.jumpKickBerserk : BOSS_BALANCE.jumpKickBase;
      enemy.vx = Math.sign(dx || 1) * horizontalKick;
      enemy.phase = "airborne";
      enemy.phaseTimer = 220;
      enemy.airShootCooldown = engaged ? BOSS_BALANCE.engagedInitialAirShootCooldown : 18;
    }
  } else if (enemy.phase === "airborne") {
    if ((enemy.berserk || enemy.enraged) && sees) {
      enemy.airShootCooldown = Math.max(0, (enemy.airShootCooldown ?? 0) - frameScale);
      if (enemy.airShootCooldown <= 0 && enemy.vy < 1) {
        spawnBossProjectile(enemy, dir, {
          baseAngleY: 0.4,
          speedMul: 0.85,
          heightFrac: 0.85,
        });
        enemy.airShootCooldown = engaged ? BOSS_BALANCE.engagedAirShootInterval : enemy.berserk ? 16 : 26;
      }
    }
  } else if (enemy.phase === "shaken") {
    const shakeSpeed =
      (enemy.berserk
        ? BOSS_BALANCE.shakenSpeedBerserk
        : enemy.enraged
          ? BOSS_BALANCE.shakenSpeedEnraged
          : BOSS_BALANCE.shakenSpeedBase) * STAGE_ONE_DIFFICULTY.enemySpeedMultiplier;
    const leash = getEnemyLeash(enemy);
    let escapeDir = enemy.shakenDir ?? -dir;
    const wallNearLeft = enemy.x <= leash.minX + 60;
    const wallNearRight = enemy.x + enemy.w >= leash.maxX - 60;
    if (escapeDir < 0 && wallNearLeft) escapeDir = 1;
    else if (escapeDir > 0 && wallNearRight) escapeDir = -1;
    enemy.shakenDir = escapeDir;
    enemy.vx = escapeDir * shakeSpeed;
    const shootInterval = engaged ? BOSS_BALANCE.shakenShootInterval : enemy.berserk ? 14 : enemy.enraged ? 20 : 999;
    if (sees && Math.floor(enemy.phaseTimer) % shootInterval === 0 && enemy.phaseTimer > 8) {
      spawnBossProjectile(enemy, dir, { speedMul: 0.85, baseAngleY: -0.18 });
    }
    if (enemy.phaseTimer <= 0) {
      enemy.phase = "patrol";
      enemy.actionCooldown = engaged ? BOSS_BALANCE.engagedRecoveryActionCooldown : Math.max(0, enemy.berserk ? 12 : enemy.enraged ? 24 : 60);
    }
  } else if (enemy.phase === "stunned") {
    enemy.vx *= 0.85;
    if (enemy.phaseTimer <= 0) {
      enemy.phase = "patrol";
      enemy.actionCooldown = engaged ? BOSS_BALANCE.engagedRecoveryActionCooldown : Math.max(enemy.actionCooldown, enemy.enraged ? 60 : 100);
    }
  }

  const leash = getEnemyLeash(enemy);
  if (enemy.x <= leash.minX + 4 || enemy.x + enemy.w >= leash.maxX - 4) {
    if (enemy.phase === "charge") {
      enemy.phase = "stunned";
      enemy.phaseTimer = engaged ? BOSS_BALANCE.wallCrashStunnedFrames : 30;
      triggerStageOneShake(4);
      spawnBossBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h * 0.55, enemy.brand, 14, {
        angle: enemy.x <= leash.minX + 4 ? Math.PI : 0,
        spread: 1.1,
        speed: 4.8,
        gravity: 0.14,
        drag: 0.94,
        life: 14,
        size: 1.9,
        radiusX: 8,
        radiusY: 8,
      });
    }
  }
}

function updateBossHazards(frameScale) {
  if (level.bossProjectiles) {
    const playerCxLive = game.player.x + game.player.w / 2;
    const playerCyLive = game.player.y + game.player.h / 2;
    for (let i = level.bossProjectiles.length - 1; i >= 0; i -= 1) {
      const proj = level.bossProjectiles[i];
      proj.life -= frameScale;
      if (proj.homing) {
        const tdx = playerCxLive - proj.x;
        const tdy = playerCyLive - proj.y;
        const mag = Math.hypot(tdx, tdy) || 1;
        proj.vx += (tdx / mag) * (proj.homingStrength ?? 0.04) * frameScale;
        proj.vy += (tdy / mag) * (proj.homingStrength ?? 0.04) * frameScale;
        const speedCap = 7;
        const sp = Math.hypot(proj.vx, proj.vy);
        if (sp > speedCap) {
          proj.vx = (proj.vx / sp) * speedCap;
          proj.vy = (proj.vy / sp) * speedCap;
        }
      }
      proj.x += proj.vx * frameScale;
      proj.vy += (proj.homing ? 0.04 : 0.12) * frameScale;
      proj.y += proj.vy * frameScale;
      proj.spin += 0.18 * frameScale;
      if (Math.random() < 0.6) {
        const palette = getBossFxPalette(proj.brand || "monster");
        spawnStageOneParticle({
          x: proj.x + (Math.random() - 0.5) * proj.r * 0.8,
          y: proj.y + (Math.random() - 0.5) * proj.r * 0.8,
          vx: -proj.vx * 0.08 + (Math.random() - 0.5) * 0.6,
          vy: -proj.vy * 0.08 + (Math.random() - 0.5) * 0.6,
          gravity: 0.02,
          drag: 0.9,
          life: 10 + Math.random() * 4,
          maxLife: 14,
          size: 1.3 + Math.random() * 1.1,
          color: Math.random() < 0.5 ? palette.core : palette.edge,
        });
      }
      if (proj.y >= FLOOR_Y - 6) {
        proj.y = FLOOR_Y - 6;
        proj.vy *= -0.6;
        proj.vx *= 0.85;
        spawnBossBurst(proj.x, FLOOR_Y - 6, proj.brand || "monster", 8, {
          angle: -Math.PI / 2,
          spread: Math.PI * 0.7,
          speed: 3.8,
          gravity: 0.12,
          drag: 0.9,
          life: 10,
          size: 1.5,
          radiusX: 3,
          radiusY: 2,
        });
      }
      if (proj.life <= 0 || proj.x < 0 || proj.x > level.worldWidth) {
        spawnBossBurst(proj.x, proj.y, proj.brand || "monster", 10, {
          speed: 4,
          gravity: 0.1,
          drag: 0.9,
          life: 12,
          size: 1.7,
          radiusX: 4,
          radiusY: 4,
        });
        level.bossProjectiles.splice(i, 1);
        continue;
      }
      const player = game.player;
      const playerCx = player.x + player.w / 2;
      const playerCy = player.y + player.h / 2;
      const ddx = proj.x - playerCx;
      const ddy = proj.y - playerCy;
      if (ddx * ddx + ddy * ddy < (proj.r + 24) * (proj.r + 24)) {
        if (player.invincible <= 0 && (game.player.dashTimer ?? 0) <= 0) {
          loseLife("hit", proj.brand || "monster");
          return;
        }
      }
    }
  }

  if (level.bossShockwaves) {
    for (let i = level.bossShockwaves.length - 1; i >= 0; i -= 1) {
      const wave = level.bossShockwaves[i];
      wave.life -= frameScale;
      wave.leftX -= wave.speed * frameScale;
      wave.rightX += wave.speed * frameScale;
      if (wave.life <= 0) {
        level.bossShockwaves.splice(i, 1);
        continue;
      }
      const player = game.player;
      if (player.onGround) {
        const playerLeft = player.x;
        const playerRight = player.x + player.w;
        const hitWidth = wave.hitWidth ?? 30;
        const inLeftWave = playerRight >= wave.leftX && playerLeft <= wave.leftX + hitWidth;
        const inRightWave = playerRight >= wave.rightX - hitWidth && playerLeft <= wave.rightX;
        if ((inLeftWave || inRightWave) && player.invincible <= 0 && (game.player.dashTimer ?? 0) <= 0) {
          loseLife("hit", wave.brand || "monster");
          return;
        }
      }
    }
  }
}

function chooseEnemyStompTarget(player, stompCandidates) {
  if (stompCandidates.length <= 1) return stompCandidates[0];
  const px = player.x + player.w / 2;
  stompCandidates.sort((a, b) => {
    const bossPri = (e) => (e.role === "boss" ? 1 : 0);
    const bp = bossPri(a) - bossPri(b);
    if (bp !== 0) return bp;
    if (a.y !== b.y) return a.y - b.y;
    const ax = Math.abs(px - (a.x + a.w / 2));
    const bx = Math.abs(px - (b.x + b.w / 2));
    return ax - bx;
  });
  return stompCandidates[0];
}

function stompBossFromPlayer(enemy, player) {
  enemy.hp = (enemy.hp ?? 1) - 1;
  const firstFormBroken = enemy.hp <= 0 && !enemy.secondFormActive;
  const bossWillFall = enemy.hp <= 0 && enemy.secondFormActive;
  const impactBrand = firstFormBroken ? enemy.secondFormBrand || "redbull" : enemy.brand;
  enemy.squashTimer = 8;
  player.vy = -13.4;
  player.jumpsRemaining = 2;
  const sideKick = player.x + player.w / 2 < enemy.x + enemy.w / 2 ? -1 : 1;
  player.x += sideKick * 28;
  player.vx = sideKick * 5.4;
  triggerStageOneShake(6);
  spawnStageOnePopup(
    firstFormBroken
      ? "魔爪退場，紅牛上場！"
      : bossWillFall
        ? "BOSS DOWN!"
        : `BOSS -1（剩 ${enemy.hp}）`,
    enemy.x + enemy.w / 2,
    enemy.y - 8,
    firstFormBroken || bossWillFall ? "#ff7b20" : "#ffd166"
  );
  for (let i = 0; i < 14; i += 1) {
    spawnStageOneParticle({
      x: enemy.x + enemy.w / 2,
      y: enemy.y + enemy.h / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: -2 - Math.random() * 3,
      gravity: 0.28,
      drag: 0.97,
      life: 22,
      maxLife: 22,
      size: 2.2 + Math.random() * 2.4,
      color: impactBrand === "monster" ? "#9bff8a" : "#ffd2bd",
    });
  }
  soundFx.stomp();
  if (firstFormBroken) {
    triggerStageOneShake(9.5);
    spawnBossBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h * 0.4, enemy.secondFormBrand || "redbull", 34, {
      angle: -Math.PI / 2,
      spread: Math.PI * 1.5,
      speed: 6.6,
      gravity: 0.12,
      drag: 0.93,
      life: 24,
      size: 2.6,
      radiusX: 18,
      radiusY: 14,
    });
    enemy.secondFormActive = true;
    enemy.maxHp = enemy.formHp ?? 5;
    enemy.hp = enemy.maxHp;
    enemy.cooldown = 0;
    enemy.phase = "transform";
    enemy.phaseTimer = 0;
    enemy.actionCooldown = 0;
    enemy.tellTimer = 0;
    enemy.enraged = false;
    enemy.berserk = false;
    enemy.didEnragedRoar = false;
    enemy.shakenDir = sideKick * -1;
    enemy.transformTimer = BOSS_PHASE_SHIFT_FRAMES;
    enemy.transformTotal = BOSS_PHASE_SHIFT_FRAMES;
    enemy.transformFromBrand = enemy.brand;
    enemy.transformToBrand = enemy.secondFormBrand || "redbull";
    player.invincible = Math.max(player.invincible, 24);
    if (level.bossProjectiles) level.bossProjectiles.length = 0;
    if (level.bossShockwaves) level.bossShockwaves.length = 0;
    level.enemies.forEach((other) => {
      if (other !== enemy && other.bossMinion && other.alive) {
        other.alive = false;
        other.squashTimer = ENEMY_SQUASH_FRAMES;
      }
    });
    game.overlayTimer = 108;
    game.overlayText = "紅牛變身中，準備第二回合！";
    soundFx.bossPhaseShift();
    startBossPhaseShiftCutscene();
  } else if (bossWillFall) {
    triggerStageOneShake(11);
    spawnBossBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h * 0.38, enemy.brand, 42, {
      angle: -Math.PI / 2,
      spread: Math.PI * 1.8,
      speed: 7.4,
      gravity: 0.16,
      drag: 0.92,
      life: 28,
      size: 2.8,
      radiusX: 20,
      radiusY: 16,
    });
    enemy.alive = false;
    enemy.squashTimer = ENEMY_SQUASH_FRAMES;
    level.bossEngaged = false;
    if (level.bossProjectiles) level.bossProjectiles.length = 0;
    if (level.bossShockwaves) level.bossShockwaves.length = 0;
    level.enemies.forEach((other) => {
      if (other !== enemy && other.bossMinion && other.alive) {
        other.alive = false;
        other.squashTimer = ENEMY_SQUASH_FRAMES;
      }
    });
    game.stomps += 1;
    game.overlayTimer = 0;
    game.overlayText = "";
    soundFx.bossDefeat();
    if (!level.goal) {
      game.stageOneRating = computeStageOneRating();
      startBossVictoryCutscene();
      return;
    }
  } else {
    spawnBossBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h * 0.42, enemy.brand, 16, {
      angle: -Math.PI / 2,
      spread: Math.PI * 1.15,
      speed: 5,
      gravity: 0.14,
      drag: 0.94,
      life: 16,
      size: 2,
      radiusX: 12,
      radiusY: 10,
    });
    enemy.cooldown = 12;
    enemy.phase = "shaken";
    enemy.phaseTimer = enemy.berserk ? 38 : enemy.enraged ? 56 : 80;
    enemy.actionCooldown = enemy.berserk ? 48 : enemy.enraged ? 88 : 155;
    enemy.shakenDir = sideKick * -1;
    player.invincible = Math.max(player.invincible, 14);
    soundFx.bossHit();
    if (enemy.hp / enemy.maxHp <= 0.4 && !enemy.didEnragedRoar) {
      enemy.didEnragedRoar = true;
      soundFx.bossRoar();
    }
  }
}

function stompNormalEnemyFromPlayer(enemy, player) {
  enemy.alive = false;
  enemy.squashTimer = ENEMY_SQUASH_FRAMES;
  const wantsBoost = input.jump || player.jumpBuffer > 0;
  player.vy = wantsBoost ? -13.4 : -10.6;
  player.onGround = false;
  player.coyote = 0;
  player.jumpBuffer = 0;
  player.jumpsRemaining = 2;
  const bounceX = enemy.x + enemy.w / 2;
  const bounceY = enemy.y + 2;
  for (let i = 0; i < 8; i += 1) {
    spawnStageOneParticle({
      x: bounceX + (Math.random() - 0.5) * 12,
      y: bounceY,
      vx: (Math.random() - 0.5) * 4.4,
      vy: -1.6 - Math.random() * 1.6,
      gravity: 0.18,
      drag: 0.93,
      life: 16 + Math.random() * 6,
      maxLife: 22,
      size: 2 + Math.random() * 2,
      color: "rgba(255, 244, 214, 0.92)",
    });
  }
  if (wantsBoost) {
    spawnStageOnePopup("跳跳！", bounceX, bounceY - 12, "#9bff8a");
  }
  game.stomps += 1;
  game.overlayTimer = 34;
  game.overlayText = enemy.bossMinion ? "小怪踩扁！" : getEnemyStompText(enemy.brand);
  triggerStageOneShake(wantsBoost ? 3.4 : 2.4);
  soundFx.stomp();
  if (wantsBoost && soundFx.jump) soundFx.jump();
}

function updateEnemies(frameScale) {
  const player = game.player;
  for (const enemy of level.enemies) {
    if (!enemy.alive) {
      if (enemy.squashTimer > 0) {
        enemy.squashTimer -= frameScale;
      }
      continue;
    }

    if (enemy.role === "charger") {
      const dx = player.x + player.w / 2 - (enemy.x + enemy.w / 2);
      const dy = player.y + player.h / 2 - (enemy.y + enemy.h / 2);
      const within = Math.abs(dx) < (enemy.sightRange ?? 240) && Math.abs(dy) < 80;
      const baseSpeed = Math.abs(enemy.vx) || 1;
      if (within) {
        const target = baseSpeed * (enemy.chargeMultiplier ?? 2);
        enemy.vx = Math.sign(dx) * target;
      } else {
        const restSpeed = 1.55 * STAGE_ONE_DIFFICULTY.enemySpeedMultiplier;
        enemy.vx = Math.sign(enemy.vx || 1) * restSpeed;
      }
    } else if (enemy.role === "boss") {
      updateBossAi(enemy, player, frameScale);
    }

    enemy.x += enemy.vx * frameScale;
    const leash = getEnemyLeash(enemy);
    if (enemy.x <= leash.minX || enemy.x + enemy.w >= leash.maxX) {
      enemy.vx *= -1;
      enemy.x = clamp(enemy.x, leash.minX, leash.maxX - enemy.w);
    }
  }

  const overlapping = [];
  for (const enemy of level.enemies) {
    if (!enemy.alive) continue;
    if (enemy.role === "boss" && (enemy.transformTimer ?? 0) > 0) continue;
    if (rectsOverlap(player, getEnemyCollisionRect(enemy))) overlapping.push(enemy);
  }

  if (overlapping.length === 0) {
    return;
  }

  const playerBottomPrev = player.prevY + player.h;
  const stompVelocityOk = player.vy > 1.2;
  const stompCandidates = overlapping.filter(
    (e) =>
      (stompVelocityOk && playerBottomPrev <= getEnemyCollisionRect(e).y + 14) ||
      isBossRisingFootStomp(player, e)
  );

  if (stompCandidates.length > 0) {
    const enemy = chooseEnemyStompTarget(player, stompCandidates);
    if (enemy.role === "boss") {
      stompBossFromPlayer(enemy, player);
    } else {
      stompNormalEnemyFromPlayer(enemy, player);
    }
    return;
  }

  for (const enemy of overlapping) {
    if (player.invincible <= 0 && (player.dashTimer ?? 0) <= 0) {
      loseLife("hit", enemy.brand);
      return;
    }
  }
}

function updateCheckpoints() {
  for (const checkpoint of level.checkpoints) {
    if (checkpoint.active || game.player.x < checkpoint.x) {
      continue;
    }
    checkpoint.active = true;
    game.checkpoint = { x: checkpoint.spawnX, y: checkpoint.spawnY };
    game.checkpointLabel = checkpoint.label;
    game.overlayTimer = 130;
    game.overlayText = `${checkpoint.label} 模式啟動`;
    soundFx.checkpoint();
  }
}

function getStageOneBoss() {
  return level.enemies.find((enemy) => enemy.role === "boss");
}

function armBossIntroBounce(who) {
  const cs = game.bossCutscene;
  if (!cs) return;
  cs.bounceWho = who;
  cs.bounceTicks = BOSS_INTRO_BOUNCE_DURATION;
  soundFx.spring();
}

function getCutsceneBounceDy(who) {
  const cs = game.bossCutscene;
  if (!cs?.active || cs.bounceWho !== who || (cs.bounceTicks ?? 0) <= 0) return 0;
  const p = 1 - clamp(cs.bounceTicks / BOSS_INTRO_BOUNCE_DURATION, 0, 1);
  return -Math.sin(p * Math.PI) * 13;
}

function getBossIntroTurn(cs) {
  if (!cs?.active) return null;
  return BOSS_INTRO_EXCHANGE[cs.talkIdx] ?? null;
}

function getBossIntroPortraitKind(cs) {
  if (!cs?.active) return null;
  if (cs.phase === "bossZoom") return "boss";
  if (cs.phase === "phaseShift") return "boss";
  if (cs.phase === "exchangeTalk") return getBossIntroTurn(cs)?.speaker ?? null;
  if (cs.phase === BOSS_INTRO_VIDEO_PHASE) return "player";
  if (cs.phase === "victory") return "player";
  return null;
}

/** Screen-space close-up above the dialogue panel so the face is never covered by the box. */
function drawBossIntroSpeakerPortrait(panelY, cs) {
  const kind = getBossIntroPortraitKind(cs);
  if (!kind) return;

  const bounceDy = getCutsceneBounceDy(kind === "boss" ? "boss" : "player");
  const centerX = WIDTH / 2;

  ctx.save();
  ctx.shadowColor = "rgba(12, 18, 35, 0.38)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 6;

  if (kind === "boss") {
    const boss = getStageOneBoss();
    const portraitBrand =
      cs.phase === "phaseShift"
        ? boss?.secondFormBrand || boss?.transformToBrand || "redbull"
        : boss?.brand || "monster";
    const img = getEnemyImageForBrand(portraitBrand);
    const drawH = 278;
    const drawW = canDrawImage(img) ? (img.naturalWidth / img.naturalHeight) * drawH : 178;
    const bottom = panelY + 12 + bounceDy;
    const drawY = bottom - drawH;
    if (canDrawImage(img)) {
      ctx.drawImage(img, centerX - drawW / 2, drawY, drawW, drawH);
    } else {
      ctx.fillStyle = "#1e4d28";
      roundRect(centerX - 90, drawY + drawH - 210, 180, 210, 26);
      ctx.fill();
    }
  } else {
    const facing = game.player.facing;
    const bottom = panelY + 14 + bounceDy;
    if (canDrawImage(art.player)) {
      const drawW = 340;
      const drawH = (art.player.naturalHeight / art.player.naturalWidth) * drawW;
      const drawY = bottom - drawH;
      ctx.translate(centerX, 0);
      ctx.scale(facing, 1);
      ctx.drawImage(art.player, -drawW / 2, drawY, drawW, drawH);
    } else {
      const r = 130;
      const cy = panelY - 40 + bounceDy;
      ctx.translate(centerX, cy);
      ctx.scale(facing, 1);
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.clip();
      const ok = drawCoverImage(art.face, -r, -r, r * 2, r * 2, -Math.PI / 2, 1.55, 0.07, -0.03);
      if (!ok) {
        ctx.fillStyle = "#f4cfaa";
        ctx.fillRect(-r, -r, r * 2, r * 2);
      }
      ctx.restore();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function setCutsceneVideoVisible(visible) {
  if (!cutsceneVideoOverlay) return;
  cutsceneVideoOverlay.classList.toggle("is-visible", visible);
  cutsceneVideoOverlay.setAttribute("aria-hidden", visible ? "false" : "true");
}

function layoutCutsceneVideo() {
  if (!cutsceneVideo || !cutsceneVideoStage) {
    return;
  }

  const videoWidth = cutsceneVideo.videoWidth;
  const videoHeight = cutsceneVideo.videoHeight;
  const stageWidth = cutsceneVideoStage.clientWidth;
  const stageHeight = cutsceneVideoStage.clientHeight;
  if (!videoWidth || !videoHeight || !stageWidth || !stageHeight) {
    return;
  }

  const scale = Math.min(stageWidth / videoWidth, stageHeight / videoHeight);
  cutsceneVideo.style.width = `${Math.round(videoWidth * scale)}px`;
  cutsceneVideo.style.height = `${Math.round(videoHeight * scale)}px`;
}

function resetCutsceneVideoUi() {
  setCutsceneVideoVisible(false);
  if (cutsceneVideo) {
    cutsceneVideo.pause();
    cutsceneVideo.currentTime = 0;
  }
  if (cutsceneVideoHint) {
    cutsceneVideoHint.textContent = "影片播放中 · 點一下可略過";
  }
}

function finishBossInsertVideo() {
  const cs = game.bossCutscene;
  resetCutsceneVideoUi();
  if (!cs || cs.phase !== BOSS_INTRO_VIDEO_PHASE) {
    return;
  }
  cs.videoStarted = false;
  cs.videoPlaying = false;
  cs.phase = "outro";
  cs.timer = 0;
  cs.lineHold = 0;
}

function startBossInsertVideo() {
  const cs = game.bossCutscene;
  if (!cs || cs.phase !== BOSS_INTRO_VIDEO_PHASE || cs.videoStarted) {
    return;
  }

  if (!cutsceneVideo) {
    finishBossInsertVideo();
    return;
  }

  cs.videoStarted = true;
  cs.videoPlaying = true;
  setCutsceneVideoVisible(true);
  cutsceneVideo.muted = !audio.enabled;
  cutsceneVideo.currentTime = 0;
  cutsceneVideo.style.width = "";
  cutsceneVideo.style.height = "";
  layoutCutsceneVideo();
  requestAnimationFrame(() => {
    layoutCutsceneVideo();
  });
  if (cutsceneVideoHint) {
    cutsceneVideoHint.textContent = "影片播放中 · 點一下可略過";
  }

  const playPromise = cutsceneVideo.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      cs.videoPlaying = false;
      if (cutsceneVideoHint) {
        cutsceneVideoHint.textContent = "點一下播放影片";
      }
    });
  }
}

function handleBossInsertVideoPointerDown() {
  const cs = game.bossCutscene;
  if (!cs || cs.phase !== BOSS_INTRO_VIDEO_PHASE || !cutsceneVideo) {
    return false;
  }

  if (cutsceneVideo.paused && cutsceneVideo.currentTime < 0.1) {
    cutsceneVideo.muted = !audio.enabled;
    if (cutsceneVideoHint) {
      cutsceneVideoHint.textContent = "影片播放中 · 點一下可略過";
    }
    const playPromise = cutsceneVideo.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
    cs.videoPlaying = true;
    return true;
  }

  finishBossInsertVideo();
  return true;
}

function tryStartBossIntroCutscene() {
  if (game.bossCutscene?.active || level.bossIntroDone) return;
  if (game.stage !== 1 || game.state !== "running") return;
  const boss = getStageOneBoss();
  if (!boss || !boss.alive || !isBossGateOpen()) return;
  const px = game.player.x + game.player.w / 2;
  if (px < boss.minX - BOSS_INTRO_TRIGGER_PAD || px > boss.maxX + 320) return;
  game.bossCutscene = {
    active: true,
    phase: "bossZoom",
    timer: 0,
    talkIdx: 0,
    lineHold: 0,
    bounceWho: null,
    bounceTicks: 0,
    videoStarted: false,
    videoPlaying: false,
  };
  game.player.vx = 0;
  game.player.vy = Math.min(game.player.vy, 0);
  boss.vx = 0;
  STAGE_ONE_FX.cameraZoomTarget = 1.22;
}

function getBossIntroCameraTarget() {
  const fallback = clamp(game.player.x - WIDTH * 0.36, 0, level.worldWidth - WIDTH);
  const boss = getStageOneBoss();
  const cs = game.bossCutscene;
  if (!boss || !cs?.active) return fallback;
  const bossCx = boss.x + boss.w / 2;
  const playerCx = game.player.x + game.player.w / 2;
  let focus = bossCx;
  if (
    cs.phase === "outro" ||
    cs.phase === BOSS_INTRO_VIDEO_PHASE ||
    (cs.phase === "exchangeTalk" && getBossIntroTurn(cs)?.speaker === "player")
  ) {
    focus = playerCx;
  }
  return clamp(focus - WIDTH * 0.36, 0, level.worldWidth - WIDTH);
}

function relocateBossBattleToParkour() {
  const boss = getStageOneBoss();
  if (game.stage !== 1 || !boss || !boss.alive) {
    return;
  }

  const player = game.player;
  const playerBattleY = FLOOR_Y - player.h;
  const bossBattleY = FLOOR_Y - boss.h;
  const arenaMaxX = BOSS_ARENA_GROUND_X + BOSS_ARENA_GROUND_W - 20;

  player.x = BOSS_BATTLE_TRANSFER_PLAYER_X;
  player.y = playerBattleY;
  player.prevX = player.x;
  player.prevY = player.y;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  player.jumpsRemaining = 2;
  player.coyote = 0;
  player.jumpBuffer = 0;
  player.facing = 1;

  boss.x = BOSS_BATTLE_TRANSFER_BOSS_X;
  boss.y = bossBattleY;
  boss.prevX = boss.x;
  boss.prevY = boss.y;
  boss.baseY = bossBattleY;
  boss.vx = 0;
  boss.vy = 0;
  boss.onGround = true;
  boss.phase = "patrol";
  boss.phaseTimer = 0;
  boss.tellTimer = 0;
  boss.actionCooldown = Math.max(boss.actionCooldown ?? 0, BOSS_BALANCE.engagedMinActionCooldown);
  boss.minX = BOSS_CHASE_LEFT_BOUND;
  boss.maxX = arenaMaxX;
  boss.engagedMinX = BOSS_CHASE_LEFT_BOUND;
  boss.engagedMaxX = arenaMaxX;

  level.bossEngaged = true;
  if (level.bossProjectiles) level.bossProjectiles.length = 0;
  if (level.bossShockwaves) level.bossShockwaves.length = 0;

  game.cameraX = clamp(player.x - WIDTH * 0.28, 0, level.worldWidth - WIDTH);
  game.bossWarningShown = false;
  spawnStageOnePopup("轉場開打！", player.x + 28, player.y - 24, "#9bff8a");
}

function finishBossIntroCutscene() {
  resetCutsceneVideoUi();
  relocateBossBattleToParkour();
  game.bossCutscene = null;
  level.bossIntroDone = true;
  STAGE_ONE_FX.cameraZoomTarget = 1;
  game.player.invincible = Math.max(game.player.invincible ?? 0, 60);
  game.overlayTimer = 84;
  game.overlayText = "開打！先閃再踩";
  spawnStageOnePopup("開打！", game.player.x + game.player.w / 2, game.player.y - 20, "#ffd166");
  soundFx.coin();
}

function finishBossMiniCutscene() {
  resetCutsceneVideoUi();
  game.bossCutscene = null;
  STAGE_ONE_FX.cameraZoomTarget = 1;
  game.player.invincible = Math.max(game.player.invincible ?? 0, 24);
}

function startBossPhaseShiftCutscene() {
  if (game.bossCutscene?.active || game.stage !== 1 || game.state !== "running") return;
  game.bossCutscene = {
    active: true,
    phase: "phaseShift",
    timer: 0,
    talkIdx: 0,
    lineHold: 0,
    bounceWho: "boss",
    bounceTicks: 10,
    videoStarted: false,
    videoPlaying: false,
  };
  STAGE_ONE_FX.cameraZoomTarget = 1.22;
  game.overlayTimer = 0;
  game.overlayText = "";
}

function startBossVictoryCutscene() {
  if (game.bossCutscene?.active || game.stage !== 1 || game.state !== "running") return;
  game.bossCutscene = {
    active: true,
    phase: "victory",
    timer: 0,
    talkIdx: 0,
    lineHold: 170,
    bounceWho: "player",
    bounceTicks: BOSS_INTRO_BOUNCE_DURATION,
    videoStarted: false,
    videoPlaying: false,
  };
  STAGE_ONE_FX.cameraZoomTarget = 1.16;
  game.overlayTimer = 0;
  game.overlayText = "";
}

function killBossInstant() {
  if (game.stage !== 1) return;
  if (game.state !== "running") return;
  if (game.bossCutscene?.active) return;
  const boss = getStageOneBoss();
  if (!boss || !boss.alive) return;

  // Clear the arena and treat as a full defeat.
  boss.alive = false;
  boss.squashTimer = ENEMY_SQUASH_FRAMES;
  level.bossEngaged = false;
  if (level.bossProjectiles) level.bossProjectiles.length = 0;
  if (level.bossShockwaves) level.bossShockwaves.length = 0;
  level.enemies.forEach((other) => {
    if (other !== boss && other.bossMinion && other.alive) {
      other.alive = false;
      other.squashTimer = ENEMY_SQUASH_FRAMES;
    }
  });

  game.stageOneRating = computeStageOneRating();
  triggerStageOneShake(10);
  soundFx.bossDefeat();
  startBossVictoryCutscene();
}

function updateBossIntroCutscene(frameScale) {
  const cs = game.bossCutscene;
  if (!cs?.active) return;
  cs.timer += frameScale;

  // Victory cutscene must be able to play after the boss is defeated.
  if (cs.phase === "victory") {
    STAGE_ONE_FX.cameraZoomTarget = 1.12;
    cs.lineHold -= frameScale;
    if (cs.lineHold <= 0) {
      cs.talkIdx = Math.min(cs.talkIdx + 1, BOSS_VICTORY_EXCHANGE.length);
      if (cs.talkIdx < BOSS_VICTORY_EXCHANGE.length) {
        cs.lineHold = 170;
        armBossIntroBounce("player");
      }
    }
    if (cs.timer >= BOSS_VICTORY_CUTSCENE_FRAMES) {
      finishBossMiniCutscene();
      game.pendingStageTransition = "stage2";
      game.pendingStageTransitionTimer = Math.max(game.pendingStageTransitionTimer ?? 0, 36);
      game.overlayTimer = 108;
      game.overlayText = "勝利！準備進第二關";
    }
    return;
  }

  const boss = getStageOneBoss();
  if (!boss || !boss.alive) {
    finishBossIntroCutscene();
    return;
  }

  boss.vx = 0;
  if ((cs.bounceTicks ?? 0) > 0) {
    cs.bounceTicks = Math.max(0, cs.bounceTicks - frameScale);
    if (cs.bounceTicks <= 0) {
      cs.bounceWho = null;
    }
  }

  if (cs.phase === "phaseShift") {
    STAGE_ONE_FX.cameraZoomTarget = 1.2;
    // Transform visuals are driven by boss AI; advance it during the cutscene.
    if ((boss.transformTimer ?? 0) > 0) {
      updateBossAi(boss, game.player, frameScale);
    }
    if (cs.timer >= BOSS_PHASE_SHIFT_CUTSCENE_FRAMES) {
      finishBossMiniCutscene();
    }
    return;
  }

  if (cs.phase === "bossZoom") {
    STAGE_ONE_FX.cameraZoomTarget = 1.26;
    if (cs.timer >= BOSS_INTRO_BOSS_ZOOM_FRAMES) {
      cs.phase = "exchangeTalk";
      cs.timer = 0;
      cs.talkIdx = 0;
      cs.lineHold = BOSS_INTRO_LINE_HOLD_FRAMES;
      armBossIntroBounce(getBossIntroTurn(cs)?.speaker ?? "boss");
    }
  } else if (cs.phase === "exchangeTalk") {
    const turn = getBossIntroTurn(cs);
    STAGE_ONE_FX.cameraZoomTarget = turn?.speaker === "player" ? 1.12 : 1.22;
    cs.lineHold -= frameScale;
    if (cs.lineHold <= 0) {
      cs.talkIdx += 1;
      if (cs.talkIdx >= BOSS_INTRO_EXCHANGE.length) {
        cs.phase = BOSS_INTRO_VIDEO_PHASE;
        cs.timer = 0;
        cs.lineHold = 0;
        cs.videoStarted = false;
        cs.videoPlaying = false;
        startBossInsertVideo();
      } else {
        cs.lineHold = BOSS_INTRO_LINE_HOLD_FRAMES;
        armBossIntroBounce(getBossIntroTurn(cs)?.speaker ?? "boss");
      }
    }
  } else if (cs.phase === BOSS_INTRO_VIDEO_PHASE) {
    STAGE_ONE_FX.cameraZoomTarget = 1.08;
    if (!cs.videoStarted) {
      startBossInsertVideo();
    }
  } else if (cs.phase === "outro") {
    STAGE_ONE_FX.cameraZoomTarget =
      1 + (1.14 - 1) * Math.max(0, 1 - cs.timer / BOSS_INTRO_OUTRO_ZOOM_BLEND_FRAMES);
    if (cs.timer >= BOSS_INTRO_OUTRO_FRAMES) {
      finishBossIntroCutscene();
    }
  }
}

function drawBossIntroCutscene() {
  const cs = game.bossCutscene;
  if (!cs?.active || game.stage !== 1) return;

  const letterH = 52;
  ctx.fillStyle = "rgba(8, 12, 28, 0.72)";
  ctx.fillRect(0, 0, WIDTH, letterH);
  ctx.fillRect(0, HEIGHT - letterH, WIDTH, letterH);

  const panelX = 52;
  const panelBottomMargin = 14;
  const panelW = WIDTH - 104;
  const maxW = panelW - 44;

  let speaker = "…";
  let line = "";
  let accent = "#526182";

  if (cs.phase === "bossZoom") {
    speaker = "魔爪 (Boss)";
    line = "（鏡頭拉近——冷藏王座前）";
    accent = "#ef2a3e";
  } else if (cs.phase === "phaseShift") {
    speaker = "紅牛 (Boss)";
    line = "「魔爪還是太爛了。換我紅牛來對付你。」";
    accent = "#ef2a3e";
  } else if (cs.phase === "exchangeTalk") {
    const turn = getBossIntroTurn(cs);
    speaker = turn?.speaker === "player" ? "康貝特200P (主角)" : "魔爪 (Boss)";
    line = turn?.line ?? "";
    accent = turn?.speaker === "player" ? "#1c6fd4" : "#ef2a3e";
  } else if (cs.phase === BOSS_INTRO_VIDEO_PHASE) {
    speaker = "康貝特200P (主角)";
    line = "「喝了再上。」";
    accent = "#1c6fd4";
  } else if (cs.phase === "victory") {
    const turn = BOSS_VICTORY_EXCHANGE[cs.talkIdx] ?? BOSS_VICTORY_EXCHANGE[BOSS_VICTORY_EXCHANGE.length - 1];
    speaker = "康貝特200P (主角)";
    line = turn?.line ?? "「喝了再上！」";
    accent = "#ff7b20";
  } else if (cs.phase === "outro") {
    speaker = "對線結束";
    line = "嘴上勝負先到這——拳腳跟罐數見真章！";
    accent = "#ff7b20";
  }

  const BODY_FONT = "15px Avenir Next, sans-serif";
  const BODY_LINE_H = 18;
  const BODY_TOP = 54;
  const FOOTER_GAP = 16;
  const MAX_BODY_LINES = 12;
  const MIN_PANEL_H = 106;
  const MAX_PANEL_H = 268;

  ctx.font = BODY_FONT;
  const bodyLines = countCutsceneWrappedLines(line, maxW, MAX_BODY_LINES);
  const panelH = clamp(BODY_TOP + bodyLines * BODY_LINE_H + FOOTER_GAP, MIN_PANEL_H, MAX_PANEL_H);
  const panelY = HEIGHT - letterH - panelH - panelBottomMargin;

  ctx.fillStyle = "rgba(255, 252, 246, 0.96)";
  roundRect(panelX, panelY, panelW, panelH, 22);
  ctx.fill();
  ctx.strokeStyle = "rgba(25, 70, 184, 0.35)";
  ctx.lineWidth = 2;
  roundRect(panelX, panelY, panelW, panelH, 22);
  ctx.stroke();

  drawBossIntroSpeakerPortrait(panelY, cs);

  ctx.fillStyle = accent;
  ctx.font = "bold 13px Avenir Next, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(speaker, panelX + 22, panelY + 30);

  ctx.fillStyle = "#16203d";
  ctx.font = BODY_FONT;
  wrapCutsceneLine(line, panelX + 22, panelY + BODY_TOP, maxW, BODY_LINE_H, MAX_BODY_LINES);

  ctx.textAlign = "left";
}

function countCutsceneWrappedLines(text, maxWidth, maxLines) {
  if (!text) return 1;
  const words = text.split("");
  let cur = "";
  let lines = 1;
  for (let i = 0; i < words.length; i += 1) {
    const test = cur + words[i];
    if (ctx.measureText(test).width > maxWidth && cur.length > 0) {
      lines += 1;
      cur = words[i];
      if (lines >= maxLines) return maxLines;
    } else {
      cur = test;
    }
  }
  return lines;
}

function wrapCutsceneLine(text, x, y, maxWidth, lineHeight, maxExtraLines = 10) {
  if (!text) return;
  const words = text.split("");
  let line = "";
  let yy = y;
  const maxYy = y + lineHeight * maxExtraLines;
  for (let i = 0; i < words.length; i += 1) {
    const test = line + words[i];
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, yy);
      line = words[i];
      yy += lineHeight;
      if (yy > maxYy) break;
    } else {
      line = test;
    }
  }
  if (line && yy <= maxYy) ctx.fillText(line, x, yy);
}

function isStageOneGoalLocked() {
  const boss = getStageOneBoss();
  return Boolean(boss && boss.alive);
}

function computeStageOneRating() {
  const timeLeft = Math.max(0, game.timeLeft);
  const total = Math.max(1, game.totalCoins);
  const collectedRatio = game.coins / total;
  const livesRatio = clamp(game.lives / PLAYER_START_LIVES, 0, 1);
  const timeRatio = clamp(timeLeft / STAGE_ONE_TIME_LIMIT, 0, 1);
  const score = collectedRatio * 0.45 + livesRatio * 0.25 + timeRatio * 0.3;
  if (score >= 0.85) return 3;
  if (score >= 0.6) return 2;
  return 1;
}

function isStageOneTimerPaused() {
  return Boolean(game.bossCutscene?.active);
}

function updateGoal() {
  if (game.stage !== 1 || game.state === "won" || !level.goal) {
    return;
  }
  const goalBox = { x: level.goal.x - 14, y: level.goal.y, w: 32, h: level.goal.h };
  if (rectsOverlap(game.player, goalBox)) {
    if (isStageOneGoalLocked()) {
      if ((game.overlayTimer ?? 0) <= 0) {
        game.overlayTimer = 60;
        game.overlayText = "先把 BOSS 解決才能交件！";
      }
      return;
    }
    game.stageOneRating = computeStageOneRating();
    enterStageTwo();
    game.overlayText = `第一關過關，收了 ${game.coins} 罐`;
    soundFx.win();
  }
}

function step(frameScale) {
  updateSceneTransition(frameScale);

  // Stage 2 fail-safe: if targets are cleared, always finish (even if we entered stage 2 via debug skip).
  if (
    game.stage === 2 &&
    game.stageTwo &&
    (game.state === "stage2Intro" || game.state === "stage2Playing") &&
    !game.endingScene &&
    game.state !== "ending" &&
    game.state !== "won" &&
    game.state !== "gameover" &&
    game.state !== "finalVideo" &&
    isStageTwoCleared(game.stageTwo)
  ) {
    game.stageTwoClearedFrames += frameScale;
    if (!game.stageTwoClearHandled) {
      game.stageTwoClearHandled = true;
      startSceneTransition(() => startEndingRescueScene(), SCENE_TR_TO_ENDING);
    }
    // Hard force if we're still stuck after ~1.2s.
    if (game.stageTwoClearedFrames > 72) {
      game.stageTwoClearedFrames = 0;
      startEndingRescueScene();
    }
  } else if (game.stage === 2) {
    game.stageTwoClearedFrames = 0;
  }

  if (game.pendingStageTransitionTimer > 0) {
    game.pendingStageTransitionTimer -= frameScale;
    if (game.pendingStageTransitionTimer <= 0 && game.pendingStageTransition === "stage2") {
      game.pendingStageTransition = null;
      game.pendingStageTransitionTimer = 0;
      startSceneTransition(() => {
        enterStageTwo();
        updateHud();
      }, SCENE_TR_BOSS_TO_STAGE2);
    }
  }

  if (game.state === "stage2Intro") {
    if (input.jumpPressed) {
      enterStageTwoPlaying();
    }
    updateStageTwo(frameScale);
    updateHud();
    return;
  }

  if (game.state === "stage2Playing") {
    updateStageTwo(frameScale);
    updateHud();
    return;
  }

  if (game.state === "finalVideo") {
    updateHud();
    return;
  }

  if (game.state === "ending") {
    updateEndingRescueScene(frameScale);
    return;
  }

  if (game.state === "paused") {
    updateHud();
    return;
  }

  if (game.state === "gameover" || game.state === "won") {
    if (game.overlayTimer > 0) {
      game.overlayTimer -= frameScale;
    }
    if (game.state === "won") {
      updateWinFx(frameScale);
    }
    updateHud();
    return;
  }

  if (game.state === "ad") {
    game.adTimer += frameScale;
    if (game.flashTimer > 0) {
      game.flashTimer -= frameScale;
    }

    if (
      game.adTimer >= game.adDuration ||
      (canSkipDeathAd() && input.jumpPressed)
    ) {
      finishDeathAd();
    }

    updateHud();
    return;
  }

  if (
    game.state === "intro" &&
    (input.left || input.right || input.touchLeft || input.touchRight || input.jumpPressed)
  ) {
    startStageOneRun();
  }

  if (game.state === "running") {
    tryStartBossIntroCutscene();
    if (isNearBossArena() && !game.bossWarningShown) {
      game.bossWarningShown = true;
      game.overlayTimer = 110;
      game.overlayText = "前方 Boss 區，站穩再進就會開打";
    }
    if (!isStageOneTimerPaused()) {
      game.elapsed += frameScale / 60;
      game.timeLeft -= frameScale / 60;
      if (game.timeLeft <= 0) {
        loseLife("time");
        updateHud();
        return;
      }
    }
  }

  if (game.state === "running" && game.bossCutscene?.active) {
    updateBossIntroCutscene(frameScale);
    updateMovingPlatforms(frameScale);
    updateCrates(frameScale);
    updateSwitches(frameScale);
    updateCoins(frameScale);
    updateBonusCoins(frameScale);
    updateStageOneFx(frameScale);

    game.player.vx = 0;
    game.player.vy += GRAVITY * frameScale;
    game.player.vy = Math.min(game.player.vy, MAX_FALL_SPEED);
    game.player.y += game.player.vy * frameScale;
    resolveVerticalCollisions(game.player, frameScale);
    resolveHorizontalCollisions(game.player);
    if (game.player.onGround) {
      game.player.jumpsRemaining = 2;
    }

    const camTarget = getBossIntroCameraTarget();
    game.cameraX += (camTarget - game.cameraX) * 0.14 * frameScale;
    game.cameraX = clamp(game.cameraX, 0, level.worldWidth - WIDTH);

    if (game.overlayTimer > 0) {
      game.overlayTimer -= frameScale;
    }
    if (game.flashTimer > 0) {
      game.flashTimer -= frameScale;
    }

    updateHud();
    return;
  }

  updateMovingPlatforms(frameScale);
  updateCrates(frameScale);
  updatePlayer(frameScale);
  updateSwitches(frameScale);
  updateCoins(frameScale);
  updateBonusCoins(frameScale);
  updateEnemies(frameScale);
  updateBossHazards(frameScale);
  updateCheckpoints();
  updateGoal();
  updateStageOneFx(frameScale);

  const targetCamera = clamp(game.player.x - WIDTH * 0.36, 0, level.worldWidth - WIDTH);
  game.cameraX += (targetCamera - game.cameraX) * 0.12 * frameScale;
  game.cameraX = clamp(game.cameraX, 0, level.worldWidth - WIDTH);

  if (game.overlayTimer > 0 && game.state === "running") {
    game.overlayTimer -= frameScale;
  }
  if (game.flashTimer > 0) {
    game.flashTimer -= frameScale;
  }

  updateHud();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, palette.skyTop);
  gradient.addColorStop(1, palette.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  ctx.beginPath();
  ctx.arc(760, 112, 58, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(25, 70, 184, 0.12)";
  ctx.beginPath();
  ctx.moveTo(0, 180);
  ctx.lineTo(180, 110);
  ctx.lineTo(370, 180);
  ctx.lineTo(0, 260);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(239, 42, 62, 0.1)";
  ctx.beginPath();
  ctx.moveTo(590, 0);
  ctx.lineTo(900, 0);
  ctx.lineTo(960, 120);
  ctx.lineTo(760, 170);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255, 124, 32, 0.1)";
  ctx.beginPath();
  ctx.moveTo(600, 350);
  ctx.lineTo(960, 290);
  ctx.lineTo(960, 540);
  ctx.lineTo(710, 540);
  ctx.closePath();
  ctx.fill();

  drawParallaxHills(level.decorations.hillsFar, 0.25, palette.farHill);
  drawParallaxHills(level.decorations.hillsNear, 0.45, palette.nearHill);
  drawClouds();
}

function drawParallaxHills(hills, ratio, color) {
  ctx.fillStyle = color;
  hills.forEach((hill) => {
    const x = hill.x - game.cameraX * ratio;
    const y = FLOOR_Y + 44;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + hill.w * 0.25, y - hill.h, x + hill.w * 0.5, y - hill.h * 0.45);
    ctx.quadraticCurveTo(x + hill.w * 0.78, y - hill.h * 1.1, x + hill.w, y);
    ctx.closePath();
    ctx.fill();
  });
}

function drawClouds() {
  level.decorations.clouds.forEach((cloud) => {
    const x = cloud.x - game.cameraX * 0.15;
    const y = cloud.y;
    const s = cloud.scale;

    ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
    ctx.beginPath();
    ctx.arc(x, y + 18 * s, 18 * s, 0, Math.PI * 2);
    ctx.arc(x + 24 * s, y + 8 * s, 22 * s, 0, Math.PI * 2);
    ctx.arc(x + 50 * s, y + 17 * s, 19 * s, 0, Math.PI * 2);
    ctx.arc(x + 28 * s, y + 26 * s, 23 * s, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlatforms() {
  for (const platform of level.platforms) {
    const x = platform.x - game.cameraX;
    const y = platform.y;

    if (x + platform.w < -8 || x > WIDTH + 8) {
      continue;
    }

    if (platform.type === "switch") {
      const state = platform.switchState;
      const pressed = state && (state.active || state.locked);
      const baseColor = state && state.locked ? "#9bff8a" : pressed ? "#ffd166" : "#cdd5e8";
      ctx.fillStyle = "#3b4666";
      roundRect(x - 2, y + 4, platform.w + 4, 12, 4);
      ctx.fill();
      ctx.fillStyle = baseColor;
      const offset = pressed ? 4 : 0;
      roundRect(x + 4, y + offset, platform.w - 8, 12 - offset / 2, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1.2;
      roundRect(x + 4, y + offset, platform.w - 8, 12 - offset / 2, 4);
      ctx.stroke();
      if (state && state.locked) {
        ctx.fillStyle = "#1f5b21";
        ctx.font = "bold 10px Avenir Next, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("LOCK", x + platform.w / 2, y + 9);
      } else if (state) {
        ctx.fillStyle = "#20345d";
        ctx.font = "bold 10px Avenir Next, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(state.id === "plate1" ? "G1" : state.id === "plate2" ? "G2" : "SW", x + platform.w / 2, y + 9);
      }
      continue;
    }

    if (platform.type === "gate") {
      if (platform.broken) continue;
      ctx.fillStyle = "#1f2740";
      roundRect(x - 2, y - 6, platform.w + 4, 6, 3);
      ctx.fill();
      ctx.fillStyle = "#a13a4d";
      ctx.fillRect(x, y, platform.w, platform.h);
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      for (let yy = y + 6; yy < y + platform.h - 6; yy += 12) {
        ctx.fillRect(x + 2, yy, platform.w - 4, 2);
      }
      if (platform.gateLink) {
        ctx.fillStyle = "#fff6e4";
        ctx.font = "bold 10px Avenir Next, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(platform.gateLink.label || "閘", x + platform.w / 2, y + 14);
      }
      continue;
    }

    if (platform.type === "coinGate") {
      if (platform.broken) continue;
      const threshold = platform.coinGate.threshold;
      const ratio = clamp(game.coins / threshold, 0, 1);
      ctx.fillStyle = "#1f2740";
      roundRect(x - 2, y - 6, platform.w + 4, 6, 3);
      ctx.fill();
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(x, y, platform.w, platform.h);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(x + 2, y + (platform.h * (1 - ratio)), platform.w - 4, platform.h * ratio);
      ctx.fillStyle = "#1a2a57";
      ctx.font = "bold 11px Avenir Next, sans-serif";
      ctx.textAlign = "center";
      ctx.save();
      ctx.translate(x + platform.w / 2, y + platform.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${game.coins} / ${threshold}`, 0, 4);
      ctx.restore();
      if (game.coins < threshold) {
        ctx.fillStyle = "#fff6e4";
        ctx.font = "bold 10px Avenir Next, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`還差 ${threshold - game.coins}`, x + platform.w / 2, y - 10);
      }
      continue;
    }

    if (platform.type === "spike") {
      const spikeBase = y + platform.h;
      ctx.fillStyle = "#1f2740";
      ctx.fillRect(x, spikeBase - 18, platform.w, 18);
      ctx.fillStyle = "#d6dff5";
      const spikeWidth = 16;
      const count = Math.max(1, Math.floor(platform.w / spikeWidth));
      for (let i = 0; i < count; i += 1) {
        const sx = x + i * spikeWidth;
        ctx.beginPath();
        ctx.moveTo(sx, spikeBase - 18);
        ctx.lineTo(sx + spikeWidth / 2, spikeBase - 38);
        ctx.lineTo(sx + spikeWidth, spikeBase - 18);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(x, spikeBase - 14, platform.w, 4);
      continue;
    }

    if (platform.type === "spring") {
      const compress = clamp(platform.spring?.compressed ?? 0, 0, 8);
      const padY = y - 6 + compress * 0.55;
      const coilTopY = y - 4 + compress * 0.72;
      const bodyY = y - 2;
      ctx.fillStyle = "rgba(17, 31, 67, 0.18)";
      roundRect(x + 3, y + 2, platform.w - 6, 6, 3);
      ctx.fill();
      ctx.fillStyle = "#a36a36";
      roundRect(x + 8, bodyY, platform.w - 16, 8, 3);
      ctx.fill();
      ctx.strokeStyle = "rgba(73, 101, 171, 0.72)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x + 12, y + 2);
      ctx.lineTo(x + 12, y - 12);
      ctx.moveTo(x + platform.w - 12, y + 2);
      ctx.lineTo(x + platform.w - 12, y - 12);
      ctx.stroke();
      ctx.strokeStyle = "rgba(154, 96, 30, 0.82)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const coilWidth = platform.w - 24;
      const coilCount = 5;
      const coilStep = coilWidth / coilCount;
      for (let c = 0; c < coilCount; c += 1) {
        const cx = x + 12 + coilStep * c;
        ctx.moveTo(cx, y + 2);
        ctx.lineTo(cx + coilStep / 2, coilTopY);
        ctx.lineTo(cx + coilStep, y + 2);
      }
      ctx.stroke();
      ctx.fillStyle = "#ffd166";
      roundRect(x + 4, padY, platform.w - 8, 8, 4);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 247, 232, 0.44)";
      roundRect(x + 12, padY + 1, platform.w - 24, 3, 2);
      ctx.fill();
      continue;
    }

    if (platform.type === "crumble") {
      if (platform.broken) continue;
      const stress = platform.crumble ? clamp(platform.crumble.fallTimer / platform.crumble.threshold, 0, 1) : 0;
      const tilt = stress * 0.06 * Math.sin(Date.now() / 60);
      ctx.save();
      ctx.translate(x + platform.w / 2, y + platform.h / 2);
      ctx.rotate(tilt);
      ctx.fillStyle = "#a36a36";
      roundRect(-platform.w / 2, -platform.h / 2, platform.w, platform.h, 6);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      roundRect(-platform.w / 2, platform.h / 2 - 5, platform.w, 5, 4);
      ctx.fill();
      ctx.strokeStyle = `rgba(20, 18, 12, ${0.18 + stress * 0.6})`;
      ctx.lineWidth = 1.4 + stress * 1.6;
      ctx.beginPath();
      ctx.moveTo(-platform.w / 2 + 4, -2);
      ctx.lineTo(-platform.w / 4, 4);
      ctx.lineTo(0, -2);
      ctx.lineTo(platform.w / 4, 6);
      ctx.lineTo(platform.w / 2 - 4, -2);
      ctx.stroke();
      ctx.restore();
      continue;
    }

    if (platform.type === "ground") {
      ctx.fillStyle = palette.ground;
      ctx.fillRect(x, y, platform.w, platform.h);
      ctx.fillStyle = palette.grass;
      ctx.fillRect(x, y, platform.w, 14);

      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      ctx.fillRect(x, y + 20, platform.w, 4);

      ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
      for (let ix = 0; ix < platform.w; ix += 28) {
        ctx.fillRect(x + ix + 6, y + 24 + ((ix / 28) % 2) * 10, 6, 18);
      }
      continue;
    }

    if (platform.type === "stone") {
      ctx.fillStyle = palette.stoneEdge;
      ctx.fillRect(x, y, platform.w, platform.h);
      ctx.fillStyle = palette.stoneFace;
      ctx.fillRect(x + 4, y + 4, platform.w - 8, platform.h - 8);
      ctx.strokeStyle = "rgba(75, 91, 140, 0.55)";
      ctx.lineWidth = 2;
      for (let ix = 10; ix < platform.w; ix += 18) {
        ctx.beginPath();
        ctx.moveTo(x + ix, y + 8);
        ctx.lineTo(x + ix - 4, y + platform.h - 8);
        ctx.stroke();
      }
      continue;
    }

    if (platform.type === "leaf") {
      ctx.fillStyle = "#24448e";
      roundRect(x, y, platform.w, platform.h, 12);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      roundRect(x + 4, y + 4, platform.w - 8, platform.h - 8, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(239, 42, 62, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 10, y + platform.h / 2);
      ctx.lineTo(x + platform.w - 10, y + platform.h / 2);
      ctx.stroke();
      continue;
    }

    if (platform.type === "rotor") {
      const move = platform.move || {};
      const hubX = (move.anchorX ?? (platform.baseX + platform.w / 2)) - game.cameraX;
      const hubY = move.anchorY ?? (platform.baseY + platform.h / 2);

      ctx.strokeStyle = "rgba(36, 68, 142, 0.24)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(
        hubX,
        hubY,
        Math.abs(move.orbitRadiusX ?? 0),
        Math.abs(move.orbitRadiusY ?? 0),
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      ctx.strokeStyle = "rgba(24, 34, 64, 0.42)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(hubX, hubY);
      ctx.lineTo(x + platform.w / 2, y + platform.h / 2);
      ctx.stroke();

      ctx.fillStyle = "#20345d";
      ctx.beginPath();
      ctx.arc(hubX, hubY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f6fbff";
      ctx.beginPath();
      ctx.arc(hubX, hubY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#24448e";
      roundRect(x, y, platform.w, platform.h, 12);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      roundRect(x + 4, y + 4, platform.w - 8, platform.h - 8, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 124, 32, 0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 12, y + platform.h / 2);
      ctx.lineTo(x + platform.w - 12, y + platform.h / 2);
      ctx.stroke();
      continue;
    }

    ctx.fillStyle = palette.blockEdge;
    ctx.fillRect(x, y, platform.w, platform.h);
    ctx.fillStyle = palette.blockFace;
    ctx.fillRect(x + 4, y + 4, platform.w - 8, platform.h - 8);
    ctx.strokeStyle = "rgba(25, 70, 184, 0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 10, y + 10, platform.w - 20, platform.h - 20);
  }
}

function drawBossHazards() {
  if (level.bossProjectiles) {
    level.bossProjectiles.forEach((proj) => {
      const x = proj.x - game.cameraX;
      if (x + proj.r < 0 || x - proj.r > WIDTH) return;
      ctx.save();
      ctx.translate(x, proj.y);
      ctx.rotate(proj.spin);
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, proj.r * 1.6);
      grad.addColorStop(0, "#fff1a0");
      grad.addColorStop(0.5, "#ff7b20");
      grad.addColorStop(1, "rgba(239, 42, 62, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, proj.r * 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff5577";
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2;
        const r = i % 2 === 0 ? proj.r : proj.r * 0.6;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  if (level.bossShockwaves) {
    level.bossShockwaves.forEach((wave) => {
      const lifeRatio = wave.life / wave.maxLife;
      const alpha = (0.32 + clamp(lifeRatio, 0, 1) * 0.68) * 0.95;
      const width = wave.width ?? 30;
      const trailWidth = wave.trailWidth ?? 24;
      const palette = getBossFxPalette(wave.brand || "monster");
      [wave.leftX, wave.rightX].forEach((wx, idx) => {
        const x = wx - game.cameraX;
        if (x < -40 || x > WIDTH + 40) return;
        ctx.save();
        ctx.globalAlpha = alpha;
        const flip = idx === 0 ? -1 : 1;
        ctx.fillStyle = `rgba(${palette.glow}, 0.22)`;
        ctx.beginPath();
        ctx.ellipse(x - flip * (trailWidth * 0.28), wave.y + 2, trailWidth * 1.45, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 139, 166, 0.42)";
        ctx.beginPath();
        ctx.ellipse(x - flip * (trailWidth * 0.42), wave.y + 1.5, trailWidth, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = `rgba(${palette.glow}, 0.45)`;
        ctx.shadowBlur = 18;
        ctx.fillStyle = palette.edge;
        ctx.beginPath();
        ctx.moveTo(x, wave.y);
        ctx.lineTo(x - flip * (width * 0.58), wave.y - wave.height);
        ctx.lineTo(x - flip * (width * 0.18), wave.y - wave.height * 0.34);
        ctx.lineTo(x - flip * width, wave.y - wave.height * 0.82);
        ctx.lineTo(x - flip * (width * 0.48), wave.y);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = palette.spark;
        ctx.beginPath();
        ctx.moveTo(x, wave.y - 1);
        ctx.lineTo(x - flip * (width * 0.48), wave.y - wave.height * 0.56);
        ctx.lineTo(x - flip * (width * 0.14), wave.y - wave.height * 0.18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = `rgba(${palette.glow}, 0.72)`;
        ctx.fillRect(x - flip * 2, wave.y - wave.height * 0.96, 3, wave.height * 0.78);
        ctx.restore();
      });
    });
  }
}

function drawCrates() {
  if (!level.crates) return;
  for (const crate of level.crates) {
    const x = crate.x - game.cameraX;
    if (x + crate.w < -8 || x > WIDTH + 8) continue;
    const y = crate.y;
    const grad = ctx.createLinearGradient(x, y, x, y + crate.h);
    grad.addColorStop(0, "#c98b54");
    grad.addColorStop(1, "#7a4823");
    ctx.fillStyle = grad;
    roundRect(x, y, crate.w, crate.h, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(56, 28, 12, 0.6)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 4);
    ctx.lineTo(x + crate.w - 4, y + crate.h - 4);
    ctx.moveTo(x + crate.w - 4, y + 4);
    ctx.lineTo(x + 4, y + crate.h - 4);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 4);
    ctx.lineTo(x + crate.w - 4, y + 4);
    ctx.lineTo(x + crate.w - 4, y + crate.h - 4);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 209, 102, 0.92)";
    ctx.font = "bold 11px Avenir Next, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PUSH", x + crate.w / 2, y + crate.h / 2 + 4);
  }
}

function drawBonusCoins() {
  if (!level.bonusCoins) return;
  for (const coin of level.bonusCoins) {
    if (coin.collected) continue;
    const x = coin.x - game.cameraX;
    if (x + coin.r < 0 || x - coin.r > WIDTH) continue;
    const bobY = Math.sin(coin.bob) * 6;
    const aura = 0.4 + Math.sin(coin.bob * 1.5) * 0.4;
    const cx = x;
    const cy = coin.y + bobY;

    ctx.save();
    const radial = ctx.createRadialGradient(cx, cy, 6, cx, cy, coin.r * 2);
    radial.addColorStop(0, `rgba(255, 220, 100, ${0.55 + aura * 0.3})`);
    radial.addColorStop(1, "rgba(255, 220, 100, 0)");
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(cx, cy, coin.r * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (canDrawImage(art.product)) {
      ctx.save();
      ctx.shadowColor = "rgba(255, 168, 64, 0.7)";
      ctx.shadowBlur = 14;
      const drawW = coin.r * 1.6;
      const drawH = coin.r * 2.6;
      ctx.drawImage(art.product, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
      ctx.restore();
    } else {
      ctx.fillStyle = "#ffe28a";
      ctx.beginPath();
      ctx.arc(cx, cy, coin.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#fff7e8";
    ctx.font = "bold 11px Avenir Next, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`x${coin.value}`, cx, cy + coin.r + 14);
  }
}

function drawStageOneFx() {
  const cameraX = game.cameraX;

  STAGE_ONE_FX.speedLines.forEach((line) => {
    const ratio = clamp(line.life / line.maxLife, 0, 1);
    ctx.strokeStyle = `rgba(255, 245, 215, ${0.18 + ratio * 0.5})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(line.x - cameraX, line.y);
    ctx.lineTo(line.x - cameraX + line.vx * 1.6, line.y);
    ctx.stroke();
  });

  STAGE_ONE_FX.particles.forEach((p) => {
    const ratio = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = ratio;
    ctx.beginPath();
    ctx.arc(p.x - cameraX, p.y, p.size * (0.5 + ratio * 0.6), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  STAGE_ONE_FX.popups.forEach((popup) => {
    const ratio = clamp(popup.life / popup.maxLife, 0, 1);
    ctx.fillStyle = popup.color;
    ctx.globalAlpha = ratio;
    ctx.font = "bold 16px Avenir Next, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(popup.text, popup.x - cameraX, popup.y);
  });
  ctx.globalAlpha = 1;

  if (game.player.dashCooldown > 0) {
    const ratio = 1 - game.player.dashCooldown / PLAYER_DASH.cooldown;
    const px = game.player.x + game.player.w / 2 - cameraX;
    const py = game.player.y - 14;
    ctx.fillStyle = "rgba(12, 18, 35, 0.55)";
    roundRect(px - 22, py - 8, 44, 8, 4);
    ctx.fill();
    ctx.fillStyle = ratio >= 1 ? "#9bff8a" : "#ffd166";
    roundRect(px - 22, py - 8, 44 * ratio, 8, 4);
    ctx.fill();
  }
}

function drawDecorations() {
  level.decorations.towers.forEach((tower) => {
    const x = tower.x - game.cameraX;
    if (x + tower.w < 0 || x > WIDTH) {
      return;
    }
    ctx.fillStyle = tower.color;
    roundRect(x, tower.y, tower.w, tower.h, 10);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.fillRect(x + 10, tower.y + 10, tower.w - 20, 12);
  });

  level.decorations.signs.forEach((sign) => {
    const x = sign.x - game.cameraX;
    if (x + sign.w < -24 || x > WIDTH + 24) {
      return;
    }
    const innerInset = 5;
    const imageInset = 7;
    const postY = sign.y + sign.h - 4;
    const postH = Math.max(52, FLOOR_Y - postY);
    ctx.fillStyle = "#6d4928";
    roundRect(x + 22, postY, 10, postH, 4);
    ctx.fill();
    roundRect(x + sign.w - 34, postY, 10, postH, 4);
    ctx.fill();
    ctx.fillStyle = "rgba(34, 22, 10, 0.22)";
    roundRect(x + 18, FLOOR_Y - 6, 18, 6, 3);
    ctx.fill();
    roundRect(x + sign.w - 38, FLOOR_Y - 6, 18, 6, 3);
    ctx.fill();

    ctx.fillStyle = "#17213d";
    roundRect(x, sign.y, sign.w, sign.h, 18);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.34)";
    ctx.lineWidth = 2;
    roundRect(x + innerInset, sign.y + innerInset, sign.w - innerInset * 2, sign.h - innerInset * 2, 15);
    ctx.stroke();

    ctx.save();
    roundRect(x + imageInset, sign.y + imageInset, sign.w - imageInset * 2, sign.h - imageInset * 2, 13);
    ctx.clip();
    const usedPose = drawCoverImage(
      art.pose,
      x + imageInset,
      sign.y + imageInset,
      sign.w - imageInset * 2,
      sign.h - imageInset * 2,
      -Math.PI / 2,
      1.12,
      0.03,
      -0.02
    );
    if (!usedPose && canDrawImage(art.billboardRef)) {
      drawCoverImage(
        art.billboardRef,
        x + imageInset,
        sign.y + imageInset,
        sign.w - imageInset * 2,
        sign.h - imageInset * 2,
        0,
        1.04
      );
    }
    ctx.restore();

    ctx.fillStyle = "rgba(29, 41, 74, 0.78)";
    roundRect(x + 36, sign.y + sign.h - 54, sign.w - 72, 28, 14);
    ctx.fill();
    ctx.fillStyle = "#fff7e8";
    ctx.font = "bold 12px Avenir Next, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(sign.caption, x + sign.w / 2, sign.y + sign.h - 35);
  });
}

function drawCoins() {
  for (const coin of level.coins) {
    if (coin.collected) {
      continue;
    }
    const x = coin.x - game.cameraX;
    const bobY = Math.sin(coin.bob) * 5;
    if (x + coin.r < 0 || x - coin.r > WIDTH) {
      continue;
    }
    if (canDrawImage(art.product)) {
      ctx.save();
      ctx.shadowColor = "rgba(15, 23, 51, 0.22)";
      ctx.shadowBlur = 12;
      ctx.drawImage(
        art.product,
        x - COIN_DRAW_WIDTH / 2,
        coin.y + bobY - COIN_DRAW_HEIGHT / 2,
        COIN_DRAW_WIDTH,
        COIN_DRAW_HEIGHT
      );
      ctx.restore();
    } else {
      ctx.fillStyle = palette.coinShade;
      ctx.beginPath();
      ctx.ellipse(x, coin.y + bobY, coin.r, coin.r + 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette.coin;
      ctx.beginPath();
      ctx.ellipse(x, coin.y + bobY - 2, coin.r - 1, coin.r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawEnemySmoke(centerX, groundY, progress, brand) {
  const poof = clamp((progress - 0.2) / 0.8, 0, 1);
  if (poof <= 0) {
    return;
  }

  const tint = brand === "monster" ? "186, 255, 160" : "255, 235, 225";
  const puffs = [
    { dx: -18, dy: -14, rx: 8, ry: 6 },
    { dx: -6, dy: -24, rx: 10, ry: 8 },
    { dx: 10, dy: -21, rx: 9, ry: 7 },
    { dx: 24, dy: -12, rx: 7, ry: 5 },
  ];

  ctx.fillStyle = `rgba(${tint}, ${0.24 * (1 - poof * 0.45)})`;
  puffs.forEach((puff, index) => {
    const spread = 1 + poof * (0.75 + index * 0.08);
    ctx.beginPath();
    ctx.ellipse(
      centerX + puff.dx * spread,
      groundY + puff.dy - poof * (8 + index * 2),
      puff.rx + poof * (5 + index),
      puff.ry + poof * (4 + index * 0.8),
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
}

function drawEnemies() {
  level.enemies.forEach((enemy) => {
    if (!enemy.alive && enemy.squashTimer <= 0) {
      return;
    }
    if (game.bossCutscene?.active && enemy.role === "boss") {
      return;
    }

    const x = enemy.x - game.cameraX;
    if (x + enemy.w < -12 || x > WIDTH + 12) {
      return;
    }

    const enemyImage = getEnemyImageForBrand(enemy.brand);
    const centerX = x + enemy.w / 2;
    const groundY = enemy.y + enemy.h - 2;
    const deathProgress = enemy.alive
      ? 0
      : 1 - clamp(enemy.squashTimer / ENEMY_SQUASH_FRAMES, 0, 1);
    const squashProgress = clamp(deathProgress / 0.42, 0, 1);
    const fadeProgress = clamp((deathProgress - 0.22) / 0.78, 0, 1);
    const shadowWidth = enemy.alive ? 28 : 28 + squashProgress * 22 + fadeProgress * 6;
    const shadowHeight = enemy.alive ? 10 : Math.max(3, 9 - squashProgress * 4.5);
    const baseHeight = 66;
    const baseWidth = canDrawImage(enemyImage)
      ? (enemyImage.naturalWidth / enemyImage.naturalHeight) * baseHeight
      : enemy.w;
    const drawHeight = enemy.alive
      ? baseHeight
      : Math.max(12, baseHeight * (1 - squashProgress * 0.7 - fadeProgress * 0.12));
    const drawWidth = enemy.alive
      ? baseWidth
      : baseWidth * (1 + squashProgress * 0.55 + fadeProgress * 0.06);
    const bounceDy = enemy.role === "boss" ? getCutsceneBounceDy("boss") : 0;
    const drawX = centerX - drawWidth / 2;
    const drawY = enemy.y + enemy.h - drawHeight + fadeProgress * 4 + bounceDy;

    if (!enemy.alive) {
      ctx.fillStyle =
        enemy.brand === "monster" ? "rgba(170, 255, 150, 0.18)" : "rgba(255, 244, 236, 0.2)";
      roundRect(
        centerX - (14 + squashProgress * 14),
        groundY - (8 - squashProgress * 2),
        28 + squashProgress * 28,
        8 - squashProgress * 2.5,
        4
      );
      ctx.fill();
      drawEnemySmoke(centerX, groundY, deathProgress, enemy.brand);
    }

    if (canDrawImage(enemyImage)) {
      ctx.save();
      ctx.globalAlpha = enemy.alive ? 1 : Math.max(0.08, 1 - fadeProgress * 0.9);
      if (enemy.role === "boss" && enemy.alive) {
        const bossRect = getBossRenderRect(enemy, bounceDy);
        const bossScreenX = bossRect.x - game.cameraX;
        const bossPalette = getBossFxPalette(enemy.brand);
        const transformProgress =
          (enemy.transformTimer ?? 0) > 0 && (enemy.transformTotal ?? 0) > 0
            ? 1 - clamp(enemy.transformTimer / enemy.transformTotal, 0, 1)
            : 0;
        const tellStrength = clamp((enemy.tellTimer ?? 0) / 24, 0, 1);
        const auraPulse = 0.5 + Math.sin(Date.now() / 110 + enemy.x * 0.02) * 0.5;
        const auraAlpha = 0.12 + auraPulse * 0.08 + tellStrength * 0.22 + transformProgress * 0.26;
        ctx.save();
        ctx.shadowColor = `rgba(${bossPalette.glow}, ${0.38 + tellStrength * 0.22})`;
        ctx.shadowBlur = 18 + tellStrength * 18 + transformProgress * 16;
        const auraGrad = ctx.createRadialGradient(
          bossScreenX + bossRect.w / 2,
          bossRect.y + bossRect.h * 0.44,
          8,
          bossScreenX + bossRect.w / 2,
          bossRect.y + bossRect.h * 0.44,
          bossRect.w * (0.42 + tellStrength * 0.14)
        );
        auraGrad.addColorStop(0, `rgba(${bossPalette.glow}, ${auraAlpha})`);
        auraGrad.addColorStop(0.65, `rgba(${bossPalette.glow}, ${0.08 + tellStrength * 0.08})`);
        auraGrad.addColorStop(1, `rgba(${bossPalette.glow}, 0)`);
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.ellipse(
          bossScreenX + bossRect.w / 2,
          bossRect.y + bossRect.h * 0.46,
          bossRect.w * (0.54 + tellStrength * 0.08),
          bossRect.h * (0.52 + tellStrength * 0.06),
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
        if (transformProgress > 0) {
          const flashAlpha = 0.18 + Math.sin(transformProgress * Math.PI * 8) * 0.12 + transformProgress * 0.2;
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, flashAlpha)})`;
          roundRect(
            bossScreenX - 6 - transformProgress * 10,
            bossRect.y - 8 - transformProgress * 6,
            bossRect.w + 12 + transformProgress * 20,
            bossRect.h + 16 + transformProgress * 12,
            18
          );
          ctx.fill();
        }
        if (tellStrength > 0.02) {
          ctx.strokeStyle = `rgba(${bossPalette.glow}, ${0.36 + tellStrength * 0.24})`;
          ctx.lineWidth = 2.2 + tellStrength * 1.6;
          ctx.beginPath();
          ctx.ellipse(
            bossScreenX + bossRect.w / 2,
            bossRect.y + bossRect.h * 0.46,
            bossRect.w * (0.48 + tellStrength * 0.18),
            bossRect.h * (0.4 + tellStrength * 0.12),
            0,
            0,
            Math.PI * 2
          );
          ctx.stroke();
          for (let i = 0; i < 3; i += 1) {
            const beamX = bossScreenX + bossRect.w * (0.24 + i * 0.26);
            ctx.fillStyle = `rgba(${bossPalette.glow}, ${0.16 + tellStrength * 0.16})`;
            ctx.fillRect(beamX, bossRect.y - 18 - tellStrength * 16, 4, bossRect.h * 0.32);
          }
        }
        ctx.restore();
        if (transformProgress > 0 && enemy.transformFromBrand && enemy.transformToBrand) {
          const fromImage = getEnemyImageForBrand(enemy.transformFromBrand);
          const toImage = getEnemyImageForBrand(enemy.transformToBrand);
          const pulseScale = 1 + Math.sin(transformProgress * Math.PI * 4) * 0.06;
          const pulseW = bossRect.w * pulseScale;
          const pulseH = bossRect.h * pulseScale;
          const pulseX = bossScreenX + (bossRect.w - pulseW) / 2;
          const pulseY = bossRect.y + (bossRect.h - pulseH) / 2;
          if (canDrawImage(fromImage)) {
            ctx.save();
            ctx.globalAlpha = 1 - transformProgress;
            ctx.drawImage(fromImage, pulseX, pulseY, pulseW, pulseH);
            ctx.restore();
          }
          if (canDrawImage(toImage)) {
            ctx.save();
            ctx.globalAlpha = transformProgress;
            ctx.drawImage(toImage, pulseX, pulseY, pulseW, pulseH);
            ctx.restore();
          }
        } else {
          ctx.drawImage(enemyImage, bossRect.x - game.cameraX, bossRect.y, bossRect.w, bossRect.h);
        }
      } else {
        ctx.drawImage(enemyImage, drawX, drawY, drawWidth, drawHeight);
      }
      ctx.restore();

      if (enemy.role === "boss" && enemy.alive && level.bossEngaged) {
        if (enemy.tellTimer > 0) {
          ctx.save();
          ctx.globalAlpha = 0.35 + Math.sin(Date.now() / 60) * 0.3;
          ctx.fillStyle = enemy.phase === "chargeWindup" ? "#ff5577" :
            enemy.phase === "shootWindup" ? "#ffd166" :
            enemy.phase === "summonWindup" ? "#7ae8ff" : "#9bff8a";
          roundRect(drawX - 4, drawY - 6, drawWidth * 1.45 + 8, drawHeight * 1.45 + 12, 14);
          ctx.fill();
          ctx.restore();
        }

        const barX = enemy.x - game.cameraX - 4;
        const barY = enemy.y - 22;
        const barW = enemy.w + 8;
        ctx.fillStyle = "rgba(12, 18, 35, 0.62)";
        roundRect(barX - 2, barY - 2, barW + 4, 12, 5);
        ctx.fill();
        ctx.fillStyle = "#3a4366";
        roundRect(barX, barY, barW, 8, 4);
        ctx.fill();
        const ratio = clamp((enemy.hp ?? 1) / (enemy.maxHp ?? 1), 0, 1);
        const grad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
        grad.addColorStop(0, "#ef2a3e");
        grad.addColorStop(1, "#ff7b20");
        ctx.fillStyle = grad;
        roundRect(barX, barY, barW * ratio, 8, 4);
        ctx.fill();

        ctx.fillStyle = "#fff7e8";
        ctx.font = "bold 11px Avenir Next, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`BOSS HP ${Math.max(0, enemy.hp)}/${enemy.maxHp}`, barX + barW / 2, barY - 4);

        const phaseColor = enemy.phase === "stunned" ? "#9bff8a" :
          enemy.phase === "transform" ? "#ffd166" :
          enemy.phase === "idle" ? "#cdd5e8" :
          enemy.berserk ? "#ff2244" :
          enemy.enraged ? "#ffb347" : "#cdd5e8";
        const baseLabel = enemy.phase === "idle" ? "待機中" :
          enemy.phase === "transform" ? "紅牛變身中" :
          enemy.phase === "stunned" ? "破綻！踩它" :
          enemy.phase === "shaken" ? "BOSS 翻臉" :
          enemy.phase === "charge" || enemy.phase === "chargeWindup" ? "衝刺中" :
          enemy.phase === "shootWindup" ? "蓄力射擊" :
          enemy.phase === "summonWindup" ? "召喚小怪" :
          enemy.phase === "jumpWindup" || enemy.phase === "airborne" ? "跳躍砸地" :
          "巡邏中";
        const phasePrefix = !level.bossEngaged
          ? ""
          : enemy.phase === "stunned"
            ? ""
            : enemy.berserk
              ? "BERSERK · "
              : enemy.enraged
                ? "怒火全開 · "
                : "開戰中 · ";
        const phaseLabel = `${phasePrefix}${baseLabel}`;
        ctx.fillStyle = phaseColor;
        ctx.font = "bold 10px Avenir Next, sans-serif";
        ctx.fillText(phaseLabel, barX + barW / 2, barY + 22);
        if (level.bossEngaged) {
          ctx.fillStyle = "rgba(255, 247, 232, 0.82)";
          ctx.font = "bold 10px Avenir Next, sans-serif";
          ctx.fillText(`小怪 ${countBossMinionsAlive()}`, barX + barW / 2, barY + 35);
        }
        if (enemy.phase === "stunned") {
          const stompPulse = 0.55 + Math.sin(Date.now() / 110) * 0.45;
          ctx.fillStyle = `rgba(255, 224, 154, ${0.48 + stompPulse * 0.32})`;
          roundRect(barX + 8, enemy.y - 56, barW - 16, 22, 10);
          ctx.fill();
          ctx.fillStyle = "#16203d";
          ctx.font = "bold 13px Avenir Next, sans-serif";
          ctx.fillText("現在踩它", barX + barW / 2, enemy.y - 41);
        }
      }

      if (enemy.role === "charger" && enemy.alive) {
        const dx = game.player.x - enemy.x;
        if (Math.abs(dx) < (enemy.sightRange ?? 240) && Math.abs(game.player.y - enemy.y) < 80) {
          ctx.fillStyle = "rgba(239, 42, 62, 0.85)";
          ctx.font = "bold 14px Avenir Next, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("!", x + enemy.w / 2, enemy.y - 6);
        }
      }
      return;
    }

    const squash = enemy.alive ? 0 : 8 + squashProgress * 10;
    ctx.fillStyle = palette.enemyShade;
    roundRect(x + 2, enemy.y + 10, enemy.w - 4, enemy.h - squash - 10, 10);
    ctx.fill();
    ctx.fillStyle = palette.enemyBody;
    roundRect(x, enemy.y + 4, enemy.w, enemy.h - squash - 8, 12);
    ctx.fill();
    ctx.fillStyle = palette.enemyText;
    ctx.font = "bold 13px Avenir Next, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(enemy.label, x + enemy.w / 2, enemy.y + 22);
  });
}

function drawGoal() {
  if (!level.goal || !level.finishArch) {
    return;
  }
  const locked = isStageOneGoalLocked();
  const poleX = level.goal.x - game.cameraX;
  ctx.fillStyle = locked ? "#7c8aaf" : palette.goalPole;
  ctx.fillRect(poleX, level.goal.y, level.goal.w, level.goal.h);
  if (locked) {
    ctx.fillStyle = "rgba(239, 42, 62, 0.4)";
    ctx.fillRect(poleX - 4, level.goal.y, level.goal.w + 8, level.goal.h);
    ctx.fillStyle = "#ffd2bd";
    ctx.font = "bold 14px Avenir Next, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BOSS 未倒", poleX + level.goal.w / 2, level.goal.y - 8);
  } else {
    ctx.fillStyle = "rgba(255, 240, 170, 0.22)";
    ctx.fillRect(poleX - 10, level.goal.y - 6, level.goal.w + 20, level.goal.h + 12);
    ctx.fillStyle = "#fff0b3";
    ctx.font = "bold 14px Avenir Next, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("可交件", poleX + level.goal.w / 2, level.goal.y - 8);
  }
  ctx.fillStyle = locked ? "#a13a4d" : palette.goalFlag;
  ctx.beginPath();
  ctx.moveTo(poleX + level.goal.w, level.goal.flagY);
  ctx.lineTo(poleX + level.goal.w + 54, level.goal.flagY + 16);
  ctx.lineTo(poleX + level.goal.w, level.goal.flagY + 32);
  ctx.closePath();
  ctx.fill();

  const archX = level.finishArch.x - game.cameraX;
  ctx.fillStyle = "#17326f";
  roundRect(archX, level.finishArch.y, level.finishArch.w, level.finishArch.h, 14);
  ctx.fill();
  ctx.fillStyle = "#f7fbff";
  roundRect(archX + 12, level.finishArch.y + 12, level.finishArch.w - 24, level.finishArch.h - 24, 12);
  ctx.fill();

  if (canDrawImage(art.product)) {
    ctx.drawImage(art.product, archX + 38, level.finishArch.y + 18, 34, 86);
  }

  if (!locked) {
    ctx.fillStyle = "rgba(255, 216, 102, 0.18)";
    roundRect(archX - 8, level.finishArch.y - 8, level.finishArch.w + 16, level.finishArch.h + 16, 18);
    ctx.fill();
  }

  ctx.fillStyle = palette.stripeRed;
  ctx.font = "bold 16px Avenir Next, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("交件區", archX + level.finishArch.w / 2, level.finishArch.y + 102);
}

function drawGoalArrow() {
  if (!level.goal) {
    return;
  }
  if (game.stage !== 1 || game.state === "intro" || isStageOneGoalLocked()) {
    return;
  }
  const goalScreenX = level.goal.x - game.cameraX;
  if (goalScreenX >= 40 && goalScreenX <= WIDTH - 40) {
    return;
  }
  const toRight = goalScreenX > WIDTH;
  const arrowX = toRight ? WIDTH - 42 : 42;
  const arrowY = 144;
  const distance = Math.max(0, Math.round(Math.abs(level.goal.x - game.player.x) / 10) * 10);

  ctx.save();
  ctx.fillStyle = "rgba(12, 18, 35, 0.58)";
  roundRect(arrowX - 34, arrowY - 34, 68, 68, 18);
  ctx.fill();
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  if (toRight) {
    ctx.moveTo(arrowX - 10, arrowY - 12);
    ctx.lineTo(arrowX + 14, arrowY);
    ctx.lineTo(arrowX - 10, arrowY + 12);
  } else {
    ctx.moveTo(arrowX + 10, arrowY - 12);
    ctx.lineTo(arrowX - 14, arrowY);
    ctx.lineTo(arrowX + 10, arrowY + 12);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff7e8";
  ctx.font = "bold 11px Avenir Next, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("交件區", arrowX, arrowY - 18);
  ctx.fillText(`${distance}`, arrowX, arrowY + 25);
  ctx.restore();
}

function drawCheckpoints() {
  if (!level.checkpoints) return;
  level.checkpoints.forEach((checkpoint) => {
    const x = checkpoint.x - game.cameraX;
    if (x < -40 || x > WIDTH + 40) return;
    const poleY = FLOOR_Y - 86;
    const pulse = 0.5 + Math.sin(Date.now() / 220 + checkpoint.x * 0.01) * 0.5;
    if (checkpoint.active) {
      ctx.fillStyle = `rgba(155, 255, 138, ${0.14 + pulse * 0.12})`;
      ctx.beginPath();
      ctx.arc(x + 2, poleY + 20, 24 + pulse * 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = checkpoint.active ? "#9bff8a" : "rgba(201, 211, 238, 0.82)";
    ctx.fillRect(x, poleY, 4, 86);

    const flagColor = checkpoint.active ? "#9bff8a" : "#cdd5e8";
    ctx.fillStyle = flagColor;
    ctx.beginPath();
    ctx.moveTo(x + 4, poleY + 10);
    ctx.lineTo(x + 34, poleY + 20);
    ctx.lineTo(x + 4, poleY + 30);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = checkpoint.active ? "#1f5b21" : "#4b5879";
    ctx.font = "bold 11px Avenir Next, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(checkpoint.label, x + 18, poleY - 8);
  });
}

function predictStageTwoTrajectory(stageTwo, samples = 22, dtMs = 28) {
  if (!stageTwo.physics) {
    return [];
  }
  const { sling, projectile } = stageTwo;
  const dx = sling.x - projectile.x;
  const dy = sling.y - projectile.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 6) {
    return [];
  }
  const pull = clamp(distance / sling.maxPull, 0, 1);
  const power = easeOutCubic(pull) * STAGE_TWO_PROJECTILE.maxLaunchSpeed;
  const angle = Math.atan2(dy, dx);
  let vx = Math.cos(angle) * power;
  let vy = Math.sin(angle) * power;
  let x = projectile.x;
  let y = projectile.y;

  const points = [];
  const gravity = 1.05;
  const drag = STAGE_TWO_PROJECTILE.frictionAir;

  for (let i = 0; i < samples; i += 1) {
    const seconds = dtMs / 1000;
    vy += gravity * 60 * seconds * 0.06;
    vx *= 1 - drag * 0.6;
    vy *= 1 - drag * 0.6;
    x += vx * seconds * 16;
    y += vy * seconds * 16;
    if (y > stageTwo.groundY - 6 || x > WIDTH + 40 || x < -40) {
      points.push({ x, y, t: i });
      break;
    }
    points.push({ x, y, t: i });
  }
  return points;
}

function drawStageTwoTrajectory(stageTwo) {
  if (!stageTwo.dragging) {
    return;
  }

  const points = predictStageTwoTrajectory(stageTwo);
  if (points.length === 0) {
    return;
  }

  ctx.save();
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    const fade = 1 - i / points.length;
    const radius = Math.max(1.6, 4.4 - i * 0.12);
    ctx.fillStyle = `rgba(255, 240, 220, ${0.24 + fade * 0.5})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  if (points.length > 6) {
    const head = points[Math.min(points.length - 1, 14)];
    ctx.fillStyle = "rgba(239, 42, 62, 0.55)";
    ctx.beginPath();
    ctx.arc(head.x, head.y, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStageTwoPowerMeter(stageTwo) {
  if (game.state === "stage2Intro") {
    return;
  }

  const projectile = stageTwo.projectile;
  if (projectile.state !== "ready" && projectile.state !== "dragging") {
    return;
  }

  const dx = projectile.x - stageTwo.sling.x;
  const dy = projectile.y - stageTwo.sling.y;
  const distance = Math.hypot(dx, dy);
  const pullRatio = clamp(distance / stageTwo.sling.maxPull, 0, 1);
  const power = easeOutCubic(pullRatio);
  const meterX = 36;
  const meterY = HEIGHT - 96;
  const meterW = 184;
  const meterH = 18;

  ctx.fillStyle = "rgba(12, 18, 35, 0.5)";
  roundRect(meterX - 10, meterY - 38, 204, 74, 16);
  ctx.fill();

  ctx.fillStyle = "#fff7e8";
  ctx.font = "bold 14px Avenir Next, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    stageTwo.dragging ? `拉力 ${Math.round(pullRatio * 100)}%` : "拉住 200P 往後拉",
    meterX,
    meterY - 18
  );
  ctx.fillStyle = pullRatio > 0.9 ? "#ffd5be" : "rgba(255, 247, 232, 0.7)";
  ctx.font = "12px Avenir Next, sans-serif";
  ctx.fillText(
    `輸出 ${Math.round(power * 100)}%${pullRatio > 0.9 ? "  ▶ 滿弓" : ""}`,
    meterX,
    meterY + meterH + 18
  );

  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  roundRect(meterX, meterY, meterW, meterH, 9);
  ctx.fill();

  const fillGradient = ctx.createLinearGradient(meterX, meterY, meterX + meterW, meterY + meterH);
  fillGradient.addColorStop(0, palette.stripeOrange);
  fillGradient.addColorStop(0.7, palette.stripeRed);
  fillGradient.addColorStop(1, "#ffd166");
  ctx.fillStyle = fillGradient;
  roundRect(meterX, meterY, Math.max(8, meterW * power), meterH, 9);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  for (let i = 1; i < 4; i += 1) {
    ctx.fillRect(meterX + (meterW * i) / 4, meterY + 3, 1.5, meterH - 6);
  }
}

function drawStageTwoSling(stageTwo) {
  const { sling, projectile } = stageTwo;
  const dx = projectile.x - sling.x;
  const dy = projectile.y - sling.y;
  const pullDistance = Math.hypot(dx, dy);
  const pull = clamp(pullDistance / sling.maxPull, 0, 1);
  const overTension = pullDistance > sling.maxPull * 0.9;
  const tensionTint = overTension
    ? `rgba(239, 42, 62, ${0.85 + Math.sin(Date.now() / 80) * 0.15})`
    : `rgba(${Math.round(120 + 70 * pull)}, ${Math.round(60 + 20 * (1 - pull))}, ${Math.round(40 + 30 * (1 - pull))}, 0.95)`;
  const bandWidth = 4.6 + pull * 4.2;
  const backY = sling.y - 28;
  const frontY = sling.y - 14;

  if (projectile.state === "ready" || projectile.state === "dragging") {
    ctx.save();
    ctx.strokeStyle = "rgba(70, 38, 18, 0.5)";
    ctx.lineWidth = bandWidth + 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sling.x - 16, backY);
    ctx.quadraticCurveTo(
      sling.x - 12 + dx * 0.5,
      backY + dy * 0.5,
      projectile.x - 6,
      projectile.y - 6
    );
    ctx.stroke();

    ctx.strokeStyle = tensionTint;
    ctx.lineWidth = bandWidth;
    ctx.beginPath();
    ctx.moveTo(sling.x - 16, backY);
    ctx.lineTo(projectile.x - 6, projectile.y - 6);
    ctx.stroke();
    ctx.restore();
  }

  const gradient = ctx.createLinearGradient(sling.x - 30, sling.y - 60, sling.x + 30, sling.y + 12);
  gradient.addColorStop(0, "#5e3216");
  gradient.addColorStop(0.55, "#8e4d20");
  gradient.addColorStop(1, "#3f1f0a");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(sling.x - 30, sling.y + 12);
  ctx.quadraticCurveTo(sling.x - 26, sling.y - 10, sling.x - 22, sling.y - 56);
  ctx.lineTo(sling.x - 12, sling.y - 56);
  ctx.quadraticCurveTo(sling.x - 14, sling.y - 16, sling.x - 8, sling.y + 12);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sling.x + 8, sling.y + 12);
  ctx.quadraticCurveTo(sling.x + 14, sling.y - 16, sling.x + 12, sling.y - 56);
  ctx.lineTo(sling.x + 22, sling.y - 56);
  ctx.quadraticCurveTo(sling.x + 26, sling.y - 10, sling.x + 30, sling.y + 12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#8b4b29";
  ctx.beginPath();
  ctx.ellipse(sling.x, sling.y + 10, 34, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (projectile.state === "ready" || projectile.state === "dragging") {
    ctx.save();
    ctx.strokeStyle = "rgba(70, 38, 18, 0.5)";
    ctx.lineWidth = bandWidth + 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sling.x + 16, backY);
    ctx.quadraticCurveTo(
      sling.x + 12 + dx * 0.5,
      backY + dy * 0.5,
      projectile.x + 6,
      projectile.y + 4
    );
    ctx.stroke();

    ctx.strokeStyle = tensionTint;
    ctx.lineWidth = bandWidth;
    ctx.beginPath();
    ctx.moveTo(sling.x + 16, backY);
    ctx.lineTo(projectile.x + 6, projectile.y + 4);
    ctx.stroke();
    ctx.restore();
  }

  if (overTension && (projectile.state === "ready" || projectile.state === "dragging")) {
    const halo = 0.4 + Math.sin(Date.now() / 90) * 0.4;
    ctx.strokeStyle = `rgba(239, 42, 62, ${halo})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 26, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawStageTwoBlocks(stageTwo) {
  stageTwo.blocks.forEach((block) => {
    if (block.broken) {
      return;
    }
    const def = STAGE_TWO_MATERIALS[block.material] || STAGE_TWO_MATERIALS.wood;
    const cx = block.x + block.w / 2;
    const cy = block.y + block.h / 2;
    const damageRatio = clamp(1 - block.hp / block.maxHp, 0, 1);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(block.rotation || 0);

    const halfW = block.w / 2;
    const halfH = block.h / 2;
    const radius = Math.min(def.chamfer + 2, Math.min(halfW, halfH));

    const fill = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
    fill.addColorStop(0, def.palette.face);
    fill.addColorStop(1, def.palette.edge);
    ctx.fillStyle = fill;
    roundRect(-halfW, -halfH, block.w, block.h, radius);
    ctx.fill();

    ctx.strokeStyle = def.palette.edge;
    ctx.lineWidth = 1.4;
    roundRect(-halfW, -halfH, block.w, block.h, radius);
    ctx.stroke();

    if (block.material === "wood") {
      ctx.strokeStyle = def.palette.grain;
      ctx.lineWidth = 1;
      const grainCount = Math.max(2, Math.floor(block.h / 10));
      for (let g = 1; g < grainCount; g += 1) {
        const yOff = -halfH + (g * block.h) / grainCount;
        ctx.beginPath();
        ctx.moveTo(-halfW + 4, yOff);
        ctx.bezierCurveTo(
          -halfW / 2,
          yOff + Math.sin(g * 1.2) * 1.6,
          halfW / 2,
          yOff + Math.cos(g * 0.9) * 1.4,
          halfW - 4,
          yOff
        );
        ctx.stroke();
      }
    } else if (block.material === "glass") {
      ctx.strokeStyle = def.palette.grain;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-halfW + 3, -halfH + 3);
      ctx.lineTo(-halfW + halfW * 0.4, halfH - 4);
      ctx.moveTo(halfW - 4, -halfH + 4);
      ctx.lineTo(halfW * 0.1, halfH - 3);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
      ctx.fillRect(-halfW + 4, -halfH + 4, block.w - 8, 4);
    } else if (block.material === "stone") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillRect(-halfW + 4, -halfH + 4, block.w - 8, 5);
      ctx.strokeStyle = def.palette.grain;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-halfW + 6, -halfH / 2);
      ctx.lineTo(halfW - 4, -halfH / 4);
      ctx.moveTo(-halfW + 6, halfH / 2);
      ctx.lineTo(halfW - 4, halfH / 4);
      ctx.stroke();
    }

    if (damageRatio > 0.05) {
      ctx.strokeStyle = `rgba(20, 25, 40, ${0.18 + damageRatio * 0.45})`;
      ctx.lineWidth = 1.3 + damageRatio * 1.2;
      ctx.beginPath();
      const cracks = 2 + Math.round(damageRatio * 3);
      for (let c = 0; c < cracks; c += 1) {
        const startAngle = (c / cracks) * Math.PI * 2 + (block.x % 7) * 0.2;
        const sx = Math.cos(startAngle) * Math.min(halfW, halfH) * 0.2;
        const sy = Math.sin(startAngle) * Math.min(halfW, halfH) * 0.2;
        ctx.moveTo(sx, sy);
        ctx.lineTo(
          Math.cos(startAngle + 0.6) * halfW * 0.85,
          Math.sin(startAngle + 0.6) * halfH * 0.85
        );
      }
      ctx.stroke();
    }

    ctx.restore();
  });
}

function drawStageTwoTargets(stageTwo) {
  const activeTargets = countStageTwoActiveTargets(stageTwo);
  stageTwo.targets.forEach((target) => {
    if (target.state === "dead") {
      return;
    }

    if (target.state === "poof") {
      drawEnemySmoke(
        target.x + target.w / 2,
        target.y + target.h - 4,
        1 - clamp(target.poofTimer / 20, 0, 1),
        target.brand
      );
      return;
    }

    const targetImage = target.brand === "monster" ? art.enemyMonster : art.enemyRedBull;
    const pulse = 0.5 + Math.sin(Date.now() / 180 + target.x * 0.02) * 0.5;
    ctx.save();
    ctx.translate(target.x + target.w / 2, target.y + target.h / 2);
    ctx.rotate(target.rotation);
    ctx.strokeStyle =
      target.brand === "monster"
        ? `rgba(155, 255, 138, ${0.3 + pulse * 0.25})`
        : `rgba(255, 214, 189, ${0.28 + pulse * 0.25})`;
    ctx.lineWidth = activeTargets === 1 ? 4 : 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26 + pulse * 6, 40 + pulse * 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.save();
    if (canDrawImage(targetImage)) {
      const drawHeight = 70;
      const drawWidth = (targetImage.naturalWidth / targetImage.naturalHeight) * drawHeight;
      ctx.drawImage(targetImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    } else {
      ctx.fillStyle = target.brand === "monster" ? "#13211a" : "#1b4588";
      roundRect(-18, -32, 36, 64, 10);
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
    if (activeTargets === 1) {
      ctx.fillStyle = "rgba(255, 247, 232, 0.82)";
      ctx.font = "bold 12px Avenir Next, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("最後目標", target.x + target.w / 2, target.y - 18);
    }
  });
}

function drawStageTwoProjectile(stageTwo) {
  const projectile = stageTwo.projectile;
  if (projectile.state === "spent" && stageTwo.shotsLeft <= 0 && stageTwo.resetDelay <= 0) {
    return;
  }

  if (projectile.state === "flying" && stageTwo.physics && stageTwo.physics.projectileBody) {
    const body = stageTwo.physics.projectileBody;
    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    if (speed > 1.4) {
      const trailLen = clamp(speed * 1.6, 12, 70);
      const angle = Math.atan2(body.velocity.y, body.velocity.x);
      const tailX = projectile.x - Math.cos(angle) * trailLen;
      const tailY = projectile.y - Math.sin(angle) * trailLen;
      const trailGradient = ctx.createLinearGradient(projectile.x, projectile.y, tailX, tailY);
      trailGradient.addColorStop(0, "rgba(255, 240, 196, 0.8)");
      trailGradient.addColorStop(1, "rgba(255, 240, 196, 0)");
      ctx.strokeStyle = trailGradient;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(projectile.x, projectile.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
    }
  }

  ctx.save();
  ctx.translate(projectile.x, projectile.y);
  ctx.rotate(projectile.rotation);
  if (canDrawImage(art.product)) {
    ctx.shadowColor = "rgba(15, 23, 51, 0.28)";
    ctx.shadowBlur = 10;
    ctx.drawImage(art.product, -17, -30, 34, 60);
  } else {
    ctx.fillStyle = palette.stripeOrange;
    roundRect(-14, -20, 28, 40, 10);
    ctx.fill();
  }
  ctx.restore();

  if (
    stageTwo.physics &&
    stageTwo.physics.fuseFrames != null &&
    stageTwo.physics.fuseFrames > 0
  ) {
    const fuseRatio = clamp(stageTwo.physics.fuseFrames / STAGE_TWO_FUSE_FRAMES, 0, 1);
    const intensity = 1 - fuseRatio;
    const pulse = 0.6 + Math.sin(Date.now() / 30) * 0.4;
    ctx.save();
    ctx.globalAlpha = 0.55 + intensity * 0.4;
    ctx.fillStyle = `rgba(255, ${Math.floor(180 + intensity * 60)}, ${Math.floor(60 - intensity * 40)}, 0.85)`;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 14 + intensity * 18 + pulse * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#fff7d4";
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 4 + intensity * 4 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (projectile.state === "ready" && !stageTwo.dragging) {
    const pulse = 0.5 + Math.sin(Date.now() / 180) * 0.5;
    ctx.strokeStyle = `rgba(25, 70, 184, ${0.24 + pulse * 0.24})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 26 + pulse * 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(12, 18, 35, 0.32)";
    roundRect(projectile.x - 52, projectile.y - 64, 104, 28, 12);
    ctx.fill();
    ctx.fillStyle = "#fff7e8";
    ctx.font = "bold 14px Avenir Next, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("拖曳 200P", projectile.x, projectile.y - 45);
  }
}

function drawStageTwoFx() {
  STAGE_TWO_FX.flashes.forEach((flash) => {
    const t = clamp(1 - flash.life / flash.maxLife, 0, 1);
    const radius = flash.radius * (0.8 + t * 1.2);
    const gradient = ctx.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, radius);
    gradient.addColorStop(0, `rgba(255, 240, 196, ${0.78 * (1 - t)})`);
    gradient.addColorStop(0.5, `rgba(255, 168, 96, ${0.42 * (1 - t)})`);
    gradient.addColorStop(1, "rgba(255, 168, 96, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(flash.x, flash.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  STAGE_TWO_FX.particles.forEach((particle) => {
    const lifeRatio = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = lifeRatio;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * (0.4 + lifeRatio * 0.7), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawStageTwoScene() {
  const stageTwo = game.stageTwo;
  if (!stageTwo) {
    return;
  }

  drawBackground();

  const shakeX = STAGE_TWO_FX.cameraShakeX;
  const shakeY = STAGE_TWO_FX.cameraShakeY;
  ctx.save();
  ctx.translate(shakeX, shakeY);

  ctx.fillStyle = "#1a2a57";
  ctx.fillRect(0, stageTwo.groundY, WIDTH, HEIGHT - stageTwo.groundY);
  ctx.fillStyle = palette.grass;
  ctx.fillRect(0, stageTwo.groundY, WIDTH, 12);

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  for (let x = 0; x < WIDTH; x += 52) {
    ctx.fillRect(x + 12, stageTwo.groundY + 20 + ((x / 52) % 2) * 10, 8, 24);
  }

  ctx.fillStyle = "rgba(25, 70, 184, 0.12)";
  ctx.beginPath();
  ctx.moveTo(520, 320);
  ctx.lineTo(940, 240);
  ctx.lineTo(960, 430);
  ctx.lineTo(620, 430);
  ctx.closePath();
  ctx.fill();

  drawStageTwoBlocks(stageTwo);
  drawStageTwoTargets(stageTwo);
  drawStageTwoFx();
  drawStageTwoSling(stageTwo);
  drawStageTwoProjectile(stageTwo);
  drawStageTwoTrajectory(stageTwo);

  ctx.restore();

  drawStageTwoPowerMeter(stageTwo);
}

function drawPlayer() {
  const player = game.player;
  if (game.bossCutscene?.active) {
    return;
  }
  if (player.invincible > 0 && Math.floor(player.invincible / 5) % 2 === 0) {
    return;
  }

  const bounceDy = getCutsceneBounceDy("player");
  const x = player.x - game.cameraX;
  const y = player.y + bounceDy;
  const facing = player.facing;

  if (player.landingDust > 0) {
    ctx.fillStyle = "rgba(255, 238, 210, 0.8)";
    ctx.beginPath();
    ctx.ellipse(x + player.w / 2, y + player.h + 4, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(x + player.w / 2, y);
  ctx.scale(facing, 1);
  ctx.translate(-player.w / 2, 0);

  if (canDrawImage(art.player)) {
    ctx.save();
    ctx.shadowColor = "rgba(15, 23, 51, 0.2)";
    ctx.shadowBlur = 10;
    ctx.drawImage(art.player, 0, 0, player.w, player.h);
    ctx.restore();
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.arc(player.w / 2, player.h / 2, 18, 0, Math.PI * 2);
    ctx.clip();
    if (!drawCoverImage(art.face, 3, 3, player.w - 6, player.h - 6, -Math.PI / 2, 1.52, 0.07, -0.03)) {
      ctx.fillStyle = "#f4cfaa";
      ctx.fillRect(3, 3, player.w - 6, player.h - 6);
    }
    ctx.restore();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.w / 2, player.h / 2, 18, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(239, 42, 62, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.w / 2, player.h / 2, 20, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHud() {
  if (game.stage === 2 && game.stageTwo) {
    const stageTwoPercent = Math.round(getStageTwoProgress() * 100);
    const startingShots = Math.max(1, game.stageTwo.startingShots || game.stageTwo.shotsLeft || 1);
    ctx.fillStyle = palette.hud;
    roundRect(16, 14, 324, 56, 18);
    ctx.fill();
    ctx.fillStyle = "#fff7e8";
    ctx.font = "bold 18px Avenir Next, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`第二關 彈藥 ${game.stageTwo.shotsLeft}`, 30, 38);
    ctx.fillText(`剩餘目標 ${countStageTwoActiveTargets(game.stageTwo)}`, 30, 60);

    ctx.textAlign = "right";
    ctx.fillText(`分數 ${game.stageTwo.score}`, WIDTH - 24, 38);
    ctx.fillText(`清場 ${stageTwoPercent}%`, WIDTH - 24, 60);

    ctx.fillStyle = "rgba(12, 18, 35, 0.58)";
    roundRect(WIDTH / 2 - 90, 16, 180, 34, 14);
    ctx.fill();
    ctx.fillStyle = "#fff7e8";
    ctx.font = "bold 16px Avenir Next, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("第二關  彈弓清場", WIDTH / 2, 38);

    ctx.fillStyle = "rgba(12, 18, 35, 0.46)";
    roundRect(WIDTH / 2 - 108, 58, 216, 24, 12);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 247, 232, 0.9)";
    ctx.font = "bold 11px Avenir Next, sans-serif";
    ctx.fillText("P 暫停  ·  M 聲音  ·  R 重開", WIDTH / 2, 75);

    const pipX = 30;
    const pipY = 78;
    for (let i = 0; i < startingShots; i += 1) {
      const filled = i < game.stageTwo.shotsLeft;
      ctx.fillStyle = filled ? "#ffd166" : "rgba(255, 247, 232, 0.18)";
      roundRect(pipX + i * 18, pipY, 12, 8, 4);
      ctx.fill();
    }
    return;
  }

  const stageOnePercent = Math.round(getStageOneProgress() * 100);
  const lowTime = game.timeLeft <= 12;
  const lastLife = game.lives <= 1;
  ctx.fillStyle = palette.hud;
  roundRect(16, 14, 294, 56, 18);
  ctx.fill();
  ctx.fillStyle = lastLife ? "#ffd1c0" : "#fff7e8";
  ctx.font = "bold 18px Avenir Next, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(game.totalCoins > 0 ? `200P ${game.coins}/${game.totalCoins}` : "Boss 戰場", 30, 38);
  ctx.fillText(`精神值 ${game.lives}`, 30, 60);

  ctx.textAlign = "right";
  ctx.fillStyle = lowTime ? "#ffd166" : "#fff7e8";
  ctx.fillText(`剩餘時間 ${Math.max(0, Math.ceil(game.timeLeft))}秒`, WIDTH - 24, 38);
  ctx.fillStyle = "#fff7e8";
  ctx.fillText(
    level.goal
      ? level.goal.x - game.player.x > 0
        ? `進度 ${stageOnePercent}%`
        : "交件完成"
      : isStageOneGoalLocked()
        ? "Boss 戰進行中"
        : "Boss 擊破",
    WIDTH - 24,
    60
  );

  ctx.fillStyle = "rgba(12, 18, 35, 0.58)";
  roundRect(WIDTH / 2 - 90, 16, 180, 34, 14);
  ctx.fill();
  ctx.fillStyle = "#fff7e8";
  ctx.font = "bold 16px Avenir Next, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(level.goal ? "第一關  平台衝刺" : "第一關  Boss 戰", WIDTH / 2, 38);

  if (game.comboCount >= 2) {
    const comboRatio = clamp(game.comboTimer / COIN_COMBO.windowFrames, 0, 1);
    const barX = WIDTH / 2 - 80;
    const barY = 60;
    const barW = 160;
    ctx.fillStyle = "rgba(12, 18, 35, 0.6)";
    roundRect(barX - 4, barY - 4, barW + 8, 22, 9);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    roundRect(barX, barY, barW, 14, 7);
    ctx.fill();
    const grad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    grad.addColorStop(0, palette.stripeOrange);
    grad.addColorStop(1, palette.stripeRed);
    ctx.fillStyle = grad;
    roundRect(barX, barY, barW * comboRatio, 14, 7);
    ctx.fill();
    ctx.fillStyle = "#fff7e8";
    ctx.font = "bold 12px Avenir Next, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`COMBO x${Math.ceil(game.comboCount / 2)}  ·  ${game.comboCount} 連`, WIDTH / 2, barY + 11);
  }

  const dashReady = game.player.dashCooldown <= 0 && game.state === "running";
  const helperY = game.comboCount >= 2 ? 84 : 60;
  ctx.fillStyle = dashReady ? "rgba(27, 58, 24, 0.54)" : "rgba(12, 18, 35, 0.46)";
  roundRect(WIDTH / 2 - 112, helperY, 224, 24, 12);
  ctx.fill();
  ctx.fillStyle = dashReady ? "#9bff8a" : "rgba(255, 247, 232, 0.9)";
  ctx.font = "bold 11px Avenir Next, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(dashReady ? "Shift 衝刺準備好" : "P 暫停  ·  M 聲音  ·  R 重開", WIDTH / 2, helperY + 17);

  if (lowTime) {
    ctx.fillStyle = "rgba(88, 57, 8, 0.72)";
    roundRect(WIDTH - 174, 120, 146, 24, 12);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 209, 102, 0.92)";
    ctx.font = "bold 12px Avenir Next, sans-serif";
    ctx.fillText("快沒時間了", WIDTH - 101, 137);
  } else if (lastLife) {
    ctx.fillStyle = "rgba(88, 33, 33, 0.72)";
    roundRect(WIDTH - 180, 120, 152, 24, 12);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 209, 192, 0.94)";
    ctx.font = "bold 12px Avenir Next, sans-serif";
    ctx.fillText("只剩最後一命", WIDTH - 104, 137);
  }
}

function getAudioToggleRect() {
  /** Below top HUD + combo row so right-aligned time/progress is not covered */
  return { x: WIDTH - 146, y: 82, w: 122, h: 34 };
}

function getReplayButtonRect() {
  return { x: WIDTH / 2 - 142, y: 426, w: 284, h: 50 };
}

function drawAudioToggle() {
  const button = getAudioToggleRect();
  ctx.fillStyle = "rgba(12, 18, 35, 0.66)";
  roundRect(button.x, button.y, button.w, button.h, 14);
  ctx.fill();

  ctx.fillStyle = audio.enabled ? "#fff7e8" : "#d6ddf0";
  ctx.font = "bold 16px Avenir Next, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(audio.enabled ? "聲音 開" : "聲音 關", button.x + button.w / 2, button.y + 22);
}

function drawOverlay() {
  if (game.state === "intro") {
    ctx.fillStyle = "rgba(12, 18, 35, 0.42)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const panelX = 146;
    const panelY = 102;
    const panelW = 668;
    const panelH = 274;

    ctx.fillStyle = "rgba(12, 18, 35, 0.22)";
    roundRect(panelX + 8, panelY + 10, panelW, panelH, 32);
    ctx.fill();

    const cardGradient = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
    cardGradient.addColorStop(0, "rgba(255, 252, 245, 0.96)");
    cardGradient.addColorStop(1, "rgba(243, 248, 255, 0.94)");
    ctx.fillStyle = cardGradient;
    roundRect(panelX, panelY, panelW, panelH, 32);
    ctx.fill();

    ctx.fillStyle = palette.stripeBlue;
    roundRect(panelX, panelY, panelW, 18, 18);
    ctx.fill();
    ctx.fillStyle = palette.stripeRed;
    roundRect(panelX + panelW - 186, panelY, 96, 18, 18);
    ctx.fill();
    ctx.fillStyle = palette.stripeOrange;
    roundRect(panelX + panelW - 94, panelY, 94, 18, 18);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.fillStyle = palette.stripeBlue;
    ctx.font = "bold 14px Avenir Next, sans-serif";
    ctx.fillText("準備開始", panelX + panelW / 2, panelY + 58);

    ctx.fillStyle = "#16203d";
    ctx.font = "bold 30px Avenir Next, sans-serif";
    ctx.fillText("200P 兩關挑戰", panelX + panelW / 2, panelY + 104);

    ctx.fillStyle = "#526182";
    ctx.font = "17px Avenir Next, sans-serif";
    ctx.fillText("A/D 移動，Space 跳（二段跳），Shift 衝刺。連吃 200P 會 COMBO 加時。", panelX + panelW / 2, panelY + 146);
    ctx.fillText("先推箱、踩開關、破數量門，再衝進 Boss 區。", panelX + panelW / 2, panelY + 172);
    ctx.fillText("Boss 對話和插播影片期間，倒數會自動暫停。", panelX + panelW / 2, panelY + 198);
    ctx.font = "bold 16px Avenir Next, sans-serif";
    ctx.fillText("P 暫停  ·  M 聲音  ·  R 重開", panelX + panelW / 2, panelY + 224);

    const buttonW = 356;
    const buttonX = panelX + (panelW - buttonW) / 2;
    const buttonY = panelY + 230;
    const buttonH = 44;
    const buttonGradient = ctx.createLinearGradient(buttonX, buttonY, buttonX + buttonW, buttonY + buttonH);
    buttonGradient.addColorStop(0, palette.stripeRed);
    buttonGradient.addColorStop(1, palette.stripeOrange);
    ctx.fillStyle = buttonGradient;
    roundRect(buttonX, buttonY, buttonW, buttonH, 16);
    ctx.fill();

    ctx.fillStyle = "#fff7e8";
    ctx.font = "bold 22px Avenir Next, sans-serif";
    ctx.fillText("點一下或按 Space 開始", buttonX + buttonW / 2, buttonY + 28);
    return;
  }

  if (game.state === "stage2Intro") {
    ctx.fillStyle = "rgba(12, 18, 35, 0.46)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const panelX = 130;
    const panelY = 96;
    const panelW = 700;
    const panelH = 308;

    ctx.fillStyle = "rgba(12, 18, 35, 0.22)";
    roundRect(panelX + 8, panelY + 10, panelW, panelH, 32);
    ctx.fill();

    const cardGradient = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
    cardGradient.addColorStop(0, "rgba(255, 252, 245, 0.96)");
    cardGradient.addColorStop(1, "rgba(243, 248, 255, 0.94)");
    ctx.fillStyle = cardGradient;
    roundRect(panelX, panelY, panelW, panelH, 32);
    ctx.fill();

    ctx.fillStyle = palette.stripeBlue;
    roundRect(panelX, panelY, panelW, 18, 18);
    ctx.fill();
    ctx.fillStyle = palette.stripeRed;
    roundRect(panelX + panelW - 186, panelY, 96, 18, 18);
    ctx.fill();
    ctx.fillStyle = palette.stripeOrange;
    roundRect(panelX + panelW - 94, panelY, 94, 18, 18);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.fillStyle = palette.stripeBlue;
    ctx.font = "bold 14px Avenir Next, sans-serif";
    ctx.fillText("第二關說明", panelX + panelW / 2, panelY + 58);

    ctx.fillStyle = "#16203d";
    ctx.font = "bold 30px Avenir Next, sans-serif";
    ctx.fillText("第二關：彈弓打競品", panelX + panelW / 2, panelY + 102);

    ctx.fillStyle = "#526182";
    ctx.font = "18px Avenir Next, sans-serif";
    const startingShots = game.stageTwo ? game.stageTwo.startingShots : 6;
    const targetCount = game.stageTwo ? game.stageTwo.targets.length : 0;
    ctx.fillText("拖曳 200P 對準競品堡壘，放手後就會發射。", panelX + panelW / 2, panelY + 146);
    ctx.fillText(`這關有 ${startingShots} 發、${targetCount} 個目標；全部清掉就過關。`, panelX + panelW / 2, panelY + 178);
    ctx.fillText("拉越滿越有力，拖曳中會直接顯示拉力百分比。", panelX + panelW / 2, panelY + 210);
    ctx.font = "bold 16px Avenir Next, sans-serif";
    ctx.fillText("P 暫停  ·  M 聲音  ·  R 重開", panelX + panelW / 2, panelY + 242);

    const buttonW = 390;
    const buttonX = panelX + (panelW - buttonW) / 2;
    const buttonY = panelY + 250;
    const buttonH = 44;
    const buttonGradient = ctx.createLinearGradient(buttonX, buttonY, buttonX + buttonW, buttonY + buttonH);
    buttonGradient.addColorStop(0, palette.stripeRed);
    buttonGradient.addColorStop(1, palette.stripeOrange);
    ctx.fillStyle = buttonGradient;
    roundRect(buttonX, buttonY, buttonW, buttonH, 16);
    ctx.fill();

    ctx.fillStyle = "#fff7e8";
    ctx.font = "bold 22px Avenir Next, sans-serif";
    ctx.fillText("點一下進入，拖曳 200P 發射", buttonX + buttonW / 2, buttonY + 28);
    return;
  }

  if (game.state === "ad") {
    const remaining = Math.max(0, Math.ceil((game.adDuration - game.adTimer) / 60));
    const skippable = game.adTimer >= game.adSkippableAt;
    const adCopy = getDeathAdCopy(game.pendingDeathReason, game.pendingDeathBrand);

    ctx.fillStyle = "rgba(9, 14, 28, 0.86)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const bgGlow = ctx.createRadialGradient(720, 110, 40, 720, 110, 320);
    bgGlow.addColorStop(0, "rgba(255, 124, 32, 0.32)");
    bgGlow.addColorStop(1, "rgba(255, 124, 32, 0)");
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.arc(188, 90, 110, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(25, 70, 184, 0.22)";
    ctx.beginPath();
    ctx.moveTo(520, 0);
    ctx.lineTo(960, 0);
    ctx.lineTo(960, 220);
    ctx.lineTo(690, 260);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
    roundRect(56, 48, WIDTH - 112, HEIGHT - 96, 34);
    ctx.fill();

    ctx.fillStyle = palette.stripeBlue;
    roundRect(56, 48, WIDTH - 112, 18, 18);
    ctx.fill();
    ctx.fillStyle = palette.stripeRed;
    roundRect(WIDTH - 282, 48, 114, 18, 18);
    ctx.fill();
    ctx.fillStyle = palette.stripeOrange;
    roundRect(WIDTH - 168, 48, 112, 18, 18);
    ctx.fill();

    ctx.textAlign = "left";
    ctx.fillStyle = palette.stripeBlue;
    ctx.font = "bold 14px Avenir Next, sans-serif";
    ctx.fillText(adCopy.kicker, 92, 94);

    ctx.fillStyle = "#17223e";
    ctx.font = "bold 28px Avenir Next, sans-serif";
    ctx.fillText(adCopy.headline, 92, 138);

    ctx.fillStyle = "#53617f";
    ctx.font = "19px Avenir Next, sans-serif";
    ctx.fillText(adCopy.lines[0], 92, 188);
    ctx.fillText(adCopy.lines[1], 92, 220);
    ctx.fillText(adCopy.lines[2], 92, 252);
    ctx.fillStyle = "#1946b8";
    ctx.font = "bold 20px Avenir Next, sans-serif";
    ctx.fillText("康貝特 200P：回來救場", 92, 288);

    if (canDrawImage(art.product)) {
      ctx.save();
      ctx.shadowColor = "rgba(17, 20, 43, 0.24)";
      ctx.shadowBlur = 18;
      ctx.drawImage(art.product, 684, 102, 124, 282);
      ctx.restore();
    }

    const progressX = 92;
    const progressY = 320;
    const progressW = 340;
    const overallRatio = clamp(game.adTimer / game.adDuration, 0, 1);
    const skipRatio = clamp(game.adTimer / game.adSkippableAt, 0, 1);

    ctx.fillStyle = "rgba(12, 18, 35, 0.12)";
    roundRect(progressX, progressY, progressW, 12, 6);
    ctx.fill();
    const adGradient = ctx.createLinearGradient(progressX, progressY, progressX + progressW, progressY);
    adGradient.addColorStop(0, palette.stripeBlue);
    adGradient.addColorStop(1, palette.stripeOrange);
    ctx.fillStyle = adGradient;
    roundRect(progressX, progressY, progressW * overallRatio, 12, 6);
    ctx.fill();
    ctx.fillStyle = "#526182";
    ctx.font = "bold 13px Avenir Next, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("插播進度", progressX, progressY - 8);

    ctx.fillStyle = "rgba(12, 18, 35, 0.12)";
    roundRect(progressX, progressY + 28, progressW, 10, 5);
    ctx.fill();
    ctx.fillStyle = skippable ? "#9bff8a" : "#ffd166";
    roundRect(progressX, progressY + 28, progressW * Math.min(skipRatio, 1), 10, 5);
    ctx.fill();
    ctx.fillStyle = "#526182";
    ctx.font = "12px Avenir Next, sans-serif";
    ctx.fillText(skippable ? "已可略過" : "略過解鎖中", progressX, progressY + 54);

    const footerX = 92;
    const footerY = HEIGHT - 146;
    const footerW = WIDTH - 184;
    const footerH = 62;
    const footerGradient = ctx.createLinearGradient(footerX, footerY, footerX + footerW, footerY + footerH);
    footerGradient.addColorStop(0, palette.stripeRed);
    footerGradient.addColorStop(1, palette.stripeOrange);
    ctx.fillStyle = footerGradient;
    roundRect(footerX, footerY, footerW, footerH, 22);
    ctx.fill();

    ctx.fillStyle = "#fff7e8";
    ctx.textAlign = "center";
    ctx.font = "bold 26px Avenir Next, sans-serif";
    ctx.fillText("休息一下，馬上回來", WIDTH / 2, footerY + 39);

    ctx.fillStyle = "#6d7694";
    ctx.font = "16px Avenir Next, sans-serif";
    ctx.fillText(
      skippable ? `按 Space 或點一下返回，${remaining} 秒後也會回到遊戲` : `再等 ${remaining} 秒就回到遊戲`,
      WIDTH / 2,
      HEIGHT - 52
    );
    return;
  }

  if (game.state === "paused") {
    ctx.fillStyle = "rgba(12, 18, 35, 0.5)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const panelX = 238;
    const panelY = 156;
    const panelW = 484;
    const panelH = 196;

    ctx.fillStyle = "rgba(255, 252, 245, 0.96)";
    roundRect(panelX, panelY, panelW, panelH, 28);
    ctx.fill();
    ctx.fillStyle = palette.stripeBlue;
    roundRect(panelX, panelY, panelW, 18, 18);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.fillStyle = "#16203d";
    ctx.font = "bold 34px Avenir Next, sans-serif";
    ctx.fillText("已暫停", WIDTH / 2, panelY + 76);

    ctx.fillStyle = "#526182";
    ctx.font = "19px Avenir Next, sans-serif";
    ctx.fillText("按 P、Esc、Space、Enter 或點一下回到遊戲", WIDTH / 2, panelY + 116);
    ctx.font = "bold 16px Avenir Next, sans-serif";
    ctx.fillText("M 聲音  ·  R 重開", WIDTH / 2, panelY + 148);

    const buttonX = panelX + 84;
    const buttonY = panelY + 162;
    const buttonW = panelW - 168;
    const buttonH = 24;
    const buttonGradient = ctx.createLinearGradient(buttonX, buttonY, buttonX + buttonW, buttonY);
    buttonGradient.addColorStop(0, palette.stripeRed);
    buttonGradient.addColorStop(1, palette.stripeOrange);
    ctx.fillStyle = buttonGradient;
    roundRect(buttonX, buttonY, buttonW, buttonH, 12);
    ctx.fill();
    return;
  }

  if (game.overlayTimer <= 0) {
    return;
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(12, 18, 35, 0.28)";
  roundRect(WIDTH / 2 - 150, 22, 300, 46, 18);
  ctx.fill();
  ctx.fillStyle = "#fff6e4";
  ctx.font = "bold 20px Avenir Next, sans-serif";
  ctx.fillText(game.overlayText, WIDTH / 2, 52);

  if (game.state === "won" || game.state === "gameover") {
    if (game.state === "won") {
      drawWinFx();
    }
    drawResultPanel();
  }

  drawSceneTransition();
}

function drawSpeechBubble(x, y, w, h, text, align = "center") {
  ctx.fillStyle = "rgba(255, 252, 245, 0.96)";
  roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w * 0.24, y + h);
  ctx.lineTo(x + w * 0.24 + 10, y + h + 12);
  ctx.lineTo(x + w * 0.24 + 24, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#16203d";
  ctx.font = "bold 16px Avenir Next, sans-serif";
  ctx.textAlign = align;
  const lines = String(text ?? "").split("\n");
  const lineH = 18;
  const top = y + 28 - ((lines.length - 1) * lineH) / 2;
  for (let i = 0; i < lines.length; i += 1) {
    ctx.fillText(lines[i], align === "left" ? x + 18 : x + w / 2, top + i * lineH);
  }
}

function drawEndingPrincessCan(cx, cy, bob = 0, rescueProgress = 0) {
  const canY = cy + bob;
  const glow = ctx.createRadialGradient(cx, canY - 8, 12, cx, canY - 8, 84);
  glow.addColorStop(0, `rgba(255, 216, 102, ${0.34 + rescueProgress * 0.2})`);
  glow.addColorStop(1, "rgba(255, 216, 102, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, canY, 84, 0, Math.PI * 2);
  ctx.fill();

  if (canDrawImage(art.product)) {
    const drawH = 108 + rescueProgress * 8;
    const drawW = (art.product.naturalWidth / art.product.naturalHeight) * drawH;
    ctx.save();
    ctx.shadowColor = "rgba(255, 184, 66, 0.52)";
    ctx.shadowBlur = 18;
    ctx.drawImage(art.product, cx - drawW / 2, canY - drawH / 2, drawW, drawH);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, canY - 64);
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.moveTo(-20, 14);
  ctx.lineTo(-14, -6);
  ctx.lineTo(-5, 8);
  ctx.lineTo(0, -12);
  ctx.lineTo(6, 8);
  ctx.lineTo(15, -6);
  ctx.lineTo(21, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff2b3";
  ctx.fillRect(-18, 10, 36, 7);
  ctx.restore();
}

function drawEndingHero(x, groundY, bounce = 0) {
  const y = groundY - 56 + bounce;
  ctx.fillStyle = "rgba(12, 18, 35, 0.16)";
  ctx.beginPath();
  ctx.ellipse(x + 28, groundY + 6, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (canDrawImage(art.player)) {
    ctx.save();
    ctx.shadowColor = "rgba(15, 23, 51, 0.18)";
    ctx.shadowBlur = 10;
    ctx.drawImage(art.player, x, y, 56, 56);
    ctx.restore();
  } else if (canDrawImage(art.face)) {
    drawCoverImage(art.face, x, y, 56, 56, -Math.PI / 2, 1.52, 0.07, -0.03);
  } else {
    ctx.fillStyle = "#f4cfaa";
    ctx.beginPath();
    ctx.arc(x + 28, y + 28, 24, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEndingRescueScene() {
  const ending = game.endingScene;
  if (!ending) {
    return;
  }

  const entranceFade = easeOutCubic(clamp(ending.timer / 54, 0, 1));

  ctx.save();
  ctx.globalAlpha = entranceFade;

  drawBackground();

  const groundY = ending.groundY;
  const skyWash = ctx.createLinearGradient(0, 0, 0, groundY + 40);
  skyWash.addColorStop(0, "rgba(255, 236, 196, 0.22)");
  skyWash.addColorStop(0.55, "rgba(255, 178, 112, 0.08)");
  skyWash.addColorStop(1, "rgba(180, 210, 255, 0.04)");
  ctx.fillStyle = skyWash;
  ctx.fillRect(0, 0, WIDTH, groundY + 36);

  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, groundY, WIDTH, HEIGHT - groundY);
  ctx.fillStyle = palette.grass;
  ctx.fillRect(0, groundY, WIDTH, 14);
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  for (let ix = 0; ix < WIDTH; ix += 40) {
    ctx.fillRect(ix + 12, groundY + 28 + ((ix / 40) % 2) * 8, 8, 22);
  }

  const walkRatio = clamp(ending.timer / ENDING_RESCUE_WALK_FRAMES, 0, 1);
  const reunionRatio = clamp(
    (ending.timer - ENDING_RESCUE_REUNION_START) / ENDING_RESCUE_REUNION_FRAMES,
    0,
    1
  );
  const playerX = ending.playerStartX + (ending.playerTargetX - ending.playerStartX) * easeOutCubic(walkRatio);
  const canX = ending.canPedestalX + (ending.canTargetX - ending.canPedestalX) * easeOutCubic(reunionRatio);
  const heroBounce = walkRatio < 1 ? Math.sin(ending.timer * 0.22) * 2.6 : 0;
  const canBob = Math.sin(ending.timer * 0.16) * 4 - reunionRatio * 2;

  ctx.fillStyle = "rgba(12, 18, 35, 0.14)";
  roundRect(676, 254, 88, 156, 18);
  ctx.fill();
  ctx.fillStyle = "#20345d";
  roundRect(692, 214, 56, 196, 14);
  ctx.fill();
  ctx.fillStyle = "#f7fbff";
  roundRect(704, 226, 32, 162, 10);
  ctx.fill();
  ctx.fillStyle = "#1946b8";
  ctx.font = "bold 14px Avenir Next, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("200P", 720, 404);

  drawEndingHero(playerX, groundY, heroBounce);
  drawEndingPrincessCan(canX, 282, canBob, reunionRatio);

  if (ending.timer < ENDING_RESCUE_REUNION_START) {
    drawSpeechBubble(558, 114, 296, 58, "靶場清乾淨了！\n200P 在這裡——來收勝利場");
  } else if (ending.timer < ENDING_RESCUE_REUNION_START + ENDING_RESCUE_REUNION_FRAMES) {
    drawSpeechBubble(168, 114, 296, 58, "接住這罐精神值\n喝了再上，站台到底");
  } else {
    drawSpeechBubble(492, 108, 332, 62, "Boss 跟彈弓都過了\n期末這一局，是你救場");
  }

  if (reunionRatio > 0) {
    for (let i = 0; i < 5; i += 1) {
      const hx = 432 + i * 30;
      const hy = 174 - Math.sin(ending.timer * 0.14 + i) * 14 - reunionRatio * 24;
      ctx.fillStyle = `rgba(255, 123, 32, ${0.28 + reunionRatio * 0.48})`;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.bezierCurveTo(hx - 8, hy - 10, hx - 18, hy + 2, hx, hy + 14);
      ctx.bezierCurveTo(hx + 18, hy + 2, hx + 8, hy - 10, hx, hy);
      ctx.fill();
    }
  }

  ctx.fillStyle = "rgba(12, 18, 35, 0.46)";
  roundRect(156, 26, 648, 74, 26);
  ctx.fill();
  const titleStripe = ctx.createLinearGradient(172, 92, WIDTH - 172, 92);
  titleStripe.addColorStop(0, "rgba(255, 214, 92, 0)");
  titleStripe.addColorStop(0.5, "rgba(255, 214, 92, 0.55)");
  titleStripe.addColorStop(1, "rgba(255, 214, 92, 0)");
  ctx.fillStyle = titleStripe;
  ctx.fillRect(172, 88, WIDTH - 344, 5);

  ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
  ctx.font = "600 13px Avenir Next, sans-serif";
  ctx.fillText("BOSS DOWN · SLINGSHOT CLEAR · RESCUE", WIDTH / 2, 54);

  ctx.fillStyle = "#fff7e8";
  ctx.font = "bold 30px Avenir Next, sans-serif";
  ctx.fillText("康貝特 200P 獲救成功", WIDTH / 2, 82);

  if (ending.timer > 210) {
    ctx.fillStyle = "rgba(255, 252, 245, 0.92)";
    roundRect(268, 324, 424, 54, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(25, 70, 184, 0.22)";
    ctx.lineWidth = 1.5;
    roundRect(268, 324, 424, 54, 20);
    ctx.stroke();
    ctx.fillStyle = "#1946b8";
    ctx.font = "bold 19px Avenir Next, sans-serif";
    ctx.fillText("兩關都過了——精神值滿格，收工。", WIDTH / 2, 358);
  }

  ctx.restore();

  ctx.fillStyle = `rgba(255, 247, 232, ${0.55 + entranceFade * 0.38})`;
  ctx.font = "13px Avenir Next, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("按 Space、Enter 或點一下可略過", WIDTH / 2, HEIGHT - 28);
}

function drawResultPanel() {
  const isWin = game.state === "won";
  const panelX = 140;
  const panelY = 88;
  const panelW = WIDTH - panelX * 2;
  const panelH = 408;
  const stageTwoShotsUsed = game.stageTwo
    ? Math.max(0, (game.stageTwo.startingShots || 0) - (game.stageTwo.shotsLeft || 0))
    : 0;
  const stageTwoTargetsLeft = game.stageTwo ? countStageTwoActiveTargets(game.stageTwo) : 0;
  const stageTwoBestImpact = game.stageTwo ? Math.round(game.stageTwo.bestImpact || 0) : 0;

  ctx.save();
  ctx.fillStyle = "rgba(12, 18, 35, 0.78)";
  roundRect(panelX, panelY, panelW, panelH, 28);
  ctx.fill();
  ctx.strokeStyle = isWin ? "rgba(255, 236, 140, 0.45)" : "rgba(255, 209, 192, 0.4)";
  ctx.lineWidth = 2;
  roundRect(panelX, panelY, panelW, panelH, 28);
  ctx.stroke();
  ctx.restore();

  const accentColor = isWin ? "#ffec8c" : "#ffd1c0";
  ctx.textAlign = "center";

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = accentColor;
  ctx.font = "bold 44px Avenir Next, sans-serif";
  const titleText = isWin
    ? game.stage === 2
      ? "兩關全破"
      : level.goal
        ? "交件成功"
        : "Boss 擊破"
    : "精神值見底";
  ctx.fillText(titleText, WIDTH / 2, panelY + 70);
  ctx.restore();

  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.font = "14px Avenir Next, sans-serif";
  const subtitle = isWin
    ? game.stage === 2
      ? "Boss 擊破 · 彈弓清場 · 救援達成"
      : level.goal
        ? "第一關過關"
        : "Boss Battle Clear"
    : "Game Over";
  ctx.fillText(subtitle, WIDTH / 2, panelY + 92);

  if (isWin && game.stageOneRating > 0) {
    drawResultStars(game.stageOneRating, WIDTH / 2, panelY + 134);
  }

  const cardsTop = panelY + 168;
  const cardH = 96;
  const gap = 14;

  if (isWin && game.stage === 2) {
    const cardW = (panelW - 60 - gap) / 2;
    const leftX = panelX + 30;
    const rightX = leftX + cardW + gap;

    drawResultCard(leftX, cardsTop, cardW, cardH, {
      label: "第一關 · Boss 戰",
      color: "#ffd166",
      stats: [
        { value: `${game.coins}`, unit: "罐 200P" },
        { value: `+${formatStatNumber(game.timeBoostEarned)}s`, unit: "延長時間" },
        { value: `${game.comboBest}`, unit: "最高連踩" },
      ],
    });
    drawResultCard(rightX, cardsTop, cardW, cardH, {
      label: "第二關 · 彈弓場",
      color: "#ff7b20",
      stats: [
        { value: `${game.stageTwo ? game.stageTwo.score : 0}`, unit: "分數" },
        { value: `${game.stageTwo ? game.stageTwo.shotsLeft : 0}`, unit: "剩餘彈藥" },
        { value: `${stageTwoBestImpact}`, unit: "最佳衝擊" },
      ],
    });

    ctx.fillStyle = "rgba(255, 246, 228, 0.92)";
    ctx.font = "18px Avenir Next, sans-serif";
    ctx.fillText("全線通關：維他命 B 群 + 胺基酸 + 牛磺酸，精神值一站補滿。", WIDTH / 2, cardsTop + cardH + 38);
  } else if (isWin) {
    const cardW = panelW - 60;
    const leftX = panelX + 30;
    drawResultCard(leftX, cardsTop, cardW, cardH, {
      label: "第一關 STAGE 1",
      color: "#ffd166",
      stats: [
        { value: `${game.coins}`, unit: "罐 200P" },
        { value: `+${formatStatNumber(game.timeBoostEarned)}s`, unit: "延長時間" },
        { value: `${game.stomps}`, unit: "踩怪" },
        { value: `${game.comboBest}`, unit: "最高連踩" },
      ],
    });

    ctx.fillStyle = "rgba(255, 246, 228, 0.92)";
    ctx.font = "18px Avenir Next, sans-serif";
    ctx.fillText("好累喔？200P 一喝，作業直接衝到底。", WIDTH / 2, cardsTop + cardH + 38);
  } else {
    const cardW = panelW - 60;
    const leftX = panelX + 30;
    drawResultCard(leftX, cardsTop, cardW, cardH, {
      label: game.stage === 2 ? "第二關彈藥告急" : "第一關 KO",
      color: "#ef2a3e",
      stats:
        game.stage === 2
          ? [
              { value: `${game.stageTwo ? game.stageTwo.score : 0}`, unit: "分數" },
              { value: `${stageTwoTargetsLeft}`, unit: "剩餘目標" },
              { value: `${stageTwoShotsUsed}`, unit: "已用彈藥" },
            ]
          : [
              { value: `${game.coins}`, unit: "罐 200P" },
              { value: `${game.deaths}`, unit: "次倒下" },
              { value: `${formatStatNumber(game.elapsed)}s`, unit: "撐了" },
            ],
    });
    ctx.fillStyle = "rgba(255, 246, 228, 0.85)";
    ctx.font = "17px Avenir Next, sans-serif";
    ctx.fillText(
      game.stage === 2
        ? `這輪用了 ${stageTwoShotsUsed} 發，還差 ${stageTwoTargetsLeft} 個目標。`
        : "再喝一口，作業還沒結束，只是暫停。",
      WIDTH / 2,
      cardsTop + cardH + 36
    );
  }

  ctx.fillStyle = "rgba(255, 247, 232, 0.6)";
  ctx.font = "bold 10px Avenir Next, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`BUILD ${BUILD_ID}`, 18, HEIGHT - 12);

  const replayButton = getReplayButtonRect();
  const replayGradient = ctx.createLinearGradient(
    replayButton.x,
    replayButton.y,
    replayButton.x + replayButton.w,
    replayButton.y + replayButton.h
  );
  replayGradient.addColorStop(0, palette.stripeRed);
  replayGradient.addColorStop(1, palette.stripeOrange);
  ctx.save();
  ctx.shadowColor = "rgba(239, 42, 62, 0.55)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = replayGradient;
  roundRect(replayButton.x, replayButton.y, replayButton.w, replayButton.h, 18);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#fff7e8";
  ctx.font = "bold 22px Avenir Next, sans-serif";
  ctx.fillText("點一下再玩一次", WIDTH / 2, replayButton.y + replayButton.h / 2 + 8);
  ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
  ctx.font = "13px Avenir Next, sans-serif";
  ctx.fillText("也可以按 Space、Enter 或 R 直接重跑", WIDTH / 2, replayButton.y + replayButton.h + 24);
}

function drawResultStars(filled, cx, cy) {
  const total = 3;
  const spacing = 56;
  const startX = cx - ((total - 1) * spacing) / 2;
  for (let i = 0; i < total; i += 1) {
    const x = startX + i * spacing;
    const lit = i < filled;
    ctx.save();
    if (lit) {
      ctx.shadowColor = "rgba(255, 209, 102, 0.85)";
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = lit ? "#ffd166" : "rgba(255,255,255,0.16)";
    ctx.beginPath();
    for (let p = 0; p < 10; p += 1) {
      const ang = -Math.PI / 2 + (p * Math.PI) / 5;
      const r = p % 2 === 0 ? 20 : 9;
      const px = x + Math.cos(ang) * r;
      const py = cy + Math.sin(ang) * r;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (lit) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(x - 5, cy - 5, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawResultCard(x, y, w, h, info) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  roundRect(x, y, w, h, 14);
  ctx.stroke();

  ctx.fillStyle = info.color;
  roundRect(x, y, 4, h, 2);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.fillStyle = info.color;
  ctx.font = "bold 13px Avenir Next, sans-serif";
  ctx.fillText(info.label, x + 16, y + 24);

  const stats = info.stats || [];
  const colW = (w - 24) / Math.max(1, stats.length);
  stats.forEach((stat, idx) => {
    const cellX = x + 16 + idx * colW;
    const cellCenter = cellX + colW / 2 - 16;
    ctx.fillStyle = "#fff7e8";
    ctx.font = "bold 28px Avenir Next, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(stat.value, cellCenter, y + 60);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "13px Avenir Next, sans-serif";
    ctx.fillText(stat.unit, cellCenter, y + 82);
  });
  ctx.restore();
  ctx.textAlign = "center";
}

function _legacyDrawResultPanel_unused() {
  return;
  // legacy below intentionally unreachable; preserved literal to avoid string-encoding edge cases.
  // eslint-disable-next-line
  if (false) {
    ctx.fillStyle = "rgba(12, 18, 35, 0.52)";
    roundRect(228, 154, 504, 220, 24);
    ctx.fill();
    ctx.fillStyle = game.state === "won" ? "#ffec8c" : "#ffd1c0";
    ctx.font = "bold 34px Avenir Next, sans-serif";
    ctx.fillText(
      game.state === "won"
        ? game.stage === 2
          ? "兩關全破"
          : level.goal
            ? "交件成功"
            : "Boss 擊破"
        : "精神值見底",
      WIDTH / 2,
      218
    );

    if (game.state === "won" && game.stageOneRating > 0) {
      const stars = game.stageOneRating;
      const startX = WIDTH / 2 - 60;
      const starY = 244;
      for (let i = 0; i < 3; i += 1) {
        ctx.fillStyle = i < stars ? "#ffd166" : "rgba(255,255,255,0.18)";
        const cx = startX + i * 60;
        ctx.beginPath();
        for (let p = 0; p < 5; p += 1) {
          const ang = -Math.PI / 2 + (p * Math.PI * 2) / 5;
          const innerAng = ang + Math.PI / 5;
          ctx.lineTo(cx + Math.cos(ang) * 18, starY + Math.sin(ang) * 18);
          ctx.lineTo(cx + Math.cos(innerAng) * 8, starY + Math.sin(innerAng) * 8);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.fillStyle = "#fff6e4";
    ctx.font = "21px Avenir Next, sans-serif";
    if (game.state === "won" && game.stage === 2) {
      ctx.fillText(
        `第一關補了 ${game.coins} 罐，多撐 ${formatStatNumber(game.timeBoostEarned)} 秒。`,
        WIDTH / 2,
        252
      );
      ctx.fillText(`第二關砸出 ${game.stageTwo ? game.stageTwo.score : 0} 分，競品全部清場。`, WIDTH / 2, 286);
      ctx.fillText("記住它：7 種維他命 + 胺基酸 + 牛磺酸。", WIDTH / 2, 312);
    } else {
      ctx.fillText(
        game.state === "won"
          ? `你補了 ${game.coins} 罐 200P，報告和交件一起搞定。`
          : game.stage === 2
            ? "第二關彈藥打完了，再按 R 或 Restart 重跑一次。"
            : "再喝一口，再按 R 或 Restart 重跑一次。",
        WIDTH / 2,
        260
      );
      ctx.fillText(
        game.state === "won"
          ? "廣告詞候選：好累喔？200P 一喝，作業直接衝到底。"
          : game.stage === 2
            ? "這局砸歪了，但競品看起來還是很欠揍。"
            : "作業還沒結束，這局只是暫停。",
        WIDTH / 2,
        296
      );
    }

    const replayButton = getReplayButtonRect();
    const replayGradient = ctx.createLinearGradient(
      replayButton.x,
      replayButton.y,
      replayButton.x + replayButton.w,
      replayButton.y + replayButton.h
    );
    replayGradient.addColorStop(0, palette.stripeRed);
    replayGradient.addColorStop(1, palette.stripeOrange);
    ctx.fillStyle = replayGradient;
    roundRect(replayButton.x, replayButton.y, replayButton.w, replayButton.h, 16);
    ctx.fill();

    ctx.fillStyle = "#fff7e8";
    ctx.font = "bold 24px Avenir Next, sans-serif";
    ctx.fillText("點一下再玩一次", WIDTH / 2, replayButton.y + 30);
  }
}

function render() {
  if (game.state === "ending") {
    drawEndingRescueScene();
    drawAudioToggle();
    return;
  }

  if (game.stage === 2) {
    drawStageTwoScene();

    if (game.state === "stage2Playing") {
      drawHud();
    }

    drawOverlay();

    if (game.flashTimer > 0 && game.state !== "ad") {
      ctx.fillStyle = `rgba(255, 255, 255, ${clamp(0.08 * game.flashTimer, 0, 0.92)})`;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    drawAudioToggle();
    return;
  }

  drawBackground();

  ctx.save();
  const zoom = STAGE_ONE_FX.cameraZoom;
  const cx = WIDTH / 2 + STAGE_ONE_FX.cameraShakeX;
  const cy = HEIGHT / 2 + STAGE_ONE_FX.cameraShakeY;
  ctx.translate(cx, cy);
  ctx.scale(zoom, zoom);
  ctx.translate(-WIDTH / 2, -HEIGHT / 2);

  drawPlatforms();

  if (game.state !== "intro") {
    drawDecorations();
    drawCrates();
    drawBonusCoins();
    drawCoins();
    drawEnemies();
    drawBossHazards();
    drawCheckpoints();
    drawGoal();
    drawPlayer();
    drawStageOneFx();
  }

  ctx.restore();

  drawHud();
  drawGoalArrow();
  if (game.state !== "intro" && game.bossCutscene?.active) {
    drawBossIntroCutscene();
  }

  drawOverlay();

  if (game.flashTimer > 0 && game.state !== "ad") {
    ctx.fillStyle = `rgba(255, 255, 255, ${clamp(0.08 * game.flashTimer, 0, 0.92)})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  drawAudioToggle();
}

let lastTime = 0;
function loop(timestamp) {
  if (!lastTime) {
    lastTime = timestamp;
  }
  const delta = Math.min(34, timestamp - lastTime);
  lastTime = timestamp;
  const frameScale = delta / (1000 / 60);

  step(frameScale);
  updateBackgroundMusic();
  render();
  syncMobileControlsVisibility();
  syncPortraitBlockerA11y();

  input.jumpPressed = false;
  input.dashPressed = false;
  input.touchDashPressed = false;
  requestAnimationFrame(loop);
}

function setJumpKey(active) {
  if (active && !input.jump) {
    input.jumpPressed = true;
  }
  input.jump = active;
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
  };
}

function updateStageTwoDrag(point) {
  if (!game.stageTwo) {
    return;
  }

  const { sling, projectile, physics } = game.stageTwo;
  const dx = point.x - sling.x;
  const dy = point.y - sling.y;
  const distance = Math.hypot(dx, dy) || 1;
  const limited = Math.min(distance, sling.maxPull);
  projectile.x = sling.x + (dx / distance) * limited;
  projectile.y = sling.y + (dy / distance) * limited;
  projectile.rotation = clamp(-dx * 0.01, -0.6, 0.6);

  if (physics && physics.projectileBody) {
    physics.holdProjectile(projectile.x, projectile.y, projectile.rotation);
  }
}

function beginStageTwoDrag(point) {
  if (
    game.stage !== 2 ||
    !game.stageTwo ||
    (game.state !== "stage2Intro" && game.state !== "stage2Playing")
  ) {
    return false;
  }

  const projectile = game.stageTwo.projectile;
  const physics = game.stageTwo.physics;
  const distance = Math.hypot(point.x - projectile.x, point.y - projectile.y);
  if (projectile.state !== "ready") {
    return false;
  }

  const grabRadius = 48;

  if (game.state === "stage2Intro" && distance > grabRadius) {
    enterStageTwoPlaying();
    return true;
  }

  if (distance > grabRadius) {
    return false;
  }

  if (game.state === "stage2Intro") {
    enterStageTwoPlaying();
  }

  game.stageTwo.dragging = true;
  projectile.state = "dragging";

  if (physics) {
    physics.cancelSling();
  }

  updateStageTwoDrag(point);
  return true;
}

function releaseStageTwoDrag() {
  if (!game.stageTwo || !game.stageTwo.dragging) {
    return;
  }

  const { projectile, physics, sling } = game.stageTwo;
  const dx = sling.x - projectile.x;
  const dy = sling.y - projectile.y;
  const pullDist = Math.hypot(dx, dy);
  game.stageTwo.dragging = false;

  if (pullDist < 8) {
    projectile.state = "ready";
    if (physics) {
      physics.holdProjectile(sling.x, sling.y, 0);
      physics.releaseProjectileFromHold();
      physics.resetProjectile();
    }
    return;
  }

  if (physics) {
    physics.releaseSling();
  } else {
    projectile.state = "flying";
    projectile.vx = dx * STAGE_TWO_PROJECTILE.velocityScale;
    projectile.vy = dy * STAGE_TWO_PROJECTILE.velocityScale;
  }
  game.stageTwo.shotsLeft -= 1;
  triggerStageTwoShake(2.4);
  soundFx.jump();
}

function skipToNextStage() {
  if (game.stage === 1) {
    if (!level.goal) {
      game.stageOneRating = computeStageOneRating();
      startEndingRescueScene();
      game.overlayText = "測試跳關：直接結束 Boss 戰";
      soundFx.win();
      updateHud();
      return;
    }
    enterStageTwo();
    game.overlayText = "測試跳關：直接進第二關";
    soundFx.win();
    updateHud();
    return;
  }

  if (game.stage === 2) {
    if (!game.stageTwo) {
      game.stageTwo = createStageTwo();
    }
    game.stageTwo.score = Math.max(game.stageTwo.score, 480);
    startEndingRescueScene();
  }
}

window.addEventListener("keydown", (event) => {
  unlockAudio();

  if (game.bossCutscene?.active && event.code === HIDDEN_BOSS_SKIP_KEY) {
    event.preventDefault();
    finishBossIntroCutscene();
    return;
  }

  if (
    game.bossCutscene?.active &&
    game.bossCutscene.phase === BOSS_INTRO_VIDEO_PHASE &&
    (event.code === "Space" || event.code === "Enter")
  ) {
    event.preventDefault();
    handleBossInsertVideoPointerDown();
    return;
  }

  if (game.state === "paused") {
    if (
      event.code === "KeyP" ||
      event.code === "Escape" ||
      event.code === "Space" ||
      event.code === "Enter"
    ) {
      event.preventDefault();
      togglePause();
      return;
    }
    if (event.code === "KeyM") {
      toggleAudioEnabled();
      return;
    }
    if (event.code === "KeyR") {
      resetRun();
      return;
    }
    return;
  }

  if (
    game.state === "ending" &&
    (event.code === "Space" || event.code === "Enter" || event.code === "KeyN")
  ) {
    event.preventDefault();
    finishEndingRescueScene();
    return;
  }

  if (
    (game.state === "won" || game.state === "gameover") &&
    (event.code === "Space" || event.code === "Enter")
  ) {
    event.preventDefault();
    resetRun();
    return;
  }

  if (game.state === "intro" && event.code === "Enter") {
    event.preventDefault();
    startStageOneRun();
    return;
  }

  if (game.state === "stage2Intro" && event.code === "Enter") {
    event.preventDefault();
    enterStageTwoPlaying();
    return;
  }

  if (game.state === "ad" && canSkipDeathAd() && event.code === "Enter") {
    event.preventDefault();
    finishDeathAd();
    return;
  }

  switch (event.code) {
    case "Escape":
    case "KeyP":
      if (togglePause()) {
        event.preventDefault();
      }
      break;
    case "ArrowLeft":
    case "KeyA":
      input.left = true;
      break;
    case "ArrowRight":
    case "KeyD":
      input.right = true;
      break;
    case "ArrowUp":
    case "KeyW":
    case "Space":
      event.preventDefault();
      setJumpKey(true);
      break;
    case "ShiftLeft":
    case "ShiftRight":
    case "KeyJ":
      if (!input.dash) {
        input.dashPressed = true;
      }
      input.dash = true;
      break;
    case "KeyR":
      resetRun();
      break;
    case "KeyN":
      skipToNextStage();
      break;
    case "KeyM":
      toggleAudioEnabled();
      break;
    default:
      break;
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "ArrowLeft":
    case "KeyA":
      input.left = false;
      break;
    case "ArrowRight":
    case "KeyD":
      input.right = false;
      break;
    case "ArrowUp":
    case "KeyW":
    case "Space":
      setJumpKey(false);
      break;
    case "ShiftLeft":
    case "ShiftRight":
    case "KeyJ":
      input.dash = false;
      break;
    default:
      break;
  }
});

restartButton.addEventListener("click", () => {
  unlockAudio();
  resetRun();
});

if (skipButton) {
  skipButton.addEventListener("click", () => {
    unlockAudio();
    skipToNextStage();
  });
}

if (killBossButton) {
  killBossButton.addEventListener("click", () => {
    unlockAudio();
    killBossInstant();
  });
}

if (cutsceneVideo) {
  cutsceneVideo.addEventListener("loadedmetadata", () => {
    layoutCutsceneVideo();
  });
  cutsceneVideo.addEventListener("ended", () => {
    if (game.finalVictoryVideo?.active) {
      finishFinalVictoryVideo();
      return;
    }
    finishBossInsertVideo();
  });
  cutsceneVideo.addEventListener("error", () => {
    if (game.finalVictoryVideo?.active) {
      finishFinalVictoryVideo();
      return;
    }
    finishBossInsertVideo();
  });
}

if (cutsceneVideoOverlay) {
  cutsceneVideoOverlay.addEventListener("pointerdown", (event) => {
    if (game.finalVictoryVideo?.active) {
      finishFinalVictoryVideo();
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (handleBossInsertVideoPointerDown()) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement ||
    null
  );
}

function gameShellIsFullscreen() {
  return !!gameShellEl && getFullscreenElement() === gameShellEl;
}

function gameFullscreenApiSupported() {
  if (!gameShellEl) return false;
  return !!(
    gameShellEl.requestFullscreen ||
    gameShellEl.webkitRequestFullscreen ||
    gameShellEl.msRequestFullscreen
  );
}

function syncFullscreenButtonUI() {
  if (!fullscreenButton || !gameShellEl) return;
  const supported = gameFullscreenApiSupported();
  fullscreenButton.toggleAttribute("hidden", !supported);
  if (!supported) return;
  const active = gameShellIsFullscreen();
  fullscreenButton.textContent = active ? "退出全螢幕" : "全螢幕";
  fullscreenButton.setAttribute("aria-pressed", active ? "true" : "false");
  fullscreenButton.setAttribute("aria-label", active ? "退出全螢幕" : "進入全螢幕");
}

async function toggleGameFullscreen() {
  if (!gameShellEl || !gameFullscreenApiSupported()) return;
  unlockAudio();
  try {
    if (gameShellIsFullscreen()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    } else if (gameShellEl.requestFullscreen) {
      await gameShellEl.requestFullscreen();
    } else if (gameShellEl.webkitRequestFullscreen) {
      gameShellEl.webkitRequestFullscreen();
    } else if (gameShellEl.msRequestFullscreen) {
      gameShellEl.msRequestFullscreen();
    }
  } catch (_) {}
  requestAnimationFrame(() => {
    configureCanvas();
    layoutCutsceneVideo();
    syncFullscreenButtonUI();
    tryLockLandscape();
  });
}

function onFullscreenChanged() {
  configureCanvas();
  layoutCutsceneVideo();
  syncFullscreenButtonUI();
  syncMobileControlsVisibility();
  syncPortraitBlockerA11y();
  tryLockLandscape();
}

document.addEventListener("fullscreenchange", onFullscreenChanged);
document.addEventListener("webkitfullscreenchange", onFullscreenChanged);
document.addEventListener("MSFullscreenChange", onFullscreenChanged);

if (fullscreenButton) {
  fullscreenButton.addEventListener("click", () => {
    toggleGameFullscreen();
  });
}

configureCanvas();
syncFullscreenButtonUI();
syncPortraitBlockerA11y();
window.addEventListener("orientationchange", () => {
  syncPortraitBlockerA11y();
  tryLockLandscape();
});
window.addEventListener("resize", () => {
  configureCanvas();
  layoutCutsceneVideo();
  syncMobileControlsVisibility();
  syncPortraitBlockerA11y();
});
try {
  window.matchMedia("(max-width: 820px)").addEventListener("change", syncMobileControlsVisibility);
} catch (_) {}
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", syncPortraitBlockerA11y);
  window.visualViewport.addEventListener("scroll", syncPortraitBlockerA11y);
}
canvas.addEventListener("pointerdown", (event) => {
  unlockAudio();
  const point = getCanvasPoint(event);

  if (pointInRect(point, getAudioToggleRect())) {
    toggleAudioEnabled();
    event.preventDefault();
    return;
  }

  if (game.state === "paused") {
    togglePause();
    event.preventDefault();
    return;
  }

  if (game.state === "ending") {
    finishEndingRescueScene();
    event.preventDefault();
    return;
  }

  if (game.state === "won" || game.state === "gameover") {
    resetRun();
    event.preventDefault();
    return;
  }

  if (canSkipDeathAd()) {
    finishDeathAd();
    event.preventDefault();
    return;
  }

  if (game.state === "intro") {
    startStageOneRun();
    event.preventDefault();
    return;
  }

  if (beginStageTwoDrag(point)) {
    if (canvas.setPointerCapture) {
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch (_) {}
    }
    event.preventDefault();
  }
});
canvas.addEventListener("pointermove", (event) => {
  if (!game.stageTwo || !game.stageTwo.dragging) {
    return;
  }
  updateStageTwoDrag(getCanvasPoint(event));
  event.preventDefault();
});
window.addEventListener("pointerup", (event) => {
  releaseStageTwoDrag();
  if (canvas.releasePointerCapture) {
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch (_) {}
  }
});
window.addEventListener("pointercancel", (event) => {
  releaseStageTwoDrag();
  if (canvas.releasePointerCapture) {
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch (_) {}
  }
});
window.addEventListener("pointerdown", unlockAudio);

function bindTouchHold(button, onPress, onRelease) {
  if (!button) return;
  let armed = false;
  const press = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    armed = true;
    unlockAudio();
    onPress();
    button.classList.add("touch-pad--pressed");
    try {
      button.setPointerCapture(e.pointerId);
    } catch (_) {}
  };
  const release = () => {
    if (!armed) return;
    armed = false;
    onRelease();
    button.classList.remove("touch-pad--pressed");
  };
  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}

function setupMobileTouchControls() {
  if (!touchControlsEl) return;
  touchControlsEl.querySelectorAll("[data-touch]").forEach((btn) => {
    const kind = btn.dataset.touch;
    if (kind === "left") {
      bindTouchHold(
        btn,
        () => {
          input.touchLeft = true;
        },
        () => {
          input.touchLeft = false;
        }
      );
    } else if (kind === "right") {
      bindTouchHold(
        btn,
        () => {
          input.touchRight = true;
        },
        () => {
          input.touchRight = false;
        }
      );
    } else if (kind === "jump") {
      bindTouchHold(
        btn,
        () => {
          setJumpKey(true);
        },
        () => {
          setJumpKey(false);
        }
      );
    } else if (kind === "dash") {
      bindTouchHold(
        btn,
        () => {
          if (!input.dash && !input.touchDash) {
            input.touchDashPressed = true;
          }
          input.touchDash = true;
        },
        () => {
          input.touchDash = false;
        }
      );
    }
  });
}

setupMobileTouchControls();
updateHud();
requestAnimationFrame(loop);
