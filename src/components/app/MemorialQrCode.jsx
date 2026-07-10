"use client";

import { QRCodeCanvas } from "qrcode.react";

export default function MemorialQrCode({ url }) {
  if (!url) return null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      alert("Memorial link copied.");
    } catch {
      alert("Could not copy link.");
    }
  }

  function downloadQr() {
    const canvas = document.getElementById("memorial-qr-code");
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = "vozeterna-memorial-qr.png";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  return (
    <section className="qrCard">
      <div>
        <p className="appEyebrow">QR Memorial</p>
        <h2>Share this memorial page</h2>
        <p>
          Use this QR code on a funeral card, family keepsake, printed tribute, or future memorial marker.
        </p>

        <div className="qrLinkBox">{url}</div>

        <div className="buttonRow">
          <button type="button" className="appButton" onClick={copyLink}>
            Copy link
          </button>

          <button type="button" className="appButton secondary" onClick={downloadQr}>
            Download QR
          </button>
        </div>
      </div>

      <div className="qrBox">
        <QRCodeCanvas
          id="memorial-qr-code"
          value={url}
          size={190}
          bgColor="#ffffff"
          fgColor="#083f52"
          includeMargin
        />
      </div>
    </section>
  );
}