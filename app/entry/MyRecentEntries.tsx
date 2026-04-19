"use client";

import { useEffect, useState, useCallback } from "react";
import { updateEntry, deleteEntry } from "@/app/actions/entries";
import { PlatformBadge } from "@/components/ui/PlatformBadge";

const PLATFORM_LABELS: Record<string, string> = {
  TIKTOK: "TikTok", SHOPEE: "Shopee", FACEBOOK: "Facebook", OTHER: "อื่นๆ",
};

type Entry = {
  id: string; date: string; platform: string; salesAmount: number;
  notes: string | null; createdAt: string;
  sessionName: string | null; customStart: string | null; customEnd: string | null;
  userId: string; userName: string;
  createdByUserId: string | null; createdByName: string | null;
};

type SortMode = "log" | "date";
type ScopeMode = "mine" | "all";

// ─── helpers ──────────────────────────────────────────────────────────────────

function getTimeLabel(sessionName: string | null, start: string | null, end: string | null): string {
  if (start === "09:00" && end === "16:00") return "☀️ เช้า";
  if (start === "16:00" && (end === "00:00" || end === "24:00")) return "🌙 เย็น";
  if (start && end) return `⏰ ${start}–${end}`;
  if (sessionName) return `⏰ ${sessionName}`;
  return "⏰ กำหนดเอง";
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date:      d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" }),
    shortDate: d.toLocaleDateString("th-TH", { day: "numeric", month: "short", timeZone: "Asia/Bangkok" }),
    time:      d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }),
  };
}

function fmtSaleDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function groupByKey<T>(arr: T[], keyFn: (item: T) => string): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const item of arr) {
    const k = keyFn(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return [...map.entries()];
}

function fmtBaht(n: number): string {
  return "฿" + n.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

// ─── platform pill (alias to shared badge, xs size) ──────────────────────────
function PlatformPill({ platform }: { platform: string }) {
  return <PlatformBadge platform={platform} size="xs" />;
}

// ─── inline edit form ─────────────────────────────────────────────────────────

function EditForm({ entry, onCancel, onSaved }: { entry: Entry; onCancel: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState(String(entry.salesAmount));
  const [notes, setNotes]   = useState(entry.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  async function submit() {
    setLoading(true); setError("");
    const fd = new FormData();
    fd.append("id", entry.id);
    fd.append("salesAmount", amount);
    fd.append("notes", notes);
    const res = await updateEntry(fd);
    if (res?.error) setError(res.error);
    else onSaved();
    setLoading(false);
  }

  return (
    <div className="space-y-2 mt-2 animate-slide-up">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">฿</span>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="0.01"
          className="w-full border-2 border-[#F5D400] rounded-xl pl-7 pr-4 py-2 text-lg font-bold focus:outline-none bg-white dark:bg-[#1A1A1A] dark:text-white" />
      </div>
      <input value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="หมายเหตุ (ถ้ามี)"
        className="w-full border-2 border-gray-200 dark:border-[#2A2A2A] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5D400] bg-white dark:bg-[#1A1A1A] dark:text-white" />
      {error && <div className="text-red-500 text-xs">{error}</div>}
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2 rounded-xl border-2 border-gray-200 dark:border-[#2A2A2A] text-gray-500 text-sm">ยกเลิก</button>
        <button onClick={submit} disabled={loading}
          className="flex-1 py-2 rounded-xl text-sm font-semibold text-[#1A1A1A] disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
          {loading ? "..." : "บันทึก"}
        </button>
      </div>
    </div>
  );
}

// ─── confirm delete ───────────────────────────────────────────────────────────

function ConfirmDelete({ entry, onCancel, onDeleted }: { entry: Entry; onCancel: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  async function handleDelete() {
    setLoading(true); setError("");
    const res = await deleteEntry(entry.id);
    if (res?.error) { setError(res.error); setLoading(false); }
    else onDeleted();
  }

  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 space-y-2 animate-slide-up">
      <div className="text-sm font-semibold text-red-600 dark:text-red-400">
        ลบ {fmtBaht(entry.salesAmount)} · {entry.userName}?
      </div>
      {error && <div className="text-red-500 text-xs">{error}</div>}
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-1.5 rounded-xl border-2 border-gray-200 dark:border-[#2A2A2A] text-gray-500 text-sm">ยกเลิก</button>
        <button onClick={handleDelete} disabled={loading}
          className="flex-1 py-1.5 rounded-xl text-sm font-semibold text-white bg-red-500 disabled:opacity-40">
          {loading ? "กำลังลบ..." : "🗑️ ยืนยันลบ"}
        </button>
      </div>
    </div>
  );
}

// ─── single entry row ─────────────────────────────────────────────────────────

function EntryRow({ entry, sortMode, showOwner, onRefresh }: {
  entry: Entry; sortMode: SortMode; showOwner: boolean; onRefresh: () => void;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view");
  const { time: createdTime, shortDate: createdShort } = fmtDateTime(entry.createdAt);
  const timeLabel = getTimeLabel(entry.sessionName, entry.customStart, entry.customEnd);
  const isByProxy = entry.createdByUserId && entry.createdByUserId !== entry.userId;

  if (mode === "edit") {
    return (
      <div className="rounded-xl border border-[#F5D400] bg-[#FFFBEB] dark:bg-[#1C1800] p-3">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          {fmtSaleDate(entry.date)} · {timeLabel}
          {showOwner && <span className="ml-1 text-orange-500 font-medium">· {entry.userName}</span>}
        </div>
        <EditForm entry={entry} onCancel={() => setMode("view")} onSaved={() => { setMode("view"); onRefresh(); }} />
      </div>
    );
  }

  if (mode === "confirm") {
    return <ConfirmDelete entry={entry} onCancel={() => setMode("view")} onDeleted={onRefresh} />;
  }

  const actions = (
    <div className="flex gap-1 flex-shrink-0">
      <button onClick={() => setMode("edit")}
        className="text-[11px] px-2 py-1 rounded-lg bg-[#FFF8CC] dark:bg-[#2A2200] text-[#1A1A1A] dark:text-[#F5D400] font-medium">✏️</button>
      <button onClick={() => setMode("confirm")}
        className="text-[11px] px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 font-medium">🗑️</button>
    </div>
  );

  if (sortMode === "log") {
    return (
      <div className="flex items-start gap-2.5 py-2.5 border-b border-gray-100 dark:border-[#222] last:border-0">
        {/* timestamp */}
        <div className="flex-shrink-0 w-11 text-right pt-0.5">
          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">{createdTime}</span>
        </div>
        {/* body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-gray-900 dark:text-white">{fmtBaht(entry.salesAmount)}</span>
            <PlatformPill platform={entry.platform} />
            <span className="text-[11px] text-gray-400 dark:text-gray-500">{timeLabel}</span>
          </div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 flex flex-wrap gap-x-1.5">
            <span>ยอดวัน {fmtSaleDate(entry.date)}</span>
            {showOwner && <span className="text-orange-500 font-medium">{entry.userName}</span>}
            {isByProxy && <span className="text-purple-400">บันทึกแทนโดย {entry.createdByName}</span>}
          </div>
          {entry.notes && <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">📝 {entry.notes}</div>}
        </div>
        {actions}
      </div>
    );
  }

  // date mode
  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-[#222] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-bold text-gray-900 dark:text-white">{fmtBaht(entry.salesAmount)}</span>
          <PlatformPill platform={entry.platform} />
          <span className="text-[11px] text-gray-400 dark:text-gray-500">{timeLabel}</span>
          {showOwner && <span className="text-[11px] text-orange-500 font-medium">{entry.userName}</span>}
          {isByProxy && <span className="text-[10px] text-purple-400">บันทึกโดย {entry.createdByName}</span>}
        </div>
        {entry.notes && <div className="text-[11px] text-gray-400 dark:text-gray-500">📝 {entry.notes}</div>}
      </div>
      <div className="text-[10px] text-gray-300 dark:text-gray-600 text-right flex-shrink-0 leading-tight">
        <div>{createdShort}</div>
        <div>{createdTime}</div>
      </div>
      {actions}
    </div>
  );
}

// ─── skeleton loader ──────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <div className="py-2.5 border-b border-gray-100 dark:border-[#222] last:border-0 flex gap-2.5 items-start">
      <div className="w-11 h-3 bg-gray-100 dark:bg-[#2A2A2A] rounded-full animate-pulse mt-1 flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="flex gap-2">
          <div className="h-4 w-16 bg-gray-100 dark:bg-[#2A2A2A] rounded-full animate-pulse" />
          <div className="h-4 w-12 bg-gray-100 dark:bg-[#2A2A2A] rounded-full animate-pulse" />
        </div>
        <div className="h-3 w-28 bg-gray-100 dark:bg-[#2A2A2A] rounded-full animate-pulse" />
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

const DAYS_PER_PAGE = 2;

export default function MyRecentEntries({ isOwnerEmployee = false }: { isOwnerEmployee?: boolean }) {
  const [open, setOpen]   = useState(false);
  const [sort, setSort]   = useState<SortMode>("log");
  const [scope, setScope] = useState<ScopeMode>("mine");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage]   = useState(0);

  const refresh = useCallback(async (s: SortMode, sc: ScopeMode) => {
    setLoading(true);
    const data = await fetch(`/api/entries-log?sort=${s}&scope=${sc}`).then(r => r.json());
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => { if (open) refresh(sort, scope); }, [open, sort, scope, refresh]);
  useEffect(() => { setPage(0); }, [sort, scope]);

  // group
  const grouped: [string, Entry[]][] = sort === "log"
    ? groupByKey(entries, e =>
        new Date(e.createdAt).toLocaleDateString("th-TH", {
          day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok",
        })
      )
    : groupByKey(entries, e => e.date);

  const totalPages  = Math.ceil(grouped.length / DAYS_PER_PAGE);
  const pagedGroups = grouped.slice(page * DAYS_PER_PAGE, (page + 1) * DAYS_PER_PAGE);
  const showOwner   = scope === "all" && isOwnerEmployee;

  return (
    <div className="mx-4 mt-3">
      {/* Accordion header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-white dark:bg-[#1A1A1A] rounded-2xl px-4 py-3 shadow-sm dark:shadow-none border border-transparent dark:border-[#2A2A2A] text-sm font-semibold text-gray-800 dark:text-white transition-all"
      >
        <span>📋 รายการที่บันทึกไว้</span>
        <span className="text-gray-400 dark:text-gray-500">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-b-2xl shadow-sm dark:shadow-none border-x border-b border-gray-100 dark:border-[#2A2A2A] -mt-2 pt-3 pb-4 px-4 animate-fade-in">

          {/* Controls */}
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            {/* Sort toggle */}
            <div className="flex bg-gray-100 dark:bg-[#242424] rounded-xl p-0.5 gap-0.5">
              {([ { v: "log", label: "🕐 Log" }, { v: "date", label: "📅 Sale Date" } ] as { v: SortMode; label: string }[]).map(t => (
                <button key={t.v} onClick={() => setSort(t.v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    sort === t.v
                      ? "bg-white dark:bg-[#1A1A1A] shadow-sm text-gray-900 dark:text-white"
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
            {/* Scope toggle */}
            {isOwnerEmployee && (
              <div className="flex bg-gray-100 dark:bg-[#242424] rounded-xl p-0.5 gap-0.5">
                {([ { v: "mine", label: "ของฉัน" }, { v: "all", label: "👥 ทั้งหมด" } ] as { v: ScopeMode; label: string }[]).map(t => (
                  <button key={t.v} onClick={() => setScope(t.v)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      scope === t.v
                        ? "bg-white dark:bg-[#1A1A1A] shadow-sm text-gray-900 dark:text-white"
                        : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-0">
              {[...Array(4)].map((_, i) => <RowSkeleton key={i} />)}
            </div>
          ) : entries.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm text-gray-400 dark:text-gray-500">ยังไม่มีรายการ</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {pagedGroups.map(([groupKey, groupEntries]) => {
                  const dayTotal = groupEntries.reduce((s, e) => s + e.salesAmount, 0);
                  return (
                    <div key={groupKey}>
                      {/* Group header */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-[#242424] px-2 py-0.5 rounded-full">
                          {sort === "log" ? groupKey : fmtSaleDate(groupKey)} · {groupEntries.length} รายการ
                        </span>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          {fmtBaht(dayTotal)}
                        </span>
                      </div>
                      {/* Rows */}
                      <div className="bg-gray-50 dark:bg-[#141414] rounded-xl px-3">
                        {groupEntries.map(entry => (
                          <EntryRow
                            key={entry.id}
                            entry={entry}
                            sortMode={sort}
                            showOwner={showOwner}
                            onRefresh={() => refresh(sort, scope)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-[#2A2A2A]">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 disabled:text-gray-200 dark:disabled:text-gray-700 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#242424] transition-colors disabled:hover:bg-transparent">
                    ‹ ก่อนหน้า
                  </button>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{page + 1} / {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 disabled:text-gray-200 dark:disabled:text-gray-700 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#242424] transition-colors disabled:hover:bg-transparent">
                    ถัดไป ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
