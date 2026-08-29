import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs text-zinc-400">Last updated: August 28, 2026</p>

        <div className="mt-8 space-y-6 text-sm text-zinc-600 leading-relaxed">
          <p>
            Nibo Rehabilitation Center ("we," "our," or "the center") is committed to protecting the privacy of visitors and guardians. This Privacy Policy describes how we handle the information collected through our public website and appointment request processes.
          </p>

          <h2 className="text-lg font-bold text-zinc-900 mt-6">1. Information We Collect</h2>
          <p>
            When you request an appointment or contact our center, we collect the details you provide to us:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Contact Details:</strong> Name, phone number, email address.</li>
            <li><strong>Appointment Information:</strong> Preferred date and time, reason for request, and optional notes.</li>
          </ul>

          <h2 className="text-lg font-bold text-zinc-900 mt-6">2. How We Use Your Information</h2>
          <p>
            We use the collected information solely to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Review and schedule intake or visitation appointments.</li>
            <li>Send email updates regarding your appointment request status.</li>
            <li>Respond to your direct inquiries.</li>
          </ul>

          <h2 className="text-lg font-bold text-zinc-900 mt-6">3. Information Protection</h2>
          <p>
            We enforce strict role-based access control internally. Patient and visitor request information is only visible to authorized administrative and receptionist staff. We do not sell, rent, or share your contact information with third parties.
          </p>

          <h2 className="text-lg font-bold text-zinc-900 mt-6">4. Contact Us</h2>
          <p>
            If you have questions about this policy, you can contact us at info@niborehab.org.
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
