import { Card } from "@/components/ui/card";

function Block({ className }: { className: string }) {
  return <div className={`rounded-row bg-fill ${className}`} />;
}

export function EventsSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 pb-[72px] pt-8" aria-busy="true">
      <div className="mb-5 min-h-14">
        <Block className="h-3 w-24" />
        <Block className="mt-3 h-7 w-24" />
      </div>
      <Card className="min-h-[320px]">
        <Block className="h-5 w-32" />
        <Block className="mt-6 h-3 w-20" />
        <Block className="mt-4 h-10 w-full" />
        <Block className="mt-3 h-10 w-full" />
        <Block className="mt-6 h-3 w-16" />
        <Block className="mt-4 h-10 w-full" />
      </Card>
    </main>
  );
}
