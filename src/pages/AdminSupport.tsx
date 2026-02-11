/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  RefreshCw,
  Send,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  Bell,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface SupportTicket {
  id: string;
  user_id: string;
  username: string;
  category: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_username: string;
  content: string;
  is_admin: boolean;
  created_at: string;
}

interface UserProfile {
  username: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  connection: "Connection Issues",
  report: "Report",
  verification: "Verification",
  room: "Room Ownership",
  other: "Other",
};

const AdminSupport = () => {
  const { user, loading, isOwner, isAdmin, isModerator } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newTicketAlert, setNewTicketAlert] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch user profile
  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load support tickets");
    } finally {
      setTicketsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (isOwner || isAdmin || isModerator) {
      fetchTickets();
    }
  }, [isOwner, isAdmin, isModerator]);

  // Subscribe to new tickets
  useEffect(() => {
    if (!isOwner && !isAdmin && !isModerator) return;

    const channel = supabase
      .channel("admin-support-tickets")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_tickets",
        },
        (payload) => {
          const newTicket = payload.new as SupportTicket;
          setTickets((prev) => [newTicket, ...prev]);
          setNewTicketAlert(true);
          toast.info(`New support ticket from ${newTicket.username}`, {
            description: newTicket.subject,
            duration: 10000,
          });
          // Play notification sound
          try {
            const audio = new Audio("/notification.mp3");
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch {}
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "support_tickets",
        },
        (payload) => {
          const updated = payload.new as SupportTicket;
          setTickets((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t))
          );
          if (selectedTicket?.id === updated.id) {
            setSelectedTicket(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOwner, isAdmin, isModerator, selectedTicket?.id]);

  // Subscribe to messages for selected ticket
  useEffect(() => {
    if (!selectedTicket) return;

    const channel = supabase
      .channel(`admin-messages-${selectedTicket.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${selectedTicket.id}`,
        },
        (payload) => {
          const newMsg = payload.new as SupportMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket?.id]);

  // Fetch messages for selected ticket
  const fetchMessages = async (ticketId: string) => {
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setNewTicketAlert(false);
    fetchMessages(ticket.id);
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedTicket || !user || !profile) return;

    const content = reply.trim();
    setReply("");
    setSending(true);

    try {
      const { error } = await supabase.from("support_messages").insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        sender_username: profile.username,
        content,
        is_admin: true,
      });

      if (error) throw error;

      // Update ticket timestamp
      await supabase
        .from("support_tickets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedTicket.id);
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
      setReply(content);
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    try {
      await supabase
        .from("support_tickets")
        .update({ status: "closed", updated_at: new Date().toISOString() })
        .eq("id", selectedTicket.id);

      toast.success("Ticket closed");
    } catch (error) {
      toast.error("Failed to close ticket");
    }
  };

  const handleReopenTicket = async () => {
    if (!selectedTicket) return;

    try {
      await supabase
        .from("support_tickets")
        .update({ status: "open", updated_at: new Date().toISOString() })
        .eq("id", selectedTicket.id);

      toast.success("Ticket reopened");
    } catch (error) {
      toast.error("Failed to reopen ticket");
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isOwner && !isAdmin && !isModerator) {
    return <Navigate to="/lobby" replace />;
  }

  const openTickets = tickets.filter((t) => t.status === "open");
  const closedTickets = tickets.filter((t) => t.status === "closed");

  return (
    <AdminSidebar>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Support Tickets
              {newTicketAlert && (
                <Bell className="h-5 w-5 text-amber-500 animate-pulse" />
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              Respond to user support requests
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">
                {openTickets.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Closed Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {
                  closedTickets.filter(
                    (t) =>
                      new Date(t.updated_at).toDateString() ===
                      new Date().toDateString()
                  ).length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">
                {tickets.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Ticket List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Tickets</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ticketsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No support tickets</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="divide-y divide-border">
                    {tickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => handleSelectTicket(ticket)}
                        className={`w-full p-4 text-left hover:bg-secondary/50 transition-colors ${
                          selectedTicket?.id === ticket.id
                            ? "bg-secondary"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-medium truncate">
                                {ticket.username}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {ticket.subject}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant={
                                  ticket.status === "open"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {ticket.status === "open" ? (
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                {ticket.status}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {CATEGORY_LABELS[ticket.category] ||
                                  ticket.category}
                              </Badge>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(ticket.created_at), "MMM d")}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Chat View */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 border-b border-border">
              {selectedTicket ? (
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {selectedTicket.username}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedTicket.subject}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedTicket.status === "open" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCloseTicket}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Close
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReopenTicket}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <CardTitle className="text-lg text-muted-foreground">
                  Select a ticket to view
                </CardTitle>
              )}
            </CardHeader>
            <CardContent className="p-4">
              {selectedTicket ? (
                <div className="space-y-4">
                  {/* Messages */}
                  <ScrollArea className="h-[350px] border rounded-lg bg-muted/20 p-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <p>No messages yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.is_admin ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                                msg.is_admin
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium">
                                  {msg.is_admin
                                    ? msg.sender_username
                                    : selectedTicket.username}
                                </span>
                                <span className="text-xs opacity-70">
                                  {format(new Date(msg.created_at), "HH:mm")}
                                </span>
                              </div>
                              <p className="text-sm break-words">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Reply Input */}
                  {selectedTicket.status === "open" && (
                    <div className="flex gap-2">
                      <Input
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type your reply..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply();
                          }
                        }}
                        disabled={sending}
                      />
                      <Button
                        onClick={handleSendReply}
                        disabled={!reply.trim() || sending}
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}

                  {selectedTicket.status === "closed" && (
                    <div className="text-center py-2 text-muted-foreground text-sm">
                      This ticket is closed. Reopen to send messages.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a ticket from the list to view the conversation</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminSidebar>
  );
};

export default AdminSupport;
