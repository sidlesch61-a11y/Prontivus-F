"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill, Calendar, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockMedications = [
  {
    id: 1,
    name: "Losartana 50mg",
    dosage: "1 comprimido",
    frequency: "1x ao dia",
    startDate: "01/01/2024",
    endDate: "31/01/2024",
    doctor: "Dr. Maria Santos",
    status: "Ativo",
  },
  {
    id: 2,
    name: "Omeprazol 20mg",
    dosage: "1 cápsula",
    frequency: "1x ao dia (manhã)",
    startDate: "15/12/2023",
    endDate: "15/02/2024",
    doctor: "Dr. Carlos Souza",
    status: "Ativo",
  },
  {
    id: 3,
    name: "Dipirona 500mg",
    dosage: "1 comprimido",
    frequency: "A cada 8 horas (se necessário)",
    startDate: "10/01/2024",
    endDate: "20/01/2024",
    doctor: "Dr. Ana Oliveira",
    status: "Finalizado",
  },
];

export default function MedicacoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Pill className="h-8 w-8 text-cyan-600" />
          Histórico de Medicações
        </h1>
        <p className="text-gray-600 mt-2">
          Visualize suas medicações atuais e anteriores
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medicações</CardTitle>
          <CardDescription>
            Lista de medicações prescritas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicação</TableHead>
                <TableHead>Dosagem</TableHead>
                <TableHead>Frequência</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMedications.map((medication) => (
                <TableRow key={medication.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-cyan-600" />
                      {medication.name}
                    </div>
                  </TableCell>
                  <TableCell>{medication.dosage}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      {medication.frequency}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span>{medication.startDate} até {medication.endDate}</span>
                    </div>
                  </TableCell>
                  <TableCell>{medication.doctor}</TableCell>
                  <TableCell>
                    <Badge className={medication.status === "Ativo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {medication.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Lembrete Importante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">
            Sempre siga as orientações do seu médico. Não interrompa o tratamento sem consultá-lo.
            Em caso de dúvidas sobre suas medicações, entre em contato com a clínica.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

