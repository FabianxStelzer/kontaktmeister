import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Willkommen zurueck</CardTitle>
        <CardDescription>Melde dich in deinem Workspace an.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Noch kein Konto?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Jetzt kostenlos registrieren
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
