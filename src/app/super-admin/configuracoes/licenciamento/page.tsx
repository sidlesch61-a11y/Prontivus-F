"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Plus, Search, Edit, Trash2, RefreshCw, Building, Users, Calendar, AlertCircle, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface License {
  id: string;
  tenant_id: number;
  plan: string;
  modules: string[];
  users_limit: number;
  units_limit?: number;
  start_at: string;
  end_at: string;
  status: string;
  activation_key: string;
  is_active: boolean;
  is_expired: boolean;
  days_until_expiry: number;
  created_at: string;
  updated_at?: string;
  clinic_name?: string;
}

interface LicenseFormData {
  tenant_id: string;
  plan: string;
  modules: string[];
  users_limit: string;
  units_limit: string;
  start_at: string;
  end_at: string;
}

interface Clinic {
  id: number;
  name: string;
  legal_name: string;
  tax_id: string;
}

const AVAILABLE_MODULES = [
  { value: "patients", label: "Pacientes" },
  { value: "appointments", label: "Agendamentos" },
  { value: "clinical", label: "Clínico" },
  { value: "financial", label: "Financeiro" },
  { value: "stock", label: "Estoque" },
  { value: "bi", label: "Business Intelligence" },
  { value: "procedures", label: "Procedimentos" },
  { value: "tiss", label: "TISS" },
  { value: "mobile", label: "Mobile" },
  { value: "telemed", label: "Telemedicina" },
  { value: "api", label: "API" },
  { value: "reports", label: "Relatórios" },
  { value: "backup", label: "Backup" },
  { value: "integration", label: "Integração" },
];

const LICENSE_PLANS = [
  { value: "basic", label: "Básico" },
  { value: "professional", label: "Profissional" },
  { value: "enterprise", label: "Enterprise" },
  { value: "custom", label: "Customizado" },
];

