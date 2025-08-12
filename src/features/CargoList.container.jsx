import React, { useMemo, useRef, useState } from "react";
import CargoListView from "../ui/views/CargoList.view";

export default function CargoListContainer({
  boxes,
  folders,
  selectedIds,
  activeBoxId,
  onSelectionChange,
  onSetActiveBoxId,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onReorderFolders,
  onSetFolderCollapsed,
  onMoveBoxesToFolder,
  onReorderManualInFolder,
  onEdit,
  onRemove,
}) {
  const [renamingFolderId, setRenamingFolderId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // {x,y,type:"folder"|"box", folderId?, boxId?}
  const lastClickRef = useRef({ folderId: null, boxId: null });

  const folderMap = useMemo(() => {
    const map = new Map();
    folders.forEach(f => map.set(f.id, f));
    return map;
  }, [folders]);

  const boxesByFolder = useMemo(() => {
    const by = new Map();
    folders.forEach(f => by.set(f.id, []));
    by.set("unassigned", by.get("unassigned") || []);
    for (const b of boxes) {
      const fid = b.folderId || "unassigned";
      if (!by.has(fid)) by.set(fid, []);
      by.get(fid).push(b);
    }
    return by;
  }, [boxes, folders]);

  function sortBoxesForFolder(fid) {
    const folder = folderMap.get(fid);
    const list = [...(boxesByFolder.get(fid) || [])];
    if (folder && Array.isArray(folder.order) && folder.order.length) {
      const idToBox = new Map(list.map(b => [b.id, b]));
      const ordered = folder.order.map(id => idToBox.get(id)).filter(Boolean);
      const rest = list.filter(b => !folder.order.includes(b.id));
      return [...ordered, ...rest];
    }
    return list;
  }

  // Context menu
  const openContext = (e, payload) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, ...payload }); };
  const closeContext = () => setContextMenu(null);

  // Folder ops
  const handleFolderAdd = () => { const id = onAddFolder("Nowy folder"); setRenamingFolderId(id); };
  const handleFolderRename = (id, name) => onRenameFolder(id, name.trim() || "Folder");
  const handleFolderDelete = (id) => onDeleteFolder(id);

  // Selection
  function setActiveAndSelect(id, folderId) {
    onSetActiveBoxId(id);
    onSelectionChange([id]);
    lastClickRef.current = { folderId, boxId: id };
  }
  function toggleSelect(id) {
    const set = new Set(selectedIds);
    if (set.has(id)) set.delete(id); else set.add(id);
    onSelectionChange(Array.from(set));
  }
  function rangeSelect(folderId, toId) {
    const list = sortBoxesForFolder(folderId);
    const anchorId = lastClickRef.current && lastClickRef.current.folderId === folderId ? lastClickRef.current.boxId : null;
    if (!anchorId) { setActiveAndSelect(toId, folderId); return; }
    const a = list.findIndex(b => b.id === anchorId);
    const b = list.findIndex(b => b.id === toId);
    if (a === -1 || b === -1) { setActiveAndSelect(toId, folderId); return; }
    const [start, end] = a < b ? [a, b] : [b, a];
    const ids = list.slice(start, end + 1).map(bx => bx.id);
    onSelectionChange(ids);
    onSetActiveBoxId(toId);
  }

  // DnD
  const [dragPayload, setDragPayload] = useState(null); // {type:"boxes"|"folder", ids?, fromFolderId?, folderId?}
  const [hoverIndex, setHoverIndex] = useState({ folderId: null, index: -1 });

  function onBoxDragStart(e, folderId, boxId) {
    const ids = selectedIds.includes(boxId) ? selectedIds : [boxId];
    const payload = { type: "boxes", ids, fromFolderId: folderId };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    setDragPayload(payload);
    e.dataTransfer.effectAllowed = "move";
  }
  function onFolderDragStart(e, folderId) {
    if (folderId === "unassigned") return;
    const payload = { type: "folder", folderId };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    setDragPayload(payload);
    e.dataTransfer.effectAllowed = "move";
  }
  function readPayload(e) {
    try { return JSON.parse(e.dataTransfer.getData("application/json")); }
    catch { return dragPayload; }
  }
  function onFolderDragOver(e, folderId) {
    const p = readPayload(e);
    if (!p) return;
    if (p.type === "boxes" || (p.type === "folder" && folderId !== "unassigned")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  }
  function onFolderDrop(e, folderId) {
    const p = readPayload(e);
    if (!p) return;
    if (p.type === "boxes") {
      onMoveBoxesToFolder(p.ids, folderId);
    } else if (p.type === "folder") {
      if (p.folderId !== "unassigned" && folderId !== "unassigned" && p.folderId !== folderId) {
        const ids = folders.map(f => f.id);
        const fromIdx = ids.indexOf(p.folderId);
        const toIdx = ids.indexOf(folderId);
        if (fromIdx !== -1 && toIdx !== -1) {
          ids.splice(toIdx, 0, ids.splice(fromIdx, 1)[0]);
          onReorderFolders(ids);
        }
      }
    }
    setDragPayload(null);
  }
  function onItemDragOver(e, folderId, targetIndex) {
    const p = readPayload(e);
    if (!p || p.type !== "boxes") return;
    e.preventDefault();
    setHoverIndex({ folderId, index: targetIndex });
  }
  function onItemDrop(e, folderId) {
    const p = readPayload(e);
    if (!p || p.type !== "boxes") { setHoverIndex({ folderId: null, index: -1 }); return; }
    const list = sortBoxesForFolder(folderId);
    const ids = list.map(b => b.id);
    const moving = p.ids;
    const remaining = ids.filter(id => !moving.includes(id));
    const idx = hoverIndex.index < 0 ? remaining.length : hoverIndex.index;
    remaining.splice(idx, 0, ...moving);
    onReorderManualInFolder(folderId, remaining);
    setHoverIndex({ folderId: null, index: -1 });
  }

  return (
    <CargoListView
      folders={folders}
      boxes={boxes}
      folderMap={folderMap}
      boxesByFolder={boxesByFolder}
      sortBoxesForFolder={sortBoxesForFolder}
      selectedIds={selectedIds}
      activeBoxId={activeBoxId}
      renamingFolderId={renamingFolderId}
      setRenamingFolderId={setRenamingFolderId}
      handleFolderAdd={handleFolderAdd}
      handleFolderRename={handleFolderRename}
      handleFolderDelete={handleFolderDelete}
      onSetFolderCollapsed={onSetFolderCollapsed}
      setActiveAndSelect={setActiveAndSelect}
      toggleSelect={toggleSelect}
      rangeSelect={rangeSelect}
      onEdit={onEdit}
      onRemove={onRemove}
      onOpenContext={openContext}
      onCloseContext={closeContext}
      contextMenu={contextMenu}
      onMoveBoxesToFolder={onMoveBoxesToFolder}
      onFolderDragStart={onFolderDragStart}
      onFolderDragOver={onFolderDragOver}
      onFolderDrop={onFolderDrop}
      onBoxDragStart={onBoxDragStart}
      onItemDragOver={onItemDragOver}
      onItemDrop={onItemDrop}
      hoverIndex={hoverIndex}
    />
  );
}
