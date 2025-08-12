import * as THREE from "three";

// Snap do siatki (10cm)
function snapValue(val, step) {
  return Math.round(val / step) * step;
}
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Zwraca Y (bottom) podpory: 0 (podłoga) lub max(top innych boxów),
 * w układzie bottom-left (x/z = lewy-dolny róg).
 */
export function getSupportYBottom(target, boxesBottom) {
  let supportBottomY = 0; // podłoga
  const tx1 = target.x, tz1 = target.z;
  const tx2 = target.x + target.width;
  const tz2 = target.z + target.length;

  for (const b of boxesBottom) {
    if (b.id === target.id) continue;
    const bx1 = b.x, bz1 = b.z;
    const bx2 = b.x + b.width;
    const bz2 = b.z + b.length;

    const overlapX = tx1 < bx2 && tx2 > bx1;
    const overlapZ = tz1 < bz2 && tz2 > bz1;
    if (!overlapX || !overlapZ) continue;

    const topY = (b.y ?? 0) + (b.height ?? 1);
    if (topY > supportBottomY) supportBottomY = topY;
  }
  return supportBottomY;
}

/** Kolizja 3D – styk dozwolony; tolerancja skaluje się z rozmiarem. */
function isCollision3D(xc, yc, zc, w, h, l, ignoreId, meshMap) {
  const epsX = Math.max(0.5, w * 0.01);
  const epsY = Math.max(0.5, h * 0.01);
  const epsZ = Math.max(0.5, l * 0.01);

  for (const m of Object.values(meshMap)) {
    if (m.userData.boxId === ignoreId) continue;
    const W = m.geometry.parameters.width ?? 1;
    const H = m.geometry.parameters.height ?? 1;
    const L = m.geometry.parameters.depth ?? 1;
    const mx = m.position.x, my = m.position.y, mz = m.position.z;

    const x1 = xc - w/2, x2 = xc + w/2;
    const X1 = mx - W/2, X2 = mx + W/2;
    const z1 = zc - l/2, z2 = zc + l/2;
    const Z1 = mz - L/2, Z2 = mz + L/2;
    const y1 = yc - h/2, y2 = yc + h/2;
    const Y1 = my - H/2, Y2 = my + H/2;

    const overlapX = x1 < X2 - epsX && x2 > X1 + epsX;
    const overlapZ = z1 < Z2 - epsZ && z2 > Z1 + epsZ;
    const overlapY = y1 < Y2 - epsY && y2 > Y1 + epsY;

    if (overlapX && overlapZ && overlapY) return true;
  }
  return false;
}

export class BoxDragControls {
  constructor({
    meshMap, camera, domElement, allBoxes, rapierPhysics,
    onDragStart, onDragEnd, onForceReStack, onContextMenu, onSelect, // <- onSelect (LPM)
    cargoDims, snapToGrid, lockToContainer
  }) {
    this.meshMap = meshMap;
    this.camera = camera;
    this.domElement = domElement;
    this.allBoxes = allBoxes;
    this.rapierPhysics = rapierPhysics;
    this.onDragStart = onDragStart;
    this.onDragEnd = onDragEnd;
    this.onForceReStack = onForceReStack;
    this.onContextMenu = onContextMenu;
    this.onSelect = onSelect;
    this.cargoDims = cargoDims;
    this.snapToGrid = snapToGrid;
    this.lockToContainer = lockToContainer;

    this.draggedMesh = null;
    this.draggedBoxId = null;
    this.dragOffset = { x: 0, z: 0 };
    this.lastValid = null;

    this._pointerDown = this.pointerDown.bind(this);
    this._pointerMove = this.pointerMove.bind(this);
    this._pointerUp = this.pointerUp.bind(this);
    this._ctxMenu = this.contextMenu.bind(this);

    domElement.addEventListener("pointerdown", this._pointerDown);
    domElement.addEventListener("pointermove", this._pointerMove);
    domElement.addEventListener("pointerup", this._pointerUp);
    domElement.addEventListener("contextmenu", this._ctxMenu);
  }

  dispose() {
    this.domElement.removeEventListener("pointerdown", this._pointerDown);
    this.domElement.removeEventListener("pointermove", this._pointerMove);
    this.domElement.removeEventListener("pointerup", this._pointerUp);
    this.domElement.removeEventListener("contextmenu", this._ctxMenu);
  }

  pointerDown(e) {
    if (e.button !== 0) return;
    const hit = this._pickMesh(e);
    if (!hit) return;

    this.draggedMesh = hit.object;
    this.draggedBoxId = this.draggedMesh.userData.boxId;
    const pos = hit.object.position.clone(); // center
    this.dragOffset = { x: pos.x - hit.point.x, z: pos.z - hit.point.z };
    this.lastValid = { x: pos.x, y: pos.y, z: pos.z };

    // zaznaczanie LPM
    if (this.onSelect) this.onSelect(this.draggedBoxId);

    window.__blockCameraControls = true;
    if (this.onDragStart) this.onDragStart(this.draggedBoxId);
  }

