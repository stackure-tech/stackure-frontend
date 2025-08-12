import React, { useState, useEffect, useRef } from "react";
import { ThemeProvider } from "./ThemeContext";
import TopBarContainer from "./features/TopBar.container";
import SidebarContainer from "./features/Sidebar.container";
import CargoList from "./features/CargoList.container";
import EditCargoModalContainer from "./features/EditCargoModal.container";
import ContextMenu from "./features/ContextMenu.container";
import { ThreePlanner } from "./components/ThreePlanner";
import { getSupportYBottom } from "./components/BoxDragControls";

export default function App() {
  const [cargoDims, setCargoDims] = useState({ length: 420, width: 220, height: 220 });

  const [boxes, setBoxes] = useState([]);
  const [nextBoxNum, setNextBoxNum] = useState(1);
  const [editBox, setEditBox] = useState(null);
  const [draggedBoxId, setDraggedBoxId] = useState(null);
  const [activeBoxId, setActiveBoxId] = useState(null);

  const [snapToGrid, setSnapToGrid] = useState(true);
  const [lockToContainer, setLockToContainer] = useState(true);
  const [stackMode, setStackMode] = useState("logic"); // "logic" / "free"

  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, boxId: null });
  const menuRef = useRef(null);

  const [folders, setFolders] = useState([
    { id: "unassigned", name: "Niezgrupowane", color: null, collapsed: false, builtin: true }
  ]);
  const [selectedIds, setSelectedIds] = useState([]);

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const activeBox = boxes.find(b => b.id === activeBoxId) || null;

  // Uzupełnij brakujące folderId
  useEffect(() => {
    if (boxes.some(b => b.folderId === undefined)) {
      setBoxes(prev => prev.map(b => (b.folderId === undefined ? { ...b, folderId: null } : b)));
    }
  }, [boxes]);

  // Zamykaj PPM po kliknięciu poza
  useEffect(() => {
    const onDown = (e) => {
      if (!menu.visible) return;
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenu({ visible: false, x: 0, y: 0, boxId: null });
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [menu.visible]);

  // --- Boxy ---

  function handleAddCargo(newBox) {
    const id = Math.random().toString(36).slice(2, 10);
    const length = +newBox.length || 120;
    const width  = +newBox.width  || 80;
    const height = +newBox.height || 15;

    const x = clamp(+newBox.x || 0, 0, cargoDims.width  - width);
    const z = clamp(+newBox.z || 0, 0, cargoDims.length - length);
    const y = clamp(+newBox.y || 0, 0, cargoDims.height - height);

    const box = {
      id,
      name: (newBox.name && newBox.name.trim()) ? newBox.name.trim() : `Box ${nextBoxNum}`,
      length, width, height,
      x, y, z,
      weight: newBox.weight ?? null,
      color: newBox.color || "#0051ff",
      folderId: newBox.folderId ?? null
    };

    setBoxes(prev => [...prev, box]);
    setNextBoxNum(n => n + 1);
    setActiveBoxId(id);
  }

  function handleRemoveCargo(id) {
    setBoxes(prev => prev.filter(b => b.id !== id));
    if (activeBoxId === id) setActiveBoxId(null);
    setSelectedIds(sel => sel.filter(sid => sid !== id));
  }

  function handleSaveEdit(edited) {
    setBoxes(prev => prev.map(b => (b.id === edited.id ? { ...b, ...edited } : b)));
    setEditBox(null);
  }

  function handleBoxDragStart(id) { setDraggedBoxId(id); }
  function handleBoxDragEnd(id, pos) {
    setDraggedBoxId(null);
    setBoxes(prev => prev.map(b => (b.id === id ? {
      ...b,
      x: clamp(pos.x, 0, cargoDims.width  - b.width),
      z: clamp(pos.z, 0, cargoDims.length - b.length),
      y: clamp(pos.y, 0, cargoDims.height - b.height)
    } : b)));
    if (stackMode === "logic") setTimeout(forceReStackAllBoxes, 0);
  }

  // Force re-stack (ułóż Y względem podpór)
  function forceReStackAllBoxes() {
    setBoxes(prev => {
      const sorted = [...prev].sort((a, b) => (a.y - b.y) || (a.z - b.z) || (a.x - b.x));
      const restacked = [];
      for (const b of sorted) {
        const supportY = getSupportYBottom(b, restacked);
        restacked.push({ ...b, y: clamp(supportY, 0, cargoDims.height - b.height) });
      }
      return restacked;
    });
  }

  // Obrót: pionowy (H <-> L) i poziomy (W <-> L)
  function rotateVertical(id) {
    setBoxes(prev => {
      const updated = prev.map(b => {
        if (b.id !== id) return b;
        const newH = b.length, newL = b.height, newW = b.width;
        const nx = clamp(b.x, 0, cargoDims.width - newW);
        const nz = clamp(b.z, 0, cargoDims.length - newL);
        const ny = clamp(b.y, 0, cargoDims.height - newH);
        return { ...b, width: newW, height: newH, length: newL, x: nx, y: ny, z: nz };
      });
      return updated;
    });
    setTimeout(forceReStackAllBoxes, 0);
  }

  function rotateHorizontal(id) {
    setBoxes(prev => prev.map(b => {
      if (b.id !== id) return b;
      const newW = b.length, newL = b.width, newH = b.height;
      const nx = clamp(b.x, 0, cargoDims.width - newW);
      const nz = clamp(b.z, 0, cargoDims.length - newL);
      const ny = clamp(b.y, 0, cargoDims.height - newH);
      return { ...b, width: newW, height: newH, length: newL, x: nx, y: ny, z: nz };
    }));
    setTimeout(forceReStackAllBoxes, 0);
  }

  // --- Foldery (bez sortowania) ---

  function addFolder(name) {
    const id = "f_" + Math.random().toString(36).slice(2, 8);
    setFolders(fs => [...fs, { id, name: name || "Folder", color: null, collapsed: false }]);
    return id;
  }
  function renameFolder(id, name) {
    setFolders(fs => fs.map(f => f.id === id ? { ...f, name } : f));
  }
  function deleteFolder(id) {
    if (id === "unassigned") return; // nieusuwalny
    setFolders(fs => fs.filter(f => f.id !== id));
    setBoxes(bx => bx.map(b => (b.folderId === id ? { ...b, folderId: null } : b)));
  }
  function setFolderCollapsed(id, collapsed) {
    setFolders(fs => fs.map(f => f.id === id ? { ...f, collapsed } : f));
  }
  function reorderFolders(nextOrderIds) {
    setFolders(fs => {
      const map = new Map(fs.map(f => [f.id, f]));
      const pinned = fs.find(f => f.id === "unassigned");
      const rebuilt = nextOrderIds.map(fid => map.get(fid)).filter(Boolean);
      const withoutPinned = rebuilt.filter(f => f && f.id !== "unassigned");
      return pinned ? [pinned, ...withoutPinned] : rebuilt;
    });
  }
  function moveBoxesToFolder(ids, targetFolderId) {
    setBoxes(bx => bx.map(b => (ids.includes(b.id) ? { ...b, folderId: targetFolderId === "unassigned" ? null : targetFolderId } : b)));
  }
  function reorderManualInFolder(folderId, orderedBoxIds) {
    setFolders(fs => fs.map(f => f.id === folderId ? { ...f, order: orderedBoxIds } : f));
  }

  // --- Menu PPM ---

  function openMenu(id, x, y) {
    setActiveBoxId(id);
    setMenu({ visible: true, x, y, boxId: id });
  }
  function closeMenu() { setMenu({ visible: false, x: 0, y: 0, boxId: null }); }

  return (
    <ThemeProvider>
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <TopBarContainer />

        <div style={{ flex: 1, display: "flex", flexDirection: "row", gap: 12, padding: "24px 0", minHeight: 0 }}>
          {/* Lewe menu */}
          <SidebarContainer
            cargoDims={cargoDims} setCargoDims={setCargoDims}
            onAddCargo={handleAddCargo}
            snapToGrid={snapToGrid} setSnapToGrid={setSnapToGrid}
            lockToContainer={lockToContainer} setLockToContainer={setLockToContainer}
            stackMode={stackMode} setStackMode={setStackMode}
            activeBox={activeBox}
            onEditActive={() => { if (activeBox) setEditBox(activeBox); }}
            onRemoveActive={() => { if (activeBox) handleRemoveCargo(activeBox.id); }}
          />

          {/* Widok 3D */}
          <div style={{ flex: 1, display: "flex", alignItems: "stretch", justifyContent: "center", minHeight: 0, minWidth: 0 }}>
            <ThreePlanner
              boxes={boxes}
              cargoDims={cargoDims}
              onBoxDragStart={handleBoxDragStart}
              onBoxDragEnd={handleBoxDragEnd}
              snapToGrid={snapToGrid}
              lockToContainer={lockToContainer}
              stackMode={stackMode}
              onForceReStack={forceReStackAllBoxes}
              onShowContextMenu={openMenu}
              activeBoxId={activeBoxId}
              onSelectBox={setActiveBoxId}
            />
          </div>

          {/* Prawe menu */}
          <CargoList
            boxes={boxes}
            folders={folders}
            selectedIds={selectedIds}
            activeBoxId={activeBoxId}
            onSelectionChange={setSelectedIds}
            onSetActiveBoxId={setActiveBoxId}
            onAddFolder={addFolder}
            onRenameFolder={renameFolder}
            onDeleteFolder={deleteFolder}
            onReorderFolders={reorderFolders}
            onSetFolderCollapsed={setFolderCollapsed}
            onMoveBoxesToFolder={moveBoxesToFolder}
            onReorderManualInFolder={reorderManualInFolder}
            onEdit={box => setEditBox(box)}
            onRemove={handleRemoveCargo}
          />

          {/* Modal edycji */}
          <EditCargoModalContainer
            open={!!editBox}
            box={editBox}
            onSave={handleSaveEdit}
            onClose={() => setEditBox(null)}
          />
        </div>

        {/* Menu PPM w scenie */}
        <ContextMenu
          ref={menuRef}
          x={menu.x}
          y={menu.y}
          visible={menu.visible}
          onClose={closeMenu}
          onRotateV={() => rotateVertical(menu.boxId)}
          onRotateH={() => rotateHorizontal(menu.boxId)}
          onEdit={() => { const b = boxes.find(bb => bb.id === menu.boxId); if (b) setEditBox(b); }}
          onDelete={() => handleRemoveCargo(menu.boxId)}
        />
      </div>
    </ThemeProvider>
  );
}
