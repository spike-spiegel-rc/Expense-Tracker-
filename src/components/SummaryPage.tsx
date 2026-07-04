import React, { useMemo } from 'react';
import { LentBorrowedRecord } from '../types';
import { formatAED } from '../utils';
import { Users, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';

interface SummaryPageProps {
  lentItems: LentBorrowedRecord[];
  borrowedItems: LentBorrowedRecord[];
}

export default function SummaryPage({ lentItems, borrowedItems }: SummaryPageProps) {
  // Aggregate peer positions
  const calculations = useMemo(() => {
    const lentByPerson: { [name: string]: { lent: number; repaid: number } } = {};
    lentItems
      .filter(item => item.recordStatus !== 'cancelled')
      .forEach(item => {
        const n = item.name.trim();
        if (!lentByPerson[n]) lentByPerson[n] = { lent: 0, repaid: 0 };
        lentByPerson[n].lent += Number(item.amount || 0);
        lentByPerson[n].repaid += Number(item.repaid || 0);
      });

    const borrowedByPerson: { [name: string]: { borrowed: number; repaid: number } } = {};
    borrowedItems
      .filter(item => item.recordStatus !== 'cancelled')
      .forEach(item => {
        const n = item.name.trim();
        if (!borrowedByPerson[n]) borrowedByPerson[n] = { borrowed: 0, repaid: 0 };
        borrowedByPerson[n].borrowed += Number(item.amount || 0);
        borrowedByPerson[n].repaid += Number(item.repaid || 0);
      });

    const totalsLentAll = Object.values(lentByPerson).reduce((s, d) => s + (d.lent - d.repaid), 0);
    const totalsBorrowedAll = Object.values(borrowedByPerson).reduce((s, d) => s + (d.borrowed - d.repaid), 0);

    return {
      lentByPerson: Object.entries(lentByPerson).map(([name, data]) => ({
        name,
        lent: data.lent,
        repaid: data.repaid,
        remaining: data.lent - data.repaid
      })),
      borrowedByPerson: Object.entries(borrowedByPerson).map(([name, data]) => ({
        name,
        borrowed: data.borrowed,
        repaid: data.repaid,
        remaining: data.borrowed - data.repaid
      })),
      totalOwedToYou: totalsLentAll,
      totalYouOwe: totalsBorrowedAll,
      netPosition: totalsLentAll - totalsBorrowedAll
    };
  }, [lentItems, borrowedItems]);

  return (
    <div className="space-y-6 flex-1">
      {/* KPI Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Owed To You */}
        <div className="glass-card-premium prism-border p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Aggregate Owed to You</span>
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 rounded-lg"><ArrowUpRight className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-emerald-650 dark:text-emerald-400 truncate font-mono-data">{formatAED(calculations.totalOwedToYou)}</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Outstanding receivables</p>
          </div>
        </div>

        {/* Total You Owe */}
        <div className="glass-card-premium prism-border p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Aggregate You Owe</span>
            <span className="p-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 rounded-lg"><ArrowDownRight className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-rose-500 dark:text-rose-400 truncate font-mono-data">{formatAED(calculations.totalYouOwe)}</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Outstanding liabilities</p>
          </div>
        </div>

        {/* Net Asset Position */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-indigo-200">Interpersonal Net</span>
            <span className="p-1.5 bg-slate-800 text-slate-400 rounded-lg"><Scale className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold truncate font-mono-data text-slate-100">{formatAED(calculations.netPosition)}</div>
            <p className="text-[10px] text-indigo-300 mt-1 font-sans">Unified balance index</p>
          </div>
        </div>
      </div>

      {/* Detail breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Owed To You */}
        <div className="glass-card-premium prism-border p-6 rounded-3xl">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Debtors List (Owed to You)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-widest font-semibold font-sans">
                  <th className="py-2.5 px-2">Friend</th>
                  <th className="py-2.5 px-2 text-right">Total Lent</th>
                  <th className="py-2.5 px-2 text-right">Repaid</th>
                  <th className="py-2.5 px-2 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                {calculations.lentByPerson.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400 dark:text-slate-500 italic font-sans">No outstanding ledger items found.</td>
                  </tr>
                ) : (
                  calculations.lentByPerson.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 text-slate-700 dark:text-slate-300 transition">
                      <td className="py-3 px-2 font-semibold text-slate-900 dark:text-white">{item.name}</td>
                      <td className="py-3 px-2 text-right font-mono-data opacity-90">{formatAED(item.lent)}</td>
                      <td className="py-3 px-2 text-right font-mono-data text-slate-500 dark:text-slate-400">{formatAED(item.repaid)}</td>
                      <td className="py-3 px-2 text-right font-mono-data font-bold text-emerald-600 dark:text-emerald-400">{formatAED(item.remaining)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* You Owe */}
        <div className="glass-card-premium prism-border p-6 rounded-3xl">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
            <ArrowDownRight className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
            <span>Creditors List (You Owe)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-widest font-semibold font-sans">
                  <th className="py-2.5 px-2">Friend</th>
                  <th className="py-2.5 px-2 text-right">Total Borrowed</th>
                  <th className="py-2.5 px-2 text-right">Repaid</th>
                  <th className="py-2.5 px-2 text-right">Remaining Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                {calculations.borrowedByPerson.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400 dark:text-slate-500 italic font-sans">No active liabilities recorded.</td>
                  </tr>
                ) : (
                  calculations.borrowedByPerson.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 text-slate-700 dark:text-slate-300 transition">
                      <td className="py-3 px-2 font-semibold text-slate-900 dark:text-white">{item.name}</td>
                      <td className="py-3 px-2 text-right font-mono-data opacity-90">{formatAED(item.borrowed)}</td>
                      <td className="py-3 px-2 text-right font-mono-data text-slate-500 dark:text-slate-400">{formatAED(item.repaid)}</td>
                      <td className="py-3 px-2 text-right font-mono-data font-bold text-rose-500 dark:text-rose-400">{formatAED(item.remaining)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
