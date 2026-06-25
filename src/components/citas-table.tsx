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
import type { Appointment } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface CitasTableProps {
  data: Appointment[];
  onUpdateField: (recordId: string, fieldName: string, newValue: string, recordType: 'appointment') => Promise<void>;
  onDeleteCita?: (citaId: string) => Promise<void>;
  onAddCita?: (citaData: Partial<Appointment>) => Promise<void>;
  patientId?: string;
}

const estadosCita = [
  { value: 'Programada', label: 'Programada', color: 'default' as const },
  { value: 'Confirmada', label: 'Confirmada', color: 'primary' as const },
  { value: 'En Proceso', label: 'En Proceso', color: 'warning' as const },
  { value: 'Completada', label: 'Completada', color: 'success' as const },
  { value: 'Cancelada', label: 'Cancelada', color: 'error' as const }
];

interface EditableCellProps {
  value: string | undefined;
  onSave: (newValue: string) => Promise<void>;
  type?: 'text' | 'date' | 'time' | 'select';
  options?: { value: string; label: string }[];
  multiline?: boolean;
}

function EditableCell({ value, onSave, type = 'text', options, multiline = false }: EditableCellProps) {
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

  const formatDisplayValue = () => {
    if (!value) return 'Sin información';
    if (type === 'date') {
      try {
        return format(parseISO(value), "dd/MM/yyyy", { locale: es });
      } catch (error) {
        return value;
      }
    }
    return value;
  };

  if (isEditing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
        {type === 'select' && options ? (
          <TextField
            select
            size="small"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            disabled={isSaving}
            fullWidth
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <TextField
            size="small"
            type={type === 'date' ? 'date' : type === 'time' ? 'time' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            disabled={isSaving}
            multiline={multiline}
            rows={multiline ? 2 : 1}
            fullWidth
            InputLabelProps={type === 'date' ? { shrink: true } : undefined}
          />
        )}
        <IconButton size="small" onClick={handleSave} disabled={isSaving} color="primary">
          <SaveIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={handleCancel} disabled={isSaving}>
          <CancelIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      onClick={() => setIsEditing(true)}
      sx={{
        cursor: 'pointer',
        padding: 1,
        borderRadius: 1,
        minHeight: 40,
        display: 'flex',
        alignItems: 'center',
        '&:hover': {
          backgroundColor: 'action.hover'
        }
      }}
      title="Clic para editar"
    >
      {formatDisplayValue()}
    </Box>
  );
}

function StatusChip({ status }: { status: string }) {
  const estadoInfo = estadosCita.find(e => e.value === status) || { color: 'default' as const, label: status };
  
  return (
    <Chip
      label={estadoInfo.label}
      color={estadoInfo.color}
      size="small"
      variant="outlined"
    />
  );
}

export function CitasTable({ data, onUpdateField, onDeleteCita, onAddCita, patientId }: CitasTableProps) {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newCita, setNewCita] = useState<Partial<Appointment>>({
    Fecha_Cita: '',
    Hora_Inicio: '',
    Hora_Fin: '',
    Motivo_Cita: '',
    ID_Doctor: '',
    Notas_Cita: '',
    Estado_Cita: 'Programada'
  });
  const { toast } = useToast();

  const handleDelete = async (citaId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta cita?')) {
      try {
        await onDeleteCita?.(citaId);
        toast({
          title: "Cita eliminada",
          description: "La cita se ha eliminado correctamente."
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar la cita."
        });
      }
    }
  };

  const handleAddCita = async () => {
    try {
      await onAddCita?.(newCita);
      setOpenAddDialog(false);
      setNewCita({
        Fecha_Cita: '',
        Hora_Inicio: '',
        Hora_Fin: '',
        Motivo_Cita: '',
        ID_Doctor: '',
        Notas_Cita: '',
        Estado_Cita: 'Programada'
      });
      toast({
        title: "Cita agregada",
        description: "La nueva cita se ha registrado correctamente."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar la cita."
      });
    }
  };

  if (!data || data.length === 0) {
    return (
      <>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No hay citas programadas.
          </Typography>
          {onAddCita && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
              sx={{ mt: 2 }}
            >
              Programar Primera Cita
            </Button>
          )}
        </Paper>

        <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Programar Nueva Cita</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
              <TextField
                label="Fecha de la Cita"
                type="date"
                value={newCita.Fecha_Cita}
                onChange={(e) => setNewCita({ ...newCita, Fecha_Cita: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Hora de Inicio"
                type="time"
                value={newCita.Hora_Inicio}
                onChange={(e) => setNewCita({ ...newCita, Hora_Inicio: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Hora de Fin"
                type="time"
                value={newCita.Hora_Fin}
                onChange={(e) => setNewCita({ ...newCita, Hora_Fin: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Doctor"
                value={newCita.ID_Doctor}
                onChange={(e) => setNewCita({ ...newCita, ID_Doctor: e.target.value })}
                fullWidth
              />
              <TextField
                label="Motivo de la Cita"
                value={newCita.Motivo_Cita}
                onChange={(e) => setNewCita({ ...newCita, Motivo_Cita: e.target.value })}
                multiline
                rows={2}
                fullWidth
                sx={{ gridColumn: 'span 2' }}
              />
              <TextField
                label="Observaciones"
                value={newCita.Notas_Cita}
                onChange={(e) => setNewCita({ ...newCita, Notas_Cita: e.target.value })}
                multiline
                rows={2}
                fullWidth
                sx={{ gridColumn: 'span 2' }}
              />
              <TextField
                select
                label="Estado"
                value={newCita.Estado_Cita}
                onChange={(e) => setNewCita({ ...newCita, Estado_Cita: e.target.value as Appointment['Estado_Cita'] })}
                fullWidth
              >
                {estadosCita.map((estado) => (
                  <MenuItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddCita} variant="contained">Programar Cita</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h3">
          Citas Programadas ({data.length})
        </Typography>
        {onAddCita && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
          >
            Nueva Cita
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell><strong>Fecha</strong></TableCell>
              <TableCell><strong>Inicio</strong></TableCell>
              <TableCell><strong>Fin</strong></TableCell>
              <TableCell><strong>Motivo</strong></TableCell>
              <TableCell><strong>Doctor</strong></TableCell>
              <TableCell><strong>Observación</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((cita) => (
              <TableRow key={cita.ID_Cita} hover>
                <TableCell>
                  <EditableCell
                    value={cita.Fecha_Cita}
                    onSave={(newValue) => onUpdateField(cita.ID_Cita, 'Fecha_Cita', newValue, 'appointment')}
                    type="date"
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={cita.Hora_Inicio}
                    onSave={(newValue) => onUpdateField(cita.ID_Cita, 'Hora_Inicio', newValue, 'appointment')}
                    type="time"
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={cita.Hora_Fin}
                    onSave={(newValue) => onUpdateField(cita.ID_Cita, 'Hora_Fin', newValue, 'appointment')}
                    type="time"
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={cita.Motivo_Cita}
                    onSave={(newValue) => onUpdateField(cita.ID_Cita, 'Motivo_Cita', newValue, 'appointment')}
                    multiline
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={cita.ID_Doctor}
                    onSave={(newValue) => onUpdateField(cita.ID_Cita, 'ID_Doctor', newValue, 'appointment')}
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={cita.Notas_Cita}
                    onSave={(newValue) => onUpdateField(cita.ID_Cita, 'Notas_Cita', newValue, 'appointment')}
                    multiline
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={cita.Estado_Cita}
                    onSave={(newValue) => onUpdateField(cita.ID_Cita, 'Estado_Cita', newValue, 'appointment')}
                    type="select"
                    options={estadosCita}
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {onDeleteCita && (
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(cita.ID_Cita)}
                        color="error"
                        title="Eliminar cita"
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

      {/* Dialog para agregar nueva cita */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Programar Nueva Cita</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1, gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <TextField
              label="Fecha de la Cita"
              type="date"
              value={newCita.Fecha_Cita}
              onChange={(e) => setNewCita({ ...newCita, Fecha_Cita: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Hora de Inicio"
              type="time"
              value={newCita.Hora_Inicio}
              onChange={(e) => setNewCita({ ...newCita, Hora_Inicio: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Hora de Fin"
              type="time"
              value={newCita.Hora_Fin}
              onChange={(e) => setNewCita({ ...newCita, Hora_Fin: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Doctor"
              value={newCita.ID_Doctor}
              onChange={(e) => setNewCita({ ...newCita, ID_Doctor: e.target.value })}
              fullWidth
            />
            <TextField
              label="Motivo de la Cita"
              value={newCita.Motivo_Cita}
              onChange={(e) => setNewCita({ ...newCita, Motivo_Cita: e.target.value })}
              multiline
              rows={2}
              fullWidth
              sx={{ gridColumn: 'span 2' }}
            />
            <TextField
              label="Observaciones"
              value={newCita.Notas_Cita}
              onChange={(e) => setNewCita({ ...newCita, Notas_Cita: e.target.value })}
              multiline
              rows={2}
              fullWidth
              sx={{ gridColumn: 'span 2' }}
            />
            <TextField
              select
              label="Estado"
              value={newCita.Estado_Cita}
              onChange={(e) => setNewCita({ ...newCita, Estado_Cita: e.target.value as Appointment['Estado_Cita'] })}
              fullWidth
            >
              {estadosCita.map((estado) => (
                <MenuItem key={estado.value} value={estado.value}>
                  {estado.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancelar</Button>
          <Button onClick={handleAddCita} variant="contained">Programar Cita</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default CitasTable;