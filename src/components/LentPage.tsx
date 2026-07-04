import React, { useState } from 'react';
import { LentBorrowedRecord, PaymentMethod } from '../types';
import { formatDateUAE, formatAED } from '../utils';
import { HandHelping, Save, Calendar, User, DollarSign, FileText, Landmark, Edit3, Trash2, CheckSquare } from 'lucide-react';

interface LentPageProps {
  lentItems: LentBorrowedRecord[];
  onAddLent: (name: string, amount: number, date: string, dueDate: string | null, paymentMethod: PaymentMethod, note: string) => Promise<void>;
  onCancelLent: (id: string) => void;
  onRestoreLent: (id: string) => void;
  onOpenRepayModal: (id: string) => void;
  onOpenEditModal: (id: string) => void;
}

export default function LentPage({
  lentItems,
  onAddLent,
  onCancelLent,
  onRestoreLent,
  onOpenRepayModal,
  onOpenEditModal
}: LentPageProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const numAmount = parseFloat(amount);
    if (!cleanName || isNaN(numAmount) || numAmount <= 0 || !date) {
      alert("Please fill in all requested fields correctly.");
      return;
    }

    setLoading(true);
    try {
      await onAddLent(cleanName, numAmount, date, dueDate || null, paymentMethod, note);
      setName('');
      setAmount('');
      setDueDate('');
      setNote('');
    } catch (err: any) {
      alert("Failed to lodge lent record: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Recording Form container */}
      <div className="glass-card-premium prism-border p-6 md:p-8 rounded-3xl pb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-violet-50 dark:bg-violet-950/30 text-violet-605 dark:text-violet-400 rounded-2xl">
            <HandHelping className="w-5.5 h-5.5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Lend Capital to a Friend</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Record capital you lend out to teammates or friends as short-term assets</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center space-x-1.5 font-sans">
                <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Friend's Full Name</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Ahmed Mansoor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200/50 dark:border-slate-800/70 text-slate-800 dark:text-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-sm transition font-sans shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center space-x-1.5 font-sans">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Amount Lent (AED)</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200/50 dark:border-slate-800/70 text-slate-800 dark:text-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-sm transition font-mono-data shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center space-x-1.5 font-sans">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Date Transacted</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full px-4 py-3 bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200/50 dark:border-slate-800/70 text-slate-800 dark:text-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-sm transition font-mono shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center space-x-1.5 font-sans">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Maturity Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200/50 dark:border-slate-800/70 text-slate-800 dark:text-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-sm transition font-mono shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center space-x-1.5 font-sans">
                <Landmark className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Source Asset Account</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-3 rounded-2xl cursor-pointer text-xs font-semibold text-center border transition ${
                    paymentMethod === 'cash'
                      ? 'border-transparent bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'border-slate-200/60 bg-slate-50/70 text-slate-600 dark:border-slate-800/80 dark:bg-slate-950/50 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`py-3 rounded-2xl cursor-pointer text-xs font-semibold text-center border transition ${
                    paymentMethod === 'bank'
                      ? 'border-transparent bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'border-slate-200/60 bg-slate-50/70 text-slate-600 dark:border-slate-800/80 dark:bg-slate-950/50 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  Bank
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center space-x-1.5 font-sans">
              <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Memo / Agreement Reference Note</span>
            </label>
            <textarea
              rows={2}
              placeholder="Provide repayment details or notes regarding mutual agreement terms (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200/50 dark:border-slate-800/70 text-slate-800 dark:text-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-sm transition shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-violet-600 hover:bg-violet-750 text-white cursor-pointer rounded-2xl font-bold flex items-center justify-center space-x-2 transition shadow-lg shadow-violet-600/15 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-4.5 h-4.5" />
                <span>Lodge Lent Record & Expense Voucher</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Lent Records History Table */}
      <div className="glass-card-premium prism-border p-6 rounded-3xl">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
          <HandHelping className="w-4 h-4 text-violet-500" />
          <span>Active Asset Receivables</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/70 text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-widest font-semibold font-sans">
                <th className="py-3 px-2">Person</th>
                <th className="py-3 px-2 text-right">Lent Amount</th>
                <th className="py-3 px-2">Date</th>
                <th className="py-3 px-2">Due Date</th>
                <th className="py-3 px-2 text-right">Received Back</th>
                <th className="py-3 px-2 text-center">Receipt Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
              {lentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 dark:text-slate-504 italic">
                    No outbound lent accounts found.
                  </td>
                </tr>
              ) : (
                lentItems.map((item) => {
                  const isCancelled = item.recordStatus === 'cancelled';
                  const remaining = Number(item.amount || 0) * 100 - Number(item.repaid || 0) * 100;
                  const leftAED = remaining / 100;

                  return (
                    <tr key={item.id} className={`${isCancelled ? 'line-through text-slate-400 dark:text-slate-506 opacity-60' : 'text-slate-700 dark:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'} transition`}>
                      <td className="py-3.5 px-2 font-semibold text-slate-900 dark:text-white">{item.name}</td>
                      <td className="py-3.5 px-2 text-right font-mono-data font-bold text-slate-800 dark:text-slate-100">{formatAED(item.amount)}</td>
                      <td className="py-3.5 px-2 font-mono-data opacity-90">{formatDateUAE(item.date)}</td>
                      <td className="py-3.5 px-2 font-mono-data opacity-90">{item.dueDate ? formatDateUAE(item.dueDate) : '-'}</td>
                      <td className="py-3.5 px-2 text-right font-mono-data">
                        <span className="font-semibold text-emerald-650 dark:text-emerald-400">{formatAED(item.repaid)}</span>
                        {!isCancelled && leftAED > 0 && (
                          <span className="block text-[9px] text-slate-400 dark:text-slate-505">({formatAED(leftAED)} remaining)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        {isCancelled ? (
                          <span className="inline-block px-2 py-0.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full text-[9px] font-bold uppercase tracking-wider">
                            Cancelled
                          </span>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            item.status === 'paid' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' 
                              : item.status === 'partial' 
                              ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' 
                              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-705 dark:text-amber-400'
                          }`}>
                            {item.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-right space-x-1.5 whitespace-nowrap">
                        {isCancelled ? (
                          <button
                            onClick={() => onRestoreLent(item.id)}
                            className="px-2.5 py-1 text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-350 rounded-lg cursor-pointer transition select-none"
                          >
                            Restore
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => onOpenEditModal(item.id)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-450 hover:bg-sky-100 dark:hover:bg-sky-950/45 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition"
                              title="Edit record parameters"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            {item.status !== 'paid' && (
                              <button
                                onClick={() => onOpenRepayModal(item.id)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/45 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition"
                                title="Lodge payback instalment"
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                                <span>Repay</span>
                              </button>
                            )}
                            <button
                              onClick={() => onCancelLent(item.id)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-401 hover:bg-rose-100 dark:hover:bg-rose-950/45 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition"
                              title="Cancel record"
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
    </div>
  );
}
