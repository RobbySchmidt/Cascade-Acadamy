export default defineEventHandler(async (event) => {
  const api = directus(event)
  const userId = currentUserId(event)

  const coursesRes = await api<{ data: any[] }>('/items/cascade_courses', {
    params: {
      fields: 'id,title,slug,level,description,status,unlock_hint,sort',
      sort: 'sort',
      limit: -1,
    },
  })
  const courses = coursesRes.data ?? []

  // total lessons per course
  const lessonsRes = await api<{ data: any[] }>('/items/cascade_lessons', {
    params: { fields: 'id,course', limit: -1 },
  })
  const totalByCourse = new Map<number, number>()
  for (const l of lessonsRes.data ?? []) {
    const cid = typeof l.course === 'object' && l.course ? l.course.id : l.course
    totalByCourse.set(cid, (totalByCourse.get(cid) ?? 0) + 1)
  }

  // done lessons per course for current user
  const doneByCourse = new Map<number, number>()
  if (userId) {
    const progRes = await api<{ data: any[] }>('/items/cascade_progress', {
      params: {
        filter: JSON.stringify({ user: { _eq: userId }, status: { _eq: 'done' } }),
        fields: 'lesson,course',
        limit: -1,
      },
    })
    for (const p of progRes.data ?? []) {
      const cid = typeof p.course === 'object' && p.course ? p.course.id : p.course
      doneByCourse.set(cid, (doneByCourse.get(cid) ?? 0) + 1)
    }
  }

  return courses.map((c) => {
    const totalCount = totalByCourse.get(c.id) ?? 0
    const doneCount = doneByCourse.get(c.id) ?? 0
    const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      level: c.level,
      description: c.description,
      status: c.status,
      unlock_hint: c.unlock_hint,
      sort: c.sort,
      doneCount,
      totalCount,
      percent,
    }
  })
})
