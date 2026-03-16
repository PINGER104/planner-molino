import { supabase } from '../lib/supabase';
import type {
  Prenotazione,
  Cliente,
  Trasportatore,
  StoricoStato,
  DatiCarico,
  User,
  PaginatedResponse,
  PrenotazioneForm as PrenotazioneFormData,
  DatiCaricoForm as DatiCaricoFormData,
  CalendarEvent,
  ClienteDropdown,
  TrasportatoreDropdown,
} from '../types';

// ─── Auth ────────────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('utenti')
      .select('*')
      .eq('id', data.user.id)
      .single();
    if (profileError) throw profileError;

    // Update last access
    await supabase
      .from('utenti')
      .update({ ultimo_accesso: new Date().toISOString() })
      .eq('id', data.user.id);

    return { session: data.session, user: profile as User };
  },

  getMe: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw error || new Error('Non autenticato');

    const { data: profile, error: profileError } = await supabase
      .from('utenti')
      .select('*')
      .eq('id', user.id)
      .single();
    if (profileError) throw profileError;

    return profile as User;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  changePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
};

// ─── Prenotazioni ────────────────────────────────────

// Columns needed for list views (avoids fetching 40+ unused columns)
const LIST_COLUMNS = [
  'id', 'codice_prenotazione', 'tipologia', 'stato',
  'data_pianificata', 'ora_inizio_prevista', 'ora_fine_prevista',
  'prodotto_descrizione', 'quantita_prevista', 'unita_misura',
  'cliente_id', 'cliente_ragione_sociale', 'cliente_codice',
  'trasportatore_ragione_sociale', 'priorita',
].join(',');

