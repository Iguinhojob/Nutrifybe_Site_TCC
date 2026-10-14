// Leitura do plano alimentar salvo em paciente.prescricaoSemanal.
// O formato estruturado ({ version: 1, meals, notes }) é o mesmo usado antes; textos antigos continuam aceitos.

export function decodePlan(raw) {
  if (!raw) return { kind: 'empty', meals: [], notes: '' };
  try {
    const value = JSON.parse(raw);
    if (value?.version === 1 && Array.isArray(value.meals)) {
      return { kind: 'structured', meals: value.meals, notes: value.notes || '' };
    }
  } catch { /* plano antigo em texto livre */ }
  return { kind: 'legacy', meals: [], notes: raw };
}

const kcalOf = (meal) => {
  const s = String(meal?.calorias ?? '').trim().replace(',', '.');
  if (!s) return NaN;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

/**
 * Soma as calorias das refeições. Espelha a regra do backend (MetaCaloriasService):
 * se todas as refeições tiverem calorias, a soma vira a meta diária exibida no aplicativo.
 */
export function planTotals(meals) {
  const list = meals || [];
  const missing = list.filter((m) => !Number.isFinite(kcalOf(m))).length;
  const total = list.reduce((sum, m) => sum + (Number.isFinite(kcalOf(m)) ? kcalOf(m) : 0), 0);
  return { total, missing, complete: list.length > 0 && missing === 0, count: list.length };
}

export const META_ORIGEM = {
  plano: 'definida pelo plano alimentar',
  pessoal: 'definida pelo próprio paciente no aplicativo',
  padrao: 'padrão do aplicativo (o paciente ainda não definiu uma meta)',
};
