"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface NavigationState {
  currentRoute: string;
  previousRoute: string | null;
  history: string[];
  sidebarOpen: boolean;
}

const NAVIGATION_STATE_KEY = "prontivus_navigation_state";

export function useNavigationState() {
  const pathname = usePathname();
  const [state, setState] = useState<NavigationState>(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(NAVIGATION_STATE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // Invalid stored data, use defaults
        }
      }
    }
    return {
      currentRoute: pathname || "/",
      previousRoute: null,
      history: [pathname || "/"],
      sidebarOpen: true,
    };
  });

  useEffect(() => {
    if (pathname && pathname !== state.currentRoute) {
      setState((prev) => {
        const newState = {
          currentRoute: pathname,
          previousRoute: prev.currentRoute,
          history: [...prev.history, pathname].slice(-10), // Keep last 10 routes
          sidebarOpen: prev.sidebarOpen,
        };

        // Persist to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(newState));
        }

        return newState;
      });
    }
  }, [pathname, state.currentRoute]);

  const toggleSidebar = () => {
    setState((prev) => {
      const newState = { ...prev, sidebarOpen: !prev.sidebarOpen };
      if (typeof window !== "undefined") {
        localStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(newState));
      }
      return newState;
    });
  };

  const goBack = () => {
    if (state.previousRoute) {
      window.history.back();
    }
  };

  return {
    ...state,
    toggleSidebar,
    goBack,
  };
}

