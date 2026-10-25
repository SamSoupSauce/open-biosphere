import React, { useState, useEffect, useRef } from 'react';
import { Box, RotateCw, Layers, Download, Maximize2, CheckCircle2, Cpu } from 'lucide-react';

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

interface ParsedMesh {
  vertices: [number, number, number][]; // [x, y, z] in mm
  faces: [number, number, number][];   // indices into vertices
}

/**
 * High-performance, zero-dependency client-side Autodesk 3DS binary chunk parser.
 * Directly extracts exact OBJ_TRIMESH vertex lists (0x4110) and face lists (0x4120).
 */
function parse3DS(buffer: ArrayBuffer): ParsedMesh | null {
  try {
    const view = new DataView(buffer);
    let offset = 0;
    const totalLength = buffer.byteLength;
    const vertices: [number, number, number][] = [];
    const faces: [number, number, number][] = [];

    function readChunks(endOffset: number) {
      while (offset < endOffset && offset + 6 <= totalLength) {
        const chunkId = view.getUint16(offset, true);
        const chunkLen = view.getUint32(offset + 2, true);
        if (chunkLen < 6 || offset + chunkLen > totalLength) break;
        const chunkEnd = offset + chunkLen;
        offset += 6;

        if (chunkId === 0x4D4D || chunkId === 0x3D3D || chunkId === 0x4100) {
          readChunks(chunkEnd);
        } else if (chunkId === 0x4000) {
          // Object chunk: skip null-terminated name
          while (offset < chunkEnd && view.getUint8(offset) !== 0) offset++;
          if (offset < chunkEnd && view.getUint8(offset) === 0) offset++;
          readChunks(chunkEnd);
        } else if (chunkId === 0x4110) {
          // TRI_VERTEXL: list of 3D floating-point vertices
          if (offset + 2 <= chunkEnd) {
            const numVerts = view.getUint16(offset, true);
            offset += 2;
            for (let i = 0; i < numVerts && offset + 12 <= chunkEnd; i++) {
              const x = view.getFloat32(offset, true);
              const y = view.getFloat32(offset + 4, true);
              const z = view.getFloat32(offset + 8, true);
              offset += 12;
              vertices.push([x, y, z]);
            }
          }
        } else if (chunkId === 0x4120) {
          // TRI_FACEL1: list of triangular faces with vertex indices
          if (offset + 2 <= chunkEnd) {
            const numFaces = view.getUint16(offset, true);
            offset += 2;
            for (let i = 0; i < numFaces && offset + 8 <= chunkEnd; i++) {
              const v1 = view.getUint16(offset, true);
              const v2 = view.getUint16(offset + 2, true);
              const v3 = view.getUint16(offset + 4, true);
              offset += 8;
              faces.push([v1, v2, v3]);
            }
          }
        }
        offset = chunkEnd;
      }
    }

    readChunks(totalLength);
    if (vertices.length > 0 && faces.length > 0) {
      return { vertices, faces };
    }
  } catch (err) {
    console.warn('Could not parse 3DS binary model:', err);
  }
  return null;
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [mesh, setMesh] = useState<ParsedMesh | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const dragPosRef = useRef({ x: 0, y: 0 });
  const rotXRef = useRef(25);
  const rotYRef = useRef(45);
  const isVisibleRef = useRef(true);

  // Monitor visibility to pause render loop when offscreen
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Load and parse exact .3ds model binary geometry
  useEffect(() => {
    let active = true;
    if (!modelUrl) return;

    fetch(modelUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => {
        if (!active) return;
        const parsed = parse3DS(buf);
        if (parsed && parsed.vertices.length > 0) {
          setMesh(parsed);
          setModelLoaded(true);
        }
      })
      .catch((err) => {
        console.debug('3DS model load fallback to dimension bounding box:', err);
      });

    return () => {
      active = false;
    };
  }, [modelUrl]);

  // Real-time Canvas Rendering Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (!isVisibleRef.current) {
        // Check back later when visible
        animId = requestAnimationFrame(render);
        return;
      }

      if (isRotating && !isDragging) {
        rotYRef.current = (rotYRef.current + 0.5) % 360;
      }

      const currentRotX = rotXRef.current;
      const currentRotY = rotYRef.current;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background CAD Coordinate Grid
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

      // Center Datum Coordinate
      const cx = w / 2;
      const cy = h / 2 + 10;

      // Rotation matrix values
      const radX = (currentRotX * Math.PI) / 180;
      const radY = (currentRotY * Math.PI) / 180;
      const cosX = Math.cos(radX);
      const sinX = Math.sin(radX);
      const cosY = Math.cos(radY);
      const sinY = Math.sin(radY);

      if (mesh && mesh.vertices.length > 0) {
        // Calculate model bounding box for automatic isometric viewport scaling
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        mesh.vertices.forEach(([vx, vy, vz]) => {
          if (vx < minX) minX = vx;
          if (vx > maxX) maxX = vx;
          if (vy < minY) minY = vy;
          if (vy > maxY) maxY = vy;
          if (vz < minZ) minZ = vz;
          if (vz > maxZ) maxZ = vz;
        });

        const spanX = maxX - minX || 10;
        const spanY = maxY - minY || 10;
        const spanZ = maxZ - minZ || 10;
        const centerOffset = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];

        const maxSpan = Math.max(spanX, spanY, spanZ, 10);
        const scale = (110 / maxSpan) * zoom;

        // Project all vertices
        const projected = mesh.vertices.map(([vx, vy, vz]) => {
          const rx = (vx - centerOffset[0]) * scale;
          const ry = (vy - centerOffset[1]) * scale;
          const rz = (vz - centerOffset[2]) * scale;

          // Rotate Y then X
          const x1 = rx * cosY + rz * sinY;
          const z1 = -rx * sinY + rz * cosY;
          const y2 = ry * cosX - z1 * sinX;
          const z2 = ry * sinX + z1 * cosX;

          return {
            px: cx + x1,
            py: cy - y2,
            pz: z2,
            x1,
            y2,
          };
        });

        // Directional Light Vector (isometric key light)
        const lx = 0.577;
        const ly = 0.577;
        const lz = 0.577;

        // Project and shade triangular faces
        interface RenderFace {
          indices: [number, number, number];
          depth: number;
          normalZ: number;
          color: string;
        }

        const renderFaces: RenderFace[] = [];

        mesh.faces.forEach(([i0, i1, i2]) => {
          if (!projected[i0] || !projected[i1] || !projected[i2]) return;
          const p0 = projected[i0];
          const p1 = projected[i1];
          const p2 = projected[i2];

          // 2D Cross product for backface culling
          const cp = (p1.px - p0.px) * (p2.py - p0.py) - (p1.py - p0.py) * (p2.px - p0.px);
          const isFrontFacing = cp <= 0;

          // Compute 3D Face Normal
          const v0 = mesh.vertices[i0];
          const v1 = mesh.vertices[i1];
          const v2 = mesh.vertices[i2];

          const ax = v1[0] - v0[0];
          const ay = v1[1] - v0[1];
          const az = v1[2] - v0[2];
          const bx = v2[0] - v0[0];
          const by = v2[1] - v0[1];
          const bz = v2[2] - v0[2];

          const nx = ay * bz - az * by;
          const ny = az * bx - ax * bz;
          const nz = ax * by - ay * bx;
          const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
          const unx = nx / len;
          const uny = ny / len;
          const unz = nz / len;

          // Rotate normal to camera space
          const rnx1 = unx * cosY + unz * sinY;
          const rnz1 = -unx * sinY + unz * cosY;
          const rny2 = uny * cosX - rnz1 * sinX;
          const rnz2 = uny * sinX + rnz1 * cosX;

          // Diffuse illumination dot product
          const intensity = Math.max(0.15, (rnx1 * lx + rny2 * ly + rnz2 * lz + 1) / 2);

          // Base theme color based on material
          let r = 56, g = 189, b = 248; // Sky cyan
          if (material.toLowerCase().includes('petg') || material.toLowerCase().includes('pla')) {
            r = 14; g = 165; b = 233;
          } else if (material.toLowerCase().includes('silicone') || material.toLowerCase().includes('rubber')) {
            r = 249; g = 115; b = 22; // Amber/Orange
          } else if (material.toLowerCase().includes('aluminum') || material.toLowerCase().includes('titanium') || material.toLowerCase().includes('steel')) {
            r = 148; g = 163; b = 184; // Metallic Slate
          } else if (material.toLowerCase().includes('optical') || material.toLowerCase().includes('acrylic')) {
            r = 168; g = 85; b = 247; // Violet
          }

          const fr = Math.min(255, Math.floor(r * intensity));
          const fg = Math.min(255, Math.floor(g * intensity));
          const fb = Math.min(255, Math.floor(b * intensity));
          const fillColor = `rgb(${fr}, ${fg}, ${fb})`;

          const avgZ = (p0.pz + p1.pz + p2.pz) / 3;

          renderFaces.push({
            indices: [i0, i1, i2],
            depth: avgZ,
            normalZ: rnz2,
            color: fillColor,
          });
        });

        // Painter's depth sorting: render farthest to closest
        renderFaces.sort((a, b) => a.depth - b.depth);

        if (!wireframe) {
          // Render shaded solid facets
          renderFaces.forEach((f) => {
            const p0 = projected[f.indices[0]];
            const p1 = projected[f.indices[1]];
            const p2 = projected[f.indices[2]];

            ctx.beginPath();
            ctx.moveTo(p0.px, p0.py);
            ctx.lineTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.closePath();

            ctx.fillStyle = f.color;
            ctx.fill();

            ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          });
        } else {
          // Wireframe mode: render high-definition edge topology
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.0;
          renderFaces.forEach((f) => {
            const p0 = projected[f.indices[0]];
            const p1 = projected[f.indices[1]];
            const p2 = projected[f.indices[2]];

            ctx.beginPath();
            ctx.moveTo(p0.px, p0.py);
            ctx.lineTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.closePath();
            ctx.stroke();
          });
        }

        // Draw Datum Coordinate Crosshair at base
        const groundY = cy + (spanY / 2) * scale;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 15, groundY);
        ctx.lineTo(cx + 15, groundY);
        ctx.moveTo(cx, groundY - 15);
        ctx.lineTo(cx, groundY + 15);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = '9px monospace';
        ctx.fillText('ORIGIN DATUM', cx + 18, groundY + 4);
      } else {
        // Fallback: Parametric Envelope Bounding Cube
        const maxDim = Math.max(dimensions.x_mm, dimensions.y_mm, dimensions.z_mm) || 100;
        const scale = (85 / maxDim) * zoom;
        const dx = (dimensions.x_mm / 2) * scale;
        const dy = (dimensions.y_mm / 2) * scale;
        const dz = (dimensions.z_mm / 2) * scale;

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

        const projected = vertices.map(([x, y, z]) => {
          const x1 = x * cosY + z * sinY;
          const z1 = -x * sinY + z * cosY;
          const y2 = y * cosX - z1 * sinX;
          const z2 = y * sinX + z1 * cosX;

          return { px: cx + x1, py: cy - y2, pz: z2 };
        });

        const faces = [
          { indices: [0, 1, 2, 3], color: '#0f172a' },
          { indices: [4, 5, 6, 7], color: '#1e293b' },
          { indices: [0, 1, 5, 4], color: '#1e293b' },
          { indices: [2, 3, 7, 6], color: '#0f172a' },
          { indices: [0, 3, 7, 4], color: '#131e32' },
          { indices: [1, 2, 6, 5], color: '#172554' },
        ];

        faces.forEach((face) => {
          ctx.beginPath();
          ctx.moveTo(projected[face.indices[0]].px, projected[face.indices[0]].py);
          for (let i = 1; i < face.indices.length; i++) {
            ctx.lineTo(projected[face.indices[i]].px, projected[face.indices[i]].py);
          }
          ctx.closePath();
          ctx.fillStyle = face.color;
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.25;
          ctx.stroke();
        });
      }

      if (isRotating || isDragging) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isRotating, wireframe, zoom, isDragging, dimensions, mesh, material]);

  // Orbit drag interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragPosRef.current.x;
    const dy = e.clientY - dragPosRef.current.y;
    dragPosRef.current = { x: e.clientX, y: e.clientY };
    rotYRef.current = (rotYRef.current + dx * 0.7) % 360;
    rotXRef.current = Math.max(-85, Math.min(85, rotXRef.current - dy * 0.7));
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div ref={containerRef} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl my-6 not-content font-sans">
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

      {/* Interactive WebGL/Canvas Viewport */}
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

        {/* Exact Geometry / Mesh Status HUD */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-950/85 border border-slate-800 rounded px-2.5 py-1 text-[11px] font-mono backdrop-blur">
          {mesh ? (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold">Exact 3DS Geometry:</span>
              <span className="text-slate-300">{mesh.vertices.length} vertices / {mesh.faces.length} faces</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sky-400">
              <Cpu className="w-3.5 h-3.5 animate-spin" />
              <span>Streaming 3DS Mesh...</span>
            </div>
          )}
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
          <span>Autodesk 3DS Canonical CAD • Drag to Orbit / Scroll to Zoom</span>
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
