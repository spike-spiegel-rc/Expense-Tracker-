import React, { useState, useEffect } from 'react';
import { PaymentMethod } from '../types';
import { 
  X, 
  PiggyBank, 
  Landmark, 
  HandHelping, 
  ArrowDownLeft, 
  DollarSign, 
  Calendar, 
  User, 
  FileText, 
  Check 
} from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseCategories: string[];
  incomeCategories: string[];
  onAddExpense: (date: string, category: string, method: PaymentMethod, amount: number, note: string) => Promise<void>;
  onAddIncome: (date: string, category: string, method: PaymentMethod, amount: number, note: string) => Promise<void>;
  onAddLent: (name: string, amount: number, date: string, dueDate: string | null, method: PaymentMethod, note: string) => Promise<void>;
  onAddBorrowed: (name: string, amount: number, date: string, dueDate: string | null, method: PaymentMethod, note: string) => Promise<void>;
  darkMode: boolean;
}

type QuickAddType = 'expense' | 'income' | 'lent' | 'borrowed';

export function QuickAddModal({
  isOpen,
  onClose,
  expenseCategories,
  incomeCategories,
  onAddExpense,
  onAddIncome,
  onAddLent,
  onAddBorrowed,
  darkMode
}: QuickAddModalProps) {
  const [activeType, setActiveType] = useState<QuickAddType>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  
  // Type-specific states
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize category when categories load or active type changes
  useEffect(() => {
    if (activeType === 'expense' && expenseCategories.length > 0) {
      setCategory(expenseCategories[0]);
    } else if (activeType === 'income' && incomeCategories.length > 0) {
      setCategory(incomeCategories[0]);
    }
  }, [activeType, expenseCategories, incomeCategories]);

  // Reset basic inputs on modal open
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setMethod('cash');
      setNote('');
      setName('');
      setDueDate('');
      setActiveType('expense');
      if (expenseCategories.length > 0) {
        setCategory(expenseCategories[0]);
      }
    }
  }, [isOpen, expenseCategories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert("Please enter a valid amount greater than zero.");
      return;
    }
    if (!date) {
      alert("Please select a date.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeType === 'expense') {
        await onAddExpense(date, category || expenseCategories[0] || 'Other', method, numAmt, note.trim());
      } else if (activeType === 'income') {
        await onAddIncome(date, category || incomeCategories[0] || 'Other', method, numAmt, note.trim());
      } else if (activeType === 'lent') {
        if (!name.trim()) {
          alert("Please enter the counter party name.");
          setIsSubmitting(false);
          return;
        }
        await onAddLent(name.trim(), numAmt, date, dueDate ? dueDate : null, method, note.trim());
      } else if (activeType === 'borrowed') {
        if (!name.trim()) {
          alert("Please enter the counter party name.");
          setIsSubmitting(false);
          return;
        }
        await onAddBorrowed(name.trim(), numAmt, date, dueDate ? dueDate : null, method, note.trim());
      }
      onClose();
    } catch (error: any) {
      alert("Submission failed: " + (error?.message || error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const typesConfig = [
    { id: 'expense', name: 'Expense', icon: PiggyBank, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' },
    { id: 'income', name: 'Income', icon: Landmark, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' },
    { id: 'lent', name: 'Lent Out', icon: HandHelping, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/30' },
    { id: 'borrowed', name: 'Borrowed', icon: ArrowDownLeft, color: 'text-rose-400 bg-rose-50 dark:bg-rose-950/30' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div 
        id="quick-add-modal-container"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white" id="quick-add-modal-title">
              Quick Ledger Entry
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select ledger series and record capital instances instantly.
            </p>
          </div>
          <button
            id="quick-add-modal-close"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Type Tabs */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl mb-6">
          {typesConfig.map((t) => {
            const IconComponent = t.icon;
            const isSelected = activeType === t.id;
            return (
              <button
                key={t.id}
                id={`quick-add-tab-${t.id}`}
                type="button"
                onClick={() => setActiveType(t.id)}
                className={`py-2 px-1 rounded-xl cursor-pointer text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition ${
                  isSelected
                    ? 'bg-white dark:bg-slate-850 shadow-xs text-slate-900 dark:text-white font-bold'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`} />
                <span className="text-[9px] md:text-[10px] tracking-tight">{t.name}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Amount input always on top */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              Value Amount (AED)
            </label>
            <div className="relative">
              <input
                id="quick-add-amount-input"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-semibold font-mono-data focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 focus:bg-white dark:focus:bg-slate-950"
              />
              <div className="absolute left-3 top-3 text-slate-400 dark:text-slate-500">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Common field: Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                Transacted Date
              </label>
              <div className="relative">
                <input
                  id="quick-add-date-input"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl text-xs font-mono focus:outline-none focus:border-slate-400 dark:focus:border-slate-700"
                />
                <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Dynamic field based on activeType */}
            {(activeType === 'expense' || activeType === 'income') ? (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  Category Select
                </label>
                <select
                  id="quick-add-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-slate-400 dark:focus:border-slate-700"
                >
                  {(activeType === 'expense' ? expenseCategories : incomeCategories).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  Counter Party Name
                </label>
                <div className="relative w-full">
                  <input
                    id="quick-add-party-input"
                    type="text"
                    required
                    placeholder="Friend/Entity Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl text-xs focus:outline-none focus:border-slate-400 dark:focus:border-slate-705"
                  />
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* Peer debt specific: Due Date */}
          {(activeType === 'lent' || activeType === 'borrowed') && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                Due Date Option (Settlement Window)
              </label>
              <div className="relative">
                <input
                  id="quick-add-duedate-input"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-805 dark:text-white rounded-xl text-xs font-mono focus:outline-none focus:border-slate-400 dark:focus:border-slate-700"
                />
                <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              Deposit Account Source / Gateway
            </label>
            <div className="grid grid-cols-2 gap-3" id="quick-add-method-group">
              <button
                id="quick-add-method-cash"
                type="button"
                onClick={() => setMethod('cash')}
                className={`py-2 px-1 rounded-xl cursor-pointer text-xs font-bold text-center border transition ${
                  method === 'cash'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-1000/10 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Cash Pool float
              </button>
              <button
                id="quick-add-method-bank"
                type="button"
                onClick={() => setMethod('bank')}
                className={`py-2 px-1 rounded-xl cursor-pointer text-xs font-bold text-center border transition ${
                  method === 'bank'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-1000/10 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Bank Portal checking
              </button>
            </div>
          </div>

          {/* Memo notes Input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              Reference Memo Notes
            </label>
            <div className="relative">
              <textarea
                id="quick-add-note-input"
                rows={2}
                placeholder="Log secondary particulars..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl text-xs focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 font-medium"
              />
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Submission and Action buttons */}
          <div className="flex gap-3 pt-3">
            <button
              id="quick-add-modal-cancel"
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition rounded-xl text-center cursor-pointer font-bold"
            >
              Cancel
            </button>
            <button
              id="quick-add-modal-submit"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-center cursor-pointer font-bold transition flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              {isSubmitting ? (
                <span>Publishing...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Publish Ledger Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
