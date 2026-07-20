"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle,
  Search,
  Bot,
  User,
  Clock,
  Phone,
  CheckCheck,
  Loader2,
  AlertCircle,
  Send,
  ChevronRight,
  FileCheck,
  Sparkles,
  Users,
  MessagesSquare,
  PauseCircle,
  PlayCircle,
  Crown,
} from "lucide-react";

interface Conversation {
  phone: string;
  name: string;
  last_message: string;
  last_message_role: string;
  last_message_time: string;
  message_count: number;
  proposal_sent: number;
}

interface ChatMessage {
  id: number;
  phone: string;
  role: string;
  message: string;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "just now";
  } catch {
    return "";
  }
}

function formatMessageTime(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

// Group messages by date
function groupByDate(messages: ChatMessage[]): { date: string; msgs: ChatMessage[] }[] {
  const groups: { date: string; msgs: ChatMessage[] }[] = [];
  for (const msg of messages) {
    let dateLabel = "—";
    try {
      const d = new Date(msg.created_at);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      if (d.toDateString() === today.toDateString()) dateLabel = "Today";
      else if (d.toDateString() === yesterday.toDateString()) dateLabel = "Yesterday";
      else dateLabel = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {}
    const last = groups[groups.length - 1];
    if (last && last.date === dateLabel) last.msgs.push(msg);
    else groups.push({ date: dateLabel, msgs: [msg] });
  }
  return groups;
}

export default function WhatsAppChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filtered, setFiltered] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [compose, setCompose] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [aiPaused, setAiPaused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Fetch all conversations on mount
  useEffect(() => {
    const fetchConvs = async () => {
      try {
        setLoadingConvs(true);
        const res = await fetch("/api/whatsapp/conversations");
        if (!res.ok) throw new Error("Failed to fetch conversations");
        const data = await res.json();
        setConversations(data);
        setFiltered(data);
        // Auto-select first conversation
        if (data.length > 0) {
          setSelected(data[0]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingConvs(false);
      }
    };
    fetchConvs();
  }, []);

  // Fetch messages when selected conversation changes
  useEffect(() => {
    if (!selected) return;
    const fetchMessages = async () => {
      try {
        setLoadingMsgs(true);
        const res = await fetch(`/api/whatsapp/messages?phone=${encodeURIComponent(selected.phone)}`);
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingMsgs(false);
      }
    };
    fetchMessages();
  }, [selected]);

  // Auto-scroll to bottom when messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter conversations
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(conversations);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      conversations.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.last_message.toLowerCase().includes(q)
      )
    );
  }, [search, conversations]);

  const totalMessages = conversations.reduce((s, c) => s + c.message_count, 0);
  const proposalConvs = conversations.filter((c) => c.proposal_sent).length;

  const sendManualMessage = useCallback(async () => {
    if (!selected || !compose.trim() || sending) return;
    const text = compose.trim();
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: selected.phone, message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      // Optimistically add the message to the chat
      const newMsg: ChatMessage = {
        id: Date.now(),
        phone: selected.phone,
        role: "owner",
        message: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMsg]);
      setCompose("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (err: any) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  }, [selected, compose, sending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendManualMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-73px)] md:h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 shrink-0">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-tr from-green-500 to-emerald-400 p-1.5 text-white shadow-md shadow-green-500/20">
                <MessageCircle className="h-4 w-4" />
              </div>
              <h1 className="text-md font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                WhatsApp AI Chat
              </h1>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live view of all AI conversations with your leads
            </p>
          </div>

          {/* Stats pill */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 px-3 py-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
              <Users className="h-3.5 w-3.5 text-green-500" />
              <span>{conversations.length} contacts</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 px-3 py-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
              <MessagesSquare className="h-3.5 w-3.5 text-violet-500" />
              <span>{totalMessages.toLocaleString()} messages</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 px-3 py-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
              <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>{proposalConvs} proposals sent</span>
            </div>
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-950/50 dark:bg-rose-950/20">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
          <p className="text-xs font-medium text-rose-700 dark:text-rose-400">{error}</p>
        </div>
      )}

      {/* Chat layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Conversation List */}
        <div className="w-80 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-green-500/30 transition-all"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
                <MessageCircle className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                <p className="text-xs font-medium text-zinc-500">No conversations yet</p>
                <p className="text-[11px] text-zinc-400">Messages will appear here once your AI starts chatting</p>
              </div>
            ) : (
              filtered.map((conv) => {
                const isActive = selected?.phone === conv.phone;
                return (
                  <button
                    key={conv.phone}
                    onClick={() => setSelected(conv)}
                    className={`w-full text-left px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800/50 flex items-start gap-3 transition-all group ${
                      isActive
                        ? "bg-green-50 dark:bg-green-950/20 border-l-2 border-l-green-500"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        isActive
                          ? "bg-gradient-to-tr from-green-400 to-emerald-500 text-white"
                          : "bg-gradient-to-tr from-zinc-300 to-zinc-400 dark:from-zinc-600 dark:to-zinc-700 text-white"
                      }`}
                    >
                      {conv.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                          {conv.name}
                        </p>
                        <span className="text-[10px] text-zinc-400 shrink-0">
                          {timeAgo(conv.last_message_time)}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {conv.last_message_role === "assistant" && (
                          <span className="text-violet-500 font-medium">AI: </span>
                        )}
                        {conv.last_message || "No messages"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-zinc-400">
                          {conv.phone}
                        </span>
                        {conv.proposal_sent === 1 && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                            <FileCheck className="h-2.5 w-2.5" />
                            Proposal Sent
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      className={`h-3.5 w-3.5 shrink-0 mt-1 transition-all ${
                        isActive ? "text-green-500" : "text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100"
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main Chat Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950 grid-bg">
          {!selected ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="rounded-3xl bg-gradient-to-tr from-green-500 to-emerald-400 p-6 text-white shadow-2xl shadow-green-500/20">
                <MessageCircle className="h-10 w-10" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  Select a conversation
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                  Pick a contact from the left panel to view your AI's full conversation history with them
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                    {selected.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      {selected.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-zinc-400" />
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {selected.phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selected.proposal_sent === 1 && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 px-3 py-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      <FileCheck className="h-3.5 w-3.5" />
                      Proposal Sent
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-violet-100 dark:bg-violet-950/40 px-3 py-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    {selected.message_count} messages
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <MessagesSquare className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                    <p className="text-xs font-medium text-zinc-500">No messages in this conversation</p>
                  </div>
                ) : (
                  groupByDate(messages).map(({ date, msgs }) => (
                    <div key={date} className="space-y-3">
                      {/* Date separator */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2">
                          {date}
                        </span>
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                      </div>

                      {/* Messages in group */}
                      {msgs.map((msg) => {
                        return (
                          <div
                            key={msg.id}
                            className={`flex items-end gap-2.5 ${
                              msg.role === "assistant" ? "flex-row"
                              : msg.role === "owner" ? "flex-row-reverse"
                              : "flex-row-reverse"
                            }`}
                          >
                            {/* Avatar icon */}
                            <div
                              className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mb-0.5 ${
                                msg.role === "assistant"
                                  ? "bg-gradient-to-tr from-violet-500 to-purple-600 text-white"
                                  : msg.role === "owner"
                                  ? "bg-gradient-to-tr from-orange-400 to-amber-500 text-white"
                                  : "bg-gradient-to-tr from-green-400 to-emerald-500 text-white"
                              }`}
                            >
                              {msg.role === "assistant" ? (
                                <Bot className="h-3.5 w-3.5" />
                              ) : msg.role === "owner" ? (
                                <Crown className="h-3.5 w-3.5" />
                              ) : (
                                <User className="h-3.5 w-3.5" />
                              )}
                            </div>

                            {/* Bubble */}
                            <div className={`max-w-[70%] space-y-1 ${
                              msg.role === "assistant" ? "items-start" : "items-end"
                            } flex flex-col`}>
                              <div
                                className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                                  msg.role === "assistant"
                                    ? "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-bl-sm border border-zinc-200 dark:border-zinc-700"
                                    : msg.role === "owner"
                                    ? "bg-gradient-to-tr from-orange-500 to-amber-500 text-white rounded-br-sm"
                                    : "bg-gradient-to-tr from-green-500 to-emerald-500 text-white rounded-br-sm"
                                }`}
                              >
                                {msg.message}
                              </div>
                              <div className={`flex items-center gap-1 ${
                                msg.role === "assistant" ? "pl-1" : "pr-1 flex-row-reverse"
                              }`}>
                                <Clock className="h-2.5 w-2.5 text-zinc-400" />
                                <span className="text-[10px] text-zinc-400">
                                  {formatMessageTime(msg.created_at)}
                                </span>
                                {msg.role === "owner" && (
                                  <span className="text-[10px] font-semibold text-orange-500">You</span>
                                )}
                                {msg.role === "user" && <CheckCheck className="h-2.5 w-2.5 text-green-400" />}
                                {msg.role === "assistant" && (
                                  <span className="text-[10px] font-semibold text-violet-500">AI</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Compose footer */}
              <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 py-3 space-y-2">
                {/* AI toggle strip */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Bot className="h-3.5 w-3.5 text-violet-500" />
                    <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                      AI auto-reply
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      aiPaused
                        ? "bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400"
                        : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {aiPaused ? "PAUSED" : "ACTIVE"}
                    </span>
                  </div>
                  <button
                    onClick={() => setAiPaused((p) => !p)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                      aiPaused
                        ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200"
                        : "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 hover:bg-orange-200"
                    }`}
                  >
                    {aiPaused ? (
                      <><PlayCircle className="h-3.5 w-3.5" /> Resume AI</>
                    ) : (
                      <><PauseCircle className="h-3.5 w-3.5" /> Pause AI</>
                    )}
                  </button>
                </div>

                {/* Send error */}
                {sendError && (
                  <p className="text-[11px] text-rose-500 px-1">{sendError}</p>
                )}

                {/* Input row */}
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={compose}
                      onChange={(e) => {
                        setCompose(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                      className="w-full resize-none rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-orange-400/40 transition-all overflow-hidden"
                      style={{ minHeight: "38px" }}
                    />
                  </div>
                  <button
                    onClick={sendManualMessage}
                    disabled={!compose.trim() || sending}
                    className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center shadow-md shadow-orange-500/20 hover:from-orange-600 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-zinc-400 px-1">
                  💬 Sending as <span className="font-semibold text-orange-500">You (Owner)</span> · AI toggle is visual only — connect your webhook logic to check a paused flag if needed
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
