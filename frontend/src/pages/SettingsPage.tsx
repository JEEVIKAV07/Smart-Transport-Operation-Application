import { useAuth } from '@/store/AuthContext';
import { useSettings } from '@/store/SettingsContext';
import { getStatusLabel } from '@/lib/utils';
import { Settings, Moon, Globe, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { isDarkMode, toggleDarkMode, notificationsEnabled, toggleNotifications } = useSettings();

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Application preferences and configuration</p>
      </div>

      {/* App Info */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Settings className="h-4 w-4 text-amber-400" /> Application
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <div className="flex items-center gap-3">
              <Moon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Always on — optimized for fleet operations</p>
              </div>
            </div>
            <button 
              onClick={toggleDarkMode}
              className={`h-5 w-9 rounded-full transition-colors flex items-center px-0.5 ${isDarkMode ? 'bg-amber-500 justify-end' : 'bg-muted justify-start'}`}
            >
              <div className="h-4 w-4 rounded-full bg-white" />
            </button>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Language</p>
                <p className="text-xs text-muted-foreground">English (India)</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">EN-IN</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-muted-foreground">License expiry, maintenance alerts</p>
              </div>
            </div>
            <button 
              onClick={toggleNotifications}
              className={`h-5 w-9 rounded-full transition-colors flex items-center px-0.5 ${notificationsEnabled ? 'bg-amber-500 justify-end' : 'bg-muted justify-start'}`}
            >
              <div className="h-4 w-4 rounded-full bg-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Role & Permissions */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-400" /> Your Access
        </h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Role</p>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {getStatusLabel(user?.role || '')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Account Status</p>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">Active</span>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">About TransitOps</h2>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Version: 1.0.0</p>
          <p>Smart Transport Operations Platform</p>
          <p>© 2026 TransitOps · RBAC Enabled</p>
        </div>
      </div>
    </div>
  );
}
