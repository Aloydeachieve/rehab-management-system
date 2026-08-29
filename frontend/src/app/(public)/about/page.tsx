import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            About Our Center
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600">
            Nibo Rehabilitation Center is a specialized residential treatment facility dedicated to restoring lives, rebuilding relationships, and providing top-tier professional guidance.
          </p>
        </div>

        {/* Story Section */}
        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          <div className="space-y-6 text-zinc-600 leading-relaxed text-sm">
            <h2 className="text-2xl font-bold text-zinc-950">Our Mission</h2>
            <p>
              Our mission is to deliver comprehensive, compassionate, and evidence-based treatment programs that empower individuals to overcome behavioral health and substance use challenges. We believe in providing structured clinical care, supportive therapy, and practical tools to ensure long-term wellness.
            </p>
            <h2 className="text-2xl font-bold text-zinc-950 mt-8">Our Location</h2>
            <p>
              Located in the peaceful town of Nibo, Awka South Local Government Area, Anambra State, Nigeria, our facility offers a quiet and secure environment far removed from daily stressors, creating the perfect space for reflection, observation, and healing.
            </p>
          </div>

          {/* Core Values card */}
          <div className="rounded-2xl bg-zinc-50 p-8 ring-1 ring-zinc-200">
            <h2 className="text-xl font-bold text-zinc-950 mb-6">Our Core Values</h2>
            <dl className="space-y-6">
              <div>
                <dt className="font-semibold text-zinc-900">Professional Integrity</dt>
                <dd className="mt-1 text-sm text-zinc-500">Every diagnostic evaluation, treatment plan, and clinical record is maintained by certified practitioners using the highest standards of ethics and confidentiality.</dd>
              </div>
              <div>
                <dt className="font-semibold text-zinc-900">Empathy & Respect</dt>
                <dd className="mt-1 text-sm text-zinc-500">We treat all clients with absolute dignity, understanding their unique circumstances and challenges.</dd>
              </div>
              <div>
                <dt className="font-semibold text-zinc-900">Family & Guardian Alignment</dt>
                <dd className="mt-1 text-sm text-zinc-500">We keep guardians informed and aligned throughout the residential treatment process, recognizing that family support is vital to recovery.</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* CTA banner */}
        <div className="mt-20 rounded-2xl bg-teal-900 px-6 py-10 sm:px-12 sm:py-16 text-center text-white relative overflow-hidden">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl relative z-10">
            Ready to learn more or request a tour?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-300 relative z-10">
            Our team is here to answer your questions and schedule an intake assessment appointment.
          </p>
          <div className="mt-8 flex justify-center gap-x-4 relative z-10">
            <Link
              href="/book-appointment"
              className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-teal-950 shadow hover:bg-zinc-100 transition-colors"
            >
              Book Intake Assessment
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-teal-600 px-6 py-2.5 text-sm font-semibold hover:bg-teal-800 transition-colors"
            >
              Contact Us
            </Link>
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-teal-800 via-teal-950 to-teal-950 z-0" />
        </div>
      </div>
    </div>
  );
}
