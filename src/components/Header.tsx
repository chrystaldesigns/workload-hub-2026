import React, { useState, useEffect } from 'react';
import { ShieldCheck, CalendarRange, BellRing } from 'lucide-react';

interface HeaderProps {
  outlookConnected: boolean;
  alertCount: number;
}

export function Header({ outlookConnected, alertCount }: HeaderProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format to Jacksonville FL US Eastern Time
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
        timeZoneName: 'short'
      });
      setTime(formatter.format(now));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-[#006282] text-white border-b border-[#076092] px-6 py-5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
  Workload Hub Dashboard
</h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
          {/* Real-time Eastern Time Clock */}
          <div className="bg-[#076092]/40 border border-[#33B1C8]/20 px-3 py-1.5 text-[#33B1C8]">
  <span className="text-[9px] uppercase block opacity-60">
    System Clock (Eastern)
  </span>

  <span className="font-semibold text-white tracking-wide">
    {new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/New_York'
    })}
    {" • "}
    {time || 'Loading Clock...'}
  </span>
</div>
            <span className="text-[9px] uppercase block opacity-60">System Clock (Eastern):</span>
            <span className="font-semibold text-white tracking-wide">{time || 'Loading Clock...'}</span>
          </div>

          {/* Sync status */}
          <div className="flex gap-2">
            <div className={`px-2.5 py-1.5 flex items-center gap-1.5 border ${
              outlookConnected 
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                : 'bg-amber-950/30 border-amber-500/20 text-amber-300'
            }`}>
              <CalendarRange className="w-3.5 h-3.5" />
              <span className="uppercase text-[10px] tracking-wider">
                {outlookConnected ? 'Outlook Synced' : 'Demo Mode'}
              </span>
            </div>

            {alertCount > 0 && (
              <div className="bg-rose-950/40 border border-rose-500/30 px-2.5 py-1.5 flex items-center gap-1.5 text-rose-300 animate-pulse">
                <BellRing className="w-3.5 h-3.5 text-rose-400" />
                <span className="uppercase text-[10px] tracking-wider font-semibold">
                  {alertCount} Active Alerts
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
