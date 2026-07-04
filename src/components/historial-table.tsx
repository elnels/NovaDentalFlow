"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
  Typography,
  Chip
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from "@mui/icons-material";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { ClinicalHistory } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface HistorialTableProps {
  data: ClinicalHistory[];
  onUpdateField: (recordId: string, fieldName: string, newValue: string, recordType: 'history') => Promise<void>;
  onDeleteHistorial?: (historialId: string) => Promise<void>;
  onAddHistorial?: (historialData: Partial<ClinicalHistory>) => Promise<void>;
  patientId?: string;
  availableCitas?: Array<{id: string, fechaCita: string, motivoCita: string}>;
}

const estadosPago = [
  { value: 'Pendiente', label: 'Pendiente', color: 'warning' as const },
  { value: 'Pagado', label: 'Pagado', color: 'success' as const },
  { value: 'Parcial', label: 'Parcial', color: 'primary' as const },
  { value: 'Cancelado', label: 'Cancelado', color: 'error' as const }
];

interface EditableCellProps {
  value: string | undefined;
  onSave: (newValue: string) => Promise<void>;
  type?: 'text' | 'date' | 'select' | 'number';
  options?: { value: string; label: string; color?: string }[];
  multiline?: boolean;
  placeholder?: string;
}

function EditableCell({ value, onSave, type = 'text', options, multiline = false, placeholder }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (editValue !== value) {
      setIsSaving(true);
      try {
        await onSave(editValue);
        toast({
          title: "Campo actualizado",
          description: "El cambio se ha guardado correctamente."
        });
      } catch (error) {
        console.error('Error saving:', error);
        setEditValue(value || '');
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar el cambio."
        });
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatDisplayValue = () => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return placeholder || 'Sin información';
    }
    if (type === 'date' && typeof value === 'string') {
      try {
        return format(parseISO(value), "dd/MM/yyyy", { locale: es });
      } catch (error) {
        return value;
      }
    }
    if (type === 'number' && value && typeof value === 'string') {
      return `${parseFloat(value).toLocaleString()}`;
    }
    return value || '';
  };

  if (type === 'select' && !isEditing) {
    const option = options?.find(opt => opt.value === value);
    if (option) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label={option.label} 
            color={option.color as any || 'default'} 
            size="small"
            onClick={() => setIsEditing(true)}
            sx={{ cursor: 'pointer' }}
          />
        </Box>
      );
    }
  }

  if (!isEditing) {
    return (
      <Box 
        onClick={() => setIsEditing(true)}
        sx={{ 
          cursor: 'pointer', 
          minHeight: '24px',
          display: 'flex',
          alignItems: 'center',
          '&:hover': {
            backgroundColor: 'action.hover',
            borderRadius: 1
          },
          padding: '2px 4px',
          borderRadius: 1
        }}
      >
        <Typography variant="body2" color={!value || (typeof value === 'string' && value.trim() === '') ? 'text.secondary' : 'text.primary'}>
          {formatDisplayValue()}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '200px' }}>
      {type === 'select' ? (
        <TextField
          select
          size="small"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          autoFocus
          fullWidth
          disabled={isSaving}
        >
          {options?.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      ) : (
        <TextField
          size="small"
          type={type}
          multiline={multiline}
          rows={multiline ? 2 : 1}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          autoFocus
          fullWidth
          disabled={isSaving}
        />
      )}
      <IconButton 
        size="small" 
        onClick={handleSave} 
        disabled={isSaving}
        color="primary"
      >
        <SaveIcon fontSize="small" />
      </IconButton>
      <IconButton 
        size="small" 
        onClick={handleCancel} 
        disabled={isSaving}
      >
        <CancelIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

export function HistorialTable({ data, onUpdateField, onDeleteHistorial, onAddHistorial, patientId, availableCitas = [] }: HistorialTableProps) {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newHistorial, setNewHistorial] = useState<Partial<ClinicalHistory>>({
    fechaHistorial: '',
    appointmentId: '',
    diagnostico: '',
    tratamiento: '',
    prescripciones: '',
    notas: '',
    costoTratamiento: '',
    estadoPago: 'Pendiente',
    nombrePadre: '',
    nombreMadre: '',
    telefonoContacto: '',
    motivoConsulta: '',
    antecedentesPersonales: ''
  });
  const { toast } = useToast();

  const handleDelete = async (historialId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro del historial?')) {
      try {
        await onDeleteHistorial?.(historialId);
        toast({
          title: "Registro eliminado",
          description: "El registro del historial se ha eliminado correctamente."
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar el registro."
        });
      }
    }
  };

  const handleAddHistorial = async () => {
    try {
      await onAddHistorial?.(newHistorial);
      setOpenAddDialog(false);
      setNewHistorial({
        fechaHistorial: '',
        appointmentId: '',
        diagnostico: '',
        tratamiento: '',
        prescripciones: '',
        notas: '',
        costoTratamiento: '',
        estadoPago: 'Pendiente',
        nombrePadre: '',
        nombreMadre: '',
        telefonoContacto: '',
        motivoConsulta: '',
        antecedentesPersonales: ''
      });
      toast({
        title: "Historial agregado",
        description: "El nuevo registro se ha agregado correctamente."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar el registro."
      });
    }
  };

  // Verificar si hay datos vacíos o sin información
  // Solo considerar vacío si NO hay ID_Historial o si los campos principales están vacíos
  const hasEmptyData = data && data.length > 0 && data.every(item => 
    !item.id || (
      (!item.diagnostico || item.diagnostico.trim() === '') &&
      (!item.tratamiento || item.tratamiento.trim() === '') &&
      (!item.fechaHistorial || item.fechaHistorial.trim() === '')
    )
  );



  if (!data || data.length === 0 || hasEmptyData) {
    return (
      <>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {hasEmptyData 
              ? "El historial clínico fue omitido durante el registro. Los campos están vacíos."
              : "No hay registros en el historial clínico."
            }
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Puede agregar información del historial clínico cuando esté disponible.
          </Typography>
          {onAddHistorial && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
              sx={{ mt: 2 }}
            >
              Agregar Primer Registro
            </Button>
          )}
        </Paper>

        <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Agregar Nuevo Registro al Historial</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
              <TextField
                label="Fecha del Tratamiento"
                type="date"
                value={newHistorial.fechaHistorial}
                onChange={(e) => setNewHistorial({ ...newHistorial, fechaHistorial: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                select
                label="Cita Asociada"
                value={newHistorial.appointmentId}
                onChange={(e) => setNewHistorial({ ...newHistorial, appointmentId: e.target.value })}
                fullWidth
                helperText={availableCitas.length === 0 ? "No hay citas disponibles" : "Selecciona la cita relacionada"}
              >
                <MenuItem value="">
                  <em>Sin cita asociada</em>
                </MenuItem>
                {availableCitas.map((cita) => (
                  <MenuItem key={cita.id} value={cita.id}>
                    {cita.fechaCita instanceof Date ? cita.fechaCita.toLocaleDateString("es") : cita.fechaCita?.split("T")[0]} - {cita.motivoCita}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Costo del Tratamiento"
                type="number"
                value={newHistorial.costoTratamiento}
                onChange={(e) => setNewHistorial({ ...newHistorial, costoTratamiento: e.target.value })}
                fullWidth
              />
              <TextField
                label="Diagnóstico"
                value={newHistorial.diagnostico}
                onChange={(e) => setNewHistorial({ ...newHistorial, diagnostico: e.target.value })}
                multiline
                rows={2}
                fullWidth
                sx={{ gridColumn: 'span 2' }}
              />
              <TextField
                label="Tratamiento Realizado"
                value={newHistorial.tratamiento}
                onChange={(e) => setNewHistorial({ ...newHistorial, tratamiento: e.target.value })}
                multiline
                rows={2}
                fullWidth
                sx={{ gridColumn: 'span 2' }}
              />
              <TextField
                label="Prescripciones"
                value={newHistorial.prescripciones}
                onChange={(e) => setNewHistorial({ ...newHistorial, prescripciones: e.target.value })}
                multiline
                rows={2}
                fullWidth
                sx={{ gridColumn: 'span 2' }}
              />
              <TextField
                label="Observaciones Adicionales"
                value={newHistorial.notas}
                onChange={(e) => setNewHistorial({ ...newHistorial, notas: e.target.value })}
                multiline
                rows={2}
                fullWidth
                sx={{ gridColumn: 'span 2' }}
              />
              <TextField
                label="Nombre del Padre"
                value={newHistorial.nombrePadre}
                onChange={(e) => setNewHistorial({ ...newHistorial, nombrePadre: e.target.value })}
                fullWidth
              />
              <TextField
                label="Nombre de la Madre"
                value={newHistorial.nombreMadre}
                onChange={(e) => setNewHistorial({ ...newHistorial, nombreMadre: e.target.value })}
                fullWidth
              />
              <TextField
                label="Teléfono de Contacto"
                value={newHistorial.telefonoContacto}
                onChange={(e) => setNewHistorial({ ...newHistorial, telefonoContacto: e.target.value })}
                fullWidth
              />
              <TextField
                label="Motivo de Consulta"
                value={newHistorial.motivoConsulta}
                onChange={(e) => setNewHistorial({ ...newHistorial, motivoConsulta: e.target.value })}
                multiline
                rows={2}
                fullWidth
                sx={{ gridColumn: 'span 2' }}
              />
              <TextField
                label="Antecedentes Personales"
                value={newHistorial.antecedentesPersonales}
                onChange={(e) => setNewHistorial({ ...newHistorial, antecedentesPersonales: e.target.value })}
                multiline
                rows={2}
                fullWidth
                sx={{ gridColumn: 'span 2' }}
              />
              <TextField
                select
                label="Estado del Pago"
                value={newHistorial.estadoPago}
                onChange={(e) => setNewHistorial({ ...newHistorial, estadoPago: e.target.value })}
                fullWidth
              >
                {estadosPago.map((estado) => (
                  <MenuItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddHistorial} variant="contained">Agregar Primer Registro</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h3">
          Historial Clínico ({data.length})
        </Typography>
        {onAddHistorial && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
          >
            Nuevo Registro
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell><strong>Fecha</strong></TableCell>
              <TableCell><strong>Diagnóstico</strong></TableCell>
              <TableCell><strong>Tratamiento</strong></TableCell>
              <TableCell><strong>Prescripciones</strong></TableCell>
              <TableCell><strong>Observaciones</strong></TableCell>
              <TableCell><strong>Costo</strong></TableCell>
              <TableCell><strong>Padre</strong></TableCell>
              <TableCell><strong>Madre</strong></TableCell>
              <TableCell><strong>Tel. Contacto</strong></TableCell>
              <TableCell><strong>Motivo Consulta</strong></TableCell>
              <TableCell><strong>Antecedentes</strong></TableCell>
              <TableCell><strong>Estado Pago</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((historial) => (
              <TableRow key={historial.id} hover>
                <TableCell>
                  <EditableCell
                    value={historial.fechaHistorial || historial.fechaTratamiento}
                    onSave={(newValue) => onUpdateField(historial.id, 'fechaHistorial', newValue, 'history')}
                    type="date"
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={historial.diagnostico}
                    onSave={(newValue) => onUpdateField(historial.id, 'diagnostico', newValue, 'history')}
                    multiline
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={historial.tratamiento}
                    onSave={(newValue) => onUpdateField(historial.id, 'tratamiento', newValue, 'history')}
                    multiline
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={historial.prescripciones}
                    onSave={(newValue) => onUpdateField(historial.id, 'prescripciones', newValue, 'history')}
                    multiline
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={historial.notas}
                    onSave={(newValue) => onUpdateField(historial.id, 'notas', newValue, 'history')}
                    multiline
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={historial.costoTratamiento}
                    onSave={(newValue) => onUpdateField(historial.id, 'costoTratamiento', newValue, 'history')}
                    type="number"
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={historial.nombrePadre || ''}
                    onSave={(newValue) => onUpdateField(historial.id, 'nombrePadre', newValue, 'history')}
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={historial.nombreMadre || ''}
                    onSave={(newValue) => onUpdateField(historial.id, 'nombreMadre', newValue, 'history')}
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={historial.telefonoContacto || ''}
                    onSave={(newValue) => onUpdateField(historial.id, 'telefonoContacto', newValue, 'history')}
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={historial.motivoConsulta || ''}
                    onSave={(newValue) => onUpdateField(historial.id, 'motivoConsulta', newValue, 'history')}
                    multiline
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={historial.antecedentesPersonales || ''}
                    onSave={(newValue) => onUpdateField(historial.id, 'antecedentesPersonales', newValue, 'history')}
                    multiline
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={historial.estadoPago}
                    onSave={(newValue) => onUpdateField(historial.id, 'estadoPago', newValue, 'history')}
                    type="select"
                    options={estadosPago}
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {onDeleteHistorial && (
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(historial.id)}
                        color="error"
                        title="Eliminar registro"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para agregar nuevo registro */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Agregar Nuevo Registro al Historial</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1, gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <TextField
              label="Fecha del Tratamiento"
              type="date"
              value={newHistorial.fechaHistorial}
              onChange={(e) => setNewHistorial({ ...newHistorial, fechaHistorial: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Costo del Tratamiento"
              type="number"
              value={newHistorial.costoTratamiento}
              onChange={(e) => setNewHistorial({ ...newHistorial, costoTratamiento: e.target.value })}
              fullWidth
            />
            <TextField
              label="Diagnóstico"
              value={newHistorial.diagnostico}
              onChange={(e) => setNewHistorial({ ...newHistorial, diagnostico: e.target.value })}
              multiline
              rows={2}
              fullWidth
              sx={{ gridColumn: 'span 2' }}
            />
            <TextField
              label="Tratamiento Realizado"
              value={newHistorial.tratamiento}
              onChange={(e) => setNewHistorial({ ...newHistorial, tratamiento: e.target.value })}
              multiline
              rows={2}
              fullWidth
              sx={{ gridColumn: 'span 2' }}
            />
            <TextField
              label="Prescripciones"
              value={newHistorial.prescripciones}
              onChange={(e) => setNewHistorial({ ...newHistorial, prescripciones: e.target.value })}
              multiline
              rows={2}
              fullWidth
              sx={{ gridColumn: 'span 2' }}
            />
            <TextField
              label="Observaciones Adicionales"
              value={newHistorial.notas}
              onChange={(e) => setNewHistorial({ ...newHistorial, notas: e.target.value })}
              multiline
              rows={2}
              fullWidth
              sx={{ gridColumn: 'span 2' }}
            />
            <TextField
              label="Nombre del Padre"
              value={newHistorial.nombrePadre}
              onChange={(e) => setNewHistorial({ ...newHistorial, nombrePadre: e.target.value })}
              fullWidth
            />
            <TextField
              label="Nombre de la Madre"
              value={newHistorial.nombreMadre}
              onChange={(e) => setNewHistorial({ ...newHistorial, nombreMadre: e.target.value })}
              fullWidth
            />
            <TextField
              label="Teléfono de Contacto"
              value={newHistorial.telefonoContacto}
              onChange={(e) => setNewHistorial({ ...newHistorial, telefonoContacto: e.target.value })}
              fullWidth
            />
            <TextField
              label="Motivo de Consulta"
              value={newHistorial.motivoConsulta}
              onChange={(e) => setNewHistorial({ ...newHistorial, motivoConsulta: e.target.value })}
              multiline
              rows={2}
              fullWidth
              sx={{ gridColumn: 'span 2' }}
            />
            <TextField
              label="Antecedentes Personales"
              value={newHistorial.antecedentesPersonales}
              onChange={(e) => setNewHistorial({ ...newHistorial, antecedentesPersonales: e.target.value })}
              multiline
              rows={2}
              fullWidth
              sx={{ gridColumn: 'span 2' }}
            />
            <TextField
              select
              label="Estado del Pago"
              value={newHistorial.estadoPago}
              onChange={(e) => setNewHistorial({ ...newHistorial, estadoPago: e.target.value })}
              fullWidth
            >
              {estadosPago.map((estado) => (
                <MenuItem key={estado.value} value={estado.value}>
                  {estado.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancelar</Button>
          <Button onClick={handleAddHistorial} variant="contained">Agregar Registro</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default HistorialTable;