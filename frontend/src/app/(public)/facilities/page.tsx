import Link from 'next/link';

export default function FacilitiesPage() {
  const facilityAreas = [
    {
      name: 'Residential Quarters',
      description: 'Clean, well-ventilated, and organized rooms designed to provide a comfortable and restful environment for clients during their observation and treatment.',
      amenity: 'Spacious beds, regular cleanup, security check'
    },
    {
      name: 'Therapy & Counseling Rooms',
      description: 'Private, quiet counseling offices and group therapy spaces designed for supportive conversations, client evaluations, and counseling sessions.',
      amenity: 'Private settings, comfortable seating, whiteboards'
    },
    {
      name: 'Recreation & Wellness Areas',
      description: 'Dedicated spaces for physical exercise, outdoor walks, and reflection to support physical well-being alongside mental healing.',
      amenity: 'Gym tools, walking paths, seating tables'
    },
    {
      name: 'Dining & Nutritional Services',
      description: 'A clean, communal dining hall where clients receive healthy, freshly prepared meals designed to support recovery and nutrition.',
      amenity: 'Communal dining tables, balanced meal menus'
    }
  ];

  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl">
          <span className="text-sm font-semibold uppercase text-teal-600 tracking-wider">Our Environment</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl mt-2">
            The Nibo Rehabilitation Facility
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600">
            A secure, serene, and clean environment specifically designed to support long-term recovery and clinical observation in Awka South, Anambra State.
          </p>
        </div>

        {/* Facilities list */}
        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {facilityAreas.map((area, idx) => (
            <div key={idx} className="flex flex-col border border-zinc-200 rounded-2xl overflow-hidden shadow-sm bg-zinc-50">
              {/* Mock visual placeholder using nice layout */}
              <div className="h-48 bg-zinc-900 text-white flex flex-col justify-end p-6 relative overflow-hidden">
                <span className="text-xs uppercase tracking-wider text-teal-400 font-semibold mb-2">Facility Section</span>
                <h3 className="text-2xl font-bold relative z-10">{area.name}</h3>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-0" />
                <div className="absolute top-4 right-4 text-3xl">🏢</div>
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-between flex-grow">
                <p className="text-sm leading-relaxed text-zinc-600">{area.description}</p>
                <div className="mt-6 pt-4 border-t border-zinc-200">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Key Details:</span>
                  <span className="ml-2 text-sm text-zinc-800 font-medium">{area.amenity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tour CTA banner */}
        <div className="mt-20 border-t border-zinc-200 pt-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
            Want to see the facility in person?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500">
            Intake visits and facility tours must be scheduled in advance through our appointment form.
          </p>
          <div className="mt-8">
            <Link
              href="/book-appointment"
              className="rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors shadow"
            >
              Request Intake Visit Appointment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
