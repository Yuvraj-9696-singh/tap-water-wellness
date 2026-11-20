import { useEffect, useRef } from "react";

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Deep water bubbles
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 4 + 1,
      speedY: -(Math.random() * 1.5 + 0.5),
      speedX: (Math.random() - 0.5) * 1,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    // Complex interacting waves
    const waves = [
      { yOffset: height * 0.65, length: 0.003, amplitude: 50, speed: 0.01, colorDark: "hsla(186, 100%, 42%, 0.02)", colorLight: "hsla(190, 80%, 60%, 0.05)", colorBlack: "hsla(0, 0%, 100%, 0.03)" },
      { yOffset: height * 0.75, length: 0.005, amplitude: 40, speed: 0.015, colorDark: "hsla(200, 100%, 50%, 0.03)", colorLight: "hsla(200, 80%, 70%, 0.06)", colorBlack: "hsla(0, 0%, 100%, 0.04)" },
      { yOffset: height * 0.85, length: 0.004, amplitude: 30, speed: 0.02, colorDark: "hsla(160, 80%, 45%, 0.04)", colorLight: "hsla(160, 70%, 65%, 0.06)", colorBlack: "hsla(0, 0%, 100%, 0.05)" },
      { yOffset: height * 0.95, length: 0.008, amplitude: 20, speed: 0.03, colorDark: "hsla(180, 70%, 40%, 0.05)", colorLight: "hsla(180, 70%, 60%, 0.07)", colorBlack: "hsla(0, 0%, 100%, 0.06)" },
    ];

    // Light rays (caustics)
    const rays = Array.from({ length: 8 }, () => ({
      x: Math.random() * width,
      width: Math.random() * 100 + 50,
      opacity: Math.random() * 0.05 + 0.02,
      speed: Math.random() * 0.002 + 0.001,
      angle: (Math.random() - 0.5) * 0.2,
    }));

    let time = 0;
    let animationId: number;

    const animate = () => {
      const isBlack = document.documentElement.classList.contains("black");
      const isDark = document.documentElement.classList.contains("dark") || isBlack;

      // Adaptive background: pure #000000 in black mode, dark cyan in dark, light slate in light
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      if (isBlack) {
        bgGradient.addColorStop(0, "#000000");
        bgGradient.addColorStop(1, "#000000");
      } else if (isDark) {
        bgGradient.addColorStop(0, "#050B14");
        bgGradient.addColorStop(1, "#0A1929");
      } else {
        bgGradient.addColorStop(0, "#F8FAFC");
        bgGradient.addColorStop(1, "#EBF8FF");
      }
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Ambient glow in center
      const glow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 1.2);
      if (isBlack) {
        glow.addColorStop(0, "hsla(0, 0%, 100%, 0.05)");
        glow.addColorStop(0.5, "hsla(0, 0%, 100%, 0.02)");
      } else if (isDark) {
        glow.addColorStop(0, "hsla(186, 100%, 42%, 0.1)");
        glow.addColorStop(0.5, "hsla(200, 100%, 50%, 0.05)");
      } else {
        glow.addColorStop(0, "hsla(186, 90%, 65%, 0.12)");
        glow.addColorStop(0.5, "hsla(200, 90%, 75%, 0.06)");
      }
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Draw light rays (pure white shafts in black mode)
      for (const ray of rays) {
        ctx.save();
        ctx.beginPath();
        ctx.translate(ray.x, 0);
        ctx.rotate(ray.angle + Math.sin(time * ray.speed) * 0.05);
        
        const rayGradient = ctx.createLinearGradient(0, 0, 0, height);
        const currentOpacity = ray.opacity * (0.5 + Math.sin(time * ray.speed * 2) * 0.5);
        if (isBlack) {
          rayGradient.addColorStop(0, `hsla(0, 0%, 100%, ${currentOpacity * 0.9})`);
          rayGradient.addColorStop(0.3, `hsla(0, 0%, 100%, ${currentOpacity * 0.45})`);
        } else if (isDark) {
          rayGradient.addColorStop(0, `hsla(186, 100%, 80%, ${currentOpacity})`);
          rayGradient.addColorStop(0.3, `hsla(186, 100%, 60%, ${currentOpacity * 0.5})`);
        } else {
          rayGradient.addColorStop(0, `hsla(190, 80%, 45%, ${currentOpacity * 0.35})`);
          rayGradient.addColorStop(0.3, `hsla(190, 80%, 45%, ${currentOpacity * 0.15})`);
        }
        rayGradient.addColorStop(1, "transparent");
        
        ctx.fillStyle = rayGradient;
        ctx.fillRect(-ray.width / 2, 0, ray.width, height);
        ctx.restore();

        // Sway rays
        ray.x += Math.sin(time * ray.speed) * 0.2;
        if (ray.x < -100) ray.x = width + 100;
        if (ray.x > width + 100) ray.x = -100;
      }

      // Draw fluid waves
      for (let w = 0; w < waves.length; w++) {
        const wave = waves[w];
        ctx.beginPath();
        ctx.moveTo(0, height);
        
        for (let x = 0; x <= width; x += 30) {
          const secondaryWave = Math.sin(x * wave.length * 2 - time * wave.speed * 1.5) * (wave.amplitude * 0.3);
          const y = wave.yOffset + Math.sin(x * wave.length + time * wave.speed + w) * wave.amplitude + secondaryWave;
          ctx.lineTo(x, y);
        }
        
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = isBlack ? wave.colorBlack : isDark ? wave.colorDark : wave.colorLight;
        ctx.fill();
        
        // Crest highlight
        ctx.lineWidth = 1;
        ctx.strokeStyle = isBlack
          ? `hsla(0, 0%, 100%, 0.25)`
          : isDark
          ? `hsla(186, 100%, 70%, 0.1)`
          : `hsla(190, 80%, 50%, 0.12)`;
        ctx.stroke();
      }

      // Draw bubbles / starry particles (pure white bioluminescence in black mode)
      for (const p of particles) {
        ctx.beginPath();
        
        const bubbleGradient = ctx.createRadialGradient(
          p.x - p.size * 0.3, p.y - p.size * 0.3, 0,
          p.x, p.y, p.size
        );
        if (isBlack) {
          bubbleGradient.addColorStop(0, `hsla(0, 0%, 100%, ${p.opacity * 0.95})`);
          bubbleGradient.addColorStop(0.6, `hsla(0, 0%, 95%, ${p.opacity * 0.5})`);
          bubbleGradient.addColorStop(1, "transparent");
        } else if (isDark) {
          bubbleGradient.addColorStop(0, `hsla(210, 100%, 90%, ${p.opacity})`);
          bubbleGradient.addColorStop(0.8, `hsla(186, 100%, 60%, ${p.opacity * 0.5})`);
          bubbleGradient.addColorStop(1, "transparent");
        } else {
          bubbleGradient.addColorStop(0, `hsla(190, 80%, 45%, ${p.opacity * 0.35})`);
          bubbleGradient.addColorStop(0.8, `hsla(186, 80%, 45%, ${p.opacity * 0.18})`);
          bubbleGradient.addColorStop(1, "transparent");
        }
        
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = bubbleGradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = isBlack
          ? `hsla(0, 0%, 100%, ${p.opacity * 0.95})`
          : isDark
          ? `hsla(0, 0%, 100%, ${p.opacity * 0.8})`
          : `hsla(0, 0%, 100%, ${p.opacity * 0.5})`;
        ctx.fill();

        // Update positions with sway
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(time * 0.02 + p.y * 0.02) * 0.5;

        // Reset if offscreen
        if (p.y < -50) {
          p.y = height + 50;
          p.x = Math.random() * width;
          p.size = Math.random() * 4 + 1;
        }
        if (p.x < -50) p.x = width;
        if (p.x > width + 50) p.x = 0;
      }

      time++;
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animate();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default AnimatedBackground;
