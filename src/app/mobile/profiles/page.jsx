"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, Plus, QrCode, UserRound, Volume2, VolumeX } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { getVaultAccess, loadAccessibleVaults } from "../../../lib/mobileVault";
import { getVaultSkin, getVaultSkinImage, getVaultSkinVideo, normalizeVaultSkin } from "../../../lib/vaultSkins";
import { getInitialMobileLanguage } from "../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Vaults",
    title: "Vaults",
    subtitle: "Manage the memory vaults and private archives connected to your account.",
    create: "Create vault",
    createText: "Add a new memory vault.",
    connect: "Connect family",
    connectText: "Create a private invite link or QR code.",
    loading: "Loading vaults...",
    emptyTitle: "No vaults yet",
    emptyText: "Create your first vault or upload a memory to automatically start your family vault.",
    uploadFirst: "Upload first memory",
    familyVault: "Family vault",
    privateArchive: "Private family archive.",
    qr: "QR invite",
    skin: "Vault style",
    openVault: "Open Vault",
    unlockVault: "Unlock Vault",
    enterPasscode: "Enter passcode",
    incorrectPasscode: "Incorrect passcode. Please try again.",
    lockedOut: "Too many unlock attempts. Please verify your identity to continue.",
    verifyEmail: "Verify by email",
    tryLater: "Try again later",
    soundOn: "Sound on",
    soundOff: "Sound off",
  },
  es: {
    label: "Bovedas",
    title: "Bovedas",
    subtitle: "Administra bovedas de recuerdos y archivos privados conectados a tu cuenta.",
    create: "Crear boveda",
    createText: "Agrega una nueva boveda de recuerdos.",
    connect: "Conectar familia",
    connectText: "Crea un enlace privado o código QR.",
    loading: "Cargando bovedas...",
    emptyTitle: "Todavia no hay bovedas",
    emptyText: "Crea tu primera boveda o sube un recuerdo para empezar tu boveda familiar.",
    uploadFirst: "Subir primer recuerdo",
    familyVault: "Boveda familiar",
    privateArchive: "Archivo familiar privado.",
    qr: "Invitar QR",
    skin: "Estilo de boveda",
    openVault: "Abrir boveda",
    unlockVault: "Desbloquear boveda",
    enterPasscode: "Ingresa el codigo",
    incorrectPasscode: "Codigo incorrecto. Intentalo de nuevo.",
    lockedOut: "Demasiados intentos de desbloqueo. Verifica tu identidad para continuar.",
    verifyEmail: "Verificar por correo",
    tryLater: "Intentar mas tarde",
    soundOn: "Sonido activado",
    soundOff: "Sonido desactivado",
  },
};

