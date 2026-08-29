'use client';

import { useUser, useLogout } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useUser();
  const logout = useLogout();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      router.push('/login');
    }
  }, [user, isLoading, isError, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-teal-600" />
          <span className="text-sm font-medium text-zinc-500">Checking credentials...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting in useEffect
  }

  const isAdmin = user.roles.includes('admin');
  const isReceptionist = user.roles.includes('receptionist');

  const navigation = [
    {
      name: 'Overview',
      href: '/dashboard',
      show: true,
      icon: '📊',
    },
    {
      name: 'Appointments',
      href: '/dashboard/appointments',
      show: isAdmin || isReceptionist,
      icon: '📅',
    },
    {
      name: 'Patients',
      href: '/dashboard/patients',
      show: true,
      icon: '👤',
    },
    {
      name: 'Staff Accounts',
      href: '/dashboard/staff',
      show: isAdmin,
      icon: '👥',
    },
    {
      name: 'Medications',
      href: '/dashboard/medications',
      show: true,
      icon: '💊',
    },
  ];

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        router.push('/login');
      },
    });
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-zinc-200 bg-white">
        {/* Sidebar Header */}
        <div className="flex h-16 items-center border-b border-zinc-200 px-6">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight text-teal-600">
            Nibo<span className="text-zinc-900">Rehab</span> <span className="text-xs font-normal text-zinc-400">Portal</span>
          </Link>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navigation
            .filter((item) => item.show)
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-semibold'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
        </nav>


        {/* User profile / Logout */}
        <div className="border-t border-zinc-200 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-900">{user.name}</p>
              <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/10 uppercase mt-0.5">
                {user.roles.join(', ')}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={logout.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:bg-zinc-100 transition-colors"
          >
            {logout.isPending ? 'Logging out...' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main Content wrapper */}
      <div className="flex-1 pl-64 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-8">
          <h1 className="text-lg font-bold text-zinc-900">
            {pathname === '/dashboard' && 'Dashboard Overview'}
            {pathname === '/dashboard/appointments' && 'Appointment Management'}
            {pathname === '/dashboard/staff' && 'Staff Accounts'}
            {pathname.startsWith('/dashboard/patients') && 'Patient Directory'}
          </h1>
          <div className="text-xs text-zinc-400">
            Current Local Time: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {/* Dashboard inner content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
