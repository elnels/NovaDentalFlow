"use client";

import React, { useState } from "react";
import { Calendar, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCalendarConfig } from "@/lib/calendar";

export function CalendarEmbed() {
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const config = getCalendarConfig();

  if (!config.isConfigured) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-8 text-center">
          <Calendar className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-amber-700 mb-2">
            Calendario no configurado
          </h3>
          <p className="text-amber-600 mb-4">
            Configura la variable <code className="bg-amber-100 px-2 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_CALENDAR_ID</code> en tu archivo <code className="bg-amber-100 px-2 py-0.5 rounded">.env.local</code> para mostrar el calendario.
          </p>
          <a
            href="https://support.google.com/calendar/answer/37083"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
              <ExternalLink className="mr-2 h-4 w-4" />
              Cómo obtener tu ID de calendario
            </Button>
          </a>
        </CardContent>
      </Card>
    );
  }

  if (iframeError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-700 mb-2">
            Error al cargar el calendario
          </h3>
          <p className="text-red-600 mb-6">
            No se pudo cargar el calendario. Verifica que el ID del calendario sea correcto y que esté configurado como público.
          </p>
          <Button
            onClick={() => {
              setIframeError(false);
              setIframeLoading(true);
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Calendar className="h-5 w-5 text-blue-600" />
          Calendario de Citas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 relative">
        {iframeLoading && (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-b-lg">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Cargando calendario...</p>
          </div>
        )}
        <iframe
          src={config.embedUrl}
          className={`w-full border-0 rounded-b-lg transition-opacity duration-300 ${iframeLoading ? "h-0 opacity-0 absolute" : "h-[600px] opacity-100"}`}
          style={{ minHeight: iframeLoading ? 0 : 600 }}
          onLoad={() => setIframeLoading(false)}
          onError={() => {
            setIframeError(true);
            setIframeLoading(false);
          }}
          allowFullScreen
          title="Google Calendar"
        />
      </CardContent>
    </Card>
  );
}
