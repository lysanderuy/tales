import { redirect } from "next/navigation";

import { SettingsView } from "@/components/shared/settings-view";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) redirect("/login");

  return <SettingsView />;
}
