import React, { createContext, useContext, useState, useEffect } from 'react';
import { startOfWeek, addDays, format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type Category = 'Recording' | 'Cold Calling' | 'Learning' | 'Internal';
export type Status = 'Completed' | 'In Progress' | 'Pending' | 'Overdue';

export interface Task {
  id: string;
  name: string;
  category: Category;
  time: string;
  status: Status;
}

export interface TaskLog {
  actual: string;
  status: Status;
}

export interface DailyData {
  tasks: Task[];
  logs: Record<string, TaskLog>;
}

interface ScheduleContextType {
  schedule: Record<string, DailyData>;
  addTask: (date: string, category: Category, name: string, time: string) => Promise<void>;
  removeTask: (date: string, taskId: string) => Promise<void>;
  updateTaskLog: (date: string, taskId: string, log: TaskLog) => Promise<void>;
  getTasksForDate: (date: string) => Task[];
  getLogsForDate: (date: string) => Record<string, TaskLog>;
  isLoading: boolean;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

const generateInitialData = () => {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
  const data: Record<string, DailyData> = {};

  for (let i = 0; i < 5; i++) { // Mon-Fri
    const dateStr = format(addDays(start, i), 'yyyy-MM-dd');
    const tasks: Task[] = [];
    
    if (i === 0) { // Monday
      tasks.push({ id: `t1-${i}`, name: 'Lead Outreach Session A', category: 'Cold Calling', time: '09:00 - 11:30', status: 'Pending' });
      tasks.push({ id: `t2-${i}`, name: 'Product Demo Voiceover', category: 'Recording', time: '13:00 - 15:00', status: 'Completed' });
    } else if (i === 1) { // Tuesday
      tasks.push({ id: `t1-${i}`, name: 'CRM Advanced Training', category: 'Learning', time: '10:00 - 12:00', status: 'Overdue' });
      tasks.push({ id: `t2-${i}`, name: 'Follow-up Calls', category: 'Cold Calling', time: '14:00 - 16:30', status: 'In Progress' });
    } else if (i === 2) { // Wednesday
      tasks.push({ id: `t1-${i}`, name: 'Weekly Podcast Session', category: 'Recording', time: '09:30 - 12:30', status: 'Pending' });
    } else if (i === 3) { // Thursday
      tasks.push({ id: `t1-${i}`, name: 'New Market Research', category: 'Cold Calling', time: '11:00 - 13:00', status: 'Pending' });
      tasks.push({ id: `t2-${i}`, name: 'Productivity Workshop', category: 'Learning', time: '15:00 - 17:00', status: 'Pending' });
    } else if (i === 4) { // Friday
      tasks.push({ id: `t1-${i}`, name: 'Social Media Clips', category: 'Recording', time: '10:00 - 12:00', status: 'Pending' });
      tasks.push({ id: `t2-${i}`, name: 'Weekly Review', category: 'Internal', time: '16:00 - 17:00', status: 'Pending' });
    }

    data[dateStr] = { tasks, logs: {} };
  }
  return data;
};

export const ScheduleProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [schedule, setSchedule] = useState<Record<string, DailyData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!supabase || !user) {
        setSchedule(generateInitialData());
        setIsLoading(false);
        return;
      }

      try {
        const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*');
        if (tasksError) throw tasksError;

        const { data: logsData, error: logsError } = await supabase.from('task_logs').select('*');
        if (logsError) throw logsError;

        const newSchedule: Record<string, DailyData> = {};

        // Group tasks by date
        tasksData?.forEach(task => {
          const dateStr = task.date;
          if (!newSchedule[dateStr]) {
            newSchedule[dateStr] = { tasks: [], logs: {} };
          }
          newSchedule[dateStr].tasks.push({
            id: task.id,
            name: task.name,
            category: task.category,
            time: task.time_slot,
            status: task.status
          });
        });

        // Add logs
        logsData?.forEach(log => {
          const dateStr = log.date;
          if (newSchedule[dateStr]) {
            newSchedule[dateStr].logs[log.task_id] = {
              actual: log.actual_time,
              status: log.status
            };
          }
        });

        setSchedule(newSchedule);
      } catch (error) {
        console.error('Error fetching schedule:', error);
        // Fallback to local data on error
        setSchedule(generateInitialData());
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [user]);

  const addTask = async (date: string, category: Category, name: string, time: string) => {
    const newTask = { id: Math.random().toString(36).substring(2, 9), name, category, time, status: 'Pending' as Status };

    if (supabase && user) {
      try {
        const { data, error } = await supabase.from('tasks').insert([{
          user_id: user.id,
          date,
          name,
          category,
          time_slot: time,
          status: 'Pending'
        }]).select();
        
        if (error) throw error;
        if (data && data.length > 0) {
          newTask.id = data[0].id;
        }
      } catch (error) {
        console.error('Error adding task:', error);
        return;
      }
    }

    setSchedule(prev => {
      const dayData = prev[date] || { tasks: [], logs: {} };
      return {
        ...prev,
        [date]: {
          ...dayData,
          tasks: [...dayData.tasks, newTask]
        }
      };
    });
  };

  const removeTask = async (date: string, taskId: string) => {
    if (supabase && !taskId.startsWith('t')) { // Don't try to delete mock data from DB
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (error) throw error;
      } catch (error) {
        console.error('Error removing task:', error);
        return;
      }
    }

    setSchedule(prev => {
      const dayData = prev[date];
      if (!dayData) return prev;
      return {
        ...prev,
        [date]: {
          ...dayData,
          tasks: dayData.tasks.filter(t => t.id !== taskId)
        }
      };
    });
  };

  const updateTaskLog = async (date: string, taskId: string, log: TaskLog) => {
    if (supabase && user && !taskId.startsWith('t')) { // Don't try to update mock data in DB
      try {
        // Update task status
        const { error: taskError } = await supabase.from('tasks')
          .update({ status: log.status })
          .eq('id', taskId);
        if (taskError) throw taskError;

        // Upsert log
        const { error: logError } = await supabase.from('task_logs')
          .upsert({
            user_id: user.id,
            task_id: taskId,
            date,
            actual_time: log.actual,
            status: log.status
          }, { onConflict: 'task_id,date' });
        if (logError) throw logError;
      } catch (error) {
        console.error('Error updating task log:', error);
        return;
      }
    }

    setSchedule(prev => {
      const dayData = prev[date] || { tasks: [], logs: {} };
      
      // Also update the task status
      const updatedTasks = dayData.tasks.map(t => 
        t.id === taskId ? { ...t, status: log.status } : t
      );

      return {
        ...prev,
        [date]: {
          ...dayData,
          tasks: updatedTasks,
          logs: { ...dayData.logs, [taskId]: log }
        }
      };
    });
  };

  const getTasksForDate = (date: string) => schedule[date]?.tasks || [];
  const getLogsForDate = (date: string) => schedule[date]?.logs || {};

  return (
    <ScheduleContext.Provider value={{ schedule, addTask, removeTask, updateTaskLog, getTasksForDate, getLogsForDate, isLoading }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) throw new Error('useSchedule must be used within ScheduleProvider');
  return context;
};
