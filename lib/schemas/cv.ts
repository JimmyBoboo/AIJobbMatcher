import { z } from "zod";

export const experienceSchema = z.object({
  company: z.string().describe("Navn på arbeidsgiver"),
  title: z.string().describe("Stillingstittel"),
  startDate: z.string().describe("Startdato (f.eks. 'Januar 2020' eller '2020')"),
  endDate: z
    .string()
    .nullable()
    .describe("Sluttdato, eller null hvis nåværende stilling"),
  description: z
    .string()
    .nullable()
    .describe("Beskrivelse av arbeidsoppgaver og ansvar"),
});

export const educationSchema = z.object({
  institution: z.string().describe("Navn på utdanningsinstitusjon"),
  degree: z.string().describe("Grad eller sertifisering"),
  field: z.string().nullable().describe("Fagfelt eller studieretning"),
  startDate: z.string().nullable().describe("Startdato"),
  endDate: z.string().nullable().describe("Sluttdato eller forventet sluttdato"),
});

export const cvSchema = z.object({
  personalInfo: z.object({
    name: z.string().describe("Fullt navn"),
    email: z.string().nullable().describe("E-postadresse"),
    phone: z.string().nullable().describe("Telefonnummer"),
    location: z.string().nullable().describe("Bosted eller adresse"),
    linkedIn: z.string().nullable().describe("LinkedIn-profil URL"),
    birthYear: z
      .number()
      .nullable()
      .describe("Fødselsår hvis oppgitt i CV-en"),
  }),
  summary: z
    .string()
    .nullable()
    .describe("Profesjonell sammendrag eller mål fra CV-en"),
  experience: z
    .array(experienceSchema)
    .describe("Liste over arbeidserfaring, sortert fra nyeste til eldste"),
  education: z
    .array(educationSchema)
    .describe("Liste over utdanning"),
  skills: z
    .array(z.string())
    .describe("Liste over ferdigheter og kompetanser"),
  languages: z
    .array(
      z.object({
        language: z.string().describe("Språk"),
        proficiency: z
          .string()
          .nullable()
          .describe("Nivå (f.eks. 'Morsmål', 'Flytende', 'Grunnleggende')"),
      })
    )
    .describe("Språkkunnskaper"),
  certifications: z
    .array(z.string())
    .describe("Sertifiseringer og kurs"),
});

export type CVData = z.infer<typeof cvSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationSchema>;
