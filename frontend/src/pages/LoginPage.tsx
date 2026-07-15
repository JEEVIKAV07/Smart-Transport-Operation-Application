import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Truck, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import { cn } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setServerError(error.response?.data?.message || 'Invalid credentials');
    }
  };

  const quickLogin = (email: string) => {
    setValue('email', email);
    setValue('password', 'password123');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-card border-r border-border/50 flex-col justify-between p-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <Truck className="h-5 w-5 text-black" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">TransitOps</h1>
              <p className="text-xs text-muted-foreground">Smart Transport Operations Platform</p>
            </div>
          </div>

          <div className="mt-16 space-y-2">
            <h2 className="text-2xl font-bold text-foreground">One login, five roles:</h2>
            <div className="mt-6 space-y-3">
              {[
                { role: 'Fleet Manager', desc: 'Fleet, Maintenance', color: 'bg-amber-500' },
                { role: 'Driver', desc: 'Dashboard, Trips', color: 'bg-blue-500' },
                { role: 'Safety Officer', desc: 'Drivers, Compliance', color: 'bg-emerald-500' },
                { role: 'Financial Analyst', desc: 'Fuel & Expenses, Analytics', color: 'bg-purple-500' },
                { role: 'Admin', desc: 'Full Access', color: 'bg-rose-500' },
              ].map((item) => (
                <div key={item.role} className="flex items-center gap-3">
                  <div className={cn('h-2 w-2 rounded-full', item.color)} />
                  <span className="text-sm font-medium text-foreground">{item.role}</span>
                  <span className="text-xs text-muted-foreground">→ {item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick login shortcuts */}
          <div className="mt-10 space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Quick Demo Login</p>
            <div className="space-y-1.5">
              {[
                { label: 'Fleet Manager', email: 'fleet@transitops.in' },
                { label: 'Safety Officer', email: 'safety@transitops.in' },
                { label: 'Financial Analyst', email: 'finance@transitops.in' },
                { label: 'Admin', email: 'admin@transitops.in' },
              ].map((item) => (
                <button
                  key={item.email}
                  onClick={() => quickLogin(item.email)}
                  className="block w-full text-left px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-200"
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="ml-2 opacity-60">{item.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          TRANSITOPS © 2026 · RBAC Enabled
        </p>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <Truck className="h-5 w-5 text-black" />
            </div>
            <h1 className="font-bold text-xl text-foreground">TransitOps</h1>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">Sign in to your account</h2>
            <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to continue</p>
          </div>

          {serverError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="raven.k@transitops.in"
                className={cn(
                  'form-input',
                  errors.email && 'border-red-500/50 focus:ring-red-500/50'
                )}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={cn(
                    'form-input pr-10',
                    errors.password && 'border-red-500/50 focus:ring-red-500/50'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-amber py-2.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Access is scoped by role after login.<br />
            All accounts use password: <span className="text-amber-400 font-mono">password123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
