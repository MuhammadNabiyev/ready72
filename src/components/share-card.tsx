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
  const display = root.getPropertyValue("--font-archivo").trim() || "Arial, sans-serif";
  const sans = root.getPropertyValue("--font-hanken").trim() || "Arial, sans-serif";
  const mono = root.getPropertyValue("--font-plex-mono").trim() || "monospace";
  const INK = "#221f1b";
  const PAPER = "#f6f2e9";
  const SIGNAL = "#e8741c";

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.lineWidth = 10;
  ctx.strokeStyle = INK;
  ctx.strokeRect(5, 5, W - 10, H - 10);

  // logo
  ctx.beginPath();
  ctx.arc(92, 92, 26, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(92, 92);
  ctx.arc(92, 92, 22, -Math.PI / 2, -Math.PI / 6);
  ctx.closePath();
  ctx.fillStyle = SIGNAL;
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = `800 44px ${display}`;
  ctx.fillText("Ready", 132, 106);
  const w = ctx.measureText("Ready").width;
  ctx.fillStyle = "#b5481a";
  ctx.fillText("72", 132 + w, 106);

  ctx.fillStyle = "#5d574f";
  ctx.font = `500 26px ${mono}`;
  ctx.fillText(card.household.toUpperCase().slice(0, 40), 80, 190);

  ctx.fillStyle = INK;
  ctx.font = `800 104px ${display}`;
  ctx.fillText("Ready for", 80, 300);
  const t = `${card.daysCovered}`;
  ctx.fillStyle = "#b5481a";
  ctx.fillText(t, 80, 410);
  const tw = ctx.measureText(t).width;
  ctx.fillStyle = INK;
  ctx.fillText(` of ${card.target} days.`, 80 + tw, 410);

  // gauge
  const total = 40;
  const on = Math.round((card.score / 100) * total);
  const gx = 80;
  const gw = W - 160;
  const gap = 6;
  const bw = (gw - gap * (total - 1)) / total;
  for (let i = 0; i < total; i++) {
    const h = i % 5 === 4 ? 70 : 56;
    const x = gx + i * (bw + gap);
    const y = 520 - h;
    if (i < on) {
      ctx.fillStyle = SIGNAL;
      ctx.fillRect(x, y, bw, h);
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      ctx.strokeRect(x, y, bw, h);
    } else {
      ctx.fillStyle = "#d8d2c5";
      ctx.fillRect(x, y, bw, h);
    }
  }

  ctx.fillStyle = INK;
  ctx.font = `700 34px ${sans}`;
  ctx.fillText(`Readiness ${card.score}/100 · ${card.level}`, 80, 575);
  ctx.textAlign = "right";
  ctx.font = `500 24px ${mono}`;
  ctx.fillStyle = "#5d574f";
  ctx.fillText(`${window.location.host}`, W - 80, 575);
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
      <canvas ref={ref} width={W} height={H} className="w-full rounded border-2 border-ink" data-testid="share-canvas" aria-label={`Readiness card: ${card.text}`} role="img" />
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
