import React, { useState } from "react";
import { CalendarSettings, OutlookEvent } from "../types";
import { Plus } from "lucide-react";
import {
  FSCJ_HOLIDAYS,
  getSummerBounds,
  isSummerDate,
} from "../utils/calendarEngine";

interface CalendarPanelProps {
  settings: CalendarSettings;
  outlookEvents: OutlookEvent[];
  onUpdateBlockedDates: (dates: string[]) => Promise<void>;
  onConnectOutlook: (clientId: string, tenantId: string) => void;
  onDisconnectOutlook: () => Promise<void>;
  onTriggerSync: () => Promise<void>;
}

export function CalendarSettingsPanel({
  settings,
  onUpdateBlockedDates,
}: CalendarPanelProps) {
  const [newBlockedDate, setNewBlockedDate] = useState("");

  const bounds = getSummerBounds(2026);

  const formatShortDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(date.getTime())) return dateStr;

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);

    return `${month}-${day}-${year}`;
  };

  const getHolidayLabel = (dateStr: string) => {
    const date = new Date(`${dateStr}T12:00:00`);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if (month === 1 && day === 1) return "College Closed (New Year's Day)";
    if (month === 1) return "College Closed (Martin Luther King Jr. Day)";
    if (month === 3 || month === 4) return "College Closed (Spring Break)";
    if (month === 5) return "College Closed (Memorial Day)";
    if (month === 6 && day === 19) return "College Closed (Juneteenth)";
    if (month === 7 && day === 4) return "College Closed (Independence Day)";
    if (month === 9) return "College Closed (Labor Day)";
    if (month === 11 && day >= 20) return "College Closed (Thanksgiving Break)";
    if (month === 12) return "College Closed (Winter Break)";

    return isSummerDate(dateStr)
      ? "College Closed (Summer Block)"
      : "College Closed";
  };

  const handleAddBlocked = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newBlockedDate) return;

    if (settings.customBlocked.includes(newBlockedDate)) {
      alert("This exclusion date is already blocked.");
      return;
    }

    const updated = [...settings.customBlocked, newBlockedDate].sort();
    await onUpdateBlockedDates(updated);
    setNewBlockedDate("");
  };

  const handleDeleteBlocked = async (idx: number) => {
    const updated = settings.customBlocked.filter((_, i) => i !== idx);
    await onUpdateBlockedDates(updated);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8">
      {/* CAPACITY STANDARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-[#E0DCD8] p-6 shadow-2xs">
        <div className="border-r border-slate-100 pr-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold">
              Institutional Capacity Standard
            </span>
            <h3 className="text-2xl font-semibold text-[#006282] mt-1">
              40 Working Hours
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Monday &ndash; Thursday (7:30 AM &ndash; 5:30 PM: 10H/day)
              <br />
              Friday (7:30 AM &ndash; 11:30 AM: 4H/day)
            </p>
          </div>

          <div className="text-2xs text-[#087834] font-semibold font-mono mt-3 uppercase border-t pt-2">
            Standard Schedule Active September - April
          </div>
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold">
              Collegiate Summer Rules
            </span>
            <h3 className="text-2xl font-semibold text-[#33B1C8] mt-1">
              36 Working Hours
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Monday &ndash; Thursday (7:30 AM &ndash; 5:30 PM: 10H/day)
              <br />
              Fridays closed (Non-working day capacity)
            </p>
          </div>

          <div className="text-2xs text-[#33B1C8] font-semibold font-mono mt-3 uppercase border-t pt-2">
            Summer bounds: {bounds.start} &ndash; {bounds.end}
          </div>
        </div>
      </div>

      {/* CUSTOM OOO SUBTRACTION BLOCKS */}
      <div className="bg-white border border-[#E0DCD8] p-6 shadow-2xs flex flex-col gap-4">
        <div>
          <h3 className="text-sm uppercase tracking-wider font-semibold text-slate-700 border-b border-slate-100 pb-2">
  Out-of-Office Date Planning
</h3>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Add vacation, conference, holiday, or other out-of-office dates that should be excluded from workload planning calculations.
          </p>
        </div>

        <form onSubmit={handleAddBlocked} className="flex items-center gap-2 max-w-sm print:hidden">
          <input
            type="date"
            value={newBlockedDate}
            onChange={(e) => setNewBlockedDate(e.target.value)}
            required
            className="text-xs px-3 py-1.5 border border-slate-350 bg-white font-mono h-9"
          />

          <button
            type="submit"
            className="bg-[#006282] hover:bg-[#076092] text-white px-4 h-9 text-2xs uppercase tracking-wider font-semibold flex items-center gap-1 cursor-pointer select-none"
          >
            <Plus className="w-4 h-4" /> Add Date
          </button>
        </form>

        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
          <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">
            Custom Blocked Dates
          </span>

          {settings.customBlocked.length === 0 ? (
            <p className="text-xs text-slate-400">
              No custom excluded dates created.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {settings.customBlocked.map((dateStr, bIdx) => (
                <div
                  key={dateStr}
                  className="flex justify-between items-center bg-[#F4F1ED]/40 border p-2 text-xs font-mono"
                >
                  <span>{formatShortDate(dateStr)}: Custom Blocked Date</span>

                  <button
                    type="button"
                    onClick={() => handleDeleteBlocked(bIdx)}
                    className="text-rose-700 font-bold text-2xs uppercase hover:underline cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FSCJ FIXED ANNUAL CLOSURES */}
      <div className="bg-white border border-[#E0DCD8] p-6 shadow-2xs flex flex-col gap-4">
        <div>
          <h3 className="text-sm uppercase tracking-wider font-semibold text-slate-700 border-b border-slate-100 pb-2">
            Standard Collegiate Holiday Exclusions
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Annual college closure dates used in workload and timeline calculations.
          </p>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto text-sm">
          {FSCJ_HOLIDAYS.map((holiday) => (
            <div
              key={holiday}
              className="border-b border-slate-100 pb-2 text-slate-700"
            >
              <span className="font-semibold">{formatShortDate(holiday)}</span>
              {": "}
              <span>{getHolidayLabel(holiday)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