export default function LicenciamentoPage() {
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiring: 0,
  });
  const [formData, setFormData] = useState<LicenseFormData>({
    tenant_id: "",
    plan: "basic",
    modules: [],
    users_limit: "10",
    units_limit: "",
    start_at: new Date().toISOString().split('T')[0],
    end_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterLicenses();
    calculateStats();
  }, [licenses, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadLicenses(),
        loadClinics(),
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

  const loadLicenses = async () => {
    try {
      const data = await api.get<License[]>("/api/v1/licenses");
      setLicenses(data);
    } catch (error: any) {
      console.error("Failed to load licenses:", error);
      toast.error("Erro ao carregar licenças", {
        description: error?.message || error?.detail || "Não foi possível carregar as licenças",
      });
      setLicenses([]);
    }
  };

  const loadClinics = async () => {
    try {
      const data = await api.get<Clinic[]>("/api/v1/admin/clinics");
      setClinics(data);
    } catch (error: any) {
      console.error("Failed to load clinics:", error);
      // Don't show error for clinics, it's optional
      setClinics([]);
    }
  };

  const filterLicenses = () => {
    let filtered = [...licenses];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (license) =>
          license.activation_key.toLowerCase().includes(searchLower) ||
          license.plan.toLowerCase().includes(searchLower) ||
          license.clinic_name?.toLowerCase().includes(searchLower) ||
          license.status.toLowerCase().includes(searchLower)
      );
    }

    setFilteredLicenses(filtered);
  };

  const calculateStats = () => {
    const total = licenses.length;
    const active = licenses.filter(l => l.is_active && !l.is_expired).length;
    const expiring = licenses.filter(l => !l.is_expired && l.days_until_expiry <= 30).length;
    
    setStats({ total, active, expiring });
  };

  const resetForm = () => {
    setFormData({
      tenant_id: "",
      plan: "basic",
      modules: [],
      users_limit: "10",
      units_limit: "",
      start_at: new Date().toISOString().split('T')[0],
      end_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setEditingLicense(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (license: License) => {
    setEditingLicense(license);
    const startDate = license.start_at ? parseISO(license.start_at).toISOString().split('T')[0] : "";
    const endDate = license.end_at ? parseISO(license.end_at).toISOString().split('T')[0] : "";
    setFormData({
      tenant_id: license.tenant_id.toString(),
      plan: license.plan || "basic",
      modules: license.modules || [],
      users_limit: license.users_limit?.toString() || "10",
      units_limit: license.units_limit?.toString() || "",
      start_at: startDate,
      end_at: endDate,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tenant_id || !formData.plan || !formData.start_at || !formData.end_at) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      setSaving(true);

      const licenseData: any = {
        tenant_id: parseInt(formData.tenant_id),
        plan: formData.plan,
        modules: formData.modules,
        users_limit: parseInt(formData.users_limit) || 10,
        units_limit: formData.units_limit ? parseInt(formData.units_limit) : undefined,
        start_at: new Date(formData.start_at).toISOString(),
        end_at: new Date(formData.end_at).toISOString(),
      };

      if (editingLicense) {
        // Update existing license
        await api.put(`/api/v1/licenses/${editingLicense.id}`, licenseData);
        toast.success("Licença atualizada com sucesso!");
      } else {
        // Create new license
        await api.post("/api/v1/licenses", licenseData);
        toast.success("Licença criada com sucesso!");
      }

      setShowForm(false);
      resetForm();
      await loadLicenses();
    } catch (error: any) {
      console.error("Failed to save license:", error);
      toast.error(editingLicense ? "Erro ao atualizar licença" : "Erro ao criar licença", {
        description: error?.message || error?.detail || "Não foi possível salvar a licença",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (license: License) => {
    if (!confirm(`Tem certeza que deseja cancelar a licença ${license.activation_key}?`)) {
      return;
    }

    try {
      await api.delete(`/api/v1/licenses/${license.id}`);
      toast.success("Licença cancelada com sucesso!");
      await loadLicenses();
    } catch (error: any) {
      console.error("Failed to delete license:", error);
      toast.error("Erro ao cancelar licença", {
        description: error?.message || error?.detail || "Não foi possível cancelar a licença",
      });
    }
  };

  const toggleModule = (moduleValue: string) => {
    setFormData((prev) => {
      const modules = [...prev.modules];
      const index = modules.indexOf(moduleValue);
      if (index > -1) {
        modules.splice(index, 1);
      } else {
        modules.push(moduleValue);
      }
      return { ...prev, modules };
    });
  };

  const copyActivationKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Chave de ativação copiada!");
  };

  const getStatusBadge = (license: License) => {
    if (license.is_expired) {
      return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Expirada</Badge>;
    } else if (license.status === "suspended") {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Suspensa</Badge>;
    } else if (license.status === "cancelled") {
      return <Badge className="bg-gray-100 text-gray-800">Cancelada</Badge>;
    } else if (license.days_until_expiry <= 30) {
      return <Badge className="bg-orange-100 text-orange-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Expirando</Badge>;
    } else if (license.is_active) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1 inline" />Ativa</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Inativa</Badge>;
    }
  };

  const getPlanLabel = (plan: string) => {
    const planObj = LICENSE_PLANS.find(p => p.value === plan);
    return planObj?.label || plan;
  };

  const getClinicName = (tenantId: number) => {
    const clinic = clinics.find(c => c.id === tenantId);
    return clinic?.name || `Clínica #${tenantId}`;
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
            <Key className="h-8 w-8 text-purple-600" />
            Gestão de Licenciamento
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie licenças e chaves de ativação das clínicas
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Licenças
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">Clínicas licenciadas</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Licenças Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-gray-500 mt-1">Em uso</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Expirando em 30 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.expiring}</div>
            <p className="text-xs text-gray-500 mt-1">Requer atenção</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Licenças</CardTitle>
              <CardDescription>
                Gerencie todas as licenças do sistema ({filteredLicenses.length} {filteredLicenses.length === 1 ? 'licença' : 'licenças'})
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar licença..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={openCreateForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Licença
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLicenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clínica</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Chave de Ativação</TableHead>
                  <TableHead>Módulos</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        {getClinicName(license.tenant_id)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getPlanLabel(license.plan)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {license.activation_key.substring(0, 8)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyActivationKey(license.activation_key)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {license.modules.slice(0, 3).map((module) => (
                          <Badge key={module} variant="outline" className="text-xs">
                            {AVAILABLE_MODULES.find(m => m.value === module)?.label || module}
                          </Badge>
                        ))}
                        {license.modules.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{license.modules.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        {license.users_limit}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="text-gray-600">
                          {format(parseISO(license.start_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <span className="text-gray-400">até</span>
                        <span className={license.is_expired ? "text-red-600 font-medium" : license.days_until_expiry <= 30 ? "text-orange-600 font-medium" : "text-gray-600"}>
                          {format(parseISO(license.end_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        {!license.is_expired && (
                          <span className="text-xs text-gray-500 mt-1">
                            {license.days_until_expiry} {license.days_until_expiry === 1 ? 'dia' : 'dias'} restantes
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(license)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditForm(license)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {license.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(license)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
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
              <Key className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>{searchTerm ? "Nenhuma licença encontrada" : "Nenhuma licença cadastrada"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit License Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLicense ? "Editar Licença" : "Criar Nova Licença"}
            </DialogTitle>
            <DialogDescription>
              {editingLicense ? "Atualize os dados da licença" : "Preencha os dados da licença"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tenant_id">Clínica *</Label>
                <Select
                  value={formData.tenant_id}
                  onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                  disabled={!!editingLicense}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a clínica" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id.toString()}>
                        {clinic.name} ({clinic.tax_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="plan">Plano *</Label>
                <Select
                  value={formData.plan}
                  onValueChange={(value) => setFormData({ ...formData, plan: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSE_PLANS.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value}>
                        {plan.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="users_limit">Limite de Usuários *</Label>
                <Input
                  id="users_limit"
                  type="number"
                  min="1"
                  max="10000"
                  required
                  value={formData.users_limit}
                  onChange={(e) => setFormData({ ...formData, users_limit: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="units_limit">Limite de Unidades</Label>
                <Input
                  id="units_limit"
                  type="number"
                  min="1"
                  value={formData.units_limit}
                  onChange={(e) => setFormData({ ...formData, units_limit: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_at">Data de Início *</Label>
                <Input
                  id="start_at"
                  type="date"
                  required
                  value={formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_at">Data de Término *</Label>
                <Input
                  id="end_at"
                  type="date"
                  required
                  value={formData.end_at}
                  onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Módulos Ativos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_MODULES.map((module) => (
                  <div key={module.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`module-${module.value}`}
                      checked={formData.modules.includes(module.value)}
                      onCheckedChange={() => toggleModule(module.value)}
                    />
                    <Label
                      htmlFor={`module-${module.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {module.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={saving}>
                {saving ? "Salvando..." : editingLicense ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
