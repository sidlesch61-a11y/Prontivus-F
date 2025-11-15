"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, User, Stethoscope, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface QueueItem {
  id: number;
  patient_id: number;
  patient_name: string;
  appointment_time: string;
  scheduled_datetime: string;
  wait_time: string;
  wait_time_minutes: number;
  status: string;
  appointment_type: string | null;
  checked_in_at: string | null;
  started_at: string | null;
}

export default function FilaAtendimentoPage() {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentPatient, setCurrentPatient] = useState<QueueItem | null>(null);

  useEffect(() => {
    loadQueue();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Find patient in consultation
    const inConsultation = queue.find(p => p.status === "in_consultation");
    setCurrentPatient(inConsultation || null);
  }, [queue]);

  const loadQueue = async () => {
    try {
      const data = await api.get<QueueItem[]>("/api/v1/appointments/doctor/queue");
      
      // Sort: IN_CONSULTATION first, then by scheduled_datetime
      const sorted = [...data].sort((a, b) => {
        if (a.status === "in_consultation" && b.status !== "in_consultation") return -1;
        if (a.status !== "in_consultation" && b.status === "in_consultation") return 1;
        
        const dateA = parseISO(a.scheduled_datetime);
        const dateB = parseISO(b.scheduled_datetime);
        return dateA.getTime() - dateB.getTime();
      });
      
      setQueue(sorted);
    } catch (error: any) {
      console.error("Failed to load queue:", error);
      toast.error("Erro ao carregar fila", {
        description: error?.message || error?.detail || "Não foi possível carregar a fila de atendimento",
      });
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAppointment = async (appointmentId: number) => {
    try {
      await api.patch(`/api/v1/appointments/${appointmentId}/status`, {
        status: "in_consultation"
      });
      
      toast.success("Atendimento iniciado", {
        description: "O atendimento foi iniciado com sucesso",
      });
      
      // Reload queue
      await loadQueue();
    } catch (error: any) {
      console.error("Failed to start appointment:", error);
      toast.error("Erro ao iniciar atendimento", {
        description: error?.message || error?.detail || "Não foi possível iniciar o atendimento",
      });
    }
  };

  const handleFinishAppointment = async (appointmentId: number) => {
    try {
      await api.patch(`/api/v1/appointments/${appointmentId}/status`, {
        status: "completed"
      });
      
      toast.success("Atendimento finalizado", {
        description: "O atendimento foi finalizado com sucesso",
      });
      
      // Reload queue
      await loadQueue();
      setCurrentPatient(null);
    } catch (error: any) {
      console.error("Failed to finish appointment:", error);
      toast.error("Erro ao finalizar atendimento", {
        description: error?.message || error?.detail || "Não foi possível finalizar o atendimento",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "in_consultation") {
      return <Badge className="bg-green-100 text-green-800">Em Atendimento</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Aguardando</Badge>;
  };

  const getPriorityBadge = (waitTimeMinutes: number) => {
    if (waitTimeMinutes > 30) {
      return <Badge className="bg-red-100 text-red-800">Alta</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">Normal</Badge>;
  };

  const waitingQueue = queue.filter(p => p.status === "checked_in");

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
            <Users className="h-8 w-8 text-green-600" />
            Fila de Atendimento
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie a fila de pacientes aguardando atendimento
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadQueue}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Patient */}
        {currentPatient && (
          <Card className="lg:col-span-1 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-green-600" />
                Em Atendimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="h-10 w-10 text-green-700" />
                  </div>
                  <div className="font-bold text-xl">{currentPatient.patient_name}</div>
                  <div className="text-sm text-gray-600 mt-1">Horário: {currentPatient.appointment_time}</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-sm text-gray-600">Tempo de espera:</span>
                  <span className="font-semibold">{currentPatient.wait_time}</span>
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleFinishAppointment(currentPatient.id)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Finalizar Atendimento
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Queue List */}
        <Card className={currentPatient ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader>
            <CardTitle>Fila de Espera</CardTitle>
            <CardDescription>
              {waitingQueue.length > 0 
                ? `${waitingQueue.length} ${waitingQueue.length === 1 ? "paciente aguardando" : "pacientes aguardando"}`
                : "Nenhum paciente aguardando"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {waitingQueue.length > 0 ? (
              <div className="space-y-3">
                {waitingQueue.map((patient, index) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="font-bold text-green-700">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{patient.patient_name}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {patient.appointment_time}
                          </span>
                          <span>Tempo de espera: {patient.wait_time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getPriorityBadge(patient.wait_time_minutes)}
                      {getStatusBadge(patient.status)}
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleStartAppointment(patient.id)}
                      >
                        Iniciar Atendimento
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum paciente aguardando atendimento</p>
                <p className="text-sm mt-2">A fila está vazia no momento</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