export default function MobileProfilesPage() {
  const router = useRouter();
  const videoRefs = useRef({});
  const [language, setLanguage] = useState("en");
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vaultUnlockStates, setVaultUnlockStates] = useState({});
  const [soundMuted, setSoundMuted] = useState(false);

  const t = copy[language] || copy.en;
  const canInviteFromAnyVault = vaults.some((vault) => vault.access?.canManage);

  useEffect(() => {
    setLanguage(getInitialMobileLanguage());

    function handleLanguageChange(event) {
      if (event.detail === "en" || event.detail === "es") {
        setLanguage(event.detail);
      }
    }

    window.addEventListener("vozeterna-language-change", handleLanguageChange);

    try {
      setSoundMuted(localStorage.getItem("vozeterna-vault-sound-muted") === "true");
    } catch {
      setSoundMuted(false);
    }

    return () => {
      window.removeEventListener("vozeterna-language-change", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    loadVaults();
  }, []);

  async function loadVaults() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setVaults([]);
      setLoading(false);
      return;
    }

    try {
      const accessibleVaults = await loadAccessibleVaults(
        supabase,
        user,
        "id, network_id, created_by, title, subject_name, relationship_label, description, vault_skin, created_at"
      );
      const vaultsWithAccess = await Promise.all(
        accessibleVaults.map(async (vault) => ({
          ...vault,
          access: await getVaultAccess(supabase, user, vault),
        }))
      );
      const uniqueVaults = [...new Map(vaultsWithAccess.map((vault) => [vault.id, vault])).values()];

      setVaults(uniqueVaults);
    } catch (error) {
      console.error("Mobile profiles error:", error.message);
      setVaults([]);
    }

    setLoading(false);
  }

  function getUnlockState(vaultId) {
    return vaultUnlockStates[vaultId] || {
      state: "idle",
      passcode: "",
      failedAttempts: 0,
      message: "",
      forceMuted: false,
    };
  }

  function updateUnlockState(vaultId, updater) {
    setVaultUnlockStates((current) => {
      const previous = current[vaultId] || getUnlockState(vaultId);
      return {
        ...current,
        [vaultId]: typeof updater === "function" ? updater(previous) : { ...previous, ...updater },
      };
    });
  }

  function verifyVaultPasscode(_vault, candidatePasscode) {
    // TODO: Replace this MVP-only demo check with server-side hashed vault passcode verification.
    // Production must not store plaintext passcodes or rely on frontend-only checks for security.
    // Future WebAuthn/passkeys can replace this temporary passcode gate.
    return candidatePasscode === "1234";
  }

  function toggleVaultSound() {
    setSoundMuted((current) => {
      const nextValue = !current;
      try {
        localStorage.setItem("vozeterna-vault-sound-muted", String(nextValue));
      } catch {
        // Ignore storage failures; playback still falls back to in-memory preference.
      }
      return nextValue;
    });
  }

  function playVaultVideo(vaultId) {
    const video = videoRefs.current[vaultId];
    if (!video) return;

    video.muted = soundMuted || getUnlockState(vaultId).forceMuted;
    const playPromise = video.play();

    if (playPromise?.catch) {
      playPromise.catch(() => {
        updateUnlockState(vaultId, (current) => ({ ...current, forceMuted: true }));
        video.muted = true;
        video.play()?.catch?.(() => {});
      });
    }
  }

  function handlePasscodeChange(vaultId, value) {
    updateUnlockState(vaultId, (current) => ({ ...current, passcode: value }));
  }

  function handleUnlockSubmit(event, vault) {
    event.preventDefault();

    const currentState = getUnlockState(vault.id);
    if (currentState.state === "opening" || currentState.state === "wrongCode" || currentState.state === "lockedOut") return;

    if (verifyVaultPasscode(vault, currentState.passcode.trim())) {
      const openVideo = getVaultSkinVideo(vault.vault_skin, "opening");
      updateUnlockState(vault.id, (current) => ({ ...current, state: "opening", message: "" }));

      if (!openVideo) {
        finishVaultUnlock(vault.id);
        return;
      }

      window.setTimeout(() => playVaultVideo(vault.id), 0);
      return;
    }

    const failedAttempts = currentState.failedAttempts + 1;
    const nextState = failedAttempts >= 3 ? "lockedOut" : "wrongCode";
    const wrongVideo = getVaultSkinVideo(vault.vault_skin, nextState);

    updateUnlockState(vault.id, (current) => ({
      ...current,
      state: nextState,
      failedAttempts,
      message: nextState === "lockedOut" ? t.lockedOut : t.incorrectPasscode,
    }));

    if (wrongVideo) {
      window.setTimeout(() => playVaultVideo(vault.id), 0);
      return;
    }

    if (nextState !== "lockedOut") {
      updateUnlockState(vault.id, (current) => ({ ...current, state: "idle" }));
    }
  }

  function finishVaultUnlock(vaultId) {
    try {
      sessionStorage.setItem(`vozeterna-unlocked-vault-${vaultId}`, "true");
    } catch {
      // RLS remains the real access control; this flag is only an MVP client hint.
    }

    router.push(`/mobile/profiles/${vaultId}`);
  }

  function handleVaultVideoEnded(vaultId) {
    const currentState = getUnlockState(vaultId);

    if (currentState.state === "opening") {
      finishVaultUnlock(vaultId);
      return;
    }

    if (currentState.state === "wrongCode") {
      updateUnlockState(vaultId, (current) => ({ ...current, state: "idle" }));
    }
  }

  function handleVaultVideoError(vaultId) {
    const currentState = getUnlockState(vaultId);

    if (currentState.state === "opening") {
      finishVaultUnlock(vaultId);
      return;
    }

    updateUnlockState(vaultId, (current) => ({
      ...current,
      state: current.state === "lockedOut" ? "lockedOut" : "idle",
    }));
  }

  function clearSoftLockout(vaultId) {
    updateUnlockState(vaultId, (current) => ({
      ...current,
      state: "idle",
      passcode: "",
      failedAttempts: 0,
      message: "",
    }));
  }

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <section className="mobileActionGrid">
        <Link href="/mobile/profiles/new" className="mobileActionCard primary">
          <Plus size={20} />
          <strong>{t.create}</strong>
          <p>{t.createText}</p>
        </Link>

        {canInviteFromAnyVault && (
          <Link href="/mobile/connect" className="mobileActionCard">
            <QrCode size={20} />
            <strong>{t.connect}</strong>
            <p>{t.connectText}</p>
          </Link>
        )}
      </section>

      <section className="vaultEntryGrid">
        {loading && <p className="mobileEmptyText">{t.loading}</p>}

        {!loading && vaults.length === 0 && (
          <div className="mobileEmptyCard">
            <UserRound size={24} />
            <h2>{t.emptyTitle}</h2>
            <p>{t.emptyText}</p>
            <Link href="/mobile/upload" className="mobileRecorderPrimary">
              {t.uploadFirst}
            </Link>
          </div>
        )}

        {vaults.map((vault) => {
          const skinKey = normalizeVaultSkin(vault.vault_skin);
          const skin = getVaultSkin(skinKey);
          const unlock = getUnlockState(vault.id);
          const videoSrc =
            unlock.state === "opening"
              ? getVaultSkinVideo(skinKey, "opening")
              : unlock.state === "wrongCode" || unlock.state === "lockedOut"
                ? getVaultSkinVideo(skinKey, unlock.state)
                : "";
          const videoIsActive = Boolean(videoSrc) && unlock.state !== "idle";
          const inputDisabled = unlock.state === "opening" || unlock.state === "wrongCode" || unlock.state === "lockedOut";

          return (
            <article
              className={`vaultEntryCard skin-${skinKey} state-${unlock.state}`}
              key={vault.id}
            >
              <div className="vaultEntryMediaFrame">
                {videoIsActive ? (
                  <video
                    ref={(element) => {
                      if (element) videoRefs.current[vault.id] = element;
                    }}
                    key={`${vault.id}-${unlock.state}`}
                    src={videoSrc}
                    className="vaultEntryMedia vaultEntryVideo"
                    playsInline
                    autoPlay
                    controls={false}
                    preload="metadata"
                    muted={soundMuted || unlock.forceMuted}
                    onCanPlay={() => playVaultVideo(vault.id)}
                    onEnded={() => handleVaultVideoEnded(vault.id)}
                    onError={() => handleVaultVideoError(vault.id)}
                  />
                ) : (
                  <img src={getVaultSkinImage(skinKey)} alt="" className="vaultEntryMedia" />
                )}
                <span className="mobileVaultSkinShade" />
                <strong className="vaultEntryTitle">{vault.subject_name || vault.title}</strong>
              </div>

              <span className="mobileVaultSkinBadge">
                {t.skin}: {skin.label[language]}
              </span>

              <span>{vault.relationship_label || t.familyVault}</span>
              <p>{vault.description || t.privateArchive}</p>
              <p className="vaultEntryInstruction">{t.unlockVault}</p>

              <form className="vaultEntryForm" onSubmit={(event) => handleUnlockSubmit(event, vault)}>
                <input
                  className="vaultEntryInput"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={t.enterPasscode}
                  value={unlock.passcode}
                  disabled={inputDisabled}
                  onChange={(event) => handlePasscodeChange(vault.id, event.target.value)}
                />
                <button type="submit" className="vaultEntryButton" disabled={inputDisabled}>
                  <LockKeyhole size={15} />
                  {t.openVault}
                </button>
              </form>

              {unlock.message && <p className="vaultEntryMessage">{unlock.message}</p>}

              {unlock.state === "lockedOut" && (
                <div className="vaultEntryActions">
                  <button type="button" onClick={() => clearSoftLockout(vault.id)}>
                    {t.verifyEmail}
                  </button>
                  <button type="button" onClick={() => clearSoftLockout(vault.id)}>
                    {t.tryLater}
                  </button>
                </div>
              )}

              <div className="vaultEntryActions">
                <button type="button" onClick={toggleVaultSound}>
                  {soundMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  {soundMuted ? t.soundOff : t.soundOn}
                </button>
              </div>

              {vault.access?.canManage && (
                <button
                  type="button"
                  className="vaultEntryQrButton"
                  onClick={(event) => {
                    event.stopPropagation();
                    window.location.href = `/mobile/connect?networkId=${vault.network_id}&vaultId=${vault.id}`;
                  }}
                >
                  <QrCode size={15} />
                  {t.qr}
                </button>
              )}
            </article>
          );
        })}
      </section>
    </section>
  );
}
