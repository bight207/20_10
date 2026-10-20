/* Quản lý phong bì và điều kiện mở hộp quà. */
(() => {
  const openedFlowers = new Set();
  const openedLetters = new Set();
  const modal = document.getElementById("letter-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const giftBox = document.getElementById("gift-box");
  const openGift = document.getElementById("open-gift");
  const giftLockText = document.getElementById("gift-lock-text");
  const giftHint = document.getElementById("gift-hint");
  const finalMessage = document.getElementById("final-message");
  let previousFocus = null;

  function updateProgress() {
    const letterCount = document.getElementById("letter-count");
    if (letterCount) letterCount.textContent = openedLetters.size;
    const unlocked = openedLetters.size >= 3;
    giftLockText.textContent = unlocked ? "BẠN ĐÃ TÌM THẤY MÓN QUÀ" : "MỘT MÓN QUÀ DÀNH CHO BẠN";
    giftHint.textContent = unlocked
      ? "Bạn đã khám phá các bức thư — hãy mở món quà của mình!"
      : "Bấm vào hộp quà để nhận một lá thư nhỏ dành riêng cho bạn.";
    if (unlocked && !window.__giftUnlockedToastShown) {
      window.__giftUnlockedToastShown = true;
      window.showToast?.("Bạn đã mở khóa món quà cuối cùng! ✨");
    }
  }
  function openLetter(index, button) {
    const letter = window.WISH_DATA.letters[index];
    if (!letter) return;
    previousFocus = button;
    modalTitle.textContent = letter.title;
    modalBody.textContent = letter.body;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    button.classList.add("opened");
    openedLetters.add(index);
    updateProgress();
    modal.querySelector(".modal-close").focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (previousFocus) previousFocus.focus();
  }
  document.querySelectorAll("[data-letter]").forEach(button => {
    button.addEventListener("click", () => openLetter(Number(button.dataset.letter), button));
  });
  modal.querySelectorAll("[data-close-modal]").forEach(el => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });

  document.querySelectorAll("[data-flower]").forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.flower);
      const message = window.WISH_DATA.flowers[index];
      document.querySelectorAll(".garden-flower").forEach(el => el.classList.remove("selected"));
      button.classList.add("selected", "discovered");
      document.querySelector("#garden-message p").textContent = message;
      document.querySelector("#garden-message .garden-message-icon").textContent = "✧";
      openedFlowers.add(index);
      window.SecretEffects?.burstAtElement(button, 28);
      updateProgress();
    });
  });
  const giftModal = document.getElementById("gift-modal");
  function closeGiftModal() {
    giftModal.hidden = true;
    document.body.classList.remove("modal-open");
  }
  giftModal.querySelectorAll("[data-close-gift]").forEach(el => el.addEventListener("click", closeGiftModal));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !giftModal.hidden) closeGiftModal();
  });
  function openPresent() {
    giftBox.classList.add("open");
    giftBox.setAttribute("aria-label", "Hộp quà đã mở");
    giftHint.textContent = "Món quà đã mở — một lời chúc nhỏ đang chờ bạn.";
    giftModal.hidden = false;
    document.body.classList.add("modal-open");
    window.SecretEffects?.burstAtElement(giftBox, 42);
    window.SecretEffects?.celebrate();
  }
  giftBox.addEventListener("click", openPresent);
  openGift.addEventListener("click", openPresent);
  document.getElementById("gift-share-wish").addEventListener("click", async () => {
    const text = "Chúc bạn 20/10 thật rực rỡ! Mong bạn luôn được yêu thương, bình yên và trân trọng. ♡";
    try {
      if (navigator.share) await navigator.share({ title: "Món quà 20/10", text });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(text); window.showToast?.("Đã sao chép lời chúc để bạn gửi đi! ♡"); }
      else window.showToast?.(text);
    } catch (error) { if (error?.name !== "AbortError") window.showToast?.(text); }
  });
  document.getElementById("celebrate-again").addEventListener("click", () => {
    window.SecretEffects?.celebrate();
    window.showToast?.("Gửi bạn thêm một chút phép màu! ✨");
  });
  updateProgress();
})();
