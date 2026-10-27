"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessageDto, ConversationDetailDto } from "@/lib/types/chat";
import { chatApi, ApiError } from "@/lib/api-client";
import { useAuth } from "@/components/providers/auth-provider";
import { MarkdownContent } from "./markdown-content";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Terminal,
  ArrowUp,
  Square,
  Sparkles,
  Loader2,
  Code2,
  Cpu,
  Database,
  Layers,
  Bot,
  AlertCircle,
} from "lucide-react";

interface ChatInterfaceProps {
  activeConversationId: string | null;
  onConversationCreated?: (newId: string) => void;
  onConversationUpdated?: () => void;
}

const STARTER_PROMPTS = [
  {
    icon: Code2,
    title: "Spring Boot OAuth2 & JWT",
    prompt: "Show me a production-ready Spring Security 6.x configuration for stateless JWT authentication and GitHub OAuth2 login.",
  },
  {
    icon: Database,
    title: "High-Performance JPA & Indexing",
    prompt: "How do I optimize Hibernate JPA batch insertions and avoid N+1 query problems in PostgreSQL?",
  },
  {
    icon: Cpu,
    title: "Virtual Threads vs WebFlux",
    prompt: "Compare Java 21+ Virtual Threads with Spring WebFlux reactive streams. When should I choose each for microservices?",
  },
  {
    icon: Layers,
    title: "Full-Stack SSE Streaming Architecture",
    prompt: "Explain how Server-Sent Events (SSE) work between Spring Boot Flux<String> and Next.js ReadableStream with automatic reconnection.",
  },
];

