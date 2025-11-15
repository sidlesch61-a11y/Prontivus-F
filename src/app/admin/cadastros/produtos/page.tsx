"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Plus, Search, Edit, Trash2, Stethoscope, FlaskConical, HeartPulse, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { ServiceCategory } from "@/lib/types";

const PRODUCT_TYPES = [
  { value: ServiceCategory.CONSULTATION, label: "Consulta", icon: Stethoscope },
  { value: ServiceCategory.EXAM, label: "Exame", icon: FlaskConical },
  { value: ServiceCategory.PROCEDURE, label: "Procedimento", icon: HeartPulse },
  { value: ServiceCategory.MEDICATION, label: "Medicação", icon: ShoppingCart },
  { value: ServiceCategory.OTHER, label: "Outro", icon: ShoppingCart },
];

interface ServiceItem {
  id: number;
  name: string;
  description?: string;
  code?: string;
  price: number;
  category: ServiceCategory;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface ServiceItemFormData {
  name: string;
  type: string;
  price: string;
  description: string;
  code: string;
}

export default function ProdutosPage() {
  const [loading, setLoading] = useState(true);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ServiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<ServiceItemFormData>({
    name: "",
    type: "",
    price: "",
    description: "",
    code: "",
  });

  useEffect(() => {
    loadServiceItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [serviceItems, searchTerm, categoryFilter]);

  const loadServiceItems = async () => {
    try {
      setLoading(true);
      const data = await api.get<ServiceItem[]>("/api/financial/service-items");
      setServiceItems(data);
    } catch (error: any) {
      console.error("Failed to load service items:", error);
      toast.error("Erro ao carregar produtos", {
        description: error?.message || error?.detail || "Não foi possível carregar os produtos",
      });
      setServiceItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...serviceItems];

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.code?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredItems(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      price: "",
      description: "",
      code: "",
    });
    setEditingItem(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (item: ServiceItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      type: item.category || "",
      price: item.price?.toString() || "",
      description: item.description || "",
      code: item.code || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type || !formData.price) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const price = parseFloat(formData.price.replace(/[^\d,.-]/g, "").replace(",", "."));
    if (isNaN(price) || price < 0) {
      toast.error("Preço inválido");
      return;
    }

    try {
      setSaving(true);

      const itemData: any = {
        name: formData.name.trim(),
        category: formData.type as ServiceCategory,
        price: price,
        description: formData.description.trim() || undefined,
        code: formData.code.trim() || undefined,
        is_active: true,
      };

      if (editingItem) {
        // Update existing item
        await api.put(`/api/financial/service-items/${editingItem.id}`, itemData);
        toast.success("Produto atualizado com sucesso!");
      } else {
        // Create new item
        await api.post("/api/financial/service-items", itemData);
        toast.success("Produto cadastrado com sucesso!");
      }

      setShowForm(false);
      resetForm();
      await loadServiceItems();
    } catch (error: any) {
      console.error("Failed to save service item:", error);
      toast.error(editingItem ? "Erro ao atualizar produto" : "Erro ao cadastrar produto", {
        description: error?.message || error?.detail || "Não foi possível salvar o produto",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ServiceItem) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${item.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/financial/service-items/${item.id}`);
      toast.success("Produto excluído com sucesso!");
      await loadServiceItems();
    } catch (error: any) {
      console.error("Failed to delete service item:", error);
      toast.error("Erro ao excluir produto", {
        description: error?.message || error?.detail || "Não foi possível excluir o produto",
      });
    }
  };

  const handleToggleActive = async (item: ServiceItem) => {
    try {
      await api.put(`/api/financial/service-items/${item.id}`, {
        is_active: !item.is_active,
      });
      toast.success(`Produto ${!item.is_active ? 'ativado' : 'desativado'} com sucesso!`);
      await loadServiceItems();
    } catch (error: any) {
      console.error("Failed to toggle active status:", error);
      toast.error("Erro ao alterar status do produto", {
        description: error?.message || error?.detail || "Não foi possível alterar o status",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getTypeIcon = (type: string) => {
    const typeObj = PRODUCT_TYPES.find(t => t.value === type);
    return typeObj?.icon || ShoppingCart;
  };

  const getTypeLabel = (type: string) => {
    const typeObj = PRODUCT_TYPES.find(t => t.value === type);
    return typeObj?.label || type;
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
          <ShoppingCart className="h-8 w-8 text-blue-600" />
          Cadastro de Produtos
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie os itens de atendimento: Consultas, Exames e Procedimentos
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Produtos Cadastrados</CardTitle>
              <CardDescription>
                Itens de atendimento disponíveis na clínica ({filteredItems.length} {filteredItems.length === 1 ? 'produto' : 'produtos'})
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar produto..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {PRODUCT_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={loadServiceItems}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const Icon = getTypeIcon(item.category);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-500" />
                          {getTypeLabel(item.category)}
                        </div>
                      </TableCell>
                      <TableCell>{item.code || "-"}</TableCell>
                      <TableCell>{formatPrice(Number(item.price))}</TableCell>
                      <TableCell>
                        <Badge className={item.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {item.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(item)}
                            title={item.is_active ? "Desativar" : "Ativar"}
                          >
                            {item.is_active ? "Desativar" : "Ativar"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditForm(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>{searchTerm || categoryFilter !== "all" ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Product Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Produto" : "Cadastrar Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? "Atualize os dados do produto" : "Preencha os dados do produto"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Produto *</Label>
                    <Input
                      id="name"
                  required
                      placeholder="Ex: Consulta Médica Geral"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  required
                >
                  <SelectTrigger id="type">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_TYPES.map((type) => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Preço *</Label>
                    <Input
                      id="price"
                  required
                      placeholder="R$ 0,00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  type="text"
                    />
                <p className="text-xs text-gray-500 mt-1">Digite o valor (ex: 150.00 ou 150,00)</p>
                  </div>
                  <div>
                <Label htmlFor="code">Código (TUSS)</Label>
                    <Input
                  id="code"
                  placeholder="Código TUSS (opcional)"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>
                </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição do produto (opcional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? "Salvando..." : editingItem ? "Atualizar" : "Cadastrar"}
                  </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
