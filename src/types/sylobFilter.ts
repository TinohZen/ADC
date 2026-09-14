export type FieldType = 'text' | 'number' | 'date' | 'select';

export type SylobOperator =
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'not_starts_with'
  | 'ends_with'
  | 'not_ends_with'
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'is_set'
  | 'is_not_set';

export interface FilterFieldDef {
  key: string;
  label: string;
  type: FieldType;
  category?: string;
  options?: { label: string; value: string | number }[];
}

export interface FilterRule {
  id: string;
  fieldKey: string;
  operator: SylobOperator;
  value: any;
  value2?: any;
}

export type MatchMode = 'all' | 'any';