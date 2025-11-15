"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package2, Search, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
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
import { api } from "@/lib/api";
import { toast } from "sonner";

interface StockItem {
  id: number;
  name: string;
  description?: string;
  current_stock: number;
  min_stock: number;
  unit_of_measure: string;
  stock_status?: string;
  is_active: boolean;
}

export default function EstoqueConsultaPage() {
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [filteredStock, setFilteredStock] = useState<StockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadStock();
  }, []);

  useEffect(() => {
    filterStock();
  }, [stock, searchTerm]);

  const loadStock = async () => {
    try {
      setLoading(true);
      const data = await api.get<StockItem[]>("/api/v1/products?is_active=true");
      setStock(data);
    } catch (error: any) {
      console.error("Failed to load stock:", error);
      toast.error("Erro ao carregar estoque", {
        description: error?.message || error?.detail || "Não foi possível carregar o estoque",
      });
      setStock([]);
    } finally {
      setLoading(false);
    }
  };

  const filterStock = () => {
    let filtered = [...stock];
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(search) ||
        (item.description && item.description.toLowerCase().includes(search))
      );
    }
    
    setFilteredStock(filtered);
  };

  const getStatusBadge = (status?: string, currentStock: number = 0, minStock: number = 0) => {
    // Determine status if not provided
    let displayStatus = status;
    if (!displayStatus) {
      if (currentStock === 0) {
        displayStatus = "out_of_stock";
      } else if (currentStock <= minStock) {
        displayStatus = "low";
      } else {
        displayStatus = "normal";
      }
    }

    switch (displayStatus) {
      case "out_of_stock":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1 inline" />
            Estoque Crítico
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1 inline" />
            Estoque Baixo
          </Badge>
        );
      case "normal":
      default:
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1 inline" />
            Estoque OK
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package2 className="h-8 w-8 text-green-600" />
            Consulta de Estoque
          </h1>
          <p className="text-gray-600 mt-2">
            Consulte o estoque de insumos da clínica
          </p>
        </div>
        <button
          onClick={loadStock}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Atualizar"
        >
          <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Estoque de Insumos</CardTitle>
              <CardDescription>
                {filteredStock.length} {filteredStock.length === 1 ? "item encontrado" : "itens encontrados"}
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar insumo..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStock.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Quantidade Mínima</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500 mt-1">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {item.current_stock.toLocaleString('pt-BR')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.min_stock.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="capitalize">
                      {item.unit_of_measure}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.stock_status, item.current_stock, item.min_stock)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Package2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>
                {searchTerm
                  ? "Nenhum item encontrado com os filtros aplicados"
                  : "Nenhum item de estoque encontrado"}
              </p>
              <p className="text-sm mt-2 text-gray-400">
                {!searchTerm
                  ? "Não há produtos cadastrados no estoque"
                  : ""}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 text-sm text-green-600 hover:text-green-700"
                >
                  Limpar busca
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
