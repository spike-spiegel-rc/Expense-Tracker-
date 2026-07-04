import React, { useState, useEffect } from 'react';
import { Transaction, LentBorrowedRecord, PaymentMethod } from '../types';
import { formatDateUAE, formatAED } from '../utils';
import { EyeOff, Save, CheckCircle, Info, Calendar, User, DollarSign, FileText } from 'lucide-react';

// ==========================================
// 1. EDIT TRANSACTION MODAL
// ==========================================
interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  expenseCategories: string[];
  incomeCategories: string[];
  onClose: () => void;
  onSave: (id: string, date: string, category: string, amount: number, note: string) => Promise<void>;
}

export function EditTransactionModal({
  isOpen,
  transaction,
  expenseCategories,
  incomeCategories,
  onClose,
  onSave
}: EditTransactionModalProps) {
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setDate(transaction.date);
      setCategory(transaction.category);
      setAmount(String(transaction.amount));
      setNote(transaction.note || '');
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const catsList = transaction.type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!date) {
      alert("Invalid date");
      return;
    }
    if (isNaN(numAmt) || numAmt <= 0) {
      alert("Amount must be greater than zero");
      return;
    }

    setSaving(true);
    try {
      await onSave(transaction.id, date, category, numAmt, note);
      onClose();
    } catch (err: any) {
      alert("Failed saving voucher: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800/80 p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Amending Voucher: {transaction.voucherNumber}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Modify details regarding your logged capital flows.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-550 focus:bg-white dark:focus:bg-slate-950 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Vch Series Type</label>
              <input
                type="text"
                disabled
                value={transaction.type.toUpperCase()}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/20 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold font-sans cursor-not-allowed uppercase"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Payment Method</label>
              <input
                type="text"
                disabled
                value={transaction.paymentMethod.toUpperCase()}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/20 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold font-sans cursor-not-allowed uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Category Select</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-550 focus:bg-white dark:focus:bg-slate-950 transition"
            >
              {catsList.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-900">{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Value Amount</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-mono-data focus:outline-none focus:border-indigo-550 focus:bg-white dark:focus:bg-slate-950 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Memo Notes</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-550 focus:bg-white dark:focus:bg-slate-950 transition"
            />
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start space-x-2 border border-slate-100 dark:border-slate-800/40">
            <Info className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 select-none" />
            <span>
              Series indices and payment accounts are lock-hashed to secure ledger continuity. To modify, cancel this voucher and initialize a new entry.
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-center cursor-pointer font-bold transition select-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-xs bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-50 text-white dark:text-slate-950 rounded-xl text-center cursor-pointer font-bold transition flex items-center justify-center space-x-1.5 disabled:opacity-50 select-none font-sans"
            >
              {saving ? 'Saving...' : 'Deploy Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ==========================================
// 2. RECORD REPAYMENT INSTALMENT MODAL
// ==========================================
interface RecordRepaymentModalProps {
  isOpen: boolean;
  recordType: 'lent' | 'borrowed' | null;
  recordId: string | null;
  lentItems: LentBorrowedRecord[];
  borrowedItems: LentBorrowedRecord[];
  onClose: () => void;
  onSaveRepayment: (type: 'lent' | 'borrowed', id: string, amount: number, date: string, paymentMethod: PaymentMethod) => Promise<void>;
}

export function RecordRepaymentModal({
  isOpen,
  recordType,
  recordId,
  lentItems,
  borrowedItems,
  onClose,
  onSaveRepayment
}: RecordRepaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [saving, setSaving] = useState(false);

  const matchedRecord = React.useMemo(() => {
    if (!recordId || !recordType) return null;
    const list = recordType === 'lent' ? lentItems : borrowedItems;
    return list.find(i => i.id === recordId) || null;
  }, [recordId, recordType, lentItems, borrowedItems]);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod(matchedRecord?.paymentMethod || 'cash');
    }
  }, [isOpen, matchedRecord]);

  if (!isOpen || !recordType || !recordId || !matchedRecord) return null;

  const maxValueLeft = matchedRecord.amount - matchedRecord.repaid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }
    if (numAmt > maxValueLeft + 0.01) {
      alert(`The entry cannot exceed the remaining outstanding balance of ${formatAED(maxValueLeft)}.`);
      return;
    }
    if (!date) {
      alert("Invalid date entry.");
      return;
    }

    setSaving(true);
    try {
      await onSaveRepayment(recordType, recordId, numAmt, date, paymentMethod);
      onClose();
    } catch (err: any) {
      alert("Repayment logging failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800/80 p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Record Installment Repayment</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-sans">
          Lodge an incoming/outgoing repayment installment for {matchedRecord.name}.
        </p>

        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl text-[11px] text-slate-650 dark:text-slate-350 font-mono-data space-y-1 mb-4 border border-slate-100 dark:border-slate-850/60">
          <div>Original Sum: {formatAED(matchedRecord.amount)}</div>
          <div>Settled Sum: {formatAED(matchedRecord.repaid)}</div>
          <div className="font-bold text-indigo-600 dark:text-indigo-400">Outstanding Residual: {formatAED(maxValueLeft)}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Repayment Value</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder={`AED 0.00 (Max: ${maxValueLeft.toFixed(2)})`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-mono-data focus:outline-none focus:indigo-550 focus:bg-white dark:focus:bg-slate-950 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Valuation Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-mono focus:outline-none focus:indigo-550 focus:bg-white dark:focus:bg-slate-950 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 flex justify-between">
              <span>Deposit Account</span>
            </label>
            <div className="grid grid-cols-2 gap-3 font-sans">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-1 rounded-xl cursor-pointer text-xs font-semibold text-center border transition select-none ${
                  paymentMethod === 'cash'
                    ? 'border-slate-800 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/50'
                }`}
              >
                Cash Pool
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                className={`py-2 px-1 rounded-xl cursor-pointer text-xs font-semibold text-center border transition select-none ${
                  paymentMethod === 'bank'
                    ? 'border-slate-800 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/50'
                }`}
              >
                Bank Portal
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs text-slate-650 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-center cursor-pointer font-bold transition select-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white dark:text-white rounded-xl text-center cursor-pointer font-bold transition flex items-center justify-center space-x-1.5 disabled:opacity-50 shadow-sm select-none"
            >
              {saving ? 'Logging...' : 'Certify Repayment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ==========================================
// 3. EDIT PEER RECORD MODAL (LENT / BORROWED)
// ==========================================
interface EditPeerRecordModalProps {
  isOpen: boolean;
  recordType: 'lent' | 'borrowed' | null;
  record: LentBorrowedRecord | null;
  onClose: () => void;
  onSaveRecord: (
    type: 'lent' | 'borrowed',
    id: string,
    updates: {
      name: string;
      amount: number;
      repaid: number;
      date: string;
      dueDate: string | null;
      paymentMethod: PaymentMethod;
      note: string;
    }
  ) => Promise<void>;
}

export function EditPeerRecordModal({
  isOpen,
  recordType,
  record,
  onClose,
  onSaveRecord
}: EditPeerRecordModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [repaid, setRepaid] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setName(record.name);
      setAmount(String(record.amount));
      setRepaid(String(record.repaid));
      setDate(record.date);
      setDueDate(record.dueDate || '');
      setPaymentMethod(record.paymentMethod || 'cash');
      setNote(record.note || '');
    }
  }, [record]);

  if (!isOpen || !recordType || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const numAmt = parseFloat(amount);
    const numRepaid = parseFloat(repaid);

    if (!cleanName || isNaN(numAmt) || numAmt <= 0 || isNaN(numRepaid) || numRepaid < 0 || !date) {
      alert("Fill in all inputs correctly.");
      return;
    }
    if (numRepaid > numAmt) {
      alert("Settled value cannot exceed original amount.");
      return;
    }

    setSaving(true);
    try {
      await onSaveRecord(recordType, record.id, {
        name: cleanName,
        amount: numAmt,
        repaid: numRepaid,
        date,
        dueDate: dueDate || null,
        paymentMethod,
        note
      });
      onClose();
    } catch (err: any) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800/80 p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Edit {recordType === 'lent' ? 'Lent' : 'Borrowed'} Account</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-sans">Modify indices, repayment aggregates, or description terms of peer ledger.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-1 flex items-center space-x-1 font-sans">
              <User className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <span>Counter Party Name</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:indigo-550 focus:bg-white dark:focus:bg-slate-950 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-1 flex items-center space-x-1 font-sans">
                <DollarSign className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                <span>Total Amount</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-xl text-xs font-mono focus:outline-none focus:indigo-550 focus:bg-white dark:focus:bg-slate-950 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-1 flex items-center space-x-1 font-sans">
                <CheckCircle className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                <span>Already Settled</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={repaid}
                onChange={(e) => setRepaid(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-xl text-xs font-mono focus:outline-none focus:indigo-550 focus:bg-white dark:focus:bg-slate-950 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-1 flex items-center space-x-1 font-sans">
                <Calendar className="w-3 h-3 text-slate-400" dark:text-slate-500 />
                <span>Date Transacted</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-mono focus:outline-none focus:indigo-550 focus:bg-white dark:focus:bg-slate-950 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-1 flex items-center space-x-1 font-sans">
                <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-mono focus:outline-none focus:indigo-550 focus:bg-white dark:focus:bg-slate-950 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Source/Destination Account</label>
            <div className="grid grid-cols-2 gap-3 font-sans">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-1 rounded-xl cursor-pointer text-xs font-semibold text-center border transition select-none ${
                  paymentMethod === 'cash'
                    ? 'border-slate-800 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 hover:bg-slate-800/30'
                }`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                className={`py-2 px-1 rounded-xl cursor-pointer text-xs font-semibold text-center border transition select-none ${
                  paymentMethod === 'bank'
                    ? 'border-slate-800 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 hover:bg-slate-800/30'
                }`}
              >
                Bank
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 flex items-center space-x-1 font-sans">
              <FileText className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <span>Reference Agreement Note</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-center cursor-pointer font-bold transition select-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-xs bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-center cursor-pointer font-bold transition flex items-center justify-center space-x-1.5 disabled:opacity-50 select-none font-sans"
            >
              {saving ? 'Saving...' : 'Deploy Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
