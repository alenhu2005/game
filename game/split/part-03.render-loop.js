// Rendering pipeline, Stage 2 aiming helpers, debug shortcuts, and the game loop.

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
    const slingLabel = hudSlingStageName();
    ctx.fillStyle = palette.hud;
    roundRect(16, 14, 324, 56, 18);
    ctx.fill();
    ctx.fillStyle = "#fff7e8";
    ctx.font = "bold 18px Avenir Next, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${slingLabel} 彈藥 ${game.stageTwo.shotsLeft}`, 30, 38);
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
    ctx.fillText(`${slingLabel}  彈弓清場`, WIDTH / 2, 38);

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
  const bossLabel = hudBossStageName();
  ctx.fillText(
    level.goal ? `${bossLabel}  平台衝刺` : `${bossLabel}  Boss 戰`,
    WIDTH / 2,
    38
  );

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
    if (SLINGSHOT_FIRST_ORDER) {
      ctx.fillText("先玩彈弓清堡壘，再進 Boss 戰一路衝刺。", panelX + panelW / 2, panelY + 146);
      ctx.fillText("彈弓：拖曳 200P 發射；Boss：A/D 移動、Space 跳、Shift 衝刺。", panelX + panelW / 2, panelY + 172);
      ctx.fillText("對話與插播影片期間，Boss 關倒數會自動暫停。", panelX + panelW / 2, panelY + 198);
    } else {
      ctx.fillText("A/D 移動，Space 跳（二段跳），Shift 衝刺。連吃 200P 會 COMBO 加時。", panelX + panelW / 2, panelY + 146);
      ctx.fillText("先推箱、踩開關、破數量門，再衝進 Boss 區。", panelX + panelW / 2, panelY + 172);
      ctx.fillText("Boss 對話和插播影片期間，倒數會自動暫停。", panelX + panelW / 2, panelY + 198);
    }
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
    ctx.fillText(`${hudSlingStageName()}說明`, panelX + panelW / 2, panelY + 58);

    ctx.fillStyle = "#16203d";
    ctx.font = "bold 30px Avenir Next, sans-serif";
    ctx.fillText(`${hudSlingStageName()}：彈弓打競品`, panelX + panelW / 2, panelY + 102);

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
      ? SLINGSHOT_FIRST_ORDER
        ? "彈弓清場 · Boss 擊破 · 救援達成"
        : "Boss 擊破 · 彈弓清場 · 救援達成"
      : level.goal
        ? `${hudBossStageName()}過關`
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

    const bossStats = {
      label: SLINGSHOT_FIRST_ORDER ? "第二關 · Boss 戰" : "第一關 · Boss 戰",
      color: "#ffd166",
      stats: [
        { value: `${game.coins}`, unit: "罐 200P" },
        { value: `+${formatStatNumber(game.timeBoostEarned)}s`, unit: "延長時間" },
        { value: `${game.comboBest}`, unit: "最高連踩" },
      ],
    };
    const slingStats = {
      label: SLINGSHOT_FIRST_ORDER ? "第一關 · 彈弓場" : "第二關 · 彈弓場",
      color: "#ff7b20",
      stats: [
        { value: `${game.stageTwo ? game.stageTwo.score : 0}`, unit: "分數" },
        { value: `${game.stageTwo ? game.stageTwo.shotsLeft : 0}`, unit: "剩餘彈藥" },
        { value: `${stageTwoBestImpact}`, unit: "最佳衝擊" },
      ],
    };

    if (SLINGSHOT_FIRST_ORDER) {
      drawResultCard(leftX, cardsTop, cardW, cardH, slingStats);
      drawResultCard(rightX, cardsTop, cardW, cardH, bossStats);
    } else {
      drawResultCard(leftX, cardsTop, cardW, cardH, bossStats);
      drawResultCard(rightX, cardsTop, cardW, cardH, slingStats);
    }

    ctx.fillStyle = "rgba(255, 246, 228, 0.92)";
    ctx.font = "18px Avenir Next, sans-serif";
    ctx.fillText("全線通關：維他命 B 群 + 胺基酸 + 牛磺酸，精神值一站補滿。", WIDTH / 2, cardsTop + cardH + 38);
  } else if (isWin) {
    const cardW = panelW - 60;
    const leftX = panelX + 30;
    drawResultCard(leftX, cardsTop, cardW, cardH, {
      label: `${hudBossStageName()} · Boss 戰`,
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
      label: game.stage === 2 ? `${hudSlingStageName()}彈藥告急` : `${hudBossStageName()} KO`,
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
        `${hudBossStageName()}補了 ${game.coins} 罐，多撐 ${formatStatNumber(game.timeBoostEarned)} 秒。`,
        WIDTH / 2,
        252
      );
      ctx.fillText(
        `${hudSlingStageName()}砸出 ${game.stageTwo ? game.stageTwo.score : 0} 分，競品全部清場。`,
        WIDTH / 2,
        286
      );
      ctx.fillText("記住它：7 種維他命 + 胺基酸 + 牛磺酸。", WIDTH / 2, 312);
    } else {
      ctx.fillText(
        game.state === "won"
          ? `你補了 ${game.coins} 罐 200P，報告和交件一起搞定。`
          : game.stage === 2
            ? `${hudSlingStageName()}彈藥打完了，再按 R 或 Restart 重跑一次。`
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

function getCanvasPointFromClient(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const portraitRotated =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(orientation: portrait) and (max-width: 926px)").matches;

  if (portraitRotated) {
    return {
      x: ((clientY - rect.top) / rect.height) * WIDTH,
      y: (1 - (clientX - rect.left) / rect.width) * HEIGHT,
    };
  }

  return {
    x: ((clientX - rect.left) / rect.width) * WIDTH,
    y: ((clientY - rect.top) / rect.height) * HEIGHT,
  };
}

function getCanvasPoint(event) {
  return getCanvasPointFromClient(event.clientX, event.clientY);
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

function isCoarseStageTwoInput() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches
  );
}

function isStageTwoGrabPoint(point, projectileDistance, grabRadius) {
  if (projectileDistance <= grabRadius) {
    return true;
  }

  if (!isCoarseStageTwoInput() || !game.stageTwo) {
    return false;
  }

  const { sling } = game.stageTwo;
  const slingDistance = Math.hypot(point.x - sling.x, point.y - sling.y);
  const inFingerAimZone =
    point.x <= sling.x + 230 &&
    point.x >= Math.max(0, sling.x - 132) &&
    point.y >= sling.y - 172 &&
    point.y <= sling.y + 156;

  return slingDistance <= 184 || inFingerAimZone;
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

  const grabRadius = isCoarseStageTwoInput() ? 132 : 48;

  // On phones, it's easy to miss the projectile on first touch.
  // If we're still on the intro prompt, treat the first touch as "start + grab"
  // so players can immediately drag to aim.
  if (game.state === "stage2Intro") {
    enterStageTwoPlaying();
    game.stageTwo.dragging = true;
    projectile.state = "dragging";
    if (physics) {
      physics.cancelSling();
    }
    updateStageTwoDrag(point);
    return true;
  }

  if (!isStageTwoGrabPoint(point, distance, grabRadius)) {
    return false;
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

  // Mobile UX: a quick tap is often meant to "start" rather than "shoot".
  // Only allow launch after the drag actually moved a bit.
  if (typeof stageTwoDragMoved !== "undefined" && !stageTwoDragMoved) {
    const { projectile, physics, sling } = game.stageTwo;
    game.stageTwo.dragging = false;
    projectile.state = "ready";
    if (physics) {
      physics.holdProjectile(sling.x, sling.y, 0);
      physics.releaseProjectileFromHold();
      physics.resetProjectile();
    } else {
      projectile.x = sling.x;
      projectile.y = sling.y;
      projectile.rotation = 0;
      projectile.vx = 0;
      projectile.vy = 0;
    }
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
    if (SLINGSHOT_FIRST_ORDER) {
      startEndingRescueScene();
      game.overlayText = "測試跳關：直接結局";
    } else {
      enterStageTwo();
      game.overlayText = "測試跳關：直接進第二關";
    }
    soundFx.win();
    updateHud();
    return;
  }

  if (game.stage === 2) {
    if (!game.stageTwo) {
      game.stageTwo = createStageTwo();
    }
    game.stageTwo.score = Math.max(game.stageTwo.score, 480);
    if (SLINGSHOT_FIRST_ORDER) {
      enterBossStageFromSlingshot();
      game.overlayText = "測試跳關：直接進 Boss 戰";
    } else {
      startEndingRescueScene();
      game.overlayText = "測試跳關：直接結局";
    }
    soundFx.win();
    updateHud();
  }
}
