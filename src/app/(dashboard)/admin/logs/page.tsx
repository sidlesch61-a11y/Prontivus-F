"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  FileText, 
  Search, 
  Download, 
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Loader2
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  user_id?: number;
  details?: string;
}

const LOG_LEVELS = [
  { value: 'all', label: 'Todos os Níveis' },
  { value: 'error', label: 'Erros' },
  { value: 'warning', label: 'Avisos' },
  { value: 'info', label: 'Informações' },
  { value: 'debug', label: 'Debug' },
];

const LOG_SOURCES = [
  { value: 'all', label: 'Todas as Fontes' },
  { value: 'auth', label: 'Autenticação' },
  { value: 'api', label: 'API' },
  { value: 'database', label: 'Banco de Dados' },
  { value: 'system', label: 'Sistema' },
  { value: 'security', label: 'Segurança' },
];

export default function AdminLogsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated && user?.role !== "admin") {
      router.push("/unauthorized");
      return;
    }
    
    if (isAuthenticated) {
      loadLogs();
    }
  }, [isAuthenticated, isLoading, user, router, levelFilter, sourceFilter, searchTerm]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getLogs({ level: levelFilter, source: sourceFilter, search: searchTerm });
      setLogs(response as any);
    } catch (error) {
      console.error("Failed to load logs:", error);
      toast.error("Falha ao carregar logs");
    } finally {
      setLoading(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'default';
      case 'debug':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'debug':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return '';
    }
  };

  const filteredLogs = logs;

  // Calculate statistics
  const stats = {
    total: logs.length,
    errors: logs.filter(l => l.level === 'error').length,
    warnings: logs.filter(l => l.level === 'warning').length,
    info: logs.filter(l => l.level === 'info').length,
    debug: logs.filter(l => l.level === 'debug').length,
  };

  const exportLogs = () => {
    const csvContent = [
      'Timestamp,Nível,Fonte,Mensagem,Detalhes',
      ...filteredLogs.map(log => 
        `"${log.timestamp}","${log.level}","${log.source}","${log.message}","${log.details || ''}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Logs exportados com sucesso");
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-7 w-7 text-blue-600" />
            </div>
            Logs do Sistema
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Monitore a atividade do sistema e resolva problemas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadLogs}
            disabled={loading}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Logs
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registros encontrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Erros
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.errors}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avisos
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.warnings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Alertas do sistema
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Informações
            </CardTitle>
            <Info className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.info}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Eventos informativos
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Debug
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.debug}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Logs de depuração
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-48 border-blue-200 focus:border-blue-500">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                {LOG_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full md:w-48 border-blue-200 focus:border-blue-500">
                <SelectValue placeholder="Fonte" />
              </SelectTrigger>
              <SelectContent>
                {LOG_SOURCES.map((source) => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Entradas de Log ({filteredLogs.length})
              </CardTitle>
              <CardDescription className="mt-1">
                Atividade recente do sistema e eventos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all",
                  log.level === 'error' && "border-red-200 bg-red-50/30 hover:bg-red-50/50",
                  log.level === 'warning' && "border-yellow-200 bg-yellow-50/30 hover:bg-yellow-50/50",
                  log.level === 'info' && "border-blue-200 bg-blue-50/30 hover:bg-blue-50/50",
                  log.level === 'debug' && "border-gray-200 bg-gray-50/30 hover:bg-gray-50/50"
                )}
                onClick={() => setSelectedLog(log)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={cn(
                      "p-2 rounded-lg",
                      log.level === 'error' && "bg-red-100",
                      log.level === 'warning' && "bg-yellow-100",
                      log.level === 'info' && "bg-blue-100",
                      log.level === 'debug' && "bg-gray-100"
                    )}>
                      {getLevelIcon(log.level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2 flex-wrap">
                        <Badge className={cn("border", getLevelBadgeColor(log.level))}>
                          {log.level.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="bg-white">
                          {log.source}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </span>
                        {log.user_id && (
                          <Badge variant="outline" className="bg-white">
                            Usuário: {log.user_id}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{log.message}</p>
                      {log.details && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum log encontrado com os critérios selecionados</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getLevelIcon(selectedLog.level)}
                Detalhes do Log #{selectedLog.id}
              </DialogTitle>
              <DialogDescription>
                Informações detalhadas sobre esta entrada de log
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Timestamp</Label>
                  <p className="text-sm font-medium">{new Date(selectedLog.timestamp).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Nível</Label>
                  <div className="flex items-center space-x-2">
                    {getLevelIcon(selectedLog.level)}
                    <Badge className={cn("border", getLevelBadgeColor(selectedLog.level))}>
                      {selectedLog.level.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fonte</Label>
                  <p className="text-sm font-medium">{selectedLog.source}</p>
                </div>
                {selectedLog.user_id && (
                  <div>
                    <Label className="text-muted-foreground">ID do Usuário</Label>
                    <p className="text-sm font-medium">{selectedLog.user_id}</p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">Mensagem</Label>
                <p className="text-sm font-medium mt-1">{selectedLog.message}</p>
              </div>
              {selectedLog.details && (
                <div>
                  <Label className="text-muted-foreground">Detalhes</Label>
                  <Textarea
                    value={selectedLog.details}
                    readOnly
                    rows={6}
                    className="mt-1 font-mono text-xs"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
