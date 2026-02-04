import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChatSession, Message } from '../types/chat'

type StoredStateV1 = {
  activeId: string | null
  sessions: ChatSession[]
}

const STORAGE_KEY = 'llm_chat_sessions_v1'

function now() {
  return Date.now()
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function genId() {
  // crypto.randomUUID is available in modern browsers; fallback for safety.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${now()}_${Math.random().toString(16).slice(2)}`
}

function defaultSession(): ChatSession {
  const t = now()
  return {
    id: genId(),
    title: '新对话',
    messages: [],
    createdAt: t,
    updatedAt: t
  }
}

function clampTitleFromText(text: string) {
  const t = text.trim().replace(/\s+/g, ' ')
  if (!t) return '新对话'
  return t.length > 24 ? `${t.slice(0, 24)}…` : t
}

function touchSession(s: ChatSession): ChatSession {
  const t = now()
  return { ...s, updatedAt: t }
}

function upsertSession(
  sessions: ChatSession[],
  id: string,
  updater: (s: ChatSession) => ChatSession
) {
  return sessions.map(s => (s.id === id ? updater(s) : s))
}

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  // load
  useEffect(() => {
    const stored = safeJsonParse<StoredStateV1>(localStorage.getItem(STORAGE_KEY))
    if (stored?.sessions?.length) {
      setSessions(stored.sessions)
      const nextActive =
        stored.activeId && stored.sessions.some(s => s.id === stored.activeId)
          ? stored.activeId
          : stored.sessions[0].id
      setActiveId(nextActive)
      return
    }

    const s = defaultSession()
    setSessions([s])
    setActiveId(s.id)
  }, [])

  // persist
  useEffect(() => {
    if (!sessions.length) return
    const state: StoredStateV1 = { activeId, sessions }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore quota / private mode errors
    }
  }, [sessions, activeId])

  // cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (esRef.current) esRef.current.close()
    }
  }, [])

  const activeSession = useMemo(
    () => sessions.find(s => s.id === activeId) ?? null,
    [sessions, activeId]
  )

  const orderedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [sessions])

  const newSession = () => {
    const s = defaultSession()
    setSessions(prev => [s, ...prev])
    setActiveId(s.id)
  }

  const renameSession = (id: string, title: string) => {
    const t = title.trim() || '新对话'
    setSessions(prev =>
      upsertSession(prev, id, s => ({ ...touchSession(s), title: t }))
    )
  }

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      if (!next.length) {
        const s = defaultSession()
        setActiveId(s.id)
        return [s]
      }
      if (activeId === id) {
        setActiveId(next[0].id)
      }
      return next
    })
  }

  const clearAllSessions = () => {
    const s = defaultSession()
    setSessions([s])
    setActiveId(s.id)
  }

  const setActiveSession = (id: string) => {
    setActiveId(id)
  }

  const sendMessage = (text: string) => {
    if (!text.trim() || loading) return
    if (!activeId) {
      const s = defaultSession()
      setSessions([s])
      setActiveId(s.id)
      return
    }

    const t = now()
    const userMsg: Message = {
      id: genId(),
      role: 'user',
      content: text,
      createdAt: t
    }

    const assistantId = genId()
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: t
    }

    setSessions(prev =>
      upsertSession(prev, activeId, s => {
        const nextTitle =
          s.title === '新对话' ? clampTitleFromText(text) : s.title
        return touchSession({
          ...s,
          title: nextTitle,
          messages: [...s.messages, userMsg, assistantMsg]
        })
      })
    )

    setLoading(true)

    if (esRef.current) esRef.current.close()

    const es = new EventSource(
      `http://127.0.0.1:8000/chat/stream?message=${encodeURIComponent(text)}`
    )
    esRef.current = es

    es.onmessage = (e) => {
      if (e.data === '[DONE]') {
        es.close()
        setLoading(false)
        return
      }

      setSessions(prev =>
        upsertSession(prev, activeId, s => {
          const nextMessages = s.messages.map(m =>
            m.id === assistantId ? { ...m, content: m.content + e.data } : m
          )
          return touchSession({ ...s, messages: nextMessages })
        })
      )
    }

    es.onerror = () => {
      es.close()
      setLoading(false)
    }
  }

  return {
    sessions: orderedSessions,
    activeId,
    activeSession,
    messages: activeSession?.messages ?? [],
    loading,
    newSession,
    renameSession,
    deleteSession,
    clearAllSessions,
    setActiveSession,
    sendMessage
  }
}

