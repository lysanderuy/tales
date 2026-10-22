import { redirect } from "next/navigation";

import { SubjectsView } from "@/components/shared/subjects-view";
import { createClient } from "@/lib/supabase/server";

export default async function SubjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <SubjectsView />;
}
