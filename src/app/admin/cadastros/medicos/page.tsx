"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog2, Plus, Search, Edit, Trash2, User, RefreshCw, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Doctor {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  clinic_name?: string;
  is_active?: boolean;
  is_verified?: boolean;
}

interface DoctorFormData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_verified: boolean;
}

export default function MedicosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<DoctorFormData>({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    is_active: true,
    is_verified: false,
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      // Use the users endpoint with role filter for doctors
      const data = await api.get<Doctor[]>("/api/users?role=doctor");
      setDoctors(data);
    } catch (error: any) {
      console.error("Failed to load doctors:", error);
      toast.error("Erro ao carregar médicos", {
        description: error?.message || error?.detail || "Não foi possível carregar os médicos",
      });
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doctor) =>
          `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(searchLower) ||
          doctor.username.toLowerCase().includes(searchLower) ||
          doctor.email.toLowerCase().includes(searchLower)
      );
    }

    setFilteredDoctors(filtered);
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      is_active: true,
      is_verified: false,
    });
    setEditingDoctor(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      username: doctor.username,
      email: doctor.email,
      password: "", // Don't pre-fill password
      first_name: doctor.first_name || "",
      last_name: doctor.last_name || "",
      is_active: doctor.is_active ?? true,
      is_verified: doctor.is_verified ?? false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.email) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (!editingDoctor && !formData.password) {
      toast.error("A senha é obrigatória para novos usuários");
      return;
    }

    try {
      setSaving(true);

      if (editingDoctor) {
        // Update existing doctor
        const updateData: any = {
          email: formData.email.trim(),
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          is_active: formData.is_active,
          is_verified: formData.is_verified,
        };

        await api.patch(`/api/users/${editingDoctor.id}`, updateData);
        toast.success("Médico atualizado com sucesso!");
      } else {
        // Create new doctor
        const createData = {
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          role: "doctor" as const,
        };

        await api.post("/api/users", createData);
        toast.success("Médico cadastrado com sucesso!");
      }

      setShowForm(false);
      resetForm();
      await loadDoctors();
    } catch (error: any) {
      console.error("Failed to save doctor:", error);
      toast.error(editingDoctor ? "Erro ao atualizar médico" : "Erro ao cadastrar médico", {
        description: error?.message || error?.detail || "Não foi possível salvar o médico",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doctor: Doctor) => {
    if (!confirm(`Tem certeza que deseja excluir o médico ${doctor.first_name} ${doctor.last_name}?`)) {
      return;
    }

    try {
      await api.delete(`/api/users/${doctor.id}`);
      toast.success("Médico excluído com sucesso!");
      await loadDoctors();
    } catch (error: any) {
      console.error("Failed to delete doctor:", error);
      toast.error("Erro ao excluir médico", {
        description: error?.message || error?.detail || "Não foi possível excluir o médico",
      });
    }
  };

  const handleToggleActive = async (doctor: Doctor) => {
    try {
      await api.patch(`/api/users/${doctor.id}`, {
        is_active: !doctor.is_active,
      });
      toast.success(`Médico ${!doctor.is_active ? 'ativado' : 'desativado'} com sucesso!`);
      await loadDoctors();
    } catch (error: any) {
      console.error("Failed to toggle active status:", error);
      toast.error("Erro ao alterar status do médico", {
        description: error?.message || error?.detail || "Não foi possível alterar o status",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <UserCog2 className="h-8 w-8 text-blue-600" />
          Cadastro de Médicos
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie o cadastro de médicos da clínica
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Médicos Cadastrados</CardTitle>
              <CardDescription>
                Lista de todos os médicos ({filteredDoctors.length} {filteredDoctors.length === 1 ? 'médico' : 'médicos'})
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar médico..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDoctors}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Médico
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDoctors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verificado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {doctor.first_name} {doctor.last_name}
                      </div>
                    </TableCell>
                    <TableCell>{doctor.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-gray-400" />
                        {doctor.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          doctor.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {doctor.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          doctor.is_verified
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {doctor.is_verified ? "Verificado" : "Não verificado"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(doctor)}
                          title={doctor.is_active ? "Desativar" : "Ativar"}
                        >
                          {doctor.is_active ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditForm(doctor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doctor)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UserCog2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>{searchTerm ? "Nenhum médico encontrado" : "Nenhum médico cadastrado"}</p>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Doctor Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDoctor ? "Editar Médico" : "Cadastrar Novo Médico"}
            </DialogTitle>
            <DialogDescription>
              {editingDoctor ? "Atualize os dados do médico" : "Preencha os dados do médico"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Usuário *</Label>
                <Input
                  id="username"
                  required
                  disabled={!!editingDoctor} // Username cannot be changed
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="nome.usuario"
                />
                {editingDoctor && (
                  <p className="text-xs text-gray-500 mt-1">O usuário não pode ser alterado</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="medico@clinica.com"
                />
              </div>
            </div>
            {!editingDoctor && (
              <div>
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  required={!editingDoctor}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">A senha deve ter no mínimo 6 caracteres</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Nome *</Label>
                <Input
                  id="first_name"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Nome do médico"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Sobrenome *</Label>
                <Input
                  id="last_name"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Sobrenome do médico"
                />
              </div>
            </div>
            {editingDoctor && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="is_active">Status</Label>
                  <Select
                    value={formData.is_active ? "active" : "inactive"}
                    onValueChange={(value) => setFormData({ ...formData, is_active: value === "active" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="is_verified">Verificação</Label>
                  <Select
                    value={formData.is_verified ? "verified" : "not_verified"}
                    onValueChange={(value) => setFormData({ ...formData, is_verified: value === "verified" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verified">Verificado</SelectItem>
                      <SelectItem value="not_verified">Não verificado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? "Salvando..." : editingDoctor ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
