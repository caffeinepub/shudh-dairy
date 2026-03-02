import type { Product as BackendProduct } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { useActor } from "@/hooks/useActor";
import {
  applyTheme,
  getLogoUrl,
  getProductImages,
  getTheme,
} from "@/utils/storeCustomization";
import {
  ArrowUp,
  ChevronDown,
  ClipboardList,
  Leaf,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Shield,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CartDrawer, type CartItem, type DairyProduct } from "./CartDrawer";
import { FounderSection } from "./FounderSection";
import { ProductCard } from "./ProductCard";

// ─── Map backend product to DairyProduct ──────────────────────────────────────
function mapBackendProduct(
  p: BackendProduct,
  productImages: Record<string, string>,
): DairyProduct {
  const categoryMap: Record<string, string> = {
    Ghee: "/assets/generated/ghee-cow.dim_600x600.jpg",
    Paneer: "/assets/generated/paneer-fresh.dim_600x600.jpg",
  };
  // Priority: custom uploaded image > category default
  const customImage = productImages[String(p.id)];
  return {
    id: Number(p.id),
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.category as DairyProduct["category"],
    weight: p.weight,
    inStock: p.inStock,
    image:
      customImage ??
      categoryMap[p.category] ??
      "/assets/generated/ghee-cow.dim_600x600.jpg",
  };
}

type Category = "All" | "Ghee" | "Paneer";
const CATEGORIES: Category[] = ["All", "Ghee", "Paneer"];

const trustBadges = [
  { icon: Leaf, label: "100% Pure", sub: "No additives" },
  { icon: Star, label: "Farm Fresh", sub: "Direct from farms" },
  { icon: Truck, label: "Fast Delivery", sub: "2–3 day shipping" },
  { icon: Shield, label: "Secure Payment", sub: "100% safe checkout" },
];

