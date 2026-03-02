import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Weight } from "lucide-react";
import { motion } from "motion/react";
import type { DairyProduct } from "./CartDrawer";

interface ProductCardProps {
  product: DairyProduct;
  index: number;
  onAddToCart: (productId: number) => void;
}

// Token-based category colors — no hardcoded Tailwind palette classes
const categoryBadgeClass: Record<string, string> = {
  Ghee: "badge-ghee",
  Paneer: "badge-paneer",
  Combo: "badge-combo",
};

// Static rating per category — purely decorative
const categoryRating: Record<string, { score: number; label: string }> = {
  Ghee: { score: 4.8, label: "4.8" },
  Paneer: { score: 4.6, label: "4.6" },
};

function StarRating({ category }: { category: string }) {
  const rating = categoryRating[category] ?? { score: 4.7, label: "4.7" };
  // Render 5 stars: filled, half, or empty based on score
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating.label} stars`}
    >
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.floor(rating.score);
          const half =
            !filled &&
            star === Math.ceil(rating.score) &&
            rating.score % 1 >= 0.3;
          return (
            <span
              key={star}
              className="text-sm leading-none"
              style={{
                color:
                  filled || half
                    ? "oklch(0.78 0.18 72)"
                    : "oklch(0.82 0.04 80)",
              }}
              aria-hidden="true"
            >
              {filled ? "★" : half ? "⯨" : "☆"}
            </span>
          );
        })}
      </div>
      <span
        className="text-xs font-semibold"
        style={{ color: "oklch(0.55 0.10 62)" }}
      >
        {rating.label}
      </span>
    </div>
  );
}

export function ProductCard({ product, index, onAddToCart }: ProductCardProps) {
  const formatINR = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <motion.article
      data-ocid={`products.item.${index}`}
      className="group relative flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-card card-dairy-hover h-full"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.45,
        delay: (index - 1) * 0.07,
        ease: "easeOut",
      }}
      whileHover={{ y: -3 }}
    >
      {/* Product image — taller aspect ratio for premium feel */}
      <div className="relative overflow-hidden aspect-[4/3] bg-accent/30">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Warm golden vignette overlay — makes images feel warmer/premium */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/30 via-transparent to-transparent pointer-events-none" />
        {/* Category badge overlay */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${categoryBadgeClass[product.category] ?? "bg-secondary text-secondary-foreground border-border"}`}
          >
            {product.category}
          </span>
        </div>
        {/* Weight badge overlay */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 bg-card/90 backdrop-blur-sm text-foreground text-xs font-medium px-2.5 py-0.5 rounded-full border border-border">
            <Weight size={10} />
            {product.weight}
          </span>
        </div>
        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
            <span className="bg-card text-foreground text-sm font-semibold px-4 py-2 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Star rating */}
        <StarRating category={product.category} />

        {/* Product name */}
        <h3 className="font-display text-lg font-semibold leading-snug text-card-foreground group-hover:text-primary transition-colors duration-200">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-2">
          {product.description}
        </p>

        {/* Price + CTA — stacked for clear hierarchy */}
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold text-primary tracking-tight">
              {formatINR(product.price)}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              / {product.weight}
            </span>
          </div>

          {product.inStock ? (
            <Button
              data-ocid={`products.add_button.${index}`}
              onClick={() => onAddToCart(product.id)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:outline-none rounded-xl font-semibold gap-2 transition-all duration-150"
            >
              <ShoppingCart size={15} />
              Add to Cart
            </Button>
          ) : (
            <Badge
              variant="secondary"
              className="w-full justify-center py-1.5 text-xs text-muted-foreground bg-muted"
            >
              Out of Stock
            </Badge>
          )}
        </div>
      </div>
    </motion.article>
  );
}
