"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Search, Calendar, DollarSign, RefreshCw } from "lucide-react";
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
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DelinquencyItem {
  id: number;
  patient_id: number;
  patient_name: string;
  amount: number;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  issue_date: string | null;
  days_overdue: number;
  appointment_id: number | null;
}

export default function InadimplenciaPage() {
  const [loading, setLoading] = useState(true);
  const [delinquency, setDelinquency] = useState<DelinquencyItem[]>([]);
  const [filteredDelinquency, setFilteredDelinquency] = useState<DelinquencyItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadDelinquency();
  }, []);

  useEffect(() => {
    filterDelinquency();
  }, [delinquency, searchTerm]);

  const loadDelinquency = async () => {
    try {
      setLoading(true);
      const data = await api.get<DelinquencyItem[]>("/api/v1/financial/doctor/delinquency");
      setDelinquency(data);
    } catch (error: any) {
      console.error("Failed to load delinquency:", error);
      toast.error("Erro ao carregar inadimplência", {
        description: error?.message || error?.detail || "Não foi possível carregar a inadimplência",
      });
      setDelinquency([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDelinquency = () => {
    let filtered = [...delinquency];
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.patient_name.toLowerCase().includes(search)
      );
    }
    
    setFilteredDelinquency(filtered);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getDaysOverdueBadge = (days: number) => {
    if (days > 90) {
      return <Badge className="bg-red-100 text-red-800">+90 dias</Badge>;
    } else if (days > 60) {
      return <Badge className="bg-red-100 text-red-800">{days} dias</Badge>;
    } else if (days > 30) {
      return <Badge className="bg-orange-100 text-orange-800">{days} dias</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">{days} dias</Badge>;
    }
  };

  const totalDelinquency = filteredDelinquency.reduce((sum, item) => sum + item.amount, 0);

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
            <AlertCircle className="h-8 w-8 text-green-600" />
            Inadimplência
          </h1>
          <p className="text-gray-600 mt-2">
            Contas em atraso dos pacientes
          </p>
        </div>
        <button
          onClick={loadDelinquency}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Atualizar"
        >
          <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Total em Atraso</CardTitle>
              <CardDescription>
                Valor total de contas inadimplentes
              </CardDescription>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(totalDelinquency)}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Contas Inadimplentes</CardTitle>
              <CardDescription>
                {filteredDelinquency.length} {filteredDelinquency.length === 1 ? "conta encontrada" : "contas encontradas"}
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar paciente..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDelinquency.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Valor em Atraso</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Valor Pago</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Dias em Atraso</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDelinquency.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.patient_name}</TableCell>
                    <TableCell className="font-semibold text-red-600">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {formatCurrency(item.total_amount)}
                    </TableCell>
                    <TableCell className="text-green-600">
                      {formatCurrency(item.paid_amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(item.due_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getDaysOverdueBadge(item.days_overdue)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-red-100 text-red-800">
                        Atrasado
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>
                {searchTerm
                  ? "Nenhuma conta encontrada com os filtros aplicados"
                  : "Nenhuma conta inadimplente encontrada"}
              </p>
              <p className="text-sm mt-2 text-gray-400">
                {!searchTerm
                  ? "Todos os pacientes estão em dia com os pagamentos"
                  : ""}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 text-sm text-green-600 hover:text-green-700"
                >
                  Limpar busca
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
