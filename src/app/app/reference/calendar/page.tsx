import ContentCalendar from '@/components/app/ContentCalendar';

export default function CalendarPage() {
  return (
    <div>
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Content Calendar</h1>
      <p className="text-text-dim text-[15px] mb-8">
        Plan and schedule your content pipeline. Track each video from idea to publication.
      </p>
      <ContentCalendar />
    </div>
  );
}
