import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { CameraControls } from "./CameraControls";
import { createFloorGrid } from "./FloorGrid";
import { autoFitCamera } from "./CameraAutoFit";
import { BoxDragControls } from "./BoxDragControls";
import { RapierPhysics } from "./RapierPhysics";

function readSceneTokens() {
  const s = getComputedStyle(document.documentElement);
  const read = (n) => (s.getPropertyValue(n) || "").trim();
  const C = (n, fb) => new THREE.Color(read(n) || fb);
  const CL = (n, fb) => (read(n) ? read(n).split(",").map(c => new THREE.Color(c.trim())) : fb);
  return {
    bg: C("--scene-bg", "#f8f9fa"),
    containerFill: read("--scene-container") || "rgba(255,255,255,0.45)",
    containerEdge: C("--scene-container-edges", "#495057"),
    gridMain: C("--scene-grid-main", "#dee2e6"),
    gridAccent: C("--scene-grid-accent", "#a7f432"),
    boxPalette: CL("--scene-box-colors", [
      new THREE.Color("#8ecae6"),
      new THREE.Color("#ffb703"),
      new THREE.Color("#219ebc"),
      new THREE.Color("#adb5bd"),
      new THREE.Color("#c77dff"),
    ]),
    activeGlow: C("--scene-box-active-glow", "#a7f432"),
  };
}
const colorFromId = (id, palette) => {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
};

