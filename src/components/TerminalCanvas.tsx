import { useEffect, useRef } from "react";

const FRAME_INTERVAL = 1000 / 24;
const GRID_X = 72;
const GRID_Y = 52;

function marketY(x: number, width: number, height: number, time: number, offset = 0) {
  const progress = x / Math.max(width, 1);
  return height * (0.31 + offset)
    + Math.sin(progress * 9.2 + time * 0.24) * 28
    + Math.sin(progress * 25.5 - time * 0.14) * 9
    + Math.cos(progress * 4.1 + time * 0.08) * 18;
}

function drawPath(context: CanvasRenderingContext2D, width: number, height: number, time: number, color: string, offset: number, lineWidth: number) {
  context.beginPath();
  for (let x = -8; x <= width + 8; x += 8) {
    const y = marketY(x, width, height, time, offset);
    if (x === -8) context.moveTo(x, y); else context.lineTo(x, y);
  }
  context.lineWidth = lineWidth;
  context.strokeStyle = color;
  context.stroke();
}

function drawMarketField(context: CanvasRenderingContext2D, width: number, height: number, milliseconds: number, animated: boolean) {
  const time = animated ? milliseconds / 1000 : 0;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#070b0f";
  context.fillRect(0, 0, width, height);

  const gridShift = animated ? (time * 4) % GRID_X : 0;
  context.lineWidth = 1;
  for (let x = -GRID_X; x <= width + GRID_X; x += GRID_X) {
    const major = Math.round((x + GRID_X) / GRID_X) % 4 === 0;
    context.strokeStyle = major ? "rgba(103,132,151,.16)" : "rgba(103,132,151,.075)";
    context.beginPath();
    context.moveTo(x - gridShift + 0.5, 0);
    context.lineTo(x - gridShift + 0.5, height);
    context.stroke();
  }
  for (let y = 0; y <= height; y += GRID_Y) {
    context.strokeStyle = y % (GRID_Y * 4) === 0 ? "rgba(103,132,151,.15)" : "rgba(103,132,151,.07)";
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(width, y + 0.5);
    context.stroke();
  }

  context.font = "9px Consolas, monospace";
  context.fillStyle = "rgba(125,151,167,.28)";
  context.fillText("MARKET DEPTH", 24, 30);
  context.fillText("LIVE FIELD / UTC+8", Math.max(24, width - 146), height - 22);

  drawPath(context, width, height, time, "rgba(78,205,166,.40)", 0, 1.4);
  drawPath(context, width, height, time + 2.4, "rgba(89,172,224,.24)", 0.13, 1);

  const pulseProgress = animated ? (time * 0.055) % 1 : 0.42;
  const pulseX = pulseProgress * width;
  const pulseY = marketY(pulseX, width, height, time, 0);
  context.fillStyle = "rgba(78,205,166,.72)";
  context.fillRect(pulseX - 2, pulseY - 2, 5, 5);
  context.strokeStyle = "rgba(78,205,166,.24)";
  context.strokeRect(pulseX - 7.5, pulseY - 7.5, 15, 15);

  const candleGap = 44;
  const candleWidth = 11;
  const candleShift = animated ? (time * 4.5) % candleGap : 0;
  for (let index = -2; index < Math.ceil(width / candleGap) + 3; index += 1) {
    const x = index * candleGap - candleShift;
    const baseline = height * 0.57 + Math.sin(index * 0.64 + time * 0.14) * 52 + Math.cos(index * 0.27) * 20;
    const open = baseline + Math.sin(index * 1.34 + time * 0.32) * 12;
    const close = baseline + Math.cos(index * 1.08 + time * 0.26) * 13;
    const high = Math.min(open, close) - 12 - Math.abs(index % 3) * 3;
    const low = Math.max(open, close) + 12 + Math.abs(index % 4) * 2;
    const rising = close < open;
    context.strokeStyle = rising ? "rgba(79,209,165,.34)" : "rgba(255,116,127,.30)";
    context.fillStyle = rising ? "rgba(79,209,165,.22)" : "rgba(255,116,127,.18)";
    context.beginPath();
    context.moveTo(x + candleWidth / 2, high);
    context.lineTo(x + candleWidth / 2, low);
    context.stroke();
    context.fillRect(x, Math.min(open, close), candleWidth, Math.max(3, Math.abs(close - open)));
  }

  const depthCenter = width * 0.83;
  for (let row = -13; row <= 13; row += 1) {
    const y = height * 0.54 + row * 11;
    const magnitude = 34 + Math.abs(Math.sin(row * 0.73 + time * 0.38)) * Math.min(150, width * 0.13);
    if (row === 0) {
      context.strokeStyle = "rgba(233,183,91,.42)";
      context.beginPath();
      context.moveTo(depthCenter - magnitude, y + 0.5);
      context.lineTo(Math.min(width, depthCenter + 36), y + 0.5);
      context.stroke();
    } else {
      context.fillStyle = row > 0 ? "rgba(79,209,165,.12)" : "rgba(255,116,127,.10)";
      context.fillRect(depthCenter - magnitude, y, magnitude, 6);
    }
  }

  const volumeBase = height - 38;
  for (let x = 16; x < width; x += 28) {
    const volume = 5 + Math.abs(Math.sin(x * 0.026 + time * 0.3)) * 26;
    context.fillStyle = x % 56 === 0 ? "rgba(96,188,232,.16)" : "rgba(79,209,165,.12)";
    context.fillRect(x, volumeBase - volume, 12, volume);
  }

  const scannerX = animated ? (time * 32) % (width + 120) - 60 : width * 0.48;
  context.strokeStyle = "rgba(96,188,232,.24)";
  context.beginPath();
  context.moveTo(scannerX + 0.5, 0);
  context.lineTo(scannerX + 0.5, height);
  context.stroke();
}

export function TerminalCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;
    let previousFrame = 0;
    let paused = document.hidden;
    let width = 0;
    let height = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawMarketField(context, width, height, performance.now(), !motionPreference.matches);
    };

    const render = (time: number) => {
      if (!paused && !motionPreference.matches && time - previousFrame >= FRAME_INTERVAL) {
        previousFrame = time;
        drawMarketField(context, width, height, time, true);
      }
      animationFrame = window.requestAnimationFrame(render);
    };
    const onVisibility = () => { paused = document.hidden; if (!paused) previousFrame = 0; };
    const onMotionPreference = () => drawMarketField(context, width, height, performance.now(), !motionPreference.matches);

    resize();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    motionPreference.addEventListener("change", onMotionPreference);
    if (!motionPreference.matches) animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      motionPreference.removeEventListener("change", onMotionPreference);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="terminal-canvas pointer-events-none fixed inset-0 z-0" />;
}
