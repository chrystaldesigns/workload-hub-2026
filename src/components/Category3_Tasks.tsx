import React, { useState } from 'react';
import { StandaloneTask } from '../types';
import { 
  CheckSquare, Plus, Clock, AlertCircle, Trash2, 
  CheckCircle2, PlayCircle, ToggleRight, Sparkles
} from 'lucide-react';
import { formatDate, parseDate } from '../utils/calendarEngine';

interface Category3Props {
  standaloneTasks: StandaloneTask[];
  onAddTask: (task: StandaloneTask) => Promise<void>;
  onUpdateTask: (task: StandaloneTask) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

export function Category3Tasks({
  standaloneTasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask
}: Category3Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    startDate: formatDate(new Date()),
    dueDate: formatDate(new Date(Date.now() + 7 * 86400000)),
    notes: '',
    status: 'Not Started' as const,
    priority: 'Moderate' as const,
    progress: 0
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: StandaloneTask = {
      title: formData.title,
      startDate: formData.startDate,
      dueDate: formData.dueDate,
      notes: formData.notes,
      status: formData.status,
      priority: formData.priority,
      progress: Number(formData.progress)
    };

    await onAddTask(newTask);
    setShowAddModal(false);
    setFormData({
      title: '',
      startDate: formatDate(new Date()),
      dueDate: formatDate(new Date(Date.now() + 7 * 86400000)),
      notes: '',
      status: 'Not Started',
      priority: 'Moderate',
      progress: 0
    });
  };

  const handleUpdateStatusAndProgress = async (id: string, status: 'Not Started' | 'In Progress' | 'Complete' | 'On Hold', progress: number) => {
    const obj = standaloneTasks.find(t => t.id === id);
    if (!obj) return;

    const updatedTask = {
      ...obj,
      status,
      progress
    };
    await onUpdateTask(updatedTask);
  };

  // Overdue calculation rules
  const getOverdueMetrics = (dueDateStr: string, status: string) => {
    if (status === 'Complete') return { isOver: false, isUrgent: false, days: 0 };
    
    const today = parseDate(formatDate(new Date()));
    const due = parseDate(dueDateStr);
    
    if (due < today) {
      const diffMs = today.getTime() - due.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return {
        isOver: true,
        isUrgent: diffDays >= 5,
        days: diffDays
      };
    }
    return { isOver: false, isUrgent: false, days: 0 };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* HEADER CONTROLS */}
      <div className="flex justify-between items-center bg-white border border-[#E0DCD8] p-4 shadow-2xs">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 uppercase tracking-wide">
            Category 3: Standalone Task Queue
          </h2>
          <p className="text-xs text-slate-500">
            Ad-hoc action items with due-date alerts and progression counters
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#006282] hover:bg-[#076092] text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Standalone Task
        </button>
      </div>

