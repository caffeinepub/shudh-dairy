import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createActorWithConfig } from "@/config";
import { useActor } from "@/hooks/useActor";
import { useNavigate } from "@tanstack/react-router";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  RefreshCw,
  User,
  Wifi,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export function AdminLogin() {
  const navigate = useNavigate();
  const { actor } = useActor();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const performLogin = async (
    currentActor: NonNullable<typeof actor>,
    user: string,
    pass: string,
  ) => {
    setIsLoading(true);
    setError("");
    try {
      const success = await currentActor.adminLogin(user, pass);
      if (success) {
        const token = `admin_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminUser", user);
        navigate({ to: "/admin/dashboard" });
      } else {
        setError(
          "Invalid credentials. Please check your username and password.",
        );
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setError("");

    if (actor) {
      // Actor already available — log in immediately
      await performLogin(actor, username, password);
      return;
    }

    // Actor not ready — try to create it directly with a 20-second timeout
    setIsConnecting(true);
    try {
      const actorPromise = createActorWithConfig();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 20_000),
      );

      const freshActor = await Promise.race([actorPromise, timeoutPromise]);
      setIsConnecting(false);
      await performLogin(freshActor, username, password);
    } catch (err) {
      setIsConnecting(false);
      const isTimeout = err instanceof Error && err.message === "timeout";
      setError(
        isTimeout
          ? "Server is taking too long to respond — please refresh the page and try again."
          : "Could not connect to the server. Please refresh the page and try again.",
      );
    }
  };

  const busy = isLoading || isConnecting;

  return (
    <div className="admin-login-bg min-h-screen flex items-center justify-center px-4">
      {/* Background decoration */}
      <div
        className="admin-login-grid-bg absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />

      <motion.div
        className="w-full max-w-lg relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Card */}
        <div className="admin-card rounded-2xl overflow-hidden shadow-2xl">
          {/* Header strip */}
          <div className="admin-card-header px-8 pt-8 pb-6 text-center">
            <motion.div
              className="w-16 h-16 admin-icon-ring admin-icon-glow rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.15,
                duration: 0.4,
                type: "spring",
                stiffness: 300,
              }}
            >
              🐄
            </motion.div>
            <h1 className="admin-heading text-2xl font-bold mb-1">
              SUNRISE MILK AND AGRO PRODUCT'S
            </h1>
            <p className="admin-sub text-sm font-medium tracking-widest uppercase">
              Admin Portal
            </p>
          </div>

          {/* Connecting banner */}
          {isConnecting && (
            <motion.div
              data-ocid="admin.login.loading_state"
              className="mx-8 mb-2 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Loader2 size={14} className="animate-spin shrink-0" />
              <span>Connecting to server, please wait…</span>
            </motion.div>
          )}

          {/* Ready notice when actor is available */}
          {!isConnecting && actor && (
            <motion.div
              className="mx-8 mb-2 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Wifi size={14} className="shrink-0" />
              <span>Ready — enter your credentials to sign in.</span>
            </motion.div>
          )}

          {/* Form */}
          <div className="px-8 pb-8 pt-2">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Username */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="admin-username"
                  className="admin-label text-xs font-semibold tracking-wider uppercase"
                >
                  Username
                </Label>
                <div className="relative">
                  <User
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 admin-input-icon"
                    size={15}
                  />
                  <Input
                    id="admin-username"
                    data-ocid="admin.login.input"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    disabled={busy}
                    className="admin-input pl-10"
                    aria-describedby={error ? "admin-error" : undefined}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="admin-password"
                  className="admin-label text-xs font-semibold tracking-wider uppercase"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 admin-input-icon"
                    size={15}
                  />
                  <Input
                    id="admin-password"
                    data-ocid="admin.password.input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={busy}
                    className="admin-input pl-10 pr-10"
                    aria-describedby={error ? "admin-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 admin-input-icon hover:opacity-80 transition-opacity"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  id="admin-error"
                  data-ocid="admin.login.error_state"
                  role="alert"
                  className="admin-error rounded-lg px-4 py-3 text-sm"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <p>{error}</p>
                  {(error.toLowerCase().includes("refresh") ||
                    error.toLowerCase().includes("starting up")) && (
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold underline underline-offset-2 hover:no-underline"
                    >
                      <RefreshCw size={12} />
                      Refresh page
                    </button>
                  )}
                </motion.div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                data-ocid="admin.login.submit_button"
                disabled={busy}
                className="admin-submit-btn w-full h-11 font-semibold text-sm rounded-xl mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting…
                  </>
                ) : (
                  "Sign In to Admin Panel"
                )}
              </Button>
            </form>

            {/* Subtle hint for owner */}
            <div className="mt-6 pt-5 border-t admin-hint-divider">
              <p className="text-center text-xs admin-hint">
                Default login:{" "}
                <code className="admin-hint-code px-1.5 py-0.5 rounded font-mono">
                  admin
                </code>{" "}
                /{" "}
                <code className="admin-hint-code px-1.5 py-0.5 rounded font-mono">
                  sunrise2024
                </code>
              </p>
            </div>
          </div>
        </div>

        {/* Back to store */}
        <motion.div
          className="text-center mt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <a
            href="/"
            data-ocid="admin.login.link"
            className="admin-back-link text-sm hover:underline underline-offset-2 transition-opacity hover:opacity-80"
          >
            ← Back to Store
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
