import { Card } from "@/components/ui/card";

function Block({ className }: { className: string }) {
  return <div className={`rounded-row bg-fill ${className}`} />;
}

export function PlanSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 pb-[72px] pt-8" aria-busy="true">
      <div className="mb-5 min-h-14">
        <Block className="h-3 w-32" />
        <Block className="mt-3 h-7 w-20" />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <Block className="h-10 w-72 rounded-full" />
        <Block className="h-10 w-36 rounded-full" />
      </div>
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 min-h-[320px] min-[900px]:col-span-8">
          <Block className="h-5 w-36" />
          <Block className="mt-6 h-11 w-full" />
          <Block className="mt-4 h-11 w-full" />
          <Block className="mt-4 h-11 w-full" />
        </Card>
        <div className="col-span-12 flex flex-col gap-4 min-[900px]:col-span-4">
          <Card className="min-h-[200px]">
            <Block className="h-3 w-24" />
            <Block className="mt-4 h-16 w-full" />
          </Card>
          <Card className="min-h-[200px]">
            <Block className="h-3 w-24" />
            <Block className="mt-4 h-8 w-full" />
          </Card>
        </div>
      </div>
    </main>
  );
}
