/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MessageSquare,
  Send,
  HelpCircle,
  Wifi,
  Flag,
  UserCheck,
  Home,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import SiteFooter from "@/components/layout/SiteFooter";

interface SupportTicket {
  id: string;
  user_id: string;
  username: string;
  category: string;
  subject: string;
  status: string;
  created_at: string;
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

const CATEGORIES = [
  { value: "connection", label: "Connection Issues", icon: Wifi },
  { value: "report", label: "Report a User", icon: Flag },
  { value: "verification", label: "Name Registration & Verification", icon: UserCheck },
  { value: "room", label: "Room Ownership Request", icon: Home },
  { value: "other", label: "Other Questions", icon: HelpCircle },
];

const FAQ_DATA = {
  connection: [
    {
      question: "Why can't I connect to the chat?",
      answer: "First, check your internet connection. If that's working, try refreshing the page or clearing your browser cache. If you're using a VPN, try disabling it temporarily as some VPNs may be blocked.",
    },
    {
      question: "Why do my messages not send?",
      answer: "This usually happens if you've been muted or if there's a connection issue. Check if you see any error messages. If you're muted, you'll see a notification. Otherwise, try refreshing the page.",
    },
    {
      question: "Why am I getting kicked from rooms?",
      answer: "You may have been kicked by a room moderator for violating room rules. Check the community guidelines and make sure you're following them. If you believe this was a mistake, use this help page to contact an admin.",
    },
    {
      question: "The page keeps loading or shows errors",
      answer: "Try these steps: 1) Clear your browser cache, 2) Disable browser extensions, 3) Try a different browser, 4) Check if your firewall is blocking the connection.",
    },
  ],
  report: [
    {
      question: "How do I report a user?",
      answer: "Click on the user's username or avatar to open their profile, then click the 'Report' button. Select the reason and provide details about the violation.",
    },
    {
      question: "What happens after I report someone?",
      answer: "Our moderation team reviews all reports within 24 hours. Depending on the severity, the user may receive a warning, mute, or ban. We don't share the outcome for privacy reasons.",
    },
    {
      question: "Can I report harassment in private messages?",
      answer: "Yes! If someone is harassing you in PMs, report them immediately. You can also block them by clicking their profile and selecting 'Block User'.",
    },
  ],
  verification: [
    {
      question: "How do I register my nickname?",
      answer: "Your nickname is automatically registered when you create an account. This prevents others from using your name. You can verify this in your profile settings.",
    },
    {
      question: "How does parental consent verification work?",
      answer: "If you're under 18, a parent/guardian must verify your account via the email sent during registration. Until verified, some features like private messaging are restricted.",
    },
    {
      question: "Can I change my username?",
      answer: "Yes! Go to your profile settings and click 'Change Username'. Note that your old username will become available for others after the change.",
    },
    {
      question: "Why is my account restricted?",
      answer: "Minor accounts require parental consent for full access. If consent hasn't been verified, you'll have limited access to certain features for your safety.",
    },
  ],
  room: [
    {
      question: "How do I create my own room?",
      answer: "Type /join #roomname in any chat to create a new room. You'll automatically become the room owner with full moderation powers.",
    },
    {
      question: "How do I become a room moderator?",
      answer: "Room owners can grant you moderator status using the /op command. Contact the room owner if you'd like to help moderate.",
    },
    {
      question: "Can I transfer room ownership?",
      answer: "Currently, room ownership can only be transferred by admins. Use the chat below to request a transfer.",
    },
    {
      question: "How do I set a room password?",
      answer: "As a room owner, click the settings gear icon in the chat header, then go to 'Room Settings' to set or change the password.",
    },
  ],
  other: [
    {
      question: "How do I use text formatting?",
      answer: "Use *text* for bold, _text_ for italics, and ~text~ for strikethrough. You can also use the format menu above the chat input.",
    },
    {
      question: "How do I send images or GIFs?",
      answer: "Click the emoji button and switch to the GIF tab, or use the image upload button to share photos from your device.",
    },
    {
      question: "Are my private messages secure?",
      answer: "Yes! All private messages are encrypted using AES-256 encryption. Only you and the recipient can read them.",
    },
    {
      question: "How do I add friends?",
      answer: "Click on a user's profile and select 'Add Friend'. They'll receive a friend request which they can accept or decline.",
    },
  ],
};

const Help = () => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
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

  // Check for existing open ticket
  useEffect(() => {
    if (user) {
      fetchActiveTicket();
    }
  }, [user]);

