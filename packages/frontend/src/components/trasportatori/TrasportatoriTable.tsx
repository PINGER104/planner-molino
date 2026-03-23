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
  Rating,
  Box,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Trasportatore } from '@planner-molino/shared';

interface TrasportatoriTableProps {
  trasportatori: Trasportatore[];
  loading: boolean;
  onEdit: (trasportatore: Trasportatore) => void;
  onDelete: (trasportatore: Trasportatore) => void;
  page: number;
  rowsPerPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  canModify: boolean;
}

export default function TrasportatoriTable({
  trasportatori,
  loading,
  onEdit,
  onDelete,
  page,
  rowsPerPage,
  total,
  onPageChange,
  onRowsPerPageChange,
  canModify,
}: TrasportatoriTableProps) {
  if (loading) {
    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Codice</TableCell>
              <TableCell>Ragione Sociale</TableCell>
              <TableCell>Referente</TableCell>
              <TableCell>Tipologie Mezzi</TableCell>
              <TableCell>Rating</TableCell>
              {canModify && <TableCell>Azioni</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: canModify ? 6 : 5 }).map((_, j) => (
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
              <TableCell>Referente</TableCell>
              <TableCell>Tipologie Mezzi</TableCell>
              <TableCell>Rating</TableCell>
              {canModify && <TableCell align="right">Azioni</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {trasportatori.map((t, index) => (
              <TableRow
                key={t.id}
                hover
                sx={{
                  cursor: 'pointer',
                  backgroundColor: index % 2 === 1 ? 'action.hover' : 'inherit',
                }}
                onClick={() => onEdit(t)}
              >
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: '"JetBrains Mono", monospace' }}
                  >
                    {t.codice}
                  </Typography>
                </TableCell>
                <TableCell>{t.ragione_sociale}</TableCell>
                <TableCell>{t.referente_nome || '-'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {(t.tipologie_mezzi || []).map((tipo) => (
                      <Chip key={tipo} label={tipo} size="small" variant="outlined" />
                    ))}
                    {(!t.tipologie_mezzi || t.tipologie_mezzi.length === 0) && '-'}
                  </Box>
                </TableCell>
                <TableCell>
                  <Rating
                    value={t.rating_puntualita}
                    readOnly
                    size="small"
                    precision={0.5}
                  />
                </TableCell>
                {canModify && (
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Modifica">
                      <IconButton size="small" onClick={() => onEdit(t)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina">
                      <IconButton size="small" color="error" onClick={() => onDelete(t)}>
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
