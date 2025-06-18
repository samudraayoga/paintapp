import React from 'react';

const sizes = [2, 4, 8, 12, 20];

export default function Toolbar({ size, setSize, onClear, onUndo, onRedo }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div>
        <span>Ukuran: </span>
        <select value={size} onChange={e => setSize(Number(e.target.value))}>
          {sizes.map(s => (
            <option key={s} value={s}>{s}px</option>
          ))}
        </select>
      </div>
      <button onClick={onClear} style={{ padding: '0.5em 1em' }}>Bersihkan</button>
      <button onClick={onUndo} style={{ padding: '0.5em 1em' }} aria-label="Undo">↶ Undo</button>
      <button onClick={onRedo} style={{ padding: '0.5em 1em' }} aria-label="Redo">↷ Redo</button>
    </div>
  );
}
