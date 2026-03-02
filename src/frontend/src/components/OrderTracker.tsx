import type { Order as BackendOrder } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActor } from "@/hooks/useActor";
import { getLogoUrl } from "@/utils/storeCustomization";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Package,
  Search,
  Truck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

// ── Local display type ────────────────────────────────────────────────────────

type OrderItemDisplay = {
  productId: number;
  productName: string;
  productWeight: string;
  quantity: number;
  price: number;
};

type Order = {
  id: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItemDisplay[];
  total: number;
  status: "Pending" | "Confirmed" | "Delivered";
  timestamp: number;
};

function mapBackendOrder(o: BackendOrder): Order {
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Progress step definitions ─────────────────────────────────────────────────

type StepKey = "placed" | "confirmed" | "delivered";

const STEPS: { key: StepKey; label: string; icon: typeof Clock }[] = [
  { key: "placed", label: "Order Placed", icon: Package },
  { key: "confirmed", label: "Confirmed", icon: Clock },
  { key: "delivered", label: "Delivered", icon: Truck },
];

function getStepStatus(
  stepKey: StepKey,
  orderStatus: Order["status"],
): "complete" | "active" | "pending" {
  if (stepKey === "placed") return "complete";
  if (stepKey === "confirmed") {
    if (orderStatus === "Delivered") return "complete";
    if (orderStatus === "Confirmed") return "active";
    return "pending";
  }
  // delivered
  if (orderStatus === "Delivered") return "active";
  return "pending";
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Order["status"] }) {
  const styles: Record<Order["status"], string> = {
    Pending:
      "bg-amber-50 text-amber-700 border border-amber-200 ring-1 ring-amber-100",
    Confirmed:
      "bg-blue-50 text-blue-700 border border-blue-200 ring-1 ring-blue-100",
    Delivered:
      "bg-green-50 text-green-700 border border-green-200 ring-1 ring-green-100",
  };
  const dots: Record<Order["status"], string> = {
    Pending: "bg-amber-500",
    Confirmed: "bg-blue-500",
    Delivered: "bg-green-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {status}
    </span>
  );
}

// ── Shipping progress tracker ─────────────────────────────────────────────────

