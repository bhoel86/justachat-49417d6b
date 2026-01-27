import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MessageCircle, Mail, Lock, User, ArrowRight, ShieldCheck, ArrowLeft, AlertTriangle, Calendar, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import TurnstileCaptcha from "@/components/auth/TurnstileCaptcha";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getVersionString } from "@/lib/version";
import { clearAuthStorage } from "@/lib/authStorage";
import mascotLeft from "@/assets/mascot-left.png";
import mascotRight from "@/assets/mascot-right.png";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const usernameSchema = z.string().min(2, "Username must be at least 2 characters").max(20, "Username must be less than 20 characters");
const ageSchema = z.number().min(13, "You must be at least 13 years old").max(120, "Please enter a valid age");
const parentEmailSchema = z.string().email("Please enter a valid parent/guardian email");

type AuthMode = "login" | "signup" | "forgot" | "reset";

const CAPTCHA_REQUIRED_HOSTS = new Set(["justachat.net", "www.justachat.net"]);

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);
  const [captchaDebugInfo, setCaptchaDebugInfo] = useState<Record<string, unknown> | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string; captcha?: string; age?: string; parentEmail?: string; terms?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmailSentAt, setResetEmailSentAt] = useState<number | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ locked: boolean; message?: string; remainingAttempts?: number } | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const captchaRequired =
    mode === "signup" && CAPTCHA_REQUIRED_HOSTS.has(window.location.hostname);

  // Check if current user is owner (for debug mode)
  useEffect(() => {
    const checkOwnerStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        setIsOwner(data?.role === 'owner');
      }
    };
    checkOwnerStatus();
  }, []);

  // Track if we're in password reset mode (takes priority over auto-redirect)
  const [isPasswordResetFlow, setIsPasswordResetFlow] = useState(false);

  // Check for password reset token in URL - MUST run before redirect logic
  useEffect(() => {
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    
    // Check both hash and query params for recovery token
    const isRecovery = 
      (hash && hash.includes("type=recovery")) ||
      searchParams.get("type") === "recovery";
    
    if (isRecovery) {
      setMode("reset");
      setIsPasswordResetFlow(true);
      
      // Extract tokens from hash and exchange for session
      // The hash contains: #access_token=...&refresh_token=...&type=recovery
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        
        if (accessToken && refreshToken) {
          // Set the session from the recovery tokens
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          }).then(({ error }) => {
            if (error) {
              console.error("Failed to set session from recovery token:", error);
              toast({
                variant: "destructive",
                title: "Session Error",
                description: "Failed to verify reset link. Please request a new one."
              });
              setMode("forgot");
            } else {
              console.log("Session established from recovery token");
            }
          });
        }
      }
    }
  }, [toast]);

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
    setCaptchaError(false);
    setErrors(prev => ({ ...prev, captcha: undefined }));
  }, []);

  const handleCaptchaError = useCallback(() => {
    setCaptchaError(true);
    setCaptchaToken(null);
  }, []);

  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
  }, []);

  // Redirect logged-in users ONLY if not in password reset flow
  useEffect(() => {
    if (!loading && user && !isPasswordResetFlow) {
      navigate("/");
    }
  }, [user, loading, navigate, isPasswordResetFlow]);

  // Countdown timer for resend button
  useEffect(() => {
    if (!resetEmailSentAt) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - resetEmailSentAt) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setResendCountdown(remaining);
      
      if (remaining === 0) {
        setCanResend(true);
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [resetEmailSentAt]);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (mode === "forgot") {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        newErrors.email = emailResult.error.errors[0].message;
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (mode === "reset") {
      const passwordResult = passwordSchema.safeParse(newPassword);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (mode === "signup") {
      const usernameResult = usernameSchema.safeParse(username);
      if (!usernameResult.success) {
        newErrors.username = usernameResult.error.errors[0].message;
      }
      
      // Validate age
      const ageNum = parseInt(age, 10);
      if (!age || isNaN(ageNum)) {
        newErrors.age = "Please enter your age";
      } else {
        const ageResult = ageSchema.safeParse(ageNum);
        if (!ageResult.success) {
          newErrors.age = ageResult.error.errors[0].message;
        }
      }
      
      // If minor (13-17), require parent/guardian email from someone 21+
      const parsedAge = parseInt(age, 10);
      if (!isNaN(parsedAge) && parsedAge >= 13 && parsedAge < 18) {
        if (!parentEmail) {
          newErrors.parentEmail = "Parent/guardian email is required for users under 18";
        } else {
          const parentEmailResult = parentEmailSchema.safeParse(parentEmail);
          if (!parentEmailResult.success) {
            newErrors.parentEmail = parentEmailResult.error.errors[0].message;
          } else if (parentEmail.toLowerCase() === email.toLowerCase()) {
            newErrors.parentEmail = "Parent/guardian email must be different from your email";
          }
        }
      }
      
      // Require agreement to terms
      if (!agreedToTerms) {
        newErrors.terms = "You must agree to the Terms of Service";
      }
      
      // CAPTCHA verification required only on official domains
      if (captchaRequired && !captchaToken) {
        newErrors.captcha = "Please complete the CAPTCHA verification";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const verifyCaptchaOnServer = async (token: string): Promise<boolean> => {
    try {
      // Get current session for owner debug mode
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('verify-captcha', {
        body: { token, debug: isOwner },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined
      });
      
      if (error) {
        console.error('CAPTCHA verification error:', error);
        if (isOwner) {
          setCaptchaDebugInfo({ error: error.message, context: 'Function invocation failed' });
        }
        return false;
      }

      if (data?.success !== true) {
        console.warn("CAPTCHA rejected:", data);
        if (isOwner && data?.debug) {
          setCaptchaDebugInfo(data.debug);
        } else if (isOwner && data?.codes) {
          setCaptchaDebugInfo({ errorCodes: data.codes });
        }
      }
      
      return data?.success === true;
    } catch (err) {
      console.error('CAPTCHA verification failed:', err);
      if (isOwner) {
        setCaptchaDebugInfo({ exception: err instanceof Error ? err.message : String(err) });
      }
      return false;
    }
  };

  const checkRateLimit = async (identifier: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-rate-limit', {
        body: { identifier, action: 'check' }
      });
      
      if (error) {
        console.error('Rate limit check error:', error);
        return true; // Allow on error
      }
      
      if (data?.locked) {
        setRateLimitInfo({ locked: true, message: data.message });
        return false;
      }
      
      setRateLimitInfo({ locked: false, remainingAttempts: data?.remainingAttempts });
      return data?.allowed !== false;
    } catch (err) {
      console.error('Rate limit check failed:', err);
      return true;
    }
  };

  const recordFailedAttempt = async (identifier: string) => {
    try {
      const { data } = await supabase.functions.invoke('check-rate-limit', {
        body: { identifier, action: 'record_failure' }
      });
      
      if (data?.locked) {
        setRateLimitInfo({ locked: true, message: data.message });
      } else if (data?.remainingAttempts !== undefined) {
        setRateLimitInfo({ locked: false, remainingAttempts: data.remainingAttempts });
      }
    } catch (err) {
      console.error('Failed to record attempt:', err);
    }
  };

  const resetRateLimit = async (identifier: string) => {
    try {
      await supabase.functions.invoke('check-rate-limit', {
        body: { identifier, action: 'reset' }
      });
      setRateLimitInfo(null);
    } catch (err) {
      console.error('Failed to reset rate limit:', err);
    }
  };

  const handleForgotPassword = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const redirectUrl = `${window.location.origin}/home`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
      } else {
        setResetEmailSent(true);
        setResetEmailSentAt(Date.now());
        setCanResend(false);
        setResendCountdown(30);
        toast({
          title: "Check your email",
          description: "We've sent you a password reset link."
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
      } else {
        toast({
          title: "Password updated!",
          description: "You can now sign in with your new password."
        });
        // Sign out the recovery session so user can log in fresh
          try {
            await supabase.auth.signOut({ scope: 'local' });
          } finally {
            clearAuthStorage();
          }
        setIsPasswordResetFlow(false);
        setMode("login");
        setNewPassword("");
        // Clear the hash from URL
        window.history.replaceState(null, "", window.location.pathname);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "forgot") {
      return handleForgotPassword();
    }
    
    if (mode === "reset") {
      return handleResetPassword();
    }
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (mode === "login") {
        // Check rate limit before attempting login
        const allowed = await checkRateLimit(email.toLowerCase());
        if (!allowed) {
          setIsSubmitting(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          // Record failed attempt
          await recordFailedAttempt(email.toLowerCase());
          
          const remainingMsg = rateLimitInfo?.remainingAttempts !== undefined 
            ? ` (${rateLimitInfo.remainingAttempts} attempts remaining)`
            : '';
          
          toast({
            variant: "destructive",
            title: "Login failed",
            description: error.message === "Invalid login credentials" 
              ? `Invalid email or password.${remainingMsg}`
              : error.message
          });
        } else {
          // Reset rate limit on successful login
          await resetRateLimit(email.toLowerCase());
        }
      } else if (mode === "signup") {
        // Verify CAPTCHA on server (official domains only)
        if (captchaRequired) {
          if (!captchaToken) {
            setErrors(prev => ({ ...prev, captcha: "Please complete the CAPTCHA" }));
            setIsSubmitting(false);
            return;
          }
          
          const captchaValid = await verifyCaptchaOnServer(captchaToken);
          if (!captchaValid) {
            toast({
              variant: "destructive",
              title: "Verification failed",
              description: "CAPTCHA verification failed. Please try again."
            });
            setCaptchaToken(null);
            setIsSubmitting(false);
            return;
          }
        }
        
        const parsedAge = parseInt(age, 10);
        const isMinor = parsedAge >= 13 && parsedAge < 18;
        const { error, data } = await signUp(email, password, username, parsedAge, isMinor ? parentEmail : undefined);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              variant: "destructive",
              title: "Account exists",
              description: "This email is already registered. Please log in instead."
            });
            setMode("login");
          } else {
            toast({
              variant: "destructive",
              title: "Signup failed",
              description: error.message
            });
          }
        } else {
          // Store email for auto-fill on login
          const signupEmail = email;
          
          // If minor, send parent consent email
          if (isMinor && parentEmail && data?.user?.id) {
            try {
              await supabase.functions.invoke("send-parent-consent", {
                body: {
                  userId: data.user.id,
                  parentEmail: parentEmail,
                  minorUsername: username,
                  minorAge: parsedAge,
                },
              });
              toast({
                title: "Account Created!",
                description: "A consent email has been sent to your parent/guardian. Please sign in to continue."
              });
            } catch (emailError) {
              console.error("Failed to send parent consent email:", emailError);
              toast({
                title: "Account Created",
                description: "Your account was created. Please sign in to continue."
              });
            }
          } else {
            toast({
              title: "Welcome to Justachat™!",
              description: "Your account has been created. Please sign in to continue."
            });
          }
          
          // Switch to login mode and auto-fill email
          setMode("login");
          setEmail(signupEmail);
          setPassword("");
          setUsername("");
          setAge("");
          setParentEmail("");
          setAgreedToTerms(false);
          setErrors({});
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 rounded-xl jac-gradient-bg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl jac-gradient-bg flex items-center justify-center mb-4 animate-pulse-glow">
            <MessageCircle className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-bold jac-gradient-text">Justachat<sup className="text-lg">™</sup></h1>
          <p className="text-muted-foreground mt-1">Connect Instantly, Chat Freely</p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
          {/* Back button for forgot/reset modes */}
          {(mode === "forgot" || mode === "reset") && (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setResetEmailSent(false);
                setErrors({});
              }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>
          )}
          
          <h2 className="text-xl font-semibold text-foreground mb-1 text-center">
            {mode === "login" && "Welcome back"}
            {mode === "signup" && "Create account"}
            {mode === "forgot" && "Reset password"}
            {mode === "reset" && "Set new password"}
          </h2>
          <p className="text-muted-foreground text-sm text-center mb-6">
            {mode === "login" && "Sign in to continue chatting"}
            {mode === "signup" && "Join the conversation"}
            {mode === "forgot" && "Enter your email to receive a reset link"}
            {mode === "reset" && "Enter your new password below"}
          </p>

          {/* Rate limit warning */}
          {mode === "login" && rateLimitInfo?.locked && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{rateLimitInfo.message}</AlertDescription>
            </Alert>
          )}

          {/* Remaining attempts warning */}
          {mode === "login" && !rateLimitInfo?.locked && rateLimitInfo?.remainingAttempts !== undefined && rateLimitInfo.remainingAttempts <= 2 && (
            <Alert className="mb-4 border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-500">
                {rateLimitInfo.remainingAttempts} login attempt{rateLimitInfo.remainingAttempts !== 1 ? 's' : ''} remaining before temporary lockout.
              </AlertDescription>
            </Alert>
          )}

          {/* Reset email sent success message */}
          {mode === "forgot" && resetEmailSent ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <p className="text-foreground font-medium mb-2">Check your inbox</p>
              <p className="text-muted-foreground text-sm">
                We've sent a password reset link to <span className="font-medium">{email}</span>
              </p>
              {canResend ? (
                <button
                  type="button"
                  onClick={() => {
                    setResetEmailSent(false);
                    setResetEmailSentAt(null);
                    setCanResend(false);
                  }}
                  className="text-sm text-primary hover:underline mt-4 font-medium"
                >
                  Resend reset email
                </button>
              ) : (
                <p className="text-sm text-muted-foreground mt-4">
                  Didn't receive it? You can resend in {resendCountdown}s
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrors(prev => ({ ...prev, username: undefined }));
                    }}
                    placeholder="Username"
                    className="w-full bg-input rounded-xl pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    maxLength={20}
                  />
                </div>
                {errors.username && (
                  <p className="text-destructive text-xs mt-1">{errors.username}</p>
                )}
              </div>
            )}

              {/* Age field - show for signup */}
              {mode === "signup" && (
                <div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => {
                        setAge(e.target.value);
                        setErrors(prev => ({ ...prev, age: undefined, parentEmail: undefined }));
                      }}
                      placeholder="Your Age"
                      className="w-full bg-input rounded-xl pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      min={13}
                      max={120}
                    />
                  </div>
                  {errors.age && (
                    <p className="text-destructive text-xs mt-1">{errors.age}</p>
                  )}
                  {age && parseInt(age, 10) >= 13 && parseInt(age, 10) < 18 && (
                    <p className="text-amber-500 text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Parental consent required for users under 18
                    </p>
                  )}
                </div>
              )}

              {/* Parent/Guardian Email - show for minors during signup */}
              {mode === "signup" && age && parseInt(age, 10) >= 13 && parseInt(age, 10) < 18 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-3">
                  <div className="flex items-center gap-2 text-amber-500 text-sm font-medium">
                    <Users className="h-4 w-4" />
                    Parent/Guardian Consent Required
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Users under 18 must have a parent or guardian (21+) provide their email to consent to account creation.
                  </p>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={(e) => {
                        setParentEmail(e.target.value);
                        setErrors(prev => ({ ...prev, parentEmail: undefined }));
                      }}
                      placeholder="Parent/Guardian Email (21+)"
                      className="w-full bg-input rounded-xl pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  {errors.parentEmail && (
                    <p className="text-destructive text-xs">{errors.parentEmail}</p>
                  )}
                </div>
              )}

              {/* Email field - show for login, signup, forgot */}
              {(mode === "login" || mode === "signup" || mode === "forgot") && (
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors(prev => ({ ...prev, email: undefined }));
                      }}
                      placeholder="Email"
                      className="w-full bg-input rounded-xl pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-destructive text-xs mt-1">{errors.email}</p>
                  )}
                </div>
              )}

              {/* Password field - show for login, signup */}
              {(mode === "login" || mode === "signup") && (
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors(prev => ({ ...prev, password: undefined }));
                      }}
                      placeholder="Password"
                      className="w-full bg-input rounded-xl pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-xs mt-1">{errors.password}</p>
                  )}
                </div>
              )}

              {/* New password field - show for reset */}
              {mode === "reset" && (
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setErrors(prev => ({ ...prev, password: undefined }));
                      }}
                      placeholder="New password"
                      className="w-full bg-input rounded-xl pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-xs mt-1">{errors.password}</p>
                  )}
                </div>
              )}

              {/* Forgot password link */}
              {mode === "login" && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setErrors({});
                    }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Terms Agreement - signup only */}
              {mode === "signup" && (
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked);
                        setErrors(prev => ({ ...prev, terms: undefined }));
                      }}
                      className="mt-1 h-4 w-4 rounded border-border bg-input text-primary focus:ring-primary/50"
                    />
                    <span className="text-sm text-muted-foreground">
                      I confirm that I am registering in <strong className="text-foreground">good faith</strong> and agree to the{" "}
                      <Link to="/legal" target="_blank" className="text-primary hover:underline">
                        Terms of Service
                      </Link>
                      {" "}and{" "}
                      <Link to="/cookies" target="_blank" className="text-primary hover:underline">
                        Cookie Policy
                      </Link>
                    </span>
                  </label>
                  {errors.terms && (
                    <p className="text-destructive text-xs">{errors.terms}</p>
                  )}
                </div>
              )}

              {/* CAPTCHA verification for signup (official domains only) */}
              {mode === "signup" && captchaRequired && (
                <div className="space-y-2">
                  <TurnstileCaptcha
                    onVerify={handleCaptchaVerify}
                    onError={handleCaptchaError}
                    onExpire={handleCaptchaExpire}
                  />
                  {captchaToken && (
                    <div className="flex items-center justify-center gap-1 text-xs text-green-500">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Verified</span>
                    </div>
                  )}
                  {errors.captcha && (
                    <p className="text-destructive text-xs text-center">{errors.captcha}</p>
                  )}
                  {captchaError && (
                    <p className="text-destructive text-xs text-center">CAPTCHA error. Please refresh and try again.</p>
                  )}
                  {/* Owner-only CAPTCHA debug info */}
                  {isOwner && captchaDebugInfo && (
                    <div className="mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs">
                      <div className="flex items-center gap-1 text-destructive font-medium mb-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>CAPTCHA Debug (Owner Only)</span>
                      </div>
                      <pre className="text-muted-foreground whitespace-pre-wrap break-all font-mono text-[10px]">
                        {JSON.stringify(captchaDebugInfo, null, 2)}
                      </pre>
                      <button
                        type="button"
                        onClick={() => setCaptchaDebugInfo(null)}
                        className="mt-2 text-muted-foreground hover:text-foreground text-[10px] underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )}

              {mode === "signup" && !captchaRequired && (
                <p className="text-xs text-muted-foreground text-center">
                  CAPTCHA is only required on justachat.net.
                </p>
              )}

              <Button
                type="submit"
                variant="jac"
                size="lg"
                className="w-full"
                disabled={
                  isSubmitting ||
                  (mode === "signup" && (!agreedToTerms || (captchaRequired && !captchaToken))) ||
                  (mode === "login" && rateLimitInfo?.locked)
                }
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Please wait...</span>
                ) : (
                  <>
                    {mode === "login" && "Sign In"}
                    {mode === "signup" && "Create Account"}
                    {mode === "forgot" && "Send Reset Link"}
                    {mode === "reset" && "Update Password"}
                    <ArrowRight className="h-5 w-5 ml-1" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Google Sign-In - show for login and signup modes */}
          {(mode === "login" || mode === "signup") && (
            <div className="mt-4">
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-border w-full" />
                <span className="absolute bg-card px-3 text-xs text-muted-foreground">
                  or continue with
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${window.location.origin}/`,
                      queryParams: {
                        prompt: 'select_account'
                      }
                    }
                  });
                  if (error) {
                    toast({
                      variant: "destructive",
                      title: "Google Sign-In Failed",
                      description: error.message
                    });
                  }
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
              
            </div>
          )}

          {/* Links row: Use different account | Sign up/in */}
          {(mode === "login" || mode === "signup") && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await supabase.auth.signOut({ scope: 'local' });
                  } finally {
                    clearAuthStorage();
                  }
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${window.location.origin}/`,
                      queryParams: {
                        prompt: 'select_account'
                      }
                    }
                  });
                  if (error) {
                    toast({
                      variant: "destructive",
                      title: "Failed to switch account",
                      description: error.message
                    });
                  }
                }}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Use a different Google account
              </button>
              
              <span className="text-muted-foreground/50">|</span>
              
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setErrors({});
                  setCaptchaToken(null);
                  setAge("");
                  setParentEmail("");
                  setAgreedToTerms(false);
                }}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          )}
        </div>
        
        {/* Official Footer with Mascots */}
        <footer className="mt-8 w-full">
          <div className="flex items-center justify-center gap-4">
            {/* Left mascot */}
            <img 
              src={mascotLeft} 
              alt="Mascot" 
              className="h-12 sm:h-14 w-auto object-contain"
            />
            
            {/* Center content */}
            <div className="flex flex-col items-center gap-2">
              {/* Social Media Links */}
              <div className="flex items-center gap-2">
                <a 
                  href="#" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary hover:bg-primary/20 flex items-center justify-center transition-colors group"
                  title="Facebook"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a 
                  href="#" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary hover:bg-primary/20 flex items-center justify-center transition-colors group"
                  title="Instagram"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a 
                  href="#" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary hover:bg-primary/20 flex items-center justify-center transition-colors group"
                  title="TikTok"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
                <a 
                  href="#" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary hover:bg-primary/20 flex items-center justify-center transition-colors group"
                  title="X (Twitter)"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
              
              {/* Copyright & Version */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  © {new Date().getFullYear()} Justachat™ All rights reserved.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <a 
                    href="https://justachat.net" 
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    justachat.net
                  </a>
                  <span className="text-xs text-muted-foreground/50">•</span>
                  <Link 
                    to="/legal" 
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Legal
                  </Link>
                  <span className="text-xs text-muted-foreground/50">•</span>
                  <span className="text-xs text-muted-foreground/70 font-mono">{getVersionString()}</span>
                </div>
              </div>
            </div>
            
            {/* Right mascot */}
            <img 
              src={mascotRight} 
              alt="Mascot" 
              className="h-12 sm:h-14 w-auto object-contain"
            />
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Auth;
