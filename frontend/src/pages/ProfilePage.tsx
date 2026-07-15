import { useAuth } from '@/store/AuthContext';
import { getStatusLabel, formatDate } from '@/lib/utils';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground">Your account information</p>
      </div>

      <div className="glass-card p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center text-2xl font-bold text-amber-400">
            {user?.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {getStatusLabel(user?.role || '')}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { icon: User, label: 'Full Name', value: user?.name },
            { icon: Mail, label: 'Email', value: user?.email },
            { icon: Shield, label: 'Role', value: getStatusLabel(user?.role || '') },
            { icon: Calendar, label: 'Member Since', value: formatDate(user?.createdAt) },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted/50">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{item.value || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
