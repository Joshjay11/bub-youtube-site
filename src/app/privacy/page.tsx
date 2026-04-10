import MarketingLayout from "@/components/marketing/MarketingLayout";

export default function PrivacyPolicyPage() {
  return (
    <MarketingLayout>
      <section className="max-w-[720px] mx-auto px-8 pt-40 pb-24">
        <p className="font-sans font-semibold text-xs text-amber tracking-[0.18em] uppercase mb-5">
          Legal
        </p>
        <h1 className="font-serif text-text-bright leading-[1.1] mb-10" style={{ fontSize: "clamp(30px, 4vw, 44px)" }}>
          Privacy Policy
        </h1>

        <div className="space-y-8 text-[15px] text-text-dim leading-[1.85]">
          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">What We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-text-bright">Email address.</strong> For account creation and communication.</li>
              <li><strong className="text-text-bright">Payment information.</strong> Processed by Stripe. We never see or store your card number.</li>
              <li><strong className="text-text-bright">Content you create.</strong> Scripts, research notes, project data, and any other content you produce in the app.</li>
              <li><strong className="text-text-bright">Usage data.</strong> Pages visited, features used, and general interaction patterns to improve the product.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">How We Use It</h2>
            <p>Your data is used to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Provide and operate the service</li>
              <li>Improve the product based on usage patterns</li>
              <li>Communicate with you about your account and important updates</li>
            </ul>
            <p className="mt-2">We do not sell your data. We do not use your content to train AI models.</p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">Third-Party Services</h2>
            <p>We use the following services to operate BUB YouTube Writer:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong className="text-text-bright">Stripe.</strong> Payment processing. Stripe handles all card data under their own privacy policy.</li>
              <li><strong className="text-text-bright">Supabase.</strong> Data storage and authentication. Your project data is stored in Supabase with row-level security.</li>
              <li><strong className="text-text-bright">AI Providers</strong> (Anthropic/Claude, OpenRouter, Google/Gemini). Script content is sent to AI providers for processing. Content is used only to generate responses and is not stored by these providers beyond the request.</li>
              <li><strong className="text-text-bright">Vercel.</strong> Application hosting.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">Data Retention</h2>
            <p>
              Your data is kept as long as your account exists. If you request account deletion, all your data, including projects, scripts, and personal information, is permanently deleted within 30 days.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">Cookies</h2>
            <p>
              We use session cookies for authentication. We do not use advertising cookies or third-party tracking cookies.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">Data Security</h2>
            <p>
              All data is encrypted in transit via HTTPS. Data at rest is stored in Supabase with row-level security, meaning each user can only access their own data.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">Your Rights</h2>
            <p>You can:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Export your data at any time through the app</li>
              <li>Request deletion of your account and all associated data</li>
              <li>Update your personal information through account settings</li>
            </ul>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">Age Requirement</h2>
            <p>
              BUB YouTube Writer is not intended for users under 18 years of age. We do not knowingly collect data from minors.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. When we make material changes, we&apos;ll notify you via email or an in-app notice.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">Contact</h2>
            <p>
              Questions about your data? Email{" "}
              <a href="mailto:support@bubwriter.com" className="text-amber hover:text-amber-bright no-underline">
                support@bubwriter.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
