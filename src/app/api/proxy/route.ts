// Archivo: src/app/api/proxy/route.ts
// Proxy para manejar peticiones a Google Apps Script

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Configuración CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    // URL de Google Apps Script desde variables de entorno
    const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_API_URL;
    
    if (!GOOGLE_SCRIPT_URL) {
      return NextResponse.json(
        { 
          error: 'URL de Google Apps Script no configurada',
          debug: {
            hasUrl: !!GOOGLE_SCRIPT_URL,
            nodeEnv: process.env.NODE_ENV,
            vercelEnv: process.env.VERCEL_ENV
          }
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Construir URL con parámetros
    const targetUrl = new URL(GOOGLE_SCRIPT_URL);
    searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });

    console.log('Proxy request to:', targetUrl.toString());

    // Realizar petición a Google Apps Script
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DentalFlow-Vercel-Proxy/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Proxy error:', error);
    
    return NextResponse.json(
      { 
        error: 'Error en el proxy',
        message: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // URL de Google Apps Script desde variables de entorno
    const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_API_URL;
    
    if (!GOOGLE_SCRIPT_URL) {
      return NextResponse.json(
        { error: 'URL de Google Apps Script no configurada' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('Proxy POST request to:', GOOGLE_SCRIPT_URL);
    console.log('Body:', body);

    // Realizar petición POST a Google Apps Script
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'DentalFlow-Vercel-Proxy/1.0'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Proxy POST error:', error);
    
    return NextResponse.json(
      { 
        error: 'Error en el proxy POST',
        message: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500, headers: corsHeaders }
    );
  }
}