// frontend/src/components/CreateTemplateModal.jsx
import React, { useMemo, useRef, useState } from "react";

/**
 * Fullscreen overlay modal with a lightweight spreadsheet editor.
 * Opens over any page without changing the layout underneath.
 */
export default function CreateTemplateModal({ open, onClose, onSave }) {
  const initial = useMemo(
    () => Array.from({ length: 10 }, () => Array.from({ length: 6 }, () => "")),
    []
  );
  const [name, setName] = useState("Untitled Template");
  const [grid, setGrid] = useState(initial);
  const tableRef = useRef(null);

  if (!open) return null;

  const updateCell = (r, c, value) => {
    setGrid((g) => {
      const next = g.map((row) => row.slice());
      next[r][c] = value;
      return next;
    });
  };

  const addRow = () =>
    setGrid((g) => [...g, Array.from({ length: g[0].length }, () => "")]);

  const addColumn = () =>
    setGrid((g) => g.map((row) => [...row, ""]));

  const onKeyDown = (e, r, c) => {
    const maxR = grid.length - 1;
    const maxC = grid[0].length - 1;

    const moveFocus = (nr, nc) => {
      const next = tableRef.current?.querySelector(`[data-r="${nr}"][data-c="${nc}"]`);
      if (next) next.focus();
    };

    if (e.key === "Enter") { e.preventDefault(); if (r < maxR) moveFocus(r + 1, c); return; }
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        if (c > 0) moveFocus(r, c - 1);
        else if (r > 0) moveFocus(r - 1, maxC);
      } else {
        if (c < maxC) moveFocus(r, c + 1);
        else if (r < maxR) moveFocus(r + 1, 0);
      }
      return;
    }
    if (e.key === "ArrowRight" && c < maxC) { e.preventDefault(); moveFocus(r, c + 1); }
    if (e.key === "ArrowLeft"  && c > 0)   { e.preventDefault(); moveFocus(r, c - 1); }
    if (e.key === "ArrowDown"  && r < maxR){ e.preventDefault(); moveFocus(r + 1, c); }
    if (e.key === "ArrowUp"    && r > 0)   { e.preventDefault(); moveFocus(r - 1, c); }
  };

  const saveAndClose = () => {
    const payload = {
      name,
      createdAt: new Date().toISOString(),
      rows: grid.length,
      cols: grid[0].length,
      data: grid,
    };
    // Dev-only local save so you see something right away
    const cache = JSON.parse(localStorage.getItem("ceas_templates") || "[]");
    localStorage.setItem("ceas_templates", JSON.stringify([payload, ...cache]));
    onSave?.(payload);
    onClose?.();
  };

  // Inline styles to avoid conflicts with your CSS/Tailwind
  const overlay = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999
  };
  const panel = {
    background: "#fff", width: "96%", height: "92%", borderRadius: 16,
    display: "flex", flexDirection: "column", overflow: "hidden",
    boxShadow: "0 12px 40px rgba(0,0,0,.28)"
  };
  const headerRow = {
    display:"flex", alignItems:"center", justifyContent:"space-between",
    padding:"12px", borderBottom:"1px solid #e5e7eb"
  };
  const smallBtn = { padding:"8px 12px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff" };
  const saveBtn  = { padding:"8px 12px", borderRadius:8, background:"#059669", color:"#fff", border:"none" };
  const toolBar  = { padding:"10px 12px", borderBottom:"1px solid #e5e7eb", display:"flex", gap:8 };

  return (
    <div style={overlay} role="dialog" aria-modal="true">
      <div style={panel}>
        {/* Top bar */}
        <div style={headerRow}>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <input
              style={{fontSize:18, fontWeight:600, border:"1px solid #e5e7eb", borderRadius:8, padding:"6px 10px"}}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <span style={{fontSize:12, color:"#6b7280"}}>Spreadsheet Template</span>
          </div>
          <div style={{display:"flex", gap:8}}>
            <button onClick={onClose} style={smallBtn}>Cancel</button>
            <button onClick={saveAndClose} style={saveBtn}>Save Template</button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={toolBar}>
          <button onClick={addRow} style={smallBtn}>+ Row</button>
          <button onClick={addColumn} style={smallBtn}>+ Column</button>
          <span style={{marginLeft:8, fontSize:12, color:"#6b7280"}}>
            Enter/Tab to move • Shift+Tab left • Arrows navigate
          </span>
        </div>

        {/* Spreadsheet */}
        <div style={{flex:1, overflow:"auto"}}>
          <table ref={tableRef} style={{borderCollapse:"collapse", width:"100%", minWidth:900}}>
            <thead>
              <tr>
                <th style={{position:"sticky", top:0, background:"#f3f4f6", border:"1px solid #e5e7eb", width:48, height:36, textAlign:"center"}}>#</th>
                {grid[0].map((_, c) => (
                  <th
                    key={`h-${c}`}
                    style={{position:"sticky", top:0, background:"#f3f4f6", border:"1px solid #e5e7eb", padding:"0 8px", height:36, textAlign:"left"}}
                  >
                    {String.fromCharCode(65 + c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, r) => (
                <tr key={`r-${r}`}>
                  <td style={{background:"#f3f4f6", border:"1px solid #e5e7eb", textAlign:"center"}}>{r + 1}</td>
                  {row.map((val, c) => (
                    <td key={`c-${r}-${c}`} style={{border:"1px solid #e5e7eb", minWidth:140, height:36, padding:"0 8px"}}>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        data-r={r}
                        data-c={c}
                        onKeyDown={(e) => onKeyDown(e, r, c)}
                        onBlur={(e) => updateCell(r, c, e.currentTarget.textContent ?? "")}
                        style={{width:"100%", height:"100%", outline:"none"}}
                      >
                        {val}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}