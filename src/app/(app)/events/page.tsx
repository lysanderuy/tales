import { redirect } from "next/navigation";

import { EventsView } from "@/components/shared/events-view";
import { createClient } from "@/lib/supabase/server";

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <EventsView />;
}
