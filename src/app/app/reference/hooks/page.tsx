import HookLibrary from '@/components/app/HookLibrary';

export default function HookLibraryPage() {
  return (
    <div>
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Hook Library</h1>
      <p className="text-text-dim text-[15px] mb-8">
        50 real hooks from top creators. Filter by type, niche, and channel size. Expand any hook to see why it works and steal the structure.
      </p>
      <HookLibrary />
    </div>
  );
}
