import { redirect } from "next/navigation";

export default async function AdminGalleryPage() {
  redirect("/admin/media");
}
