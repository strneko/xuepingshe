const DAY_NAME_TO_ISO: Record<string, number> = {
  "周一": 1, "周二": 2, "周三": 3, "周四": 4, "周五": 5, "周六": 6, "周日": 7,
  "星期一": 1, "星期二": 2, "星期三": 3, "星期四": 4, "星期五": 5, "星期六": 6, "星期日": 7,
  "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 7,
  "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 7,
};

interface ParsedSlot {
  dayOfWeek: number; // 1=Mon ... 7=Sun
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

interface RoundInput {
  label: string;
  startsAt: Date;
  endsAt: Date;
}

/**
 * Parse a schedule string like "周一 10:00-12:00, 周三 10:00-12:00"
 * into structured time slots.
 */
export function parseSchedule(schedule: string): ParsedSlot[] {
  const slots: ParsedSlot[] = [];

  // Split by comma or Chinese comma, also handle parenthetical notes like "(1-16周)"
  const parts = schedule.split(/[,，]/);
  for (const part of parts) {
    const cleaned = part.replace(/[（(][^)）]*[)）]/g, "").trim();
    if (!cleaned) continue;

    // Find day name
    let dayOfWeek = 0;
    let dayStart = -1;
    let dayLength = 0;

    for (const [name, iso] of Object.entries(DAY_NAME_TO_ISO)) {
      const idx = cleaned.indexOf(name);
      if (idx !== -1 && (dayStart === -1 || idx < dayStart)) {
        dayOfWeek = iso;
        dayStart = idx;
        dayLength = name.length;
      }
    }

    if (dayOfWeek === 0) continue;

    // Extract time range: "10:00-12:00"
    const timePart = cleaned.slice(dayStart + dayLength).trim();
    const timeMatch = timePart.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
    if (!timeMatch) continue;

    slots.push({
      dayOfWeek,
      startTime: timeMatch[1],
      endTime: timeMatch[2],
    });
  }

  return slots;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getWeekLabel(date: Date, semesterStart: Date): string {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffFromStart = date.getTime() - semesterStart.getTime();
  const weekNum = Math.ceil((diffFromStart / msPerWeek) + 1);
  return `第${weekNum}周`;
}

const DAY_NAMES_CN = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"];

/**
 * Generate ReviewRound inputs from a parsed schedule and semester boundaries.
 *
 * Each class session produces one round:
 *   startsAt = the class end time (when review window opens)
 *   endsAt   = the next class start time (when review window closes)
 *
 * The last class's review window closes 7 days after semester end.
 */
export function generateRounds(
  slots: ParsedSlot[],
  semesterStart: Date,
  semesterEnd: Date,
): RoundInput[] {
  if (slots.length === 0 || semesterStart >= semesterEnd) return [];

  // Normalize to date boundaries
  const start = new Date(semesterStart.toDateString());
  const end = new Date(semesterEnd.toDateString());

  // Collect all class session datetimes
  interface SessionDate {
    date: Date;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }

  const sessions: SessionDate[] = [];
  const cursor = new Date(start);
  const lastEnd = new Date(end);
  lastEnd.setDate(lastEnd.getDate() + 7); // Allow sessions up to 1 week after semester end

  while (cursor <= lastEnd) {
    const dow = cursor.getDay() === 0 ? 7 : cursor.getDay(); // Convert JS 0=Sun to ISO 7=Sun
    for (const slot of slots) {
      if (slot.dayOfWeek === dow) {
        sessions.push({
          date: new Date(cursor),
          dayOfWeek: dow,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  // Sort by datetime
  sessions.sort((a, b) => {
    const aTime = a.date.getTime() + toMinutes(a.startTime) * 60_000;
    const bTime = b.date.getTime() + toMinutes(b.startTime) * 60_000;
    return aTime - bTime;
  });

  // Generate rounds: each class → one round
  const rounds: RoundInput[] = [];

  for (let i = 0; i < sessions.length; i++) {
    const current = sessions[i];
    const next = sessions[i + 1];

    const startsAt = new Date(current.date);
    const [endH, endM] = current.endTime.split(":").map(Number);
    startsAt.setHours(endH, endM, 0, 0);

    let endsAt: Date;
    if (next) {
      endsAt = new Date(next.date);
      const [startH, startM] = next.startTime.split(":").map(Number);
      endsAt.setHours(startH, startM, 0, 0);
    } else {
      // Last class: ends 7 days after semester end
      endsAt = new Date(end);
      endsAt.setDate(endsAt.getDate() + 7);
      endsAt.setHours(23, 59, 59, 0);
    }

    // Skip if startsAt >= endsAt (shouldn't happen normally)
    if (startsAt >= endsAt) continue;

    rounds.push({
      label: `${getWeekLabel(current.date, start)} ${DAY_NAMES_CN[current.dayOfWeek]}`,
      startsAt,
      endsAt,
    });
  }

  return rounds;
}
