'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { LoginButton } from '@/components/auth/login-button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { authApi, ApiError } from '@/lib/api-client';
import { 
  ShieldCheck, 
  ShieldAlert, 
  LogOut, 
  Mail, 
  Calendar, 
  KeyRound, 
  Terminal, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  Lock
} from 'lucide-react';

function GithubIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export default function Home() {
  const { user, accessToken, isLoading, isAuthenticated, logout } = useAuth();
  const [adminTestStatus, setAdminTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    details?: string;
  }>({ loading: false });

  const handleTestAdminRoute = async () => {
    if (!accessToken) return;
    setAdminTestStatus({ loading: true });

    try {
      const response = await authApi.adminCheck(accessToken);
      setAdminTestStatus({
        loading: false,
        success: true,
        message: response.message,
        details: response.data,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setAdminTestStatus({
          loading: false,
          success: false,
          message: `${err.statusCode} ${err.errorCode || 'FORBIDDEN'}: ${err.message}`,
          details: err.details || 'Your current role does not grant access to this restricted route.',
        });
      } else {
        setAdminTestStatus({
          loading: false,
          success: false,
          message: 'Error testing admin route',
          details: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Initializing DevPilot Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
              <Terminal className="size-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">DevPilot</span>
            <Badge variant="outline" className="text-[10px] font-mono tracking-widest uppercase">
              Enterprise v1.0
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <ModeToggle />
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="gap-1.5 text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <LogOut className="size-4" />
                <span>Sign Out</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10 flex flex-col items-center justify-center">
        {!isAuthenticated ? (
          /* Unauthenticated Landing / Hero */
          <div className="max-w-2xl text-center space-y-8 py-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
              <Sparkles className="size-3.5" />
              <span>Full-Stack Spring Boot 4 + Next.js 16 Architecture</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                AI Coding Copilot & Automation Platform
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                Connect your GitHub account to access AI-powered code analysis, automated reviews, and repository management protected by enterprise JWT security.
              </p>
            </div>

            <div className="pt-2 flex flex-col items-center justify-center gap-3">
              <LoginButton />
              <p className="text-xs text-muted-foreground">
                Strict CSRF verification • AES-encrypted OAuth tokens • RBAC protection
              </p>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 text-left">
              <div className="p-4 rounded-xl border border-border/60 bg-card/50">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <GithubIcon className="size-4" />
                </div>
                <h3 className="text-sm font-semibold">GitHub OAuth 2.0</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Seamless authorization with verified primary email resolution.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-card/50">
                <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                  <KeyRound className="size-4" />
                </div>
                <h3 className="text-sm font-semibold">JWT & HttpOnly Cookies</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Stateless 15m access tokens & automatic 7d rotated refresh cookies.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-card/50">
                <div className="size-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 mb-2">
                  <Lock className="size-4" />
                </div>
                <h3 className="text-sm font-semibold">Role-Based Access (RBAC)</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Granular endpoint security powered by Spring Security Method Guards.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <div className="w-full max-w-3xl space-y-6">
            {/* User Profile Card */}
            <Card className="shadow-lg border-border/60 overflow-hidden">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar size="lg" className="size-14 border-2 border-primary/20">
                      <AvatarImage src={user?.avatarUrl || ''} alt={user?.displayName || 'User'} />
                      <AvatarFallback className="text-base font-bold">
                        {user?.displayName?.charAt(0) || user?.githubUsername?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        {user?.displayName}
                        <Badge variant={user?.role === 'ROLE_ADMIN' ? 'default' : 'secondary'} className="text-[11px]">
                          {user?.role}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 mt-0.5">
                        <GithubIcon className="size-3.5" />
                        <span>@{user?.githubUsername}</span>
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="size-3.5" />
                    <span>Session Active</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/40">
                    <Mail className="size-4 text-muted-foreground" />
                    <div className="overflow-hidden">
                      <p className="text-xs text-muted-foreground">Verified Email</p>
                      <p className="font-medium truncate">{user?.email || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/40">
                    <Calendar className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Member Since</p>
                      <p className="font-medium">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Token Preview */}
                <div className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium flex items-center gap-1 text-muted-foreground">
                      <KeyRound className="size-3.5" />
                      JWT Access Token (In-Memory)
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">15m Expiry</Badge>
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground truncate bg-background p-2 rounded border border-border/40">
                    {accessToken || 'No token active'}
                  </p>
                </div>
              </CardContent>

              {/* RBAC Verification Section */}
              <CardFooter className="flex flex-col items-start gap-3 border-t border-border/40 pt-4 bg-muted/10">
                <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <Lock className="size-4 text-primary" />
                      Role-Based Access Control (RBAC) Verification
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Test server-side authorization check against <code className="bg-muted px-1 py-0.5 rounded text-[11px]">/api/v1/auth/admin-check</code>
                    </p>
                  </div>

                  <Button
                    onClick={handleTestAdminRoute}
                    disabled={adminTestStatus.loading}
                    variant="outline"
                    size="sm"
                    className="cursor-pointer shrink-0"
                  >
                    {adminTestStatus.loading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>Test Admin Guard</span>
                    )}
                  </Button>
                </div>

                {/* Test Result Alert */}
                {adminTestStatus.message && (
                  <Alert
                    variant={adminTestStatus.success ? 'default' : 'destructive'}
                    className="w-full mt-2"
                  >
                    {adminTestStatus.success ? (
                      <ShieldCheck className="size-4 text-emerald-500" />
                    ) : (
                      <ShieldAlert className="size-4" />
                    )}
                    <AlertTitle className="text-xs font-semibold">
                      {adminTestStatus.message}
                    </AlertTitle>
                    {adminTestStatus.details && (
                      <AlertDescription className="text-xs mt-1">
                        {adminTestStatus.details}
                      </AlertDescription>
                    )}
                  </Alert>
                )}
              </CardFooter>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-4 text-center text-xs text-muted-foreground">
        <p>DevPilot Architecture • Spring Boot 4.1.1 + Next.js 16 • Secure GitHub OAuth 2.0</p>
      </footer>
    </div>
  );
}
