"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReceiptText, Search, Calendar, DollarSign, RefreshCw } from "lucide-react";
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
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Receivable {
  id: number;
  patient_id: number;
  patient_name: string;
  amount: number;
  paid_amount: number;
  outstanding_amount: number;
  due_date: string;
  issue_date: string | null;
  status: string;
  invoice_status: string;
  days_overdue: number;
  appointment_id: number | null;
}

export default function ContasReceberPage() {
  const [loading, setLoading] = useState(true);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [filteredReceivables, setFilteredReceivables] = useState<Receivable[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadReceivables();
  }, []);

  useEffect(() => {
    filterReceivables();
  }, [receivables, searchTerm, statusFilter]);

  const loadReceivables = async () => {
    try {
      setLoading(true);
      const data = await api.get<Receivable[]>("/api/v1/financial/doctor/accounts-receivable");
      setReceivables(data);
    } catch (error: any) {
      console.error("Failed to load receivables:", error);
      toast.error("Erro ao carregar contas a receber", {
        description: error?.message || error?.detail || "Não foi possível carregar as contas a receber",
      });
      setReceivables([]);
    } finally {
      setLoading(false);
    }
  };

  const filterReceivables = () => {
    let filtered = [...receivables];
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(rec => 
        rec.patient_name.toLowerCase().includes(search)
      );
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(rec => {
        if (statusFilter === "paid") {
          return rec.status === "Pago";
        } else if (statusFilter === "pending") {
          return rec.status === "Pendente";
        } else if (statusFilter === "overdue") {
          return rec.status === "Atrasado";
        }
        return true;
      });
    }
    
    setFilteredReceivables(filtered);
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

  const getStatusBadge = (status: string, daysOverdue: number) => {
    if (status === "Pago") {
      return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
    } else if (status === "Atrasado") {
      return (
        <Badge className="bg-red-100 text-red-800">
          Atrasado {daysOverdue > 0 ? `(${daysOverdue} dias)` : ""}
        </Badge>
      );
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    }
  };

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
            <ReceiptText className="h-8 w-8 text-green-600" />
            Contas a Receber
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie as contas a receber dos seus atendimentos
          </p>
        </div>
        <button
          onClick={loadReceivables}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Atualizar"
        >
          <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Contas a Receber</CardTitle>
              <CardDescription>
                {filteredReceivables.length} {filteredReceivables.length === 1 ? "conta encontrada" : "contas encontradas"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar paciente..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReceivables.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Valor Pago</TableHead>
                  <TableHead>Valor Pendente</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceivables.map((receivable) => (
                  <TableRow key={receivable.id}>
                    <TableCell className="font-medium">{receivable.patient_name}</TableCell>
                    <TableCell className="font-semibold text-gray-900">
                      {formatCurrency(receivable.amount)}
                    </TableCell>
                    <TableCell className="text-green-600">
                      {formatCurrency(receivable.paid_amount)}
                    </TableCell>
                    <TableCell className="font-semibold text-orange-600">
                      {formatCurrency(receivable.outstanding_amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(receivable.due_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(receivable.status, receivable.days_overdue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <ReceiptText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>
                {searchTerm || statusFilter !== "all"
                  ? "Nenhuma conta encontrada com os filtros aplicados"
                  : "Nenhuma conta a receber encontrada"}
              </p>
              {(searchTerm || statusFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  className="mt-4 text-sm text-green-600 hover:text-green-700"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
