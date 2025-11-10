"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { BarChart, LineChart, PieChart } from '@/components/charts';
import { FinancialAnalytics } from '@/lib/analytics-api';
import { useFinancialAnalytics } from '@/lib/analytics-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DollarSign, 
  Loader2, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  FileText, 
  CreditCard,
  Calendar,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  BarChart3,
  Receipt,
  Wallet,
  Eye,
  Printer,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Healthcare color palette - Softer blue tones (preferred by both genders)
const CHART_COLORS = {
  primary: '#5b9eff',      // Primary soft blue
  secondary: '#7db5ff',   // Light soft blue
  accent: '#a5d0ff',      // Very soft blue
  info: '#3d7ee8',        // Medium soft blue
  blue: '#5b9eff',        // Primary soft blue
  blueLight: '#a5d0ff',   // Light soft blue
  blueMedium: '#7db5ff',  // Medium soft blue
  blueDeep: '#3d7ee8',    // Deeper soft blue
  softBlue1: '#c7e2ff',   // Very light soft blue
  softBlue2: '#e0efff',  // Extremely light soft blue
  green: '#4ade80',       // Soft green for success
  danger: '#ef4444',      // Keep red for errors/warnings
};

const PERIOD_OPTIONS = [
  { value: 'last_7_days', label: 'Últimos 7 dias' },
  { value: 'last_30_days', label: 'Últimos 30 dias' },
  { value: 'last_month', label: 'Mês passado' },
  { value: 'last_3_months', label: 'Últimos 3 meses' },
  { value: 'last_year', label: 'Último ano' },
];

const generateColors = (count: number) => {
  const colors = Object.values(CHART_COLORS);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
};

