import crypto from "crypto";
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";
import {
  AGREEMENT_INTRO,
  AGREEMENT_TITLE,
  AGREEMENT_VERSION,
  ESIGN_CONSENT,
  GUEST_RELEASE_TEXT,
  SIGNATURE_STATEMENT,
  agreementSections,
} from "./agreement";
import { formatDate, formatDateTime, todayIso } from "./dates";

export interface WaiverPdfInput {
  ref: string;
  renterName: string;
  phone: string;
  email: string;
  rentalAddress: string;
  startDate: string;
  endDate: string;
  packageLabel: string;
  initials: Record<string, string>;
  printedName: string;
  signaturePng: Uint8Array;
  signedAt: Date;
  ip: string;
  userAgent: string;
}

// The built-in PDF fonts only cover the Windows-1252 character set.
const REPLACEMENTS: Record<string, string> = {
  "☐": "[ ]",
  "☒": "[X]",
  "→": "->",
  "≤": "<=",
  "≥": ">=",
  " ": " ",
};
const CP1252_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");
function clean(text: string): string {
  let out = "";
  for (const ch of text.replace(/\r?\n/g, " ")) {
    if (REPLACEMENTS[ch]) out += REPLACEMENTS[ch];
    else {
      const code = ch.codePointAt(0) ?? 63;
      out += (code >= 32 && code <= 126) || (code >= 160 && code <= 255) || CP1252_EXTRA.has(ch) ? ch : "?";
    }
  }
  return out;
}

const INK = rgb(0.12, 0.09, 0.07);
const SOFT = rgb(0.36, 0.32, 0.28);
const EMBER = rgb(0.79, 0.49, 0.24);
const RULE = rgb(0.85, 0.82, 0.76);

class Writer {
  page!: PDFPage;
  y = 0;
  readonly margin = 54;
  readonly width = 612;
  readonly height = 792;
  pageNumber = 0;

  constructor(
    private doc: PDFDocument,
    public regular: PDFFont,
    public bold: PDFFont,
    private footer: string
  ) {
    this.newPage();
  }

  get contentWidth() {
    return this.width - this.margin * 2;
  }

  newPage() {
    this.page = this.doc.addPage([this.width, this.height]);
    this.pageNumber++;
    this.y = this.height - this.margin;
    this.page.drawText(clean(this.footer), { x: this.margin, y: 28, size: 7.5, font: this.regular, color: SOFT });
    const label = `Page ${this.pageNumber}`;
    this.page.drawText(label, {
      x: this.width - this.margin - this.regular.widthOfTextAtSize(label, 7.5),
      y: 28,
      size: 7.5,
      font: this.regular,
      color: SOFT,
    });
  }

  ensure(space: number) {
    if (this.y - space < this.margin + 10) this.newPage();
  }

