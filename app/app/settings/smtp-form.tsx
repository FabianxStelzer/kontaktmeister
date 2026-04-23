"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSmtp, testSmtp } from "./actions";

type Defaults = {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  hasPassword: boolean;
  smtpFromName: string;
  smtpFromEmail: string;
};

export function SmtpForm({ defaults }: { defaults: Defaults }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="space-y-6">
      <form
        action={(fd) =>
          start(async () => {
            await saveSmtp(fd);
            router.refresh();
          })
        }
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="smtpHost">SMTP Host</Label>
            <Input id="smtpHost" name="smtpHost" defaultValue={defaults.smtpHost} placeholder="smtp.strato.de" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpPort">Port</Label>
            <Input id="smtpPort" name="smtpPort" type="number" defaultValue={defaults.smtpPort} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="smtpSecure" defaultChecked={defaults.smtpSecure} />
          TLS/SSL verwenden
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="smtpUser">Benutzername</Label>
            <Input id="smtpUser" name="smtpUser" defaultValue={defaults.smtpUser} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpPass">Passwort {defaults.hasPassword ? "(leer lassen = unveraendert)" : ""}</Label>
            <Input id="smtpPass" name="smtpPass" type="password" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="smtpFromName">Absender Name</Label>
            <Input id="smtpFromName" name="smtpFromName" defaultValue={defaults.smtpFromName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpFromEmail">Absender E-Mail</Label>
            <Input id="smtpFromEmail" name="smtpFromEmail" type="email" defaultValue={defaults.smtpFromEmail} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>SMTP speichern</Button>
        </div>
      </form>

      <form
        action={(fd) =>
          start(async () => {
            await testSmtp(fd);
            alert("Testmail versendet");
          })
        }
        className="flex items-end gap-2 rounded-md border p-4"
      >
        <div className="flex-1 space-y-2">
          <Label htmlFor="to">Test-E-Mail an</Label>
          <Input id="to" name="to" type="email" placeholder="du@domain.de" />
        </div>
        <Button type="submit" variant="outline" disabled={pending}>Test senden</Button>
      </form>
    </div>
  );
}
