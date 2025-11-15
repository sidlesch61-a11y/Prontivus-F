"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const healthMetrics = [
  {
    name: "Pressão Arterial",
    value: "120/80",
    unit: "mmHg",
    status: "Normal",
    trend: "stable",
    lastUpdate: "15/01/2024",
  },
  {
    name: "Frequência Cardíaca",
    value: "72",
    unit: "bpm",
    status: "Normal",
    trend: "stable",
    lastUpdate: "15/01/2024",
  },
  {
    name: "Glicemia",
    value: "95",
    unit: "mg/dL",
    status: "Normal",
    trend: "down",
    lastUpdate: "15/01/2024",
  },
  {
    name: "Peso",
    value: "75",
    unit: "kg",
    status: "Normal",
    trend: "down",
    lastUpdate: "10/01/2024",
  },
];

const recentActivities = [
  { date: "15/01/2024", activity: "Consulta com Dr. Maria Santos", type: "Consulta" },
  { date: "15/01/2024", activity: "Exame de sangue realizado", type: "Exame" },
  { date: "10/01/2024", activity: "Medicação prescrita: Losartana", type: "Medicação" },
];

export default function SaudePage() {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Normal":
        return <Badge className="bg-green-100 text-green-800">Normal</Badge>;
      case "Atenção":
        return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
      case "Alerta":
        return <Badge className="bg-red-100 text-red-800">Alerta</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Heart className="h-8 w-8 text-cyan-600" />
          Resumo de Saúde
        </h1>
        <p className="text-gray-600 mt-2">
          Acompanhe seus indicadores de saúde e histórico
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-cyan-600">{metric.value}</span>
                <span className="text-sm text-gray-500">{metric.unit}</span>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="mt-2">
                {getStatusBadge(metric.status)}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Última atualização: {metric.lastUpdate}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-600" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>
              Últimas atividades relacionadas à sua saúde
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-cyan-600 rounded-full mt-2" />
                  <div className="flex-1">
                    <div className="font-medium">{activity.activity}</div>
                    <div className="text-sm text-gray-500">{activity.date}</div>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-cyan-600" />
              Informações de Saúde
            </CardTitle>
            <CardDescription>
              Dados importantes sobre sua saúde
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="font-semibold text-blue-900 mb-1">Grupo Sanguíneo</div>
                <div className="text-blue-700">O+</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="font-semibold text-green-900 mb-1">Alergias Conhecidas</div>
                <div className="text-green-700">Nenhuma alergia registrada</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="font-semibold text-purple-900 mb-1">Medicações Ativas</div>
                <div className="text-purple-700">2 medicações em uso</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

