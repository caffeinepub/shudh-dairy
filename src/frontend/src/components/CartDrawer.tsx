import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

export type CartItem = {
  productId: number;
  quantity: number;
};

export type DairyProduct = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: "Ghee" | "Paneer" | "Combo";
  weight: string;
  inStock: boolean;
  image: string;
};

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  products: DairyProduct[];
  onUpdateQuantity: (productId: number, delta: number) => void;
  onRemove: (productId: number) => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  products,
  onUpdateQuantity,
  onRemove,
}: CartDrawerProps) {
  const cartDetails = cartItems
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      return { ...item, product };
    })
    .filter(Boolean) as (CartItem & { product: DairyProduct })[];

  const total = cartDetails.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const formatINR = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            data-ocid="cart.panel"
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-card shadow-2xl z-50 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-accent/30">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-primary" size={20} />
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Your Cart
                </h2>
                {cartItems.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItems.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </div>
              <Button
                data-ocid="cart.close_button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full hover:bg-accent"
                aria-label="Close cart"
              >
                <X size={18} />
              </Button>
            </div>

            {/* Content */}
            {cartDetails.length === 0 ? (
              <div
                data-ocid="cart.empty_state"
                className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
                  <ShoppingBag className="text-primary" size={32} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                    Your cart is empty
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add some pure ghee or fresh paneer to get started!
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 px-4 py-3">
                  <ul className="flex flex-col gap-3">
                    {cartDetails.map((item, idx) => (
                      <motion.li
                        key={item.productId}
                        data-ocid={`cart.item.${idx + 1}`}
                        className="flex gap-3 bg-background rounded-xl p-3 border border-border"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2, delay: idx * 0.04 }}
                        layout
                      >
                        {/* Product image */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-border">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground leading-tight truncate">
                                {item.product.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.product.weight}
                              </p>
                            </div>
                            <button
                              type="button"
                              data-ocid={`cart.delete_button.${idx + 1}`}
                              onClick={() => onRemove(item.productId)}
                              className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
                              aria-label={`Remove ${item.product.name}`}
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            {/* Quantity controls */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                data-ocid={`cart.quantity_minus.${idx + 1}`}
                                onClick={() =>
                                  onUpdateQuantity(item.productId, -1)
                                }
                                className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="text-sm font-semibold w-5 text-center text-foreground">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                data-ocid={`cart.quantity_plus.${idx + 1}`}
                                onClick={() =>
                                  onUpdateQuantity(item.productId, 1)
                                }
                                className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus size={11} />
                              </button>
                            </div>

                            {/* Subtotal */}
                            <span className="text-sm font-bold text-primary font-display">
                              {formatINR(item.product.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </ScrollArea>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-border bg-accent/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">
                      Subtotal
                    </span>
                    <span className="font-display text-xl font-bold text-foreground">
                      {formatINR(total)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Shipping & taxes calculated at checkout
                  </p>

                  <Separator className="mb-4" />

                  <Button
                    data-ocid="cart.submit_button"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base h-12 rounded-xl shadow-md"
                    onClick={() =>
                      toast.success("Checkout coming soon!", {
                        description:
                          "We're working on it — your cart is saved!",
                      })
                    }
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
