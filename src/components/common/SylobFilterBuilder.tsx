import { useState, useMemo } from 'react';
import { Plus, X, Search, RotateCcw, ChevronDown, ChevronUp, SlidersHorizontal, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilterFieldDef, FilterRule, MatchMode, SylobOperator } from '../../types/sylobFilter';

const TEXT_OPERATORS: { label: string; value: SylobOperator }[] = [
  { label: 'Contient', value: 'contains' },
  { label: 'Ne contient pas', value: 'not_contains' },
  { label: 'Commence par', value: 'starts_with' },
  { label: 'Ne commence pas par', value: 'not_starts_with' },
  { label: 'Se termine par', value: 'ends_with' },
  { label: 'Ne se termine pas par', value: 'not_ends_with' },
  { label: 'Égal exactement à', value: 'eq' },
  { label: 'Différent de', value: 'neq' },
  { label: 'Renseigné (non vide)', value: 'is_set' },
  { label: 'Non renseigné (vide)', value: 'is_not_set' },
];

const NUMERIC_DATE_OPERATORS: { label: string; value: SylobOperator }[] = [
  { label: 'Égal à', value: 'eq' },
  { label: 'Différent de', value: 'neq' },
  { label: 'Supérieur strictement à', value: 'gt' },
  { label: 'Supérieur ou égal à', value: 'gte' },
  { label: 'Inférieur strictement à', value: 'lt' },
  { label: 'Inférieur ou égal à', value: 'lte' },
  { label: 'Compris dans l\'intervalle', value: 'between' },
  { label: 'Renseigné', value: 'is_set' },
  { label: 'Non renseigné', value: 'is_not_set' },
];

interface Props {
  fields: FilterFieldDef[];
  rules: FilterRule[];
  matchMode: MatchMode;
  onApply: (rules: FilterRule[], mode: MatchMode) => void;
  totalCount: number;
}

