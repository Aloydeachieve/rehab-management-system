import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="bg-brand-cream-light">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-28 sm:py-36 bg-brand-cream-light border-b border-brand-cream-dark/50">
        {/* Background Decorative Grid and Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <svg className="absolute inset-0 h-full w-full stroke-brand-primary/5" fill="none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="hero-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-cream via-transparent to-brand-accent/5" />
        </div>

        {/* Soft Abstract Background Circles */}
        <div className="absolute right-0 bottom-0 top-0 w-1/2 hidden lg:flex items-center justify-center z-0 opacity-80 pointer-events-none">
          <div className="relative w-[500px] h-[500px]">
            <div className="absolute inset-0 rounded-full bg-brand-accent/5 filter blur-3xl" />
            <svg className="w-full h-full text-brand-primary/10" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="100" cy="100" r="50" fill="currentColor" fillOpacity="0.2" />
              <path d="M100 30 C110 50, 110 80, 100 100 C90 80, 90 50, 100 30 Z" fill="#c85a3c" fillOpacity="0.15" />
              <path d="M100 100 C110 120, 110 150, 100 170 C90 150, 90 120, 100 100 Z" fill="currentColor" fillOpacity="0.3" />
            </svg>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full bg-brand-primary/5 px-4 py-1.5 text-xs font-semibold tracking-wider text-brand-primary uppercase ring-1 ring-inset ring-brand-primary/10 mb-8">
              Nibo, Anambra State, Nigeria
            </span>
            <h1 className="font-serif text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-brand-charcoal leading-[1.1] mb-8">
              Begin Your Journey to <span className="text-brand-accent block sm:inline">Healing</span> & Recovery
            </h1>
            <p className="text-lg sm:text-xl text-brand-charcoal-light leading-relaxed max-w-2xl mb-12">
              Nibo Rehabilitation Center offers a peaceful, structured residential environment designed to support individuals through professional clinical care, therapy, and holistic healing.
            </p>
            <div className="flex flex-wrap gap-5">
              <Link
                href="/book-appointment"
                className="rounded-full bg-brand-accent hover:bg-brand-accent-dark text-white px-8 py-4 text-base font-semibold shadow-lg shadow-brand-accent/20 hover:shadow-xl hover:shadow-brand-accent/30 transition-all duration-300 transform hover:scale-[1.02]"
              >
                Request an Appointment
              </Link>
              <Link
                href="/services"
                className="rounded-full border-2 border-brand-primary/25 hover:border-brand-primary text-brand-primary hover:bg-brand-primary/5 px-8 py-4 text-base font-semibold transition-all duration-300"
              >
                Our Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principle: 30-Day Residential Program */}
      <section className="py-24 sm:py-32 bg-brand-cream border-y border-brand-cream-dark/60 relative overflow-hidden">
        {/* Soft decorative background circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-brand-primary/5 rounded-full filter blur-2xl opacity-40 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-accent/5 rounded-full filter blur-3xl opacity-40 translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold tracking-widest text-brand-accent uppercase block mb-3">
              The Cornerstone of Recovery
            </span>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-charcoal sm:text-5xl leading-tight">
              The Initial 30-Day Residential Session
            </h2>
            <p className="mt-6 text-lg text-brand-charcoal-light leading-relaxed">
              Every formal admission at our center starts with a structured, professional 30-day program centered around clinical observation, intensive assessment, and personalized care planning.
            </p>
          </div>

          <div className="mx-auto mt-20 max-w-5xl">
            <div className="relative">
              {/* Connecting Line for Timeline */}
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-brand-cream-dark/60 -translate-y-1/2 hidden md:block z-0" />

              <div className="grid grid-cols-1 gap-12 md:grid-cols-3 relative z-10">
                {/* Step 1 */}
                <div className="flex flex-col items-center text-center bg-white p-8 rounded-2xl shadow-sm border border-brand-cream-dark/50 hover:shadow-md transition-shadow duration-300">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-white font-serif font-bold text-lg mb-6 shadow-md ring-4 ring-brand-cream">
                    1
                  </div>
                  <div className="p-3.5 bg-brand-cream rounded-xl mb-5 text-brand-primary">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-brand-charcoal">Observation & Assessment</h3>
                  <p className="mt-3 text-sm text-brand-charcoal-light leading-relaxed">
                    During the first 30 days, our professional medical and clinical team observes, assesses progress, and implements immediate treatment strategies.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center bg-white p-8 rounded-2xl shadow-sm border border-brand-cream-dark/50 hover:shadow-md transition-shadow duration-300">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-white font-serif font-bold text-lg mb-6 shadow-md ring-4 ring-brand-cream">
                    2
                  </div>
                  <div className="p-3.5 bg-brand-cream rounded-xl mb-5 text-brand-primary">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-brand-charcoal">Professional Reassessment</h3>
                  <p className="mt-3 text-sm text-brand-charcoal-light leading-relaxed">
                    At the conclusion of the 30-day session, a qualified professional reassesses progress to determine if continuation or discharge is appropriate.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center bg-white p-8 rounded-2xl shadow-sm border border-brand-cream-dark/50 hover:shadow-md transition-shadow duration-300">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-white font-serif font-bold text-lg mb-6 shadow-md ring-4 ring-brand-cream">
                    3
                  </div>
                  <div className="p-3.5 bg-brand-cream rounded-xl mb-5 text-brand-primary">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-brand-charcoal">Guardian Communication</h3>
                  <p className="mt-3 text-sm text-brand-charcoal-light leading-relaxed">
                    Guardians receive timely notifications when continuation is recommended, keeping families aligned and involved in every step.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <span className="text-xs font-bold tracking-widest text-brand-accent uppercase block mb-3">
              Core Care Areas
            </span>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-charcoal sm:text-5xl">
              Professional Rehabilitation & Treatment
            </h2>
            <p className="mt-6 max-w-2xl text-lg text-brand-charcoal-light lg:mx-auto leading-relaxed">
              Our clinical and counseling resources are tailored to provide holistic care for clients.
            </p>
          </div>

          <div className="mt-20">
            <dl className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-16 lg:grid-cols-4 lg:gap-x-8">
              <div className="relative pl-16">
                <dt className="text-base font-bold leading-7 text-brand-charcoal">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white shadow-md shadow-brand-primary/10">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                  </div>
                  Clinical Supervision
                </dt>
                <dd className="mt-3 text-sm text-brand-charcoal-light leading-relaxed font-medium">
                  24/7 care led by dedicated professionals to ensure physical and emotional stabilization.
                </dd>
              </div>

              <div className="relative pl-16">
                <dt className="text-base font-bold leading-7 text-brand-charcoal">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white shadow-md shadow-brand-primary/10">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  Therapy & Counseling
                </dt>
                <dd className="mt-3 text-sm text-brand-charcoal-light leading-relaxed font-medium">
                  One-on-one sessions and group therapies addressing substance abuse and behavioral challenges.
                </dd>
              </div>

              <div className="relative pl-16">
                <dt className="text-base font-bold leading-7 text-brand-charcoal">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white shadow-md shadow-brand-primary/10">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                    </svg>
                  </div>
                  Medication Tracking
                </dt>
                <dd className="mt-3 text-sm text-brand-charcoal-light leading-relaxed font-medium">
                  Rigorous, staff-administered medication tracking to support recovery safely.
                </dd>
              </div>

              <div className="relative pl-16">
                <dt className="text-base font-bold leading-7 text-brand-charcoal">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white shadow-md shadow-brand-primary/10">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  Family Integration
                </dt>
                <dd className="mt-3 text-sm text-brand-charcoal-light leading-relaxed font-medium">
                  Empowering and communicating with guardians through progress reports and message channels.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Booking CTA Banner */}
      <section className="bg-brand-cream border-t border-brand-cream-dark/60 py-20 relative overflow-hidden">
        {/* Soft abstract graphic overlay */}
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-brand-primary/5 rounded-full filter blur-3xl opacity-60 translate-x-1/3 translate-y-1/3 pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-charcoal sm:text-5xl leading-tight">
            Need Guidance or Want to Visit the Center?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-charcoal-light leading-relaxed font-medium">
            Book an appointment online. Our reception team will review and contact you promptly.
          </p>
          <div className="mt-10 flex justify-center items-center gap-x-6">
            <Link
              href="/book-appointment"
              className="rounded-full bg-brand-accent hover:bg-brand-accent-dark px-8 py-4 text-sm font-bold text-white shadow-lg shadow-brand-accent/20 transition-all hover:scale-105"
            >
              Book an Appointment
            </Link>
            <Link href="/contact" className="text-sm font-bold leading-6 text-brand-primary flex items-center gap-1 hover:text-brand-primary-light transition-colors">
              Contact Center <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
