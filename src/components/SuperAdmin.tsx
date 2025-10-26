import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';
import { 
  Shield, 
  Users, 
  Trash2, 
  Trophy, 
  Database,
  Search,
  UserX,
  Edit2
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface SuperAdminProps {
  accessToken: string;
}

export function SuperAdmin({ accessToken }: SuperAdminProps) {
  const [unifiedLeaderboard, setUnifiedLeaderboard] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [allCheckins, setAllCheckins] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'user' | 'group', id: string, name: string } | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGroups: 0,
    totalCheckins: 0,
    totalEntries: 0
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      await Promise.all([
        loadUnifiedLeaderboard(),
        loadUsers(),
        loadGroups(),
        loadCheckins()
      ]);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const loadUnifiedLeaderboard = async () => {
    try {
      const data = await apiRequest('/superadmin/unified-leaderboard', { accessToken });
      setUnifiedLeaderboard(data.leaderboard || []);
      setStats(prev => ({ 
        ...prev, 
        totalUsers: data.totalUsers || 0,
        totalEntries: data.totalEntries || 0
      }));
    } catch (error: any) {
      console.error('Failed to load unified leaderboard:', error);
      if (!error.message?.includes('404') && !error.message?.includes('403')) {
        toast.error(error.message || 'Failed to load unified leaderboard');
      }
    }
  };

  const loadUsers = async () => {
    try {
      const data = await apiRequest('/superadmin/users', { accessToken });
      setAllUsers(data.users || []);
      setStats(prev => ({ ...prev, totalUsers: data.users?.length || 0 }));
    } catch (error: any) {
      console.error('Failed to load users:', error);
      if (!error.message?.includes('404') && !error.message?.includes('403')) {
        toast.error(error.message || 'Failed to load users');
      }
    }
  };

  const loadGroups = async () => {
    try {
      const data = await apiRequest('/superadmin/groups', { accessToken });
      setAllGroups(data.groups || []);
      setStats(prev => ({ ...prev, totalGroups: data.groups?.length || 0 }));
    } catch (error: any) {
      console.error('Failed to load groups:', error);
      if (!error.message?.includes('404') && !error.message?.includes('403')) {
        toast.error(error.message || 'Failed to load groups');
      }
    }
  };

  const loadCheckins = async () => {
    try {
      const data = await apiRequest('/superadmin/checkins', { accessToken });
      setAllCheckins(data.checkins || []);
      setStats(prev => ({ ...prev, totalCheckins: data.checkins?.length || 0 }));
    } catch (error: any) {
      console.error('Failed to load check-ins:', error);
      if (!error.message?.includes('404') && !error.message?.includes('403')) {
        toast.error(error.message || 'Failed to load check-ins');
      }
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget || deleteTarget.type !== 'user') return;

    try {
      await apiRequest(`/superadmin/users/${deleteTarget.id}`, {
        method: 'DELETE',
        accessToken
      });

      toast.success(`User "${deleteTarget.name}" deleted`);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      loadAllData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteTarget || deleteTarget.type !== 'group') return;

    try {
      await apiRequest(`/superadmin/groups/${deleteTarget.id}`, {
        method: 'DELETE',
        accessToken
      });

      toast.success(`Group "${deleteTarget.name}" deleted`);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      loadAllData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete group');
    }
  };

  const confirmDelete = (type: 'user' | 'group', id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const filteredLeaderboard = unifiedLeaderboard.filter(entry =>
    entry.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.groupName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = allUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = allGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* SuperAdmin Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card border-0 shadow-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-yellow-400" />
          <div>
            <h2 className="text-2xl text-white">SuperAdmin Dashboard</h2>
            <p className="text-gray-400 text-sm">Full system access and control</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-badge p-3 rounded-xl">
            <Users className="w-5 h-5 text-blue-400 mb-1" />
            <p className="text-2xl text-white">{stats.totalUsers}</p>
            <p className="text-xs text-gray-400">Total Users</p>
          </div>
          <div className="glass-badge p-3 rounded-xl">
            <Users className="w-5 h-5 text-green-400 mb-1" />
            <p className="text-2xl text-white">{stats.totalGroups}</p>
            <p className="text-xs text-gray-400">Total Groups</p>
          </div>
          <div className="glass-badge p-3 rounded-xl">
            <Database className="w-5 h-5 text-purple-400 mb-1" />
            <p className="text-2xl text-white">{stats.totalCheckins}</p>
            <p className="text-xs text-gray-400">Total Check-ins</p>
          </div>
          <div className="glass-badge p-3 rounded-xl">
            <Trophy className="w-5 h-5 text-yellow-400 mb-1" />
            <p className="text-2xl text-white">{stats.totalEntries}</p>
            <p className="text-xs text-gray-400">Leaderboard Entries</p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search users, groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Card className="glass-card border-0 shadow-xl">
        <CardContent className="pt-6">
          <Tabs defaultValue="leaderboard">
            <TabsList className="glass-badge w-full grid grid-cols-4 mb-6">
              <TabsTrigger value="leaderboard">
                <Trophy className="w-4 h-4 mr-1" />
                Unified
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="w-4 h-4 mr-1" />
                Users
              </TabsTrigger>
              <TabsTrigger value="groups">
                <Users className="w-4 h-4 mr-1" />
                Groups
              </TabsTrigger>
              <TabsTrigger value="checkins">
                <Database className="w-4 h-4 mr-1" />
                Check-ins
              </TabsTrigger>
            </TabsList>

            {/* Unified Leaderboard */}
            <TabsContent value="leaderboard" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white">Unified Leaderboard</h3>
                <Button size="sm" onClick={loadUnifiedLeaderboard}>
                  Refresh
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/10">
                      <TableHead className="text-gray-400">Username</TableHead>
                      <TableHead className="text-gray-400">Group</TableHead>
                      <TableHead className="text-gray-400 text-right">Points</TableHead>
                      <TableHead className="text-gray-400 text-right">Day</TableHead>
                      <TableHead className="text-gray-400 text-right">Week</TableHead>
                      <TableHead className="text-gray-400 text-right">Month</TableHead>
                      <TableHead className="text-gray-400 text-right">Year</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeaderboard.map((entry, index) => (
                      <TableRow key={index} className="border-b border-white/5">
                        <TableCell className="text-white">{entry.username}</TableCell>
                        <TableCell className="text-gray-400">{entry.groupName}</TableCell>
                        <TableCell className="text-white text-right">{entry.points}</TableCell>
                        <TableCell className="text-gray-400 text-right">{entry.dayPoints}</TableCell>
                        <TableCell className="text-gray-400 text-right">{entry.weekPoints}</TableCell>
                        <TableCell className="text-gray-400 text-right">{entry.monthPoints}</TableCell>
                        <TableCell className="text-gray-400 text-right">{entry.yearPoints}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredLeaderboard.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No data found</p>
                )}
              </div>
            </TabsContent>

            {/* Users */}
            <TabsContent value="users" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white">All Users ({filteredUsers.length})</h3>
                <Button size="sm" onClick={loadUsers}>
                  Refresh
                </Button>
              </div>

              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 glass-badge rounded-xl"
                  >
                    <div>
                      <p className="text-white flex items-center gap-2">
                        {user.username}
                        {user.isSuperAdmin && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-0">
                            <Shield className="w-3 h-3 mr-1" />
                            SuperAdmin
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-gray-400">
                        {user.totalPoints || 0} total points • Created {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!user.isSuperAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="glass-card border-0 text-red-400 hover:text-red-300"
                        onClick={() => confirmDelete('user', user.id, user.username)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No users found</p>
                )}
              </div>
            </TabsContent>

            {/* Groups */}
            <TabsContent value="groups" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white">All Groups ({filteredGroups.length})</h3>
                <Button size="sm" onClick={loadGroups}>
                  Refresh
                </Button>
              </div>

              <div className="space-y-2">
                {filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-4 glass-badge rounded-xl"
                  >
                    <div>
                      <p className="text-white">{group.name}</p>
                      <p className="text-sm text-gray-400">
                        {group.members?.length || 0} members • Created {new Date(group.createdAt).toLocaleDateString()}
                      </p>
                      {group.description && (
                        <p className="text-xs text-gray-500 mt-1">{group.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="glass-card border-0 text-red-400 hover:text-red-300"
                      onClick={() => confirmDelete('group', group.id, group.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {filteredGroups.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No groups found</p>
                )}
              </div>
            </TabsContent>

            {/* Check-ins */}
            <TabsContent value="checkins" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white">All Check-ins ({allCheckins.length})</h3>
                <Button size="sm" onClick={loadCheckins}>
                  Refresh
                </Button>
              </div>

              <div className="space-y-2">
                {allCheckins.slice(0, 50).map((checkin, index) => (
                  <div
                    key={index}
                    className="p-4 glass-badge rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white">{checkin.username}</p>
                      <Badge className="glass-badge">
                        {checkin.points} points
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      {new Date(checkin.date).toLocaleDateString()}
                    </p>
                    <div className="space-y-1 text-sm">
                      {checkin.help && (
                        <p className="text-gray-300">
                          <span className="text-blue-400">Help:</span> {checkin.help}
                        </p>
                      )}
                      {checkin.learn && (
                        <p className="text-gray-300">
                          <span className="text-green-400">Learn:</span> {checkin.learn}
                        </p>
                      )}
                      {checkin.thank && (
                        <p className="text-gray-300">
                          <span className="text-yellow-400">Thank:</span> {checkin.thank}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {allCheckins.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No check-ins found</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-card border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete {deleteTarget?.type === 'user' ? 'User' : 'Group'}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass-card border-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteTarget?.type === 'user' ? handleDeleteUser : handleDeleteGroup}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
