'use client';

import { useCallback, useEffect, useRef, useState, ReactNode } from 'react';

interface ScratchCardProps {
  children: ReactNode;
  /** Text printed on the foil before scratching. */
  label?: string;
  foilFrom?: string;
  foilTo?: string;
  labelColor?: string;
  onRevealed?: () => void;
}

/** Fraction of the foil that must be scratched away before it auto-clears. */
const REVEAL_THRESHOLD = 0.45;
const BRUSH_RADIUS = 22;

export default function ScratchCard({
  children,
  label = 'גרדו כאן כדי לגלות',
  foilFrom = '#c9a463',
  foilTo = '#9d7b3f',
  labelColor = '#ffffff',
  onRevealed,
}: ScratchCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const revealedRef = useRef(false);
  const [revealed, setRevealed] = useState(false);

  const paintFoil = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || revealedRef.current) return;

    const rect = wrap.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, foilFrom);
    gradient.addColorStop(0.5, foilTo);
    gradient.addColorStop(1, foilFrom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Subtle diagonal sheen so it reads as scratch-off foil
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 12;
    for (let x = -rect.height; x < rect.width; x += 34) {
      ctx.beginPath();
      ctx.moveTo(x, rect.height);
      ctx.lineTo(x + rect.height, 0);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = labelColor;
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, rect.width / 2, rect.height / 2);
  }, [foilFrom, foilTo, label, labelColor]);

  const finishReveal = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setRevealed(true);
    onRevealed?.();
  }, [onRevealed]);

  const scratchProgress = useCallback((): number => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return 0;

    const { width, height } = canvas;
    if (!width || !height) return 0;

    const data = ctx.getImageData(0, 0, width, height).data;
    let clear = 0;
    let total = 0;
    // Sample every 8th pixel — plenty accurate and much cheaper.
    for (let i = 3; i < data.length; i += 4 * 8) {
      total++;
      if (data[i] < 40) clear++;
    }
    return total ? clear / total : 0;
  }, []);

  const scratchAt = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !wrap || !ctx) return;

    const rect = wrap.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = BRUSH_RADIUS * 2;

    const last = lastPointRef.current;
    ctx.beginPath();
    if (last) {
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    lastPointRef.current = { x, y };
  }, []);

  useEffect(() => {
    paintFoil();
    const wrap = wrapRef.current;
    if (!wrap) return;

    const observer = new ResizeObserver(() => paintFoil());
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [paintFoil]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (revealedRef.current) return;
    drawingRef.current = true;
    lastPointRef.current = null;
    try {
      // Throws InvalidPointerId in some browsers; scratching still works without capture.
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    scratchAt(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || revealedRef.current) return;
    scratchAt(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    if (scratchProgress() >= REVEAL_THRESHOLD) finishReveal();
  };

  return (
    <div className="relative">
      <div
        ref={wrapRef}
        className="relative rounded-xl overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        <div aria-hidden={!revealed}>{children}</div>

        {!revealed && (
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute inset-0 cursor-grab active:cursor-grabbing transition-opacity duration-500"
            style={{ opacity: revealed ? 0 : 1 }}
          />
        )}
      </div>

      {!revealed && (
        // Scratching needs a pointer; this keeps the content reachable by
        // keyboard, screen readers, and anyone who'd rather just tap.
        <button onClick={finishReveal} className="btn-ghost !py-1.5 !px-3 text-xs mt-2">
          לא מצליחים לגרד? לחצו לגילוי
        </button>
      )}
    </div>
  );
}
