import React, { useState, useEffect } from 'react';
import { 
  CourseDevelopment, 
  LssProject, 
  StandaloneTask, 
  CalendarSettings, 
  OutlookEvent 
} from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Category1CourseDev } from './components/Category1_CourseDev';
import { Category2LssProjects } from './components/Category2_LssProjects';
import { Category3Tasks } from './components/Category3_Tasks';
import { CalendarSettingsPanel } from './components/CalendarSettingsPanel';
import { BookOpen, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('category1');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Structured Core State Engines
  const [courseDevelopments, setCourseDevelopments] = useState<CourseDevelopment[]>([]);
  const [lssProjects, setLssProjects] = useState<LssProject[]>([]);
  const [standaloneTasks, setStandaloneTasks] = useState<StandaloneTask[]>([]);
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>({ customBlocked: [] });
  const [outlookEvents, setOutlookEvents] = useState<OutlookEvent[]>([]);

  // Calculate overall alerts count in system (Overdue Standalone tasks or Non-compliance courses)
  const [alertCount, setAlertCount] = useState<number>(0);

  // Load everything from full-stack service endpoints on bootstrap
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // Fetch all assets in parallel to maintain responsive loading performance
      const [cdRes, lssRes, taskRes, calRes, outRes] = await Promise.all([
        fetch('/api/course-developments'),
        fetch('/api/lss-projects'),
        fetch('/api/standalone-tasks'),
        fetch('/api/calendar-settings'),
        fetch('/api/outlook/sync')
      ]);

      if (!cdRes.ok || !lssRes.ok || !taskRes.ok || !calRes.ok || !outRes.ok) {
        throw new Error("Failure communicating with core full-stack API services.");
      }

      const cdData = await cdRes.json();
      const lssData = await lssRes.json();
      const taskData = await taskRes.json();
      const calData = await calRes.json();
      const outData = await outRes.json();

      setCourseDevelopments(cdData);
      setLssProjects(lssData);
      setStandaloneTasks(taskData);
      setCalendarSettings(calData);
      setOutlookEvents(outData);

      // Evaluate system alerts count
      const todayStr = new Date().toISOString().split('T')[0];
      const overdueTasks = taskData.filter((t: any) => t.status !== 'Complete' && t.dueDate < todayStr).length;
      
      // Calculate non-compliance warning counts from courses
      let nonComplianceCount = 0;
      cdData.forEach((course: CourseDevelopment) => {
        const task26 = course.tasks.find(t => t.id === 26 || t.id === 62 || t.name.toLowerCase().includes("code check and archive"));
        if (task26 && task26.dueDate) {
          // Check working days count
          const blocked = calData.customBlocked || [];
          const daysAndGaps = countWorkingDaysBetweenDates(task26.dueDate, course.termDeadline, blocked);
          if (daysAndGaps < 30) {
            nonComplianceCount++;
          }
        }
      });

      setAlertCount(overdueTasks + nonComplianceCount);
    } catch (err: any) {
      setErrorMsg(err.message || 'System failed loading academic records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Sibling layout helper for working days (avoid dependency errors)
  const countWorkingDaysBetweenDates = (startStr: string, endStr: string, blocked: string[]) => {
    if (startStr > endStr) return 0;
    let current = new Date(startStr + 'T12:00:00');
    const end = new Date(endStr + 'T12:00:00');
    let count = 0;

    while (current <= end) {
      const day = current.getDay();
      const dateStr = current.toISOString().split('T')[0];
      const isWeekend = day === 0 || day === 6;
      let isSummerFriday = false;
      
      // Calculate simplified summer schedule friday закрыт bounds
      if (day === 5) {
        const mo = current.getMonth();
        if (mo >= 4 && mo <= 7) { // May, June, July, August is closed
          isSummerFriday = true;
        }
      }

      if (!isWeekend && !isSummerFriday && !blocked.includes(dateStr)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };


  // -----------------------------------------------------------------
  // HANDLERS FOR CATEGORY 1: COURSE DEVELOPMENTS
  // -----------------------------------------------------------------
  const handleAddCourse = async (newCourse: CourseDevelopment) => {
    try {
      const res = await fetch('/api/course-developments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse)
      });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCourse = async (updatedCourse: CourseDevelopment) => {
    try {
      const res = await fetch(`/api/course-developments/${updatedCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCourse)
      });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      const res = await fetch(`/api/course-developments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // -----------------------------------------------------------------
  // HANDLERS FOR CATEGORY 2: LSS PROJECTS
  // -----------------------------------------------------------------
  const handleAddProject = async (newProj: LssProject) => {
    try {
      const res = await fetch('/api/lss-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProj)
      });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProject = async (updatedProj: LssProject) => {
    try {
      const res = await fetch(`/api/lss-projects/${updatedProj.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProj)
      });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/lss-projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // -----------------------------------------------------------------
  // HANDLERS FOR CATEGORY 3: STANDALONE TASKS
  // -----------------------------------------------------------------
  const handleAddTask = async (newTask: StandaloneTask) => {
    try {
      const res = await fetch('/api/standalone-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTask = async (updatedTask: StandaloneTask) => {
    try {
      const res = await fetch(`/api/standalone-tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask)
      });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/standalone-tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // -----------------------------------------------------------------
  // HANDLERS FOR CALENDAR CONFIGS
  // -----------------------------------------------------------------
  const handleUpdateBlockedDates = async (dates: string[]) => {
    try {
      const updatedConfig = {
        ...calendarSettings,
        customBlocked: dates
      };
      const res = await fetch('/api/calendar-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnectOutlook = (clientId: string, tenantId: string) => {
    // Initiate secure browser OAuth popup redirect flow
    const popupWidth = 600;
    const popupHeight = 650;
    const left = window.screen.width / 2 - popupWidth / 2;
    const top = window.screen.height / 2 - popupHeight / 2;

    const popupUrl = `/api/outlook/auth-url?clientId=${clientId}&tenantId=${tenantId}`;
    window.open(popupUrl, 'Authorize Outlook Calendar', `width=${popupWidth},height=${popupHeight},top=${top},left=${left}`);
  };

  const handleDisconnectOutlook = async () => {
    try {
      const res = await fetch('/api/outlook/disconnect', { method: 'POST' });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render selection helpers
  const renderTabContent = () => {
    switch (activeTab) {
      case 'category1':
        return (
          <Category1CourseDev
            courseDevelopments={courseDevelopments}
            customBlocked={calendarSettings.customBlocked}
            onAddCourse={handleAddCourse}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
          />
        );
      case 'category2':
        return (
          <Category2LssProjects
            lssProjects={lssProjects}
            customBlocked={calendarSettings.customBlocked}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
          />
        );
      case 'category3':
        return (
          <Category3Tasks
            standaloneTasks={standaloneTasks}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        );
      case 'calendar':
        return (
          <CalendarSettingsPanel
            settings={calendarSettings}
            outlookEvents={outlookEvents}
            onUpdateBlockedDates={handleUpdateBlockedDates}
            onConnectOutlook={handleConnectOutlook}
            onDisconnectOutlook={handleDisconnectOutlook}
            onTriggerSync={loadDashboardData}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F4F1ED]">
        <div className="flex flex-col items-center gap-4 text-slate-800">
          <RefreshCw className="w-10 h-10 animate-spin text-[#006282]" />
          <h2 className="text-sm font-bold uppercase tracking-widest font-mono">
            Synchronizing with live GCP Cloud Run...
          </h2>
          <p className="text-xs text-slate-400">Loading your academic planning registries</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F4F1ED] p-6 text-center">
        <div className="max-w-md bg-white border border-rose-300 shadow-md p-8 flex flex-col items-center gap-4">
          <AlertCircle className="w-16 h-16 text-rose-600 shrink-0" />
          <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900 border-b pb-2">
            System Communication Exception
          </h2>
          <p className="text-xs text-rose-800">{errorMsg}</p>
          <button 
            onClick={loadDashboardData}
            className="mt-4 bg-[#006282] text-white px-5 py-2 hover:bg-[#076092] font-semibold text-2xs uppercase tracking-wide"
          >
            Retry Connection Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F1ED]">
      
      {/* FSCJ EMBELLISHED TOP WRAPPER */}
      <Header 
        outlookConnected={!!calendarSettings.outlookConnected} 
        alertCount={alertCount}
      />

      {/* NAV MATRIX TAB BAR */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        alertCount={alertCount}
      />

      {/* VIEWPORT CONTROLLER CARD */}
      <main className="flex-1 pb-16 animate-fade-in print:pb-0">
        {renderTabContent()}
      </main>

      {/* FOOTER RAILS */}
      <footer className="bg-[#1A1A1A] text-stone-400 text-[10px] py-10 px-6 text-center border-t border-black print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          <p className="text-stone-300 font-semibold tracking-wider uppercase text-xs">
            Florida State College at Jacksonville &bull; Workload Hub
          </p>
          <p>
            Developed strictly with academic timeline algorithms under federal and institutional criteria. All rights reserved.
          </p>
          <p className="text-slate-500 font-mono text-[9px] uppercase tracking-widest mt-1">
            SECURE CLOUD ENGINE // COMPLIANT WITH WCAG 2.1 AA SECTION 508 REGULATORY GUIDELINES
          </p>
        </div>
      </footer>

    </div>
  );
}
