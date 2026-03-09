/**
 * Returns true if the application is still open (due date is today or in the future).
 * Returns true if dueDate is missing, empty, or invalid (we don't hide jobs for bad data).
 */
export function isApplicationOpen(
  dueDate: string | undefined | null
): boolean {
  if (dueDate == null || String(dueDate).trim() === "") return true;
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  return due.getTime() >= today.getTime();
}
