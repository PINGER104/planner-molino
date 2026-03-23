import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Typography,
  Stack,
  TablePagination,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PersonIcon from '@mui/icons-material/Person';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { SEZIONI, LIVELLO_ACCESSO } from '@planner-molino/shared';
import type { Utente } from '@planner-molino/shared';

interface UtentiTableProps {
  utenti: Utente[];
  total: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rpp: number) => void;
  onEdit: (utente: Utente) => void;
  onResetPassword: (utente: Utente) => void;
  onToggleAttivo: (utente: Utente) => void;
  currentUserId: string;
}

export default function UtentiTable({
  utenti,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onResetPassword,
  onToggleAttivo,
  currentUserId,
}: UtentiTableProps) {
  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Nome Completo</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Ruolo</TableCell>
              <TableCell>Livello Accesso</TableCell>
              <TableCell>Sezioni</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell>Ultimo Accesso</TableCell>
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {utenti.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    Nessun utente trovato
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              utenti.map((utente) => {
                const isSelf = utente.id === currentUserId;
                return (
                  <TableRow key={utente.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {utente.username}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {utente.nome} {utente.cognome}
                    </TableCell>
                    <TableCell>{utente.email}</TableCell>
                    <TableCell>{utente.ruolo || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={LIVELLO_ACCESSO[utente.livello_accesso] || utente.livello_accesso}
                        size="small"
                        color={utente.livello_accesso === 'modifica' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {utente.sezioni_abilitate.map((s) => (
                          <Chip key={s} label={SEZIONI[s] || s} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={utente.attivo ? 'Attivo' : 'Inattivo'}
                        size="small"
                        color={utente.attivo ? 'success' : 'default'}
                        variant={utente.attivo ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      {utente.ultimo_accesso
                        ? format(parseISO(utente.ultimo_accesso), 'dd/MM/yy HH:mm', { locale: it })
                        : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {!isSelf && (
                        <Stack direction="row" spacing={0} justifyContent="flex-end">
                          <Tooltip title="Modifica">
                            <IconButton size="small" onClick={() => onEdit(utente)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reset Password">
                            <IconButton size="small" onClick={() => onResetPassword(utente)}>
                              <VpnKeyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={utente.attivo ? 'Disattiva' : 'Riattiva'}>
                            <IconButton size="small" onClick={() => onToggleAttivo(utente)}>
                              {utente.attivo ? (
                                <PersonOffIcon fontSize="small" />
                              ) : (
                                <PersonIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, p) => onPageChange(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value))}
        rowsPerPageOptions={[10, 25, 50]}
        labelRowsPerPage="Righe per pagina:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} di ${count !== -1 ? count : `oltre ${to}`}`
        }
      />
    </Paper>
  );
}
