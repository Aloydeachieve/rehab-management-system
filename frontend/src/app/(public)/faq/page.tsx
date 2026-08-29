import Link from 'next/link';

export default function FAQPage() {
  const faqs = [
    {
      q: 'What is the duration of residential treatment?',
      a: 'Every patient is admitted into an initial 30-day residential session. This period is used for clinical stabilization and observation. At the end of the 30 days, the clinical team reassesses the patient to recommend either discharge or continuation into another 30-day session.'
    },
    {
      q: 'How much does treatment cost, and how is payment handled?',
      a: 'We invoice guardians on a per-session basis (for each 30-day residential treatment block). The system notifies guardians via email when a session is approaching its end and a continuation invoice is generated. Payment must be cleared prior to the start of the next session.'
    },
    {
      q: 'Can family members visit patients during their stay?',
      a: 'Visitation is highly regulated to support clinical progress. Visits must be approved in advance by the assigned medical practitioner and reception team, and are subject to patient progress and center rules.'
    },
    {
      q: 'What should a patient bring for residential care?',
      a: 'Patients require basic personal clothing, hygiene products, and any current medical prescriptions. All electronics, personal medications, and valuables are checked in with the reception desk at intake and managed securely.'
    },
    {
      q: 'How does communication work between guardians and the center?',
      a: 'Guardians can communicate directly with the receptionist. We also have a secure messaging framework where receptionists reply to guardian questions and send daily operational/clinical updates as permitted.'
    }
  ];

  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl">
          <span className="text-sm font-semibold uppercase text-teal-600 tracking-wider">Common Questions</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl mt-2">
            Frequently Asked Questions
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600">
            Find answers to common questions about admissions, treatment sessions, costs, and guardian responsibilities.
          </p>
        </div>

        {/* FAQ list */}
        <div className="mt-16 max-w-4xl divide-y divide-zinc-200">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-8 first:pt-0">
              <h3 className="text-lg font-bold text-zinc-950">{faq.q}</h3>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600">{faq.a}</p>
            </div>
          ))}
        </div>

        {/* Still have questions banner */}
        <div className="mt-20 border-t border-zinc-200 pt-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
            Still have questions?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500">
            If you need more details about the center or have a specific inquiry, please contact our team.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/contact"
              className="rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors shadow"
            >
              Contact Us
            </Link>
            <Link
              href="/book-appointment"
              className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold hover:bg-zinc-50 transition-colors"
            >
              Book an Appointment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
