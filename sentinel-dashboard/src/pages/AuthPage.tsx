import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowUpRight, AlertCircle, Loader2, CheckCircle2, Lock, Mail, UserPlus, LogIn } from "lucide-react";
import { SentinelLogo } from "@/components/SentinelLogo/SentinelLogo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/api/auth";
import { loginSchema, registerSchema } from "@/schemas/auth.schema";

import authHeroImg from "@/assets/auth-hero.jfif";

export function AuthPage() {
  const { isAuthenticated, setAuth } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [animatingState, setAnimatingState] = useState<"idle" | "sliding-out" | "sliding-in">("idle");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const toggleMode = () => {
    if (animatingState !== "idle") return;

    // Phase 1: Slide entire 2nd section card underneath 3rd section (drawer slide-out)
    setAnimatingState("sliding-out");
    setErrors({});
    setApiError(null);
    setApiSuccess(null);

    setTimeout(() => {
      // Phase 2: Toggle mode state while hidden under drawer
      setMode((prev) => (prev === "login" ? "register" : "login"));
      setAnimatingState("sliding-in");

      setTimeout(() => {
        // Phase 3: Drawer slides back out to normal position
        setAnimatingState("idle");
      }, 400);
    }, 350);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);
    setApiSuccess(null);

    if (mode === "login") {
      const validation = loginSchema.safeParse({ email, password });
      if (!validation.success) {
        const formattedErrors: { [key: string]: string } = {};
        validation.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            formattedErrors[issue.path[0].toString()] = issue.message;
          }
        });
        setErrors(formattedErrors);
        return;
      }
    } else {
      const validation = registerSchema.safeParse({ email, password, confirmPassword });
      if (!validation.success) {
        const formattedErrors: { [key: string]: string } = {};
        validation.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            formattedErrors[issue.path[0].toString()] = issue.message;
          }
        });
        setErrors(formattedErrors);
        return;
      }
    }

    setLoading(true);

    try {
      const result =
        mode === "login"
          ? await authApi.login({ email, password })
          : await authApi.register({ email, password, confirmPassword });

      if (result.ok) {
        setAuth(result.data.token, result.data.user);
        setApiSuccess("Authentication successful! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } else {
        setApiError(result.error);
      }
    } catch (err) {
      setApiError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#EAEAEA] dark:bg-[#121214] p-3 sm:p-5 lg:p-8 font-sans selection:bg-neutral-800 selection:text-white overflow-hidden">
      
      {/* MOBILE ONLY: Ambient Hero Image Background */}
      <div className="absolute inset-0 block lg:hidden z-0 overflow-hidden">
        <img
          src={authHeroImg}
          alt="Sentinel Auth Background"
          className="w-full h-full object-cover object-center filter brightness-[0.45] saturate-125 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 backdrop-blur-xs" />
      </div>

      {/* Main Container Deck */}
      <div className="relative flex w-full max-w-6xl min-h-[580px] lg:min-h-[640px] rounded-3xl lg:rounded-[36px] bg-transparent lg:bg-[#EAEAEA] lg:dark:bg-[#121214] p-1 sm:p-2 z-10">
        
        {/* SECTION 1: Brand Sidebar (Leftmost) */}
        <div className="hidden lg:flex w-18 md:w-36 flex-col justify-between p-3 md:p-5 z-10 shrink-0">
          <div className="flex flex-col items-start space-y-2">
            <div className="flex items-center justify-center p-1 rounded-2xl bg-white/70 dark:bg-neutral-800/70 shadow-xs backdrop-blur-md">
              <SentinelLogo size={38} />
            </div>
            <span className="font-extrabold text-lg tracking-tighter text-neutral-900 dark:text-neutral-100">
              SENTINEL
            </span>
          </div>

          <div className="text-[10px] font-medium tracking-widest text-neutral-400 uppercase">
            Since 2026
          </div>
        </div>

        {/* SECTION 2 & 3 FLEX CONTAINER */}
        <div className="relative flex-1 flex flex-col lg:flex-row gap-0 items-stretch w-full">
          
          {/* SECTION 2: Middle Card (Form & Big Typography) */}
          {/* Smooth slide animation transforming entire card horizontally under 3rd section */}
          <div
            className={`relative flex-1 rounded-3xl lg:rounded-[32px] p-5 sm:p-7 lg:p-9 flex flex-col justify-between z-10 shadow-xl lg:shadow-xs transition-all duration-700 ease-in-out transform ${
              // Mobile Glassmorphism styling vs Desktop Card styling
              "bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xl border border-white/50 dark:border-neutral-800/60 lg:bg-[#F4F4F5] lg:dark:bg-[#1C1C1E] lg:backdrop-blur-none lg:border-none"
            } ${
              animatingState === "sliding-out"
                ? "translate-x-full opacity-0"
                : animatingState === "sliding-in"
                ? "translate-x-full opacity-0"
                : "translate-x-0 opacity-100"
            }`}
          >
            {/* Header / Brand Title for Mobile */}
            <div className="flex items-center justify-between lg:hidden mb-4 pb-3 border-b border-neutral-200/50 dark:border-neutral-800/50">
              <div className="flex items-center gap-2.5">
                <SentinelLogo size={30} />
                <span className="font-extrabold text-base tracking-tighter text-neutral-900 dark:text-neutral-100">
                  SENTINEL
                </span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                {mode === "login" ? "Sign In" : "Register"}
              </span>
            </div>

            {/* Header Title Section */}
            <div className="space-y-2.5 max-w-xl">
              <div className="hidden lg:inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 tracking-wide uppercase">
                {mode === "login" ? "Authentication Portal" : "Registration Desk"}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 leading-[1.15]">
                {mode === "login" ? (
                  <>
                    Sentinel Platform <br />
                    <span className="text-neutral-500 font-light">— Capabilities Deck</span>
                  </>
                ) : (
                  <>
                    Join Sentinel Network <br />
                    <span className="text-neutral-500 font-light">— Operator Access</span>
                  </>
                )}
              </h1>
            </div>

            {/* Middle Form Section */}
            <div className="my-4 max-w-md w-full">
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {apiError && (
                  <Alert variant="destructive" className="rounded-2xl border-destructive/30 bg-destructive/10 p-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-xs font-bold">Authentication Failed</AlertTitle>
                    <AlertDescription className="text-xs">{apiError}</AlertDescription>
                  </Alert>
                )}

                {apiSuccess && (
                  <Alert className="rounded-2xl border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <AlertTitle className="text-xs font-bold">Success</AlertTitle>
                    <AlertDescription className="text-xs">{apiSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-neutral-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="operator@sentinel.dev"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      aria-invalid={Boolean(errors.email)}
                      className="pl-10 h-10 rounded-xl bg-white/80 dark:bg-neutral-900/90 border-neutral-200 dark:border-neutral-800 text-sm focus-visible:ring-neutral-400"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[11px] font-medium text-destructive mt-0.5">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-neutral-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      aria-invalid={Boolean(errors.password)}
                      className="pl-10 h-10 rounded-xl bg-white/80 dark:bg-neutral-900/90 border-neutral-200 dark:border-neutral-800 text-sm focus-visible:ring-neutral-400"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-[11px] font-medium text-destructive mt-0.5">{errors.password}</p>
                  )}
                </div>

                {mode === "register" && (
                  <div className="space-y-1">
                    <Label htmlFor="confirmPassword" className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-neutral-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        aria-invalid={Boolean(errors.confirmPassword)}
                        className="pl-10 h-10 rounded-xl bg-white/80 dark:bg-neutral-900/90 border-neutral-200 dark:border-neutral-800 text-sm focus-visible:ring-neutral-400"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[11px] font-medium text-destructive mt-0.5">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                  <Button
                    type="submit"
                    disabled={loading || animatingState !== "idle"}
                    className="w-full sm:w-auto h-10 px-7 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 font-semibold text-xs transition-all shadow-md active:scale-98"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        {mode === "login" ? "Authenticating..." : "Registering..."}
                      </>
                    ) : mode === "login" ? (
                      <span className="flex items-center gap-2">
                        Sign In <LogIn className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Create Account <UserPlus className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={toggleMode}
                    disabled={animatingState !== "idle"}
                    className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors py-1.5 px-2.5 rounded-lg underline-offset-4 hover:underline"
                  >
                    {mode === "login" ? "Don't have an account? Register" : "Already have an account? Sign In"}
                  </button>
                </div>
              </form>
            </div>

            {/* Bottom Descriptive Paragraph */}
            <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-lg pt-3 border-t border-neutral-200/50 dark:border-neutral-800/50">
              {mode === "login"
                ? "This deck provides high-level security controls and monitoring insights across your enterprise architecture. Sign in to access your dashboard telemetry."
                : "Registering professionally grants role-based security access, automated audit logs, and real-time infrastructure event monitoring for your organization."}
            </div>
          </div>

          {/* SECTION 3: Elevated Hero Image Card (Desktop Only - Positioned Above with Z-20) */}
          <div className="hidden lg:block relative lg:w-[48%] min-h-[500px] lg:min-h-full rounded-[32px] overflow-hidden lg:-ml-6 z-20 shadow-2xl group bg-neutral-900 shrink-0">
            {/* Background Image imported directly from assets */}
            <img
              src={authHeroImg}
              alt="Sentinel Auth Deck Visual"
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />

            {/* Subtle Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

            {/* Top Right Floating Tags / Pills */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
              <span className="px-3 py-1 rounded-full text-[11px] font-medium text-white/90 bg-black/35 backdrop-blur-md border border-white/10 shadow-xs">
                www.sentinel.dev
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-medium text-white/90 bg-black/35 backdrop-blur-md border border-white/10 shadow-xs">
                info@sentinel.dev
              </span>
            </div>

            {/* Bottom Left Circular Drawer Switch Button */}
            <div className="absolute bottom-5 left-5 z-30">
              <button
                type="button"
                aria-label="Switch Auth Mode"
                onClick={toggleMode}
                disabled={animatingState !== "idle"}
                className="w-11 h-11 rounded-full bg-white text-neutral-900 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
              >
                <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}


