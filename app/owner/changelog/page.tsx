import { CHANGELOG, APP_VERSION, APP_VERSION_DATE } from "@/lib/version";

const TYPE_STYLE: Record<string, { label: string; bg: string; text: string; border: string }> = {
  major: { label: "Major",  bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  minor: { label: "Minor",  bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"   },
  patch: { label: "Patch",  bg: "bg-gray-50",   text: "text-gray-600",   border: "border-gray-200"   },
};

export default function ChangelogPage() {
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">📋 Version History</h1>
        <p className="text-sm text-gray-500 mt-1">
          Beeative LiveBoard · เวอร์ชั่นปัจจุบัน{" "}
          <span className="font-bold text-[#1A1A1A]">v{APP_VERSION}</span>
          {" "}({APP_VERSION_DATE})
        </p>
      </div>

      {/* Cards */}
      {CHANGELOG.map((entry, i) => {
        const style = TYPE_STYLE[entry.type];
        const isLatest = i === 0;
        return (
          <div
            key={entry.version}
            className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 ${
              isLatest ? "border-[#F5D400]" : "border-transparent"
            }`}
          >
            {/* Card header */}
            <div
              className="px-4 py-3 flex items-start justify-between gap-2"
              style={isLatest ? { background: "linear-gradient(135deg,#F5D400,#F5A882)" } : { background: "#f9f9f9" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                    {entry.type === "major" ? "🚀" : entry.type === "minor" ? "✨" : "🔧"} {style.label}
                  </span>
                  {isLatest && (
                    <span className="text-xs font-bold bg-[#1A1A1A] text-[#F5D400] px-2 py-0.5 rounded-full">
                      ล่าสุด
                    </span>
                  )}
                </div>
                <div className={`font-bold mt-1 ${isLatest ? "text-[#1A1A1A]" : "text-[#1A1A1A]"}`}>
                  v{entry.version} — {entry.title}
                </div>
              </div>
              <div className={`text-xs whitespace-nowrap flex-shrink-0 pt-0.5 ${isLatest ? "text-[#1A1A1A]/60" : "text-gray-400"}`}>
                {entry.date}
              </div>
            </div>

            {/* Changes list */}
            <ul className="px-4 py-3 space-y-1.5">
              {entry.changes.map((change, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-[#F5D400] flex-shrink-0 mt-0.5">▸</span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <p className="text-center text-xs text-gray-300 py-4">
        Beeative LiveBoard v{APP_VERSION} · Built with ❤️
      </p>
    </div>
  );
}
