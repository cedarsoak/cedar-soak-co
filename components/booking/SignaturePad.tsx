"use client";

import { PointerEvent, useCallback, useEffect, useRef, useState } from "react";

interface Props {
  onChange: (dataUrl: string | null) => void;
}

/** Finger / mouse signature box. Returns a PNG data URL (transparent background). */
export default function SignaturePad({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const inkLength = useRef(0);
  const [hasInk, setHasInk] = useState(false);

  const setup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1E1712";
    inkLength.current = 0;
    setHasInk(false);
    onChange(null);
  }, [onChange]);

  useEffect(() => {
    setup();
    // Resizing clears the canvas, so only re-setup when the width really changes.
    let width = canvasRef.current?.getBoundingClientRect().width ?? 0;
    const onResize = () => {
      const w = canvasRef.current?.getBoundingClientRect().width ?? 0;
      if (Math.abs(w - width) > 2) {
        width = w;
        setup();
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function point(e: PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function down(e: PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
    const ctx = e.currentTarget.getContext("2d");
    if (ctx && last.current) {
      ctx.beginPath();
      ctx.arc(last.current.x, last.current.y, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = "#1E1712";
      ctx.fill();
    }
  }

  function move(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return;
    e.preventDefault();
    const p = point(e);
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    inkLength.current += Math.hypot(p.x - last.current.x, p.y - last.current.y);
    last.current = p;
  }

  function up() {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (inkLength.current > 40) {
      setHasInk(true);
      onChange(canvas.toDataURL("image/png"));
    }
  }

  return (
    <div className="bk-sig">
      <canvas
        ref={canvasRef}
        className="bk-sig-canvas"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
        aria-label="Signature pad — draw your signature with your finger or mouse"
        role="img"
      />
      <div className="bk-sig-foot">
        <span>{hasInk ? "Signature captured" : "Sign above with your finger or mouse"}</span>
        <button type="button" className="bk-link" onClick={setup}>
          Clear
        </button>
      </div>
    </div>
  );
}
