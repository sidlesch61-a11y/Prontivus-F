"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileCode,
  Download,
  Eye,
  RefreshCw,
  Shield,
  FileCheck,
  FileX,
  Info,
  Sparkles,
  Database,
  Clipboard
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  xmlContent?: string;
}

interface Invoice {
  id: number;
  patient_name?: string;
  issue_date: string;
  total_amount: number;
  status: string;
}

export default function TissValidatorPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [xmlContent, setXmlContent] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [validatingInvoice, setValidatingInvoice] = useState(false);
  const [previewMode, setPreviewMode] = useState<'manual' | 'invoice'>('manual');

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
      loadInvoices();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const data = await api.get<Invoice[]>('/api/financial/invoices');
      setInvoices(data || []);
    } catch (error: any) {
      console.error("Failed to load invoices:", error);
      toast.error("Erro ao carregar faturas", {
        description: error.message || "Não foi possível carregar as faturas"
      });
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const validateTissXml = async () => {
    if (!xmlContent.trim()) {
      toast.error("Por favor, cole o conteúdo XML para validar");
      return;
    }

    setLoading(true);
    try {
      // Basic XML validation
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      const parseError = xmlDoc.getElementsByTagName("parsererror");
      
      const errors: string[] = [];
      const warnings: string[] = [];

      if (parseError.length > 0) {
        errors.push("XML malformado: " + parseError[0].textContent);
      }

      // TISS-specific validations
      const rootElement = xmlDoc.documentElement;
      if (rootElement.tagName !== "ans:mensagemTISS") {
        errors.push("Elemento raiz deve ser 'ans:mensagemTISS'");
      }

      // Check required elements
      const requiredElements = [
        "ans:cabecalho",
        "ans:prestadorParaOperadora",
        "ans:operadoraParaPrestador"
      ];

      for (const elementName of requiredElements) {
        const element = xmlDoc.getElementsByTagName(elementName);
        if (element.length === 0) {
          errors.push(`Elemento obrigatório ausente: ${elementName}`);
        }
      }

      // Check TISS version
      const versaoElement = xmlDoc.getElementsByTagName("ans:versaoPadrao");
      if (versaoElement.length > 0) {
        const version = versaoElement[0].textContent;
        if (version !== "3.03.00") {
          warnings.push(`Versão TISS ${version} detectada. Versão recomendada: 3.03.00`);
        }
      }

      // Check CNPJ format
      const cnpjElements = xmlDoc.getElementsByTagName("ans:cnpj");
      for (let i = 0; i < cnpjElements.length; i++) {
        const cnpj = cnpjElements[i].textContent;
        if (cnpj && !/^\d{14}$/.test(cnpj.replace(/\D/g, ""))) {
          warnings.push(`CNPJ com formato inválido: ${cnpj}`);
        }
      }

      // Check CPF format
      const cpfElements = xmlDoc.getElementsByTagName("ans:cpf");
      for (let i = 0; i < cpfElements.length; i++) {
        const cpf = cpfElements[i].textContent;
        if (cpf && !/^\d{11}$/.test(cpf.replace(/\D/g, ""))) {
          warnings.push(`CPF com formato inválido: ${cpf}`);
        }
      }

      const isValid = errors.length === 0;
      
      setValidationResult({
        isValid,
        errors,
        warnings,
        xmlContent
      });

      if (isValid) {
        toast.success("XML TISS válido!");
      } else {
        toast.error(`XML TISS inválido: ${errors.length} erro(s) encontrado(s)`);
      }

    } catch (error: any) {
      toast.error("Erro ao validar XML", {
        description: error.message
      });
      setValidationResult({
        isValid: false,
        errors: ["Erro ao processar XML: " + error.message],
        warnings: []
      });
    } finally {
      setLoading(false);
    }
  };

  const validateInvoiceTiss = async () => {
    if (!selectedInvoiceId) {
      toast.error("Por favor, selecione uma fatura");
      return;
    }

    setValidatingInvoice(true);
    try {
      // Validate invoice TISS XML
      const validationResponse = await api.post<{
        is_valid?: boolean;
        valid?: boolean;
        errors?: string[];
        warnings?: string[];
        details?: any;
        message?: string;
      }>(`/api/invoices/${selectedInvoiceId}/tiss-xml/validate`);

      // Get preview XML to show
      let xmlContent = "";
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const token = localStorage.getItem('clinicore_access_token');
        
        const response = await fetch(`${API_URL}/api/invoices/${selectedInvoiceId}/tiss-xml/preview`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          xmlContent = await response.text();
        }
      } catch (error) {
        // If preview fails, continue without XML content
        console.warn("Failed to load XML preview:", error);
      }

      const isValid = validationResponse.is_valid || validationResponse.valid || false;
      
      // Handle errors and warnings - they might be objects with message fields or strings
      const errors = (validationResponse.errors || []).map((err: any) => 
        typeof err === 'string' ? err : (err.message || err.error || JSON.stringify(err))
      );
      const warnings = (validationResponse.warnings || []).map((warn: any) => 
        typeof warn === 'string' ? warn : (warn.message || warn.warning || JSON.stringify(warn))
      );

      setValidationResult({
        isValid: isValid,
        errors: errors,
        warnings: warnings,
        xmlContent: xmlContent || undefined
      });

      setPreviewMode('invoice');

      if (isValid) {
        toast.success("XML TISS da fatura válido!");
      } else {
        toast.error(`XML TISS inválido: ${errors.length} erro(s) encontrado(s)`);
      }
    } catch (error: any) {
      console.error("Failed to validate invoice TISS:", error);
      toast.error("Erro ao validar TISS da fatura", {
        description: error.message || "Não foi possível validar o TISS da fatura"
      });
      setValidationResult({
        isValid: false,
        errors: ["Erro ao validar fatura: " + (error.message || "Erro desconhecido")],
        warnings: []
      });
    } finally {
      setValidatingInvoice(false);
    }
  };

  const loadInvoiceXml = async () => {
    if (!selectedInvoiceId) {
      toast.error("Por favor, selecione uma fatura");
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('clinicore_access_token');
      
      const response = await fetch(`${API_URL}/api/invoices/${selectedInvoiceId}/tiss-xml/preview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return;
        }
        throw new Error(`Failed to load: ${response.statusText}`);
      }

      const xmlContent = await response.text();
      setXmlContent(xmlContent);
      setPreviewMode('manual');
      toast.success("XML da fatura carregado!");
    } catch (error: any) {
      toast.error("Erro ao carregar XML da fatura", {
        description: error.message
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setXmlContent(content);
        toast.success("Arquivo XML carregado!");
      };
      reader.readAsText(file);
    }
  };

  const downloadXml = () => {
    if (!validationResult?.xmlContent) return;
    
    const blob = new Blob([validationResult.xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tiss_validated.xml';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("XML baixado com sucesso!");
  };

  const previewXml = () => {
    if (!validationResult?.xmlContent) return;
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>TISS XML Preview</title>
            <style>
              body { font-family: monospace; margin: 20px; background: #f5f5f5; }
              pre { background: white; padding: 20px; border-radius: 8px; overflow-x: auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            </style>
          </head>
          <body>
            <h2>TISS XML Preview</h2>
            <pre>${validationResult.xmlContent}</pre>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.slice(0, 10);
  }, [invoices]);

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

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg text-white shadow-lg">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            Validador TISS XML
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Valide arquivos TISS XML contra o padrão 3.03.00
          </p>
        </div>
      </div>

      {/* Invoice Selection Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Database className="h-4 w-4 sm:h-5 sm:w-5" />
            Validar Fatura do Banco de Dados
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Selecione uma fatura para validar seu XML TISS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
              <SelectTrigger className="flex-1 bg-white">
                <SelectValue placeholder="Selecione uma fatura" />
              </SelectTrigger>
              <SelectContent>
                {loadingInvoices ? (
                  <SelectItem value="loading" disabled>
                    Carregando faturas...
                  </SelectItem>
                ) : invoices.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    Nenhuma fatura encontrada
                  </SelectItem>
                ) : (
                  invoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id.toString()}>
                      Fatura #{invoice.id} - {invoice.patient_name || 'Paciente'} - {formatCurrency(invoice.total_amount)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                onClick={loadInvoiceXml}
                disabled={!selectedInvoiceId || loadingInvoices}
                variant="outline"
                size="sm"
                className="bg-white"
              >
                {loadingInvoices ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                <span className="hidden sm:inline">Carregar XML</span>
                <span className="sm:hidden">Carregar</span>
              </Button>
              <Button
                onClick={validateInvoiceTiss}
                disabled={!selectedInvoiceId || validatingInvoice || loadingInvoices}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {validatingInvoice ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileCheck className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">{validatingInvoice ? "Validando..." : "Validar Fatura"}</span>
                <span className="sm:hidden">{validatingInvoice ? "..." : "Validar"}</span>
              </Button>
              <Button
                onClick={loadInvoices}
                disabled={loadingInvoices}
                variant="outline"
                size="sm"
                className="bg-white"
              >
                {loadingInvoices ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Invoices List */}
          {invoices.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Clipboard className="h-4 w-4" />
                Faturas Disponíveis ({invoices.length})
              </h4>
              <div className="border rounded-lg max-h-64 overflow-auto bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[80px]">ID</TableHead>
                      <TableHead className="min-w-[150px]">Paciente</TableHead>
                      <TableHead className="hidden md:table-cell min-w-[100px]">Data</TableHead>
                      <TableHead className="min-w-[100px]">Valor</TableHead>
                      <TableHead className="hidden lg:table-cell min-w-[100px]">Status</TableHead>
                      <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium">#{invoice.id}</TableCell>
                        <TableCell className="truncate max-w-[150px]">{invoice.patient_name || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {format(new Date(invoice.issue_date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(invoice.total_amount)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoiceId(invoice.id.toString());
                              validateInvoiceTiss();
                            }}
                            disabled={validatingInvoice}
                            className="w-full sm:w-auto bg-white"
                          >
                            <FileCheck className="h-3.5 w-3.5 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Validar</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {invoices.length > 10 && (
                  <div className="p-3 text-xs sm:text-sm text-muted-foreground text-center bg-slate-50 border-t">
                    Mostrando 10 de {invoices.length} faturas
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Input Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <FileCode className="h-4 w-4 sm:h-5 sm:w-5" />
              Entrada XML
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Cole o conteúdo XML ou faça upload de um arquivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="file-upload" className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload de Arquivo
              </label>
              <div className="relative">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xml"
                  onChange={handleFileUpload}
                  className="bg-white cursor-pointer"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="xml-content" className="block text-sm font-medium mb-2">
                Conteúdo XML
              </label>
              <Textarea
                id="xml-content"
                value={xmlContent}
                onChange={(e) => setXmlContent(e.target.value)}
                placeholder="Cole o conteúdo XML TISS aqui..."
                rows={15}
                className="font-mono text-sm bg-white border-slate-200"
              />
            </div>
            
            <Button 
              onClick={validateTissXml} 
              disabled={loading || !xmlContent.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Validar XML
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              {validationResult ? (
                validationResult.isValid ? (
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                )
              ) : (
                <FileCode className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
              Resultado da Validação
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {validationResult ? (
                validationResult.isValid ? (
                  <span className="text-green-600 font-medium">XML válido</span>
                ) : (
                  <span className="text-red-600 font-medium">XML inválido</span>
                )
              ) : (
                "Execute a validação para ver os resultados"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validationResult ? (
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge 
                    variant={validationResult.isValid ? "default" : "destructive"}
                    className={cn(
                      "text-sm font-medium",
                      validationResult.isValid 
                        ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" 
                        : "bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                    )}
                  >
                    {validationResult.isValid ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                        Válido
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                        Inválido
                      </>
                    )}
                  </Badge>
                  {validationResult.warnings.length > 0 && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                      {validationResult.warnings.length} Aviso(s)
                    </Badge>
                  )}
                  {validationResult.errors.length > 0 && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      {validationResult.errors.length} Erro(s)
                    </Badge>
                  )}
                </div>

                {/* Errors */}
                {validationResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-red-700 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Erros ({validationResult.errors.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {validationResult.errors.map((error, index) => (
                        <div 
                          key={index} 
                          className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2"
                        >
                          <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-600" />
                          <span className="flex-1">{error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-yellow-700 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Avisos ({validationResult.warnings.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {validationResult.warnings.map((warning, index) => (
                        <div 
                          key={index} 
                          className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-start gap-2"
                        >
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-600" />
                          <span className="flex-1">{warning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {validationResult.isValid && validationResult.errors.length === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 mb-1">Validação bem-sucedida!</p>
                      <p className="text-sm text-green-700">
                        O XML TISS está em conformidade com o padrão 3.03.00 e pode ser utilizado.
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {validationResult.isValid && validationResult.xmlContent && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={previewXml}
                      className="flex-1 bg-white"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={downloadXml}
                      className="flex-1 bg-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar XML
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8 sm:py-12 flex flex-col items-center gap-3">
                <FileCode className="h-12 w-12 sm:h-16 sm:w-16 opacity-50" />
                <p className="font-medium text-base sm:text-lg">Nenhuma validação executada ainda</p>
                <p className="text-sm">Execute uma validação para ver os resultados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            Como usar o Validador TISS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Upload className="h-4 w-4 text-blue-600" />
                </div>
                <h4 className="font-semibold text-sm">1. Upload ou Cole XML</h4>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Você pode fazer upload de um arquivo XML ou colar o conteúdo diretamente no campo de texto.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Shield className="h-4 w-4 text-indigo-600" />
                </div>
                <h4 className="font-semibold text-sm">2. Validação Automática</h4>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                O validador verifica a estrutura XML, elementos obrigatórios, formatos de CNPJ/CPF e versão TISS.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileCheck className="h-4 w-4 text-purple-600" />
                </div>
                <h4 className="font-semibold text-sm">3. Resultados</h4>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Erros impedem o uso do XML, enquanto avisos indicam possíveis problemas que devem ser revisados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
