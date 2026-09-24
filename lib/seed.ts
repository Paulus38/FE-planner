import { supabase } from './api';

export async function seedDefaultDataForUser(_userId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const userId = user.id;

  const { data: existingSettings } = await supabase
    .from('settings')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingSettings) {
    return { success: true, message: 'Already seeded' };
  }

  const { error: settingsError } = await supabase.from('settings').insert({
    user_id: userId,
    wake_time: '04:25',
    sleep_time: '21:45',
    mass_time_start: '04:45',
    mass_time_end: '06:00',
    breakfast_start: '06:00',
    breakfast_end: '08:00',
    lunch_start: '11:30',
    lunch_end: '12:00',
    nap_start: '12:00',
    nap_end: '13:45',
    sports_start: '16:30',
    sports_end: '18:00',
    dinner_start: '18:00',
    dinner_end: '18:45',
    evening_prayer_time: '19:15',
    study_block1_start: '08:00',
    study_block1_end: '11:00',
    study_block2_start: '14:30',
    study_block2_end: '16:25',
    self_study_start: '19:30',
    self_study_end: '21:20',
    session_duration_min: 45,
    break_duration_min: 10,
    english_target_pct: 50,
    journal_min_min: 15,
    notifications_enabled: true,
    notify_before_study_min: 10,
    notify_before_end_min: 5,
    notify_journal: true,
    notify_sleep: true,
    notify_incomplete: true,
    notify_weekly_review: true,
  });
  if (settingsError) throw settingsError;

  const activities = [
    { name: 'Thánh lễ', start_time: '04:45', end_time: '06:00', category: 'prayer', icon: 'Church', sort_order: 1, user_id: userId },
    { name: 'Ăn sáng', start_time: '06:00', end_time: '08:00', category: 'meal', icon: 'Coffee', sort_order: 2, user_id: userId },
    { name: 'Ăn trưa', start_time: '11:30', end_time: '12:00', category: 'meal', icon: 'Utensils', sort_order: 3, user_id: userId },
    { name: 'Ngủ trưa', start_time: '12:00', end_time: '13:45', category: 'rest', icon: 'Moon', sort_order: 4, user_id: userId },
    { name: 'Thể thao', start_time: '16:30', end_time: '18:00', category: 'sports', icon: 'Dumbbell', sort_order: 5, user_id: userId },
    { name: 'Ăn tối', start_time: '18:00', end_time: '18:45', category: 'meal', icon: 'Utensils', sort_order: 6, user_id: userId },
    { name: 'Kinh tối', start_time: '19:15', end_time: '19:30', category: 'prayer', icon: 'Church', sort_order: 7, user_id: userId },
  ];
  const { error: activitiesError } = await supabase.from('fixed_activities').insert(activities);
  if (activitiesError) throw activitiesError;

  const subjects = [
    { name: 'Tiếng Anh', code: 'english', color: '#3b82f6', icon_name: 'Languages', description: 'Tiếng Anh tổng hợp.', tags: ['ngôn ngữ', 'tự học'], show_in_nav: true, is_in_english_ratio: true, weekly_goal_min: 315, monthly_goal_min: 1260, sort_order: 1, user_id: userId },
    { name: 'Việt văn', code: 'vietnamese', color: '#10b981', icon_name: 'PenLine', description: 'Tiếng Việt thực hành.', tags: ['ngôn ngữ', 'văn'], show_in_nav: true, is_in_english_ratio: true, weekly_goal_min: 105, monthly_goal_min: 420, sort_order: 2, user_id: userId },
    { name: 'Đàn', code: 'instrument', color: '#f59e0b', icon_name: 'Music', description: 'Xướng âm, nhạc lý, kỹ thuật.', tags: ['âm nhạc'], show_in_nav: true, is_in_english_ratio: true, weekly_goal_min: 105, monthly_goal_min: 420, sort_order: 3, user_id: userId },
    { name: 'Đọc sách', code: 'reading', color: '#8b5cf6', icon_name: 'BookMarked', description: 'Đọc sách cá nhân.', tags: ['đọc'], show_in_nav: true, is_in_english_ratio: true, weekly_goal_min: 105, monthly_goal_min: 420, sort_order: 4, user_id: userId },
    { name: 'Ôn bài / Bài tập', code: 'homework', color: '#ef4444', icon_name: 'GraduationCap', description: 'Ôn tập và làm bài tập.', tags: ['ôn tập'], show_in_nav: false, is_in_english_ratio: false, weekly_goal_min: 210, monthly_goal_min: 840, sort_order: 5, user_id: userId },
    { name: 'Nhật ký thiêng liêng', code: 'journal', color: '#ec4899', icon_name: 'Heart', description: 'Viết nhật ký phản tỉnh.', tags: ['thiêng liêng'], show_in_nav: true, is_in_english_ratio: false, weekly_goal_min: 105, monthly_goal_min: 420, sort_order: 6, user_id: userId },
  ];
  const { error: subjectsError } = await supabase.from('study_subjects').insert(subjects);
  if (subjectsError) throw subjectsError;

  const schedule = [
    { weekday: 1, start_time: '08:00', end_time: '08:45', subject_name: 'Giáo lý HTCG 1', session_type: 'class', recurrence: 'weekly', sort_order: 1, user_id: userId },
    { weekday: 1, start_time: '08:50', end_time: '09:35', subject_name: 'Tiếng Anh', session_type: 'class', recurrence: 'weekly', sort_order: 2, user_id: userId },
    { weekday: 1, start_time: '09:40', end_time: '10:25', subject_name: 'Việt văn', session_type: 'class', recurrence: 'weekly', sort_order: 3, user_id: userId },
    { weekday: 2, start_time: '08:00', end_time: '08:45', subject_name: 'Đàn', session_type: 'class', recurrence: 'weekly', sort_order: 1, user_id: userId },
    { weekday: 2, start_time: '08:50', end_time: '09:35', subject_name: 'Tiếng Anh', session_type: 'class', recurrence: 'weekly', sort_order: 2, user_id: userId },
    { weekday: 3, start_time: '08:00', end_time: '08:45', subject_name: 'Giáo lý HTCG 2', session_type: 'class', recurrence: 'weekly', sort_order: 1, user_id: userId },
    { weekday: 3, start_time: '08:50', end_time: '09:35', subject_name: 'Việt văn', session_type: 'class', recurrence: 'weekly', sort_order: 2, user_id: userId },
    { weekday: 4, start_time: '08:00', end_time: '08:45', subject_name: 'Tiếng Anh', session_type: 'class', recurrence: 'weekly', sort_order: 1, user_id: userId },
    { weekday: 4, start_time: '08:50', end_time: '09:35', subject_name: 'Đàn', session_type: 'class', recurrence: 'weekly', sort_order: 2, user_id: userId },
    { weekday: 5, start_time: '08:00', end_time: '08:45', subject_name: 'Giáo lý HTCG 1', session_type: 'class', recurrence: 'weekly', sort_order: 1, user_id: userId },
    { weekday: 5, start_time: '08:50', end_time: '09:35', subject_name: 'Tiếng Anh', session_type: 'class', recurrence: 'weekly', sort_order: 2, user_id: userId },
    { weekday: 6, start_time: '08:00', end_time: '08:45', subject_name: 'Việt văn', session_type: 'class', recurrence: 'weekly', sort_order: 1, user_id: userId },
    { weekday: 0, start_time: '08:00', end_time: '08:45', subject_name: 'Giáo lý HTCG 2', session_type: 'class', recurrence: 'weekly', sort_order: 1, user_id: userId },
  ];
  const { error: scheduleError } = await supabase.from('schedule_entries').insert(schedule);
  if (scheduleError) throw scheduleError;

  return { success: true, message: 'Data seeded successfully' };
}
