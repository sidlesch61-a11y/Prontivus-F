"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, CalendarDays, Users, Clock, TrendingUp, Activity, RefreshCw } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DoctorDashboardStats {
  today_appointments_count: number;
  queue_patients_count: number;
  pending_records_count: number;
  monthly_revenue: number;
}

interface UpcomingAppointment {
  id: number;
  patient_name: string;
  scheduled_datetime: string;
  appointment_type: string | null;
  status: string;
}

interface DoctorDashboardData {
  stats: DoctorDashboardStats;
  upcoming_appointments: UpcomingAppointment[];
}

export default function DoctorDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DoctorDashboardStats>({
    today_appointments_count: 0,
    queue_patients_count: 0,
    pending_records_count: 0,
    monthly_revenue: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.get<DoctorDashboardData>("/api/v1/doctor/dashboard");
      
      // Validate and set stats
      if (data.stats) {
        setStats({
          today_appointments_count: data.stats.today_appointments_count || 0,
          queue_patients_count: data.stats.queue_patients_count || 0,
          pending_records_count: data.stats.pending_records_count || 0,
          monthly_revenue: data.stats.monthly_revenue || 0,
        });
      }
      
      // Set upcoming appointments
      if (data.upcoming_appointments) {
        setUpcomingAppointments(data.upcoming_appointments || []);
      }
    } catch (error: any) {
      console.error("Failed to load dashboard:", error);
      toast.error("Erro ao carregar dashboard", {
        description: error?.message || error?.detail || "Não foi possível carregar os dados do dashboard",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "HH:mm", { locale: ptBR });
    } catch {
      return "";
    }
  };

  const statsConfig = [
    {
      title: "Consultas Hoje",
      value: stats.today_appointments_count.toString(),
      icon: CalendarDays,
      color: "text-green-600",
      bgColor: "bg-green-100",
      link: "/medico/agendamentos",
    },
    {
      title: "Pacientes na Fila",
      value: stats.queue_patients_count.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      link: "/medico/atendimento/fila",
    },
    {
      title: "Prontuários Pendentes",
      value: stats.pending_records_count.toString(),
      icon: Stethoscope,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      link: "/medico/prontuarios",
    },
    {
      title: "Receita do Mês",
      value: formatCurrency(stats.monthly_revenue),
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      link: "/medico/financeiro/dashboard",
    },
  ];

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
            <Stethoscope className="h-8 w-8 text-green-600" />
            Dashboard Médico
          </h1>
          <p className="text-gray-600 mt-2">
            Visão geral das suas atividades médicas
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsConfig.map((stat, index) => {
          const Icon = stat.icon;
          const content = (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );

          if (stat.link) {
            return (
              <Link key={index} href={stat.link}>
                {content}
              </Link>
            );
          }
          return <React.Fragment key={index}>{content}</React.Fragment>;
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Consultas</CardTitle>
            <CardDescription>
              Consultas agendadas para hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <>
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Clock className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold">{appointment.patient_name}</div>
                          <div className="text-sm text-gray-600">
                            {appointment.appointment_type || "Consulta"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {formatTime(appointment.scheduled_datetime)}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {appointment.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/medico/agendamentos">
                  <button className="w-full mt-4 text-sm text-green-600 hover:text-green-700 font-medium">
                    Ver todas as consultas →
                  </button>
                </Link>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma consulta agendada para hoje</p>
                <Link href="/medico/agendamentos">
                  <button className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium">
                    Ver agendamentos →
                  </button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso rápido às principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/medico/atendimento/fila">
                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-green-300">
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="font-semibold text-sm">Fila de Atendimento</div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/medico/prontuarios">
                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-green-300">
                  <CardContent className="p-4 text-center">
                    <Stethoscope className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="font-semibold text-sm">Prontuários</div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/medico/financeiro/dashboard">
                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-green-300">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="font-semibold text-sm">Financeiro</div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/medico/estoque/consulta">
                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-green-300">
                  <CardContent className="p-4 text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="font-semibold text-sm">Estoque</div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
