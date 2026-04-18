"use client";

import { useEffect, useState, useCallback } from "react";
import { updateEntry, deleteEntry } from "@/app/actions/entries";

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

function fmtDateTime(iso: string): { date: string; time: string; shortDate: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString("th-TH", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok",
  });
  const shortDate = d.toLocaleDateString("th-TH", {
    day: "numeric", month: "short", timeZone: "Asia/Bangkok",
  });
  const time = d.toLocaleTimeString("th-TH", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok",
  });
  return { date, time, shortDate };
}

function fmtSaleDate(dateStr: string): string {
  // dateStr = "YYYY-MM-DD"
  const [y, m, d] = dateStr.split("-");
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  return dt.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
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

// ─── inline edit form ─────────────────────────────────────────────────────────

function EditForm({
  entry, onCancel, onSaved,
}: {
  entry: Entry;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState(String(entry.salesAmount));
  const [notes, setNotes] = useState(entry.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="space-y-2 mt-2">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">฿</span>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
          min="0" step="0.01"
          className="w-full border-2 border-[#F5D400] rounded-xl pl-7 pr-4 py-2 text-lg font-bold focus:outline-none" />
      </div>
      <input value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="หมายเหตุ (ถ้ามี)"
        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5D400]" />
      {error && <div className="text-red-500 text-xs">{error}</div>}
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-gray-500 text-sm">ยกเลิก</button>
        <button onClick={submit} disabled={loading}
          className="flex-1 py-2 rounded-xl text-sm font-semibold text-[#1A1A1A] disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
          {loading ? "..." : "บันทึก"}
        </button>
      </div>
    </div>
  );
}

// ─── single entry row ─────────────────────────────────────────────────────────

function EntryRow({
  entry, sortMode, showOwner, onRefresh,
}: {
  entry: Entry;
  sortMode: SortMode;
  showOwner: boolean;   // แสดงชื่อพนักงาน (scope=all)
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const { date: createdDate, time: createdTime, shortDate: createdShort } = fmtDateTime(entry.createdAt);
  const timeLabel = getTimeLabel(entry.sessionName, entry.customStart, entry.customEnd);
  const isByProxy = entry.createdByUserId && entry.createdByUserId !== entry.userId;

  async function handleDelete() {
    setDeleting(true); setError("");
    const res = await deleteEntry(entry.id);
    if (res?.error) { setError(res.error); setDeleting(false); setConfirming(false); }
    else onRefresh();
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-[#F5D400] bg-[#FFFBEB] p-3">
        <div className="text-xs text-gray-500 mb-1">
          {fmtSaleDate(entry.date)} · {PLATFORM_LABELS[entry.platform]} · {timeLabel}
          {showOwner && <span className="ml-1 text-orange-500 font-medium">· {entry.userName}</span>}
        </div>
        <EditForm entry={entry} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); onRefresh(); }} />
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-2">
        <div className="text-sm font-semibold text-red-600">
          ลบรายการ ฿{entry.salesAmount.toLocaleString("th-TH")} ของ {entry.userName}?
        </div>
        {error && <div className="text-red-500 text-xs">{error}</div>}
        <div className="flex gap-2">
          <button onClick={() => setConfirming(false)}
            className="flex-1 py-1.5 rounded-xl border-2 border-gray-200 text-gray-500 text-sm">ยกเลิก</button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 py-1.5 rounded-xl text-sm font-semibold text-white bg-red-500 disabled:opacity-40">
            {deleting ? "กำลังลบ..." : "🗑️ ยืนยันลบ"}
          </button>
        </div>
      </div>
    );
  }

  // ── Log mode row ──
  if (sortMode === "log") {
    return (
      <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
        {/* timestamp dot */}
        <div className="flex-shrink-0 w-14 text-right">
          <span className="text-[11px] text-gray-400 font-mono leading-tight">{createdTime}</span>
        </div>
        {/* content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#1A1A1A]">
            ฿{entry.salesAmount.toLocaleString("th-TH")}
            <span className="ml-2 font-normal text-xs text-gray-500">
              {PLATFORM_LABELS[entry.platform]} · {timeLabel}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            ยอดวัน {fmtSaleDate(entry.date)}
            {showOwner && (
              <span className="ml-1 text-orange-500 font-medium">· {entry.userName}</span>
            )}
            {isByProxy && (
              <span className="ml-1 text-purple-500">· บันทึกแทนโดย {entry.createdByName}</span>
            )}
          </div>
          {entry.notes && <div className="text-xs text-gray-400 mt-0.5">📝 {entry.notes}</div>}
        </div>
        {/* actions */}
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => setEditing(true)}
            className="text-[11px] px-2 py-1 rounded-lg bg-[#FFF8CC] text-[#1A1A1A] font-medium">✏️</button>
          <button onClick={() => setConfirming(true)}
            className="text-[11px] px-2 py-1 rounded-lg bg-red-50 text-red-500 font-medium">🗑️</button>
        </div>
      </div>
    );
  }

  // ── Date mode row ──
  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-[#1A1A1A]">฿{entry.salesAmount.toLocaleString("th-TH")}</span>
          <span className="text-xs text-gray-500">{PLATFORM_LABELS[entry.platform]}</span>
          <span className="text-xs text-gray-400">{timeLabel}</span>
          {showOwner && <span className="text-xs text-orange-500 font-medium">{entry.userName}</span>}
          {isByProxy && <span className="text-[10px] text-purple-400">บันทึกโดย {entry.createdByName}</span>}
        </div>
        {entry.notes && <div className="text-xs text-gray-400">📝 {entry.notes}</div>}
      </div>
      {/* บันทึกเมื่อ */}
      <div className="text-[10px] text-gray-300 text-right flex-shrink-0 leading-tight">
        <div>{createdShort}</div>
        <div>{createdTime}</div>
      </div>
      {/* actions */}
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => setEditing(true)}
          className="text-[11px] px-2 py-1 rounded-lg bg-[#FFF8CC] text-[#1A1A1A] font-medium">✏️</button>
        <button onClick={() => setConfirming(true)}
          className="text-[11px] px-2 py-1 rounded-lg bg-red-50 text-red-500 font-medium">🗑️</button>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function MyRecentEntries({ isOwnerEmployee = false }: { isOwnerEmployee?: boolean }) {
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<SortMode>("log");
  const [scope, setScope] = useState<ScopeMode>("mine");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (s: SortMode, sc: ScopeMode) => {
    setLoading(true);
    const data = await fetch(`/api/entries-log?sort=${s}&scope=${sc}`).then(r => r.json());
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) refresh(sort, scope);
  }, [open, sort, scope, refresh]);

  // ── group entries ──
  const grouped: [string, Entry[]][] =
    sort === "log"
      ? groupByKey(entries, e => {
          // group by Bangkok date of createdAt
          return new Date(e.createdAt).toLocaleDateString("th-TH", {
            day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok",
          });
        })
      : groupByKey(entries, e => e.date); // group by sale date

  const showOwner = scope === "all" && isOwnerEmployee;

  return (
    <div className="mx-4 mt-3">
      {/* Header button */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm text-sm font-semibold text-[#1A1A1A]">
        <span>📋 รายการที่บันทึกไว้</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="bg-white rounded-b-2xl shadow-sm -mt-2 pt-3 pb-4 px-4">
          {/* Controls row */}
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            {/* Sort toggle */}
            <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
              {([
                { v: "log",  label: "🕐 Log" },
                { v: "date", label: "📅 วันที่ยอด" },
              ] as { v: SortMode; label: string }[]).map(t => (
                <button key={t.v}
                  onClick={() => setSort(t.v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    sort === t.v ? "bg-white shadow-sm text-[#1A1A1A]" : "text-gray-400"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Scope toggle (owner-employee only) */}
            {isOwnerEmployee && (
              <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
                {([
                  { v: "mine", label: "ของฉัน" },
                  { v: "all",  label: "👥 ทั้งหมด" },
                ] as { v: ScopeMode; label: string }[]).map(t => (
                  <button key={t.v}
                    onClick={() => setScope(t.v)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      scope === t.v ? "bg-white shadow-sm text-[#1A1A1A]" : "text-gray-400"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-6 text-gray-400 text-sm">กำลังโหลด...</div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีรายการ</p>
          ) : (
            <div className="space-y-4">
              {grouped.map(([groupKey, groupEntries]) => (
                <div key={groupKey}>
                  {/* Group header */}
                  <div className="text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-2">
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                      {sort === "log" ? groupKey : fmtSaleDate(groupKey)}
                    </span>
                    <span className="text-gray-300">{groupEntries.length} รายการ</span>
                  </div>
                  {/* Entries */}
                  <div className="bg-gray-50 rounded-xl px-3">
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
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
