import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../hooks/use-auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, completeNewPassword, pendingChallenge } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/upload';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(email, password);
      // If no challenge, login succeeded - navigate away
      // If challenge, pendingChallenge will be set and UI will update
      if (!pendingChallenge) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleNewPassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      await completeNewPassword(newPassword);
      navigate(from, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set new password';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show new password form if challenge is pending
  if (pendingChallenge === 'NEW_PASSWORD_REQUIRED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary">NoComelon</h1>
            <p className="text-muted-foreground mt-2">Create a new password</p>
          </div>

          <form onSubmit={handleNewPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isSubmitting}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                8+ characters, uppercase, lowercase, and numbers
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isSubmitting}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting password...
                </>
              ) : (
                'Set New Password'
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">NoComelon</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isSubmitting}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          Need an account? Contact{' '}
          <a href="mailto:mohammed.misran@pitt.edu" className="text-primary hover:underline">
            mohammed.misran@pitt.edu
          </a>
        </p>
      </div>
    </div>
  );
}
