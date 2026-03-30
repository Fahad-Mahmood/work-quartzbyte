import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type UserRole = 'admin' | 'member';

export interface UserProfile {
  full_name: string;
  job_title: string;
  avatar_url: string | null;
  role: UserRole;
}

interface ProfileContextType {
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  refresh: () => void;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  isAdmin: false,
  isLoading: true,
  refresh: () => {},
});

export const useUserProfile = () => useContext(ProfileContext);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!supabase || !user) { setIsLoading(false); return; }
    setIsLoading(true);
    const { data } = await supabase
      .from('work_profiles')
      .select('full_name, job_title, avatar_url, role')
      .eq('user_id', user.id)
      .maybeSingle();

    setProfile(data ? {
      full_name:  data.full_name  ?? '',
      job_title:  data.job_title  ?? '',
      avatar_url: data.avatar_url ?? null,
      role:       data.role === 'admin' ? 'admin' : 'member',
    } : null);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <ProfileContext.Provider value={{ profile, isAdmin: profile?.role === 'admin', isLoading, refresh: fetch }}>
      {children}
    </ProfileContext.Provider>
  );
};
