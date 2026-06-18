export default defineEventHandler(async (event) => {
  const api = directus(event)
  const id = getRouterParam(event, 'id')

  const lessonRes = await api<{ data: any }>(`/items/cascade_lessons/${id}`, {
    params: {
      fields: 'id,title,type,task,html,css_starter,solution,hint,assertions,sort,chapter,course',
    },
  })
  const lesson = lessonRes.data
  if (!lesson) throw createError({ statusCode: 404, statusMessage: 'Lektion nicht gefunden' })

  const courseId = typeof lesson.course === 'object' && lesson.course ? lesson.course.id : lesson.course
  const chapterId = typeof lesson.chapter === 'object' && lesson.chapter ? lesson.chapter.id : lesson.chapter

  const courseRes = await api<{ data: any }>(`/items/cascade_courses/${courseId}`, {
    params: { fields: 'id,slug,title' },
  })
  const course = courseRes.data

  let chapterTitle: string | null = null
  if (chapterId) {
    const chapterRes = await api<{ data: any }>(`/items/cascade_chapters/${chapterId}`, {
      params: { fields: 'id,title' },
    })
    chapterTitle = chapterRes.data?.title ?? null
  }

  // index within course (sort order, 1-based) + total + next lesson id
  const allRes = await api<{ data: any[] }>('/items/cascade_lessons', {
    params: {
      filter: JSON.stringify({ course: { _eq: courseId } }),
      fields: 'id,sort',
      sort: 'sort',
      limit: -1,
    },
  })
  const all = allRes.data ?? []
  const total = all.length
  const pos = all.findIndex((l) => l.id === lesson.id)
  const index = pos + 1
  const nextLessonId = pos >= 0 && pos + 1 < all.length ? all[pos + 1].id : null
  const prevLessonId = pos > 0 ? all[pos - 1].id : null

  return {
    lesson: { ...lesson, course: courseId, chapter: chapterId },
    courseSlug: course?.slug ?? null,
    courseTitle: course?.title ?? null,
    chapterTitle,
    index,
    total,
    nextLessonId,
    prevLessonId,
  }
})
