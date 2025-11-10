"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { financialApi } from "@/lib/financial-api";
import { Invoice } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { 
  Search, 
  Download, 
  Eye, 
  Calendar,
  FileCode,
  User,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  History,
  TrendingUp,
  AlertCircle,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TissHistoryEntry {
  id: number;
  invoiceId: number;
  patientName: string;
  generatedAt: string;
  generatedBy?: string;
  status: 'success' | 'error' | 'pending';
  fileName: string;
  fileSize: number;
  errorMessage?: string;
  downloadCount: number;
  lastDownloaded?: string;
  issueDate: string;
  totalAmount: number;
}


export default function TissHistoryPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [historyEntries, setHistoryEntries] = useState<TissHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated && !['admin', 'secretary'].includes(user?.role || '')) {
      router.push("/unauthorized");
      return;
    }
    if (isAuthenticated) {
      loadHistory();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      // Load invoices from database using financialApi
      const invoices = await financialApi.getInvoices();
      
      // Load download history from localStorage (tracking downloads)
      const downloadHistory = JSON.parse(localStorage.getItem('tiss-download-history') || '{}');
      
      // Convert invoices to TISS history entries
      const entries: TissHistoryEntry[] = await Promise.all(
        invoices.map(async (invoice) => {
          const invoiceId = invoice.id;
          const downloadInfo = downloadHistory[invoiceId] || { count: 0, lastDownloaded: null };
          
          // Try to validate/get TISS XML to check if it can be generated
          let status: 'success' | 'error' | 'pending' = 'pending';
          let errorMessage: string | undefined = undefined;
          let fileSize = 0;
          
          try {
            // Try to get preview to check if XML can be generated
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('clinicore_access_token');
            
            const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/tiss-xml/preview`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            
            if (response.ok) {
              const blob = await response.blob();
              const xmlContent = await blob.text();
              fileSize = blob.size;
              status = 'success';
            } else {
              status = 'error';
              errorMessage = await response.text().catch(() => 'Não foi possível gerar XML TISS');
            }
          } catch (error: any) {
            status = 'error';
            errorMessage = error.message || 'Erro ao verificar XML TISS';
          }
          
          return {
            id: invoiceId,
            invoiceId: invoiceId,
            patientName: invoice.patient_name || `Paciente #${invoice.patient_id}`,
            generatedAt: invoice.issue_date || invoice.created_at,
            generatedBy: user?.email || user?.username || 'Sistema',
            status: status,
            fileName: `tiss_invoice_${String(invoiceId).padStart(6, '0')}.xml`,
            fileSize: fileSize,
            errorMessage: errorMessage,
            downloadCount: downloadInfo.count || 0,
            lastDownloaded: downloadInfo.lastDownloaded || undefined,
            issueDate: invoice.issue_date,
            totalAmount: invoice.total_amount
          };
        })
      );
      
      // Sort by date (most recent first)
      entries.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
      
      setHistoryEntries(entries);
    } catch (error: any) {
      console.error("Failed to load TISS history:", error);
      toast.error("Erro ao carregar histórico TISS", {
        description: error.message || "Não foi possível carregar o histórico TISS"
      });
      setHistoryEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Sucesso
        </Badge>
      );
    } else if (status === 'pending') {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Erro
        </Badge>
      );
    }
  };

  const handleDownload = async (entry: TissHistoryEntry) => {
    if (entry.status === 'error' || entry.status === 'pending') {
      toast.error("Não é possível baixar arquivo com erro ou pendente");
      return;
    }

    try {
      setDownloadingIds(prev => new Set(prev).add(entry.invoiceId));
      
      // Download TISS XML from backend
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('clinicore_access_token');
      
      const response = await fetch(`${API_URL}/api/invoices/${entry.invoiceId}/tiss-xml`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login on 401
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return;
        }
        
        // Try to get error message from response
        let errorMessage = `Falha ao baixar: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = typeof errorData.detail === 'string' 
              ? errorData.detail 
              : JSON.stringify(errorData.detail);
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // If response is not JSON, use status text
          if (response.status === 404) {
            errorMessage = "Fatura não encontrada ou não foi possível gerar o XML TISS. Verifique se a fatura existe e possui todos os dados necessários.";
          }
        }
        
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = entry.fileName;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      // Update download history
      const downloadHistory = JSON.parse(localStorage.getItem('tiss-download-history') || '{}');
      downloadHistory[entry.invoiceId] = {
        count: (downloadHistory[entry.invoiceId]?.count || 0) + 1,
        lastDownloaded: new Date().toISOString()
      };
      localStorage.setItem('tiss-download-history', JSON.stringify(downloadHistory));
      
      // Update entry in state
      const updatedEntries = historyEntries.map(e => 
        e.id === entry.id 
          ? { 
              ...e, 
              downloadCount: e.downloadCount + 1,
              lastDownloaded: new Date().toISOString()
            }
          : e
      );
      setHistoryEntries(updatedEntries);
      
      toast.success(`Arquivo ${entry.fileName} baixado com sucesso!`);
    } catch (error: any) {
      console.error("Failed to download TISS XML:", error);
      toast.error("Erro ao baixar arquivo TISS", {
        description: error.message || "Não foi possível baixar o arquivo TISS"
      });
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(entry.invoiceId);
        return newSet;
      });
    }
  };

  const handleView = async (entry: TissHistoryEntry) => {
    if (entry.status === 'error') {
      toast.error(`Erro: ${entry.errorMessage || 'Não foi possível gerar XML TISS'}`);
      return;
    }

    try {
      // Get preview XML from backend
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('clinicore_access_token');
      
      const response = await fetch(`${API_URL}/api/invoices/${entry.invoiceId}/tiss-xml/preview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return;
        }
        throw new Error(`Failed to load: ${response.statusText}`);
      }

      const xmlContent = await response.text();
      
      // Open XML in new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>TISS XML - ${entry.fileName}</title>
              <style>
                body { font-family: monospace; margin: 20px; background: #fff; }
                pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; border: 1px solid #ddd; }
                h2 { color: #333; }
                .info { margin: 10px 0; padding: 10px; background: #e8f4f8; border-radius: 5px; }
              </style>
            </head>
            <body>
              <h2>TISS XML - ${entry.fileName}</h2>
              <div class="info">
                <p><strong>Paciente:</strong> ${entry.patientName}</p>
                <p><strong>Fatura:</strong> #${entry.invoiceId}</p>
                <p><strong>Gerado em:</strong> ${formatDate(entry.generatedAt)}</p>
                <p><strong>Tamanho:</strong> ${formatFileSize(entry.fileSize)}</p>
              </div>
              <hr>
              <pre>${xmlContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } catch (error: any) {
      console.error("Failed to view TISS XML:", error);
      toast.error("Erro ao visualizar XML TISS", {
        description: error.message || "Não foi possível carregar o XML TISS"
      });
    }
  };

  const filteredEntries = useMemo(() => {
    return historyEntries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.invoiceId.toString().includes(searchTerm) ||
      entry.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
    
    const matchesDate = dateFilter === "all" || (() => {
      const entryDate = new Date(entry.generatedAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case "today": return daysDiff === 0;
        case "week": return daysDiff <= 7;
        case "month": return daysDiff <= 30;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  });
  }, [historyEntries, searchTerm, statusFilter, dateFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = historyEntries.length;
    const success = historyEntries.filter(e => e.status === 'success').length;
    const errors = historyEntries.filter(e => e.status === 'error').length;
    const downloads = historyEntries.reduce((sum, e) => sum + e.downloadCount, 0);
    
    return { total, success, errors, downloads };
  }, [historyEntries]);

  if (isLoading || (loading && historyEntries.length === 0)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-muted-foreground font-medium">Carregando histórico TISS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg text-white shadow-lg">
              <History className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            Histórico TISS XML
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Acompanhe o histórico de geração e download de arquivos TISS XML
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadHistory}
          disabled={loading}
          className="bg-white"
          size="sm"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-l-4 border-l-indigo-500 shadow-sm bg-gradient-to-br from-indigo-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Gerados</p>
                <p className="text-xl sm:text-2xl font-bold text-indigo-700">{stats.total}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg">
                <FileCode className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Sucessos</p>
                <p className="text-xl sm:text-2xl font-bold text-green-700">{stats.success}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500 shadow-sm bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Erros</p>
                <p className="text-xl sm:text-2xl font-bold text-red-700">{stats.errors}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Downloads</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">{stats.downloads}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <Download className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por paciente, fatura ou arquivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
              />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">7 dias</SelectItem>
                <SelectItem value="month">30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Histórico de Geração</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'arquivo encontrado' : 'arquivos encontrados'}
          </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground flex flex-col items-center justify-center gap-3">
              <FileCode className="h-10 w-10 sm:h-12 sm:w-12 opacity-50" />
              <p className="font-medium text-base sm:text-lg">Nenhum arquivo TISS XML encontrado</p>
              {searchTerm || statusFilter !== "all" || dateFilter !== "all" ? (
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              ) : (
                <p className="text-sm">As faturas aparecerão aqui quando o TISS XML for gerado</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                    <TableHead className="min-w-[80px]">Fatura</TableHead>
                    <TableHead className="min-w-[150px]">Paciente</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[200px]">Arquivo</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[150px]">Gerado em</TableHead>
                    <TableHead className="hidden xl:table-cell min-w-[120px]">Gerado por</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[100px]">Downloads</TableHead>
                    <TableHead className="text-right min-w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-medium">#{entry.invoiceId}</TableCell>
                      <TableCell className="truncate max-w-[150px]">{entry.patientName}</TableCell>
                      <TableCell className="hidden md:table-cell">
                    <div>
                      <div className="font-mono text-sm">{entry.fileName}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(entry.fileSize)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3.5 w-3.5" />
                      {formatDate(entry.generatedAt)}
                    </div>
                  </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3.5 w-3.5" />
                      {entry.generatedBy}
                    </div>
                  </TableCell>
                      <TableCell className="hidden lg:table-cell">
                    <div className="text-center">
                      <div className="font-medium">{entry.downloadCount}</div>
                      {entry.lastDownloaded && (
                        <div className="text-xs text-muted-foreground">
                          {formatDate(entry.lastDownloaded)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(entry)}
                        title="Visualizar XML"
                        disabled={entry.status === 'error' || entry.status === 'pending'}
                            className="h-8 w-8 p-0"
                      >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      {entry.status === 'success' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(entry)}
                          title="Baixar arquivo"
                          disabled={downloadingIds.has(entry.invoiceId)}
                              className="h-8 w-8 p-0"
                        >
                          {downloadingIds.has(entry.invoiceId) ? (
                                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          ) : (
                                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          )}
                        </Button>
                      )}
                      {entry.status === 'error' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/financeiro/tiss-validator?invoice=${entry.invoiceId}`)}
                          title="Validar e corrigir"
                              className="h-8 w-8 p-0"
                        >
                              <FileCode className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
