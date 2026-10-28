import React, { useState, useEffect, useRef } from 'react';
import { Box, RotateCw, Layers, Download, Maximize2, CheckCircle2, Cpu, Palette } from 'lucide-react';

export interface CameraStepConfig {
  panStep: number;      // World units per click (default: 50mm)
  zoomStep: number;     // Distance delta per click (default: 100mm)
  rotateStep: number;   // Radians per click (default: Math.PI / 12)
}

export interface MeshValidationReport {
  isManifold: boolean;
  hasZeroThickness: boolean;
  recomputedNormals: boolean;
  boundingBoxVolume: number;
}

/**
 * Procedural mesh integrity and normal rectification pipeline (RFC-017 Section 3).
 * Supports standard Three.js Mesh instances as well as internal client-side parsed geometries.
 */
export function auditAndSanitizeMesh(mesh: any): MeshValidationReport {
  const report: MeshValidationReport = {
    isManifold: true,
    hasZeroThickness: false,
    recomputedNormals: false,
    boundingBoxVolume: 0,
  };

  if (!mesh) return report;

  // Branch 1: Three.js Mesh or Object3D with buffer geometry
  if (mesh.geometry) {
    const geometry = mesh.geometry;
    if (!geometry.index) {
      // Weld duplicate vertices or track indexed topology if method available
    }

    if (typeof geometry.computeBoundingBox === 'function') {
      geometry.computeBoundingBox();
      if (geometry.boundingBox) {
        const min = geometry.boundingBox.min;
        const max = geometry.boundingBox.max;
        const dx = Math.abs(max.x - min.x);
        const dy = Math.abs(max.y - min.y);
        const dz = Math.abs(max.z - min.z);
        report.boundingBoxVolume = dx * dy * dz;
        if (dx <= 0.001 || dy <= 0.001 || dz <= 0.001) {
          report.hasZeroThickness = true;
          console.warn('[RFC-017] Degenerate thin geometry detected:', { dx, dy, dz });
        }
      }
    }

    if (typeof geometry.computeVertexNormals === 'function') {
      geometry.computeVertexNormals();
      report.recomputedNormals = true;
    }

    // Material Fallback Guardrail (THREE.DoubleSide = 2)
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat: any) => {
          mat.side = 2;
          mat.shadowSide = 2;
        });
      } else {
        mesh.material.side = 2;
        mesh.material.shadowSide = 2;
      }
    }
    return report;
  }

  // Branch 2: ParsedMesh ({ vertices, faces })
  if (mesh.vertices && mesh.faces) {
    const verts = mesh.vertices;
    const faces = mesh.faces;
    if (verts.length === 0 || faces.length === 0) return report;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < verts.length; i++) {
      const [x, y, z] = verts[i];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    const dx = Math.max(0, maxX - minX);
    const dy = Math.max(0, maxY - minY);
    const dz = Math.max(0, maxZ - minZ);
    report.boundingBoxVolume = dx * dy * dz;
    if (dx <= 0.001 || dy <= 0.001 || dz <= 0.001) {
      report.hasZeroThickness = true;
      console.warn('[RFC-017] Degenerate thin geometry detected:', { dx, dy, dz });
    }

    // Manifold check: every undirected edge must connect to exactly two faces
    const edgeCounts = new Map<string, number>();
    for (let i = 0; i < faces.length; i++) {
      const [a, b, c] = faces[i];
      const e0 = a < b ? `${a}_${b}` : `${b}_${a}`;
      const e1 = b < c ? `${b}_${c}` : `${c}_${b}`;
      const e2 = c < a ? `${c}_${a}` : `${a}_${c}`;
      edgeCounts.set(e0, (edgeCounts.get(e0) || 0) + 1);
      edgeCounts.set(e1, (edgeCounts.get(e1) || 0) + 1);
      edgeCounts.set(e2, (edgeCounts.get(e2) || 0) + 1);
    }
    let nonTwo = 0;
    for (const count of edgeCounts.values()) {
      if (count !== 2) nonTwo++;
    }
    report.isManifold = nonTwo === 0;

    // Normal recalculation and outward orientation audit
    const mcx = verts.reduce((s: number, v: number[]) => s + v[0], 0) / verts.length;
    const mcy = verts.reduce((s: number, v: number[]) => s + v[1], 0) / verts.length;
    const mcz = verts.reduce((s: number, v: number[]) => s + v[2], 0) / verts.length;
    let outwardSum = 0;
    for (let fi = 0; fi < faces.length; fi++) {
      const [a, b, c] = faces[fi];
      const v0 = verts[a], v1 = verts[b], v2 = verts[c];
      if (!v0 || !v1 || !v2) continue;
      const ax = v1[0] - v0[0], ay = v1[1] - v0[1], az = v1[2] - v0[2];
      const bx = v2[0] - v0[0], by = v2[1] - v0[1], bz = v2[2] - v0[2];
      const fnx = ay * bz - az * by;
      const fny = az * bx - ax * bz;
      const fnz = ax * by - ay * bx;
      const fcx = (v0[0] + v1[0] + v2[0]) / 3 - mcx;
      const fcy = (v0[1] + v1[1] + v2[1]) / 3 - mcy;
      const fcz = (v0[2] + v1[2] + v2[2]) / 3 - mcz;
      outwardSum += (fnx * fcx + fny * fcy + fnz * fcz);
    }
    if (outwardSum < 0) {
      mesh.faces = faces.map(([a, b, c]: [number, number, number]) => [a, c, b]);
    }
    report.recomputedNormals = true;
  }

  return report;
}

