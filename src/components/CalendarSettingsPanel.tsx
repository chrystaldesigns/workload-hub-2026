import React, { useState } from 'react';
import { CalendarSettings, OutlookEvent } from '../types';
import { 
  Calendar, Clock, ShieldAlert, CheckCircle, Info, Plus, 
  Trash2, RefreshCw, KeyRound, ExternalLink, HelpCircle
} from 'lucide-react';
import { 
  FSCJ_HOLIDAYS, 
  getSummerBounds, 
  isSummerDate, 
  countWorkingHoursInDay 
} from '../utils/calendarEngine';

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
  outlookEvents,
  onUpdateBlockedDates,
  onConnectOutlook,
  onDisconnectOutlook,
  onTriggerSync
}: CalendarPanelProps) {
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [clientId, setClientId] = useState('');
  const [tenantId, setTenantId] = useState('common');
  const [showGuide, setShowGuide] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Summer schedule calculated dynamically for FSCJ
  const bounds = getSummerBounds(2026);

  const handleAddBlocked = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockedDate) return;
    if (settings.customBlocked.includes(newBlockedDate)) {
      alert("This exclusion date is already blocked in our records.");
      return;
    }
    const updated = [...settings.customBlocked, newBlockedDate].sort();
    await onUpdateBlockedDates(updated);
    setNewBlockedDate('');
  };

  const handleDeleteBlocked = async (idx: number) => {
    const updated = settings.customBlocked.filter((_, i) => i !== idx);
    await onUpdateBlockedDates(updated);
  };

  const handleOutlookAuth = (e: React.FormEvent) => {
    e.preventDefault();
    onConnectOutlook(clientId || 'mock-client-id', tenantId || 'common');
  };

  const handleSyncClick = async () => {
    setSyncing(true);
    await onTriggerSync();
    setTimeout(() => setSyncing(false), 800);
  };

  // Capacity calculations for the planning period
  const calculateCapacityMeters = () => {
    // Total working days in a normal work month
    const totalPossibleHoursStd = 4 * 40; // 4 weeks of standard 40H weeks = 160H
    // Deduct holidays & custom exclusions
    const customBlockedCount = settings.customBlocked.length;
    const countHoursExcluded = settings.customBlocked.reduce((acc, date) => {
      return acc + countWorkingHoursInDay(date);
    }, 0);

    const activeOutlookBusyHours = outlookEvents.length * 2.5; // assume average 2.5 hrs per meeting
    const finalAvailableStd = Math.max(0, totalPossibleHoursStd - countHoursExcluded - activeOutlookBusyHours);
    const usedPercentage = Math.round(((totalPossibleHoursStd - finalAvailableStd) / totalPossibleHoursStd) * 100);

    return {
      totalPossibleHoursStd,
      countHoursExcluded,
      activeOutlookBusyHours,
      finalAvailableStd,
      usedPercentage
    };
  };

  const cap = calculateCapacityMeters();

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8">
      
      {/* CAPABILITIES PANEL RAIL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-[#E0DCD8] p-6 shadow-2xs">
        
        {/* STAT 1: HOURS CAPACITY SUMMARY */}
        <div className="border-r border-slate-100 pr-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold">Institutional Capacity Standard</span>
            <h3 className="text-2xl font-semibold text-[#006282] mt-1">40 Working Hours</h3>
            <p className="text-xs text-slate-500 mt-1">
              Monday &ndash; Thursday (7:30 AM &ndash; 5:30 PM: 10H/day)<br />
              Friday (7:30 AM &ndash; 11:30 AM: 4H/day)
            </p>
          </div>
          <div className="text-2xs text-[#087834] font-semibold font-mono mt-3 uppercase border-t pt-2">
            Standard Schedule Active September - April
          </div>
        </div>

        {/* STAT 2: SUMMER CAPACITY SUMMARY */}
        <div className="border-r border-slate-100 pr-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold">Collegiate Summer Rules</span>
            <h3 className="text-2xl font-semibold text-[#33B1C8] mt-1">36 Working Hours</h3>
            <p className="text-xs text-slate-500 mt-1">
              Monday &ndash; Thursday (7:30 AM &ndash; 5:30 PM: 10H/day)<br />
              Fridays closed (Non-working day capacity)
            </p>
          </div>
          <div className="text-2xs text-[#33B1C8] font-semibold font-mono mt-3 uppercase border-t pt-2">
            Summer bounds: {bounds.start} &ndash; {bounds.end}
          </div>
        </div>

              className="grid grid-cols-1 md:grid-cols-2 gap-6"
          
          {/* CUSTOM OOO SUBTRACTION BLOCKS */}
          <div className="bg-white border border-[#E0DCD8] p-6 shadow-2xs flex flex-col gap-4">
            <div>
              <h3 className="text-sm uppercase tracking-wider font-semibold text-slate-700 border-b border-slate-100 pb-2">
                Subtract custom planning Out-of-Office Dates (OOO)
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                Manually subtract available capacity from your workflow calculations (holidays or personal leave blocks).
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
                <Plus className="w-4 h-4" /> Subtract Capacity
              </button>
            </form>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">Custom Blocked Capacity Calendars</span>
              
              {settings.customBlocked.length === 0 ? (
                <p className="text-xs text-slate-400">No custom excluded dates created. Type in days above to omit.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {settings.customBlocked.map((dateStr, bIdx) => (
                    <div key={dateStr} className="flex justify-between items-center bg-[#F4F1ED]/40 border p-2 text-xs font-mono">
                      <span>{dateStr} &ndash; Custom Blocked Sync</span>
                      <button
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
      Annual closures mapped strictly to institutional criteria.
    </p>
  </div>

  <div className="space-y-2 max-h-72 overflow-y-auto text-sm">
    {FSCJ_HOLIDAYS.map((holiday) => (
      <div
        key={holiday}
        className="border-b border-slate-100 pb-2 text-slate-700"
      >
        <span className="font-semibold">
          {new Date(`${holiday}T12:00:00`).toLocaleDateString('en-US')}
        </span>
        {' : '}
        <span>
          College Closed
          {isSummerDate(holiday) ? ' (Summer Block)' : ''}
        </span>
      </div>
    ))}
  </div>
</div>

        </div>

      </div>

    </div>
  );
}
