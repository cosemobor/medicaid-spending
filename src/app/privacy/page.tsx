import type { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Privacy Policy — Medicaid Provider Spending Explorer',
  description: 'Privacy policy for Medicaid Provider Spending Explorer.',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Last updated: February 2026
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          1. Information We Collect
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Our hosting provider (Vercel) automatically collects standard server
          logs, which include IP addresses, browser type, referring URLs, and
          pages requested. We do not collect personal information such as names,
          email addresses, or account credentials. The Site does not require user
          registration or login.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          2. How We Use Information
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Server logs are used to operate, maintain, and monitor the
          performance of the Site. We do not sell personal information.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          3. Third-Party Services
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          The Site relies on third-party services to function. These services
          receive standard web requests when you use the Site and are governed
          by their own privacy policies:
        </p>
        <ul className="mt-2 space-y-2 text-sm text-gray-500">
          <li>
            <strong>Vercel</strong> — Hosting and serverless infrastructure
          </li>
          <li>
            <strong>Turso</strong> — Database hosting
          </li>
        </ul>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          We do not control the data practices of these third-party services.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          4. Cookies
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          The Site does not set cookies. No data is stored locally on your
          device by this Site.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          5. Data Sharing
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          We do not sell or share personal information with third parties for
          marketing purposes. We will disclose information if required by law,
          legal process, or governmental request, or to protect our rights,
          property, or safety.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          6. Data Retention
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Server logs are retained in accordance with our hosting
          provider&apos;s standard practices. We do not independently store
          personal information about visitors beyond what is captured in
          standard server logs.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          7. Security
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          We use commercially reasonable measures to protect the Site and its
          infrastructure. However, no method of transmission over the Internet
          or method of electronic storage is 100% secure, and we cannot
          guarantee absolute security.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          8. Children
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          The Site is not directed at children under the age of 13. We do not
          knowingly collect information from children under 13. If you believe
          a child has provided information through the Site, please contact us
          so we can take appropriate action.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          9. Changes to This Policy
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          We reserve the right to update this Privacy Policy at any time.
          Changes take effect immediately upon posting to the Site. Your
          continued use of the Site after any modification constitutes your
          acceptance of the updated policy.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          10. Contact
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Questions about this Privacy Policy may be directed to{' '}
          <a
            href="https://x.com/calebosemobor"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            @calebosemobor
          </a>{' '}
          on X.
        </p>
      </section>

      <div className="mt-12 flex gap-4 border-t border-gray-200 pt-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          Explorer
        </Link>
        <Link href="/terms" className="text-sm text-blue-600 hover:underline">
          Terms of Use
        </Link>
        <Link href="/about" className="text-sm text-blue-600 hover:underline">
          About
        </Link>
      </div>
    </main>
  );
}
