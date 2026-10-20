/* Hiệu ứng nền: cánh hoa rơi, hạt sáng và pháo hoa canvas tối ưu hóa GPU 60/120fps */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const petalLayer = document.getElementById("petal-layer");
  const canvas = document.getElementById("particle-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let width = 0, height = 0, particles = [], rafId = null;
  let burstParticles = [];
  let lastPetal = 0;
  const burstColors = ["#f5b5ce", "#e7c68d", "#fff0e8", "#c9a4ed", "#ee7da8"];

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const isMobile = width < 768;
    const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.25);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = isMobile ? Math.min(10, Math.floor(width / 38)) : Math.min(28, Math.floor(width / 32));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.3 + .4,
      speed: Math.random() * .26 + .06,
      alpha: Math.random() * .35 + .12,
      phase: Math.random() * 6.28
    }));
  }

  function drawParticles() {
    // Không chạy hiệu ứng nền khi ở màn ghép ảnh hoặc khi tắt hiệu ứng hoặc ẩn tab
    if (document.body.classList.contains("puzzle-active") ||
        document.body.classList.contains("effects-off") ||
        document.hidden) {
      rafId = null;
      return;
    }

    ctx.clearRect(0, 0, width, height);
    const t = performance.now() / 1000;

    // 1. Vẽ các hạt sáng nền nhẹ nhàng
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y -= p.speed;
      if (p.y < -5) {
        p.y = height + 5;
        p.x = Math.random() * width;
      }
      const alpha = p.alpha * (.65 + .35 * Math.sin(t + p.phase));
      ctx.beginPath();
      ctx.arc(p.x + Math.sin(t * .4 + p.phase) * 5, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244, 205, 224, ${alpha})`;
      ctx.fill();
    }

    // 2. Cập nhật và vẽ các hạt pháo hoa (gộp chung 1 vòng lặp duy nhất, không tạo hàng trăm RAF)
    if (burstParticles.length > 0) {
      for (let i = burstParticles.length - 1; i >= 0; i--) {
        const bp = burstParticles[i];
        bp.age++;
        if (bp.age >= bp.life) {
          burstParticles.splice(i, 1);
          continue;
        }
        bp.vx *= .982;
        bp.vy = bp.vy * .982 + .028;
        bp.px += bp.vx;
        bp.py += bp.vy;

        const progress = bp.age / bp.life;
        const currentAlpha = Math.max(0, 1 - progress);
        const currentSize = Math.max(.5, bp.maxSize * (1 - progress));

        ctx.fillStyle = bp.color;
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(bp.px, bp.py, currentSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    rafId = requestAnimationFrame(drawParticles);
  }

  function createPetal() {
    if (reduceMotion || !petalLayer || document.hidden ||
        document.body.classList.contains("puzzle-active") ||
        document.body.classList.contains("effects-off")) return;
    const isMobile = window.innerWidth < 768;
    const maxPetals = isMobile ? 2 : 6;
    if (petalLayer.childElementCount >= maxPetals) return;

    const el = document.createElement("span");
    el.className = "petal";
    el.textContent = Math.random() > .5 ? "✿" : "❀";
    const size = isMobile ? (8 + Math.random() * 8) : (9 + Math.random() * 12);
    el.style.left = Math.random() * 96 + "vw";
    el.style.fontSize = size + "px";
    el.style.setProperty("--drift", (Math.random() * 120 - 60) + "px");
    el.style.animationDuration = (7 + Math.random() * 5) + "s";
    el.addEventListener("animationend", () => el.remove(), { once: true });
    petalLayer.appendChild(el);
  }

  function burst(x = width / 2, y = height / 2, amount = 40) {
    if (reduceMotion || document.body.classList.contains("effects-off")) return;
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? Math.min(amount, 16) : Math.min(amount, 36);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.4 + Math.random() * 3.8;
      const life = isMobile ? (30 + Math.random() * 25) : (40 + Math.random() * 35);
      burstParticles.push({
        px: x,
        py: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        age: 0,
        maxSize: Math.random() * 1.6 + 1.1,
        color: burstColors[Math.floor(Math.random() * burstColors.length)]
      });
    }

    // Đảm bảo vòng lặp đang chạy để vẽ hạt pháo hoa
    if (!rafId && !document.body.classList.contains("puzzle-active")) {
      rafId = requestAnimationFrame(drawParticles);
    }
  }

  window.SecretEffects = {
    startParticles() {
      if (!reduceMotion && !rafId && !document.body.classList.contains("puzzle-active")) {
        rafId = requestAnimationFrame(drawParticles);
      }
    },
    stopParticles() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
    burstAtElement(el, amount = 30) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2, amount);
    },
    celebrate() {
      burst(width * .28, height * .32, 35);
      setTimeout(() => burst(width * .72, height * .28, 38), 160);
      setTimeout(() => burst(width * .5, height * .42, 45), 320);
      if (!reduceMotion) {
        for (let i = 0; i < 4; i++) setTimeout(createPetal, i * 140);
      }
    }
  };

  resize();
  window.addEventListener("resize", resize, { passive: true });

  // Tạm dừng vẽ khi tab bị ẩn để tiết kiệm 100% pin và GPU
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.SecretEffects.stopParticles();
    } else if (!document.body.classList.contains("puzzle-active")) {
      window.SecretEffects.startParticles();
    }
  });

  if (!reduceMotion) {
    setInterval(() => {
      const now = performance.now();
      if (now - lastPetal > 1400) {
        createPetal();
        lastPetal = now;
      }
    }, 1500);
  }
})();
