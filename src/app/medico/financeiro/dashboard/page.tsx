"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDollarSign, TrendingUp, TrendingDown, Wallet, ReceiptText, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface FinancialStats {
  monthly_revenue: number;
  monthly_expenses: number;
  current_balance: number;
  pending_amount: number;
  monthly_revenue_change: number;
  monthly_expenses_change: number;
  balance_change: number;
  pending_change: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

interface FinancialDashboardData {
  stats: FinancialStats;
  monthly_data: MonthlyData[];
}

export default function FinanceiroDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialDashboardData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const dashboardData = await api.get<FinancialDashboardData>("/api/v1/doctor/financial/dashboard");
      setData(dashboardData);
    } catch (error: any) {
      console.error("Failed to load financial data:", error);
      toast.error("Erro ao carregar dados financeiros", {
        description: error?.message || error?.detail || "Não foi possível carregar os dados financeiros",
      });
      // Set default empty data
      setData({
        stats: {
          monthly_revenue: 0,
          monthly_expenses: 0,
          current_balance: 0,
          pending_amount: 0,
          monthly_revenue_change: 0,
          monthly_expenses_change: 0,
          balance_change: 0,
          pending_change: 0,
        },
        monthly_data: [],
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

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
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
          <CircleDollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Não foi possível carregar os dados financeiros</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Receita do Mês",
      value: formatCurrency(data.stats.monthly_revenue),
      change: formatPercentage(data.stats.monthly_revenue_change),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Despesas do Mês",
      value: formatCurrency(data.stats.monthly_expenses),
      change: formatPercentage(data.stats.monthly_expenses_change),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Saldo Atual",
      value: formatCurrency(data.stats.current_balance),
      change: formatPercentage(data.stats.balance_change),
      icon: Wallet,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pendências",
      value: formatCurrency(data.stats.pending_amount),
      change: formatPercentage(data.stats.pending_change),
      icon: ReceiptText,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CircleDollarSign className="h-8 w-8 text-green-600" />
            Dashboard Financeiro
          </h1>
          <p className="text-gray-600 mt-2">
            Visão geral das suas finanças pessoais
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Atualizar"
        >
          <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className={`text-sm mt-1 ${
                  parseFloat(stat.change.replace('%', '').replace('+', '')) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {stat.change} em relação ao mês anterior
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Financeira</CardTitle>
          <CardDescription>
            Receitas e despesas dos últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.monthly_data.length > 0 ? (
            <div className="space-y-4">
              {data.monthly_data.map((monthData, index) => {
                const maxValue = Math.max(
                  ...data.monthly_data.map(d => Math.max(d.revenue, d.expenses))
                );
                const receitaPercent = maxValue > 0 ? (monthData.revenue / maxValue) * 100 : 0;
                const despesaPercent = maxValue > 0 ? (monthData.expenses / maxValue) * 100 : 0;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{monthData.month}</span>
                      <div className="flex gap-4">
                        <span className="text-green-600">
                          Receita: {formatCurrency(monthData.revenue)}
                        </span>
                        <span className="text-red-600">
                          Despesa: {formatCurrency(monthData.expenses)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 h-8">
                      <div 
                        className="bg-green-500 rounded-l" 
                        style={{ width: `${receitaPercent}%` }}
                        title={`Receita: ${formatCurrency(monthData.revenue)}`}
                      />
                      <div 
                        className="bg-red-500 rounded-r" 
                        style={{ width: `${despesaPercent}%` }}
                        title={`Despesa: ${formatCurrency(monthData.expenses)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhum dado disponível para exibição</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
