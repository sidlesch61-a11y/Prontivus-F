"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Download, Filter, Calendar, RefreshCw, Search } from "lucide-react";
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
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActiveClient {
  id: number;
  name: string;
  legal_name: string;
  tax_id: string;
  email: string;
  license_type: string;
  license_status: string;
  users: number;
  max_users: number;
  status: string;
  last_activity: string | null;
  revenue: number;
  created_at: string | null;
}

interface ActiveClientsStats {
  total_clients: number;
  active_clients: number;
  total_users: number;
  total_revenue: number;
  active_percentage: number;
}

export default function ClientesAtivosPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ActiveClient[]>([]);
  const [stats, setStats] = useState<ActiveClientsStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClients, setFilteredClients] = useState<ActiveClient[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter clients based on search term
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.tax_id.includes(searchTerm) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadClients(), loadStats()]);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error("Erro ao carregar dados", {
        description: error?.message || error?.detail || "Não foi possível carregar os dados",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const data = await api.get<{ total: number; clients: ActiveClient[] }>(
        "/api/v1/reports/active-clients"
      );
      setClients(data.clients);
      setFilteredClients(data.clients);
    } catch (error: any) {
      console.error("Failed to load clients:", error);
      toast.error("Erro ao carregar clientes", {
        description: error?.message || error?.detail || "Não foi possível carregar os clientes",
      });
      setClients([]);
      setFilteredClients([]);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.get<ActiveClientsStats>("/api/v1/reports/active-clients/stats");
      // Validate data structure
      if (data && typeof data === 'object') {
        setStats({
          total_clients: data.total_clients || 0,
          active_clients: data.active_clients || 0,
          total_users: data.total_users || 0,
          total_revenue: data.total_revenue || 0,
          active_percentage: data.active_percentage || 0,
        });
      } else {
        console.warn("Invalid stats data format:", data);
        setStats(null);
      }
    } catch (error: any) {
      console.error("Failed to load stats:", error);
      // Set default stats on error
      setStats({
        total_clients: 0,
        active_clients: 0,
        total_users: 0,
        total_revenue: 0,
        active_percentage: 0,
      });
    }
  };

  const handleExport = async () => {
    try {
      // For now, just show a message
      // In the future, this would generate and download a CSV/Excel file
      toast.info("Exportação em desenvolvimento", {
        description: "A funcionalidade de exportação será implementada em breve",
      });
    } catch (error: any) {
      console.error("Failed to export:", error);
      toast.error("Erro ao exportar", {
        description: error?.message || "Não foi possível exportar os dados",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getLicenseBadge = (licenseType: string) => {
    const badgeMap: Record<string, { label: string; className: string }> = {
      basic: { label: "Básico", className: "bg-blue-100 text-blue-800" },
      professional: { label: "Profissional", className: "bg-purple-100 text-purple-800" },
      enterprise: { label: "Enterprise", className: "bg-green-100 text-green-800" },
      custom: { label: "Customizado", className: "bg-gray-100 text-gray-800" },
    };
    
    const badge = badgeMap[licenseType.toLowerCase()] || {
      label: licenseType,
      className: "bg-gray-100 text-gray-800",
    };
    
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-600" />
            Clientes Ativos
          </h1>
          <p className="text-gray-600 mt-2">
            Relatório de todas as clínicas ativas no sistema
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.total_clients}</div>
              <p className="text-xs text-gray-500 mt-1">Clínicas cadastradas</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Clientes Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.active_clients}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.active_percentage.toFixed(0)}% ativos
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.total_users}</div>
              <p className="text-xs text-gray-500 mt-1">Usuários ativos</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(stats.total_revenue)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Últimos 30 dias</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Lista de Clientes Ativos</CardTitle>
              <CardDescription>
                {filteredClients.length} {filteredClients.length === 1 ? "clínica encontrada" : "clínicas encontradas"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar cliente..."
                  className="w-64 pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                className="bg-purple-600 hover:bg-purple-700 gap-2"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clínica</TableHead>
                    <TableHead>CNPJ/CPF</TableHead>
                    <TableHead>Licença</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Atividade</TableHead>
                    <TableHead className="text-right">Receita (30 dias)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{client.name}</div>
                          {client.email && (
                            <div className="text-xs text-gray-500">{client.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {client.tax_id}
                        </code>
                      </TableCell>
                      <TableCell>{getLicenseBadge(client.license_type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{client.users}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-gray-500">{client.max_users}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {client.last_activity ? (
                          <div>
                            <div>{formatDate(client.last_activity)}</div>
                            <div className="text-xs text-gray-500">
                              {format(parseISO(client.last_activity), "HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(client.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>
                {searchTerm
                  ? "Nenhum cliente encontrado com os filtros aplicados"
                  : "Nenhum cliente ativo encontrado"}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSearchTerm("")}
                >
                  Limpar busca
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
