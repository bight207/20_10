/* ==========================================================================
   XỬ LÝ MÀN HÌNH GHÉP ẢNH MỞ ĐẦU (INTRO PUZZLE - 20/10 SECRET)
   Tối ưu hóa siêu mượt 60/120fps cho Điện thoại (Touch/Pointer) & Máy tính
   ========================================================================== */
(() => {
  const IMAGE_SRC = "img.jpg";
  const PIECES = [
    { id: 0, x: "0%", y: "0%", label: "1" },
    { id: 1, x: "50%", y: "0%", label: "2" },
    { id: 2, x: "100%", y: "0%", label: "3" },
    { id: 3, x: "0%", y: "100%", label: "4" },
    { id: 4, x: "50%", y: "100%", label: "5" },
    { id: 5, x: "100%", y: "100%", label: "6" }
  ];

  // DOM Elements
  const introElem = document.getElementById("puzzle-intro");
  const boardElem = document.getElementById("puzzle-board");
  const previewModal = document.getElementById("puzzle-preview-modal");
  const successBanner = document.getElementById("puzzle-success-banner");
  const btnPreview = document.getElementById("puzzle-btn-preview");
  const btnClosePreview = document.getElementById("puzzle-close-preview");
  const btnShuffle = document.getElementById("puzzle-btn-shuffle");
  const btnHints = document.getElementById("puzzle-btn-hints");
  const btnSkip = document.getElementById("puzzle-btn-skip");
  const btnEnterSite = document.getElementById("puzzle-enter-site");
  const btnReplay = document.getElementById("puzzle-replay");

  if (!introElem || !boardElem) return;

  // State
  let boardState = [0, 1, 2, 3, 4, 5];
  let selectedSlotIndex = null;
  let isSolved = false;
  let showBadges = true;
  let isTransitioningOut = false;
  let autoEnterTimer = null;
  const slotElements = [];

  // Sound generator using Web Audio API
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTone(freq, type = "sine", duration = 0.08, gainVal = 0.1) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function playSelectSound() {
    playTone(580, "triangle", 0.07, 0.12);
  }

  function playSwapSound() {
    playTone(420, "sine", 0.05, 0.1);
    setTimeout(() => playTone(680, "sine", 0.08, 0.12), 40);
  }

  function playSuccessChime() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const chord = [523.25, 659.25, 783.99, 987.77, 1046.50];
      chord.forEach((freq, idx) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.75);
        }, idx * 110);
      });
    } catch (e) {}
  }

  // Shuffle pieces
  function shuffleArray() {
    let arr = [0, 1, 2, 3, 4, 5];
    let isScrambled = false;
    while (!isScrambled) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
      }
      const misplaced = arr.filter((val, idx) => val !== idx).length;
      if (misplaced >= 4) {
        isScrambled = true;
      }
    }
    boardState = arr;
  }

  // Check if board is solved
  function checkSolved() {
    return boardState.every((pieceId, slotIdx) => pieceId === slotIdx);
  }

  // Ghost element for smooth 60/120fps drag
  let touchGhost = null;
  function getGhostElement() {
    if (!touchGhost) {
      touchGhost = document.createElement("div");
      touchGhost.className = "puzzle-touch-ghost";
      touchGhost.setAttribute("aria-hidden", "true");
      document.body.appendChild(touchGhost);
    }
    return touchGhost;
  }

  function showGhost(slotIndex, x, y, width, height) {
    const ghost = getGhostElement();
    const pieceData = PIECES[boardState[slotIndex]];
    ghost.style.backgroundImage = `url("${IMAGE_SRC}")`;
    ghost.style.backgroundPosition = `${pieceData.x} ${pieceData.y}`;
    ghost.style.width = width + "px";
    ghost.style.height = height + "px";
    ghost.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(1.06)`;
    ghost.style.display = "block";
  }

  function updateGhostPosition(x, y) {
    if (!touchGhost) return;
    touchGhost.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(1.06)`;
  }

  function hideGhost() {
    if (touchGhost) {
      touchGhost.style.display = "none";
    }
  }

  // Pure coordinate math to find target slot (Zero layout reflow!)
  function getSlotFromCoords(x, y, boardRect) {
    if (!boardRect) return null;
    if (x < boardRect.left || x > boardRect.right || y < boardRect.top || y > boardRect.bottom) {
      return null;
    }
    const col = Math.floor(((x - boardRect.left) / boardRect.width) * 3);
    const row = Math.floor(((y - boardRect.top) / boardRect.height) * 2);
    const clampedCol = Math.max(0, Math.min(2, col));
    const clampedRow = Math.max(0, Math.min(1, row));
    return clampedRow * 3 + clampedCol;
  }

  function clearDragStyles() {
    slotElements.forEach(el => el.classList.remove("is-drag-over", "is-dragging"));
  }

  // Swap pieces between two slots
  function swapSlots(fromIndex, toIndex) {
    if (fromIndex === toIndex || isSolved) return;
    const temp = boardState[fromIndex];
    boardState[fromIndex] = boardState[toIndex];
    boardState[toIndex] = temp;
    selectedSlotIndex = null;
    playSwapSound();
    renderBoard();

    if (checkSolved()) {
      handleSuccess();
    }
  }

  // Tap-to-Swap or Select handler
  function handleSlotClick(slotIndex) {
    if (isSolved) return;

    if (selectedSlotIndex === null) {
      selectedSlotIndex = slotIndex;
      playSelectSound();
      renderBoard();
    } else if (selectedSlotIndex === slotIndex) {
      selectedSlotIndex = null;
      renderBoard();
    } else {
      swapSlots(selectedSlotIndex, slotIndex);
    }
  }

  // Pointer drag & tap interaction state
  let activePointerId = null;
  let dragStartSlot = null;
  let startX = 0, startY = 0;
  let isDragging = false;
  let cachedBoardRect = null;
  let currentHoverSlot = null;

  let pendingGhostX = 0, pendingGhostY = 0;
  let rafDragId = null;

  function updateDragFrame() {
    if (!isDragging) {
      rafDragId = null;
      return;
    }
    updateGhostPosition(pendingGhostX, pendingGhostY);
    const targetSlot = getSlotFromCoords(pendingGhostX, pendingGhostY, cachedBoardRect);
    if (targetSlot !== currentHoverSlot) {
      currentHoverSlot = targetSlot;
      for (let idx = 0; idx < slotElements.length; idx++) {
        slotElements[idx].classList.toggle(
          "is-drag-over",
          currentHoverSlot !== null && idx === currentHoverSlot && idx !== dragStartSlot
        );
      }
    }
    rafDragId = null;
  }

  function onPointerMove(e) {
    if (dragStartSlot === null || (activePointerId !== null && e.pointerId !== activePointerId)) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // Detect intentional drag (> 5px)
    if (!isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isDragging = true;
      const pieceEl = slotElements[dragStartSlot];
      if (pieceEl) pieceEl.classList.add("is-dragging");
      showGhost(dragStartSlot, e.clientX, e.clientY, pieceEl ? pieceEl.offsetWidth : 120, pieceEl ? pieceEl.offsetHeight : 80);
      playSelectSound();
    }

    if (isDragging) {
      pendingGhostX = e.clientX;
      pendingGhostY = e.clientY;
      if (!rafDragId) {
        rafDragId = requestAnimationFrame(updateDragFrame);
      }
    }
  }

  function onPointerEnd(e) {
    if (dragStartSlot === null || (activePointerId !== null && e.pointerId !== activePointerId)) return;

    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerEnd);
    window.removeEventListener("pointercancel", onPointerEnd);

    if (rafDragId) {
      cancelAnimationFrame(rafDragId);
      rafDragId = null;
    }

    const finishedSlot = dragStartSlot;
    const wasDragging = isDragging;
    const clientX = e.clientX;
    const clientY = e.clientY;

    // Cleanup drag state
    hideGhost();
    clearDragStyles();
    dragStartSlot = null;
    activePointerId = null;
    isDragging = false;
    currentHoverSlot = null;

    if (wasDragging) {
      const targetSlot = getSlotFromCoords(clientX, clientY, cachedBoardRect);
      if (targetSlot !== null && targetSlot !== finishedSlot) {
        swapSlots(finishedSlot, targetSlot);
      }
    } else {
      // Tap / Click action
      handleSlotClick(finishedSlot);
    }
  }

  function attachPieceEvents(pieceEl, slotIndex) {
    pieceEl.addEventListener("pointerdown", (e) => {
      if (isSolved) return;
      if (e.button && e.button !== 0) return; // Only main button/touch

      getAudioContext();
      dragStartSlot = slotIndex;
      activePointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      isDragging = false;
      currentHoverSlot = null;
      cachedBoardRect = boardElem.getBoundingClientRect();

      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerup", onPointerEnd);
      window.addEventListener("pointercancel", onPointerEnd);
    });

    pieceEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSlotClick(slotIndex);
      }
    });
  }

  // Initialize the 6 DOM elements once (Zero GC during game!)
  function createBoardElements() {
    boardElem.innerHTML = "";
    slotElements.length = 0;
    for (let slotIndex = 0; slotIndex < 6; slotIndex++) {
      const pieceEl = document.createElement("div");
      pieceEl.className = "puzzle-piece";
      pieceEl.dataset.slotIndex = slotIndex;
      pieceEl.setAttribute("role", "button");
      pieceEl.setAttribute("tabindex", "0");

      const badge = document.createElement("span");
      badge.className = "puzzle-piece-badge" + (showBadges ? "" : " is-hidden");
      pieceEl.appendChild(badge);

      attachPieceEvents(pieceEl, slotIndex);
      boardElem.appendChild(pieceEl);
      slotElements.push(pieceEl);
    }
  }

  // Update board visual properties (< 0.1ms render time!)
  function renderBoard() {
    boardState.forEach((pieceId, slotIndex) => {
      const pieceEl = slotElements[slotIndex];
      if (!pieceEl) return;
      const pieceData = PIECES[pieceId];
      pieceEl.dataset.pieceId = pieceId;
      pieceEl.setAttribute("aria-label", `Mảnh ${pieceData.label} ở ô ${slotIndex + 1}`);
      pieceEl.style.backgroundImage = `url("${IMAGE_SRC}")`;
      pieceEl.style.backgroundPosition = `${pieceData.x} ${pieceData.y}`;

      const badge = pieceEl.querySelector(".puzzle-piece-badge");
      if (badge) {
        badge.textContent = pieceData.label;
        badge.classList.toggle("is-hidden", !showBadges);
      }

      pieceEl.classList.toggle("is-selected", slotIndex === selectedSlotIndex);
    });

    if (isSolved) {
      boardElem.classList.add("is-solved");
    } else {
      boardElem.classList.remove("is-solved");
    }
  }

  // Handle victory completion
  function handleSuccess() {
    isSolved = true;
    selectedSlotIndex = null;
    renderBoard();

    // Sound chime & flower celebration
    playSuccessChime();
    window.SecretEffects?.celebrate();

    // Show victory card
    if (successBanner) {
      setTimeout(() => {
        successBanner.classList.add("is-active");
      }, 500);
    }

    // Auto transition to main site after 2.4s
    autoEnterTimer = setTimeout(() => {
      enterMainSite();
    }, 2400);
  }

  // Transition into main site
  function enterMainSite() {
    if (isTransitioningOut) return;
    isTransitioningOut = true;
    if (autoEnterTimer) clearTimeout(autoEnterTimer);

    if (successBanner) successBanner.classList.remove("is-active");
    introElem.classList.add("is-hidden");
    document.body.classList.remove("puzzle-active");

    // Resume background particles now that puzzle is done
    try {
      window.SecretEffects?.startParticles?.();
    } catch (e) {}

    // Auto start background music with user gesture acknowledgment
    try {
      window.SecretMusic?.play();
    } catch (e) {}

    // Burst at hero
    setTimeout(() => {
      const hero = document.getElementById("home");
      if (hero) window.SecretEffects?.burstAtElement(hero, 40);
      window.showToast?.("Chào mừng bạn đến với Khu vườn 20/10! ✿");
    }, 400);
  }

  // Skip / Auto-solve immediately
  function skipToSite() {
    boardState = [0, 1, 2, 3, 4, 5];
    isSolved = true;
    renderBoard();
    playSuccessChime();
    window.SecretEffects?.celebrate();
    setTimeout(() => {
      enterMainSite();
    }, 600);
  }

  // Replay puzzle (called from header replay button)
  function replayPuzzle() {
    isSolved = false;
    isTransitioningOut = false;
    if (autoEnterTimer) clearTimeout(autoEnterTimer);
    if (successBanner) successBanner.classList.remove("is-active");

    shuffleArray();
    renderBoard();

    document.body.classList.add("puzzle-active");
    introElem.classList.remove("is-hidden");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  window.openPuzzleIntro = replayPuzzle;

  // Initialize aspect ratio based on natural image size
  function initImageAspect() {
    const img = new Image();
    img.src = IMAGE_SRC;
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        boardElem.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
        const previewImg = document.getElementById("puzzle-preview-image");
        if (previewImg) previewImg.src = IMAGE_SRC;
      }
    };
  }

  // Button listeners
  btnShuffle?.addEventListener("click", () => {
    if (isSolved) return;
    shuffleArray();
    selectedSlotIndex = null;
    playTone(450, "sine", 0.08, 0.1);
    renderBoard();
  });

  btnHints?.addEventListener("click", () => {
    showBadges = !showBadges;
    btnHints.classList.toggle("is-active", showBadges);
    document.querySelectorAll(".puzzle-piece-badge").forEach(b => {
      b.classList.toggle("is-hidden", !showBadges);
    });
  });

  btnPreview?.addEventListener("click", () => {
    previewModal?.classList.add("is-open");
  });

  btnClosePreview?.addEventListener("click", () => {
    previewModal?.classList.remove("is-open");
  });

  previewModal?.addEventListener("click", (e) => {
    if (e.target === previewModal) previewModal.classList.remove("is-open");
  });

  btnSkip?.addEventListener("click", skipToSite);
  btnEnterSite?.addEventListener("click", enterMainSite);
  btnReplay?.addEventListener("click", replayPuzzle);

  // Initialize
  document.body.classList.add("puzzle-active");
  initImageAspect();
  createBoardElements();
  shuffleArray();
  renderBoard();
})();
