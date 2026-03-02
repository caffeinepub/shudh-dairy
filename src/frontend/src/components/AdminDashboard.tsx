import type { Product } from "@/backend.d";
import type { Order as BackendOrder } from "@/backend.d";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useActor } from "@/hooks/useActor";
import {
  type FounderInfo,
  type StoreTheme,
  applyTheme,
  fileToDataUrl,
  getFounderInfo,
  getLogoUrl,
  getProductImages,
  getTheme,
  setFounderInfo,
  setLogoUrl,
  setProductImage,
  setTheme,
} from "@/utils/storeCustomization";
import { useNavigate } from "@tanstack/react-router";
import {
  ExternalLink,
  Image,
  LayoutGrid,
  LayoutList,
  Loader2,
  LogOut,
  Package,
  PackagePlus,
  Palette,
  Pencil,
  RefreshCw,
  ShoppingBag,
  Store,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type ProductFormData = {
  name: string;
  description: string;
  price: string;
  category: string;
  weight: string;
  inStock: boolean;
  imageUrl: string;
};

const emptyForm: ProductFormData = {
  name: "",
  description: "",
  price: "",
  category: "Ghee",
  weight: "",
  inStock: true,
  imageUrl: "",
};

// ── Static fallback products (shown while backend loads) ────────────────────
const STATIC_FALLBACK: Product[] = [
  {
    id: BigInt(1),
    name: "Pure Cow Ghee",
    description:
      "Farm fresh pure cow ghee made from cultured butter. Rich aroma and golden colour.",
    price: 899,
    category: "Ghee",
    weight: "500g",
    inStock: true,
  },
  {
    id: BigInt(2),
    name: "Pure Cow Ghee",
    description:
      "Farm fresh pure cow ghee made from cultured butter. Rich aroma and golden colour.",
    price: 1799,
    category: "Ghee",
    weight: "1kg",
    inStock: true,
  },
  {
    id: BigInt(3),
    name: "A2 Desi Ghee",
    description:
      "Premium A2 ghee from Gir cow milk. Prepared using traditional bilona method.",
    price: 1100,
    category: "Ghee",
    weight: "500g",
    inStock: true,
  },
  {
    id: BigInt(4),
    name: "Buffalo Ghee",
    description:
      "Pure buffalo ghee with a rich, creamy texture. Ideal for cooking and sweets.",
    price: 649,
    category: "Ghee",
    weight: "500g",
    inStock: true,
  },
  {
    id: BigInt(5),
    name: "Fresh Paneer",
    description:
      "Soft and fresh homestyle paneer. Made daily from full-fat cow milk.",
    price: 89,
    category: "Paneer",
    weight: "200g",
    inStock: true,
  },
  {
    id: BigInt(6),
    name: "Fresh Paneer",
    description:
      "Soft and fresh homestyle paneer. Made daily from full-fat cow milk.",
    price: 199,
    category: "Paneer",
    weight: "500g",
    inStock: true,
  },
  {
    id: BigInt(7),
    name: "Smoked Paneer",
    description:
      "Traditionally smoked paneer with a subtle earthy flavour. Perfect for grilling and curries.",
    price: 149,
    category: "Paneer",
    weight: "200g",
    inStock: true,
  },
];

const STATIC_IMAGES: Record<string, string> = {
  "1": "/assets/generated/ghee-cow.dim_600x600.jpg",
  "2": "/assets/generated/ghee-cow.dim_600x600.jpg",
  "3": "/assets/generated/ghee-a2.dim_600x600.jpg",
  "4": "/assets/generated/ghee-buffalo.dim_600x600.jpg",
  "5": "/assets/generated/paneer-fresh.dim_600x600.jpg",
  "6": "/assets/generated/paneer-fresh.dim_600x600.jpg",
  "7": "/assets/generated/paneer-smoked.dim_600x600.jpg",
};

// ── Order display type ─────────────────────────────────────────────────────
type DisplayOrder = {
  id: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: Array<{
    productId: number;
    productName: string;
    productWeight: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: "Pending" | "Confirmed" | "Delivered";
  timestamp: number;
};

function mapBackendOrder(o: BackendOrder): DisplayOrder {
  return {
    id: Number(o.id),
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerAddress: o.customerAddress,
    items: o.items.map((item) => ({
      productId: Number(item.productId),
      productName: item.productName,
      productWeight: item.productWeight,
      quantity: Number(item.quantity),
      price: item.price,
    })),
    total: o.total,
    status: o.status as "Pending" | "Confirmed" | "Delivered",
    timestamp: Number(o.timestamp) / 1_000_000,
  };
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { actor, isFetching: actorLoading } = useActor();

  // ── Auth check ─────────────────────────────────────────────────────────────
  const token = localStorage.getItem("adminToken") ?? "";
  const adminUser = localStorage.getItem("adminUser") ?? "Admin";

  useEffect(() => {
    if (!token) {
      navigate({ to: "/admin" });
    }
  }, [token, navigate]);

  // ── Product list state ─────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>(STATIC_FALLBACK);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [productImages, setProductImages] = useState<Record<string, string>>(
    () => ({ ...STATIC_IMAGES, ...getProductImages() }),
  );

  const loadProducts = useCallback(async () => {
    if (!actor) return;
    setLoadingProducts(true);
    setLoadError(false);
    try {
      const data = await actor.getAllProducts();
      if (data.length > 0) {
        setProducts(data);
      } else {
        setProducts(STATIC_FALLBACK);
      }
      setProductImages({ ...STATIC_IMAGES, ...getProductImages() });
    } catch {
      // Keep showing static products on error
      setProducts(STATIC_FALLBACK);
      setProductImages({ ...STATIC_IMAGES, ...getProductImages() });
      setLoadError(false);
      toast.error("Could not sync with server, showing local products");
    } finally {
      setLoadingProducts(false);
    }
  }, [actor]);

  // Show static products immediately while waiting for backend
  useEffect(() => {
    setLoadingProducts(false);
  }, []);

  useEffect(() => {
    if (token && actor && !actorLoading) loadProducts();
  }, [token, actor, actorLoading, loadProducts]);

  // ── Add/Edit modal ─────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<ProductFormData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setFormErrors({});
    setImagePreview("");
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const savedImage = productImages[String(product.id)] ?? "";
    setFormData({
      name: product.name,
      description: product.description,
      price: String(product.price),
      category: product.category,
      weight: product.weight,
      inStock: product.inStock,
      imageUrl: savedImage,
    });
    setFormErrors({});
    setImagePreview(savedImage);
    setModalOpen(true);
  };

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      // Convert to base64 data URL for persistent storage across sessions
      const dataUrl = await fileToDataUrl(file);
      setImagePreview(dataUrl);
      setFormData((p) => ({ ...p, imageUrl: dataUrl }));
    } catch {
      toast.error("Failed to load image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<ProductFormData> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.description.trim())
      errors.description = "Description is required";
    if (
      !formData.price.trim() ||
      Number.isNaN(Number(formData.price)) ||
      Number(formData.price) <= 0
    )
      errors.price = "Valid price is required";
    if (!formData.weight.trim()) errors.weight = "Weight is required";
    if (!formData.category) errors.category = "Category is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !actor) return;
    setIsSaving(true);
    try {
      if (editingProduct) {
        await actor.updateProduct(
          token,
          editingProduct.id,
          formData.name,
          formData.description,
          Number(formData.price),
          formData.category,
          formData.weight,
          formData.inStock,
        );
        // Save image for this product
        if (formData.imageUrl) {
          setProductImage(String(editingProduct.id), formData.imageUrl);
        }
        toast.success("Product updated successfully");
      } else {
        await actor.addProduct(
          token,
          formData.name,
          formData.description,
          Number(formData.price),
          formData.category,
          formData.weight,
          formData.inStock,
        );
        // After adding, reload products and find the new one by name+weight
        const allProducts = await actor.getAllProducts();
        const newProduct = allProducts
          .slice()
          .reverse()
          .find(
            (p) => p.name === formData.name && p.weight === formData.weight,
          );
        if (newProduct && formData.imageUrl) {
          setProductImage(String(newProduct.id), formData.imageUrl);
        }
        setProducts(allProducts.length > 0 ? allProducts : STATIC_FALLBACK);
        setProductImages({ ...STATIC_IMAGES, ...getProductImages() });
        toast.success("Product added successfully");
      }
      setModalOpen(false);
      await loadProducts();
    } catch {
      toast.error("Operation failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete confirmation ────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = (product: Product) => {
    setDeleteTarget(product);
  };

  const handleDelete = async () => {
    if (!deleteTarget || !actor) return;
    setIsDeleting(true);
    try {
      await actor.deleteProduct(token, deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      await loadProducts();
    } catch {
      toast.error("Delete failed. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate({ to: "/admin" });
  };

  // ── Products view mode ────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // ── Store Settings ─────────────────────────────────────────────────────────
  const [logoPreview, setLogoPreview] = useState<string>(() => getLogoUrl());
  const [theme, setThemeState] = useState<StoreTheme>(() => getTheme());
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setLogoPreview(dataUrl);
    } catch {
      toast.error("Failed to load logo image.");
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      // Save logo if changed
      if (logoPreview !== getLogoUrl()) {
        setLogoUrl(logoPreview);
      }
      // Save and apply theme
      setTheme(theme);
      applyTheme(theme);
      toast.success("Store settings saved!");
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ── Founder Info state ─────────────────────────────────────────────────────
  const [founderInfo, setFounderInfoState] = useState<FounderInfo>(() =>
    getFounderInfo(),
  );
  const [founderPhotoPreview, setFounderPhotoPreview] = useState<string>(
    () => getFounderInfo().photo,
  );
  const [isSavingFounder, setIsSavingFounder] = useState(false);
  const [isUploadingFounderPhoto, setIsUploadingFounderPhoto] = useState(false);
  const founderPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleFounderPhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFounderPhoto(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setFounderPhotoPreview(dataUrl);
      setFounderInfoState((p) => ({ ...p, photo: dataUrl }));
    } catch {
      toast.error("Failed to load photo. Please try again.");
    } finally {
      setIsUploadingFounderPhoto(false);
    }
  };

  const handleSaveFounderInfo = () => {
    setIsSavingFounder(true);
    try {
      const infoToSave: FounderInfo = {
        ...founderInfo,
        photo: founderPhotoPreview,
      };
      setFounderInfo(infoToSave);
      setFounderInfoState(infoToSave);
      toast.success("Founder info saved!");
    } catch {
      toast.error("Failed to save founder info.");
    } finally {
      setIsSavingFounder(false);
    }
  };

  const formatINR = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  // ── Orders state ──────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const refreshOrders = useCallback(async () => {
    if (!actor) return;
    setLoadingOrders(true);
    try {
      const data = await actor.getAllOrders();
      setOrders(data.map(mapBackendOrder).reverse());
    } catch {
      toast.error("Could not load orders. Please try again.");
    } finally {
      setLoadingOrders(false);
    }
  }, [actor]);

  useEffect(() => {
    if (token && actor && !actorLoading) refreshOrders();
  }, [token, actor, actorLoading, refreshOrders]);

  const handleOrderStatusChange = async (
    orderId: number,
    status: "Pending" | "Confirmed" | "Delivered",
  ) => {
    if (!actor) return;
    try {
      await actor.updateOrderStatus(token, BigInt(orderId), status);
      // Optimistically update local state immediately
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
      toast.success(`Order #${orderId} marked as ${status}`);
    } catch {
      toast.error("Failed to update order status. Please try again.");
      // Refresh to get actual state
      await refreshOrders();
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  // Show a connecting overlay while actor isn't ready yet
  const isActorConnecting = actorLoading && !actor;

  if (!token) return null;

  if (isActorConnecting) {
    return (
      <div className="admin-dash-bg min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <div className="admin-card rounded-2xl p-10 flex flex-col items-center gap-5 shadow-2xl max-w-sm w-full text-center">
          <div className="w-14 h-14 admin-icon-ring admin-icon-glow rounded-2xl flex items-center justify-center text-3xl shadow-lg">
            🐄
          </div>
          <div className="space-y-1">
            <h2 className="admin-heading text-lg font-bold">
              SUNRISE MILK AND AGRO PRODUCT'S
            </h2>
            <p className="admin-sub text-xs font-medium tracking-widest uppercase">
              Admin Panel
            </p>
          </div>
          <div
            data-ocid="admin.dashboard.loading_state"
            className="flex flex-col items-center gap-3 w-full"
          >
            <Loader2 className="admin-spinner animate-spin" size={28} />
            <p className="admin-section-sub text-sm font-medium">
              Connecting to server…
            </p>
            <p className="text-xs admin-hint">
              This may take a few seconds on first load.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dash-bg min-h-screen">
      <Toaster richColors position="top-right" />

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="admin-dash-header sticky top-0 z-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg admin-header-icon flex items-center justify-center text-base shrink-0">
              🐄
            </div>
            <div className="min-w-0">
              <h1 className="admin-dash-title text-sm sm:text-base font-bold leading-none truncate max-w-[180px] sm:max-w-xs md:max-w-none">
                SUNRISE MILK AND AGRO PRODUCT'S
              </h1>
              <p className="admin-dash-subtitle text-xs mt-0.5 font-semibold tracking-widest uppercase">
                Admin Panel
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <span className="admin-user-badge hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full admin-user-dot" />
              {adminUser}
            </span>
            <Button
              data-ocid="admin.header.view_store_button"
              variant="ghost"
              size="sm"
              onClick={() => window.open("/", "_blank")}
              className="admin-view-store-btn gap-1.5 text-xs font-semibold border border-transparent"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">View Store</span>
            </Button>
            <Button
              data-ocid="admin.dashboard.button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="admin-logout-btn gap-2 text-xs font-semibold"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── MAIN ───────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* ── STATS CARDS ─────────────────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Total Products */}
          <div
            data-ocid="admin.stats.total_card"
            className="admin-stats-card flex items-center gap-4"
          >
            <div className="admin-stats-icon">
              <Package size={20} />
            </div>
            <div>
              <p className="admin-stats-label">Total Products</p>
              <p className="admin-stats-value">
                {loadingProducts ? "—" : products.length}
              </p>
            </div>
          </div>
          {/* In Stock */}
          <div
            data-ocid="admin.stats.instock_card"
            className="admin-stats-card flex items-center gap-4"
          >
            <div className="admin-stats-icon admin-stats-icon-instock">
              <Package size={20} />
            </div>
            <div>
              <p className="admin-stats-label">In Stock</p>
              <p className="admin-stats-value">
                {loadingProducts
                  ? "—"
                  : products.filter((p) => p.inStock).length}
              </p>
            </div>
          </div>
          {/* Out of Stock */}
          <div
            data-ocid="admin.stats.oos_card"
            className="admin-stats-card flex items-center gap-4"
          >
            <div className="admin-stats-icon admin-stats-icon-oos">
              <Package size={20} />
            </div>
            <div>
              <p className="admin-stats-label">Out of Stock</p>
              <p className="admin-stats-value">
                {loadingProducts
                  ? "—"
                  : products.filter((p) => !p.inStock).length}
              </p>
            </div>
          </div>
          {/* Total Orders */}
          <div
            data-ocid="admin.stats.orders_card"
            className="admin-stats-card flex items-center gap-4"
          >
            <div className="admin-stats-icon admin-stats-icon-orders">
              <ShoppingBag size={20} />
            </div>
            <div>
              <p className="admin-stats-label">Total Orders</p>
              <p className="admin-stats-value">{orders.length}</p>
            </div>
          </div>
        </motion.div>

        {/* ── PRODUCTS SECTION ─────────────────────────────────────────── */}
        <div>
          {/* Page title + actions */}
          <motion.div
            className="flex items-center justify-between mb-6 gap-4 flex-wrap"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <div>
              <h2 className="admin-section-title text-2xl font-bold">
                Products
              </h2>
              <p className="admin-section-sub text-sm mt-0.5">
                {loadingProducts
                  ? "Loading…"
                  : `${products.length} product${products.length !== 1 ? "s" : ""} listed`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* View mode toggle */}
              <fieldset className="admin-view-toggle border-none p-0 m-0">
                <legend className="sr-only">View mode</legend>
                <button
                  type="button"
                  data-ocid="admin.products.list_toggle"
                  className={`admin-view-toggle-btn${viewMode === "list" ? " active" : ""}`}
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                >
                  <LayoutList size={16} />
                </button>
                <button
                  type="button"
                  data-ocid="admin.products.grid_toggle"
                  className={`admin-view-toggle-btn${viewMode === "grid" ? " active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                >
                  <LayoutGrid size={16} />
                </button>
              </fieldset>
              <Button
                data-ocid="admin.products.button"
                variant="ghost"
                size="sm"
                onClick={loadProducts}
                disabled={loadingProducts}
                className="admin-refresh-btn gap-2 text-xs"
                aria-label="Refresh products"
              >
                <RefreshCw
                  size={14}
                  className={loadingProducts ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                data-ocid="admin.products.primary_button"
                size="sm"
                onClick={openAddModal}
                className="admin-add-btn gap-2 text-sm font-semibold"
              >
                <PackagePlus size={15} />
                Add Product
              </Button>
            </div>
          </motion.div>

          {/* Table card */}
          <motion.div
            className="admin-table-card rounded-2xl overflow-hidden border"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            {loadingProducts ? (
              <div
                data-ocid="admin.products.loading_state"
                className="flex items-center justify-center py-20 gap-3"
              >
                <Loader2 className="admin-spinner animate-spin" size={22} />
                <span className="admin-section-sub text-sm">
                  Loading products…
                </span>
              </div>
            ) : loadError ? (
              <div
                data-ocid="admin.products.error_state"
                className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6"
              >
                <p className="admin-error-text text-sm font-medium">
                  Failed to load products.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadProducts}
                  className="admin-retry-btn"
                >
                  Try Again
                </Button>
              </div>
            ) : products.length === 0 ? (
              <div
                data-ocid="admin.products.empty_state"
                className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6"
              >
                <div className="w-14 h-14 rounded-2xl admin-empty-icon flex items-center justify-center text-3xl">
                  📦
                </div>
                <div>
                  <p className="admin-section-title text-base font-semibold">
                    No products yet
                  </p>
                  <p className="admin-section-sub text-sm mt-1">
                    Click "Add Product" to add your first product.
                  </p>
                </div>
              </div>
            ) : viewMode === "grid" ? (
              /* ── GRID VIEW ─────────────────────────────────────────── */
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product, i) => (
                  <div
                    key={String(product.id)}
                    data-ocid={`admin.products.row.${i + 1}`}
                    className="admin-grid-card card-dairy-hover"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] bg-accent/20 overflow-hidden">
                      {productImages[String(product.id)] ? (
                        <img
                          src={productImages[String(product.id)]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center admin-empty-icon">
                          <Image
                            size={28}
                            className="admin-cell-meta opacity-30"
                          />
                        </div>
                      )}
                      {/* Category badge */}
                      <div className="absolute top-2 left-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border backdrop-blur-sm ${product.category === "Ghee" ? "badge-ghee" : "badge-paneer"}`}
                        >
                          {product.category}
                        </span>
                      </div>
                      {/* Stock badge */}
                      <div className="absolute top-2 right-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm ${product.inStock ? "admin-badge-instock" : "admin-badge-oos"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${product.inStock ? "admin-dot-instock" : "admin-dot-oos"}`}
                          />
                          {product.inStock ? "In Stock" : "OOS"}
                        </span>
                      </div>
                    </div>
                    {/* Content */}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <p className="admin-cell-name font-semibold text-sm leading-tight truncate">
                            {product.name}
                          </p>
                          <p className="admin-cell-meta text-xs mt-0.5">
                            {product.weight}
                          </p>
                        </div>
                        <p className="admin-cell-price font-bold text-sm font-display shrink-0">
                          {formatINR(product.price)}
                        </p>
                      </div>
                      <p className="admin-cell-desc text-xs line-clamp-2 mb-3">
                        {product.description}
                      </p>
                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          data-ocid={`admin.products.preview_button.${i + 1}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open("/", "_blank")}
                          className="admin-view-store-btn h-7 w-7 p-0 rounded-lg"
                          aria-label={`Preview ${product.name} on store`}
                        >
                          <ExternalLink size={13} />
                        </Button>
                        <Button
                          data-ocid={`admin.products.edit_button.${i + 1}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(product)}
                          className="admin-edit-btn h-7 w-7 p-0 rounded-lg"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          data-ocid={`admin.products.delete_button.${i + 1}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(product)}
                          className="admin-delete-btn h-7 w-7 p-0 rounded-lg"
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ── LIST VIEW (TABLE) ────────────────────────────────── */
              <div className="overflow-x-auto">
                <TooltipProvider>
                  <Table>
                    <TableHeader>
                      <TableRow className="admin-table-head-row">
                        <TableHead className="admin-th pl-5 w-12">
                          Photo
                        </TableHead>
                        <TableHead className="admin-th pl-3">Name</TableHead>
                        <TableHead className="admin-th max-w-[160px]">
                          Description
                        </TableHead>
                        <TableHead className="admin-th">Weight</TableHead>
                        <TableHead className="admin-th">Category</TableHead>
                        <TableHead className="admin-th">Price</TableHead>
                        <TableHead className="admin-th">Stock</TableHead>
                        <TableHead className="admin-th pr-5 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product, i) => (
                        <TableRow
                          key={String(product.id)}
                          data-ocid={`admin.products.row.${i + 1}`}
                          className="admin-table-row"
                        >
                          <TableCell className="pl-5">
                            {productImages[String(product.id)] ? (
                              <img
                                src={productImages[String(product.id)]}
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover border border-border"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg admin-empty-icon flex items-center justify-center">
                                <Image
                                  size={16}
                                  className="admin-cell-meta opacity-40"
                                />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="pl-3">
                            <p className="admin-cell-name font-semibold text-sm leading-tight">
                              {product.name}
                            </p>
                          </TableCell>
                          <TableCell className="max-w-[160px]">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p
                                  data-ocid={`admin.products.desc_tooltip.${i + 1}`}
                                  className="admin-cell-desc text-xs line-clamp-1 max-w-[160px] cursor-default"
                                >
                                  {product.description}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="max-w-[260px] text-xs leading-relaxed"
                              >
                                {product.description}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="admin-cell-meta text-sm">
                            {product.weight}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${product.category === "Ghee" ? "badge-ghee" : "badge-paneer"}`}
                            >
                              {product.category}
                            </span>
                          </TableCell>
                          <TableCell className="admin-cell-price font-bold text-sm font-display">
                            {formatINR(product.price)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${product.inStock ? "admin-badge-instock" : "admin-badge-oos"}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${product.inStock ? "admin-dot-instock" : "admin-dot-oos"}`}
                              />
                              {product.inStock ? "In Stock" : "Out of Stock"}
                            </span>
                          </TableCell>
                          <TableCell className="pr-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                data-ocid={`admin.products.preview_button.${i + 1}`}
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open("/", "_blank")}
                                className="admin-view-store-btn h-8 w-8 p-0 rounded-lg"
                                aria-label={`Preview ${product.name} on store`}
                              >
                                <ExternalLink size={13} />
                              </Button>
                              <Button
                                data-ocid={`admin.products.edit_button.${i + 1}`}
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(product)}
                                className="admin-edit-btn h-8 w-8 p-0 rounded-lg"
                                aria-label={`Edit ${product.name}`}
                              >
                                <Pencil size={14} />
                              </Button>
                              <Button
                                data-ocid={`admin.products.delete_button.${i + 1}`}
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDelete(product)}
                                className="admin-delete-btn h-8 w-8 p-0 rounded-lg"
                                aria-label={`Delete ${product.name}`}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TooltipProvider>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── STORE SETTINGS SECTION ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
        >
          {/* Section header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg admin-header-icon flex items-center justify-center shrink-0">
              <Store size={16} />
            </div>
            <div>
              <h2 className="admin-section-title text-2xl font-bold">
                Store Settings
              </h2>
              <p className="admin-section-sub text-sm mt-0.5">
                Customise your store logo, colours, and branding
              </p>
            </div>
          </div>

          <div className="admin-table-card rounded-2xl border p-6 space-y-8">
            {/* ── Logo upload ─────────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image size={16} className="admin-cell-meta" />
                <h3 className="admin-section-title text-base font-semibold">
                  Store Logo
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                {/* Preview */}
                <div className="w-24 h-24 rounded-xl border-2 border-dashed admin-settings-border flex items-center justify-center shrink-0 overflow-hidden bg-white">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Store logo preview"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-center px-2">
                      <Image size={24} className="admin-cell-meta opacity-30" />
                      <span className="text-xs admin-section-sub">No logo</span>
                    </div>
                  )}
                </div>

                {/* Upload controls */}
                <div className="flex-1 space-y-3">
                  <p className="admin-section-sub text-sm leading-relaxed">
                    Upload your store logo. Recommended: PNG with transparent
                    background, at least 200×200px.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      id="logo-file-input"
                      data-ocid="admin.settings.logo_upload"
                      onChange={handleLogoFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      className="admin-retry-btn gap-2"
                    >
                      <Upload size={14} />
                      Choose Logo
                    </Button>
                    {logoPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setLogoPreview("")}
                        className="admin-delete-btn gap-2 text-xs"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t admin-settings-divider" />

            {/* ── Theme colours ────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Palette size={16} className="admin-cell-meta" />
                <h3 className="admin-section-title text-base font-semibold">
                  Brand Colours
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Primary colour */}
                <div className="space-y-2">
                  <Label className="admin-label text-xs font-semibold uppercase tracking-wider">
                    Primary Colour (buttons, accents)
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        data-ocid="admin.settings.primary_color"
                        value={theme.primaryColor || "#e07b00"}
                        onChange={(e) =>
                          setThemeState((p) => ({
                            ...p,
                            primaryColor: e.target.value,
                          }))
                        }
                        className="admin-color-picker w-12 h-10 rounded-lg cursor-pointer border-2 admin-settings-border p-0.5"
                        title="Choose primary colour"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={theme.primaryColor}
                        onChange={(e) =>
                          setThemeState((p) => ({
                            ...p,
                            primaryColor: e.target.value,
                          }))
                        }
                        placeholder="#e07b00 (leave blank for default)"
                        className="admin-modal-input text-sm"
                      />
                    </div>
                    {theme.primaryColor && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setThemeState((p) => ({ ...p, primaryColor: "" }))
                        }
                        className="admin-delete-btn px-3 text-xs shrink-0"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                  {theme.primaryColor && (
                    <div
                      className="h-1.5 rounded-full mt-1"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                  )}
                  <p className="text-xs admin-section-sub">
                    Applies to buttons, links, and accents across the store.
                  </p>
                </div>

                {/* Background colour */}
                <div className="space-y-2">
                  <Label className="admin-label text-xs font-semibold uppercase tracking-wider">
                    Background Colour
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        data-ocid="admin.settings.bg_color"
                        value={theme.bgColor || "#f7f3ee"}
                        onChange={(e) =>
                          setThemeState((p) => ({
                            ...p,
                            bgColor: e.target.value,
                          }))
                        }
                        className="admin-color-picker w-12 h-10 rounded-lg cursor-pointer border-2 admin-settings-border p-0.5"
                        title="Choose background colour"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={theme.bgColor}
                        onChange={(e) =>
                          setThemeState((p) => ({
                            ...p,
                            bgColor: e.target.value,
                          }))
                        }
                        placeholder="#f7f3ee (leave blank for default)"
                        className="admin-modal-input text-sm"
                      />
                    </div>
                    {theme.bgColor && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setThemeState((p) => ({ ...p, bgColor: "" }))
                        }
                        className="admin-delete-btn px-3 text-xs shrink-0"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                  {theme.bgColor && (
                    <div
                      className="h-1.5 rounded-full mt-1 border border-border"
                      style={{ backgroundColor: theme.bgColor }}
                    />
                  )}
                  <p className="text-xs admin-section-sub">
                    Sets the store page background colour.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t admin-settings-divider" />

            {/* Save button */}
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs admin-section-sub">
                Changes apply immediately on the store page after saving.
              </p>
              <Button
                data-ocid="admin.settings.save_button"
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="admin-save-btn font-semibold gap-2 shrink-0"
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ── ORDERS SECTION ───────────────────────────────────────────────── */}
        <motion.div
          data-ocid="admin.orders.section"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.22 }}
        >
          {/* Section header */}
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg admin-header-icon flex items-center justify-center shrink-0">
                <ShoppingBag size={16} />
              </div>
              <div>
                <h2 className="admin-section-title text-2xl font-bold">
                  Orders
                </h2>
                <p className="admin-section-sub text-sm mt-0.5">
                  {orders.length} order{orders.length !== 1 ? "s" : ""} received
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void refreshOrders();
              }}
              disabled={loadingOrders}
              className="admin-refresh-btn gap-2 text-xs"
              aria-label="Refresh orders"
            >
              <RefreshCw
                size={14}
                className={loadingOrders ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>

          <div className="admin-table-card rounded-2xl overflow-hidden border">
            {loadingOrders ? (
              <div
                data-ocid="admin.orders.loading_state"
                className="flex items-center justify-center py-20 gap-3"
              >
                <Loader2 className="admin-spinner animate-spin" size={22} />
                <span className="admin-section-sub text-sm">
                  Loading orders…
                </span>
              </div>
            ) : orders.length === 0 ? (
              <div
                data-ocid="admin.orders.empty_state"
                className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6"
              >
                <div className="w-14 h-14 rounded-2xl admin-empty-icon flex items-center justify-center text-3xl">
                  🛒
                </div>
                <div>
                  <p className="admin-section-title text-base font-semibold">
                    No orders yet
                  </p>
                  <p className="admin-section-sub text-sm mt-1">
                    Orders placed by customers will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table data-ocid="admin.orders.table">
                  <TableHeader>
                    <TableRow className="admin-table-head-row">
                      <TableHead className="admin-th pl-5">Order #</TableHead>
                      <TableHead className="admin-th">Customer</TableHead>
                      <TableHead className="admin-th">Items</TableHead>
                      <TableHead className="admin-th">Total</TableHead>
                      <TableHead className="admin-th">Date</TableHead>
                      <TableHead className="admin-th">Status</TableHead>
                      <TableHead className="admin-th pr-5">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order, i) => (
                      <TableRow
                        key={order.id}
                        data-ocid={`admin.orders.row.${i + 1}`}
                        className="admin-table-row"
                      >
                        <TableCell className="pl-5 font-semibold admin-cell-name text-sm">
                          #{order.id}
                        </TableCell>
                        <TableCell>
                          <p className="admin-cell-name font-semibold text-sm leading-tight">
                            {order.customerName}
                          </p>
                          <p className="admin-cell-meta text-xs mt-0.5">
                            {order.customerPhone}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="space-y-0.5">
                            {order.items.map((item) => (
                              <p
                                key={`${item.productId}-${item.productWeight}`}
                                className="admin-cell-desc text-xs leading-tight"
                              >
                                {item.quantity} × {item.productName}{" "}
                                {item.productWeight}
                              </p>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="admin-cell-price font-bold text-sm font-display">
                          {formatINR(order.total)}
                        </TableCell>
                        <TableCell className="admin-cell-meta text-xs whitespace-nowrap">
                          {formatDate(order.timestamp)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              order.status === "Delivered"
                                ? "admin-badge-instock"
                                : order.status === "Confirmed"
                                  ? "admin-badge-confirmed"
                                  : "admin-badge-pending"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                order.status === "Delivered"
                                  ? "admin-dot-instock"
                                  : order.status === "Confirmed"
                                    ? "admin-dot-confirmed"
                                    : "admin-dot-pending"
                              }`}
                            />
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell className="pr-5">
                          <Select
                            value={order.status}
                            onValueChange={(v) =>
                              handleOrderStatusChange(
                                order.id,
                                v as "Pending" | "Confirmed" | "Delivered",
                              )
                            }
                          >
                            <SelectTrigger
                              data-ocid={`admin.orders.status.select.${i + 1}`}
                              className="admin-modal-input h-8 text-xs w-32"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="admin-select-content">
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Confirmed">
                                Confirmed
                              </SelectItem>
                              <SelectItem value="Delivered">
                                Delivered
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── FOUNDER INFO SECTION ─────────────────────────────────────────── */}
        <motion.div
          data-ocid="admin.founder.section"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.26 }}
        >
          {/* Section header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg admin-header-icon flex items-center justify-center shrink-0">
              <User size={16} />
            </div>
            <div>
              <h2 className="admin-section-title text-2xl font-bold">
                Founder Info
              </h2>
              <p className="admin-section-sub text-sm mt-0.5">
                Personalise the founder story shown on your store page
              </p>
            </div>
          </div>

          <div className="admin-table-card rounded-2xl border p-6 space-y-6">
            {/* Photo upload */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image size={16} className="admin-cell-meta" />
                <h3 className="admin-section-title text-base font-semibold">
                  Founder Photo
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                {/* Preview */}
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed admin-settings-border flex items-center justify-center shrink-0 overflow-hidden bg-white">
                  {isUploadingFounderPhoto ? (
                    <Loader2 size={20} className="admin-spinner animate-spin" />
                  ) : founderPhotoPreview ? (
                    <img
                      src={founderPhotoPreview}
                      alt="Founder preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-center px-2">
                      <User size={24} className="admin-cell-meta opacity-30" />
                      <span className="text-xs admin-section-sub">
                        No photo
                      </span>
                    </div>
                  )}
                </div>

                {/* Upload controls */}
                <div className="flex-1 space-y-3">
                  <p className="admin-section-sub text-sm leading-relaxed">
                    Upload a professional photo. Recommended: square image,
                    minimum 400×400px.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      ref={founderPhotoInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      id="founder-photo-input"
                      data-ocid="admin.founder_photo_upload"
                      onChange={handleFounderPhotoChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => founderPhotoInputRef.current?.click()}
                      className="admin-retry-btn gap-2"
                    >
                      <Upload size={14} />
                      {founderPhotoPreview ? "Change Photo" : "Upload Photo"}
                    </Button>
                    {founderPhotoPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFounderPhotoPreview("");
                          setFounderInfoState((p) => ({ ...p, photo: "" }));
                          if (founderPhotoInputRef.current)
                            founderPhotoInputRef.current.value = "";
                        }}
                        className="admin-delete-btn gap-2 text-xs"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t admin-settings-divider" />

            {/* Name + Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="founder-name"
                  className="admin-label text-xs font-semibold uppercase tracking-wider"
                >
                  Founder Name
                </Label>
                <Input
                  id="founder-name"
                  data-ocid="admin.founder_name_input"
                  value={founderInfo.name}
                  onChange={(e) =>
                    setFounderInfoState((p) => ({
                      ...p,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g. Ramesh Patel"
                  className="admin-modal-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="founder-title"
                  className="admin-label text-xs font-semibold uppercase tracking-wider"
                >
                  Title / Role
                </Label>
                <Input
                  id="founder-title"
                  data-ocid="admin.founder_title_input"
                  value={founderInfo.title}
                  onChange={(e) =>
                    setFounderInfoState((p) => ({
                      ...p,
                      title: e.target.value,
                    }))
                  }
                  placeholder="e.g. Founder & Managing Director"
                  className="admin-modal-input"
                />
              </div>
            </div>

            {/* Founded Year */}
            <div className="space-y-1.5">
              <Label
                htmlFor="founder-year"
                className="admin-label text-xs font-semibold uppercase tracking-wider"
              >
                Founded Year
              </Label>
              <Input
                id="founder-year"
                value={founderInfo.foundedYear}
                onChange={(e) =>
                  setFounderInfoState((p) => ({
                    ...p,
                    foundedYear: e.target.value,
                  }))
                }
                placeholder="e.g. 2018"
                className="admin-modal-input sm:max-w-[160px]"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label
                htmlFor="founder-bio"
                className="admin-label text-xs font-semibold uppercase tracking-wider"
              >
                Bio / Story
              </Label>
              <Textarea
                id="founder-bio"
                data-ocid="admin.founder_bio_textarea"
                value={founderInfo.bio}
                onChange={(e) =>
                  setFounderInfoState((p) => ({ ...p, bio: e.target.value }))
                }
                placeholder="Share the founder's story and vision…"
                rows={4}
                className="admin-modal-input resize-none"
              />
              <p className="text-xs admin-section-sub">
                This appears in the Our Story section on your store page.
              </p>
            </div>

            {/* Divider */}
            <div className="border-t admin-settings-divider" />

            {/* Save button */}
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs admin-section-sub">
                Changes will appear on the store page immediately after saving.
              </p>
              <Button
                data-ocid="admin.founder_save_button"
                onClick={handleSaveFounderInfo}
                disabled={isSavingFounder}
                className="admin-save-btn font-semibold gap-2 shrink-0"
              >
                {isSavingFounder ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Founder Info"
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ── ADD / EDIT MODAL ──────────────────────────────────────────── */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!isSaving) setModalOpen(open);
        }}
      >
        <DialogContent
          data-ocid="admin.products.modal"
          className="admin-modal sm:max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="admin-modal-title text-lg font-bold">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription className="admin-modal-desc text-sm">
              {editingProduct
                ? `Update the details for "${editingProduct.name}".`
                : "Fill in the details for the new product."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="prod-name"
                className="admin-label text-xs font-semibold uppercase tracking-wider"
              >
                Product Name *
              </Label>
              <Input
                id="prod-name"
                data-ocid="admin.products.input"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Pure Cow Ghee"
                disabled={isSaving}
                className="admin-modal-input"
                aria-describedby={formErrors.name ? "prod-name-err" : undefined}
              />
              {formErrors.name && (
                <p
                  id="prod-name-err"
                  data-ocid="admin.products.error_state"
                  className="admin-field-error text-xs"
                >
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label
                htmlFor="prod-desc"
                className="admin-label text-xs font-semibold uppercase tracking-wider"
              >
                Description *
              </Label>
              <Textarea
                id="prod-desc"
                data-ocid="admin.products.textarea"
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Short product description…"
                disabled={isSaving}
                rows={3}
                className="admin-modal-input resize-none"
                aria-describedby={
                  formErrors.description ? "prod-desc-err" : undefined
                }
              />
              {formErrors.description && (
                <p
                  id="prod-desc-err"
                  data-ocid="admin.products.error_state"
                  className="admin-field-error text-xs"
                >
                  {formErrors.description}
                </p>
              )}
            </div>

            {/* Price + Weight row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="prod-price"
                  className="admin-label text-xs font-semibold uppercase tracking-wider"
                >
                  Price (₹) *
                </Label>
                <Input
                  id="prod-price"
                  data-ocid="admin.products.input"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, price: e.target.value }))
                  }
                  placeholder="e.g. 899"
                  disabled={isSaving}
                  className="admin-modal-input"
                  aria-describedby={
                    formErrors.price ? "prod-price-err" : undefined
                  }
                />
                {formErrors.price && (
                  <p
                    id="prod-price-err"
                    data-ocid="admin.products.error_state"
                    className="admin-field-error text-xs"
                  >
                    {formErrors.price}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="prod-weight"
                  className="admin-label text-xs font-semibold uppercase tracking-wider"
                >
                  Weight *
                </Label>
                <Input
                  id="prod-weight"
                  data-ocid="admin.products.input"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, weight: e.target.value }))
                  }
                  placeholder="e.g. 500g"
                  disabled={isSaving}
                  className="admin-modal-input"
                  aria-describedby={
                    formErrors.weight ? "prod-weight-err" : undefined
                  }
                />
                {formErrors.weight && (
                  <p
                    id="prod-weight-err"
                    data-ocid="admin.products.error_state"
                    className="admin-field-error text-xs"
                  >
                    {formErrors.weight}
                  </p>
                )}
              </div>
            </div>

            {/* Category + Stock row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="prod-cat"
                  className="admin-label text-xs font-semibold uppercase tracking-wider"
                >
                  Category *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, category: v }))
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger
                    id="prod-cat"
                    data-ocid="admin.products.select"
                    className="admin-modal-input"
                    aria-describedby={
                      formErrors.category ? "prod-cat-err" : undefined
                    }
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="admin-select-content">
                    <SelectItem value="Ghee">Ghee</SelectItem>
                    <SelectItem value="Paneer">Paneer</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.category && (
                  <p
                    id="prod-cat-err"
                    data-ocid="admin.products.error_state"
                    className="admin-field-error text-xs"
                  >
                    {formErrors.category}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="admin-label text-xs font-semibold uppercase tracking-wider">
                  In Stock
                </Label>
                <div className="h-10 flex items-center gap-3">
                  <Switch
                    data-ocid="admin.products.switch"
                    checked={formData.inStock}
                    onCheckedChange={(v) =>
                      setFormData((p) => ({ ...p, inStock: v }))
                    }
                    disabled={isSaving}
                    className="admin-switch"
                    aria-label="Product in stock"
                  />
                  <span className="admin-label text-sm">
                    {formData.inStock ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Photo */}
            <div className="space-y-1.5">
              <Label className="admin-label text-xs font-semibold uppercase tracking-wider">
                Product Photo
              </Label>
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="w-20 h-20 rounded-xl border-2 border-dashed admin-settings-border flex items-center justify-center shrink-0 overflow-hidden bg-gray-50">
                  {isUploadingImage ? (
                    <Loader2 size={20} className="admin-spinner animate-spin" />
                  ) : imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image size={20} className="admin-cell-meta opacity-30" />
                  )}
                </div>
                {/* Upload controls */}
                <div className="flex-1 space-y-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    id="product-image-input"
                    data-ocid="admin.products.upload_button"
                    onChange={handleImageFileChange}
                    disabled={isSaving}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isSaving || isUploadingImage}
                    className="admin-retry-btn gap-2 w-full"
                  >
                    <Upload size={14} />
                    {imagePreview ? "Change Photo" : "Upload Photo"}
                  </Button>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImagePreview("");
                        setFormData((p) => ({ ...p, imageUrl: "" }));
                        if (imageInputRef.current)
                          imageInputRef.current.value = "";
                      }}
                      disabled={isSaving}
                      className="admin-delete-btn gap-2 w-full text-xs"
                    >
                      Remove Photo
                    </Button>
                  )}
                  <p className="text-xs admin-section-sub">
                    JPG, PNG, or WebP. Max 5MB recommended.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              data-ocid="admin.products.cancel_button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
              className="admin-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin.products.save_button"
              onClick={handleSave}
              disabled={isSaving}
              className="admin-save-btn font-semibold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : editingProduct ? (
                "Save Changes"
              ) : (
                "Add Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRMATION ─────────────────────────────────────── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!isDeleting && !open) setDeleteTarget(null);
        }}
      >
        <DialogContent
          data-ocid="admin.products.dialog"
          className="admin-modal sm:max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="admin-modal-title text-lg font-bold">
              Delete Product?
            </DialogTitle>
            <DialogDescription className="admin-modal-desc text-sm">
              This will permanently remove{" "}
              <strong className="admin-highlight">
                "{deleteTarget?.name} ({deleteTarget?.weight})"
              </strong>{" "}
              from your store. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 mt-2">
            <Button
              data-ocid="admin.products.cancel_button"
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="admin-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin.products.confirm_button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="admin-delete-confirm-btn font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Yes, Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
