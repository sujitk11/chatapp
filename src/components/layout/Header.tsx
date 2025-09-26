'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { api } from '@/app/providers';
import { User, LogOut } from 'lucide-react';

export function Header() {
  const { data: user } = api.auth.me.useQuery();
  
  const utils = api.useUtils();
  
  const logout = api.auth.logout.useMutation({
    onSuccess: async () => {
      // Clear local storage
      localStorage.removeItem('activeSessionId');
      // Clear all query cache completely
      await utils.invalidate();
      // Reset the entire query cache
      utils.session.list.reset();
      utils.auth.me.reset();
      // Hard refresh to clear everything
      window.location.href = '/auth/login';
    },
  });

  const handleLogout = () => {
    logout.mutate();
  };

  if (!user) {
    return (
      <div className="border-b p-4 flex justify-between items-center">
        <h1 className="font-semibold text-lg">Career Counseling Chat</h1>
        <div className="flex gap-2">
          <Link href="/auth/login">
            <Button variant="outline" size="sm">
              Login
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button size="sm">
              Register
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b p-4 flex justify-between items-center">
      <h1 className="font-semibold text-lg">Career Counseling Chat</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4" />
          <span>{user.name || user.email}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={logout.isPending}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}