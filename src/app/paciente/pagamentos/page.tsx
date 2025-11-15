"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Calendar, CheckCircle2, XCircle, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockPayments = [
  {
    id: 1,
    description: "Consulta - Dr. Maria Santos",
    amount: "R$ 150,00",
    dueDate: "20/01/2024",
    paymentDate: "18/01/2024",
    method: "Cartão de Crédito",
    status: "Pago",
  },
  {
    id: 2,
    description: "Exame de Sangue",
    amount: "R$ 80,00",
    dueDate: "25/01/2024",
    paymentDate: null,
    method: null,
    status: "Pendente",
  },
  {
    id: 3,
    description: "Consulta - Dr. Carlos Souza",
    amount: "R$ 120,00",
    dueDate: "15/01/2024",
    paymentDate: "15/01/2024",
    method: "PIX",
    status: "Pago",
  },
  {
    id: 4,
    description: "Consulta - Dr. Ana Oliveira",
    amount: "R$ 200,00",
    dueDate: "10/01/2024",
    paymentDate: null,
    method: null,
    status: "Atrasado",
  },
];

export default function PagamentosPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pago":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1 inline" />
            Pago
          </Badge>
        );
      case "Pendente":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1 inline" />
            Pendente
          </Badge>
        );
      case "Atrasado":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1 inline" />
            Atrasado
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const totalPaid = mockPayments
    .filter(p => p.status === "Pago")
    .reduce((sum, p) => sum + parseFloat(p.amount.replace('R$ ', '').replace(',', '.')), 0);
  
  const totalPending = mockPayments
    .filter(p => p.status === "Pendente" || p.status === "Atrasado")
    .reduce((sum, p) => sum + parseFloat(p.amount.replace('R$ ', '').replace(',', '.')), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-cyan-600" />
          Pagamentos
        </h1>
        <p className="text-gray-600 mt-2">
          Visualize e gerencie seus pagamentos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              R$ {totalPaid.toFixed(2).replace('.', ',')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              R$ {totalPending.toFixed(2).replace('.', ',')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Próximo Vencimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-600">25/01</div>
            <div className="text-sm text-gray-500 mt-1">R$ 80,00</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>
            Lista completa dos seus pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.description}</TableCell>
                  <TableCell className="font-semibold">{payment.amount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {payment.dueDate}
                    </div>
                  </TableCell>
                  <TableCell>
                    {payment.paymentDate ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {payment.paymentDate}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>{payment.method || "-"}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {payment.status === "Pago" && (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {(payment.status === "Pendente" || payment.status === "Atrasado") && (
                        <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                          Pagar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

