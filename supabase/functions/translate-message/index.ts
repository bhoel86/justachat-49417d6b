import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, targetLanguage, detectOnly } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Translation service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Language code to name mapping
    const languageNames: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      ar: 'Arabic',
      hi: 'Hindi',
      nl: 'Dutch',
      pl: 'Polish',
      tr: 'Turkish',
      vi: 'Vietnamese',
      th: 'Thai',
      sv: 'Swedish',
      da: 'Danish',
      fi: 'Finnish',
      no: 'Norwegian',
      cs: 'Czech',
      el: 'Greek',
      he: 'Hebrew',
      id: 'Indonesian',
      ms: 'Malay',
      ro: 'Romanian',
      uk: 'Ukrainian',
      hu: 'Hungarian',
      bg: 'Bulgarian',
    };

    // Language name to code mapping (reverse)
    const languageCodes: Record<string, string> = Object.fromEntries(
      Object.entries(languageNames).map(([code, name]) => [name.toLowerCase(), code])
    );

    // If detectOnly mode, just detect the language
    if (detectOnly) {
      const detectResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            {
              role: 'system',
              content: `Detect the language of the given text. Respond with ONLY the language name in English (e.g., "English", "Spanish", "French", "German", "Japanese", "Chinese", "Korean", "Russian", "Arabic", "Hindi", etc.). If unsure or mixed, respond with the primary language. For very short text or symbols only, respond "Unknown".`
            },
            {
              role: 'user',
              content: text
            }
          ],
          max_tokens: 20,
          temperature: 0,
        }),
      });

      if (!detectResponse.ok) {
        return new Response(
          JSON.stringify({ detectedLanguage: 'en', detectedLanguageName: 'Unknown' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const detectData = await detectResponse.json();
      const detectedName = detectData.choices?.[0]?.message?.content?.trim() || 'Unknown';
      const detectedCode = languageCodes[detectedName.toLowerCase()] || 'en';

      console.log(`Detected language: ${detectedName} (${detectedCode}) for: "${text.substring(0, 30)}..."`);

      return new Response(
        JSON.stringify({ 
          detectedLanguage: detectedCode, 
          detectedLanguageName: detectedName 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Translation mode
    if (!targetLanguage) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: targetLanguage for translation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetLangName = languageNames[targetLanguage] || targetLanguage;

    // Use tool calling to get structured output with both translation and detected language
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `You are a translator. First detect the source language, then translate to ${targetLangName}.
Rules:
- Preserve ASCII art, emojis, special symbols, and formatting exactly as-is
- Only translate the actual text content
- Keep usernames, URLs, and technical terms unchanged
- If the text is already in the target language, return it unchanged
- Preserve any special characters like ★ ♦ ♠ ░ █ etc.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "translate_text",
              description: "Translate text and report the detected source language",
              parameters: {
                type: "object",
                properties: {
                  translated_text: { 
                    type: "string",
                    description: "The translated text"
                  },
                  source_language: { 
                    type: "string",
                    description: "The detected source language name (e.g., English, Spanish, French)"
                  }
                },
                required: ["translated_text", "source_language"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "translate_text" } },
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Translation credits exhausted' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Translation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Parse tool call response
    let translatedText = text;
    let detectedLanguage = 'en';
    let detectedLanguageName = 'English';

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        translatedText = args.translated_text || text;
        detectedLanguageName = args.source_language || 'English';
        detectedLanguage = languageCodes[detectedLanguageName.toLowerCase()] || 'en';
      } catch (e) {
        console.error('Failed to parse tool response:', e);
        // Fallback to content if tool parsing fails
        translatedText = data.choices?.[0]?.message?.content?.trim() || text;
      }
    } else if (data.choices?.[0]?.message?.content) {
      // Fallback if no tool call
      translatedText = data.choices[0].message.content.trim();
    }

    console.log(`Translated (${detectedLanguageName} -> ${targetLangName}): "${text.substring(0, 30)}..." -> "${translatedText.substring(0, 30)}..."`);

    return new Response(
      JSON.stringify({ 
        translatedText,
        detectedLanguage,
        detectedLanguageName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
