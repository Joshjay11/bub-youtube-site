import ScriptAudit from '@/components/app/ScriptAudit';
import Link from 'next/link';

export default function OptimizePage() {
  return (
    <div>
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Optimize</h1>
      <p className="text-text-dim text-[15px] mb-8">
        Audit your script before recording. Fix every problem before it costs you retention.
      </p>

      <div className="space-y-12">
        <ScriptAudit />

        <hr className="rule" style={{ margin: '0' }} />

        {/* Reference */}
        <div>
          <h2 className="font-serif text-[22px] text-text-bright mb-4">Reference</h2>
          <Link
            href="/app/optimize/failure-modes"
            className="block bg-bg-card border border-border rounded-xl p-5 hover:border-amber/30 transition-colors group"
          >
            <h3 className="text-[15px] font-medium text-text-bright group-hover:text-amber transition-colors mb-1">
              15 Retention Failure Modes
            </h3>
            <p className="text-[13px] text-text-dim">
              When a video underperforms, diagnose it here. Each failure mode includes what it looks like, why it kills retention, and a specific fix.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
