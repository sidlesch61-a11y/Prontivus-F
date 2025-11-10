"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Loader2, 
  FileText, 
  Download, 
  Play, 
  Settings, 
  Calendar, 
  Filter,
  AlertCircle,
  CheckCircle2,
  Database,
  BarChart3,
  Activity,
  DollarSign,
  Stethoscope,
  Clock,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Domain = 'appointments' | 'financial' | 'clinical';

const PERIOD_OPTIONS = [
  { value: 'last_7_days', label: 'Últimos 7 dias' },
  { value: 'last_30_days', label: 'Últimos 30 dias' },
  { value: 'last_month', label: 'Mês passado' },
  { value: 'last_3_months', label: 'Últimos 3 meses' },
  { value: 'last_year', label: 'Último ano' },
];

const DOMAIN_OPTIONS = [
  { value: 'appointments' as Domain, label: 'Consultas', icon: Calendar, color: 'blue' },
  { value: 'financial' as Domain, label: 'Financeiro', icon: DollarSign, color: 'emerald' },
  { value: 'clinical' as Domain, label: 'Clínico', icon: Stethoscope, color: 'purple' },
];

const GROUP_LABELS: Record<string, string> = {
  'status': 'Status',
  'doctor': 'Médico',
  'service': 'Serviço',
  'cid10': 'CID-10'
};

const COLUMN_LABELS: Record<string, string> = {
  'status': 'Status',
  'doctor': 'Médico',
  'service': 'Serviço',
  'cid10': 'CID-10',
  'count': 'Quantidade',
  'sum_revenue': 'Receita Total (R$)'
};

export default function CustomReportsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [domain, setDomain] = useState<Domain>('appointments');
  const [period, setPeriod] = useState('last_30_days');
  const [groupBy, setGroupBy] = useState<string[]>(['status']);
  const [result, setResult] = useState<{ columns: string[]; rows: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading]);

  const availableGroups = useMemo(() => {
    if (domain === 'appointments') return ['status', 'doctor'];
    if (domain === 'financial') return ['doctor', 'service'];
    return ['cid10'];
  }, [domain]);

  // Reset groupBy when domain changes
  useEffect(() => {
    if (domain === 'appointments') {
      setGroupBy(['status']);
    } else if (domain === 'financial') {
      setGroupBy(['doctor']);
    } else {
      setGroupBy(['cid10']);
    }
    setResult(null);
    setError(null);
  }, [domain]);

  const toggleGroup = (g: string) => {
    setGroupBy(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const runReport = async () => {
    if (groupBy.length === 0) {
      toast.error('Selecione pelo menos uma opção para agrupar');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await api.post<{ columns: string[]; rows: any[] }>(
        '/api/analytics/custom/run',
        { domain, period, group_by: groupBy, metrics: domain === 'financial' ? ['sum_revenue'] : ['count'] }
      );
      
      if (res && res.columns && res.rows) {
        setResult(res);
        if (res.rows.length === 0) {
          toast.info('Nenhum dado encontrado para os filtros selecionados');
        } else {
          toast.success(`Relatório gerado com ${res.rows.length} registros`);
        }
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (err: any) {
      console.error('Erro ao gerar relatório:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Erro ao gerar relatório';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    if (!result || result.rows.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('clinicore_access_token') : null;
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/export/custom/excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          title: `Relatório ${domain === 'appointments' ? 'Consultas' : domain === 'financial' ? 'Financeiro' : 'Clínico'}`, 
          columns: result.columns, 
          rows: result.rows 
        }),
      });

      if (!resp.ok) {
        throw new Error('Erro ao exportar relatório');
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_${domain}_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  const currentDomain = DOMAIN_OPTIONS.find(d => d.value === domain);
  const DomainIcon = currentDomain?.icon || FileText;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg text-white shadow-lg">
              <Settings className="h-6 w-6" />
            </div>
            Construtor de Relatórios
          </h1>
          <p className="text-muted-foreground">
            Crie relatórios personalizados com filtros e agrupamentos customizados
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="default" 
            onClick={runReport} 
            disabled={loading || groupBy.length === 0}
            className="gap-2"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Executar Relatório
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={exportExcel} 
            disabled={!result || result.rows.length === 0}
            className="gap-2"
            size="lg"
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuração do Relatório
            </CardTitle>
            <Badge variant="outline" className="gap-1">
              <Database className="h-3 w-3" />
              {currentDomain?.label || 'Domínio'}
            </Badge>
          </div>
          <CardDescription>
            Configure os parâmetros do relatório personalizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Domain Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Domínio
              </label>
              <Select value={domain} onValueChange={(v) => setDomain(v as Domain)}>
                <SelectTrigger className="h-10 w-full sm:w-[280px]">
                  <DomainIcon className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOMAIN_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Period Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período
              </label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="h-10 w-full sm:w-[280px]">
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
            </div>

            <Separator />

            {/* Group By Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Agrupar por <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {availableGroups.map(g => (
                  <Button 
                    key={g} 
                    variant={groupBy.includes(g) ? 'default' : 'outline'} 
                    onClick={() => toggleGroup(g)}
                    className={cn(
                      "gap-2",
                      groupBy.includes(g) && "shadow-sm"
                    )}
                  >
                    {groupBy.includes(g) && <CheckCircle2 className="h-4 w-4" />}
                    {GROUP_LABELS[g] || g}
                  </Button>
                ))}
              </div>
              {groupBy.length === 0 && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Selecione pelo menos uma opção para agrupar
                </p>
              )}
              {groupBy.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {groupBy.length} {groupBy.length === 1 ? 'opção selecionada' : 'opções selecionadas'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro ao Gerar Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={runReport} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-sm font-medium mb-1">Gerando relatório...</p>
            <p className="text-xs text-muted-foreground">
              Isso pode levar alguns segundos
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && result.rows.length > 0 && (
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-violet-600" />
                  Resultado do Relatório
                </CardTitle>
                <CardDescription className="mt-1">
                  Dados agrupados conforme a configuração selecionada
                </CardDescription>
              </div>
              <Badge variant="outline" className="gap-1">
                <Database className="h-3 w-3" />
                {result.rows.length} {result.rows.length === 1 ? 'registro' : 'registros'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {result.columns.map(col => (
                        <TableHead key={col} className="font-semibold">
                          {COLUMN_LABELS[col] || col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.rows.map((row, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
                        {result.columns.map(col => {
                          let value = row[col] ?? '';
                          if (col === 'sum_revenue' && typeof value === 'number') {
                            value = new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(value);
                          }
                          return (
                            <TableCell key={col} className="font-medium">
                              {String(value)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty Result State */}
      {result && result.rows.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Não há registros para os filtros selecionados. Tente ajustar o período ou os critérios de agrupamento.
            </p>
            <Button variant="outline" onClick={runReport} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


