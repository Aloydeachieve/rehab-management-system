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
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
        </svg>
      ),
    },
    {
      name: 'Appointments',
      href: '/dashboard/appointments',
      show: isAdmin || isReceptionist,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
    },
    {
      name: 'Patients',
      href: '/dashboard/patients',
      show: true,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
    {
      name: 'Staff Accounts',
      href: '/dashboard/staff',
      show: isAdmin,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
    },
    {
      name: 'Billing',
      href: '/dashboard/billing',
      show: isAdmin || isReceptionist,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
    },
    {
      name: 'Messages',
      href: '/dashboard/messages',
      show: isAdmin || isReceptionist,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.875-.875c.168-.696.386-1.37.647-2.016A7.95 7.95 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      ),
    },
    {
      name: 'Medications',
      href: '/dashboard/medications',
      show: true,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Reports',
      href: '/dashboard/reports',
      show: isAdmin || isReceptionist,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
    {
      name: 'Pricing Config',
      href: '/dashboard/settings/pricing',
      show: isAdmin,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      ),
    },
  ];

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => {
        router.replace('/');
      },
    });
  };

  return (
    <div className="flex min-h-screen bg-brand-cream-light">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-brand-cream-dark/60 bg-brand-cream">
        {/* Sidebar Header */}
        <div className="flex h-16 items-center border-b border-brand-cream-dark/60 px-6">
          <Link href="/dashboard" className="text-lg font-serif font-bold tracking-tight text-brand-primary">
            Nibo<span className="text-brand-charcoal font-sans font-semibold">Rehab</span> <span className="text-[10px] font-sans font-normal text-brand-muted tracking-wider uppercase ml-1">Portal</span>
          </Link>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {navigation
            .filter((item) => item.show)
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-primary/10 text-brand-primary font-semibold shadow-sm border-l-4 border-brand-primary'
                      : 'text-brand-charcoal-light hover:bg-brand-primary/5 hover:text-brand-charcoal'
                  }`}
                >
                  <span className="text-lg opacity-85">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
        </nav>

        {/* User profile / Logout */}
        <div className="border-t border-brand-cream-dark/60 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-brand-cream-light uppercase shadow-sm">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-brand-charcoal">{user.name}</p>
              <span className="inline-flex items-center rounded-full bg-brand-accent/10 px-2 py-0.5 text-[9px] font-bold text-brand-accent ring-1 ring-inset ring-brand-accent/20 uppercase mt-0.5 tracking-wider">
                {user.roles.join(', ')}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={logout.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-brand-cream-dark/60 bg-white px-3 py-2 text-xs font-semibold text-brand-charcoal hover:bg-brand-cream-light disabled:bg-brand-cream-dark/40 transition-colors shadow-sm cursor-pointer"
          >
            {logout.isPending ? 'Logging out...' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main Content wrapper */}
      <div className="flex-1 pl-64 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-brand-cream-dark/50 bg-brand-cream-light/85 backdrop-blur-md px-8">
          <h1 className="font-serif text-lg font-bold text-brand-charcoal">
            {pathname === '/dashboard' && 'Dashboard Overview'}
            {pathname === '/dashboard/appointments' && 'Appointment Management'}
            {pathname === '/dashboard/staff' && 'Staff Accounts'}
            {pathname === '/dashboard/billing' && 'Billing & Invoices'}
            {pathname === '/dashboard/messages' && 'Guardian Support Messages'}
            {pathname === '/dashboard/medications' && 'Medications & eMAR Schedule'}
            {pathname.startsWith('/dashboard/patients') && 'Patient Directory'}
            {pathname.startsWith('/dashboard/reports') && 'Operational & Clinical Reports'}
            {pathname.startsWith('/dashboard/settings/pricing') && 'Treatment Pricing Configuration'}
          </h1>
          <div className="text-xs text-brand-muted font-medium">
            Current Local Time: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {/* Dashboard inner content */}
        <main className="flex-1 p-8 bg-brand-cream-light/40">{children}</main>
      </div>
    </div>
  );
}