  pointerMove(e) {
    if (!this.draggedMesh || !this.draggedBoxId) return;
    const p = this._intersectGround(e);
    if (!p) return;

    const g = this.draggedMesh.geometry.parameters || {};
    const w = g.width ?? 1, h = g.height ?? 1, l = g.depth ?? 1;

    let xc = p.x + this.dragOffset.x;
    let zc = p.z + this.dragOffset.z;

    if (this.snapToGrid) { xc = snapValue(xc, 10); zc = snapValue(zc, 10); }
    if (this.lockToContainer) {
      xc = clamp(xc, w/2, this.cargoDims.width - w/2);
      zc = clamp(zc, l/2, this.cargoDims.length - l/2);
    }

    // podpórka bottom-left
    const targetBottom = { id: this.draggedBoxId, x: xc - w/2, z: zc - l/2, width: w, length: l, height: h };
    const bottomBoxes = Object.values(this.meshMap)
      .filter(m => m.userData.boxId !== this.draggedBoxId)
      .map(m => ({
        id: m.userData.boxId,
        x: (m.position.x ?? 0) - (m.geometry.parameters.width ?? 1)/2,
        z: (m.position.z ?? 0) - (m.geometry.parameters.depth ?? 1)/2,
        y: (m.position.y ?? 0) - (m.geometry.parameters.height ?? 1)/2,
        width: m.geometry.parameters.width ?? 1,
        length: m.geometry.parameters.depth ?? 1,
        height: m.geometry.parameters.height ?? 1,
      }));
    const supportBottomY = getSupportYBottom(targetBottom, bottomBoxes);
    const yc = supportBottomY + h/2;

    // kolizja 3D (z tolerancją)
    if (isCollision3D(xc, yc, zc, w, h, l, this.draggedBoxId, this.meshMap)) {
      if (this.lastValid) this.draggedMesh.position.set(this.lastValid.x, this.lastValid.y, this.lastValid.z);
      return;
    }

    this.draggedMesh.position.set(xc, yc, zc);
    this.lastValid = { x: xc, y: yc, z: zc };
  }

  pointerUp() {
    if (!this.draggedMesh || !this.draggedBoxId) return;

    const g = this.draggedMesh.geometry.parameters || {};
    const w = g.width ?? 1, h = g.height ?? 1, l = g.depth ?? 1;
    const xc = this.draggedMesh.position.x;
    const zc = this.draggedMesh.position.z;

    // przeliczenie podpórki na końcu
    const targetBottom = { id: this.draggedBoxId, x: xc - w/2, z: zc - l/2, width: w, length: l, height: h };
    const bottomBoxes = Object.values(this.meshMap)
      .filter(m => m.userData.boxId !== this.draggedBoxId)
      .map(m => ({
        id: m.userData.boxId,
        x: (m.position.x ?? 0) - (m.geometry.parameters.width ?? 1)/2,
        z: (m.position.z ?? 0) - (m.geometry.parameters.depth ?? 1)/2,
        y: (m.position.y ?? 0) - (m.geometry.parameters.height ?? 1)/2,
        width: m.geometry.parameters.width ?? 1,
        length: m.geometry.parameters.depth ?? 1,
        height: m.geometry.parameters.height ?? 1,
      }));
    const supportBottomY = getSupportYBottom(targetBottom, bottomBoxes);
    const yc = supportBottomY + h/2;
    this.draggedMesh.position.y = yc;

    if (this.rapierPhysics) {
      this.rapierPhysics.setBoxPosition(this.draggedBoxId, { x: xc, y: yc, z: zc });
      this.rapierPhysics.setBoxKinematic(this.draggedBoxId, false);
    }

    if (this.onDragEnd) {
      this.onDragEnd(this.draggedBoxId, { x: xc - w/2, y: supportBottomY, z: zc - l/2 });
    }
    if (this.onForceReStack) this.onForceReStack();

    this.draggedMesh = null;
    this.draggedBoxId = null;
    this.lastValid = null;
    window.__blockCameraControls = false;
  }

  // ===== context menu =====
  contextMenu(e) {
    e.preventDefault();
    const hit = this._pickMesh(e);
    if (!hit) return;
    const id = hit.object.userData.boxId;
    if (this.onContextMenu) this.onContextMenu(id, e.clientX, e.clientY);
  }

  _pickMesh(e) {
    const rect = this.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const meshes = Object.values(this.meshMap);
    const hits = raycaster.intersectObjects(meshes);
    return hits.length ? hits[0] : null;
  }

  _intersectGround(e) {
    const rect = this.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const p = new THREE.Vector3();
    return raycaster.ray.intersectPlane(plane, p) ? p : null;
  }
}
