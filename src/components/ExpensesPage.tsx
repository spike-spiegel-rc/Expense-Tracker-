import React, { useState } from 'react';
import { PaymentMethod } from '../types';
import { Calendar, DollarSign, FileText, PiggyBank, Save } from 'lucide-react';

interface ExpensesPageProps {
  categories: string[];
  onAddExpense: (date: string, category: string, paymentMethod: PaymentMethod, amount: number, note: string) => Promise<void>;
}

export default function ExpensesPage({ categories, onAddExpense }: ExpensesPageProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(categories[0] || 'Food');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto update pick if categories list changes
  React.useEffect(() => {
    if (categories.length && !categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!date) {
      alert("Please designate a valid voucher date.");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Please type an amount larger than 0.");
      return;
    }

    setLoading(true);
    try {
      await onAddExpense(date, category, paymentMethod, numAmount, note);
      // Reset form variables safely
      setAmount('');
      setNote('');
    } catch (err: any) {
      alert('Voucher allocation failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs max-w-2xl mx-auto p-6 md:p-8 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl">
          <PiggyBank className="w-5.5 h-5.5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Record New Expense</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Add an outbound cost transaction onto your central balance sheet</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-2 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Voucher Date</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 text-sm transition font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-widest mb-2 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Category</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 text-sm transition"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="dark:bg-slate-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-widest mb-2 flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Amount (AED)</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 text-sm transition font-mono-data"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-widest mb-2 flex items-center space-x-1.5">
              <span>Account Type</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-3 rounded-2xl cursor-pointer text-xs font-semibold text-center border transition ${
                  paymentMethod === 'cash'
                    ? 'border-slate-800 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                }`}
              >
                Cash Box
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                className={`py-3 rounded-2xl cursor-pointer text-xs font-semibold text-center border transition ${
                  paymentMethod === 'bank'
                    ? 'border-slate-800 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                }`}
              >
                Bank Portal
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-widest mb-2">
            Descriptive Memo Note
          </label>
          <textarea
            rows={3}
            placeholder="e.g., Carrefour weekly groceries purchases (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 text-sm transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 text-white cursor-pointer rounded-2xl font-bold flex items-center justify-center space-x-2 transition shadow-lg shadow-rose-600/10 active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Save className="w-4.5 h-4.5" />
              <span>Deploy Expense Voucher</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
