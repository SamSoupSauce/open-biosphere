/**
 * web/viewer/loader/SceneGraphResolver.js
 * RFC-014 Standardized glTF 2.0 Asset Loader & Hierarchical Assembly Resolver.
 *
 * Traverses glTF scene graphs, resolves declarative extras.ref nodes to external sub-models,
 * deduplicates geometry buffers via caching, and compiles composite assemblies with transforms.
 */

export class SceneGraphResolver {
  constructor(options = {}) {
    this.cache = new Map(); // url -> Promise<ParsedSubModel>
    this.baseUrl = options.baseUrl || '';
  }

  /**
   * Loads and resolves a glTF/GLB asset. If it contains node extras.ref child links,
   * it recursively resolves and merges them into an assembly scene graph.
   *
   * @param {string} url - URI to .gltf or .glb file
   * @param {Object} [context] - Current assembly transform context
   * @returns {Promise<Object>} Resolved scene graph with transformed vertices and faces
   */
  async resolve(url, context = {}) {
    const absoluteUrl = new URL(url, window.location.href).href;
    const isGlb = url.toLowerCase().endsWith('.glb') || url.includes('.glb');

    if (isGlb) {
      return this.loadGLB(absoluteUrl, context);
    } else {
      return this.loadGLTF(absoluteUrl, context);
    }
  }

  /**
   * Fetches and parses a single-file binary glTF 2.0 (.glb) container.
   */
  async loadGLB(url, context = {}) {
    let fetchPromise = this.cache.get(url);
    if (!fetchPromise) {
      fetchPromise = fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`);
          return res.arrayBuffer();
        })
        .then((buf) => this.parseGlbBuffer(buf));
      this.cache.set(url, fetchPromise);
    }

    const rawModel = await fetchPromise;
    return this.applyTransform(rawModel, context);
  }

  /**
   * Parses a glTF 2.0 binary buffer into vertices, faces, and materials.
   */
  parseGlbBuffer(buffer) {
    const view = new DataView(buffer);
    const magic = view.getUint32(0, true);
    if (magic !== 0x46546c67) {
      throw new Error(`Invalid glTF binary magic: 0x${magic.toString(16)}`);
    }
    const version = view.getUint32(4, true);
    if (version !== 2) {
      throw new Error(`Unsupported glTF version: ${version}`);
    }
    const totalLength = view.getUint32(8, true);

    let offset = 12;
    let jsonData = null;
    let binBuffer = null;

    while (offset < totalLength) {
      const chunkLen = view.getUint32(offset, true);
      const chunkType = view.getUint32(offset + 4, true);
      offset += 8;

      if (chunkType === 0x4e4f534a) {
        // 'JSON' chunk
        const jsonBytes = new Uint8Array(buffer, offset, chunkLen);
        const jsonStr = new TextDecoder().decode(jsonBytes);
        jsonData = JSON.parse(jsonStr);
      } else if (chunkType === 0x004e4942) {
        // 'BIN\0' chunk
        binBuffer = buffer.slice(offset, offset + chunkLen);
      }
      offset += chunkLen;
    }

    if (!jsonData) throw new Error('No JSON chunk found in GLB');

    const vertices = [];
    const faces = [];
    const meshes = jsonData.meshes || [];

    if (meshes.length > 0 && binBuffer) {
      const binView = new DataView(binBuffer);
      const prim = meshes[0].primitives[0];
      const posAcc = jsonData.accessors[prim.attributes.POSITION];
      const idxAcc = jsonData.accessors[prim.indices];

      const posBv = jsonData.bufferViews[posAcc.bufferView];
      const idxBv = jsonData.bufferViews[idxAcc.bufferView];

      // Read positions (in meters, converted to mm for consistent viewer coordinates: 1m = 1000mm)
      const posOffset = (posBv.byteOffset || 0) + (posAcc.byteOffset || 0);
      for (let i = 0; i < posAcc.count; i++) {
        const vOffset = posOffset + i * 12;
        const x = binView.getFloat32(vOffset, true) * 1000;
        const y = binView.getFloat32(vOffset + 4, true) * 1000;
        const z = binView.getFloat32(vOffset + 8, true) * 1000;
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
    }

    const material = jsonData.materials?.[0]?.name || 'PBR_Standard';
    return { vertices, faces, material };
  }

  /**
   * Fetches and parses a declarative glTF hierarchical assembly JSON file.
   * Recursively resolves nodes with `extras.ref` references.
   */
  async loadGLTF(url, context = {}) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading assembly ${url}`);
    const gltf = await res.json();

    const parentUrl = url;
    const mergedVertices = [];
    const mergedFaces = [];
    const subAssemblies = [];

    const nodes = gltf.nodes || [];
    for (const node of nodes) {
      if (node.extras && node.extras.ref) {
        const childUrl = new URL(node.extras.ref, parentUrl).href;
        const childContext = {
          translation: node.translation || [0, 0, 0],
          rotation: node.rotation || [0, 0, 0, 1], // [x, y, z, w]
          scale: node.scale || [1, 1, 1],
          name: node.name,
          partId: node.extras.partId || '',
          focusStep: node.extras.focusStep || null,
        };

        const resolvedChild = await this.resolve(childUrl, childContext);
        const baseIndex = mergedVertices.length;
        mergedVertices.push(...resolvedChild.vertices);
        resolvedChild.faces.forEach(([f0, f1, f2]) => {
          mergedFaces.push([baseIndex + f0, baseIndex + f1, baseIndex + f2]);
        });

        subAssemblies.push({
          name: node.name,
          partId: node.extras.partId,
          focusStep: node.extras.focusStep,
          startIndex: baseIndex,
          vertexCount: resolvedChild.vertices.length,
        });
      }
    }

    return {
      vertices: mergedVertices,
      faces: mergedFaces,
      subAssemblies,
      isAssembly: true,
    };
  }

  /**
   * Applies Cartesian affine translation, quaternion rotation, and scale to a mesh.
   */
  applyTransform(mesh, context) {
    if (!context.translation && !context.rotation && !context.scale) {
      return mesh;
    }

    const t = context.translation || [0, 0, 0];
    const q = context.rotation || [0, 0, 0, 1];
    const s = context.scale || [1, 1, 1];

    // Translation in meters -> convert to mm (1m = 1000mm)
    const tx = t[0] * 1000;
    const ty = t[1] * 1000;
    const tz = t[2] * 1000;

    const transformedVertices = mesh.vertices.map(([vx, vy, vz]) => {
      // Scale
      let sx = vx * s[0];
      let sy = vy * s[1];
      let sz = vz * s[2];

      // Quaternion rotation [qx, qy, qz, qw]
      const qx = q[0], qy = q[1], qz = q[2], qw = q[3];
      // v' = v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v)
      const cx1 = qy * sz - qz * sy + qw * sx;
      const cy1 = qz * sx - qx * sz + qw * sy;
      const cz1 = qx * sy - qy * sx + qw * sz;

      const rx = sx + 2.0 * (qy * cz1 - qz * cy1);
      const ry = sy + 2.0 * (qz * cx1 - qx * cz1);
      const rz = sz + 2.0 * (qx * cy1 - qy * cx1);

      return [rx + tx, ry + ty, rz + tz];
    });

    return {
      vertices: transformedVertices,
      faces: mesh.faces,
      material: mesh.material,
      name: context.name,
      partId: context.partId,
    };
  }
}
