import { redirect } from "next/navigation";

import { SubjectsView } from "@/components/shared/subjects-view";
import { createClient } from "@/lib/supabase/server";

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) redirect("/login");

  return <SubjectsView />;
}