function ShippingProgress({ status }: { status: Order["status"] }) {
  return (
    <div className="relative flex items-start justify-between mt-4">
      {/* Connecting lines */}
      <div className="absolute top-4 left-[calc(16.67%)] right-[calc(16.67%)] h-0.5 z-0">
        <div className="relative h-full">
          {/* Base line */}
          <div className="absolute inset-0 bg-border rounded-full" />
          {/* Progress fill */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: "oklch(var(--primary))" }}
            initial={{ width: "0%" }}
            animate={{
              width:
                status === "Delivered"
                  ? "100%"
                  : status === "Confirmed"
                    ? "50%"
                    : "0%",
            }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </div>

      {STEPS.map((step, i) => {
        const stepStatus = getStepStatus(step.key, status);
        const Icon = step.icon;
        return (
          <motion.div
            key={step.key}
            className="relative z-10 flex flex-col items-center gap-2 flex-1"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.12 }}
          >
            {/* Circle */}
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                stepStatus === "complete"
                  ? "border-primary bg-primary"
                  : stepStatus === "active"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
              }`}
              whileInView={{ scale: [0.85, 1.08, 1] }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.2 + i * 0.12 }}
            >
              {stepStatus === "complete" ? (
                <CheckCircle2
                  size={16}
                  className="text-primary-foreground"
                  strokeWidth={2.5}
                />
              ) : stepStatus === "active" ? (
                <Icon size={14} className="text-primary" strokeWidth={2.5} />
              ) : (
                <Circle
                  size={14}
                  className="text-muted-foreground/40"
                  strokeWidth={2}
                />
              )}
            </motion.div>
            {/* Label */}
            <span
              className={`text-[11px] font-semibold text-center leading-tight max-w-[64px] ${
                stepStatus === "complete" || stepStatus === "active"
                  ? "text-foreground"
                  : "text-muted-foreground/60"
              }`}
            >
              {step.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Order card ─────────────────────────────────────────────────────────────────

function OrderCard({ order, index }: { order: Order; index: number }) {
  return (
    <motion.div
      data-ocid={`track.result.item.${index}`}
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      {/* Card header */}
      <div className="px-5 py-4 border-b border-border bg-accent/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-bold text-foreground">
              Order #{order.id}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Placed on {formatDate(order.timestamp)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-bold text-primary">
            {formatINR(order.total)}
          </p>
          <p className="text-xs text-muted-foreground">
            {order.items.reduce((s, i) => s + i.quantity, 0)} item
            {order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Items list */}
      <div className="px-5 py-4">
        <ul className="space-y-2 mb-4">
          {order.items.map((item) => (
            <li
              key={`${item.productId}-${item.productWeight}`}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                  {item.quantity}×
                </span>
                <span className="text-foreground font-medium truncate">
                  {item.productName}
                </span>
                <span className="text-muted-foreground text-xs shrink-0">
                  {item.productWeight}
                </span>
              </div>
              <span className="text-primary font-semibold font-display ml-3 shrink-0">
                {formatINR(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        {/* Delivery info */}
        <div className="text-xs text-muted-foreground bg-accent/30 rounded-xl px-3 py-2 mb-2">
          <span className="font-semibold text-foreground">Deliver to:</span>{" "}
          {order.customerAddress}
        </div>

        {/* Shipping progress */}
        <ShippingProgress status={order.status} />
      </div>
    </motion.div>
  );
}

// ── Main OrderTracker page ────────────────────────────────────────────────────

export function OrderTracker() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Order[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const logoUrl = getLogoUrl();
  const { actor } = useActor();

  const handleTrack = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    try {
      if (actor) {
        // Numeric query = order ID lookup, else phone lookup
        const isNumericId = /^\d+$/.test(trimmed) && trimmed.length <= 10;
        if (isNumericId) {
          // Search by ID: fetch all orders and filter client-side
          const allOrders = await actor.getAllOrders();
          const targetId = Number(trimmed);
          const found = allOrders
            .map(mapBackendOrder)
            .filter((o) => o.id === targetId);
          setResults(found);
        } else {
          // Search by phone
          const backendOrders = await actor.getOrdersByPhone(trimmed);
          setResults(backendOrders.map(mapBackendOrder));
        }
      } else {
        // Actor not ready — show empty
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void handleTrack();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo + name */}
          <a
            href="/"
            data-ocid="track.store_link"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Store Logo"
                className="h-9 w-auto object-contain rounded-lg shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-base font-bold shadow-sm shrink-0">
                🐄
              </div>
            )}
            <div>
              <h1 className="font-display text-lg font-bold text-foreground leading-none tracking-tight">
                SUNRISE MILK AND AGRO PRODUCT'S
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pure | Fresh | Delivered
              </p>
            </div>
          </a>

          {/* Back to Store */}
          <a
            href="/"
            data-ocid="track.back_link"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md px-1"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Back to Store</span>
          </a>
        </div>
      </header>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero section */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: "backOut" }}
          >
            <Truck size={26} className="text-primary" />
          </motion.div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
            My Orders &amp; Tracking
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-sm mx-auto">
            Enter your phone number to see all your orders, or enter an order ID
            to track a specific delivery.
          </p>
        </motion.div>

        {/* Search card */}
        <motion.div
          className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <label
            htmlFor="track-query"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
          >
            Phone Number or Order ID
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                size={15}
              />
              <Input
                id="track-query"
                data-ocid="track.phone_input"
                type="text"
                inputMode="numeric"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 8875759738 or 1001"
                maxLength={15}
                autoComplete="tel"
                className="pl-9 rounded-xl border-border bg-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 h-11"
              />
            </div>
            <Button
              data-ocid="track.submit_button"
              onClick={() => {
                void handleTrack();
              }}
              disabled={!query.trim() || isSearching}
              className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 font-semibold rounded-xl h-11 px-5 transition-all duration-150 shadow-sm disabled:opacity-50"
            >
              {isSearching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Track"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/70 mt-2.5">
            Use the 10-digit mobile number you provided at checkout, or your
            order ID number (e.g. 1001).
          </p>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {hasSearched &&
            results !== null &&
            (results.length === 0 ? (
              <motion.div
                key="empty"
                data-ocid="track.empty_state"
                className="text-center py-16"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                  <Package size={28} className="text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  No orders found
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  We couldn't find any orders matching{" "}
                  <strong className="text-foreground">{query}</strong>. Please
                  check and try again.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                className="space-y-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-sm text-muted-foreground font-medium">
                  {results.length === 1
                    ? "1 order found"
                    : `${results.length} orders found`}
                </p>
                {results.map((order, i) => (
                  <OrderCard key={order.id} order={order} index={i + 1} />
                ))}
              </motion.div>
            ))}
        </AnimatePresence>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            © {new Date().getFullYear()} SUNRISE MILK AND AGRO PRODUCT'S. Built
            with{" "}
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
          <a
            href="/"
            data-ocid="track.footer_store_link"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={13} />
            Back to Store
          </a>
        </div>
      </footer>
    </div>
  );
}
