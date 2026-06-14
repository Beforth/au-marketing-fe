export function getSubmissionDeadline() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const lastDay = new Date(year, month, 0).getDate();
  const day = lastDay - 2;

  const deadline = new Date(year, month - 1, day, 20, 30, 0, 0);
  const isPast = now >= deadline;

  const pad = (n: number) => String(n).padStart(2, '0');
  const deadlineStr = `${pad(day)}/${pad(month)}/${year} at 8:30 PM`;
  const message = isPast
    ? `Submission closed (deadline was ${deadlineStr})`
    : `Submit before ${deadlineStr}`;

  return { deadline, isPast, message, day, month, year };
}
