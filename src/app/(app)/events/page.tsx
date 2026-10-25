import { redirect } from "next/navigation";

import { EventsView } from "@/components/shared/events-view";
import { createClient } from "@/lib/supabase/server";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) redirect("/login");

  return <EventsView />;
}
