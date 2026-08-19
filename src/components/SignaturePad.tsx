'use client';

import { useRef, useState } from 'react';

export function SignaturePad({ onAccept }: { onAccept: (dataUrl: string, signerName: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [name, setName] = useState('');

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const point = 'touches' in e ? e.touches[0] : e;
    return { x: (point.clientX - rect.left) * (canvas.width / rect.width), y: (point.clientY - rect.top) * (canvas.height / rect.height) };
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  }
  function end() {
    drawing.current = false;
  }
  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom complet" className="input mb-3" required />
      <canvas
        ref={canvasRef}
        width={500}
        height={180}
        className="w-full border-2 border-dashed border-ink-300 rounded-xl bg-white touch-none"
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <div className="flex gap-2 mt-3">
        <button type="button" onClick={clear} className="btn-secondary btn-sm">Effacer</button>
        <button
          type="button"
          disabled={!hasDrawn || !name.trim()}
          onClick={() => onAccept(canvasRef.current!.toDataURL('image/png'), name.trim())}
          className="btn-primary btn-sm flex-1"
        >
          Signer et accepter le devis
        </button>
      </div>
      <p className="text-[11px] text-ink-400 mt-2">En signant, vous acceptez ce devis dans son intégralité. Un historique de signature est conservé.</p>
    </div>
  );
}
