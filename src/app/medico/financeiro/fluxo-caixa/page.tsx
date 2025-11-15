"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface DailyCashFlow {
  day: string;
  date: string;
  entrada: number;
  saida: number;
}

interface CashFlowData {
  total_entrada: number;
  total_saida: number;
  saldo: number;
  daily_data: DailyCashFlow[];
}

export default function FluxoCaixaPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CashFlowData | null>(null);

  useEffect(() => {
    loadCashFlow();
  }, []);

  const loadCashFlow = async () => {
    try {
      setLoading(true);
      const cashFlowData = await api.get<CashFlowData>("/api/v1/doctor/financial/cash-flow?days=7");
      setData(cashFlowData);
    } catch (error: any) {
      console.error("Failed to load cash flow:", error);
      toast.error("Erro ao carregar fluxo de caixa", {
        description: error?.message || error?.detail || "Não foi possível carregar o fluxo de caixa",
      });
      // Set default empty data
      setData({
        total_entrada: 0,
        total_saida: 0,
        saldo: 0,
        daily_data: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
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

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-gray-500">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Não foi possível carregar o fluxo de caixa</p>
        </div>
      </div>
    );
  }

  const { total_entrada, total_saida, saldo, daily_data } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            Fluxo de Caixa
          </h1>
          <p className="text-gray-600 mt-2">
            Acompanhe o fluxo de entrada e saída de recursos
          </p>
        </div>
        <button
          onClick={loadCashFlow}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Atualizar"
        >
          <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-green-600" />
              Total de Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(total_entrada)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-red-600" />
              Total de Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(total_saida)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(saldo)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa - Últimos 7 Dias</CardTitle>
          <CardDescription>
            Entradas e saídas diárias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {daily_data.length > 0 ? (
            <div className="space-y-4">
              {daily_data.map((data, index) => {
                const maxValue = Math.max(
                  ...daily_data.map(d => Math.max(d.entrada, d.saida))
                );
                const entradaPercent = maxValue > 0 ? (data.entrada / maxValue) * 100 : 0;
                const saidaPercent = maxValue > 0 ? (data.saida / maxValue) * 100 : 0;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Dia {data.day}</span>
                      <div className="flex gap-4">
                        <span className="text-green-600">
                          Entrada: {formatCurrency(data.entrada)}
                        </span>
                        <span className="text-red-600">
                          Saída: {formatCurrency(data.saida)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 h-8">
                      <div 
                        className="bg-green-500 rounded-l" 
                        style={{ width: `${entradaPercent}%` }}
                        title={`Entrada: ${formatCurrency(data.entrada)}`}
                      />
                      <div 
                        className="bg-red-500 rounded-r" 
                        style={{ width: `${saidaPercent}%` }}
                        title={`Saída: ${formatCurrency(data.saida)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum dado disponível para exibição</p>
              <p className="text-sm mt-2 text-gray-400">
                Não há movimentações financeiras nos últimos 7 dias
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
