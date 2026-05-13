import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";

export default async function AdminWhatWeDoPage() {
  await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) redirect("/admin/pages");

  const page = await prisma.page.findFirst({
    where: { locale: "EN", slug: "what-we-do" },
    select: { id: true },
  });

  redirect(page ? `/admin/pages/${page.id}` : "/admin/pages");
}