/**
 * Deterministic Three.js / WebGL camera controller reference implementation (RFC-016 Section 5.1).
 */
export class BiosphereCameraController {
  private camera: any;
  private target: any;
  private config: CameraStepConfig;

  constructor(camera: any, target: any, config?: Partial<CameraStepConfig>) {
    this.camera = camera;
    this.target = target;
    this.config = {
      panStep: 50,
      zoomStep: 100,
      rotateStep: Math.PI / 12,
      ...config,
    };
  }

  // --- ZOOM ---
  public zoomIn(): void {
    if (this.camera?.position && this.target) {
      const dir = {
        x: this.target.x - this.camera.position.x,
        y: this.target.y - this.camera.position.y,
        z: this.target.z - this.camera.position.z,
      };
      const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z) || 1;
      this.camera.position.x += (dir.x / len) * this.config.zoomStep;
      this.camera.position.y += (dir.y / len) * this.config.zoomStep;
      this.camera.position.z += (dir.z / len) * this.config.zoomStep;
    }
  }

  public zoomOut(): void {
    if (this.camera?.position && this.target) {
      const dir = {
        x: this.target.x - this.camera.position.x,
        y: this.target.y - this.camera.position.y,
        z: this.target.z - this.camera.position.z,
      };
      const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z) || 1;
      this.camera.position.x -= (dir.x / len) * this.config.zoomStep;
      this.camera.position.y -= (dir.y / len) * this.config.zoomStep;
      this.camera.position.z -= (dir.z / len) * this.config.zoomStep;
    }
  }

  // --- ROTATION (Vertical Row) ---
  public rotateYaw(direction: 1 | -1): void {
    const angle = direction * this.config.rotateStep;
    if (this.camera?.position && this.target) {
      const dx = this.camera.position.x - this.target.x;
      const dz = this.camera.position.z - this.target.z;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      this.camera.position.x = this.target.x + (dx * cosA - dz * sinA);
      this.camera.position.z = this.target.z + (dx * sinA + dz * cosA);
    }
  }

  public rotatePitch(direction: 1 | -1): void {
    const angle = direction * this.config.rotateStep;
    if (this.camera?.position && this.target) {
      const dist = Math.sqrt(
        Math.pow(this.camera.position.x - this.target.x, 2) +
        Math.pow(this.camera.position.z - this.target.z, 2)
      );
      this.camera.position.y += Math.sin(angle) * (dist || 100);
    }
  }

  // --- TRANSLATION ---
  public panHorizontal(direction: 1 | -1): void {
    const delta = direction * this.config.panStep;
    if (this.camera?.position) this.camera.position.x += delta;
    if (this.target) this.target.x += delta;
  }

  public panVertical(direction: 1 | -1): void {
    const delta = direction * this.config.panStep;
    if (this.camera?.position) this.camera.position.y += delta;
    if (this.target) this.target.y += delta;
  }

  public panDepth(direction: 1 | -1): void {
    const delta = direction * this.config.panStep;
    if (this.camera?.position) this.camera.position.z += delta;
    if (this.target) this.target.z += delta;
  }
}

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
  focusStep?: number;
  initialWireframe?: boolean;
  isComposite?: boolean;
}

interface ParsedMesh {
  vertices: [number, number, number][]; // [x, y, z] in mm
  faces: [number, number, number][];   // indices into vertices
  faceColors?: [number, number, number][]; // [r, g, b] 0..255 per face
  vertexColors?: [number, number, number][]; // [r, g, b] 0..255 per vertex
  format?: 'gltf' | 'glb';
  solidCount?: number;
  contrastColors?: [number, number, number][];
  nativeColors?: [number, number, number][];
  subAssemblies?: {
    name: string;
    partId?: string;
    focusStep?: number;
    startIndex: number;
    vertexCount: number;
  }[];
}

export const VIVID_CONTRAST_PALETTE: [number, number, number][] = [
  [14, 165, 233],  // Electric Cyan (#0ea5e9)
  [245, 158, 11],  // Amber Gold (#f59e0b)
  [16, 185, 129],  // Emerald Green (#10b981)
  [239, 68, 68],   // Crimson Coral (#ef4444)
  [168, 85, 247],  // Vivid Violet (#a855f7)
  [249, 115, 22],  // Safety Orange (#f97316)
  [236, 72, 153],  // Hot Pink / Magenta (#ec4899)
  [6, 182, 212],   // Bright Turquoise (#06b6d4)
  [132, 204, 22],  // Electric Lime (#84cc16)
  [99, 102, 241],  // Royal Indigo (#6366f1)
  [234, 179, 8],   // Sunbeam Yellow (#eab308)
  [244, 63, 94],   // Bright Rose (#f43f5e)
  [59, 130, 246],  // Cobalt Blue (#3b82f6)
  [217, 70, 239],  // Electric Fuchsia (#d946ef)
  [20, 184, 166],  // Teal (#14b8a6)
  [251, 146, 60],  // Light Orange (#fb923c)
];

/**
 * Automatically segments any 3D CAD mesh into connected solid bodies and geometric
 * feature partitions, assigning vividly contrasting high-saturation colors.
 */
