'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Facilities', href: '/facilities' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 text-zinc-900">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-teal-600">Nibo<span className="text-zinc-900 font-semibold">Rehab</span></span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex gap-6 text-sm font-medium text-zinc-600">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`transition-colors hover:text-teal-600 ${
                    isActive ? 'text-teal-600 font-semibold' : ''
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* CTA / Staff Link */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              Staff Portal
            </Link>
            <Link
              href="/book-appointment"
              className="inline-flex h-9 items-center justify-center rounded-full bg-teal-600 px-4 text-sm font-medium text-white shadow transition-all hover:bg-teal-700 hover:shadow-md focus-visible:outline-none"
            >
              Book Appointment
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Panel */}
        {mobileMenuOpen && (
          <div className="border-t border-zinc-200 bg-white px-4 py-3 md:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-base font-medium text-zinc-600 hover:bg-zinc-50 hover:text-teal-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="border-t border-zinc-200 pb-3 pt-4">
              <div className="flex items-center justify-between px-3">
                <Link
                  href="/login"
                  className="text-base font-medium text-zinc-500 hover:text-zinc-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Staff Portal
                </Link>
                <Link
                  href="/book-appointment"
                  className="inline-flex h-9 items-center justify-center rounded-full bg-teal-600 px-4 text-sm font-medium text-white hover:bg-teal-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Book Appointment
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            {/* Center Info */}
            <div className="space-y-4">
              <span className="text-xl font-bold text-teal-600">Nibo Rehab</span>
              <p className="text-sm text-zinc-500 max-w-xs">
                A premier residential rehabilitation and wellness center located in Nibo, Anambra State, Nigeria. We are committed to guidance, clinical care, and recovery.
              </p>
            </div>
            
            {/* Quick Links & Contact */}
            <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
              <div>
                <h3 className="text-sm font-semibold text-zinc-950 uppercase tracking-wider">Quick Links</h3>
                <ul className="mt-4 space-y-2 text-sm text-zinc-500">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="hover:text-teal-600 transition-colors">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/login" className="hover:text-teal-600 transition-colors">
                      Staff Portal
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-950 uppercase tracking-wider">Contact Info</h3>
                <ul className="mt-4 space-y-2 text-sm text-zinc-500">
                  <li>Nibo, Awka South LGA,</li>
                  <li>Anambra State, Nigeria</li>
                  <li>Phone: +234 803 000 0000</li>
                  <li>Email: info@niborehab.org</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-zinc-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-zinc-400">
              &copy; {new Date().getFullYear()} Nibo Rehabilitation Center. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-zinc-400">
              <Link href="/privacy" className="hover:text-teal-600">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-teal-600">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
