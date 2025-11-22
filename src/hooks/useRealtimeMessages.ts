"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccessToken } from "@/lib/auth";
import { API_URL } from "@/lib/api";

interface RealtimeMessage {
  id: number;
  thread_id: number;
  sender_id: number;
  sender_type: "patient" | "provider" | "system";
  content: string;
  status: "sent" | "delivered" | "read";
  created_at: string;
  read_at?: string;
  attachments?: Array<{
    name: string;
    type: string;
    url: string;
    size: number;
  }>;
  medical_context?: {
    type: string;
    reference_id?: string;
  };
}

interface ThreadUpdate {
  thread_id: number;
  thread: {
    id: number;
    patient_id: number;
    provider_id: number;
    topic?: string;
    is_urgent: boolean;
    is_archived: boolean;
    last_message_at?: string;
    last_message?: string;
    unread_count: number;
  };
}

type MessageCallback = (message: RealtimeMessage) => void;
type ThreadUpdateCallback = (update: ThreadUpdate) => void;
type MessageReadCallback = (threadId: number, messageId: number) => void;

export function useRealtimeMessages(
  onNewMessage?: MessageCallback,
  onThreadUpdate?: ThreadUpdateCallback,
  onMessageRead?: MessageReadCallback
) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedThreadsRef = useRef<Set<number>>(new Set());
  const connection_accepted = useRef(false);

  const connect = useCallback(() => {
    if (!user?.clinic_id || !user?.id || wsRef.current?.readyState === WebSocket.OPEN) return;

    // Get backend URL
    const apiUrl = API_URL || 'http://localhost:8000';
    const wsProtocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
    const wsHost = apiUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const token = getAccessToken();
    
    // Build WebSocket URL with query parameters
    const wsUrl = `${wsProtocol}//${wsHost}/ws/messages?clinic_id=${user.clinic_id}&user_id=${user.id}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
    
    try {
      // Close existing connection if any
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close();
      }
      
      console.log("Connecting to WebSocket:", wsUrl.replace(/token=[^&]*/, 'token=***'));
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        connection_accepted.current = true;
        console.log("Messages WebSocket connected");
        
        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        // Set up ping interval (every 30 seconds)
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
        
        // Re-subscribe to previously subscribed threads
        subscribedThreadsRef.current.forEach(threadId => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: "subscribe_thread",
              thread_id: threadId
            }));
          }
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case "connected":
              console.log("Messages WebSocket connected:", message);
              break;
            case "pong":
              // Keep-alive response
              break;
            case "new_message":
              if (onNewMessage && message.message) {
                onNewMessage(message.message);
              }
              break;
            case "message_read":
              if (onMessageRead && message.thread_id && message.message_id) {
                onMessageRead(message.thread_id, message.message_id);
              }
              break;
            case "thread_update":
            case "thread_updated":
              if (onThreadUpdate && message.thread) {
                onThreadUpdate({
                  thread_id: message.thread_id,
                  thread: message.thread
                });
              }
              break;
            case "subscribed":
            case "unsubscribed":
              // Confirmation messages, no action needed
              break;
            case "error":
              console.error("WebSocket error:", message.message);
              break;
            default:
              console.log("Unknown WebSocket message type:", message.type);
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      ws.onerror = (error) => {
        // Only log error if connection hasn't been established yet
        // Errors during connection are normal and will be handled by onclose
        if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.CLOSED) {
          console.warn("Messages WebSocket connection error (this is normal during initial connection):", {
            readyState: ws.readyState,
            url: wsUrl.replace(/token=[^&]*/, 'token=***')
          });
        } else {
          console.error("Messages WebSocket error:", error);
        }
        setConnected(false);
      };

      ws.onclose = (event) => {
        const wasConnected = connection_accepted.current;
        setConnected(false);
        connection_accepted.current = false;
        
        // Only log disconnection if we were previously connected
        if (wasConnected) {
          console.log("Messages WebSocket disconnected:", {
            code: event.code,
            reason: event.reason || "No reason provided",
            wasClean: event.wasClean,
            readyState: ws.readyState
          });
        }
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        // Don't reconnect if it was a clean close or authentication error
        if (event.code === 4401 || event.code === 4403) {
          console.error("WebSocket authentication failed, not reconnecting");
          return;
        }
        
        // If connection failed immediately (code 1006 = abnormal closure)
        if (event.code === 1006 && !wasConnected) {
          // Silent retry for initial connection failures
          // This is normal during page load or server restart
        } else if (event.code === 1006 && wasConnected) {
          // Connection was established but then closed abnormally
          console.warn("WebSocket connection lost abnormally (code 1006). Will attempt to reconnect.");
        }
        
        // Reconnect after 3 seconds for other errors (but not for auth errors)
        if (event.code !== 4401 && event.code !== 4403) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!wasConnected) {
              console.log("Retrying WebSocket connection...");
            } else {
              console.log("Reconnecting WebSocket...");
            }
            connect();
          }, 3000);
        }
      };
    } catch (error) {
      console.error("Error creating Messages WebSocket:", error);
      setConnected(false);
    }
  }, [user?.clinic_id, user?.id, onNewMessage, onThreadUpdate, onMessageRead]);

  const subscribeToThread = useCallback((threadId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "subscribe_thread",
        thread_id: threadId
      }));
      subscribedThreadsRef.current.add(threadId);
    } else {
      // If not connected yet, just add to set - will subscribe on connect
      subscribedThreadsRef.current.add(threadId);
    }
  }, []);

  const unsubscribeFromThread = useCallback((threadId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "unsubscribe_thread",
        thread_id: threadId
      }));
    }
    subscribedThreadsRef.current.delete(threadId);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [connect]);

  return {
    connected,
    subscribeToThread,
    unsubscribeFromThread
  };
}

