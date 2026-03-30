import React, { useState } from "react";
import { startOfWeek, addDays, format } from "date-fns";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Clock, CheckCircle2, AlertCircle, PlayCircle, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { useSchedule, Category, Status } from "../context/ScheduleContext";

export function DailyLogPage() {
  const { getTasksForDate, getLogsForDate, updateTaskLog, isLoading } = useSchedule();
  
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday start

  const weekDays = Array.from({ length: 5 }).map((_, i) => {
    const date = addDays(start, i);
    return {
      id: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEEE'), // e.g., Monday
      shortLabel: format(date, 'EEE'), // e.g., Mon
      dateStr: format(date, 'MMM d'), // e.g., Jan 6
    };
  });

  const [selectedDay, setSelectedDay] = useState(format(today, 'yyyy-MM-dd'));

  const tasks = getTasksForDate(selectedDay);
  const logs = getLogsForDate(selectedDay);

  const handleLogChange = (taskId: string, field: "actual" | "status", value: string) => {
    const currentLog = logs[taskId] || { actual: "", status: "Pending" };
    updateTaskLog(selectedDay, taskId, {
      ...currentLog,
      [field]: value,
    });
  };

  const getDiff = (taskId: string, targetStr: string) => {
    const actualStr = logs[taskId]?.actual;
    if (!actualStr) return null;
    
    // Simple parsing assuming format like "30m" or "2h"
    const parseTime = (timeStr: string) => {
      if (!timeStr) return 0;
      const val = parseInt(timeStr);
      if (isNaN(val)) return 0;
      if (timeStr.includes('h')) return val * 60;
      return val;
    };

    const actual = parseTime(actualStr);
    const target = parseTime(targetStr);
    
    if (actual === 0 && target === 0) return null;
    return actual - target;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getCategoryColor = (category: Category) => {
    switch (category) {
      case 'Recording': return 'bg-primary text-primary';
      case 'Cold Calling': return 'bg-secondary-container text-secondary';
      case 'Learning': return 'bg-tertiary-fixed-dim text-on-tertiary-fixed-variant';
      case 'Internal': return 'bg-on-surface-variant text-on-surface-variant';
      default: return 'bg-slate-200 text-slate-500';
    }
  };

  // Group tasks by category
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.category]) acc[task.category] = [];
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="flex flex-col gap-8 max-w-[1000px] mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mb-1">Daily Task Log</h1>
          <p className="text-on-surface-variant text-sm font-medium">Track your daily tasks and performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-on-surface-variant bg-surface-container px-2 py-1 rounded-md">
            <button className="hover:text-primary"><ChevronLeft className="h-4 w-4" /></button>
            <Input 
              type="date" 
              className="w-auto bg-transparent border-none shadow-none h-8 text-sm font-semibold focus-visible:ring-0 p-0 mx-2" 
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
            />
            <button className="hover:text-primary"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <Button className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-container transition-all">
            Save Day
          </Button>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {weekDays.map((day) => (
          <button
            key={day.id}
            onClick={() => setSelectedDay(day.id)}
            className={cn(
              "flex flex-col items-center justify-center min-w-[100px] px-4 py-3 rounded-2xl transition-all border",
              selectedDay === day.id
                ? "bg-primary text-white border-primary shadow-md transform scale-105"
                : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/20 hover:border-primary/30 hover:bg-surface-container-low"
            )}
          >
            <span className={cn("text-[10px] font-bold uppercase tracking-widest", selectedDay === day.id ? "text-primary-container" : "text-on-surface-variant/70")}>{day.shortLabel}</span>
            <span className="text-xl font-headline font-extrabold mt-1">{day.dateStr}</span>
          </button>
        ))}
      </div>

      {/* Task Categories */}
      <div className="flex flex-col gap-6">
        {Object.keys(groupedTasks).length === 0 ? (
          <div className="text-center py-16 bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm">
            <h3 className="text-xl font-headline font-bold text-on-surface">No tasks scheduled for this day.</h3>
            <p className="text-on-surface-variant mt-2 text-sm font-medium">Go to the Weekly Plan to add tasks.</p>
          </div>
        ) : (
          Object.entries(groupedTasks).map(([category, categoryTasks]: [string, any[]]) => {
            const catColor = getCategoryColor(category as Category);
            
            return (
              <Card key={category} className="overflow-hidden border border-outline-variant/10 shadow-sm bg-surface-container-lowest rounded-[24px]">
                <div className="bg-surface-container-low px-8 py-4 border-b border-outline-variant/10 flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full", catColor.split(' ')[0])}></div>
                  <h3 className="font-bold text-xs text-on-surface uppercase tracking-widest">{category}</h3>
                </div>
                <div className="divide-y divide-outline-variant/10">
                  {categoryTasks.map((task) => {
                    const diff = getDiff(task.id, task.time);
                    const status = logs[task.id]?.status || task.status;
                    
                    return (
                      <div key={task.id} className="p-6 sm:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-surface-container-high transition-colors group">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-headline font-bold text-on-surface text-lg">{task.name}</h4>
                            {status === "Completed" && <CheckCircle2 className="h-5 w-5 text-tertiary-fixed-dim" />}
                            {status === "Overdue" && <AlertCircle className="h-5 w-5 text-error" />}
                            {status === "In Progress" && <PlayCircle className="h-5 w-5 text-secondary" />}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container rounded-lg font-semibold text-xs text-on-surface">
                              <Clock className="h-3.5 w-3.5" /> Target: {task.time}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 lg:gap-6 bg-surface-container-low lg:bg-transparent p-4 lg:p-0 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Actual</label>
                            <Input
                              type="text"
                              className="w-24 h-10 text-center font-bold bg-surface-container-lowest border-outline-variant/20 rounded-xl text-sm focus-visible:ring-primary"
                              placeholder="e.g. 30m"
                              value={logs[task.id]?.actual || ""}
                              onChange={(e) => handleLogChange(task.id, "actual", e.target.value)}
                            />
                          </div>
                          
                          <div className="w-20 flex justify-center">
                            {diff !== null && (
                              <Badge 
                                variant={diff > 0 ? "destructive" : "default"}
                                className={cn(
                                  "px-3 py-1 text-xs font-bold rounded-lg",
                                  diff <= 0 ? "bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim hover:bg-tertiary-fixed-dim/30" : "bg-error-container text-on-error-container hover:bg-error-container/80"
                                )}
                              >
                                {diff > 0 ? `+${diff}m` : `${diff}m`}
                              </Badge>
                            )}
                            {diff === null && <MoreHorizontal className="h-5 w-5 text-outline-variant opacity-50" />}
                          </div>

                          <div className="flex items-center gap-3">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest lg:hidden">Status</label>
                            <select
                              className="h-10 w-[130px] rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-3 text-xs font-bold text-on-surface shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              value={status}
                              onChange={(e) => handleLogChange(task.id, "status", e.target.value)}
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Overdue">Overdue</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
