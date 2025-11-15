"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Calendar, CalendarRange, Clock, User, Stethoscope, RefreshCw, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, getWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: number;
  scheduled_datetime: string;
  status: string;
  appointment_type: string | null;
  patient_id: number;
  doctor_id: number;
  patient_name: string;
  doctor_name: string;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  checked_in: "bg-yellow-100 text-yellow-800",
  in_consultation: "bg-purple-100 text-purple-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-orange-100 text-orange-800",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  checked_in: "Check-in",
  in_consultation: "Em Consulta",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não Compareceu",
};

export default function AgendamentosPage() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("day");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAppointments();
  }, [selectedDate, activeTab]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, statusFilter, searchTerm, activeTab, selectedDate]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on active tab
      let startDate: Date;
      let endDate: Date;
      
      if (activeTab === "day") {
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (activeTab === "week") {
        startDate = startOfWeek(selectedDate, { locale: ptBR });
        endDate = endOfWeek(selectedDate, { locale: ptBR });
      } else {
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
      }
      
      // Build query params
      const params = new URLSearchParams({
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
      });
      
      // Use doctor-specific endpoint that automatically filters by current doctor
      const data = await api.get<Appointment[]>(`/api/v1/appointments/doctor/my-appointments?${params.toString()}`);
      
      // Sort by scheduled_datetime
      const sorted = [...data].sort((a, b) => {
        const dateA = parseISO(a.scheduled_datetime);
        const dateB = parseISO(b.scheduled_datetime);
        return dateA.getTime() - dateB.getTime();
      });
      
      setAppointments(sorted);
    } catch (error: any) {
      console.error("Failed to load appointments:", error);
      toast.error("Erro ao carregar agendamentos", {
        description: error?.message || error?.detail || "Não foi possível carregar os agendamentos",
      });
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.patient_name.toLowerCase().includes(search) ||
        apt.appointment_type?.toLowerCase().includes(search)
      );
    }
    
    // Filter by date for day view
    if (activeTab === "day") {
      const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
      filtered = filtered.filter(apt => {
        const aptDate = format(parseISO(apt.scheduled_datetime), "yyyy-MM-dd");
        return aptDate === selectedDateStr;
      });
    }
    
    setFilteredAppointments(filtered);
  };

  const getStatusBadge = (status: string) => {
    const colorClass = STATUS_COLORS[status.toLowerCase()] || "bg-gray-100 text-gray-800";
    const label = STATUS_LABELS[status.toLowerCase()] || status;
    return <Badge className={colorClass}>{label}</Badge>;
  };

  const getDayAppointments = () => {
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    return filteredAppointments.filter(apt => {
      const aptDate = format(parseISO(apt.scheduled_datetime), "yyyy-MM-dd");
      return aptDate === selectedDateStr;
    });
  };

  const getWeekAppointments = () => {
    const weekStart = startOfWeek(selectedDate, { locale: ptBR });
    const weekEnd = endOfWeek(selectedDate, { locale: ptBR });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayAppointments = filteredAppointments.filter(apt => {
        const aptDate = format(parseISO(apt.scheduled_datetime), "yyyy-MM-dd");
        return aptDate === dayStr;
      });
      
      return {
        date: format(day, "EEEE", { locale: ptBR }),
        dateObj: day,
        appointments: dayAppointments.length,
      };
    });
  };

  const getMonthAppointments = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { locale: ptBR });
    
    return weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { locale: ptBR });
      const weekAppointments = filteredAppointments.filter(apt => {
        const aptDate = parseISO(apt.scheduled_datetime);
        return aptDate >= weekStart && aptDate <= weekEnd;
      });
      
      return {
        week: `Semana ${index + 1}`,
        weekStart,
        weekEnd,
        appointments: weekAppointments.length,
      };
    });
  };

  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "HH:mm", { locale: ptBR });
    } catch {
      return "";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-green-600" />
            Agendamentos
          </h1>
          <p className="text-gray-600 mt-2">
            Visualize e gerencie seus agendamentos
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAppointments}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por paciente ou tipo..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="checked_in">Check-in</SelectItem>
                  <SelectItem value="in_consultation">Em Consulta</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="no_show">Não Compareceu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {activeTab === "day" && (
              <div className="min-w-[200px]">
                <Input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(new Date(e.target.value));
                    }
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="day" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Dia
          </TabsTrigger>
          <TabsTrigger value="week" className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            Semana
          </TabsTrigger>
          <TabsTrigger value="month" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Mês
          </TabsTrigger>
        </TabsList>

        <TabsContent value="day">
          <Card>
            <CardHeader>
              <CardTitle>Agenda do Dia</CardTitle>
              <CardDescription>
                Consultas agendadas para {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getDayAppointments().length > 0 ? (
                <div className="space-y-3">
                  {getDayAppointments().map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                          <Clock className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{formatTime(appointment.scheduled_datetime)}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                            <User className="h-4 w-4" />
                            {appointment.patient_name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Stethoscope className="h-4 w-4" />
                            {appointment.appointment_type || "Consulta"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma consulta agendada para este dia</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week">
          <Card>
            <CardHeader>
              <CardTitle>Agenda da Semana</CardTitle>
              <CardDescription>
                Visão semanal dos agendamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {getWeekAppointments().map((day, index) => (
                  <Card key={index} className="text-center">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm capitalize">{day.date}</CardTitle>
                      <CardDescription className="text-xs">
                        {format(day.dateObj, "dd/MM", { locale: ptBR })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{day.appointments}</div>
                      <div className="text-xs text-gray-500 mt-1">consultas</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month">
          <Card>
            <CardHeader>
              <CardTitle>Agenda do Mês</CardTitle>
              <CardDescription>
                Visão mensal dos agendamentos - {format(selectedDate, "MMMM yyyy", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {getMonthAppointments().map((week, index) => (
                  <Card key={index} className="text-center">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{week.week}</CardTitle>
                      <CardDescription className="text-xs">
                        {format(week.weekStart, "dd/MM", { locale: ptBR })} - {format(week.weekEnd, "dd/MM", { locale: ptBR })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{week.appointments}</div>
                      <div className="text-xs text-gray-500 mt-1">consultas</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
