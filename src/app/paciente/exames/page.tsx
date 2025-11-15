"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, Calendar, Download, Eye, CheckCircle2, AlertCircle } from "lucide-react";
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

const mockTestResults = [
  {
    id: 1,
    name: "Hemograma Completo",
    date: "15/01/2024",
    doctor: "Dr. Maria Santos",
    status: "Disponível",
    hasAbnormalities: false,
  },
  {
    id: 2,
    name: "Glicemia de Jejum",
    date: "15/01/2024",
    doctor: "Dr. Maria Santos",
    status: "Disponível",
    hasAbnormalities: false,
  },
  {
    id: 3,
    name: "Colesterol Total",
    date: "10/01/2024",
    doctor: "Dr. Carlos Souza",
    status: "Disponível",
    hasAbnormalities: true,
  },
  {
    id: 4,
    name: "Raio-X de Tórax",
    date: "05/01/2024",
    doctor: "Dr. Ana Oliveira",
    status: "Pendente",
    hasAbnormalities: false,
  },
];

export default function ExamesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FlaskConical className="h-8 w-8 text-cyan-600" />
          Resultados de Exames
        </h1>
        <p className="text-gray-600 mt-2">
          Visualize e baixe os resultados dos seus exames
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resultados de Exames</CardTitle>
          <CardDescription>
            Histórico completo dos seus exames
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exame</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTestResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-cyan-600" />
                      {result.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {result.date}
                    </div>
                  </TableCell>
                  <TableCell>{result.doctor}</TableCell>
                  <TableCell>
                    <Badge className={result.status === "Disponível" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                      {result.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {result.hasAbnormalities ? (
                      <Badge className="bg-orange-100 text-orange-800">
                        <AlertCircle className="h-3 w-3 mr-1 inline" />
                        Atenção
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                        Normal
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {result.status === "Disponível" && (
                        <>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Baixar
                          </Button>
                        </>
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