export const prenotazioniApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    tipologia?: string;
    stato?: string;
    cliente_id?: number;
    trasportatore_id?: number;
    data_da?: string;
    data_a?: string;
    search?: string;
  }): Promise<PaginatedResponse<Prenotazione>> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('prenotazioni_view')
      .select(LIST_COLUMNS, { count: 'estimated' });

    if (params?.tipologia) query = query.eq('tipologia', params.tipologia);
    if (params?.stato) query = query.eq('stato', params.stato);
    if (params?.cliente_id) query = query.eq('cliente_id', params.cliente_id);
    if (params?.trasportatore_id) query = query.eq('trasportatore_id', params.trasportatore_id);
    if (params?.data_da) query = query.gte('data_pianificata', params.data_da);
    if (params?.data_a) query = query.lte('data_pianificata', params.data_a);
    if (params?.search) {
      query = query.or(
        `codice_prenotazione.ilike.%${params.search}%,prodotto_descrizione.ilike.%${params.search}%,cliente_ragione_sociale.ilike.%${params.search}%`
      );
    }

    const { data, count, error } = await query
      .order('data_pianificata', { ascending: false })
      .order('ora_inizio_prevista', { ascending: true })
      .range(from, to);

    if (error) throw error;

    const total = count ?? 0;
    return {
      data: (data ?? []) as unknown as Prenotazione[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  getCalendario: async (params: {
    tipologia?: string;
    data_da: string;
    data_a: string;
  }): Promise<CalendarEvent[]> => {
    // Only fetch columns needed for calendar rendering
    const calendarColumns = 'id,codice_prenotazione,tipologia,stato,data_pianificata,ora_inizio_prevista,ora_fine_prevista,prodotto_descrizione,quantita_prevista,unita_misura,cliente_ragione_sociale,trasportatore_ragione_sociale,priorita,note';
    let query = supabase
      .from('prenotazioni_view')
      .select(calendarColumns)
      .gte('data_pianificata', params.data_da)
      .lte('data_pianificata', params.data_a);

    if (params.tipologia) query = query.eq('tipologia', params.tipologia);

    const { data, error } = await query
      .order('data_pianificata')
      .order('ora_inizio_prevista');

    if (error) throw error;

    return ((data ?? []) as unknown as Prenotazione[]).map((row) => ({
      id: row.id.toString(),
      title: `${row.cliente_ragione_sociale || 'N/D'} - ${row.prodotto_descrizione || 'N/D'}`,
      start: `${row.data_pianificata}T${row.ora_inizio_prevista}`,
      end: row.ora_fine_prevista
        ? `${row.data_pianificata}T${row.ora_fine_prevista}`
        : undefined,
      extendedProps: row,
    }));
  },

  getById: async (id: number): Promise<Prenotazione> => {
    const { data: prenotazione, error } = await supabase
      .from('prenotazioni_view')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Get state history
    const { data: storico, error: storicoError } = await supabase
      .from('storico_stati_view')
      .select('*')
      .eq('prenotazione_id', id)
      .order('timestamp_cambio', { ascending: false });

    if (storicoError) throw storicoError;

    // Get dati_carico
    const { data: datiCarico } = await supabase
      .from('dati_carico')
      .select('*')
      .eq('prenotazione_id', id)
      .maybeSingle();

    // Get possible transitions
    const { data: transizioni } = await supabase
      .rpc('get_transizioni_possibili', { p_prenotazione_id: id });

    return {
      ...prenotazione,
      storico_stati: storico as StoricoStato[],
      dati_carico: (datiCarico as DatiCarico) || null,
      transizioni_possibili: transizioni || [],
    } as Prenotazione;
  },

  create: async (data: PrenotazioneFormData) => {
    const { data: result, error } = await supabase.rpc('create_prenotazione', {
      p_data: data as unknown as Record<string, unknown>,
    });
    if (error) throw error;
    return result as Prenotazione;
  },

  update: async (id: number, data: Partial<PrenotazioneFormData>) => {
    const { data: result, error } = await supabase
      .from('prenotazioni')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result as Prenotazione;
  },

  updateStato: async (id: number, nuovo_stato: string, note?: string) => {
    const { data: result, error } = await supabase.rpc('update_stato_prenotazione', {
      p_prenotazione_id: id,
      p_nuovo_stato: nuovo_stato,
      p_note: note || null,
    });
    if (error) throw error;
    return result;
  },

  delete: async (id: number) => {
    // Only allow deletion for 'pianificato' state (enforced client-side for UX, also in DB via business logic)
    const { error } = await supabase
      .from('prenotazioni')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Dati carico
  getDatiCarico: async (prenotazioneId: number) => {
    const { data, error } = await supabase
      .from('dati_carico')
      .select('*')
      .eq('prenotazione_id', prenotazioneId)
      .maybeSingle();
    if (error) throw error;
    return data as DatiCarico | null;
  },

  createDatiCarico: async (prenotazioneId: number, data: DatiCaricoFormData) => {
    const { data: result, error } = await supabase.rpc('create_dati_carico', {
      p_prenotazione_id: prenotazioneId,
      p_data: data as unknown as Record<string, unknown>,
    });
    if (error) throw error;
    return result as DatiCarico;
  },

  updateDatiCarico: async (prenotazioneId: number, data: Partial<DatiCaricoFormData>) => {
    const { data: result, error } = await supabase
      .from('dati_carico')
      .update(data)
      .eq('prenotazione_id', prenotazioneId)
      .select()
      .single();
    if (error) throw error;
    return result as DatiCarico;
  },
};

// ─── Clienti ─────────────────────────────────────────

export const clientiApi = {
  getAll: async (params?: { search?: string; page?: number; limit?: number }) => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('clienti')
      .select('id,codice,ragione_sociale,partita_iva,citta,provincia,telefono,email,attivo', { count: 'estimated' });

    if (params?.search) {
      query = query.or(
        `codice.ilike.%${params.search}%,ragione_sociale.ilike.%${params.search}%,citta.ilike.%${params.search}%`
      );
    }

    const { data, count, error } = await query
      .order('ragione_sociale')
      .range(from, to);

    if (error) throw error;

    return {
      data: (data ?? []) as unknown as Cliente[],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    };
  },

  getById: async (id: number) => {
    const { data, error } = await supabase
      .from('clienti')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as unknown as Cliente;
  },

  getDropdown: async (): Promise<ClienteDropdown[]> => {
    const { data, error } = await supabase
      .from('clienti')
      .select('id, codice, ragione_sociale, citta, provincia')
      .eq('attivo', true)
      .order('ragione_sociale');
    if (error) throw error;
    return (data ?? []) as unknown as ClienteDropdown[];
  },

  create: async (data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.rpc('create_cliente', {
      p_data: data,
    });
    if (error) throw error;
    return result as Cliente;
  },

  update: async (id: number, data: Record<string, unknown>) => {
    const { data: result, error } = await supabase
      .from('clienti')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result as Cliente;
  },

  delete: async (id: number) => {
    const { error } = await supabase.from('clienti').delete().eq('id', id);
    if (error) throw error;
  },
};

// ─── Trasportatori ───────────────────────────────────

export const trasportatoriApi = {
  getAll: async (params?: { search?: string; page?: number; limit?: number }) => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('trasportatori')
      .select('id,codice,ragione_sociale,partita_iva,referente_nome,referente_telefono,tipologie_mezzi,attivo', { count: 'estimated' });

    if (params?.search) {
      query = query.or(
        `codice.ilike.%${params.search}%,ragione_sociale.ilike.%${params.search}%`
      );
    }

    const { data, count, error } = await query
      .order('ragione_sociale')
      .range(from, to);

    if (error) throw error;

    return {
      data: (data ?? []) as unknown as Trasportatore[],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    };
  },

  getById: async (id: number) => {
    const { data, error } = await supabase
      .from('trasportatori')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as unknown as Trasportatore;
  },

  getDropdown: async (): Promise<TrasportatoreDropdown[]> => {
    const { data, error } = await supabase
      .from('trasportatori')
      .select('id, codice, ragione_sociale, tipologie_mezzi')
      .eq('attivo', true)
      .order('ragione_sociale');
    if (error) throw error;
    return (data ?? []) as unknown as TrasportatoreDropdown[];
  },

  create: async (data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.rpc('create_trasportatore', {
      p_data: data,
    });
    if (error) throw error;
    return result as Trasportatore;
  },

  update: async (id: number, data: Record<string, unknown>) => {
    const { data: result, error } = await supabase
      .from('trasportatori')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result as Trasportatore;
  },

  delete: async (id: number) => {
    const { error } = await supabase.from('trasportatori').delete().eq('id', id);
    if (error) throw error;
  },
};

