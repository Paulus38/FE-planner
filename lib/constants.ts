import type { ActivityCategory } from './types';

export const WEEKDAY_NAMES = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

export const WEEKDAY_NAMES_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export const CATEGORY_COLORS: Record<ActivityCategory, { bg: string; text: string; border: string; dot: string; label: string }> = {
  fixed: { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-400/30', dot: 'bg-slate-500', label: 'Sinh hoạt cố định' },
  mass: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-300', border: 'border-amber-400/30', dot: 'bg-amber-500', label: 'Thánh lễ' },
  meal: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-300', border: 'border-orange-400/30', dot: 'bg-orange-500', label: 'Ăn uống' },
  class: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-300', border: 'border-blue-400/30', dot: 'bg-blue-500', label: 'Học chính khóa' },
  prayer: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-300', border: 'border-violet-400/30', dot: 'bg-violet-500', label: 'Kinh nguyện' },
  rest: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-300', border: 'border-teal-400/30', dot: 'bg-teal-500', label: 'Nghỉ ngơi' },
  sports: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-300', border: 'border-green-400/30', dot: 'bg-green-500', label: 'Thể thao' },
  self_study: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-300', border: 'border-indigo-400/30', dot: 'bg-indigo-500', label: 'Tự học' },
  journal: { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-300', border: 'border-pink-400/30', dot: 'bg-pink-500', label: 'Nhật ký thiêng liêng' },
  sleep: { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-300', border: 'border-gray-400/30', dot: 'bg-gray-500', label: 'Ngủ' },
  homework: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-300', border: 'border-red-400/30', dot: 'bg-red-500', label: 'Bài tập' },
  study: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-300', border: 'border-cyan-400/30', dot: 'bg-cyan-500', label: 'Tự học' },
};

export const SUBJECT_COLORS: Record<string, string> = {
  english: '#3b82f6',
  vietnamese: '#10b981',
  instrument: '#f59e0b',
  reading: '#8b5cf6',
  homework: '#ef4444',
  journal: '#ec4899',
};

export const SUBJECT_NAMES: Record<string, string> = {
  english: 'Tiếng Anh',
  vietnamese: 'Việt văn',
  instrument: 'Đàn',
  reading: 'Đọc sách',
  homework: 'Ôn bài / Bài tập',
  journal: 'Nhật ký thiêng liêng',
};

export const ENGLISH_SKILLS = [
  { code: 'vocabulary', name: 'Vocabulary', target: 60, color: '#3b82f6' },
  { code: 'grammar', name: 'Grammar', target: 75, color: '#6366f1' },
  { code: 'reading', name: 'Reading', target: 45, color: '#0ea5e9' },
  { code: 'listening', name: 'Listening', target: 50, color: '#06b6d4' },
  { code: 'speaking', name: 'Speaking', target: 40, color: '#14b8a6' },
  { code: 'pronunciation', name: 'Pronunciation', target: 20, color: '#10b981' },
  { code: 'translation', name: 'Translation', target: 25, color: '#22c55e' },
];

export const DEFAULT_WEEKLY_PLAN: Record<number, { session1: { subject: string; title: string; skill?: string }; session2: { subject: string; title: string; skill?: string } }> = {
  1: {
    session1: { subject: 'homework', title: 'Ôn các môn học trong ngày' },
    session2: { subject: 'english', title: 'English Vocabulary', skill: 'vocabulary' },
  },
  2: {
    session1: { subject: 'vietnamese', title: 'Việt văn' },
    session2: { subject: 'instrument', title: 'Đàn + Nhạc lý' },
  },
  3: {
    session1: { subject: 'english', title: 'English Grammar', skill: 'grammar' },
    session2: { subject: 'english', title: 'English Reading / Translation', skill: 'reading' },
  },
  4: {
    session1: { subject: 'english', title: 'English Listening + Pronunciation', skill: 'listening' },
    session2: { subject: 'english', title: 'English Grammar / Translation', skill: 'grammar' },
  },
  5: {
    session1: { subject: 'homework', title: 'Tổng ôn các môn trong tuần' },
    session2: { subject: 'english', title: 'English Vocabulary + Translation', skill: 'vocabulary' },
  },
  6: {
    session1: { subject: 'vietnamese', title: 'Việt văn / Bài tập' },
    session2: { subject: 'instrument', title: 'Đàn + English Speaking' },
  },
  0: {
    session1: { subject: 'english', title: 'Ôn nhẹ tiếng Anh / Tổng ôn tuần', skill: 'reading' },
    session2: { subject: 'reading', title: 'Đọc sách' },
  },
};

export const JOURNAL_QUESTIONS = [
  { key: 'grateful_for', label: 'Hôm nay tôi biết ơn điều gì?' },
  { key: 'good_deed', label: 'Điều tốt tôi đã làm hôm nay?' },
  { key: 'needs_improvement', label: 'Điều tôi chưa tốt?' },
  { key: 'realization', label: 'Tôi nhận ra điều gì?' },
  { key: 'want_to_change', label: 'Tôi muốn thay đổi điều gì ngày mai?' },
  { key: 'prayer', label: 'Lời nguyện của tôi hôm nay?' },
] as const;
