export const VAULT_SKINS = {
  steel: {
    id: "steel",
    label: { en: "Steel", es: "Acero" },
    image: "/vault-concepts/steel-reference.png",
    fallbackImage: "/vault-concepts/steel-reference.png",
    videos: {
      openSuccess: "/vault-concepts/video-concepts/steel-open-success.mp4",
      wrongCode: "/vault-concepts/video-concepts/steel-wrong-code.mp4",
    },
  },
  titanium: {
    id: "titanium",
    label: { en: "Titanium", es: "Titanio" },
    image: "/vault-concepts/titanium-reference.png",
    fallbackImage: "/vault-concepts/steel-reference.png",
    videos: {
      openSuccess: "/vault-concepts/video-concepts/titanium-open-success.mp4",
      wrongCode: "/vault-concepts/video-concepts/titanium-wrong-code.mp4",
    },
  },
  gold: {
    id: "gold",
    label: { en: "Gold", es: "Oro" },
    image: "/vault-concepts/gold-reference.png",
    fallbackImage: "/vault-concepts/steel-reference.png",
    videos: {
      openSuccess: "/vault-concepts/video-concepts/gold-open-success.mp4",
      wrongCode: "/vault-concepts/video-concepts/gold-wrong-code.mp4",
    },
  },
  rust: {
    id: "rust",
    label: { en: "Rust", es: "Oxidado" },
    image: "/vault-concepts/rust-reference.png",
    fallbackImage: "/vault-concepts/steel-reference.png",
    videos: {
      openSuccess: "/vault-concepts/video-concepts/rust-open-success.mp4",
      wrongCode: "/vault-concepts/video-concepts/rust-wrong-code.mp4",
    },
  },
  wood: {
    id: "wood",
    label: { en: "Wood", es: "Madera" },
    image: "/vault-concepts/wood-reference.png",
    fallbackImage: "/vault-concepts/steel-reference.png",
    videos: {
      openSuccess: "/vault-concepts/video-concepts/wood-open-success.mp4",
      wrongCode: "/vault-concepts/video-concepts/wood-wrong-code.mp4",
    },
  },
  camo: {
    id: "camo",
    label: { en: "Camo", es: "Camuflaje" },
    image: "/vault-concepts/camo-reference.png",
    fallbackImage: "/vault-concepts/steel-reference.png",
    videos: {
      openSuccess: "/vault-concepts/video-concepts/camo-open-success.mp4",
      wrongCode: "/vault-concepts/video-concepts/camo-wrong-code.mp4",
    },
  },
};

export const VAULT_SKIN_KEYS = Object.keys(VAULT_SKINS);

export function getVaultSkin(skin) {
  return VAULT_SKINS[skin] || VAULT_SKINS.steel;
}

export function getVaultSkinImage(skin) {
  const selectedSkin = getVaultSkin(skin);
  return selectedSkin.image || selectedSkin.fallbackImage || VAULT_SKINS.steel.image;
}

export function getVaultSkinVideo(skin, state) {
  const selectedSkin = getVaultSkin(skin);
  const videoKey = state === "wrongCode" || state === "lockedOut" ? "wrongCode" : "openSuccess";
  return selectedSkin.videos?.[videoKey] || VAULT_SKINS.steel.videos?.[videoKey] || "";
}

export function normalizeVaultSkin(skin) {
  return VAULT_SKINS[skin] ? skin : "steel";
}
