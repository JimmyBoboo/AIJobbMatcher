/**
 * Compute SHA-256 hash of a file for duplicate detection.
 * Used to skip re-parse when the user re-uploads the same CV.
 */
export async function hashCvFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
