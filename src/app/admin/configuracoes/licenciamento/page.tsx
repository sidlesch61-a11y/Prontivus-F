"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Calendar, AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface LicenseInfo {
  has_license: boolean;
  license_type: string | null;
  status: string | null;
  expiration_date: string | null;
  max_users: number;
  license_key: string | null;
  start_date?: string;
  activation_key?: string;
  is_active?: boolean;
  days_until_expiry?: number;
  modules?: string[];
}

// Map license types to display names
const LICENSE_TYPE_NAMES: Record<string, string> = {
  basic: "Básico",
  professional: "Profissional",
  enterprise: "Empresarial",
  custom: "Personalizado",
  Legacy: "Legado",
  Nenhuma: "Nenhuma",
};

// Map status to display names and colors
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  active: {
    label: "Ativa",
    color: "text-green-800",
    bgColor: "bg-green-100",
    icon: CheckCircle2,
  },
  expired: {
    label: "Expirada",
    color: "text-red-800",
    bgColor: "bg-red-100",
    icon: XCircle,
  },
  suspended: {
    label: "Suspensa",
    color: "text-yellow-800",
    bgColor: "bg-yellow-100",
    icon: AlertCircle,
  },
  cancelled: {
    label: "Cancelada",
    color: "text-gray-800",
    bgColor: "bg-gray-100",
    icon: XCircle,
  },
  none: {
    label: "Sem Licença",
    color: "text-gray-800",
    bgColor: "bg-gray-100",
    icon: AlertCircle,
  },
};

export default function LicenciamentoPage() {
  const [loading, setLoading] = useState(true);
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);

  useEffect(() => {
    loadLicenseInfo();
  }, []);

  const loadLicenseInfo = async () => {
    try {
      setLoading(true);
      // Try both API versions
      let data: LicenseInfo;
      try {
        data = await api.get<LicenseInfo>("/api/v1/licenses/me");
      } catch (e) {
        // Fallback to legacy endpoint
        data = await api.get<LicenseInfo>("/api/licenses/me");
      }
      setLicenseInfo(data);
    } catch (error: any) {
      console.error("Failed to load license information:", error);
      toast.error("Erro ao carregar informações da licença", {
        description: error?.message || error?.detail || "Não foi possível carregar as informações da licença",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatLicenseKey = (key: string | null) => {
    if (!key) return "N/A";
    // Format UUID or license key for display
    if (key.length > 20) {
      return `${key.substring(0, 8)}-${key.substring(8, 12)}-${key.substring(12, 16)}-${key.substring(16, 20)}-${key.substring(20, 32)}`;
    }
    return key;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!licenseInfo) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Key className="h-8 w-8 text-blue-600" />
            Licenciamento
          </h1>
          <p className="text-gray-600 mt-2">
            Informações sobre a licença da clínica
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Não foi possível carregar as informações da licença
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = licenseInfo.status || "none";
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.none;
  const StatusIcon = statusConfig.icon;
  const licenseTypeName = LICENSE_TYPE_NAMES[licenseInfo.license_type || ""] || licenseInfo.license_type || "N/A";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Key className="h-8 w-8 text-blue-600" />
          Licenciamento
        </h1>
        <p className="text-gray-600 mt-2">
          Informações sobre a licença da clínica
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status da Licença</CardTitle>
          <CardDescription>
            Detalhes da licença atual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex items-center justify-between p-4 rounded-lg border ${
            status === "active" ? "bg-green-50 border-green-200" :
            status === "expired" ? "bg-red-50 border-red-200" :
            status === "suspended" ? "bg-yellow-50 border-yellow-200" :
            "bg-gray-50 border-gray-200"
          }`}>
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
              <div>
                <div className={`font-semibold ${statusConfig.color}`}>
                  Licença {statusConfig.label}
                </div>
                <div className={`text-sm ${statusConfig.color} opacity-80`}>
                  {status === "active" && licenseInfo.days_until_expiry !== undefined
                    ? `${licenseInfo.days_until_expiry} dias restantes`
                    : status === "expired"
                    ? "A licença expirou"
                    : status === "suspended"
                    ? "A licença está suspensa"
                    : status === "none"
                    ? "Nenhuma licença configurada"
                    : "Status da licença"}
                </div>
              </div>
            </div>
            <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Tipo de Licença</div>
              <div className="text-lg font-semibold">{licenseTypeName}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Data de Expiração</div>
              <div className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(licenseInfo.expiration_date)}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Usuários Máximos</div>
              <div className="text-lg font-semibold">{licenseInfo.max_users} usuários</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Chave de Licença</div>
              <div className="text-sm font-mono text-gray-500 break-all">
                {formatLicenseKey(licenseInfo.license_key || licenseInfo.activation_key || null)}
              </div>
            </div>
            {licenseInfo.start_date && (
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Data de Início</div>
                <div className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(licenseInfo.start_date)}
                </div>
              </div>
            )}
            {licenseInfo.modules && licenseInfo.modules.length > 0 && (
              <div className="p-4 border rounded-lg md:col-span-2">
                <div className="text-sm text-gray-600 mb-2">Módulos Incluídos</div>
                <div className="flex flex-wrap gap-2">
                  {licenseInfo.modules.map((module) => (
                    <Badge key={module} variant="secondary">
                      {module}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
