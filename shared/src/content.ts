const REGIONAL_GREETINGS: Array<[number, string]> = [
  [5, "فجرًا"],
  [8, "صباحًا"],
  [12, "ظهيرة"],
  [17, "بعد الظهر"],
  [19, "مساءً"],
  [24, "ليلًا"],
];

export function greetingForHour(hour: number): string {
  for (const [upTo, label] of REGIONAL_GREETINGS) {
    if (hour < upTo) return label;
  }
  return "مساءً";
}

export function buildHelloMessage(name: string, now: Date = new Date()): string {
  const period = greetingForHour(now.getHours());
  return `أهلًا بك، ${name}! الآن ${period}. الخادم والعميل متصلان بنجاح.`;
}

export function formatIsoTime(iso: string): string {
  return new Intl.DateTimeFormat("ar", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}