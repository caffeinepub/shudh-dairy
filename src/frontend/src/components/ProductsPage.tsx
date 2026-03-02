import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Package, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useGetAllProducts } from "../hooks/useQueries";
import type { DairyProduct } from "./CartDrawer";
import { ProductCard } from "./ProductCard";

function ProductCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      className="flex flex-col bg-card border border-border rounded-lg overflow-hidden shadow-xs"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className="h-1 w-full bg-border" />
      <div className="p-5 flex flex-col gap-3">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <div className="mt-2 pt-3 border-t border-border flex justify-between">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </motion.div>
  );
}

export function ProductsPage() {
  const { data: products, isLoading, isError } = useGetAllProducts();

  const isEmpty = !isLoading && !isError && products?.length === 0;
  const hasProducts = !isLoading && !isError && (products?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ShoppingBag className="text-primary" size={22} />
            <span className="font-display text-lg font-semibold text-foreground tracking-tight">
              Storefront
            </span>
          </motion.div>
          <motion.span
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            {hasProducts ? `${products!.length} products` : null}
          </motion.span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Page heading */}
        <motion.div
          className="text-center mb-10 sm:mb-14"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-3">
            Products
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
            Handpicked items crafted with care and quality you can trust.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <div className="h-px w-16 bg-border" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <div className="h-px w-16 bg-border" />
          </div>
        </motion.div>

        {/* Loading state */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              data-ocid="products.loading_state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Accessible live region */}
              <div className="sr-only" aria-live="polite" aria-busy="true">
                Loading products…
              </div>

              {/* Loading indicator row */}
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-8">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm font-medium">Loading products…</span>
              </div>

              {/* Skeleton grid — matches final layout */}
              <div className="flex flex-wrap justify-center gap-5">
                {["s1", "s2", "s3", "s4", "s5", "s6"].map((id, i) => (
                  <div
                    key={id}
                    className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] min-w-[200px]"
                  >
                    <ProductCardSkeleton index={i} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Error state */}
          {isError && (
            <motion.div
              key="error"
              className="text-center py-20"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-muted-foreground text-sm">
                Unable to load products. Please try again.
              </p>
            </motion.div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <motion.div
              key="empty"
              data-ocid="products.empty_state"
              className="text-center py-20"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-5">
                <Package className="text-muted-foreground" size={28} />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                No products yet
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Check back soon — new items will appear here as they're added to
                the catalog.
              </p>
            </motion.div>
          )}

          {/* Product grid */}
          {hasProducts && (
            <motion.section
              key="grid"
              data-ocid="products.section"
              aria-label="Product listing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-wrap justify-center gap-5">
                {products!.map((product, i) => (
                  <div
                    key={product.id.toString()}
                    className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] min-w-[200px]"
                  >
                    <ProductCard
                      product={product as unknown as DairyProduct}
                      index={i + 1}
                      onAddToCart={() => {}}
                    />
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()}.{" "}
          <span>
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
        </div>
      </footer>
    </div>
  );
}
