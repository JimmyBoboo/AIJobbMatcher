# AI Jobb Matcher

A Next.js application that matches CVs against job listings from NAV (Norwegian Labour and Welfare Administration) using AI-powered vector search.

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Authentication enabled
- A Pinecone account and index
- A NAV API key

### Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description | Required |
|---|---|---|
| `NEXTAUTH_SECRET` | Secret used to sign NextAuth.js session tokens. Generate one with `openssl rand -base64 32`. | Yes |
| `AUTH_FIREBASE_PROJECT_ID` | Your Firebase project ID. | Yes |
| `AUTH_FIREBASE_CLIENT_EMAIL` | Service account email from your Firebase Admin SDK credentials. | Yes |
| `AUTH_FIREBASE_PRIVATE_KEY` | Private key from your Firebase Admin SDK credentials (including `BEGIN`/`END` markers). | Yes |
| `NAVPIM_KEY` | API key for the NAV job listings API. | Yes |
| `PINECONE_API_KEY` | API key for your Pinecone vector database. | Yes |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app. Defaults to `http://localhost:3000`. | No |

### Pinecone index and Heltid/Deltid filters

The app filters matched jobs by engagement type (e.g. Vikariat) and by extent (Heltid/Deltid). For **Heltid** and **Deltid** filters to return results, the Pinecone job index must include an **extent** metadata field with values from NAV PAM (e.g. "Heltid", "Deltid", or percentage). The pipeline that ingests jobs into Pinecone should map NAV’s vacancy `extent` (and `engagementtype`) into the index metadata when indexing.

### Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
