"use client";

import { useEffect, useRef, useState } from "react";

export default function MemoryActions({
  url,
  memoryName,
  isPublic = false,
  onTogglePublic,
  onDelete,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleShare() {
    if (!url) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: memoryName || "VozEterna memory",
          text: "VozEterna memory / Recuerdo de VozEterna",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link copied / Enlace copiado");
      }
    } catch {
      // User cancelled sharing or browser blocked it.
    }

    setOpen(false);
  }

  function handleTogglePublic() {
    setOpen(false);
    onTogglePublic?.();
  }

  function handleDelete() {
    setOpen(false);
    onDelete?.();
  }

  return (
    <div className="memoryActionsMenu" ref={menuRef}>
      {isPublic && <span className="publicMemoryBadge">Public</span>}

      <button
        type="button"
        className="memoryDotsButton"
        onClick={() => setOpen((value) => !value)}
        aria-label="Memory actions / Acciones del recuerdo"
        title="Memory actions / Acciones"
      >
        ⋮
      </button>

      {open && (
        <div className="memoryActionsPanel">
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer">
              Open / Abrir
            </a>
          )}

          {url && (
            <button type="button" onClick={handleShare}>
              Share / Compartir
            </button>
          )}

          {onTogglePublic && (
            <button type="button" onClick={handleTogglePublic}>
              {isPublic ? "Hide from memorial" : "Show on memorial"}
            </button>
          )}

          <button type="button" className="dangerAction" onClick={handleDelete}>
            Delete / Eliminar
          </button>
        </div>
      )}
    </div>
  );
}