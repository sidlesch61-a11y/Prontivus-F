"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, CheckCircle2, XCircle, Loader2, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface Module {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  required: boolean;
}

// Map module IDs to display names
const MODULE_DISPLAY_NAMES: Record<string, { name: string; description: string }> = {
  patients: {
    name: "Gestão de Pacientes",
    description: "Cadastro e gerenciamento de pacientes",
  },
  appointments: {
    name: "Agendamentos",
    description: "Sistema de agendamento de consultas",
  },
  clinical: {
    name: "Prontuário Clínico",
    description: "Registros clínicos e prontuários eletrônicos",
  },
  financial: {
    name: "Gestão Financeira",
    description: "Faturamento, pagamentos e controle financeiro",
  },
  tiss: {
    name: "Integração TISS",
    description: "Integração com padrão TISS para operadoras",
  },
  stock: {
    name: "Gestão de Estoque",
    description: "Controle de estoque e inventário",
  },
  procedures: {
    name: "Gestão de Procedimentos",
    description: "Cadastro e gerenciamento de procedimentos",
  },
  bi: {
    name: "Business Intelligence",
    description: "Relatórios e análises avançadas",
  },
  telemed: {
    name: "Telemedicina",
    description: "Consultas e atendimentos remotos",
  },
  mobile: {
    name: "Aplicativo Mobile",
    description: "Acesso via aplicativo móvel",
  },
};

// Required modules that cannot be disabled
const REQUIRED_MODULES = ["patients", "appointments", "clinical"];

export default function ModulosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [activeModules, setActiveModules] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load available modules and current clinic's active modules in parallel
      const [available, clinic] = await Promise.all([
        api.get<string[]>("/api/v1/admin/modules").catch(() => 
          api.get<string[]>("/api/admin/modules")
        ),
        api.get<{ active_modules?: string[] }>("/api/v1/admin/clinics/me").catch(() => 
          api.get<{ active_modules?: string[] }>("/api/admin/clinics/me")
        ),
      ]);

      setAvailableModules(available);
      const active = clinic.active_modules || [];
      setActiveModules(active);

      // Build modules list from available modules
      const modulesList: Module[] = available.map((moduleId) => ({
        id: moduleId,
        name: MODULE_DISPLAY_NAMES[moduleId]?.name || moduleId,
        description: MODULE_DISPLAY_NAMES[moduleId]?.description || "",
        enabled: active.includes(moduleId),
        required: REQUIRED_MODULES.includes(moduleId),
      }));

      setModules(modulesList);
    } catch (error: any) {
      console.error("Failed to load modules:", error);
      toast.error("Erro ao carregar módulos", {
        description: error?.message || error?.detail || "Não foi possível carregar os módulos",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? { ...module, enabled: !module.enabled }
          : module
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get enabled modules
      const enabledModules = modules
        .filter((m) => m.enabled)
        .map((m) => m.id);

      // Try both API versions
      try {
        await api.patch("/api/v1/admin/clinics/me/modules", {
          active_modules: enabledModules,
        });
      } catch (e) {
        // Fallback to legacy endpoint
        await api.patch("/api/admin/clinics/me/modules", {
          active_modules: enabledModules,
        });
      }

      setActiveModules(enabledModules);
      toast.success("Módulos atualizados com sucesso", {
        description: "As configurações dos módulos foram salvas",
      });
    } catch (error: any) {
      console.error("Failed to save modules:", error);
      toast.error("Erro ao salvar módulos", {
        description: error?.message || error?.detail || "Não foi possível salvar as configurações",
      });
      // Reload to restore previous state
      loadData();
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    const currentEnabled = modules.filter((m) => m.enabled).map((m) => m.id);
    return JSON.stringify(currentEnabled.sort()) !== JSON.stringify(activeModules.sort());
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            Gestão de Módulos
          </h1>
          <p className="text-gray-600 mt-2">
            Ative ou desative módulos do sistema para sua clínica
          </p>
        </div>
        {hasChanges() && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => (
          <Card
            key={module.id}
            className={module.enabled ? "border-blue-200 bg-blue-50/30" : ""}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {module.name}
                    {module.required && (
                      <Badge variant="secondary" className="text-xs">
                        Obrigatório
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {module.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor={module.id} className="flex items-center gap-2">
                  {module.enabled ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={module.enabled ? "text-gray-900" : "text-gray-500"}>
                    {module.enabled ? "Ativo" : "Inativo"}
                  </span>
                </Label>
                <Switch
                  id={module.id}
                  checked={module.enabled}
                  onCheckedChange={() => toggleModule(module.id)}
                  disabled={module.required}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {modules.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Nenhum módulo disponível
        </div>
      )}
    </div>
  );
}
