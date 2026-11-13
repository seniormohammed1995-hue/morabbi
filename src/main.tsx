import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { applyFontScale, applyTheme, useUi } from './store/ui'
import { device } from './platform'

const ui = useUi.getState()
applyTheme(ui.theme)
applyFontScale(ui.fontScale)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(useUi.getState().theme))
void device.persistStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
