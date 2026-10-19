import { Card } from "@/components/ui/card";

const half = "col-span-12 min-[900px]:col-span-7";
const third = "col-span-12 min-[900px]:col-span-5";

function Block({ className }: { className: string }) {
  return <div className={`rounded-row bg-fill ${className}`} />;
}

export function TodaySkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 pb-[72px] pt-8" aria-busy="true">
      <div className="mb-5 min-h-14">
        <Block className="h-3 w-32" />
        <Block className="mt-3 h-7 w-28" />
      </div>
      <div className="grid grid-cols-12 gap-4">
        <Card className={`${half} min-h-[220px]`}>
          <Block className="h-3 w-16" />
          <Block className="mt-4 h-16 w-40" />
        </Card>
        <Card className={third}>
          <Block className="h-5 w-40" />
          <Block className="mt-6 h-10 w-28" />
          <Block className="mt-5 h-3.5 w-full" />
        </Card>
        <Card className={half}>
          <Block className="h-5 w-32" />
          <Block className="mt-6 h-10 w-full" />
          <Block className="mt-4 h-10 w-full" />
        </Card>
        <Card className={third}>
          <Block className="h-5 w-32" />
          <Block className="mt-6 h-[140px] w-full" />
        </Card>
      </div>
    </main>
  );
}