export function autoAssignVividColors(mesh: ParsedMesh): void {
  if (!mesh || !mesh.faces || mesh.faces.length === 0 || !mesh.vertices || mesh.vertices.length === 0) {
    return;
  }

  const numFaces = mesh.faces.length;
  const numVerts = mesh.vertices.length;

  // 1. Identify connected components (disjoint solid bodies) via Union-Find
  const parent = new Int32Array(numFaces);
  for (let i = 0; i < numFaces; i++) parent[i] = i;

  function find(i: number): number {
    let root = i;
    while (parent[root] !== root) root = parent[root];
    let curr = i;
    while (curr !== root) {
      const next = parent[curr];
      parent[curr] = root;
      curr = next;
    }
    return root;
  }

  function union(i: number, j: number) {
    const ri = find(i);
    const rj = find(j);
    if (ri !== rj) parent[ri] = rj;
  }

  const vertToFaces: number[][] = Array.from({ length: numVerts }, () => []);
  for (let fIdx = 0; fIdx < numFaces; fIdx++) {
    const [i0, i1, i2] = mesh.faces[fIdx];
    if (i0 < numVerts) vertToFaces[i0].push(fIdx);
    if (i1 < numVerts) vertToFaces[i1].push(fIdx);
    if (i2 < numVerts) vertToFaces[i2].push(fIdx);
  }

  for (let v = 0; v < numVerts; v++) {
    const flist = vertToFaces[v];
    if (flist.length > 1) {
      const first = flist[0];
      for (let k = 1; k < flist.length; k++) {
        union(first, flist[k]);
      }
    }
  }

  const componentMap = new Map<number, number[]>();
  for (let fIdx = 0; fIdx < numFaces; fIdx++) {
    const root = find(fIdx);
    let list = componentMap.get(root);
    if (!list) {
      list = [];
      componentMap.set(root, list);
    }
    list.push(fIdx);
  }

  mesh.solidCount = componentMap.size;

  // Preserve native colors if pre-baked in glTF
  if (mesh.faceColors && mesh.faceColors.length === numFaces) {
    mesh.nativeColors = [...mesh.faceColors];
    const uniqueSample = new Set<string>();
    for (let i = 0; i < Math.min(200, numFaces); i++) {
      uniqueSample.add(mesh.faceColors[i].join(','));
    }
    // If it already carries multi-color composite attributes, record contrastColors
    if (uniqueSample.size >= 3) {
      mesh.contrastColors = [...mesh.faceColors];
      return;
    }
  }

  const contrastColors: [number, number, number][] = new Array(numFaces);

  if (componentMap.size > 1) {
    // Multi-solid assembly or composite mechanism:
    // Sort components by centroid position along primary spatial dimension (X, then Y, then Z)
    // so sequential/adjacent mechanisms are assigned maximally distinct palette hues.
    const components = Array.from(componentMap.values()).map((faceList) => {
      let cx = 0, cy = 0, cz = 0, totalVerts = 0;
      for (const fIdx of faceList) {
        const [i0, i1, i2] = mesh.faces[fIdx];
        const v0 = mesh.vertices[i0], v1 = mesh.vertices[i1], v2 = mesh.vertices[i2];
        if (v0 && v1 && v2) {
          cx += v0[0] + v1[0] + v2[0];
          cy += v0[1] + v1[1] + v2[1];
          cz += v0[2] + v1[2] + v2[2];
          totalVerts += 3;
        }
      }
      return {
        faces: faceList,
        center: [totalVerts ? cx / totalVerts : 0, totalVerts ? cy / totalVerts : 0, totalVerts ? cz / totalVerts : 0]
      };
    });

    components.sort((a, b) => a.center[0] - b.center[0] || a.center[1] - b.center[1] || a.center[2] - b.center[2]);

    components.forEach((comp, compIdx) => {
      const col = VIVID_CONTRAST_PALETTE[compIdx % VIVID_CONTRAST_PALETTE.length];
      for (const fIdx of comp.faces) {
        contrastColors[fIdx] = col;
      }
    });
  } else {
    // Single continuous solid body:
    // Partition faces into vividly contrasting geometric feature zones by normal orientation:
    // Upward functional faces (+Y), downward mounting faces (-Y), lateral flanges (+/-X), and front/back walls (+/-Z).
    const topColor = VIVID_CONTRAST_PALETTE[1];      // Amber Gold
    const bottomColor = VIVID_CONTRAST_PALETTE[9];   // Royal Indigo
    const sideXColor = VIVID_CONTRAST_PALETTE[0];    // Electric Cyan
    const sideZColor = VIVID_CONTRAST_PALETTE[4];    // Vivid Violet
    const chamferColor = VIVID_CONTRAST_PALETTE[2];  // Emerald Green

    for (let fIdx = 0; fIdx < numFaces; fIdx++) {
      const [i0, i1, i2] = mesh.faces[fIdx];
      const v0 = mesh.vertices[i0], v1 = mesh.vertices[i1], v2 = mesh.vertices[i2];
      if (!v0 || !v1 || !v2) {
        contrastColors[fIdx] = sideXColor;
        continue;
      }
      const ax = v1[0] - v0[0], ay = v1[1] - v0[1], az = v1[2] - v0[2];
      const bx = v2[0] - v0[0], by = v2[1] - v0[1], bz = v2[2] - v0[2];
      const nx = ay * bz - az * by;
      const ny = az * bx - ax * bz;
      const nz = ax * by - ay * bx;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      const uny = ny / len;
      const unx = nx / len;
      const unz = nz / len;

      if (uny > 0.65) {
        contrastColors[fIdx] = topColor; // Top surfaces, ports & bosses
      } else if (uny < -0.65) {
        contrastColors[fIdx] = bottomColor; // Base & underside
      } else if (Math.abs(uny) < 0.35 && Math.abs(unx) > 0.70) {
        contrastColors[fIdx] = sideXColor; // Left / Right flanks
      } else if (Math.abs(uny) < 0.35 && Math.abs(unz) > 0.70) {
        contrastColors[fIdx] = sideZColor; // Front / Back faces
      } else {
        contrastColors[fIdx] = chamferColor; // Angled chamfers, fillets & bevels
      }
    }
  }

  mesh.contrastColors = contrastColors;
  mesh.faceColors = contrastColors;
}

