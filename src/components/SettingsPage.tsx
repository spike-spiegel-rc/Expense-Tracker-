import React, { useState, useMemo, useEffect } from 'react';
import { Transaction } from '../types';
import { formatDateUAE, formatAED } from '../utils';
import { 
  Settings, 
  User, 
  Mail, 
  Database, 
  RotateCcw, 
  AlertTriangle, 
  ShieldCheck,
  Check,
  AlertCircle,
  Info,
  Activity,
  Clock,
  Archive,
  Save,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsPageProps {
  userId: string;
  email: string;
  onUpdateUserId: (newId: string) => Promise<void>;
  onUpdateEmail: (newEmail: string) => Promise<void>;
  onFixVoucherNumbers: () => Promise<void>;
  transactions: Transaction[];
  onRestoreVoucher: (id: string) => void;
}

interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function SettingsPage({
  userId,
  email,
  onUpdateUserId,
  onUpdateEmail,
  onFixVoucherNumbers,
  transactions,
  onRestoreVoucher
}: SettingsPageProps) {
  const [profileId, setProfileId] = useState(userId);
  const [profileEmail, setProfileEmail] = useState(email);
  const [updatingId, setUpdatingId] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [fixingVouchers, setFixingVouchers] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'maintenance' | 'archives'>('profile');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  // Keep state matching props if outer props modify
  useEffect(() => {
    setProfileId(userId);
  }, [userId]);

  useEffect(() => {
    setProfileEmail(email);
  }, [email]);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const handleUpdateIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileId.trim() === userId) return;
    setUpdatingId(true);
    try {
      await onUpdateUserId(profileId.trim());
      triggerToast("User ID updated successfully!", "success");
    } catch (err: any) {
      triggerToast("Could not update User ID: " + err.message, "error");
    } finally {
      setUpdatingId(false);
    }
  };

  const handleUpdateEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileEmail.trim() === email) return;
    setUpdatingEmail(true);
    try {
      await onUpdateEmail(profileEmail.trim());
      triggerToast("Linked verification email changed successfully!", "success");
    } catch (err: any) {
      triggerToast("Could not update Email: " + err.message, "error");
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleFixVoucherSequences = async () => {
    setShowConfirmModal(false);
    setFixingVouchers(true);
    try {
      await onFixVoucherNumbers();
      triggerToast("Chronological voucher re-indexing completed successfully!", "success");
    } catch (err: any) {
      triggerToast("Database sequence alignment failed: " + err.message, "error");
    } finally {
      setFixingVouchers(false);
    }
  };

  const cancelledVouchersList = useMemo(() => {
    return transactions.filter(t => t.status === 'cancelled');
  }, [transactions]);

  const stats = useMemo(() => {
    const total = transactions.length;
    const active = transactions.filter(t => t.status !== 'cancelled').length;
    const cancelled = transactions.filter(t => t.status === 'cancelled').length;
    return { total, active, cancelled };
  }, [transactions]);

  const hasIdChanges = profileId.trim() !== userId && profileId.trim().length > 0;
  const hasEmailChanges = profileEmail.trim() !== email && profileEmail.trim().length > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto flex-1 font-sans relative">
      {/* Title Header Block */}
      <div className="glass-card-premium prism-border p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-3xl gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 rounded-2xl shadow-inner animate-spin-slow">
            <Settings className="w-5.5 h-5.5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account & Database Management</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">Maintain identities, audit registries, and run sequence maintenance</p>
          </div>
        </div>
        
        {/* Simple System Health Badge */}
        <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/40 dark:border-emerald-900/30 px-3.5 py-1.5 rounded-full self-start sm:self-auto select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest leading-none">Database Healthy</span>
        </div>
      </div>

      {/* Visual Live Status KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sync Card */}
        <div className="glass-card-premium prism-border p-4 rounded-3xl flex items-center justify-between hover:scale-[1.01] transition-transform duration-200">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Ledger Sync Rating</span>
            <div className="flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono-data">100% Realtime</span>
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/15 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        {/* Active Transactions Card */}
        <div className="glass-card-premium prism-border p-4 rounded-3xl flex items-center justify-between hover:scale-[1.01] transition-transform duration-200">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Active Registry Book</span>
            <div className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono-data">{stats.active} entries</span>
            </div>
          </div>
          <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/15 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <span className="text-[10px] font-bold font-mono text-indigo-600 dark:text-indigo-400">CPV/CRV</span>
          </div>
        </div>

        {/* Archived Card */}
        <div className="glass-card-premium prism-border p-4 rounded-3xl flex items-center justify-between hover:scale-[1.01] transition-transform duration-200">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Cancelled Vouchers</span>
            <div className="flex items-center space-x-1.5">
              <Archive className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono-data">{stats.cancelled} logs</span>
            </div>
          </div>
          <div className="p-2.5 bg-rose-50/50 dark:bg-rose-950/15 text-rose-600 dark:text-rose-400 rounded-xl">
            <span className="text-[10px] font-bold text-rose-500">VOID</span>
          </div>
        </div>
      </div>

      {/* Elegant Nav Segments */}
      <div className="flex border-b border-slate-100 dark:border-slate-800/80 p-1 space-x-1 md:space-x-1.5 max-w-xl bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 md:py-2.5 px-2 md:px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 select-none ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/20'
          }`}
        >
          <User className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Profile & Identity</span>
          <span className="inline sm:hidden">Identity</span>
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex-1 py-2 md:py-2.5 px-2 md:px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 select-none ${
            activeTab === 'maintenance'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/20'
          }`}
        >
          <Database className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Ledger Clean Up</span>
          <span className="inline sm:hidden">Clean Up</span>
        </button>
        <button
          onClick={() => setActiveTab('archives')}
          className={`flex-1 py-2 md:py-2.5 px-2 md:px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 select-none ${
            activeTab === 'archives'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/20'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Void Archive</span>
          <span className="inline sm:hidden">Archive</span>
          {stats.cancelled > 0 && (
            <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full select-none animate-pulse shrink-0">
              {stats.cancelled}
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels with animations */}
      <div className="relative min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="w-full"
          >
            {/* ====== PROFILE & IDENTITY TAB ====== */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* User ID Section */}
                <div className="glass-card-premium prism-border p-6 rounded-3xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                        <User className="w-4 h-4 text-indigo-500" />
                        <span>Account Alias Handle</span>
                      </h3>
                      {hasIdChanges ? (
                        <span className="text-[9px] bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider select-none animate-pulse">Unsaved</span>
                      ) : (
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-md flex items-center space-x-1 select-none">
                          <Check className="w-2.5 h-2.5" />
                          <span>Aligned</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-5 font-sans">
                      Establish a distinctive personal alias to bind your records under a synchronized cloud profile.
                    </p>

                    <form onSubmit={handleUpdateIdSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 font-sans">
                          Custom User ID Alias
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={profileId}
                            onChange={(e) => setProfileId(e.target.value)}
                            placeholder="e.g., ahmed_uae"
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 text-xs font-sans transition ${
                              hasIdChanges 
                                ? 'border-amber-400 dark:border-amber-900/60 focus:border-amber-500' 
                                : 'border-slate-205 dark:border-slate-800 focus:border-indigo-505'
                            }`}
                          />
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={updatingId || !hasIdChanges}
                        className={`w-full py-2.5 font-bold text-xs rounded-xl transition duration-150 flex items-center justify-center space-x-2 select-none ${
                          hasIdChanges 
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer hover:shadow-md' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {updatingId ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Alias Identifier</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-slate-205 dark:border-slate-800/40 text-[10px] text-slate-400 dark:text-slate-500 flex items-start space-x-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                    <span>Handle requires minimum 4 letters/digits and can include decimals or dashes.</span>
                  </div>
                </div>

                {/* Email Update Card */}
                <div className="glass-card-premium prism-border p-6 rounded-3xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Verification Email</span>
                      </h3>
                      {hasEmailChanges ? (
                        <span className="text-[9px] bg-amber-50 dark:bg-amber-955/30 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider select-none animate-pulse">Unsaved</span>
                      ) : (
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-md flex items-center space-x-1 select-none">
                          <Check className="w-2.5 h-2.5" />
                          <span>Aligned</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-5 font-sans">
                      Link your accounting workspace with a valid recovery address to lock credentials secure.
                    </p>

                    <form onSubmit={handleUpdateEmailSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 font-sans">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          placeholder="name@corporation.com"
                          className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 text-xs font-sans transition ${
                            hasEmailChanges 
                              ? 'border-amber-400 dark:border-amber-900/60 focus:border-amber-500' 
                              : 'border-slate-205 dark:border-slate-800 focus:border-indigo-505'
                          }`}
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={updatingEmail || !hasEmailChanges}
                        className={`w-full py-2.5 font-bold text-xs rounded-xl transition duration-150 flex items-center justify-center space-x-2 select-none ${
                          hasEmailChanges 
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer hover:shadow-md' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {updatingEmail ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Email Details</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-205 dark:border-slate-800/40 text-[10px] text-slate-400 dark:text-slate-500 flex items-start space-x-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                    <span>Communication triggers will be routed here to sync ledger statements.</span>
                  </div>
                </div>

              </div>
            )}

            {/* ====== LEDGER CLEAN UP & MAINTENANCE ====== */}
            {activeTab === 'maintenance' && (
              <div className="glass-card-premium prism-border p-6 rounded-3xl space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2 flex items-center space-x-2">
                    <Database className="w-4 h-4 text-violet-500" />
                    <span>Voucher Sequence Alignment Repair Panel</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans max-w-2xl">
                    Historical entries often manifest sequence unalignments if logs were created asynchronously or out of order. Running this alignment sweeps your cloud database in secure transactional batches, sorting items chronologically, and indexing clean serialized voucher IDs (e.g. <strong>CPV-1</strong>, <strong>CRV-2</strong>) linked to payment channels.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {/* System Audit profile list */}
                  <div className="p-4 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-2xl space-y-3.5 text-left">
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/50 pb-1.5">
                      System Integrity Specifications
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                      <div className="text-slate-400 dark:text-slate-500 font-medium text-left">Registry Size</div>
                      <div className="text-slate-800 dark:text-slate-200 font-bold font-mono text-left">
                        {transactions.length} vouchers logged
                      </div>
                      
                      <div className="text-slate-400 dark:text-slate-500 font-medium text-left">Base Currency</div>
                      <div className="text-slate-800 dark:text-slate-200 font-bold text-left">
                        UAE Dirham (AED)
                      </div>

                      <div className="text-slate-400 dark:text-slate-500 font-medium text-left">Index Protocol</div>
                      <div className="text-slate-800 dark:text-slate-200 font-bold flex items-center space-x-1 text-left">
                        <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Serialized CPV-CRV</span>
                      </div>

                      <div className="text-slate-400 dark:text-slate-500 font-medium text-left">Engine Mode</div>
                      <div className="text-slate-840 dark:text-emerald-400 font-bold text-left">
                        Cloud Secure (SPA)
                      </div>
                    </div>
                  </div>

                  {/* Warning Info Box */}
                  <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/25 rounded-2xl text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed flex items-start space-x-3 text-left">
                    <AlertTriangle className="w-5 h-5 text-amber-605 dark:text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase tracking-wider block text-[10px] mb-1">Preservation Guard Active</span>
                      This alignment updates chronologies to restore clean sequence trails without mutating any aggregate residual amounts owed or repayment histories. Fully transaction-safe.
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-slate-200 dark:border-slate-800/50">
                  <div className="text-xs text-slate-400 dark:text-slate-500 leading-none">
                    Last Index Verified: {transactions.length > 0 ? formatDateUAE(transactions[transactions.length - 1].date) : '-'}
                  </div>
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={fixingVouchers || transactions.length === 0}
                    className={`py-3 px-6 font-bold cursor-pointer rounded-xl transition duration-150 inline-flex items-center space-x-2 select-none text-xs ${
                      transactions.length === 0 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : fixingVouchers
                        ? 'bg-violet-600 text-white opacity-70 cursor-wait'
                        : 'bg-violet-650 hover:bg-violet-700 text-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    {fixingVouchers ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Aligning Database Records...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 text-violet-100 shrink-0 animate-pulse" />
                        <span>Execute Sequence Repair</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ====== VOID ARCHIVE TAB (CANCELLED VOUCHERS) ====== */}
            {activeTab === 'archives' && (
              <div className="glass-card-premium prism-border p-6 rounded-3xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-5 gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                      <ShieldCheck className="w-4.5 h-4.5 text-rose-500" />
                      <span>Archive Registry of Cancelled Vouchers</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                      Unified tracking system showing voided certificates and active options to restore them.
                    </p>
                  </div>
                  <div className="text-[10px] bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider select-none shrink-0 self-start sm:self-auto">
                    {cancelledVouchersList.length} Inactive Vouchers
                  </div>
                </div>

                {cancelledVouchersList.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-3.5 max-w-md mx-auto">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-555 rounded-3xl border border-emerald-100/50 dark:border-emerald-900/30">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">Audit Trail Cleared</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans mt-1">
                        No cancelled or voided ledger slips detected under your profile directory. All transactions remain active.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-sans min-w-[650px]">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-widest font-semibold">
                          <th className="py-3 px-2">Voucher No</th>
                          <th className="py-3 px-2">Transaction Date</th>
                          <th className="py-3 px-2">Type</th>
                          <th className="py-3 px-2">Category</th>
                          <th className="py-3 px-2 text-right">Value Amount</th>
                          <th className="py-3 px-2 text-center">Account</th>
                          <th className="py-3 px-2">Cancelled Date</th>
                          <th className="py-3 px-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/20">
                        {cancelledVouchersList.map((t) => (
                          <tr key={t.id} className="text-slate-500 dark:text-slate-400 hover:bg-slate-50/40 dark:hover:bg-slate-900/30 transition duration-150">
                            <td className="py-3.5 px-2 font-mono font-bold text-slate-800 dark:text-slate-200 line-through">
                              {t.voucherNumber}
                            </td>
                            <td className="py-3.5 px-2 font-mono-data">
                              {formatDateUAE(t.date)}
                            </td>
                            <td className="py-3.5 px-2">
                              <span className="p-1 px-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[9px] uppercase font-bold tracking-wider">
                                {t.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-2 font-semibold text-slate-800 dark:text-slate-300 line-through">
                              {t.category}
                            </td>
                            <td className="py-3.5 px-2 text-right font-mono-data font-bold text-rose-500 dark:text-rose-400 line-through">
                              {formatAED(t.amount)}
                            </td>
                            <td className="py-3.5 px-2 text-center">
                              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{t.paymentMethod}</span>
                            </td>
                            <td className="py-3.5 px-2 text-slate-400 dark:text-slate-500 font-mono-data text-[10px]">
                              {t.cancelledAt ? new Date(t.cancelledAt).toLocaleString() : '-'}
                            </td>
                            <td className="py-3.5 px-2 text-right">
                              <button
                                onClick={() => {
                                  onRestoreVoucher(t.id);
                                  triggerToast(`Voucher ${t.voucherNumber} reactivated!`, "success");
                                }}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 text-indigo-700 dark:text-indigo-450 border border-indigo-100/40 dark:border-indigo-900/30 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition select-none active:scale-95"
                                title="Reactivate Voucher"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reactivate</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ====== Overlays and Modals ====== */}

      {/* Custom Modal Confirmation Dialog for sequence alignment */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl shadow-2xl relative"
            >
              <div className="flex items-center space-x-3 mb-4 text-amber-500 dark:text-amber-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Run Sequence Alignment?</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-sans">
                This will systematically repair and re-index all vouchers in your history by chronological order. It maps correct chronological series codes (CPV, CRV, FPV, FRV) based on transaction categories and channels.
              </p>
              
              <div className="p-4 bg-amber-50/70 dark:bg-amber-950/15 border border-amber-100/50 dark:border-amber-900/40 rounded-2xl text-[11px] text-amber-805 dark:text-amber-400 leading-relaxed mb-6">
                <strong>Attention:</strong> Original entry logs and total account balances will strictly remain unchanged. This is a transaction-safe label alignment task.
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold cursor-pointer transition select-none text-center"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={handleFixVoucherSequences}
                  className="flex-1 py-2.5 text-xs bg-violet-650 hover:bg-violet-700 text-white rounded-xl font-bold cursor-pointer transition flex items-center justify-center space-x-1.5 select-none hover:shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow shrink-0" />
                  <span>Execute Alignment</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Micro-Notification Toast Portals */}
      <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm ml-auto mr-auto sm:mr-0 pl-1 pr-1 sm:pl-0 sm:pr-0">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.1 } }}
              layout
              className={`p-4 rounded-2xl shadow-xl flex items-start space-x-3 text-xs font-sans pointer-events-auto border backdrop-blur-md hover:translate-y-[-2px] transition-transform duration-100 ${
                notif.type === 'success'
                  ? 'bg-emerald-500/95 dark:bg-emerald-950/95 text-white border-emerald-400/20 dark:border-emerald-800/40'
                  : notif.type === 'error'
                  ? 'bg-rose-500/95 dark:bg-rose-950/95 text-white border-rose-400/20 dark:border-rose-800/40'
                  : 'bg-slate-900/95 dark:bg-slate-950/95 text-white border-slate-800'
              }`}
            >
              {notif.type === 'success' ? (
                <Check className="w-4 h-4 bg-white/20 rounded-full p-0.5 shrink-0" />
              ) : notif.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-indigo-300 shrink-0" />
              )}
              <div className="flex-1 font-medium leading-relaxed text-left">{notif.message}</div>
              <button
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="text-white/60 hover:text-white transition-colors cursor-pointer select-none font-bold text-sm leading-none shrink-0"
              >
                &times;
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
