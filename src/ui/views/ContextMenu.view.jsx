import React from "react";

/** Czysty UI menu kontekstowego */
const ContextMenuView = React.forwardRef(function ContextMenuView(
  { x, y, visible, onClose, onRotateV, onRotateH, onEdit, onDelete },
  ref
) {
  if (!visible) return null;

  const item = {
    padding: "8px 12px",
    cursor: "pointer",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    userSelect: "none",
  };

  return (
    <div
      ref={ref}
      className="panel"
      style={{
        position: "fixed",
        left: x, top: y, zIndex: 2000,
        padding: 6, minWidth: 200
      }}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div style={item} onClick={() => { onRotateV(); onClose(); }} title="120×80×200 → 200×80×120">↕️ Obróć w pionie</div>
      <div style={item} onClick={() => { onRotateH(); onClose(); }} title="120×80×200 → 80×120×200">↔️ Obróć w poziomie</div>
      <hr style={{ margin: "6px 0", borderColor: "var(--border)" }} />
      <div style={item} onClick={() => { onEdit(); onClose(); }}>✏️ Edytuj</div>
      <div style={{ ...item, color: "#c11c2a" }} onClick={() => { onDelete(); onClose(); }}>🗑️ Usuń</div>
    </div>
  );
});

export default ContextMenuView;
