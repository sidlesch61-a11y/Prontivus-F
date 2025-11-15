"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Save, Upload, Image as ImageIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

interface ClinicData {
  id: number;
  name: string;
  legal_name: string;
  tax_id: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  license_key: string | null;
  expiration_date: string | null;
  max_users: number;
  active_modules: string[];
  created_at: string;
  updated_at: string | null;
}

export default function ClinicaConfigPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    tax_id: "",
    address: "",
    phone: "",
    email: "",
    logo: null as File | null,
  });

  useEffect(() => {
    loadClinicData();
  }, []);

  const loadClinicData = async () => {
    try {
      setLoadingData(true);
      const clinicData = await api.get<ClinicData>("/api/v1/admin/clinics/me");
      
      setFormData({
        name: clinicData.name || "",
        legal_name: clinicData.legal_name || "",
        tax_id: clinicData.tax_id || "",
        address: clinicData.address || "",
        phone: clinicData.phone || "",
        email: clinicData.email || "",
        logo: null,
      });
    } catch (error: any) {
      console.error("Failed to load clinic data:", error);
      toast.error("Erro ao carregar dados da clínica", {
        description: error?.message || error?.detail || "Não foi possível carregar as informações da clínica",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("O arquivo deve ter no máximo 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Apenas arquivos de imagem são permitidos");
        return;
      }
      setFormData(prev => ({ ...prev, logo: file }));
      toast.success("Logo selecionado com sucesso");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare update data (exclude logo for now, as it requires separate endpoint)
      const updateData = {
        name: formData.name,
        legal_name: formData.legal_name,
        tax_id: formData.tax_id,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
      };

      await api.put<ClinicData>("/api/v1/admin/clinics/me", updateData);
      
      // TODO: Upload logo separately if needed
      // if (formData.logo) {
      //   // Upload logo via separate endpoint
      // }
      
      toast.success("Configurações da clínica salvas com sucesso!");
      
      // Reload data to get updated information
      await loadClinicData();
    } catch (error: any) {
      console.error("Failed to save clinic data:", error);
      toast.error("Erro ao salvar configurações", {
        description: error?.message || error?.detail || "Não foi possível salvar as configurações da clínica",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    loadClinicData();
    setFormData(prev => ({ ...prev, logo: null }));
  };

  if (loadingData) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building className="h-8 w-8 text-blue-600" />
            Configurações da Clínica
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie as informações básicas da sua clínica
          </p>
        </div>
        <button
          onClick={loadClinicData}
          disabled={loadingData || loading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Atualizar"
        >
          <RefreshCw className={`h-5 w-5 text-gray-600 ${loadingData ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Dados principais da clínica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Clínica *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Clínica São Paulo"
                  required
                  className="mt-1"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="legal_name">Razão Social *</Label>
                <Input
                  id="legal_name"
                  name="legal_name"
                  value={formData.legal_name}
                  onChange={handleInputChange}
                  placeholder="Ex: Clínica São Paulo Ltda"
                  required
                  className="mt-1"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tax_id">CNPJ *</Label>
              <Input
                id="tax_id"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleInputChange}
                placeholder="00.000.000/0000-00"
                required
                className="mt-1"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="address">Endereço Completo *</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Rua, número, bairro, cidade, estado, CEP"
                required
                className="mt-1"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(00) 0000-0000"
                  required
                  className="mt-1"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="contato@clinica.com"
                  required
                  className="mt-1"
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logo da Clínica</CardTitle>
            <CardDescription>
              Faça upload do logo da clínica (máximo 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="logo">Logo</Label>
              <div className="mt-2 flex items-center gap-4">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={loading}
                />
                <Label
                  htmlFor="logo"
                  className={`cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload className="h-4 w-4" />
                  Selecionar Logo
                </Label>
                {formData.logo && (
                  <span className="text-sm text-gray-600">{formData.logo.name}</span>
                )}
              </div>
              {formData.logo && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(formData.logo)}
                    alt="Preview"
                    className="max-w-xs h-32 object-contain border rounded-lg p-2"
                  />
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">
                O upload de logo será implementado em breve
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
