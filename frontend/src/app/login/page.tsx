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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div>
          <div className="text-center">
            <Link href="/" className="text-2xl font-bold tracking-tight text-teal-600">
              Nibo<span className="text-zinc-900">Rehab</span>
            </Link>
            <h2 className="mt-6 text-xl font-bold text-zinc-900">Staff Portal Sign In</h2>
            <p className="mt-2 text-xs text-zinc-500">
              Access the internal administrative or clinical dashboards.
            </p>
          </div>
        </div>

        {login.isError && (
          <div className="rounded-lg bg-red-50 p-4 text-xs text-red-800 border border-red-200">
            {((login.error as any)?.response?.data?.message) || 'Authentication failed. Please check credentials.'}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="staff@rehabcenter.local"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={login.isPending}
              className="flex w-full justify-center rounded-full bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus:outline-none disabled:bg-teal-400 transition-all"
            >
              {login.isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Quick Testing Actions */}
        {process.env.NODE_ENV === 'development' && (
          <div className="border-t border-zinc-200 pt-6">
            <span className="block text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Quick Login For Testing
            </span>
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => handleQuickLogin('admin@rehabcenter.local')}
                className="w-full text-left rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 flex justify-between items-center transition-colors"
              >
                <span>Admin Account</span>
                <span className="text-teal-600">Autofill</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
