"use client";

import React, { useState } from "react";
import { ConversationDto } from "@/lib/types/chat";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  Terminal,
  Plus,
  MessageSquare,
  Trash2,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Sparkles,
  Search,
  Settings2,
} from "lucide-react";

interface ChatSidebarProps {
  conversations: ConversationDto[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  isLoading: boolean;
  isCreating: boolean;
  onOpenAdminModal?: () => void;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isLoading,
  isCreating,
  onOpenAdminModal,
}: ChatSidebarProps) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredConversations = conversations.filter((c) =>
    (c.title || "New Conversation").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await onDeleteConversation(id);
    } finally {
      setDeletingId(null);
    }
  };

  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <aside className="w-72 lg:w-80 h-full flex flex-col border-r border-border/50 bg-background/95 backdrop-blur-sm select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-xs">
            <Terminal className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-foreground">DevPilot</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono text-primary border-primary/30">
                AI
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">Spring AI 2.0 Architect</p>
          </div>
        </div>
        <ModeToggle />
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={onNewChat}
          disabled={isCreating}
          className="w-full justify-center gap-2 rounded-xl shadow-xs font-medium text-sm transition-all"
        >
          {isCreating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4 stroke-[2.5]" />
          )}
          <span>New Conversation</span>
        </Button>
      </div>

      {/* Search Input (if list has > 3 threads) */}
      {conversations.length > 3 && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/40 border border-border/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Conversation Thread List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 scrollbar-thin">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 px-4 text-center">
            <Sparkles className="size-7 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-medium text-muted-foreground">
              {searchQuery ? "No matching chats found" : "No conversation history"}
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              {searchQuery ? "Try another keyword" : "Start a new chat to begin coding"}
            </p>
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isActive = c.id === activeConversationId;
            const isDeleting = deletingId === c.id;

            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-xs ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium border border-primary/20 shadow-xs"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-6">
                  <MessageSquare className={`size-3.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="truncate">{c.title || "New Conversation"}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[10px] opacity-70 group-hover:opacity-0 transition-opacity ${
                      isActive ? "text-primary/70" : "text-muted-foreground"
                    }`}
                  >
                    {formatTimestamp(c.updatedAt)}
                  </span>

                  <button
                    onClick={(e) => handleDelete(e, c.id)}
                    disabled={isDeleting}
                    title="Delete thread"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all absolute right-2"
                  >
                    {isDeleting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* User Footer Profile & Actions */}
      <div className="p-3 border-t border-border/40 bg-muted/20 space-y-2">
        {onOpenAdminModal && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAdminModal}
            className="w-full justify-start gap-2 h-8 text-xs font-normal border-border/50 text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="size-3.5" />
            <span>Developer / RBAC Controls</span>
          </Button>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="size-8 ring-1 ring-border">
              <AvatarImage src={user?.avatarUrl} alt={user?.displayName || user?.githubUsername} />
              <AvatarFallback className="text-xs font-semibold">
                {user?.displayName?.[0] || user?.githubUsername?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 leading-tight">
              <p className="text-xs font-semibold text-foreground truncate">{user?.displayName || user?.githubUsername}</p>
              <div className="flex items-center gap-1">
                {user?.role === "ROLE_ADMIN" ? (
                  <span className="flex items-center text-[10px] text-amber-500 font-medium">
                    <ShieldCheck className="size-3 mr-0.5" /> Admin
                  </span>
                ) : (
                  <span className="flex items-center text-[10px] text-muted-foreground font-medium">
                    <ShieldAlert className="size-3 mr-0.5" /> Developer
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            title="Sign out"
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
