"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, QrCode, Square, StopCircle } from "lucide-react";

const allowedHosts = new Set([
  "vozeterna-landing.vercel.app",
  "localhost",
  "127.0.0.1",
]);

function isSafeSegment(value) {
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,120}$/.test(value);
}

function looksLikeInviteToken(value) {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ||
    /^invite[_-]/i.test(value) ||
    /^ve[_-]/i.test(value) ||
    value.length >= 20
  );
}

function resolveQrDestination(rawValue) {
  const value = String(rawValue || "").trim();

  if (!value) {
    return { error: "This QR code does not look like a VozEterna QR code." };
  }

  try {
    const url = new URL(value);
    if (!allowedHosts.has(url.hostname)) {
      return { error: "This QR code does not look like a VozEterna QR code." };
    }

    const allowedPath =
      url.pathname.startsWith("/mobile/invite/") ||
      url.pathname.startsWith("/memorial/") ||
      url.pathname === "/mobile/feed";

    if (!allowedPath) {
      return { error: "This QR code does not look like a VozEterna QR code." };
    }

    return {
      href: `${url.pathname}${url.search}${url.hash}`,
    };
  } catch {
    // Not a full URL. Fall through to token/slug handling.
  }

  const cleanValue = value.replace(/^\/+|\/+$/g, "");

  if (cleanValue.startsWith("mobile/feed")) {
    const feedPath = cleanValue.startsWith("mobile/feed?") ? cleanValue : "mobile/feed";
    return { href: `/${feedPath}` };
  }

  if (cleanValue.startsWith("mobile/invite/")) {
    const token = cleanValue.replace("mobile/invite/", "");
    return isSafeSegment(token)
      ? { href: `/mobile/invite/${token}` }
      : { error: "This QR code does not look like a VozEterna QR code." };
  }

  if (cleanValue.startsWith("memorial/")) {
    const slug = cleanValue.replace("memorial/", "");
    return isSafeSegment(slug)
      ? { href: `/memorial/${slug}` }
      : { error: "This QR code does not look like a VozEterna QR code." };
  }

  if (!isSafeSegment(cleanValue)) {
    return { error: "This QR code does not look like a VozEterna QR code." };
  }

  if (looksLikeInviteToken(cleanValue)) {
    return { href: `/mobile/invite/${cleanValue}` };
  }

  return { href: `/memorial/${cleanValue}` };
}

export default function MobileScanPage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const detectorRef = useRef(null);
  const scanningRef = useRef(false);

  const [manualValue, setManualValue] = useState("");
  const [message, setMessage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "BarcodeDetector" in window);

    return () => {
      stopScanner();
    };
  }, []);

  function openQrValue(value) {
    const result = resolveQrDestination(value);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    stopScanner();
    router.push(result.href);
  }

  async function scanFrame() {
    if (!scanningRef.current || !detectorRef.current || !videoRef.current) return;

    try {
      const codes = await detectorRef.current.detect(videoRef.current);
      const value = codes?.[0]?.rawValue;

      if (value) {
        openQrValue(value);
        return;
      }
    } catch {
      setMessage("Camera QR scanning is not supported on this device yet.");
      stopScanner();
      return;
    }

    frameRef.current = window.requestAnimationFrame(scanFrame);
  }

  async function startScanner() {
    setMessage("");

    if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
      setSupported(false);
      setMessage("Camera QR scanning is not supported on this device yet.");
      return;
    }

    try {
      detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      scanningRef.current = true;
      setCameraActive(true);
      frameRef.current = window.requestAnimationFrame(scanFrame);
    } catch {
      setMessage("Camera QR scanning is not supported on this device yet.");
      stopScanner();
    }
  }

  function stopScanner() {
    scanningRef.current = false;

    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  }

  function handleManualSubmit(event) {
    event.preventDefault();
    openQrValue(manualValue);
  }

  return (
    <section className="mobileScreenStack mobileScanPage">
      <div className="mobileScreenHero mobileScanHero">
        <p className="mobileCapsLabel">QR Reader</p>
        <h1>Scan VozEterna QR</h1>
        <p>Scan a family invite, friend invite, public memorial, or public feed QR code.</p>
      </div>

      <section className="mobileScanCard">
        <div className="mobileScanVideoWrap">
          <video ref={videoRef} muted playsInline />
          {!cameraActive && (
            <div>
              <QrCode size={42} />
              <p>
                {supported
                  ? "Start the scanner when you are ready."
                  : "Camera QR scanning is not supported on this device yet."}
              </p>
            </div>
          )}
        </div>

        <div className="mobileScanActions">
          {!cameraActive ? (
            <button type="button" onClick={startScanner}>
              <Camera size={17} />
              Start scanner
            </button>
          ) : (
            <button type="button" onClick={stopScanner}>
              <StopCircle size={17} />
              Stop scanner
            </button>
          )}
        </div>

        {message && <p className="mobileScanMessage">{message}</p>}

        <form className="mobileScanManual" onSubmit={handleManualSubmit}>
          <label>
            Paste QR URL or token
            <input
              className="mobileScanInput"
              value={manualValue}
              onChange={(event) => setManualValue(event.target.value)}
              placeholder="https://vozeterna-landing.vercel.app/mobile/invite/..."
            />
          </label>

          <button type="submit" className="mobileScanOpenButton">
            <Square size={15} />
            Open link
          </button>
        </form>
      </section>
    </section>
  );
}
