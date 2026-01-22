import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Plug, PlugZap, Trash2 } from "lucide-react";

interface IRCMessage {
  id: string;
  type: "sent" | "received" | "system" | "error";
  content: string;
  timestamp: Date;
}

const IRCTestClient = () => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [messages, setMessages] = useState<IRCMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("TestUser");
  
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const projectId = "hliytlezggzryetekpvo";
  const wsUrl = `wss://${projectId}.supabase.co/functions/v1/irc-gateway`;

  const addMessage = useCallback((type: IRCMessage["type"], content: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      type,
      content,
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const connect = () => {
    if (!email || !password) {
      addMessage("error", "Please enter email and password");
      return;
    }

    setConnecting(true);
    addMessage("system", `Connecting to ${wsUrl}...`);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        addMessage("system", "WebSocket connected! Authenticating...");
        
        // Send PASS command for authentication
        ws.send(`PASS ${email}:${password}`);
        ws.send(`NICK ${nickname}`);
        ws.send(`USER ${nickname} 0 * :Test Client`);
      };

      ws.onmessage = (event) => {
        const lines = event.data.split("\r\n").filter((l: string) => l.trim());
        lines.forEach((line: string) => {
          addMessage("received", line);
          
          // Check for successful registration
          if (line.includes("001")) {
            setConnected(true);
            setConnecting(false);
          }
          
          // Check for auth failure
          if (line.includes("464") || line.includes("Password incorrect")) {
            addMessage("error", "Authentication failed - check your credentials");
            setConnecting(false);
          }
        });
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        addMessage("error", "WebSocket error occurred");
        setConnecting(false);
      };

      ws.onclose = () => {
        addMessage("system", "Connection closed");
        setConnected(false);
        setConnecting(false);
        wsRef.current = null;
      };
    } catch (error) {
      addMessage("error", `Failed to connect: ${error}`);
      setConnecting(false);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.send("QUIT :Leaving");
      wsRef.current.close();
    }
  };

  const sendCommand = () => {
    if (!inputValue.trim() || !wsRef.current) return;

    const command = inputValue.trim();
    addMessage("sent", command);
    
    // Handle client-side command parsing
    if (command.startsWith("/")) {
      const parts = command.slice(1).split(" ");
      const cmd = parts[0].toUpperCase();
      const args = parts.slice(1).join(" ");
      
      switch (cmd) {
        case "JOIN":
          wsRef.current.send(`JOIN ${args}`);
          break;
        case "PART":
          wsRef.current.send(`PART ${args}`);
          break;
        case "MSG":
        case "PRIVMSG":
          const [target, ...msgParts] = args.split(" ");
          wsRef.current.send(`PRIVMSG ${target} :${msgParts.join(" ")}`);
          break;
        case "LIST":
          wsRef.current.send("LIST");
          break;
        case "WHOIS":
          wsRef.current.send(`WHOIS ${args}`);
          break;
        case "NICK":
          wsRef.current.send(`NICK ${args}`);
          break;
        case "QUIT":
          disconnect();
          break;
        default:
          wsRef.current.send(`${cmd} ${args}`);
      }
    } else {
      // Raw command
      wsRef.current.send(command);
    }

    setInputValue("");
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const getMessageColor = (type: IRCMessage["type"]) => {
    switch (type) {
      case "sent": return "text-primary";
      case "received": return "text-foreground";
      case "system": return "text-muted-foreground";
      case "error": return "text-destructive";
    }
  };

  const getMessagePrefix = (type: IRCMessage["type"]) => {
    switch (type) {
      case "sent": return "→";
      case "received": return "←";
      case "system": return "●";
      case "error": return "✖";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {connected ? (
              <PlugZap className="h-5 w-5 text-green-500" />
            ) : (
              <Plug className="h-5 w-5 text-muted-foreground" />
            )}
            IRC Test Client
            {connected && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                Connected
              </Badge>
            )}
            {connecting && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                Connecting...
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={clearMessages}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Form */}
        {!connected && (
          <div className="grid gap-3 p-4 bg-secondary/30 rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={connecting}
              />
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={connecting}
              />
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="Nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={connecting}
                className="flex-1"
              />
              <Button onClick={connect} disabled={connecting}>
                {connecting ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="h-[300px] border rounded-lg bg-background">
          <div ref={scrollRef} className="p-3 font-mono text-sm space-y-1">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Enter your credentials and connect to start testing
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`${getMessageColor(msg.type)} break-all`}>
                  <span className="text-muted-foreground text-xs mr-2">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="mr-2">{getMessagePrefix(msg.type)}</span>
                  {msg.content}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Command Input */}
        {connected && (
          <div className="flex gap-2">
            <Input
              placeholder="Enter command (e.g., /join #general, /list, /msg user hello)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendCommand()}
              className="font-mono"
            />
            <Button onClick={sendCommand}>
              <Send className="h-4 w-4" />
            </Button>
            <Button variant="destructive" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        )}

        {/* Quick Commands */}
        {connected && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => { setInputValue("/list"); }}>
              /list
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setInputValue("/join #general"); }}>
              /join #general
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setInputValue("/whois "); }}>
              /whois
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IRCTestClient;
