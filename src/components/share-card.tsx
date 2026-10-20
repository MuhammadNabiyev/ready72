"use client";

import { useEffect, useRef } from "react";
import { Copy, Download } from "lucide-react";
import { shareCard, type ShareCard } from "@/lib/features";
import { useApp } from "@/lib/store";
import { Modal, toast } from "./ui";

const W = 1200;
const H = 630;

function draw(canvas: HTMLCanvasElement, card: ShareCard) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const root = getComputedStyle(document.documentElement);
  const display = root.getPropertyValue("--font-overpass").trim() || "Arial, sans-serif";
  const sans = root.getPropertyValue("--font-overpass").trim() || "Arial, sans-serif";
  const mono = root.getPropertyValue("--font-overpass-mono").trim() || "monospace";
  const INK = "#1b2b27";
  const GREEN = "#265a49";
  const YELLOW = "#dcb24f";
  const WHITE = "#ffffff";

  ctx.fillStyle = "#f1efe8";
  ctx.fillRect(0, 0, W, H);
  // the sign: green plate, white keyline
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  };
  rr(30, 30, W - 60, H - 60, 38);
  ctx.fillStyle = GREEN;
  ctx.fill();
  rr(52, 52, W - 104, H - 104, 26);
  ctx.lineWidth = 7;
  ctx.strokeStyle = WHITE;
  ctx.stroke();

  ctx.fillStyle = WHITE;
  ctx.font = `800 40px ${sans}`;
  ctx.fillText("Ready", 100, 128);
  const w = ctx.measureText("Ready").width;
  ctx.fillStyle = YELLOW;
  ctx.fillText("72", 100 + w, 128);

  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = `700 24px ${mono}`;
  ctx.textAlign = "right";
  ctx.fillText(card.household.toUpperCase().slice(0, 36), W - 100, 126);
  ctx.textAlign = "left";

  ctx.fillStyle = WHITE;
  ctx.font = `900 112px ${display}`;
  ctx.fillText("Ready for", 100, 270);
  const t = `${card.daysCovered}`;
  const tw = ctx.measureText(t).width;
  rr(96, 292, tw + 28, 124, 16);
  ctx.fillStyle = YELLOW;
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.fillText(t, 110, 396);
  ctx.fillStyle = WHITE;
  ctx.fillText(` of ${card.target} days.`, 110 + tw + 14, 396);

  // segmented ruler
  const total = 20;
  const on = Math.round(card.score / 5);
  const gx = 100;
  const gw = W - 200;
  const gap = 8;
  const bw = (gw - gap * (total - 1)) / total;
  for (let i = 0; i < total; i++) {
    ctx.globalAlpha = i < on ? 1 : 0.25;
    ctx.fillStyle = WHITE;
    ctx.fillRect(gx + i * (bw + gap), 455, bw, 40);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = WHITE;
  ctx.font = `800 32px ${sans}`;
  ctx.fillText(`Readiness ${card.score}/100 · ${card.level}`, 100, 540);
  ctx.textAlign = "right";
  ctx.font = `500 22px ${mono}`;
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillText(`${window.location.host}`, W - 100, 540);
  ctx.textAlign = "left";
}

export function ShareCardDialog({ onClose }: { onClose: () => void }) {
  const state = useApp();
  const ref = useRef<HTMLCanvasElement>(null);
  const card = shareCard(state, new Date());

  useEffect(() => {
    // the dialog mounts its content a tick later; wait one frame so the canvas exists
    const id = requestAnimationFrame(() => ref.current && draw(ref.current, card));
    return () => cancelAnimationFrame(id);
  }, [card.score, card.daysCovered, card.household]); // eslint-disable-line react-hooks/exhaustive-deps

  function download() {
    ref.current?.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "ready72-readiness.png";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Image saved");
    }, "image/png");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(card.text);
      toast("Text copied");
    } catch {
      toast("Copy is blocked in this browser");
    }
  }

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title="Share your readiness" description="A card with your score, ready to post. It shows the household name, score and days covered, never your kit or contacts." testId="share-dialog" wide>
      <canvas ref={ref} width={W} height={H} className="w-full rounded-xl border border-rule-strong" data-testid="share-canvas" aria-label={`Readiness card: ${card.text}`} role="img" />
      <p className="mt-4 text-ink-soft" data-testid="share-text">{card.text}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={download} data-testid="share-download">
          <Download className="size-4" aria-hidden />
          Download image
        </button>
        <button type="button" className="btn" onClick={copy} data-testid="share-copy">
          <Copy className="size-4" aria-hidden />
          Copy text
        </button>
      </div>
    </Modal>
  );
}