      {/* OVERDUE ALERTS SHELF */}
      {standaloneTasks.some(t => getOverdueMetrics(t.dueDate, t.status).isOver) && (
        <div className="flex flex-col gap-2 border border-rose-250 bg-rose-50/50 p-4">
          <span className="text-[10px] font-mono font-bold text-rose-800 uppercase tracking-widest flex items-center gap-1">
            <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" /> Urgent Outstanding task violations
          </span>
          <div className="flex flex-col gap-1 text-[11px] text-rose-950 font-medium">
            {standaloneTasks.map(t => {
              const metr = getOverdueMetrics(t.dueDate, t.status);
              if (!metr.isOver) return null;
              return (
                <div key={t.id} className="flex justify-between items-center bg-white border border-rose-200/60 p-2 text-xs">
                  <span className="font-semibold text-slate-900">{t.title}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-rose-700 font-bold uppercase">
                      {metr.isUrgent ? `Critical: Lapsed ${metr.days} Days` : `Lapsed ${metr.days} Days`}
                    </span>
                    <span className="text-slate-400">Due: {t.dueDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TASKS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {standaloneTasks.length === 0 ? (
          <div className="md:col-span-3 bg-white border border-[#E0DCD8] p-12 text-center text-slate-400">
            No standalone system tasks defined. Click "Add Standalone Task" to initialize.
          </div>
        ) : (
          standaloneTasks.map(t => {
            const metr = getOverdueMetrics(t.dueDate, t.status);
            const isComp = t.status === 'Complete';
            return (
              <div 
                key={t.id} 
                className={`bg-white border p-5 flex flex-col gap-4 relative justify-between transition-all ${
                  isComp ? 'border-slate-200 opacity-80' : 'border-slate-300 hover:border-slate-350 shadow-2xs'
                }`}
              >
                {/* Due alert flag */}
                {metr.isOver && (
                  <div className={`absolute top-0 left-0 w-full h-1 ${metr.isUrgent ? 'bg-rose-600' : 'bg-amber-500'}`}></div>
                )}

                {/* Card Head */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-start text-3xs font-mono select-none">
                    <span className="uppercase text-[#006282] font-semibold">Priority: {t.priority}</span>
                    <span className="text-slate-400">Started: {t.startDate}</span>
                  </div>

                  <h3 className={`text-md font-semibold ${isComp ? 'line-through text-slate-400 font-normal' : 'text-slate-900'}`}>
                    {t.title}
                  </h3>

                  {t.notes && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[2.5rem]">
                      {t.notes}
                    </p>
                  )}
                </div>

                {/* Progress selectors */}
                <div className="border-t border-slate-100 pt-3 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-2xs font-mono">
                    <span className="text-slate-400 uppercase">Target Deadline:</span>
                    <span className={`font-semibold ${metr.isUrgent ? 'text-rose-700 font-bold' : metr.isOver ? 'text-amber-700' : 'text-slate-600'}`}>
                      {t.dueDate}
                    </span>
                  </div>

                  {/* Status buttons */}
                  <div className="flex justify-between items-center gap-1 bg-[#F4F1ED]/40 border p-1 text-2xs font-mono">
                    <span className="text-slate-400 uppercase font-semibold text-[9px] pl-1">Status:</span>
                    <div className="flex items-center gap-1 text-[9px]">
                      <button
                        onClick={() => handleUpdateStatusAndProgress(t.id || '', 'Not Started', 0)}
                        className={`px-1.5 py-0.5 rounded ${t.status === 'Not Started' ? 'bg-slate-800 text-white font-bold' : 'text-slate-500 hover:bg-slate-100 cursor-pointer'}`}
                      >
                        Start
                      </button>
                      <button
                        onClick={() => handleUpdateStatusAndProgress(t.id || '', 'In Progress', 50)}
                        className={`px-1.5 py-0.5 rounded ${t.status === 'In Progress' ? 'bg-amber-600 text-white font-bold' : 'text-slate-500 hover:bg-slate-100 cursor-pointer'}`}
                      >
                        In-Prog
                      </button>
                      <button
                        onClick={() => handleUpdateStatusAndProgress(t.id || '', 'Complete', 100)}
                        className={`px-1.5 py-0.5 rounded ${t.status === 'Complete' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-500 hover:bg-slate-100 cursor-pointer'}`}
                      >
                        Done
                      </button>
                    </div>
                  </div>

                  {/* Meter graph bar */}
                  <div className="flex justify-between items-center mt-1">
                    <div className="w-3/4 bg-slate-100 h-1.5">
                      <div className={`h-1.5 transition-all duration-300 bg-[#006282]`} style={{ width: `${t.progress}%` }}></div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#006282]">{t.progress}% Completed</span>
                  </div>
                </div>

                {/* Footer items */}
                <div className="flex justify-end pt-2 border-t border-slate-50">
                  <button
                    onClick={() => {
                      if (confirm(`Remove task "${t.title}" inside Firestore permanently?`)) {
                        onDeleteTask(t.id || '');
                      }
                    }}
                    className="text-slate-400 hover:text-rose-600 text-xs flex items-center gap-1.5 font-mono text-[10px] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> DELETE RECORD
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DIALOG MODAL: ADD STANDALONE TASK */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-[#F4F1ED] border-2 border-slate-900 p-6 max-w-sm w-full flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <h3 className="text-md font-semibold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#33B1C8]" /> Create Standalone Task
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-3.5 font-bold text-xs text-slate-800">
              
              <div>
                <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Task Title Column:</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Schedule Spring Sync Session"
                  required
                  className="w-full px-3 py-1.5 border border-slate-350 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Start Date:</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Due Date Target:</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Task Priority:</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Moderate">Moderate Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Critical">Critical Priority Status</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Initial Completion %:</label>
                  <select
                    name="progress"
                    value={formData.progress}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white font-mono"
                  >
                    <option value="0">0% (Not Started)</option>
                    <option value="50">50% (In Progress)</option>
                    <option value="100">100% (Complete)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Task notes / contextual references:</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Task scope logs details..."
                  rows={2}
                  className="w-full px-3 py-1.5 border border-slate-350 bg-white font-normal"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#E0DCD8] bg-white text-slate-700 font-semibold uppercase text-2xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#006282] hover:bg-[#076092] text-white px-5 py-2 uppercase text-2xs cursor-pointer transition-colors"
                >
                  Initialize Task
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
