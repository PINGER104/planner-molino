import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Chip, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import PageHeader from '../components/common/PageHeader';
import SearchField from '../components/common/SearchField';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ClientiTable from '../components/clienti/ClientiTable';
import ClienteDialog from '../components/clienti/ClienteDialog';
import { clientiService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { CANALE_CLIENTE, MODALITA_CONSEGNA } from '@planner-molino/shared';
import type { Cliente, CreateClienteInput } from '@planner-molino/shared';

export default function ClientiPage() {
  const { user } = useAuth();
  const canModify = user?.livello_accesso === 'modifica';

  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Filters
  const [filtroCanale, setFiltroCanale] = useState<string | null>(null);
  const [filtroModalita, setFiltroModalita] = useState<string | null>(null);
  const [filtroAttivo, setFiltroAttivo] = useState<boolean | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);

  const fetchClienti = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page + 1),
        limit: String(rowsPerPage),
      };
      if (search) params.search = search;
      if (filtroCanale) params.canale = filtroCanale;
      if (filtroModalita) params.modalita_consegna = filtroModalita;
      if (filtroAttivo !== null) params.attivo = String(filtroAttivo);

      const res = await clientiService.list(params);
      setClienti(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Errore caricamento clienti:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, filtroCanale, filtroModalita, filtroAttivo]);

  useEffect(() => {
    fetchClienti();
  }, [fetchClienti]);

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedCliente(null);
    setDialogOpen(true);
  };

  const handleSave = async (data: CreateClienteInput) => {
    try {
      if (selectedCliente) {
        await clientiService.update(selectedCliente.id, data);
      } else {
        await clientiService.create(data);
      }
      setDialogOpen(false);
      setSelectedCliente(null);
      fetchClienti();
    } catch (err) {
      console.error('Errore salvataggio cliente:', err);
    }
  };

  const handleDeleteConfirm = (cliente: Cliente) => {
    setClienteToDelete(cliente);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!clienteToDelete) return;
    try {
      await clientiService.remove(clienteToDelete.id);
      setDeleteDialogOpen(false);
      setClienteToDelete(null);
      fetchClienti();
    } catch (err) {
      console.error('Errore eliminazione cliente:', err);
    }
  };

  const toggleFilter = (
    current: string | null,
    value: string,
    setter: (v: string | null) => void
  ) => {
    setter(current === value ? null : value);
    setPage(0);
  };

  return (
    <Box>
      <PageHeader
        title="Gestione Clienti"
        action={
          canModify ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              Nuovo Cliente
            </Button>
          ) : undefined
        }
      />

      {/* Search + Filters */}
      <Box sx={{ mb: 3 }}>
        <SearchField value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder="Cerca clienti..." />

        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
          {/* Canale filters */}
          {Object.entries(CANALE_CLIENTE).map(([key, label]) => (
            <Chip
              key={key}
              label={label}
              size="small"
              variant={filtroCanale === key ? 'filled' : 'outlined'}
              color={filtroCanale === key ? 'primary' : 'default'}
              onClick={() => toggleFilter(filtroCanale, key, setFiltroCanale)}
            />
          ))}

          {/* Modalita filters */}
          {Object.entries(MODALITA_CONSEGNA).map(([key, label]) => (
            <Chip
              key={key}
              label={label}
              size="small"
              variant={filtroModalita === key ? 'filled' : 'outlined'}
              color={filtroModalita === key ? 'secondary' : 'default'}
              onClick={() => toggleFilter(filtroModalita, key, setFiltroModalita)}
            />
          ))}

          {/* Attivo toggle */}
          <Chip
            label="Attivi"
            size="small"
            variant={filtroAttivo === true ? 'filled' : 'outlined'}
            color={filtroAttivo === true ? 'success' : 'default'}
            onClick={() => {
              setFiltroAttivo(filtroAttivo === true ? null : true);
              setPage(0);
            }}
          />
          <Chip
            label="Inattivi"
            size="small"
            variant={filtroAttivo === false ? 'filled' : 'outlined'}
            color={filtroAttivo === false ? 'error' : 'default'}
            onClick={() => {
              setFiltroAttivo(filtroAttivo === false ? null : false);
              setPage(0);
            }}
          />
        </Stack>
      </Box>

      {/* Table */}
      {!loading && clienti.length === 0 && !search && !filtroCanale && !filtroModalita ? (
        <EmptyState
          title="Nessun cliente"
          description="Non ci sono clienti registrati. Crea il primo cliente per iniziare."
          icon={PeopleIcon}
          action={
            canModify ? (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
                Nuovo Cliente
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ClientiTable
          clienti={clienti}
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
      <ClienteDialog
        open={dialogOpen}
        cliente={selectedCliente}
        onClose={() => {
          setDialogOpen(false);
          setSelectedCliente(null);
        }}
        onSave={handleSave}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Elimina Cliente"
        message={`Sei sicuro di voler eliminare il cliente "${clienteToDelete?.ragione_sociale}"?`}
        confirmLabel="Elimina"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setClienteToDelete(null);
        }}
        severity="error"
      />
    </Box>
  );
}
