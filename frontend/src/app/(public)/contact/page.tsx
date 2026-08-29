import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl">
          <span className="text-sm font-semibold uppercase text-teal-600 tracking-wider">Get in Touch</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl mt-2">
            Contact Our Center
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600">
            Have questions about admission processes, visiting hours, or program costs? Reach out to us directly or request an intake appointment.
          </p>
        </div>

        {/* Contact details and details layout */}
        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          {/* Details column */}
          <div className="space-y-8 rounded-2xl border border-zinc-200 p-8 sm:p-10 bg-zinc-50">
            <h2 className="text-2xl font-bold text-zinc-950">Nibo Rehabilitation Center</h2>
            <div className="space-y-6 text-zinc-600 text-sm">
              <div className="flex gap-4">
                <span className="text-2xl">📍</span>
                <div>
                  <h3 className="font-semibold text-zinc-900">Physical Address</h3>
                  <p className="mt-1">Awka South LGA, Nibo, Anambra State, Nigeria</p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="text-2xl">📞</span>
                <div>
                  <h3 className="font-semibold text-zinc-900">Phone Support</h3>
                  <p className="mt-1">+234 803 000 0000</p>
                  <p className="text-xs text-zinc-400">Available Monday - Friday, 9:00 AM - 5:00 PM</p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="text-2xl">✉️</span>
                <div>
                  <h3 className="font-semibold text-zinc-900">Email Inquiries</h3>
                  <p className="mt-1">info@niborehab.org</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick options column */}
          <div className="rounded-2xl bg-teal-950 p-8 sm:p-10 text-white relative overflow-hidden">
            <h2 className="text-2xl font-bold relative z-10">Quick Intake Assessment</h2>
            <p className="mt-4 text-sm text-teal-200 relative z-10 leading-relaxed">
              If you or a loved one requires immediate observation and clinical rehabilitation, the quickest path is to schedule an intake assessment appointment.
            </p>
            <p className="mt-2 text-sm text-teal-200 relative z-10 leading-relaxed">
              Our receptionist and medical professionals will review your booking request and schedule a clinical evaluation at our center.
            </p>
            <div className="mt-8 relative z-10">
              <Link
                href="/book-appointment"
                className="inline-flex w-full sm:w-auto justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-teal-950 hover:bg-zinc-100 transition-colors shadow"
              >
                Schedule Assessment Now
              </Link>
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-800 via-teal-950 to-teal-950 z-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
