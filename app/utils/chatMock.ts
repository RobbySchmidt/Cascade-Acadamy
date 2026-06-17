// Static mock data for the Profile Live-Chat (Phase 5d).
// No realtime, no persistence — purely presentational sample data.

export interface ChatUser {
  id: string
  name: string
  initials: string
  color: string // hex for the avatar background
  courseTag: string // short course label, e.g. 'CSS-Gr.'
  mentor?: boolean
  isMe?: boolean
}

export interface ChatMessage {
  id: string
  author: string
  initials: string
  color: string
  kind: 'incoming' | 'own' | 'mentor'
  text: string
  code?: boolean
}

// Pleasant, soft avatar colours (oranges / violets / teals / blues).
const C = {
  orange: '#F0A868',
  peach: '#F3B58D',
  violet: '#9B8CE0',
  lilac: '#B6A7E8',
  teal: '#3FBDAE',
  tealDark: '#0E7A70',
  mint: '#6FCBB6',
  blue: '#7FA9E6',
  rose: '#E69BB4',
  amber: '#E8B95C',
  sky: '#79C4DE',
  green: '#7BC48A',
}

// "Alle" filter — ~14 online learners (at least one mentor).
export const onlineAll: ChatUser[] = [
  { id: 'lena', name: 'Lena M.', initials: 'LM', color: C.orange, courseTag: 'CSS-Gr.' },
  { id: 'sara', name: 'Sara P.', initials: 'SP', color: C.rose, courseTag: 'CSS-Gr.' },
  { id: 'mira', name: 'Mira S.', initials: 'MS', color: C.violet, courseTag: 'CSS-Gr.' },
  { id: 'jonas', name: 'Jonas', initials: 'Jo', color: C.teal, courseTag: 'Mentor', mentor: true },
  { id: 'tim', name: 'Tim R.', initials: 'TR', color: C.blue, courseTag: 'Flexbox' },
  { id: 'anna', name: 'Anna B.', initials: 'AB', color: C.lilac, courseTag: 'Flexbox' },
  { id: 'paul', name: 'Paul K.', initials: 'PK', color: C.amber, courseTag: 'CSS-Gr.' },
  { id: 'nora', name: 'Nora W.', initials: 'NW', color: C.mint, courseTag: 'Animat.' },
  { id: 'felix', name: 'Felix D.', initials: 'FD', color: C.peach, courseTag: 'CSS-Gr.' },
  { id: 'eva', name: 'Eva L.', initials: 'EL', color: C.sky, courseTag: 'Flexbox' },
  { id: 'lukas', name: 'Lukas H.', initials: 'LH', color: C.green, courseTag: 'CSS-Gr.' },
  { id: 'maja', name: 'Maja T.', initials: 'MT', color: C.violet, courseTag: 'Animat.' },
  { id: 'ben', name: 'Ben S.', initials: 'BS', color: C.orange, courseTag: 'CSS-Gr.' },
  { id: 'clara', name: 'Clara V.', initials: 'CV', color: C.rose, courseTag: 'Mentor', mentor: true },
]

// "Mein Kurs" filter — ~5 learners in CSS-Grundlagen (one mentor).
// The "Du" row is prepended by the component using the real current user.
export const onlineCourse: ChatUser[] = [
  { id: 'lena', name: 'Lena M.', initials: 'LM', color: C.orange, courseTag: 'CSS-Gr.' },
  { id: 'sara', name: 'Sara P.', initials: 'SP', color: C.rose, courseTag: 'CSS-Gr.' },
  { id: 'mira', name: 'Mira S.', initials: 'MS', color: C.violet, courseTag: 'CSS-Gr.' },
  { id: 'jonas', name: 'Jonas', initials: 'Jo', color: C.teal, courseTag: 'Mentor', mentor: true },
]

// Thread for "Heute".
export const messages: ChatMessage[] = [
  {
    id: 'm1',
    author: 'Lena M.',
    initials: 'LM',
    color: C.orange,
    kind: 'incoming',
    text: 'Wie zentriere ich den Text nochmal?',
  },
  {
    id: 'm2',
    author: 'Sara P.',
    initials: 'SP',
    color: C.rose,
    kind: 'incoming',
    text: 'text-align: center;',
    code: true,
  },
  {
    id: 'm3',
    author: 'Du',
    initials: 'MK',
    color: '#0E7A70',
    kind: 'own',
    text: 'ah, danke euch!',
  },
  {
    id: 'm4',
    author: 'Jonas · Mentor',
    initials: 'Jo',
    color: C.teal,
    kind: 'mentor',
    text: 'Tipp: schau dir Lektion 2.1 nochmal an — da ist es erklärt.',
  },
]
