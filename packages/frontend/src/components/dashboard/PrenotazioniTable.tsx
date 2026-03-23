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
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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
    <Card variant="outlined">
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="subtitle2">{title}</Typography>
            <Chip
              label={prenotazioni.length}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.6875rem',
                fontWeight: 700,
                bgcolor: '#F5F5F4',
                color: '#57534E',
                fontFamily: '"Sora", sans-serif',
              }}
            />
          </Stack>
        </Box>

        {prenotazioni.length === 0 ? (
          <Box sx={{ px: 2.5, pb: 2.5 }}>
            <EmptyState title={emptyMessage} icon={EventBusyIcon} />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Codice</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>Ora</TableCell>
                  <TableCell align="right" sx={{ width: 40 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prenotazioni.map((p) => {
                  const base = p.tipologia === 'consegna' ? '/consegne' : '/produzione';
                  return (
                    <TableRow
                      key={p.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:last-child td': { borderBottom: 0 },
                      }}
                      onClick={() => navigate(`${base}/prenotazioni/${p.id}`)}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            color: '#1C1917',
                          }}
                        >
                          {p.codice_prenotazione}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#44403C' }}>
                          {(p as Record<string, unknown>).cliente_ragione_sociale as string || `Cliente #${p.cliente_id}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={p.tipologia === 'produzione' ? 'PROD' : 'CONS'}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.5625rem',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            bgcolor: p.tipologia === 'produzione' ? '#EFF6FF' : '#FEF2F2',
                            color: p.tipologia === 'produzione' ? '#2563EB' : '#DC2626',
                            border: '1px solid',
                            borderColor: p.tipologia === 'produzione' ? '#DBEAFE' : '#FECACA',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <StatoBadge stato={p.stato} />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '0.75rem',
                            color: '#78716C',
                          }}
                        >
                          {p.ora_inizio_prevista ? p.ora_inizio_prevista.substring(0, 5) : '--:--'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <ArrowForwardIcon sx={{ fontSize: 14, color: '#D6D3D1' }} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
