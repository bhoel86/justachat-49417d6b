import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Keywords and patterns that indicate potential illegal activity
const ILLEGAL_PATTERNS = [
  // Drug-related
  /\b(meth|heroin|cocaine|fentanyl|oxycodone|xanax|pills|drugs|deal|dealer|plug|score|cop|weight|oz|gram|g|kg|ounce|pound|lb|brick)\b/gi,
  // Weapons
  /\b(gun|pistol|firearm|rifle|automatic|illegal weapon|untraceable|ghost gun|suppressor|silencer)\b/gi,
  // CSAM indicators
  /\b(cp|underage|minor|jailbait|child porn|pedo|preteen)\b/gi,
  // Human trafficking
  /\b(traffick|escort|prostitut|pimp|sex work|massage parlor|happy ending)\b/gi,
  // Violence
  /\b(kill|murder|hit|contract|assassination|bomb|explosive|terror)\b/gi,
  // Financial crimes
  /\b(launder|money mule|fraud|scam|steal identity|credit card|cvv|fullz|dumps)\b/gi,
  // Hacking services
  /\b(hack for hire|ddos|botnet|ransomware|malware|exploit kit)\b/gi,
];

// Law enforcement detection patterns
const LAW_ENFORCEMENT_PATTERNS = [
  // LE identification
  /\b(fbi|dea|atf|ice|homeland|federal agent|police|cop|detective|investigat|surveillance|warrant|subpoena)\b/gi,
  // Honeypot indicators
  /\b(confidential informant|ci|undercover|sting|entrap|wire|body cam)\b/gi,
  // Legal process
  /\b(grand jury|indictment|arrest|prosecut|district attorney|court order)\b/gi,
  // Surveillance tech
  /\b(stingray|imsi catcher|wiretap|pen register|trap and trace)\b/gi,
];

// Suspicious behavioral patterns
const SUSPICIOUS_PATTERNS = [
  // Meeting arrangements
  /\b(meet up|in person|drop|pick up|location|address|come through)\b/gi,
  // Payment methods
  /\b(bitcoin|btc|crypto|monero|xmr|cash app|venmo|zelle|western union|wire transfer)\b/gi,
  // Evasion tactics
  /\b(burner|vpn|tor|encrypt|delete after|burn after reading|no logs|anonymous)\b/gi,
  // Quantity discussions
  /\b(bulk|wholesale|quantity|discount|resell|flip)\b/gi,
];

interface MonitorPayload {
  content: string;
  senderId: string;
  senderName: string;
  targetUserId: string;
  targetUsername: string;
  sessionId: string;
}

