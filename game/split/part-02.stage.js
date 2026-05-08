// Stage 1 runtime, boss battle/cutscene logic, and shared world rendering.
function resetStageOneWorldEntities() {
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
}

function resetRun() {
  stopSubtitleNarration();
  resetStageOneWorldEntities();
  resetStageOneFx();
  resetStageTwoFx();
  game.player = createPlayer(level.spawn);
  game.stage = 1;
  game.state = "intro";
  game.prologueTimer = 0;
  game.prologueStageCardTimer = 0;
  game.coins = 0;
  game.lives = PLAYER_START_LIVES;
  game.elapsed = 0;
  game.timeLeft = STAGE_ONE_TIME_LIMIT;
  game.cameraX = 0;
  game.checkpoint = { x: level.spawn.x, y: level.spawn.y };
  game.checkpointLabel = "起點";
  game.overlayTimer = 0;
  game.overlayText = "點一下進入提神宇宙";
  game.flashTimer = 0;
  game.timeBoostEarned = 0;
  game.adTimer = 0;
  game.adImpression = 0;
  game.pendingAdOutcome = null;
  game.pendingDeathReason = null;
  game.pendingDeathBrand = null;
  game.deathScene = null;
  game.stageTwo = null;
  game.stageTwoOutro = null;
  game.comboCount = 0;
  game.comboTimer = 0;
  game.comboBest = 0;
  game.stomps = 0;
  game.deaths = 0;
  game.startedAt = 0;
  game.stageOneRating = 0;
  game.sceneTransition = null;
  game.prologueCueState = null;
  game.finalVictoryVideo = null;
  resetCutsceneVideoUi();
  game.bossCutscene = null;
  game.bossArrivalScene = null;
  game.pausedFromState = null;
  game.bossWarningShown = false;
  game.bossShockwaveHintShown = false;
  game.endingScene = null;
  // Ensure mobile touch controls are hidden on the intro screen.
  syncMobileControlsVisibility();

  if (SLINGSHOT_FIRST_ORDER) {
    enterStageTwo();
    game.overlayTimer = 0;
  }
}

function respawnPlayer() {
  game.player = createPlayer(game.checkpoint);
  game.player.invincible = 120;
  game.deathScene = null;
  game.cameraX = clamp(game.checkpoint.x - WIDTH * 0.28, 0, level.worldWidth - WIDTH);
  game.bossWarningShown = false;
  game.overlayTimer = 110;
  game.overlayText = `${game.checkpointLabel} 續杯成功`;
  soundFx.respawn();
}

function getDeathAdCopy(reason, brand) {
  if (reason === "hit" && brand === "redbull") {
    return {
      kicker: "雙霸主碰撞實測",
      headline: "有翅膀沒錯，但你先摔下去了",
      lines: [
        "極限狂牛掌控天空與速度，但不會幫你奪回貨架。",
        "資本很大，撞到你的精神值也是真的歸零。",
        "回到康貝特200p，小廠逆襲還沒結束。",
      ],
      gameOverText: "被極限狂牛撞到斷電",
    };
  }

  if (reason === "hit" && brand === "monster") {
    return {
      kicker: "雙霸主碰撞實測",
      headline: "魔爪很兇，你的進度先被抓走",
      lines: [
        "深淵魔爪的能量網罩住夜晚，也罩住你的路線。",
        "潮流很兇，但上架權還是要靠你砸回來。",
        "回來補 200p，繼續攻頂能量巨塔。",
      ],
      gameOverText: "被深淵魔爪抓到當機",
    };
  }

  if (reason === "time") {
    return {
      kicker: "壟斷倒數歸零",
      headline: "市場壟斷令先把你送回起點",
      lines: [
        "時間比疲勞還狠，通路封鎖不會等小廠喘氣。",
        "外商資本再亮，民眾疲憊仍然需要高CP值解法。",
        "下次早點補 200p，別讓市場視野先被封死。",
      ],
      gameOverText: "壟斷倒數歸零",
    };
  }

  if (reason === "fall") {
    return {
      kicker: "腳步失誤",
      headline: "廠長還沒救到配方，先從巨塔滑下去了",
      lines: [
        "手滑可以理解，精神值一起下去就有點痛。",
        "再強的配方，也接不住這個失足瞬間。",
        "喝口 200p，重整一下再衝一次。",
      ],
      gameOverText: "失足掉下去了",
    };
  }

  return {
    kicker: "精神值歸零",
    headline: "先看一下廣告，再把狀態拉回來",
    lines: [
      "剛剛那口沒救到你，這次換 200p 上場。",
      "7 種維他命 + 胺基酸 + 牛磺酸。",
      "咖啡因 1.5 倍、容量 1.25 倍，活力氣泡清爽順口。",
    ],
    gameOverText: "逆襲暫停",
  };
}

function getEnemyStompText(brand) {
  if (brand === "redbull") {
    return "紅牛先扁掉";
  }
  if (brand === "monster") {
    return "魔爪被踩熄火";
  }
  return "雙霸主封鎖被踩掉";
}

