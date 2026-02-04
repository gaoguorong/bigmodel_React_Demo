import { useState, useRef } from 'react'

/** 消息结构 */
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

let idCounter = 0
const genId = () => String(++idCounter)

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  const sendMessage = (text: string) => {
    if (!text.trim() || loading) return

    // 1️⃣ 用户消息
    const userMsg: Message = {
      id: genId(),
      role: 'user',
      content: text
    }

    // 2️⃣ 预创建一个 assistant 消息（后面不断 append）
    const assistantId = genId()

    setMessages(prev => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '' }
    ])

    setLoading(true)

    // 如果之前还有 SSE 连接，先关掉
    if (esRef.current) {
      esRef.current.close()
    }

    // 3️⃣ 建立 SSE 连接（GET）
    const es = new EventSource(
      `http://127.0.0.1:8000/chat/stream?message=${encodeURIComponent(text)}`
    )

    esRef.current = es

    // 4️⃣ 连接成功
    es.onopen = () => {
      console.log('SSE opened')
    }

    // 5️⃣ 接收流式数据
    es.onmessage = (e) => {
      console.log('SSE message:', e.data)

      if (e.data === '[DONE]') {
        es.close()
        setLoading(false)
        return
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: m.content + e.data }
            : m
        )
      )
    }

    // 6️⃣ 异常处理
    es.onerror = (err) => {
      console.error('SSE error', err)
      es.close()
      setLoading(false)
    }
  }

  return {
    messages,
    loading,
    sendMessage
  }
}
