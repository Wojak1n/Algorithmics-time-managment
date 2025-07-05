'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoOnly } from '@/components/logo';
import { 
  Calendar,
  Users,
  BookOpen,
  MapPin,
  Settings,
  Home,
  UserCheck,
  Clock,
  BarChart3,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  user: any;
  onLogout: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      roles: ['ADMIN', 'TEACHER', 'STUDENT']
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      roles: ['ADMIN']
    },
    {
      name: 'Teachers',
      href: '/teachers',
      icon: UserCheck,
      roles: ['ADMIN', 'TEACHER']
    },
    {
      name: 'Students',
      href: '/students',
      icon: Users,
      roles: ['ADMIN']
    },
    {
      name: 'Subjects',
      href: '/subjects',
      icon: BookOpen,
      roles: ['ADMIN', 'TEACHER']
    },
    {
      name: 'Rooms',
      href: '/rooms',
      icon: MapPin,
      roles: ['ADMIN']
    },
    {
      name: 'Groups',
      href: '/groups',
      icon: Users,
      roles: ['ADMIN', 'TEACHER']
    },
    {
      name: 'Courses',
      href: '/courses',
      icon: Calendar,
      roles: ['ADMIN', 'TEACHER']
    },
    {
      name: 'Schedules',
      href: '/schedules',
      icon: Clock,
      roles: ['ADMIN', 'TEACHER', 'STUDENT']
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      roles: ['ADMIN']
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['ADMIN', 'TEACHER', 'STUDENT']
    }
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="bg-white dark:bg-gray-800 shadow-md"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {!collapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 dark:bg-black/70 z-40"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        collapsed ? "-translate-x-full" : "translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-center p-6 border-b border-gray-200 dark:border-gray-700">
            <LogoOnly size={48} />
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-4">
            <nav className="space-y-2">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setCollapsed(true)}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                        : "text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}