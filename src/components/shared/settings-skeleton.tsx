import { Card } from "@/components/ui/card";

function Block({ className }: { className: string }) {
  return <div className={`rounded-row bg-fill ${className}`} />;
}

export function SettingsSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 pb-[72px] pt-8" aria-busy="true">
      <div className="mx-auto max-w-[760px]">
        <Block className="mb-6 h-7 w-28" />
        <Card className="mb-4 min-h-[260px]">
          <Block className="h-5 w-24" />
          <Block className="mt-6 size-20 !rounded-full" />
          <Block className="mt-6 h-[52px] w-full" />
        </Card>
        <Card className="min-h-[120px]">
          <Block className="h-5 w-24" />
          <Block className="mt-6 h-[52px] w-60" />
        </Card>
      </div>
    </main>
  );
}