export function ThreePlanner({
  boxes, cargoDims,
  onBoxDragStart, onBoxDragEnd,
  snapToGrid, lockToContainer, stackMode,
  onForceReStack, onShowContextMenu,
  activeBoxId, onSelectBox
}) {
  const containerRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();

  const loaderEdgesRef = useRef();
  const loaderFillRef  = useRef();
  const floorGridRef   = useRef();
  const meshMapRef     = useRef({});
  const dragControlsRef= useRef(null);
  const rapierRef      = useRef(null);

  const [size, setSize] = useState({ width: 300, height: 300 });
  const tokensRef       = useRef(readSceneTokens());
  const draggingRef     = useRef(false);

  const setPivotToCenter = () => {
    if (!controlsRef.current) return;
    controlsRef.current.target.x = cargoDims.width  / 2;
    controlsRef.current.target.y = cargoDims.height / 2;
    controlsRef.current.target.z = cargoDims.length / 2;
    controlsRef.current.update();
  };

  const renderContainerWalls = () => {
    if (!sceneRef.current) return;
    const t = tokensRef.current;

    if (loaderEdgesRef.current) sceneRef.current.remove(loaderEdgesRef.current);
    if (loaderFillRef.current) {
      sceneRef.current.remove(loaderFillRef.current);
      loaderFillRef.current.geometry.dispose();
      loaderFillRef.current.material.dispose();
    }

    const phantom = new THREE.Mesh(
      new THREE.BoxGeometry(cargoDims.width, cargoDims.height, cargoDims.length),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    phantom.position.set(cargoDims.width/2, cargoDims.height/2, cargoDims.length/2);

    const edges = new THREE.BoxHelper(phantom, t.containerEdge);
    loaderEdgesRef.current = edges;
    sceneRef.current.add(edges);

    const fill = new THREE.Mesh(
      new THREE.BoxGeometry(cargoDims.width, cargoDims.height, cargoDims.length),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(t.containerFill),
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
      })
    );
    fill.position.copy(phantom.position);
    fill.raycast = () => {};
    loaderFillRef.current = fill;
    sceneRef.current.add(fill);

    setPivotToCenter();
  };

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current)
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Init
  useEffect(() => {
    if (!containerRef.current) return;
    tokensRef.current = readSceneTokens();

    containerRef.current.innerHTML = "";
    const scene = new THREE.Scene();      sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, size.width/size.height, 0.1, 10000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(size.width, size.height);
    renderer.setClearColor(tokensRef.current.bg);
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    controlsRef.current = new CameraControls(camera, renderer.domElement, {
      target: { x: cargoDims.width/2, y: cargoDims.height/2, z: cargoDims.length/2 },
      minPolarAngle: (10*Math.PI)/180, maxPolarAngle: (80*Math.PI)/180,
      minDistance: 4, maxDistance: 100,
    });
    setPivotToCenter();

    const light = new THREE.DirectionalLight(0xffffff, 1.05);
    light.position.set(20, 30, 20);
    scene.add(light);

    // Siatka startowa
    const grid = createFloorGrid(cargoDims.width, cargoDims.length, 10);
    grid.traverse(obj => {
      if (obj.isLine) {
        const isAccent = obj.userData?.isAccent;
        obj.material.color = isAccent ? tokensRef.current.gridAccent : tokensRef.current.gridMain;
        obj.material.opacity = isAccent ? 0.9 : 0.7;
        obj.material.transparent = true;
      }
    });
    scene.add(grid);
    floorGridRef.current = grid;

    // Fizyczna podłoga
    rapierRef.current = new RapierPhysics();
    rapierRef.current.world.createCollider(
      RAPIER.ColliderDesc.cuboid(cargoDims.width/2, 0.01, cargoDims.length/2)
        .setTranslation(cargoDims.width/2, -0.01, cargoDims.length/2)
    );

    renderContainerWalls();

    // Klik w puste = odznacz
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerUp = (event) => {
      if (event.button !== 0) return;
      if (draggingRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left)/rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top)/rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, cameraRef.current);
      const hit = raycaster.intersectObjects(Object.values(meshMapRef.current));
      if (hit.length === 0) onSelectBox && onSelectBox(null);
    };
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    let anim = true;
    const animate = () => {
      if (!anim) return;
      rapierRef.current?.step();
      for (const b of boxes) {
        const m = meshMapRef.current[b.id];
        const p = rapierRef.current?.getBoxPosition(b.id);
        if (m && p) m.position.set(p.x, p.y, p.z);
      }
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      anim = false;
      if (containerRef.current) containerRef.current.innerHTML = "";
      controlsRef.current?.dispose();
      dragControlsRef.current?.dispose();
      rapierRef.current = null;
    };
  }, [size.width, size.height]);

  // autoFit + natychmiast przywróć pivot
  useEffect(() => {
    autoFitCamera(cameraRef.current, controlsRef.current, cargoDims, size);
    setPivotToCenter();
  }, [cargoDims, size.width, size.height]);

  // ⬅️ TU FIX: przebuduj siatkę i ściany przy zmianie wymiarów
  useEffect(() => {
    // ściany
    renderContainerWalls();

    // siatka
    if (floorGridRef.current && sceneRef.current) {
      sceneRef.current.remove(floorGridRef.current);
      // Three nie wymaga manualnego dispose na LineBasicMaterial tworzonych w FloorGrid,
      // ale jeśli chcesz ultra-czyścić, możesz przejść i dispose'ować.
    }
    const grid = createFloorGrid(cargoDims.width, cargoDims.length, 10);
    grid.traverse(obj => {
      if (obj.isLine) {
        const isAccent = obj.userData?.isAccent;
        obj.material.color = isAccent ? tokensRef.current.gridAccent : tokensRef.current.gridMain;
        obj.material.opacity = isAccent ? 0.9 : 0.7;
        obj.material.transparent = true;
      }
    });
    sceneRef.current.add(grid);
    floorGridRef.current = grid;
  }, [cargoDims]);

  // Boxy + drag
  useEffect(() => {
    if (!sceneRef.current) return;
    const t = tokensRef.current;

    // wipe
    Object.values(meshMapRef.current).forEach(m => {
      sceneRef.current.remove(m);
      m.geometry?.dispose?.();
      m.material?.dispose?.();
    });
    meshMapRef.current = {};

    rapierRef.current = new RapierPhysics();
    rapierRef.current.world.createCollider(
      RAPIER.ColliderDesc.cuboid(cargoDims.width/2, 0.01, cargoDims.length/2)
        .setTranslation(cargoDims.width/2, -0.01, cargoDims.length/2)
    );

    boxes.forEach((box) => {
      const geo = new THREE.BoxGeometry(box.width, box.height, box.length);
      const baseColor = box.color ? new THREE.Color(box.color) : colorFromId(box.id, t.boxPalette);
      const mat = new THREE.MeshPhysicalMaterial({
        color: baseColor,
        opacity: 0.9, transparent: true,
        metalness: 0.1, roughness: 0.6, clearcoat: 0.1,
        emissive: (box.id === activeBoxId ? t.activeGlow : new THREE.Color("#000")),
        emissiveIntensity: (box.id === activeBoxId ? 0.55 : 0.0),
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (box.x ?? 0) + box.width/2,
        (box.y ?? 0) + box.height/2,
        (box.z ?? 0) + box.length/2
      );
      mesh.userData.boxId = box.id;
      meshMapRef.current[box.id] = mesh;
      sceneRef.current.add(mesh);

      rapierRef.current.addBox({
        id: box.id, x: box.x ?? 0, y: box.y ?? 0, z: box.z ?? 0,
        length: box.length ?? box.width, width: box.width, height: box.height
      });
    });

    dragControlsRef.current?.dispose();
    if (rendererRef.current && cameraRef.current && Object.keys(meshMapRef.current).length > 0) {
      dragControlsRef.current = new BoxDragControls({
        meshMap: meshMapRef.current,
        camera: cameraRef.current,
        domElement: rendererRef.current.domElement,
        allBoxes: boxes,
        rapierPhysics: rapierRef.current,
        onDragStart: (id) => { draggingRef.current = true; onBoxDragStart && onBoxDragStart(id); },
        onDragEnd:   (id, pos) => { draggingRef.current = false; onBoxDragEnd && onBoxDragEnd(id, pos); },
        onForceReStack,
        onContextMenu: (id, sx, sy) => { onShowContextMenu && onShowContextMenu(id, sx, sy); },
        onSelect: (id) => { onSelectBox && onSelectBox(id); },
        cargoDims, snapToGrid, lockToContainer
      });
    }
    return () => { dragControlsRef.current?.dispose(); };
  }, [boxes, cargoDims.width, cargoDims.length, snapToGrid, lockToContainer, activeBoxId, onShowContextMenu, onForceReStack, onSelectBox]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1, width: "100%", height: "100%", minHeight: 0, minWidth: 0,
        borderRadius: "var(--r-xl)",     // ⬅️ zaokrąglenie wg tokena
        overflow: "hidden",              // ⬅️ klipowanie canvasa
        background: "var(--bg)", boxShadow: "0 4px 24px rgba(0,0,0,.08)", margin: "auto",
      }}
    />
  );
}
