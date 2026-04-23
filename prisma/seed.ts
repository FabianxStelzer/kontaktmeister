import { PrismaClient, WorkspaceRole, Plan, CampaignStatus, SendMode } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Superadmin
  const superAdminEmail = process.env.SUPERADMIN_EMAIL ?? "admin@kontaktmeister.de";
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD ?? "ChangeMe!";
  const existingSuper = await prisma.superAdmin.findUnique({ where: { email: superAdminEmail } });
  if (!existingSuper) {
    await prisma.superAdmin.create({
      data: {
        email: superAdminEmail,
        name: "Super Admin",
        passwordHash: await bcrypt.hash(superAdminPassword, 12),
      },
    });
    console.log(`Superadmin angelegt: ${superAdminEmail}`);
  }

  // 2. Demo-Workspace + Demo-User
  const demoEmail = "demo@kontaktmeister.de";
  const demoWorkspace = await prisma.workspace.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Demo-Agentur GmbH",
      slug: "demo",
      plan: Plan.PRO,
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: "Demo Nutzer",
      passwordHash: await bcrypt.hash("demo1234", 12),
      emailVerified: new Date(),
    },
  });

  await prisma.workspaceMembership.upsert({
    where: { workspaceId_userId: { workspaceId: demoWorkspace.id, userId: demoUser.id } },
    update: {},
    create: {
      workspaceId: demoWorkspace.id,
      userId: demoUser.id,
      role: WorkspaceRole.OWNER,
    },
  });

  console.log(`Demo-Workspace: ${demoWorkspace.slug} / User: ${demoEmail} / Passwort: demo1234`);

  // 3. Demo-Firmen
  const companies = await Promise.all(
    [
      { name: "Musterfirma GmbH", domain: "musterfirma.de", industry: "Software", city: "Berlin" },
      { name: "Beispiel AG", domain: "beispiel.at", industry: "Beratung", city: "Wien" },
      { name: "Test & Co KG", domain: "test-und-co.de", industry: "Handel", city: "Muenchen" },
    ].map((c) =>
      prisma.company.create({
        data: { ...c, workspaceId: demoWorkspace.id, country: "DE" },
      }),
    ),
  );

  // 4. Demo-Kontakte
  const contacts = await Promise.all(
    [
      {
        firstName: "Anna",
        lastName: "Schmidt",
        email: "anna.schmidt@musterfirma.de",
        position: "Marketing Managerin",
        salutation: "Frau",
        companyId: companies[0].id,
      },
      {
        firstName: "Max",
        lastName: "Mueller",
        email: "max.mueller@beispiel.at",
        position: "Geschaeftsfuehrer",
        salutation: "Herr",
        companyId: companies[1].id,
      },
      {
        firstName: "Lisa",
        lastName: "Fischer",
        email: "lisa.fischer@test-und-co.de",
        position: "Vertriebsleiterin",
        salutation: "Frau",
        companyId: companies[2].id,
      },
    ].map((c) =>
      prisma.contact.create({
        data: { ...c, workspaceId: demoWorkspace.id },
      }),
    ),
  );

  // 5. Demo-Kampagne mit verknuepften Kontakten
  const campaign = await prisma.campaign.create({
    data: {
      workspaceId: demoWorkspace.id,
      name: "Demo Winterkampagne 2026",
      description: "Eine Beispiel-Kampagne fuer Demo-Zwecke.",
      status: CampaignStatus.DRAFT,
      scriptTemplate:
        "Hallo {{firstName}}, ich hoffe bei {{company}} laeuft alles gut. Ich habe eine spannende Idee fuer euch.",
      landingpageTextTpl:
        "Hallo {{firstName}}, schoen dass du dir kurz Zeit nimmst. Lass uns sprechen!",
      landingpageHeadline: "Persoenlich fuer {{firstName}} {{lastName}}",
      emailSubjectTpl: "{{firstName}}, ich habe was fuer dich",
      emailBodyTpl:
        "Hallo {{firstName}},\n\nich habe ein kurzes Video fuer dich aufgenommen:\n{{landingpageUrl}}\n\nViele Gruesse",
      bookingUrl: "https://cal.com/demo",
      ctaLabel: "Jetzt Termin buchen",
      sendMode: SendMode.EMAIL,
    },
  });

  for (const contact of contacts) {
    const firstName = contact.firstName;
    const lastName = contact.lastName;
    const companyName = companies.find((c) => c.id === contact.companyId)?.name ?? "";
    await prisma.campaignContact.create({
      data: {
        campaignId: campaign.id,
        contactId: contact.id,
        slug: nanoid(12),
        unsubscribeToken: nanoid(32),
        personalizedScript: campaign.scriptTemplate
          .replace(/{{firstName}}/g, firstName)
          .replace(/{{lastName}}/g, lastName)
          .replace(/{{company}}/g, companyName),
        landingpageText: campaign.landingpageTextTpl
          .replace(/{{firstName}}/g, firstName)
          .replace(/{{lastName}}/g, lastName)
          .replace(/{{company}}/g, companyName),
        emailSubject: campaign.emailSubjectTpl
          .replace(/{{firstName}}/g, firstName)
          .replace(/{{lastName}}/g, lastName),
        emailBody: campaign.emailBodyTpl
          .replace(/{{firstName}}/g, firstName)
          .replace(/{{lastName}}/g, lastName)
          .replace(/{{landingpageUrl}}/g, `https://app.kontaktmeister.de/p/PLACEHOLDER`),
      },
    });
  }

  console.log(`Demo-Kampagne: "${campaign.name}" mit ${contacts.length} Kontakten`);
  console.log("Seeding abgeschlossen.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
