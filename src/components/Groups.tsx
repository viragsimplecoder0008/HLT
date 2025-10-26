import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';
import { Users, Plus, Crown, UserPlus, UserMinus, Ban, Shield, Edit2, Trophy, Check, X } from 'lucide-react';
import { apiRequest } from '../utils/api';

interface GroupsProps {
  accessToken: string;
  currentUserId: string;
}

export function Groups({ accessToken, currentUserId }: GroupsProps) {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupLeaderboard, setGroupLeaderboard] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Create group form
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  
  // Invite form
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  
  // Edit group form
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('daily');

  useEffect(() => {
    loadGroups();
    loadInvites();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupDetails(selectedGroup.id);
      loadGroupLeaderboard(selectedGroup.id, leaderboardPeriod);
    }
  }, [selectedGroup, leaderboardPeriod]);

  const loadGroups = async () => {
    try {
      const data = await apiRequest('/groups', { accessToken });
      setGroups(data.groups || []);
      if (data.groups && data.groups.length > 0 && !selectedGroup) {
        setSelectedGroup(data.groups[0]);
      }
    } catch (error: any) {
      // Only log/show error if it's not a 404 (groups endpoints might not be deployed yet)
      if (!error.message?.includes('404')) {
        console.error('Failed to load groups:', error);
        toast.error('Failed to load groups. Please try again.');
      }
    }
  };

  const loadInvites = async () => {
    try {
      const data = await apiRequest('/invites', { accessToken });
      setInvites(data.invites || []);
    } catch (error: any) {
      // Only log/show error if it's not a 404
      if (!error.message?.includes('404')) {
        console.error('Failed to load invites:', error);
        toast.error('Failed to load invites. Please try again.');
      }
    }
  };

  const loadGroupDetails = async (groupId: string) => {
    try {
      const data = await apiRequest(`/groups/${groupId}`, { accessToken });
      setGroupMembers(data.members || []);
      setIsAdmin(data.isAdmin || false);
    } catch (error: any) {
      console.error('Failed to load group details:', error);
      if (!error.message?.includes('404')) {
        toast.error('Failed to load group details.');
      }
    }
  };

  const loadGroupLeaderboard = async (groupId: string, period: string) => {
    try {
      const data = await apiRequest(`/groups/${groupId}/leaderboard?period=${period}`, { accessToken });
      setGroupLeaderboard(data.leaderboard || []);
    } catch (error: any) {
      console.error('Failed to load group leaderboard:', error);
      if (!error.message?.includes('404')) {
        toast.error('Failed to load leaderboard.');
      }
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await apiRequest('/groups', {
        method: 'POST',
        accessToken,
        body: { name: groupName, description: groupDescription }
      });

      toast.success(`Group "${groupName}" created!`);
      setCreateDialogOpen(false);
      setGroupName('');
      setGroupDescription('');
      loadGroups();
    } catch (error: any) {
      // Only show error if it's not a 404 (backend not deployed)
      if (!error.message?.includes('404')) {
        toast.error(error.message || 'Failed to create group');
      } else {
        toast.error('Groups feature requires backend deployment', {
          description: 'Run: supabase functions deploy make-server-8daf44f4'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest(`/groups/${selectedGroup.id}/invite`, {
        method: 'POST',
        accessToken,
        body: { username: inviteUsername }
      });

      toast.success(`Invited ${inviteUsername} to the group!`);
      setInviteDialogOpen(false);
      setInviteUsername('');
    } catch (error: any) {
      // Only show error if it's not a 404 (backend not deployed)
      if (!error.message?.includes('404')) {
        toast.error(error.message || 'Failed to invite user');
      } else {
        toast.error('Groups feature requires backend deployment');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle invite response - calls /accept or /decline endpoint
  const handleRespondToInvite = async (inviteId: string, action: 'accept' | 'reject') => {
    try {
      const endpoint = action === 'accept' ? 'accept' : 'decline';
      await apiRequest(`/invites/${inviteId}/${endpoint}`, {
        method: 'POST',
        accessToken
      });

      toast.success(action === 'accept' ? 'Joined group!' : 'Invite declined');
      loadInvites();
      loadGroups();
    } catch (error: any) {
      toast.error(error.message || 'Failed to respond to invite');
    }
  };

  const handleRemoveMember = async (userId: string, username: string) => {
    if (!confirm(`Remove ${username} from the group?`)) return;

    try {
      await apiRequest(`/groups/${selectedGroup.id}/members/${userId}`, {
        method: 'DELETE',
        accessToken
      });

      toast.success(`Removed ${username} from group`);
      loadGroupDetails(selectedGroup.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  const handleBanUser = async (userId: string, username: string) => {
    if (!confirm(`Ban ${username} from the group?`)) return;

    try {
      await apiRequest(`/groups/${selectedGroup.id}/ban/${userId}`, {
        method: 'POST',
        accessToken
      });

      toast.success(`Banned ${username} from group`);
      loadGroupDetails(selectedGroup.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to ban user');
    }
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest(`/groups/${selectedGroup.id}`, {
        method: 'PUT',
        accessToken,
        body: { name: editName, description: editDescription }
      });

      toast.success('Group updated!');
      setEditDialogOpen(false);
      loadGroups();
      loadGroupDetails(selectedGroup.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Invites */}
      {invites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h3 className="text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Pending Invites ({invites.length})
          </h3>
          {invites.map((invite) => (
            <Card key={invite.id} className="glass-card border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">
                      <span className="text-blue-400">{invite.inviterUsername}</span> invited you to join
                    </p>
                    <p className="text-xl text-white mt-1">{invite.groupName}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRespondToInvite(invite.id, 'accept')}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRespondToInvite(invite.id, 'reject')}
                      className="glass-card border-0"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Create Group Button */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full shadow-xl">
            <Plus className="w-4 h-4 mr-2" />
            Create New Group
          </Button>
        </DialogTrigger>
        <DialogContent className="glass-card border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Create a New Group</DialogTitle>
            <DialogDescription className="text-gray-400">
              Start a new group and invite members to join.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <Label htmlFor="groupName" className="text-white">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                required
              />
            </div>
            <div>
              <Label htmlFor="groupDescription" className="text-white">Description (Optional)</Label>
              <Input
                id="groupDescription"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="What's this group about?"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Group'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Backend Not Deployed Notice */}
      {groups.length === 0 && invites.length === 0 && (
        <Card className="glass-card border-0 shadow-xl">
          <CardContent className="pt-6 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-400">You're not in any groups yet.</p>
            <p className="text-sm text-gray-500 mt-2">Create a group or wait for an invite!</p>
            <p className="text-xs text-gray-600 mt-4">
              If you just added this feature, make sure to deploy the Edge Function:
              <code className="block mt-1 text-blue-400">supabase functions deploy make-server-8daf44f4</code>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Groups List */}
      {groups.length > 0 && (
        <>
          {/* Group Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {groups.map((group) => (
              <Button
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                variant={selectedGroup?.id === group.id ? 'default' : 'outline'}
                className={selectedGroup?.id === group.id ? '' : 'glass-card border-0'}
              >
                <Users className="w-4 h-4 mr-2" />
                {group.name}
              </Button>
            ))}
          </div>

          {/* Selected Group Details */}
          {selectedGroup && (
            <Card className="glass-card border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white flex items-center gap-2">
                      {selectedGroup.name}
                      {isAdmin && <Crown className="w-5 h-5 text-yellow-400" />}
                    </CardTitle>
                    {selectedGroup.description && (
                      <p className="text-gray-400 text-sm mt-1">{selectedGroup.description}</p>
                    )}
                    <Badge className="mt-2 glass-badge">
                      {groupMembers.length} {groupMembers.length === 1 ? 'Member' : 'Members'}
                    </Badge>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="glass-card border-0"
                            onClick={() => {
                              setEditName(selectedGroup.name);
                              setEditDescription(selectedGroup.description || '');
                            }}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card border-0 shadow-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-white">Edit Group</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Update your group's name and description.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleEditGroup} className="space-y-4">
                            <div>
                              <Label htmlFor="editName" className="text-white">Group Name</Label>
                              <Input
                                id="editName"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="editDescription" className="text-white">Description</Label>
                              <Input
                                id="editDescription"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                              />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                              {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <UserPlus className="w-4 h-4 mr-1" />
                            Invite
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card border-0 shadow-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-white">Invite User</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Enter a username to send them a group invitation.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleInviteUser} className="space-y-4">
                            <div>
                              <Label htmlFor="inviteUsername" className="text-white">Username</Label>
                              <Input
                                id="inviteUsername"
                                value={inviteUsername}
                                onChange={(e) => setInviteUsername(e.target.value)}
                                placeholder="Enter username..."
                                required
                              />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                              {isLoading ? 'Sending...' : 'Send Invite'}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={leaderboardPeriod} onValueChange={setLeaderboardPeriod}>
                  <TabsList className="glass-badge w-full grid grid-cols-2 mb-4">
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="leaderboard">
                      <Trophy className="w-4 h-4 mr-1" />
                      Leaderboard
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="members" className="space-y-3">
                    {groupMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 glass-badge rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <span className="text-white">
                              {member.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white flex items-center gap-2">
                              {member.username}
                              {selectedGroup.createdBy === member.id && (
                                <Crown className="w-4 h-4 text-yellow-400" />
                              )}
                              {member.id === currentUserId && (
                                <Badge variant="outline" className="text-xs">You</Badge>
                              )}
                            </p>
                            <p className="text-sm text-gray-400">
                              {member.totalPoints} total points
                            </p>
                          </div>
                        </div>
                        {isAdmin && member.id !== currentUserId && selectedGroup.createdBy !== member.id && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="glass-card border-0"
                              onClick={() => handleRemoveMember(member.id, member.username)}
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="glass-card border-0 text-red-400 hover:text-red-300"
                              onClick={() => handleBanUser(member.id, member.username)}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="leaderboard">
                    <div className="mb-4 flex gap-2">
                      {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
                        <Button
                          key={period}
                          size="sm"
                          variant={leaderboardPeriod === period ? 'default' : 'outline'}
                          onClick={() => setLeaderboardPeriod(period)}
                          className={leaderboardPeriod === period ? '' : 'glass-card border-0'}
                        >
                          {period.charAt(0).toUpperCase() + period.slice(1)}
                        </Button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {groupLeaderboard.length === 0 ? (
                        <p className="text-center text-gray-400 py-6">
                          No activity yet for this period
                        </p>
                      ) : (
                        groupLeaderboard.map((entry) => (
                          <div
                            key={entry.userId}
                            className="flex items-center justify-between p-3 glass-badge rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                                entry.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                                entry.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                                'bg-gradient-to-br from-slate-600 to-slate-800'
                              }`}>
                                <span className="text-white">#{entry.rank}</span>
                              </div>
                              <div>
                                <p className="text-white">{entry.username}</p>
                                <p className="text-sm text-gray-400">{entry.points} points</p>
                              </div>
                            </div>
                            {entry.rank <= 3 && (
                              <Trophy className={`w-5 h-5 ${
                                entry.rank === 1 ? 'text-yellow-400' :
                                entry.rank === 2 ? 'text-gray-300' :
                                'text-amber-600'
                              }`} />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
