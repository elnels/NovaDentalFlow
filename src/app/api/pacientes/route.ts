// Archivo: src/app/api/pacientes/route.ts

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not defined');
}

/**
 * =================================================================
 *  LÍNEA MÁGICA #1: LA SOLUCIÓN PRINCIPAL
 *  Esto fuerza a toda la ruta a ser dinámica. Next.js ejecutará este
 *  código en CADA petición, en lugar de devolver una respuesta
 *  guardada en caché.
 * =================================================================
 */
export const dynamic = 'force-dynamic';

// --- MANEJADOR DE PETICIONES OPTIONS (CORS Preflight) ---
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // Definir orígenes permitidos
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://dentalflow.vercel.app']
    : ['http://localhost:9004'];
  
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// --- MANEJADOR DE PETICIONES GET (Leer y Buscar) ---
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Construimos la URL para Google Apps Script directamente desde los parámetros
    const googleScriptUrl = `${API_URL}?${searchParams.toString()}`;

    console.log('Proxying GET request to:', googleScriptUrl); 

    const response = await fetch(googleScriptUrl, {
      /**
       * =================================================================
       *  LÍNEA MÁGICA #2: DOBLE SEGURO
       *  Esto le dice específicamente a esta petición fetch que no
       *  guarde ni utilice ninguna caché.
       * =================================================================
       */
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Apps Script response not ok:', response.status, errorText);
      return NextResponse.json(
        { error: `Google Apps Script error: ${response.status}`, details: errorText },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
              ? 'https://dentalflow.vercel.app' 
              : '*'
          }
        }
      );
    }

    const data = await response.json();
    
    // Agregar headers CORS a la respuesta
    const corsHeaders = {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
        ? 'https://dentalflow.vercel.app' 
        : '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Access-Control-Allow-Credentials': 'true'
    };
    
    return NextResponse.json(data, { headers: corsHeaders });

  } catch (error) {
    console.error('Proxy API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
            ? 'https://dentalflow.vercel.app' 
            : '*'
        }
      }
    );
  }
}


// --- MANEJADOR DE PETICIONES POST (Crear, Actualizar, Eliminar) ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('POST request to Google Apps Script:', {
      url: API_URL,
      action: body.action,
      timestamp: new Date().toISOString()
    });
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Google Apps Script response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Apps Script error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return NextResponse.json(
        { error: `Google Apps Script error: ${response.status}`, details: errorText },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
              ? 'https://dentalflow.vercel.app' 
              : '*'
          }
        }
      );
    }

    const result = await response.json();
    console.log('Google Apps Script success response:', {
      status: result.status,
      hasData: !!result.data
    });
    
    // Agregar headers CORS a la respuesta POST
    const corsHeaders = {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
        ? 'https://dentalflow.vercel.app' 
        : '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Access-Control-Allow-Credentials': 'true'
    };
    
    return NextResponse.json(result, { headers: corsHeaders });

  } catch (error) {
    console.error('Error in POST /api/pacientes:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
            ? 'https://dentalflow.vercel.app' 
            : '*'
        }
      }
    );
  }
}