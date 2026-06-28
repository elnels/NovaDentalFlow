import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
      VERCEL: process.env.VERCEL || 'NOT_SET',
      VERCEL_ENV: process.env.VERCEL_ENV || 'NOT_SET'
    };

    // Información del entorno
    const envInfo = {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || 'unknown',
      host: request.headers.get('host') || 'unknown',
      url: request.url
    };

    return NextResponse.json({
      status: 'success',
      environment: envInfo,
      variables: envVars,
      message: 'Debug endpoint working correctly'
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}