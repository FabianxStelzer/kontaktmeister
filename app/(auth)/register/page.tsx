import Link from "next/link";
import { RegisterForm } from "./register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Registrieren" };

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Workspace anlegen</CardTitle>
        <CardDescription>
          In 60 Sekunden einen eigenen Kontaktmeister-Workspace fuer dein Team anlegen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Schon registriert?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Einloggen
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
