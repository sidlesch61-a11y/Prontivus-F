"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  Heart,
  Activity,
  TrendingUp,
  FileText,
  Video,
  Clock,
  MapPin,
  Calendar,
  TestTube,
  MessageCircle,
  Pill,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PatientSidebar, PatientMobileNav, PatientHeader } from "@/components/patient/Navigation";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NavigationItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
}

interface UpcomingAppointment {
  id: number;
  date: string;
  time: string;
  doctor: string;
  specialty: string;
  type: "in-person" | "virtual";
  location?: string;
}

interface HealthMetric {
  label: string;
  value: string;
  trend?: "up" | "down" | "stable";
  status: "normal" | "warning" | "critical";
}

interface RecentActivity {
  id: number;
  type: "test_result" | "prescription" | "message" | "appointment";
  title: string;
  description: string;
  date: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function PatientDashboard() {
  const [upcomingAppointment, setUpcomingAppointment] = React.useState<UpcomingAppointment | null>(null);
  const [recentActivity, setRecentActivity] = React.useState<RecentActivity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const healthMetrics: HealthMetric[] = [];

  const [healthSummary, setHealthSummary] = React.useState({
    activeConditions: 0,
    activeMedications: 0,
    lastMeasurementDate: null as Date | null,
  });

  React.useEffect(() => {
    const load = async () => {
      try {
        // Fetch comprehensive patient dashboard data
        let dashboardData: any;
        try {
          dashboardData = await api.get<any>(`/api/patient/dashboard`);
        } catch (apiError: any) {
          console.error("API request failed:", apiError);
          // Check if it's a network error or parsing error
          if (apiError.message && apiError.message.includes('JSON')) {
            console.error("JSON parsing error - response may not be valid JSON");
            toast.error("Erro ao processar resposta do servidor", {
              description: "A resposta do servidor não está em formato válido. Tente novamente.",
            });
          } else if (apiError.status === 401) {
            // Already handled by apiRequest - redirect to login
            return;
          } else {
            toast.error("Erro ao carregar dashboard", {
              description: apiError.message || "Não foi possível carregar os dados do dashboard",
            });
          }
          setUpcomingAppointment(null);
          setRecentActivity([]);
          setHealthSummary({
            activeConditions: 0,
            activeMedications: 0,
            lastMeasurementDate: null,
          });
          return;
        }
        
        // Validate response structure
        if (!dashboardData) {
          console.warn("Dashboard data is null or undefined");
          setUpcomingAppointment(null);
          setRecentActivity([]);
          return;
        }
        
        // Set upcoming appointment
        if (dashboardData.upcoming_appointment) {
          try {
            const apt = dashboardData.upcoming_appointment;
            const scheduledDate = apt.scheduled_datetime ? new Date(apt.scheduled_datetime) : null;
            
            if (scheduledDate && !isNaN(scheduledDate.getTime())) {
              setUpcomingAppointment({
                id: apt.id,
                date: apt.scheduled_datetime,
                time: format(scheduledDate, "HH:mm"),
                doctor: apt.doctor_name || "Médico",
                specialty: apt.doctor_specialty || apt.appointment_type || "",
                type: apt.is_virtual ? "virtual" : "in-person",
                location: apt.location || "",
              });
            } else {
              setUpcomingAppointment(null);
            }
          } catch (err) {
            console.error("Error parsing upcoming appointment:", err);
            setUpcomingAppointment(null);
          }
        } else {
          setUpcomingAppointment(null);
        }

        // Set recent activities
        try {
          const activities = (dashboardData.recent_activities || []).map((activity: any) => {
            let Icon = Calendar;
            if (activity.type === "prescription") Icon = Pill;
            else if (activity.type === "exam_result") Icon = TestTube;
            else if (activity.type === "message") Icon = MessageCircle;
            else if (activity.type === "payment") Icon = CreditCard;
            
            // Safely parse date
            let formattedDate = "Data não disponível";
            if (activity.date) {
              try {
                const activityDate = new Date(activity.date);
                if (!isNaN(activityDate.getTime())) {
                  formattedDate = format(activityDate, "dd/MM/yyyy HH:mm");
                }
              } catch (dateErr) {
                console.warn("Error parsing activity date:", dateErr, activity);
              }
            }
            
            return {
              id: activity.id || 0,
              type: activity.type || "unknown",
              title: activity.title || "Atividade",
              description: activity.description || "",
              date: formattedDate,
              icon: Icon,
            };
          });
          setRecentActivity(activities);
        } catch (err) {
          console.error("Error parsing recent activities:", err);
          setRecentActivity([]);
        }

        // Set health summary
        try {
          if (dashboardData.health_summary) {
            const summary = dashboardData.health_summary;
            let lastMeasurementDate = null;
            
            if (summary.last_measurement_date) {
              try {
                const date = new Date(summary.last_measurement_date);
                if (!isNaN(date.getTime())) {
                  lastMeasurementDate = date;
                }
              } catch (dateErr) {
                console.warn("Error parsing last measurement date:", dateErr);
              }
            }
            
            setHealthSummary({
              activeConditions: Number(summary.active_conditions_count) || 0,
              activeMedications: Number(summary.active_prescriptions_count) || 0,
              lastMeasurementDate,
            });
          } else {
            setHealthSummary({
              activeConditions: 0,
              activeMedications: 0,
              lastMeasurementDate: null,
            });
          }
        } catch (err) {
          console.error("Error parsing health summary:", err);
          setHealthSummary({
            activeConditions: 0,
            activeMedications: 0,
            lastMeasurementDate: null,
          });
        }
      } catch (error: any) {
        console.error("Error loading dashboard:", error);
        
        // More detailed error logging
        if (error instanceof TypeError && error.message.includes('fetch')) {
          console.error("Network error - check if backend is running");
          toast.error("Erro de conexão", {
            description: "Não foi possível conectar ao servidor. Verifique sua conexão.",
          });
        } else if (error instanceof SyntaxError) {
          console.error("JSON parsing error:", error);
          toast.error("Erro ao processar dados", {
            description: "A resposta do servidor não está em formato válido.",
          });
        } else {
          const errorMessage = error?.message || error?.detail || "Não foi possível carregar suas informações";
          toast.error("Erro ao carregar dados", {
            description: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
          });
        }
        
        setUpcomingAppointment(null);
        setRecentActivity([]);
        setHealthSummary({
          activeConditions: 0,
          activeMedications: 0,
          lastMeasurementDate: null,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50/30">
      {/* Header */}
      <PatientHeader showSearch notificationCount={3} />

      {/* Mobile Navigation */}
      <PatientMobileNav />

      <div className="flex">
        {/* Left Sidebar Navigation - Desktop Only */}
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 max-w-7xl mx-auto w-full">
          <div className="space-y-6">
            {/* Welcome / Hero Section */}
            <section
              aria-label="Resumo do seu painel de saúde"
              className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-teal-50 px-5 py-5 lg:px-6 lg:py-6 shadow-[0_1px_0_rgba(0,0,0,0.02)]"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Heart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                      Seu Painel de Saúde
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Acompanhe consultas, resultados e registros com segurança.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    aria-label="Agendar nova consulta"
                    onClick={() => window.location.href = "/patient/appointments"}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar Consulta
                  </Button>
                  <Button
                    variant="outline"
                    className="border-teal-300 text-teal-700 hover:bg-teal-50"
                    aria-label="Ver resultados de exames"
                    onClick={() => window.location.href = "/patient/test-results"}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Ver Exames
                  </Button>
                </div>
              </div>
              {/* Quick links */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  className="justify-start gap-2 h-12 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                  aria-label="Abrir mensagens"
                  onClick={() => window.location.href = "/patient/messages"}
                >
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Mensagens</span>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2 h-12 border-2 border-teal-200 hover:border-teal-300 hover:bg-teal-50"
                  aria-label="Acessar prescrições"
                  onClick={() => window.location.href = "/patient/prescriptions"}
                >
                  <Pill className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-medium text-teal-700">Prescrições</span>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2 h-12 border-2 border-green-200 hover:border-green-300 hover:bg-green-50"
                  aria-label="Ver registros médicos"
                  onClick={() => window.location.href = "/patient/medical-records"}
                >
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Registros</span>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2 h-12 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                  aria-label="Telemedicina"
                  onClick={() => window.location.href = "/patient/telemedicine"}
                >
                  <Video className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Telemedicina</span>
                </Button>
              </div>
            </section>

            {/* Dashboard Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Health Summary Card */}
              <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-blue-600 flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Heart className="h-5 w-5" />
                        </div>
                        Resumo de Saúde
                      </CardTitle>
                      <CardDescription className="mt-1">Informações médicas recentes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border border-blue-100">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Última Medição</p>
                        <p className="text-lg font-semibold text-blue-700">
                          {healthSummary.lastMeasurementDate
                            ? format(healthSummary.lastMeasurementDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                            : "N/A"}
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-teal-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-white border-2 border-blue-100 rounded-lg hover:border-blue-300 transition-colors">
                        <p className="text-xs text-gray-500 mb-1">Condições Ativas</p>
                        <p className="text-2xl font-bold text-blue-600">{healthSummary.activeConditions}</p>
                        <p className="text-xs text-gray-500 mt-1">Monitoradas</p>
                      </div>
                      <div className="p-4 bg-white border-2 border-teal-100 rounded-lg hover:border-teal-300 transition-colors">
                        <p className="text-xs text-gray-500 mb-1">Medicações</p>
                        <p className="text-2xl font-bold text-teal-600">{healthSummary.activeMedications}</p>
                        <p className="text-xs text-gray-500 mt-1">Em uso</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => window.location.href = "/patient/health"}
                    >
                      Ver Detalhes
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Next Appointment Card */}
              <Card className="border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-teal-600 flex items-center gap-2">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <Calendar className="h-5 w-5" />
                        </div>
                        Próxima Consulta
                      </CardTitle>
                      <CardDescription className="mt-1">Seu próximo atendimento</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : upcomingAppointment ? (
                    <div className="space-y-4">
                      <div className="p-5 bg-gradient-to-br from-blue-500 via-blue-600 to-teal-600 rounded-lg text-white shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm opacity-90 mb-1">Data e Hora</p>
                            <p className="text-2xl font-bold">
                              {format(new Date(upcomingAppointment.date), "dd 'de' MMMM", { locale: ptBR })}
                            </p>
                            <p className="text-lg mt-1">{upcomingAppointment.time}</p>
                          </div>
                          <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Clock className="h-8 w-8" />
                          </div>
                        </div>
                        <div className="border-t border-white/20 pt-3 mt-3">
                          <p className="text-sm opacity-90 mb-1">Médico</p>
                          <p className="font-semibold text-lg">{upcomingAppointment.doctor}</p>
                          {upcomingAppointment.specialty && (
                            <p className="text-sm opacity-80 mt-1">{upcomingAppointment.specialty}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {upcomingAppointment.type === "virtual" ? (
                          <>
                            <Video className="h-4 w-4 text-blue-600" />
                            <span>Consulta Virtual</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span>{upcomingAppointment.location || "Local a confirmar"}</span>
                          </>
                        )}
                      </div>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                        {upcomingAppointment.type === "virtual" ? (
                          <>
                            <Video className="h-4 w-4 mr-2" />
                            Entrar na Consulta
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 mr-2" />
                            Ver Localização
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                        <Calendar className="h-10 w-10 text-blue-600" />
                      </div>
                      <p className="text-gray-500 mb-4 font-medium">Nenhuma consulta agendada</p>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => window.location.href = "/patient/appointments"}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Agendar Consulta
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-green-600 flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText className="h-5 w-5" />
                        </div>
                        Atividades Recentes
                      </CardTitle>
                      <CardDescription className="mt-1">Últimas atualizações do seu prontuário</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : recentActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Nenhuma atividade recente</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.slice(0, 5).map((activity) => {
                        const Icon = activity.icon;
                        return (
                          <div
                            key={activity.id}
                            className="flex items-start gap-4 p-4 rounded-lg hover:bg-blue-50/50 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                          >
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Icon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900">{activity.title}</p>
                              <p className="text-sm text-gray-600">{activity.description}</p>
                              <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 border-teal-300 text-teal-700 hover:bg-teal-50"
                    onClick={() => window.location.href = "/patient/medical-records"}
                  >
                    Ver Todas as Atividades
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-teal-600 flex items-center gap-2">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <Activity className="h-5 w-5" />
                        </div>
                        Ações Rápidas
                      </CardTitle>
                      <CardDescription className="mt-1">Acesso rápido a funcionalidades</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto flex-col items-center justify-center p-5 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                      onClick={() => window.location.href = "/patient/appointments"}
                    >
                      <Calendar className="h-6 w-6 mb-2 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Agendar</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto flex-col items-center justify-center p-5 border-2 border-teal-200 hover:bg-teal-50 hover:border-teal-300 transition-all"
                      onClick={() => window.location.href = "/patient/messages"}
                    >
                      <MessageCircle className="h-6 w-6 mb-2 text-teal-600" />
                      <span className="text-sm font-medium text-teal-700">Mensagens</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto flex-col items-center justify-center p-5 border-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all"
                      onClick={() => window.location.href = "/patient/medical-records"}
                    >
                      <FileText className="h-6 w-6 mb-2 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Registros</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto flex-col items-center justify-center p-5 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                      onClick={() => window.location.href = "/patient/test-results"}
                    >
                      <TestTube className="h-6 w-6 mb-2 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Resultados</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 bg-white/80 backdrop-blur-sm border-l border-blue-100 min-h-[calc(100vh-80px)] sticky top-[80px] hidden xl:block overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Upcoming Appointments */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Próximas Consultas
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-50 h-8 px-3 text-xs"
                >
                  Ver Todas →
                </Button>
              </div>
              <div className="space-y-3">
                {upcomingAppointment ? (
                  <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">
                            {format(new Date(upcomingAppointment.date), "dd MMM", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-gray-600">{upcomingAppointment.time}</p>
                          <p className="text-xs text-blue-600 mt-1 font-medium">{upcomingAppointment.doctor}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-2 border-blue-100">
                    <CardContent className="p-4 text-center">
                      <Calendar className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Nenhuma consulta agendada</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Quick Health Metrics */}
            <div>
              <h3 className="text-lg font-semibold text-teal-600 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Métricas de Saúde
              </h3>
              <div className="space-y-3">
                {healthMetrics.length === 0 ? (
                  <Card className="border-2 border-teal-100">
                    <CardContent className="p-4 text-center">
                      <Activity className="h-8 w-8 text-teal-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Nenhuma métrica disponível</p>
                    </CardContent>
                  </Card>
                ) : (
                  healthMetrics.map((metric, index) => (
                    <Card key={index} className="border-2 border-teal-100 hover:border-teal-200 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">{metric.label}</p>
                            <p className="text-lg font-bold text-teal-600">{metric.value}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {metric.trend === "up" && (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            )}
                            {metric.trend === "down" && (
                              <TrendingUp className="h-4 w-4 text-green-600 rotate-180" />
                            )}
                            {metric.trend === "stable" && (
                              <div className="h-4 w-4 rounded-full bg-gray-400"></div>
                            )}
                            {metric.status === "normal" && (
                              <Badge className="bg-green-100 text-green-700 border-green-300">
                                Normal
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
