"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  History,
  Settings,
  BarChart3,
  ShoppingCart,
  Activity,
  DollarSign,
  Warehouse,
  CheckCircle,
  XCircle,
  Filter
} from "lucide-react";
import { inventoryApi } from "@/lib/inventory-api";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Product, ProductCreate, ProductUpdate, ProductCategory, 
  StockMovement, StockAdjustmentCreate, StockSummary, LowStockProduct 
} from "@/lib/types";
import { cn } from "@/lib/utils";

const PRODUCT_CATEGORIES = {
  [ProductCategory.MEDICATION]: "Medicamento",
  [ProductCategory.MEDICAL_SUPPLY]: "Material Médico",
  [ProductCategory.EQUIPMENT]: "Equipamento",
  [ProductCategory.CONSUMABLE]: "Consumível",
  [ProductCategory.INSTRUMENT]: "Instrumento",
  [ProductCategory.OTHER]: "Outro"
};

const STOCK_STATUS_COLORS = {
  normal: "bg-emerald-100 text-emerald-800 border-emerald-200",
  low: "bg-amber-100 text-amber-800 border-amber-200",
  out_of_stock: "bg-red-100 text-red-800 border-red-200"
};

const STOCK_STATUS_LABELS = {
  normal: "Normal",
  low: "Estoque Baixo",
  out_of_stock: "Sem Estoque"
};

