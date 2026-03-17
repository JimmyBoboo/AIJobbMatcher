import { jsPDF } from "jspdf";
import type { CVData } from "@/lib/schemas/cv";

const MARGIN = 18;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const Y_MAX = PAGE_HEIGHT - MARGIN;

const LEFT_COLUMN_END = 68;
const LEFT_COLUMN_WIDTH = LEFT_COLUMN_END - MARGIN - 5;
const RIGHT_COLUMN_X = 72;
const RIGHT_COLUMN_WIDTH = PAGE_WIDTH - RIGHT_COLUMN_X - MARGIN;
const RIGHT_WRAP_WIDTH = RIGHT_COLUMN_WIDTH - 2;

const LINE_HEIGHT = 5;
const LINE_TIGHT = 4.2;
const SECTION_GAP = 8;
const HEADING_FONT = 10;
const BODY_FONT = 9;
const SMALL_FONT = 8;
const TITLE_FONT = 20;
const SUBTITLE_FONT = 9;

const DARK = { r: 45, g: 45, b: 45 };
const GRAY = { r: 100, g: 100, b: 100 };
const LIGHT_GRAY = { r: 200, g: 200, b: 200 };

function drawHorizLine(doc: jsPDF, y: number, xStart: number, xEnd: number): void {
  doc.setDrawColor(DARK.r, DARK.g, DARK.b);
  doc.setLineWidth(0.35);
  doc.line(xStart, y, xEnd, y);
}

function drawVertLine(doc: jsPDF, x: number, yStart: number, yEnd: number): void {
  doc.setDrawColor(GRAY.r, GRAY.g, GRAY.b);
  doc.setLineWidth(0.25);
  doc.line(x, yStart, x, yEnd);
}

function leftSectionHeading(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(HEADING_FONT);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  const label = title.toUpperCase();
  doc.text(label, MARGIN, y);
  const yLine = y + 1.2;
  doc.setDrawColor(LIGHT_GRAY.r, LIGHT_GRAY.g, LIGHT_GRAY.b);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, yLine, LEFT_COLUMN_END - 4, yLine);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(BODY_FONT);
  return y + 4;
}

function rightSectionHeading(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(HEADING_FONT);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.text(title.toUpperCase(), RIGHT_COLUMN_X, y);
  const yLine = y + 1.2;
  doc.setDrawColor(LIGHT_GRAY.r, LIGHT_GRAY.g, LIGHT_GRAY.b);
  doc.setLineWidth(0.3);
  doc.line(RIGHT_COLUMN_X, yLine, PAGE_WIDTH - MARGIN, yLine);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(BODY_FONT);
  return y + 4;
}

