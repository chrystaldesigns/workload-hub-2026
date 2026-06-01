import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  FolderGit,
  CheckSquare,
  Calendar,
} from "lucide-react";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  alertCount: number;
}

export function Navigation({ activeTab, setActiveTab, alertCount }: NavigationProps) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
    { id: "category1", label: "Course Developments", icon: BookOpen, badge: null },
    { id: "category2", label: "Projects", icon: FolderGit, badge: null },
    { id: "category3", label: "Tasks", icon: CheckSquare, badge: alertCount > 0 ? alertCount : null },
    { id: "calendar", label: "Calendar", icon: Calendar, badge: null },
  ];

  return (
    <nav className="sticky top-0 z-10 border-b border-[#E0DCD8] bg-white shadow-xs">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-0 overflow-x-auto sm:flex-row sm:gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex cursor-pointer select-none items-center gap-2.5 whitespace-nowrap border-b-2 px-3 py-4 text-xs font-semibold uppercase tracking-wider outline-none transition-all duration-200 ${
                  isActive
                    ? "border-[#006282] bg-slate-50/50 text-[#006282]"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-[#006282]" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span className="ml-1 rounded-full bg-rose-600 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
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
