/* Bát quái được vẽ bằng các hạt sáng lấp lánh - Siêu nhẹ, chỉ kích hoạt khi màn chuyển trang hiển thị */
(() => {
  const canvas = document.getElementById('bagua-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SIZE = 280;
  canvas.width = SIZE * 2;
  canvas.height = SIZE * 2;
  ctx.scale(2, 2);
  const cx = SIZE / 2, cy = SIZE / 2;
  const particles = [];
  const colors = ['255,226,179', '255,174,218', '204,166,255', '255,246,229'];

  function addLine(x1, y1, x2, y2, count, color, spread = 1.0) {
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      particles.push({
        baseX: x1 + (x2 - x1) * t + (Math.random() - .5) * spread,
        baseY: y1 + (y2 - y1) * t + (Math.random() - .5) * spread,
        phase: Math.random() * Math.PI * 2,
        size: .6 + Math.random() * 1.1,
        alpha: .45 + Math.random() * .55,
        color
      });
    }
  }

  // Vòng ngoài và vòng trong bằng các hạt tinh tế
  const ringRadii = [113, 103, 91];
  const ringCounts = [56, 42, 32];
  for (let ring = 0; ring < 3; ring++) {
    const radius = ringRadii[ring];
    const count = ringCounts[ring];
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count;
      const wobble = (Math.random() - .5) * 2;
      particles.push({
        baseX: cx + Math.cos(a) * (radius + wobble),
        baseY: cy + Math.sin(a) * (radius + wobble),
        phase: Math.random() * Math.PI * 2,
        size: .5 + Math.random() * 1.1,
        alpha: .35 + Math.random() * .6,
        color: colors[Math.floor(Math.random() * colors.length)],
        orbit: ring === 0 ? .6 : .25
      });
    }
  }

  // Tám quẻ Bát Quái
  for (let q = 0; q < 8; q++) {
    const angle = -Math.PI / 2 + q * Math.PI / 4;
    const radial = 72;
    const centerX = cx + Math.cos(angle) * radial;
    const centerY = cy + Math.sin(angle) * radial;
    const tangentX = -Math.sin(angle), tangentY = Math.cos(angle);
    const normalX = Math.cos(angle), normalY = Math.sin(angle);
    for (let row = -1; row <= 1; row++) {
      const offset = row * 9;
      const mx = centerX + normalX * offset;
      const my = centerY + normalY * offset;
      const broken = ((q + row + 3) % 3 === 0);
      if (broken) {
        for (const side of [-1, 1]) {
          const half = 4;
          addLine(mx + tangentX * (side * 5 - half), my + tangentY * (side * 5 - half), mx + tangentX * (side * 5 + half), my + tangentY * (side * 5 + half), 4, colors[q % colors.length]);
        }
      } else {
        addLine(mx - tangentX * 10, my - tangentY * 10, mx + tangentX * 10, my + tangentY * 10, 8, colors[q % colors.length]);
      }
    }
  }

  // Vòng hạt nhỏ lấp lánh bao quanh tâm thái cực
  for (let i = 0; i < 35; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 38 + Math.random() * 8;
    particles.push({
      baseX: cx + Math.cos(a) * r,
      baseY: cy + Math.sin(a) * r,
      phase: Math.random() * 6.28,
      size: .45 + Math.random() * .9,
      alpha: .25 + Math.random() * .65,
      color: colors[i % colors.length]
    });
  }

  let frame = 0;
  let rafId = null;
  let isRunning = false;

  function draw() {
    if (!isRunning) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    const time = reduceMotion ? 0 : frame * .02;

    // Quầng sáng mềm ở giữa
    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120);
    glow.addColorStop(0, 'rgba(255,190,225,.12)');
    glow.addColorStop(.55, 'rgba(196,132,255,.05)');
    glow.addColorStop(1, 'rgba(196,132,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, SIZE, SIZE);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const shimmer = .55 + .45 * Math.sin(time + p.phase);
      const drift = reduceMotion ? 0 : Math.sin(time * .8 + p.phase) * (p.orbit || .7);
      const x = p.baseX + drift;
      const y = p.baseY + (reduceMotion ? 0 : Math.cos(time * .7 + p.phase) * (p.orbit || .5));
      const alpha = p.alpha * shimmer;
      ctx.fillStyle = `rgba(${p.color},${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    frame++;
    if (!reduceMotion && isRunning) {
      rafId = requestAnimationFrame(draw);
    }
  }

  window.SecretBagua = {
    start() {
      if (isRunning) return;
      isRunning = true;
      frame = 0;
      draw();
    },
    stop() {
      isRunning = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      ctx.clearRect(0, 0, SIZE, SIZE);
    }
  };

  // Chỉ vẽ 1 khung tĩnh nhẹ ban đầu, không bật vòng lặp ngầm gây nóng máy
  draw();
  isRunning = false;
})();
