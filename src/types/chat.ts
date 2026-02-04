export type ChatRole = 'user' | 'assistant'

export interface Message {
  id: string
  role: ChatRole
  content: string
  createdAt: number
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

