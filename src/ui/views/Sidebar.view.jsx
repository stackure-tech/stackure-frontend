import React, { useState } from "react";

export default function SidebarView({
  cargoDims, onChangeCargoDims,
  snapToGrid, onToggleSnapToGrid,
  lockToContainer, onToggleLockToContainer,
  presets, presetKey, onChangePresetKey,
  newBox, onChangeNewBox,
  onAdd,
}) {
  const [openDims, setOpenDims] = useState(true);
  const [openAdd, setOpenAdd]   = useState(true);
  const [openOpts, setOpenOpts] = useState(true);

  return (
    <aside className="panel" style={{width:360,minWidth:320,maxWidth:380,padding:16,display:"flex",flexDirection:"column",gap:16}}>
      {/* Wymiary */}
      <section className={`accordion ${openDims ? "" : "acc-collapsed"}`}>
        <header className="acc-head" onClick={()=>setOpenDims(v=>!v)} role="button" tabIndex={0}>
          <span>Wymiary miejsca ładunkowego</span>
          <span className="acc-icon">▾</span>
        </header>
        <div className="acc-body">
          <div className="grid-2">
            <LabeledNumber label="Długość (cm)" value={cargoDims.length} onChange={v=>onChangeCargoDims({...cargoDims,length:v})} min={10}/>
            <LabeledNumber label="Szerokość (cm)" value={cargoDims.width}  onChange={v=>onChangeCargoDims({...cargoDims,width:v})}  min={10}/>
            <LabeledNumber label="Wysokość (cm)" value={cargoDims.height} onChange={v=>onChangeCargoDims({...cargoDims,height:v})} min={10}/>
          </div>
        </div>
      </section>

      {/* Dodaj ładunek */}
      <section className={`accordion ${openAdd ? "" : "acc-collapsed"}`}>
        <header className="acc-head" onClick={()=>setOpenAdd(v=>!v)} role="button" tabIndex={0}>
          <span>Dodaj ładunek</span>
          <span className="acc-icon">▾</span>
        </header>
        <div className="acc-body">
          <label className="label" style={{display:"flex",flexDirection:"column",gap:6}}>
            <span>Typ</span>
            <select className="select kbd-focus" value={presetKey} onChange={e=>onChangePresetKey(e.target.value)}>
              <option value="euro">{presets.euro.label}</option>
              <option value="industrial">{presets.industrial.label}</option>
              <option value="half">{presets.half.label}</option>
              <option value="custom">{presets.custom.label}</option>
            </select>
          </label>

          <div className="grid-2" style={{marginTop:12}}>
            <LabeledNumber label="Długość (cm)" value={newBox.length} onChange={v=>onChangeNewBox({...newBox,length:v})}/>
            <LabeledNumber label="Szerokość (cm)" value={newBox.width}  onChange={v=>onChangeNewBox({...newBox,width:v})}/>
            <LabeledNumber label="Wysokość (cm)" value={newBox.height} onChange={v=>onChangeNewBox({...newBox,height:v})}/>
            <label className="label" style={{display:"flex",flexDirection:"column",gap:6}}>
              <span>Nazwa (opcjonalnie)</span>
              <input className="input kbd-focus" type="text" value={newBox.name||""} onChange={e=>onChangeNewBox({...newBox,name:e.target.value})}/>
            </label>
          </div>

          <button className="btn kbd-focus" onClick={onAdd} style={{marginTop:12}}>Dodaj ładunek</button>
        </div>
      </section>

      {/* Opcje */}
      <section className={`accordion ${openOpts ? "" : "acc-collapsed"}`}>
        <header className="acc-head" onClick={()=>setOpenOpts(v=>!v)} role="button" tabIndex={0}>
          <span>Opcje</span>
          <span className="acc-icon">▾</span>
        </header>
        <div className="acc-body">
          <div className="stack-v">
            <label style={{display:"flex",alignItems:"center",gap:10}}>
              <input type="checkbox" checked={!!snapToGrid} onChange={e=>onToggleSnapToGrid(e.target.checked)}/>
              <span>Snap do siatki (10 cm)</span>
            </label>
            <label style={{display:"flex",alignItems:"center",gap:10}}>
              <input type="checkbox" checked={!!lockToContainer} onChange={e=>onToggleLockToContainer(e.target.checked)}/>
              <span>Blokada poza kontener</span>
            </label>
          </div>
        </div>
      </section>
    </aside>
  );
}

function LabeledNumber({label,value,onChange,min=1}){
  return (
    <label className="label" style={{display:"flex",flexDirection:"column",gap:6}}>
      <span>{label}</span>
      <input className="input kbd-focus" type="number" min={min} value={value} onChange={e=>onChange(Number(e.target.value))}/>
    </label>
  );
}
