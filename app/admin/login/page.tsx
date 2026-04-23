import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setSuperadminCookie } from "@/lib/superadmin";
import { redirect } from "next/navigation";

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const admin = await prisma.superAdmin.findUnique({ where: { email } });
  if (!admin) throw new Error("Login fehlgeschlagen");
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) throw new Error("Login fehlgeschlagen");
  await setSuperadminCookie(admin.id);
  await prisma.superAdmin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  redirect("/admin");
}

export default function SuperadminLoginPage() {
  return (
    <div className="container flex min-h-screen items-center justify-center py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Superadmin Login</CardTitle>
          <CardDescription>Nur fuer Betreiber von Kontaktmeister.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">Einloggen</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
