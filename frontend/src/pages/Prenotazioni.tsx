import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Search,
  Visibility,
  Edit,
  Delete,
  Clear,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale/it';

import { prenotazioniApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Prenotazione, TipologiaPrenotazione, PaginatedResponse } from '../types';
import { StatoBadge, LoadingSpinner, ConfirmDialog } from '../components/common';
import { LABEL_STATO } from '../utils/statiConfig';

const Prenotazioni: React.FC = () => {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const { canModify } = useAuth();

  const tipologia: TipologiaPrenotazione = section === 'produzione' ? 'produzione' : 'consegna';

  const [data, setData] = useState<PaginatedResponse<Prenotazione> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [statoFilter, setStatoFilter] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await prenotazioniApi.getAll({
        tipologia,
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        stato: statoFilter || undefined,
      });
      setData(response.data.data);
    } catch (err) {
      setError('Errore nel caricamento delle prenotazioni');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tipologia, page, rowsPerPage, search, statoFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await prenotazioniApi.delete(selectedId);
      setDeleteDialogOpen(false);
      setSelectedId(null);
      loadData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Errore nella cancellazione');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: it });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-';
    return timeStr.substring(0, 5);
  };

  const statiOptions =
    tipologia === 'produzione'
      ? ['pianificato', 'preso_in_carico', 'in_produzione', 'completato', 'annullato']
      : [
          'pianificato',
          'preso_in_carico',
          'in_preparazione',
          'pronto_carico',
          'in_carico',
          'caricato',
          'partito',
          'annullato',
        ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Prenotazioni {tipologia === 'produzione' ? 'Produzione' : 'Consegne'}
        </Typography>
        {canModify && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate(`/${section}/prenotazioni/nuova`)}
          >
            Nuova Prenotazione
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Cerca..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}>
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Stato</InputLabel>
            <Select
              value={statoFilter}
              label="Stato"
              onChange={(e) => setStatoFilter(e.target.value)}
            >
              <MenuItem value="">Tutti</MenuItem>
              {statiOptions.map((stato) => (
                <MenuItem key={stato} value={stato}>
                  {LABEL_STATO[stato]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper>
        {loading ? (
          <LoadingSpinner fullPage />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Codice</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Orario</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Prodotto</TableCell>
                    <TableCell>Quantita</TableCell>
                    <TableCell>Stato</TableCell>
                    <TableCell align="right">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.data.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {row.codice_prenotazione}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(row.data_pianificata)}</TableCell>
                      <TableCell>
                        {formatTime(row.ora_inizio_prevista)} -{' '}
                        {formatTime(row.ora_fine_prevista)}
                      </TableCell>
                      <TableCell>{row.cliente_ragione_sociale || '-'}</TableCell>
                      <TableCell>{row.prodotto_descrizione || '-'}</TableCell>
                      <TableCell>
                        {row.quantita_prevista} {row.unita_misura}
                      </TableCell>
                      <TableCell>
                        <StatoBadge stato={row.stato} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Visualizza">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/${section}/prenotazioni/${row.id}`)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {canModify && row.stato === 'pianificato' && (
                          <>
                            <Tooltip title="Modifica">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  navigate(`/${section}/prenotazioni/${row.id}/modifica`)
                                }
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Elimina">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedId(row.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data?.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="textSecondary" sx={{ py: 4 }}>
                          Nessuna prenotazione trovata
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {data && data.total > 0 && (
              <TablePagination
                component="div"
                count={data.total}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                labelRowsPerPage="Righe per pagina"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} di ${count !== -1 ? count : `piu di ${to}`}`
                }
              />
            )}
          </>
        )}
      </Paper>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Conferma eliminazione"
        message="Sei sicuro di voler eliminare questa prenotazione?"
        confirmLabel="Elimina"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedId(null);
        }}
      />
    </Box>
  );
};

export default Prenotazioni;
