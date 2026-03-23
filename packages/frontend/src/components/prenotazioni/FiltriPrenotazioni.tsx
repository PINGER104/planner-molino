import React, { useEffect, useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Autocomplete,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import {
  LABELS_STATO,
  TRANSIZIONI_PRODUZIONE,
  TRANSIZIONI_CONSEGNA,
  PRIORITA_LABELS,
} from '@planner-molino/shared';
import type { TipologiaPrenotazione } from '@planner-molino/shared';
import { clientiService } from '../../services';
import { format, parseISO } from 'date-fns';

interface DropdownItem {
  id: number;
  codice: string;
  ragione_sociale: string;
}

export interface FiltriValues {
  stato: string;
  dataDa: string;
  dataA: string;
  clienteId: string;
  priorita: string;
}

interface FiltriPrenotazioniProps {
  filters: FiltriValues;
  onChange: (filters: FiltriValues) => void;
  tipologia: TipologiaPrenotazione;
}

const EMPTY_FILTERS: FiltriValues = {
  stato: '',
  dataDa: '',
  dataA: '',
  clienteId: '',
  priorita: '',
};

export default function FiltriPrenotazioni({
  filters,
  onChange,
  tipologia,
}: FiltriPrenotazioniProps) {
  const [clientiOptions, setClientiOptions] = useState<DropdownItem[]>([]);

  useEffect(() => {
    clientiService.dropdown().then(setClientiOptions).catch(console.error);
  }, []);

  const statiDisponibili =
    tipologia === 'produzione'
      ? Object.keys(TRANSIZIONI_PRODUZIONE)
      : Object.keys(TRANSIZIONI_CONSEGNA);

  const handleChange = (key: keyof FiltriValues, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onChange(EMPTY_FILTERS);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  const selectedCliente =
    clientiOptions.find((c) => String(c.id) === filters.clienteId) || null;

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ flexWrap: 'wrap', gap: 2, alignItems: 'center' }}
    >
      {/* Stato */}
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Stato</InputLabel>
        <Select
          value={filters.stato}
          label="Stato"
          onChange={(e) => handleChange('stato', e.target.value)}
        >
          <MenuItem value="">
            <em>Tutti</em>
          </MenuItem>
          {statiDisponibili.map((stato) => (
            <MenuItem key={stato} value={stato}>
              {LABELS_STATO[stato] || stato}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Data Da */}
      <DatePicker
        label="Data da"
        value={filters.dataDa ? parseISO(filters.dataDa) : null}
        onChange={(date) =>
          handleChange('dataDa', date ? format(date, 'yyyy-MM-dd') : '')
        }
        slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
      />

      {/* Data A */}
      <DatePicker
        label="Data a"
        value={filters.dataA ? parseISO(filters.dataA) : null}
        onChange={(date) =>
          handleChange('dataA', date ? format(date, 'yyyy-MM-dd') : '')
        }
        slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
      />

      {/* Cliente Autocomplete */}
      <Autocomplete
        size="small"
        sx={{ minWidth: 240 }}
        options={clientiOptions}
        getOptionLabel={(opt) => `${opt.codice} - ${opt.ragione_sociale}`}
        value={selectedCliente}
        onChange={(_, newValue) =>
          handleChange('clienteId', newValue ? String(newValue.id) : '')
        }
        renderInput={(params) => <TextField {...params} label="Cliente" />}
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />

      {/* Priorita */}
      <FormControl size="small" sx={{ minWidth: 130 }}>
        <InputLabel>Priorita</InputLabel>
        <Select
          value={filters.priorita}
          label="Priorita"
          onChange={(e) => handleChange('priorita', e.target.value)}
        >
          <MenuItem value="">
            <em>Tutte</em>
          </MenuItem>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((p) => (
            <MenuItem key={p} value={String(p)}>
              {p} - {PRIORITA_LABELS[p]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Reset */}
      {hasActiveFilters && (
        <Button
          size="small"
          startIcon={<FilterListOffIcon />}
          onClick={handleReset}
        >
          Reset Filtri
        </Button>
      )}
    </Stack>
  );
}
