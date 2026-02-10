import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (pineconeClient) return pineconeClient;

  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing PINECONE_API_KEY environment variable");
  }

  pineconeClient = new Pinecone({ apiKey });
  return pineconeClient;
}

export const PINECONE_JOB_INDEX = "nav-jobs";
export const PINECONE_JOB_NAMESPACE = "default";
