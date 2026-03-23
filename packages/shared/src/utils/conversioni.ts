const CONVERSIONI_KG: Record<string, number> = {
  kg: 1,
  ton: 1000,
  sacchi: 25,
  pallet: 1000,
};

export function convertiInKg(quantita: number, unita: string): number {
  const fattore = CONVERSIONI_KG[unita];
  if (!fattore) throw new Error(`Unita di misura non supportata: ${unita}`);
  return quantita * fattore;
}
