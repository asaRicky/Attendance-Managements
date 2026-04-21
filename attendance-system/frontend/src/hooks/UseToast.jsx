import { useState, useCallback } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])
  const toast = useCallback((msg, type = 'ok') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3800)
  }, [])
  return { toasts, toast }
}

export function Toasts({ toasts }) {
  return (
    <div className="toast-rack">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">{t.type === 'ok' ? '✓' : '✕'}</span>
          {t.msg}
        </div>
      ))}
    </div>
  )
}