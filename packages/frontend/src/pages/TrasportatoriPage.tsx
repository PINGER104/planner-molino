import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PageHeader from '../components/common/PageHeader';
import SearchField from '../components/common/SearchField';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import TrasportatoriTable from '../components/trasportatori/TrasportatoriTable';
import TrasportatoreDialog from '../components/trasportatori/TrasportatoreDialog';
import { trasportatoriService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import type { Trasportatore, CreateTrasportatoreInput } from '@planner-molino/shared';

export default function TrasportatoriPage() {
  const { user } = useAuth();
  const canModify = user?.livello_accesso === 'modifica';

  const [trasportatori, setTrasportatori] = useState<Trasportatore[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTrasportatore, setSelectedTrasportatore] = useState<Trasportatore | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trasportatoreToDelete, setTrasportatoreToDelete] = useState<Trasportatore | null>(null);

  const fetchTrasportatori = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page + 1),
        limit: String(rowsPerPage),
      };
      if (search) params.search = search;

      const res = await trasportatoriService.list(params);
      setTrasportatori(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Errore caricamento trasportatori:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    fetchTrasportatori();
  }, [fetchTrasportatori]);

  const handleEdit = (trasportatore: Trasportatore) => {
    setSelectedTrasportatore(trasportatore);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedTrasportatore(null);
    setDialogOpen(true);
  };

  const handleSave = async (data: CreateTrasportatoreInput) => {
    try {
      if (selectedTrasportatore) {
        await trasportatoriService.update(selectedTrasportatore.id, data);
      } else {
        await trasportatoriService.create(data);
      }
      setDialogOpen(false);
      setSelectedTrasportatore(null);
      fetchTrasportatori();
    } catch (err) {
      console.error('Errore salvataggio trasportatore:', err);
    }
  };

  const handleDeleteConfirm = (trasportatore: Trasportatore) => {
    setTrasportatoreToDelete(trasportatore);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!trasportatoreToDelete) return;
    try {
      await trasportatoriService.remove(trasportatoreToDelete.id);
      setDeleteDialogOpen(false);
      setTrasportatoreToDelete(null);
      fetchTrasportatori();
    } catch (err) {
      console.error('Errore eliminazione trasportatore:', err);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Gestione Trasportatori"
        action={
          canModify ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              Nuovo Trasportatore
            </Button>
          ) : undefined
        }
      />

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <SearchField
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
          placeholder="Cerca trasportatori..."
        />
      </Box>

      {/* Table */}
      {!loading && trasportatori.length === 0 && !search ? (
        <EmptyState
          title="Nessun trasportatore"
          description="Non ci sono trasportatori registrati. Crea il primo trasportatore per iniziare."
          icon={LocalShippingIcon}
          action={
            canModify ? (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
                Nuovo Trasportatore
              </Button>
            ) : undefined
          }
        />
      ) : (
        <TrasportatoriTable
          trasportatori={trasportatori}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeleteConfirm}
          page={page}
          rowsPerPage={rowsPerPage}
          total={total}
          onPageChange={setPage}
          onRowsPerPageChange={(rpp) => {
            setRowsPerPage(rpp);
            setPage(0);
          }}
          canModify={canModify}
        />
      )}

      {/* Create/Edit Dialog */}
      <TrasportatoreDialog
        open={dialogOpen}
        trasportatore={selectedTrasportatore}
        onClose={() => {
          setDialogOpen(false);
          setSelectedTrasportatore(null);
        }}
        onSave={handleSave}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Elimina Trasportatore"
        message={`Sei sicuro di voler eliminare il trasportatore "${trasportatoreToDelete?.ragione_sociale}"?`}
        confirmLabel="Elimina"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setTrasportatoreToDelete(null);
        }}
        severity="error"
      />
    </Box>
  );
}
