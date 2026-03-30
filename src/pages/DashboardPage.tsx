import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import { Card, CardContent } from '@/src/components/ui/card';
import { Calendar, Video, ArrowRight, Clock, CheckCircle, CalendarDays } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface DashboardStats {
  tasksToday: number;
  hoursLoggedToday: number;
  completionRate: number;
}

function parseHours(timeSlot: string): number {
  // Parses "HH:MM - HH:MM" and returns duration in hours
  const parts = timeSlot.split(' - ');
  if (parts.length !== 2) return 0;
  const [startH, startM] = parts[0].split(':').map(Number);
  const [endH, endM]     = parts[1].split(':').map(Number);
  const mins = (endH * 60 + endM) - (startH * 60 + startM);
  return Math.max(0, mins / 60);
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const [stats, setStats]       = useState<DashboardStats>({ tasksToday: 0, hoursLoggedToday: 0, completionRate: 0 });
  const [firstName, setFirstName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!supabase || !user) { setIsLoading(false); return; }

      const today     = format(new Date(), 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekEnd   = format(endOfWeek(new Date(),   { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const [profileRes, todayRes, weekRes] = await Promise.all([
        supabase.from('work_profiles').select('full_name').eq('user_id', user.id).maybeSingle(),
        supabase.from('work_tasks').select('time_slot, status').eq('user_id', user.id).eq('date', today),
        supabase.from('work_tasks').select('status').eq('user_id', user.id).gte('date', weekStart).lte('date', weekEnd),
      ]);

      // Name
      const fullName = profileRes.data?.full_name ?? user.email ?? '';
      setFirstName(fullName.split(' ')[0] || fullName);

      // Tasks today
      const todayTasks = todayRes.data ?? [];
      const tasksToday = todayTasks.length;

      // Hours logged today = sum of durations of today's tasks
      const hoursLoggedToday = todayTasks.reduce((sum, t) => sum + parseHours(t.time_slot ?? ''), 0);

      // Completion rate this week
      const weekTasks = weekRes.data ?? [];
      const completed = weekTasks.filter(t => t.status === 'Completed').length;
      const completionRate = weekTasks.length > 0 ? Math.round((completed / weekTasks.length) * 100) : 0;

      setStats({ tasksToday, hoursLoggedToday: Math.round(hoursLoggedToday * 10) / 10, completionRate });
      setIsLoading(false);
    };

    load();
  }, [user]);

  const statCards = [
    { label: 'Videos to Review', value: '—',                         icon: Video,        color: 'text-blue-600',   bg: 'bg-blue-50'    },
    { label: 'Tasks Today',       value: String(stats.tasksToday),    icon: Calendar,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Hours Logged',      value: String(stats.hoursLoggedToday), icon: Clock,    color: 'text-purple-600', bg: 'bg-purple-50'  },
    { label: 'Completion Rate',   value: `${stats.completionRate}%`,  icon: CheckCircle,  color: 'text-orange-600', bg: 'bg-orange-50'  },
  ];

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">
          {getGreeting()}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-on-surface-variant text-lg font-medium">
          Here's an overview of your tasks and video production pipeline.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="border border-outline-variant/10 shadow-sm bg-surface-container-lowest rounded-[24px]">
            <CardContent className="p-8 flex flex-col gap-4">
              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-10 w-10 rounded-2xl bg-surface-container-high" />
                  <div className="h-8 w-16 rounded bg-surface-container-high mt-2" />
                  <div className="h-3 w-24 rounded bg-surface-container-high" />
                </div>
              ) : (
                <>
                  <div className={`p-4 rounded-2xl w-fit ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="mt-2">
                    <h3 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">
                      {stat.value}
                    </h3>
                    <p className="text-[10px] font-bold text-on-surface-variant mt-2 uppercase tracking-widest">
                      {stat.label}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Access */}
      <div className="mt-4">
        <h2 className="text-xl font-headline font-bold text-on-surface mb-6">Quick Access</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              to: '/weekly-plan',
              icon: CalendarDays,
              title: 'Weekly Plan',
              desc: 'Plan your upcoming week, set targets, and define your daily blocks.',
            },
            {
              to: '/daily-log',
              icon: Calendar,
              title: 'Daily Log',
              desc: 'Manage your daily schedule, log actual times, and track performance against SOPs.',
            },
            {
              to: '/video-tracker',
              icon: Video,
              title: 'Video Production',
              desc: 'Collaborate on video creation, from scripting and recording to editing and final approval.',
            },
          ].map(item => (
            <Link key={item.to} to={item.to} className="group block">
              <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-outline-variant/10 bg-surface-container-lowest rounded-[24px]">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="bg-surface-container-low p-4 rounded-2xl group-hover:bg-primary group-hover:text-on-primary transition-colors duration-300">
                      <item.icon className="h-7 w-7" />
                    </div>
                    <ArrowRight className="h-6 w-6 text-outline-variant group-hover:text-primary transition-colors transform group-hover:translate-x-1 duration-300" />
                  </div>
                  <div className="mt-8">
                    <h3 className="text-2xl font-headline font-bold text-on-surface">{item.title}</h3>
                    <p className="text-on-surface-variant mt-3 leading-relaxed text-sm font-medium">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
