import { useEffect, useRef } from 'react'
import type { Message } from '../types/chat'
import MessageItem from './MessageItem'

export default function MessageList({ messages }: { messages: Message[] }) {
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  return (
    <div className="msg-list">
      {messages.map(m => (
        <MessageItem key={m.id} message={m} />
      ))}
      <div ref={endRef} />
    </div>
  )
}
