"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  startOfWeek,
  subWeeks
} from "date-fns";
import { fr } from "date-fns/locale";
import type { BrowserCalendarCache, CalendarChange, CalendarEvent } from "@/lib/types";
import {
  loadBrowserCache,
  saveBrowserCache,
  updateWeekSnapshot
} from "@/lib/browser-cache";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

function eventTop(event: CalendarEvent) {
  const d = new Date(event.start);
  return ((d.getHours() + d.getMinutes() / 60) - 7) * 64;
}

function eventHeight(event: CalendarEvent) {
  const minutes = (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000;
  return Math.max(38, (minutes / 60) * 64);
}

function weekKey(date: Date) {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

function timeRange(event: CalendarEvent) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  return `${format(start, "HH:mm")}–${format(end, "HH:mm")}`;
}

function ChangeLabel({ change }: { change: CalendarChange }) {
  const event = change.after || change.before!;
  const title =
    change.type === "added"
      ? "Cours ajouté"
      : change.type === "removed"
        ? "Cours supprimé"
        : change.type === "moved"
          ? "Horaire modifié"
          : "Informations modifiées";

  return (
    <div className="change-card">
      <strong>{title}</strong>
      <span>{event.title}</span>
      {change.before && change.after && change.type === "moved" ? (
        <small>{timeRange(change.before)} → {timeRange(change.after)}</small>
      ) : (
        <small>{timeRange(event)}{event.location ? ` · ${event.location}` : ""}</small>
      )}
    </div>
  );
}

export default function CalendarApp() {
  const [anchor, setAnchor] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [changes, setChanges] = useState<CalendarChange[]>([]);
  const [cache, setCache] = useState<BrowserCalendarCache | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showChanges, setShowChanges] = useState(false);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  const weekStart = useMemo(
    () => startOfWeek(anchor, { weekStartsOn: 1 }),
    [anchor]
  );
  const weekEnd = useMemo(
    () => endOfWeek(anchor, { weekStartsOn: 1 }),
    [anchor]
  );
  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }).slice(0, 5),
    [weekStart, weekEnd]
  );

  useEffect(() => {
    setCache(loadBrowserCache());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const from = weekStart.toISOString();
        const to = addDays(weekStart, 7).toISOString();
        const response = await fetch(
          `/api/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        );
        if (!response.ok) throw new Error("calendar fetch failed");
        const data = await response.json();
        if (cancelled) return;

        const nextEvents: CalendarEvent[] = data.events;
        setEvents(nextEvents);

        const currentCache = cache || loadBrowserCache();
        const result = updateWeekSnapshot(currentCache, weekKey(weekStart), nextEvents);
        const unseen = result.changes.filter(
          (change) => !result.cache.seenChangeIds.includes(change.id)
        );
        setChanges(unseen);
        setCache(result.cache);
        saveBrowserCache(result.cache);
      } catch {
        if (!cancelled) setError("Impossible de charger l’horaire pour le moment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [weekStart]);

  function markChangesSeen() {
    if (!cache) return;
    const next = {
      ...cache,
      seenChangeIds: Array.from(new Set([
        ...cache.seenChangeIds,
        ...changes.map((change) => change.id)
      ]))
    };
    setCache(next);
    saveBrowserCache(next);
    setChanges([]);
    setShowChanges(false);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">UMONS</p>
          <h1>Mon horaire</h1>
          <p className="week-title">
            {format(weekStart, "d MMM", { locale: fr })} — {format(weekEnd, "d MMM yyyy", { locale: fr })}
          </p>
        </div>

        <div className="header-actions">
          {changes.length > 0 && (
            <button className="change-button" onClick={() => setShowChanges((v) => !v)}>
              {changes.length} changement{changes.length > 1 ? "s" : ""}
            </button>
          )}
          <div className="navigation">
            <button aria-label="Semaine précédente" onClick={() => setAnchor((d) => subWeeks(d, 1))}>←</button>
            <button onClick={() => setAnchor(new Date())}>Aujourd’hui</button>
            <button aria-label="Semaine suivante" onClick={() => setAnchor((d) => addWeeks(d, 1))}>→</button>
          </div>
        </div>
      </header>

      {showChanges && changes.length > 0 && (
        <section className="changes-panel">
          <div className="changes-heading">
            <div>
              <strong>Modifications depuis votre dernière visite</strong>
              <p>Uniquement pour cette semaine déjà consultée.</p>
            </div>
            <button onClick={markChangesSeen}>Marquer comme vus</button>
          </div>
          <div className="changes-list">
            {changes.map((change) => <ChangeLabel key={change.id} change={change} />)}
          </div>
        </section>
      )}

      {error && <div className="status error">{error}</div>}
      {loading && <div className="status">Chargement de l’horaire…</div>}

      {!loading && !error && (
        <>
          <section className="calendar-desktop">
            <div className="calendar-head spacer" />
            {days.map((day) => (
              <div className="calendar-head" key={day.toISOString()}>
                <span>{format(day, "EEE", { locale: fr })}</span>
                <strong>{format(day, "d")}</strong>
              </div>
            ))}

            <div className="time-column">
              {HOURS.map((hour) => <div className="hour-label" key={hour}>{String(hour).padStart(2, "0")}:00</div>)}
            </div>

            {days.map((day) => (
              <div className="day-column" key={day.toISOString()}>
                {HOURS.map((hour) => <div className="hour-line" key={hour} />)}
                {events.filter((event) => isSameDay(new Date(event.start), day)).map((event) => (
                  <button
                    className="event-card"
                    key={event.id}
                    style={{ top: eventTop(event), height: eventHeight(event) }}
                    onClick={() => setSelected(event)}
                  >
                    <strong>{event.title}</strong>
                    <span>{timeRange(event)}</span>
                    {event.location && <small>{event.location}</small>}
                  </button>
                ))}
              </div>
            ))}
          </section>

          <section className="calendar-mobile">
            {days.map((day) => {
              const dayEvents = events.filter((event) => isSameDay(new Date(event.start), day));
              return (
                <div className="mobile-day" key={day.toISOString()}>
                  <h2>{format(day, "EEEE d MMMM", { locale: fr })}</h2>
                  {dayEvents.length === 0 ? (
                    <p className="empty">Aucun cours</p>
                  ) : dayEvents.map((event) => (
                    <button className="mobile-event" key={event.id} onClick={() => setSelected(event)}>
                      <span className="mobile-time">{timeRange(event)}</span>
                      <span>
                        <strong>{event.title}</strong>
                        {event.location && <small>{event.location}</small>}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </section>
        </>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <article className="modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            <p className="eyebrow">Détail du cours</p>
            <h2>{selected.title}</h2>
            <p>{format(new Date(selected.start), "EEEE d MMMM yyyy", { locale: fr })}</p>
            <p><strong>{timeRange(selected)}</strong></p>
            {selected.location && <p>Local : {selected.location}</p>}
            {selected.description && <p className="description">{selected.description}</p>}
          </article>
        </div>
      )}
    </main>
  );
}
