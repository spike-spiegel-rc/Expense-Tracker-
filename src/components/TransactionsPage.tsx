import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, VoucherStatus, SyncStatus } from '../types';
import { formatDateUAE, formatAED } from '../utils';
import { Search, SlidersHorizontal, Edit3, Trash2, RotateCcw, Cloud, CloudOff, FileSpreadsheet } from 'lucide-react';

interface TransactionsPageProps {
  transactions: Transaction[];
  onOpenEditModal: (id: string) => void;
  onCancelVoucher: (id: string) => void;
  onRestoreVoucher: (id: string) => void;
}

export default function TransactionsPage({
  transactions,
  onOpenEditModal,
  onCancelVoucher,
  onRestoreVoucher
}: TransactionsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | VoucherStatus>('active');
  
  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  // Extract unique categories across all present vouchers for dynamic dropdown filter options
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => {
      if (t.category) {
        cats.add(t.category);
      }
    });
    return Array.from(cats).sort();
  }, [transactions]);

  const hasActiveAdvancedFilters = useMemo(() => {
    return categoryFilter !== 'all' || startDate !== '' || endDate !== '' || minAmount !== '' || maxAmount !== '';
  }, [categoryFilter, startDate, endDate, minAmount, maxAmount]);

  const handleResetFilters = () => {
    setCategoryFilter('all');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('active');
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const searchStr = [
        t.voucherNumber,
        t.category,
        t.note,
        t.paymentMethod,
        t.status,
        t.syncStatus
      ].join(' ').toLowerCase();

      const matchesSearch = searchQuery === '' || searchStr.includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      
      // Category filter check
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

      // Date range filter check
      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && t.date >= startDate;
      }
      if (endDate) {
        matchesDate = matchesDate && t.date <= endDate;
      }

      // Amount range filter check
      let matchesAmount = true;
      const tAmt = Number(t.amount || 0);
      if (minAmount !== '') {
        matchesAmount = matchesAmount && tAmt >= Number(minAmount);
      }
      if (maxAmount !== '') {
        matchesAmount = matchesAmount && tAmt <= Number(maxAmount);
      }

      return matchesSearch && matchesType && matchesStatus && matchesCategory && matchesDate && matchesAmount;
    });
  }, [transactions, searchQuery, typeFilter, statusFilter, categoryFilter, startDate, endDate, minAmount, maxAmount]);

  return (
    <div className="glass-card-premium prism-border p-6 rounded-3xl flex-1">
      {/* Table Header Filter controls */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Voucher Audit Ledger</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Query, verify, or amend registered financial cash vouchers</p>
          </div>
        </div>

        {/* Search controls & Filters Drawer Indicator */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by voucher number, category, payments account, or memo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:border-slate-400 dark:focus:border-slate-700/50 focus:bg-white text-sm transition font-sans dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:focus:bg-slate-950"
            />
            <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-400" />
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-3 border rounded-2xl flex items-center justify-center space-x-2 text-sm font-semibold transition cursor-pointer select-none whitespace-nowrap ${
              showAdvancedFilters 
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800/80'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Advanced Filters</span>
            {hasActiveAdvancedFilters && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-slate-900 animate-pulse" />
            )}
          </button>
        </div>

        {/* Advanced Filters Drawer Panel */}
        {showAdvancedFilters && (
          <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Filter by Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-250 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-450 focus:bg-white font-medium"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Date range inputs */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Date Interval Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  placeholder="Start"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-400"
                />
                <input
                  type="date"
                  placeholder="End"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            {/* Amount Bounds */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Amount Range (AED)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-750 dark:text-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-400"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-750 dark:text-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            {/* Clear/Reset indicators */}
            <div className="md:col-span-3 flex justify-between items-center bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] text-slate-400">
                {hasActiveAdvancedFilters ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active filtering constraints are applied to live voucher stream.</span>
                ) : (
                  <span>No parameters configured yet (showing all matching database streams).</span>
                )}
              </div>
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
              >
                <span>Reset All Filters</span>
              </button>
            </div>
          </div>
        )}

        {/* Filters control bar (Type & Status triggers) */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Voucher type Filter */}
          <div className="flex bg-slate-100 dark:bg-slate-950 rounded-xl p-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                typeFilter === 'all' ? 'bg-white dark:bg-slate-800 shadow-xs text-slate-900 dark:text-white font-bold' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                typeFilter === 'income' ? 'bg-white dark:bg-slate-800 shadow-xs text-emerald-600 dark:text-emerald-400 font-bold' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                typeFilter === 'expense' ? 'bg-white dark:bg-slate-800 shadow-xs text-rose-600 dark:text-rose-400 font-bold' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
              }`}
            >
              Expense
            </button>
          </div>

          {/* Status filter */}
          <div className="flex bg-slate-100 dark:bg-slate-950 rounded-xl p-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'active' ? 'bg-white dark:bg-slate-800 shadow-xs text-slate-900 dark:text-white font-bold' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
              }`}
            >
              Active Only
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'cancelled' ? 'bg-white dark:bg-slate-800 shadow-xs text-rose-500 dark:text-rose-400 font-bold' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
              }`}
            >
              Cancelled
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-white dark:bg-slate-800 shadow-xs text-slate-900 dark:text-white font-bold' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
              }`}
            >
              All Statuses
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[9px] tracking-widest font-semibold">
              <th className="py-3 px-2">Voucher No</th>
              <th className="py-3 px-2">Date</th>
              <th className="py-3 px-2">Type</th>
              <th className="py-3 px-2">Category</th>
              <th className="py-3 px-2 text-right">Amount</th>
              <th className="py-3 px-2 text-center">Account</th>
              <th className="py-3 px-2">Memo Note</th>
              <th className="py-3 px-2 text-center">Cloud Sync</th>
              <th className="py-3 px-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                  No matching registered transaction vouchers found.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => {
                const isExpense = t.type === 'expense';
                const isCancelled = t.status === 'cancelled';
                const syncStatus = t.syncStatus || 'synced';

                return (
                  <tr key={t.id} className={`${isCancelled ? 'line-through text-slate-400 opacity-60' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/20'} transition`}>
                    <td className="py-3.5 px-2 font-mono font-bold text-slate-900 dark:text-slate-150">{t.voucherNumber}</td>
                    <td className="py-3.5 px-2 font-mono-data">{formatDateUAE(t.date)}</td>
                    <td className="py-3.5 px-2">
                       <span className="inline-flex items-center space-x-1 font-semibold text-[10px] uppercase">
                        <span className={`w-1.5 h-1.5 rounded-full ${isExpense ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        <span className={isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          {t.type}
                        </span>
                      </span>
                    </td>
                    <td className="py-3.5 px-2 font-semibold">{t.category}</td>
                    <td className={`py-3.5 px-2 text-right font-mono-data font-bold ${isExpense ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}`}>
                      {formatAED(t.amount)}
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                        {t.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 font-normal truncate max-w-[150px] dark:text-slate-400" title={t.note}>
                      {t.note || <span className="text-slate-300 dark:text-slate-700">-</span>}
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      {syncStatus === 'synced' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full font-bold text-[9px] uppercase tracking-wider">
                          <Cloud className="w-3 h-3" />
                          <span>Synced</span>
                        </span>
                      ) : syncStatus === 'pending_sync' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 rounded-full font-bold text-[9px] uppercase tracking-wider animate-pulse">
                          <span>Pending</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-400 rounded-full font-bold text-[9px] uppercase tracking-wider">
                          <CloudOff className="w-3 h-3" />
                          <span>Offline</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-right space-x-1.5 whitespace-nowrap">
                      {isCancelled ? (
                        <button
                          onClick={() => onRestoreVoucher(t.id)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition"
                          title="Restore Voucher"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => onOpenEditModal(t.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-305 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition"
                            title="Edit details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => onCancelVoucher(t.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 dark:bg-rose-955/40 text-rose-600 dark:text-rose-350 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition"
                            title="Cancel Voucher"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
