import type { JobItem, PaginatedJobsResponse } from "@/lib/schemas/job-feed";

const MOCK_JOBS: JobItem[] = [
  {
    id: "mock-1",
    url: "https://arbeidsplassen.nav.no/stillinger/stilling/mock-1",
    title: "Utvikler",
    content_text:
      "Vi søker en engasjert utvikler til vårt team. Du vil jobbe med moderne webteknologier og ha mulighet til å påvirke produktet.",
    date_modified: "2025-02-01T10:00:00Z",
    _feed_entry: {
      uuid: "mock-uuid-1",
      status: "ACTIVE",
      title: "Utvikler",
      businessName: "Tech Solutions AS",
      municipal: "Oslo",
      sistEndret: "2025-02-01T10:00:00Z",
      companyLogoUrl:
        "https://ui-avatars.com/api/?name=Tech+Solutions&size=96&background=0ea5e9&color=fff",
      skills: ["JavaScript", "TypeScript", "React", "Git", "Agile"],
    },
  },
  {
    id: "mock-2",
    url: "https://arbeidsplassen.nav.no/stillinger/stilling/mock-2",
    title: "Senior Frontend-utvikler",
    content_text:
      "Erfaren frontend-utvikler med kjennskap til React og TypeScript. Vi tilbyr fleksible arbeidsvilkår og gode muligheter for utvikling.",
    date_modified: "2025-01-30T14:30:00Z",
    _feed_entry: {
      uuid: "mock-uuid-2",
      status: "ACTIVE",
      title: "Senior Frontend-utvikler",
      businessName: "Digital Byrå",
      municipal: "Bergen",
      sistEndret: "2025-01-30T14:30:00Z",
      companyLogoUrl:
        "https://ui-avatars.com/api/?name=Digital+Byra&size=96&background=8b5cf6&color=fff",
      skills: ["React", "TypeScript", "CSS", "Next.js", "Brukeropplevelse"],
    },
  },
  {
    id: "mock-3",
    url: "https://arbeidsplassen.nav.no/stillinger/stilling/mock-3",
    title: "Backend-utvikler",
    content_text:
      "Vi utvider backend-teamet og søker en backend-utvikler med erfaring fra Node.js eller Java. Start opp snarest.",
    date_modified: "2025-02-02T09:15:00Z",
    _feed_entry: {
      uuid: "mock-uuid-3",
      status: "ACTIVE",
      title: "Backend-utvikler",
      businessName: "DataTech Norge",
      municipal: "Trondheim",
      sistEndret: "2025-02-02T09:15:00Z",
      companyLogoUrl:
        "https://ui-avatars.com/api/?name=DataTech&size=96&background=ec4899&color=fff",
      skills: ["Node.js", "Java", "API-design", "Databaser", "SQL"],
    },
  },
  {
    id: "mock-4",
    url: "https://arbeidsplassen.nav.no/stillinger/stilling/mock-4",
    title: "UX-designer",
    content_text:
      "Kreativ UX-designer til produktteam. Du vil jobbe tett med utviklere og brukere for å skape brukeropplevelser som skiller seg ut.",
    date_modified: "2025-01-28T11:00:00Z",
    _feed_entry: {
      uuid: "mock-uuid-4",
      status: "ACTIVE",
      title: "UX-designer",
      businessName: "Design Studio",
      municipal: "Oslo",
      sistEndret: "2025-01-28T11:00:00Z",
      companyLogoUrl:
        "https://ui-avatars.com/api/?name=Design+Studio&size=96&background=f59e0b&color=fff",
      skills: ["Figma", "Brukerresearch", "Wireframing", "Prototyping", "Designsystemer"],
    },
  },
  {
    id: "mock-5",
    url: "https://arbeidsplassen.nav.no/stillinger/stilling/mock-5",
    title: "Fullstack-utvikler",
    content_text:
      "Fullstack-utvikler med erfaring fra React og .NET. Vi bygger skalerbare løsninger for offentlig sektor.",
    date_modified: "2025-02-03T08:00:00Z",
    _feed_entry: {
      uuid: "mock-uuid-5",
      status: "ACTIVE",
      title: "Fullstack-utvikler",
      businessName: "Offentlig IT",
      municipal: "Stavanger",
      sistEndret: "2025-02-03T08:00:00Z",
      companyLogoUrl:
        "https://ui-avatars.com/api/?name=Offentlig+IT&size=96&background=059669&color=fff",
      skills: ["React", ".NET", "C#", "Azure", "Scrum"],
    },
  },
  {
    id: "mock-6",
    url: "https://arbeidsplassen.nav.no/stillinger/stilling/mock-6",
    title: "DevOps-ingeniør",
    content_text:
      "DevOps-ingeniør til cloud og CI/CD. Erfaring med AWS eller Azure og Kubernetes er ønskelig.",
    date_modified: "2025-01-27T16:45:00Z",
    _feed_entry: {
      uuid: "mock-uuid-6",
      status: "ACTIVE",
      title: "DevOps-ingeniør",
      businessName: "Cloud First AS",
      municipal: "Oslo",
      sistEndret: "2025-01-27T16:45:00Z",
      companyLogoUrl:
        "https://ui-avatars.com/api/?name=Cloud+First&size=96&background=0369a1&color=fff",
      skills: ["AWS", "Azure", "Kubernetes", "CI/CD", "Terraform"],
    },
  },
  {
    id: "mock-7",
    url: "https://arbeidsplassen.nav.no/stillinger/stilling/mock-7",
    title: "Dataanalytiker",
    content_text:
      "Dataanalytiker til analyse og rapportering. Du jobber med SQL, Python og visualiseringsverktøy for å drive datadrevne beslutninger.",
    date_modified: "2025-02-01T12:00:00Z",
    _feed_entry: {
      uuid: "mock-uuid-7",
      status: "ACTIVE",
      title: "Dataanalytiker",
      businessName: "Analytics Nordic",
      municipal: "Bergen",
      sistEndret: "2025-02-01T12:00:00Z",
      companyLogoUrl:
        "https://ui-avatars.com/api/?name=Analytics+Nordic&size=96&background=7c3aed&color=fff",
      skills: ["SQL", "Python", "Power BI", "Dataanalyse", "Excel"],
    },
  },
  {
    id: "mock-8",
    url: "https://arbeidsplassen.nav.no/stillinger/stilling/mock-8",
    title: "Produktleder",
    content_text:
      "Produktleder til vårt B2B-produkt. Du eier roadmap, prioriterer backlog og samarbeider tett med design og utvikling.",
    date_modified: "2025-01-29T09:30:00Z",
    _feed_entry: {
      uuid: "mock-uuid-8",
      status: "ACTIVE",
      title: "Produktleder",
      businessName: "SaaS Norge",
      municipal: "Trondheim",
      sistEndret: "2025-01-29T09:30:00Z",
      companyLogoUrl:
        "https://ui-avatars.com/api/?name=SaaS+Norge&size=96&background=be185d&color=fff",
      skills: ["Produktledelse", "Backlog", "Roadmap", "Jira", "Stakeholdere"],
    },
  },
  {
    id: "mock-9",
    url: "https://arbeidsplassen.nav.no/stillinger/stilling/mock-9",
    title: "App-utvikler (iOS/Android)",
    content_text:
      "Erfaren mobilutvikler til native eller cross-platform (React Native/Flutter). Vi lager apper som brukes av tusenvis hver dag.",
    date_modified: "2025-02-02T14:00:00Z",
    _feed_entry: {
      uuid: "mock-uuid-9",
      status: "ACTIVE",
      title: "App-utvikler (iOS/Android)",
      businessName: "Mobil First",
      municipal: "Oslo",
      sistEndret: "2025-02-02T14:00:00Z",
      companyLogoUrl:
        "https://ui-avatars.com/api/?name=Mobil+First&size=96&background=0d9488&color=fff",
      skills: ["React Native", "Flutter", "iOS", "Android", "REST API"],
    },
  },
  {
    id: "mock-10",
    url: "https://arbeidsplassen.nav.no/stillinger/stilling/mock-10",
    title: "Sikkerhetskonsulent",
    content_text:
      "Sikkerhetskonsulent til rådgiving og gjennomgang av systemer. Relevant sertifisering (f.eks. CISSP) er et pluss.",
    date_modified: "2025-01-26T10:00:00Z",
    _feed_entry: {
      uuid: "mock-uuid-10",
      status: "ACTIVE",
      title: "Sikkerhetskonsulent",
      businessName: "SecureIT",
      municipal: "Stavanger",
      sistEndret: "2025-01-26T10:00:00Z",
      companyLogoUrl:
        "https://ui-avatars.com/api/?name=SecureIT&size=96&background=dc2626&color=fff",
      skills: ["Informasjonssikkerhet", "Risikovurdering", "CISSP", "Penetrasjonstesting"],
    },
  },
  {
    id: "mock-11",
    url: "https://arbeidsplassen.nav.no/stillinger/stilling/mock-11",
    title: "Scrum Master",
    content_text:
      "Scrum Master til flere team. Du faciliterer ceremonier, fjerner blokkeringer og støtter teamet i å levere verdi.",
    date_modified: "2025-02-03T11:20:00Z",
    _feed_entry: {
      uuid: "mock-uuid-11",
      status: "ACTIVE",
      title: "Scrum Master",
      businessName: "Agile Works",
      municipal: "Bergen",
      sistEndret: "2025-02-03T11:20:00Z",
      companyLogoUrl:
        "https://ui-avatars.com/api/?name=Agile+Works&size=96&background=4f46e5&color=fff",
      skills: ["Scrum", "Kanban", "Facilitering", "Retrospektiv", "Jira"],
    },
  },
  {
    id: "mock-12",
    url: "https://arbeidsplassen.nav.no/stillinger/stilling/mock-12",
    title: "Testleder / QA",
    content_text:
      "Testleder med erfaring fra manuell og automatiseret testing. Du bygger teststrategi og sikrer kvalitet i leveransene.",
    date_modified: "2025-01-31T15:00:00Z",
    _feed_entry: {
      uuid: "mock-uuid-12",
      status: "ACTIVE",
      title: "Testleder / QA",
      businessName: "Quality Labs",
      municipal: "Oslo",
      sistEndret: "2025-01-31T15:00:00Z",
      companyLogoUrl:
        "https://ui-avatars.com/api/?name=Quality+Labs&size=96&background=ca8a04&color=fff",
      skills: ["Manuell testing", "Automatisert testing", "Selenium", "Teststrategi", "QA"],
    },
  },
];

export function getMockPaginatedJobs(
  page: number,
  limit: number
): PaginatedJobsResponse {
  const start = (page - 1) * limit;
  const end = start + limit;
  const items = MOCK_JOBS.slice(start, end);
  const totalItems = MOCK_JOBS.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const hasMore = end < totalItems;

  return {
    items,
    page,
    limit,
    totalItems,
    totalPages,
    hasMore,
    isComplete: true,
  };
}
