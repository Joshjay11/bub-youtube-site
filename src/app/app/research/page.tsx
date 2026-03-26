import AudienceAvatar from '@/components/app/AudienceAvatar';
import CompetitiveScan from '@/components/app/CompetitiveScan';
import FramingWorksheet from '@/components/app/FramingWorksheet';

export default function ResearchPage() {
  return (
    <div>
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Research & Pre-Production</h1>
      <p className="text-text-dim text-[15px] mb-8">
        Structured thinking before you write. Fill these out for THIS video — not your channel in general.
      </p>

      <div className="space-y-12">
        <AudienceAvatar />
        <hr className="rule" style={{ margin: '0' }} />
        <CompetitiveScan />
        <hr className="rule" style={{ margin: '0' }} />
        <FramingWorksheet />
      </div>
    </div>
  );
}
