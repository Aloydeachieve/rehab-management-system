import Link from 'next/link';

export default function ServicesPage() {
  const services = [
    {
      title: 'Residential Care & Stabilization',
      description: 'A structured environment featuring 24/7 care, clean facilities, and clinical supervision to help clients withdraw, stabilize, and focus on healing.',
      icon: '🏥',
    },
    {
      title: 'Behavioral Counseling & Therapy',
      description: 'Intense individual counseling sessions and supportive group therapy led by licensed professionals to treat substance abuse, cognitive-behavioral issues, and habits.',
      icon: '🧠',
    },
    {
      title: 'Medical Supervision & Medications',
      description: 'Safe tracking and administration of prescribed medications under direct professional care. Staff handle and record all drug administrations to ensure strict adherence.',
      icon: '💊',
    },
    {
      title: 'Life Skills & Reintegration',
      description: 'Structured workshops, discipline building, physical exercise, and group sessions to build daily routines and prepare clients for successful discharge.',
      icon: '🌱',
    },
  ];

  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl">
          <span className="text-sm font-semibold uppercase text-teal-600 tracking-wider">Expert Treatment</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl mt-2">
            Our Services & Care Programs
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600">
            We provide targeted, professional services to support clients through residential observation, stabilization, therapy, and reintegration.
          </p>
        </div>

        {/* Services List */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="flex gap-6 rounded-2xl border border-zinc-200 p-8 shadow-sm hover:shadow-md transition-shadow bg-zinc-50/50"
            >
              <div className="text-4xl">{service.icon}</div>
              <div>
                <h3 className="text-lg font-bold text-zinc-950">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{service.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Note on 30-Day program */}
        <div className="mt-20 border-t border-zinc-200 pt-16">
          <div className="rounded-2xl bg-zinc-50 p-8 sm:p-12 ring-1 ring-zinc-200 xl:grid xl:grid-cols-3 xl:gap-12 items-center">
            <div className="xl:col-span-2">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                Understanding the 30-Day Residential Program Structure
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-500">
                We avoid offering indefinite treatment programs. Every formal admission begins with an initial 30-day session. At the end of the 30 days, the clinical team performs an evaluation to recommend either discharge or another 30-day session if care is still required. This ensures high oversight, accountability, and clarity.
              </p>
            </div>
            <div className="mt-8 xl:mt-0 flex justify-end">
              <Link
                href="/book-appointment"
                className="rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors shadow"
              >
                Book Intake Appointment
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
