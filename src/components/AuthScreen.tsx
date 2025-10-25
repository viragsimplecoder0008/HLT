import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Moon, Sun } from 'lucide-react';
import type { Theme } from '../hooks/useTheme';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import logoImage from 'figma:asset/6d8f4ca8453fef395dae5295369d777acb49f1cc.png';

interface AuthScreenProps {
  onAuthSuccess: (accessToken: string, user: any) => void;
  theme: Theme;
  toggleTheme: () => void;
}

export function AuthScreen({ onAuthSuccess, theme, toggleTheme }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Sign up state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  
  // Sign in state
  const [signinUsername, setSigninUsername] = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  useEffect(() => {
    // Track mouse position for cursor-following gradient
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting signup...', { username: signupUsername });
      
      const signupUrl = `https://${projectId}.supabase.co/functions/v1/make-server-8daf44f4/signup`;
      console.log('Signup URL:', signupUrl);
      
      const response = await fetch(signupUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          username: signupUsername,
          password: signupPassword
        })
      });

      console.log('Signup response status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error('Signup error response:', text);
        try {
          const data = JSON.parse(text);
          setError(data.error || 'Signup failed');
        } catch {
          setError(`Signup failed: ${response.status} ${response.statusText}`);
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Signup successful');

      // Now sign in with the new credentials
      const signinUrl = `https://${projectId}.supabase.co/functions/v1/make-server-8daf44f4/signin`;
      const signinResponse = await fetch(signinUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          username: signupUsername,
          password: signupPassword
        })
      });

      if (!signinResponse.ok) {
        const text = await signinResponse.text();
        console.error('Auto-signin error response:', text);
        try {
          const signinData = JSON.parse(text);
          setError(signinData.error || 'Auto-signin failed. Please try signing in manually.');
        } catch {
          setError('Auto-signin failed. Please try signing in manually.');
        }
        setIsLoading(false);
        return;
      }

      const signinData = await signinResponse.json();
      console.log('Auto-signin successful');

      onAuthSuccess(signinData.accessToken, signinData.user);
    } catch (err) {
      console.error('Signup error:', err);
      setError(`Connection error: ${err instanceof Error ? err.message : 'Unable to connect to server. Please check if the backend is deployed.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting signin...', { username: signinUsername });
      
      const signinUrl = `https://${projectId}.supabase.co/functions/v1/make-server-8daf44f4/signin`;
      console.log('Signin URL:', signinUrl);
      
      const response = await fetch(signinUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          username: signinUsername,
          password: signinPassword
        })
      });

      console.log('Signin response status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error('Signin error response:', text);
        try {
          const data = JSON.parse(text);
          setError(data.error || 'Signin failed');
        } catch {
          setError(`Signin failed: ${response.status} ${response.statusText}`);
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Signin successful');

      onAuthSuccess(data.accessToken, data.user);
    } catch (err) {
      console.error('Signin error:', err);
      setError(`Connection error: ${err instanceof Error ? err.message : 'Unable to connect to server. Please check if the backend is deployed.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 transition-colors relative overflow-hidden">
      {/* Animated decorative glass orbs creating depth */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-400/25 to-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-green-400/25 to-emerald-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      {/* Cursor-following gradient orb */}
      <div 
        className="absolute w-[500px] h-[500px] bg-gradient-to-br from-yellow-400/15 to-amber-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ease-out" 
        style={{ 
          left: `${mousePosition.x}px`, 
          top: `${mousePosition.y}px`
        }} 
      />
      
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 glass-button rounded-full hover:scale-110 transition-all z-10 shadow-lg"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="w-6 h-6 text-yellow-400" />
        ) : (
          <Moon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        )}
      </button>

      <Card className="w-full max-w-md glass-card border-0 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="mx-auto w-40 h-40 flex items-center justify-center mb-3 relative overflow-hidden rounded-full">
            <img 
              src={logoImage} 
              alt="HLT Logo" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <CardTitle className="dark:text-white">Help, Learn, Thank</CardTitle>
          <CardDescription className="dark:text-gray-300">
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
                  <div className="glass-card border-red-200 dark:border-red-900 p-3 space-y-1">
                    <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
                    {error.includes('connect') && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        The backend server may not be deployed. Please check your Supabase Edge Functions.
                      </div>
                    )}
                  </div>
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
                  <div className="glass-card border-red-200 dark:border-red-900 p-3 space-y-1">
                    <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
                    {error.includes('connect') && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        The backend server may not be deployed. Please check your Supabase Edge Functions.
                      </div>
                    )}
                  </div>
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
