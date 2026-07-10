"use client";

import { useRef, useState } from "react";

export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  function getPoint(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const clientX = event.touches?.[0]?.clientX ?? event.clientX;
    const clientY = event.touches?.[0]?.clientY ?? event.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function startDrawing(event) {
    event.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getPoint(event);

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);

    setDrawing(true);
    setHasSignature(true);
  }

  function draw(event) {
    if (!drawing) return;

    event.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getPoint(event);

    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = "#083f52";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    onChange?.(canvas.toDataURL("image/png"));
  }

  function stopDrawing() {
    if (!drawing) return;

    setDrawing(false);

    const canvas = canvasRef.current;
    onChange?.(canvas.toDataURL("image/png"));
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    setHasSignature(false);
    onChange?.("");
  }

  return (
    <div className="signaturePadWrap">
      <canvas
        ref={canvasRef}
        width={720}
        height={220}
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
        <span>{hasSignature ? "Signature captured" : "Sign inside the box"}</span>

        <button type="button" className="textButton" onClick={clearSignature}>
          Clear
        </button>
      </div>
    </div>
  );
}