function finishDeathAd() {
  const outcome = game.pendingAdOutcome;
  const reason = game.pendingDeathReason;
  const brand = game.pendingDeathBrand;
  const copy = getDeathAdCopy(reason, brand);

  game.pendingAdOutcome = null;
  game.pendingDeathReason = null;
  game.pendingDeathBrand = null;
  game.deathScene = null;
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

function updateDeathScene(frameScale) {
  const death = game.deathScene;
  if (!death) {
    game.state = "ad";
    game.adTimer = 0;
    return;
  }

  death.timer += frameScale;
  const holdFrames = death.holdFrames ?? PLAYER_DEATH_HOLD_FRAMES;

  if (death.timer <= holdFrames) {
    game.player.vx = 0;
    game.player.vy = 0;
  } else {
    if (!death.launched) {
      death.launched = true;
      game.player.vx = 0;
      game.player.vy = death.launchVy ?? PLAYER_DEATH_LAUNCH_VY;
      for (let i = 0; i < 12; i += 1) {
        spawnStageOneParticle({
          x: game.player.x + game.player.w / 2,
          y: game.player.y + game.player.h / 2,
          vx: (Math.random() - 0.5) * 3.2,
          vy: -1.6 - Math.random() * 2.6,
          gravity: 0.16,
          drag: 0.95,
          life: 14 + Math.random() * 8,
          maxLife: 22,
          size: 2.1 + Math.random() * 1.8,
          color: i % 3 === 0 ? "#fff3d6" : i % 2 === 0 ? "#ffd166" : "#ff7b20",
        });
      }
    }
    game.player.vy += (death.gravity ?? PLAYER_DEATH_GRAVITY) * frameScale;
    game.player.y += game.player.vy * frameScale;
  }

  game.player.prevX = game.player.x;
  game.player.prevY = game.player.y;
  game.player.onGround = false;
  game.player.jumpBuffer = 0;
  game.player.coyote = 0;
  game.player.jumpsRemaining = 0;
  game.player.landingDust = 0;
  game.player.runDustTimer = 0;
  STAGE_ONE_FX.cameraZoomTarget = 1;

  const targetCamera = clamp(game.player.x - WIDTH * 0.36, 0, level.worldWidth - WIDTH);
  game.cameraX += (targetCamera - game.cameraX) * 0.14 * frameScale;
  game.cameraX = clamp(game.cameraX, 0, level.worldWidth - WIDTH);

  updateStageOneFx(frameScale);

  if (
    death.timer >= (death.totalFrames ?? PLAYER_DEATH_TOTAL_FRAMES) ||
    game.player.y > HEIGHT + game.player.h + 48
  ) {
    game.state = "ad";
    game.adTimer = 0;
    game.deathScene = null;
  }
}

function loseLife(reason, brand = null) {
  if (game.state === "won" || game.state === "gameover" || game.state === "ad" || game.state === "dying") {
    return;
  }
  clearInputState();
  game.lives -= 1;
  game.deaths = (game.deaths || 0) + 1;
  game.comboCount = 0;
  game.comboTimer = 0;
  game.flashTimer = 18;
  game.state = "dying";
  game.adImpression += 1;
  game.pendingAdOutcome = game.lives <= 0 || reason === "time" ? "gameover" : "respawn";
  game.pendingDeathReason = reason;
  game.pendingDeathBrand = brand;
  game.player.x = clamp(game.player.x, game.cameraX + 34, game.cameraX + WIDTH - game.player.w - 34);
  game.player.y = clamp(game.player.y, 84, HEIGHT - game.player.h - 32);
  game.player.prevX = game.player.x;
  game.player.prevY = game.player.y;
  game.player.vx = 0;
  game.player.vy = 0;
  game.player.facing = 1;
  game.player.onGround = false;
  game.deathScene = {
    timer: 0,
    holdFrames: PLAYER_DEATH_HOLD_FRAMES,
    totalFrames: PLAYER_DEATH_TOTAL_FRAMES,
    launchVy: PLAYER_DEATH_LAUNCH_VY,
    gravity: PLAYER_DEATH_GRAVITY,
    launched: false,
  };
  triggerStageOneShake(8);
  soundFx.lose();
}

function updateHud() {
  if (game.stage === 2 && game.stageTwo) {
    const clearedPercent = Math.round(getStageTwoProgress() * 100);
    const pullPercent = Math.round(getStageTwoPullRatio() * 100);
    const targetsLeft = countStageTwoActiveTargets(game.stageTwo);
    const s1 = hudSlingStageName();
    statusPill.textContent =
      game.state === "paused"
        ? `${s1}已暫停`
        : game.state === "won"
        ? "200p重見天日"
        : game.state === "gameover"
          ? `${s1}失手`
          : game.state === "stage2Intro"
            ? "擊碎通路高牆"
            : game.stageTwo.dragging
              ? `${s1} 拉力 ${pullPercent}%`
              : game.stageTwo.shotsLeft === 1
                ? `${s1} 最後一發上架砲彈`
            : `通路破壞 ${clearedPercent}%`;
    coinsPill.textContent = `彈藥 ${game.stageTwo.shotsLeft}`;
    livesPill.textContent = `目標 ${targetsLeft}`;
    timerPill.textContent = `分數 ${game.stageTwo.score}`;

    // Stage 2 completion is handled in step() fail-safe for reliability.
    return;
  }

  const stageOnePercent = Math.round(getStageOneProgress() * 100);
  const bn = hudBossStageName();
  statusPill.textContent =
    game.state === "paused"
      ? `${bn}已暫停`
      : game.state === "won"
      ? "200p重見天日"
      : game.state === "gameover"
        ? "逆襲失敗"
        : game.state === "dying"
          ? "康貝特斷電中"
        : game.state === "ad"
          ? "休息一下，馬上回來"
        : game.state === "intro"
          ? SLINGSHOT_FIRST_ORDER
            ? "點一下進入提神宇宙"
            : "點一下開始攻頂"
          : isNearBossArena()
            ? "前方能量巨塔，踩穩再進"
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
    spawnStageOnePopup("衝刺！", player.x + player.w / 2, player.y - 6, "#ffd166");
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
        spawnStageOnePopup("彈起！", platform.x + platform.w / 2, platform.y - 12, "#ffd166");
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
          spawnStageOnePopup("閘門鎖定！", platform.x + platform.w / 2, platform.y - 10, "#9bff8a");
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
    game.overlayText = "壟斷衝擊波來了，記得跳過去";
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
    ? boss.secondFormBrand || boss.transformToBrand || "monster"
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
  spawnStageOnePopup("封鎖兵增援！", boss.x + boss.w / 2, boss.y - 28, "#9bff8a");
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

function getBossStyleProfile(enemy) {
  const brand =
    enemy?.phase === "transform"
      ? enemy.transformToBrand || enemy.secondFormBrand || enemy.brand
      : enemy?.brand;
  if (brand === "monster") {
    return {
      name: "monster",
      patrolSpeedMultiplier: 0.94,
      closeRange: 210,
      engagedSummonChance: 0.16,
      engagedShootChance: 0.46,
      engagedChargeChance: 0.16,
      closeChargeChance: 0.2,
      jumpPressureChance: 0.18,
      chargeWindupBase: 18,
      chargeWindupEnraged: 16,
      chargeWindupBerserk: 14,
      chargeDurationBase: 50,
      chargeDurationEnraged: 58,
      chargeDurationBerserk: 64,
      chargeSpeedMultiplier: 0.92,
      shootWindupBase: 24,
      shootWindupEnraged: 20,
      shootWindupBerserk: 18,
      engagedProjectileShotsBase: 3,
      soloProjectileShotsBase: 2,
      soloProjectileShotsEnraged: 3,
      soloProjectileShotsBerserk: 4,
      engagedProjectileSpreadBase: 0.28,
      soloProjectileSpreadBase: 0.14,
      soloProjectileSpreadEnraged: 0.24,
      soloProjectileSpreadBerserk: 0.32,
      engagedHomingChance: 0.22,
      soloHomingChance: 0.42,
      homingStrength: 0.07,
      summonCount: 1,
      jumpKickMultiplier: 1.1,
      jumpLaunchVY: -12.3,
      airShootAllowed: "enraged",
      airShootIntervalEngaged: 34,
      airShootIntervalSoloEnraged: 20,
      airShootIntervalSoloBerserk: 14,
      postChargeSummonChance: 0.08,
      postChargeJumpChance: 0.14,
      postChargeShootChance: 0.48,
      postShootSummonChance: 0.1,
      postShootChargeChance: 0.12,
      postShootJumpChance: 0.22,
      shakenShootIntervalEngaged: 18,
      shakenShootIntervalSoloEnraged: 18,
      shakenShootIntervalSoloBerserk: 12,
      recoveryCooldownBase: 52,
      recoveryCooldownEnraged: 18,
      recoveryCooldownBerserk: 10,
    };
  }
  return {
    name: "redbull",
    patrolSpeedMultiplier: 1.14,
    closeRange: 250,
    engagedSummonChance: 0.02,
    engagedShootChance: 0.1,
    engagedChargeChance: 0.62,
    closeChargeChance: 0.62,
    jumpPressureChance: 0.26,
    chargeWindupBase: 16,
    chargeWindupEnraged: 13,
    chargeWindupBerserk: 11,
    chargeDurationBase: 82,
    chargeDurationEnraged: 74,
    chargeDurationBerserk: 66,
    chargeSpeedMultiplier: 1.18,
    shootWindupBase: 28,
    shootWindupEnraged: 24,
    shootWindupBerserk: 20,
    engagedProjectileShotsBase: 1,
    soloProjectileShotsBase: 1,
    soloProjectileShotsEnraged: 2,
    soloProjectileShotsBerserk: 2,
    engagedProjectileSpreadBase: 0.08,
    soloProjectileSpreadBase: 0,
    soloProjectileSpreadEnraged: 0.08,
    soloProjectileSpreadBerserk: 0.14,
    engagedHomingChance: 0.02,
    soloHomingChance: 0.08,
    homingStrength: 0.038,
    summonCount: 1,
    jumpKickMultiplier: 0.95,
    jumpLaunchVY: -11.4,
    airShootAllowed: "berserk",
    airShootIntervalEngaged: 999,
    airShootIntervalSoloEnraged: 999,
    airShootIntervalSoloBerserk: 24,
    postChargeSummonChance: 0.02,
    postChargeJumpChance: 0.52,
    postChargeShootChance: 0.12,
    postShootSummonChance: 0.02,
    postShootChargeChance: 0.48,
    postShootJumpChance: 0.28,
    shakenShootIntervalEngaged: 48,
    shakenShootIntervalSoloEnraged: 999,
    shakenShootIntervalSoloBerserk: 18,
    recoveryCooldownBase: 88,
    recoveryCooldownEnraged: 22,
    recoveryCooldownBerserk: 12,
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
  const style = getBossStyleProfile(enemy);
  let bossJustEngaged = false;
  if (
    !level.bossEngaged &&
    isBossGateOpen() &&
    level.bossIntroDone &&
    playerCenterX >= enemy.minX
  ) {
    level.bossEngaged = true;
    bossJustEngaged = true;
    spawnStageOnePopup("雙霸主開戰！", cx, enemy.y - 22, "#ff2244");
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
    spawnStageOnePopup("壟斷暴走！", cx, enemy.y - 18, "#ff5577");
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
      spawnBossBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h * 0.42, enemy.transformToBrand || enemy.secondFormBrand || "monster", 10, {
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
      spawnStageOnePopup("深淵魔爪降臨！", enemy.x + enemy.w / 2, enemy.y - 16, "#9bff8a");
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
    const baseSpeed =
      (1.0 + (1 - hpRatio) * 1.6) *
      STAGE_ONE_DIFFICULTY.enemySpeedMultiplier *
      (style.patrolSpeedMultiplier ?? 1);
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
      const closeRange = Math.abs(dx) < (style.closeRange ?? 220);
      if (engaged) {
        const capRoom = countBossMinionsAlive() < MAX_BOSS_MINIONS;
        const summonCutoff = style.engagedSummonChance ?? BOSS_BALANCE.engagedSummonChancePatrol;
        const shootCutoff = summonCutoff + (style.engagedShootChance ?? BOSS_BALANCE.engagedShootChancePatrol);
        const chargeCutoff = shootCutoff + (style.engagedChargeChance ?? BOSS_BALANCE.engagedChargeChancePatrol);
        if (capRoom && r < summonCutoff) {
          enemy.phase = "summonWindup";
          enemy.phaseTimer = 24;
          enemy.tellTimer = 24;
          enemy.vx = 0;
        } else if (sees && r < shootCutoff) {
          enemy.phase = "shootWindup";
          enemy.phaseTimer = enemy.berserk
            ? style.shootWindupBerserk
            : enemy.enraged
              ? style.shootWindupEnraged
              : style.shootWindupBase;
          enemy.tellTimer = enemy.phaseTimer;
          enemy.vx = 0;
        } else if (closeRange && r < chargeCutoff) {
          enemy.phase = "chargeWindup";
          enemy.phaseTimer = enemy.berserk
            ? style.chargeWindupBerserk
            : enemy.enraged
              ? style.chargeWindupEnraged
              : style.chargeWindupBase;
          enemy.tellTimer = enemy.phaseTimer;
          enemy.vx = 0;
        } else {
          enemy.phase = "jumpWindup";
          enemy.phaseTimer = 13;
          enemy.tellTimer = 13;
          enemy.vx = 0;
        }
        enemy.actionCooldown = BOSS_BALANCE.engagedActionCooldown;
      } else if (r < (style.closeChargeChance ?? (enemy.berserk ? 0.5 : 0.45)) && closeRange) {
        enemy.phase = "chargeWindup";
        enemy.phaseTimer = enemy.berserk
          ? style.chargeWindupBerserk
          : enemy.enraged
            ? style.chargeWindupEnraged
            : style.chargeWindupBase;
        enemy.tellTimer = enemy.phaseTimer;
        enemy.vx = 0;
        enemy.actionCooldown = enemy.berserk ? 84 : enemy.enraged ? 132 : 198;
      } else if (r < (style.closeChargeChance ?? 0.45) + (style.jumpPressureChance ?? 0.3) && damaged) {
        enemy.phase = "jumpWindup";
        enemy.phaseTimer = enemy.berserk ? 20 : 28;
        enemy.tellTimer = enemy.berserk ? 20 : 28;
        enemy.vx = 0;
        enemy.actionCooldown = enemy.berserk ? 84 : enemy.enraged ? 132 : 198;
      } else if (sees) {
        enemy.phase = "shootWindup";
        enemy.phaseTimer = enemy.berserk
          ? style.shootWindupBerserk
          : enemy.enraged
            ? style.shootWindupEnraged
            : style.shootWindupBase;
        enemy.tellTimer = enemy.phaseTimer;
        enemy.vx = 0;
        enemy.actionCooldown = enemy.berserk ? 84 : enemy.enraged ? 132 : 198;
      } else {
        enemy.phase = "chargeWindup";
        enemy.phaseTimer = enemy.berserk
          ? style.chargeWindupBerserk
          : enemy.enraged
            ? style.chargeWindupEnraged
            : style.chargeWindupBase;
        enemy.tellTimer = enemy.phaseTimer;
        enemy.vx = 0;
        enemy.actionCooldown = enemy.berserk ? 84 : enemy.enraged ? 132 : 198;
      }
    }
  } else if (enemy.phase === "summonWindup") {
    enemy.vx = 0;
    if (enemy.phaseTimer <= 0) {
      spawnBossMinions(enemy, style.summonCount ?? BOSS_BALANCE.summonCount);
      enemy.phase = "stunned";
      enemy.phaseTimer = engaged ? BOSS_BALANCE.summonStunnedFrames : 16;
    }
  } else if (enemy.phase === "chargeWindup") {
    enemy.vx = 0;
    if (enemy.phaseTimer <= 0) {
      enemy.phase = "charge";
      enemy.phaseTimer = enemy.berserk
        ? style.chargeDurationBerserk
        : enemy.enraged
          ? style.chargeDurationEnraged
          : style.chargeDurationBase;
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
          : BOSS_BALANCE.chargeSpeedBase) *
      STAGE_ONE_DIFFICULTY.enemySpeedMultiplier *
      (style.chargeSpeedMultiplier ?? 1);
    enemy.vx = (enemy.vx >= 0 ? 1 : -1) * chargeSpeed;
    if (enemy.phaseTimer <= 0) {
      if (engaged) {
        const r = Math.random();
        if (countBossMinionsAlive() < MAX_BOSS_MINIONS && r < (style.postChargeSummonChance ?? BOSS_BALANCE.engagedChargeFollowupSummonChance)) {
          enemy.phase = "summonWindup";
          enemy.phaseTimer = 16;
          enemy.tellTimer = 16;
          enemy.vx = 0;
        } else if (r < (style.postChargeJumpChance ?? 0.4)) {
          enemy.phase = "jumpWindup";
          enemy.phaseTimer = 13;
          enemy.tellTimer = 13;
          enemy.vx = 0;
        } else if (r < (style.postChargeJumpChance ?? 0.4) + (style.postChargeShootChance ?? 0.14) && sees) {
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
        const shots = engaged
          ? (style.engagedProjectileShotsBase ?? BOSS_BALANCE.engagedProjectileShots) + (enemy.berserk ? 1 : 0)
          : enemy.berserk
            ? style.soloProjectileShotsBerserk
            : enemy.enraged
              ? style.soloProjectileShotsEnraged
              : style.soloProjectileShotsBase;
        const spread = engaged
          ? (style.engagedProjectileSpreadBase ?? BOSS_BALANCE.engagedProjectileSpread) + (enemy.berserk ? 0.04 : 0)
          : enemy.berserk
            ? style.soloProjectileSpreadBerserk
            : enemy.enraged
              ? style.soloProjectileSpreadEnraged
              : style.soloProjectileSpreadBase;
        for (let i = 0; i < shots; i += 1) {
          const offset = shots === 1 ? 0 : (i - (shots - 1) / 2) * spread;
          spawnBossProjectile(enemy, dir, { angleOffset: offset });
        }
        if ((engaged || enemy.berserk) && Math.random() < (engaged ? style.engagedHomingChance : style.soloHomingChance)) {
          spawnBossProjectile(enemy, dir, {
            homing: true,
            homingStrength: engaged ? Math.max(BOSS_BALANCE.engagedHomingStrength, style.homingStrength) : style.homingStrength,
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
        Math.random() < (style.postShootSummonChance ?? BOSS_BALANCE.engagedShootFollowupSummonChance)
      ) {
        enemy.phase = "summonWindup";
        enemy.phaseTimer = 16;
        enemy.tellTimer = 16;
      } else if (engaged && sees) {
        const r = Math.random();
        if (r < (style.postShootChargeChance ?? 0.22)) {
          enemy.phase = "chargeWindup";
          enemy.phaseTimer = 14;
          enemy.tellTimer = 14;
        } else if (r < (style.postShootChargeChance ?? 0.22) + (style.postShootJumpChance ?? 0.22)) {
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
      enemy.vy = style.jumpLaunchVY ?? -11.9;
      enemy.onGround = false;
      const horizontalKick =
        (enemy.berserk ? BOSS_BALANCE.jumpKickBerserk : BOSS_BALANCE.jumpKickBase) *
        (style.jumpKickMultiplier ?? 1);
      enemy.vx = Math.sign(dx || 1) * horizontalKick;
      enemy.phase = "airborne";
      enemy.phaseTimer = 220;
      enemy.airShootCooldown = engaged ? BOSS_BALANCE.engagedInitialAirShootCooldown : 18;
    }
  } else if (enemy.phase === "airborne") {
    const allowAirShoot =
      style.airShootAllowed === "enraged"
        ? enemy.berserk || enemy.enraged
        : style.airShootAllowed === "berserk"
          ? enemy.berserk
          : false;
    if (allowAirShoot && sees) {
      enemy.airShootCooldown = Math.max(0, (enemy.airShootCooldown ?? 0) - frameScale);
      if (enemy.airShootCooldown <= 0 && enemy.vy < 1) {
        spawnBossProjectile(enemy, dir, {
          baseAngleY: 0.4,
          speedMul: 0.85,
          heightFrac: 0.85,
        });
        enemy.airShootCooldown = engaged
          ? style.airShootIntervalEngaged
          : enemy.berserk
            ? style.airShootIntervalSoloBerserk
            : style.airShootIntervalSoloEnraged;
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
    // Red Bull fights forward: prefer pushing toward player instead of retreating.
    let escapeDir = style.name === "redbull" ? dir : enemy.shakenDir ?? -dir;
    const wallNearLeft = enemy.x <= leash.minX + 60;
    const wallNearRight = enemy.x + enemy.w >= leash.maxX - 60;
    if (escapeDir < 0 && wallNearLeft) escapeDir = 1;
    else if (escapeDir > 0 && wallNearRight) escapeDir = -1;
    enemy.shakenDir = escapeDir;
    enemy.vx = escapeDir * shakeSpeed * (style.name === "redbull" ? 1.1 : 1);
    const shootInterval = engaged
      ? style.shakenShootIntervalEngaged
      : enemy.berserk
        ? style.shakenShootIntervalSoloBerserk
        : enemy.enraged
          ? style.shakenShootIntervalSoloEnraged
          : 999;
    if (sees && Math.floor(enemy.phaseTimer) % shootInterval === 0 && enemy.phaseTimer > 8) {
      spawnBossProjectile(enemy, dir, { speedMul: 0.85, baseAngleY: -0.18 });
    }
    if (enemy.phaseTimer <= 0) {
      enemy.phase = "patrol";
      enemy.actionCooldown = engaged
        ? BOSS_BALANCE.engagedRecoveryActionCooldown
        : Math.max(0, enemy.berserk ? style.recoveryCooldownBerserk : enemy.enraged ? style.recoveryCooldownEnraged : style.recoveryCooldownBase);
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
  const impactBrand = firstFormBroken ? enemy.secondFormBrand || "monster" : enemy.brand;
  enemy.squashTimer = 8;
  player.vy = -13.4;
  player.jumpsRemaining = 2;
  const sideKick = player.x + player.w / 2 < enemy.x + enemy.w / 2 ? -1 : 1;
  player.x += sideKick * 28;
  player.vx = sideKick * 5.4;
  player.invincible = Math.max(player.invincible ?? 0, BOSS_STOMP_PLAYER_INVINCIBLE_FRAMES);
  triggerStageOneShake(6);
  spawnStageOnePopup(
    firstFormBroken
      ? "極限狂牛倒下，深淵魔爪降臨！"
      : bossWillFall
        ? "雙霸主封鎖崩解！"
        : `霸主 -1（剩 ${enemy.hp}）`,
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
    spawnBossBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h * 0.4, enemy.secondFormBrand || "monster", 34, {
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
    enemy.transformToBrand = enemy.secondFormBrand || "monster";
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
    game.overlayText = "深淵魔爪降臨，準備第二回合！";
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
  game.overlayText = enemy.bossMinion ? "封鎖兵踩扁！" : getEnemyStompText(enemy.brand);
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
        ? boss?.secondFormBrand || boss?.transformToBrand || "monster"
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

const CUTSCENE_VIDEO_HINT_PLAYING = "影片播放中…";
const CUTSCENE_VIDEO_FALLBACK_MS = 12000;
const CUTSCENE_VIDEO_STALL_MS = 4200;
let cutsceneVideoWatchdog = null;
let cutsceneVideoStallWatchdog = null;

function isCutsceneVideoActive() {
  return (
    !!game.finalVictoryVideo?.active ||
    (game.bossCutscene?.active && game.bossCutscene.phase === BOSS_INTRO_VIDEO_PHASE)
  );
}

function clearCutsceneVideoWatchdogs() {
  if (cutsceneVideoWatchdog) {
    window.clearTimeout(cutsceneVideoWatchdog);
    cutsceneVideoWatchdog = null;
  }
  if (cutsceneVideoStallWatchdog) {
    window.clearTimeout(cutsceneVideoStallWatchdog);
    cutsceneVideoStallWatchdog = null;
  }
}

function finishActiveCutsceneVideo() {
  if (game.finalVictoryVideo?.active) {
    if (!canSkipFinalVictoryVideo()) {
      return;
    }
    finishFinalVictoryVideo();
    return;
  }
  if (game.bossCutscene?.active && game.bossCutscene.phase === BOSS_INTRO_VIDEO_PHASE) {
    finishBossInsertVideo();
  }
}

function scheduleCutsceneVideoWatchdog() {
  if (!cutsceneVideo || !isCutsceneVideoActive()) {
    return;
  }
  if (cutsceneVideoWatchdog) {
    window.clearTimeout(cutsceneVideoWatchdog);
  }
  const durationMs =
    Number.isFinite(cutsceneVideo.duration) && cutsceneVideo.duration > 0
      ? Math.min(Math.max(cutsceneVideo.duration * 1000 + 3500, 7000), 45000)
      : CUTSCENE_VIDEO_FALLBACK_MS;
  cutsceneVideoWatchdog = window.setTimeout(() => {
    if (isCutsceneVideoActive() && cutsceneVideo && !cutsceneVideo.ended) {
      finishActiveCutsceneVideo();
    }
  }, durationMs);
}

function scheduleCutsceneVideoStallWatchdog() {
  if (!isCutsceneVideoActive()) {
    return;
  }
  if (cutsceneVideoStallWatchdog) {
    window.clearTimeout(cutsceneVideoStallWatchdog);
  }
  cutsceneVideoStallWatchdog = window.setTimeout(() => {
    if (!isCutsceneVideoActive() || !cutsceneVideo) {
      return;
    }
    if (cutsceneVideo.paused || cutsceneVideo.readyState < 3) {
      finishActiveCutsceneVideo();
    }
  }, CUTSCENE_VIDEO_STALL_MS);
}

async function playCutsceneVideoAutoplay() {
  if (!cutsceneVideo) {
    return false;
  }
  const preferSound = audio.enabled;
  let didPlay = false;

  cutsceneVideo.muted = !preferSound;
  try {
    await cutsceneVideo.play();
    didPlay = true;
  } catch (_) {
    cutsceneVideo.muted = true;
    try {
      await cutsceneVideo.play();
      didPlay = true;
    } catch (_) {
      scheduleCutsceneVideoStallWatchdog();
      return false;
    }
  }

  if (preferSound && cutsceneVideo.muted) {
    try {
      cutsceneVideo.muted = false;
    } catch (_) {}
  }
  if (didPlay) {
    scheduleCutsceneVideoWatchdog();
  }
  return didPlay;
}

function resetCutsceneVideoUi() {
  clearCutsceneVideoWatchdogs();
  setCutsceneVideoVisible(false);
  if (cutsceneVideo) {
    cutsceneVideo.pause();
    cutsceneVideo.currentTime = 0;
  }
  if (cutsceneVideoHint) {
    cutsceneVideoHint.textContent = CUTSCENE_VIDEO_HINT_PLAYING;
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
  game.overlayText = "決戰能量之巔：先閃再踩";
  spawnStageOnePopup("決戰開打！", game.player.x + game.player.w / 2, game.player.y - 20, "#ffd166");
  soundFx.coin();
}

function finishBossMiniCutscene(invincibleFrames = 24) {
  resetCutsceneVideoUi();
  game.bossCutscene = null;
  STAGE_ONE_FX.cameraZoomTarget = 1;
  game.player.invincible = Math.max(game.player.invincible ?? 0, invincibleFrames);
}

function completeBossVictoryCutscene() {
  finishBossMiniCutscene();
  game.pendingStageTransition = SLINGSHOT_FIRST_ORDER ? "toEndingAfterBoss" : "stage2";
  game.pendingStageTransitionTimer = Math.max(game.pendingStageTransitionTimer ?? 0, 36);
  game.overlayTimer = 108;
  game.overlayText = SLINGSHOT_FIRST_ORDER ? "兩大霸主倒下，準備拯救200p" : "通路破口開啟，準備進第二階段";
}

const CUTSCENE_TYPE_CHARS_PER_FRAME = 1.5;

function getCutsceneLineRevealState(line, holdTotal, lineHold) {
  const safeLine = line ?? "";
  const lineElapsed = clamp(holdTotal - (lineHold ?? 0), 0, holdTotal);
  const typedCount = Math.max(0, Math.floor(lineElapsed * CUTSCENE_TYPE_CHARS_PER_FRAME));
  return {
    typedCount,
    fullyRevealed: typedCount >= safeLine.length,
  };
}

function forceRevealCutsceneLine(cs, line, holdTotal) {
  const safeLine = line ?? "";
  const revealLineHold = Math.max(0, holdTotal - Math.ceil(safeLine.length / CUTSCENE_TYPE_CHARS_PER_FRAME));
  cs.lineHold = Math.min(cs.lineHold ?? holdTotal, revealLineHold);
}

function advanceBossDialogueLine(cs, lines, holdTotal, speakerForBounce = "boss") {
  const line = lines[cs.talkIdx]?.line ?? "";
  const reveal = getCutsceneLineRevealState(line, holdTotal, cs.lineHold);
  if (!reveal.fullyRevealed) {
    forceRevealCutsceneLine(cs, line, holdTotal);
    return true;
  }

  cs.talkIdx += 1;
  if (cs.talkIdx >= lines.length) {
    return false;
  }
  cs.lineHold = holdTotal;
  armBossIntroBounce(speakerForBounce === "auto" ? getBossIntroTurn(cs)?.speaker ?? "boss" : speakerForBounce);
  return true;
}

function advanceBossCutscene() {
  const cs = game.bossCutscene;
  if (!cs?.active) {
    return false;
  }
  stopSubtitleNarration();

  if (cs.phase === "bossZoom") {
    cs.phase = "exchangeTalk";
    cs.timer = 0;
    cs.talkIdx = 0;
    cs.lineHold = BOSS_INTRO_LINE_HOLD_FRAMES;
    armBossIntroBounce(getBossIntroTurn(cs)?.speaker ?? "boss");
    return true;
  }

  if (cs.phase === "exchangeTalk") {
    const advanced = advanceBossDialogueLine(cs, BOSS_INTRO_EXCHANGE, BOSS_INTRO_LINE_HOLD_FRAMES, "auto");
    if (advanced) {
      return true;
    }
    cs.phase = BOSS_INTRO_VIDEO_PHASE;
    cs.timer = 0;
    cs.lineHold = 0;
    cs.videoStarted = false;
    cs.videoPlaying = false;
    startBossInsertVideo();
    return true;
  }

  if (cs.phase === "victory") {
    const lines = BOSS_VICTORY_EXCHANGE.map((line) => ({ line: line.line }));
    const advanced = advanceBossDialogueLine(cs, lines, 170, "player");
    if (advanced) {
      return true;
    }
    completeBossVictoryCutscene();
    return true;
  }

  if (cs.phase === "phaseShift") {
    finishBossMiniCutscene(BOSS_PHASE_SHIFT_PLAYER_INVINCIBLE_FRAMES);
    return true;
  }

  if (cs.phase === BOSS_INTRO_VIDEO_PHASE) {
    finishBossInsertVideo();
    return true;
  }

  if (cs.phase === "outro") {
    finishBossIntroCutscene();
    return true;
  }

  return false;
}

function skipBossCutscene() {
  const cs = game.bossCutscene;
  if (!cs?.active) {
    return false;
  }
  if (cs.phase === "victory") {
    completeBossVictoryCutscene();
    return true;
  }
  if (cs.phase === "phaseShift") {
    finishBossMiniCutscene(BOSS_PHASE_SHIFT_PLAYER_INVINCIBLE_FRAMES);
    return true;
  }
  finishBossIntroCutscene();
  return true;
}

function advanceCurrentDialogueScene() {
  stopSubtitleNarration();
  if (game.state === "prologue") {
    return advancePrologueIntroStep();
  }
  if (game.state === "prologueStageCard") {
    finishPrologueStageCard();
    return true;
  }
  if (game.state === "missionCompleteCard") {
    finishMissionCompleteCard();
    return true;
  }
  if (game.bossCutscene?.active) {
    return advanceBossCutscene();
  }
  if (game.state === "stage2Outro") {
    return advanceStageTwoOutroStep();
  }
  if (game.state === "ending") {
    return advanceEndingRescueStep();
  }
  return false;
}

function skipCurrentDialogueScene() {
  stopSubtitleNarration();
  if (game.state === "prologue") {
    finishPrologueIntro();
    return true;
  }
  if (game.state === "prologueStageCard") {
    finishPrologueStageCard();
    return true;
  }
  if (game.state === "missionCompleteCard") {
    finishMissionCompleteCard();
    return true;
  }
  if (game.bossCutscene?.active) {
    return skipBossCutscene();
  }
  if (game.state === "stage2Outro") {
    finishStageTwoToBossCutscene();
    return true;
  }
  if (game.state === "ending") {
    if (!canSkipEndingRescueScene()) {
      return false;
    }
    finishEndingRescueScene();
    return true;
  }
  return false;
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
      completeBossVictoryCutscene();
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
      finishBossMiniCutscene(BOSS_PHASE_SHIFT_PLAYER_INVINCIBLE_FRAMES);
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

  if (cs.phase === "bossZoom") {
    const virtualPanelY = HEIGHT - letterH - 132 - panelBottomMargin;
    drawBossIntroSpeakerPortrait(virtualPanelY, cs);
    ctx.textAlign = "left";
    return;
  }

  let speaker = "…";
  let line = "";
  let accent = "#526182";

  if (cs.phase === "phaseShift") {
    speaker = "深淵魔爪 (Boss)";
    line = "「紅牛帝國竟然倒下了？那就讓夜晚與電競能量網把你吞掉。」";
    accent = "#55f06a";
  } else if (cs.phase === "exchangeTalk") {
    const turn = getBossIntroTurn(cs);
    speaker = turn?.speaker === "player" ? "康貝特年輕廠長 (主角)" : "極限狂牛 (Boss)";
    line = turn?.line ?? "";
    accent = turn?.speaker === "player" ? "#1c6fd4" : "#ef2a3e";
  } else if (cs.phase === BOSS_INTRO_VIDEO_PHASE) {
    speaker = "康貝特年輕廠長 (主角)";
    line = "「為了被封印的康貝特200p，喝了再上。」";
    accent = "#1c6fd4";
  } else if (cs.phase === "victory") {
    const turn = BOSS_VICTORY_EXCHANGE[cs.talkIdx] ?? BOSS_VICTORY_EXCHANGE[BOSS_VICTORY_EXCHANGE.length - 1];
    speaker = "康貝特年輕廠長 (主角)";
    line = turn?.line ?? "「喝了再上！」";
    accent = "#ff7b20";
  } else if (cs.phase === "outro") {
    speaker = "能量巨塔警報";
    line = "能量巨塔封鎖解除，決戰正式開始。";
    accent = "#ff7b20";
  }

  // Typewriter + fade between lines for a smoother cutscene feel.
  const holdTotal = cs.phase === "victory" ? 170 : BOSS_INTRO_LINE_HOLD_FRAMES;
  const lineElapsed = clamp(holdTotal - (cs.lineHold ?? 0), 0, holdTotal);
  const typedCount = Math.max(0, Math.floor(lineElapsed * CUTSCENE_TYPE_CHARS_PER_FRAME));
  const typedLine = line ? line.slice(0, typedCount) : "";
  const fadeOut = clamp((30 - (cs.lineHold ?? 999)) / 30, 0, 1);
  const fadeIn = clamp(lineElapsed / 18, 0, 1);
  const panelAlpha = 0.65 + 0.35 * fadeIn;
  const textAlpha = (1 - 0.45 * fadeOut) * fadeIn;

  const BODY_FONT = "15px Avenir Next, sans-serif";
  const BODY_LINE_H = 18;
  const BODY_TOP = 54;
  const FOOTER_GAP = 16;
  const MAX_BODY_LINES = 12;
  const MIN_PANEL_H = 106;
  const MAX_PANEL_H = 268;

  ctx.font = BODY_FONT;
  const bodyLines = countCutsceneWrappedLines(typedLine || line, maxW, MAX_BODY_LINES);
  const panelH = clamp(BODY_TOP + bodyLines * BODY_LINE_H + FOOTER_GAP, MIN_PANEL_H, MAX_PANEL_H);
  const panelY = HEIGHT - letterH - panelH - panelBottomMargin;

  ctx.save();
  ctx.globalAlpha = panelAlpha;
  ctx.fillStyle = "rgba(255, 252, 246, 0.96)";
  roundRect(panelX, panelY, panelW, panelH, 22);
  ctx.fill();
  ctx.strokeStyle = "rgba(25, 70, 184, 0.35)";
  ctx.lineWidth = 2;
  roundRect(panelX, panelY, panelW, panelH, 22);
  ctx.stroke();
  ctx.restore();

  drawBossIntroSpeakerPortrait(panelY, cs);

  // Accent underline (subtle motion).
  ctx.save();
  ctx.globalAlpha = 0.7 + 0.3 * fadeIn;
  const underlineW = 120 + Math.sin((cs.timer ?? 0) * 0.12) * 10;
  const underlineX = panelX + 22;
  // Keep the underline safely above the body text to avoid overlap on some font metrics.
  const underlineY = Math.min(panelY + 38, panelY + BODY_TOP - 20);
  const grad = ctx.createLinearGradient(underlineX, underlineY, underlineX + underlineW, underlineY);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  roundRect(underlineX, underlineY, underlineW, 6, 3);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = accent;
  ctx.font = "bold 13px Avenir Next, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(speaker, panelX + 22, panelY + 30);

  ctx.save();
  ctx.globalAlpha = textAlpha;
  ctx.fillStyle = "#16203d";
  ctx.font = BODY_FONT;
  wrapCutsceneLine(typedLine || line, panelX + 22, panelY + BODY_TOP, maxW, BODY_LINE_H, MAX_BODY_LINES);
  ctx.restore();

  // Hint to skip (kept inside letterbox area).
  ctx.save();
  ctx.fillStyle = "rgba(255, 247, 232, 0.68)";
  ctx.font = "bold 12px Avenir Next, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Space / Enter / 點一下下一句", WIDTH - 18, HEIGHT - 18);
  ctx.restore();

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
  return Boolean(game.bossCutscene?.active || game.state === "bossArrival" || game.state === "dying");
}

function updateBossArrivalScene(frameScale) {
  const arrival = game.bossArrivalScene;
  if (!arrival) {
    game.state = "running";
    return;
  }

  arrival.phaseTimer = (arrival.phaseTimer ?? 0) + frameScale;
  game.player.vy = 0;
  game.player.onGround = true;
  game.player.jumpsRemaining = 2;
  game.player.jumpBuffer = 0;
  game.player.coyote = 0;
  game.player.facing = 1;

  if ((arrival.phase ?? "walk") === "walk") {
    const walkToX = arrival.walkToX ?? BOSS_ARRIVAL_WALK_TO_X;
    const walkSpeed = arrival.walkSpeed ?? BOSS_ARRIVAL_WALK_SPEED;
    game.player.vx = walkSpeed;
    game.player.x = Math.min(walkToX, game.player.x + walkSpeed * frameScale);
    game.player.prevX = game.player.x;
    game.player.prevY = game.player.y;

    if (game.player.x >= walkToX - 0.01) {
      game.player.x = walkToX;
      game.player.vx = 0;
      arrival.phase = "pant";
      arrival.phaseTimer = 0;
    }
  } else {
    game.player.vx = 0;
    game.player.prevX = game.player.x;
    game.player.prevY = game.player.y;
  }

  const lookAhead = (arrival.phase ?? "walk") === "walk" ? 0.24 : 0.28;
  const targetCamera = clamp(game.player.x - WIDTH * lookAhead, 0, level.worldWidth - WIDTH);
  game.cameraX += (targetCamera - game.cameraX) * 0.12 * frameScale;
  game.cameraX = clamp(game.cameraX, 0, level.worldWidth - WIDTH);

  if ((arrival.phase ?? "walk") === "pant" && arrival.phaseTimer >= (arrival.pantDuration ?? BOSS_ARRIVAL_PANT_FRAMES)) {
    game.bossArrivalScene = null;
    game.state = "running";
    game.player.vx = 0;
    game.player.prevX = game.player.x;
    game.player.prevY = game.player.y;
  }
}

function updateGoal() {
  if (
    game.stage !== 1 ||
    game.state === "won" ||
    game.state === "ending" ||
    game.state === "missionCompleteCard" ||
    !level.goal
  ) {
    return;
  }
  const goalBox = { x: level.goal.x - 14, y: level.goal.y, w: 32, h: level.goal.h };
  if (rectsOverlap(game.player, goalBox)) {
    if (isStageOneGoalLocked()) {
      if ((game.overlayTimer ?? 0) <= 0) {
        game.overlayTimer = 60;
        game.overlayText = "先擊破兩大霸主，才能打開200p金庫！";
      }
      return;
    }
    game.stageOneRating = computeStageOneRating();
    if (SLINGSHOT_FIRST_ORDER) {
      if (!level.bossEngaged && !game.bossCutscene?.active && isStageOneGoalLocked()) {
        // Goal reached but boss alive? (Should be gated, but just in case)
      }
      game.overlayText = `能量之巔通關，收回 ${game.coins} 罐`;
    } else {
      enterStageTwo();
      game.overlayText = `第一階段過關，收回 ${game.coins} 罐`;
    }
    soundFx.win();
  }
}

function step(frameScale) {
  updateSceneTransition(frameScale);

  if (game.flashTimer > 0) {
    game.flashTimer -= frameScale;
  }
  if (game.overlayTimer > 0 && game.state !== "gameover" && game.state !== "won") {
    game.overlayTimer -= frameScale;
  }

  if (game.state === "prologue") {
    updatePrologueIntro(frameScale);
    updateHud();
    return;
  }

  if (game.state === "prologueStageCard") {
    updatePrologueStageCard(frameScale);
    updateHud();
    return;
  }

  if (game.state === "missionCompleteCard") {
    updateMissionCompleteCard(frameScale);
    updateHud();
    return;
  }

  // Stage 2 fail-safe: if targets are cleared, always finish (even if we entered stage 2 via debug skip).
  if (
    game.stage === 2 &&
    game.stageTwo &&
    (game.state === "stage2Intro" || game.state === "stage2Playing" || game.state === "stage2Outro") &&
    !game.endingScene &&
    game.state !== "ending" &&
    game.state !== "missionCompleteCard" &&
    game.state !== "won" &&
    game.state !== "gameover" &&
    game.state !== "finalVideo" &&
    isStageTwoCleared(game.stageTwo)
  ) {
    game.stageTwoClearedFrames += frameScale;
    if (!game.stageTwoClearHandled) {
      game.stageTwoClearHandled = true;
      if (SLINGSHOT_FIRST_ORDER) {
        if (game.state !== "stage2Outro") {
          startStageTwoToBossCutscene(game.stageTwo);
        }
      } else {
        startMissionCompleteCard();
      }
    }
    // Hard force only after the full bridge cinematic should have completed.
    if (game.stageTwoClearedFrames > STAGE_TWO_OUTRO_TOTAL_FRAMES + 420) {
      game.stageTwoClearedFrames = 0;
      if (SLINGSHOT_FIRST_ORDER) {
        if (game.state === "stage2Outro") {
          finishStageTwoToBossCutscene();
        } else {
          enterBossStageFromSlingshot();
        }
      } else {
        startEndingRescueScene();
      }
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
    if (game.pendingStageTransitionTimer <= 0 && game.pendingStageTransition === "toEndingAfterBoss") {
      game.pendingStageTransition = null;
      game.pendingStageTransitionTimer = 0;
      startMissionCompleteCard();
      updateHud();
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

  if (game.state === "stage2Outro") {
    updateStageTwo(frameScale);
    updateHud();
    return;
  }

  if (game.state === "stage2Playing") {
    updateStageTwo(frameScale);
    updateHud();
    return;
  }

  if (game.state === "bossArrival") {
    updateBossArrivalScene(frameScale);
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

  if (game.state === "dying") {
    updateDeathScene(frameScale);
    updateHud();
    return;
  }

  if (game.state === "ad") {
    game.adTimer += frameScale;

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
      game.overlayText = "前方能量巨塔頂端，站穩再進就會開打";
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

  // Boss lane / arena background placement: keep it in the far scenery layer.
  if (game.stage === 1 && (level.bossEngaged || isNearBossArena())) {
    const pulse = 0.5 + 0.5 * Math.sin((game.elapsed || 0) * 0.06);
    const x = 560;
    const y = 86;
    const w = 360;
    const h = 84;
    ctx.save();
    ctx.globalAlpha = 0.62;
    ctx.shadowColor = "rgba(15, 23, 51, 0.18)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, "rgba(239, 42, 62, 0.78)");
    grad.addColorStop(1, "rgba(255, 124, 32, 0.78)");
    ctx.fillStyle = grad;
    roundRect(x, y, w, h, 22);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    for (let i = 0; i < 8; i += 1) {
      ctx.fillRect(x + 18 + i * 44, y + 14 + (i % 2) * 6, 10, 56);
    }
    ctx.fillStyle = "#fff7e8";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "bold 20px Avenir Next, sans-serif";
    ctx.fillText("康貝特200P", x + 22, y + 32);
    ctx.fillStyle = `rgba(255, 247, 232, ${0.74 + pulse * 0.18})`;
    ctx.font = "bold 14px Avenir Next, sans-serif";
    ctx.fillText("能量巨塔指定補給 · 喝了再上", x + 22, y + 58);
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

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
        ctx.fillText("鎖", x + platform.w / 2, y + 9);
      } else if (state) {
        ctx.fillStyle = "#20345d";
        ctx.font = "bold 10px Avenir Next, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(state.id === "plate1" ? "閘1" : state.id === "plate2" ? "閘2" : "開", x + platform.w / 2, y + 9);
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
    ctx.fillText("推貨", x + crate.w / 2, y + crate.h / 2 + 4);
  }
}
