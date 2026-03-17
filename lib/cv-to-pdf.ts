import { jsPDF } from "jspdf";
import type { CVData } from "@/lib/schemas/cv";

const MARGIN = 20;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 5;
const SECTION_GAP = 6;
const HEADING_FONT_SIZE = 11;
const BODY_FONT_SIZE = 10;
const TITLE_FONT_SIZE = 18;
const Y_MAX = PAGE_HEIGHT - MARGIN;

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > Y_MAX) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * LINE_HEIGHT;
}

function addSectionHeading(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(HEADING_FONT_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text(title, MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(BODY_FONT_SIZE);
  return y + LINE_HEIGHT + 2;
}

export function downloadCvPdf(cvData: CVData, filename?: string): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  doc.setFontSize(TITLE_FONT_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text(cvData.personalInfo.name, MARGIN, y);
  y += LINE_HEIGHT + 4;

  const contactParts: string[] = [];
  if (cvData.personalInfo.email) contactParts.push(cvData.personalInfo.email);
  if (cvData.personalInfo.phone) contactParts.push(cvData.personalInfo.phone);
  if (cvData.personalInfo.location) contactParts.push(cvData.personalInfo.location);
  if (cvData.personalInfo.linkedIn) contactParts.push(cvData.personalInfo.linkedIn);
  if (cvData.personalInfo.portfolio) contactParts.push(cvData.personalInfo.portfolio);
  if (contactParts.length > 0) {
    doc.setFontSize(BODY_FONT_SIZE);
    doc.setFont("helvetica", "normal");
    doc.text(contactParts.join(" · "), MARGIN, y);
    y += LINE_HEIGHT + SECTION_GAP;
  }

  if (cvData.summary) {
    y = ensureSpace(doc, y, LINE_HEIGHT * 3);
    y = addSectionHeading(doc, "Sammendrag", y);
    y = addWrappedText(doc, cvData.summary, MARGIN, y, CONTENT_WIDTH);
    y += SECTION_GAP;
  }

  if (cvData.experience.length > 0) {
    y = ensureSpace(doc, y, LINE_HEIGHT * 4);
    y = addSectionHeading(doc, "Erfaring", y);
    for (const exp of cvData.experience) {
      y = ensureSpace(doc, y, LINE_HEIGHT * 5);
      doc.setFont("helvetica", "bold");
      doc.text(`${exp.title} – ${exp.company}`, MARGIN, y);
      y += LINE_HEIGHT;
      doc.setFont("helvetica", "normal");
      const dateRange = `${exp.startDate} – ${exp.endDate?.trim() || "nå"}`;
      doc.text(dateRange, MARGIN, y);
      y += LINE_HEIGHT;
      if (exp.description?.trim()) {
        y = addWrappedText(doc, exp.description, MARGIN, y, CONTENT_WIDTH);
      }
      y += SECTION_GAP;
    }
  }

  if (cvData.education.length > 0) {
    y = ensureSpace(doc, y, LINE_HEIGHT * 4);
    y = addSectionHeading(doc, "Utdanning", y);
    for (const edu of cvData.education) {
      y = ensureSpace(doc, y, LINE_HEIGHT * 3);
      doc.setFont("helvetica", "bold");
      doc.text(`${edu.degree}${edu.field ? `, ${edu.field}` : ""}`, MARGIN, y);
      y += LINE_HEIGHT;
      doc.setFont("helvetica", "normal");
      doc.text(edu.institution, MARGIN, y);
      y += LINE_HEIGHT;
      const eduDates = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");
      if (eduDates) {
        doc.text(eduDates, MARGIN, y);
        y += LINE_HEIGHT;
      }
      y += SECTION_GAP;
    }
  }

  if (cvData.skills.length > 0) {
    y = ensureSpace(doc, y, LINE_HEIGHT * 3);
    y = addSectionHeading(doc, "Ferdigheter", y);
    const skillsText = cvData.skills.join(", ");
    y = addWrappedText(doc, skillsText, MARGIN, y, CONTENT_WIDTH);
    y += SECTION_GAP;
  }

  if (cvData.languages.length > 0) {
    y = ensureSpace(doc, y, LINE_HEIGHT * 3);
    y = addSectionHeading(doc, "Språk", y);
    const langText = cvData.languages
      .map((l) => (l.proficiency ? `${l.language} (${l.proficiency})` : l.language))
      .join(", ");
    y = addWrappedText(doc, langText, MARGIN, y, CONTENT_WIDTH);
    y += SECTION_GAP;
  }

  if (cvData.certifications.length > 0) {
    y = ensureSpace(doc, y, LINE_HEIGHT * 3);
    y = addSectionHeading(doc, "Sertifiseringer og kurs", y);
    const certText = cvData.certifications.join(", ");
    y = addWrappedText(doc, certText, MARGIN, y, CONTENT_WIDTH);
    y += SECTION_GAP;
  }

  if (cvData.additionalInfo?.trim()) {
    y = ensureSpace(doc, y, LINE_HEIGHT * 3);
    y = addSectionHeading(doc, "Tilleggsinformasjon", y);
    y = addWrappedText(doc, cvData.additionalInfo.trim(), MARGIN, y, CONTENT_WIDTH);
  }

  const safeName =
    filename ??
    `CV_${cvData.personalInfo.name.replace(/\s+/g, "_").slice(0, 30)}.pdf`;
  doc.save(safeName);
}