export default function FinancialReportsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState('last_month');
  const { data, isLoading: swrLoading, error, refresh } = useFinancialAnalytics(period);

  const handleRefresh = () => {
    refresh();
    toast.success('Dados atualizados');
  };

  const exportExcel = async () => {
    if (!data) {
      toast.error('Não há dados para exportar');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('clinicore_access_token') : null;
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const url = `${base}/api/analytics/export/financial/excel?period=${period}`;
      const resp = await fetch(url, { 
        headers: { 
          'Authorization': `Bearer ${token}` 
        } 
      });
      
      if (!resp.ok) {
        throw new Error('Erro ao exportar relatório');
      }
      
      const blob = await resp.blob();
      const dlUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `relatorio_financeiro_${period}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(dlUrl);
      toast.success('Relatório exportado com sucesso');
    } catch (err: any) {
      console.error('Erro ao exportar:', err);
      toast.error('Erro ao exportar relatório');
    }
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!data) return null;
    
    const totalRevenue = data.total_revenue || 0;
    const totalInvoices = data.total_invoices || 0;
    const avgInvoiceValue = data.average_invoice_value || 0;
    const totalAR = data.ar_aging ? (
      (data.ar_aging.current || 0) +
      (data.ar_aging["1-30"] || 0) +
      (data.ar_aging["31-60"] || 0) +
      (data.ar_aging["61-90"] || 0) +
      (data.ar_aging[">90"] || 0)
    ) : 0;
    const overdueAR = data.ar_aging ? (
      (data.ar_aging["61-90"] || 0) +
      (data.ar_aging[">90"] || 0)
    ) : 0;

    return {
      totalRevenue,
      totalInvoices,
      avgInvoiceValue,
      totalAR,
      overdueAR,
    };
  }, [data]);

  useEffect(() => {
    if (!swrLoading && !isAuthenticated && !authLoading) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, authLoading, swrLoading]);

  if (authLoading || swrLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg text-white shadow-lg">
          <DollarSign className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>
        </div>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro ao Carregar Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error.message || 'Erro desconhecido ao carregar os dados financeiros'}
            </p>
            <Button onClick={handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg text-white shadow-lg">
          <DollarSign className="h-6 w-6" />
            </div>
            Relatórios Financeiros
          </h1>
          <p className="text-muted-foreground">
            Análise completa de receitas, faturas e recebíveis
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={swrLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", swrLoading && "animate-spin")} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportExcel} disabled={!data} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Period Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Período
            </CardTitle>
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              {PERIOD_OPTIONS.find(p => p.value === period)?.label || 'Período'}
            </Badge>
          </div>
          <CardDescription>
            Selecione o período para análise dos dados financeiros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-10 w-full sm:w-[250px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {data && summaryStats && (
        <>
          {/* Summary Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita Total
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  No período selecionado
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Faturas
                </CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.totalInvoices}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Faturas emitidas
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ticket Médio
                </CardTitle>
                <Receipt className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summaryStats.avgInvoiceValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Valor médio por fatura
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Recebíveis em Aberto
                </CardTitle>
                <Wallet className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalAR)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summaryStats.overdueAR > 0 && (
                    <span className="text-red-600 font-medium">
                      {formatCurrency(summaryStats.overdueAR)} vencidos
                    </span>
                  )}
                  {summaryStats.overdueAR === 0 && 'Todos em dia'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Doctor */}
            <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-emerald-600" />
                      Receita por Médico
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Receita gerada por cada médico no período
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <DollarSign className="h-3 w-3" />
                    {data.revenue_by_doctor?.length || 0}
                  </Badge>
                </div>
          </CardHeader>
          <CardContent>
            {data?.revenue_by_doctor && data.revenue_by_doctor.length > 0 ? (
              <BarChart
                data={{
                  labels: data.revenue_by_doctor.map(d => d.doctor_name || 'Desconhecido'),
                  datasets: [{
                    label: 'Receita (R$)',
                    data: data.revenue_by_doctor.map(d => d.total_revenue),
                        backgroundColor: CHART_COLORS.accent,
                        borderColor: CHART_COLORS.accent,
                        borderWidth: 1,
                  }],
                }}
                height={300}
                    options={{
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value: any) {
                              return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                          }
                        }
                      }
                    }}
              />
            ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">Nenhum dado disponível</p>
                    <p className="text-xs text-muted-foreground">
                      Não há receita registrada no período selecionado
                    </p>
              </div>
            )}
          </CardContent>
        </Card>

            {/* Revenue by Service */}
            <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-amber-600" />
                      Receita por Serviço
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Participação de cada serviço na receita total
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {data.revenue_by_service?.length || 0}
                  </Badge>
                </div>
          </CardHeader>
          <CardContent>
            {data?.revenue_by_service && data.revenue_by_service.length > 0 ? (
              <PieChart
                data={{
                  labels: data.revenue_by_service.map(s => s.service_name || 'Desconhecido'),
                  datasets: [{
                    label: 'Receita (R$)',
                    data: data.revenue_by_service.map(s => s.total_revenue),
                        backgroundColor: generateColors(data.revenue_by_service.length),
                  }],
                }}
                height={300}
              />
            ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">Nenhum dado disponível</p>
                    <p className="text-xs text-muted-foreground">
                      Não há serviços com receita no período selecionado
                    </p>
              </div>
            )}
          </CardContent>
        </Card>

            {/* Monthly Revenue Trend */}
            <Card className="lg:col-span-2 hover:shadow-lg transition-shadow">
          <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Tendência Mensal de Receita
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Evolução da receita ao longo do tempo
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <BarChart3 className="h-3 w-3" />
                    {data.monthly_revenue_trend?.length || 0} meses
                  </Badge>
                </div>
          </CardHeader>
          <CardContent>
            {data?.monthly_revenue_trend && data.monthly_revenue_trend.length > 0 ? (
              <LineChart
                data={{
                  labels: data.monthly_revenue_trend.map(m => {
                    try {
                      const [year, month] = m.month.split('-');
                      const date = new Date(parseInt(year), parseInt(month) - 1);
                      return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                    } catch {
                      return m.month;
                    }
                  }),
                  datasets: [{
                    label: 'Receita (R$)',
                    data: data.monthly_revenue_trend.map(m => m.total_revenue),
                        borderColor: CHART_COLORS.primary,
                        backgroundColor: CHART_COLORS.primary + '20',
                    tension: 0.4,
                    fill: true,
                  }],
                }}
                height={300}
                    options={{
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value: any) {
                              return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                          }
                        }
                      }
                    }}
              />
            ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">Nenhum dado disponível</p>
                    <p className="text-xs text-muted-foreground">
                      Não há dados de receita mensal no período selecionado
                    </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AR Aging and Cost per Procedure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AR Aging */}
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
          <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-orange-600" />
                      Aging de Recebíveis
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Saldo em aberto por faixa de vencimento
                    </CardDescription>
                  </div>
                  {summaryStats.overdueAR > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Vencidos
                    </Badge>
                  )}
                </div>
          </CardHeader>
          <CardContent>
            {data?.ar_aging ? (
              <>
                <BarChart
                  data={{
                    labels: ['Atual', '1-30 dias', '31-60 dias', '61-90 dias', '>90 dias'],
                    datasets: [{
                      label: 'Valor (R$)',
                      data: [
                        data.ar_aging.current || 0,
                        data.ar_aging["1-30"] || 0,
                        data.ar_aging["31-60"] || 0,
                        data.ar_aging["61-90"] || 0,
                        data.ar_aging[">90"] || 0
                      ],
                      backgroundColor: [
                            CHART_COLORS.secondary, // green for current
                            CHART_COLORS.primary,   // blue for 1-30
                            CHART_COLORS.accent,    // orange for 31-60
                            CHART_COLORS.danger,     // red for 61-90
                            '#dc2626'                // dark red for >90
                          ],
                          borderColor: [
                            CHART_COLORS.secondary,
                            CHART_COLORS.primary,
                            CHART_COLORS.accent,
                            CHART_COLORS.danger,
                            '#dc2626'
                          ],
                          borderWidth: 1,
                    }],
                  }}
                  height={280}
                      options={{
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: function(value: any) {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                              }
                            }
                          }
                        }
                      }}
                    />
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total em aberto</p>
                        <p className="text-lg font-semibold">{formatCurrency(summaryStats.totalAR)}</p>
                      </div>
                      {summaryStats.overdueAR > 0 && (
                        <div className="text-right">
                          <p className="text-sm text-red-600 font-medium">Vencidos</p>
                          <p className="text-lg font-semibold text-red-600">{formatCurrency(summaryStats.overdueAR)}</p>
                        </div>
                      )}
                </div>
              </>
            ) : (
                  <div className="flex flex-col items-center justify-center h-[280px] text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Wallet className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">Nenhum dado disponível</p>
                    <p className="text-xs text-muted-foreground">
                      Não há recebíveis em aberto no período
                    </p>
              </div>
            )}
          </CardContent>
        </Card>

            {/* Cost per Procedure */}
            <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-purple-600" />
                      Custo Médio por Procedimento
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Ticket médio por serviço
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {data.cost_per_procedure?.length || 0}
                  </Badge>
                </div>
          </CardHeader>
          <CardContent>
            {data?.cost_per_procedure && data.cost_per_procedure.length > 0 ? (
              <BarChart
                data={{
                  labels: data.cost_per_procedure.map(x => x.service_name || 'Desconhecido'),
                  datasets: [{
                    label: 'Ticket Médio (R$)',
                    data: data.cost_per_procedure.map(x => x.avg_cost || 0),
                        backgroundColor: CHART_COLORS.purple,
                        borderColor: CHART_COLORS.purple,
                        borderWidth: 1,
                  }],
                }}
                height={280}
                    options={{
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value: any) {
                              return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                          }
                        }
                      }
                    }}
              />
            ) : (
                  <div className="flex flex-col items-center justify-center h-[280px] text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Receipt className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">Nenhum dado disponível</p>
                    <p className="text-xs text-muted-foreground">
                      Não há dados de custo por procedimento no período
                    </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </>
      )}
    </div>
  );
}


