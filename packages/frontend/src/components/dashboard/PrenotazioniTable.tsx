import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import StatoBadge from '../common/StatoBadge';
import EmptyState from '../common/EmptyState';
import type { Prenotazione } from '@planner-molino/shared';

interface PrenotazioniTableProps {
  prenotazioni: Prenotazione[];
  title: string;
  emptyMessage?: string;
}

export default function PrenotazioniTable({
  prenotazioni,
  title,
  emptyMessage = 'Nessuna prenotazione',
}: PrenotazioniTableProps) {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {prenotazioni.length === 0 ? (
        <EmptyState title={emptyMessage} icon={EventBusyIcon} />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Codice</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Ora</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prenotazioni.map((p) => (
                <TableRow
                  key={p.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/prenotazioni/${p.id}`)}
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      {p.codice_prenotazione}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {(p as Record<string, unknown>).cliente_ragione_sociale as string || `Cliente #${p.cliente_id}`}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={p.tipologia === 'produzione' ? 'Produzione' : 'Consegna'}
                      size="small"
                      color={p.tipologia === 'produzione' ? 'primary' : 'secondary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <StatoBadge stato={p.stato} />
                  </TableCell>
                  <TableCell>
                    {p.ora_inizio_prevista ? p.ora_inizio_prevista.substring(0, 5) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
