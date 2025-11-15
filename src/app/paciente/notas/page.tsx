"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, User, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockNotes = [
  {
    id: 1,
    title: "Orientações pós-consulta",
    content: "Manter repouso relativo por 48 horas. Retornar em caso de febre ou dor intensa.",
    date: "15/01/2024",
    author: "Dr. Maria Santos",
    category: "Orientação",
  },
  {
    id: 2,
    title: "Resultado de exames",
    content: "Exames de rotina dentro da normalidade. Continuar com medicação prescrita.",
    date: "10/01/2024",
    author: "Dr. Carlos Souza",
    category: "Resultado",
  },
  {
    id: 3,
    title: "Lembrete de retorno",
    content: "Agendar retorno em 30 dias para acompanhamento do tratamento.",
    date: "05/01/2024",
    author: "Dr. Ana Oliveira",
    category: "Lembrete",
  },
];

export default function NotasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="h-8 w-8 text-cyan-600" />
          Notas da Clínica
        </h1>
        <p className="text-gray-600 mt-2">
          Visualize as notas e orientações da equipe médica
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notas e Orientações</CardTitle>
              <CardDescription>
                Comunicações da equipe médica
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar notas..."
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{note.title}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {note.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {note.author}
                        </div>
                        <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded text-xs">
                          {note.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{note.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

