"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type {
  AppState,
  AppAction,
  UserProfile,
  Subject,
  TimetableSlot,
  DailyTask,
  StudySchedule,
  StudyTask,
} from "./types";
import * as api from "./api";
import { ApiError, clearAuthStorage } from "./api";

// ============================
// State ban đầu (rỗng) – dữ liệu thật lấy từ API khi load
// ============================

const emptyProfile: UserProfile = {
  id: "user-001",
  name: "",
  class: "",
  age: 0,
  studentId: "",
  email: "",
  major: "",
  semester: "Spring 2026",
  campus: "FPT University HCM",
  gpa: 0,
};

const initialState: AppState = {
  profile: emptyProfile,
  subjects: [],
  timetable: [],
  assignments: [],
  exams: [],
  dailyTasks: [],
  studySchedules: [],
  studyTasks: [],
  studySessions: [],
  studyTimeByHour: [],
  deadlineStats: [],
  weeklyPressure: [],
  communityMembers: [],
  studyGroups: [],
  sharedDocuments: [],
};

// ============================
// Reducer – cập nhật state theo từng action
// ============================

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_STATE":
      return action.payload;

    case "UPDATE_PROFILE":
      return { ...state, profile: { ...state.profile, ...action.payload } };

    case "ADD_SUBJECT":
      return { ...state, subjects: [...state.subjects, action.payload] };

    case "UPDATE_SUBJECT":
      return {
        ...state,
        subjects: state.subjects.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };

    case "DELETE_SUBJECT":
      return {
        ...state,
        subjects: state.subjects.filter((s) => s.id !== action.payload),
        timetable: state.timetable.filter((t) => t.subjectId !== action.payload),
      };

    case "ADD_TIMETABLE_SLOT":
      return { ...state, timetable: [...state.timetable, action.payload] };

    case "UPDATE_TIMETABLE_SLOT":
      return {
        ...state,
        timetable: state.timetable.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };

    case "DELETE_TIMETABLE_SLOT":
      return {
        ...state,
        timetable: state.timetable.filter((t) => t.id !== action.payload),
      };

    case "ADD_DAILY_TASK":
      return { ...state, dailyTasks: [...state.dailyTasks, action.payload] };

    case "ADD_DAILY_TASKS_BULK":
      return { ...state, dailyTasks: [...state.dailyTasks, ...action.payload] };

    case "UPDATE_DAILY_TASK":
      return {
        ...state,
        dailyTasks: state.dailyTasks.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };

    case "DELETE_DAILY_TASK":
      return {
        ...state,
        dailyTasks: state.dailyTasks.filter((t) => t.id !== action.payload),
      };

    case "TOGGLE_DAILY_TASK":
      return {
        ...state,
        dailyTasks: state.dailyTasks.map((t) =>
          t.id === action.payload ? { ...t, completed: !t.completed } : t
        ),
      };

    case "ADD_STUDY_SCHEDULE":
      return {
        ...state,
        studySchedules: [...state.studySchedules, action.payload],
      };

    case "UPDATE_STUDY_SCHEDULE":
      return {
        ...state,
        studySchedules: state.studySchedules.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };

    case "DELETE_STUDY_SCHEDULE":
      return {
        ...state,
        studySchedules: state.studySchedules.filter((s) => s.id !== action.payload),
      };

    case "TOGGLE_STUDY_SCHEDULE":
      return {
        ...state,
        studySchedules: state.studySchedules.map((s) =>
          s.id === action.payload ? { ...s, completed: !s.completed } : s
        ),
      };

    case "TOGGLE_STUDY_TASK":
      return {
        ...state,
        studyTasks: state.studyTasks.map((t) =>
          t.id === action.payload ? { ...t, completed: !t.completed } : t
        ),
      };

    default:
      return state;
  }
}

// ============================
// Context & Provider
// ============================

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => void;
  getSubject: (id: string) => Subject | undefined;
  updateProfile: (data: Partial<UserProfile>) => void;
  addSubject: (subject: Omit<Subject, "id">) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addTimetableSlot: (slot: Omit<TimetableSlot, "id">) => Promise<void>;
  deleteTimetableSlot: (id: string) => Promise<void>;
  addDailyTask: (task: Omit<DailyTask, "id">) => Promise<void>;
  toggleDailyTask: (id: string) => Promise<void>;
  deleteDailyTask: (id: string) => Promise<void>;
  addStudySchedule: (schedule: Omit<StudySchedule, "id">) => Promise<void>;
  toggleStudySchedule: (id: string) => Promise<void>;
  deleteStudySchedule: (id: string) => Promise<void>;
  toggleStudyTask: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

type AppProviderProps = {
  children: ReactNode;
  /** Gọi khi token hết hạn hoặc 401 để quay lại màn đăng nhập */
  onUnauthorized?: () => void;
};

const PROFILE_SAVE_DEBOUNCE_MS = 5000;

