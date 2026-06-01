import React from 'react';
import { BookOpen, FolderGit, CheckSquare, Calendar, ShieldCheck } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  alertCount: number;
}

export function Navigation({ activeTab, setActiveTab, alertCount }: NavigationProps) {
  const tabs = [
    { id: 'category1', label: 'Course Developments', icon: BookOpen, badge: null },
    { id: 'category2', label: 'Projects', icon: FolderGit, badge: null },
    { id: 'category3', label: 'Tasks', icon: CheckSquare, badge: alertCount > 0 ? alertCount : null },
    { id: 'calendar', label: 'Calendar Settings & Sync', icon: Calendar, badge: null },
  ];

  return (
    <nav className="border-b border-[#E0DCD8] bg-white sticky top-0 z-10 shadow-xs">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row gap-0 sm:gap-4 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 py-4 px-3 border-b-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 outline-none select-none cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#006282] text-[#006282] bg-slate-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-350'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#006282]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold font-mono bg-rose-600 text-white rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
