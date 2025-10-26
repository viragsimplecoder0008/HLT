import { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { DailyCheckIn } from './components/DailyCheckIn';
import { Leaderboard } from './components/Leaderboard';
import { Profile } from './components/Profile';
import { Toaster } from './components/ui/sonner';
import { Home, Trophy, User, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from './hooks/useTheme';
import { checkBackendHealth } from './utils/api';
import { projectId } from './utils/supabase/info';
import logoImage from 'figma:asset/6d8f4ca8453fef395dae5295369d777acb49f1cc.png';

type Tab = 'home' | 'leaderboard' | 'profile';

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [refreshKey, setRefreshKey] = useState(0);
  useTheme(); // Always apply dark mode
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    // Try to restore session from localStorage
    const storedToken = localStorage.getItem('hlt_access_token');
    const storedUser = localStorage.getItem('hlt_user');
    
    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    // Check backend health
    checkBackendHealth().then(setBackendHealthy);
  }, []);

  useEffect(() => {
    // Track mouse position for cursor-following gradient
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleAuthSuccess = (token: string, userData: any) => {
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem('hlt_access_token', token);
    localStorage.setItem('hlt_user', JSON.stringify(userData));
  };

  const handleSignOut = () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('hlt_access_token');
    localStorage.removeItem('hlt_user');
    setActiveTab('home');
  };

  const handleCheckInComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!accessToken || !user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 transition-colors relative overflow-hidden">
      {/* Animated background glass orbs for depth */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-green-400/20 to-emerald-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      {/* Cursor-following gradient orb */}
      <div 
        className="fixed w-[450px] h-[450px] bg-gradient-to-br from-yellow-400/15 to-amber-600/8 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ease-out" 
        style={{ 
          left: `${mousePosition.x}px`, 
          top: `${mousePosition.y}px`
        }} 
      />
      
      <Toaster />
      
      {/* Backend Warning Banner */}
      {backendHealthy === false && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 shadow-lg"
        >
          <div className="max-w-2xl mx-auto flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Backend Not Deployed</p>
              <p className="text-sm text-white/90 mt-1">
                The Edge Function hasn't been deployed yet. Run these commands:
              </p>
              <code className="block mt-2 text-xs bg-black/20 p-2 rounded font-mono">
                supabase link --project-ref {projectId}<br/>
                supabase functions deploy make-server-8daf44f4
              </code>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Header */}
      <header className="glass-panel sticky top-0 z-10 border-b-0" style={{ marginTop: backendHealthy === false ? '140px' : '0' }}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden">
                <img 
                  src={logoImage} 
                  alt="HLT Logo" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div>
                <h1 className="text-white">Help, Learn, Thank</h1>
                <p className="text-sm text-gray-400">Build positive habits daily</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {activeTab === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl mb-2 text-white">Welcome back, {user.username}! 👋</h2>
              <p className="text-gray-400">How did you make today meaningful?</p>
            </div>
            <DailyCheckIn 
              key={refreshKey}
              accessToken={accessToken} 
              onCheckInComplete={handleCheckInComplete}
            />
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl mb-2 text-white">Leaderboard 🏆</h2>
              <p className="text-gray-400">See who's making the most impact</p>
            </div>
            <Leaderboard accessToken={accessToken} />
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl mb-2 text-white">Your Profile 👤</h2>
              <p className="text-gray-400">Track your journey and achievements</p>
            </div>
            <Profile 
              accessToken={accessToken} 
              user={user}
              onSignOut={handleSignOut}
            />
          </motion.div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-panel border-t-0 shadow-2xl">
        <div className="max-w-2xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-2 py-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all duration-300 ${
                activeTab === 'home'
                  ? 'glass-button text-blue-400 scale-105 shadow-lg'
                  : 'text-gray-400 hover:text-gray-200 hover:glass-badge'
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all duration-300 ${
                activeTab === 'leaderboard'
                  ? 'glass-button text-blue-400 scale-105 shadow-lg'
                  : 'text-gray-400 hover:text-gray-200 hover:glass-badge'
              }`}
            >
              <Trophy className="w-6 h-6" />
              <span className="text-xs">Leaderboard</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all duration-300 ${
                activeTab === 'profile'
                  ? 'glass-button text-blue-400 scale-105 shadow-lg'
                  : 'text-gray-400 hover:text-gray-200 hover:glass-badge'
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
