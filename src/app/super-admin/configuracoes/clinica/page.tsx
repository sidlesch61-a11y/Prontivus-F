"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Plus, Search, Edit, Trash2, RefreshCw, Users, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
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

interface Clinic {
  id: number;
  name: string;
  legal_name: string;
  tax_id: string;
  email?: string;
  is_active: boolean;
  license_key?: string;
  expiration_date?: string;
  max_users: number;
  active_modules: string[];
  user_count: number;
  created_at: string;
}

interface ClinicStats {
  total_clinics: number;
  active_clinics: number;
  expired_licenses: number;
  total_users: number;
  clinics_near_expiration: number;
}

interface ClinicFormData {
  name: string;
  legal_name: string;
  tax_id: string;
  address: string;
  phone: string;
  email: string;
  license_key: string;
  expiration_date: string;
  max_users: string;
  active_modules: string[];
  is_active: boolean;
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
];

export default function ClinicaPage() {
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ClinicFormData>({
    name: "",
    legal_name: "",
    tax_id: "",
    address: "",
    phone: "",
    email: "",
    license_key: "",
    expiration_date: "",
    max_users: "10",
    active_modules: [],
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterClinics();
  }, [clinics, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadClinics(),
        loadStats(),
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
    } catch (error: any) {
      console.error("Failed to load clinics:", error);
      toast.error("Erro ao carregar clínicas", {
        description: error?.message || error?.detail || "Não foi possível carregar as clínicas",
      });
      setClinics([]);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.get<ClinicStats>("/api/v1/admin/clinics/stats");
      setStats(data);
    } catch (error: any) {
      console.error("Failed to load stats:", error);
      // Don't show error for stats, it's optional
      setStats(null);
    }
  };

  const filterClinics = () => {
    let filtered = [...clinics];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (clinic) =>
          clinic.name.toLowerCase().includes(searchLower) ||
          clinic.legal_name.toLowerCase().includes(searchLower) ||
          clinic.tax_id.includes(searchTerm) ||
          clinic.email?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredClinics(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      legal_name: "",
      tax_id: "",
      address: "",
      phone: "",
      email: "",
      license_key: "",
      expiration_date: "",
      max_users: "10",
      active_modules: [],
      is_active: true,
    });
    setEditingClinic(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (clinic: Clinic) => {
    setEditingClinic(clinic);
    const expirationDate = clinic.expiration_date ? parseISO(clinic.expiration_date).toISOString().split('T')[0] : "";
    setFormData({
      name: clinic.name || "",
      legal_name: clinic.legal_name || "",
      tax_id: clinic.tax_id || "",
      address: "",
      phone: "",
      email: clinic.email || "",
      license_key: clinic.license_key || "",
      expiration_date: expirationDate,
      max_users: clinic.max_users?.toString() || "10",
      active_modules: clinic.active_modules || [],
      is_active: clinic.is_active ?? true,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.legal_name || !formData.tax_id) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      setSaving(true);

      const clinicData: any = {
        name: formData.name.trim(),
        legal_name: formData.legal_name.trim(),
        tax_id: formData.tax_id.trim(),
        address: formData.address.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        license_key: formData.license_key.trim() || undefined,
        expiration_date: formData.expiration_date || undefined,
        max_users: parseInt(formData.max_users) || 10,
        active_modules: formData.active_modules,
        is_active: formData.is_active,
      };

      if (editingClinic) {
        // Update existing clinic
        await api.put(`/api/v1/admin/clinics/${editingClinic.id}`, clinicData);
        toast.success("Clínica atualizada com sucesso!");
      } else {
        // Create new clinic
        await api.post("/api/v1/admin/clinics", clinicData);
        toast.success("Clínica cadastrada com sucesso!");
      }

      setShowForm(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error("Failed to save clinic:", error);
      toast.error(editingClinic ? "Erro ao atualizar clínica" : "Erro ao cadastrar clínica", {
        description: error?.message || error?.detail || "Não foi possível salvar a clínica",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (clinic: Clinic) => {
    if (!confirm(`Tem certeza que deseja desativar a clínica ${clinic.name}?`)) {
      return;
    }

    try {
      await api.delete(`/api/v1/admin/clinics/${clinic.id}`);
      toast.success("Clínica desativada com sucesso!");
      await loadClinics();
    } catch (error: any) {
      console.error("Failed to delete clinic:", error);
      toast.error("Erro ao desativar clínica", {
        description: error?.message || error?.detail || "Não foi possível desativar a clínica",
      });
    }
  };

  const toggleModule = (moduleValue: string) => {
    setFormData((prev) => {
      const modules = [...prev.active_modules];
      const index = modules.indexOf(moduleValue);
      if (index > -1) {
        modules.splice(index, 1);
      } else {
        modules.push(moduleValue);
      }
      return { ...prev, active_modules: modules };
    });
  };

  const isLicenseExpired = (expirationDate?: string) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

  const isLicenseNearExpiration = (expirationDate?: string) => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return expDate >= today && expDate <= thirtyDaysFromNow;
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
            <Building className="h-8 w-8 text-purple-600" />
            Gestão de Clínicas
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie todas as clínicas cadastradas no sistema
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
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Clínicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.total_clinics}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Clínicas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.active_clinics}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Licenças Expiradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.expired_licenses}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.total_users}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Expirando em 30 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.clinics_near_expiration}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clínicas Cadastradas</CardTitle>
              <CardDescription>
                Lista de todas as clínicas no sistema ({filteredClinics.length} {filteredClinics.length === 1 ? 'clínica' : 'clínicas'})
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar clínica..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={openCreateForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Clínica
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClinics.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Razão Social</TableHead>
                  <TableHead>CNPJ/CPF</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Licença</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClinics.map((clinic) => {
                  const expired = isLicenseExpired(clinic.expiration_date);
                  const nearExpiration = isLicenseNearExpiration(clinic.expiration_date);
                  
                  return (
                    <TableRow key={clinic.id}>
                      <TableCell className="font-medium">{clinic.name}</TableCell>
                      <TableCell>{clinic.legal_name}</TableCell>
                      <TableCell>{clinic.tax_id}</TableCell>
                      <TableCell>{clinic.email || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          {clinic.user_count} / {clinic.max_users}
                        </div>
                      </TableCell>
                      <TableCell>
                        {clinic.expiration_date ? (
                          <div className="flex flex-col">
                            <span className={expired ? "text-red-600 font-medium" : nearExpiration ? "text-yellow-600 font-medium" : "text-gray-600"}>
                              {format(parseISO(clinic.expiration_date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            {expired && (
                              <Badge className="bg-red-100 text-red-800 text-xs mt-1">
                                <AlertCircle className="h-3 w-3 mr-1 inline" />Expirada
                              </Badge>
                            )}
                            {nearExpiration && !expired && (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs mt-1">
                                <AlertCircle className="h-3 w-3 mr-1 inline" />Expirando
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Sem data</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {clinic.is_active ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1 inline" />Ativa
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Inativa</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditForm(clinic)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {clinic.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(clinic)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>{searchTerm ? "Nenhuma clínica encontrada" : "Nenhuma clínica cadastrada"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Clinic Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClinic ? "Editar Clínica" : "Cadastrar Nova Clínica"}
            </DialogTitle>
            <DialogDescription>
              {editingClinic ? "Atualize os dados da clínica" : "Preencha os dados da clínica"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="legal_name">Razão Social *</Label>
                <Input
                  id="legal_name"
                  required
                  value={formData.legal_name}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tax_id">CNPJ/CPF *</Label>
                <Input
                  id="tax_id"
                  required
                  placeholder="00.000.000/0000-00"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Informações de Licenciamento</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="license_key">Chave de Licença</Label>
                  <Input
                    id="license_key"
                    placeholder="Chave única da licença"
                    value={formData.license_key}
                    onChange={(e) => setFormData({ ...formData, license_key: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="expiration_date">Data de Expiração</Label>
                  <Input
                    id="expiration_date"
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_users">Máximo de Usuários *</Label>
                  <Input
                    id="max_users"
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Módulos Ativos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_MODULES.map((module) => (
                  <div key={module.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`module-${module.value}`}
                      checked={formData.active_modules.includes(module.value)}
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
              />
              <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
                Clínica ativa
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={saving}>
                {saving ? "Salvando..." : editingClinic ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
