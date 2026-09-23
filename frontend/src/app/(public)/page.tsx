'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Stethoscope,
  HeartPulse,
  Activity,
  Calendar,
  Users,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  Clock,
  MapPin
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-brand-cream-light">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-brand-cream-dark/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-4 py-1.5 text-xs font-bold text-brand-primary border border-brand-primary/20">
                <ShieldCheck className="h-4 w-4 text-brand-primary" />
                <span>Premier Residential Rehabilitation in Awka South, Anambra</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-brand-charcoal leading-[1.15]">
                Restore Health, Dignity & <span className="text-brand-primary">Long-Term Recovery</span>
              </h1>

              <p className="text-base sm:text-lg text-brand-charcoal/80 leading-relaxed max-w-2xl font-medium">
                Nibo Rehabilitation Center offers a peaceful, structured 30-day residential environment led by licensed physicians, clinical counselors, and dedicated 24/7 nursing staff.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/book-appointment"
                  className="rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-8 py-4 text-sm font-bold shadow-lg shadow-brand-primary/25 hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Request Intake Assessment</span>
                </Link>
                <Link
                  href="/services"
                  className="rounded-full border border-brand-cream-dark/80 bg-white hover:bg-brand-cream-light text-brand-charcoal px-7 py-4 text-sm font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <span>Explore Programs</span>
                  <ArrowRight className="h-4 w-4 text-brand-muted" />
                </Link>
              </div>

              {/* Key Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-brand-cream-dark/50">
                <div>
                  <p className="text-2xl font-bold text-brand-primary font-serif">100%</p>
                  <p className="text-xs text-brand-muted font-medium mt-0.5">Physician Assigned</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-primary font-serif">30-Day</p>
                  <p className="text-xs text-brand-muted font-medium mt-0.5">Structured Sessions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-primary font-serif">24/7</p>
                  <p className="text-xs text-brand-muted font-medium mt-0.5">Clinical Nursing</p>
                </div>
              </div>
            </div>

            {/* Right Visual Column with Authentic Photos */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Campus Image */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/3]">
                  <Image
                    src="/image/images.jpeg"
                    alt="Nibo Rehabilitation Center Hospital Campus"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-primary px-2.5 py-1 rounded-full">
                      Serene Campus
                    </span>
                    <p className="text-sm font-bold mt-1">Nibo Rehabilitation Hospital Grounds</p>
                  </div>
                </div>

                {/* Floating Physician Consultation Card (Image 1 Guide Homage) */}
                <div className="absolute -bottom-8 -left-6 sm:-left-8 bg-white rounded-3xl p-4 shadow-xl border border-brand-cream-dark/60 max-w-xs flex items-center gap-3.5 z-20">
                  <div className="relative h-14 w-14 rounded-2xl overflow-hidden shrink-0 border border-brand-cream-dark/60">
                    <Image
                      src="/image/images1.webp"
                      alt="Attending Physician Consultation"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">
                        Attending Care
                      </span>
                    </div>
                    <p className="text-xs font-bold text-brand-charcoal mt-0.5">Doctor-Led Recovery</p>
                    <p className="text-[11px] text-brand-muted font-medium">Individualized care plan</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* HEALTHCARE STANDARDS & ECOSYSTEM INFINITE LOGO MARQUEE */}
      <section className="py-10 sm:py-12 bg-white border-b border-brand-cream-dark/50 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary block">
            HEALTHCARE STANDARDS &amp; ECOSYSTEM
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-charcoal mt-1">
            Built Around Trusted Healthcare Standards
          </h2>
          <p className="text-xs text-brand-muted font-medium max-w-xl mx-auto mt-1.5">
            Adherence to national regulatory guidelines, quality formulation benchmarks, and responsible medication management.
          </p>
        </div>

        {/* Dual-Track Infinite Marquee (Continuous Motion) */}
        <div className="relative w-full overflow-hidden group-marquee motion-reduce:hidden">
          {/* Edge Fade Gradients */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

          {/* Dual-Track Runner */}
          <div className="flex w-max py-2">
            {/* Track 1 */}
            <div className="animate-marquee-track flex items-center gap-4 sm:gap-6 pr-4 sm:pr-6" aria-hidden="false">
              {[
                {
                  name: 'NAFDAC',
                  logo: '/image/brands/nafdac.png',
                  type: 'Regulatory Standard',
                  alt: 'NAFDAC Healthcare Regulatory Standard',
                },
                {
                  name: 'Emzor Pharmaceuticals',
                  logo: '/image/brands/Emzor-Logo-HIRES-1.jpg',
                  type: 'Essential Formulary',
                  alt: 'Emzor Pharmaceuticals Quality Formulary',
                },
                {
                  name: 'Juhel Healthcare',
                  logo: '/image/brands/Juhel-Logo-1280x462.png',
                  type: 'Formulation Standard',
                  alt: 'Juhel Healthcare Standards',
                },
                {
                  name: 'GSK',
                  logo: '/image/brands/gsk.jpg',
                  type: 'Quality Benchmark',
                  alt: 'GSK International Quality Benchmark',
                },
                {
                  name: 'Afrab Chem',
                  logo: '/image/brands/afrab.jpeg',
                  type: 'Certified Production',
                  alt: 'Afrab Chem Certified Production',
                },
                {
                  name: 'Abbott',
                  logo: '/image/brands/abbot.png',
                  type: 'Diagnostics & Care',
                  alt: 'Abbott Diagnostics and Healthcare',
                },
              ].map((brand, idx) => (
                <div
                  key={`track1-${brand.name}-${idx}`}
                  className="group/brand h-14 sm:h-16 px-4 sm:px-5 flex items-center gap-3 shrink-0 rounded-2xl border border-brand-cream-dark/60 bg-brand-cream-light/40 hover:bg-white hover:border-emerald-500/50 hover:shadow-[0_4px_24px_rgba(16,185,129,0.18)] hover:scale-105 transition-all duration-300 cursor-pointer"
                  title={`${brand.name} • ${brand.type}`}
                >
                  <div className="relative h-9 w-24 sm:w-28 flex items-center justify-center">
                    <Image
                      src={brand.logo}
                      alt={brand.alt}
                      width={120}
                      height={36}
                      className="max-h-8 sm:max-h-9 w-auto object-contain transition-all duration-200"
                    />
                  </div>
                  <div className="hidden sm:block pl-2 border-l border-brand-cream-dark/50 text-left">
                    <p className="text-[11px] font-bold text-brand-charcoal leading-tight group-hover/brand:text-brand-primary transition-colors">
                      {brand.name}
                    </p>
                    <p className="text-[9px] font-semibold text-brand-muted tracking-tight">
                      {brand.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Track 2 (Exact clone for seamless loop) */}
            <div className="animate-marquee-track flex items-center gap-4 sm:gap-6 pr-4 sm:pr-6" aria-hidden="true">
              {[
                {
                  name: 'NAFDAC',
                  logo: '/image/brands/nafdac.png',
                  type: 'Regulatory Standard',
                  alt: 'NAFDAC Healthcare Regulatory Standard',
                },
                {
                  name: 'Emzor Pharmaceuticals',
                  logo: '/image/brands/Emzor-Logo-HIRES-1.jpg',
                  type: 'Essential Formulary',
                  alt: 'Emzor Pharmaceuticals Quality Formulary',
                },
                {
                  name: 'Juhel Healthcare',
                  logo: '/image/brands/Juhel-Logo-1280x462.png',
                  type: 'Formulation Standard',
                  alt: 'Juhel Healthcare Standards',
                },
                {
                  name: 'GSK',
                  logo: '/image/brands/gsk.jpg',
                  type: 'Quality Benchmark',
                  alt: 'GSK International Quality Benchmark',
                },
                {
                  name: 'Afrab Chem',
                  logo: '/image/brands/afrab.jpeg',
                  type: 'Certified Production',
                  alt: 'Afrab Chem Certified Production',
                },
                {
                  name: 'Abbott',
                  logo: '/image/brands/abbot.png',
                  type: 'Diagnostics & Care',
                  alt: 'Abbott Diagnostics and Healthcare',
                },
              ].map((brand, idx) => (
                <div
                  key={`track2-${brand.name}-${idx}`}
                  className="group/brand h-14 sm:h-16 px-4 sm:px-5 flex items-center gap-3 shrink-0 rounded-2xl border border-brand-cream-dark/60 bg-brand-cream-light/40 hover:bg-white hover:border-emerald-500/50 hover:shadow-[0_4px_24px_rgba(16,185,129,0.18)] hover:scale-105 transition-all duration-300 cursor-pointer"
                  title={`${brand.name} • ${brand.type}`}
                >
                  <div className="relative h-9 w-24 sm:w-28 flex items-center justify-center">
                    <Image
                      src={brand.logo}
                      alt={brand.alt}
                      width={120}
                      height={36}
                      className="max-h-8 sm:max-h-9 w-auto object-contain transition-all duration-200"
                    />
                  </div>
                  <div className="hidden sm:block pl-2 border-l border-brand-cream-dark/50 text-left">
                    <p className="text-[11px] font-bold text-brand-charcoal leading-tight group-hover/brand:text-brand-primary transition-colors">
                      {brand.name}
                    </p>
                    <p className="text-[9px] font-semibold text-brand-muted tracking-tight">
                      {brand.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Accessible Static Horizontally Scrollable Fallback (Visible on reduced motion) */}
        <div className="hidden motion-reduce:flex items-center gap-4 overflow-x-auto px-6 py-3 max-w-7xl mx-auto mt-2">
          {[
            {
              name: 'NAFDAC',
              logo: '/image/brands/nafdac.png',
              type: 'Regulatory Standard',
              alt: 'NAFDAC Healthcare Regulatory Standard',
            },
            {
              name: 'Emzor Pharmaceuticals',
              logo: '/image/brands/Emzor-Logo-HIRES-1.jpg',
              type: 'Essential Formulary',
              alt: 'Emzor Pharmaceuticals Quality Formulary',
            },
            {
              name: 'Juhel Healthcare',
              logo: '/image/brands/Juhel-Logo-1280x462.png',
              type: 'Formulation Standard',
              alt: 'Juhel Healthcare Standards',
            },
            {
              name: 'GSK',
              logo: '/image/brands/gsk.jpg',
              type: 'Quality Benchmark',
              alt: 'GSK International Quality Benchmark',
            },
            {
              name: 'Afrab Chem',
              logo: '/image/brands/afrab.jpeg',
              type: 'Certified Production',
              alt: 'Afrab Chem Certified Production',
            },
            {
              name: 'Abbott',
              logo: '/image/brands/abbot.png',
              type: 'Diagnostics & Care',
              alt: 'Abbott Diagnostics and Healthcare',
            },
          ].map((brand) => (
            <div
              key={brand.name}
              className="h-14 px-4 flex items-center gap-3 shrink-0 rounded-2xl border border-brand-cream-dark/60 bg-brand-cream-light/40"
            >
              <Image
                src={brand.logo}
                alt={brand.alt}
                width={120}
                height={34}
                className="max-h-8 w-auto object-contain"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-brand-charcoal">{brand.name}</p>
                <p className="text-[10px] text-brand-muted">{brand.type}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REXORA-INSPIRED PATIENT CARE OVERVIEW & METRICS (Guided by User Image 1) */}
      <section className="py-20 bg-white border-b border-brand-cream-dark/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="bg-brand-cream-light/40 rounded-3xl p-7 sm:p-10 border border-brand-cream-dark/60 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent">
                  Clinical Care Model
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-charcoal mt-1">
                  Patient Care Trajectory & Clinical Overview
                </h2>
                <p className="text-xs text-brand-muted font-medium mt-1">
                  Each residential intake progresses through continuous vital checks, clinical reassessments, and milestone transitions.
                </p>
              </div>

              <div className="shrink-0">
                <span className="px-4 py-2 rounded-full bg-white text-xs font-bold text-brand-charcoal border border-brand-cream-dark/60 shadow-xs">
                  Standard 30-Day Session Track
                </span>
              </div>
            </div>

            {/* Trajectory Milestone Progress Bar (Image 1 Homage) */}
            <div className="bg-white p-6 rounded-2xl border border-brand-cream-dark/50 space-y-3 shadow-xs">
              <div className="flex justify-between items-center text-xs font-bold text-brand-charcoal">
                <span className="flex items-center gap-1.5 text-brand-primary">
                  <Activity className="h-4 w-4" /> Total Care Trajectory
                </span>
                <span className="text-brand-muted font-medium">Week 1 &rarr; Week 4 Discharge</span>
              </div>

              {/* Multi-stage track bar */}
              <div className="relative pt-6 pb-2">
                <div className="h-3 w-full bg-brand-cream-dark/30 rounded-full overflow-hidden flex">
                  <div className="h-full bg-brand-primary w-[45%]" />
                  <div className="h-full bg-brand-accent w-[30%]" />
                  <div className="h-full bg-emerald-500 w-[15%]" />
                  <div className="h-full bg-zinc-200 w-[10%]" />
                </div>

                {/* Milestone Pins */}
                <div className="flex justify-between text-[11px] font-bold text-brand-charcoal mt-3">
                  <div className="text-left">
                    <span className="text-brand-primary">0%</span>
                    <p className="text-[10px] text-brand-muted font-medium">Intake & Detox</p>
                  </div>
                  <div className="text-center">
                    <span className="text-brand-primary">45%</span>
                    <p className="text-[10px] text-brand-muted font-medium">Cognitive Therapy</p>
                  </div>
                  <div className="text-center">
                    <span className="text-brand-accent">75%</span>
                    <p className="text-[10px] text-brand-muted font-medium">Life Skills Reintegration</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-700">100%</span>
                    <p className="text-[10px] text-brand-muted font-medium">Supervised Discharge</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Circular Metric Ring Cards (Matching Image 1 Guide: Total, Stable, Critical, Discharged) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Patients */}
              <div className="bg-white p-5 rounded-2xl border border-brand-cream-dark/50 shadow-xs flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-brand-cream-light text-brand-primary flex items-center justify-center border-2 border-brand-primary/30 mb-3">
                  <Users className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">Total Patients</p>
                <p className="text-2xl font-bold text-brand-charcoal font-serif mt-1">128</p>
                <span className="text-[10px] text-brand-primary font-bold mt-1">Active Residential Registry</span>
              </div>

              {/* Stable Patients */}
              <div className="bg-white p-5 rounded-2xl border border-brand-cream-dark/50 shadow-xs flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center border-2 border-emerald-500/30 mb-3">
                  <Activity className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">Stable Inpatients</p>
                <p className="text-2xl font-bold text-brand-charcoal font-serif mt-1">86 <span className="text-sm text-brand-muted font-sans font-normal">/ 128</span></p>
                <span className="text-[10px] text-emerald-700 font-bold mt-1">Stabilized & Compliant</span>
              </div>

              {/* Critical / Intensive Care */}
              <div className="bg-white p-5 rounded-2xl border border-brand-cream-dark/50 shadow-xs flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border-2 border-amber-500/30 mb-3">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">High Observation</p>
                <p className="text-2xl font-bold text-brand-charcoal font-serif mt-1">12 <span className="text-sm text-brand-muted font-sans font-normal">/ 128</span></p>
                <span className="text-[10px] text-amber-800 font-bold mt-1">24/7 Vitals Monitoring</span>
              </div>

              {/* Discharges */}
              <div className="bg-white p-5 rounded-2xl border border-brand-cream-dark/50 shadow-xs flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-brand-cream-light text-brand-primary flex items-center justify-center border-2 border-brand-primary/30 mb-3">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">Successful Recovery</p>
                <p className="text-2xl font-bold text-brand-charcoal font-serif mt-1">24 <span className="text-sm text-brand-muted font-sans font-normal">/ 128</span></p>
                <span className="text-[10px] text-brand-primary font-bold mt-1">Discharged This Quarter</span>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* CLINICAL SPECIALTIES & AUTHENTIC PHOTOGRAPHY */}
      <section className="py-24 bg-brand-cream-light">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
              Comprehensive Care Programs
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-charcoal">
              Targeted Rehabilitation Across Key Disciplines
            </h2>
            <p className="text-sm text-brand-charcoal/80 font-medium">
              Multidisciplinary programs combining medical supervision, psychological therapy, and life skills coaching.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Therapy & Counseling (images6.jpg) */}
            <div className="rounded-3xl bg-white border border-brand-cream-dark/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="relative h-56 w-full overflow-hidden">
                <Image
                  src="/image/images6.jpg"
                  alt="Psychological Therapy & Counseling Session"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-[10px] font-bold text-brand-primary uppercase">
                  Mental Health
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-brand-charcoal font-serif">
                    Cognitive & Behavioral Counseling
                  </h3>
                  <p className="text-xs text-brand-muted font-medium mt-2 leading-relaxed">
                    One-on-one sessions and supportive peer groups targeting addiction patterns, emotional triggers, and cognitive reframing.
                  </p>
                </div>
                <Link
                  href="/services"
                  className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
                >
                  Learn about therapy tracks &rarr;
                </Link>
              </div>
            </div>

            {/* Card 2: Medical Detox & Vitals (images4.jpg) */}
            <div className="rounded-3xl bg-white border border-brand-cream-dark/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="relative h-56 w-full overflow-hidden">
                <Image
                  src="/image/images4.jpg"
                  alt="Doctor Taking Vital Signs and Medical Monitoring"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-[10px] font-bold text-brand-primary uppercase">
                  Medical Detox
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-brand-charcoal font-serif">
                    Clinical Vitals & Medical Detox
                  </h3>
                  <p className="text-xs text-brand-muted font-medium mt-2 leading-relaxed">
                    Around-the-clock temperature, blood pressure, and pulse monitoring to safely manage withdrawal symptoms and physical stabilization.
                  </p>
                </div>
                <Link
                  href="/services"
                  className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
                >
                  Explore medical protocols &rarr;
                </Link>
              </div>
            </div>

            {/* Card 3: Physician-Led Psychiatric Care (images1.webp) */}
            <div className="rounded-3xl bg-white border border-brand-cream-dark/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="relative h-56 w-full overflow-hidden">
                <Image
                  src="/image/images1.webp"
                  alt="Physician Consultation and Care Planning"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-[10px] font-bold text-brand-primary uppercase">
                  Physician Oversight
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-brand-charcoal font-serif">
                    Persistent Doctor Assignment
                  </h3>
                  <p className="text-xs text-brand-muted font-medium mt-2 leading-relaxed">
                    Every admitted client is assigned a primary attending physician responsible for their clinical records, prescription orders, and discharge evaluation.
                  </p>
                </div>
                <Link
                  href="/services"
                  className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
                >
                  View clinical staff &rarr;
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* THE 30-DAY RESIDENTIAL STRUCTURE BANNER */}
      <section className="py-20 bg-white border-y border-brand-cream-dark/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
                Program Structure
              </span>
              <h2 className="font-serif text-3xl font-bold text-brand-charcoal">
                Why Our Center Uses a 30-Day Evaluation Model
              </h2>
              <p className="text-sm text-brand-charcoal/80 leading-relaxed font-medium">
                We do not believe in indefinite, unaccountable stays. Every admission begins with an intensive 30-day residential session. At the conclusion of each session, a multidisciplinary clinical team performs an evaluation to recommend either safe discharge or an authorized extension.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-brand-primary/10 text-brand-primary shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-charcoal">Active Guardian Alignment</h4>
                    <p className="text-xs text-brand-muted font-medium">Families receive weekly reports, session notes, and immediate consultation if continuation is warranted.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-brand-primary/10 text-brand-primary shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-charcoal">Auditable EMR & eMAR</h4>
                    <p className="text-xs text-brand-muted font-medium">Every dose of medication, vitals entry, and observation note is logged with timestamps and practitioner identity.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden shadow-lg border-2 border-brand-cream-dark/60 aspect-[16/10]">
                <Image
                  src="/image/images2.jpeg"
                  alt="Nibo Residential Quarters and Pavilion"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <p className="text-xs uppercase tracking-wider font-bold text-brand-cream">Residential Quarters</p>
                  <p className="text-sm font-bold">Secure, tranquil living spaces designed for focus and rehabilitation</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FACILITY LOCATION & INTERACTIVE MAP SECTION (Nibo, Awka South LGA) */}
      <section className="py-20 bg-brand-cream-light/60 border-b border-brand-cream-dark/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">
              Facility Location & Visits
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-charcoal">
              Visit Our Sanctuary in Nibo, Awka South
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted font-medium">
              Peacefully situated away from urban noise yet within immediate reach of Awka metropolitan center, major transit arteries, and emergency healthcare facilities.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-brand-cream-dark/60 shadow-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left Col: Contact, Hours & Transit Guidance */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-brand-cream-light/20 border-b lg:border-b-0 lg:border-r border-brand-cream-dark/50">
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-brand-primary">
                    <MapPin className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Physical Address</span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-brand-charcoal mt-1.5">
                    Nibo Rehabilitation Hospital Campus
                  </h3>
                  <p className="text-xs text-brand-charcoal/80 font-medium leading-relaxed mt-1">
                    Nibo Rehabilitation Hospital Road, Off Nibo–Nise Bypass, Awka South LGA, Anambra State, Nigeria.
                  </p>
                </div>

                {/* Transit Note */}
                <div className="bg-white p-3.5 rounded-2xl border border-brand-cream-dark/50 text-xs text-brand-charcoal space-y-1">
                  <p className="font-bold text-brand-charcoal flex items-center gap-1.5">
                    <span>🚗</span> Accessibility & Transit
                  </p>
                  <p className="text-[11px] text-brand-muted leading-relaxed">
                    8 minutes from Eke Awka roundabout; 45 minutes from Asaba International Airport (ABB); 50 minutes from Enugu Airport via the Enugu–Onitsha expressway.
                  </p>
                </div>

                {/* Visiting Hours & Emergency Desk */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-brand-primary/10 text-brand-primary shrink-0 mt-0.5">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-charcoal">Clinical Inpatient Admissions</h4>
                      <p className="text-xs text-brand-muted font-medium">24 Hours / 7 Days a Week (Emergency Intake Supported)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-brand-primary/10 text-brand-primary shrink-0 mt-0.5">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-charcoal">Family Visiting Hours</h4>
                      <p className="text-xs text-brand-muted font-medium">Monday – Sunday: 10:00 AM – 4:00 PM</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-brand-primary/10 text-brand-primary shrink-0 mt-0.5">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-charcoal">Direct Inquiries & Reception</h4>
                      <p className="text-xs text-brand-muted font-medium">
                        Hotline: <strong>+234 803 123 4567</strong> &bull; Desk: +234 809 987 6543
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Action Links */}
              <div className="flex flex-wrap gap-2.5 pt-4 border-t border-brand-cream-dark/50">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=6.1770,7.0700"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2.5 text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Open in Maps ↗</span>
                </a>
                <Link
                  href="/book-appointment"
                  className="rounded-full border border-brand-cream-dark/80 bg-white hover:bg-brand-cream-light text-brand-charcoal px-5 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Schedule Walkthrough
                </Link>
              </div>
            </div>

            {/* Right Col: High-DPI Interactive OpenStreetMap */}
            <div className="lg:col-span-7 relative min-h-[380px] lg:min-h-[460px] bg-brand-cream-light/30">
              <iframe
                title="Nibo Rehabilitation Center Location Map"
                src="https://www.openstreetmap.org/export/embed.html?bbox=7.0450%2C6.1550%2C7.0950%2C6.2000&layer=mapnik&marker=6.1770%2C7.0700"
                className="w-full h-full min-h-[380px] lg:min-h-[460px] border-0"
                loading="lazy"
              />
              {/* Floating Map Label Badge */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-xs border border-brand-cream-dark/60 px-3.5 py-2 rounded-2xl shadow-md text-xs pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
                  <span className="font-bold text-brand-charcoal">Nibo Rehabilitation Center</span>
                </div>
                <span className="text-[10px] text-brand-muted font-mono block mt-0.5">
                  GPS: 6.1770° N, 7.0700° E &bull; Awka South LGA
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL INTAKE CTA BANNER */}
      <section className="py-20 bg-brand-cream-light">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-brand-primary text-white p-8 sm:p-14 shadow-xl relative overflow-hidden">
            <div className="max-w-2xl relative z-10 space-y-4">
              <span className="px-3.5 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider text-white">
                Intake & Visits
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                Take the First Step Toward Professional Healing Today
              </h2>
              <p className="text-sm text-white/90 leading-relaxed font-medium">
                Our clinical intake coordinators are available to answer family inquiries, schedule confidential facility walkthroughs, and conduct intake assessments.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/book-appointment"
                  className="rounded-full bg-brand-accent hover:bg-brand-accent-dark text-white px-8 py-3.5 text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Book an Intake Assessment
                </Link>
                <Link
                  href="/contact"
                  className="rounded-full border border-white/40 hover:bg-white/10 text-white px-6 py-3.5 text-xs font-bold transition-colors cursor-pointer"
                >
                  Contact Reception &rarr;
                </Link>
              </div>
            </div>

            {/* Background art circles */}
            <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-white/5 rounded-full filter blur-2xl" />
          </div>
        </div>
      </section>
    </div>
  );
}
