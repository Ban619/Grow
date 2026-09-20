import React from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/main.css'
import './styles/auth.css'
import './styles/loading.css'
import './styles/modal.css'
import './styles/storage.css'
// legacy rules (kept separate for easier refactor)
import './styles/legacy.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
