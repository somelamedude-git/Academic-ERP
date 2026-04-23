import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../Styles/Timetable.css";
import { getStudentTimetable, getStudentTimetablePDFs } from "../Services/api.js";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const FALLBACK_START_HOUR = 8;
const FALLBACK_END_HOUR = 18;
const HOUR_HEIGHT = 72;

const Timetable = () => {
  const [activeTab, setActiveTab] = useState("pdfs"); // "pdfs" | "schedule"
  const [timetable, setTimetable] = useState({});
  const [other, setOther] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);

  // PDF timetables
  const [pdfs, setPdfs] = useState([]);
  const [pdfsLoading, setPdfsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadTimetable = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getStudentTimetable();
        if (isMounted) {
          const nextTimetable =
            data?.timetable && typeof data.timetable === "object"
              ? data.timetable
              : {};
          setTimetable(nextTimetable);
          setOther([]);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load timetable.");
          setTimetable({});
          setOther([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTimetable();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load PDF timetables
  useEffect(() => {
    getStudentTimetablePDFs()
      .then(res => setPdfs(res.timetables ?? []))
      .catch(() => setPdfs([]))
      .finally(() => setPdfsLoading(false));
  }, []);

  const normalizedEvents = useMemo(() => {
    const entries = [];

    DAYS.forEach((day) => {
      const items = Array.isArray(timetable?.[day]) ? timetable[day] : [];
      const otherItems = Array.isArray(other) ? other.filter((item) => item?.day === day) : [];

      items.forEach((item, index) => {
        const timeRange = parseTimeRange(item?.time);
        entries.push({
          day,
          course: item?.course || "Class",
          room: item?.room || "Room TBA",
          attendance: formatAttendance(item?.attendance),
          rawTime: item?.time || "",
          startMinute: timeRange.startMinute,
          endMinute: timeRange.endMinute,
          key: `${day}-${item?.course || "class"}-${item?.time || "time"}-${index}`,
        });
      });

      otherItems.forEach((item, index) => {
        const timeRange = parseTimeRange(item?.time);
        entries.push({
          day,
          course: item?.course || "Other",
          room: item?.room || "Location TBA",
          attendance: formatAttendance(item?.attendance),
          rawTime: item?.time || "",
          startMinute: timeRange.startMinute,
          endMinute: timeRange.endMinute,
          key: `${day}-other-${item?.course || "activity"}-${item?.time || "time"}-${index}`,
        });
      });
    });

    return entries;
  }, [other, timetable]);

  const { startHour, endHour } = useMemo(() => {
    if (!normalizedEvents.length) {
      return { startHour: FALLBACK_START_HOUR, endHour: FALLBACK_END_HOUR };
    }

    const starts = normalizedEvents.map((event) => event.startMinute / 60);
    const ends = normalizedEvents.map((event) => event.endMinute / 60);

    const minHour = Math.floor(Math.min(...starts));
    const maxHour = Math.ceil(Math.max(...ends));

    return {
      startHour: Math.max(6, Math.min(FALLBACK_START_HOUR, minHour)),
      endHour: Math.min(22, Math.max(FALLBACK_END_HOUR, maxHour)),
    };
  }, [normalizedEvents]);

  const hours = useMemo(() => {
    const allHours = [];
    for (let hour = startHour; hour <= endHour; hour += 1) {
      allHours.push(hour);
    }
    return allHours;
  }, [startHour, endHour]);

  const totalHeight = Math.max((endHour - startHour) * HOUR_HEIGHT, 600);
  const todayIndex = getTodayIndex();
  const isCurrentWeek = weekOffset === 0;
  const weekRangeLabel = useMemo(() => {
    const startDate = getStartOfWeek(new Date(), weekOffset);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (DAYS.length - 1));
    return formatWeekRange(startDate, endDate);
  }, [weekOffset]);
  const visibleDates = useMemo(() => {
    const startDate = getStartOfWeek(new Date(), weekOffset);
    return DAYS.map((_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      return date;
    });
  }, [weekOffset]);

  return (
    <div className="tt-page">
      <Navbar />
      <main className="tt-container">
        <header className="tt-header">
          <div>
            <h1>Timetable</h1>
            <p>View your schedule and uploaded timetable PDFs.</p>
          </div>
          <div className="tt-header-controls">
            {/* Tab switcher */}
            <div className="tt-nav-group">
              <button
                type="button"
                className={`tt-nav-btn ${activeTab === "pdfs" ? "tt-nav-btn--today" : ""}`}
                onClick={() => setActiveTab("pdfs")}
              >
                PDF Timetables
              </button>
              <button
                type="button"
                className={`tt-nav-btn ${activeTab === "schedule" ? "tt-nav-btn--today" : ""}`}
                onClick={() => setActiveTab("schedule")}
              >
                Schedule
              </button>
            </div>
          </div>
        </header>

        {/* ── PDF Timetables tab ── */}
        {activeTab === "pdfs" && (
          <section style={{ marginTop: "8px" }}>
            {pdfsLoading && <p className="tt-muted">Loading timetables...</p>}
            {!pdfsLoading && pdfs.length === 0 && (
              <p className="tt-muted">No timetable PDFs uploaded yet. Check back later.</p>
            )}
            {!pdfsLoading && pdfs.length > 0 && (
              <div style={{ display: "grid", gap: "12px" }}>
                {pdfs.map(t => (
                  <div
                    key={t._id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "18px 22px",
                      background: "var(--glass)", backdropFilter: "blur(14px)",
                      border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)",
                      transition: "all var(--duration-normal) var(--ease-out)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "var(--radius-sm)",
                        background: "var(--danger-soft)", display: "grid", placeItems: "center", flexShrink: 0,
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div>
                        <strong style={{ color: "var(--text-primary)", fontSize: "14px" }}>
                          {t.originalName || "Timetable.pdf"}
                        </strong>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                          Uploaded {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <a
                      href={t.cloudinaryUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        padding: "8px 18px", borderRadius: "var(--radius-sm)",
                        background: "var(--accent-indigo)", color: "#fff",
                        fontWeight: 700, fontSize: "13px", textDecoration: "none",
                        boxShadow: "0 0 16px rgba(99,102,241,0.25)",
                        transition: "background var(--duration-normal)",
                      }}
                    >
                      Open PDF
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Schedule tab ── */}
        {activeTab === "schedule" && (
          <>
            <div className="tt-header-controls" style={{ marginBottom: "16px" }}>
              <div className="tt-nav-group">
                <button type="button" className="tt-nav-btn" onClick={() => setWeekOffset((prev) => prev - 1)}>Prev</button>
                <button type="button" className="tt-nav-btn tt-nav-btn--today" onClick={() => setWeekOffset(0)}>Today</button>
                <button type="button" className="tt-nav-btn" onClick={() => setWeekOffset((prev) => prev + 1)}>Next</button>
              </div>
              <div className="tt-view-badge">{weekRangeLabel}</div>
            </div>

            {loading && <p className="tt-muted">Loading schedule...</p>}
            {!loading && error && <p className="tt-error">{error}</p>}
            {!loading && !error && (
              <>
                <section className="tt-calendar-shell" aria-label="Weekly timetable calendar">
                  <div className="tt-calendar-header-row">
                    <div className="tt-time-header">Time</div>
                    <div className="tt-day-headers">
                      {DAYS.map((day, index) => (
                        <div key={day} className={`tt-day-header-cell ${isCurrentWeek && index === todayIndex ? "tt-day-header-cell--today" : ""}`}>
                          {day.slice(0, 3)}
                          <span>{visibleDates[index].getDate()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="tt-calendar-body" style={{ height: `${totalHeight}px` }}>
                    <div className="tt-time-column">
                      {hours.map((hour) => (
                        <div key={hour} className="tt-time-slot" style={{ height: `${HOUR_HEIGHT}px` }}>
                          <span>{formatHour(hour)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="tt-day-grid">
                      {DAYS.map((day) => {
                        const dayEvents = normalizedEvents.filter((event) => event.day === day);
                        const dayIndex = DAYS.indexOf(day);
                        const todayClass = isCurrentWeek && dayIndex === todayIndex ? "tt-day-column--today" : "";
                        return (
                          <div key={day} className={`tt-day-column ${todayClass}`}>
                            {hours.slice(0, -1).map((hour) => (
                              <div key={`${day}-${hour}`} className="tt-hour-line" style={{ top: `${(hour - startHour) * HOUR_HEIGHT}px` }} />
                            ))}
                            {dayEvents.map((event) => {
                              const top = ((event.startMinute / 60) - startHour) * HOUR_HEIGHT;
                              const height = Math.max(((event.endMinute - event.startMinute) / 60) * HOUR_HEIGHT, 44);
                              return (
                                <article key={event.key} className="tt-event" style={{ top: `${top}px`, height: `${height}px` }}>
                                  <p className="tt-event-time">{event.rawTime || `${formatHour(event.startMinute / 60)} - ${formatHour(event.endMinute / 60)}`}</p>
                                  <h4>{event.course}</h4>
                                  <span>{event.room}</span>
                                  <p className="tt-event-attendance">Attendance: {event.attendance}</p>
                                </article>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <section className="tt-mobile-list" aria-label="Weekly list view">
                  {DAYS.map((day, index) => {
                    const dayEvents = normalizedEvents.filter((event) => event.day === day);
                    return (
                      <article key={`mobile-${day}`} className={`tt-mobile-day-card ${isCurrentWeek && index === todayIndex ? "tt-mobile-day-card--today" : ""}`}>
                        <h3>
                          {day}
                          <span>{visibleDates[index].toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </h3>
                        {dayEvents.length === 0 ? (
                          <p className="tt-empty">No classes scheduled.</p>
                        ) : (
                          <ul>
                            {dayEvents.map((event) => (
                              <li key={`mobile-${event.key}`}>
                                <strong>{event.rawTime || `${formatHour(event.startMinute / 60)} - ${formatHour(event.endMinute / 60)}`}</strong>
                                <p>{event.course}</p>
                                <span>{event.room}</span>
                                <small className="tt-mobile-attendance">Attendance: {event.attendance}</small>
                              </li>
                            ))}
                          </ul>
                        )}
                      </article>
                    );
                  })}
                </section>
              </>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

const parseTimeRange = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return {
      startMinute: FALLBACK_START_HOUR * 60,
      endMinute: (FALLBACK_START_HOUR + 1) * 60,
    };
  }

  const parts = value
    .split(/-|to/i)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    const start = parseTime(parts[0]);
    const end = parseTime(parts[1]);

    if (start !== null && end !== null && end > start) {
      return { startMinute: start, endMinute: end };
    }
  }

  const single = parseTime(value);
  if (single !== null) {
    return { startMinute: single, endMinute: single + 60 };
  }

  return {
    startMinute: FALLBACK_START_HOUR * 60,
    endMinute: (FALLBACK_START_HOUR + 1) * 60,
  };
};

const parseTime = (value) => {
  const text = String(value).trim().toLowerCase();
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);

  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3];

  if (Number.isNaN(hour) || Number.isNaN(minute) || minute > 59) {
    return null;
  }

  if (meridiem === "pm" && hour < 12) {
    hour += 12;
  } else if (meridiem === "am" && hour === 12) {
    hour = 0;
  }

  if (!meridiem && hour <= 7) {
    hour += 12;
  }

  if (hour < 0 || hour > 23) {
    return null;
  }

  return (hour * 60) + minute;
};

const formatHour = (hourValue) => {
  const hour = Math.floor(hourValue);
  const minute = Math.round((hourValue - hour) * 60);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatAttendance = (value) => {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return `${Math.round(value)}%`;
  }

  const text = String(value).trim();
  if (!text) {
    return "N/A";
  }

  return text.includes("%") ? text : `${text}%`;
};

const getTodayIndex = () => {
  const today = new Date().getDay();
  const map = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
  return map[today] ?? -1;
};

const getStartOfWeek = (baseDate, offset = 0) => {
  const date = new Date(baseDate);
  const dayOfWeek = date.getDay();
  const distanceFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setDate(date.getDate() + distanceFromMonday + (offset * 7));
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatWeekRange = (startDate, endDate) => {
  const startMonth = startDate.toLocaleDateString("en-US", { month: "short" });
  const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const year = endDate.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  }

  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
};

export default Timetable;