interface Alert {
  type: 'illegal' | 'law_enforcement' | 'suspicious';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  matches: string[];
  message: string;
  timestamp: string;
  sessionId: string;
  participants: {
    sender: { id: string; name: string };
    target: { id: string; name: string };
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: MonitorPayload = await req.json();
    const { content, senderId, senderName, targetUserId, targetUsername, sessionId } = payload;

    if (!content) {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const alerts: Alert[] = [];
    const contentLower = content.toLowerCase();

    // Check for illegal activity
    for (const pattern of ILLEGAL_PATTERNS) {
      const matches = contentLower.match(pattern);
      if (matches && matches.length > 0) {
        alerts.push({
          type: 'illegal',
          severity: 'critical',
          category: 'Potential illegal activity detected',
          matches: [...new Set(matches)],
          message: content,
          timestamp: new Date().toISOString(),
          sessionId,
          participants: {
            sender: { id: senderId, name: senderName },
            target: { id: targetUserId, name: targetUsername }
          }
        });
        break;
      }
    }

    // Check for law enforcement indicators
    for (const pattern of LAW_ENFORCEMENT_PATTERNS) {
      const matches = contentLower.match(pattern);
      if (matches && matches.length > 0) {
        alerts.push({
          type: 'law_enforcement',
          severity: 'high',
          category: 'Potential law enforcement activity',
          matches: [...new Set(matches)],
          message: content,
          timestamp: new Date().toISOString(),
          sessionId,
          participants: {
            sender: { id: senderId, name: senderName },
            target: { id: targetUserId, name: targetUsername }
          }
        });
        break;
      }
    }

    // Check for suspicious patterns
    let suspiciousCount = 0;
    const suspiciousMatches: string[] = [];
    for (const pattern of SUSPICIOUS_PATTERNS) {
      const matches = contentLower.match(pattern);
      if (matches) {
        suspiciousCount++;
        suspiciousMatches.push(...matches);
      }
    }

    // Multiple suspicious patterns = elevated concern
    if (suspiciousCount >= 2) {
      alerts.push({
        type: 'suspicious',
        severity: suspiciousCount >= 3 ? 'high' : 'medium',
        category: 'Suspicious communication patterns',
        matches: [...new Set(suspiciousMatches)],
        message: content,
        timestamp: new Date().toISOString(),
        sessionId,
        participants: {
          sender: { id: senderId, name: senderName },
          target: { id: targetUserId, name: targetUsername }
        }
      });
    }

    // If alerts detected, send to AI for analysis and log
    if (alerts.length > 0) {
      // Environment-aware AI: Use Lovable gateway on Cloud, OpenAI on VPS
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      const AI_API_KEY = OPENAI_API_KEY; // VPS uses OpenAI directly
      const AI_ENDPOINT = OPENAI_API_KEY 
        ? 'https://api.openai.com/v1/chat/completions'
        : null;
      const AI_MODEL = 'gpt-4o-mini';
      
      if (AI_API_KEY && AI_ENDPOINT) {
        // Use AI to analyze the context
        const response = await fetch(AI_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: AI_MODEL,
            messages: [
              {
                role: 'system',
                content: `You are a content safety analyzer. Analyze the following message for potential illegal activity, law enforcement involvement, or concerning patterns. 
                
Provide a brief JSON analysis with:
- threat_level: "none" | "low" | "medium" | "high" | "critical"
- categories: array of concern categories
- action_required: boolean
- summary: brief explanation (max 50 words)
- is_likely_false_positive: boolean

Be accurate but cautious. Context matters - casual use of flagged words in innocent contexts should be marked as false positives.`
              },
              {
                role: 'user',
                content: `Message: "${content}"\n\nInitial flags: ${JSON.stringify(alerts.map(a => ({ type: a.type, matches: a.matches })))}`
              }
            ],
            max_tokens: 300,
            temperature: 0.1,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiAnalysis = data.choices?.[0]?.message?.content || '';
          
          // Log the alert with AI analysis
          console.log('🚨 PM MONITOR ALERT 🚨');
          console.log('='.repeat(50));
          console.log('Session:', sessionId);
          console.log('From:', senderName, `(${senderId})`);
          console.log('To:', targetUsername, `(${targetUserId})`);
          console.log('Message:', content);
          console.log('Alerts:', JSON.stringify(alerts, null, 2));
          console.log('AI Analysis:', aiAnalysis);
          console.log('='.repeat(50));

          // Try to parse AI response
          try {
            const analysisMatch = aiAnalysis.match(/\{[\s\S]*\}/);
            if (analysisMatch) {
              const analysis = JSON.parse(analysisMatch[0]);
              
              // Only return alert status if it's not a false positive
              if (!analysis.is_likely_false_positive && analysis.action_required) {
                return new Response(JSON.stringify({ 
                  status: 'alert',
                  analysis 
                }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
              }
            }
          } catch {
            // If parsing fails, still log but continue
          }
        }
      } else {
        // No AI key, just log the raw alerts
        console.log('🚨 PM MONITOR ALERT (no AI) 🚨');
        console.log(JSON.stringify(alerts, null, 2));
      }
    }

    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('PM Monitor error:', error);
    return new Response(JSON.stringify({ error: 'Monitor error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
