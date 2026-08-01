import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom WebSocket hook with auto-reconnect and exponential backoff.
 *
 * @param {string} url - WebSocket URL (e.g., ws://localhost:8000/ws/donors/)
 * @param {object} options
 * @param {function} options.onMessage - Callback fired with parsed JSON on each message
 * @param {number}   options.maxRetries - Max reconnect attempts (default: 20)
 * @param {number}   options.baseDelay  - Base delay in ms for backoff (default: 1000)
 *
 * @returns {{ isConnected: boolean, sendMessage: function }}
 */
export default function useWebSocket(url, { onMessage, maxRetries = 20, baseDelay = 1000 } = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const retriesRef = useRef(0);
  const onMessageRef = useRef(onMessage);
  const reconnectTimerRef = useRef(null);

  // Keep onMessage callback ref up-to-date without re-triggering effect
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected to', url);
      setIsConnected(true);
      retriesRef.current = 0; // Reset retries on successful connect
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current?.(data);
      } catch (err) {
        console.error('[WS] Failed to parse message:', err);
      }
    };

    ws.onclose = (event) => {
      console.log('[WS] Disconnected. Code:', event.code);
      setIsConnected(false);
      wsRef.current = null;

      // Auto-reconnect with exponential backoff
      if (retriesRef.current < maxRetries) {
        const delay = Math.min(baseDelay * Math.pow(2, retriesRef.current), 30000);
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${retriesRef.current + 1}/${maxRetries})`);
        reconnectTimerRef.current = setTimeout(() => {
          retriesRef.current += 1;
          connect();
        }, delay);
      } else {
        console.error('[WS] Max reconnect attempts reached.');
      }
    };

    ws.onerror = (error) => {
      console.error('[WS] Error:', error);
    };
  }, [url, maxRetries, baseDelay]);

  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { isConnected, sendMessage };
}
