"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Company = { id: string; name: string };

type Props = {
  companies: Company[];
  action: (formData: FormData) => Promise<void> | void;
  defaults?: {
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    position?: string | null;
    salutation?: string | null;
    gender?: string | null;
    linkedinUrl?: string | null;
    companyId?: string | null;
  };
  submitLabel?: string;
};

export function ContactForm({ companies, action, defaults, submitLabel = "Speichern" }: Props) {
  const [selectedCompany, setSelectedCompany] = useState<string>(defaults?.companyId ?? "");
  const [newCompany, setNewCompany] = useState<string>("");

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="salutation">Anrede</Label>
          <Input
            id="salutation"
            name="salutation"
            placeholder="z.B. Herr, Frau"
            defaultValue={defaults?.salutation ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Geschlecht (optional)</Label>
          <Select name="gender" defaultValue={defaults?.gender ?? undefined}>
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Maennlich</SelectItem>
              <SelectItem value="FEMALE">Weiblich</SelectItem>
              <SelectItem value="OTHER">Divers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">Vorname *</Label>
          <Input id="firstName" name="firstName" required defaultValue={defaults?.firstName ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nachname *</Label>
          <Input id="lastName" name="lastName" required defaultValue={defaults?.lastName ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input id="email" name="email" type="email" defaultValue={defaults?.email ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input id="phone" name="phone" defaultValue={defaults?.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <Input id="position" name="position" defaultValue={defaults?.position ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedinUrl">LinkedIn-URL</Label>
        <Input id="linkedinUrl" name="linkedinUrl" type="url" defaultValue={defaults?.linkedinUrl ?? ""} />
      </div>

      <div className="space-y-2">
        <Label>Firma</Label>
        <div className="grid grid-cols-2 gap-3">
          <Select
            value={selectedCompany}
            onValueChange={(v) => {
              setSelectedCompany(v);
              setNewCompany("");
            }}
            name="companyId"
          >
            <SelectTrigger>
              <SelectValue placeholder="Bestehende Firma..." />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            name="companyName"
            placeholder="oder neue Firma anlegen..."
            value={newCompany}
            onChange={(e) => {
              setNewCompany(e.target.value);
              if (e.target.value) setSelectedCompany("");
            }}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
