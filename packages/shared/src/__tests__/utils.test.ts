import { describe, it, expect } from 'vitest';
import { calcolaDurataPrevista } from '../utils/calcolo-durata';
import { convertiInKg } from '../utils/conversioni';

describe('calcolaDurataPrevista', () => {
  it('calculates basic duration with setup only', () => {
    // 10000 kg at 5 ton/ora = 10t * 60/5 = 120 min lavorazione + 30 setup = 150
    // Rounded to nearest 15: 150
    const result = calcolaDurataPrevista(10000, 5, 30, 15, false);
    expect(result).toBe(150);
  });

  it('includes pulizia when cambio prodotto', () => {
    // 10000 kg at 5 ton/ora = 120 lavorazione + 30 setup + 15 pulizia = 165
    // Rounded to nearest 15: 165 -> already multiple of 15
    const result = calcolaDurataPrevista(10000, 5, 30, 15, true);
    expect(result).toBe(165);
  });

  it('rounds up to nearest 15 minutes', () => {
    // 5000 kg at 5 ton/ora = 5t * 60/5 = 60 lavorazione + 10 setup = 70
    // Rounded up to 75
    const result = calcolaDurataPrevista(5000, 5, 10, 15, false);
    expect(result).toBe(75);
  });

  it('handles small quantities', () => {
    // 100 kg at 5 ton/ora = 0.1t * 60/5 = 1.2 lavorazione + 30 setup = 31.2
    // Rounded up to 45
    const result = calcolaDurataPrevista(100, 5, 30, 15, false);
    expect(result).toBe(45);
  });

  it('returns 15 for very small result', () => {
    // 100 kg at 10 ton/ora = 0.1*60/10 = 0.6 + 5 setup = 5.6
    // Rounded up to 15
    const result = calcolaDurataPrevista(100, 10, 5, 0, false);
    expect(result).toBe(15);
  });
});

describe('convertiInKg', () => {
  it('converts kg to kg (identity)', () => {
    expect(convertiInKg(100, 'kg')).toBe(100);
  });

  it('converts ton to kg', () => {
    expect(convertiInKg(5, 'ton')).toBe(5000);
  });

  it('converts sacchi to kg (25 kg each)', () => {
    expect(convertiInKg(100, 'sacchi')).toBe(2500);
  });

  it('converts pallet to kg (1000 kg each)', () => {
    expect(convertiInKg(3, 'pallet')).toBe(3000);
  });

  it('throws on unknown unit', () => {
    expect(() => convertiInKg(100, 'litri')).toThrow('Unita di misura non supportata: litri');
  });
});