// ─── Configurazione ──────────────────────────────────

export const configurazioneApi = {
  getTempiCiclo: async () => {
    const { data, error } = await supabase
      .from('configurazione_tempi_ciclo')
      .select('*')
      .eq('attivo', true)
      .order('categoria');
    if (error) throw error;
    return data;
  },

  createTempiCiclo: async (data: {
    categoria: string;
    ton_ora: number;
    tempo_setup_minuti: number;
    tempo_pulizia_minuti: number;
  }) => {
    const { data: result, error } = await supabase
      .from('configurazione_tempi_ciclo')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  deleteTempiCiclo: async (categoria: string) => {
    const { error } = await supabase
      .from('configurazione_tempi_ciclo')
      .delete()
      .eq('categoria', categoria);
    if (error) throw error;
  },

  updateTempiCiclo: async (categoria: string, updates: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('configurazione_tempi_ciclo')
      .update(updates)
      .eq('categoria', categoria)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  calcolaDurata: async (params: {
    categoria_prodotto: string;
    quantita_kg: number;
    cambio_prodotto?: boolean;
  }) => {
    const { data, error } = await supabase.rpc('calcola_durata_prevista', {
      p_categoria: params.categoria_prodotto,
      p_quantita_kg: params.quantita_kg,
      p_cambio_prodotto: params.cambio_prodotto ?? false,
    });
    if (error) throw error;
    return data as number;
  },
};
