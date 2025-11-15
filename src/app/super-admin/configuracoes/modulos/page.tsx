"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, RefreshCw, Building, CheckCircle2, XCircle, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Clinic {
  id: number;
  name: string;
  legal_name: string;
  tax_id: string;
  active_modules: string[];
  is_active: boolean;
}

interface Module {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  required: boolean;
}

const MODULE_DEFINITIONS: Record<string, { name: string; description: string; required: boolean }> = {
  patients: {
    name: "Gestão de Pacientes",
    description: "Cadastro e gerenciamento de pacientes",
    required: true,
  },
  appointments: {
    name: "Agendamentos",
    description: "Sistema de agendamento de consultas",
    required: true,
  },
  clinical: {
    name: "Prontuário Clínico",
    description: "Registros clínicos e prontuários eletrônicos",
    required: true,
  },
  financial: {
    name: "Gestão Financeira",
    description: "Faturamento, pagamentos e controle financeiro",
    required: false,
  },
  stock: {
    name: "Gestão de Estoque",
    description: "Controle de estoque e inventário",
    required: false,
  },
  procedures: {
    name: "Gestão de Procedimentos",
    description: "Cadastro e gerenciamento de procedimentos",
    required: false,
  },
  tiss: {
    name: "Integração TISS",
    description: "Integração com padrão TISS para operadoras",
    required: false,
  },
  bi: {
    name: "Business Intelligence",
    description: "Relatórios e análises avançadas",
    required: false,
  },
  telemed: {
    name: "Telemedicina",
    description: "Consultas e atendimentos remotos",
    required: false,
  },
  mobile: {
    name: "Aplicativo Mobile",
    description: "Acesso mobile para pacientes",
    required: false,
  },
};

export default function ModulosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClinicId) {
      loadClinicModules();
    } else {
      setModules([]);
    }
  }, [selectedClinicId]);

  useEffect(() => {
    filterModules();
  }, [modules, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadClinics(),
        loadAvailableModules(),
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

  const loadClinics = async () => {
    try {
      const data = await api.get<Clinic[]>("/api/v1/admin/clinics");
      setClinics(data);
      if (data.length > 0 && !selectedClinicId) {
        setSelectedClinicId(data[0].id.toString());
      }
    } catch (error: any) {
      console.error("Failed to load clinics:", error);
      toast.error("Erro ao carregar clínicas", {
        description: error?.message || error?.detail || "Não foi possível carregar as clínicas",
      });
      setClinics([]);
    }
  };

  const loadAvailableModules = async () => {
    try {
      const data = await api.get<string[]>("/api/v1/admin/modules");
      setAvailableModules(data);
    } catch (error: any) {
      console.error("Failed to load available modules:", error);
      // Fallback to default modules
      setAvailableModules(Object.keys(MODULE_DEFINITIONS));
    }
  };

  const loadClinicModules = async () => {
    if (!selectedClinicId) return;

    try {
      const clinic = clinics.find(c => c.id.toString() === selectedClinicId);
      if (!clinic) return;

      const activeModules = clinic.active_modules || [];
      
      // Build modules list from available modules
      const modulesList: Module[] = availableModules.map(moduleId => {
        const definition = MODULE_DEFINITIONS[moduleId] || {
          name: moduleId,
          description: `Módulo ${moduleId}`,
          required: false,
        };
        
        return {
          id: moduleId,
          name: definition.name,
          description: definition.description,
          enabled: activeModules.includes(moduleId),
          required: definition.required,
        };
      });

      setModules(modulesList);
    } catch (error: any) {
      console.error("Failed to load clinic modules:", error);
      toast.error("Erro ao carregar módulos da clínica", {
        description: error?.message || error?.detail || "Não foi possível carregar os módulos",
      });
      setModules([]);
    }
  };

  const filterModules = () => {
    // Filtering is handled in the render, but we can add it here if needed
  };

  const toggleModule = async (moduleId: string) => {
    if (!selectedClinicId) {
      toast.error("Selecione uma clínica primeiro");
      return;
    }

    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    if (module.required) {
      toast.error("Este módulo é obrigatório e não pode ser desativado");
      return;
    }

    try {
      setSaving(true);

      const clinic = clinics.find(c => c.id.toString() === selectedClinicId);
      if (!clinic) return;

      const currentModules = clinic.active_modules || [];
      const newModules = module.enabled
        ? currentModules.filter(m => m !== moduleId)
        : [...currentModules, moduleId];

      // Ensure required modules are always included
      const requiredModules = availableModules.filter(m => MODULE_DEFINITIONS[m]?.required);
      const finalModules = [...new Set([...requiredModules, ...newModules])];

      await api.patch(`/api/v1/admin/clinics/${selectedClinicId}/modules`, {
        active_modules: finalModules,
      });

      // Update local state
    setModules(prev =>
        prev.map(m =>
          m.id === moduleId
            ? { ...m, enabled: !m.enabled }
            : m
        )
      );

      // Update clinics list
      setClinics(prev =>
        prev.map(c =>
          c.id.toString() === selectedClinicId
            ? { ...c, active_modules: finalModules }
            : c
        )
      );

      toast.success(`Módulo ${module.enabled ? 'desativado' : 'ativado'} com sucesso!`);
    } catch (error: any) {
      console.error("Failed to toggle module:", error);
      toast.error("Erro ao atualizar módulo", {
        description: error?.message || error?.detail || "Não foi possível atualizar o módulo",
      });
    } finally {
      setSaving(false);
    }
  };

  const getSelectedClinic = () => {
    return clinics.find(c => c.id.toString() === selectedClinicId);
  };

  const filteredModules = modules.filter(module =>
    searchTerm === "" ||
    module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      </div>
    );
  }

  const selectedClinic = getSelectedClinic();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Package className="h-8 w-8 text-purple-600" />
          Gestão de Módulos
        </h1>
        <p className="text-gray-600 mt-2">
          Ative ou desative módulos do sistema para cada clínica
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

      {/* Clinic Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Clínica</CardTitle>
          <CardDescription>
            Escolha a clínica para gerenciar seus módulos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select
                value={selectedClinicId}
                onValueChange={setSelectedClinicId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma clínica" />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span>{clinic.name}</span>
                        {!clinic.is_active && (
                          <Badge variant="secondary" className="ml-2">Inativa</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedClinic && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{selectedClinic.active_modules?.length || 0}</span> módulos ativos
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedClinicId && (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar módulo..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
      </div>

          {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModules.length > 0 ? (
              filteredModules.map((module) => (
                <Card
                  key={module.id}
                  className={module.enabled ? "border-purple-200 bg-purple-50/30" : ""}
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
                        disabled={module.required || saving}
                />
              </div>
            </CardContent>
          </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  {searchTerm
                    ? "Nenhum módulo encontrado"
                    : "Nenhum módulo disponível"}
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          {selectedClinic && (
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">Resumo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {modules.filter(m => m.enabled).length}
                    </div>
                    <div className="text-sm text-gray-600">Módulos Ativos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600">
                      {modules.filter(m => !m.enabled && !m.required).length}
                    </div>
                    <div className="text-sm text-gray-600">Módulos Inativos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {modules.filter(m => m.required).length}
                    </div>
                    <div className="text-sm text-gray-600">Módulos Obrigatórios</div>
                  </div>
      </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedClinicId && clinics.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma clínica cadastrada</p>
            <p className="text-sm mt-2">Cadastre uma clínica primeiro para gerenciar módulos</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
