"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Search, Edit, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface UserRole {
  id: number;
  username: string;
  email: string;
  current_role_id: number;
  current_role_name: string;
  clinic_id: number;
}

const ROLES = [
  { id: 1, name: "SuperAdmin", description: "Super Administrador do Sistema" },
  { id: 2, name: "AdminClinica", description: "Administrador da Clínica" },
  { id: 3, name: "Medico", description: "Médico" },
  { id: 4, name: "Secretaria", description: "Secretária" },
  { id: 5, name: "Paciente", description: "Paciente" },
];

export default function RoleManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = React.useState<UserRole[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [editingUserId, setEditingUserId] = React.useState<number | null>(null);
  const [editingRoleId, setEditingRoleId] = React.useState<number | null>(null);

  React.useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await api.get('/api/admin/users');
      // setUsers(response.data);
      
      // Mock data for now
      setUsers([
        {
          id: 1,
          username: "superadmin",
          email: "superadmin@prontivus.com",
          current_role_id: 1,
          current_role_name: "SuperAdmin",
          clinic_id: 1,
        },
        {
          id: 2,
          username: "adminclinica",
          email: "admin@prontivus.com",
          current_role_id: 2,
          current_role_name: "AdminClinica",
          clinic_id: 1,
        },
      ]);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (userId: number, currentRoleId: number) => {
    setEditingUserId(userId);
    setEditingRoleId(currentRoleId);
  };

  const handleSave = async (userId: number) => {
    if (!editingRoleId) return;

    try {
      // TODO: Replace with actual API call
      // await api.put(`/api/admin/users/${userId}/role`, { role_id: editingRoleId });
      
      toast.success("Role atualizado com sucesso");
      setEditingUserId(null);
      setEditingRoleId(null);
      loadUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Erro ao atualizar role");
    }
  };

  const handleCancel = () => {
    setEditingUserId(null);
    setEditingRoleId(null);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute
      allowedRoleIds={[1, 2]}
      allowedRoleNames={['SuperAdmin', 'AdminClinica']}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Gerenciamento de Roles
          </h1>
          <p className="text-gray-600">
            Gerencie as atribuições de roles dos usuários
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>
              Lista de usuários e suas roles atuais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-600">Carregando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role Atual</TableHead>
                    <TableHead>Clínica</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {editingUserId === user.id ? (
                          <Select
                            value={editingRoleId?.toString()}
                            onValueChange={(value) => setEditingRoleId(parseInt(value))}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">{user.current_role_name}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.clinic_id}</TableCell>
                      <TableCell className="text-right">
                        {editingUserId === user.id ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSave(user.id)}
                              disabled={!editingRoleId}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Salvar
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(user.id, user.current_role_id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roles Disponíveis</CardTitle>
            <CardDescription>
              Descrição das roles do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ROLES.map((role) => (
                <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{role.name}</div>
                    <div className="text-sm text-gray-600">{role.description}</div>
                  </div>
                  <Badge variant="secondary">ID: {role.id}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

