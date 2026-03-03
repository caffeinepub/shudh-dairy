// ── Store Customization Utility ────────────────────────────────────────────────
// Manages product images, logo, theme colors, and background image persisted in localStorage.
// All image data is stored as base64 data URLs for cross-session persistence.

const PRODUCT_IMAGES_KEY = "sunrise_product_images";
const LOGO_URL_KEY = "sunrise_logo_url";
const THEME_KEY = "sunrise_theme";
const BG_IMAGE_KEY = "sunrise_bg_image";

export type StoreTheme = {
  primaryColor: string;
  bgColor: string;
};

// ── Product Images ─────────────────────────────────────────────────────────────

export function getProductImages(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PRODUCT_IMAGES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function setProductImage(productId: string, url: string): void {
  const images = getProductImages();
  images[productId] = url;
  localStorage.setItem(PRODUCT_IMAGES_KEY, JSON.stringify(images));
}

export function removeProductImage(productId: string): void {
  const images = getProductImages();
  delete images[productId];
  localStorage.setItem(PRODUCT_IMAGES_KEY, JSON.stringify(images));
}

// ── Logo ───────────────────────────────────────────────────────────────────────

export function getLogoUrl(): string {
  return localStorage.getItem(LOGO_URL_KEY) ?? "";
}

export function setLogoUrl(url: string): void {
  localStorage.setItem(LOGO_URL_KEY, url);
}

// ── Theme ──────────────────────────────────────────────────────────────────────

const DEFAULT_THEME: StoreTheme = {
  primaryColor: "",
  bgColor: "",
};

export function getTheme(): StoreTheme {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (!raw) return DEFAULT_THEME;
    return { ...DEFAULT_THEME, ...(JSON.parse(raw) as Partial<StoreTheme>) };
  } catch {
    return DEFAULT_THEME;
  }
}

export function setTheme(theme: StoreTheme): void {
  localStorage.setItem(THEME_KEY, JSON.stringify(theme));
}

// ── Apply theme to DOM ─────────────────────────────────────────────────────────
// Injects/updates a <style id="theme-override"> tag in <head>.

export function applyTheme(theme: StoreTheme): void {
  let styleEl = document.getElementById(
    "theme-override",
  ) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "theme-override";
    document.head.appendChild(styleEl);
  }

  const rules: string[] = [];

  if (theme.primaryColor) {
    const c = theme.primaryColor;
    rules.push(`:root { --theme-primary-hex: ${c}; }`);
    // Override bg-primary buttons/elements
    rules.push(
      `.bg-primary, [class*="bg-primary"]:not(.bg-primary\\/90):not(.bg-primary\\/30):not(.bg-primary\\/60) { background-color: ${c} !important; }`,
    );
    rules.push(`button.bg-primary { background-color: ${c} !important; }`);
    rules.push(`.text-primary { color: ${c} !important; }`);
    rules.push(`.border-primary { border-color: ${c} !important; }`);
    rules.push(`.ring-primary { --tw-ring-color: ${c} !important; }`);
    // Hover state (slightly darker) — we use opacity trick
    rules.push(
      `.hover\\:bg-primary\\/90:hover { background-color: ${c} !important; opacity: 0.9; }`,
    );
    // Trust bar icon color
    rules.push(`.trust-bar-icon { color: ${c} !important; }`);
    // Focus ring
    rules.push(
      `.focus-visible\\:ring-primary:focus-visible { --tw-ring-color: ${c} !important; }`,
    );
  }

  if (theme.bgColor) {
    const bg = theme.bgColor;
    rules.push(`body { background-color: ${bg} !important; }`);
    rules.push(
      `.min-h-screen.bg-background, .bg-background { background-color: ${bg} !important; }`,
    );
  }

  styleEl.textContent = rules.join("\n");
}

// ── File to data URL ───────────────────────────────────────────────────────────
// Converts a File/Blob to a base64 data URL for persistent storage.

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// ── Founder Info ───────────────────────────────────────────────────────────────

const FOUNDER_KEY = "sunrise_founder_info";

export type FounderInfo = {
  name: string;
  title: string;
  bio: string;
  photo: string; // base64 data URL or empty string for default
  foundedYear: string;
};

