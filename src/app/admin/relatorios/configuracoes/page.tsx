"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Settings, BarChart3, PieChart, LineChart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface ReportConfig {
  financial: {
    enabled: boolean;
    detailed: boolean;
  };
  clinical: {
    enabled: boolean;
    anonymize: boolean;
  };
  operational: {
    enabled: boolean;
    automatic_scheduling: boolean;
  };
  general: {
    allow_export: boolean;
    send_by_email: boolean;
  };
}

export default function RelatoriosConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ReportConfig>({
    financial: {
      enabled: true,
      detailed: true,
    },
    clinical: {
      enabled: true,
      anonymize: false,
    },
    operational: {
      enabled: true,
      automatic_scheduling: false,
    },
    general: {
      allow_export: true,
      send_by_email: false,
    },
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      // Try both API versions
      let data: ReportConfig;
      try {
        data = await api.get<ReportConfig>("/api/v1/report-config");
      } catch (e) {
        // Fallback to legacy endpoint
        data = await api.get<ReportConfig>("/api/report-config");
      }
      setConfig(data);
    } catch (error: any) {
      console.error("Failed to load report configuration:", error);
      toast.error("Erro ao carregar configurações", {
        description: error?.message || error?.detail || "Não foi possível carregar as configurações de relatórios",
      });
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Try both API versions
      try {
        await api.put("/api/v1/report-config", config);
      } catch (e) {
        // Fallback to legacy endpoint
        await api.put("/api/report-config", config);
      }
      toast.success("Configurações salvas com sucesso", {
        description: "As configurações de relatórios foram atualizadas",
      });
    } catch (error: any) {
      console.error("Failed to save report configuration:", error);
      toast.error("Erro ao salvar configurações", {
        description: error?.message || error?.detail || "Não foi possível salvar as configurações",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof ReportConfig, field: string, value: boolean) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          Configurações de Relatórios
        </h1>
        <p className="text-gray-600 mt-2">
          Configure os relatórios disponíveis para a clínica
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Relatórios Financeiros
            </CardTitle>
            <CardDescription>
              Configurações de relatórios financeiros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="financial-enabled">Habilitar Relatórios Financeiros</Label>
              <Switch
                id="financial-enabled"
                checked={config.financial.enabled}
                onCheckedChange={(checked) => updateConfig("financial", "enabled", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="financial-detailed">Relatórios Detalhados</Label>
              <Switch
                id="financial-detailed"
                checked={config.financial.detailed}
                onCheckedChange={(checked) => updateConfig("financial", "detailed", checked)}
                disabled={!config.financial.enabled}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Relatórios Clínicos
            </CardTitle>
            <CardDescription>
              Configurações de relatórios clínicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="clinical-enabled">Habilitar Relatórios Clínicos</Label>
              <Switch
                id="clinical-enabled"
                checked={config.clinical.enabled}
                onCheckedChange={(checked) => updateConfig("clinical", "enabled", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="clinical-anonymous">Anonimizar Dados</Label>
              <Switch
                id="clinical-anonymous"
                checked={config.clinical.anonymize}
                onCheckedChange={(checked) => updateConfig("clinical", "anonymize", checked)}
                disabled={!config.clinical.enabled}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-blue-600" />
              Relatórios Operacionais
            </CardTitle>
            <CardDescription>
              Configurações de relatórios operacionais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="operational-enabled">Habilitar Relatórios Operacionais</Label>
              <Switch
                id="operational-enabled"
                checked={config.operational.enabled}
                onCheckedChange={(checked) => updateConfig("operational", "enabled", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="operational-schedule">Agendamento Automático</Label>
              <Switch
                id="operational-schedule"
                checked={config.operational.automatic_scheduling}
                onCheckedChange={(checked) => updateConfig("operational", "automatic_scheduling", checked)}
                disabled={!config.operational.enabled}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Configurações Gerais
            </CardTitle>
            <CardDescription>
              Configurações gerais de relatórios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="export-enabled">Permitir Exportação</Label>
              <Switch
                id="export-enabled"
                checked={config.general.allow_export}
                onCheckedChange={(checked) => updateConfig("general", "allow_export", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-reports">Enviar por E-mail</Label>
              <Switch
                id="email-reports"
                checked={config.general.send_by_email}
                onCheckedChange={(checked) => updateConfig("general", "send_by_email", checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Configurações"
          )}
        </Button>
      </div>
    </div>
  );
}
