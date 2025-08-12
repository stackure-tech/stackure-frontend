import React, { useState } from "react";
import SidebarView from "../ui/views/Sidebar.view";

/** Tylko przekładka logiki -> UI. ZERO zmian działania. */
export default function SidebarContainer({
  cargoDims, setCargoDims,
  onAddCargo,
  snapToGrid, setSnapToGrid,
  lockToContainer, setLockToContainer,
}) {
  const PRESETS = {
    euro:{length:120,width:80,height:100,label:"Euro Pallet (120x80x100)"},
    industrial:{length:120,width:100,height:100,label:"Industrial Pallet (120x100x100)"},
    half:{length:60,width:80,height:100,label:"Half Pallet (60x80x100)"},
    custom:{length:120,width:80,height:100,label:"Custom"},
  };
  const [presetKey,setPresetKey]=useState("custom");
  const [newBox,setNewBox]=useState({length:120,width:80,height:100,name:""});

  function handlePresetChange(key){
    setPresetKey(key);
    const p=PRESETS[key]||PRESETS.custom;
    setNewBox(prev=>({...prev,length:p.length,width:p.width,height:p.height}));
  }
  function handleAdd(){
    const length=Math.max(1,Number(newBox.length)||120);
    const width =Math.max(1,Number(newBox.width)||80);
    const height=Math.max(1,Number(newBox.height)||100);
    onAddCargo?.({length,width,height,name:newBox.name?.trim()||undefined});
  }

  return (
    <SidebarView
      cargoDims={cargoDims}
      onChangeCargoDims={setCargoDims}
      snapToGrid={snapToGrid}
      onToggleSnapToGrid={setSnapToGrid}
      lockToContainer={lockToContainer}
      onToggleLockToContainer={setLockToContainer}
      presets={PRESETS}
      presetKey={presetKey}
      onChangePresetKey={handlePresetChange}
      newBox={newBox}
      onChangeNewBox={setNewBox}
      onAdd={handleAdd}
    />
  );
}