export function ChatInterface({
  activeConversationId,
  onConversationCreated,
  onConversationUpdated,
}: ChatInterfaceProps) {
  const { user, accessToken } = useAuth();

  const [conversation, setConversation] = useState<ConversationDetailDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  // Fetch conversation history when active ID changes
  useEffect(() => {
    if (!activeConversationId || !accessToken) {
      setConversation(null);
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoadingHistory(true);
    setErrorMessage(null);

    chatApi
      .getConversation(accessToken, activeConversationId)
      .then((res) => {
        if (!isMounted) return;
        setConversation(res.data);
        setMessages(res.data.messages || []);
        setTimeout(() => scrollToBottom("auto"), 50);
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMessage(err instanceof Error ? err.message : "Failed to load chat thread");
      })
      .finally(() => {
        if (isMounted) setIsLoadingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeConversationId, accessToken, scrollToBottom]);

  // Scroll on new messages or stream chunks
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send message and stream response
  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend || inputValue).trim();
    if (!text || isStreaming || !accessToken) return;

    setInputValue("");
    setErrorMessage(null);

    let convId = activeConversationId;

    try {
      // 1. If no active conversation, create one first
      if (!convId) {
        const newConv = await chatApi.createConversation(accessToken, text.slice(0, 40));
        convId = newConv.data.id;
        onConversationCreated?.(convId);
      }

      // 2. Optimistic user message
      const userMessage: ChatMessageDto = {
        id: `user-${Date.now()}`,
        role: "USER",
        content: text,
        createdAt: new Date().toISOString(),
      };

      // 3. Placeholder assistant message
      const assistantMessage: ChatMessageDto = {
        id: `assistant-${Date.now()}`,
        role: "ASSISTANT",
        content: "",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      // Setup AbortController
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // 4. Stream tokens via SSE
      await chatApi.streamMessage(
        accessToken,
        convId,
        text,
        (chunk) => {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === "ASSISTANT") {
              return [
                ...prev.slice(0, -1),
                { ...last, content: last.content + chunk },
              ];
            }
            return prev;
          });
        },
        abortController.signal
      );

      // Trigger update to refresh titles and timestamps
      onConversationUpdated?.();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // User aborted intentionally
      } else {
        const msg = err instanceof ApiError ? err.message : (err as Error)?.message || "Streaming failed";
        setErrorMessage(msg);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border/50 px-6 flex items-center justify-between bg-background/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Bot className="size-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate text-foreground">
              {conversation?.title || (messages.length > 0 ? "Conversation" : "New Chat")}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Spring AI 2.0
              </span>
              <span>•</span>
              <span>DevPilot GPT-4o Architect</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] font-mono border-border/60">
            {messages.length} {messages.length === 1 ? "turn" : "turns"}
          </Badge>
        </div>
      </header>

      {/* Main Messages Viewport */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:px-12 scrollbar-thin">
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground animate-pulse">Loading message history...</p>
          </div>
        ) : messages.length === 0 ? (
          /* Empty State - Starter Hero */
          <div className="max-w-2xl mx-auto h-full flex flex-col justify-center items-center text-center py-8">
            <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-sm">
              <Sparkles className="size-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              What are we building today?
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mt-2 mb-8 leading-relaxed">
              DevPilot is your production-grade software architect. Ask about system design, code generation, refactoring, or enterprise patterns.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full text-left">
              {STARTER_PROMPTS.map((starter, i) => {
                const IconComponent = starter.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(starter.prompt)}
                    className="p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/50 hover:border-primary/40 transition-all text-left group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent className="size-4 text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-semibold text-foreground">{starter.title}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {starter.prompt}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Chat Message Stream */
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((m, idx) => {
              const isUser = m.role === "USER";
              const isLast = idx === messages.length - 1;
              const isCurrentStreaming = isStreaming && isLast && !isUser;

              return (
                <div
                  key={m.id || idx}
                  className={`flex gap-3 md:gap-4 items-start ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  {isUser ? (
                    <Avatar className="size-8 shrink-0 ring-1 ring-border mt-0.5">
                      <AvatarImage src={user?.avatarUrl} alt={user?.displayName || "User"} />
                      <AvatarFallback className="text-xs font-semibold">
                        {user?.displayName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="size-8 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mt-0.5 shadow-2xs">
                      <Terminal className="size-4" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`min-w-0 max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xs ${
                      isUser
                        ? "bg-primary text-primary-foreground font-normal rounded-tr-sm"
                        : "bg-muted/40 border border-border/60 text-foreground rounded-tl-sm backdrop-blur-xs"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <div className="relative">
                        {m.content.length === 0 && isCurrentStreaming ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                            <span className="size-2 rounded-full bg-primary animate-ping" />
                            <span>DevPilot is thinking...</span>
                          </div>
                        ) : (
                          <MarkdownContent content={m.content} />
                        )}

                        {/* Streaming cursor indicator */}
                        {isCurrentStreaming && m.content.length > 0 && (
                          <span className="inline-block w-1.5 h-4 ml-1 bg-primary align-middle animate-pulse" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Error Notification */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2.5">
                <AlertCircle className="size-4 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Generation Error</p>
                  <p className="text-[11px] opacity-90">{errorMessage}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input Box Footer */}
      <div className="p-4 md:px-8 border-t border-border/50 bg-background/90 backdrop-blur-md shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl border border-input bg-card shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask DevPilot anything... (Press Enter to send, Shift+Enter for new line)"
              rows={1}
              className="w-full resize-none border-none bg-transparent px-4 py-3.5 text-sm outline-none shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/70 min-h-[52px] max-h-48"
            />

            <div className="flex items-center justify-between px-3 pb-2 pt-1">
              <span className="text-[11px] text-muted-foreground">
                Markdown & code highlighting supported
              </span>

              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleStopGenerating}
                    className="h-8 gap-1.5 px-3 rounded-lg text-xs font-medium"
                  >
                    <Square className="size-3 fill-current" />
                    <span>Stop</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={inputValue.trim().length === 0}
                    onClick={() => handleSendMessage()}
                    className="h-8 size-8 p-0 rounded-lg shadow-xs"
                  >
                    <ArrowUp className="size-4 stroke-[2.5]" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-center text-muted-foreground/60 mt-2">
            DevPilot AI Enterprise Edition • Powered by Spring AI 2.0 & Next.js 16
          </p>
        </div>
      </div>
    </div>
  );
}
