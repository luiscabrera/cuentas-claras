/** Minúsculas, sin tildes y sin espacios de más: para comparar nombres. */
export function normalizeName(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Nombre prolijo para guardar: sin espacios de más. */
export function cleanName(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export type RankedMerchant = { id: string; name: string; usage: number };

/** Busca un comercio por nombre sin importar mayúsculas ni tildes. */
export function findByName<T extends { name: string }>(
  items: readonly T[],
  name: string,
): T | undefined {
  const target = normalizeName(name);
  return target ? items.find((item) => normalizeName(item.name) === target) : undefined;
}

/**
 * Sugerencias para el autocompletado: los que contienen lo escrito, primero los
 * que empiezan igual y después los más usados.
 */
export function suggestMerchants<T extends RankedMerchant>(
  merchants: readonly T[],
  query: string,
  limit = 6,
): T[] {
  const q = normalizeName(query);
  return merchants
    .map((merchant) => ({ merchant, name: normalizeName(merchant.name) }))
    .filter(({ name }) => !q || name.includes(q))
    .sort((a, b) => {
      if (q) {
        const prefix = Number(b.name.startsWith(q)) - Number(a.name.startsWith(q));
        if (prefix !== 0) return prefix;
      }
      return b.merchant.usage - a.merchant.usage || a.name.localeCompare(b.name);
    })
    .slice(0, limit)
    .map(({ merchant }) => merchant);
}
