/* Khởi tạo trang, điều hướng, lời chúc và hiệu ứng xuất hiện khi cuộn. */
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const wishGrid = $("#wish-grid");
  const wishStatus = $("#wish-status");
  let lastRandomIndex = -1;
  const pageIds = ["home", "wishes", "letters", "gift", "closing"];
  const pageNames = ["Cánh cửa bí mật", "Lời chúc dành cho bạn", "Những lá thư bí mật", "Món quà cuối cùng", "Lời nhắn khép lại"];
  const pages = pageIds.map(id => document.getElementById(id)).filter(Boolean);
  let activePageIndex = 0;
  let navigationBusy = false;
  const loader = $("#page-loader");
  const pageDots = $("#page-dots");
  const prevButton = $("#page-prev");
  const nextButton = $("#page-next");
  const pageCounter = $("#page-counter");

  function renderWishCards() {
    wishGrid.innerHTML = "";
    window.WISH_DATA.cards.forEach(item => {
      const card = document.createElement("article");
      card.className = "wish-card";
      const symbol = document.createElement("span");
      symbol.className = "wish-symbol";
      symbol.textContent = item.icon;
      const title = document.createElement("h3");
      title.textContent = item.title;
      const text = document.createElement("p");
      text.textContent = item.text;
      card.append(symbol, title, text);
      wishGrid.appendChild(card);
    });
  }
  function showRandomWish() {
    const pool = window.WISH_DATA.random;
    let index = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && index === lastRandomIndex) index = (index + 1) % pool.length;
    lastRandomIndex = index;
    wishStatus.textContent = "✦ " + pool[index];
    wishStatus.animate?.([{ opacity: 0, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 350 });
  }
  $("#new-wish").addEventListener("click", showRandomWish);
  function updatePageControls() {
    prevButton.disabled = activePageIndex === 0 || navigationBusy;
    nextButton.disabled = activePageIndex === pages.length - 1 || navigationBusy;
    pageCounter.textContent = `TRANG ${String(activePageIndex + 1).padStart(2, "0")} / ${String(pages.length).padStart(2, "0")}`;
    document.querySelectorAll(".page-dot").forEach((dot, index) => {
      if (index === activePageIndex) dot.setAttribute("aria-current", "step");
      else dot.removeAttribute("aria-current");
    });
    document.querySelectorAll(".desktop-nav a").forEach(link => {
      const id = link.getAttribute("href").slice(1);
      if (id === pageIds[activePageIndex]) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function navigateToPage(targetId, initial = false) {
    const targetIndex = pageIds.indexOf(targetId);
    if (targetIndex < 0 || targetIndex === activePageIndex || navigationBusy) return;
    if (initial) {
      activePageIndex = targetIndex;
      pages.forEach((page, index) => page.classList.toggle("page-active", index === activePageIndex));
      updatePageControls();
      return;
    }
    navigationBusy = true;
    document.body.classList.add("is-transitioning");
    if (loader) {
      loader.classList.add("is-loading");
      loader.setAttribute("aria-hidden", "false");
      const subTitle = $("#loader-subtitle");
      if (subTitle) subTitle.textContent = `Đang mở: ${pageNames[targetIndex]}`;
    }
    window.SecretBagua?.start?.();
    updatePageControls();
    window.SecretEffects?.burstAtElement($("#page-controls"), 10);
    window.setTimeout(() => {
      pages.forEach((page, index) => page.classList.toggle("page-active", index === targetIndex));
      activePageIndex = targetIndex;
      window.scrollTo({ top: 0, behavior: "auto" });
      if (loader) {
        loader.classList.remove("is-loading");
        loader.setAttribute("aria-hidden", "true");
      }
      window.SecretBagua?.stop?.();
      document.body.classList.remove("is-transitioning");
      navigationBusy = false;
      updatePageControls();
      if (targetId === "gift") window.SecretEffects?.burstAtElement($("#gift-box"), 15);
    }, 240);
  }
  window.navigateSecretPage = navigateToPage;

  pages.forEach((page, index) => {
    page.classList.add("page-section");
    page.classList.toggle("page-active", index === 0);
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "page-dot";
    dot.setAttribute("aria-label", `Chuyển đến trang ${index + 1}: ${pageNames[index]}`);
    dot.title = pageNames[index];
    dot.addEventListener("click", () => navigateToPage(pageIds[index]));
    pageDots.appendChild(dot);
  });
  document.body.classList.add("page-mode");
  prevButton.addEventListener("click", () => navigateToPage(pageIds[activePageIndex - 1]));
  nextButton.addEventListener("click", () => navigateToPage(pageIds[activePageIndex + 1]));
  $("#enter-garden").addEventListener("click", () => {
    window.SecretEffects?.burstAtElement($("#enter-garden"), 50);
    navigateToPage("wishes");
  });
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const targetId = link.getAttribute("href").slice(1);
      if (pageIds.includes(targetId)) {
        event.preventDefault();
        navigateToPage(targetId);
      }
    });
  });
  updatePageControls();
  document.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || !$("#letter-modal").hidden) return;
    if (document.body.classList.contains("puzzle-active")) return;
    const tag = document.activeElement?.tagName;
    if (["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(tag)) return;
    if (event.key === "ArrowRight" && activePageIndex < pages.length - 1) navigateToPage(pageIds[activePageIndex + 1]);
    if (event.key === "ArrowLeft" && activePageIndex > 0) navigateToPage(pageIds[activePageIndex - 1]);
  });

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(el => observer.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add("is-visible"));
  }

  window.showToast = message => {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(window.__toastTimeout);
    window.__toastTimeout = setTimeout(() => toast.classList.remove("show"), 3200);
  };

  // Bật/tắt hiệu ứng hạt sáng và cánh hoa để người dùng tự chọn trải nghiệm.
  const effectsToggle = $("#effects-toggle");
  const effectsLabel = $("#effects-label");
  effectsToggle?.addEventListener("click", () => {
    const enabled = effectsToggle.getAttribute("aria-pressed") !== "true";
    effectsToggle.setAttribute("aria-pressed", String(enabled));
    document.body.classList.toggle("effects-off", !enabled);
    if (effectsLabel) effectsLabel.textContent = enabled ? "Hiệu ứng" : "Tắt hiệu ứng";
    window.showToast?.(enabled ? "Phép màu đã trở lại ✨" : "Đã giảm hiệu ứng để xem nhẹ nhàng hơn.");
  });

  // Toàn màn hình giúp website giống một trải nghiệm trình chiếu hơn.
  const fullscreenToggle = $("#fullscreen-toggle");
  fullscreenToggle?.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      window.showToast?.("Trình duyệt chưa cho phép bật toàn màn hình.");
    }
  });
  document.addEventListener("fullscreenchange", () => {
    fullscreenToggle?.setAttribute("aria-pressed", String(Boolean(document.fullscreenElement)));
    if (fullscreenToggle) fullscreenToggle.textContent = document.fullscreenElement ? "⛶ Thoát" : "⛶";
  });

  // Chia sẻ bằng trình chia sẻ của điện thoại hoặc sao chép lời chúc.
  $("#share-wish")?.addEventListener("click", async () => {
    const shareData = {
      title: "20/10 — Bí mật dành riêng cho bạn",
      text: "Chúc bạn luôn được yêu thương, được lắng nghe và tìm thấy một bông hoa ngay cả trong những ngày bình thường nhất. ♡",
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        window.showToast?.("Đã sao chép lời chúc để bạn gửi cho người thương ♡");
      } else {
        window.showToast?.("Hãy sao chép đường dẫn website để chia sẻ nhé.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") window.showToast?.("Chưa thể chia sẻ tự động trên trình duyệt này.");
    }
  });

  renderWishCards();
})();
