import type { backendInterface } from "@/backend.d";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { saveOrder } from "@/utils/orderStorage";
import {
  CheckCircle2,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

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
  onOrderPlaced?: (orderId: number) => void;
  actor?: backendInterface | null;
}

type CheckoutStep = "cart" | "form" | "confirmation";

type CheckoutForm = {
  name: string;
  phone: string;
  address: string;
};

type FormErrors = Partial<CheckoutForm>;

export function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  products,
  onUpdateQuantity,
  onRemove,
  onOrderPlaced,
  actor,
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

  // ── Checkout state ─────────────────────────────────────────────────────────
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("form");
  const [form, setForm] = useState<CheckoutForm>({
    name: "",
    phone: "",
    address: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCheckout = () => {
    setCheckoutStep("form");
    setForm({ name: "", phone: "", address: "" });
    setFormErrors({});
    setPlacedOrderId(null);
    setCheckoutOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      errors.phone = "Enter a valid 10-digit phone number";
    }
    if (!form.address.trim()) errors.address = "Delivery address is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const orderItems = cartDetails.map((item) => ({
        productId: BigInt(item.productId),
        productName: item.product.name,
        productWeight: item.product.weight,
        quantity: BigInt(item.quantity),
        price: item.product.price,
      }));

      let displayOrderId: number;

      if (actor) {
        try {
          const backendOrderId = await actor.placeOrder(
            form.name.trim(),
            form.phone.trim(),
            form.address.trim(),
            orderItems,
            total,
          );
          displayOrderId = Number(backendOrderId);
          // Also save locally so customer can track from same browser
          saveOrder({
            customerName: form.name.trim(),
            customerPhone: form.phone.trim(),
            customerAddress: form.address.trim(),
            items: cartDetails.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productWeight: item.product.weight,
              quantity: item.quantity,
              price: item.product.price,
            })),
            total,
          });
        } catch {
          // Fall back to local storage only if backend call fails
          const localOrder = saveOrder({
            customerName: form.name.trim(),
            customerPhone: form.phone.trim(),
            customerAddress: form.address.trim(),
            items: cartDetails.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productWeight: item.product.weight,
              quantity: item.quantity,
              price: item.product.price,
            })),
            total,
          });
          displayOrderId = localOrder.id;
        }
      } else {
        // No actor available — use local storage as fallback
        const localOrder = saveOrder({
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          customerAddress: form.address.trim(),
          items: cartDetails.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            productWeight: item.product.weight,
            quantity: item.quantity,
            price: item.product.price,
          })),
          total,
        });
        displayOrderId = localOrder.id;
      }

      setPlacedOrderId(displayOrderId);
      setCheckoutStep("confirmation");
      onOrderPlaced?.(displayOrderId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueShopping = () => {
    setCheckoutOpen(false);
    onClose();
  };

  // ── WhatsApp order ─────────────────────────────────────────────────────────
  const handleWhatsAppOrder = () => {
    const itemLines = cartDetails
      .map(
        (item) =>
          `${item.quantity} x ${item.product.name} ${item.product.weight} - ${formatINR(item.product.price * item.quantity)}`,
      )
      .join("\n");

    const message = `Hello SUNRISE MILK AND AGRO PRODUCT'S,\nI would like to order:\n\n${itemLines}\n\nTotal: ${formatINR(total)}\n\nPlease confirm my order.`;

    const url = `https://wa.me/918875759738?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
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

                    {/* Proceed to Checkout */}
                    <Button
                      data-ocid="cart.checkout_button"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base h-12 rounded-xl shadow-md mb-3"
                      onClick={openCheckout}
                    >
                      Proceed to Checkout
                    </Button>

                    {/* WhatsApp Order */}
                    <Button
                      data-ocid="cart.whatsapp_button"
                      className="w-full h-11 rounded-xl font-semibold text-sm text-white border-0"
                      style={{ backgroundColor: "#25D366" }}
                      onClick={handleWhatsAppOrder}
                    >
                      <MessageCircle size={16} className="mr-2 shrink-0" />
                      Order via WhatsApp
                    </Button>
                  </div>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── CHECKOUT DIALOG ─────────────────────────────────────────────────── */}
      <Dialog
        open={checkoutOpen}
        onOpenChange={(open) => {
          if (!isSubmitting) setCheckoutOpen(open);
        }}
      >
        <DialogContent
          data-ocid="cart.checkout.modal"
          className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        >
          {checkoutStep === "form" ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-bold text-foreground">
                  Complete Your Order
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Fill in your details and we'll confirm your order shortly.
                </p>
              </DialogHeader>

              {/* Order summary */}
              <div className="bg-accent/30 rounded-xl p-4 space-y-2 mt-1">
                {cartDetails.map((item) => (
                  <div
                    key={item.productId}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-foreground font-medium">
                      {item.quantity} × {item.product.name}{" "}
                      <span className="text-muted-foreground font-normal">
                        {item.product.weight}
                      </span>
                    </span>
                    <span className="text-primary font-semibold font-display">
                      {formatINR(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
                <Separator className="my-1" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground text-sm">
                    Total
                  </span>
                  <span className="font-display text-lg font-bold text-primary">
                    {formatINR(total)}
                  </span>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4 py-1">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="checkout-name"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Full Name *
                  </Label>
                  <Input
                    id="checkout-name"
                    data-ocid="cart.checkout.name_input"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Your full name"
                    disabled={isSubmitting}
                    autoComplete="name"
                    aria-describedby={
                      formErrors.name ? "checkout-name-err" : undefined
                    }
                  />
                  {formErrors.name && (
                    <p
                      id="checkout-name-err"
                      className="text-xs text-destructive"
                    >
                      {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="checkout-phone"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Phone Number *
                  </Label>
                  <Input
                    id="checkout-phone"
                    data-ocid="cart.checkout.phone_input"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="10-digit mobile number"
                    type="tel"
                    maxLength={10}
                    disabled={isSubmitting}
                    autoComplete="tel"
                    aria-describedby={
                      formErrors.phone ? "checkout-phone-err" : undefined
                    }
                  />
                  {formErrors.phone && (
                    <p
                      id="checkout-phone-err"
                      className="text-xs text-destructive"
                    >
                      {formErrors.phone}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="checkout-address"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Delivery Address *
                  </Label>
                  <Textarea
                    id="checkout-address"
                    data-ocid="cart.checkout.address_input"
                    value={form.address}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, address: e.target.value }))
                    }
                    placeholder="House no., street, area, city, PIN code"
                    rows={3}
                    disabled={isSubmitting}
                    autoComplete="street-address"
                    className="resize-none"
                    aria-describedby={
                      formErrors.address ? "checkout-address-err" : undefined
                    }
                  />
                  {formErrors.address && (
                    <p
                      id="checkout-address-err"
                      className="text-xs text-destructive"
                    >
                      {formErrors.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCheckoutOpen(false)}
                  disabled={isSubmitting}
                >
                  Back to Cart
                </Button>
                <Button
                  data-ocid="cart.checkout.submit_button"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Placing…" : "Place Order"}
                </Button>
              </div>
            </>
          ) : (
            /* ── ORDER CONFIRMATION ──────────────────────────────────────── */
            <div
              data-ocid="cart.checkout.confirmation"
              className="text-center py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5"
              >
                <CheckCircle2 size={34} className="text-green-600" />
              </motion.div>

              <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                Order Placed!
              </h2>
              <p className="text-muted-foreground text-sm mb-1">
                Thank you, {form.name}!
              </p>
              {placedOrderId && (
                <p className="text-xs text-muted-foreground mb-5">
                  Order #{placedOrderId}
                </p>
              )}

              {/* Items summary */}
              <div className="bg-accent/30 rounded-xl p-4 text-left space-y-2 mb-4">
                {cartDetails.map((item) => (
                  <div
                    key={item.productId}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-foreground">
                      {item.quantity} × {item.product.name}{" "}
                      <span className="text-muted-foreground">
                        {item.product.weight}
                      </span>
                    </span>
                    <span className="text-primary font-semibold font-display">
                      {formatINR(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground text-sm">
                    Total
                  </span>
                  <span className="font-display text-lg font-bold text-primary">
                    {formatINR(total)}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                We will call you on{" "}
                <strong className="text-foreground">{form.phone}</strong> to
                confirm your order and delivery details.
              </p>

              <Button
                data-ocid="cart.checkout.continue_button"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-12 rounded-xl"
                onClick={handleContinueShopping}
              >
                Continue Shopping
              </Button>

              <a
                href="/track-order"
                data-ocid="cart.checkout.track_order_link"
                className="mt-3 w-full h-10 rounded-xl border border-border flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Track Your Order
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