function wrapText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number = LINE_HEIGHT
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function ensureSpace(doc: jsPDF, y: number, need: number): number {
  if (y + need > Y_MAX) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

export function downloadCvPdf(cvData: CVData, filename?: string): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // —— Header (full width) ——
  const name = cvData.personalInfo.name.toUpperCase();
  doc.setFontSize(TITLE_FONT);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  const nameW = doc.getTextWidth(name);
  doc.text(name, (PAGE_WIDTH - nameW) / 2, 22);

  const subtitle =
    cvData.experience.length > 0
      ? cvData.experience[0].title.toUpperCase()
      : "";
  if (subtitle) {
    doc.setFontSize(SUBTITLE_FONT);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
    const subW = doc.getTextWidth(subtitle);
    doc.text(subtitle, (PAGE_WIDTH - subW) / 2, 28);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(BODY_FONT);
  doc.setTextColor(0, 0, 0);
  const headerBottom = 34;
  drawHorizLine(doc, headerBottom, MARGIN, PAGE_WIDTH - MARGIN);

  const contentTop = headerBottom + SECTION_GAP;
  let yLeft = contentTop;
  let yRight = contentTop;

  // —— Left column: Contact ——
  yLeft = leftSectionHeading(doc, "Kontakt", yLeft);
  const contactLines: string[] = [];
  if (cvData.personalInfo.phone) contactLines.push(cvData.personalInfo.phone);
  if (cvData.personalInfo.email) contactLines.push(cvData.personalInfo.email);
  if (cvData.personalInfo.location) contactLines.push(cvData.personalInfo.location);
  if (cvData.personalInfo.linkedIn) contactLines.push(cvData.personalInfo.linkedIn);
  if (cvData.personalInfo.portfolio) contactLines.push(cvData.personalInfo.portfolio);
  for (const line of contactLines) {
    const lines = doc.splitTextToSize(line, LEFT_COLUMN_WIDTH);
    doc.text(lines, MARGIN, yLeft);
    yLeft += lines.length * LINE_TIGHT;
  }
  yLeft += SECTION_GAP;

  // —— Left column: Education ——
  if (cvData.education.length > 0) {
    yLeft = leftSectionHeading(doc, "Utdanning", yLeft);
    for (const edu of cvData.education) {
      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");
      if (dates) {
        doc.setFontSize(SMALL_FONT);
        doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
        doc.text(dates, MARGIN, yLeft);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(BODY_FONT);
        yLeft += LINE_TIGHT;
      }
      const instLines = doc.splitTextToSize(edu.institution, LEFT_COLUMN_WIDTH);
      doc.text(instLines, MARGIN, yLeft);
      yLeft += instLines.length * LINE_TIGHT;
      const degreeStr = `•  ${edu.degree}${edu.field ? `, ${edu.field}` : ""}`;
      const degreeLines = doc.splitTextToSize(degreeStr, LEFT_COLUMN_WIDTH);
      doc.text(degreeLines, MARGIN, yLeft);
      yLeft += degreeLines.length * LINE_TIGHT + 2;
    }
    yLeft += 2;
  }

  // —— Left column: Skills ——
  if (cvData.skills.length > 0) {
    yLeft = leftSectionHeading(doc, "Ferdigheter", yLeft);
    for (const skill of cvData.skills) {
      const skillLines = doc.splitTextToSize(`•  ${skill}`, LEFT_COLUMN_WIDTH);
      doc.text(skillLines, MARGIN, yLeft);
      yLeft += skillLines.length * LINE_TIGHT;
    }
    yLeft += SECTION_GAP;
  }

  // —— Left column: Languages ——
  if (cvData.languages.length > 0) {
    yLeft = leftSectionHeading(doc, "Språk", yLeft);
    for (const lang of cvData.languages) {
      const text = lang.proficiency
        ? `${lang.language}: ${lang.proficiency}`
        : lang.language;
      const langLines = doc.splitTextToSize(`•  ${text}`, LEFT_COLUMN_WIDTH);
      doc.text(langLines, MARGIN, yLeft);
      yLeft += langLines.length * LINE_TIGHT;
    }
    yLeft += SECTION_GAP;
  }

  // —— Left column: Certifications (optional) ——
  if (cvData.certifications.length > 0) {
    yLeft = leftSectionHeading(doc, "Sertifiseringer", yLeft);
    for (const cert of cvData.certifications) {
      if (!cert.trim()) continue;
      const certLines = doc.splitTextToSize(`•  ${cert}`, LEFT_COLUMN_WIDTH);
      doc.text(certLines, MARGIN, yLeft);
      yLeft += certLines.length * LINE_TIGHT;
    }
  }

  // —— Vertical divider ——
  drawVertLine(doc, LEFT_COLUMN_END, contentTop, Y_MAX);

  // —— Right column: Profile Summary ——
  if (cvData.summary) {
    yRight = rightSectionHeading(doc, "Sammendrag", yRight);
    yRight = wrapText(doc, cvData.summary, RIGHT_COLUMN_X, yRight, RIGHT_WRAP_WIDTH);
    yRight += SECTION_GAP;
  }

  // —— Right column: Work Experience ——
  if (cvData.experience.length > 0) {
    yRight = rightSectionHeading(doc, "Arbeidserfaring", yRight);

    for (const exp of cvData.experience) {
      yRight = ensureSpace(doc, yRight, LINE_HEIGHT * 4);

      const dateStr = `${exp.startDate} – ${exp.endDate?.trim() || "Nå"}`.toUpperCase();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(BODY_FONT);
      doc.setTextColor(DARK.r, DARK.g, DARK.b);
      const companyLines = doc.splitTextToSize(exp.company, RIGHT_WRAP_WIDTH);
      doc.text(companyLines, RIGHT_COLUMN_X, yRight);
      const dateW = doc.getTextWidth(dateStr);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(SMALL_FONT);
      doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
      doc.text(dateStr, RIGHT_COLUMN_X + RIGHT_COLUMN_WIDTH - dateW, yRight);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(BODY_FONT);
      yRight += companyLines.length * LINE_TIGHT;

      doc.setFont("helvetica", "normal");
      const titleLines = doc.splitTextToSize(exp.title, RIGHT_WRAP_WIDTH);
      doc.text(titleLines, RIGHT_COLUMN_X, yRight);
      yRight += titleLines.length * LINE_TIGHT + 1;

      if (exp.description?.trim()) {
        const parts = exp.description.trim().split(/\n+/);
        for (const p of parts) {
          const trimmed = p.replace(/^[\s•\-*]+/, "").trim();
          if (trimmed) {
            yRight = ensureSpace(doc, yRight, LINE_HEIGHT * 2);
            yRight = wrapText(
              doc,
              `•  ${trimmed}`,
              RIGHT_COLUMN_X,
              yRight,
              RIGHT_WRAP_WIDTH,
              LINE_TIGHT
            );
          }
        }
      }
      yRight += SECTION_GAP;
    }
  }

  // —— Right column: Additional info ——
  if (cvData.additionalInfo?.trim()) {
    yRight = ensureSpace(doc, yRight, LINE_HEIGHT * 3);
    yRight = rightSectionHeading(doc, "Tilleggsinformasjon", yRight);
    yRight = wrapText(
      doc,
      cvData.additionalInfo.trim(),
      RIGHT_COLUMN_X,
      yRight,
      RIGHT_WRAP_WIDTH
    );
  }

  const safeName =
    filename ??
    `CV_${cvData.personalInfo.name.replace(/\s+/g, "_").slice(0, 30)}.pdf`;
  doc.save(safeName);
}