  // Subscribe to new messages
  useEffect(() => {
    if (!activeTicket) return;

    const channel = supabase
      .channel(`support-${activeTicket.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${activeTicket.id}`,
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
  }, [activeTicket?.id]);

  const fetchActiveTicket = async () => {
    const { data: tickets } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user?.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1);

    if (tickets && tickets.length > 0) {
      setActiveTicket(tickets[0]);
      setCategory(tickets[0].category);
      fetchMessages(tickets[0].id);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
    }
    setLoadingMessages(false);
  };

  const handleStartChat = async () => {
    if (!category || !subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!user || !profile) {
      toast.error("You must be logged in to contact support");
      return;
    }

    setSubmitting(true);
    try {
      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          username: profile.username,
          category,
          subject: subject.trim(),
          status: "open",
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Send first message
      const { error: msgError } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          sender_username: profile.username,
          content: message.trim(),
          is_admin: false,
        });

      if (msgError) throw msgError;

      setActiveTicket(ticket);
      setMessages([]);
      fetchMessages(ticket.id);
      setMessage("");
      toast.success("Support ticket created! An admin will respond shortly.");
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create support ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !activeTicket || !user || !profile) return;

    const content = message.trim();
    setMessage("");

    try {
      const { error } = await supabase.from("support_messages").insert({
        ticket_id: activeTicket.id,
        sender_id: user.id,
        sender_username: profile.username,
        content,
        is_admin: false,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setMessage(content);
    }
  };

  const handleCloseTicket = async () => {
    if (!activeTicket) return;

    try {
      await supabase
        .from("support_tickets")
        .update({ status: "closed", updated_at: new Date().toISOString() })
        .eq("id", activeTicket.id);

      setActiveTicket(null);
      setMessages([]);
      setCategory("");
      setSubject("");
      toast.success("Support ticket closed");
    } catch (error) {
      toast.error("Failed to close ticket");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentFaqs = category ? FAQ_DATA[category as keyof typeof FAQ_DATA] || [] : [];
  const CategoryIcon = CATEGORIES.find((c) => c.value === category)?.icon || HelpCircle;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="h-10 w-10 rounded-xl jac-gradient-bg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="brand jac-gradient-text font-bold text-2xl">
                Justachat<sup className="text-[8px] align-super">™</sup>
              </span>
            </button>
            <Badge variant="outline" className="text-primary border-primary">
              <HelpCircle className="w-3 h-3 mr-1" />
              Help Center
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title Section */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold jac-gradient-text">
              Need a hand?
            </h1>
            <p className="text-muted-foreground">
              We're here to help — not to sell you anything or collect your data.
            </p>
          </div>

          {/* Category Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`p-4 rounded-xl border transition-all text-center space-y-2 ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
                  }`}
                >
                  <Icon className="w-6 h-6 mx-auto" />
                  <span className="text-xs font-medium block">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* FAQ Section - Shows when category selected */}
          {category && currentFaqs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CategoryIcon className="w-5 h-5 text-primary" />
                  Common Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {currentFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`faq-${index}`}>
                      <AccordionTrigger className="text-left text-sm hover:text-primary">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Support Chat */}
          <Card className="border-primary/30">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  {activeTicket ? "Live Support Chat" : "Contact Support"}
                </div>
                {activeTicket && (
                  <Button variant="ghost" size="sm" onClick={handleCloseTicket}>
                    Close Ticket
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {!user ? (
                <div className="text-center py-8 space-y-4">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    You must be logged in to contact support
                  </p>
                  <Button onClick={() => navigate("/home")}>Sign In</Button>
                </div>
              ) : activeTicket ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{activeTicket.category}</Badge>
                    <span>•</span>
                    <span>{activeTicket.subject}</span>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="h-[300px] border rounded-lg bg-muted/20 p-4">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <p>Waiting for admin response...</p>
                        <p className="text-xs mt-1">
                          You'll be notified when an admin replies
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.is_admin ? "justify-start" : "justify-end"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                                msg.is_admin
                                  ? "bg-primary/20 text-foreground"
                                  : "bg-primary text-primary-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium">
                                  {msg.is_admin ? "Staff" : "You"}
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

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage} disabled={!message.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief subject (e.g., 'Can't send messages')"
                    maxLength={100}
                  />

                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    rows={4}
                    maxLength={1000}
                  />

                  <Button
                    onClick={handleStartChat}
                    disabled={submitting || !category || !subject.trim() || !message.trim()}
                    className="w-full"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting Chat...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Start Support Chat
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="bg-muted/30">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Before contacting support:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Check the FAQ section above for quick answers</li>
                    <li>• Try refreshing the page or clearing your browser cache</li>
                    <li>• Make sure you're using a supported browser (Chrome, Firefox, Safari)</li>
                    <li>• Disable any ad blockers or VPNs that might interfere</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Help;
