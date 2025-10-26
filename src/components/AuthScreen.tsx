import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { checkBackendHealth } from '../utils/api';

interface AuthScreenProps {
  onAuthSuccess: (accessToken: string, user: any) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  
  // Sign up state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  
  // Sign in state
  const [signinUsername, setSigninUsername] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  
  // Role selection state
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [pendingAuthData, setPendingAuthData] = useState<any>(null);

  useEffect(() => {
    // Track mouse position for cursor-following gradient
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Check backend health
    checkBackendHealth().then(setBackendHealthy);
    
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
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('⚠️ Backend not deployed. Please deploy the Edge Function first. See deployment instructions above.');
      } else {
        setError(`Connection error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignin = async (e: React.FormEvent, selectedRole?: string) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting signin...', { username: signinUsername, role: selectedRole });
      
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
          password: signinPassword,
          role: selectedRole
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
      console.log('Signin successful', data);

      // Check if role selection is needed
      if (data.needsRoleSelection && !selectedRole) {
        console.log('Role selection needed', data.availableRoles);
        setShowRoleSelection(true);
        setAvailableRoles(data.availableRoles);
        setPendingAuthData(data);
        setIsLoading(false);
        return;
      }

      onAuthSuccess(data.accessToken, { ...data.user, selectedRole: data.selectedRole || 'user' });
    } catch (err) {
      console.error('Signin error:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('⚠️ Backend not deployed. Please deploy the Edge Function first. See deployment instructions above.');
      } else {
        setError(`Connection error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelection = (role: string) => {
    setShowRoleSelection(false);
    onAuthSuccess(pendingAuthData.accessToken, { ...pendingAuthData.user, selectedRole: role });
  };

  // Role selection screen
  if (showRoleSelection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <Card className="w-full max-w-md glass-card border-0 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl">Select Your Role</CardTitle>
            <CardDescription className="text-gray-400">
              Choose how you want to sign in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableRoles.map((role) => (
              <Button
                key={role}
                onClick={() => handleRoleSelection(role)}
                className={`w-full h-20 ${
                  role === 'superadmin' 
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' 
                    : 'glass-button'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  {role === 'superadmin' && (
                    <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  )}
                  {role === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-blue-400/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-lg capitalize">{role}</p>
                    <p className="text-sm text-gray-300">
                      {role === 'superadmin' ? 'Full system access' : 'Regular user access'}
                    </p>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 transition-colors relative overflow-hidden">
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

      <Card className="w-full max-w-md glass-card border-0 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="mx-auto w-40 h-40 flex items-center justify-center mb-3 relative overflow-hidden rounded-full bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
            <div className="relative z-10 flex items-center justify-center w-full h-full">
              <span className="text-6xl font-bold text-white">HLT</span>
            </div>
          </div>
          <CardTitle className="text-white">Help, Learn, Thank</CardTitle>
          <CardDescription className="text-gray-300">
            Build positive daily habits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Backend warning */}
          {backendHealthy === false && (
            <Alert className="mb-4 bg-amber-500/20 border-amber-500/50 text-amber-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Backend Not Deployed</strong><br/>
                Run these commands to deploy:
                <code className="block mt-2 text-xs bg-black/30 p-2 rounded font-mono">
                  supabase link --project-ref {projectId}<br/>
                  supabase functions deploy make-server-8daf44f4
                </code>
              </AlertDescription>
            </Alert>
          )}
          
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
                  <div className="glass-card border-red-900 p-3 space-y-1">
                    <div className="text-red-400 text-sm">{error}</div>
                    {error.includes('connect') && (
                      <div className="text-xs text-gray-400">
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
                  <div className="glass-card border-red-900 p-3 space-y-1">
                    <div className="text-red-400 text-sm">{error}</div>
                    {error.includes('connect') && (
                      <div className="text-xs text-gray-400">
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
