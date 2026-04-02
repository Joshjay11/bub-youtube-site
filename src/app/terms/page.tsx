import MarketingLayout from "@/components/marketing/MarketingLayout";

export default function TermsOfServicePage() {
  return (
    <MarketingLayout>
      <section className="max-w-[720px] mx-auto px-8 pt-40 pb-24">
        <p className="font-sans font-semibold text-xs text-amber tracking-[0.18em] uppercase mb-5">
          Legal
        </p>
        <h1 className="font-serif text-text-bright leading-[1.1] mb-10" style={{ fontSize: "clamp(30px, 4vw, 44px)" }}>
          Terms of Service
        </h1>

        <div className="space-y-8 text-[15px] text-text-dim leading-[1.85]">
          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">1. Service Description</h2>
            <p>
              BUB YouTube Writer is a web-based subscription application for YouTube script pre-production. It provides AI-assisted tools for research, scripting, editing, optimization, and post-production planning.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">2. Subscription Terms</h2>
            <p>
              BUB YouTube Writer is available as a monthly or annual subscription. Subscriptions auto-renew at the end of each billing period unless cancelled. You can cancel anytime through your account settings or by contacting support.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">3. Cancellation</h2>
            <p>
              You may cancel your subscription at any time. When you cancel, your access continues until the end of your current billing period. Your project data is preserved after cancellation and will be available if you resubscribe.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">4. Refunds</h2>
            <p>
              We offer a 30-day money-back guarantee on all subscription plans. See our{" "}
              <a href="/refund" className="text-amber hover:text-amber-bright no-underline">Refund Policy</a>{" "}
              for full details.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">5. Acceptable Use</h2>
            <p>
              You agree not to abuse AI features (including excessive automated requests), resell or share account access, or use the service to produce illegal, harmful, or deceptive content. We reserve the right to suspend accounts that violate these terms.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">6. Intellectual Property</h2>
            <p>
              Content you create using BUB YouTube Writer belongs to you. This includes scripts, research notes, project data, and any exported materials. BUB&apos;s tools, templates, interface design, and underlying technology remain the property of BUB.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">7. AI Disclaimer</h2>
            <p>
              AI-generated content (scripts, research summaries, suggestions, scores, and image prompts) is provided as a starting point. You are responsible for reviewing, editing, and fact-checking all AI output before use. BUB does not guarantee the accuracy, originality, or suitability of AI-generated content.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">8. Limitation of Liability</h2>
            <p>
              BUB YouTube Writer is provided &quot;as is&quot; without warranty of any kind. We do not guarantee specific results, including video performance, audience growth, or revenue outcomes. Our total liability is limited to the amount you paid in the 12 months preceding any claim.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">9. Founding Member Pricing</h2>
            <p>
              Founding Member pricing is guaranteed for the duration of your continuous subscription. If you cancel and later resubscribe, the Founding Member rate is no longer available and standard pricing applies.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">10. Modifications</h2>
            <p>
              We may update these terms from time to time. When we make material changes, we&apos;ll notify you via email or an in-app notice. Continued use of the service after changes take effect constitutes acceptance of the updated terms.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-lg text-text-bright mb-3">11. Contact</h2>
            <p>
              Questions about these terms? Email{" "}
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
