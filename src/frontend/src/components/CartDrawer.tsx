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
import { getUpiQr } from "@/utils/storeCustomization";
import {
  CheckCircle2,
  Copy,
  MessageCircle,
  Minus,
  Plus,
  QrCode,
  ShoppingBag,
  Truck,
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
  actor?: any;
}

type CheckoutStep = "cart" | "form" | "payment" | "confirmation";
type PaymentMethod = "cod" | "prepaid";

type CheckoutForm = {
  name: string;
  phone: string;
  address: string;
};

type FormErrors = Partial<CheckoutForm>;

// ── ConfirmationStep subcomponent ───────────────────────────────────────────

type ConfirmationStepProps = {
  form: CheckoutForm;
  placedOrderId: number | null;
  cartDetails: (CartItem & { product: DairyProduct })[];
  total: number;
  formatINR: (amount: number) => string;
  onContinueShopping: () => void;
  upiQrUrl?: string;
  paymentMethod: PaymentMethod;
};

function ConfirmationStep({
  form,
  placedOrderId,
  cartDetails,
  total,
  formatINR,
  onContinueShopping,
  paymentMethod,
}: ConfirmationStepProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (!placedOrderId) return;
    navigator.clipboard.writeText(String(placedOrderId)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div data-ocid="cart.checkout.confirmation" className="text-center py-4">
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
      <p className="text-muted-foreground text-sm mb-3">
        Thank you, {form.name}!
      </p>

      {/* Payment method badge */}
      <div className="flex justify-center mb-4">
        {paymentMethod === "prepaid" ? (
          <span className="inline-flex items-center gap-1.5 bg-green-100 border border-green-300 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full">
            <CheckCircle2 size={13} />
            Payment Confirmed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full">
            <Truck size={13} />
            Cash on Delivery
          </span>
        )}
      </div>

      {/* Prominent Tracking ID */}
      {placedOrderId && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="flex items-center justify-center gap-2 mb-3"
        >
          <span className="inline-flex items-center gap-2 bg-primary/10 border-2 border-primary/30 text-primary font-display text-xl font-bold px-5 py-2.5 rounded-2xl tracking-wide">
            ORDER #{placedOrderId}
          </span>
          <button
            type="button"
            data-ocid="cart.checkout.copy_order_id_button"
            onClick={handleCopyId}
            title="Copy order ID"
            aria-label="Copy order ID"
            className="w-9 h-9 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            {copied ? (
              <CheckCircle2 size={15} className="text-green-600" />
            ) : (
              <Copy size={15} />
            )}
          </button>
        </motion.div>
      )}
      {placedOrderId && (
        <p className="text-xs text-muted-foreground mb-1">
          {copied
            ? "✓ Copied to clipboard!"
            : "Use this ID to track your order"}
        </p>
      )}

      {/* Estimated delivery info box */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 mb-5 text-left"
      >
        <Truck size={18} className="text-emerald-600 shrink-0" />
        <p className="text-sm font-medium leading-snug">
          Expected delivery in{" "}
          <span className="font-bold">2–3 business days</span>
        </p>
      </motion.div>

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
          <span className="font-bold text-foreground text-sm">Total</span>
          <span className="font-display text-lg font-bold text-primary">
            {formatINR(total)}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        We will call you on{" "}
        <strong className="text-foreground">{form.phone}</strong> to confirm
        your order and delivery details.
      </p>

      <Button
        data-ocid="cart.checkout.continue_button"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-12 rounded-xl"
        onClick={onContinueShopping}
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
  );
}

