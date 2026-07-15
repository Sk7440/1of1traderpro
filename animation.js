(function () {
  const canvas = document.getElementById("particles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  let w = 0,
    h = 0,
    dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    w = canvas.width = Math.floor(window.innerWidth * dpr);
    h = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", () => {
    resize();
    initParticles();
  });

  // particle settings
  let particles = [];
  function calcCount() {
    const area = window.innerWidth * window.innerHeight;
    return Math.max(18, Math.min(140, Math.floor(area * 0.00008)));
  }
  let count = calcCount();

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function initParticles() {
    particles = [];
    count = calcCount();
    for (let i = 0; i < count; i++) {
      particles.push({
        x: rand(0, window.innerWidth),
        y: rand(0, window.innerHeight),
        vx: rand(-0.2, 0.2),
        vy: rand(-0.15, 0.15),
        size: rand(0.6, 1.8),
        alpha: rand(0.15, 0.6),
      });
    }
  }
  initParticles();

  // mouse interaction
  const mouse = { x: -9999, y: -9999 };
  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    // parallax for glows
    const px = (e.clientX / window.innerWidth - 0.5) * 30;
    const py = (e.clientY / window.innerHeight - 0.5) * 30;
    document.querySelectorAll(".gold-aura").forEach((el, i) => {
      el.style.transform = `translate3d(${i ? -px : px}px, ${i ? -py : py}px, 0)`;
    });
  });
  window.addEventListener("mouseleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // animation loop
  let last = performance.now();
  function draw(now) {
    const dt = Math.min(40, now - last) / 16;
    last = now;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // draw connections first (soft)
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x,
          dy = p.y - q.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 140) {
          const alpha = (1 - dist / 140) * 0.09;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(198,168,74,${alpha})`;
          ctx.lineWidth = 0.9;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }

    // draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      // slight mouse repulsion
      if (mouse.x > -9000) {
        const dx = p.x - mouse.x,
          dy = p.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 120 && d > 1) {
          const rep = (1 - d / 120) * 0.8;
          p.vx += (dx / d) * rep * 0.02 * dt;
          p.vy += (dy / d) * rep * 0.02 * dt;
        }
      }

      // velocity damping & move
      p.vx *= 0.995;
      p.vy *= 0.995;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // wrap around
      if (p.x < -10) p.x = window.innerWidth + 10;
      if (p.x > window.innerWidth + 10) p.x = -10;
      if (p.y < -10) p.y = window.innerHeight + 10;
      if (p.y > window.innerHeight + 10) p.y = -10;

      // draw soft circle
      const grd = ctx.createRadialGradient(
        p.x,
        p.y,
        0,
        p.x,
        p.y,
        Math.max(8, p.size * 6),
      );
      grd.addColorStop(0, `rgba(198,168,74,${p.alpha})`);
      grd.addColorStop(1, `rgba(198,168,74,${Math.max(0, p.alpha - 0.4)})`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.2, p.size * 3), 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  // start (respect reduced-motion)
  const mm = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!mm.matches) requestAnimationFrame(draw);

  // regenerate on resize/orientation changes
  window.addEventListener("orientationchange", () =>
    setTimeout(initParticles, 300),
  );
})();
    