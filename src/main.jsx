import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { tap } from '../netlify/functions/utils/util.js'

window.tap = tap

createRoot(document.getElementById('root')).render(
    <App />
)
