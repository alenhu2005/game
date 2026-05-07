
// Keyboard, pointer, mobile touch controls, media hooks, and boot sequence.

window.addEventListener("keydown", (event) => {
  unlockAudio();

  if (game.state === "finalVideo") {
    event.preventDefault();
    return;
  }

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
    game.state === "prologue" &&
    (event.code === "Space" || event.code === "Enter")
  ) {
    event.preventDefault();
    finishPrologueIntro();
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

  if (game.state === "stage2Outro" && (event.code === "Space" || event.code === "Enter")) {
    event.preventDefault();
    finishStageTwoToBossCutscene();
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

function shouldIgnoreProloguePointer(event) {
  const target = event.target;
  if (target?.closest?.("button") || target?.closest?.(".video-overlay")) {
    return true;
  }
  const source = event.changedTouches ? event.changedTouches[0] : event;
  if (!source || typeof source.clientX !== "number" || typeof source.clientY !== "number") {
    return false;
  }
  const rect = canvas.getBoundingClientRect();
  const insideCanvas =
    source.clientX >= rect.left &&
    source.clientX <= rect.right &&
    source.clientY >= rect.top &&
    source.clientY <= rect.bottom;
  if (!insideCanvas) {
    return false;
  }
  return pointInRect(getCanvasPointFromClient(source.clientX, source.clientY), getAudioToggleRect());
}

function skipPrologueFromShellTap(event) {
  if (game.state !== "prologue") {
    return;
  }
  if (shouldIgnoreProloguePointer(event)) {
    return;
  }
  if (!event.target?.closest?.(".game-shell")) {
    return;
  }
  unlockAudio();
  finishPrologueIntro();
  event.preventDefault();
}

document.addEventListener("pointerdown", skipPrologueFromShellTap, true);
document.addEventListener("touchstart", skipPrologueFromShellTap, { capture: true, passive: false });

if (cutsceneVideo) {
  cutsceneVideo.addEventListener("loadedmetadata", () => {
    layoutCutsceneVideo();
    scheduleCutsceneVideoWatchdog();
  });
  cutsceneVideo.addEventListener("ended", () => {
    finishActiveCutsceneVideo();
  });
  cutsceneVideo.addEventListener("error", () => {
    finishActiveCutsceneVideo();
  });
  cutsceneVideo.addEventListener("playing", () => {
    clearCutsceneVideoWatchdogs();
    scheduleCutsceneVideoWatchdog();
  });
  cutsceneVideo.addEventListener("timeupdate", () => {
    clearCutsceneVideoWatchdogs();
    scheduleCutsceneVideoWatchdog();
  });
  cutsceneVideo.addEventListener("waiting", scheduleCutsceneVideoStallWatchdog);
  cutsceneVideo.addEventListener("stalled", scheduleCutsceneVideoStallWatchdog);
  cutsceneVideo.addEventListener("suspend", scheduleCutsceneVideoStallWatchdog);
  cutsceneVideo.addEventListener("pause", () => {
    if (isCutsceneVideoActive() && !cutsceneVideo.ended) {
      scheduleCutsceneVideoStallWatchdog();
    }
  });
}

if (cutsceneVideoOverlay) {
  cutsceneVideoOverlay.addEventListener("pointerdown", (event) => {
    if (
      game.finalVictoryVideo?.active ||
      (game.bossCutscene?.active && game.bossCutscene.phase === BOSS_INTRO_VIDEO_PHASE)
    ) {
      event.preventDefault();
      event.stopPropagation();
      finishActiveCutsceneVideo();
    }
  });
  cutsceneVideoOverlay.addEventListener(
    "touchend",
    (event) => {
      if (isCutsceneVideoActive()) {
        event.preventDefault();
        event.stopPropagation();
        finishActiveCutsceneVideo();
      }
    },
    { passive: false }
  );
}

configureCanvas();
window.addEventListener("resize", () => {
  configureCanvas();
  layoutCutsceneVideo();
  syncMobileControlsVisibility();
});
window.addEventListener("orientationchange", () => {
  // iOS Safari can keep stale rect/DPR after rotation until next frame.
  requestAnimationFrame(() => {
    configureCanvas();
    layoutCutsceneVideo();
    syncMobileControlsVisibility();
  });
});
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => {
    configureCanvas();
    layoutCutsceneVideo();
  });
}
try {
  window.matchMedia("(max-width: 820px)").addEventListener("change", syncMobileControlsVisibility);
} catch (_) {}

// Stage 2 slingshot drag state (pointer-first).
let stageTwoDragPointerId = null;
let stageTwoDragStartPoint = null;
let stageTwoDragMoved = false;
function clearStageTwoPointerTracking(event, preserveTouchDrag = false) {
  const pointerId = stageTwoDragPointerId;
  stageTwoDragPointerId = null;
  if (!preserveTouchDrag) {
    stageTwoDragStartPoint = null;
    stageTwoDragMoved = false;
  }
  if (event && pointerId != null && canvas.releasePointerCapture) {
    try {
      canvas.releasePointerCapture(pointerId);
    } catch (_) {}
  }
}

function startStageTwoPointerDrag(point, event) {
  if (!beginStageTwoDrag(point)) {
    return false;
  }
  stageTwoDragPointerId = event.pointerId;
  stageTwoDragStartPoint = point;
  stageTwoDragMoved = false;
  if (canvas.setPointerCapture) {
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch (_) {}
  }
  return true;
}

canvas.addEventListener("pointerdown", (event) => {
  unlockAudio();

  if (game.state === "finalVideo") {
    event.preventDefault();
    return;
  }

  if (game.bossCutscene?.active && game.bossCutscene.phase === BOSS_INTRO_VIDEO_PHASE) {
    event.preventDefault();
    return;
  }

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

  if (game.state === "prologue") {
    finishPrologueIntro();
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

  if (game.state === "stage2Outro") {
    finishStageTwoToBossCutscene();
    event.preventDefault();
    return;
  }

  if (startStageTwoPointerDrag(point, event)) {
    event.preventDefault();
  }
});
canvas.addEventListener("pointermove", (event) => {
  if (!game.stageTwo || !game.stageTwo.dragging) {
    return;
  }
  // If we had to fall back to touch events, don't double-apply movement here.
  if (stageTwoTouchActive) return;
  if (stageTwoDragPointerId != null && event.pointerId !== stageTwoDragPointerId) {
    return;
  }
  const point = getCanvasPoint(event);
  if (stageTwoDragStartPoint && !stageTwoDragMoved) {
    if (Math.hypot(point.x - stageTwoDragStartPoint.x, point.y - stageTwoDragStartPoint.y) > 10) {
      stageTwoDragMoved = true;
    }
  }
  updateStageTwoDrag(point);
  event.preventDefault();
});
window.addEventListener("pointerup", (event) => {
  if (stageTwoTouchActive) {
    clearStageTwoPointerTracking(event, true);
    return;
  }
  if (stageTwoDragPointerId != null && event.pointerId !== stageTwoDragPointerId) {
    return;
  }
  releaseStageTwoDrag();
  clearStageTwoPointerTracking(event);
});
window.addEventListener("pointercancel", (event) => {
  if (stageTwoTouchActive) {
    clearStageTwoPointerTracking(event, true);
    return;
  }
  if (stageTwoDragPointerId != null && event.pointerId !== stageTwoDragPointerId) {
    return;
  }
  releaseStageTwoDrag();
  clearStageTwoPointerTracking(event);
});
window.addEventListener("pointerdown", unlockAudio);

// Fallback for older iOS Safari / webviews where Pointer Events can be flaky.
// Keep this minimal: just forward primary touch to the same stage-two drag logic.
let stageTwoTouchActive = false;
let stageTwoTouchId = null;
function getTrackedTouch(event) {
  if (stageTwoTouchId == null) {
    return null;
  }
  const touches = event.changedTouches || event.touches;
  if (!touches) return null;
  for (let i = 0; i < touches.length; i += 1) {
    const t = touches[i];
    if (t && t.identifier === stageTwoTouchId) return t;
  }
  return null;
}
canvas.addEventListener(
  "touchstart",
  (event) => {
    if (stageTwoTouchActive) return;
    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch) return;

    unlockAudio();
    stageTwoTouchId = touch.identifier;

    // On mobile Safari, preventing default early avoids "ghost click" / scroll gestures.
    if (game.stage === 2 && game.stageTwo && (game.state === "stage2Intro" || game.state === "stage2Playing")) {
      event.preventDefault();
    }

    const point = getCanvasPointFromClient(touch.clientX, touch.clientY);
    if (game.state === "intro" && SLINGSHOT_FIRST_ORDER) {
      startStageOneRun();
      event.preventDefault();
      return;
    }
    if (game.state === "prologue") {
      finishPrologueIntro();
      event.preventDefault();
      return;
    }

    if (game.state === "stage2Outro") {
      finishStageTwoToBossCutscene();
      event.preventDefault();
      return;
    }
    stageTwoDragStartPoint = point;
    stageTwoDragMoved = false;

    // If pointerdown already started the drag, just attach the touch stream.
    if (game.stageTwo && game.stageTwo.dragging) {
      stageTwoTouchActive = true;
      event.preventDefault();
      return;
    }

    stageTwoTouchActive = beginStageTwoDrag(point);
    if (stageTwoTouchActive) {
      event.preventDefault();
    }
  },
  { passive: false }
);
canvas.addEventListener(
  "touchmove",
  (event) => {
    if (!stageTwoTouchActive || !game.stageTwo || !game.stageTwo.dragging) {
      return;
    }
    const touch = getTrackedTouch(event) || (event.changedTouches && event.changedTouches[0]);
    if (!touch) return;
    const point = getCanvasPointFromClient(touch.clientX, touch.clientY);
    if (stageTwoDragStartPoint && !stageTwoDragMoved) {
      if (Math.hypot(point.x - stageTwoDragStartPoint.x, point.y - stageTwoDragStartPoint.y) > 10) {
        stageTwoDragMoved = true;
      }
    }
    updateStageTwoDrag(point);
    event.preventDefault();
  },
  { passive: false }
);
window.addEventListener(
  "touchmove",
  (event) => {
    if (!stageTwoTouchActive || !game.stageTwo || !game.stageTwo.dragging) {
      return;
    }
    const touch = getTrackedTouch(event);
    if (!touch) return;
    const point = getCanvasPointFromClient(touch.clientX, touch.clientY);
    if (stageTwoDragStartPoint && !stageTwoDragMoved) {
      if (Math.hypot(point.x - stageTwoDragStartPoint.x, point.y - stageTwoDragStartPoint.y) > 10) {
        stageTwoDragMoved = true;
      }
    }
    updateStageTwoDrag(point);
    event.preventDefault();
  },
  { passive: false }
);
function endStageTwoTouchDrag(event) {
  if (!stageTwoTouchActive) return;
  const touch = getTrackedTouch(event);
  if (!touch && event.type !== "touchcancel") return;
  stageTwoTouchActive = false;
  stageTwoTouchId = null;
  releaseStageTwoDrag();
  stageTwoDragStartPoint = null;
  stageTwoDragMoved = false;
  event.preventDefault();
}
canvas.addEventListener("touchend", endStageTwoTouchDrag, { passive: false });
canvas.addEventListener("touchcancel", endStageTwoTouchDrag, { passive: false });
window.addEventListener("touchend", endStageTwoTouchDrag, { passive: false });
window.addEventListener("touchcancel", endStageTwoTouchDrag, { passive: false });

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
