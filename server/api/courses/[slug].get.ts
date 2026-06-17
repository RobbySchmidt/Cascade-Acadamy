export default defineEventHandler(async (event) => {
  const api = directus(event)
  const userId = currentUserId(event)
  const slug = getRouterParam(event, 'slug')

  const courseRes = await api<{ data: any[] }>('/items/cascade_courses', {
    params: {
      filter: JSON.stringify({ slug: { _eq: slug } }),
      fields: 'id,title,slug,level,description,status,unlock_hint,sort',
      limit: 1,
    },
  })
  const course = courseRes.data?.[0]
  if (!course) throw createError({ statusCode: 404, statusMessage: 'Kurs nicht gefunden' })

  const chaptersRes = await api<{ data: any[] }>('/items/cascade_chapters', {
    params: {
      filter: JSON.stringify({ course: { _eq: course.id } }),
      fields: 'id,title,sort',
      sort: 'sort',
      limit: -1,
    },
  })
  const chapters = chaptersRes.data ?? []

  const lessonsRes = await api<{ data: any[] }>('/items/cascade_lessons', {
    params: {
      filter: JSON.stringify({ course: { _eq: course.id } }),
      fields: 'id,title,type,sort,chapter',
      sort: 'sort',
      limit: -1,
    },
  })
  const lessons = lessonsRes.data ?? []

  // done lesson ids for this course
  const doneSet = new Set<number>()
  if (userId) {
    const progRes = await api<{ data: any[] }>('/items/cascade_progress', {
      params: {
        filter: JSON.stringify({
          user: { _eq: userId },
          course: { _eq: course.id },
          status: { _eq: 'done' },
        }),
        fields: 'lesson',
        limit: -1,
      },
    })
    for (const p of progRes.data ?? []) {
      const lid = typeof p.lesson === 'object' && p.lesson ? p.lesson.id : p.lesson
      doneSet.add(lid)
    }
  }

  // compute per-lesson status: done / current (first not-done) / locked
  let currentAssigned = false
  const lessonStatus = new Map<number, string>()
  for (const l of lessons) {
    if (doneSet.has(l.id)) {
      lessonStatus.set(l.id, 'done')
    } else if (!currentAssigned) {
      lessonStatus.set(l.id, 'current')
      currentAssigned = true
    } else {
      lessonStatus.set(l.id, 'locked')
    }
  }

  const chapterOut = chapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    sort: ch.sort,
    lessons: lessons
      .filter((l) => {
        const chId = typeof l.chapter === 'object' && l.chapter ? l.chapter.id : l.chapter
        return chId === ch.id
      })
      .map((l) => ({
        id: l.id,
        title: l.title,
        type: l.type,
        sort: l.sort,
        status: lessonStatus.get(l.id),
      })),
  }))

  const totalCount = lessons.length
  const doneCount = doneSet.size
  const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return {
    course: {
      id: course.id,
      title: course.title,
      slug: course.slug,
      level: course.level,
      description: course.description,
      status: course.status,
      unlock_hint: course.unlock_hint,
      sort: course.sort,
      doneCount,
      totalCount,
      percent,
      chapterCount: chapters.length,
    },
    chapters: chapterOut,
  }
})
