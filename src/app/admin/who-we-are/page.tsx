import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";

export default async function AdminWhoWeArePage() {
  await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) redirect("/admin/pages");

  const page = await prisma.page.findFirst({
    where: { locale: "EN", slug: "who-we-are" },
    select: { id: true },
  });

  redirect(page ? `/admin/pages/${page.id}` : "/admin/pages");
}
