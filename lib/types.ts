// ============================
// TYPE DEFINITIONS
// ============================

export interface UserProfile {
  id: string
  name: string
  class: string
  age: number
  studentId: string
  email: string
  avatar?: string
  major: string
  semester: string
  campus: string
  gpa: number
}

export interface Subject {
  id: string
  code: string
  name: string
  credits: number
  instructor: string
  room: string
  color: string
}

export interface TimetableSlot {
  id: string
  subjectId: string
  day: number
  startTime: string
  endTime: string
  room: string
  type: "lecture" | "lab" | "tutorial"
}

export interface Assignment {
  id: string
  subjectId: string
  title: string
  deadline: string
  status: "completed" | "in-progress" | "not-started" | "overdue"
  weight: number
  description: string
  submittedAt?: string
}

export interface Exam {
  id: string
  subjectId: string
  title: string
  date: string
  startTime: string
  endTime: string
  room: string
  type: "PT" | "FE" | "PE" | "Quiz"
}

export interface DailyTask {
  id: string
  title: string
  completed: boolean
  priority: "high" | "medium" | "low"
  createdAt: string
}

export interface StudySchedule {
  id: string
  subjectId: string
  title: string
  date: string
  startTime: string
  endTime: string
  description: string
  completed: boolean
}

export interface StudyTask {
  id: string
  subjectId: string
  title: string
  date: string
  completed: boolean
  priority: "high" | "medium" | "low"
  category: "assignment" | "study" | "exam-prep" | "lab" | "project"
  estimatedMinutes: number
}

export interface StudySession {
  id: string
  subjectId: string
  date: string
  duration: number
  type: "practice" | "assignment" | "review" | "reading"
}

export interface StudyTimeByHour {
  hour: string
  minutes: number
}

export interface DeadlineStat {
  subject: string
  total: number
  onTime: number
  late: number
  missed: number
}

export interface WeeklyPressure {
  week: string
  label: string
  score: number
  assignments: number
  exams: number
}

export interface CommunityMember {
  id: string
  name: string
  avatar: string
  major: string
  subjects: string[]
  online: boolean
}

export interface StudyGroup {
  id: string
  name: string
  subjectId: string
  members: string[]
  description: string
}

export interface SharedDocument {
  id: string
  subjectId: string
  title: string
  type: "pdf" | "doc" | "ppt" | "code" | "image"
  uploadedBy: string
  downloads: number
  size: string
}

// App State
export interface AppState {
  profile: UserProfile
  subjects: Subject[]
  timetable: TimetableSlot[]
  assignments: Assignment[]
  exams: Exam[]
  dailyTasks: DailyTask[]
  studySchedules: StudySchedule[]
  studyTasks: StudyTask[]
  // Statistics data
  studySessions: StudySession[]
  studyTimeByHour: StudyTimeByHour[]
  deadlineStats: DeadlineStat[]
  weeklyPressure: WeeklyPressure[]
  // Community data
  communityMembers: CommunityMember[]
  studyGroups: StudyGroup[]
  sharedDocuments: SharedDocument[]
}

// Action types for state management
export type AppAction =
  | { type: "SET_STATE"; payload: AppState }
  | { type: "UPDATE_PROFILE"; payload: Partial<UserProfile> }
  | { type: "ADD_SUBJECT"; payload: Subject }
  | { type: "UPDATE_SUBJECT"; payload: Subject }
  | { type: "DELETE_SUBJECT"; payload: string }
  | { type: "ADD_TIMETABLE_SLOT"; payload: TimetableSlot }
  | { type: "UPDATE_TIMETABLE_SLOT"; payload: TimetableSlot }
  | { type: "DELETE_TIMETABLE_SLOT"; payload: string }
  | { type: "ADD_DAILY_TASK"; payload: DailyTask }
  | { type: "ADD_DAILY_TASKS_BULK"; payload: DailyTask[] }
  | { type: "UPDATE_DAILY_TASK"; payload: DailyTask }
  | { type: "DELETE_DAILY_TASK"; payload: string }
  | { type: "TOGGLE_DAILY_TASK"; payload: string }
  | { type: "ADD_STUDY_SCHEDULE"; payload: StudySchedule }
  | { type: "UPDATE_STUDY_SCHEDULE"; payload: StudySchedule }
  | { type: "DELETE_STUDY_SCHEDULE"; payload: string }
  | { type: "TOGGLE_STUDY_SCHEDULE"; payload: string }
  | { type: "TOGGLE_STUDY_TASK"; payload: string }