export function StorePage() {
  // ── Store customization ────────────────────────────────────────────────────
  const [logoUrl, setLogoUrlState] = useState<string>(() => getLogoUrl());

  useEffect(() => {
    // Apply any saved theme on mount
    const savedTheme = getTheme();
    applyTheme(savedTheme);
    // Refresh logo in case it was updated in admin
    setLogoUrlState(getLogoUrl());
  }, []);

  // ── Backend products state ─────────────────────────────────────────────────
  const { actor, isFetching: actorLoading } = useActor();
  const [products, setProducts] = useState<DairyProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    // Stay in loading state while actor is still connecting
    if (actorLoading || !actor) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await actor.getAllProducts();
        if (!cancelled) {
          const productImages = getProductImages();
          setProducts(data.map((p) => mapBackendProduct(p, productImages)));
        }
      } catch {
        // On error, leave products as empty array and let empty state show
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actor, actorLoading]);

  // ── Cart state ─────────────────────────────────────────────────────────────
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Cart operations ──────────────────────────────────────────────────────────
  const addToCart = useCallback(
    (productId: number) => {
      setCartItems((prev) => {
        const existing = prev.find((i) => i.productId === productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i,
          );
        }
        return [...prev, { productId, quantity: 1 }];
      });
      const product = products.find((p) => p.id === productId);
      toast.success(`${product?.name} added to cart!`, {
        description: `${product?.weight} — ₹${product?.price}`,
      });
    },
    [products],
  );

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCartItems((prev) => {
      const updated = prev
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + delta }
            : i,
        )
        .filter((i) => i.quantity > 0);
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // ── Scroll to top visibility ─────────────────────────────────────────────
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Filtered products ────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        activeCategory === "All" || p.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Store Logo"
                className="h-10 w-auto object-contain rounded-lg shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold shadow-sm shrink-0">
                🐄
              </div>
            )}
            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-none tracking-tight">
                SUNRISE MILK AND AGRO PRODUCT'S
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pure | Fresh | Delivered
              </p>
            </div>
          </motion.div>

          {/* Header actions */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* My Orders button */}
            <a
              href="/track-order"
              data-ocid="header.my_orders_button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-primary/40 text-primary bg-primary/8 hover:bg-primary/15 hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-150"
            >
              <ClipboardList size={15} />
              <span className="hidden sm:inline">My Orders</span>
            </a>

            {/* Cart button */}
            <motion.button
              data-ocid="header.cart_button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-150 shadow-sm"
              whileTap={{ scale: 0.96 }}
            >
              <ShoppingCart size={17} />
              <span className="hidden sm:inline">Cart</span>
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key="badge"
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/assets/generated/hero-dairy-farm.dim_1200x500.jpg"
            alt="Fresh Indian dairy farm"
            className="w-full h-full object-cover"
          />
          {/* Stronger gradient for better legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.10_0.04_45/0.90)] via-[oklch(0.12_0.04_45/0.60)] to-[oklch(0.14_0.04_45/0.15)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.10_0.04_45/0.50)] via-transparent to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 md:py-40">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.span
              className="inline-block bg-primary/30 backdrop-blur-md text-white border border-primary/50 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5 tracking-wide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              ✨ Trusted by 10,000+ families
            </motion.span>
            <motion.h2
              className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.6, ease: "easeOut" }}
            >
              Pure Dairy,
              <br />
              <span style={{ color: "oklch(0.88 0.16 72)" }}>
                Delivered Fresh
              </span>
            </motion.h2>
            <motion.p
              className="text-base sm:text-lg text-white/90 mb-9 leading-relaxed max-w-lg"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.5 }}
            >
              Handpicked Ghee &amp; Paneer from trusted farms — straight to your
              door. No preservatives. No compromise.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.5 }}
            >
              <Button
                data-ocid="hero.primary_button"
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary font-semibold text-base px-10 h-14 rounded-2xl shadow-xl shadow-primary/30 transition-all duration-150 hover:shadow-primary/40 hover:scale-[1.02]"
                onClick={() => {
                  document
                    .getElementById("products")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Shop Now
              </Button>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 cursor-pointer"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            onClick={() =>
              document
                .getElementById("products")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            aria-label="Scroll to products"
          >
            <span className="text-white/60 text-xs tracking-widest uppercase font-medium">
              Explore
            </span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 1.6,
                ease: "easeInOut",
              }}
            >
              <ChevronDown size={20} className="text-white/60" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── TRUST BADGES — editorial dark proof bar ────────────────────────── */}
      <section className="trust-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-0">
            {trustBadges.map((badge, i) => (
              <div
                key={badge.label}
                className="flex items-center w-full sm:w-auto"
              >
                <motion.div
                  className="flex items-center gap-3 py-4 px-4 flex-1 sm:flex-initial sm:px-8"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.08 }}
                >
                  <div className="w-9 h-9 rounded-lg trust-bar-icon-wrap flex items-center justify-center shrink-0">
                    <badge.icon className="trust-bar-icon" size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold trust-bar-text leading-none">
                      {badge.label}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "oklch(0.74 0.04 76)" }}
                    >
                      {badge.sub}
                    </p>
                  </div>
                </motion.div>
                {/* Vertical divider between badges */}
                {i < trustBadges.length - 1 && (
                  <div className="hidden sm:block h-10 w-px trust-bar-divider" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS SECTION ───────────────────────────────────────────────── */}
      <main
        id="products"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16"
      >
        {/* Section heading */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Our Products
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Freshness you can taste, purity you can trust.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-primary/30" />
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <div className="h-1.5 w-5 rounded-full bg-primary/60" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
            <div className="h-px w-12 bg-primary/30" />
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 items-start sm:items-center justify-between">
          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat, idx) => (
              <button
                type="button"
                key={cat}
                data-ocid={`products.tab.${idx + 1}`}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 active:scale-95 ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={15}
            />
            <Input
              data-ocid="products.search_input"
              type="text"
              placeholder="Search products…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl border-border bg-card focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
            />
          </div>
        </div>

        {/* Products grid */}
        {isLoadingProducts ? (
          <div
            data-ocid="products.loading_state"
            className="flex items-center justify-center py-20 gap-3"
          >
            <Loader2 className="text-primary animate-spin" size={22} />
            <span className="text-muted-foreground text-sm">
              Loading products…
            </span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {filteredProducts.length === 0 ? (
              <motion.div
                key="empty"
                data-ocid="products.empty_state"
                className="text-center py-20"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center text-3xl">
                  🥛
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  No products found
                </h3>
                <p className="text-muted-foreground text-sm">
                  Try a different category or search term.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={`${activeCategory}-${searchQuery}`}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {filteredProducts.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={i + 1}
                    onAddToCart={addToCart}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* ── FOUNDER SECTION ────────────────────────────────────────────────── */}
      <FounderSection />

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-base">
                  🐄
                </div>
                <span className="font-display text-lg font-bold text-foreground">
                  SUNRISE MILK AND AGRO PRODUCT'S
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pure | Fresh | Delivered
              </p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Bringing the goodness of farm-fresh dairy straight to your
                kitchen since 2018.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 text-sm">
                Quick Links
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("products")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="hover:text-primary transition-colors"
                  >
                    All Products
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("Ghee")}
                    className="hover:text-primary transition-colors"
                  >
                    Ghee Collection
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("Paneer")}
                    className="hover:text-primary transition-colors"
                  >
                    Paneer Range
                  </button>
                </li>
                <li>
                  <a
                    href="/track-order"
                    data-ocid="footer.track_order.link"
                    className="hover:text-primary transition-colors flex items-center gap-1.5 font-medium text-foreground/80"
                  >
                    <ClipboardList
                      size={13}
                      className="text-primary shrink-0"
                    />
                    My Orders / Track Order
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 text-sm">
                Contact
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-primary shrink-0" />
                  <a
                    href="mailto:sunrisemilkandagroproducts@gmail.com"
                    className="hover:text-primary transition-colors break-all"
                  >
                    sunrisemilkandagroproducts@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} className="text-primary shrink-0" />
                  <a
                    href="tel:8875759738"
                    className="hover:text-primary transition-colors"
                  >
                    8875759738
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                  <span>
                    Shop No. 1, Patel House, Near Mewar Hospital, Bhuwana, Dist.
                    Udaipur, Rajasthan - 313001
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              © {new Date().getFullYear()} SUNRISE MILK AND AGRO PRODUCT'S.
              Built with{" "}
              <span className="text-primary" aria-label="love">
                ♥
              </span>{" "}
              using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-primary transition-colors"
              >
                caffeine.ai
              </a>
            </span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                data-ocid="footer.scroll_top_button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-xs text-muted-foreground/70 hover:text-primary transition-colors flex items-center gap-1"
              >
                <ArrowUp size={12} />
                Back to Top
              </button>
              <a
                href="/admin"
                data-ocid="footer.admin.link"
                className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                Admin
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── SCROLL TO TOP ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            data-ocid="store.scroll_top_button"
            type="button"
            className="scroll-top-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll to top"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── CART DRAWER ────────────────────────────────────────────────────── */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        products={products}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        actor={actor}
        onOrderPlaced={() => {
          setCartItems([]);
          setIsCartOpen(false);
        }}
      />
    </div>
  );
}
