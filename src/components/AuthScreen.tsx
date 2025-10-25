import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Moon, Sun } from 'lucide-react';
import type { Theme } from '../hooks/useTheme';

interface AuthScreenProps {
  onAuthSuccess: (accessToken: string, user: any) => void;
  theme: Theme;
  toggleTheme: () => void;
}

export function AuthScreen({ onAuthSuccess, theme, toggleTheme }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Sign up state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  
  // Sign in state
  const [signinUsername, setSigninUsername] = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://fitjjtmovmhgsuqcxbwl.supabase.co/functions/v1/make-server-8daf44f4/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpdGpqdG1vdm1oZ3N1cWN4YndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNjgxMDgsImV4cCI6MjA3Njk0NDEwOH0.cYMfQaJ-p90UJm3zY5NTo7L2r4uoe9brJS0xUjiGMcA`
          },
          body: JSON.stringify({
            username: signupUsername,
            password: signupPassword
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setIsLoading(false);
        return;
      }

      // Now sign in with the new credentials
      const signinResponse = await fetch(
        `https://fitjjtmovmhgsuqcxbwl.supabase.co/functions/v1/make-server-8daf44f4/signin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpdGpqdG1vdm1oZ3N1cWN4YndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNjgxMDgsImV4cCI6MjA3Njk0NDEwOH0.cYMfQaJ-p90UJm3zY5NTo7L2r4uoe9brJS0xUjiGMcA`
          },
          body: JSON.stringify({
            username: signupUsername,
            password: signupPassword
          })
        }
      );

      const signinData = await signinResponse.json();

      if (!signinResponse.ok) {
        setError(signinData.error || 'Auto-signin failed');
        setIsLoading(false);
        return;
      }

      onAuthSuccess(signinData.accessToken, signinData.user);
    } catch (err) {
      console.error('Signup error:', err);
      setError('An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://fitjjtmovmhgsuqcxbwl.supabase.co/functions/v1/make-server-8daf44f4/signin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpdGpqdG1vdm1oZ3N1cWN4YndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNjgxMDgsImV4cCI6MjA3Njk0NDEwOH0.cYMfQaJ-p90UJm3zY5NTo7L2r4uoe9brJS0xUjiGMcA`
          },
          body: JSON.stringify({
            username: signinUsername,
            password: signinPassword
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signin failed');
        setIsLoading(false);
        return;
      }

      onAuthSuccess(data.accessToken, data.user);
    } catch (err) {
      console.error('Signin error:', err);
      setError('An error occurred during signin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 transition-colors relative">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-3 glass-card rounded-full hover:scale-110 transition-transform z-10"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="w-6 h-6 text-yellow-500" />
        ) : (
          <Moon className="w-6 h-6 text-slate-700" />
        )}
      </button>

      <Card className="w-full max-w-md glass-card border-2">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 glass-gradient rounded-full flex items-center justify-center mb-2 shadow-xl">
            <span className="text-white text-2xl">HLT</span>
          </div>
          <CardTitle className="text-3xl dark:text-white">Help, Learn, Thank</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Build positive daily habits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-username">Username</Label>
                  <Input
                    id="signin-username"
                    type="text"
                    placeholder="Enter your username"
                    value={signinUsername}
                    onChange={(e) => setSigninUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="Choose a username"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Choose a password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
