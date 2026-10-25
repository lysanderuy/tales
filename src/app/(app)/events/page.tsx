import { redirect } from "next/navigation";

import { EventsView } from "@/components/shared/events-view";
import { createClient } from "@/lib/supabase/server";

type EventsPageProps = {
  searchParams: Promise<{ event?: string | string[] }>;
};

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) redirect("/login");

  const { event } = await searchParams;

  return <EventsView initialEventId={typeof event === "string" ? event : null} />;
}
