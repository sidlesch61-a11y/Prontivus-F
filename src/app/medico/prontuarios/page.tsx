"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search, Calendar, User, Eye, RefreshCw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClinicalRecord {
  id?: number;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  plan_soap?: string;
  prescriptions?: any[];
  exam_requests?: any[];
  diagnoses?: any[];
}

interface ClinicalRecordItem {
  appointment_id: number;
  appointment_date: string;
  doctor_name: string;
  patient_name?: string | null;
  appointment_type: string | null;
  status: string;
  clinical_record: ClinicalRecord | null;
}

export default function ProntuariosPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ClinicalRecordItem[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ClinicalRecordItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<ClinicalRecordItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, searchTerm]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await api.get<ClinicalRecordItem[]>("/api/v1/clinical/doctor/my-clinical-records");
      
      // Sort by appointment date (most recent first)
      const sorted = [...data].sort((a, b) => {
        const dateA = parseISO(a.appointment_date);
        const dateB = parseISO(b.appointment_date);
        return dateB.getTime() - dateA.getTime();
      });
      
      setRecords(sorted);
    } catch (error: any) {
      console.error("Failed to load records:", error);
      toast.error("Erro ao carregar prontuários", {
        description: error?.message || error?.detail || "Não foi possível carregar os prontuários",
      });
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...records];
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(record => {
        // Search in patient name (we need to get it from appointment)
        const hasRecord = record.clinical_record !== null;
        const recordText = record.clinical_record
          ? `${record.clinical_record.subjective || ''} ${record.clinical_record.objective || ''} ${record.clinical_record.assessment || ''} ${record.clinical_record.plan || ''}`.toLowerCase()
          : '';
        const appointmentType = (record.appointment_type || '').toLowerCase();
        
        return recordText.includes(search) || appointmentType.includes(search);
      });
    }
    
    setFilteredRecords(filtered);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (hasRecord: boolean) => {
    if (hasRecord) {
      return <Badge className="bg-green-100 text-green-800">Finalizado</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
  };

  const getRecordDescription = (record: ClinicalRecord | null) => {
    if (!record) {
      return "Aguardando preenchimento do prontuário";
    }
    
    // Try to get a meaningful description from the record
    if (record.assessment) {
      return record.assessment.length > 100 
        ? record.assessment.substring(0, 100) + "..." 
        : record.assessment;
    }
    if (record.plan) {
      return record.plan.length > 100 
        ? record.plan.substring(0, 100) + "..." 
        : record.plan;
    }
    if (record.subjective) {
      return record.subjective.length > 100 
        ? record.subjective.substring(0, 100) + "..." 
        : record.subjective;
    }
    if (record.objective) {
      return record.objective.length > 100 
        ? record.objective.substring(0, 100) + "..." 
        : record.objective;
    }
    
    return "Prontuário sem descrição";
  };

  const handleViewDetails = (record: ClinicalRecordItem) => {
    setSelectedRecord(record);
    setShowDetails(true);
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
            <FileText className="h-8 w-8 text-green-600" />
            Histórico dos Prontuários Médicos
          </h1>
          <p className="text-gray-600 mt-2">
            Visualize o histórico de prontuários dos seus pacientes
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadRecords}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Prontuários</CardTitle>
              <CardDescription>
                {filteredRecords.length} {filteredRecords.length === 1 ? "prontuário encontrado" : "prontuários encontrados"}
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar paciente ou prontuário..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => {
                  const patientName = record.patient_name || "Paciente";
                  
                  return (
                    <TableRow key={record.appointment_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(record.appointment_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {patientName}
                        </div>
                      </TableCell>
                      <TableCell>{record.appointment_type || "Consulta"}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={getRecordDescription(record.clinical_record)}>
                          {getRecordDescription(record.clinical_record)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.clinical_record !== null)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(record)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>
                {searchTerm
                  ? "Nenhum prontuário encontrado com os filtros aplicados"
                  : "Nenhum prontuário encontrado"}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSearchTerm("")}
                >
                  Limpar busca
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Prontuário</DialogTitle>
            <DialogDescription>
              {selectedRecord && formatDateTime(selectedRecord.appointment_date)}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              {selectedRecord.clinical_record ? (
                <>
                  <div>
                    <h3 className="font-semibold mb-2">Subjetivo</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {selectedRecord.clinical_record.subjective || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Objetivo</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {selectedRecord.clinical_record.objective || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Avaliação</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {selectedRecord.clinical_record.assessment || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Plano</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {selectedRecord.clinical_record.plan || selectedRecord.clinical_record.plan_soap || "Não informado"}
                    </p>
                  </div>
                  {selectedRecord.clinical_record.prescriptions && selectedRecord.clinical_record.prescriptions.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Prescrições</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {selectedRecord.clinical_record.prescriptions.map((presc: any, idx: number) => (
                          <li key={idx}>
                            {presc.medication_name} - {presc.dosage} - {presc.frequency}
                            {presc.duration && ` - ${presc.duration}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedRecord.clinical_record.exam_requests && selectedRecord.clinical_record.exam_requests.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Solicitações de Exames</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {selectedRecord.clinical_record.exam_requests.map((exam: any, idx: number) => (
                          <li key={idx}>
                            {exam.exam_type}
                            {exam.description && ` - ${exam.description}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedRecord.clinical_record.diagnoses && selectedRecord.clinical_record.diagnoses.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Diagnósticos</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {selectedRecord.clinical_record.diagnoses.map((diag: any, idx: number) => (
                          <li key={idx}>
                            {diag.icd10_code && `${diag.icd10_code} - `}
                            {diag.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Prontuário ainda não foi preenchido</p>
                  <p className="text-sm mt-2">
                    Este agendamento ainda não possui prontuário médico associado.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
