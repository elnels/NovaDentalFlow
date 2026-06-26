import type { CalendarConfig } from "@/types/calendar";

const DEFAULT_VIEW = "month";
const DEFAULT_LANGUAGE = "es";
const BASE_EMBED_URL = "https://calendar.google.com/calendar/embed";

export function getCalendarConfig(): CalendarConfig {
  const calendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID || "";

  if (!calendarId) {
    return {
      calendarId: "",
      embedUrl: "",
      isConfigured: false,
    };
  }

  const params = new URLSearchParams({
    src: calendarId,
    ct: DEFAULT_LANGUAGE,
    wkst: "1",
    hl: DEFAULT_LANGUAGE,
    showTitle: "1",
    showNav: "1",
    showPrint: "0",
    showCalendars: "0",
    showTabs: "0",
    mode: DEFAULT_VIEW,
  });

  const embedUrl = `${BASE_EMBED_URL}?${params.toString()}`;

  return {
    calendarId,
    embedUrl,
    isConfigured: true,
  };
}