export function AppProvider({ children, onUnauthorized }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pendingProfileRef = useRef<UserProfile>(initialState.profile);
  const profileSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pendingProfileRef.current = state.profile;
  }, [state.profile]);

  // Dùng ref để giữ callback onUnauthorized mới nhất mà không cần
  // thêm nó vào dependency array của useCallback/useEffect.
  // Điều này ngăn `refresh` bị tạo lại mỗi khi AppLayout re-render
  // (vì AppLayout truyền () => router.replace("/login") mỗi lần).
  const onUnauthorizedRef = useRef(onUnauthorized);
  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  const scheduleProfileSave = useCallback(() => {
    if (profileSaveTimerRef.current) clearTimeout(profileSaveTimerRef.current);
    profileSaveTimerRef.current = setTimeout(() => {
      profileSaveTimerRef.current = null;
      api.updateProfile(pendingProfileRef.current).catch(() => {});
    }, PROFILE_SAVE_DEBOUNCE_MS);
  }, []);

  /** Load toàn bộ state từ API (gọi khi mở app hoặc bấm "Thử lại") */
  const refresh = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await api.getState();
      dispatch({ type: "SET_STATE", payload: data });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearAuthStorage();
        onUnauthorizedRef.current?.();
        return;
      }
      const message =
        e instanceof Error ? e.message : "Không kết nối được server";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []); // deps rỗng – dùng ref để đọc onUnauthorized mới nhất

  // Load dữ liệu lần đầu khi mount.
  // Dùng AbortController để hủy request ở cấp network khi React
  // Strict Mode unmount component (cleanup). Nhờ đó lần double-invoke
  // thứ 1 bị hủy, chỉ lần 2 thực sự chạy → tránh double-redirect/clear.
  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await api.getState(controller.signal);
        dispatch({ type: "SET_STATE", payload: data });
      } catch (e) {
        // Bỏ qua nếu request bị huỷ chủ động (Strict Mode cleanup)
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          clearAuthStorage();
          onUnauthorizedRef.current?.();
          return;
        }
        const message =
          e instanceof Error ? e.message : "Không kết nối được server";
        setError(message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    // Cleanup: huỷ fetch đang chờ → Strict Mode double-invoke an toàn
    return () => controller.abort();
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    onUnauthorizedRef.current?.();
  }, []);

  const getSubject = (id: string) => state.subjects.find((s) => s.id === id);

  /** CRUD Profile: cập nhật state ngay (UI mượt), gọi API sau 5s (debounce, giảm tải server) */
  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    const merged = { ...pendingProfileRef.current, ...data };
    pendingProfileRef.current = merged;
    dispatch({ type: "UPDATE_PROFILE", payload: data });
    scheduleProfileSave();
  }, [scheduleProfileSave]);

  /** CRUD Môn học: thêm môn */
  const addSubject = useCallback(async (subject: Omit<Subject, "id">) => {
    const created = await api.createSubject(subject);
    dispatch({ type: "ADD_SUBJECT", payload: created });
  }, []);

  /** CRUD Môn học: xóa môn */
  const deleteSubject = useCallback(async (id: string) => {
    await api.deleteSubject(id);
    dispatch({ type: "DELETE_SUBJECT", payload: id });
  }, []);

  /** CRUD TKB: thêm tiết */
  const addTimetableSlot = useCallback(async (slot: Omit<TimetableSlot, "id">) => {
    const created = await api.createTimetableSlot(slot);
    dispatch({ type: "ADD_TIMETABLE_SLOT", payload: created });
  }, []);

  /** CRUD TKB: xóa tiết */
  const deleteTimetableSlot = useCallback(async (id: string) => {
    await api.deleteTimetableSlot(id);
    dispatch({ type: "DELETE_TIMETABLE_SLOT", payload: id });
  }, []);

  /** CRUD Việc cần làm: thêm */
  const addDailyTask = useCallback(async (task: Omit<DailyTask, "id">) => {
    const created = await api.createDailyTask(task);
    dispatch({ type: "ADD_DAILY_TASK", payload: created });
  }, []);

  /** CRUD Việc cần làm: đánh dấu hoàn thành/chưa */
  const toggleDailyTask = useCallback(async (id: string) => {
    const updated = await api.toggleDailyTask(id);
    if (updated) dispatch({ type: "TOGGLE_DAILY_TASK", payload: id });
  }, []);

  /** CRUD Việc cần làm: xóa */
  const deleteDailyTask = useCallback(async (id: string) => {
    await api.deleteDailyTask(id);
    dispatch({ type: "DELETE_DAILY_TASK", payload: id });
  }, []);

  /** CRUD Lịch học tự đặt: thêm */
  const addStudySchedule = useCallback(async (schedule: Omit<StudySchedule, "id">) => {
    const created = await api.createStudySchedule(schedule);
    dispatch({ type: "ADD_STUDY_SCHEDULE", payload: created });
  }, []);

  /** CRUD Lịch học tự đặt: đánh dấu hoàn thành/chưa */
  const toggleStudySchedule = useCallback(async (id: string) => {
    const updated = await api.toggleStudySchedule(id);
    if (updated) dispatch({ type: "TOGGLE_STUDY_SCHEDULE", payload: id });
  }, []);

  /** CRUD Lịch học tự đặt: xóa */
  const deleteStudySchedule = useCallback(async (id: string) => {
    await api.deleteStudySchedule(id);
    dispatch({ type: "DELETE_STUDY_SCHEDULE", payload: id });
  }, []);

  /** Nhiệm vụ học tập: chỉ toggle hoàn thành (danh sách từ API) */
  const toggleStudyTask = useCallback(async (id: string) => {
    const updated = await api.toggleStudyTask(id);
    if (updated) dispatch({ type: "TOGGLE_STUDY_TASK", payload: id });
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        loading,
        error,
        refresh,
        logout,
        getSubject,
        updateProfile,
        addSubject,
        deleteSubject,
        addTimetableSlot,
        deleteTimetableSlot,
        addDailyTask,
        toggleDailyTask,
        deleteDailyTask,
        addStudySchedule,
        toggleStudySchedule,
        deleteStudySchedule,
        toggleStudyTask,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
