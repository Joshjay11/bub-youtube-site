import PerformanceTracker from '@/components/app/PerformanceTracker';

export default function TrackerPage() {
  return (
    <div>
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Performance Tracker</h1>
      <p className="text-text-dim text-[15px] mb-8">
        Log every published video to build data on what works for YOUR channel. After 10 videos, sort by CTR and retention to find your patterns.
      </p>
      <PerformanceTracker />
    </div>
  );
}
