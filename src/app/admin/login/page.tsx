import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function login(formData: FormData) {
  "use server";

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/admin/login?error=CredentialsSignin");
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4 text-white">
      <form action={login} className="w-full max-w-md rounded-md border border-white/10 bg-white/[0.04] p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">LORA CMS</p>
        <h1 className="mt-3 text-3xl font-medium">Secure login</h1>
        <div className="mt-8 grid gap-4">
          <div className="grid gap-2">
            <Label className="text-white/55">Email</Label>
            <Input name="email" type="email" required className="border-white/15 bg-white/8 text-white" />
          </div>
          <div className="grid gap-2">
            <Label className="text-white/55">Password</Label>
            <Input name="password" type="password" required className="border-white/15 bg-white/8 text-white" />
          </div>
          {error ? <p className="text-sm text-[var(--color-terracotta)]">Invalid credentials.</p> : null}
          <Button type="submit" variant="admin" className="mt-2">
            Login
          </Button>
        </div>
      </form>
    </main>
  );
}
