// ── Store Customization Utility ────────────────────────────────────────────────
// Manages product images, logo, and theme colors persisted in localStorage.
// All image data is stored as base64 data URLs for cross-session persistence.

const PRODUCT_IMAGES_KEY = "sunrise_product_images";
const LOGO_URL_KEY = "sunrise_logo_url";
const THEME_KEY = "sunrise_theme";

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
