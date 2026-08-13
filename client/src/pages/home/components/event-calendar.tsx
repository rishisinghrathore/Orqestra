import { useMemo, useState } from "react"
import {
  addDays,
  addHours,
  setHours,
  setMinutes,
  startOfDay,
  startOfWeek,
} from "date-fns"

import { EventCalendar } from "@/components/reui/event-calendar/event-calendar"
import { EventCalendarContent } from "@/components/reui/event-calendar/event-calendar-content"
import { EventCalendarNav } from "@/components/reui/event-calendar/event-calendar-nav"
import type { CalendarEvent } from "@/components/reui/event-calendar/event-calendar-types"

function buildHomeEvents(anchor: Date): CalendarEvent[] {
  const week = startOfWeek(startOfDay(anchor), { weekStartsOn: 1 })
  const day = (offset: number) => addDays(week, offset)
  const timed = (offset: number, hour: number, durationHours: number) => {
    const start = setMinutes(setHours(day(offset), hour), 0)
    return { start, end: addHours(start, durationHours) }
  }

  return [
    {
      id: "review-reply",
      title: "Reply to reviews",
      ...timed(0, 9, 1),
      color: "var(--color-sky-500)",
    },
    {
      id: "photo-shoot",
      title: "Location photo shoot",
      start: day(1),
      end: day(2),
      allDay: true,
      color: "var(--color-violet-500)",
    },
    {
      id: "weekly-post",
      title: "Publish weekly post",
      ...timed(2, 11, 1),
      color: "var(--color-orange-500)",
    },
    {
      id: "qa-sync",
      title: "Q&A sync",
      ...timed(3, 14, 1),
      color: "var(--color-teal-500)",
    },
    {
      id: "performance-review",
      title: "Performance review",
      start: day(7),
      end: day(8),
      allDay: true,
      color: "var(--color-emerald-500)",
    },
    {
      id: "campaign",
      title: "Promo campaign",
      start: day(8),
      end: day(12),
      allDay: true,
      color: "var(--color-rose-500)",
    },
  ]
}

export function HomeEventCalendar() {
  const initialEvents = useMemo(() => buildHomeEvents(new Date()), [])
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)

  return (
    <div className="h-[800px] overflow-hidden rounded-lg border border-border bg-background outline-2 outline-offset-2 outline-secondary">
      <EventCalendar
        events={events}
        onEventsChange={setEvents}
        defaultView="month"
        weekStartsOn={1}
        interactions={{ drag: true, resize: true, selectSlot: false }}
        className="h-full w-full"
      >
        <EventCalendarNav showViewSwitcher={false} className="px-3 pt-3" />
        <EventCalendarContent />
      </EventCalendar>
    </div>
  )
}
