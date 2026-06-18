// Public-ish profile preview for the chat: a user's identity + per-course status
// (begonnen / abgeschlossen) derived from their progress. No password/email.

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const api = directus(event)

  const userRes = await api<{ data: any }>(`/items/cascade_users/${id}`, {
    params: { fields: 'id,display_name,avatar_initials,started_at' },
  })
  const user = userRes.data
  if (!user) throw createError({ statusCode: 404, statusMessage: 'User nicht gefunden' })

  // Completed-lesson counts per course for this user.
  const progRes = await api<{ data: any[] }>('/items/cascade_progress', {
    params: {
      filter: JSON.stringify({ user: { _eq: id }, status: { _eq: 'done' } }),
      fields: 'course',
      limit: -1,
    },
  })
  const doneByCourse: Record<string, number> = {}
  for (const r of progRes.data ?? []) {
    const cid = typeof r.course === 'object' && r.course ? r.course.id : r.course
    if (cid != null) {
      const key = String(cid)
      doneByCourse[key] = (doneByCourse[key] ?? 0) + 1
    }
  }

  const courseIds = Object.keys(doneByCourse)
  let courses: ReturnType<typeof deriveCourseStatus> = []

  if (courseIds.length) {
    // Course meta.
    const courseMeta: Record<string, { slug: string; title: string }> = {}
    const cRes = await api<{ data: any[] }>('/items/cascade_courses', {
      params: {
        filter: JSON.stringify({ id: { _in: courseIds } }),
        fields: 'id,slug,title',
        limit: -1,
      },
    })
    for (const c of cRes.data ?? []) {
      courseMeta[String(c.id)] = { slug: c.slug, title: c.title }
    }

    // Total lessons per course (count of all lessons in those courses).
    const totalByCourse: Record<string, number> = {}
    const lRes = await api<{ data: any[] }>('/items/cascade_lessons', {
      params: {
        filter: JSON.stringify({ course: { _in: courseIds } }),
        fields: 'course',
        limit: -1,
      },
    })
    for (const l of lRes.data ?? []) {
      const cid = typeof l.course === 'object' && l.course ? l.course.id : l.course
      if (cid != null) {
        const key = String(cid)
        totalByCourse[key] = (totalByCourse[key] ?? 0) + 1
      }
    }

    courses = deriveCourseStatus(doneByCourse, totalByCourse, courseMeta)
  }

  return {
    id: String(user.id),
    display_name: user.display_name,
    avatar_initials: user.avatar_initials,
    started_at: user.started_at ?? null,
    courses,
  }
})
