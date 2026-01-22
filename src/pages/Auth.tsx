import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Mail, Lock, User, ArrowRight, ShieldCheck, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import TurnstileCaptcha from "@/components/auth/TurnstileCaptcha";
import { Alert, AlertDescription } from "@/components/ui/alert";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const usernameSchema = z.string().min(2, "Username must be at least 2 characters").max(20, "Username must be less than 20 characters");

type AuthMode = "login" | "signup" | "forgot" | "reset";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [username, setUsername] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string; captcha?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ locked: boolean; message?: string; remainingAttempts?: number } | null>(null);
  
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for password reset token in URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setMode("reset");
    }
  }, []);

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

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

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
      
      // Require CAPTCHA for signup
      if (!captchaToken) {
        newErrors.captcha = "Please complete the CAPTCHA verification";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const verifyCaptchaOnServer = async (token: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-captcha', {
        body: { token }
      });
      
      if (error) {
        console.error('CAPTCHA verification error:', error);
        return false;
      }
      
      return data?.success === true;
    } catch (err) {
      console.error('CAPTCHA verification failed:', err);
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
      const redirectUrl = `${window.location.origin}/auth`;
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
        // Verify CAPTCHA on server first
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
        
        const { error } = await signUp(email, password, username);
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
          toast({
            title: "Welcome to JAC!",
            description: "Your account has been created successfully."
          });
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
          <h1 className="font-display text-4xl font-bold jac-gradient-text">JAC</h1>
          <p className="text-muted-foreground mt-1">Just A Chat</p>
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
              <button
                type="button"
                onClick={() => setResetEmailSent(false)}
                className="text-sm text-primary hover:underline mt-4"
              >
                Didn't receive it? Try again
              </button>
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

              {/* CAPTCHA for signup only */}
              {mode === "signup" && (
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
                </div>
              )}

              <Button
                type="submit"
                variant="jac"
                size="lg"
                className="w-full"
                disabled={isSubmitting || (mode === "signup" && !captchaToken) || (mode === "login" && rateLimitInfo?.locked)}
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

          {/* Toggle between login/signup */}
          {(mode === "login" || mode === "signup") && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setErrors({});
                  setCaptchaToken(null);
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
