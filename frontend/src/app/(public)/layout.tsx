'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import SupportChatWidget from './components/SupportChatWidget';

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
    <div className="flex flex-col min-h-screen bg-brand-cream-light text-brand-charcoal">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-brand-cream-dark/50 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-serif text-xl font-bold tracking-tight text-brand-primary">Nibo<span className="text-brand-charcoal font-serif font-semibold">Rehab</span></span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex gap-6 text-sm font-semibold text-brand-muted">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`transition-colors hover:text-brand-accent ${
                    isActive ? 'text-brand-accent font-bold' : ''
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
              className="text-sm font-semibold text-brand-muted hover:text-brand-charcoal transition-colors"
            >
              Staff Portal
            </Link>
            <Link
              href="/book-appointment"
              className="inline-flex h-9 items-center justify-center rounded-full bg-brand-accent px-5 text-sm font-bold text-white shadow-md shadow-brand-accent/20 transition-all hover:bg-brand-accent-dark hover:scale-102 focus-visible:outline-none cursor-pointer"
            >
              Book Appointment
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-brand-muted hover:bg-brand-cream/40 hover:text-brand-charcoal md:hidden cursor-pointer"
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
          <div className="border-t border-brand-cream-dark/50 bg-white px-4 py-3 md:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-base font-bold text-brand-muted hover:bg-brand-cream/35 hover:text-brand-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="border-t border-brand-cream-dark/45 pb-3 pt-4">
              <div className="flex items-center justify-between px-3">
                <Link
                  href="/login"
                  className="text-base font-bold text-brand-muted hover:text-brand-charcoal"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Staff Portal
                </Link>
                <Link
                  href="/book-appointment"
                  className="inline-flex h-9 items-center justify-center rounded-full bg-brand-accent px-5 text-sm font-bold text-white hover:bg-brand-accent-dark cursor-pointer"
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
      <footer className="border-t border-brand-cream-dark/60 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            {/* Center Info */}
            <div className="space-y-4">
              <span className="font-serif text-xl font-bold text-brand-primary">Nibo Rehab</span>
              <p className="text-sm text-brand-muted max-w-xs leading-relaxed font-medium">
                A premier residential rehabilitation and wellness center located in Nibo, Anambra State, Nigeria. We are committed to guidance, clinical care, and recovery.
              </p>
            </div>
            
            {/* Quick Links & Contact */}
            <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
              <div>
                <h3 className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">Quick Links</h3>
                <ul className="mt-4 space-y-2 text-sm text-brand-muted font-medium">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="hover:text-brand-accent transition-colors">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/login" className="hover:text-brand-accent transition-colors">
                      Staff Portal
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">Contact Info</h3>
                <ul className="mt-4 space-y-2 text-sm text-brand-muted font-medium leading-relaxed">
                  <li>Nibo, Awka South LGA,</li>
                  <li>Anambra State, Nigeria</li>
                  <li>Phone: +234 803 000 0000</li>
                  <li>Email: info@niborehab.org</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-brand-cream-dark/45 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-brand-muted font-medium">
              &copy; {new Date().getFullYear()} Nibo Rehabilitation Center. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-brand-muted font-medium">
              <Link href="/privacy" className="hover:text-brand-accent transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-brand-accent transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Public Guardian Support Chat Widget */}
      <SupportChatWidget />
    </div>
  );
}
