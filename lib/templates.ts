// Simples Handlebars-like Template mit {{placeholder}}-Syntax.
// Kein Turing-vollstaendiges Templating - nur String-Replacement.

export type TemplateVars = Record<string, string | number | null | undefined>;

export function renderTemplate(tpl: string, vars: TemplateVars): string {
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key: string) => {
    const val = vars[key];
    return val == null ? "" : String(val);
  });
}

export function buildContactVars(opts: {
  contact: {
    firstName: string;
    lastName: string;
    email?: string | null;
    position?: string | null;
    salutation?: string | null;
  };
  companyName?: string | null;
  landingpageUrl?: string;
  bookingUrl?: string | null;
  unsubscribeUrl?: string;
}): TemplateVars {
  return {
    firstName: opts.contact.firstName,
    lastName: opts.contact.lastName,
    fullName: `${opts.contact.firstName} ${opts.contact.lastName}`.trim(),
    email: opts.contact.email ?? "",
    position: opts.contact.position ?? "",
    salutation: opts.contact.salutation ?? "",
    company: opts.companyName ?? "",
    landingpageUrl: opts.landingpageUrl ?? "",
    bookingUrl: opts.bookingUrl ?? "",
    unsubscribeUrl: opts.unsubscribeUrl ?? "",
  };
}

export const AVAILABLE_PLACEHOLDERS = [
  "firstName",
  "lastName",
  "fullName",
  "email",
  "position",
  "salutation",
  "company",
  "landingpageUrl",
  "bookingUrl",
  "unsubscribeUrl",
] as const;
