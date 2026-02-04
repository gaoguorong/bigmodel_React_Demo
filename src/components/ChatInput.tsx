import { Input, Button, Space } from 'antd'
import { useState } from 'react'

export default function ChatInput({
  onSend,
  loading
}: {
  onSend: (text: string) => void
  loading: boolean
}) {
  const [value, setValue] = useState('')

  const send = () => {
    const next = value
    onSend(next)
    setValue('')
  }

  return (
    <Space className="composer" align="end">
      <Input.TextArea
        value={value}
        autoSize={{ minRows: 1, maxRows: 6 }}
        placeholder="请输入你的问题…"
        onChange={e => setValue(e.target.value)}
        onPressEnter={(e) => {
          if (!e.shiftKey) {
            e.preventDefault()
            send()
          }
        }}
        disabled={loading}
      />
      <Button
        type="primary"
        onClick={send}
        loading={loading}
        disabled={!value.trim()}
      >
        发送
      </Button>
    </Space>
  )
}
