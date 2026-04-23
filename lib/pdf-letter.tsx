import React from "react";
import { Document, Page, Text, View, StyleSheet, Link, pdf, Image } from "@react-pdf/renderer";
import QRCode from "qrcode";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, lineHeight: 1.5, fontFamily: "Helvetica" },
  heading: { fontSize: 18, marginBottom: 12 },
  block: { marginBottom: 12 },
  small: { fontSize: 9, color: "#555" },
  qrWrap: { marginTop: 16, alignItems: "flex-start" },
  qr: { width: 120, height: 120, marginBottom: 8 },
  cta: { fontSize: 11, color: "#2563eb" },
});

export type LetterInput = {
  recipientName: string;
  companyName?: string | null;
  text: string;
  workspaceName: string;
  landingUrl: string;
  ctaLabel?: string | null;
};

export async function renderLetterPdf(input: LetterInput): Promise<Buffer> {
  const qrDataUrl = await QRCode.toDataURL(input.landingUrl, { margin: 1, width: 400 });

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.block}>
          <Text>{input.workspaceName}</Text>
          <Text style={styles.small}>Persoenliche Nachricht</Text>
        </View>

        <View style={styles.block}>
          <Text>{input.recipientName}</Text>
          {input.companyName ? <Text>{input.companyName}</Text> : null}
        </View>

        <Text style={styles.heading}>Persoenlich fuer Sie</Text>
        <Text style={styles.block}>{input.text}</Text>

        <View style={styles.qrWrap}>
          <Image src={qrDataUrl} style={styles.qr} alt="" />
          <Text>QR-Code scannen oder Link oeffnen:</Text>
          <Link style={styles.cta} src={input.landingUrl}>
            {input.ctaLabel ?? "Persoenliches Video ansehen"}
          </Link>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={styles.small}>
            Datenschutz & Impressum: Diese Nachricht wurde individuell fuer den Empfaenger erstellt.
          </Text>
        </View>
      </Page>
    </Document>
  );

  const instance = pdf(doc);
  const arr = await instance.toBuffer();
  return Buffer.from(arr);
}
