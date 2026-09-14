import { FilterRule, MatchMode, FilterFieldDef } from '../types/sylobFilter';

export function evaluateSylobRules<T>(
  items: T[],
  rules: FilterRule[],
  matchMode: MatchMode,
  fieldDefs: FilterFieldDef[]
): T[] {
  if (!rules || rules.length === 0) return items;

  const fieldDefMap = new Map(fieldDefs.map((f) => [f.key, f]));

  return items.filter((item: any) => {
    const results = rules.map((rule) => {
      const fieldDef = fieldDefMap.get(rule.fieldKey);
      if (!fieldDef) return true;

      const rawVal = item[rule.fieldKey];
      const op = rule.operator;
      const targetVal = rule.value;

      if (op === 'is_set') {
        return rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== '';
      }
      if (op === 'is_not_set') {
        return rawVal === null || rawVal === undefined || String(rawVal).trim() === '';
      }

      if (rawVal === null || rawVal === undefined) return false;

      if (fieldDef.type === 'number') {
        const num = Number(rawVal);
        const t1 = Number(targetVal);
        const t2 = Number(rule.value2);
        switch (op) {
          case 'eq': return num === t1;
          case 'neq': return num !== t1;
          case 'gt': return num > t1;
          case 'gte': return num >= t1;
          case 'lt': return num < t1;
          case 'lte': return num <= t1;
          case 'between': return num >= Math.min(t1, t2) && num <= Math.max(t1, t2);
          default: return true;
        }
      }

      if (fieldDef.type === 'date') {
        const d = new Date(rawVal).getTime();
        const t1 = new Date(targetVal).getTime();
        const t2 = rule.value2 ? new Date(rule.value2).getTime() : 0;
        switch (op) {
          case 'eq': return new Date(rawVal).toDateString() === new Date(targetVal).toDateString();
          case 'neq': return new Date(rawVal).toDateString() !== new Date(targetVal).toDateString();
          case 'gt': return d > t1;
          case 'gte': return d >= t1;
          case 'lt': return d < t1;
          case 'lte': return d <= t1;
          case 'between': return d >= Math.min(t1, t2) && d <= Math.max(t1, t2);
          default: return true;
        }
      }

      const str = String(rawVal).toLowerCase();
      const targetStr = String(targetVal || '').toLowerCase();

      switch (op) {
        case 'contains': return str.includes(targetStr);
        case 'not_contains': return !str.includes(targetStr);
        case 'starts_with': return str.startsWith(targetStr);
        case 'not_starts_with': return !str.startsWith(targetStr);
        case 'ends_with': return str.endsWith(targetStr);
        case 'not_ends_with': return !str.endsWith(targetStr);
        case 'eq': return str === targetStr;
        case 'neq': return str !== targetStr;
        default: return true;
      }
    });

    return matchMode === 'all' ? results.every(Boolean) : results.some(Boolean);
  });
}