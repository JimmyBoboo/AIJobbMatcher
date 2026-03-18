import type { CVData } from "@/lib/schemas/cv";

export function buildCvSummary(cv: CVData): string {
  const parts: string[] = [];

  if (cv.summary) {
    parts.push(`Sammendrag: ${cv.summary}`);
  }

  if (cv.experience.length > 0) {
    const expLines = cv.experience
      .slice(0, 5)
      .map((e) => `${e.title} hos ${e.company}`);
    parts.push(`Erfaring: ${expLines.join(", ")}`);
  }

  if (cv.education.length > 0) {
    const eduLines = cv.education
      .slice(0, 3)
      .map(
        (e) =>
          `${e.degree}${e.field ? ` i ${e.field}` : ""} fra ${e.institution}`,
      );
    parts.push(`Utdanning: ${eduLines.join(", ")}`);
  }

  if (cv.skills.length > 0) {
    parts.push(`Ferdigheter: ${cv.skills.slice(0, 15).join(", ")}`);
  }

  return parts.join("\n");
}
