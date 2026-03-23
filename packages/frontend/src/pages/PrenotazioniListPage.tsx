import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '../components/common/PageHeader';
import SearchField from '../components/common/SearchField';
import ConfirmDialog from '../components/common/ConfirmDialog';
import FiltriPrenotazioni, {
  type FiltriValues,
} from '../components/prenotazioni/FiltriPrenotazioni';
import PrenotazioniTable from '../components/prenotazioni/PrenotazioniTable';
import { prenotazioniService } from '../services';
import type { Prenotazione, TipologiaPrenotazione } from '@planner-molino/shared';

const EMPTY_FILTERS: FiltriValues = {
  stato: '',
  dataDa: '',
  dataA: '',
  clienteId: '',
  priorita: '',
};

export default function PrenotazioniListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const tipologia: TipologiaPrenotazione = location.pathname.includes('produzione')
    ? 'produzione'
    : 'consegna';

  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filters, setFilters] = useState<FiltriValues>(EMPTY_FILTERS);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [prenotazioneToDelete, setPrenotazioneToDelete] =
    useState<Prenotazione | null>(null);

  const fetchPrenotazioni = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        tipologia,
        page: String(page + 1),
        limit: String(rowsPerPage),
      };
      if (search) params.search = search;
      if (filters.stato) params.stato = filters.stato;
      if (filters.dataDa) params.data_da = filters.dataDa;
      if (filters.dataA) params.data_a = filters.dataA;
      if (filters.clienteId) params.cliente_id = filters.clienteId;
      if (filters.priorita) params.priorita = filters.priorita;

      const res = await prenotazioniService.list(params);
      setPrenotazioni(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Errore caricamento prenotazioni:', err);
    } finally {
      setLoading(false);
    }
  }, [tipologia, page, rowsPerPage, search, filters]);

  useEffect(() => {
    fetchPrenotazioni();
  }, [fetchPrenotazioni]);

  // Reset state when tipologia changes
  useEffect(() => {
    setSearch('');
    setPage(0);
    setFilters(EMPTY_FILTERS);
  }, [tipologia]);

  const handleDelete = async () => {
    if (!prenotazioneToDelete) return;
    try {
      await prenotazioniService.remove(prenotazioneToDelete.id);
      setDeleteDialogOpen(false);
      setPrenotazioneToDelete(null);
      fetchPrenotazioni();
    } catch (err) {
      console.error('Errore eliminazione prenotazione:', err);
    }
  };

  const basePath = tipologia === 'produzione' ? '/produzione' : '/consegne';

  return (
    <Box>
      <PageHeader
        title={
          tipologia === 'produzione'
            ? 'Prenotazioni Produzione'
            : 'Prenotazioni Consegne'
        }
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`${basePath}/prenotazioni/nuova`)}
          >
            Nuova Prenotazione
          </Button>
        }
      />

      {/* Search + Filters */}
      <Box sx={{ mb: 3 }}>
        <SearchField
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
          placeholder="Cerca per codice, cliente, prodotto..."
        />
        <Box sx={{ mt: 2 }}>
          <FiltriPrenotazioni
            filters={filters}
            onChange={(f) => {
              setFilters(f);
              setPage(0);
            }}
            tipologia={tipologia}
          />
        </Box>
      </Box>

      {/* Table */}
      <PrenotazioniTable
        prenotazioni={prenotazioni}
        loading={loading}
        tipologia={tipologia}
        page={page}
        rowsPerPage={rowsPerPage}
        total={total}
        onPageChange={setPage}
        onRowsPerPageChange={(rpp) => {
          setRowsPerPage(rpp);
          setPage(0);
        }}
        onDelete={(p) => {
          setPrenotazioneToDelete(p);
          setDeleteDialogOpen(true);
        }}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Elimina Prenotazione"
        message={`Sei sicuro di voler eliminare la prenotazione "${prenotazioneToDelete?.codice_prenotazione}"?`}
        confirmLabel="Elimina"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setPrenotazioneToDelete(null);
        }}
        severity="error"
      />
    </Box>
  );
}
