import React, { useState, useEffect, useRef } from 'react';
import { Box, RotateCw, Layers, Download, Maximize2, CheckCircle2 } from 'lucide-react';

interface Props {
  modelUrl: string;
  partId: string;
  partName: string;
  material?: string;
  fabricationMethod?: string;
  dimensions?: {
    x_mm: number;
    y_mm: number;
    z_mm: number;
  };
  estimatedCost?: number;
}

export default function ModelViewer({
  modelUrl,
  partId,
  partName,
  material = 'aluminum',
  fabricationMethod = '3d-printed',
  dimensions = { x_mm: 100, y_mm: 50, z_mm: 30 },
  estimatedCost = 0.0,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [rotX, setRotX] = useState(25);
  const [rotY, setRotY] = useState(45);
  const [zoom, setZoom] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const dragPosRef = useRef({ x: 0, y: 0 });

  // 3D Canvas Rendering Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let currentRotY = rotY;

    const render = () => {
      if (isRotating && !isDragging) {
        currentRotY = (currentRotY + 0.6) % 360;
        setRotY(currentRotY);
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background Engineering Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.75;
      const gridSize = 25;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Center Coordinate
      const cx = w / 2;
      const cy = h / 2 + 10;

      // 3D Model Box representation based on real dimensions
      const maxDim = Math.max(dimensions.x_mm, dimensions.y_mm, dimensions.z_mm) || 100;
      const scale = (85 / maxDim) * zoom;
      const dx = (dimensions.x_mm / 2) * scale;
      const dy = (dimensions.y_mm / 2) * scale;
      const dz = (dimensions.z_mm / 2) * scale;

      // 8 Vertices of bounding envelope
      const vertices = [
        [-dx, -dy, -dz],
        [dx, -dy, -dz],
        [dx, dy, -dz],
        [-dx, dy, -dz],
        [-dx, -dy, dz],
        [dx, -dy, dz],
        [dx, dy, dz],
        [-dx, dy, dz],
      ];

      // Rotation transforms
      const radX = (rotX * Math.PI) / 180;
      const radY = (currentRotY * Math.PI) / 180;

      const cosX = Math.cos(radX);
      const sinX = Math.sin(radX);
      const cosY = Math.cos(radY);
      const sinY = Math.sin(radY);

      const projected = vertices.map(([x, y, z]) => {
        // Rotate Y
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        // Rotate X
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        // Orthographic projection
        return {
          px: cx + x1,
          py: cy - y2,
          pz: z2,
        };
      });

      // Faces definition
      const faces = [
        { indices: [0, 1, 2, 3], normalZ: -1, color: '#0f172a' }, // Back
        { indices: [4, 5, 6, 7], normalZ: 1, color: '#1e293b' },  // Front
        { indices: [0, 1, 5, 4], normalZ: -1, color: '#1e293b' }, // Top
        { indices: [2, 3, 7, 6], normalZ: 1, color: '#0f172a' },  // Bottom
        { indices: [0, 3, 7, 4], normalZ: -1, color: '#131e32' }, // Left
        { indices: [1, 2, 6, 5], normalZ: 1, color: '#172554' },  // Right
      ];

      // Draw Shaded Solid Faces if not wireframe
      if (!wireframe) {
        // Sort faces by average depth (Painter's algorithm)
        const sortedFaces = [...faces].sort((a, b) => {
          const avgZA = a.indices.reduce((sum, idx) => sum + projected[idx].pz, 0) / 4;
          const avgZB = b.indices.reduce((sum, idx) => sum + projected[idx].pz, 0) / 4;
          return avgZA - avgZB;
        });

        sortedFaces.forEach((face) => {
          ctx.beginPath();
          ctx.moveTo(projected[face.indices[0]].px, projected[face.indices[0]].py);
          for (let i = 1; i < face.indices.length; i++) {
            ctx.lineTo(projected[face.indices[i]].px, projected[face.indices[i]].py);
          }
          ctx.closePath();

          ctx.fillStyle = face.color;
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      } else {
        // Wireframe Edges
        const edges = [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7],
        ];

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.75;
        edges.forEach(([i, j]) => {
          ctx.beginPath();
          ctx.moveTo(projected[i].px, projected[i].py);
          ctx.lineTo(projected[j].px, projected[j].py);
          ctx.stroke();
        });
      }

      // Draw Corner Vertices / Datum Points
      projected.forEach((p) => {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(p.px, p.py, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Spatial Datum Marker at center base
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy + dy);
      ctx.lineTo(cx + 15, cy + dy);
      ctx.moveTo(cx, cy + dy - 15);
      ctx.lineTo(cx, cy + dy + 15);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = '9px monospace';
      ctx.fillText('DATUM Z=0', cx + 18, cy + dy + 4);

      if (isRotating && !isDragging) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isRotating, wireframe, rotX, rotY, zoom, isDragging, dimensions]);

  // Mouse / Touch Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragPosRef.current.x;
    const dy = e.clientY - dragPosRef.current.y;
    dragPosRef.current = { x: e.clientX, y: e.clientY };
    setRotY((prev) => (prev + dx * 0.7) % 360);
    setRotX((prev) => Math.max(-80, Math.min(80, prev - dy * 0.7)));
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl my-6 not-content font-sans">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-sky-400" />
          <span className="font-mono text-xs font-bold text-sky-400">{partId}</span>
          <span className="text-slate-500 font-mono text-xs">•</span>
          <span className="text-xs text-slate-300 font-medium truncate max-w-[200px] sm:max-w-xs">{partName}</span>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/40 text-sky-300 font-mono uppercase text-[10px]">
            {fabricationMethod}
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 font-mono uppercase text-[10px]">
            {material}
          </span>
          {estimatedCost > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/40 text-amber-300 font-mono font-bold text-[10px]">
              ${estimatedCost.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Interactive WebGL Canvas Viewport */}
      <div
        className="relative bg-gradient-to-b from-[#0a0f1d] to-[#030712] cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          width={720}
          height={320}
          className="w-full h-[320px] block"
        />

        {/* Floating Viewport Controls */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 shadow-lg backdrop-blur">
          <button
            onClick={() => setIsRotating(!isRotating)}
            title={isRotating ? 'Pause Rotation' : 'Auto Rotate'}
            className={`p-1.5 rounded transition ${isRotating ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWireframe(!wireframe)}
            title={wireframe ? 'Shaded View' : 'Wireframe View'}
            className={`p-1.5 rounded transition ${wireframe ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setRotX(25);
              setRotY(45);
              setZoom(1.0);
            }}
            title="Reset Perspective"
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Bounding Dimensions HUD */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-slate-950/80 border border-slate-800/80 rounded px-2.5 py-1 text-[11px] font-mono text-slate-300 backdrop-blur">
          <span>X: <strong className="text-sky-400">{dimensions.x_mm}</strong>mm</span>
          <span>Y: <strong className="text-sky-400">{dimensions.y_mm}</strong>mm</span>
          <span>Z: <strong className="text-sky-400">{dimensions.z_mm}</strong>mm</span>
        </div>
      </div>

      {/* Footer / Asset Download Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Interactive 3D Preview • Drag to Orbit / Scroll to Zoom</span>
        </div>

        <a
          href={modelUrl}
          download
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-md font-mono text-xs font-semibold transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download model.3ds</span>
        </a>
      </div>
    </div>
  );
}
