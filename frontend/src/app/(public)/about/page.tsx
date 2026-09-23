'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Heart, Users, Award, MapPin, CheckCircle, Stethoscope } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-brand-cream-light py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-4 py-1.5 text-xs font-bold text-brand-primary border border-brand-primary/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>About Nibo Rehabilitation Center</span>
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-brand-charcoal">
            Compassionate, Evidence-Based Residential Care
          </h1>
          <p className="text-base text-brand-charcoal/80 leading-relaxed font-medium">
            Located in Awka South Local Government Area, Anambra State, our center provides a serene, highly structured sanctuary for individuals overcoming addiction, behavioral disorders, and psychological challenges.
          </p>
        </div>

        {/* Story Section with authentic photo images3.jpg */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 text-sm text-brand-charcoal/85 leading-relaxed font-medium">
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal">Our Mission & Clinical Philosophy</h2>
            <p>
              We believe that true recovery requires more than isolation—it demands active clinical intervention, physical stabilization, cognitive restructuring, and familial reintegration. Every resident admitted to Nibo Rehabilitation Center is treated with absolute dignity and respect.
            </p>
            <p>
              Our multidisciplinary team consists of licensed psychiatric consultants, general medical practitioners, clinical psychologists, certified addiction counselors, and 24/7 residential nurses who coordinate care through digital electronic medical records.
            </p>

            <div className="pt-2 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-brand-cream-dark/60 shadow-xs">
                <p className="text-2xl font-bold text-brand-primary font-serif">100%</p>
                <p className="text-xs text-brand-muted font-medium mt-0.5">Licensed Clinical Staff</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-brand-cream-dark/60 shadow-xs">
                <p className="text-2xl font-bold text-brand-primary font-serif">24/7</p>
                <p className="text-xs text-brand-muted font-medium mt-0.5">On-Site Supervision</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white aspect-[4/3]">
              <Image
                src="/image/images3.jpg"
                alt="Multidisciplinary Medical Care Team at Nibo"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs uppercase font-bold text-brand-cream tracking-wider">Clinical Care Team</p>
                <p className="text-sm font-bold mt-0.5">Physicians & Clinicians Collaborating on Digital Patient Records</p>
              </div>
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="rounded-3xl bg-white border border-brand-cream-dark/60 p-8 sm:p-12 shadow-sm space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Our Foundation</span>
            <h2 className="font-serif text-3xl font-bold text-brand-charcoal">Core Guiding Principles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-brand-cream-light/50 border border-brand-cream-dark/40 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-brand-charcoal text-base">Clinical Responsibility</h3>
              <p className="text-xs text-brand-muted font-medium leading-relaxed">
                Clear lines of medical accountability: each patient is assigned a named attending physician who oversees diagnoses, prescription protocols, and therapy plans.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-brand-cream-light/50 border border-brand-cream-dark/40 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                <Heart className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-brand-charcoal text-base">Compassionate Empathy</h3>
              <p className="text-xs text-brand-muted font-medium leading-relaxed">
                Addiction and emotional trauma are medical and psychological challenges, not moral failures. We provide a restorative environment free of stigma.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-brand-cream-light/50 border border-brand-cream-dark/40 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-brand-charcoal text-base">Guardian Partnership</h3>
              <p className="text-xs text-brand-muted font-medium leading-relaxed">
                We believe recovery is sustained when families are involved. Guardians receive weekly progress reports and participate in reassessment conferences.
              </p>
            </div>
          </div>
        </div>

        {/* Location & Facility Overview with images5.jpg */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white aspect-[4/3]">
              <Image
                src="/image/images5.jpg"
                alt="Doctor Consultation Across Desk"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs uppercase font-bold text-brand-cream tracking-wider">Private Clinical Rooms</p>
                <p className="text-sm font-bold mt-0.5">Confidential One-on-One Physician and Psychology Consultations</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Strategic Setting</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-charcoal">
              Quiet Healing in Awka South, Anambra State
            </h2>
            <p className="text-sm text-brand-charcoal/85 leading-relaxed font-medium">
              Located in the tranquil enclave of Nibo, our center offers immediate proximity to Awka municipal facilities while maintaining secluded, secure grounds that insulate clients from the stresses, triggers, and distractions of daily urban life.
            </p>
            <div className="pt-3">
              <Link
                href="/facilities"
                className="inline-flex items-center gap-2 rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-6 py-3 text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <span>View Facility Grounds & Quarters</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="rounded-3xl bg-brand-primary text-white p-8 sm:p-12 shadow-xl text-center space-y-5">
          <h2 className="font-serif text-3xl font-bold text-white">
            Schedule a Confidential Intake Consultation
          </h2>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-white/90 font-medium">
            Our clinical team is available to discuss your family member's circumstances and organize an in-person assessment.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              href="/book-appointment"
              className="rounded-full bg-white hover:bg-brand-cream text-brand-primary px-7 py-3 text-xs font-bold shadow transition cursor-pointer"
            >
              Book Appointment
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-white/40 hover:bg-white/10 text-white px-7 py-3 text-xs font-bold transition cursor-pointer"
            >
              Contact Reception
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
