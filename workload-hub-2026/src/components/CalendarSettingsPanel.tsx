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

        {/* GRAPHICAL METER ACCRETION */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1">
              <span className="text-slate-600 uppercase">Allocated Workload Load (FSCJ Operations)</span>
              <span className="font-mono text-[#006282]">{cap.usedPercentage}% busy</span>
            </div>
            <div className="w-full bg-slate-100 h-2">
              <div 
                className={`h-2 transition-all duration-300 ${cap.usedPercentage > 45 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                style={{ width: `${Math.min(100, cap.usedPercentage)}%` }}
              ></div>
            </div>
          </div>
          <p className="text-2xs text-slate-400 font-mono mt-3 uppercase">
            Available Available Capacity: <strong>{cap.finalAvailableStd} Hours</strong> / Month bounds
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* OUTLOOK GRAPH CONNECTOR SETTINGS */}
        <div className="lg:col-span-1 flex flex-col gap-6 bg-white border border-[#E0DCD8] p-6 shadow-2xs">
          <div>
            <h3 className="text-sm uppercase tracking-wider font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-1">
              <KeyRound className="w-4 h-4 text-[#006282]" /> Microsoft Graph OAuth
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Connect <strong>wickline@fscj.edu</strong> to sync meetings with available capacity metrics.
            </p>
          </div>

          {settings.outlookConnected ? (
            <div className="border border-emerald-300 bg-emerald-50/50 p-4 flex flex-col gap-3 font-mono text-2xs">
              <div className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="uppercase font-bold tracking-wider">Connection Active</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Linked Azure Delegate:</span>
                <strong className="text-slate-700">{settings.outlookEmail}</strong>
              </div>
              
              <div className="flex gap-2 border-t pt-2">
                <button
                  onClick={handleSyncClick}
                  disabled={syncing}
                  className="bg-[#006282] text-white px-2 py-1.5 uppercase font-semibold hover:bg-[#076092] flex items-center gap-1 cursor-pointer select-none"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} /> Sync Calendar
                </button>
                <button
                  onClick={onDisconnectOutlook}
                  className="bg-rose-50 text-rose-700 border border-rose-300 px-2 py-1.5 uppercase font-semibold hover:bg-rose-100 cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleOutlookAuth} className="flex flex-col gap-3 font-semibold text-xs text-slate-800 font-mono text-2xs">
              <div>
                <label className="block text-[9px] uppercase text-slate-400 mb-1">Microsoft App ID (Client ID):</label>
                <input
                  type="text"
                  placeholder="e.g. 1f94d930-xxxxx..."
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 border text-xs"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase text-slate-400 mb-1">Directory ID (Tenant ID):</label>
                <input
                  type="text"
                  placeholder="common or fscj.edu"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full px-3 py-2 border text-xs"
                />
              </div>

              <button
                type="submit"
                className="bg-[#006282] hover:bg-[#076092] text-white py-2 text-xs font-bold uppercase tracking-wider text-center cursor-pointer select-none"
              >
                Connect Microsoft Outlook
              </button>

              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-slate-500 font-semibold uppercase hover:underline text-center text-[10px] mt-1 cursor-pointer flex items-center justify-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Guided Azure Registration Manual
              </button>
            </form>
          )}

          {showGuide && (
            <div className="bg-slate-50 border border-slate-200 p-4 text-[10px] text-slate-600 leading-relaxed font-sans">
              <h4 className="font-bold text-slate-800 uppercase mb-1">Azure Portal Guide:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to the <span className="font-semibold text-[#006282]">Azure Portal App registrations</span>.</li>
                <li>Create a "New Registration", configure Redirect Name: <code>workloadhub.chrystaldesigns.com</code>.</li>
                <li>Add API Permissions: <code>Calendars.Read</code> and <code>offline_access</code>.</li>
                <li>Copy details here to replace simulation with live Microsoft Calendars sync seamlessly.</li>
              </ol>
            </div>
          )}

        </div>

        {/* ACTIVE OOO OUTLOOK DATES & MANUAL BLOCK LIST */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
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
                Annual closures mapped strictly to institutional criteria (excluding weekends).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-2xs font-mono max-h-72 overflow-y-auto">
              {FSCJ_HOLIDAYS.map(holiday => {
                const isSummer = isSummerDate(holiday);
                return (
                  <div key={holiday} className="p-2 border bg-slate-50 border-slate-150 rounded-xs flex flex-col justify-between">
                    <span className="font-semibold text-slate-700">{holiday}</span>
                    <span className="text-[9px] text-[#006282] font-mono mt-1 uppercase font-semibold">
                      College Closed {isSummer ? '(Summer Block)' : '(Standard)'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTIVE SYNCHRONIZED OUTLOOK MEETINGS DETAIL LIST */}
          <div className="bg-white border border-[#E0DCD8] p-6 shadow-2xs flex flex-col gap-4">
            <div>
              <h3 className="text-sm uppercase tracking-wider font-semibold text-slate-700 border-b border-slate-100 pb-2">
                Active Azure Microsoft Graph Sync status Log
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                Busy events extracted within planning period limits. Blocks marked 'Free' are automatically safely omitted.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto">
              {outlookEvents.map(evt => (
                <div key={evt.id} className="border border-[#E0DCD8] p-3 text-xs bg-[#F4F1ED]/10 flex flex-col sm:flex-row justify-between sm:items-center gap-2 font-mono">
                  <div>
                    <strong className="text-slate-800 font-semibold">{evt.subject}</strong>
                    <div className="text-2xs text-slate-400 mt-0.5 uppercase">
                      Start: {evt.start.dateTime.replace('T', ' ')} &ndash; End: {evt.end.dateTime.replace('T', ' ')}
                    </div>
                  </div>
                  <span className="text-rose-700 font-bold uppercase text-[10px] shrink-0 border border-rose-300 bg-rose-50 px-2 py-0.5 self-start sm:self-center">
                    Busy {evt.showAs} Slot
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