const DEFAULT_FOUNDER: FounderInfo = {
  name: "Founder",
  title: "Founder & Managing Director",
  bio: "Started SUNRISE MILK AND AGRO PRODUCT'S with a simple vision — to bring pure, farm-fresh dairy products directly to families in Udaipur. Every product is made with care, tradition, and love for quality.",
  photo: "",
  foundedYear: "2018",
};

export function getFounderInfo(): FounderInfo {
  try {
    const raw = localStorage.getItem(FOUNDER_KEY);
    if (!raw) return DEFAULT_FOUNDER;
    return { ...DEFAULT_FOUNDER, ...(JSON.parse(raw) as Partial<FounderInfo>) };
  } catch {
    return DEFAULT_FOUNDER;
  }
}

export function setFounderInfo(info: FounderInfo): void {
  localStorage.setItem(FOUNDER_KEY, JSON.stringify(info));
}

// ── Social Links ───────────────────────────────────────────────────────────────

const SOCIAL_LINKS_KEY = "sunrise_social_links";

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "youtube"
  | "twitter"
  | "whatsapp"
  | "pinterest"
  | string;

export type SocialLink = {
  id: string; // unique id (platform key or uuid for custom)
  platform: SocialPlatform;
  label: string; // display name e.g. "Facebook"
  url: string; // full URL e.g. "https://facebook.com/..."
  enabled: boolean;
  color: string; // hex background color for the icon circle
  iconSvg: string; // SVG path string (the `d` attribute of SVG path)
};

const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  {
    id: "facebook",
    platform: "facebook",
    label: "Facebook",
    url: "",
    enabled: true,
    color: "#1877F2",
    iconSvg:
      "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
  {
    id: "instagram",
    platform: "instagram",
    label: "Instagram",
    url: "",
    enabled: true,
    color:
      "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
    iconSvg:
      "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  },
  {
    id: "youtube",
    platform: "youtube",
    label: "YouTube",
    url: "",
    enabled: true,
    color: "#FF0000",
    iconSvg:
      "M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z",
  },
  {
    id: "twitter",
    platform: "twitter",
    label: "Twitter / X",
    url: "",
    enabled: true,
    color: "#000000",
    iconSvg:
      "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    id: "whatsapp",
    platform: "whatsapp",
    label: "WhatsApp",
    url: "https://wa.me/918875759738",
    enabled: true,
    color: "#25D366",
    iconSvg:
      "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
  },
  {
    id: "pinterest",
    platform: "pinterest",
    label: "Pinterest",
    url: "",
    enabled: true,
    color: "#E60023",
    iconSvg:
      "M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z",
  },
];

export function getSocialLinks(): SocialLink[] {
  try {
    const raw = localStorage.getItem(SOCIAL_LINKS_KEY);
    if (!raw) return DEFAULT_SOCIAL_LINKS;
    const saved = JSON.parse(raw) as SocialLink[];
    // Merge saved data with defaults: saved overrides defaults by id
    const savedMap = new Map(saved.map((s) => [s.id, s]));
    // Start with defaults, apply saved overrides, then append any custom ones
    const defaults = DEFAULT_SOCIAL_LINKS.map((d) =>
      savedMap.has(d.id) ? { ...d, ...savedMap.get(d.id) } : d,
    );
    const customLinks = saved.filter(
      (s) => !DEFAULT_SOCIAL_LINKS.find((d) => d.id === s.id),
    );
    return [...defaults, ...customLinks];
  } catch {
    return DEFAULT_SOCIAL_LINKS;
  }
}

export function setSocialLinks(links: SocialLink[]): void {
  localStorage.setItem(SOCIAL_LINKS_KEY, JSON.stringify(links));
}

// ── Background Image ───────────────────────────────────────────────────────────

/** Returns the stored background image (base64 data URL or absolute URL), or empty string. */
export function getBgImage(): string {
  return localStorage.getItem(BG_IMAGE_KEY) ?? "";
}

/** Saves a background image (base64 data URL or absolute URL). */
export function setBgImage(url: string): void {
  localStorage.setItem(BG_IMAGE_KEY, url);
}

/** Removes the stored background image, reverting to the default. */
export function removeBgImage(): void {
  localStorage.removeItem(BG_IMAGE_KEY);
}
