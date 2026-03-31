import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function parseHashParams(hash: string): Record<string, string> {
  return Object.fromEntries(
    hash.replace(/^#/, '').split('&').map(p => p.split('=').map(decodeURIComponent))
  );
}

export function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Invite flow state
  const [isInviteFlow, setIsInviteFlow] = useState(false);
  const [inviteDone, setInviteDone] = useState(false);

  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Detect invite token in URL hash and exchange it for a session
  useEffect(() => {
    if (!supabase) return;
    const params = parseHashParams(window.location.hash);
    if (params.type === 'invite' && params.access_token) {
      setIsInviteFlow(true);
      // Exchange the token so the user is "logged in" (but passwordless) — allows updateUser to work
      supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token ?? '',
      });
      // Clear the hash so it's not reprocessed on refresh
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // If already signed in and not in invite flow, redirect
  useEffect(() => {
    if (session && !isInviteFlow) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [session, isInviteFlow, navigate, location]);

  // ── Set Password (invite flow) ──────────────────────────────────────
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setInviteDone(true);
      setTimeout(() => navigate('/', { replace: true }), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Sign In ──────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured. Check your environment variables.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Authentication timed out. Please try again.')), 15000)
    );

    try {
      const authPromise = supabase.auth.signInWithPassword({ email, password });
      const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any;

      if (error) {
        if (error.message === 'Invalid login credentials' && email === import.meta.env.VITE_ADMIN_EMAIL) {
          const signUpPromise = supabase.auth.signUp({
            email,
            password,
            options: { data: { name: 'Fahad Mahmood' } },
          });
          const { data: signUpData, error: signUpError } = await Promise.race([signUpPromise, timeoutPromise]) as any;
          if (signUpError) throw signUpError;
          if (signUpData?.session) {
            navigate(location.state?.from?.pathname || '/', { replace: true });
          } else {
            setSuccess('Account created! Check your email for the confirmation link.');
          }
        } else {
          throw error;
        }
      } else if (data?.session) {
        navigate(location.state?.from?.pathname || '/', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Invite: success state ────────────────────────────────────────────
  if (inviteDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-on-surface">Password set!</h2>
            <p className="text-sm text-on-surface-variant">Taking you to the dashboard…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Invite: set password form ────────────────────────────────────────
  if (isInviteFlow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Set your password</CardTitle>
            <CardDescription className="text-center">
              Choose a password to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetPassword} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-error bg-error-container rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface" htmlFor="new-password">
                  New Password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface" htmlFor="confirm-password">
                  Confirm Password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Saving…' : 'Set Password & Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Normal sign-in form ──────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-error bg-error-container rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm text-primary bg-primary-container rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {success}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface" htmlFor="email">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface" htmlFor="password">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
