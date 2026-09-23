'use client';

import { useLogin } from '@/lib/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as zod from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import { Stethoscope, ShieldCheck, Lock, User, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-brand-cream-light flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-brand-cream-dark/60 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        
        {/* Left Visual Column */}
        <div className="md:col-span-5 relative hidden md:block bg-brand-primary-dark">
          <Image
            src="/image/images3.jpg"
            alt="Clinical Care Staff Reviewing Records"
            fill
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-brand-primary-dark/80 to-transparent" />
          <div className="absolute inset-0 p-8 flex flex-col justify-between text-white z-10">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-white text-brand-primary flex items-center justify-center font-bold">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-white">
                Nibo<span className="text-brand-cream font-sans font-semibold">Rehab</span>
              </span>
            </Link>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[10px] font-bold uppercase tracking-wider text-brand-cream">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Authorized Staff Portal</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-white leading-snug">
                Clinical Responsibility & Patient Care
              </h3>
              <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                Secure electronic medical records, eMAR administration, and doctor clinical workspaces.
              </p>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="md:col-span-7 p-8 sm:p-12 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-brand-charcoal tracking-tight">Staff Portal Sign In</h2>
            <p className="text-xs text-brand-muted mt-1 font-medium">
              Enter your staff credentials to access administrative and clinical workspaces.
            </p>
          </div>

          {login.isError && (
            <div className="rounded-2xl bg-rose-50 p-4 text-xs text-rose-800 border border-rose-200">
              {((login.error as any)?.response?.data?.message) || 'Authentication failed. Please check credentials.'}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="block w-full rounded-2xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-3 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none focus:bg-white transition-all font-medium"
                placeholder="staff@rehabcenter.local"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="block w-full rounded-2xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-3 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none focus:bg-white transition-all font-medium"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-6 py-3.5 text-xs font-bold shadow-md transition-all cursor-pointer disabled:bg-brand-primary/50 flex items-center justify-center gap-2"
            >
              <span>{login.isPending ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Sign-In Pills (Design Guide Inspired) */}
          <div className="pt-4 border-t border-brand-cream-dark/40 space-y-2.5">
            <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">
              Quick Test Sign In:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@rehabcenter.local')}
                className="rounded-full bg-brand-cream-light hover:bg-brand-cream text-brand-charcoal px-3.5 py-1.5 text-xs font-bold border border-brand-cream-dark/60 transition-colors cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('doctor@rehabcenter.local')}
                className="rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3.5 py-1.5 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
              >
                Doctor (Clinical)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('receptionist@rehabcenter.local')}
                className="rounded-full bg-brand-cream-light hover:bg-brand-cream text-brand-charcoal px-3.5 py-1.5 text-xs font-bold border border-brand-cream-dark/60 transition-colors cursor-pointer"
              >
                Receptionist
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-brand-muted hover:text-brand-primary font-medium">
              &larr; Back to Public Website
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
