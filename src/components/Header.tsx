import React, { useEffect, useState } from "react";
import { CalendarRange } from "lucide-react";

interface HeaderProps {
  outlookConnected: boolean;
  alertCount: number;
  nextHoliday?: string;
  nextMilestone?: string;
}

export function Header({
  outlookConnected,
  nextHoliday,
  nextMilestone,
}: HeaderProps) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
        timeZoneName: "short",
      });

      setTime(formatter.format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });

  return (
    <header className="bg-[#006282] text-white border-b border-[#076092] px-6 py-5">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Workload Hub Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="bg-[#076092]/40 border border-[#33B1C8]/20 px-3 py-1.5 text-[#33B1C8]">
            <span className="text-[9px] uppercase block opacity-60">
              System Clock (Eastern)
            </span>

            <span className="font-semibold text-white tracking-wide">
              {today} • {time || "Loading Clock..."}
            </span>
          </div>

          {nextHoliday && (
            <div className="bg-[#076092]/40 border border-[#33B1C8]/20 px-3 py-1.5 text-[#33B1C8]">
              <span className="text-[9px] uppercase block opacity-60">
                Next Holiday / Event
              </span>

              <span className="font-semibold text-white tracking-wide">
                {nextHoliday}
              </span>
            </div>
          )}

          {nextMilestone && (
            <div className="bg-[#076092]/40 border border-[#33B1C8]/20 px-3 py-1.5 text-[#33B1C8]">
              <span className="text-[9px] uppercase block opacity-60">
                Next Milestone
              </span>

              <span className="font-semibold text-white tracking-wide">
                {nextMilestone}
              </span>
            </div>
          )}

          {outlookConnected && (
            <div className="px-2.5 py-1.5 flex items-center gap-1.5 border bg-emerald-950/40 border-emerald-500/30 text-emerald-300">
              <CalendarRange className="w-3.5 h-3.5" />
              <span className="uppercase text-[10px] tracking-wider">
                Outlook Synced
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
