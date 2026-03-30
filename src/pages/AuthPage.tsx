import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (session) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [session, navigate, location]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured. Check your environment variables.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Authentication timed out. Please try again.')), 15000)
    );

    try {
      const authPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any;
      
      if (error) {
        if (error.message === 'Invalid login credentials' && email === import.meta.env.VITE_ADMIN_EMAIL) {
          // Attempt to create the admin account automatically
          const signUpPromise = supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: 'Fahad Mahmood'
              }
            }
          });
          
          const { data: signUpData, error: signUpError } = await Promise.race([signUpPromise, timeoutPromise]) as any;
          
          if (signUpError) throw signUpError;
          
          if (signUpData?.session) {
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
          } else {
            setSuccess('Admin account created! Please check your email for the confirmation link, or if email confirmation is disabled, try logging in again.');
          }
        } else {
          throw error;
        }
      } else if (data?.session) {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
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
              <label className="text-sm font-medium text-on-surface" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
