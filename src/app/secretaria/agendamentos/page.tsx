"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Plus, Search, Filter, Clock, User, Stethoscope, CheckCircle2, XCircle, AlertCircle, RefreshCw, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Appointment {
  id: number;
  scheduled_datetime: string;
  status: string;
  appointment_type?: string;
  patient_id: number;
  doctor_id: number;
  patient_name: string;
  doctor_name: string;
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface AppointmentFormData {
  patient_id: number | null;
  doctor_id: number | null;
  scheduled_datetime: string;
  appointment_type: string;
  reason: string;
}

export default function AgendamentosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [formData, setFormData] = useState<AppointmentFormData>({
    patient_id: null,
    doctor_id: null,
    scheduled_datetime: "",
    appointment_type: "consultation",
    reason: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, filterStatus, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAppointments(),
        loadPatients(),
        loadDoctors(),
      ]);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error("Erro ao carregar dados", {
        description: error?.message || "Não foi possível carregar os dados",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      const data = await api.get<Appointment[]>("/api/appointments");
      setAppointments(data);
    } catch (error: any) {
      console.error("Failed to load appointments:", error);
      toast.error("Erro ao carregar agendamentos", {
        description: error?.message || "Não foi possível carregar os agendamentos",
      });
      setAppointments([]);
    }
  };

  const loadPatients = async () => {
    try {
      const data = await api.get<Patient[]>("/api/patients");
      setPatients(data);
    } catch (error: any) {
      console.error("Failed to load patients:", error);
      setPatients([]);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await api.get<Doctor[]>("/api/users/doctors");
      setDoctors(data);
    } catch (error: any) {
      console.error("Failed to load doctors:", error);
      setDoctors([]);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.patient_name.toLowerCase().includes(searchLower) ||
          apt.doctor_name.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((apt) => {
        const statusLower = apt.status.toLowerCase();
        switch (filterStatus) {
          case "Confirmado":
            return statusLower === "scheduled";
          case "Pendente":
            return statusLower === "checked_in" || statusLower === "in_consultation";
          case "Cancelado":
            return statusLower === "cancelled";
          case "Concluído":
            return statusLower === "completed";
          default:
            return true;
        }
      });
    }

    setFilteredAppointments(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    switch (statusLower) {
      case "scheduled":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1 inline" />Agendado</Badge>;
      case "checked_in":
        return <Badge className="bg-blue-100 text-blue-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Check-in</Badge>;
      case "in_consultation":
        return <Badge className="bg-purple-100 text-purple-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Em Consulta</Badge>;
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800"><CheckCircle2 className="h-3 w-3 mr-1 inline" />Concluído</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1 inline" />Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleCreateAppointment = async () => {
    if (!formData.patient_id || !formData.doctor_id || !formData.scheduled_datetime) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!user?.clinic_id) {
      toast.error("Erro ao identificar a clínica");
      return;
    }

    try {
      setSaving(true);
      const appointmentData = {
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id,
        clinic_id: user.clinic_id,
        scheduled_datetime: new Date(formData.scheduled_datetime).toISOString(),
        appointment_type: formData.appointment_type,
        reason: formData.reason || undefined,
      };

      await api.post("/api/appointments", appointmentData);
      toast.success("Agendamento criado com sucesso!");
      setShowCreateModal(false);
      resetForm();
      await loadAppointments();
    } catch (error: any) {
      console.error("Failed to create appointment:", error);
      toast.error("Erro ao criar agendamento", {
        description: error?.message || error?.detail || "Não foi possível criar o agendamento",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    const appointmentDate = parseISO(appointment.scheduled_datetime);
    setFormData({
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      scheduled_datetime: format(appointmentDate, "yyyy-MM-dd'T'HH:mm"),
      appointment_type: appointment.appointment_type || "consultation",
      reason: "",
    });
    setShowEditModal(true);
  };

  const handleUpdateAppointment = async () => {
    if (!editingAppointment || !formData.patient_id || !formData.doctor_id || !formData.scheduled_datetime) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setSaving(true);
      const updateData = {
        scheduled_datetime: new Date(formData.scheduled_datetime).toISOString(),
        appointment_type: formData.appointment_type,
        reason: formData.reason || undefined,
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id,
      };

      await api.put(`/api/appointments/${editingAppointment.id}`, updateData);
      toast.success("Agendamento atualizado com sucesso!");
      setShowEditModal(false);
      setEditingAppointment(null);
      resetForm();
      await loadAppointments();
    } catch (error: any) {
      console.error("Failed to update appointment:", error);
      toast.error("Erro ao atualizar agendamento", {
        description: error?.message || error?.detail || "Não foi possível atualizar o agendamento",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) {
      return;
    }

    try {
      // Send status as enum value (cancelled)
      await api.patch(`/api/appointments/${appointmentId}/status`, {
        status: "cancelled",
      });
      toast.success("Agendamento cancelado com sucesso!");
      await loadAppointments();
    } catch (error: any) {
      console.error("Failed to cancel appointment:", error);
      toast.error("Erro ao cancelar agendamento", {
        description: error?.message || error?.detail || "Não foi possível cancelar o agendamento",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: null,
      doctor_id: null,
      scheduled_datetime: "",
      appointment_type: "consultation",
      reason: "",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-teal-600" />
            Agendamentos
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie todos os agendamentos da clínica
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Agendamentos</CardTitle>
              <CardDescription>
                Visualize e gerencie os agendamentos
              </CardDescription>
            </div>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por paciente ou médico..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Confirmado">Agendado</SelectItem>
                <SelectItem value="Pendente">Em Andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredAppointments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => {
                  const appointmentDate = parseISO(appointment.scheduled_datetime);
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {format(appointmentDate, "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(appointmentDate, "HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {appointment.patient_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-gray-400" />
                          {appointment.doctor_name}
                        </div>
                      </TableCell>
                      <TableCell>{appointment.appointment_type || "Consulta"}</TableCell>
                      <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAppointment(appointment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {appointment.status.toLowerCase() !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelAppointment(appointment.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum agendamento encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Appointment Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo agendamento
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Paciente *</Label>
                <Select
                  value={formData.patient_id?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, patient_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.first_name} {patient.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor">Médico *</Label>
                <Select
                  value={formData.doctor_id?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, doctor_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        {doctor.first_name} {doctor.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="datetime">Data e Hora *</Label>
                <Input
                  id="datetime"
                  type="datetime-local"
                  value={formData.scheduled_datetime}
                  onChange={(e) => setFormData({ ...formData, scheduled_datetime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Consulta</Label>
                <Select
                  value={formData.appointment_type}
                  onValueChange={(value) => setFormData({ ...formData, appointment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consulta</SelectItem>
                    <SelectItem value="follow-up">Retorno</SelectItem>
                    <SelectItem value="emergency">Emergência</SelectItem>
                    <SelectItem value="telemedicine">Telemedicina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Consulta</Label>
              <Textarea
                id="reason"
                placeholder="Descreva o motivo da consulta..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAppointment} disabled={saving}>
              {saving ? "Salvando..." : "Criar Agendamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
            <DialogDescription>
              Atualize os dados do agendamento
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-patient">Paciente *</Label>
                <Select
                  value={formData.patient_id?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, patient_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.first_name} {patient.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-doctor">Médico *</Label>
                <Select
                  value={formData.doctor_id?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, doctor_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        {doctor.first_name} {doctor.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-datetime">Data e Hora *</Label>
                <Input
                  id="edit-datetime"
                  type="datetime-local"
                  value={formData.scheduled_datetime}
                  onChange={(e) => setFormData({ ...formData, scheduled_datetime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Tipo de Consulta</Label>
                <Select
                  value={formData.appointment_type}
                  onValueChange={(value) => setFormData({ ...formData, appointment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consulta</SelectItem>
                    <SelectItem value="follow-up">Retorno</SelectItem>
                    <SelectItem value="emergency">Emergência</SelectItem>
                    <SelectItem value="telemedicine">Telemedicina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reason">Motivo da Consulta</Label>
              <Textarea
                id="edit-reason"
                placeholder="Descreva o motivo da consulta..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateAppointment} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
