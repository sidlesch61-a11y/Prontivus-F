"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Settings, FileText, CheckCircle2, AlertCircle, RefreshCw, Save, Upload, XCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface FiscalConfig {
  enabled: boolean;
  provider: string;
  environment: string;
  certificate_path: string;
  certificate_password: string;
  settings: {
    auto_issue: boolean;
    auto_send_email: boolean;
    auto_print: boolean;
  };
  last_sync: string | null;
}

interface FiscalDocument {
  id: number;
  number: string;
  type: string;
  status: string;
  issue_date: string | null;
  total_amount: number;
  fiscal_status: string;
  fiscal_number: string | null;
  fiscal_key: string | null;
}

interface FiscalStats {
  total_documents: number;
  issued_documents: number;
  pending_documents: number;
  failed_documents: number;
  last_sync: string | null;
}

const FISCAL_PROVIDERS = [
  { value: "nfe", label: "NFe (Nota Fiscal Eletrônica)" },
  { value: "nfse", label: "NFSe (Nota Fiscal de Serviços)" },
  { value: "focus", label: "Focus NFe" },
  { value: "bling", label: "Bling" },
];

const ENVIRONMENTS = [
  { value: "homologation", label: "Homologação" },
  { value: "production", label: "Produção" },
];

export default function FiscalPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [config, setConfig] = useState<FiscalConfig | null>(null);
  const [stats, setStats] = useState<FiscalStats | null>(null);
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
  const [formData, setFormData] = useState<FiscalConfig>({
    enabled: false,
    provider: "",
    environment: "homologation",
    certificate_path: "",
    certificate_password: "",
    settings: {
      auto_issue: false,
      auto_send_email: false,
      auto_print: false,
    },
    last_sync: null,
  });
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "success" | "error">("unknown");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadConfig(),
        loadStats(),
        loadDocuments(),
      ]);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error("Erro ao carregar dados", {
        description: error?.message || error?.detail || "Não foi possível carregar os dados",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const data = await api.get<FiscalConfig>("/api/v1/fiscal-config");
      setConfig(data);
      setFormData(data);
    } catch (error: any) {
      console.error("Failed to load fiscal config:", error);
      toast.error("Erro ao carregar configuração fiscal", {
        description: error?.message || error?.detail || "Não foi possível carregar a configuração",
      });
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.get<FiscalStats>("/api/v1/fiscal-config/stats");
      setStats(data);
    } catch (error: any) {
      console.error("Failed to load fiscal stats:", error);
      setStats(null);
    }
  };

  const loadDocuments = async () => {
    try {
      const data = await api.get<{ total: number; documents: FiscalDocument[] }>("/api/v1/fiscal-config/documents");
      setDocuments(data.documents);
    } catch (error: any) {
      console.error("Failed to load fiscal documents:", error);
      setDocuments([]);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      await api.put("/api/v1/fiscal-config", formData);
      setConfig(formData);
      toast.success("Configuração fiscal salva com sucesso!");
    } catch (error: any) {
      console.error("Failed to save fiscal config:", error);
      toast.error("Erro ao salvar configuração fiscal", {
        description: error?.message || error?.detail || "Não foi possível salvar a configuração",
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!formData.provider) {
      toast.error("Provedor fiscal é obrigatório para testar a conexão");
      return;
    }

    try {
      setTesting(true);
      setConnectionStatus("unknown");
      
      const result = await api.post<{ success: boolean; message: string; provider: string; environment: string; response_time_ms: number }>("/api/v1/fiscal-config/test-connection");
      
      if (result.success) {
        setConnectionStatus("success");
        toast.success("Conexão testada com sucesso!", {
          description: `Resposta em ${result.response_time_ms}ms`,
        });
      } else {
        setConnectionStatus("error");
        toast.error("Falha ao testar conexão", {
          description: result.message || "Não foi possível conectar ao provedor fiscal",
        });
      }
    } catch (error: any) {
      console.error("Failed to test connection:", error);
      setConnectionStatus("error");
      toast.error("Erro ao testar conexão", {
        description: error?.message || error?.detail || "Não foi possível testar a conexão",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCertificateUpload = async () => {
    if (!certificateFile) {
      toast.error("Selecione um arquivo de certificado");
      return;
    }

    try {
      setUploading(true);
      
      const uploadFormData = new FormData();
      uploadFormData.append("certificate", certificateFile);
      if (formData.certificate_password) {
        uploadFormData.append("password", formData.certificate_password);
      }
      
      const result = await api.post<{ filename: string }>("/api/v1/fiscal-config/upload-certificate", uploadFormData);
      
      toast.success("Certificado enviado com sucesso!", {
        description: `Arquivo: ${result.filename}`,
      });
      
      setCertificateFile(null);
      setFormData(prev => ({ ...prev, certificate_path: result.filename }));
    } catch (error: any) {
      console.error("Failed to upload certificate:", error);
      toast.error("Erro ao enviar certificado", {
        description: error?.message || error?.detail || "Não foi possível enviar o certificado",
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = () => {
    if (!formData.enabled) {
      return <Badge className="bg-gray-100 text-gray-800">Desativado</Badge>;
    }
    if (!formData.provider) {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Configurando</Badge>;
    }
    if (connectionStatus === "success") {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1 inline" />Ativo</Badge>;
    }
    if (connectionStatus === "error") {
      return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1 inline" />Erro</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Não Testado</Badge>;
  };

  const getFiscalStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      issued: { label: "Emitida", className: "bg-green-100 text-green-800" },
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
      failed: { label: "Falhou", className: "bg-red-100 text-red-800" },
      cancelled: { label: "Cancelada", className: "bg-gray-100 text-gray-800" },
    };
    
    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
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
            <Receipt className="h-8 w-8 text-purple-600" />
            Integração Fiscal
          </h1>
          <p className="text-gray-600 mt-2">
            Configure integrações com sistemas fiscais e emissão de notas fiscais
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Status da Integração
            </CardTitle>
            <CardDescription>
              Estado atual da integração fiscal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                {getStatusBadge()}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Provedor</span>
                <span className="text-sm font-medium">
                  {formData.provider
                    ? FISCAL_PROVIDERS.find(p => p.value === formData.provider)?.label || formData.provider
                    : "Não configurado"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ambiente</span>
                <span className="text-sm font-medium">
                  {formData.environment === "production" ? "Produção" : "Homologação"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Última Sincronização</span>
                <span className="text-sm font-medium">
                  {formData.last_sync
                    ? format(parseISO(formData.last_sync), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
            <CardDescription>
              Parâmetros da integração fiscal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="fiscal-enabled">Habilitar Integração Fiscal</Label>
                <p className="text-sm text-gray-500 mt-1">
                  Ativa a integração com sistemas fiscais
                </p>
              </div>
              <Switch
                id="fiscal-enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            {formData.enabled && (
              <>
                <div>
                  <Label htmlFor="fiscal-provider">Provedor Fiscal</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, provider: value }))
                    }
                  >
                    <SelectTrigger id="fiscal-provider" className="mt-1">
                      <SelectValue placeholder="Selecione o provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {FISCAL_PROVIDERS.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fiscal-environment">Ambiente</Label>
                  <Select
                    value={formData.environment}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, environment: value }))
                    }
                  >
                    <SelectTrigger id="fiscal-environment" className="mt-1">
                      <SelectValue placeholder="Selecione o ambiente" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENVIRONMENTS.map((env) => (
                        <SelectItem key={env.value} value={env.value}>
                          {env.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fiscal-certificate">Certificado Digital</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="fiscal-certificate"
                      type="file"
                      accept=".pfx,.p12"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCertificateFile(file);
                        }
                      }}
                      className="flex-1"
                    />
                    {certificateFile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCertificateUpload}
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? "Enviando..." : "Enviar"}
                      </Button>
                    )}
                  </div>
                  {certificateFile && (
                    <p className="text-xs text-gray-500 mt-1">
                      Arquivo selecionado: {certificateFile.name}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="fiscal-password">Senha do Certificado</Label>
                  <Input
                    id="fiscal-password"
                    type="password"
                    placeholder="••••••••"
                    className="mt-1"
                    value={formData.certificate_password}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, certificate_password: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-issue" className="cursor-pointer">
                      Emissão Automática
                    </Label>
                    <Switch
                      id="auto-issue"
                      checked={formData.settings.auto_issue}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, auto_issue: checked },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-email" className="cursor-pointer">
                      Envio Automático por E-mail
                    </Label>
                    <Switch
                      id="auto-email"
                      checked={formData.settings.auto_send_email}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, auto_send_email: checked },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-print" className="cursor-pointer">
                      Impressão Automática
                    </Label>
                    <Switch
                      id="auto-print"
                      checked={formData.settings.auto_print}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, auto_print: checked },
                        }))
                      }
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 mb-2"
                  onClick={testConnection}
                  disabled={testing || !formData.provider}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
                  {testing ? "Testando..." : "Testar Conexão"}
                </Button>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={saveConfig}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.total_documents}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Emitidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.issued_documents}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending_documents}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Falhados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.failed_documents}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fiscal Documents History */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Fiscais</CardTitle>
          <CardDescription>
            Histórico de documentos fiscais emitidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data de Emissão</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status Fiscal</TableHead>
                  <TableHead>Chave de Acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.type.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      {doc.issue_date
                        ? format(parseISO(doc.issue_date), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(doc.total_amount)}
                    </TableCell>
                    <TableCell>{getFiscalStatusBadge(doc.fiscal_status)}</TableCell>
                    <TableCell>
                      {doc.fiscal_key ? (
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {doc.fiscal_key.substring(0, 20)}...
                        </code>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {doc.fiscal_key && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum documento fiscal encontrado</p>
              <p className="text-sm mt-2">
                Os documentos fiscais serão exibidos aqui quando houver emissões
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
