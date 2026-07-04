import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatAED, formatDateUAE } from '../utils';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { CalendarRange, TrendingUp, TrendingDown, Landmark, ReceiptText, ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

interface MonthlyReportPageProps {
  transactions: Transaction[];
}

const monthsList = [
  { value: '01', name: 'January', short: 'Jan' },
  { value: '02', name: 'February', short: 'Feb' },
  { value: '03', name: 'March', short: 'Mar' },
  { value: '04', name: 'April', short: 'Apr' },
  { value: '05', name: 'May', short: 'May' },
  { value: '06', name: 'June', short: 'Jun' },
  { value: '07', name: 'July', short: 'Jul' },
  { value: '08', name: 'August', short: 'Aug' },
  { value: '09', name: 'September', short: 'Sep' },
  { value: '10', name: 'October', short: 'Oct' },
  { value: '11', name: 'November', short: 'Nov' },
  { value: '12', name: 'December', short: 'Dec' }
];

export default function MonthlyReportPage({ transactions }: MonthlyReportPageProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const yearsList = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const txYears = transactions.map(t => {
      if (!t.date) return currentYear;
      return new Date(`${t.date}T00:00:00`).getFullYear();
    });
    const validYears = txYears.filter(y => !isNaN(y) && y > 2000 && y < 2100);
    const minYear = Math.min(currentYear - 4, ...validYears);
    const maxYear = Math.max(currentYear + 1, ...validYears);
    
    const list = [];
    for (let y = maxYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [transactions]);

  const [currentYearValue, currentMonthValue] = useMemo(() => {
    if (!selectedMonth) return ['', ''];
    const parts = selectedMonth.split('-');
    return [parts[0] || '', parts[1] || ''];
  }, [selectedMonth]);

  const goToPreviousMonth = () => {
    let y = parseInt(currentYearValue || String(new Date().getFullYear()), 10);
    let m = parseInt(currentMonthValue || '01', 10);
    m--;
    if (m < 1) {
      m = 12;
      y--;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    let y = parseInt(currentYearValue || String(new Date().getFullYear()), 10);
    let m = parseInt(currentMonthValue || '01', 10);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  // Calculate stats based on month selection
  const monthlyStats = useMemo(() => {
    // If not selectedMonth, compute for ALL transactions
    const monthTx = !selectedMonth 
      ? transactions 
      : (() => {
          const [year, monthStr] = selectedMonth.split('-');
          const targetYear = parseInt(year, 10);
          const targetMonthIdx = parseInt(monthStr, 10) - 1;
          return transactions.filter(t => {
            const d = new Date(`${t.date}T00:00:00`);
            return d.getFullYear() === targetYear && d.getMonth() === targetMonthIdx;
          });
        })();

    const activeMonthTx = monthTx.filter(t => t.status !== 'cancelled');

    let income = 0;
    let expense = 0;
    const expenseCategoriesMap: { [cat: string]: number } = {};

    activeMonthTx.forEach(t => {
      const amt = Number(t.amount || 0);
      if (t.type === 'income') {
        income += amt;
      } else {
        expense += amt;
        expenseCategoriesMap[t.category] = (expenseCategoriesMap[t.category] || 0) + amt;
      }
    });

    const categoriesChartData = Object.entries(expenseCategoriesMap).map(([name, value]) => ({
      name,
      Amount: parseFloat(value.toFixed(2))
    }));

    return {
      allTransactions: monthTx,
      income,
      expense,
      balance: income - expense,
      categoriesChartData
    };
  }, [transactions, selectedMonth]);

  const maxExpenseCategory = useMemo(() => {
    if (!monthlyStats || !monthlyStats.categoriesChartData.length) return null;
    return [...monthlyStats.categoriesChartData].sort((a, b) => b.Amount - a.Amount)[0];
  }, [monthlyStats]);

  return (
    <div className="space-y-6">
      {/* Month picker selection */}
      <div className="glass-card-premium prism-border p-5 md:p-6 flex flex-col gap-5 rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <CalendarRange className="w-5 h-5 text-indigo-500 shrink-0" />
              <span>Monthly Review Notebook</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pick any past calendar month to run custom density analysis</p>
          </div>
          
          <div className="flex items-center gap-1.5 self-start md:self-auto flex-wrap">
            {/* Prev month button */}
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month select */}
            <div className="relative">
              <select
                value={currentMonthValue}
                onChange={(e) => {
                  const y = currentYearValue || String(new Date().getFullYear());
                  setSelectedMonth(`${y}-${e.target.value}`);
                }}
                className="appearance-none pl-3.5 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-xs font-bold cursor-pointer transition min-w-[125px]"
              >
                <option value="" disabled className="dark:bg-slate-900">Select Month</option>
                {monthsList.map(m => (
                  <option key={m.value} value={m.value} className="dark:bg-slate-900">{m.name}</option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Year select */}
            <div className="relative">
              <select
                value={currentYearValue}
                onChange={(e) => {
                  const m = currentMonthValue || '01';
                  setSelectedMonth(`${e.target.value}-${m}`);
                }}
                className="appearance-none pl-3.5 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-xs font-bold font-mono cursor-pointer transition min-w-[95px]"
              >
                <option value="" disabled className="dark:bg-slate-900">Select Year</option>
                {yearsList.map(y => (
                  <option key={y} value={y} className="dark:bg-slate-900">{y}</option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider">YR</span>
              </div>
            </div>

            {/* Next month button */}
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Clear Selection Button */}
            {selectedMonth && (
              <button
                type="button"
                onClick={() => setSelectedMonth('')}
                className="py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 border border-rose-100 dark:border-rose-900/50"
                title="Clear Date Filter"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {monthlyStats ? (
        <>
          {/* Quick summaries widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card-premium prism-border p-5 rounded-3xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {selectedMonth ? 'Monthly Receipts' : 'Total Receipts'}
              </span>
              <div className="mt-4">
                <div className="text-xl font-bold text-emerald-650 dark:text-emerald-400 font-mono-data">{formatAED(monthlyStats.income)}</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  {selectedMonth ? 'Total revenue during month' : 'Total accumulated revenue all-time'}
                </p>
              </div>
            </div>

            <div className="glass-card-premium prism-border p-5 rounded-3xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {selectedMonth ? 'Monthly Outflows' : 'Total Outflows'}
              </span>
              <div className="mt-4">
                <div className="text-xl font-bold text-rose-500 dark:text-rose-400 font-mono-data">{formatAED(monthlyStats.expense)}</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  {selectedMonth ? 'Total spending during month' : 'Total accumulated spending all-time'}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">
                {selectedMonth ? 'Net Surplus' : 'General Ledger Surplus'}
              </span>
              <div className="mt-4">
                <div className="text-xl font-bold font-mono-data truncate text-slate-100">{formatAED(monthlyStats.balance)}</div>
                <p className="text-[10px] text-indigo-300 mt-1">
                  {selectedMonth ? 'Remaining operational cash' : 'Remaining cash over all recorded periods'}
                </p>
              </div>
            </div>
          </div>

          {/* Chart element */}
          {monthlyStats.categoriesChartData.length > 0 && (
            <div className="glass-card-premium prism-border p-6 rounded-3xl">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6">
                {selectedMonth ? 'Monthly Spending Bar Breakdown' : 'All-Time Spending Bar Breakdown'}
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyStats.categoriesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip 
                      formatter={(value) => `${formatAED(Number(value))}`}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, border: 'none', color: '#fff', fontSize: 11 }} 
                    />
                    <Bar dataKey="Amount" radius={[10, 10, 0, 0]}>
                      {monthlyStats.categoriesChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#f43f5e" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {maxExpenseCategory && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-450">
                  <span>Heavy leakage category:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-205">
                    {maxExpenseCategory.name} ({formatAED(maxExpenseCategory.Amount)})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Month's voucher subtable */}
          <div className="glass-card-premium prism-border p-6 rounded-3xl">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
              <ReceiptText className="w-4 h-4 text-emerald-500" />
              <span>{selectedMonth ? 'Statement for Selected Interval' : 'Full Transaction General Ledger'}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-widest font-semibold">
                    <th className="py-2.5 px-2">Vch</th>
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2">Type</th>
                    <th className="py-2.5 px-2">Category</th>
                    <th className="py-2.5 px-2 text-right">Amount</th>
                    <th className="py-2.5 px-2 text-center">Account</th>
                    <th className="py-2.5 px-2">Memo Note</th>
                    <th className="py-2.5 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {monthlyStats.allTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 italic dark:text-slate-504">
                        {selectedMonth ? 'No vouchers matching selected calendar month.' : 'No vouchers recorded on active balance sheets.'}
                      </td>
                    </tr>
                  ) : (
                    monthlyStats.allTransactions.map((t, idx) => {
                      const isExpense = t.type === 'expense';
                      const isCancelled = t.status === 'cancelled';
                      return (
                        <tr key={t.id || idx} className={`${isCancelled ? 'line-through text-slate-400 dark:text-slate-506 opacity-60' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'} transition`}>
                          <td className="py-3 px-2 font-mono font-bold text-slate-900 dark:text-white">{t.voucherNumber}</td>
                          <td className="py-3 px-2 font-mono-data opacity-90">{formatDateUAE(t.date)}</td>
                          <td className="py-3 px-2">
                            <span className="inline-flex items-center space-x-1 font-semibold text-[10px] uppercase">
                              <span className={`w-1.5 h-1.5 rounded-full ${isExpense ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                              <span className={isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-450'}>
                                {t.type}
                              </span>
                            </span>
                          </td>
                          <td className="py-3 px-2 font-semibold text-slate-850 dark:text-slate-200">{t.category}</td>
                          <td className={`py-3 px-2 text-right font-mono-data font-bold ${isExpense ? 'text-rose-605 dark:text-rose-403' : 'text-emerald-605 dark:text-emerald-403'}`}>
                            {formatAED(t.amount)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-505 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] uppercase font-semibold">
                              {t.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-540 dark:text-slate-400 truncate max-w-[120px]" title={t.note}>{t.note || '-'}</td>
                          <td className="py-3 px-2 text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              isCancelled ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card-premium prism-border p-12 text-center text-slate-400 dark:text-slate-500 font-medium rounded-3xl">
          Select any past month using the controls above to populate metrics.
        </div>
      )}
    </div>
  );
}
