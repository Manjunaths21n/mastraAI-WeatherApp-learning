import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PromptInputProvider } from '@/components/ai-elements/prompt-input'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PromptInputProvider>
      <App />
    </PromptInputProvider>
  </StrictMode>,
)
