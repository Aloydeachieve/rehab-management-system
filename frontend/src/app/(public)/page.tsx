import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-32 bg-zinc-950 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full bg-teal-500/10 px-3 py-1 text-sm font-medium text-teal-400 ring-1 ring-inset ring-teal-500/20 mb-6">
              Nibo, Anambra State, Nigeria
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
              Begin Your Journey to <span className="text-teal-400">Healing</span> & Recovery
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              Nibo Rehabilitation Center offers a peaceful, structured residential environment designed to support individuals through professional clinical care, therapy, and healing.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/book-appointment"
                className="rounded-full bg-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 transition-all"
              >
                Request an Appointment
              </Link>
              <Link
                href="/services"
                className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-900 transition-all"
              >
                Our Services
              </Link>
            </div>
          </div>
        </div>
        {/* Background Decorative Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-900/30 via-zinc-950 to-zinc-950 z-0" />
      </section>

      {/* Core Principle: 30-Day Residential Program */}
      <section className="py-20 sm:py-24 bg-zinc-50 border-y border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              The Initial 30-Day Residential Session
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              Every formal admission at our center starts with an initial 30-day treatment and observation program.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-5xl sm:mt-20 lg:mt-24">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="flex flex-col rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white font-bold">1</div>
                <h3 className="mt-6 text-lg font-semibold text-zinc-900">Observation & Assessment</h3>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
                  During the first 30 days, our professional medical and clinical team observes, assesses progress, and implements immediate treatment strategies.
                </p>
              </div>

              <div className="flex flex-col rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white font-bold">2</div>
                <h3 className="mt-6 text-lg font-semibold text-zinc-900">Professional Reassessment</h3>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
                  At the conclusion of the 30-day session, a qualified professional reassesses progress to determine if continuation or discharge is appropriate.
                </p>
              </div>

              <div className="flex flex-col rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white font-bold">3</div>
                <h3 className="mt-6 text-lg font-semibold text-zinc-900">Guardian Communication</h3>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
                  Guardians receive timely notifications when continuation is recommended, keeping families aligned and involved in every step.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base font-semibold text-teal-600 tracking-wide uppercase">Core Care Areas</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Professional Rehabilitation & Treatment
            </p>
            <p className="mt-4 max-w-2xl text-lg text-zinc-500 lg:mx-auto">
              Our clinical and counseling resources are tailored to provide holistic care for clients.
            </p>
          </div>

          <div className="mt-16 sm:mt-20 lg:mt-24">
            <dl className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-16 lg:grid-cols-4 lg:gap-x-8">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-zinc-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                  </div>
                  Clinical Supervision
                </dt>
                <dd className="mt-2 text-sm text-zinc-500 leading-relaxed">
                  24/7 care led by dedicated professionals to ensure physical and emotional stabilization.
                </dd>
              </div>

              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-zinc-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  Therapy & Counseling
                </dt>
                <dd className="mt-2 text-sm text-zinc-500 leading-relaxed">
                  One-on-one sessions and group therapies addressing substance abuse and behavioral challenges.
                </dd>
              </div>

              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-zinc-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                    </svg>
                  </div>
                  Medication Tracking
                </dt>
                <dd className="mt-2 text-sm text-zinc-500 leading-relaxed">
                  Rigorous, staff-administered medication tracking to support recovery safely.
                </dd>
              </div>

              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-zinc-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  Family Integration
                </dt>
                <dd className="mt-2 text-sm text-zinc-500 leading-relaxed">
                  Empowering and communicating with guardians through progress reports and message channels.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Booking CTA Banner */}
      <section className="bg-teal-50 border-t border-teal-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-teal-950 sm:text-4xl">
            Need Guidance or Want to Visit the Center?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-teal-800">
            Book an appointment online. Our reception team will review and contact you promptly.
          </p>
          <div className="mt-8 flex justify-center gap-x-6">
            <Link
              href="/book-appointment"
              className="rounded-full bg-teal-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-all hover:scale-105"
            >
              Book an Appointment
            </Link>
            <Link href="/contact" className="text-sm font-semibold leading-6 text-teal-900 flex items-center gap-1 hover:text-teal-700">
              Contact Center <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