// ── CartDrawer ───────────────────────────────────────────────────────────────

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [form, setForm] = useState<CheckoutForm>({
    name: "",
    phone: "",
    address: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);
  const [upiQrUrl] = useState<string>(() => getUpiQr());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  const openCheckout = () => {
    setCheckoutStep("form");
    setPaymentMethod("cod");
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
      onOrderPlaced?.(displayOrderId);

      if (paymentMethod === "prepaid") {
        setCheckoutStep("payment");
      } else {
        setCheckoutStep("confirmation");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentConfirmed = async () => {
    setIsConfirmingPayment(true);
    try {
      if (actor && placedOrderId) {
        await actor.updateOrderStatus("", BigInt(placedOrderId), "Confirmed");
      }
    } catch {
      // ignore errors — still proceed to confirmation
    } finally {
      setIsConfirmingPayment(false);
      setCheckoutStep("confirmation");
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
          if (!isSubmitting && !isConfirmingPayment) setCheckoutOpen(open);
        }}
      >
        <DialogContent
          data-ocid="cart.checkout.modal"
          className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        >
          {checkoutStep === "form" && (
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

                {/* Payment Method Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Payment Method *
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Cash on Delivery */}
                    <button
                      type="button"
                      data-ocid="cart.checkout.cod_toggle"
                      onClick={() => setPaymentMethod("cod")}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                        paymentMethod === "cod"
                          ? "border-primary bg-primary/8 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          paymentMethod === "cod"
                            ? "bg-primary/15"
                            : "bg-accent"
                        }`}
                      >
                        <Truck
                          size={18}
                          className={
                            paymentMethod === "cod"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }
                        />
                      </div>
                      <div className="text-center">
                        <p
                          className={`text-xs font-bold leading-tight ${
                            paymentMethod === "cod"
                              ? "text-primary"
                              : "text-foreground"
                          }`}
                        >
                          Cash on Delivery
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                          Pay when delivered
                        </p>
                      </div>
                      {paymentMethod === "cod" && (
                        <CheckCircle2 size={14} className="text-primary" />
                      )}
                    </button>

                    {/* Prepaid / UPI */}
                    <button
                      type="button"
                      data-ocid="cart.checkout.prepaid_toggle"
                      onClick={() => setPaymentMethod("prepaid")}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                        paymentMethod === "prepaid"
                          ? "border-primary bg-primary/8 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          paymentMethod === "prepaid"
                            ? "bg-primary/15"
                            : "bg-accent"
                        }`}
                      >
                        <QrCode
                          size={18}
                          className={
                            paymentMethod === "prepaid"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }
                        />
                      </div>
                      <div className="text-center">
                        <p
                          className={`text-xs font-bold leading-tight ${
                            paymentMethod === "prepaid"
                              ? "text-primary"
                              : "text-foreground"
                          }`}
                        >
                          Prepaid / UPI
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                          Pay now via UPI
                        </p>
                      </div>
                      {paymentMethod === "prepaid" && (
                        <CheckCircle2 size={14} className="text-primary" />
                      )}
                    </button>
                  </div>
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
          )}

          {checkoutStep === "payment" && (
            /* ── UPI PAYMENT STEP ──────────────────────────────────────────── */
            <div data-ocid="cart.checkout.panel" className="py-2">
              <DialogHeader className="mb-4">
                <DialogTitle className="font-display text-xl font-bold text-foreground">
                  Complete Your Payment
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Scan the QR code below using any UPI app to pay.
                </p>
              </DialogHeader>

              {/* Order info strip */}
              <div className="flex items-center justify-between bg-accent/40 rounded-xl px-4 py-3 mb-5">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Order
                  </p>
                  <p className="font-display font-bold text-foreground text-sm">
                    #{placedOrderId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Amount
                  </p>
                  <p className="font-display font-bold text-primary text-lg">
                    {formatINR(total)}
                  </p>
                </div>
              </div>

              {/* QR Code area */}
              {upiQrUrl ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center bg-white border-2 border-amber-200 rounded-2xl p-5 mb-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📱</span>
                    <p className="font-semibold text-amber-900 text-sm">
                      Scan & Pay via UPI
                    </p>
                  </div>
                  <img
                    src={upiQrUrl}
                    alt="UPI QR Code"
                    className="max-w-[200px] w-full rounded-xl border border-amber-100"
                  />
                  <p className="text-xs text-amber-700 mt-3 text-center">
                    Google Pay · PhonePe · Paytm · Any UPI App
                  </p>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center bg-accent/30 border-2 border-dashed border-border rounded-2xl p-8 mb-5 text-center">
                  <QrCode size={40} className="text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    Please scan our UPI QR code to pay
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Our team will share the QR code via call to confirm payment
                  </p>
                </div>
              )}

              {/* Primary CTA */}
              <Button
                data-ocid="cart.checkout.confirm_button"
                className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-base mb-3 shadow-md"
                onClick={handlePaymentConfirmed}
                disabled={isConfirmingPayment}
              >
                {isConfirmingPayment ? (
                  "Confirming…"
                ) : (
                  <>
                    <CheckCircle2 size={18} className="mr-2" />I Have Paid ✓
                  </>
                )}
              </Button>

              {/* Secondary fallback */}
              <button
                type="button"
                data-ocid="cart.checkout.cancel_button"
                onClick={() => setCheckoutStep("confirmation")}
                disabled={isConfirmingPayment}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-lg"
              >
                Pay Later (Cash on Delivery)
              </button>
            </div>
          )}

          {checkoutStep === "confirmation" && (
            /* ── ORDER CONFIRMATION ──────────────────────────────────────── */
            <ConfirmationStep
              form={form}
              placedOrderId={placedOrderId}
              cartDetails={cartDetails}
              total={total}
              formatINR={formatINR}
              onContinueShopping={handleContinueShopping}
              upiQrUrl={upiQrUrl}
              paymentMethod={paymentMethod}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
