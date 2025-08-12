import React, { useState, useEffect } from "react";
import EditCargoModalView from "../ui/views/EditCargoModal.view";

/** Zachowuje 100% obecnej funkcjonalności */
export default function EditCargoModalContainer({ open, box, onSave, onClose }) {
  const [edit, setEdit] = useState(box || {});

  useEffect(() => { setEdit(box || {}); }, [box]);

  if (!open || !box) return null;

  return (
    <EditCargoModalView
      open={open}
      edit={edit}
      onClose={onClose}
      onChange={(patch) => setEdit(prev => ({ ...prev, ...patch }))}
      onSave={() => { onSave(edit); onClose(); }}
    />
  );
}
