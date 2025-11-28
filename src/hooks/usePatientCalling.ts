"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";

interface PatientCall {
  id: number;
  appointment_id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  clinic_id: number;
  status: "called" | "answered" | "completed";
  called_at: string;
}

type Callback = (call: PatientCall) => void;

export function usePatientCalling(onCallReceived?: Callback, onCallRemoved?: (appointmentId: number) => void) {
  const { user } = useAuth();
  const [activeCalls, setActiveCalls] = useState<PatientCall[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!user?.clinic_id) {
      console.warn("Cannot connect WebSocket: user or clinic_id is missing");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Get backend URL from API_URL
    // Remove /api/v1 or any path suffix for WebSocket connection
    let apiUrl = API_URL || 'http://localhost:8000';
    
    // Remove trailing slashes and any API path prefixes
    apiUrl = apiUrl.replace(/\/$/, '').replace(/\/api\/v\d+$/, '').replace(/\/api$/, '');
    
    const wsProtocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
    const wsHost = apiUrl.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}//${wsHost}/ws/patient-calling/${user.clinic_id}`;
    
    console.log(`Attempting to connect WebSocket to: ${wsUrl}`);
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        console.log("WebSocket connected successfully to:", wsUrl);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case "active_calls":
              setActiveCalls(message.data || []);
              break;
            case "patient_called":
              const newCall = message.data;
              setActiveCalls((prev) => {
                const filtered = prev.filter((c) => c.appointment_id !== newCall.appointment_id);
                return [...filtered, newCall];
              });
              if (onCallReceived) onCallReceived(newCall);
              break;
            case "call_status_updated":
              setActiveCalls((prev) =>
                prev.map((c) =>
                  c.appointment_id === message.data.appointment_id
                    ? { ...c, status: message.data.status }
                    : c
                )
              );
              break;
            case "call_removed":
              setActiveCalls((prev) =>
                prev.filter((c) => c.appointment_id !== message.data.appointment_id)
              );
              if (onCallRemoved) onCallRemoved(message.data.appointment_id);
              break;
            case "pong":
              // Heartbeat response, no action needed
              break;
            default:
              console.warn("Unknown WebSocket message type:", message.type);
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e, "Raw data:", event.data);
        }
      };

      ws.onerror = (error) => {
        // WebSocket error events don't provide detailed error info in the error object
        // Check the readyState to determine what happened
        const readyState = ws.readyState;
        const readyStateText = 
          readyState === WebSocket.CONNECTING ? 'CONNECTING' :
          readyState === WebSocket.OPEN ? 'OPEN' :
          readyState === WebSocket.CLOSING ? 'CLOSING' :
          readyState === WebSocket.CLOSED ? 'CLOSED' : 'UNKNOWN';
        
        // Only log if it's a real error (not just a connection attempt)
        if (readyState === WebSocket.CLOSED) {
          console.warn("WebSocket connection failed:", {
            url: wsUrl,
            readyState: readyStateText,
            message: "Failed to establish WebSocket connection. Check if backend is running and WebSocket endpoint is accessible.",
          });
        }
        // Don't log empty error objects - they're not useful
        setConnected(false);
      };

      ws.onclose = (event) => {
        setConnected(false);
        
        // Only log non-clean closes (errors)
        if (!event.wasClean && event.code !== 1000) {
          const closeReasons: Record<number, string> = {
            1000: 'Normal closure',
            1001: 'Going away',
            1002: 'Protocol error',
            1003: 'Unsupported data',
            1006: 'Abnormal closure (no close frame)',
            1011: 'Internal server error',
            1012: 'Service restart',
            1013: 'Try again later',
            1014: 'Bad gateway',
            1015: 'TLS handshake failed',
          };
          
          const reason = closeReasons[event.code] || `Unknown (code: ${event.code})`;
          console.warn("WebSocket closed unexpectedly:", {
            code: event.code,
            reason: reason,
            wasClean: event.wasClean,
            url: wsUrl,
            message: event.reason || 'No reason provided',
          });
        } else {
          // Clean close - just log for debugging
          console.log("WebSocket disconnected (clean close)");
        }
        
        // Only reconnect if it wasn't a clean close or intentional disconnect
        if (event.code !== 1000 && event.code !== 1001) {
          console.log("Reconnecting in 3 seconds...");
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      console.error("Failed URL:", wsUrl);
      setConnected(false);
    }
  }, [user?.clinic_id, onCallReceived, onCallRemoved]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { activeCalls, connected };
}

