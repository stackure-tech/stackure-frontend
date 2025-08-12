import React from "react";

export default function CargoListView(props) {
  const {
    folders, boxes, folderMap, boxesByFolder, sortBoxesForFolder,
    selectedIds, activeBoxId,
    renamingFolderId, setRenamingFolderId,
    handleFolderAdd, handleFolderRename, handleFolderDelete, onSetFolderCollapsed,
    setActiveAndSelect, toggleSelect, rangeSelect,
    onEdit, onRemove,
    onOpenContext, onCloseContext, contextMenu, onMoveBoxesToFolder,
    onFolderDragStart, onFolderDragOver, onFolderDrop,
    onBoxDragStart, onItemDragOver, onItemDrop,
    hoverIndex,
  } = props;

  return (
    <aside
      className="panel"
      style={{
        width: 320,
        minHeight: "calc(100vh - 64px)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        overflow: "auto"
      }}
    >
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn"
          onClick={() => {
            const id = handleFolderAdd();
            setRenamingFolderId(id);
          }}
        >
          + Folder
        </button>
        {selectedIds.length > 0 && (
          <div className="badge-weak" style={{ alignSelf: "center" }}>
            Zaznaczonych: {selectedIds.length}
          </div>
        )}
      </div>

      {/* Folders */}
      {folders.map((f) => (
        <div key={f.id}>
          {renderFolderHeader()(f)}
          {!f.collapsed && (
            <div
              onDragOver={(e) => onFolderDragOver(e, f.id)}
              onDrop={(e) => onFolderDrop(e, f.id)}
              style={{ marginTop: 6 }}
            >
              {sortBoxesForFolder(f.id).map((b, idx) => renderBoxItem(f, b, idx))}
              <div
                style={{ height: 10 }}
                onDragOver={(e) =>
                  onItemDragOver(e, f.id, Number.MAX_SAFE_INTEGER)
                }
                onDrop={(e) => onItemDrop(e, f.id)}
              />
            </div>
          )}
        </div>
      ))}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="panel"
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            padding: 6,
            zIndex: 10000,
            minWidth: 220
          }}
          onMouseLeave={onCloseContext}
        >
          {contextMenu.type === "folder" ? (
            <div>
              <MenuItem
                onClick={() => {
                  const id = handleFolderAdd();
                  setRenamingFolderId(id);
                }}
              >
                Nowy folder
              </MenuItem>
              <MenuItem
                onClick={() =>
                  onSetFolderCollapsed(
                    contextMenu.folderId,
                    !(folderMap.get(contextMenu.folderId)?.collapsed)
                  )
                }
              >
                {folderMap.get(contextMenu.folderId)?.collapsed
                  ? "Rozwiń"
                  : "Zwiń"}
              </MenuItem>
              {contextMenu.folderId !== "unassigned" && (
                <>
                  <MenuItem
                    onClick={() => setRenamingFolderId(contextMenu.folderId)}
                  >
                    Zmień nazwę
                  </MenuItem>
                  <MenuItem
                    danger
                    onClick={() => handleFolderDelete(contextMenu.folderId)}
                  >
                    Usuń folder
                  </MenuItem>
                </>
              )}
            </div>
          ) : (
            <div>
              <MenuItem
                onClick={() => {
                  toggleSelect(contextMenu.boxId);
                }}
              >
                {selectedIds.includes(contextMenu.boxId)
                  ? "Odznacz"
                  : "Zaznacz"}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setActiveAndSelect(
                    contextMenu.boxId,
                    folderIdOf(contextMenu.boxId)
                  );
                }}
              >
                Zaznacz tylko ten
              </MenuItem>
              <MenuItem
                onClick={() => {
                  const b = boxes.find((bb) => bb.id === contextMenu.boxId);
                  if (b) onEdit(b);
                }}
              >
                Edytuj…
              </MenuItem>
              <MenuItem danger onClick={() => onRemove(contextMenu.boxId)}>
                Usuń
              </MenuItem>
              <div
                style={{
                  padding: "6px 8px",
                  opacity: 0.7,
                  fontSize: 12
                }}
              >
                Przenieś do…
              </div>
              <div style={{ maxHeight: 220, overflow: "auto" }}>
                {folders.map((f) => (
                  <MenuItem
                    key={f.id}
                    onClick={() =>
                      onMoveBoxesToFolder(
                        selectedIds.includes(contextMenu.boxId)
                          ? selectedIds
                          : [contextMenu.boxId],
                        f.id
                      )
                    }
                  >
                    {f.name}
                  </MenuItem>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );

  function folderIdOf(boxId) {
    for (const [fid, arr] of boxesByFolder.entries()) {
      if ((arr || []).some((b) => b.id === boxId)) return fid;
    }
    return "unassigned";
  }

  function renderFolderHeader() {
    return (f) => {
      const count = (boxesByFolder.get(f.id) || []).length;
      const isPinned = f.id === "unassigned";
      const nameEditor = renamingFolderId === f.id;
      return (
        <div
          key={`hdr_${f.id}`}
          className="card"
          draggable={!isPinned}
          onDragStart={(e) => onFolderDragStart(e, f.id)}
          onDragOver={(e) => onFolderDragOver(e, f.id)}
          onDrop={(e) => onFolderDrop(e, f.id)}
          onContextMenu={(e) =>
            onOpenContext(e, { type: "folder", folderId: f.id })
          }
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 10px",
            marginTop: 10
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => onSetFolderCollapsed(f.id, !f.collapsed)}
              title={f.collapsed ? "Rozwiń" : "Zwiń"}
              className="btn"
              style={{
                background: "transparent",
                color: "var(--fg)",
                border: "1px solid var(--border)",
                padding: "2px 8px",
                borderRadius: 12
              }}
            >
              {f.collapsed ? "▸" : "▾"}
            </button>
            {nameEditor ? (
              <input
                autoFocus
                defaultValue={f.name}
                onBlur={(e) => {
                  setRenamingFolderId(null);
                  handleFolderRename(f.id, e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") setRenamingFolderId(null);
                }}
                className="input"
                style={{ width: 160 }}
              />
            ) : (
              <div style={{ fontWeight: 800, fontSize: 13 }}>{f.name}</div>
            )}
            <div className="subtle">({count})</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {!isPinned && (
              <button
                onClick={() => setRenamingFolderId(f.id)}
                className="btn"
                style={{
                  background: "transparent",
                  color: "var(--fg)",
                  border: "1px solid var(--border)"
                }}
              >
                ✎
              </button>
            )}
            {!isPinned && (
              <button
                onClick={() => handleFolderDelete(f.id)}
                className="btn"
                style={{
                  background: "transparent",
                  color: "#c11c2a",
                  border: "1px solid var(--border)"
                }}
              >
                🗑
              </button>
            )}
          </div>
        </div>
      );
    };
  }

  function renderBoxItem(f, b, index) {
    const isActive = activeBoxId === b.id;
    const isSelected = selectedIds.includes(b.id);
    const commonStyle = {
      padding: 10,
      marginTop: 8,
      border: isActive ? "2px solid #111827" : "1px solid var(--border)",
      background: isSelected ? "var(--surface-2)" : "var(--surface)",
      cursor: "pointer",
      userSelect: "none"
    };
    return (
      <div
        key={b.id}
        className="card"
        draggable
        onDragStart={(e) => onBoxDragStart(e, f.id, b.id)}
        onDragOver={(e) => onItemDragOver(e, f.id, index)}
        onDrop={(e) => onItemDrop(e, f.id)}
        onContextMenu={(e) =>
          onOpenContext(e, { type: "box", folderId: f.id, boxId: b.id })
        }
        onClick={(e) => {
          if (e.shiftKey) rangeSelect(f.id, b.id);
          else if (e.metaKey || e.ctrlKey) toggleSelect(b.id);
          else setActiveAndSelect(b.id, f.id);
        }}
        style={commonStyle}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                borderRadius: 4,
                background: b.color || "#0051ff"
              }}
            />
            <div style={{ fontWeight: 700, fontSize: 12 }}>
              {b.name || `#${b.id}`}
            </div>
            <div className="subtle">
              {b.length}×{b.width}×{b.height} cm
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(b);
              }}
              className="btn"
              style={{
                background: "transparent",
                color: "var(--fg)",
                border: "1px solid var(--border)",
                padding: "4px 8px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700
              }}
            >
              Edytuj
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(b.id);
              }}
              className="btn"
              style={{
                background: "transparent",
                color: "#c11c2a",
                border: "1px solid var(--border)",
                padding: "4px 8px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700
              }}
            >
              Usuń
            </button>
          </div>
        </div>
        {hoverIndex.folderId === f.id && hoverIndex.index === index && (
          <div
            style={{
              height: 6,
              borderRadius: 3,
              marginTop: 8,
              background: "#A5B4FC88"
            }}
          />
        )}
      </div>
    );
  }
}

const MenuItem = ({ children, onClick, danger }) => (
  <div
    onClick={onClick}
    className="hover-lift"
    style={{
      padding: "6px 8px",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 700,
      color: danger ? "#c11c2a" : "inherit"
    }}
  >
    {children}
  </div>
);
