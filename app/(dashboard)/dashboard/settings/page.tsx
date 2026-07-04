'use client';

import { useState } from 'react';
import {
  Settings, User, Shield, Bell, Trash2, Loader2, AlertCircle, Lock, Eye, EyeOff, CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user, signOut, setupPassword } = useAuth();
  const { toast } = useToast();

  const [deleting, setDeleting] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdChanged, setPwdChanged] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ variant: 'destructive', description: 'Password must be at least 8 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', description: 'Passwords do not match' });
      return;
    }
    if (!user?.email) return;

    setChangingPwd(true);
    try {
      const result = await setupPassword(user.email, newPassword);
      if (result.success) {
        setPwdChanged(true);
        setNewPassword('');
        setConfirmPassword('');
        toast({ description: 'Password updated successfully' });
        setTimeout(() => setPwdChanged(false), 3000);
      } else {
        toast({ variant: 'destructive', description: result.error || 'Failed to update password' });
      }
    } finally {
      setChangingPwd(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await signOut();
      toast({ description: 'Signed out. Contact support to delete your account.' });
    } catch {
      toast({ variant: 'destructive', description: 'Failed to sign out' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2 flex items-center gap-3">
          <Settings className="h-8 w-8 text-amber-400" />
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Profile */}
      <Card className="border-border bg-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" value={user?.email || ''} disabled className="bg-secondary" />
            <p className="text-xs text-muted-foreground">
              Your sign-in email — cannot be changed here
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-border bg-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your sign-in password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPwd ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10 h-11"
                  disabled={changingPwd}
                  minLength={8}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11"
                disabled={changingPwd}
              />
            </div>

            <Button
              type="submit"
              disabled={changingPwd || !newPassword || !confirmPassword}
              className="h-10"
            >
              {changingPwd ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
              ) : pwdChanged ? (
                <><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Updated!</>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border bg-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Email notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates about new features</p>
            </div>
            <Switch
              id="notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border bg-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your security settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <div className="space-y-0.5">
              <p className="font-medium">Two-factor authentication</p>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm" disabled>Coming Soon</Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/20 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="space-y-0.5">
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account and all saved hooks. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
                    ) : 'Delete Account'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
