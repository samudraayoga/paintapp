import { useState, useRef } from 'react';
import './App.css';
import Navbar from './assets/components/navbar.jsx';
import Toolbar from './assets/components/toolbar.jsx';
import Canvas from './assets/components/canvas.jsx';
import RightNavbar from './assets/components/rightNavbar.jsx';

function App() {
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(4);
  const [clearKey, setClearKey] = useState(0);
  const [tool, setTool] = useState('pencil');
  const [undoKey, setUndoKey] = useState(0);
  const [redoKey, setRedoKey] = useState(0);
  const [importImg, setImportImg] = useState(null);
  const canvasRef = useRef();

  const handleClear = () => setClearKey(k => k + 1);
  const handleUndo = () => setUndoKey(k => k + 1);
  const handleRedo = () => setRedoKey(k => k + 1);

  // Save canvas as image
  const handleSave = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'paintapp.png';
    a.click();
  };

  // Import image
  const handleImport = (imgDataUrl) => {
    setImportImg(imgDataUrl);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar tool={tool} setTool={setTool} color={color} setColor={setColor} />
      <div style={{ flex: 1, marginLeft: 70, marginRight: 70, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Toolbar size={size} setSize={setSize} onClear={handleClear} onUndo={handleUndo} onRedo={handleRedo} />
        <Canvas ref={canvasRef} color={color} size={size} clearTrigger={clearKey} tool={tool} undoKey={undoKey} redoKey={redoKey} importImg={importImg} setImportImg={setImportImg} />
      </div>
      <RightNavbar onSave={handleSave} onImport={handleImport} />
    </div>
  );
}

export default App;
