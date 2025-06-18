import React, { useState } from 'react';

const tools = [
  {
    name: 'Kursor',
    value: 'select',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <polygon points="3,3 21,12 14,14 12,21" fill="#fff" stroke="#888" strokeWidth="2" />
      </svg>
    ),
  },
  { name: 'Pensil', value: 'pencil', icon: '✏️' },
  { name: 'Pena', value: 'pen', icon: '🖊️' },
  { name: 'Penghapus', value: 'eraser', icon: '🧽' },
  {
    name: 'Eclipse',
    value: 'ellipse',
    icon: (
      <span
        style={{
          display: 'inline-block',
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #fff 40%, #888 100%)',
          border: '2px solid #888',
        }}
      />
    ),
  },
  {
    name: 'Line',
    value: 'line',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <line x1="4" y1="20" x2="20" y2="4" stroke="#888" strokeWidth="3" />
      </svg>
    ),
  },
  {
    name: 'Warna',
    value: 'color',
    icon: (
      <span
        style={{
          display: 'inline-block',
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'conic-gradient(red, orange, yellow, green, blue, violet, red)',
          border: '2px solid #888',
        }}
      />
    ),
    isColor: true,
  },
  {
    name: 'Rectangle',
    value: 'rectangle',
    icon: (
      <span
        style={{
          display: 'inline-block',
          width: 24,
          height: 24,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #fff 40%, #888 100%)',
          border: '2px solid #888',
        }}
      />
    ),
  },
  {
    name: 'Triangle',
    value: 'triangle',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <polygon points="12,4 20,20 4,20" fill="#fff" stroke="#888" strokeWidth="2" />
      </svg>
    ),
  },
];
const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FFFFFF'];

export default function Navbar({ tool, setTool, color, setColor }) {
  const [showColors, setShowColors] = useState(false);

  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '2rem 0.5rem',
        background: '#f4f4f4',
        borderRight: '1px solid #ddd',
        minHeight: '100vh',
        minWidth: 70,
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 10,
      }}
    >
      {tools.map((t) =>
        t.isColor ? (
          <div key={t.value} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowColors((v) => !v)}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '2px solid #888',
                background: 'conic-gradient(red, orange, yellow, green, blue, violet, red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginTop: 24,
                boxShadow: showColors ? '0 2px 8px #bbb' : 'none',
              }}
              aria-label="Pilih warna"
            >
              {/* icon pelangi */}
            </button>
            {showColors && (
              <div
                style={{
                  position: 'absolute',
                  top: 44,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  zIndex: 100,
                  boxShadow: '0 2px 8px #bbb',
                }}
              >
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setColor(c);
                      setShowColors(false);
                    }}
                    style={{
                      background: c,
                      border: color === c ? '2px solid #333' : '1px solid #ccc',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      cursor: 'pointer',
                    }}
                    aria-label={`Pilih warna ${c}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            key={t.value}
            onClick={() => setTool(t.value)}
            style={{
              fontSize: 24,
              padding: '0.7em',
              background: tool === t.value ? '#e0e0e0' : '#fff',
              border: tool === t.value ? '2px solid #333' : '1px solid #ccc',
              borderRadius: 8,
              cursor: 'pointer',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: tool === t.value ? '0 2px 8px #bbb' : 'none',
              transition: 'all 0.2s',
            }}
            aria-label={t.name}
          >
            <span>{t.icon}</span>
          </button>
        )
      )}
    </nav>
  );
}
