"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RoleOption = {
  id: string;
  name: string;
  permissions: unknown;
};

type AdminUser = {
  id: string;
  name?: string | null;
  email: string;
  roleId?: string | null;
  role?: { name: string } | null;
};

type SocialLinks = {
  instagram: string;
  facebook: string;
  linkedin: string;
  x: string;
};

export function AdminControlPanel({
  currentEmail,
  users,
  roles,
  socialLinks,
}: {
  currentEmail: string;
  users: AdminUser[];
  roles: RoleOption[];
  socialLinks: SocialLinks;
}) {
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState("");
  const [social, setSocial] = useState(socialLinks);
  const [userRoles, setUserRoles] = useState<Record<string, string>>(Object.fromEntries(users.map((user) => [user.id, user.roleId ?? ""])));
  const [status, setStatus] = useState("");

  async function saveAccount() {
    setStatus("Saving account...");
    const response = await fetch("/api/admin/control/account", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: password || undefined }),
    });
    const json = await response.json();
    setStatus(response.ok ? "Account saved. Sign in again if the email or password changed." : json.error ?? "Save failed.");
    if (response.ok) setPassword("");
  }

  async function saveSocialLinks() {
    setStatus("Saving social links...");
    const response = await fetch("/api/admin/control/social", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(social),
    });
    const json = await response.json();
    setStatus(response.ok ? "Social links saved." : json.error ?? "Save failed.");
  }

  async function saveUserRole(userId: string) {
    setStatus("Saving permission...");
    const response = await fetch(`/api/admin/control/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleId: userRoles[userId] || null }),
    });
    const json = await response.json();
    setStatus(response.ok ? "Permission saved." : json.error ?? "Save failed.");
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">Admin Control</p>
        <h1 className="mt-3 text-4xl font-medium">Accounts, links, permissions</h1>
        <p className="mt-3 text-sm text-white/48">{status}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle>Login email and password</CardTitle>
            <CardDescription className="text-white/45">Changes apply to the current admin account.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Label className="text-white/55">Email</Label>
            <Input value={email} onChange={(event) => setEmail(event.target.value)} className="border-white/15 bg-white/8 text-white" />
            <Label className="text-white/55">New password</Label>
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Leave blank to keep current password"
              className="border-white/15 bg-white/8 text-white"
            />
            <Button type="button" variant="admin" onClick={saveAccount}>
              Save login
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle>Social media links</CardTitle>
            <CardDescription className="text-white/45">These links feed the public footer.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {(["instagram", "facebook", "linkedin", "x"] as const).map((key) => (
              <div key={key} className="grid gap-2">
                <Label className="capitalize text-white/55">{key}</Label>
                <Input
                  value={social[key]}
                  onChange={(event) => setSocial((current) => ({ ...current, [key]: event.target.value }))}
                  placeholder={`https://${key}.com/...`}
                  className="border-white/15 bg-white/8 text-white"
                />
              </div>
            ))}
            <Button type="button" variant="admin" onClick={saveSocialLinks}>
              Save social links
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/[0.04] text-white">
        <CardHeader>
          <CardTitle>Access permissions</CardTitle>
          <CardDescription className="text-white/45">Assign each admin user a role. Role permission JSON is shown for clarity.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {users.map((user) => (
            <div key={user.id} className="grid gap-3 rounded-md border border-white/10 bg-black/20 p-4 md:grid-cols-[1fr_220px_auto] md:items-center">
              <div>
                <p className="text-sm font-medium">{user.name || user.email}</p>
                <p className="text-xs text-white/42">{user.email}</p>
              </div>
              <select
                value={userRoles[user.id] ?? ""}
                onChange={(event) => setUserRoles((current) => ({ ...current, [user.id]: event.target.value }))}
                className="h-10 rounded-md border border-white/15 bg-[#151515] px-3 text-sm text-white"
              >
                <option value="">No role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <Button type="button" variant="admin" size="sm" onClick={() => saveUserRole(user.id)}>
                Save access
              </Button>
            </div>
          ))}

          <div className="grid gap-2 pt-4">
            {roles.map((role) => (
              <div key={role.id} className="rounded-md border border-white/10 bg-black/20 p-3">
                <p className="text-sm font-medium">{role.name}</p>
                <code className="mt-2 block whitespace-pre-wrap text-xs text-white/45">{JSON.stringify(role.permissions, null, 2)}</code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
