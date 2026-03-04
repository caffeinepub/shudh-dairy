// ── localStorage-first Product Store ─────────────────────────────────────────
// Products are stored entirely in localStorage — no backend canister involvement.
// This avoids ICP canister restart/upgrade wipes and ExternalBlob size limits.

export type LocalProduct = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  weight: string;
  inStock: boolean;
  imageUrl: string; // base64 data URL or empty string
  createdAt: number;
};

const PRODUCTS_KEY = "sunrise_products_v2";
const NEXT_ID_KEY = "sunrise_next_product_id";

// ── Read ───────────────────────────────────────────────────────────────────────

export function getAllProducts(): LocalProduct[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalProduct[];
  } catch {
    return [];
  }
}

// ── Write ──────────────────────────────────────────────────────────────────────

function saveAllProducts(products: LocalProduct[]): void {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function nextId(): number {
  try {
    const raw = localStorage.getItem(NEXT_ID_KEY);
    const current = raw ? Number(raw) : 1;
    const next = current + 1;
    localStorage.setItem(NEXT_ID_KEY, String(next));
    return current;
  } catch {
    return Date.now();
  }
}

// ── CRUD ───────────────────────────────────────────────────────────────────────

export function addProduct(
  data: Omit<LocalProduct, "id" | "createdAt">,
): LocalProduct {
  const product: LocalProduct = {
    ...data,
    id: nextId(),
    createdAt: Date.now(),
  };
  const existing = getAllProducts();
  saveAllProducts([...existing, product]);
  return product;
}

export function updateProduct(
  id: number,
  data: Partial<Omit<LocalProduct, "id" | "createdAt">>,
): boolean {
  const existing = getAllProducts();
  const index = existing.findIndex((p) => p.id === id);
  if (index === -1) return false;
  existing[index] = { ...existing[index], ...data };
  saveAllProducts(existing);
  return true;
}

export function deleteProduct(id: number): boolean {
  const existing = getAllProducts();
  const filtered = existing.filter((p) => p.id !== id);
  if (filtered.length === existing.length) return false;
  saveAllProducts(filtered);
  return true;
}
