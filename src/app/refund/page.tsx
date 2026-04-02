import MarketingLayout from "@/components/marketing/MarketingLayout";

export default function RefundPolicyPage() {
  return (
    <MarketingLayout>
      <section className="max-w-[720px] mx-auto px-8 pt-40 pb-24">
        <p className="font-sans font-semibold text-xs text-amber tracking-[0.18em] uppercase mb-5">
          Legal
        </p>
        <h1 className="font-serif text-text-bright leading-[1.1] mb-10" style={{ fontSize: "clamp(30px, 4vw, 44px)" }}>
          Refund Policy
        </h1>

        <div className="space-y-6 text-[15px] text-text-dim leading-[1.85]">
          <p>
            BUB YouTube Writer offers a <strong className="text-text-bright">30-day money-back guarantee</strong> on all subscription plans.
          </p>

          <p>
            If you&apos;re not satisfied with BUB YouTube Writer for any reason, contact us within 30 days of your first payment for a full refund. No questions asked.
          </p>

          <p>
            <strong className="text-text-bright">Monthly subscribers:</strong> Refund covers your most recent monthly payment within the first 30 days.
          </p>

          <p>
            <strong className="text-text-bright">Annual subscribers:</strong> Refund covers the full annual payment within the first 30 days of the annual charge.
          </p>

          <p>
            After 30 days, you can cancel your subscription at any time. Your access continues until the end of your current billing period. No partial refunds are issued for unused time.
          </p>

          <p>
            To request a refund, email{" "}
            <a href="mailto:support@bubwriter.com" className="text-amber hover:text-amber-bright no-underline">
              support@bubwriter.com
            </a>
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
