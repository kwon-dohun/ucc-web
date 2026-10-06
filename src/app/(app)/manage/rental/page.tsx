import { createClient } from "@/lib/supabase/server";
import { requireOfficer } from "@/lib/manage";
import { PageHeader } from "@/components/ui";
import { RentalDesk, type ItemRow, type OpenRental } from "./rental-desk";

export const metadata = { title: "대여 관리" };

export default async function RentalPage() {
  const { org, viewer } = await requireOfficer();
  const supabase = await createClient();
  const [{ data: items }, { data: open }] = await Promise.all([
    supabase.rpc("rental_availability", { p_org: org.id }),
    supabase
      .from("rentals")
      .select("id, qty, lent_at, disputed_at, item:rental_items(name), user:profiles!rentals_user_id_fkey(name, student_no)")
      .eq("org_id", org.id)
      .is("returned_at", null)
      .order("lent_at"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="대여사업" description={`${org.room ?? "학생회실"} · 학생 화면에는 남은 개수만 보여요`} />
      <RentalDesk
        orgId={org.id}
        me={viewer.profile.name}
        items={(items ?? []) as ItemRow[]}
        open={(open ?? []) as unknown as OpenRental[]}
      />
    </div>
  );
}