export default function InventoryPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [stockSummary, setStockSummary] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Dialog states
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productMovements, setProductMovements] = useState<StockMovement[]>([]);
  
  // Form states
  const [productForm, setProductForm] = useState<ProductCreate>({
    name: "",
    description: "",
    category: ProductCategory.MEDICATION,
    supplier: "",
    min_stock: 0,
    current_stock: 0,
    unit_price: 0,
    unit_of_measure: "unidade",
    barcode: "",
    is_active: true
  });
  
  const [adjustmentForm, setAdjustmentForm] = useState<StockAdjustmentCreate>({
    product_id: 0,
    new_quantity: 0,
    reason: "adjustment" as any,
    description: "",
    reference_number: ""
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, isLoading, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, lowStockData, summaryData] = await Promise.all([
        inventoryApi.getProducts(),
        inventoryApi.getLowStockProducts(),
        inventoryApi.getStockSummary()
      ]);
      
      setProducts(productsData);
      setLowStockProducts(lowStockData);
      setStockSummary(summaryData);
    } catch (error: any) {
      toast.error("Erro ao carregar dados do estoque", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    try {
      await inventoryApi.createProduct(productForm);
      toast.success("Produto criado com sucesso!");
      setIsProductDialogOpen(false);
      resetProductForm();
      loadData();
    } catch (error: any) {
      toast.error("Erro ao criar produto", {
        description: error.message
      });
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    
    try {
      await inventoryApi.updateProduct(editingProduct.id, productForm);
      toast.success("Produto atualizado com sucesso!");
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      resetProductForm();
      loadData();
    } catch (error: any) {
      toast.error("Erro ao atualizar produto", {
        description: error.message
      });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await inventoryApi.deleteProduct(id);
        toast.success("Produto excluído com sucesso!");
        loadData();
      } catch (error: any) {
        toast.error("Erro ao excluir produto", {
          description: error.message
        });
      }
    }
  };

  const handleAdjustStock = async () => {
    try {
      await inventoryApi.adjustStock(adjustmentForm);
      toast.success("Estoque ajustado com sucesso!");
      setIsAdjustmentDialogOpen(false);
      resetAdjustmentForm();
      loadData();
    } catch (error: any) {
      toast.error("Erro ao ajustar estoque", {
        description: error.message
      });
    }
  };

  const handleViewHistory = async (product: Product) => {
    setSelectedProduct(product);
    try {
      const movements = await inventoryApi.getStockMovements({ 
        product_id: product.id, 
        limit: 20 
      });
      setProductMovements(movements);
      setIsHistoryDialogOpen(true);
    } catch (error: any) {
      toast.error("Erro ao carregar histórico", {
        description: error.message
      });
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      category: ProductCategory.MEDICATION,
      supplier: "",
      min_stock: 0,
      current_stock: 0,
      unit_price: 0,
      unit_of_measure: "unidade",
      barcode: "",
      is_active: true
    });
  };

  const resetAdjustmentForm = () => {
    setAdjustmentForm({
      product_id: 0,
      new_quantity: 0,
      reason: "adjustment" as any,
      description: "",
      reference_number: ""
    });
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      category: product.category,
      supplier: product.supplier || "",
      min_stock: product.min_stock,
      current_stock: product.current_stock,
      unit_price: product.unit_price || 0,
      unit_of_measure: product.unit_of_measure,
      barcode: product.barcode || "",
      is_active: product.is_active
    });
    setIsProductDialogOpen(true);
  };

  const openAdjustmentDialog = (product: Product) => {
    setAdjustmentForm({
      product_id: product.id,
      new_quantity: product.current_stock,
      reason: "adjustment" as any,
      description: "",
      reference_number: ""
    });
    setIsAdjustmentDialogOpen(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || product.stock_status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                <Warehouse className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestão de Estoque</h1>
                <p className="text-gray-600">
                  Gerencie produtos, estoque e movimentações
                </p>
              </div>
            </div>
          </div>
          <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={resetProductForm}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Editar Produto" : "Novo Produto"}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct ? "Atualize as informações do produto" : "Adicione um novo produto ao estoque"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Produto <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      placeholder="Ex: Paracetamol 500mg"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria <span className="text-red-500">*</span></Label>
                    <Select
                      value={productForm.category}
                      onValueChange={(value) => setProductForm({...productForm, category: value as ProductCategory})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRODUCT_CATEGORIES).map(([code, name]) => (
                          <SelectItem key={code} value={code}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    placeholder="Descrição do produto"
                    rows={2}
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier">Fornecedor</Label>
                    <Input
                      id="supplier"
                      value={productForm.supplier}
                      onChange={(e) => setProductForm({...productForm, supplier: e.target.value})}
                      placeholder="Nome do fornecedor"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="barcode">Código de Barras</Label>
                    <Input
                      id="barcode"
                      value={productForm.barcode}
                      onChange={(e) => setProductForm({...productForm, barcode: e.target.value})}
                      placeholder="Código de barras"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="min_stock">Estoque Mínimo</Label>
                    <Input
                      id="min_stock"
                      type="number"
                      value={productForm.min_stock}
                      onChange={(e) => setProductForm({...productForm, min_stock: parseInt(e.target.value) || 0})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="current_stock">Estoque Atual</Label>
                    <Input
                      id="current_stock"
                      type="number"
                      value={productForm.current_stock}
                      onChange={(e) => setProductForm({...productForm, current_stock: parseInt(e.target.value) || 0})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit_price">Preço Unitário</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={productForm.unit_price}
                      onChange={(e) => setProductForm({...productForm, unit_price: parseFloat(e.target.value) || 0})}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="unit_of_measure">Unidade de Medida</Label>
                  <Input
                    id="unit_of_measure"
                    value={productForm.unit_of_measure}
                    onChange={(e) => setProductForm({...productForm, unit_of_measure: e.target.value})}
                    placeholder="Ex: unidade, caixa, frasco"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  {editingProduct ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        {stockSummary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Total Produtos</CardTitle>
                <Package className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stockSummary.total_products}</div>
                <p className="text-xs text-white/80 mt-1">Produtos cadastrados</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Estoque Baixo</CardTitle>
                <AlertTriangle className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stockSummary.low_stock_products}</div>
                <p className="text-xs text-white/80 mt-1">Requerem atenção</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Sem Estoque</CardTitle>
                <XCircle className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stockSummary.out_of_stock_products}</div>
                <p className="text-xs text-white/80 mt-1">Produtos esgotados</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">Valor Total</CardTitle>
                <DollarSign className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  R$ {stockSummary.total_value.toFixed(2).replace('.', ',')}
                </div>
                <p className="text-xs text-white/80 mt-1">Valor do estoque</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar produtos por nome, descrição ou fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-blue-500"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px] border-gray-200">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {Object.entries(PRODUCT_CATEGORIES).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px] border-gray-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  {Object.entries(STOCK_STATUS_LABELS).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Produtos ({filteredProducts.length})
            </CardTitle>
            <CardDescription>
              Lista de todos os produtos no estoque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-gray-50">
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">Categoria</TableHead>
                    <TableHead className="font-semibold">Fornecedor</TableHead>
                    <TableHead className="font-semibold">Estoque Atual</TableHead>
                    <TableHead className="font-semibold">Estoque Mínimo</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Preço</TableHead>
                    <TableHead className="font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-blue-50/50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {PRODUCT_CATEGORIES[product.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {product.supplier || <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900">
                          {product.current_stock} {product.unit_of_measure}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {product.min_stock} {product.unit_of_measure}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("border", STOCK_STATUS_COLORS[product.stock_status as keyof typeof STOCK_STATUS_COLORS])}>
                          {STOCK_STATUS_LABELS[product.stock_status as keyof typeof STOCK_STATUS_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.unit_price ? (
                          <span className="font-medium text-gray-900">
                            R$ {product.unit_price.toFixed(2).replace('.', ',')}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewHistory(product)}
                            title="Ver histórico"
                            className="h-8 w-8 p-0"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAdjustmentDialog(product)}
                            title="Ajustar estoque"
                            className="h-8 w-8 p-0"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                            title="Editar produto"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            title="Excluir produto"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Nenhum produto encontrado</p>
                <p className="text-sm mt-2">Crie um novo produto para começar</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Adjustment Dialog */}
        <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajustar Estoque</DialogTitle>
              <DialogDescription>
                Ajuste manual do estoque do produto
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="new_quantity">Nova Quantidade <span className="text-red-500">*</span></Label>
                <Input
                  id="new_quantity"
                  type="number"
                  value={adjustmentForm.new_quantity}
                  onChange={(e) => setAdjustmentForm({...adjustmentForm, new_quantity: parseInt(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="reason">Motivo <span className="text-red-500">*</span></Label>
                <Select
                  value={adjustmentForm.reason}
                  onValueChange={(value) => setAdjustmentForm({...adjustmentForm, reason: value as any})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adjustment">Ajuste Manual</SelectItem>
                    <SelectItem value="purchase">Compra</SelectItem>
                    <SelectItem value="return">Devolução</SelectItem>
                    <SelectItem value="damaged">Produto Danificado</SelectItem>
                    <SelectItem value="expired">Produto Vencido</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={adjustmentForm.description}
                  onChange={(e) => setAdjustmentForm({...adjustmentForm, description: e.target.value})}
                  placeholder="Descrição do ajuste"
                  rows={2}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="reference_number">Número de Referência</Label>
                <Input
                  id="reference_number"
                  value={adjustmentForm.reference_number}
                  onChange={(e) => setAdjustmentForm({...adjustmentForm, reference_number: e.target.value})}
                  placeholder="Ex: NF-123456"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAdjustmentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAdjustStock}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                Ajustar Estoque
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stock Movement History Dialog */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Histórico de Movimentações</DialogTitle>
              <DialogDescription>
                Histórico de movimentações para {selectedProduct?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {productMovements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Nenhuma movimentação encontrada</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Descrição</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productMovements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="text-gray-600">
                            {new Date(movement.timestamp).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={movement.type === 'in' 
                                ? 'bg-emerald-500 hover:bg-emerald-600' 
                                : 'bg-red-500 hover:bg-red-600'
                              }
                            >
                              {movement.type === 'in' ? 'Entrada' : 'Saída'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            <span className={movement.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}>
                              {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-600">{movement.reason}</TableCell>
                          <TableCell className="text-gray-600">{movement.description || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
