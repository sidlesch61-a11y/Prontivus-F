"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Plus, Clock, MapPin, Video, Stethoscope, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockAppointments = [
  {
    id: 1,
    date: "20/01/2024",
    time: "09:00",
    doctor: "Dr. Maria Santos",
    specialty: "Cardiologia",
    type: "Presencial",
    status: "Confirmado",
    location: "Clínica Central - Sala 101",
  },
  {
    id: 2,
    date: "25/01/2024",
    time: "14:30",
    doctor: "Dr. Carlos Souza",
    specialty: "Clínico Geral",
    type: "Telemedicina",
    status: "Agendado",
  },
  {
    id: 3,
    date: "18/01/2024",
    time: "10:00",
    doctor: "Dr. Ana Oliveira",
    specialty: "Dermatologia",
    type: "Presencial",
    status: "Realizado",
    location: "Clínica Central - Sala 205",
  },
];

export default function AgendamentosPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmado":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1 inline" />Confirmado</Badge>;
      case "Agendado":
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1 inline" />Agendado</Badge>;
      case "Realizado":
        return <Badge className="bg-gray-100 text-gray-800"><CheckCircle2 className="h-3 w-3 mr-1 inline" />Realizado</Badge>;
      case "Cancelado":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1 inline" />Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CalendarDays className="h-8 w-8 text-cyan-600" />
          Meus Agendamentos
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie seus agendamentos e consultas
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agendamentos</CardTitle>
              <CardDescription>
                Suas consultas agendadas e realizadas
              </CardDescription>
            </div>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{appointment.date}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {appointment.time}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-gray-400" />
                      {appointment.doctor}
                    </div>
                  </TableCell>
                  <TableCell>{appointment.specialty}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {appointment.type === "Telemedicina" ? (
                        <Video className="h-4 w-4 text-blue-600" />
                      ) : (
                        <MapPin className="h-4 w-4 text-gray-600" />
                      )}
                      {appointment.type}
                    </div>
                  </TableCell>
                  <TableCell>
                    {appointment.location ? (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {appointment.location}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {appointment.status === "Agendado" && (
                        <>
                          <Button variant="ghost" size="sm">Reagendar</Button>
                          <Button variant="ghost" size="sm" className="text-red-600">Cancelar</Button>
                        </>
                      )}
                      {appointment.status === "Realizado" && (
                        <Button variant="ghost" size="sm">Ver Detalhes</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

