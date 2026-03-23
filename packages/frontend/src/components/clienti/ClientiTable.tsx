import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Chip,
  Skeleton,
  Typography,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { CANALE_CLIENTE, MODALITA_CONSEGNA } from '@planner-molino/shared';
import type { Cliente } from '@planner-molino/shared';

interface ClientiTableProps {
  clienti: Cliente[];
  loading: boolean;
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
  page: number;
  rowsPerPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  canModify: boolean;
}

export default function ClientiTable({
  clienti,
  loading,
  onEdit,
  onDelete,
  page,
  rowsPerPage,
  total,
  onPageChange,
  onRowsPerPageChange,
  canModify,
}: ClientiTableProps) {
  if (loading) {
    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Codice</TableCell>
              <TableCell>Ragione Sociale</TableCell>
              <TableCell>Citta</TableCell>
              <TableCell>Canale</TableCell>
              <TableCell>Modalita</TableCell>
              <TableCell>Stato</TableCell>
              {canModify && <TableCell>Azioni</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: canModify ? 7 : 6 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Codice</TableCell>
              <TableCell>Ragione Sociale</TableCell>
              <TableCell>Citta</TableCell>
              <TableCell>Canale</TableCell>
              <TableCell>Modalita</TableCell>
              <TableCell>Stato</TableCell>
              {canModify && <TableCell align="right">Azioni</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {clienti.map((c, index) => (
              <TableRow
                key={c.id}
                hover
                sx={{
                  cursor: 'pointer',
                  backgroundColor: index % 2 === 1 ? 'action.hover' : 'inherit',
                }}
                onClick={() => onEdit(c)}
              >
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: '"JetBrains Mono", monospace' }}
                  >
                    {c.codice}
                  </Typography>
                </TableCell>
                <TableCell>{c.ragione_sociale}</TableCell>
                <TableCell>{c.citta || '-'}</TableCell>
                <TableCell>
                  {c.canale ? (
                    <Chip
                      label={CANALE_CLIENTE[c.canale] || c.canale}
                      size="small"
                      variant="outlined"
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {c.modalita_consegna
                    ? MODALITA_CONSEGNA[c.modalita_consegna] || c.modalita_consegna
                    : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={c.attivo ? 'Attivo' : 'Inattivo'}
                    size="small"
                    color={c.attivo ? 'success' : 'default'}
                    variant={c.attivo ? 'filled' : 'outlined'}
                  />
                </TableCell>
                {canModify && (
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Modifica">
                      <IconButton size="small" onClick={() => onEdit(c)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina">
                      <IconButton size="small" color="error" onClick={() => onDelete(c)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 25, 50]}
        labelRowsPerPage="Righe per pagina"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} di ${count !== -1 ? count : `piu di ${to}`}`
        }
      />
    </>
  );
}
