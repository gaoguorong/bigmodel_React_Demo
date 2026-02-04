import { Typography } from 'antd'
import type { Message } from '../types/chat'

export default function MessageItem({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={isUser ? 'msg-row msg-row-user' : 'msg-row msg-row-assistant'}>
      <div className={isUser ? 'msg-bubble msg-bubble-user' : 'msg-bubble msg-bubble-assistant'}>
        <Typography.Paragraph className="msg-text">
          {message.content || (isUser ? '' : '…')}
        </Typography.Paragraph>
      </div>
    </div>
  )
}