export default function SylobFilterBuilder({ fields, rules, matchMode, onApply, totalCount }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [localRules, setLocalRules] = useState<FilterRule[]>(rules);
  const [localMode, setLocalMode] = useState<MatchMode>(matchMode);

  const groupedFields = useMemo(() => {
    return fields.reduce<Record<string, FilterFieldDef[]>>((acc, f) => {
      const cat = f.category || 'Général';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(f);
      return acc;
    }, {});
  }, [fields]);

  const addRule = () => {
    if (fields.length === 0) return;
    const defaultField = fields[0];
    const newRule: FilterRule = {
      id: crypto.randomUUID(),
      fieldKey: defaultField.key,
      operator: defaultField.type === 'text' ? 'contains' : 'eq',
      value: '',
      value2: '',
    };
    setLocalRules((prev) => [...prev, newRule]);
    setIsOpen(true);
  };

  const removeRule = (id: string) => {
    const updated = localRules.filter((r) => r.id !== id);
    setLocalRules(updated);
    onApply(updated, localMode);
  };

  const updateRule = (id: string, updates: Partial<FilterRule>) => {
    setLocalRules((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...updates };
        if (updates.fieldKey) {
          const fieldDef = fields.find((f) => f.key === updates.fieldKey);
          if (fieldDef) {
            updated.operator = fieldDef.type === 'text' ? 'contains' : 'eq';
            updated.value = '';
            updated.value2 = '';
          }
        }
        return updated;
      })
    );
  };

  const handleApply = () => {
    onApply(localRules, localMode);
  };

  const handleReset = () => {
    setLocalRules([]);
    onApply([], localMode);
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden mb-8 transition-all font-sans">
      <div className="px-8 py-5 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/30 border-b border-slate-100/80">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-md shadow-slate-900/10">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base tracking-tight">Filtre Multicritère Avancé</h3>
              {localRules.length > 0 && (
                <span className="bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                  <Sparkles size={11} /> {localRules.length} actif(s)
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
              {totalCount} résultat(s) correspondant(s)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={addRule}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={15} /> Nouveau critère
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
            title="Afficher/Masquer le détail"
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-8 space-y-4">
              {localRules.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/40">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Aucun critère actif. Cliquez sur <span className="text-emerald-600">"Nouveau critère"</span> pour commencer.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {localRules.map((rule) => {
                    const currentField = fields.find((f) => f.key === rule.fieldKey) || fields[0];
                    const availableOps =
                      currentField.type === 'number' || currentField.type === 'date'
                        ? NUMERIC_DATE_OPERATORS
                        : TEXT_OPERATORS;
                    const noValueRequired = rule.operator === 'is_set' || rule.operator === 'is_not_set';

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={rule.id}
                        className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-slate-50/70 hover:bg-slate-50 p-2.5 rounded-2xl border border-slate-100 transition-colors"
                      >
                        <button
                          onClick={() => removeRule(rule.id)}
                          className="w-9 h-9 rounded-xl bg-white text-slate-300 hover:text-rose-500 hover:bg-rose-50 border border-slate-100 flex items-center justify-center transition-all cursor-pointer shrink-0"
                          title="Supprimer ce critère"
                        >
                          <X size={15} />
                        </button>

                        <div className="w-full sm:w-1/3 min-w-[180px]">
                          <select
                            value={rule.fieldKey}
                            onChange={(e) => updateRule(rule.id, { fieldKey: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-extrabold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs cursor-pointer"
                          >
                            {Object.entries(groupedFields).map(([category, catFields]) => (
                              <optgroup key={category} label={category} className="font-bold text-slate-400">
                                {catFields.map((f) => (
                                  <option key={f.key} value={f.key} className="font-bold text-slate-800">
                                    {f.label}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>

                        <div className="w-full sm:w-1/4 min-w-[160px]">
                          <select
                            value={rule.operator}
                            onChange={(e) => updateRule(rule.id, { operator: e.target.value as SylobOperator })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs cursor-pointer"
                          >
                            {availableOps.map((op) => (
                              <option key={op.value} value={op.value} className="font-bold text-slate-800">
                                {op.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {!noValueRequired && (
                          <div className="flex-1 flex items-center gap-2 min-w-[200px]">
                            {rule.operator === 'between' ? (
                              <div className="flex items-center gap-2 w-full">
                                <input
                                  type={currentField.type === 'number' ? 'number' : currentField.type === 'date' ? 'date' : 'text'}
                                  placeholder="Valeur min..."
                                  value={rule.value || ''}
                                  onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                                  className="w-1/2 px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs placeholder:text-slate-300"
                                />
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">à</span>
                                <input
                                  type={currentField.type === 'number' ? 'number' : currentField.type === 'date' ? 'date' : 'text'}
                                  placeholder="Valeur max..."
                                  value={rule.value2 || ''}
                                  onChange={(e) => updateRule(rule.id, { value2: e.target.value })}
                                  className="w-1/2 px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs placeholder:text-slate-300"
                                />
                              </div>
                            ) : currentField.type === 'select' && currentField.options ? (
                              <select
                                value={rule.value || ''}
                                onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-extrabold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs cursor-pointer"
                              >
                                <option value="">Toutes les options</option>
                                {currentField.options.map((opt) => (
                                  <option key={String(opt.value)} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={currentField.type === 'number' ? 'number' : currentField.type === 'date' ? 'date' : 'text'}
                                placeholder="Saisir une valeur..."
                                value={rule.value || ''}
                                onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs placeholder:text-slate-300"
                              />
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Condition :</span>
                  <div className="bg-slate-100 p-1 rounded-2xl flex items-center shadow-inner">
                    <button
                      onClick={() => setLocalMode('all')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        localMode === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      Tous les critères (ET)
                    </button>
                    <button
                      onClick={() => setLocalMode('any')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        localMode === 'any' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      Au moins un (OU)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {localRules.length > 0 && (
                    <button
                      onClick={handleReset}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw size={13} /> Réinitialiser
                    </button>
                  )}
                  <button
                    onClick={handleApply}
                    className="px-7 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-slate-900/10 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                  >
                    <Search size={14} /> Appliquer le filtre
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}