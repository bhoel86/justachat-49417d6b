import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ArtPiece {
  title: string
  artist: string
  year: string | null
  period: string | null
  medium: string | null
  image_url: string
  description: string | null
  source: string
  source_id: string
}

// Fetch art from Metropolitan Museum of Art API (free, no key needed)
async function fetchFromMetMuseum(): Promise<ArtPiece[]> {
  const pieces: ArtPiece[] = []
  
  try {
    // Get random highlighted artworks
    const searchResponse = await fetch(
      'https://collectionapi.metmuseum.org/public/collection/v1/search?isHighlight=true&hasImages=true&q=*'
    )
    const searchData = await searchResponse.json()
    
    if (!searchData.objectIDs || searchData.objectIDs.length === 0) {
      console.log('No objects found from Met Museum')
      return pieces
    }
    
    // Get 5 random artworks
    const randomIds = searchData.objectIDs
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
    
    for (const id of randomIds) {
      try {
        const objectResponse = await fetch(
          `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`
        )
        const obj = await objectResponse.json()
        
        if (obj.primaryImage && obj.title) {
          pieces.push({
            title: obj.title,
            artist: obj.artistDisplayName || 'Unknown Artist',
            year: obj.objectDate || null,
            period: obj.period || obj.culture || null,
            medium: obj.medium || null,
            image_url: obj.primaryImage,
            description: obj.objectName ? `${obj.objectName}. ${obj.creditLine || ''}` : null,
            source: 'met_museum',
            source_id: String(id)
          })
        }
      } catch (e) {
        console.error(`Error fetching Met object ${id}:`, e)
      }
    }
  } catch (e) {
    console.error('Error fetching from Met Museum:', e)
  }
  
  return pieces
}

// Fetch art from Art Institute of Chicago API (free, no key needed)
async function fetchFromArtInstituteChicago(): Promise<ArtPiece[]> {
  const pieces: ArtPiece[] = []
  
  try {
    // Get random artworks with images
    const page = Math.floor(Math.random() * 100) + 1
    const response = await fetch(
      `https://api.artic.edu/api/v1/artworks?page=${page}&limit=5&fields=id,title,artist_display,date_display,medium_display,image_id,thumbnail,place_of_origin,style_title`
    )
    const data = await response.json()
    
    if (data.data) {
      for (const item of data.data) {
        if (item.image_id) {
          pieces.push({
            title: item.title || 'Untitled',
            artist: item.artist_display || 'Unknown Artist',
            year: item.date_display || null,
            period: item.style_title || item.place_of_origin || null,
            medium: item.medium_display || null,
            image_url: `https://www.artic.edu/iiif/2/${item.image_id}/full/843,/0/default.jpg`,
            description: item.thumbnail?.alt_text || null,
            source: 'art_institute_chicago',
            source_id: String(item.id)
          })
        }
      }
    }
  } catch (e) {
    console.error('Error fetching from Art Institute Chicago:', e)
  }
  
  return pieces
}

