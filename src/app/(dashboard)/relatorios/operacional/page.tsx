"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { BarChart, LineChart } from '@/components/charts';
import { useOperationalAnalytics } from '@/lib/analytics-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar, 
  Clock, 
  Loader2, 
  Download, 
  RefreshCw,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Stethoscope,
  Timer,
  Filter,
  BarChart3,
  FileText,
  Eye,
  Printer,
  FileSpreadsheet
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

export default function OperationalReportsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState('last_30_days');
  const { data, isLoading: swrLoading, error, refresh } = useOperationalAnalytics(period);

  useEffect(() => {
    if (!swrLoading && !isAuthenticated && !authLoading) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, authLoading, swrLoading]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!data) return null;
    
    const totalAppointments = data.total_appointments || 0;
    const completedAppointments = data.completed_appointments || 0;
    const completionRate = data.completion_rate || 0;
    const avgWaitTime = Math.round(data.avg_wait_time_minutes || 0);
    const noShows = data.no_shows || 0;
    const cancelledAppointments = totalAppointments - completedAppointments - noShows;

    return {
      totalAppointments,
      completedAppointments,
      completionRate,
      avgWaitTime,
      noShows,
      cancelledAppointments,
    };
  }, [data]);

  const handleRefresh = () => {
    refresh();
    toast.success('Dados atualizados');
  };

  const handleExport = async () => {
    if (!data) {
      toast.error('Não há dados para exportar');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('clinicore_access_token') : null;
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/export/operational/excel?period=${period}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!resp.ok) {
        throw new Error('Erro ao exportar relatório');
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_operacional_${period}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Relatório exportado com sucesso');
    } catch (err: any) {
      console.error('Erro ao exportar:', err);
      toast.error('Erro ao exportar relatório');
    }
  };

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
          <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg text-white shadow-lg">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios Operacionais</h1>
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
              {error.message || 'Erro desconhecido ao carregar os dados operacionais'}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg text-white shadow-lg">
              <Activity className="h-6 w-6" />
            </div>
            Relatórios Operacionais
          </h1>
          <p className="text-muted-foreground">
            Análise de eficiência operacional e desempenho da clínica
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
          <Button variant="outline" onClick={handleExport} disabled={!data} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
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
            Selecione o período para análise dos dados operacionais
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
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Consultas
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.totalAppointments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  No período selecionado
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Consultas Concluídas
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.completedAppointments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summaryStats.completionRate}% de conclusão
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tempo Médio de Espera
                </CardTitle>
                <Timer className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <Clock className="h-5 w-5 text-amber-500" />
                  {summaryStats.avgWaitTime} min
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tempo médio de espera
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Faltas
                </CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{summaryStats.noShows}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summaryStats.totalAppointments > 0 
                    ? Math.round((summaryStats.noShows / summaryStats.totalAppointments) * 100) 
                    : 0}% do total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Summary Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Utilization Chart */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Taxa de Utilização de Agenda
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Distribuição de consultas por dia da semana
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Activity className="h-3 w-3" />
                    {data.utilization?.length || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {data.utilization && data.utilization.length > 0 ? (
                  <BarChart
                    data={{
                      labels: data.utilization.map((x) => x.label),
                      datasets: [{
                        label: 'Consultas',
                        data: data.utilization.map((x) => x.value),
                        backgroundColor: CHART_COLORS.primary,
                        borderColor: CHART_COLORS.primary,
                        borderWidth: 1,
                      }],
                    }}
                    height={300}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">Nenhum dado disponível</p>
                    <p className="text-xs text-muted-foreground">
                      Não há dados de utilização no período selecionado
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Operational Summary */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      Resumo Operacional
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Estatísticas detalhadas do período
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {data.period || 'Período'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 bg-muted/30">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Período:</span>
                      <span className="font-semibold">
                        {new Date(data.start_date).toLocaleDateString('pt-BR')} - {new Date(data.end_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50/50">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Total de Consultas:</span>
                      </div>
                      <Badge variant="outline" className="font-semibold">
                        {summaryStats.totalAppointments}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50/50">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium">Consultas Concluídas:</span>
                      </div>
                      <Badge variant="outline" className="font-semibold bg-emerald-100 text-emerald-800 border-emerald-200">
                        {summaryStats.completedAppointments}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-amber-50/50">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium">Taxa de Conclusão:</span>
                      </div>
                      <Badge variant="outline" className="font-semibold bg-amber-100 text-amber-800 border-amber-200">
                        {summaryStats.completionRate}%
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-purple-50/50">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Tempo Médio de Espera:</span>
                      </div>
                      <Badge variant="outline" className="font-semibold">
                        {summaryStats.avgWaitTime} min
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-red-50/50">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium">Faltas:</span>
                      </div>
                      <Badge variant="outline" className="font-semibold bg-red-100 text-red-800 border-red-200">
                        {summaryStats.noShows}
                      </Badge>
                    </div>

                    {summaryStats.cancelledAppointments > 0 && (
                      <div className="flex justify-between items-center p-3 rounded-lg bg-orange-50/50">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium">Canceladas:</span>
                        </div>
                        <Badge variant="outline" className="font-semibold bg-orange-100 text-orange-800 border-orange-200">
                          {summaryStats.cancelledAppointments}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}


