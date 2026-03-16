/**
 * Hằng số dùng chung – không chứa mock data.
 */

/** Thứ trong tuần (T2 = Thứ Hai) */
export const DAYS_OF_WEEK = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

/**
 * Lấy danh sách sự kiện (kỳ thi + deadline) trong tháng để hiển thị lịch.
 * @param assignments – danh sách bài tập từ API
 * @param exams – danh sách kỳ thi từ API
 * @param year – năm (vd: 2026)
 * @param month – tháng 0-11 (vd: 2 = tháng 3)
 */
export function getCalendarEventsForMonth(
  assignments: { deadline: string; title: string }[],
  exams: { date: string; title: string }[],
  year: number,
  month: number
): { date: number; type: "exam" | "deadline"; title: string }[] {
  const events: { date: number; type: "exam" | "deadline"; title: string }[] = [];

  exams.forEach((exam) => {
    const d = new Date(exam.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      events.push({ date: d.getDate(), type: "exam", title: exam.title });
    }
  });

  assignments.forEach((a) => {
    const d = new Date(a.deadline);
    if (d.getMonth() === month && d.getFullYear() === year) {
      events.push({ date: d.getDate(), type: "deadline", title: a.title });
    }
  });

  return events;
}
