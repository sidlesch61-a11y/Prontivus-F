"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle,
  Send,
  Search,
  Check,
  CheckCheck,
  AlertTriangle,
  Clock,
  Archive,
  RefreshCw,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { messagesApi, MessageThread, Message as ApiMessage } from "@/lib/messages-api";
import { useAuth } from "@/contexts/AuthContext";
import { uploadFiles } from "@/lib/file-upload";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ptBR } from "date-fns/locale";

interface Attachment {
  id?: string;
  name: string;
  type: "image" | "document" | "pdf";
  url: string;
  size: number;
  thumbnail?: string;
}

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderType: "patient" | "provider" | "system";
  content: string;
  timestamp: Date;
  read: boolean;
  urgent?: boolean;
  topic?: string;
  attachments?: Attachment[];
}

export default function DoctorMessagesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [currentThread, setCurrentThread] = useState<MessageThread | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [threadToArchive, setThreadToArchive] = useState<number | null>(null);
  const [archivedThreads, setArchivedThreads] = useState<MessageThread[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [stats, setStats] = useState({ total: 0, unread: 0, urgent: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [patients, setPatients] = useState<Record<number, any>>({});

  const loadPatients = async (patientIds: number[]) => {
    try {
      const patientData: Record<number, any> = {};
      for (const patientId of patientIds) {
        try {
          const patient = await api.get(`/api/v1/patients/${patientId}`);
          patientData[patientId] = patient;
        } catch (error) {
          console.warn(`Failed to load patient ${patientId}:`, error);
        }
      }
      setPatients(prev => ({ ...prev, ...patientData }));
    } catch (error) {
      console.error("Failed to load patients:", error);
    }
  };

  const loadThread = async (threadId: number) => {
    try {
      const thread = await messagesApi.getThread(threadId);
      setCurrentThread(thread);
      
      // Load patient if not already loaded
      if (thread.patient_id && !patients[thread.patient_id]) {
        await loadPatients([thread.patient_id]);
      }
      
      // Map messages
      const mappedMessages: Message[] = (thread.messages || []).map((msg: any) => {
        const patient = patients[thread.patient_id];
        const patientName = patient 
          ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.email || 'Paciente'
          : 'Paciente';
        
        return {
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.sender_type === "patient" ? patientName : "Você",
          senderType: msg.sender_type,
          content: msg.content || "",
          timestamp: parseISO(msg.created_at),
          read: msg.status === "read",
          urgent: thread.is_urgent,
          topic: thread.topic,
          attachments: msg.attachments?.map((att: any, idx: number) => ({
            id: `${msg.id}-${idx}`,
            name: att.name,
            type: att.type === "pdf" ? "pdf" : att.type === "image" ? "image" : "document",
            url: att.url,
            size: att.size || 0,
          })) || [],
        };
      });
      
      // Sort messages by timestamp and remove duplicates
      const sortedMessages = mappedMessages
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .filter((msg, idx, arr) => arr.findIndex(m => m.id === msg.id) === idx);
      
      setCurrentMessages(sortedMessages);
      
      // Update thread in list
      setThreads(prev => prev.map(t => t.id === threadId ? thread : t));
    } catch (error: any) {
      console.error("Failed to load thread:", error);
      toast.error("Erro ao carregar conversa", {
        description: error?.message || error?.detail || "Não foi possível carregar a conversa",
      });
      setCurrentThread(null);
      setCurrentMessages([]);
    }
  };

  // Real-time message handlers
  const handleNewMessage = useCallback((message: any) => {
    console.log("Received new message via WebSocket:", message);
    
    // Get patient info - try from current thread or load if needed
    let patientName = 'Paciente';
    if (message.thread_id && (selectedThreadId === message.thread_id || !selectedThreadId)) {
      // Try to get patient from current thread
      const thread = threads.find(t => t.id === message.thread_id) || currentThread;
      if (thread) {
        const patient = patients[thread.patient_id];
        if (patient) {
          patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.email || 'Paciente';
        } else if (thread.patient_id && !patients[thread.patient_id]) {
          // Load patient if not already loaded
          loadPatients([thread.patient_id]);
        }
      }
    }
    
    // Only add message if it's for the current thread
    if (selectedThreadId && message.thread_id === selectedThreadId) {
      const mappedMessage: Message = {
        id: message.id,
        senderId: message.sender_id,
        senderName: message.sender_type === "patient" ? patientName : "Você",
        senderType: message.sender_type,
        content: message.content || "",
        timestamp: parseISO(message.created_at),
        read: message.status === "read",
        urgent: currentThread?.is_urgent,
        topic: currentThread?.topic,
        attachments: message.attachments?.map((att: any, idx: number) => ({
          id: `${message.id}-${idx}`,
          name: att.name,
          type: att.type === "pdf" ? "pdf" : att.type === "image" ? "image" : "document",
          url: att.url,
          size: att.size || 0,
        })),
      };
      
      setCurrentMessages(prev => {
        // Avoid duplicates - check if message already exists
        const exists = prev.some(m => m.id === message.id);
        if (exists) {
          return prev;
        }
        // Insert message in chronological order
        const newMessages = [...prev, mappedMessage];
        return newMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      });
      
      // Update thread in list
      setThreads(prev => prev.map(t => {
        if (t.id === message.thread_id) {
          return {
            ...t,
            last_message_at: message.created_at,
            last_message: message.content?.substring(0, 100),
            unread_count: message.sender_type === "patient" ? t.unread_count + 1 : t.unread_count,
          };
        }
        return t;
      }));
      
      // Update stats
      if (message.sender_type === "patient") {
        setStats(prev => ({ ...prev, unread: prev.unread + 1 }));
      }
    } else {
      // Message for a different thread - update thread list
      setThreads(prev => prev.map(t => {
        if (t.id === message.thread_id) {
          return {
            ...t,
            last_message_at: message.created_at,
            last_message: message.content?.substring(0, 100),
            unread_count: message.sender_type === "patient" ? t.unread_count + 1 : t.unread_count,
          };
        }
        return t;
      }));
      
      // Update stats
      if (message.sender_type === "patient") {
        setStats(prev => ({ ...prev, unread: prev.unread + 1 }));
      }
      
      // If this is the currently selected thread but we haven't loaded it yet, refresh
      if (selectedThreadId === message.thread_id) {
        loadThread(message.thread_id);
      }
    }
  }, [selectedThreadId, currentThread, patients, threads]);

  const handleThreadUpdate = useCallback((update: any) => {
    // Update thread in list
    setThreads(prev => prev.map(t => {
      if (t.id === update.thread_id) {
        return {
          ...t,
          ...update.thread,
        };
      }
      return t;
    }));
    
    // If current thread is updated, refresh it
    if (selectedThreadId === update.thread_id) {
      setRefreshKey(prev => prev + 1);
    }
  }, [selectedThreadId]);

  const handleMessageRead = useCallback((threadId: number, messageId: number) => {
    // Update message read status
    if (selectedThreadId === threadId) {
      setCurrentMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          return { ...m, read: true };
        }
        return m;
      }));
    }
  }, [selectedThreadId]);

  // Set up real-time messaging
  const { connected, subscribeToThread, unsubscribeFromThread } = useRealtimeMessages(
    handleNewMessage,
    handleThreadUpdate,
    handleMessageRead
  );

  // Subscribe to thread when selected
  useEffect(() => {
    if (selectedThreadId && connected) {
      subscribeToThread(selectedThreadId);
      return () => {
        unsubscribeFromThread(selectedThreadId);
      };
    }
  }, [selectedThreadId, connected, subscribeToThread, unsubscribeFromThread]);

  // Load threads on mount and when refresh key changes
  useEffect(() => {
    loadThreads();
    loadStats();
  }, [refreshKey]);

  // Load thread details when selected
  useEffect(() => {
    if (selectedThreadId) {
      // Clear messages first to avoid duplicates
      setCurrentMessages([]);
      loadThread(selectedThreadId);
    } else {
      setCurrentMessages([]);
      setCurrentThread(null);
    }
  }, [selectedThreadId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const [activeData, archivedData] = await Promise.all([
        messagesApi.listThreads(false).catch(() => []),
        messagesApi.listThreads(true).catch(() => []),
      ]);
      setThreads(activeData);
      setArchivedThreads(archivedData);
      
      // Load patient information for threads
      const patientIds = [...new Set([...activeData, ...archivedData].map(t => t.patient_id))];
      await loadPatients(patientIds);
      
      if (activeData.length > 0 && !selectedThreadId) {
        setSelectedThreadId(activeData[0].id);
      }
    } catch (error: any) {
      console.error("Failed to load threads:", error);
      toast.error("Erro ao carregar conversas", {
        description: error?.message || error?.detail || "Não foi possível carregar suas conversas",
      });
      setThreads([]);
      setArchivedThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const activeThreads = await messagesApi.listThreads(false).catch(() => []);
      const total = activeThreads.length;
      const unread = activeThreads.reduce((sum, t) => sum + (t.unread_count || 0), 0);
      const urgent = activeThreads.filter(t => t.is_urgent).length;
      setStats({ total, unread, urgent });
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const getPatientName = (thread: MessageThread): string => {
    const patient = patients[thread.patient_id];
    if (patient) {
      const name = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
      return name || patient.email || 'Paciente';
    }
    return 'Paciente';
  };

  const filteredThreads = (showArchived ? archivedThreads : threads).filter((thread) => {
    const patientName = getPatientName(thread).toLowerCase();
    return (
      patientName.includes(searchQuery.toLowerCase()) ||
      thread.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleArchiveThread = async (threadId: number) => {
    try {
      await messagesApi.deleteThread(threadId);
      setShowArchiveDialog(false);
      setThreadToArchive(null);
      if (selectedThreadId === threadId) {
        setSelectedThreadId(null);
        setCurrentThread(null);
        setCurrentMessages([]);
      }
      setRefreshKey(prev => prev + 1);
      toast.success("Conversa arquivada com sucesso!");
    } catch (error: any) {
      console.error("Failed to archive thread:", error);
      toast.error("Erro ao arquivar conversa", {
        description: error?.message || error?.detail || "Não foi possível arquivar a conversa",
      });
    }
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && uploadedFiles.length === 0) || !selectedThreadId || sending) {
      if (!messageInput.trim() && uploadedFiles.length === 0) {
        toast.error("Por favor, digite uma mensagem ou anexe um arquivo");
      }
      return;
    }

    try {
      setSending(true);
      
      let attachments: any[] = [];
      if (uploadedFiles.length > 0) {
        const uploadResults = await uploadFiles(uploadedFiles);
        attachments = uploadResults.map((result, idx) => ({
          name: uploadedFiles[idx].name,
          type: uploadedFiles[idx].type.startsWith('image/') ? 'image' : uploadedFiles[idx].type === 'application/pdf' ? 'pdf' : 'document',
          url: result.url,
          size: uploadedFiles[idx].size,
        }));
      }

      const newMessage = await messagesApi.sendMessage(selectedThreadId, {
        content: messageInput.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      // Add message to current messages
      const patient = currentThread ? patients[currentThread.patient_id] : null;
      const patientName = patient 
        ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.email || 'Paciente'
        : 'Paciente';
      
      const mappedMessage: Message = {
        id: newMessage.id,
        senderId: newMessage.sender_id,
        senderName: "Você",
        senderType: "provider",
        content: newMessage.content,
        timestamp: parseISO(newMessage.created_at),
        read: newMessage.status === "read",
        attachments: newMessage.attachments?.map((att, idx) => ({
          id: `${newMessage.id}-${idx}`,
          name: att.name,
          type: att.type === "pdf" ? "pdf" : att.type === "image" ? "image" : "document",
          url: att.url,
          size: att.size || 0,
        })),
      };

      setCurrentMessages(prev => {
        // Avoid duplicates - check if message already exists
        const exists = prev.some(m => m.id === mappedMessage.id);
        if (exists) {
          return prev;
        }
        // Insert message in chronological order
        const newMessages = [...prev, mappedMessage];
        return newMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      });
      setMessageInput("");
      setUploadedFiles([]);
      
      // Refresh threads to update last message
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error("Failed to send message:", error);
      toast.error("Erro ao enviar mensagem", {
        description: error?.message || error?.detail || "Não foi possível enviar a mensagem",
      });
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, "HH:mm", { locale: ptBR });
    } else if (isYesterday(date)) {
      return `Ontem ${format(date, "HH:mm", { locale: ptBR })}`;
    } else {
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    }
  };

  if (loading && threads.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando mensagens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-green-600" />
              Mensagens
            </h1>
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full",
                connected ? "bg-green-500" : "bg-gray-400"
              )} title={connected ? "Conectado em tempo real" : "Desconectado"} />
              <span className="text-xs text-gray-500">
                {connected ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            Comunicação com pacientes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Conversas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Não Lidas</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unread}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-400px)]">
        {/* Threads List */}
        <Card className="lg:col-span-1 flex flex-col h-full">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-lg">Conversas</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                className="text-xs"
              >
                {showArchived ? "Ativas" : "Arquivadas"}
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar conversas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0 min-h-0">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">
                  {showArchived ? "Nenhuma conversa arquivada" : "Nenhuma conversa ainda"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredThreads.map((thread) => {
                  const patientName = getPatientName(thread);
                  const isSelected = selectedThreadId === thread.id;
                  const hasUnread = thread.unread_count > 0;
                  
                  return (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={cn(
                        "p-4 cursor-pointer border-b transition-colors",
                        isSelected
                          ? "bg-green-50 border-green-200"
                          : "hover:bg-gray-50 border-gray-200"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-green-100 text-green-700">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={cn(
                              "font-semibold text-sm truncate",
                              hasUnread ? "text-gray-900" : "text-gray-700"
                            )}>
                              {patientName}
                            </p>
                            {thread.last_message_at && (
                              <span className="text-xs text-gray-500 ml-2">
                                {formatDistanceToNow(parseISO(thread.last_message_at), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </span>
                            )}
                          </div>
                          {thread.topic && (
                            <p className="text-xs text-gray-600 mb-1 truncate">
                              {thread.topic}
                            </p>
                          )}
                          {thread.last_message && (
                            <p className="text-xs text-gray-500 truncate">
                              {thread.last_message}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {thread.is_urgent && (
                              <Badge variant="destructive" className="text-xs">
                                Urgente
                              </Badge>
                            )}
                            {hasUnread && (
                              <Badge className="bg-green-600 text-white text-xs">
                                {thread.unread_count} nova{thread.unread_count > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages View */}
        <Card className="lg:col-span-2 flex flex-col h-full">
          {currentThread ? (
            <>
              <CardHeader className="pb-3 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-green-100 text-green-700">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {getPatientName(currentThread)}
                      </CardTitle>
                      {currentThread.topic && (
                        <CardDescription>{currentThread.topic}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentThread.is_urgent && (
                      <Badge variant="destructive">Urgente</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setThreadToArchive(currentThread.id);
                        setShowArchiveDialog(true);
                      }}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {currentMessages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Nenhuma mensagem ainda</p>
                  </div>
                ) : (
                  currentMessages.map((message) => {
                    const isFromPatient = message.senderType === "patient";
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          isFromPatient ? "justify-start" : "justify-end"
                        )}
                      >
                        {isFromPatient && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-green-100 text-green-700">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg p-3",
                            isFromPatient
                              ? "bg-gray-100 text-gray-900"
                              : "bg-green-600 text-white"
                          )}
                        >
                          <div className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </div>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((att) => (
                                <a
                                  key={att.id}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs underline flex items-center gap-1"
                                >
                                  {att.name}
                                </a>
                              ))}
                            </div>
                          )}
                          <div
                            className={cn(
                              "text-xs mt-2 flex items-center gap-1",
                              isFromPatient ? "text-gray-500" : "text-green-100"
                            )}
                          >
                            {formatMessageTime(message.timestamp)}
                            {!isFromPatient && message.read && (
                              <CheckCheck className="h-3 w-3" />
                            )}
                            {!isFromPatient && !message.read && (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                        {!isFromPatient && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-green-600 text-white">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </CardContent>
              <div className="border-t p-4 flex-shrink-0">
                <div className="flex items-end gap-2">
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[80px] resize-none"
                  />
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      aria-label="Anexar arquivo"
                      onChange={(e) => {
                        if (e.target.files) {
                          setUploadedFiles(Array.from(e.target.files));
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Anexar
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || (!messageInput.trim() && uploadedFiles.length === 0)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {sending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {uploadedFiles.map((file, idx) => (
                      <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                        {file.name}
                        <button
                          onClick={() => {
                            setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="ml-1"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Selecione uma conversa</p>
                <p className="text-sm mt-2">Escolha uma conversa da lista para visualizar as mensagens</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Archive Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Conversa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja arquivar esta conversa? Você ainda poderá visualizá-la na seção de arquivadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setThreadToArchive(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (threadToArchive) {
                  handleArchiveThread(threadToArchive);
                }
              }}
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

