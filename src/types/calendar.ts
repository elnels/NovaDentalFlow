export interface CalendarConfig {
  calendarId: string;
  embedUrl: string;
  isConfigured: boolean;
}

export type CalendarView = "month" | "week" | "agenda";
