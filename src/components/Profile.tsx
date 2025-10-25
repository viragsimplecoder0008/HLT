import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  User, 
  TrendingUp, 
  Heart, 
  BookOpen, 
  ThumbsUp, 
  Calendar,
  Award,
  Target
} from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileProps {
  accessToken: string;
  user: any;
  onSignOut: () => void;
}

interface Stats {
  totalPoints: number;
  totalCheckins: number;
  totalHelps: number;
  totalLearns: number;
  totalThanks: number;
  lastCheckin: string | null;
}

export function Profile({ accessToken, user, onSignOut }: ProfileProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(
        `https://fitjjtmovmhgsuqcxbwl.supabase.co/functions/v1/make-server-8daf44f4/profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadges = () => {
    const badges = [];
    
    if (stats) {
      if (stats.totalCheckins >= 7) badges.push({ name: 'Week Warrior', icon: '🔥' });
      if (stats.totalCheckins >= 30) badges.push({ name: '30-Day Champion', icon: '🏆' });
      if (stats.totalHelps >= 10) badges.push({ name: 'Helper Hero', icon: '❤️' });
      if (stats.totalLearns >= 10) badges.push({ name: 'Knowledge Seeker', icon: '📚' });
      if (stats.totalThanks >= 10) badges.push({ name: 'Gratitude Master', icon: '🙏' });
      if (stats.totalPoints >= 50) badges.push({ name: 'Point Collector', icon: '⭐' });
    }
    
    return badges;
  };

  const badges = getBadges();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <Card className="glass-gradient text-white border-2 border-white/30 shadow-xl">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 border-4 border-white/50 shadow-lg">
              <AvatarFallback className="bg-white text-blue-600 text-2xl">
                {user?.username?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl mb-1">{user?.username || 'User'}</h2>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm opacity-90">
                  {stats?.totalPoints || 0} Total Points
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card border-2">
            <CardContent className="pt-6 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl mb-1 dark:text-white">{stats?.totalCheckins || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Check-ins</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card border-2">
            <CardContent className="pt-6 text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl mb-1 dark:text-white">{stats?.totalHelps || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Times Helped</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card border-2">
            <CardContent className="pt-6 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl mb-1 dark:text-white">{stats?.totalLearns || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Things Learned</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card border-2">
            <CardContent className="pt-6 text-center">
              <ThumbsUp className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl mb-1 dark:text-white">{stats?.totalThanks || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Times Thanked</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Progress Tracker */}
      <Card className="glass-card border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
            <Target className="w-5 h-5" />
            Monthly Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Help Others</span>
              <span className="dark:text-white">{stats?.totalHelps || 0}/30</span>
            </div>
            <Progress value={((stats?.totalHelps || 0) / 30) * 100} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Learn New Things</span>
              <span className="dark:text-white">{stats?.totalLearns || 0}/30</span>
            </div>
            <Progress value={((stats?.totalLearns || 0) / 30) * 100} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Show Gratitude</span>
              <span className="dark:text-white">{stats?.totalThanks || 0}/30</span>
            </div>
            <Progress value={((stats?.totalThanks || 0) / 30) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      {badges.length > 0 && (
        <Card className="glass-card border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
              <Award className="w-5 h-5" />
              Your Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {badges.map((badge, index) => (
                <motion.div
                  key={badge.name}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.1, type: 'spring' }}
                >
                  <Badge 
                    variant="outline" 
                    className="w-full justify-start gap-2 py-2 px-3 glass-gradient border-yellow-300 dark:border-yellow-500 text-white"
                  >
                    <span className="text-lg">{badge.icon}</span>
                    <span className="text-sm">{badge.name}</span>
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Check-in */}
      {stats?.lastCheckin && (
        <Card className="glass-card border-2">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Last check-in</p>
            <p className="text-blue-600 dark:text-blue-400">{stats.lastCheckin}</p>
          </CardContent>
        </Card>
      )}

      {/* Sign Out Button */}
      <Button 
        variant="outline" 
        className="w-full glass-card hover:scale-[1.02] transition-transform"
        onClick={onSignOut}
      >
        Sign Out
      </Button>
    </div>
  );
}
