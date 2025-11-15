"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { appointmentsApi } from "@/lib/appointments-api";
import { AppointmentWizard } from "@/components/appointments/appointment-wizard";
import { patientsApi } from "@/lib/patients-api";
import { Doctor, Patient, AppointmentCreate } from "@/lib/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function NewAppointmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [doctors, setDoctors] = React.useState<Doctor[]>([]);
  const [recentPatients, setRecentPatients] = React.useState<Patient[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [doctorsData, patientsData] = await Promise.all([
          appointmentsApi.getDoctors(),
          patientsApi.getAll().then(patients => patients.slice(0, 10)), // Get first 10 patients as recent
        ]);
        setDoctors(doctorsData || []);
        setRecentPatients(patientsData || []);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Erro ao carregar dados");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (data: AppointmentCreate) => {
    try {
      setIsSubmitting(true);
      await appointmentsApi.create(data);
      toast.success("Agendamento criado com sucesso!");
      router.push("/secretaria/agendamentos");
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      toast.error(error?.message || "Erro ao criar agendamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          Novo Agendamento
        </h1>
        <p className="text-gray-600 mt-2">
          Crie um novo agendamento para um paciente
        </p>
      </div>

      <AppointmentWizard
        doctors={doctors}
        recentPatients={recentPatients}
        clinicId={user?.clinic_id || 1}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => router.push("/secretaria/agendamentos")}
      />
    </div>
  );
}

