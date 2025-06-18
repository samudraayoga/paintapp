import React, { useRef } from 'react';

export default function RightNavbar({ onSave, onImport }) {
  const fileInputRef = useRef();

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (onImport) onImport(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '2rem 0.5rem',
        background: '#f4f4f4',
        borderLeft: '1px solid #ddd',
        minHeight: '100vh',
        minWidth: 70,
        position: 'fixed',
        right: 0,
        top: 0,
        zIndex: 10,
      }}
    >
      <button
        onClick={onSave}
        style={{
          width: 70,
          height: 70,
          borderRadius: 10,
          background: '#fff',
          border: '2.5px solid #888',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        aria-label="Save"
      >
        {/* Ikon disket SVG */}
        <svg width="54" height="54" viewBox="0 0 40 40" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="5" width="30" height="30" rx="4" ry="4" fill="#e0e0e0" />
          <path d="M29 5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 11 13V5" />
          <rect x="14" y="24" width="12" height="9" rx="2" fill="#fff" />
        </svg>
      </button>
      <button
        onClick={handleImportClick}
        style={{
          width: 70,
          height: 70,
          borderRadius: 10,
          background: '#fff',
          border: '2.5px solid #888',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        aria-label="Import Gambar"
      >
        {/* Ikon import gambar (gambar + panah) */}
        <svg width="54" height="54" viewBox="0 0 40 40" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="10" width="26" height="20" rx="3" fill="#e0e0e0" />
          <path d="M13 24l5-6 5 6 4-5 4 5" stroke="#888" strokeWidth="2" fill="none" />
          <path d="M20 6v10" stroke="#333" strokeWidth="2.5" />
          <path d="M17 13l3 3 3-3" stroke="#333" strokeWidth="2.5" fill="none" />
        </svg>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </button>
    </nav>
  );
}
