"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Plus, Edit, Trash2, CheckCircle2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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

interface PaymentMethodConfig {
  id: number;
  clinic_id: number;
  method: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  display_order: number;
  created_at: string;
  updated_at?: string;
}

interface PaymentMethodFormData {
  method: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  display_order: number;
}

// Payment method options
const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Dinheiro" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "debit_card", label: "Cartão de Débito" },
  { value: "bank_transfer", label: "Transferência Bancária" },
  { value: "pix", label: "PIX" },
  { value: "check", label: "Boleto" },
  { value: "insurance", label: "Convênio" },
  { value: "other", label: "Outro" },
];

export default function FormasPagamentoPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [filteredMethods, setFilteredMethods] = useState<PaymentMethodConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<PaymentMethodFormData>({
    method: "",
    name: "",
    is_active: true,
    is_default: false,
    display_order: 0,
  });

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    filterMethods();
  }, [paymentMethods, searchTerm]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      // Try both API versions
      let data: PaymentMethodConfig[] = [];
      try {
        data = await api.get<PaymentMethodConfig[]>("/api/v1/payment-methods");
      } catch (e) {
        // Fallback to legacy endpoint
        data = await api.get<PaymentMethodConfig[]>("/api/payment-methods");
      }
      
      // If no configs exist, initialize them
      if (data.length === 0 || data.some(d => d.id === 0)) {
        try {
          await api.post("/api/v1/payment-methods/initialize");
          data = await api.get<PaymentMethodConfig[]>("/api/v1/payment-methods");
        } catch (e) {
          try {
            await api.post("/api/payment-methods/initialize");
            data = await api.get<PaymentMethodConfig[]>("/api/payment-methods");
          } catch (initError) {
            console.error("Failed to initialize payment methods:", initError);
          }
        }
      }
      
      setPaymentMethods(data);
    } catch (error: any) {
      console.error("Failed to load payment methods:", error);
      toast.error("Erro ao carregar formas de pagamento", {
        description: error?.message || error?.detail || "Não foi possível carregar as formas de pagamento",
      });
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const filterMethods = () => {
    let filtered = [...paymentMethods];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (method) =>
          method.name.toLowerCase().includes(searchLower) ||
          method.method.toLowerCase().includes(searchLower)
      );
    }

    // Sort by display_order, then by name
    filtered.sort((a, b) => {
      if (a.display_order !== b.display_order) {
        return a.display_order - b.display_order;
      }
      return a.name.localeCompare(b.name);
    });

    setFilteredMethods(filtered);
  };

  const resetForm = () => {
    setFormData({
      method: "",
      name: "",
      is_active: true,
      is_default: false,
      display_order: 0,
    });
    setEditingMethod(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (method: PaymentMethodConfig) => {
    setEditingMethod(method);
    setFormData({
      method: method.method,
      name: method.name,
      is_active: method.is_active,
      is_default: method.is_default,
      display_order: method.display_order,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.method || !formData.name) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      setSaving(true);

      let endpoint = "/api/v1/payment-methods";
      try {
        if (editingMethod) {
          // Update existing method
          await api.put(`${endpoint}/${editingMethod.id}`, {
            name: formData.name.trim(),
            is_active: formData.is_active,
            is_default: formData.is_default,
            display_order: formData.display_order,
          });
          toast.success("Forma de pagamento atualizada com sucesso!");
        } else {
          // Create new method
          await api.post(endpoint, formData);
          toast.success("Forma de pagamento cadastrada com sucesso!");
        }
      } catch (e: any) {
        // Fallback to legacy endpoint
        endpoint = "/api/payment-methods";
        if (editingMethod) {
          await api.put(`${endpoint}/${editingMethod.id}`, {
            name: formData.name.trim(),
            is_active: formData.is_active,
            is_default: formData.is_default,
            display_order: formData.display_order,
          });
          toast.success("Forma de pagamento atualizada com sucesso!");
        } else {
          await api.post(endpoint, formData);
          toast.success("Forma de pagamento cadastrada com sucesso!");
        }
      }

      setShowForm(false);
      resetForm();
      await loadPaymentMethods();
    } catch (error: any) {
      console.error("Failed to save payment method:", error);
      toast.error(editingMethod ? "Erro ao atualizar forma de pagamento" : "Erro ao cadastrar forma de pagamento", {
        description: error?.message || error?.detail || "Não foi possível salvar a forma de pagamento",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (method: PaymentMethodConfig) => {
    if (!confirm(`Tem certeza que deseja excluir a forma de pagamento "${method.name}"?`)) {
      return;
    }

    try {
      let endpoint = `/api/v1/payment-methods/${method.id}`;
      try {
        await api.delete(endpoint);
      } catch (e) {
        // Fallback to legacy endpoint
        endpoint = `/api/payment-methods/${method.id}`;
        await api.delete(endpoint);
      }
      toast.success("Forma de pagamento excluída com sucesso!");
      await loadPaymentMethods();
    } catch (error: any) {
      console.error("Failed to delete payment method:", error);
      toast.error("Erro ao excluir forma de pagamento", {
        description: error?.message || error?.detail || "Não foi possível excluir a forma de pagamento",
      });
    }
  };

  const handleToggleActive = async (method: PaymentMethodConfig) => {
    try {
      const updateData = {
        is_active: !method.is_active,
      };
      
      let endpoint = `/api/v1/payment-methods/${method.id}`;
      try {
        await api.put(endpoint, updateData);
      } catch (e) {
        // Fallback to legacy endpoint
        endpoint = `/api/payment-methods/${method.id}`;
        await api.put(endpoint, updateData);
      }
      toast.success(`Forma de pagamento ${!method.is_active ? 'ativada' : 'desativada'} com sucesso!`);
      await loadPaymentMethods();
    } catch (error: any) {
      console.error("Failed to toggle active status:", error);
      toast.error("Erro ao alterar status da forma de pagamento", {
        description: error?.message || error?.detail || "Não foi possível alterar o status",
      });
    }
  };

  const handleSetDefault = async (method: PaymentMethodConfig) => {
    if (method.is_default) {
      return; // Already default
    }

    try {
      const updateData = {
        is_default: true,
      };
      
      let endpoint = `/api/v1/payment-methods/${method.id}`;
      try {
        await api.put(endpoint, updateData);
      } catch (e) {
        // Fallback to legacy endpoint
        endpoint = `/api/payment-methods/${method.id}`;
        await api.put(endpoint, updateData);
      }
      toast.success("Forma de pagamento padrão definida com sucesso!");
      await loadPaymentMethods();
    } catch (error: any) {
      console.error("Failed to set default:", error);
      toast.error("Erro ao definir forma de pagamento padrão", {
        description: error?.message || error?.detail || "Não foi possível definir a forma de pagamento padrão",
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
          <CreditCard className="h-8 w-8 text-blue-600" />
          Formas de Pagamento
        </h1>
        <p className="text-gray-600 mt-2">
          Configure as formas de pagamento aceitas pela clínica
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Formas de Pagamento</CardTitle>
              <CardDescription>
                Gerencie as formas de pagamento disponíveis ({filteredMethods.length} {filteredMethods.length === 1 ? 'forma' : 'formas'})
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar forma de pagamento..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPaymentMethods}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
                onClick={openCreateForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Forma de Pagamento
            </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMethods.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Padrão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {filteredMethods.map((method) => (
                  <TableRow key={method.id || method.method}>
                  <TableCell className="font-medium">{method.name}</TableCell>
                  <TableCell>
                      <Badge className={method.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {method.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                      {method.is_default ? (
                        <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                          <span className="text-sm text-blue-600 font-medium">Padrão</span>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(method)}
                          className="text-xs"
                        >
                          Definir como padrão
                        </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                          onClick={() => handleToggleActive(method)}
                          title={method.is_active ? "Desativar" : "Ativar"}
                      >
                          {method.is_active ? "Desativar" : "Ativar"}
                      </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditForm(method)}
                        >
                        <Edit className="h-4 w-4" />
                      </Button>
                        {method.id > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(method)}
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
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>{searchTerm ? "Nenhuma forma de pagamento encontrada" : "Nenhuma forma de pagamento cadastrada"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Payment Method Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "Editar Forma de Pagamento" : "Cadastrar Nova Forma de Pagamento"}
            </DialogTitle>
            <DialogDescription>
              {editingMethod ? "Atualize os dados da forma de pagamento" : "Preencha os dados da forma de pagamento"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="method">Método *</Label>
                <Select
                  value={formData.method}
                  onValueChange={(value) => {
                    const option = PAYMENT_METHOD_OPTIONS.find(opt => opt.value === value);
                    setFormData({ 
                      ...formData, 
                      method: value,
                      name: option?.label || formData.name
                    });
                  }}
                  required
                  disabled={!!editingMethod} // Can't change method when editing
                >
                  <SelectTrigger id="method">
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingMethod && (
                  <p className="text-xs text-gray-500 mt-1">O método não pode ser alterado</p>
                )}
              </div>
              <div>
                <Label htmlFor="name">Nome de Exibição *</Label>
                <Input
                  id="name"
                  required
                  placeholder="Ex: Dinheiro"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="display_order">Ordem de Exibição</Label>
              <Input
                id="display_order"
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500 mt-1">Menor número aparece primeiro</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
                <Label htmlFor="is_default">Padrão</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? "Salvando..." : editingMethod ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
