export interface ConfigurazioneTempiCiclo {
  id: number;
  categoria: string;
  ton_ora: number;
  tempo_setup_minuti: number;
  tempo_pulizia_minuti: number;
  attivo: boolean;
  updated_at: string;
}
