'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import SupportChatWidget from './components/SupportChatWidget';
import { Stethoscope, ShieldCheck, Menu, X, Calendar, Phone, MapPin } from 'lucide-react';

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
    <div className="flex flex-col min-h-screen bg-brand-cream-light text-brand-charcoal selection:bg-brand-primary/20 selection:text-brand-primary">
      {/* Top Notification Bar - Emergency & Location */}
      <div className="bg-brand-primary-dark text-white/90 text-xs py-2 px-4 border-b border-brand-primary">
        <div className="mx-auto flex max-w-7xl justify-between items-center text-[11px] font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-brand-accent" />
              Awka South LGA, Anambra State, Nigeria
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Accredited Residential Facility
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline">24/7 Clinical Helplines</span>
            <Link href="tel:+2348000000000" className="font-bold text-white hover:underline flex items-center gap-1">
              <Phone className="h-3 w-3 text-brand-accent" />
              +234 (0) 800 NIBO CARE
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Modern Header */}
      <header className="sticky top-0 z-40 w-full border-b border-brand-cream-dark/50 bg-white/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-7xl h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-2xl bg-brand-primary text-white flex items-center justify-center shadow-md shadow-brand-primary/20 group-hover:scale-105 transition-transform">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-brand-primary">
                Nibo<span className="text-brand-charcoal font-sans font-semibold">Rehab</span>
              </span>
              <span className="block text-[10px] text-brand-muted uppercase font-bold tracking-wider -mt-1">
                Medical Rehabilitation Center
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links - Floating Pill Container */}
          <nav className="hidden lg:flex items-center gap-1 bg-brand-cream-light/80 p-1.5 rounded-full border border-brand-cream-dark/60 text-xs font-bold shadow-xs">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-full transition-all ${
                    isActive
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-brand-charcoal hover:text-brand-primary hover:bg-white'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Action Pills */}
          <div className="hidden md:flex items-center gap-2.5">
            <Link
              href="/login"
              className="rounded-full border border-brand-cream-dark/70 bg-white hover:bg-brand-cream-light px-4 py-2 text-xs font-bold text-brand-charcoal transition-colors cursor-pointer"
            >
              Staff Portal
            </Link>
            <Link
              href="/book-appointment"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary hover:bg-brand-primary-dark px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-primary/20 hover:shadow-lg transition-all hover:scale-102 cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Book Appointment</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl p-2 text-brand-charcoal hover:bg-brand-cream-light md:hidden cursor-pointer border border-brand-cream-dark/60"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu Panel */}
        {mobileMenuOpen && (
          <div className="border-t border-brand-cream-dark/50 bg-white px-4 py-4 md:hidden shadow-lg animate-in slide-in-from-top duration-200">
            <div className="space-y-1 pb-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                    pathname === item.href
                      ? 'bg-brand-primary text-white'
                      : 'text-brand-charcoal hover:bg-brand-cream-light'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="border-t border-brand-cream-dark/45 pt-4 space-y-2">
              <Link
                href="/login"
                className="block text-center rounded-xl border border-brand-cream-dark/70 py-2.5 text-xs font-bold text-brand-charcoal hover:bg-brand-cream-light"
                onClick={() => setMobileMenuOpen(false)}
              >
                Staff Portal
              </Link>
              <Link
                href="/book-appointment"
                className="block text-center rounded-xl bg-brand-primary py-2.5 text-xs font-bold text-white hover:bg-brand-primary-dark shadow-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Book Appointment
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Modern Healthcare Footer */}
      <footer className="bg-brand-charcoal text-white border-t border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Column 1: Brand */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-brand-primary text-white flex items-center justify-center">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <span className="font-serif text-xl font-bold tracking-tight text-white">
                  Nibo<span className="text-brand-cream font-sans font-semibold">Rehab</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Dedicated residential rehabilitation, medical detoxification, and behavioral health center in Awka South, Anambra State, Nigeria.
              </p>
              <div className="pt-2 text-xs text-brand-accent font-bold">
                Licensed Clinical Residential Center
              </div>
            </div>

            {/* Column 2: Navigation */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Quick Navigation</h4>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li><Link href="/" className="hover:text-white transition">Home Overview</Link></li>
                <li><Link href="/about" className="hover:text-white transition">About Our Facility</Link></li>
                <li><Link href="/services" className="hover:text-white transition">Clinical Services</Link></li>
                <li><Link href="/facilities" className="hover:text-white transition">Residential Quarters</Link></li>
                <li><Link href="/faq" className="hover:text-white transition">Frequently Asked Questions</Link></li>
              </ul>
            </div>

            {/* Column 3: Clinical Programs */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Clinical Focus</h4>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li>30-Day Residential Program</li>
                <li>Medical Detoxification & Stabilization</li>
                <li>Psychological & Behavioral Therapy</li>
                <li>Vital Signs & eMAR Medication Care</li>
                <li>Post-Discharge Reintegration Support</li>
              </ul>
            </div>

            {/* Column 4: Contact & Emergency */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Contact & Intake</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Nibo, Awka South LGA, Anambra State, Nigeria
              </p>
              <p className="text-xs text-zinc-400">
                Inquiries: <strong className="text-white">intake@niborehab.ng</strong>
              </p>
              <p className="text-xs text-zinc-400">
                Phone: <strong className="text-white">+234 (0) 800 6426 2273</strong>
              </p>
              <div className="pt-2">
                <Link
                  href="/book-appointment"
                  className="inline-block rounded-full bg-brand-accent hover:bg-brand-accent-dark px-4 py-2 text-xs font-bold text-white shadow-sm transition"
                >
                  Book Intake Visit &rarr;
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-zinc-800 text-center text-xs text-zinc-500 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p>&copy; {new Date().getFullYear()} Nibo Rehabilitation Center. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-zinc-300">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-zinc-300">Terms of Admission</Link>
              <Link href="/login" className="hover:text-zinc-300">Staff Portal</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Support Chat Widget */}
      <SupportChatWidget />
    </div>
  );
}
