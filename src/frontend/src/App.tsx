import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminLogin } from "./components/AdminLogin";
import { OrderTracker } from "./components/OrderTracker";
import { StorePage } from "./components/StorePage";

// ── Error component ───────────────────────────────────────────────────────────
function AppErrorComponent({ error }: { error: unknown }) {
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";
  return (
    <div
      data-ocid="app.error_state"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "#fffbf5",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          textAlign: "center",
          background: "#fff",
          border: "1px solid #f0e8d8",
          borderRadius: 16,
          padding: "2.5rem 2rem",
          boxShadow: "0 4px 24px rgba(180,120,40,0.08)",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🐄</div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#7c3b0a",
            marginBottom: 8,
          }}
        >
          Something went wrong
        </h2>
        <p style={{ color: "#a06030", fontSize: 14, marginBottom: 24 }}>
          {message}
        </p>
        <button
          type="button"
          data-ocid="app.primary_button"
          onClick={() => window.location.reload()}
          style={{
            background: "#c97d2a",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "0.65rem 1.5rem",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

// ── Root route ───────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => <Outlet />,
  errorComponent: AppErrorComponent,
});

// ── Store (public) ────────────────────────────────────────────────────────────
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: StorePage,
});

// ── Admin login ───────────────────────────────────────────────────────────────
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminLogin,
});

// ── Admin dashboard (protected) ───────────────────────────────────────────────
const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/dashboard",
  beforeLoad: () => {
    const token = sessionStorage.getItem("adminToken");
    if (!token) {
      throw redirect({ to: "/admin" });
    }
    // Check session expiry (8 hours)
    const expiry = sessionStorage.getItem("adminSessionExpiry");
    if (expiry && Date.now() > Number(expiry)) {
      sessionStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminUser");
      sessionStorage.removeItem("adminSessionExpiry");
      throw redirect({ to: "/admin" });
    }
  },
  component: AdminDashboard,
});

// ── Order Tracker ─────────────────────────────────────────────────────────────
const trackOrderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/track-order",
  component: OrderTracker,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  adminRoute,
  adminDashboardRoute,
  trackOrderRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
