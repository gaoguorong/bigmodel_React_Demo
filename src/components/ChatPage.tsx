import { Button, Dropdown, Input, Layout, List, Modal, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useChatSessions } from '../hooks/useChatSessions'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

const { Sider, Content } = Layout

function formatTime(ts: number) {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export default function ChatPage() {
  const chat = useChatSessions()

  const [renameOpen, setRenameOpen] = useState(false)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const activeTitle = chat.activeSession?.title ?? '新对话'

  const sessionItems = useMemo(() => {
    return chat.sessions.map(s => {
      const last = [...s.messages].reverse().find(m => m.content.trim())
      const snippet = last?.content.trim().slice(0, 36) ?? ''
      return {
        ...s,
        snippet
      }
    })
  }, [chat.sessions])

  return (
    <>
      <Layout className="chat-root">
        <Sider width={280} className="chat-sider">
          <div className="sider-top">
            <Button
              block
              type="default"
              onClick={chat.newSession}
              disabled={chat.loading}
            >
              + 新建聊天
            </Button>
          </div>

          <div className="sider-list">
            <List
              dataSource={sessionItems}
              renderItem={(s) => {
                const isActive = s.id === chat.activeId
                const menuItems = [
                  { key: 'rename', label: '重命名' },
                  { key: 'delete', label: '删除' }
                ]

                return (
                  <List.Item
                    className={isActive ? 'session-item session-item-active' : 'session-item'}
                    onClick={() => chat.setActiveSession(s.id)}
                    actions={[
                      <Dropdown
                        key="more"
                        trigger={['click']}
                        menu={{
                          items: menuItems,
                          onClick: ({ key }) => {
                            if (key === 'rename') {
                              setRenameId(s.id)
                              setRenameValue(s.title)
                              setRenameOpen(true)
                              return
                            }
                            if (key === 'delete') {
                              Modal.confirm({
                                title: '删除该会话？',
                                content: '删除后无法恢复。',
                                okText: '删除',
                                okButtonProps: { danger: true },
                                cancelText: '取消',
                                onOk: () => chat.deleteSession(s.id)
                              })
                            }
                          }
                        }}
                      >
                        <Button
                          type="text"
                          size="small"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⋯
                        </Button>
                      </Dropdown>
                    ]}
                  >
                    <div className="session-main">
                      <div className="session-title">{s.title}</div>
                      <div className="session-sub">
                        <span className="session-time">{formatTime(s.updatedAt)}</span>
                        <span className="session-snippet">{s.snippet}</span>
                      </div>
                    </div>
                  </List.Item>
                )
              }}
            />

            <div className="sider-bottom">
              <Button
                danger
                block
                type="text"
                onClick={() => {
                  Modal.confirm({
                    title: '清空所有历史？',
                    content: '这会删除本地保存的所有会话记录。',
                    okText: '清空',
                    okButtonProps: { danger: true },
                    cancelText: '取消',
                    onOk: () => chat.clearAllSessions()
                  })
                }}
              >
                清空历史
              </Button>
            </div>
          </div>
        </Sider>

        <Layout>
          <Content className="chat-content">
            <div className="chat-topbar">
              <Typography.Text strong>{activeTitle}</Typography.Text>
            </div>

            <div className="chat-scroll">
              {chat.messages.length ? (
                <MessageList messages={chat.messages} />
              ) : (
                <div className="chat-empty">
                  <Typography.Title level={3} style={{ margin: 0 }}>
                    开始一个对话
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    在下方输入问题，历史会自动保存到本地。
                  </Typography.Text>
                </div>
              )}
            </div>

            <div className="chat-composer">
              <div className="composer-inner">
                <ChatInput loading={chat.loading} onSend={chat.sendMessage} />
                <div className="composer-hint">
                  Enter 发送，Shift+Enter 换行
                </div>
              </div>
            </div>
          </Content>
        </Layout>
      </Layout>

      <Modal
        title="重命名会话"
        open={renameOpen}
        okText="保存"
        cancelText="取消"
        onCancel={() => setRenameOpen(false)}
        onOk={() => {
          if (renameId) chat.renameSession(renameId, renameValue)
          setRenameOpen(false)
        }}
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          placeholder="输入会话标题"
          autoFocus
          onPressEnter={() => {
            if (renameId) chat.renameSession(renameId, renameValue)
            setRenameOpen(false)
          }}
        />
      </Modal>
    </>
  )
}
