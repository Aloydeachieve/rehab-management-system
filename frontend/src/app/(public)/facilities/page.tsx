'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, MapPin, CheckCircle, Sparkles, Building2, TreePine, BedDouble, Stethoscope } from 'lucide-react';

export default function FacilitiesPage() {
  const facilityAreas = [
    {
      name: 'Hospital Campus & Administration',
      subtitle: 'Main Clinical Pavilion',
      description: 'The central administration and intake facility, featuring reception lobbies, medical diagnostic stations, and staff monitoring hubs situated in Awka South.',
      image: '/image/images.jpeg',
      amenity: 'Intake reception, electronic records center, secure entry',
      icon: Building2,
    },
    {
      name: 'Residential Quarters & Living Pavilion',
      subtitle: 'Tranquil Recovery Suites',
      description: 'Clean, well-ventilated, and organized accommodations designed to offer quiet rest and psychological security away from urban triggers.',
      image: '/image/images2.jpeg',
      amenity: 'Spacious beds, regular housekeeping, 24/7 security perimeter',
      icon: BedDouble,
    },
    {
      name: 'Medical Detox & Vitals Examination Room',
      subtitle: 'Clinical Supervision Suite',
      description: 'Equipped for routine temperature, pulse, blood pressure, and weight checks, emergency stabilization, and supervised medication administration.',
      image: '/image/images4.jpg',
      amenity: 'Diagnostic monitoring tools, eMAR stations, medical supplies',
      icon: Stethoscope,
    },
    {
      name: 'Confidential Consultation & Therapy Offices',
      subtitle: 'Private Psychological Sanctuary',
      description: 'Comfortable, private spaces for one-on-one psychiatric reviews, cognitive behavioral therapy sessions, and family reassessment meetings.',
      image: '/image/images5.jpg',
      amenity: 'Private soundproof rooms, comfortable seating, assessment desk',
      icon: Sparkles,
    },
  ];

  return (
    <div className="bg-brand-cream-light py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-4 py-1.5 text-xs font-bold text-brand-primary border border-brand-primary/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Facility Tour & Quarters</span>
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-brand-charcoal">
            The Nibo Rehabilitation Center Facility
          </h1>
          <p className="text-base text-brand-charcoal/80 leading-relaxed font-medium">
            Designed as a secure, tranquil, and clinical sanctuary in Awka South, Anambra State, our grounds foster focus, reflection, physical stabilization, and sustainable healing.
          </p>
        </div>

        {/* Facility Areas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {facilityAreas.map((area, idx) => {
            const IconComponent = area.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-brand-cream-dark/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-64 w-full overflow-hidden">
                    <Image
                      src={area.image}
                      alt={area.name}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4 p-2.5 rounded-2xl bg-white/90 backdrop-blur-xs text-brand-primary shadow-sm">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-brand-cream">{area.subtitle}</p>
                      <h3 className="text-lg font-bold font-serif">{area.name}</h3>
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <p className="text-xs sm:text-sm text-brand-charcoal/85 leading-relaxed font-medium">
                      {area.description}
                    </p>
                    <div className="pt-2 border-t border-brand-cream-dark/30">
                      <span className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">Features: </span>
                      <span className="text-xs font-semibold text-brand-charcoal">{area.amenity}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 flex justify-between items-center">
                  <span className="text-[11px] text-brand-muted font-semibold">Awka South Campus</span>
                  <Link
                    href="/book-appointment"
                    className="text-xs font-bold text-brand-primary hover:underline"
                  >
                    Schedule a Tour &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tour CTA Banner */}
        <div className="rounded-3xl bg-brand-primary text-white p-8 sm:p-12 shadow-xl text-center space-y-5">
          <h2 className="font-serif text-3xl font-bold text-white">
            Schedule an In-Person Facility Tour
          </h2>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-white/90 font-medium">
            We welcome families and prospective clients to visit our campus in Nibo, meet the clinical staff, and view residential quarters firsthand.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              href="/book-appointment"
              className="rounded-full bg-white hover:bg-brand-cream text-brand-primary px-7 py-3 text-xs font-bold shadow transition cursor-pointer"
            >
              Book Intake Assessment & Tour
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-white/40 hover:bg-white/10 text-white px-7 py-3 text-xs font-bold transition cursor-pointer"
            >
              Contact Facility Office
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
