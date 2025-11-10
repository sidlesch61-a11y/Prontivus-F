"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileCode, 
  Copy,
  Download,
  Upload,
  Settings,
  RefreshCw,
  Filter,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TissTemplate {
  id: number;
  name: string;
  description?: string;
  category: 'consultation' | 'procedure' | 'exam' | 'emergency' | 'custom';
  is_default: boolean;
  xml_template: string;
  variables: string[];
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
}

const TEMPLATE_CATEGORIES = {
  'consultation': 'Consulta',
  'procedure': 'Procedimento',
  'exam': 'Exame',
  'emergency': 'Emergência',
  'custom': 'Personalizado'
};

const CATEGORY_COLORS = {
  'consultation': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  'procedure': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  'exam': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  'emergency': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  'custom': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' }
};

export default function TissTemplatesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<TissTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TissTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<TissTemplate | null>(null);
  const [formData, setFormData] = useState<Partial<TissTemplate>>({
    name: "",
    description: "",
    category: "consultation",
    is_default: false,
    xml_template: "",
    variables: []
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated && !['admin', 'secretary'].includes(user?.role || '')) {
      router.push("/unauthorized");
      return;
    }
    
    if (isAuthenticated) {
      loadTemplates();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadTemplates = async () => {
    if (!isAuthenticated || !user) {
      return;
    }
    
    setLoading(true);
    try {
      const data = await api.get<TissTemplate[]>('/api/financial/templates');
      setTemplates(data || []);
    } catch (error: any) {
      console.error("Failed to load TISS templates:", error);
      
      if ((error as any).status === 401 || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        return;
      }
      
      toast.error("Erro ao carregar templates TISS", {
        description: error.message || "Não foi possível carregar os templates TISS"
      });
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.xml_template) {
        toast.error("Campos obrigatórios não preenchidos", {
          description: "Nome e Template XML são obrigatórios"
        });
        return;
      }

      if (editingTemplate) {
        const updateData = {
          name: formData.name,
          description: formData.description || "",
          category: formData.category || "consultation",
          xml_template: formData.xml_template,
          is_default: formData.is_default || false,
          is_active: formData.is_active !== undefined ? formData.is_active : true
        };
        
        await api.put<TissTemplate>(`/api/financial/templates/${editingTemplate.id}`, updateData);
        toast.success("Template TISS atualizado com sucesso!");
      } else {
        const createData = {
          name: formData.name,
          description: formData.description || "",
          category: formData.category || "consultation",
          xml_template: formData.xml_template,
          is_default: formData.is_default || false,
          is_active: true
        };
        
        await api.post<TissTemplate>('/api/financial/templates', createData);
        toast.success("Template TISS criado com sucesso!");
      }
      
      await loadTemplates();
      setIsDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
    } catch (error: any) {
      console.error("Failed to save TISS template:", error);
      toast.error("Erro ao salvar template TISS", {
        description: error.message || "Não foi possível salvar o template TISS"
      });
    }
  };

  const handleEdit = (template: TissTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      category: template.category,
      is_default: template.is_default,
      xml_template: template.xml_template,
      variables: template.variables || []
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (template: TissTemplate) => {
    setDeletingTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;

    try {
      await api.delete(`/api/financial/templates/${deletingTemplate.id}`);
      toast.success("Template TISS excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingTemplate(null);
        await loadTemplates();
      } catch (error: any) {
        console.error("Failed to delete TISS template:", error);
        toast.error("Erro ao excluir template TISS", {
          description: error.message || "Não foi possível excluir o template TISS"
        });
      }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "consultation",
      is_default: false,
      xml_template: "",
      variables: []
    });
  };

  const handleDuplicate = async (template: TissTemplate) => {
    try {
      const createData = {
        name: `${template.name} (Cópia)`,
        description: template.description || "",
        category: template.category,
        xml_template: template.xml_template,
        is_default: false,
        is_active: true
      };
      
      await api.post<TissTemplate>('/api/financial/templates', createData);
      toast.success("Template TISS duplicado com sucesso!");
      await loadTemplates();
    } catch (error: any) {
      console.error("Failed to duplicate TISS template:", error);
      toast.error("Erro ao duplicar template TISS", {
        description: error.message || "Não foi possível duplicar o template TISS"
      });
    }
  };

  const handleExport = (template: TissTemplate) => {
    const exportData = {
      name: template.name,
      description: template.description,
      category: template.category,
      xml_template: template.xml_template,
      variables: template.variables || []
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tiss_template_${template.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("Template TISS exportado com sucesso!");
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          
          const createData = {
            name: importedData.name || "Template Importado",
            description: importedData.description || "",
            category: importedData.category || "custom",
            xml_template: importedData.xmlTemplate || importedData.xml_template || "",
            is_default: false,
            is_active: true
          };
          
          if (!createData.xml_template) {
            throw new Error("Template XML não encontrado no arquivo");
          }
          
          await api.post<TissTemplate>('/api/financial/templates', createData);
          toast.success("Template TISS importado com sucesso!");
          await loadTemplates();
          event.target.value = '';
        } catch (error: any) {
          console.error("Failed to import TISS template:", error);
          toast.error("Erro ao importar template TISS", {
            description: error.message || "Arquivo inválido"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  }, [templates, searchTerm]);

  const getCategoryBadge = (category: string) => {
    const config = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.custom;
    return (
      <Badge variant="outline" className={cn("border-0", config.text, config.bg)}>
        {TEMPLATE_CATEGORIES[category as keyof typeof TEMPLATE_CATEGORIES]}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-muted-foreground font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-muted-foreground font-medium">Carregando templates TISS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg text-white shadow-lg">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            Templates TISS XML
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Gerencie templates personalizados para geração de arquivos TISS XML
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-templates"
          />
          <label htmlFor="import-templates">
            <Button variant="outline" asChild className="bg-white" size="sm">
              <span>
                <Upload className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Importar</span>
              </span>
            </Button>
          </label>
          <Button 
            variant="outline"
            onClick={loadTemplates}
            disabled={loading}
            className="bg-white"
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingTemplate(null);
              resetForm();
            }
          }}>
            <Button 
              onClick={() => {
                setEditingTemplate(null);
                resetForm();
                setIsDialogOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
              size="sm"
            >
                <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Novo Template</span>
              <span className="sm:hidden">Novo</span>
              </Button>
            <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  {editingTemplate ? "Editar Template TISS" : "Novo Template TISS"}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {editingTemplate ? "Atualize as informações do template" : "Crie um novo template TISS XML"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm">Nome do Template *</Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Consulta Médica Padrão"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-sm">Categoria *</Label>
                    <Select
                      value={formData.category || "consultation"}
                      onValueChange={(value) => setFormData({...formData, category: value as any})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TEMPLATE_CATEGORIES).map(([code, name]) => (
                          <SelectItem key={code} value={code}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-sm">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descrição do template"
                    rows={2}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="xmlTemplate" className="text-sm">Template XML *</Label>
                  <Textarea
                    id="xmlTemplate"
                    value={formData.xml_template || ""}
                    onChange={(e) => setFormData({...formData, xml_template: e.target.value})}
                    placeholder="Cole o template XML aqui..."
                    rows={15}
                    className="font-mono text-sm mt-1"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use variáveis como {`{{VARIABLE_NAME}}`} para substituição dinâmica
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingTemplate(null);
                    resetForm();
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                >
                  {editingTemplate ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar templates por nome, descrição ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Templates TISS</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template encontrado' : 'templates encontrados'}
          </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground flex flex-col items-center justify-center gap-3">
              <FileCode className="h-10 w-10 sm:h-12 sm:w-12 opacity-50" />
              <p className="font-medium text-base sm:text-lg">Nenhum template TISS encontrado</p>
              {searchTerm ? (
                <p className="text-sm">Tente ajustar o termo de busca</p>
              ) : (
                <p className="text-sm">Crie um novo template para começar</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                    <TableHead className="min-w-[200px]">Nome</TableHead>
                    <TableHead className="min-w-[120px]">Categoria</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[250px]">Descrição</TableHead>
                    <TableHead className="min-w-[100px]">Tipo</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[100px]">Variáveis</TableHead>
                    <TableHead className="hidden xl:table-cell min-w-[100px]">Atualizado</TableHead>
                    <TableHead className="text-right min-w-[200px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                    <TableRow key={template.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{getCategoryBadge(template.category)}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate">
                    {template.description || "-"}
                  </TableCell>
                  <TableCell>
                        <Badge variant={template.is_default ? "default" : "secondary"} className="text-xs">
                      {template.is_default ? "Padrão" : "Personalizado"}
                    </Badge>
                  </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="text-xs">
                      {(template.variables || []).length} variáveis
                    </Badge>
                  </TableCell>
                      <TableCell className="hidden xl:table-cell text-sm">
                    {template.updated_at 
                      ? new Date(template.updated_at).toLocaleDateString('pt-BR')
                      : new Date(template.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                        title="Editar template"
                            className="h-8 w-8 p-0"
                      >
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(template)}
                        title="Duplicar template"
                            className="h-8 w-8 p-0"
                      >
                            <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(template)}
                        title="Exportar template"
                            className="h-8 w-8 p-0"
                      >
                            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      {!template.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                              onClick={() => handleDeleteClick(template)}
                          title="Excluir template"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Tem certeza que deseja excluir o template <strong>{deletingTemplate?.name}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel 
              onClick={() => setDeletingTemplate(null)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
