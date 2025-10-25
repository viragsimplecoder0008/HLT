import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { motion } from 'motion/react';

interface LeaderboardProps {
  accessToken: string;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  points: number;
  rank: number;
}

export function Leaderboard({ accessToken }: LeaderboardProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://fitjjtmovmhgsuqcxbwl.supabase.co/functions/v1/make-server-8daf44f4/leaderboard?period=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();
      setLeaderboardData(data.leaderboard || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-700" />;
      default:
        return <span className="w-6 text-center text-gray-500">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 2:
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 3:
        return 'bg-amber-100 text-amber-700 border-amber-300';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getPeriodTitle = () => {
    switch (period) {
      case 'daily':
        return 'Today\'s Leaders';
      case 'weekly':
        return 'This Week\'s Leaders';
      case 'monthly':
        return 'This Month\'s Leaders';
      case 'yearly':
        return 'This Year\'s Leaders';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass-card">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="mt-6">
          <Card className="glass-card border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Trophy className="w-5 h-5 text-yellow-500" />
                {getPeriodTitle()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
              ) : leaderboardData.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No data yet. Be the first to check in!
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboardData.map((entry, index) => (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                          entry.rank <= 3
                            ? 'glass-gradient border-yellow-300 dark:border-yellow-500'
                            : 'glass-input border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {getRankIcon(entry.rank)}
                        </div>
                        
                        <Avatar className="flex-shrink-0 border-2 border-white/30">
                          <AvatarFallback className="glass-gradient text-white">
                            {entry.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <p className="truncate dark:text-white">{entry.username}</p>
                          {entry.rank === 1 && (
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">🏆 Champion</p>
                          )}
                        </div>
                        
                        <Badge variant="outline" className={getRankBadgeColor(entry.rank)}>
                          {entry.points} {entry.points === 1 ? 'point' : 'points'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="glass-gradient border-2 border-white/30">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-white">
              Keep checking in daily to climb the leaderboard!
            </p>
            <p className="text-xs text-white/80">
              Points reset at the start of each period
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
