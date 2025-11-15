"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, Paperclip, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
// Using div with overflow instead of ScrollArea

const mockMessages = [
  {
    id: 1,
    sender: "Dr. Maria Santos",
    message: "Olá! Seus exames estão prontos. Você pode visualizá-los no portal.",
    date: "15/01/2024 14:30",
    read: true,
  },
  {
    id: 2,
    sender: "Secretaria",
    message: "Lembrete: Você tem uma consulta agendada para amanhã às 09:00.",
    date: "14/01/2024 10:15",
    read: true,
  },
  {
    id: 3,
    sender: "Dr. Carlos Souza",
    message: "Gostaria de agendar um retorno para acompanhar a evolução do tratamento.",
    date: "13/01/2024 16:45",
    read: false,
  },
];

export default function MensagensPage() {
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const unreadCount = mockMessages.filter(m => !m.read).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-cyan-600" />
          Mensagens
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
          )}
        </h1>
        <p className="text-gray-600 mt-2">
          Comunique-se com a equipe médica de forma segura
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar mensagens..."
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[600px] overflow-y-auto">
              <div className="space-y-1">
                {mockMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                      selectedMessage === msg.id ? "bg-cyan-50 border-cyan-200" : ""
                    } ${!msg.read ? "bg-blue-50" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-semibold text-sm">{msg.sender}</span>
                        {!msg.read && (
                          <Badge className="bg-blue-500 text-white text-xs">Nova</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{msg.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedMessage
                ? mockMessages.find(m => m.id === selectedMessage)?.sender || "Mensagem"
                : "Selecione uma mensagem"}
            </CardTitle>
            <CardDescription>
              {selectedMessage
                ? mockMessages.find(m => m.id === selectedMessage)?.date
                : "Escolha uma mensagem da lista para visualizar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">
                    {mockMessages.find(m => m.id === selectedMessage)?.message}
                  </p>
                </div>
                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Digite sua resposta..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={4}
                    />
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm">
                        <Paperclip className="h-4 w-4 mr-2" />
                        Anexar
                      </Button>
                      <Button className="bg-cyan-600 hover:bg-cyan-700">
                        <Send className="h-4 w-4 mr-2" />
                        Enviar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma mensagem para visualizar</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

