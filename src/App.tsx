import { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { DailyCheckIn } from './components/DailyCheckIn';
import { Leaderboard } from './components/Leaderboard';
import { Profile } from './components/Profile';
import { Toaster } from './components/ui/sonner';
import { Home, Trophy, User, Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from './hooks/useTheme';

type Tab = 'home' | 'leaderboard' | 'profile';

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [refreshKey, setRefreshKey] = useState(0);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Try to restore session from localStorage
    const storedToken = localStorage.getItem('hlt_access_token');
    const storedUser = localStorage.getItem('hlt_user');
    
    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
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
    return <AuthScreen onAuthSuccess={handleAuthSuccess} theme={theme} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors">
      <Toaster />
      
      {/* Header */}
      <header className="glass sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 glass-gradient rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white">HLT</span>
              </div>
              <div>
                <h1 className="text-xl dark:text-white">Help, Learn, Thank</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Build positive habits daily</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full glass-card hover:scale-110 transition-transform"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>
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
              <h2 className="text-2xl mb-2 dark:text-white">Welcome back, {user.username}! 👋</h2>
              <p className="text-gray-600 dark:text-gray-400">How did you make today meaningful?</p>
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
              <h2 className="text-2xl mb-2 dark:text-white">Leaderboard 🏆</h2>
              <p className="text-gray-600 dark:text-gray-400">See who's making the most impact</p>
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
              <h2 className="text-2xl mb-2 dark:text-white">Your Profile 👤</h2>
              <p className="text-gray-600 dark:text-gray-400">Track your journey and achievements</p>
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
      <nav className="fixed bottom-0 left-0 right-0 glass shadow-lg">
        <div className="max-w-2xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 py-3 transition-all ${
                activeTab === 'home'
                  ? 'text-blue-600 dark:text-blue-400 scale-105'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex flex-col items-center gap-1 py-3 transition-all ${
                activeTab === 'leaderboard'
                  ? 'text-blue-600 dark:text-blue-400 scale-105'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Trophy className="w-6 h-6" />
              <span className="text-xs">Leaderboard</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 py-3 transition-all ${
                activeTab === 'profile'
                  ? 'text-blue-600 dark:text-blue-400 scale-105'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
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
