import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';

export async function getUtenti(req: Request, res: Response): Promise<void> {
  try {
    const { page = 1, limit = 20, search, attivo } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = getSupabaseAdmin()
      .from('utenti')
      .select(
        'id, username, nome, cognome, email, telefono, ruolo, livello_accesso, sezioni_abilitate, attivo, created_at, ultimo_accesso',
        { count: 'exact' }
      );

    if (search) {
      // Sanitize search input to prevent PostgREST filter injection
      const safe = (search as string).replace(/[%_,.()"'\\]/g, '');
      const s = `%${safe}%`;
      query = query.or(
        `username.ilike.${s},nome.ilike.${s},cognome.ilike.${s},email.ilike.${s}`
      );
    }

    if (attivo !== undefined) {
      query = query.eq('attivo', attivo === 'true');
    }

    const { data, count, error } = await query
      .order('cognome')
      .order('nome')
      .range(from, to);

    if (error) throw error;

    const total = count ?? 0;
    res.json({
      success: true,
      data: {
        data: data ?? [],
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('GetUtenti error:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero utenti' });
  }
}

export async function getUtente(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const { data, error } = await getSupabaseAdmin()
      .from('utenti')
      .select(
        'id, username, nome, cognome, email, telefono, ruolo, livello_accesso, sezioni_abilitate, attivo, created_at, ultimo_accesso'
      )
      .eq('id', id)
      .single();

    if (error) {
      res.status(404).json({ success: false, error: 'Utente non trovato' });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('GetUtente error:', error);
    res.status(500).json({ success: false, error: 'Errore nel recupero utente' });
  }
}

export async function createUtente(req: Request, res: Response): Promise<void> {
  let authUserId: string | undefined;

  try {
    const {
      email,
      password,
      nome,
      cognome,
      telefono,
      ruolo,
      livello_accesso,
      sezioni_abilitate,
    } = req.body;

    // Validation
    if (!email || !password || !nome || !cognome || !livello_accesso) {
      res.status(400).json({
        success: false,
        error: 'Email, password, nome, cognome e livello_accesso sono obbligatori',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'La password deve avere almeno 6 caratteri',
      });
      return;
    }

    // Step 1: Create Supabase Auth user with profile metadata.
    // A database trigger (handle_new_user) auto-inserts into public.utenti
    // using raw_user_meta_data, so we pass profile fields here.
    const { data: authData, error: authError } =
      await getSupabaseAdmin().auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm so user can login immediately
        user_metadata: {
          username: email.split('@')[0],
          nome,
          cognome,
          livello_accesso,
          sezioni_abilitate: sezioni_abilitate || ['produzione', 'consegne'],
        },
      });

    if (authError) {
      // Map common Supabase auth errors to Italian
      const message =
        authError.message === 'A user with this email address has already been registered'
          ? 'Un utente con questa email esiste già'
          : authError.message;
      res.status(400).json({ success: false, error: message });
      return;
    }

    authUserId = authData.user.id;

    // Step 2: Update profile row with fields the trigger doesn't cover
    const extraUpdates: Record<string, unknown> = {};
    if (telefono) extraUpdates.telefono = telefono;
    if (ruolo) extraUpdates.ruolo = ruolo;

    if (Object.keys(extraUpdates).length > 0) {
      await getSupabaseAdmin()
        .from('utenti')
        .update(extraUpdates)
        .eq('id', authUserId);
    }

    // Step 3: Fetch the complete profile
    const { data: profile, error: profileError } = await getSupabaseAdmin()
      .from('utenti')
      .select(
        'id, username, nome, cognome, email, telefono, ruolo, livello_accesso, sezioni_abilitate, attivo, created_at'
      )
      .eq('id', authUserId)
      .single();

    if (profileError) {
      console.error('Profile fetch after creation failed:', profileError);
      res.status(500).json({
        success: false,
        error: 'Utente creato ma errore nel recupero profilo',
      });
      return;
    }

    authUserId = undefined; // Success — no cleanup needed
    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    // Compensate: clean up orphaned auth user if creation succeeded but something else threw
    if (authUserId) {
      await getSupabaseAdmin().auth.admin.deleteUser(authUserId).catch(() => {});
    }
    console.error('CreateUtente error:', error);
    res.status(500).json({ success: false, error: 'Errore nella creazione utente' });
  }
}

export async function updateUtente(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { nome, cognome, email, telefono, ruolo, livello_accesso, sezioni_abilitate, attivo } =
      req.body;

    // Prevent self-deactivation or self-demotion
    if (id === req.supabaseUserId) {
      if (attivo === false) {
        res.status(400).json({
          success: false,
          error: 'Non puoi disattivare il tuo stesso account',
        });
        return;
      }
      if (livello_accesso && livello_accesso !== 'modifica') {
        res.status(400).json({
          success: false,
          error: 'Non puoi rimuovere i tuoi permessi di modifica',
        });
        return;
      }
    }

    // Build update payload (only include provided fields)
    const updates: Record<string, unknown> = {};
    if (nome !== undefined) updates.nome = nome;
    if (cognome !== undefined) updates.cognome = cognome;
    if (email !== undefined) updates.email = email;
    if (telefono !== undefined) updates.telefono = telefono;
    if (ruolo !== undefined) updates.ruolo = ruolo;
    if (livello_accesso !== undefined) updates.livello_accesso = livello_accesso;
    if (sezioni_abilitate !== undefined) updates.sezioni_abilitate = sezioni_abilitate;
    if (attivo !== undefined) updates.attivo = attivo;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ success: false, error: 'Nessun campo da aggiornare' });
      return;
    }

    // If email is being changed, also update it in Supabase Auth
    if (email !== undefined) {
      const { error: authError } = await getSupabaseAdmin().auth.admin.updateUserById(id, {
        email,
      });
      if (authError) {
        res.status(400).json({
          success: false,
          error: authError.message || "Errore nell'aggiornamento email",
        });
        return;
      }
    }

    // If attivo is being toggled, also ban/unban in Supabase Auth
    if (attivo !== undefined) {
      const { error: banError } = await getSupabaseAdmin().auth.admin.updateUserById(id, {
        ban_duration: attivo ? 'none' : '876600h',
      });
      if (banError) {
        console.error('Ban/unban failed:', banError);
      }
    }

    // Update profile table
    const { data, error } = await getSupabaseAdmin()
      .from('utenti')
      .update(updates)
      .eq('id', id)
      .select(
        'id, username, nome, cognome, email, telefono, ruolo, livello_accesso, sezioni_abilitate, attivo, created_at, ultimo_accesso'
      )
      .single();

    if (error) {
      res.status(404).json({ success: false, error: 'Utente non trovato' });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('UpdateUtente error:', error);
    res.status(500).json({ success: false, error: "Errore nell'aggiornamento utente" });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'La nuova password deve avere almeno 6 caratteri',
      });
      return;
    }

    const { error } = await getSupabaseAdmin().auth.admin.updateUserById(id, {
      password: newPassword,
    });

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'Errore nel reset password',
      });
      return;
    }

    res.json({ success: true, message: 'Password reimpostata con successo' });
  } catch (error) {
    console.error('ResetPassword error:', error);
    res.status(500).json({ success: false, error: 'Errore nel reset password' });
  }
}

export async function deleteUtente(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.supabaseUserId) {
      res.status(400).json({
        success: false,
        error: 'Non puoi disattivare il tuo stesso account',
      });
      return;
    }

    // Soft delete: deactivate profile + ban auth user
    const { data, error } = await getSupabaseAdmin()
      .from('utenti')
      .update({ attivo: false })
      .eq('id', id)
      .select('id')
      .single();

    if (error || !data) {
      res.status(404).json({ success: false, error: 'Utente non trovato' });
      return;
    }

    // Ban the auth user to prevent login
    await getSupabaseAdmin().auth.admin.updateUserById(id, {
      ban_duration: '876600h',
    });

    res.json({ success: true, message: 'Utente disattivato con successo' });
  } catch (error) {
    console.error('DeleteUtente error:', error);
    res.status(500).json({ success: false, error: 'Errore nella disattivazione utente' });
  }
}
