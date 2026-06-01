import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { DateRange } from "react-day-picker";
import { X, CalendarDays, Clock, Link2, Send, Check, Plus, Trash2 } from "lucide-react";
import { Calendar } from "./ui/calendar";

const CONTACT_EMAIL = "philipboafo21@gmail.com";

function fmt(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function BookCallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [meetingLinks, setMeetingLinks] = useState<string[]>([""]);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  // Close on Escape + lock background scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const addLink = () => setMeetingLinks(l => [...l, ""]);
  const removeLink = (i: number) => setMeetingLinks(l => l.filter((_, idx) => idx !== i));
  const updateLink = (i: number, val: string) => setMeetingLinks(l => l.map((x, idx) => (idx === i ? val : x)));

  const valid = Boolean(name.trim() && range?.from && timeFrom && timeTo);

  const dateLabel = range?.from
    ? range.to && range.to.getTime() !== range.from.getTime()
      ? `${fmt(range.from)} – ${fmt(range.to)}`
      : fmt(range.from)
    : "No date selected";

  const send = () => {
    if (!valid || !range?.from) return;
    const links = meetingLinks.map(l => l.trim()).filter(Boolean);
    const linkLines = links.length
      ? links.map((l, i) => `Meeting link${links.length > 1 ? ` ${i + 1}` : ""}: ${l}`)
      : [`Meeting link: (to be shared)`];

    const subject = `Call request from ${name.trim()}`;
    const body = [
      `Hi Philip,`,
      ``,
      `I'd like to book a call with you.`,
      ``,
      `Name: ${name.trim()}`,
      `Preferred date${range.to && range.to.getTime() !== range.from.getTime() ? "s" : ""}: ${dateLabel}`,
      `Preferred time: ${timeFrom} – ${timeTo}`,
      ...linkLines,
      ``,
      note.trim() ? `Note: ${note.trim()}` : ``,
    ].join("\n");

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 1800);
  };

  const fieldCls =
    "w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-2 focus:ring-white/10 transition-all";
  const labelCls = "block text-xs font-medium text-zinc-400 mb-1.5";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0c0e] p-6 shadow-2xl shadow-black/50"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            <h2 className="text-lg font-semibold">Book a call</h2>
            <p className="mt-1 mb-5 text-sm text-zinc-500">
              Pick a date and time range that works for you. I'll get your request by email.
            </p>

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className={labelCls}>Your name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={fieldCls}
                  placeholder="Jane Doe"
                  autoFocus
                />
              </div>

              {/* Date range */}
              <div>
                <label className={labelCls}>
                  <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> Preferred date(s)</span>
                </label>
                <div className="dark rounded-xl border border-zinc-800 bg-zinc-900/40 flex justify-center">
                  <Calendar
                    mode="range"
                    selected={range}
                    onSelect={setRange}
                    numberOfMonths={1}
                    disabled={{ before: new Date() }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">{dateLabel}</p>
              </div>

              {/* Time range */}
              <div>
                <label className={labelCls}>
                  <span className="inline-flex items-center gap-1.5"><Clock size={13} /> Preferred time range</span>
                </label>
                <div className="flex items-center gap-2">
                  <input type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} className={fieldCls} />
                  <span className="text-zinc-600 text-sm">to</span>
                  <input type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)} className={fieldCls} />
                </div>
              </div>

              {/* Meeting links */}
              <div>
                <label className={labelCls}>
                  <span className="inline-flex items-center gap-1.5"><Link2 size={13} /> Meeting link(s) (optional)</span>
                </label>
                <div className="space-y-2">
                  {meetingLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="url"
                        value={link}
                        onChange={e => updateLink(i, e.target.value)}
                        className={fieldCls}
                        placeholder="https://meet.google.com/…"
                      />
                      {meetingLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLink(i)}
                          aria-label="Remove link"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-red-400/10 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addLink}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  <Plus size={12} /> Add another link
                </button>
              </div>

              {/* Note */}
              <div>
                <label className={labelCls}>Note (optional)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={2}
                  className={`${fieldCls} resize-none`}
                  placeholder="What would you like to talk about?"
                />
              </div>

              <button
                onClick={send}
                disabled={!valid || sent}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-200 disabled:opacity-40"
              >
                {sent ? (
                  <><Check size={15} /> Opening your email…</>
                ) : (
                  <><Send size={14} /> Send request</>
                )}
              </button>
              {!valid && (
                <p className="text-center text-xs text-zinc-600">Add your name, a date, and a time range to continue.</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