/**
 * High-performance, zero-dependency client-side glTF 2.0 accessor/bufferView mesh extractor.
 */
function parseGLTFData(jsonData: any, binBuffer: ArrayBuffer, format: 'gltf' | 'glb'): ParsedMesh | null {
  try {
    if (!jsonData || !jsonData.meshes || jsonData.meshes.length === 0 || !binBuffer) {
      return null;
    }

    const binView = new DataView(binBuffer);
    const vertices: [number, number, number][] = [];
    const faces: [number, number, number][] = [];

    const prim = jsonData.meshes[0].primitives[0];
    const posAcc = jsonData.accessors[prim.attributes.POSITION];
    const idxAcc = jsonData.accessors[prim.indices];

    const posBv = jsonData.bufferViews[posAcc.bufferView];
    const idxBv = jsonData.bufferViews[idxAcc.bufferView];

    // Read positions. Standard glTF is in meters -> scale to mm if max coordinate is small (< 15)
    const posOffset = (posBv.byteOffset || 0) + (posAcc.byteOffset || 0);
    const isMeters = posAcc.max && Math.max(...posAcc.max) < 15;
    const unitScale = isMeters ? 1000 : 1;

    for (let i = 0; i < posAcc.count; i++) {
      const vOffset = posOffset + i * 12;
      const x = binView.getFloat32(vOffset, true) * unitScale;
      const y = binView.getFloat32(vOffset + 4, true) * unitScale;
      const z = binView.getFloat32(vOffset + 8, true) * unitScale;
      vertices.push([x, y, z]);
    }

    // Read indices
    const idxOffset = (idxBv.byteOffset || 0) + (idxAcc.byteOffset || 0);
    const isShort = idxAcc.componentType === 5123;
    const step = isShort ? 2 : 4;
    const count = idxAcc.count;

    for (let i = 0; i < count; i += 3) {
      const i0 = isShort ? binView.getUint16(idxOffset + i * step, true) : binView.getUint32(idxOffset + i * step, true);
      const i1 = isShort ? binView.getUint16(idxOffset + (i + 1) * step, true) : binView.getUint32(idxOffset + (i + 1) * step, true);
      const i2 = isShort ? binView.getUint16(idxOffset + (i + 2) * step, true) : binView.getUint32(idxOffset + (i + 2) * step, true);
      faces.push([i0, i1, i2]);
    }

    // Read COLOR_0 attribute if present (RFC-017 multi-part composite color)
    const vertexColors: [number, number, number][] = [];
    const faceColors: [number, number, number][] = [];
    if (prim.attributes && prim.attributes.COLOR_0 !== undefined) {
      const colAcc = jsonData.accessors[prim.attributes.COLOR_0];
      const colBv = jsonData.bufferViews[colAcc.bufferView];
      const colOffset = (colBv.byteOffset || 0) + (colAcc.byteOffset || 0);
      const isVec4 = colAcc.type === 'VEC4';
      const isFloat = colAcc.componentType === 5126;
      const stride = isFloat ? (isVec4 ? 16 : 12) : (isVec4 ? 4 : 3);
      for (let i = 0; i < colAcc.count; i++) {
        const cOffset = colOffset + i * stride;
        let r = 0, g = 0, b = 0;
        if (isFloat) {
          r = Math.min(255, Math.max(0, Math.round(binView.getFloat32(cOffset, true) * 255)));
          g = Math.min(255, Math.max(0, Math.round(binView.getFloat32(cOffset + 4, true) * 255)));
          b = Math.min(255, Math.max(0, Math.round(binView.getFloat32(cOffset + 8, true) * 255)));
        } else {
          r = binView.getUint8(cOffset);
          g = binView.getUint8(cOffset + 1);
          b = binView.getUint8(cOffset + 2);
        }
        vertexColors.push([r, g, b]);
      }
      for (const [i0] of faces) {
        if (vertexColors[i0]) {
          faceColors.push(vertexColors[i0]);
        }
      }
    }

    if (vertices.length > 0 && faces.length > 0) {
      return {
        vertices,
        faces,
        faceColors: faceColors.length > 0 ? faceColors : undefined,
        vertexColors: vertexColors.length > 0 ? vertexColors : undefined,
        format,
      };
    }
  } catch (err) {
    console.warn(`Could not extract mesh from ${format}:`, err);
  }
  return null;
}

/**
 * Client-side glTF 2.0 JSON text / embedded base64 parser (.gltf).
 */
function parseGLTF(buffer: ArrayBuffer): ParsedMesh | null {
  try {
    const text = new TextDecoder().decode(buffer);
    if (!text.trimStart().startsWith('{')) return null;
    const jsonData = JSON.parse(text);
    if (!jsonData.asset || !jsonData.asset.version) return null;
    if (!jsonData.buffers || jsonData.buffers.length === 0) return null;

    const uri = jsonData.buffers[0].uri;
    if (!uri || !uri.startsWith('data:')) return null;

    const base64Index = uri.indexOf('base64,');
    if (base64Index === -1) return null;
    const base64Str = uri.slice(base64Index + 7);
    const binaryStr = atob(base64Str);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    return parseGLTFData(jsonData, bytes.buffer, 'gltf');
  } catch (err) {
    // Not valid JSON glTF or parse error
  }
  return null;
}

/**
 * High-performance, zero-dependency client-side glTF 2.0 binary (.glb) chunk parser.
 */
