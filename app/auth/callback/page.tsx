'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { authApi, ApiError } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthSession } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    // Prevent double invocation in React 19 StrictMode
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // 1. Handle GitHub direct error callback (e.g. user cancelled authorization)
    if (error) {
      setStatus('error');
      setErrorMessage(errorDescription || `GitHub OAuth error: ${error}`);
      return;
    }

    // 2. Validate presence of code and state
    if (!code || !state) {
      setStatus('error');
      setErrorMessage('Missing authorization code or CSRF state parameter from GitHub callback.');
      return;
    }

    // 3. Exchange code & state with backend
    async function exchangeOAuthCode() {
      try {
        const response = await authApi.githubCallback(code!, state!);

        if (response.success && response.data) {
          setAuthSession(response.data.accessToken, response.data.user);
          setStatus('success');
          // Short delay for visual confirmation before redirect
          setTimeout(() => {
            router.replace('/');
          }, 800);
        } else {
          setStatus('error');
          setErrorMessage(response.message || 'Authentication failed');
        }
      } catch (err) {
        setStatus('error');
        if (err instanceof ApiError) {
          setErrorMessage(err.details || err.message);
        } else {
          setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred during authentication');
        }
      }
    }

    exchangeOAuthCode();
  }, [searchParams, router, setAuthSession]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">
            {status === 'loading' && 'Authenticating with GitHub'}
            {status === 'success' && 'Authentication Successful!'}
            {status === 'error' && 'Authentication Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your credentials and secure your session...'}
            {status === 'success' && 'Redirecting to your DevPilot dashboard...'}
            {status === 'error' && 'We could not complete your GitHub sign-in.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 pt-2 pb-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-3 py-6">
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">Exchanging OAuth credentials...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-3 py-6">
              <CheckCircle2 className="size-12 text-emerald-500 animate-in zoom-in-75 duration-300" />
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Welcome aboard!</p>
            </div>
          )}

          {status === 'error' && (
            <div className="w-full space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription className="text-xs break-words mt-1">
                  {errorMessage}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => router.replace('/')}>
                  Cancel
                </Button>
                <Button onClick={() => (window.location.href = '/')}>
                  <span>Try Again</span>
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center p-4">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
