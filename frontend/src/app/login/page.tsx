'use client';

import { useLogin } from '@/lib/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as zod from 'zod';
import Link from 'next/link';

const loginSchema = zod.object({
  email: zod.string().email('Invalid email address'),
  password: zod.string().min(1, 'Password is required'),
});

type LoginFormValues = zod.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    login.mutate(data, {
      onSuccess: () => {
        router.push('/dashboard');
      },
    });
  };

  const handleQuickLogin = (email: string) => {
    setValue('email', email);
    setValue('password', 'password');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream-light px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Soft Background Art */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-brand-primary/5 rounded-full filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-accent/5 rounded-full filter blur-3xl opacity-30 translate-x-1/3 translate-y-1/3" />

      <div className="w-full max-w-md space-y-8 rounded-2xl border border-brand-cream-dark/55 bg-white p-8 sm:p-10 shadow-md relative z-10">
        <div>
          <div className="text-center">
            <Link href="/" className="text-2xl font-serif font-bold tracking-tight text-brand-primary">
              Nibo<span className="text-brand-charcoal font-sans font-semibold">Rehab</span>
            </Link>
            <h2 className="mt-6 text-xl font-bold text-brand-charcoal tracking-tight">Staff Portal Sign In</h2>
            <p className="mt-2 text-xs text-brand-muted font-medium">
              Access the internal administrative or clinical dashboards.
            </p>
          </div>
        </div>

        {login.isError && (
          <div className="rounded-xl bg-red-50 p-4 text-xs text-red-800 border border-red-200/50">
            {((login.error as any)?.response?.data?.message) || 'Authentication failed. Please check credentials.'}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="mt-1.5 block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-3 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                placeholder="staff@rehabcenter.local"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="mt-1.5 block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-3 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={login.isPending}
              className="flex w-full justify-center rounded-full bg-brand-accent hover:bg-brand-accent-dark text-white px-6 py-3.5 text-sm font-semibold shadow-md shadow-brand-accent/20 hover:shadow-lg hover:shadow-brand-accent/30 focus:outline-none disabled:bg-brand-accent/50 transition-all duration-300 cursor-pointer transform hover:scale-[1.01]"
            >
              {login.isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Quick Testing Actions */}
        {process.env.NODE_ENV === 'development' && (
          <div className="border-t border-brand-cream-dark/50 pt-6">
            <span className="block text-center text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">
              Quick Login For Testing
            </span>
            <div className="space-y-2">
              <button
                onClick={() => handleQuickLogin('admin@rehabcenter.local')}
                className="w-full text-left rounded-xl bg-brand-cream/35 border border-brand-cream-dark/40 px-4 py-3 text-xs font-medium text-brand-charcoal-light hover:bg-brand-cream/70 flex justify-between items-center transition-all cursor-pointer hover:border-brand-primary/45"
              >
                <span>Admin Account</span>
                <span className="text-brand-accent font-semibold">Autofill &rarr;</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
