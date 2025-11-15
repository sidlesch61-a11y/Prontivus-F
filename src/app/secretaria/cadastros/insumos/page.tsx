"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package2, Plus, Search, Edit, Trash2, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  id: number;
  name: string;
  description?: string;
  category: string;
  supplier?: string;
  min_stock: number;
  current_stock: number;
  unit_price?: number;
  unit_of_measure: string;
  barcode?: string;
  is_active: boolean;
  stock_status?: string;
  created_at: string;
  updated_at?: string;
}

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  supplier: string;
  min_stock: string;
  current_stock: string;
  unit_price: string;
  unit_of_measure: string;
  barcode: string;
}

export default function InsumosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    category: "medical_supply",
    supplier: "",
    min_stock: "0",
    current_stock: "0",
    unit_price: "",
    unit_of_measure: "unidade",
    barcode: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.get<Product[]>("/api/v1/products");
      setProducts(data);
    } catch (error: any) {
      console.error("Failed to load products:", error);
      toast.error("Erro ao carregar insumos", {
        description: error?.message || error?.detail || "Não foi possível carregar os insumos",
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.barcode?.includes(searchTerm) ||
          product.supplier?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredProducts(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "medical_supply",
      supplier: "",
      min_stock: "0",
      current_stock: "0",
      unit_price: "",
      unit_of_measure: "unidade",
      barcode: "",
    });
    setEditingProduct(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "medical_supply",
      supplier: product.supplier || "",
      min_stock: product.min_stock?.toString() || "0",
      current_stock: product.current_stock?.toString() || "0",
      unit_price: product.unit_price?.toString() || "",
      unit_of_measure: product.unit_of_measure || "unidade",
      barcode: product.barcode || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      setSaving(true);

      const productData: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        supplier: formData.supplier.trim() || undefined,
        min_stock: parseInt(formData.min_stock) || 0,
        current_stock: parseInt(formData.current_stock) || 0,
        unit_of_measure: formData.unit_of_measure.trim() || "unidade",
        barcode: formData.barcode.trim() || undefined,
      };

      if (formData.unit_price) {
        productData.unit_price = parseFloat(formData.unit_price);
      }

      if (editingProduct) {
        // Update existing product
        await api.put(`/api/v1/products/${editingProduct.id}`, productData);
        toast.success("Insumo atualizado com sucesso!");
      } else {
        // Create new product
        await api.post("/api/v1/products", productData);
        toast.success("Insumo cadastrado com sucesso!");
      }

      setShowForm(false);
      resetForm();
      await loadProducts();
    } catch (error: any) {
      console.error("Failed to save product:", error);
      toast.error(editingProduct ? "Erro ao atualizar insumo" : "Erro ao cadastrar insumo", {
        description: error?.message || error?.detail || "Não foi possível salvar o insumo",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Tem certeza que deseja excluir o insumo ${product.name}?`)) {
      return;
    }

    try {
      await api.delete(`/api/v1/products/${product.id}`);
      toast.success("Insumo excluído com sucesso!");
      await loadProducts();
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      toast.error("Erro ao excluir insumo", {
        description: error?.message || error?.detail || "Não foi possível excluir o insumo",
      });
    }
  };

  const getStatusBadge = (product: Product) => {
    const status = product.stock_status || "normal";
    
    if (status === "out_of_stock" || product.current_stock === 0) {
      return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Sem Estoque</Badge>;
    } else if (status === "low" || product.current_stock <= product.min_stock) {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Estoque Baixo</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1 inline" />OK</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      medication: "Medicamento",
      medical_supply: "Insumo Médico",
      equipment: "Equipamento",
      consumable: "Consumível",
      instrument: "Instrumento",
      other: "Outro",
    };
    return labels[category] || category;
  };

  const formatPrice = (price?: number) => {
    if (!price) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package2 className="h-8 w-8 text-teal-600" />
            Cadastro de Insumos
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie o estoque de insumos da clínica
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadProducts}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Insumos Cadastrados</CardTitle>
              <CardDescription>
                Controle de estoque de insumos ({filteredProducts.length} {filteredProducts.length === 1 ? 'insumo' : 'insumos'})
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar insumo..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={openCreateForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Insumo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Quantidade Mínima</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Preço Unitário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{getCategoryLabel(product.category)}</TableCell>
                    <TableCell>{product.current_stock}</TableCell>
                    <TableCell>{product.min_stock}</TableCell>
                    <TableCell>{product.unit_of_measure}</TableCell>
                    <TableCell>{formatPrice(product.unit_price)}</TableCell>
                    <TableCell>{getStatusBadge(product)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditForm(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product)}
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
              <Package2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>{searchTerm ? "Nenhum insumo encontrado" : "Nenhum insumo cadastrado"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Product Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Insumo" : "Cadastrar Novo Insumo"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? "Atualize os dados do insumo" : "Preencha os dados do insumo"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Insumo *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medication">Medicamento</SelectItem>
                    <SelectItem value="medical_supply">Insumo Médico</SelectItem>
                    <SelectItem value="equipment">Equipamento</SelectItem>
                    <SelectItem value="consumable">Consumível</SelectItem>
                    <SelectItem value="instrument">Instrumento</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição detalhada do insumo..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier">Fornecedor</Label>
                <Input
                  id="supplier"
                  placeholder="Nome do fornecedor"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input
                  id="barcode"
                  placeholder="Código de barras (opcional)"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="current_stock">Quantidade Atual *</Label>
                <Input
                  id="current_stock"
                  type="number"
                  min="0"
                  required
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="min_stock">Quantidade Mínima *</Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  required
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="unit_of_measure">Unidade de Medida *</Label>
                <Input
                  id="unit_of_measure"
                  required
                  placeholder="Ex: un, litro, kg"
                  value={formData.unit_of_measure}
                  onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="unit_price">Preço Unitário (R$)</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={saving}>
                {saving ? "Salvando..." : editingProduct ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
