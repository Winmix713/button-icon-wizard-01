import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/functions/v1/figma-proxy', '');
    
    // Get Figma API token from Supabase secrets
    const figmaToken = Deno.env.get('FIGMA_API_TOKEN');
    if (!figmaToken) {
      console.error('FIGMA_API_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Figma API token not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Construct Figma API URL
    const figmaApiUrl = `https://api.figma.com/v1${path}${url.search}`;
    console.log(`Proxying request to: ${figmaApiUrl}`);

    // Make request to Figma API
    const figmaResponse = await fetch(figmaApiUrl, {
      method: req.method,
      headers: {
        'X-Figma-Token': figmaToken,
        'Content-Type': 'application/json',
      },
    });

    const responseData = await figmaResponse.text();
    
    // Log response for debugging
    console.log(`Figma API response status: ${figmaResponse.status}`);
    if (!figmaResponse.ok) {
      console.error(`Figma API error: ${responseData}`);
    }

    return new Response(responseData, {
      status: figmaResponse.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Proxy request failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});