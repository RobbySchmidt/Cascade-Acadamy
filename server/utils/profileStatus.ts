// Pure derivation of a user's per-course status from their "done" progress counts
// and the courses' lesson totals. No DOM / no network — unit-tested in isolation.

export interface CourseMeta { slug: string; title: string }

export interface CourseStatus {
  slug: string
  title: string
  done: number
  total: number
  percent: number
  status: 'begonnen' | 'abgeschlossen'
}

/**
 * @param doneByCourse  courseId -> number of lessons the user has completed
 * @param totalByCourse courseId -> total number of lessons in that course
 * @param courseMeta    courseId -> { slug, title }
 * Returns only courses the user has any progress in, completed first.
 */
export function deriveCourseStatus(
  doneByCourse: Record<string, number>,
  totalByCourse: Record<string, number>,
  courseMeta: Record<string, CourseMeta>,
): CourseStatus[] {
  const list = Object.keys(doneByCourse).map((cid) => {
    const done = doneByCourse[cid] ?? 0
    const total = totalByCourse[cid] ?? 0
    const percent = total > 0 ? Math.round((done / total) * 100) : 0
    const status: CourseStatus['status'] = total > 0 && done >= total ? 'abgeschlossen' : 'begonnen'
    const meta = courseMeta[cid] ?? { slug: '', title: '' }
    return { slug: meta.slug, title: meta.title, done, total, percent, status }
  })

  // Completed courses first, then by progress descending.
  return list.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'abgeschlossen' ? -1 : 1
    return b.percent - a.percent
  })
}
