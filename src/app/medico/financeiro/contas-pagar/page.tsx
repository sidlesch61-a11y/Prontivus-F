"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Search, Calendar, RefreshCw } from "lucide-react";
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

interface Payable {
  id: number;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  days_overdue?: number;
  category?: string | null;
}

export default function ContasPagarPage() {
  const [loading, setLoading] = useState(true);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [filteredPayables, setFilteredPayables] = useState<Payable[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadPayables();
  }, []);

  useEffect(() => {
    filterPayables();
  }, [payables, searchTerm, statusFilter]);

  const loadPayables = async () => {
    try {
      setLoading(true);
      const data = await api.get<Payable[]>("/api/v1/financial/doctor/accounts-payable");
      setPayables(data);
    } catch (error: any) {
      console.error("Failed to load payables:", error);
      toast.error("Erro ao carregar contas a pagar", {
        description: error?.message || error?.detail || "Não foi possível carregar as contas a pagar",
      });
      setPayables([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPayables = () => {
    let filtered = [...payables];
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(pay => 
        pay.description.toLowerCase().includes(search) ||
        (pay.category && pay.category.toLowerCase().includes(search))
      );
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(pay => {
        if (statusFilter === "paid") {
          return pay.status === "paid" || pay.status === "Pago";
        } else if (statusFilter === "pending") {
          return pay.status === "pending" || pay.status === "Pendente";
        }
        return true;
      });
    }
    
    setFilteredPayables(filtered);
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

  const getStatusBadge = (status: string, daysOverdue?: number) => {
    if (status === "paid" || status === "Pago") {
      return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
    } else if (daysOverdue && daysOverdue > 0) {
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
            <Wallet className="h-8 w-8 text-green-600" />
            Contas a Pagar
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie as suas despesas pessoais
          </p>
        </div>
        <button
          onClick={loadPayables}
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
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>
                {filteredPayables.length} {filteredPayables.length === 1 ? "conta encontrada" : "contas encontradas"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar conta..."
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
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayables.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayables.map((payable) => (
                  <TableRow key={payable.id}>
                    <TableCell className="font-medium">{payable.description}</TableCell>
                    <TableCell className="font-semibold text-red-600">
                      {formatCurrency(payable.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(payable.due_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payable.status, payable.days_overdue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>
                {searchTerm || statusFilter !== "all"
                  ? "Nenhuma conta encontrada com os filtros aplicados"
                  : "Nenhuma conta a pagar encontrada"}
              </p>
              <p className="text-sm mt-2 text-gray-400">
                {!searchTerm && statusFilter === "all"
                  ? "Você não possui despesas registradas no momento"
                  : ""}
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
