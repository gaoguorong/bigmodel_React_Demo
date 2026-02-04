import ChatPage from './components/ChatPage'
import { ConfigProvider } from 'antd'

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#10a37f'
        }
      }}
    >
      <ChatPage />
    </ConfigProvider>
  )
}
