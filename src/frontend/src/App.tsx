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

// ── Root route ───────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => <Outlet />,
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
    const token = localStorage.getItem("adminToken");
    if (!token) {
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
