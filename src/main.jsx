import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.tap = x => { console.log(x); return x; }

createRoot(document.getElementById('root')).render(
    <App />
)
