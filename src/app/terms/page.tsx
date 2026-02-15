import type { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Terms of Use — Medicaid Provider Spending Explorer',
  description: 'Terms of use for Medicaid Provider Spending Explorer.',
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
        Terms of Use
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Last updated: February 2026
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          1. Acceptance of Terms
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          By accessing or using Medicaid Provider Spending Explorer
          (&quot;the Site&quot;), you agree to be bound
          by these Terms of Use. If you do not agree to these terms, do not
          access or use the Site.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          2. Description of Service
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          The Site is an informational tool that visualizes Medicaid provider
          spending data aggregated from publicly available CMS T-MSIS
          (Transformed Medicaid Statistical Information System) files. The Site
          is provided for general informational and educational purposes only.
          Nothing on this Site constitutes medical advice, legal advice, an
          accusation of wrongdoing, or any other form of professional counsel.
          You should not rely on the information presented here to make legal,
          regulatory, financial, or healthcare decisions.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          3. Data Disclaimer
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          This Site merely visualizes a publicly available government dataset.
          The operator of this Site makes no claims, representations, or
          warranties regarding any healthcare provider&apos;s billing practices,
          quality of care, or compliance with applicable laws and regulations.
        </p>
        <ul className="mt-2 space-y-2 text-sm text-gray-500">
          <li>
            Statistical outliers (e.g., providers with a high or low cost index)
            are identified using purely mathematical methods. A high cost index
            does <strong>not</strong> imply fraud, waste, abuse, or any
            wrongdoing whatsoever.
          </li>
          <li>
            There are many legitimate reasons a provider&apos;s costs may differ
            from the median, including patient complexity, geographic variation,
            specialty services, and data reporting differences.
          </li>
          <li>
            The data presented should <strong>not</strong> be used as the basis
            for accusations, legal proceedings, regulatory actions, or
            investigative activities against any provider.
          </li>
          <li>
            Underlying data may contain errors, omissions, reporting lags, or
            structural biases inherent to the CMS T-MSIS system (including cell
            suppression of low-volume rows).
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          4. No Representations or Warranties
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          The Site and all data, content, and materials available through it are
          provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot;
          basis without warranties of any kind, whether express, implied, or
          statutory. We expressly disclaim all warranties, including but not
          limited to implied warranties of merchantability, fitness for a
          particular purpose, accuracy, completeness, timeliness, and
          non-infringement. The data presented may contain errors, omissions,
          inaccuracies, or structural lag between data sources.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          5. Limitation of Liability
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          To the fullest extent permitted by applicable law, in no event shall
          the operator of this Site be liable for any direct, indirect,
          incidental, special, consequential, or punitive damages, including but
          not limited to loss of profits, data, use, or goodwill, arising out of
          or in connection with your access to, use of, or reliance on the Site
          or any data, content, or materials available through it, regardless of
          the theory of liability.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          6. Indemnification
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          You agree to indemnify, defend, and hold harmless the operator of this
          Site and its affiliates, officers, agents, and representatives from and
          against any and all claims, damages, losses, liabilities, costs, and
          expenses (including reasonable attorneys&apos; fees) arising out of or
          related to: (a) your use of the Site; (b) your violation of these
          Terms; or (c) your violation of any rights of any third party.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          7. Prohibited Uses
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          You agree not to:
        </p>
        <ul className="mt-2 space-y-2 text-sm text-gray-500">
          <li>
            Use data from the Site to make accusations, file complaints, or take
            legal or regulatory action against any healthcare provider without
            independent verification from authoritative sources.
          </li>
          <li>
            Use automated means, including bots, scrapers, crawlers, or similar
            tools, to access, collect, or harvest data from the Site.
          </li>
          <li>
            Redistribute, republish, or commercially exploit data obtained from
            the Site without prior written permission.
          </li>
          <li>
            Use the Site or its data in any manner that is harmful, fraudulent,
            deceptive, threatening, harassing, or otherwise objectionable.
          </li>
          <li>
            Interfere with or disrupt the Site&apos;s infrastructure, servers, or
            networks.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          8. Intellectual Property
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          All content, design, code, and compilation of the Site are the
          property of the operator. Underlying public data sources (including
          CMS T-MSIS data) are subject to their respective licenses and terms.
          Your use of the Site does not grant you any ownership rights to any
          content or materials.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          9. Modifications
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          We reserve the right to modify these Terms of Use at any time without
          prior notice. Changes take effect immediately upon posting to the Site.
          Your continued use of the Site after any modification constitutes your
          acceptance of the revised terms.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          10. Governing Law
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          These Terms shall be governed by and construed in accordance with the
          laws of the United States. Any disputes arising under or in connection
          with these Terms shall be subject to the exclusive jurisdiction of the
          courts of competent jurisdiction.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          11. Contact
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Questions about these Terms may be directed to{' '}
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
        <Link href="/privacy" className="text-sm text-blue-600 hover:underline">
          Privacy Policy
        </Link>
        <Link href="/about" className="text-sm text-blue-600 hover:underline">
          About
        </Link>
      </div>
    </main>
  );
}
