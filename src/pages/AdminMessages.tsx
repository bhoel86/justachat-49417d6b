/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { restSelect, restDelete, restInvokeFunction } from "@/lib/supabaseRest";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageSquareLock, RefreshCw, Search, Trash2, Clock, User, ArrowRight, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface PrivateMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  encrypted_content: string;
  iv: string;
  created_at: string;
  sender_username?: string;
  recipient_username?: string;
}

const AdminMessages = () => {
  const { user, session, loading, isOwner, isAdmin } = useAuth();
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});
  const [decryptingId, setDecryptingId] = useState<string | null>(null);
  const [bulkDecrypting, setBulkDecrypting] = useState(false);
  const token = session?.access_token;

  const fetchData = async () => {
    try {
      const messageData = await restSelect<any>('private_messages', 'select=*&order=created_at.desc&limit=200', token);

      const userIds = [...new Set([
        ...messageData.map((m: any) => m.sender_id),
        ...messageData.map((m: any) => m.recipient_id)
      ])];
      
      const profiles = userIds.length > 0
        ? await restSelect<any>('profiles', `select=user_id,username&user_id=in.(${userIds.join(',')})`, token)
        : [];

      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p.username]));

      const messagesWithDetails = messageData.map((msg: any) => ({
        ...msg,
        sender_username: profileMap.get(msg.sender_id) || 'Unknown',
        recipient_username: profileMap.get(msg.recipient_id) || 'Unknown',
      }));

      setMessages(messagesWithDetails);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load private messages');
    } finally {
      setMessagesLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOwner || isAdmin) fetchData();
  }, [isOwner, isAdmin]);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const ok = await restDelete('private_messages', `id=eq.${messageId}`, token);
      if (!ok) throw new Error('Delete failed');
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setDecryptedMessages(prev => { const n = { ...prev }; delete n[messageId]; return n; });
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleDecrypt = async (message: PrivateMessage) => {
    if (decryptedMessages[message.id]) {
      setDecryptedMessages(prev => { const n = { ...prev }; delete n[message.id]; return n; });
      return;
    }

    setDecryptingId(message.id);
    try {
      const data = await restInvokeFunction<any>('decrypt-pm', {
        messageId: message.id,
        encrypted_content: message.encrypted_content,
        iv: message.iv
      }, token);

      if (data?.decrypted_content) {
        setDecryptedMessages(prev => ({ ...prev, [message.id]: data.decrypted_content }));
        toast.success('Message decrypted');
      } else {
        throw new Error('No decrypted content returned');
      }
    } catch (error) {
      console.error('Decryption error:', error);
      toast.error('Failed to decrypt message. Check master key configuration.');
    } finally {
      setDecryptingId(null);
    }
  };

  const handleBulkDecrypt = async () => {
    const undecrypted = filteredMessages.filter(m => !decryptedMessages[m.id]);
    if (undecrypted.length === 0) { toast.info('All visible messages are already decrypted'); return; }

    setBulkDecrypting(true);
    let success = 0, fail = 0;

    for (const msg of undecrypted) {
      try {
        const data = await restInvokeFunction<any>('decrypt-pm', {
          messageId: msg.id, encrypted_content: msg.encrypted_content, iv: msg.iv
        }, token);
        if (data?.decrypted_content) {
          setDecryptedMessages(prev => ({ ...prev, [msg.id]: data.decrypted_content }));
          success++;
        } else { fail++; }
      } catch { fail++; }
    }

    setBulkDecrypting(false);
    if (fail === 0) toast.success(`Decrypted ${success} messages`);
    else toast.warning(`Decrypted ${success}, failed ${fail}`);
  };

  const handleHideAll = () => { setDecryptedMessages({}); toast.success('All decrypted content hidden'); };

  const filteredMessages = messages.filter(m => {
    if (searchQuery === "") return true;
    return m.sender_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.recipient_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.encrypted_content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const uniqueConversations = new Set(messages.map(m => [m.sender_id, m.recipient_id].sort().join('-')));

  if (loading) return (<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-primary">Loading...</div></div>);
  if (!user) return <Navigate to="/login" replace />;
  if (!isOwner && !isAdmin) return <Navigate to="/lobby" replace />;

  return (
    <AdminSidebar>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquareLock className="h-6 w-6 text-primary" />Private Message Monitor</h1>
            <p className="text-sm text-muted-foreground">View encrypted private messages for moderation</p>
          </div>
          <div className="flex gap-2">
            {Object.keys(decryptedMessages).length > 0 && (
              <Button variant="outline" size="sm" onClick={handleHideAll}><EyeOff className="h-4 w-4 mr-2" />Hide All</Button>
            )}
            <Button variant="secondary" size="sm" onClick={handleBulkDecrypt} disabled={bulkDecrypting || filteredMessages.length === 0}>
              {bulkDecrypting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              {bulkDecrypting ? 'Decrypting...' : 'Decrypt All'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-primary">{messages.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Conversations</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-blue-400">{uniqueConversations.size}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Filtered Results</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-muted-foreground">{filteredMessages.length}</div></CardContent></Card>
        </div>

        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="py-3 flex items-center gap-3">
            <Lock className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-500">Messages are stored with AES-256 encryption. Click the eye icon to decrypt. All decryption actions are logged.</p>
          </CardContent>
        </Card>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by username..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        <Card>
          <CardHeader><CardTitle>Private Messages</CardTitle></CardHeader>
          <CardContent>
            {messagesLoading ? (
              <div className="flex items-center justify-center py-8"><div className="animate-pulse text-muted-foreground">Loading messages...</div></div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><MessageSquareLock className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No private messages found</p></div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {filteredMessages.map((msg) => (
                    <div key={msg.id} className="p-4 rounded-lg border bg-card hover:bg-secondary/30 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs"><User className="h-3 w-3 mr-1" />{msg.sender_username}</Badge>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline" className="text-xs"><User className="h-3 w-3 mr-1" />{msg.recipient_username}</Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(msg.created_at), 'MMM d, HH:mm:ss')}</span>
                          </div>
                          {decryptedMessages[msg.id] ? (
                            <div className="mt-2 p-3 rounded bg-green-500/10 border border-green-500/30">
                              <div className="flex items-center gap-2 mb-1"><Eye className="h-3 w-3 text-green-500" /><span className="text-xs text-green-500 font-medium">Decrypted Content</span></div>
                              <p className="text-sm text-foreground break-words">{decryptedMessages[msg.id]}</p>
                            </div>
                          ) : (
                            <div className="mt-2 p-2 rounded bg-muted/50 border border-border">
                              <div className="flex items-center gap-2 mb-1"><Lock className="h-3 w-3 text-amber-500" /><span className="text-xs text-amber-500 font-medium">Encrypted Content</span></div>
                              <p className="text-xs text-muted-foreground font-mono break-all">{msg.encrypted_content.substring(0, 100)}...</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => handleDecrypt(msg)} disabled={decryptingId === msg.id} className="text-primary hover:text-primary hover:bg-primary/10">
                            {decryptingId === msg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : decryptedMessages[msg.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteMessage(msg.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminSidebar>
  );
};

export default AdminMessages;
