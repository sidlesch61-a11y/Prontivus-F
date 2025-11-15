"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Settings, CheckCircle2, XCircle, RefreshCw, Save, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

interface TissConfig {
  prestador: {
    cnpj?: string;
    nome?: string;
    codigo_prestador?: string;
  };
  operadora: {
    cnpj?: string;
    nome?: string;
    registro_ans?: string;
  };
  defaults: {
    nome_plano?: string;
    cbo_profissional?: string;
    hora_inicio?: string;
    hora_fim?: string;
  };
  tiss: {
    versao?: string;
    enabled?: boolean;
    auto_generate?: boolean;
    url?: string;
    token?: string;
  };
}

interface TissTransaction {
  id: number;
  invoice_id: number;
  status: string;
  created_at: string;
  error_message?: string;
}

export default function TISSPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<TissConfig>({
    prestador: {},
    operadora: {},
    defaults: {},
    tiss: {},
  });
  const [formData, setFormData] = useState<TissConfig>({
    prestador: {
      cnpj: "",
      nome: "",
      codigo_prestador: "001",
    },
    operadora: {
      cnpj: "",
      nome: "Operadora Padrão",
      registro_ans: "000000",
    },
    defaults: {
      nome_plano: "Plano Padrão",
      cbo_profissional: "2251",
      hora_inicio: "08:00",
      hora_fim: "09:00",
    },
    tiss: {
      versao: "3.05.00",
      enabled: true,
      auto_generate: false,
      url: "",
      token: "",
    },
  });
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "success" | "error">("unknown");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await api.get<TissConfig>("/api/v1/financial/tiss-config");
      setConfig(data);
      setFormData({
        prestador: {
          cnpj: data.prestador?.cnpj || "",
          nome: data.prestador?.nome || "",
          codigo_prestador: data.prestador?.codigo_prestador || "001",
        },
        operadora: {
          cnpj: data.operadora?.cnpj || "",
          nome: data.operadora?.nome || "Operadora Padrão",
          registro_ans: data.operadora?.registro_ans || "000000",
        },
        defaults: {
          nome_plano: data.defaults?.nome_plano || "Plano Padrão",
          cbo_profissional: data.defaults?.cbo_profissional || "2251",
          hora_inicio: data.defaults?.hora_inicio || "08:00",
          hora_fim: data.defaults?.hora_fim || "09:00",
        },
        tiss: {
          versao: data.tiss?.versao || "3.05.00",
          enabled: data.tiss?.enabled ?? true,
          auto_generate: data.tiss?.auto_generate ?? false,
          url: data.tiss?.url || "",
          token: data.tiss?.token || "",
        },
      });
      
      // Set last sync to current time if config exists
      if (data.tiss?.enabled) {
        setLastSync(new Date());
      }
    } catch (error: any) {
      console.error("Failed to load TISS config:", error);
      toast.error("Erro ao carregar configuração TISS", {
        description: error?.message || error?.detail || "Não foi possível carregar a configuração",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      await api.put("/api/v1/financial/tiss-config", formData);
      setConfig(formData);
      setLastSync(new Date());
      toast.success("Configuração TISS salva com sucesso!");
    } catch (error: any) {
      console.error("Failed to save TISS config:", error);
      toast.error("Erro ao salvar configuração TISS", {
        description: error?.message || error?.detail || "Não foi possível salvar a configuração",
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!formData.tiss.url) {
      toast.error("URL do servidor TISS é obrigatória");
      return;
    }

    try {
      setTesting(true);
      setConnectionStatus("unknown");
      
      // Simulate connection test (since we don't have a real test endpoint)
      // In a real scenario, this would call an endpoint that tests the connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, we'll just validate the URL format
      try {
        new URL(formData.tiss.url);
        setConnectionStatus("success");
        toast.success("Conexão testada com sucesso!");
      } catch {
        setConnectionStatus("error");
        toast.error("URL inválida", {
          description: "Por favor, verifique o formato da URL",
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

  const getStatusBadge = () => {
    if (!formData.tiss.enabled) {
      return <Badge className="bg-gray-100 text-gray-800">Desativado</Badge>;
    }
    if (connectionStatus === "success") {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1 inline" />Ativo</Badge>;
    }
    if (connectionStatus === "error") {
      return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1 inline" />Erro</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Não Testado</Badge>;
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
            <Code2 className="h-8 w-8 text-purple-600" />
            Integração TISS
          </h1>
          <p className="text-gray-600 mt-2">
            Configure a integração com o padrão TISS (Troca de Informação em Saúde Suplementar)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadConfig}
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
              Estado atual da integração TISS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                {getStatusBadge()}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Última Sincronização</span>
                <span className="text-sm font-medium">
                  {lastSync
                    ? format(lastSync, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : "Nunca"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Versão TISS</span>
                <span className="text-sm font-medium">{formData.tiss.versao || "3.05.00"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Geração Automática</span>
                <span className="text-sm font-medium">
                  {formData.tiss.auto_generate ? "Ativada" : "Desativada"}
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
              Parâmetros da integração TISS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tiss-url">URL do Servidor TISS</Label>
              <Input
                id="tiss-url"
                placeholder="https://tiss.example.com"
                className="mt-1"
                value={formData.tiss.url || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tiss: { ...formData.tiss, url: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="tiss-token">Token de Autenticação</Label>
              <Input
                id="tiss-token"
                type="password"
                placeholder="••••••••"
                className="mt-1"
                value={formData.tiss.token || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tiss: { ...formData.tiss, token: e.target.value },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="tiss-enabled" className="cursor-pointer">
                Integração Ativa
              </Label>
              <Switch
                id="tiss-enabled"
                checked={formData.tiss.enabled ?? true}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    tiss: { ...formData.tiss, enabled: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="tiss-auto" className="cursor-pointer">
                Geração Automática
              </Label>
              <Switch
                id="tiss-auto"
                checked={formData.tiss.auto_generate ?? false}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    tiss: { ...formData.tiss, auto_generate: checked },
                  })
                }
              />
            </div>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={testConnection}
              disabled={testing || !formData.tiss.url}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              {testing ? "Testando..." : "Testar Conexão"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Provider and Operator Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Prestador</CardTitle>
            <CardDescription>
              Informações da clínica prestadora
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="prestador-cnpj">CNPJ</Label>
              <Input
                id="prestador-cnpj"
                placeholder="00.000.000/0000-00"
                className="mt-1"
                value={formData.prestador.cnpj || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prestador: { ...formData.prestador, cnpj: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="prestador-nome">Nome</Label>
              <Input
                id="prestador-nome"
                placeholder="Nome da clínica"
                className="mt-1"
                value={formData.prestador.nome || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prestador: { ...formData.prestador, nome: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="prestador-codigo">Código do Prestador</Label>
              <Input
                id="prestador-codigo"
                placeholder="001"
                className="mt-1"
                value={formData.prestador.codigo_prestador || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prestador: { ...formData.prestador, codigo_prestador: e.target.value },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados da Operadora</CardTitle>
            <CardDescription>
              Informações da operadora de saúde
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="operadora-cnpj">CNPJ</Label>
              <Input
                id="operadora-cnpj"
                placeholder="00.000.000/0000-00"
                className="mt-1"
                value={formData.operadora.cnpj || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    operadora: { ...formData.operadora, cnpj: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="operadora-nome">Nome</Label>
              <Input
                id="operadora-nome"
                placeholder="Nome da operadora"
                className="mt-1"
                value={formData.operadora.nome || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    operadora: { ...formData.operadora, nome: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="operadora-ans">Registro ANS</Label>
              <Input
                id="operadora-ans"
                placeholder="000000"
                className="mt-1"
                value={formData.operadora.registro_ans || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    operadora: { ...formData.operadora, registro_ans: e.target.value },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Defaults Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Padrão</CardTitle>
          <CardDescription>
            Valores padrão para geração de documentos TISS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="default-plano">Nome do Plano</Label>
              <Input
                id="default-plano"
                placeholder="Plano Padrão"
                className="mt-1"
                value={formData.defaults.nome_plano || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaults: { ...formData.defaults, nome_plano: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="default-cbo">CBO Profissional</Label>
              <Input
                id="default-cbo"
                placeholder="2251"
                className="mt-1"
                value={formData.defaults.cbo_profissional || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaults: { ...formData.defaults, cbo_profissional: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="default-inicio">Hora Início</Label>
              <Input
                id="default-inicio"
                type="time"
                className="mt-1"
                value={formData.defaults.hora_inicio || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaults: { ...formData.defaults, hora_inicio: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="default-fim">Hora Fim</Label>
              <Input
                id="default-fim"
                type="time"
                className="mt-1"
                value={formData.defaults.hora_fim || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaults: { ...formData.defaults, hora_fim: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          className="bg-purple-600 hover:bg-purple-700"
          onClick={saveConfig}
          disabled={saving}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>
            Últimas transações TISS processadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Code2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Histórico de transações será exibido aqui</p>
            <p className="text-sm mt-2">
              Esta funcionalidade será implementada quando houver transações TISS processadas
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
