import React, { useState } from 'react';
import { Budget } from '../types';
import { PieChart, Save, Info } from 'lucide-react';

interface BudgetsPageProps {
  expenseCategories: string[];
  initialBudgets: Budget;
  onSaveBudgets: (newBudgets: Budget) => Promise<void>;
}

export default function BudgetsPage({
  expenseCategories,
  initialBudgets,
  onSaveBudgets
}: BudgetsPageProps) {
  const [formBudgets, setFormBudgets] = useState<Budget>(() => {
    const defaultData: Budget = {};
    expenseCategories.forEach(cat => {
      defaultData[cat] = initialBudgets[cat] || 0;
    });
    return defaultData;
  });

  const [loading, setLoading] = useState(false);

  // Sync state if base selections change
  React.useEffect(() => {
    const updated: Budget = {};
    expenseCategories.forEach(cat => {
      updated[cat] = formBudgets[cat] !== undefined ? formBudgets[cat] : (initialBudgets[cat] || 0);
    });
    setFormBudgets(updated);
  }, [expenseCategories, initialBudgets]);

  const handleValueChange = (cat: string, val: string) => {
    const parsed = parseFloat(val);
    setFormBudgets(prev => ({
      ...prev,
      [cat]: isNaN(parsed) ? 0 : parsed
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Filter out zero entries
      const cleanBudgets: Budget = {};
      Object.entries(formBudgets).forEach(([cat, amount]) => {
        const numAmt = Number(amount);
        if (numAmt > 0) {
          cleanBudgets[cat] = numAmt;
        }
      });
      await onSaveBudgets(cleanBudgets);
    } catch (err: any) {
      alert("Could not update budget limits: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card-premium prism-border max-w-2xl mx-auto p-6 md:p-8 rounded-3xl pb-8 flex-1">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2.5 bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-450 rounded-2xl">
          <PieChart className="w-5.5 h-5.5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Define Monthly Budget Caps</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure monthly maximum limits across your custom expense fields</p>
        </div>
      </div>

      <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-950/50 rounded-2xl text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-6 flex items-start space-x-2.5">
        <Info className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
        <span>
          Budgets are used to compute horizontal progress alerts in your primary dashboard. Let any inputs set to <strong>0</strong> remain as unbudgeted (limitless) categories.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="divide-y divide-slate-100 dark:divide-slate-800/40 border border-slate-200/55 dark:border-slate-850/60 rounded-2xl p-4 overflow-hidden bg-slate-50/25 dark:bg-slate-950/40">
          {expenseCategories.map((cat) => (
            <div key={cat} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-305 min-w-[120px]">{cat}</span>
              <div className="relative w-full max-w-xs">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="No threshold set (0.00)"
                  value={formBudgets[cat] || ''}
                  onChange={(e) => handleValueChange(cat, e.target.value)}
                  className="w-full pl-12 pr-4 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500/80 text-xs font-mono-data transition"
                />
                <span className="absolute left-4 top-2.5 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">AED</span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-50 text-white dark:text-slate-950 cursor-pointer rounded-2xl font-bold flex items-center justify-center space-x-2 transition shadow-lg active:scale-[0.99] disabled:opacity-50 text-sm font-sans"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Save className="w-4.5 h-4.5" />
              <span>Save Budget Allocations</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
