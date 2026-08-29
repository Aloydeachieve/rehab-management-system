import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
          Terms of Service & Notices
        </h1>
        <p className="mt-2 text-xs text-zinc-400">Last updated: August 28, 2026</p>

        <div className="mt-8 space-y-6 text-sm text-zinc-600 leading-relaxed">
          <p>
            Welcome to the Nibo Rehabilitation Center website. By using this website, requesting appointments, or registering as a guardian, you agree to comply with the terms and operational notices detailed below.
          </p>

          <h2 className="text-lg font-bold text-zinc-900 mt-6">1. Appointment Requests</h2>
          <p>
            Submitting an appointment booking form online is a request only and does not constitute:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>A guaranteed slot until approved or rescheduled by the reception team.</li>
            <li>A formal admission to the residential program (admission decisions are made solely by qualified practitioners after physical intakes).</li>
          </ul>

          <h2 className="text-lg font-bold text-zinc-900 mt-6">2. Admissions & Guardian Responsibilities</h2>
          <p>
            Every client formally admitted into residential rehabilitation starts with an initial 30-day program. Guardians are required to provide complete, accurate medical histories and maintain continuous communication with our front desk.
          </p>

          <h2 className="text-lg font-bold text-zinc-900 mt-6">3. Clinical & Medical Disclaimer</h2>
          <p>
            The information contained on this website is for informational purposes only. Specific clinical decisions, diagnoses, and treatment paths belong exclusively to qualified medical practitioners.
          </p>

          <h2 className="text-lg font-bold text-zinc-900 mt-6">4. Contact Information</h2>
          <p>
            For any queries or formal intake requests, please visit the center or email us at info@niborehab.org.
          </p>
        </div>

        <div className="mt-12 pt-6 border-t border-zinc-200">
          <Link href="/" className="text-sm font-semibold text-teal-600 hover:text-teal-700">
            &larr; Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
