/**
 * Icon mapper utility
 * Maps icon names from backend to Lucide React icons
 */
import {
  LayoutGrid,
  UsersRound,
  CalendarDays,
  FileText,
  Settings2,
  HeartPulse,
  ClipboardCheck,
  CircleDollarSign,
  ReceiptText,
  Code2,
  Timer,
  Sparkles,
  Package2,
  TrendingUp,
  ShieldCheck,
  Building,
  UserRoundCheck,
  Activity,
  FlaskConical,
  ChartLine,
  Wallet,
  Table2,
  Database,
  UserCog2,
  BellRing,
  Search,
  UserPlus,
  BarChart3,
  PieChart,
  LineChart,
  FileSearch,
  Settings,
  Home,
  Stethoscope,
  Calendar,
  ClipboardList,
  TestTube,
  Pill,
  CreditCard,
  FileCheck,
  History,
  Cog,
  Users,
  LogOut,
  Menu as MenuIcon,
  X,
  ChevronDown,
  ChevronRight,
  UserRound,
} from "lucide-react";

/**
 * Icon name to component mapping
 * Maps backend icon names to Lucide React icon components
 */
const iconMap: Record<string, any> = {
  // Dashboard & Navigation
  'home': Home,
  'layout-grid': LayoutGrid,
  'dashboard': LayoutGrid,
  'menu': MenuIcon,
  
  // Users & People
  'users': UsersRound,
  'users-round': UsersRound,
  'user-round': UserRound,
  'user-round-check': UserRoundCheck,
  'user-plus': UserPlus,
  'user-cog': UserCog2,
  'user-cog-2': UserCog2,
  
  // Calendar & Appointments
  'calendar': CalendarDays,
  'calendar-days': CalendarDays,
  'calendar-check': CalendarDays,
  
  // Medical
  'heart-pulse': HeartPulse,
  'stethoscope': Stethoscope,
  'clipboard-check': ClipboardCheck,
  'clipboard-list': ClipboardList,
  'flask-conical': FlaskConical,
  'test-tube': TestTube,
  'pill': Pill,
  
  // Documents & Files
  'file-text': FileText,
  'file-check': FileCheck,
  'file-search': FileSearch,
  'receipt-text': ReceiptText,
  
  // Financial
  'circle-dollar-sign': CircleDollarSign,
  'wallet': Wallet,
  'credit-card': CreditCard,
  'trending-up': TrendingUp,
  
  // Reports & Analytics
  'chart-line': ChartLine,
  'bar-chart-3': BarChart3,
  'pie-chart': PieChart,
  'line-chart': LineChart,
  'activity': Activity,
  
  // Settings & Configuration
  'settings': Settings,
  'settings-2': Settings2,
  'cog': Cog,
  
  // System & Admin
  'shield-check': ShieldCheck,
  'building': Building,
  'database': Database,
  'code-2': Code2,
  'code': Code2,
  
  // Other
  'package-2': Package2,
  'package': Package2,
  'timer': Timer,
  'sparkles': Sparkles,
  'bell-ring': BellRing,
  'bell': BellRing,
  'search': Search,
  'table-2': Table2,
  'table': Table2,
  'history': History,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  'x': X,
  'log-out': LogOut,
};

/**
 * Get icon component from icon name
 * @param iconName - Icon name from backend (e.g., "home", "users-round")
 * @returns Lucide React icon component or null if not found
 */
export function getIconFromName(iconName?: string | null): any {
  if (!iconName) return LayoutGrid; // Default icon
  
  // Normalize icon name (lowercase, replace spaces/underscores with hyphens)
  const normalized = iconName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-');
  
  return iconMap[normalized] || LayoutGrid; // Fallback to LayoutGrid
}

/**
 * Get all available icon names
 */
export function getAvailableIcons(): string[] {
  return Object.keys(iconMap);
}

