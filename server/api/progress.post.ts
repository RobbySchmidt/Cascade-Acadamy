export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)
  const { lessonId } = await readBody(event)
  if (!userId) return { guest: true }

  const api = directus(event)

  const existingRes = await api<{ data: any[] }>('/items/cascade_progress', {
    params: {
      filter: JSON.stringify({ user: { _eq: userId }, lesson: { _eq: lessonId } }),
      fields: 'id',
      limit: 1,
    },
  })
  if (existingRes.data?.length) return { ok: true }

  const lessonRes = await api<{ data: any }>(`/items/cascade_lessons/${lessonId}`, {
    params: { fields: 'id,course' },
  })
  const lesson = lessonRes.data
  const courseId = typeof lesson?.course === 'object' && lesson?.course ? lesson.course.id : lesson?.course

  await api('/items/cascade_progress', {
    method: 'POST',
    body: {
      user: userId,
      lesson: lessonId,
      course: courseId,
      status: 'done',
      completed_at: new Date().toISOString(),
    },
  })

  return { ok: true }
})
