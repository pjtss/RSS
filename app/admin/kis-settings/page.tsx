import { AdminKisSettings } from "@/components/admin-kis-settings";
import { AdminDashboard } from "@/components/admin-dashboard";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminKisSettingsPage() {
  const loggedIn = await requireAdminSession();
  if (!loggedIn) return <AdminDashboard loggedIn={false} />;
  return <AdminKisSettings />;
}
