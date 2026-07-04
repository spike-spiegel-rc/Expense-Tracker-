import React, { useState } from 'react';
import { Tags, Plus, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface CategoriesPageProps {
  expenseCategories: string[];
  incomeCategories: string[];
  onAddCategory: (name: string, type: 'expense' | 'income') => Promise<void>;
  onDeleteCategory: (name: string) => Promise<void>;
}

export default function CategoriesPage({
  expenseCategories,
  incomeCategories,
  onAddCategory,
  onDeleteCategory
}: CategoriesPageProps) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCatName.trim();
    if (!cleanName) return;

    setLoading(true);
    try {
      await onAddCategory(cleanName, newCatType);
      setNewCatName('');
    } catch (err: any) {
      alert("Failed to insert custom category: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete category "${name}"? Operations using this category will remain unmodified, but it will be unselectable.`)) {
      return;
    }
    try {
      await onDeleteCategory(name);
    } catch (err: any) {
      alert("Failed to delete category: " + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto flex-1">
      {/* Category Creation Form */}
      <div className="glass-card-premium prism-border p-6 md:p-8 rounded-3xl pb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 rounded-2xl">
            <Tags className="w-5.5 h-5.5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Manage Categories</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Formulate personal custom classifications for expenses and income streams</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            required
            placeholder="e.g., Fuel, Subscriptions, Dividends"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200/50 dark:border-slate-800/70 text-slate-800 dark:text-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-sm transition font-sans shadow-xs"
            maxLength={35}
          />
          <div className="flex rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-1 bg-slate-50/75 dark:bg-slate-950/75 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <button
              type="button"
              onClick={() => setNewCatType('expense')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer select-none ${
                newCatType === 'expense' ? 'bg-white dark:bg-slate-800 shadow-xs text-rose-600 dark:text-rose-400 font-bold' : 'hover:bg-slate-100/30 dark:hover:bg-slate-800/30 text-slate-500'
              }`}
            >
              Expense Type
            </button>
            <button
              type="button"
              onClick={() => setNewCatType('income')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer select-none ${
                newCatType === 'income' ? 'bg-white dark:bg-slate-800 shadow-xs text-emerald-650 dark:text-emerald-450 font-bold' : 'hover:bg-slate-100/30 dark:hover:bg-slate-800/30 text-slate-500'
              }`}
            >
              Income Type
            </button>
          </div>
          <button
            type="submit"
            disabled={loading || !newCatName.trim()}
            className="py-3 px-6 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-2xl font-bold text-sm cursor-pointer disabled:opacity-50 inline-flex items-center justify-center space-x-1.5 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4 animate-pulse" />
            <span>Add Category</span>
          </button>
        </form>
      </div>

      {/* Categories lists visual groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Outbound Expense Categories list */}
        <div className="glass-card-premium prism-border p-6 rounded-3xl">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
            <ArrowUpRight className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <span>Expense Classifications</span>
          </h3>

          <div className="space-y-1">
            {expenseCategories.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-505">No custom classifications configured.</p>
            ) : (
              expenseCategories.map((cat) => (
                <div key={cat} className="flex justify-between items-center py-2 px-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 rounded-xl group transition">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{cat}</span>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/20 opacity-0 group-hover:opacity-100 transition-all font-sans"
                    title={`Delete category: ${cat}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Incoming Income Categories list */}
        <div className="glass-card-premium prism-border p-6 rounded-3xl">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
            <ArrowDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-450" />
            <span>Income Classifications</span>
          </h3>

          <div className="space-y-1">
            {incomeCategories.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-505">No custom classifications configured.</p>
            ) : (
              incomeCategories.map((cat) => (
                <div key={cat} className="flex justify-between items-center py-2 px-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 rounded-xl group transition">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{cat}</span>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/20 opacity-0 group-hover:opacity-100 transition-all font-sans"
                    title={`Delete category: ${cat}`}
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
