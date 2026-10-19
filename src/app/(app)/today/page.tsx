import { redirect } from "next/navigation";

import { TodayView } from "@/components/shared/today-view";
import { createClient } from "@/lib/supabase/server";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <TodayView />;
}
