import { redirect } from "next/navigation";

import { PlanView } from "@/components/shared/plan-view";
import { createClient } from "@/lib/supabase/server";

export default async function PlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <PlanView />;
}
