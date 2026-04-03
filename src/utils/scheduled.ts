import { escapeXml } from "./helpers";

type ScheduledEntry = {
  date: string;
  work: { from: string; to: string } | null;
  dinners: { from: string; to: string }[];
};

const isScheduledEntry = (entry: ScheduledEntry | null): entry is ScheduledEntry =>
  entry !== null;

export const parseScheduledEntries = (value: string): ScheduledEntry[] => {
  if (!value) return [];
  const parts = value
    .split(/[\n;]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const entries: (ScheduledEntry | null)[] = parts.map((part) => {
      const match = part.match(/^(\d{2}\.\d{2}\.\d{4})\s+(.+)$/);
      if (!match) return null;
      const date = match[1];
      const rest = match[2].trim();
      const intervalMatches = Array.from(
        rest.matchAll(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g)
      ).map((m) => ({ from: m[1], to: m[2] }));
      if (!intervalMatches.length) return { date, work: null, dinners: [] };

      const dinnerMatches = Array.from(
        rest.matchAll(/перерыв\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/gi)
      ).map((m) => ({ from: m[1], to: m[2] }));

      const work = intervalMatches[0];
      const dinners = dinnerMatches.length ? dinnerMatches : intervalMatches.slice(1);
      return { date, work, dinners };
    });

  return entries.filter(isScheduledEntry);
};

export const buildScheduledXml = (value: string): string => {
  const entries = parseScheduledEntries(value);
  if (!entries.length) return "";
  return entries
    .map((entry) => {
      const blocks: string[] = [];
      blocks.push(`    <scheduled-working-time>`);
      blocks.push(`      <date>${escapeXml(entry.date)}</date>`);
      if (entry.work) {
        blocks.push(
          `      <work from="${escapeXml(entry.work.from)}" to="${escapeXml(
            entry.work.to
          )}"/>`
        );
      }
      (entry.dinners || []).forEach((dinner) => {
        blocks.push(
          `      <dinner from="${escapeXml(dinner.from)}" to="${escapeXml(
            dinner.to
          )}"/>`
        );
      });
      blocks.push(`    </scheduled-working-time>`);
      return blocks.join("\n");
    })
    .join("\n");
};
