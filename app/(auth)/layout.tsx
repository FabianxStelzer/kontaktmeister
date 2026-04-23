import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40">
      <header className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground">
            K
          </div>
          <span className="font-semibold">Kontaktmeister</span>
        </Link>
      </header>
      <main className="container flex items-center justify-center pb-16 pt-8">{children}</main>
    </div>
  );
}
