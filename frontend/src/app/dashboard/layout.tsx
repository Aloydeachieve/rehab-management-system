'use client';

import { useUser, useLogout } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Pill,
  CreditCard,
  MessageSquare,
  BarChart3,
  UserCog,
  SlidersHorizontal,
  LogOut,
  Menu,
  X,
  Stethoscope,
  ShieldCheck,
  Building2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useUser();
  const logout = useLogout();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      router.push('/login');
    }
  }, [user, isLoading, isError, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f4]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2F7D5B]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Authenticating Clinical Workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.roles.includes('admin');
  const isDoctor = user.roles.includes('doctor');
  const isReceptionist = user.roles.includes('receptionist');

  const navGroups = [
    {
      label: 'OVERVIEW',
      items: [
        {
          name: isDoctor ? 'Doctor Workspace' : 'Overview',
          href: '/dashboard',
          show: true,
          icon: LayoutDashboard,
        },
        {
          name: 'Appointments',
          href: '/dashboard/appointments',
          show: isAdmin || isReceptionist,
          icon: Calendar,
        },
      ],
    },
    {
      label: 'PATIENT CARE',
      items: [
        {
          name: isDoctor ? 'My Patients' : 'Patients Directory',
          href: '/dashboard/patients',
          show: true,
          icon: Users,
        },
        {
          name: 'Medications & eMAR',
          href: '/dashboard/medications',
          show: true,
          icon: Pill,
        },
      ],
    },
    {
      label: 'OPERATIONS',
      items: [
        {
          name: 'Billing & Ledger',
          href: '/dashboard/billing',
          show: isAdmin || isReceptionist,
          icon: CreditCard,
        },
        {
          name: 'Guardian Messages',
          href: '/dashboard/messages',
          show: isAdmin || isReceptionist,
          icon: MessageSquare,
        },
        {
          name: 'Reports & Audit',
          href: '/dashboard/reports',
          show: isAdmin || isReceptionist,
          icon: BarChart3,
        },
      ],
    },
    {
      label: 'ADMINISTRATION',
      items: [
        {
          name: 'Staff Management',
          href: '/dashboard/staff',
          show: isAdmin,
          icon: UserCog,
        },
        {
          name: 'Treatment Pricing',
          href: '/dashboard/settings/pricing',
          show: isAdmin,
          icon: SlidersHorizontal,
        },
      ],
    },
  ];

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => {
        router.replace('/');
      },
    });
  };

  const getRoleBadge = () => {
    if (isAdmin) return <Badge variant="secondary" className="bg-[#eaf6f0] text-[#1f5c43] border-[#2f7d5b]/20 text-[10px] uppercase font-bold">Admin</Badge>;
    if (isDoctor) return <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] uppercase font-bold">Doctor</Badge>;
    return <Badge variant="neutral" className="text-[10px] uppercase font-bold">Receptionist</Badge>;
  };

  return (
    <div className="min-h-screen bg-[#f7f9f7] text-[#1f2923] flex flex-col">
      {/* Top Floating Island Header (Guided by UI Reference Image 1) */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/80 bg-white/85 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-[#2F7D5B] text-white flex items-center justify-center font-serif font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                +
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-base tracking-tight text-[#1f2923] leading-none">
                  Nibo<span className="text-[#2F7D5B]">Rehab</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mt-0.5">
                  Clinical Portal
                </span>
              </div>
            </Link>
          </div>

          {/* User Status Pill (Style inspired by reference pill: [Elisa Nillson]) */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 text-white text-xs font-semibold shadow-xs">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{user.name}</span>
              <span className="text-zinc-400 text-[10px] font-normal border-l border-zinc-700 pl-2">
                {user.roles[0]?.toUpperCase()}
              </span>
            </div>

            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-[#2F7D5B] transition-colors"
            >
              Public Site
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-all cursor-pointer"
              title="Sign out of clinical portal"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 gap-8">
        {/* Desktop Sidebar (Grouped navigation inspired by reference Image 2) */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* Staff Card Widget */}
            <div className="p-4 rounded-3xl bg-white border border-zinc-200/70 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#eaf6f0] text-[#2F7D5B] flex items-center justify-center font-bold text-sm">
                  {isDoctor ? <Stethoscope className="h-5 w-5" /> : isAdmin ? <ShieldCheck className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900 truncate">{user.name}</p>
                  <div className="mt-0.5">{getRoleBadge()}</div>
                </div>
              </div>
            </div>

            {/* Navigation Groups */}
            <nav className="p-3 rounded-3xl bg-white border border-zinc-200/70 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] space-y-5">
              {navGroups.map((group) => {
                const visibleItems = group.items.filter((item) => item.show);
                if (visibleItems.length === 0) return null;

                return (
                  <div key={group.label} className="space-y-1">
                    <p className="px-3 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                      {group.label}
                    </p>
                    <div className="space-y-0.5">
                      {visibleItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                              'group flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-semibold transition-all duration-150',
                              isActive
                                ? 'bg-[#2F7D5B] text-white shadow-xs'
                                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70'
                            )}
                          >
                            <Icon
                              className={cn(
                                'h-4 w-4 shrink-0 transition-colors',
                                isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-600'
                              )}
                            />
                            <span className="flex-1 truncate">{item.name}</span>
                            {isActive && <ChevronRight className="h-3 w-3 text-white/70" />}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-50 w-72 max-w-[80vw] bg-white h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-[#2F7D5B] text-white flex items-center justify-center font-bold">
                      +
                    </div>
                    <span className="font-serif font-bold text-base text-[#1f2923]">NiboRehab</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-700">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-[#f4f6f4] flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[#2F7D5B] text-white flex items-center justify-center">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase">{user.roles[0]}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {navGroups.map((group) => {
                    const visibleItems = group.items.filter((item) => item.show);
                    if (visibleItems.length === 0) return null;

                    return (
                      <div key={group.label} className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2">
                          {group.label}
                        </p>
                        {visibleItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold',
                                isActive ? 'bg-[#2F7D5B] text-white' : 'text-zinc-600 hover:bg-zinc-100'
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
