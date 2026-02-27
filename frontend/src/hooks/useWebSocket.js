import { useState, useEffect, useRef } from 'react'

export default function useWebSocket(url, onMessage) {
    const [connected, setConnected] = useState(false)
    const [lastMessage, setLastMessage] = useState(null)
    const wsRef = useRef(null)
    const timerRef = useRef(null)
    const cbRef = useRef(onMessage)
    cbRef.current = onMessage

    useEffect(() => {
        let active = true

        function connect() {
            const ws = new WebSocket(url)
            wsRef.current = ws

            ws.onopen = () => {
                if (active) setConnected(true)
            }

            ws.onmessage = (evt) => {
                try {
                    const data = JSON.parse(evt.data)
                    if (active) setLastMessage(data)
                    cbRef.current?.(data)
                } catch {
                    // ignore malformed frames
                }
            }

            ws.onclose = () => {
                if (active) {
                    setConnected(false)
                    timerRef.current = setTimeout(connect, 3000)
                }
            }

            ws.onerror = () => ws.close()
        }

        connect()

        return () => {
            active = false
            clearTimeout(timerRef.current)
            wsRef.current?.close()
        }
    }, [url])

    return { connected, lastMessage }
}
