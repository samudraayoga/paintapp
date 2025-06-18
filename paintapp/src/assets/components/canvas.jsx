import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

const Canvas = forwardRef(function Canvas({ color, size, clearTrigger, tool = 'pencil', undoKey, redoKey, importImg, setImportImg }, ref) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [currentStroke, setCurrentStroke] = useState(null);
  const [shapeStart, setShapeStart] = useState(null);
  const [shapePreview, setShapePreview] = useState(null);
  const [shapes, setShapes] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [prevColor, setPrevColor] = useState('#000000');
  const [shiftKey, setShiftKey] = useState(false);
  const [cursor, setCursor] = useState({ visible: false, x: 0, y: 0 });

  // --- SELECTION TOOL ---
  const [selectedIdxs, setSelectedIdxs] = useState([]); // multiple selection
  const [dragOffset, setDragOffset] = useState(null);
  const [marqueeStart, setMarqueeStart] = useState(null);
  const [marqueeEnd, setMarqueeEnd] = useState(null);

  // --- ZOOM STATE ---
  const [zoom, setZoom] = useState(1);
  const [zoomCenter, setZoomCenter] = useState({ x: 400, y: 300 }); // default center

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current
  }), []);

  useEffect(() => {
    if (clearTrigger) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setShapes([]);
      setRedoStack([]);
    }
  }, [clearTrigger]);

  useEffect(() => {
    if (tool === 'eraser') setPrevColor(color);
  }, [tool]);

  // Undo
  useEffect(() => {
    if (undoKey > 0 && shapes.length > 0) {
      setRedoStack(rs => [shapes[shapes.length - 1], ...rs]);
      setShapes(s => s.slice(0, -1));
    }
  }, [undoKey]);

  // Redo
  useEffect(() => {
    if (redoKey > 0 && redoStack.length > 0) {
      setShapes(s => [...s, redoStack[0]]);
      setRedoStack(rs => rs.slice(1));
    }
  }, [redoKey]);

  // Listen for shift key globally
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') setShiftKey(true);
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Shift') setShiftKey(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Import image logic
  useEffect(() => {
    if (!importImg) return;
    const img = new window.Image();
    img.onload = () => {
      const cw = canvasRef.current.width;
      const ch = canvasRef.current.height;
      let iw = img.width;
      let ih = img.height;
      let scale = Math.min(cw / iw, ch / ih);
      let nw = iw * scale;
      let nh = ih * scale;
      let nx = (cw - nw) / 2;
      let ny = (ch - nh) / 2;
      // Simpan sebagai shape agar tidak hilang saat render ulang
      setShapes([{ tool: 'image', img, nx, ny, nw, nh }]);
      setRedoStack([]);
      setImportImg(null);
    };
    img.src = importImg;
  }, [importImg, setImportImg]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    // Konversi ke koordinat canvas asli (dengan zoom)
    const zx = zoomCenter.x + (x - zoomCenter.x) / zoom;
    const zy = zoomCenter.y + (y - zoomCenter.y) / zoom;
    return { x: zx, y: zy };
  };

  // --- SHAPE TOOLS ---
  const startShape = (e) => {
    setShapeStart(getPos(e));
    setShapePreview(null);
    setDrawing(true);
  };

  const getConsistentEnd = (start, end, tool, shift) => {
    if (!shift) return end;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (tool === 'ellipse' || tool === 'rectangle') {
      const len = Math.min(Math.abs(dx), Math.abs(dy));
      return {
        x: start.x + Math.sign(dx) * len,
        y: start.y + Math.sign(dy) * len,
      };
    }
    if (tool === 'triangle') {
      const len = Math.min(Math.abs(dx), Math.abs(dy));
      return {
        x: start.x + Math.sign(dx) * len,
        y: start.y + Math.sign(dy) * len,
      };
    }
    if (tool === 'line') {
      // shift: garis horizontal/vertikal/diagonal 45deg
      if (Math.abs(dx) > Math.abs(dy)) {
        return { x: end.x, y: start.y };
      } else if (Math.abs(dy) > Math.abs(dx)) {
        return { x: start.x, y: end.y };
      } else {
        // diagonal
        return { x: start.x + Math.sign(dx) * Math.abs(dy), y: start.y + Math.sign(dy) * Math.abs(dx) };
      }
    }
    return end;
  };

  const drawShapePreview = (e) => {
    if (!drawing || !shapeStart || !['ellipse','rectangle','triangle','line'].includes(tool)) return;
    let pos = getPos(e);
    pos = getConsistentEnd(shapeStart, pos, tool, shiftKey || (e.shiftKey));
    setShapePreview({ start: shapeStart, end: pos, tool, color, size });
  };

  const finishShape = (e) => {
    if (!drawing || !shapeStart || !['ellipse','rectangle','triangle','line'].includes(tool)) return;
    setDrawing(false);
    let pos = getPos(e);
    pos = getConsistentEnd(shapeStart, pos, tool, shiftKey || (e.shiftKey));
    setShapes(prev => [...prev, { start: shapeStart, end: pos, tool, color, size }]);
    setShapeStart(null);
    setShapePreview(null);
  };

  function drawEllipse(ctx, start, end, color, size) {
    const x = (start.x + end.x) / 2;
    const y = (start.y + end.y) / 2;
    const rx = Math.abs(end.x - start.x) / 2;
    const ry = Math.abs(end.y - start.y) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.stroke();
    ctx.restore();
  }
  function drawRect(ctx, start, end, color, size) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.stroke();
    ctx.restore();
  }
  function drawTriangle(ctx, start, end, color, size) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo((start.x + end.x) / 2, start.y); // top
    ctx.lineTo(end.x, end.y); // bottom right
    ctx.lineTo(start.x, end.y); // bottom left
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.stroke();
    ctx.restore();
  }
  function drawLine(ctx, start, end, color, size) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.stroke();
    ctx.restore();
  }

  // --- DRAWING (FREEHAND, PEN, ERASER) ---
  const startDraw = (e) => {
    if (["ellipse","rectangle","triangle","line"].includes(tool)) return startShape(e);
    setDrawing(true);
    const pos = getPos(e);
    setLastPos(pos);
    setCurrentStroke({
      tool,
      color: tool === 'eraser' ? '#fff' : color,
      size: tool === 'pen' ? size / 2 : tool === 'eraser' ? size * 2 : size,
      points: [pos],
    });
  };

  const draw = (e) => {
    if (!drawing) return;
    if (["ellipse","rectangle","triangle","line"].includes(tool)) return drawShapePreview(e);
    const pos = getPos(e);
    setCurrentStroke(stroke => stroke ? { ...stroke, points: [...stroke.points, pos] } : null);
    setLastPos(pos);
  };

  const stopDraw = (e) => {
    if (["ellipse","rectangle","triangle","line"].includes(tool)) return finishShape(e);
    setDrawing(false);
    if (currentStroke && currentStroke.points.length > 1) {
      setShapes(prev => [...prev, currentStroke]);
      setRedoStack([]);
    }
    setCurrentStroke(null);
  };

  // --- SHAPE PREVIEW & RENDER ---
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    // Gambar semua shapes yang sudah jadi
    shapes.forEach(s => {
      if (s.tool === 'image') ctx.drawImage(s.img, s.nx, s.ny, s.nw, s.nh);
      if (s.tool === 'ellipse') drawEllipse(ctx, s.start, s.end, s.color, s.size);
      if (s.tool === 'rectangle') drawRect(ctx, s.start, s.end, s.color, s.size);
      if (s.tool === 'triangle') drawTriangle(ctx, s.start, s.end, s.color, s.size);
      if (s.tool === 'line') drawLine(ctx, s.start, s.end, s.color, s.size);
      if (['pencil','pen','eraser'].includes(s.tool)) drawStroke(ctx, s);
    });
    // Gambar preview shape jika ada
    if (shapePreview) {
      if (shapePreview.tool === 'ellipse') drawEllipse(ctx, shapePreview.start, shapePreview.end, shapePreview.color, shapePreview.size);
      if (shapePreview.tool === 'rectangle') drawRect(ctx, shapePreview.start, shapePreview.end, shapePreview.color, shapePreview.size);
      if (shapePreview.tool === 'triangle') drawTriangle(ctx, shapePreview.start, shapePreview.end, shapePreview.color, shapePreview.size);
      if (shapePreview.tool === 'line') drawLine(ctx, shapePreview.start, shapePreview.end, shapePreview.color, shapePreview.size);
    }
    // Gambar stroke yang sedang berjalan
    if (currentStroke && currentStroke.points.length > 1) {
      drawStroke(ctx, currentStroke);
    }
  }, [shapes, shapePreview, tool, currentStroke]);

  function drawStroke(ctx, stroke) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  // Handle custom cursor
  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    setCursor({ visible: true, x, y });
    if (["ellipse","rectangle","triangle","line"].includes(tool)) drawShapePreview(e);
    else if (["pencil","pen","eraser"].includes(tool)) draw(e);
    // Untuk tool select, tetap tampilkan kursor
  };
  const handleMouseLeave = () => setCursor(c => ({ ...c, visible: false }));

  // Ganti warna shape yang terseleksi
  useEffect(() => {
    if (tool === 'select' && selectedIdxs.length > 0) {
      setShapes(prev => prev.map((s, i) => selectedIdxs.includes(i) ? { ...s, color } : s));
    }
    // eslint-disable-next-line
  }, [color]);

  // Render outline shape yang terseleksi
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    // Gambar semua shapes yang sudah jadi
    shapes.forEach(s => {
      if (s.tool === 'image') ctx.drawImage(s.img, s.nx, s.ny, s.nw, s.nh);
      if (s.tool === 'ellipse') drawEllipse(ctx, s.start, s.end, s.color, s.size);
      if (s.tool === 'rectangle') drawRect(ctx, s.start, s.end, s.color, s.size);
      if (s.tool === 'triangle') drawTriangle(ctx, s.start, s.end, s.color, s.size);
      if (s.tool === 'line') drawLine(ctx, s.start, s.end, s.color, s.size);
      if (['pencil','pen','eraser'].includes(s.tool)) drawStroke(ctx, s);
    });
    // Gambar preview shape jika ada
    if (shapePreview) {
      if (shapePreview.tool === 'ellipse') drawEllipse(ctx, shapePreview.start, shapePreview.end, shapePreview.color, shapePreview.size);
      if (shapePreview.tool === 'rectangle') drawRect(ctx, shapePreview.start, shapePreview.end, shapePreview.color, shapePreview.size);
      if (shapePreview.tool === 'triangle') drawTriangle(ctx, shapePreview.start, shapePreview.end, shapePreview.color, shapePreview.size);
      if (shapePreview.tool === 'line') drawLine(ctx, shapePreview.start, shapePreview.end, shapePreview.color, shapePreview.size);
    }
    // Gambar stroke yang sedang berjalan
    if (currentStroke && currentStroke.points.length > 1) {
      drawStroke(ctx, currentStroke);
    }
  }, [shapes, shapePreview, tool, currentStroke, selectedIdxs, marqueeStart, marqueeEnd, zoom, zoomCenter]);

  // Hit test untuk shape (ellipse, rectangle, triangle, line, image)
  function hitTestShape(shape, x, y) {
    if (shape.tool === 'ellipse') {
      const sx = (shape.start.x + shape.end.x) / 2;
      const sy = (shape.start.y + shape.end.y) / 2;
      const rx = Math.abs(shape.end.x - shape.start.x) / 2;
      const ry = Math.abs(shape.end.y - shape.start.y) / 2;
      if (rx === 0 || ry === 0) return false;
      return (((x - sx) ** 2) / (rx ** 2) + ((y - sy) ** 2) / (ry ** 2)) <= 1.1;
    }
    if (shape.tool === 'rectangle') {
      const minX = Math.min(shape.start.x, shape.end.x);
      const maxX = Math.max(shape.start.x, shape.end.x);
      const minY = Math.min(shape.start.y, shape.end.y);
      const maxY = Math.max(shape.start.y, shape.end.y);
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }
    if (shape.tool === 'triangle') {
      // Barycentric technique
      const ax = (shape.start.x + shape.end.x) / 2, ay = shape.start.y;
      const bx = shape.end.x, by = shape.end.y;
      const cx = shape.start.x, cy = shape.end.y;
      const area = (ax*(by-cy) + bx*(cy-ay) + cx*(ay-by)) / 2;
      const s = 1/(2*area)*(ay*cx-ax*cy+(cy-ay)*x+(ax-cx)*y);
      const t = 1/(2*area)*(ax*by-ay*bx+(ay-by)*x+(bx-ax)*y);
      const u = 1-s-t;
      return s >= 0 && t >= 0 && u >= 0;
    }
    if (shape.tool === 'image') {
      // Hit test bounding box gambar
      return (
        x >= shape.nx && x <= shape.nx + shape.nw &&
        y >= shape.ny && y <= shape.ny + shape.nh
      );
    }
    // ...bisa tambah line/image jika mau...
    return false;
  }

  // Mouse down untuk select/drag/marquee
  const handleSelectDown = (e) => {
    const pos = getPos(e);
    // Cek apakah klik di salah satu shape
    let foundIdx = null;
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (hitTestShape(shapes[i], pos.x, pos.y) || (shapes[i].points && hitTestStroke(shapes[i], pos.x, pos.y))) {
        foundIdx = i;
        break;
      }
    }
    if (foundIdx !== null) {
      if (selectedIdxs.includes(foundIdx)) {
        // Klik pada selection, langsung drag semua selection
        setDragOffset({
          dx: pos.x - (shapes[foundIdx].start ? shapes[foundIdx].start.x : (shapes[foundIdx].points ? shapes[foundIdx].points[0].x : 0)),
          dy: pos.y - (shapes[foundIdx].start ? shapes[foundIdx].start.y : (shapes[foundIdx].points ? shapes[foundIdx].points[0].y : 0)),
        });
        setMarqueeStart(null);
        setMarqueeEnd(null);
        return;
      }
      // Jika shift, tambahkan ke selection
      if (e.shiftKey) {
        setSelectedIdxs(prev => prev.includes(foundIdx) ? prev.filter(idx => idx !== foundIdx) : [...prev, foundIdx]);
      } else {
        setSelectedIdxs([foundIdx]);
      }
      setDragOffset({
        dx: pos.x - (shapes[foundIdx].start ? shapes[foundIdx].start.x : (shapes[foundIdx].points ? shapes[foundIdx].points[0].x : 0)),
        dy: pos.y - (shapes[foundIdx].start ? shapes[foundIdx].start.y : (shapes[foundIdx].points ? shapes[foundIdx].points[0].y : 0)),
      });
      setMarqueeStart(null);
      setMarqueeEnd(null);
      return;
    }
    // Jika klik di area kosong, mulai marquee select
    setSelectedIdxs([]);
    setDragOffset(null);
    setMarqueeStart(pos);
    setMarqueeEnd(pos);
  };

  // Mouse move untuk drag/marquee
  const handleSelectMove = (e) => {
    const pos = getPos(e);
    if (dragOffset && selectedIdxs.length > 0) {
      setShapes(prev => prev.map((s, i) => {
        if (!selectedIdxs.includes(i)) return s;
        if (s.start && s.end) {
          const dx = pos.x - dragOffset.dx;
          const dy = pos.y - dragOffset.dy;
          const w = s.end.x - s.start.x;
          const h = s.end.y - s.start.y;
          return { ...s, start: { x: dx, y: dy }, end: { x: dx + w, y: dy + h } };
        }
        if (s.points) {
          const dx = pos.x - dragOffset.dx;
          const dy = pos.y - dragOffset.dy;
          const offsetX = dx - s.points[0].x;
          const offsetY = dy - s.points[0].y;
          return { ...s, points: s.points.map(pt => ({ x: pt.x + offsetX, y: pt.y + offsetY })) };
        }
        if (s.tool === 'image') {
          // Geser gambar
          const dx = pos.x - dragOffset.dx;
          const dy = pos.y - dragOffset.dy;
          return { ...s, nx: dx, ny: dy };
        }
        return s;
      }));
    } else if (marqueeStart) {
      setMarqueeEnd(pos);
    }
  };

  // Mouse up untuk drag/marquee
  const handleSelectUp = () => {
    setDragOffset(null);
    if (marqueeStart && marqueeEnd) {
      // Hit test semua shape, jika bounding box-nya overlap dengan area marquee, select
      const minX = Math.min(marqueeStart.x, marqueeEnd.x);
      const maxX = Math.max(marqueeStart.x, marqueeEnd.x);
      const minY = Math.min(marqueeStart.y, marqueeEnd.y);
      const maxY = Math.max(marqueeStart.y, marqueeEnd.y);
      const selected = shapes.map((s, i) => {
        let sx, sy, ex, ey;
        if (s.start && s.end) {
          sx = Math.min(s.start.x, s.end.x);
          ex = Math.max(s.start.x, s.end.x);
          sy = Math.min(s.start.y, s.end.y);
          ey = Math.max(s.start.y, s.end.y);
        } else if (s.points && s.points.length > 0) {
          const xs = s.points.map(pt => pt.x);
          const ys = s.points.map(pt => pt.y);
          sx = Math.min(...xs);
          ex = Math.max(...xs);
          sy = Math.min(...ys);
          ey = Math.max(...ys);
        } else {
          return false;
        }
        // Cek overlap
        return !(ex < minX || sx > maxX || ey < minY || sy > maxY);
      });
      setSelectedIdxs(selected.map((v, i) => v ? i : null).filter(v => v !== null));
    }
    setMarqueeStart(null);
    setMarqueeEnd(null);
  };

  // Mouse down di luar shape untuk unselect (tidak perlu, sudah dihandle marquee)
  const handleSelectCanvasDown = () => {};

  // Hit test untuk freehand
  function hitTestStroke(stroke, x, y) {
    if (!stroke.points) return false;
    for (let i = 0; i < stroke.points.length; i++) {
      const pt = stroke.points[i];
      if (Math.abs(pt.x - x) < (stroke.size || 4) && Math.abs(pt.y - y) < (stroke.size || 4)) {
        return true;
      }
    }
    return false;
  }

  // Wheel zoom (Ctrl/Cmd + scroll)
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = (e.clientX - rect.left);
      const my = (e.clientY - rect.top);
      const scale = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom(prev => {
        let next = prev * scale;
        if (next < 0.2) next = 0.2;
        if (next > 5) next = 5;
        return next;
      });
      setZoomCenter({ x: mx, y: my });
    }
  };

  // Pinch zoom (touchpad, pointer events)
  useEffect(() => {
    let lastDist = null;
    let pinchActive = false;
    function getTouchDist(e) {
      if (e.touches.length < 2) return null;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.sqrt(dx*dx + dy*dy);
    }
    function onTouchStart(e) {
      if (e.touches.length === 2) {
        pinchActive = true;
        lastDist = getTouchDist(e);
      }
    }
    function onTouchMove(e) {
      if (pinchActive && e.touches.length === 2) {
        const dist = getTouchDist(e);
        if (lastDist && dist) {
          const scale = dist / lastDist;
          setZoom(prev => {
            let next = prev * scale;
            if (next < 0.2) next = 0.2;
            if (next > 5) next = 5;
            return next;
          });
        }
        lastDist = dist;
      }
    }
    function onTouchEnd(e) {
      if (e.touches.length < 2) {
        pinchActive = false;
        lastDist = null;
      }
    }
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });
      canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);
      }
    };
  }, []);

  // Render dengan zoom
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    // Terapkan transform zoom
    ctx.translate(zoomCenter.x, zoomCenter.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-zoomCenter.x, -zoomCenter.y);
    // Gambar semua shapes yang sudah jadi
    shapes.forEach(s => {
      if (s.tool === 'image') ctx.drawImage(s.img, s.nx, s.ny, s.nw, s.nh);
      if (s.tool === 'ellipse') drawEllipse(ctx, s.start, s.end, s.color, s.size);
      if (s.tool === 'rectangle') drawRect(ctx, s.start, s.end, s.color, s.size);
      if (s.tool === 'triangle') drawTriangle(ctx, s.start, s.end, s.color, s.size);
      if (s.tool === 'line') drawLine(ctx, s.start, s.end, s.color, s.size);
      if (['pencil','pen','eraser'].includes(s.tool)) drawStroke(ctx, s);
    });
    // Gambar preview shape jika ada
    if (shapePreview) {
      if (shapePreview.tool === 'ellipse') drawEllipse(ctx, shapePreview.start, shapePreview.end, shapePreview.color, shapePreview.size);
      if (shapePreview.tool === 'rectangle') drawRect(ctx, shapePreview.start, shapePreview.end, shapePreview.color, shapePreview.size);
      if (shapePreview.tool === 'triangle') drawTriangle(ctx, shapePreview.start, shapePreview.end, shapePreview.color, shapePreview.size);
      if (shapePreview.tool === 'line') drawLine(ctx, shapePreview.start, shapePreview.end, shapePreview.color, shapePreview.size);
    }
    // Gambar stroke yang sedang berjalan
    if (currentStroke && currentStroke.points.length > 1) {
      drawStroke(ctx, currentStroke);
    }
    ctx.restore();
    // (Hapus: render outline selection dan marquee di context canvas)
  }, [shapes, shapePreview, tool, currentStroke, selectedIdxs, marqueeStart, marqueeEnd, zoom, zoomCenter]);

  return (
    <div style={{ position: 'relative', width: 800, height: 600 }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: '1px solid #000000', cursor: tool === 'select' ? 'pointer' : 'none' }}
        onMouseDown={tool === 'select' ? handleSelectDown : startDraw}
        onMouseMove={tool === 'select' ? (e => { handleSelectMove(e); handleMouseMove(e); }) : handleMouseMove}
        onMouseUp={tool === 'select' ? handleSelectUp : stopDraw}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      {cursor.visible && (tool === 'pencil' || tool === 'pen' || tool === 'eraser') && (
        <div
          style={{
            position: 'absolute',
            left: cursor.x - (tool === 'pen' ? size/4 : tool === 'eraser' ? size : size/2),
            top: cursor.y - (tool === 'pen' ? size/4 : tool === 'eraser' ? size : size/2),
            width: tool === 'pen' ? size/2 : tool === 'eraser' ? size*2 : size,
            height: tool === 'pen' ? size/2 : tool === 'eraser' ? size*2 : size,
            borderRadius: '50%',
            border: tool === 'eraser' ? '2px solid #888' : '1.5px solid #333',
            background: tool === 'eraser' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0)',
            pointerEvents: 'none',
            zIndex: 20,
            boxSizing: 'border-box',
          }}
        />
      )}
      {cursor.visible && tool === 'line' && (
        <div
          style={{
            position: 'absolute',
            left: cursor.x - 12,
            top: cursor.y - 2,
            width: 24,
            height: 4,
            borderRadius: 2,
            background: '#333',
            pointerEvents: 'none',
            zIndex: 20,
            opacity: 0.7,
          }}
        />
      )}
      {cursor.visible && tool === 'ellipse' && (
        <div
          style={{
            position: 'absolute',
            left: cursor.x - size/2,
            top: cursor.y - size/2,
            width: size,
            height: size,
            borderRadius: '50%',
            border: '1.5px dashed #333',
            pointerEvents: 'none',
            zIndex: 20,
            boxSizing: 'border-box',
            opacity: 0.7,
          }}
        />
      )}
      {cursor.visible && tool === 'rectangle' && (
        <div
          style={{
            position: 'absolute',
            left: cursor.x - size/2,
            top: cursor.y - size/2,
            width: size,
            height: size,
            borderRadius: 4,
            border: '1.5px dashed #333',
            pointerEvents: 'none',
            zIndex: 20,
            boxSizing: 'border-box',
            opacity: 0.7,
          }}
        />
      )}
      {cursor.visible && tool === 'triangle' && (
        <svg
          width={size}
          height={size}
          style={{
            position: 'absolute',
            left: cursor.x - size/2,
            top: cursor.y - size/2,
            pointerEvents: 'none',
            zIndex: 20,
            opacity: 0.7,
          }}
        >
          <polygon points={`${size/2},0 ${size},${size} 0,${size}`} fill="none" stroke="#333" strokeWidth="1.5" />
        </svg>
      )}
      {cursor.visible && tool === 'select' && (
        <div
          style={{
            position: 'absolute',
            left: cursor.x - 10,
            top: cursor.y - 10,
            width: 20,
            height: 20,
            borderRadius: 4,
            border: '2px solid #1976d2',
            background: 'rgba(25,118,210,0.08)',
            pointerEvents: 'none',
            zIndex: 25,
            boxSizing: 'border-box',
          }}
        />
      )}
      {/* Outline bounding box untuk semua yang terseleksi */}
      {selectedIdxs.map(idx => {
        const s = shapes[idx];
        if (!s) return null;
        if (s.start && s.end) {
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: Math.min(s.start.x, s.end.x) - 4,
                top: Math.min(s.start.y, s.end.y) - 4,
                width: Math.abs(s.end.x - s.start.x) + 8,
                height: Math.abs(s.end.y - s.start.y) + 8,
                border: '2px dashed #1976d2',
                pointerEvents: 'none',
                zIndex: 30,
              }}
            />
          );
        } else if (s.points && s.points.length > 0) {
          const xs = s.points.map(pt => pt.x);
          const ys = s.points.map(pt => pt.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: minX - 4,
                top: minY - 4,
                width: (maxX - minX) + 8,
                height: (maxY - minY) + 8,
                border: '2px dashed #1976d2',
                pointerEvents: 'none',
                zIndex: 30,
              }}
            />
          );
        } else if (s.tool === 'image') {
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: s.nx - 4,
                top: s.ny - 4,
                width: s.nw + 8,
                height: s.nh + 8,
                border: '2px dashed #1976d2',
                pointerEvents: 'none',
                zIndex: 30,
              }}
            />
          );
        }
        return null;
      })}
    </div>
  );
});

export default Canvas;
