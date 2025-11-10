"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { tissConfigApi } from "@/lib/tiss-config-api";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Building2, 
  FileCode, 
  Settings, 
  Info, 
  CheckCircle,
  AlertCircle,
  Sparkles,
  Shield,
  Clock,
  Mail
} from "lucide-react";

interface TissConfig {
  prestador: {
    cnpj: string;
    nome: string;
    codigo_prestador: string;
  };
  operadora: {
    cnpj: string;
    nome: string;
    registro_ans: string;
  };
  defaults: {
    nome_plano: string;
    cbo_profissional: string;
    hora_inicio: string;
    hora_fim: string;
  };
  tiss: {
    versao: string;
    enabled: boolean;
    auto_generate: boolean;
  };
}

export default function TissConfigPage() {
  const [config, setConfig] = useState<TissConfig>({
    prestador: {
      cnpj: "",
      nome: "",
      codigo_prestador: "001"
    },
    operadora: {
      cnpj: "",
      nome: "Operadora Padrão",
      registro_ans: "000000"
    },
    defaults: {
      nome_plano: "Plano Padrão",
      cbo_profissional: "2251",
      hora_inicio: "08:00",
      hora_fim: "09:00"
    },
    tiss: {
      versao: "3.03.00",
      enabled: true,
      auto_generate: false
    }
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await tissConfigApi.get();
        setConfig(data as any);
      } catch (err: any) {
        console.error('Erro ao carregar configurações TISS', err);
        toast.error('Falha ao carregar configurações TISS');
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await tissConfigApi.update(config as any);
      toast.success("Configurações TISS salvas com sucesso!", {
        description: "As alterações foram aplicadas com sucesso"
      });
      setHasChanges(false);
    } catch (error: any) {
      toast.error("Erro ao salvar configurações", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (section: keyof TissConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando configurações TISS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Configurações TISS</h1>
                <p className="text-gray-600">
                  Configure as informações para geração de arquivos TISS XML
                </p>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={loading || !hasChanges}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>

        {/* Info Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Info className="h-5 w-5 text-blue-600" />
              Sobre o TISS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              O <strong>TISS (Troca de Informação em Saúde Suplementar)</strong> é o padrão estabelecido pela ANS 
              para a troca eletrônica de informações entre operadoras de planos de saúde e 
              prestadores de serviços. Configure as informações abaixo para gerar arquivos XML 
              compatíveis com o padrão <strong>TISS 3.03.00</strong>.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prestador Configuration */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-white">
                <Building2 className="h-5 w-5" />
                Prestador de Serviços
              </CardTitle>
              <CardDescription className="text-blue-100">
                Informações da clínica/prestador de serviços
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label htmlFor="prestador-cnpj" className="text-gray-700 font-medium">
                  CNPJ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="prestador-cnpj"
                  value={config.prestador.cnpj}
                  onChange={(e) => updateConfig('prestador', 'cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">CNPJ da clínica sem formatação</p>
              </div>
              <div>
                <Label htmlFor="prestador-nome" className="text-gray-700 font-medium">
                  Nome/Razão Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="prestador-nome"
                  value={config.prestador.nome}
                  onChange={(e) => updateConfig('prestador', 'nome', e.target.value)}
                  placeholder="Nome da clínica"
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="prestador-codigo" className="text-gray-700 font-medium">
                  Código do Prestador
                </Label>
                <Input
                  id="prestador-codigo"
                  value={config.prestador.codigo_prestador}
                  onChange={(e) => updateConfig('prestador', 'codigo_prestador', e.target.value)}
                  placeholder="001"
                  maxLength={20}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Código identificador do prestador</p>
              </div>
            </CardContent>
          </Card>

          {/* Operadora Configuration */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-white">
                <FileCode className="h-5 w-5" />
                Operadora de Saúde
              </CardTitle>
              <CardDescription className="text-cyan-100">
                Informações da operadora de planos de saúde
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label htmlFor="operadora-cnpj" className="text-gray-700 font-medium">
                  CNPJ da Operadora <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="operadora-cnpj"
                  value={config.operadora.cnpj}
                  onChange={(e) => updateConfig('operadora', 'cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className="mt-1 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>
              <div>
                <Label htmlFor="operadora-nome" className="text-gray-700 font-medium">
                  Nome da Operadora <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="operadora-nome"
                  value={config.operadora.nome}
                  onChange={(e) => updateConfig('operadora', 'nome', e.target.value)}
                  placeholder="Nome da operadora"
                  className="mt-1 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>
              <div>
                <Label htmlFor="operadora-ans" className="text-gray-700 font-medium">
                  Registro ANS <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="operadora-ans"
                  value={config.operadora.registro_ans}
                  onChange={(e) => updateConfig('operadora', 'registro_ans', e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="mt-1 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                />
                <p className="text-xs text-gray-500 mt-1">Registro de 6 dígitos na ANS</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Default Settings */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings className="h-5 w-5" />
              Configurações Padrão
            </CardTitle>
            <CardDescription className="text-purple-100">
              Valores padrão para campos não especificados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="default-plano" className="text-gray-700 font-medium">
                  Nome do Plano Padrão
                </Label>
                <Input
                  id="default-plano"
                  value={config.defaults.nome_plano}
                  onChange={(e) => updateConfig('defaults', 'nome_plano', e.target.value)}
                  placeholder="Plano Padrão"
                  className="mt-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="default-cbo" className="text-gray-700 font-medium">
                  CBO do Profissional
                </Label>
                <Input
                  id="default-cbo"
                  value={config.defaults.cbo_profissional}
                  onChange={(e) => updateConfig('defaults', 'cbo_profissional', e.target.value)}
                  placeholder="2251"
                  maxLength={4}
                  className="mt-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Código Brasileiro de Ocupação (4 dígitos)</p>
              </div>
              <div>
                <Label htmlFor="default-hora-inicio" className="text-gray-700 font-medium">
                  Hora de Início Padrão
                </Label>
                <Input
                  id="default-hora-inicio"
                  type="time"
                  value={config.defaults.hora_inicio}
                  onChange={(e) => updateConfig('defaults', 'hora_inicio', e.target.value)}
                  className="mt-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="default-hora-fim" className="text-gray-700 font-medium">
                  Hora de Fim Padrão
                </Label>
                <Input
                  id="default-hora-fim"
                  type="time"
                  value={config.defaults.hora_fim}
                  onChange={(e) => updateConfig('defaults', 'hora_fim', e.target.value)}
                  className="mt-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TISS Settings */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-white">
              <FileCode className="h-5 w-5" />
              Configurações TISS
            </CardTitle>
            <CardDescription className="text-emerald-100">
              Configurações específicas do padrão TISS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="tiss-enabled" className="text-gray-900 font-semibold cursor-pointer">
                    Habilitar Geração TISS
                  </Label>
                  {config.tiss.enabled && (
                    <Badge className="bg-emerald-500 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Permite a geração de arquivos TISS XML no sistema
                </p>
              </div>
              <Switch
                id="tiss-enabled"
                checked={config.tiss.enabled}
                onCheckedChange={(checked) => updateConfig('tiss', 'enabled', checked)}
                className="ml-4"
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="tiss-auto" className="text-gray-900 font-semibold cursor-pointer">
                    Geração Automática
                  </Label>
                  {config.tiss.auto_generate && (
                    <Badge className="bg-blue-500 text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Automático
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Gera automaticamente TISS XML ao criar faturas
                </p>
              </div>
              <Switch
                id="tiss-auto"
                checked={config.tiss.auto_generate}
                onCheckedChange={(checked) => updateConfig('tiss', 'auto_generate', checked)}
                className="ml-4"
                disabled={!config.tiss.enabled}
              />
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Label htmlFor="tiss-versao" className="text-gray-900 font-semibold mb-2 block">
                Versão TISS
              </Label>
              <Input
                id="tiss-versao"
                value={config.tiss.versao}
                onChange={(e) => updateConfig('tiss', 'versao', e.target.value)}
                placeholder="3.03.00"
                disabled
                className="bg-white border-gray-300"
              />
              <div className="flex items-start gap-2 mt-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <p className="text-sm text-gray-700">
                  Versão atual do padrão TISS suportada pelo sistema. Esta versão é compatível 
                  com as especificações da ANS.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button Footer */}
        {hasChanges && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Você tem alterações não salvas</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Descartar
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
