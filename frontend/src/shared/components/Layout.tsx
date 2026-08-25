import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Boxes,
  FileText,
  Wrench,
  BotMessageSquare,
  Shield,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/button';

export function Layout(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { text: 'Dashboard', icon: <LayoutDashboard className="size-4" />, path: '/' },
    { text: 'ลูกค้า', icon: <Users className="size-4" />, path: '/customers' },
    { text: 'สินค้า', icon: <Boxes className="size-4" />, path: '/inventory' },
    { text: 'ใบแจ้งหนี้', icon: <FileText className="size-4" />, path: '/sales/invoices' },
    { text: 'งานติดตั้ง', icon: <Wrench className="size-4" />, path: '/jobs' },
    { text: 'AI Chat', icon: <BotMessageSquare className="size-4" />, path: '/chat' },
    ...(user?.role === 'ADMIN'
      ? [{ text: 'จัดการผู้ใช้งาน', icon: <Shield className="size-4" />, path: '/admin/users' }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50 flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          Versus ERP
        </div>
        <div>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                {user?.displayName}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-1.5"
              >
                <LogOut className="size-3.5" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5"
            >
              <LogIn className="size-3.5" />
              <span>Login</span>
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        {isAuthenticated && (
          <aside className="w-60 shrink-0 border-r border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.text}
                    type="button"
                    data-selected={isActive ? 'true' : undefined}
                    data-active={isActive ? 'true' : undefined}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-left ${
                      isActive
                        ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50 font-semibold'
                        : 'text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50'
                    }`}
                    onClick={() => navigate(item.path)}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.text}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
