import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook simplificado para manejar actualizaciones automáticas de datos
 * después de operaciones CRUD exitosas
 */
export function useAutoRefresh() {
  const router = useRouter();

  /**
   * Actualiza automáticamente las rutas relevantes después de una operación exitosa
   * @param patientId - ID del paciente para actualizar su página específica
   */
  const refreshData = useCallback((patientId?: string) => {
    // Refrescar la página actual una sola vez
    router.refresh();
  }, [router]);

  /**
   * Maneja el éxito de operaciones de pacientes
   */
  const handlePatientSuccess = useCallback((patientId?: string) => {
    refreshData(patientId);
  }, [refreshData]);

  return {
    refreshData,
    handlePatientSuccess
  };
}