// Generate AI commentary about the artwork
async function generateArtCommentary(piece: ArtPiece): Promise<string> {
  // Environment-aware: Use OpenAI on VPS
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
  
  if (!OPENAI_API_KEY) {
    // Fallback to template-based commentary
    return generateTemplateCommentary(piece)
  }
  
  try {
    const prompt = `You are Vincent, an enthusiastic art major and curator. You're presenting this artwork to a chat room. Be conversational, educational, and engaging. Keep your response to 2-3 sentences.

Artwork: "${piece.title}"
Artist: ${piece.artist}
Year: ${piece.year || 'Unknown'}
Period/Style: ${piece.period || 'Unknown'}
Medium: ${piece.medium || 'Unknown'}

Share an interesting observation or fact about this piece, its technique, historical context, or the artist. Ask a thought-provoking question to engage viewers.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      }),
    })
    
    if (!response.ok) {
      console.error('AI API error:', await response.text())
      return generateTemplateCommentary(piece)
    }
    
    const data = await response.json()
    return data.choices?.[0]?.message?.content || generateTemplateCommentary(piece)
  } catch (e) {
    console.error('Error generating AI commentary:', e)
    return generateTemplateCommentary(piece)
  }
}

function generateTemplateCommentary(piece: ArtPiece): string {
  const templates = [
    `🖼️ Today's featured piece: "${piece.title}" by ${piece.artist}${piece.year ? ` (${piece.year})` : ''}. ${piece.period ? `This ${piece.period} work` : 'This piece'} showcases remarkable craftsmanship. What emotions does it evoke for you?`,
    `🎨 Presenting "${piece.title}" by ${piece.artist}. ${piece.medium ? `Created using ${piece.medium}, ` : ''}this artwork invites us to pause and reflect. What draws your eye first?`,
    `✨ Behold "${piece.title}" by ${piece.artist}${piece.year ? `, ${piece.year}` : ''}. Every great work tells a story - what story do you see here?`,
    `🏛️ Featured artwork: "${piece.title}" (${piece.artist}). ${piece.period ? `A beautiful example of ${piece.period} art.` : 'A masterpiece worth discussing.'} What techniques stand out to you?`,
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { action } = await req.json()
    
    if (action === 'fetch_new_art') {
      // Fetch art from multiple sources
      const [metPieces, chicagoPieces] = await Promise.all([
        fetchFromMetMuseum(),
        fetchFromArtInstituteChicago()
      ])
      
      const allPieces = [...metPieces, ...chicagoPieces]
      console.log(`Fetched ${allPieces.length} art pieces`)
      
      // Insert new pieces (ignore duplicates)
      for (const piece of allPieces) {
        await supabase
          .from('art_pieces')
          .upsert({
            title: piece.title,
            artist: piece.artist,
            year: piece.year,
            period: piece.period,
            medium: piece.medium,
            image_url: piece.image_url,
            description: piece.description,
            source: piece.source,
            source_id: piece.source_id
          }, { onConflict: 'source,source_id' })
      }
      
      return new Response(
        JSON.stringify({ success: true, count: allPieces.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (action === 'get_featured_art') {
      // Get a random piece that hasn't been discussed recently
      const { data: pieces, error } = await supabase
        .from('art_pieces')
        .select('*')
        .order('discussed_at', { ascending: true, nullsFirst: true })
        .limit(10)
      
      if (error || !pieces || pieces.length === 0) {
        // If no art in database, fetch some first
        console.log('No art in database, fetching...')
        const metPieces = await fetchFromMetMuseum()
        const chicagoPieces = await fetchFromArtInstituteChicago()
        const allPieces = [...metPieces, ...chicagoPieces]
        
        if (allPieces.length === 0) {
          return new Response(
            JSON.stringify({ error: 'No art available' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // Insert and use the first piece
        const piece = allPieces[0]
        await supabase.from('art_pieces').upsert({
          title: piece.title,
          artist: piece.artist,
          year: piece.year,
          period: piece.period,
          medium: piece.medium,
          image_url: piece.image_url,
          description: piece.description,
          source: piece.source,
          source_id: piece.source_id
        }, { onConflict: 'source,source_id' })
        
        const commentary = await generateArtCommentary(piece)
        
        return new Response(
          JSON.stringify({ 
            piece,
            commentary,
            image_url: piece.image_url
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Pick a random piece from the least-discussed ones
      const randomPiece = pieces[Math.floor(Math.random() * pieces.length)]
      
      // Update discussed_at
      await supabase
        .from('art_pieces')
        .update({ 
          discussed_at: new Date().toISOString(),
          discussion_count: (randomPiece.discussion_count || 0) + 1
        })
        .eq('id', randomPiece.id)
      
      // Generate commentary
      const commentary = await generateArtCommentary(randomPiece)
      
      return new Response(
        JSON.stringify({ 
          piece: randomPiece,
          commentary,
          image_url: randomPiece.image_url
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error: unknown) {
    console.error('Error in art-curator function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
