'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Stethoscope, HeartPulse, Brain, Activity, Clock, CheckCircle, ShieldCheck, Pill } from 'lucide-react';

export default function ServicesPage() {
  const services = [
    {
      title: 'Medical Detoxification & Stabilization',
      subtitle: 'Supervised Withdrawal Management',
      description: 'Around-the-clock medical oversight during the critical initial detox phase. Attending physicians manage withdrawal symptoms, prescribe tapered protocols, and monitor vital signs 24/7.',
      image: '/image/images4.jpg',
      icon: HeartPulse,
      tags: ['Physician-Supervised', 'Vital Checks', 'eMAR Logged'],
    },
    {
      title: 'Individual & Group Psychotherapy',
      subtitle: 'Cognitive Behavioral & Trauma Therapy',
      description: 'Evidence-based counseling led by licensed clinical psychologists. Sessions address root causes of substance dependency, cognitive distortions, coping mechanisms, and emotional regulation.',
      image: '/image/images6.jpg',
      icon: Brain,
      tags: ['CBT & DBT', 'Peer Support', 'Licensed Psychologists'],
    },
    {
      title: 'Psychiatric Care & Doctor Assignment',
      subtitle: 'Comprehensive Mental Health Diagnostics',
      description: 'Persistent assignment of a named attending physician to every residential client. Regular clinical reviews, psychiatric assessments, and ongoing treatment plan adjustments.',
      image: '/image/images1.webp',
      icon: Stethoscope,
      tags: ['Named Attending Physician', 'Diagnostic Evaluations', 'Care Plans'],
    },
    {
      title: 'Residential Care & Living Environment',
      subtitle: 'Structured 30-Day Recovery Sessions',
      description: 'A serene, distraction-free residential living campus in Nibo. Strict daily schedules including wellness routines, nutritious dining, physical fitness, and educational workshops.',
      image: '/image/images2.jpeg',
      icon: Activity,
      tags: ['24/7 Security', 'Nutritious Meals', 'Reintegration Tracks'],
    },
  ];

  return (
    <div className="bg-brand-cream-light py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-4 py-1.5 text-xs font-bold text-brand-primary border border-brand-primary/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Clinical Programs & Services</span>
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-brand-charcoal">
            Comprehensive Healthcare & Rehabilitation Services
          </h1>
          <p className="text-base text-brand-charcoal/80 leading-relaxed font-medium">
            Every client at Nibo Rehabilitation Center benefits from an integrated care model combining medical stabilization, psychological counseling, structured residential routines, and guardian collaboration.
          </p>
        </div>

        {/* Services Cards with Authentic Photography */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {services.map((service, idx) => {
            const IconComponent = service.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-brand-cream-dark/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-64 w-full overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4 p-2.5 rounded-2xl bg-white/90 backdrop-blur-xs text-brand-primary shadow-sm">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-brand-cream">{service.subtitle}</p>
                      <h3 className="text-lg font-bold font-serif">{service.title}</h3>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <p className="text-xs sm:text-sm text-brand-charcoal/85 leading-relaxed font-medium">
                      {service.description}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {service.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-3 py-1 rounded-full bg-brand-cream-light text-brand-primary border border-brand-cream-dark/60 text-[10px] font-bold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-brand-cream-dark/30 mt-4 flex justify-between items-center">
                  <span className="text-[11px] text-brand-muted font-semibold">Standard 30-Day Session</span>
                  <Link
                    href="/book-appointment"
                    className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
                  >
                    <span>Inquire About Care</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* 30-Day Session Explanation */}
        <div className="rounded-3xl bg-white border border-brand-cream-dark/60 p-8 sm:p-12 shadow-sm">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Accountable Care</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-charcoal">
              Understanding the 30-Day Residential Program Structure
            </h2>
            <p className="text-sm text-brand-charcoal/85 leading-relaxed font-medium">
              We strictly avoid open-ended or indefinite treatment programs. Every admission begins with an initial 30-day session. At the conclusion of day 30, a formal evaluation is conducted by the patient's assigned physician and clinical psychologist to determine whether the patient is ready for safe community reintegration or requires an authorized continuation session.
            </p>
            <div className="pt-2">
              <Link
                href="/book-appointment"
                className="inline-flex items-center gap-2 rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-7 py-3 text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <span>Book Intake Evaluation Appointment</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
