"use client";

import { useRef, useState } from "react";

export default function SignaturePad({ language = "en", onChange }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const copy = {
    en: {
      clear: "Clear signature",
      hint: "Sign inside the box using your mouse or finger.",
    },
    es: {
      clear: "Borrar firma",
      hint: "Firma dentro del recuadro usando tu mouse o dedo.",
    },
  };

  const t = copy[language] || copy.en;

  function getPoint(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const clientX = event.touches?.[0]?.clientX ?? event.clientX;
    const clientY = event.touches?.[0]?.clientY ?? event.clientY;

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function startDrawing(event) {
    event.preventDefault();

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const point = getPoint(event);

    context.beginPath();
    context.moveTo(point.x, point.y);

    setDrawing(true);
  }

  function draw(event) {
    if (!drawing) return;

    event.preventDefault();

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const point = getPoint(event);

    context.lineWidth = 3;
    context.lineCap = "round";
    context.strokeStyle = "#083f52";
    context.lineTo(point.x, point.y);
    context.stroke();

    setHasSignature(true);

    if (onChange) {
      onChange(canvas.toDataURL("image/png"));
    }
  }

  function stopDrawing() {
    setDrawing(false);

    const canvas = canvasRef.current;

    if (hasSignature && onChange) {
      onChange(canvas.toDataURL("image/png"));
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);

    setHasSignature(false);

    if (onChange) {
      onChange("");
    }
  }

  return (
    <div className="signaturePadWrap">
      <canvas
        ref={canvasRef}
        width="720"
        height="240"
        className="signatureCanvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      <div className="signaturePadFooter">
        <p>{t.hint}</p>

        <button type="button" className="textButton" onClick={clearSignature}>
          {t.clear}
        </button>
      </div>
    </div>
  );
}