function parseGLB(buffer: ArrayBuffer): ParsedMesh | null {
  try {
    const view = new DataView(buffer);
    const magic = view.getUint32(0, true);
    if (magic !== 0x46546c67) return null; // 'glTF'
    const version = view.getUint32(4, true);
    if (version !== 2) return null;
    const totalLength = view.getUint32(8, true);

    let offset = 12;
    let jsonData: any = null;
    let binBuffer: ArrayBuffer | null = null;

    while (offset < totalLength) {
      const chunkLen = view.getUint32(offset, true);
      const chunkType = view.getUint32(offset + 4, true);
      offset += 8;

      if (chunkType === 0x4e4f534a) {
        // 'JSON'
        const jsonBytes = new Uint8Array(buffer, offset, chunkLen);
        const jsonStr = new TextDecoder().decode(jsonBytes);
        jsonData = JSON.parse(jsonStr);
      } else if (chunkType === 0x004e4942) {
        // 'BIN\0'
        binBuffer = buffer.slice(offset, offset + chunkLen);
      }
      offset += chunkLen;
    }

    if (!jsonData || !binBuffer) return null;
    return parseGLTFData(jsonData, binBuffer, 'glb');
  } catch (err) {
    console.warn('Could not parse GLB binary:', err);
  }
  return null;
}

/**
 * High-performance, zero-dependency client-side legacy CAD binary chunk parser fallback.
 */
