import { useState, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Users, Route, Wrench,
  Fuel, BarChart3, Settings, LogOut, Bell, Search,
  ChevronRight, Menu, X, User
} from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import { useSettings } from '@/store/SettingsContext';
import { cn, getStatusLabel } from '@/lib/utils';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
  { label: 'Fleet', href: '/vehicles', icon: Truck, roles: ['ADMIN', 'FLEET_MANAGER', 'DRIVER'] },
  { label: 'Drivers', href: '/drivers', icon: Users, roles: ['ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER'] },
  { label: 'Trips', href: '/trips', icon: Route, roles: ['ADMIN', 'FLEET_MANAGER', 'DRIVER'] },
  { label: 'Maintenance', href: '/maintenance', icon: Wrench, roles: ['ADMIN', 'FLEET_MANAGER'] },
  { label: 'Fuel & Expenses', href: '/fuel', icon: Fuel, roles: ['ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'] },
  { label: 'Analytics', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN', 'FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { notificationsEnabled } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [notifs, setNotifs] = useState([
    { id: 1, title: 'Maintenance Alert', msg: 'Vehicle VAN-05 is due for oil change.', time: '2h ago', unread: true },
    { id: 2, title: 'License Expiry', msg: 'Driver John Doe license expires in 5 days.', time: '5h ago', unread: true },
    { id: 3, title: 'Trip Completed', msg: 'Trip TRP-1002 has been successfully completed.', time: '1d ago', unread: false },
  ]);

  const hasUnread = notifs.some(n => n.unread);

  const markAllAsRead = useCallback(() => {
    setNotifs(prev => prev.map(n => ({ ...n, unread: false })));
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const visibleItems = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role as UserRole)
  );

  const userInitials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-56 bg-card border-r border-border/50 flex flex-col transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Truck className="h-4 w-4 text-black" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-foreground tracking-tight">TransitOps</h1>
              <p className="text-xs text-muted-foreground">Smart Transport</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn('sidebar-link', isActive && 'active')}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-border/50">
          <Link to="/profile" className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors group">
            <div className="h-8 w-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-400">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{getStatusLabel(user?.role || '')}</p>
            </div>
            <User className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 mt-0.5"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border/50 flex items-center gap-4 px-4 bg-card/50 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-input border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => notificationsEnabled && setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg transition-colors ${notificationsEnabled ? 'hover:bg-muted' : 'opacity-50 cursor-not-allowed'}`}
                title={notificationsEnabled ? "Notifications" : "Notifications Disabled"}
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
                {notificationsEnabled && hasUnread && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500" />}
              </button>
              
              {showNotifications && notificationsEnabled && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                    <div className="p-3 border-b border-border/50 bg-muted/30">
                      <h3 className="text-sm font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifs.map(n => (
                        <div key={n.id} className={`p-3 border-b border-border/50 hover:bg-muted/50 cursor-pointer ${n.unread ? 'bg-amber-500/5' : ''}`}>
                          <div className="flex justify-between items-start mb-1">
                            <p className={`text-sm ${n.unread ? 'font-semibold text-amber-400' : 'font-medium'}`}>{n.title}</p>
                            <span className="text-[10px] text-muted-foreground">{n.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{n.msg}</p>
                        </div>
                      ))}
                    </div>
                    <div 
                      onClick={markAllAsRead}
                      className="p-2 text-center border-t border-border/50 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-amber-400 font-medium">Mark all as read</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400">
                {userInitials}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-amber-400">{getStatusLabel(user?.role || '')}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
