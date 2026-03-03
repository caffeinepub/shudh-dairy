import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  ClipboardCopy,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type LoginStep = "credentials" | "otp";

interface OtpData {
  code: string;
  expiresAt: number; // timestamp ms
}

export function AdminLogin() {
  const navigate = useNavigate();

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<LoginStep>("credentials");

  // ── Step 1: credentials ─────────────────────────────────────────────────────
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [credError, setCredError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // ── Step 2: OTP (in-memory only, never persisted) ───────────────────────────
  const otpRef = useRef<OtpData | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 min
  const [displayOtp, setDisplayOtp] = useState(""); // only shown in UI
  const otpInputRef = useRef<HTMLInputElement>(null);
  const MAX_ATTEMPTS = 3;

  // ── Countdown timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "otp") return;
    setSecondsLeft(300);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ── Step 1: Submit credentials ──────────────────────────────────────────────
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setCredError("Please enter both username and password.");
      return;
    }
    setIsVerifying(true);
    setCredError("");

    try {
      // Check credentials locally — instant, no server dependency
      const storedPwd = localStorage.getItem("adminPassword") || "sunrise2024";
      const valid =
        username.trim() === "admin" && password.trim() === storedPwd;

      if (!valid) {
        setCredError("Invalid username or password.");
        setIsVerifying(false);
        return;
      }

      // Credentials valid — generate OTP in memory only
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      otpRef.current = { code, expiresAt };
      setDisplayOtp(code);
      setOtpInput("");
      setOtpError("");
      setAttempts(0);
      setStep("otp");
      setTimeout(() => otpInputRef.current?.focus(), 200);
    } catch {
      setCredError("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const verifyOtp = (value: string) => {
    const otp = otpRef.current;
    if (!otp) {
      backToLogin();
      return;
    }

    // Check expiry
    if (Date.now() > otp.expiresAt || secondsLeft === 0) {
      setOtpError("OTP expired. Please login again.");
      otpRef.current = null;
      setTimeout(backToLogin, 1500);
      return;
    }

    if (value !== otp.code) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setOtpError("Too many incorrect attempts. Please login again.");
        otpRef.current = null;
        setTimeout(backToLogin, 1500);
      } else {
        setOtpError(
          `Incorrect OTP. Please try again. (Attempt ${newAttempts} of ${MAX_ATTEMPTS})`,
        );
        setOtpInput("");
      }
      return;
    }

    // OTP correct — create session (sessionStorage only)
    otpRef.current = null;
    const token = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const sessionExpiry = (Date.now() + 8 * 60 * 60 * 1000).toString(); // 8 hours
    sessionStorage.setItem("adminToken", token);
    sessionStorage.setItem("adminUser", username.trim());
    sessionStorage.setItem("adminSessionExpiry", sessionExpiry);
    navigate({ to: "/admin/dashboard" });
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtpInput(val);
    setOtpError("");
    if (val.length === 6) {
      verifyOtp(val);
    }
  };

  const backToLogin = () => {
    otpRef.current = null;
    setOtpInput("");
    setOtpError("");
    setAttempts(0);
    setDisplayOtp("");
    setStep("credentials");
    setCredError("");
  };

  const copyOtp = () => {
    if (displayOtp) {
      navigator.clipboard.writeText(displayOtp).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const busy = isVerifying;

  return (
    <div className="admin-login-bg min-h-screen flex items-center justify-center px-4">
      {/* Background decoration */}
      <div
        className="admin-login-grid-bg absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />
      {/* Bottom-right amber glow */}
      <div className="admin-login-glow2" aria-hidden="true" />

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
              className="relative w-16 h-16 mx-auto mb-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.15,
                duration: 0.4,
                type: "spring",
                stiffness: 300,
              }}
            >
              <AnimatePresence mode="wait">
                {step === "credentials" ? (
                  <motion.div
                    key="cow-icon"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.25 }}
                    className="admin-icon-spin-ring w-16 h-16 admin-icon-ring admin-icon-glow rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                  >
                    🐄
                  </motion.div>
                ) : (
                  <motion.div
                    key="shield-icon"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.25 }}
                    className="w-16 h-16 admin-icon-ring rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                      background: "rgba(251,191,36,0.15)",
                      border: "2px solid rgba(251,191,36,0.5)",
                    }}
                  >
                    <ShieldCheck size={30} className="text-amber-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <h1 className="admin-heading text-2xl font-bold mb-1">
              SUNRISE MILK AND AGRO PRODUCT'S
            </h1>
            <p className="admin-sub text-sm font-medium tracking-widest uppercase">
              {step === "credentials"
                ? "Admin Portal"
                : "Two-Factor Verification"}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 px-8 pb-4">
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold tracking-wide ${step === "credentials" ? "text-amber-400" : "text-green-400"}`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === "credentials" ? "bg-amber-400 text-gray-900" : "bg-green-500 text-white"}`}
              >
                {step === "credentials" ? "1" : <Check size={11} />}
              </div>
              Credentials
            </div>
            <div
              className={`h-px flex-1 ${step === "otp" ? "bg-amber-400" : "bg-gray-700"}`}
            />
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold tracking-wide ${step === "otp" ? "text-amber-400" : "opacity-40 text-gray-400"}`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === "otp" ? "bg-amber-400 text-gray-900" : "bg-gray-700 text-gray-400"}`}
              >
                2
              </div>
              OTP Verify
            </div>
          </div>

          {/* Form area */}
          <div className="px-8 pb-8 pt-2">
            <AnimatePresence mode="wait">
              {step === "credentials" ? (
                <motion.form
                  key="step-credentials"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleCredentialsSubmit}
                  className="space-y-6"
                  noValidate
                >
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
                        aria-describedby={credError ? "admin-error" : undefined}
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
                        aria-describedby={credError ? "admin-error" : undefined}
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
                        {showPassword ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {credError && (
                    <motion.div
                      id="admin-error"
                      data-ocid="admin.login.error_state"
                      role="alert"
                      className="admin-error rounded-lg px-4 py-3 text-sm"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p>{credError}</p>
                    </motion.div>
                  )}

                  {/* Submit */}
                  <Button
                    type="submit"
                    data-ocid="admin.login.submit_button"
                    disabled={busy}
                    className="admin-submit-btn w-full h-11 font-semibold text-sm rounded-xl mt-2"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      "Continue to OTP Verification"
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.div
                  key="step-otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* OTP display box */}
                  <div
                    className="rounded-xl border p-4"
                    style={{
                      background: "rgba(251,191,36,0.07)",
                      borderColor: "rgba(251,191,36,0.35)",
                    }}
                  >
                    <p className="text-xs font-semibold tracking-widest uppercase text-amber-400 mb-2 text-center">
                      Your Secure OTP Code
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <span
                        className="text-3xl font-mono font-bold tracking-[0.3em] text-amber-300 select-all"
                        aria-label={`OTP code: ${displayOtp.split("").join(" ")}`}
                      >
                        {displayOtp}
                      </span>
                      <button
                        type="button"
                        onClick={copyOtp}
                        data-ocid="admin.otp.secondary_button"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: copied
                            ? "rgba(34,197,94,0.2)"
                            : "rgba(251,191,36,0.15)",
                          color: copied ? "#4ade80" : "#fbbf24",
                          border: `1px solid ${copied ? "rgba(74,222,128,0.4)" : "rgba(251,191,36,0.4)"}`,
                        }}
                        aria-label="Copy OTP"
                      >
                        {copied ? (
                          <>
                            <Check size={12} /> Copied
                          </>
                        ) : (
                          <>
                            <ClipboardCopy size={12} /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <div
                        className={`w-2 h-2 rounded-full ${secondsLeft > 60 ? "bg-green-400" : secondsLeft > 30 ? "bg-amber-400" : "bg-red-400"} animate-pulse`}
                      />
                      <p
                        className={`text-xs font-mono ${secondsLeft > 60 ? "text-green-400" : secondsLeft > 30 ? "text-amber-400" : "text-red-400"}`}
                      >
                        {secondsLeft > 0
                          ? `Valid for ${formatTime(secondsLeft)}`
                          : "OTP expired"}
                      </p>
                    </div>
                  </div>

                  {/* OTP input */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="admin-otp"
                      className="admin-label text-xs font-semibold tracking-wider uppercase"
                    >
                      Enter 6-Digit OTP
                    </Label>
                    <Input
                      id="admin-otp"
                      ref={otpInputRef}
                      data-ocid="admin.otp.input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="_ _ _ _ _ _"
                      value={otpInput}
                      onChange={handleOtpChange}
                      maxLength={6}
                      autoComplete="one-time-code"
                      className="admin-input text-center text-2xl font-mono tracking-[0.4em] h-14"
                      aria-describedby={otpError ? "otp-error" : undefined}
                      disabled={secondsLeft === 0}
                    />
                    <p
                      className="text-xs text-center opacity-60"
                      style={{ color: "var(--admin-sub-color, #9ca3af)" }}
                    >
                      Attempt {Math.min(attempts + 1, MAX_ATTEMPTS)} of{" "}
                      {MAX_ATTEMPTS}
                    </p>
                  </div>

                  {/* OTP error */}
                  {otpError && (
                    <motion.div
                      id="otp-error"
                      data-ocid="admin.otp.error_state"
                      role="alert"
                      className="admin-error rounded-lg px-4 py-3 text-sm"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p>{otpError}</p>
                    </motion.div>
                  )}

                  {/* Verify button */}
                  <Button
                    type="button"
                    data-ocid="admin.otp.submit_button"
                    disabled={otpInput.length < 6 || secondsLeft === 0}
                    onClick={() => verifyOtp(otpInput)}
                    className="admin-submit-btn w-full h-11 font-semibold text-sm rounded-xl"
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Verify & Access Admin Panel
                  </Button>

                  {/* Resend / back */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      data-ocid="admin.otp.cancel_button"
                      onClick={backToLogin}
                      className="flex items-center gap-1.5 text-xs admin-hint hover:opacity-80 transition-opacity"
                    >
                      <ArrowLeft size={13} />
                      Back to Login
                    </button>
                    <button
                      type="button"
                      data-ocid="admin.otp.secondary_button"
                      onClick={backToLogin}
                      className="flex items-center gap-1.5 text-xs admin-hint hover:opacity-80 transition-opacity"
                    >
                      <RefreshCw size={12} />
                      Request New OTP
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