function parseLegacyCAD(buffer: ArrayBuffer): ParsedMesh | null {
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
          while (offset < chunkEnd && view.getUint8(offset) !== 0) offset++;
          if (offset < chunkEnd && view.getUint8(offset) === 0) offset++;
          readChunks(chunkEnd);
        } else if (chunkId === 0x4110) {
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
      return { vertices, faces, format: 'gltf' };
    }
  } catch (err) {
    console.warn('Could not parse legacy CAD binary model:', err);
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
  focusStep = 0,
  initialWireframe = false,
  isComposite = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [wireframe, setWireframe] = useState(initialWireframe);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [mesh, setMesh] = useState<ParsedMesh | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [validationReport, setValidationReport] = useState<MeshValidationReport | null>(null);
  const [colorMode, setColorMode] = useState<'vivid' | 'material'>('vivid');

  const dragPosRef = useRef({ x: 0, y: 0 });
  const rotXRef = useRef(25);
  const rotYRef = useRef(45);
  const zoomCurrentRef = useRef(1.0);
  const zoomTargetRef = useRef(1.0);
  const minZoomRef = useRef(0.35);
  const maxZoomRef = useRef(7.0);
  const isVisibleRef = useRef(true);

  // 3-Axis Camera Pan Translation Refs (RFC-016 Section 4.3 & 5.1)
  const panTargetRef = useRef({ x: 0, y: 0, z: 0 });
  const panCurrentRef = useRef({ x: 0, y: 0, z: 0 });
  const panStepRef = useRef(15);

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

  // Load and parse geometry (GLTF or GLB)
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
        let parsed = parseGLTF(buf);
        if (!parsed) {
          parsed = parseGLB(buf);
        }
        if (!parsed) {
          parsed = parseLegacyCAD(buf);
        }

        if (parsed && parsed.vertices.length > 0) {
          let maxDistSq = 0;
          parsed.vertices.forEach(([vx, vy, vz]) => {
            const d = vx * vx + vy * vy + vz * vz;
            if (d > maxDistSq) maxDistSq = d;
          });
          const boundingR = Math.sqrt(maxDistSq) || 50;
          minZoomRef.current = Math.max(0.25, 45 / (boundingR * 1.5));
          maxZoomRef.current = Math.min(9.0, 640 / (boundingR * 0.4));
          panStepRef.current = Math.max(10, Math.round(boundingR * 0.15));

          // Procedural mesh integrity audit & normal rectification (RFC-017 Section 3)
          const report = auditAndSanitizeMesh(parsed);
          setValidationReport(report);

          // Auto-assign vividly contrasting colors to any model, machine, or composite loaded
          autoAssignVividColors(parsed);

          setMesh(parsed);
          setModelLoaded(true);
        }
      })
      .catch((err) => {
        console.debug('3D model load fallback to dimension bounding box:', err);
      });

    return () => {
      active = false;
    };
  }, [modelUrl]);

  // --- Discrete Zoom Controls (RFC-016 Section 4.1 & 5.2) ---
  const handleZoomIn = () => {
    const next = Math.min(maxZoomRef.current, zoomTargetRef.current + 0.25);
    zoomTargetRef.current = next;
    setZoomLevel(next);
  };

  const handleZoomOut = () => {
    const next = Math.max(minZoomRef.current, zoomTargetRef.current - 0.25);
    zoomTargetRef.current = next;
    setZoomLevel(next);
  };

  // --- Discrete Rotation Controls (RFC-016 Section 4.2 & 5.2) ---
  const handleRotateYaw = (direction: -1 | 1) => {
    setIsRotating(false);
    rotYRef.current = (rotYRef.current + direction * 15 + 360) % 360;
  };

  const handleRotatePitch = (direction: -1 | 1) => {
    setIsRotating(false);
    rotXRef.current = Math.max(-85, Math.min(85, rotXRef.current + direction * 10));
  };

  // --- Discrete 3-Axis Translation D-Pad Controls (RFC-016 Section 4.3 & 5.2) ---
  const handlePanHorizontal = (direction: -1 | 1) => {
    setIsRotating(false);
    panTargetRef.current.x += direction * panStepRef.current;
  };

  const handlePanVertical = (direction: -1 | 1) => {
    setIsRotating(false);
    panTargetRef.current.y += direction * panStepRef.current;
  };

  const handlePanDepth = (direction: -1 | 1) => {
    setIsRotating(false);
    panTargetRef.current.z += direction * panStepRef.current;
  };

  const handleResetPerspective = () => {
    rotXRef.current = 25;
    rotYRef.current = 45;
    zoomTargetRef.current = 1.0;
    zoomCurrentRef.current = 1.0;
    panTargetRef.current = { x: 0, y: 0, z: 0 };
    panCurrentRef.current = { x: 0, y: 0, z: 0 };
    setZoomLevel(1.0);
  };

  // Real-time Canvas Rendering Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const displayW = Math.round(rect.width);
      const displayH = Math.round(rect.height);
      if (displayW > 0 && displayH > 0 && (canvas.width !== displayW || canvas.height !== displayH)) {
        canvas.width = displayW;
        canvas.height = displayH;
        return true;
      }
      return false;
    };

    updateCanvasSize();

    const render = () => {
      if (!isVisibleRef.current) {
        animId = requestAnimationFrame(render);
        return;
      }

      if (isRotating && !isDragging) {
        rotYRef.current = (rotYRef.current + 0.5) % 360;
      }

      // Smooth zoom damping
      if (Math.abs(zoomTargetRef.current - zoomCurrentRef.current) > 0.002) {
        zoomCurrentRef.current += (zoomTargetRef.current - zoomCurrentRef.current) * 0.15;
      } else {
        zoomCurrentRef.current = zoomTargetRef.current;
      }

      // Smooth pan damping (RFC-016 Section 5)
      if (Math.abs(panTargetRef.current.x - panCurrentRef.current.x) > 0.05) {
        panCurrentRef.current.x += (panTargetRef.current.x - panCurrentRef.current.x) * 0.2;
      } else {
        panCurrentRef.current.x = panTargetRef.current.x;
      }
      if (Math.abs(panTargetRef.current.y - panCurrentRef.current.y) > 0.05) {
        panCurrentRef.current.y += (panTargetRef.current.y - panCurrentRef.current.y) * 0.2;
      } else {
        panCurrentRef.current.y = panTargetRef.current.y;
      }
      if (Math.abs(panTargetRef.current.z - panCurrentRef.current.z) > 0.05) {
        panCurrentRef.current.z += (panTargetRef.current.z - panCurrentRef.current.z) * 0.2;
      } else {
        panCurrentRef.current.z = panTargetRef.current.z;
      }

      const currentRotX = rotXRef.current;
      const currentRotY = rotYRef.current;
      const activeZoom = zoomCurrentRef.current;
      const panX = panCurrentRef.current.x;
      const panY = panCurrentRef.current.y;
      const panZ = panCurrentRef.current.z;

      updateCanvasSize();
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
        const scale = (110 / maxSpan) * activeZoom;

        // Project all vertices with 3-axis translation offsets
        const projected = mesh.vertices.map(([vx, vy, vz]) => {
          const rx = (vx - centerOffset[0] + panX) * scale;
          const ry = (vy - centerOffset[1] + panY) * scale;
          const rz = (vz - centerOffset[2] + panZ) * scale;

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

        interface RenderFace {
          indices: [number, number, number];
          depth: number;
          normalZ: number;
          color: string;
        }

        const renderFaces: RenderFace[] = [];

        mesh.faces.forEach(([i0, i1, i2], faceIndex) => {
          if (!projected[i0] || !projected[i1] || !projected[i2]) return;
          const p0 = projected[i0];
          const p1 = projected[i1];
          const p2 = projected[i2];

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

          // Mandatory Backface Culling (RFC-014 / GEMINI.md)
          if (!wireframe && rnz2 <= 0.0) return;

          const intensity = Math.max(0.22, (rnx1 * lx + rny2 * ly + rnz2 * lz + 1) / 2);

          let r = 56, g = 189, b = 248; // Sky cyan
          const activeColors = colorMode === 'vivid'
            ? (mesh.contrastColors || mesh.faceColors)
            : (mesh.nativeColors || mesh.faceColors);

          if (activeColors && activeColors[faceIndex]) {
            [r, g, b] = activeColors[faceIndex];
          } else if (material.toLowerCase().includes('petg') || material.toLowerCase().includes('pla')) {
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

        // Painter's depth sorting
        renderFaces.sort((a, b) => a.depth - b.depth);

        if (!wireframe) {
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

            ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          });
        } else {
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

        // Draw Datum Coordinate Crosshair anchored to base origin (0, minY, 0)
        const dX = (0 - centerOffset[0] + panX) * scale;
        const dY = (minY - centerOffset[1] + panY) * scale;
        const dZ = (0 - centerOffset[2] + panZ) * scale;
        const dx1 = dX * cosY + dZ * sinY;
        const dz1 = -dX * sinY + dZ * cosY;
        const dy2 = dY * cosX - dz1 * sinX;
        const datumPx = cx + dx1;
        const datumPy = cy - dy2;

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(datumPx - 12, datumPy);
        ctx.lineTo(datumPx + 12, datumPy);
        ctx.moveTo(datumPx, datumPy - 12);
        ctx.lineTo(datumPx, datumPy + 12);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = '9px monospace';
        ctx.fillText('ORIGIN DATUM', datumPx + 15, datumPy + 4);
      } else {
        // Fallback: Parametric Envelope Bounding Cube
        const maxDim = Math.max(dimensions.x_mm, dimensions.y_mm, dimensions.z_mm) || 100;
        const scale = (85 / maxDim) * activeZoom;
        const dx = (dimensions.x_mm / 2) * scale;
        const dy = (dimensions.y_mm / 2) * scale;
        const dz = (dimensions.z_mm / 2) * scale;

        const vertices = [
          [-dx + panX * scale, -dy + panY * scale, -dz + panZ * scale],
          [dx + panX * scale, -dy + panY * scale, -dz + panZ * scale],
          [dx + panX * scale, dy + panY * scale, -dz + panZ * scale],
          [-dx + panX * scale, dy + panY * scale, -dz + panZ * scale],
          [-dx + panX * scale, -dy + panY * scale, dz + panZ * scale],
          [dx + panX * scale, -dy + panY * scale, dz + panZ * scale],
          [dx + panX * scale, dy + panY * scale, dz + panZ * scale],
          [-dx + panX * scale, dy + panY * scale, dz + panZ * scale],
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

      const isPanning =
        Math.abs(panTargetRef.current.x - panCurrentRef.current.x) > 0.05 ||
        Math.abs(panTargetRef.current.y - panCurrentRef.current.y) > 0.05 ||
        Math.abs(panTargetRef.current.z - panCurrentRef.current.z) > 0.05;

      if (isRotating || isDragging || isPanning || Math.abs(zoomTargetRef.current - zoomCurrentRef.current) > 0.002) {
        animId = requestAnimationFrame(render);
      }
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (updateCanvasSize()) {
          requestAnimationFrame(render);
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [isRotating, wireframe, isDragging, dimensions, mesh, material, colorMode]);

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
    rotXRef.current = Math.max(-85, Math.min(85, rotXRef.current + dy * 0.7));
  };

  const handleMouseUp = () => setIsDragging(false);

  // NOTE: Wheel zoom event listener completely eliminated per RFC-016 Section 3 & 6.
  // Scrolling on the canvas passes through to document scroll without hijacking camera state.

  const isGltf = mesh?.format === 'gltf' || modelUrl.toLowerCase().endsWith('.gltf');
  const isGlb = mesh?.format === 'glb' || modelUrl.toLowerCase().endsWith('.glb');

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
          {(isComposite || (material && material.toLowerCase().includes('composite'))) && (
            <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-700/60 text-purple-300 font-mono font-bold uppercase text-[10px] tracking-wide">
              COMPOSITE
            </span>
          )}
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

        {/* Camera Controls HUD Overlay (RFC-016 Section 4 & 5.2) */}
        <div className="biosphere-hud pointer-events-none absolute inset-0 p-3 flex flex-col justify-between">
          
          {/* Top Row: Mesh Status Badge (Left) & Perspective Toggles + Rotation Column (Right) */}
          <div className="flex justify-between items-start">
            {/* Exact Geometry / Mesh Status HUD */}
            <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 border border-slate-800 rounded px-2.5 py-1 text-[11px] font-mono backdrop-blur shadow-md">
              {mesh ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-semibold">{isGltf ? 'glTF 2.0 Standard:' : isGlb ? 'glTF 2.0 (GLB):' : 'glTF Standard:'}</span>
                    <span className="text-slate-300">{mesh.vertices.length}v / {mesh.faces.length}f</span>
                  </div>
                  {validationReport && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${validationReport.isManifold ? 'text-emerald-300 bg-emerald-950/80 border-emerald-800/80' : 'text-amber-300 bg-amber-950/80 border-amber-800/80'}`}>
                      {validationReport.isManifold ? '2-MANIFOLD' : 'SURFACE MESH'}
                    </span>
                  )}
                  {mesh.solidCount && mesh.solidCount > 1 ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border text-amber-300 bg-amber-950/80 border-amber-800/80 font-bold">
                      {mesh.solidCount} BODIES
                    </span>
                  ) : null}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${colorMode === 'vivid' ? 'text-sky-300 bg-sky-950/80 border-sky-800/80' : 'text-slate-400 bg-slate-950/80 border-slate-800/80'}`}>
                    {colorMode === 'vivid' ? 'VIVID' : 'MAT'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-sky-400">
                  <Cpu className="w-3.5 h-3.5 animate-spin" />
                  <span>Streaming CAD Geometry...</span>
                </div>
              )}
            </div>

            {/* Viewport Perspective Toggles + Vertical Rotation Column */}
            <div className="pointer-events-auto flex items-start gap-1.5">
              {/* Toggles */}
              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 shadow-lg backdrop-blur">
                <button
                  onClick={() => setIsRotating(!isRotating)}
                  title={isRotating ? 'Pause Rotation' : 'Auto Rotate'}
                  className={`p-1.5 rounded transition ${isRotating ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setWireframe(!wireframe)}
                  title={wireframe ? 'Shaded View' : 'Wireframe View'}
                  className={`p-1.5 rounded transition ${wireframe ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setColorMode((prev) => (prev === 'vivid' ? 'material' : 'vivid'))}
                  title={colorMode === 'vivid' ? 'Vivid Contrast Colors (Click for Native Material)' : 'Material Colors (Click for Vivid Contrast)'}
                  className={`p-1.5 rounded transition ${colorMode === 'vivid' ? 'bg-sky-500/20 text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetPerspective}
                  title="Reset Perspective & Pan"
                  className="p-1.5 rounded text-slate-400 hover:text-slate-200 transition"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* RFC-016 Rotation Column (Docked Vertical Column) */}
              <div className="hud-group hud-vertical-dock rotation-column flex flex-col gap-1 bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 shadow-lg backdrop-blur">
                <button
                  id="btn-rot-left"
                  onClick={() => handleRotateYaw(-1)}
                  title="Rotate Counter-Clockwise (Yaw −15°)"
                  className="hud-btn w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 font-mono text-xs font-bold transition select-none active:scale-95"
                >
                  ⟲
                </button>
                <button
                  id="btn-rot-right"
                  onClick={() => handleRotateYaw(1)}
                  title="Rotate Clockwise (Yaw +15°)"
                  className="hud-btn w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 font-mono text-xs font-bold transition select-none active:scale-95"
                >
                  ⟳
                </button>
                <button
                  id="btn-pitch-up"
                  onClick={() => handleRotatePitch(1)}
                  title="Pitch Up (Elevation +10°)"
                  className="hud-btn w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 font-mono text-xs font-bold transition select-none active:scale-95"
                >
                  ▲
                </button>
                <button
                  id="btn-pitch-down"
                  onClick={() => handleRotatePitch(-1)}
                  title="Pitch Down (Elevation −10°)"
                  className="hud-btn w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 font-mono text-xs font-bold transition select-none active:scale-95"
                >
                  ▼
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Translation D-Pads (Left), Bounding Dimensions (Center), Zoom Controls (Right) */}
          <div className="flex justify-between items-end gap-2">
            {/* RFC-016 Translation D-Pad (3-Axis Camera Pan) */}
            <div className="pointer-events-auto hud-group hud-pan flex flex-col gap-1 bg-slate-950/90 border border-slate-800/90 rounded-lg p-1.5 shadow-xl backdrop-blur font-mono text-[10px]">
              {/* Horizontal Axis */}
              <div className="axis-control flex items-center justify-between gap-1.5">
                <span className="axis-label text-slate-400 text-[9px] w-14 truncate">↔ Horizontal</span>
                <div className="btn-row flex items-center gap-1">
                  <button
                    id="btn-pan-left"
                    onClick={() => handlePanHorizontal(-1)}
                    title="Pan Left (−X)"
                    className="hud-btn w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-sky-400 text-[10px] font-bold transition select-none active:scale-95"
                  >
                    ◄
                  </button>
                  <button
                    id="btn-pan-right"
                    onClick={() => handlePanHorizontal(1)}
                    title="Pan Right (+X)"
                    className="hud-btn w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-sky-400 text-[10px] font-bold transition select-none active:scale-95"
                  >
                    ►
                  </button>
                </div>
              </div>

              {/* Vertical Axis */}
              <div className="axis-control flex items-center justify-between gap-1.5">
                <span className="axis-label text-slate-400 text-[9px] w-14 truncate">↕ Vertical</span>
                <div className="btn-row flex items-center gap-1">
                  <button
                    id="btn-pan-up"
                    onClick={() => handlePanVertical(1)}
                    title="Pan Up (+Y)"
                    className="hud-btn w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-sky-400 text-[10px] font-bold transition select-none active:scale-95"
                  >
                    ▲
                  </button>
                  <button
                    id="btn-pan-down"
                    onClick={() => handlePanVertical(-1)}
                    title="Pan Down (−Y)"
                    className="hud-btn w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-sky-400 text-[10px] font-bold transition select-none active:scale-95"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* Depth / Axial Axis */}
              <div className="axis-control flex items-center justify-between gap-1.5">
                <span className="axis-label text-slate-400 text-[9px] w-14 truncate">⤢ Depth (Z)</span>
                <div className="btn-row flex items-center gap-1">
                  <button
                    id="btn-pan-fwd"
                    onClick={() => handlePanDepth(1)}
                    title="Move Forward (+Z)"
                    className="hud-btn w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-sky-400 text-[10px] font-bold transition select-none active:scale-95"
                  >
                    ▲
                  </button>
                  <button
                    id="btn-pan-back"
                    onClick={() => handlePanDepth(-1)}
                    title="Move Backward (−Z)"
                    className="hud-btn w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-sky-400 text-[10px] font-bold transition select-none active:scale-95"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>

            {/* Bounding Dimensions HUD (Center) */}
            <div className="pointer-events-auto hidden md:flex items-center gap-3 bg-slate-950/80 border border-slate-800/80 rounded px-2.5 py-1 text-[11px] font-mono text-slate-300 backdrop-blur shadow-md">
              <span>X: <strong className="text-sky-400">{dimensions.x_mm}</strong>mm</span>
              <span>Y: <strong className="text-sky-400">{dimensions.y_mm}</strong>mm</span>
              <span>Z: <strong className="text-sky-400">{dimensions.z_mm}</strong>mm</span>
            </div>

            {/* RFC-016 Zoom Controls (Bottom-Right) */}
            <div className="pointer-events-auto hud-group hud-zoom flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 shadow-lg backdrop-blur">
              <button
                id="btn-zoom-out"
                onClick={handleZoomOut}
                title="Zoom Out"
                className="hud-btn px-2 h-7 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-sky-400 font-mono text-xs font-bold transition select-none active:scale-95"
              >
                🔍−
              </button>
              <span className="font-mono text-[11px] text-sky-400 font-bold px-1 min-w-[36px] text-center select-none">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                id="btn-zoom-in"
                onClick={handleZoomIn}
                title="Zoom In"
                className="hud-btn px-2 h-7 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-sky-400 font-mono text-xs font-bold transition select-none active:scale-95"
              >
                🔍+
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer / Asset Download Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{isGltf || isGlb ? 'glTF 2.0 CAD Standard' : 'glTF 2.0 CAD Standard'} • Drag to Orbit / Use Spatial HUD</span>
        </div>

        <a
          href={modelUrl}
          download
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-md font-mono text-xs font-semibold transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download {modelUrl.split('/').pop() || 'model.gltf'}</span>
        </a>
      </div>
    </div>
  );
}