  wrap(text: string, font: PDFFont, size: number, width: number): string[] {
    const words = clean(text).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate;
      else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  text(text: string, opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {}) {
    const size = opts.size ?? 9.5;
    const font = opts.bold ? this.bold : this.regular;
    const indent = opts.indent ?? 0;
    const lineHeight = size * 1.38;
    for (const line of this.wrap(text, font, size, this.contentWidth - indent)) {
      this.ensure(lineHeight);
      this.page.drawText(line, { x: this.margin + indent, y: this.y - size, size, font, color: opts.color ?? INK });
      this.y -= lineHeight;
    }
    this.y -= opts.gap ?? 5;
  }

  bullet(text: string) {
    const size = 9.5;
    const lines = this.wrap(text, this.regular, size, this.contentWidth - 16);
    const lineHeight = size * 1.38;
    lines.forEach((line, i) => {
      this.ensure(lineHeight);
      if (i === 0) this.page.drawText("-", { x: this.margin + 5, y: this.y - size, size, font: this.regular, color: EMBER });
      this.page.drawText(line, { x: this.margin + 16, y: this.y - size, size, font: this.regular, color: INK });
      this.y -= lineHeight;
    });
    this.y -= 2.5;
  }

  rule(gap = 8) {
    this.ensure(gap * 2);
    this.y -= gap;
    this.page.drawLine({
      start: { x: this.margin, y: this.y },
      end: { x: this.width - this.margin, y: this.y },
      thickness: 0.6,
      color: RULE,
    });
    this.y -= gap;
  }

  field(label: string, value: string) {
    const size = 9.5;
    this.ensure(size * 1.6);
    const labelText = clean(label);
    this.page.drawText(labelText, { x: this.margin, y: this.y - size, size, font: this.bold, color: SOFT });
    const x = this.margin + 150;
    const lines = this.wrap(value || "-", this.regular, size, this.contentWidth - 150);
    lines.forEach((line, i) => {
      if (i > 0) this.ensure(size * 1.38);
      this.page.drawText(line, { x, y: this.y - size, size, font: this.regular, color: INK });
      this.y -= size * 1.38;
    });
    this.y -= 2;
  }
}

export function agreementHash(): string {
  const text = [AGREEMENT_TITLE, AGREEMENT_INTRO, ...agreementSections().map((s) => JSON.stringify(s)), SIGNATURE_STATEMENT].join("\n");
  return crypto.createHash("sha256").update(text).digest("hex");
}

export async function buildWaiverPdf(input: WaiverPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`CedarSoak Rental Agreement - ${input.renterName} - ${input.ref}`);
  doc.setAuthor("Cedar Soak Co.");
  doc.setSubject(AGREEMENT_TITLE);
  doc.setCreationDate(input.signedAt);

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, regular, bold, `CedarSoak Co. - Booking ${input.ref} - Agreement version ${AGREEMENT_VERSION}`);

  w.text("CEDARSOAK CO.", { size: 11, bold: true, color: EMBER, gap: 2 });
  w.text(AGREEMENT_TITLE, { size: 15, bold: true, gap: 8 });
  w.text(AGREEMENT_INTRO, { size: 9.5, bold: true, gap: 10 });

  w.text("Rental details", { size: 11, bold: true, gap: 4 });
  w.field("Renter Name", input.renterName);
  w.field("Phone / Email", `${input.phone} / ${input.email}`);
  w.field("Rental Address", input.rentalAddress);
  w.field("Rental Start Date", `${formatDate(input.startDate)} (delivery & set-up)`);
  w.field("Rental End Date", `${formatDate(input.endDate)} (pickup)`);
  w.field("Package", input.packageLabel);
  w.field("Booking Reference", input.ref);
  w.rule();

  for (const section of agreementSections()) {
    w.ensure(40);
    w.text(section.title, { size: 11, bold: true, gap: 4 });
    for (const block of section.blocks) {
      if (block.type === "p") w.text(block.text);
      else if (block.type === "h") w.text(block.text, { bold: true });
      else block.items.forEach((item) => w.bullet(item));
    }
    if (section.id === "s9") {
      w.field("Approved Driver Name", "N/A - towing not approved (CedarSoak delivers)");
      w.field("Driver's License # / State", "N/A");
      w.field("Tow Vehicle", "N/A");
      w.field("Towing Capacity", "N/A");
      w.field("Auto Insurance / Policy #", "N/A");
    }
    if (section.initials) {
      const initials = (input.initials[section.id] || "").toUpperCase();
      w.text(`Renter Initials: ${initials}`, { bold: true, color: EMBER, gap: 10 });
    } else {
      w.y -= 5;
    }
  }

  // Signature block
  w.ensure(230);
  w.text("11. Signatures", { size: 11, bold: true, gap: 4 });
  w.text(SIGNATURE_STATEMENT, { bold: true, gap: 10 });

  const png = await doc.embedPng(input.signaturePng);
  const maxW = 240;
  const maxH = 80;
  const scale = Math.min(maxW / png.width, maxH / png.height, 1);
  const sigW = png.width * scale;
  const sigH = png.height * scale;
  w.ensure(sigH + 70);
  w.page.drawText("Renter Signature:", { x: w.margin, y: w.y - 10, size: 9.5, font: bold, color: SOFT });
  w.page.drawImage(png, { x: w.margin + 150, y: w.y - sigH, width: sigW, height: sigH });
  w.y -= sigH + 4;
  w.page.drawLine({
    start: { x: w.margin + 150, y: w.y },
    end: { x: w.margin + 150 + maxW, y: w.y },
    thickness: 0.6,
    color: INK,
  });
  w.y -= 10;
  w.field("Printed Name", input.printedName);
  w.field("Date", formatDate(todayIso(input.signedAt)));
  w.field("CedarSoak Representative", "Cedar Soak Co. (accepted upon booking confirmation)");
  w.rule();

  w.text("Electronic signature record", { size: 10, bold: true, gap: 4 });
  w.text(ESIGN_CONSENT, { size: 8.5, color: SOFT });
  w.field("Signed at", formatDateTime(input.signedAt));
  w.field("IP address", input.ip || "unknown");
  w.field("Device", input.userAgent.slice(0, 180) || "unknown");
  w.field("Agreement version", AGREEMENT_VERSION);
  w.field("Agreement SHA-256", agreementHash());

  // Guest acknowledgment page (printable)
  w.newPage();
  w.text("CEDARSOAK CO.", { size: 11, bold: true, color: EMBER, gap: 2 });
  w.text("Guest Acknowledgment and Release", { size: 15, bold: true, gap: 8 });
  w.field("Renter Name / Rental Date", `${input.renterName} / ${formatDate(input.startDate)}`);
  w.y -= 4;
  w.text(GUEST_RELEASE_TEXT, { gap: 12 });

  const cols = [
    { label: "Printed Name", width: 170 },
    { label: "Signature", width: 170 },
    { label: "Date", width: 85 },
    { label: "Age 18+? (Y/N)", width: 79 },
  ];
  let x = w.margin;
  for (const c of cols) {
    w.page.drawText(c.label, { x: x + 2, y: w.y - 9, size: 8.5, font: bold, color: SOFT });
    x += c.width;
  }
  w.y -= 16;
  for (let row = 0; row < 14 && w.y > w.margin + 30; row++) {
    w.y -= 30;
    w.page.drawLine({
      start: { x: w.margin, y: w.y },
      end: { x: w.width - w.margin, y: w.y },
      thickness: 0.6,
      color: RULE,
    });
  }

  return doc.save();
}
