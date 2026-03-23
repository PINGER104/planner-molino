import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  Skeleton,
  Typography,
  Tooltip,
  Box,
  Chip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ListAltIcon from '@mui/icons-material/ListAlt';
import StatoBadge from '../common/StatoBadge';
import EmptyState from '../common/EmptyState';
import {
  CATEGORIE_PRODOTTO,
  UNITA_MISURA,
  PRIORITA_LABELS,
  COLORI_STATO,
} from '@planner-molino/shared';
import type { Prenotazione, TipologiaPrenotazione } from '@planner-molino/shared';
import { format, parseISO } from 'date-fns';

interface PrenotazioniTableProps {
  prenotazioni: Prenotazione[];
  loading: boolean;
  tipologia: TipologiaPrenotazione;
  page: number;
  rowsPerPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onDelete: (prenotazione: Prenotazione) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return '-';
  return timeStr.substring(0, 5);
}

function formatQuantita(q: number | null, um: string | null): string {
  if (q == null) return '-';
  const label = um ? UNITA_MISURA[um] || um : '';
  return `${q.toLocaleString('it-IT')} ${label}`.trim();
}

function getPriorityColor(p: number): string {
  if (p <= 2) return '#DC2626';
  if (p <= 4) return '#CA8A04';
  if (p <= 6) return '#3B6FD4';
  return '#9E9E9E';
}

const SKELETON_COLS = 9;

export default function PrenotazioniTable({
  prenotazioni,
  loading,
  tipologia,
  page,
  rowsPerPage,
  total,
  onPageChange,
  onRowsPerPageChange,
  onDelete,
}: PrenotazioniTableProps) {
  const navigate = useNavigate();
  const basePath = tipologia === 'produzione' ? '/produzione' : '/consegne';

  if (loading) {
    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Codice</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Prodotto</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Ora</TableCell>
              <TableCell>Quantita</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell>Priorita</TableCell>
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: SKELETON_COLS }).map((_, j) => (
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

  if (prenotazioni.length === 0) {
    return (
      <EmptyState
        title="Nessuna prenotazione"
        description="Non sono state trovate prenotazioni con i filtri selezionati."
        icon={ListAltIcon}
      />
    );
  }

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Codice</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Prodotto</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Ora</TableCell>
              <TableCell>Quantita</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell>Priorita</TableCell>
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prenotazioni.map((p, index) => (
              <TableRow
                key={p.id}
                hover
                sx={{
                  backgroundColor: index % 2 === 1 ? 'action.hover' : 'inherit',
                }}
              >
                <TableCell>
                  <Typography
                    variant="body2"
                    component="a"
                    onClick={() => navigate(`${basePath}/prenotazioni/${p.id}`)}
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      cursor: 'pointer',
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {p.codice_prenotazione}
                  </Typography>
                </TableCell>
                <TableCell>
                  {(p as Record<string, unknown>).cliente_ragione_sociale as string ||
                    '-'}
                </TableCell>
                <TableCell>
                  {p.prodotto_descrizione ||
                    (p.categoria_prodotto
                      ? CATEGORIE_PRODOTTO[p.categoria_prodotto]
                      : '-')}
                </TableCell>
                <TableCell>{formatDate(p.data_pianificata)}</TableCell>
                <TableCell>{formatTime(p.ora_inizio_prevista)}</TableCell>
                <TableCell>
                  {formatQuantita(p.quantita_prevista, p.unita_misura)}
                </TableCell>
                <TableCell>
                  <StatoBadge stato={p.stato} />
                </TableCell>
                <TableCell>
                  <Chip
                    label={p.priorita}
                    size="small"
                    sx={{
                      bgcolor: getPriorityColor(p.priorita),
                      color: '#fff',
                      fontWeight: 600,
                      minWidth: 32,
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Dettaglio">
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigate(`${basePath}/prenotazioni/${p.id}`)
                      }
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Modifica">
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigate(`${basePath}/prenotazioni/${p.id}/modifica`)
                      }
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {p.stato === 'pianificato' && (
                    <Tooltip title="Elimina">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(p)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
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
        onRowsPerPageChange={(e) =>
          onRowsPerPageChange(parseInt(e.target.value, 10))
        }
        rowsPerPageOptions={[10, 25, 50]}
        labelRowsPerPage="Righe per pagina"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} di ${count !== -1 ? count : `piu di ${to}`}`
        }
      />
    </>
  );
}
