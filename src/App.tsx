import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Transaction, 
  LentBorrowedRecord, 
  Budget, 
  PaymentMethod, 
  TransactionType,
  VoucherStatus
} from './types';
import { 
  auth, 
  db, 
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  orderBy,
  deleteDoc
} from './firebase';
import { 
  normalizeUserId, 
  isValidUserId, 
  formatAED, 
  sanitizeInput 
} from './utils';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import ExpensesPage from './components/ExpensesPage';
import IncomePage from './components/IncomePage';
import LentPage from './components/LentPage';
import BorrowedPage from './components/BorrowedPage';
import SummaryPage from './components/SummaryPage';
import TransactionsPage from './components/TransactionsPage';
import MonthlyReportPage from './components/MonthlyReportPage';
import BudgetsPage from './components/BudgetsPage';
import CategoriesPage from './components/CategoriesPage';
import SettingsPage from './components/SettingsPage';
import { 
  EditTransactionModal, 
  RecordRepaymentModal, 
  EditPeerRecordModal 
} from './components/Modals';
import { QuickAddModal } from './components/QuickAddModal';

import { 
  LayoutDashboard, 
  PiggyBank, 
  Landmark, 
  HandHelping, 
  ArrowDownLeft, 
  Users, 
  History, 
  CalendarRange, 
  PieChart, 
  Tags, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Wifi, 
  WifiOff, 
  Download,
  Terminal,
  Sun,
  Moon,
  Plus,
  Home,
  BarChart3
} from 'lucide-react';

const defaultExpenseCategories = ['Food', 'Transport', 'Rent', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Other'];
const defaultIncomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Business', 'Other'];

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const local = localStorage.getItem('theme');
    if (local) return local === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);
  
  // Operational state variables
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lentItems, setLentItems] = useState<LentBorrowedRecord[]>([]);
  const [borrowedItems, setBorrowedItems] = useState<LentBorrowedRecord[]>([]);
  const [budgets, setBudgets] = useState<Budget>({});
  const [expenseCategories, setExpenseCategories] = useState<string[]>(defaultExpenseCategories);
  const [incomeCategories, setIncomeCategories] = useState<string[]>(defaultIncomeCategories);
  
  // App routing and overlay layouts
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Modal structures
  const [editTxModalOpen, setEditTxModalOpen] = useState(false);
  const [selectedEditTx, setSelectedEditTx] = useState<Transaction | null>(null);

  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [repayRecordType, setRepaymentRecordType] = useState<'lent' | 'borrowed' | null>(null);
  const [repayRecordId, setRepaymentRecordId] = useState<string | null>(null);

  const [editPeerRecordModalOpen, setEditPeerRecordModalOpen] = useState(false);
  const [editPeerRecordType, setEditPeerRecordType] = useState<'lent' | 'borrowed' | null>(null);
  const [editPeerRecord, setEditPeerRecord] = useState<LentBorrowedRecord | null>(null);

  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);

  // ==========================================
  // OFFLINE SNAPSHOT CARRIERS
  // ==========================================
  const cacheKey = (name: string) => user ? `expenseTracker:${user.uid}:${name}` : '';

  const saveToLocalSnapshot = (name: string, data: any) => {
    const key = cacheKey(name);
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify({ value: data, timestamp: Date.now() }));
    } catch (e) {
      console.warn("Snapshot serialization error:", e);
    }
  };

  const loadFromLocalSnapshot = (name: string, fallback: any) => {
    const key = cacheKey(name);
    if (!key) return fallback;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && Object.prototype.hasOwnProperty.call(parsed, 'value') ? parsed.value : fallback;
    } catch {
      return fallback;
    }
  };

  // Perform a full state dump for offline preservation
  const serializeStateToLocal = () => {
    if (!user) return;
    saveToLocalSnapshot('transactions', transactions);
    saveToLocalSnapshot('lentItems', lentItems);
    saveToLocalSnapshot('borrowedItems', borrowedItems);
    saveToLocalSnapshot('budgets', budgets);
    saveToLocalSnapshot('categories', { expenseCategories, incomeCategories });
  };

  useEffect(() => {
    if (user) {
      serializeStateToLocal();
    }
  }, [transactions, lentItems, borrowedItems, budgets, expenseCategories, incomeCategories, user]);

  // Network offline/online listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (user) {
        syncPendingTransactions();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, transactions]);

  // ==========================================
  // AUTHENTICATION AND METRIC WORKFLOWS
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const resolvedId = localStorage.getItem(`userId:${u.uid}`) || '';
        setUserId(resolvedId || u.uid);
        
        // Let's boot local memory first to render instant bento layouts
        const cachedCats = loadFromLocalSnapshot('categories', { expenseCategories: defaultExpenseCategories, incomeCategories: defaultIncomeCategories });
        setExpenseCategories(cachedCats.expenseCategories.sort());
        setIncomeCategories(cachedCats.incomeCategories.sort());
        setTransactions(loadFromLocalSnapshot('transactions', []));
        setLentItems(loadFromLocalSnapshot('lentItems', []));
        setBorrowedItems(loadFromLocalSnapshot('borrowedItems', []));
        setBudgets(loadFromLocalSnapshot('budgets', {}));

        setLoading(false);

        // Then execute lazy cloud synchronization
        try {
          await syncCloudData(u);
        } catch (e) {
          console.warn("Initial background synchronization deferred:", e);
        }
      } else {
        // Clear variables
        setUser(null);
        setUserId('');
        setTransactions([]);
        setLentItems([]);
        setBorrowedItems([]);
        setBudgets({});
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const syncCloudData = async (activeUser: any) => {
    if (!activeUser || !navigator.onLine) return;

    const uid = activeUser.uid;

    try {
      // 1. Resolve User ID
      const aliasDoc = await getDoc(doc(db, 'loginAliases', uid));
      if (aliasDoc.exists() && aliasDoc.data()?.userId) {
        const uId = aliasDoc.data().userId;
        setUserId(uId);
        localStorage.setItem(`userId:${uid}`, uId);
      }

      // 2. Fetch Categories
      const catsSnap = await getDocs(collection(db, 'users', uid, 'categories'));
      if (catsSnap.empty) {
        // Seed default classifications in cloud if blank
        const batch = writeBatch(db);
        defaultExpenseCategories.forEach(cat => {
          batch.set(doc(db, 'users', uid, 'categories', cat), { name: cat, type: 'expense' });
        });
        defaultIncomeCategories.forEach(cat => {
          batch.set(doc(db, 'users', uid, 'categories', cat), { name: cat, type: 'income' });
        });
        await batch.commit();
        setExpenseCategories(defaultExpenseCategories.sort());
        setIncomeCategories(defaultIncomeCategories.sort());
      } else {
        const exps: string[] = [];
        const incs: string[] = [];
        catsSnap.forEach(d => {
          const item = d.data();
          if (item.type === 'expense') exps.push(item.name);
          else if (item.type === 'income') incs.push(item.name);
        });
        setExpenseCategories(exps.sort());
        setIncomeCategories(incs.sort());
      }

      // 3. Fetch Budgets
      const budgetsDoc = await getDoc(doc(db, 'users', uid, 'metadata', 'budgets'));
      if (budgetsDoc.exists()) {
        setBudgets(budgetsDoc.data());
      }

      // 4. Fetch Transactions
      const txSnap = await getDocs(query(collection(db, 'users', uid, 'transactions'), orderBy('date', 'desc')));
      const txList: Transaction[] = [];
      txSnap.forEach(d => {
        const item = d.data() as Transaction;
        txList.push({ ...item, id: d.id, syncStatus: 'synced' });
      });
      setTransactions(txList);

      // 5. Fetch Lent Records
      const lentSnap = await getDocs(query(collection(db, 'users', uid, 'lent'), orderBy('date', 'desc')));
      const lentList: LentBorrowedRecord[] = [];
      lentSnap.forEach(d => {
        lentList.push({ ...d.data(), id: d.id } as LentBorrowedRecord);
      });
      setLentItems(lentList);

      // 6. Fetch Borrowed Records
      const borrowSnap = await getDocs(query(collection(db, 'users', uid, 'borrowed'), orderBy('date', 'desc')));
      const borrowList: LentBorrowedRecord[] = [];
      borrowSnap.forEach(d => {
        borrowList.push({ ...d.data(), id: d.id } as LentBorrowedRecord);
      });
      setBorrowedItems(borrowList);

      // Run any pending local corrections
      syncPendingTransactions();

    } catch (err) {
      console.error("Cloud hydration query failed:", err);
    }
  };

  // Synchronise offline local changes back to the cloud database
  const syncPendingTransactions = async () => {
    if (!user || !navigator.onLine) return;
    
    // Resolve draft voucher numbers first
    const drafts = transactions.filter(t => t.voucherNumber.startsWith('DRAFT-LOCAL-'));
    for (const draft of drafts) {
      try {
        const allocated = await allocateVoucherNumberCloud(draft.type, draft.paymentMethod);
        const txDocRef = doc(db, 'users', user.uid, 'transactions', draft.id);
        const updatedTx = {
          ...draft,
          ...allocated,
          syncStatus: 'synced' as const,
          updatedAt: new Date().toISOString()
        };
        await setDoc(txDocRef, updatedTx, { merge: true });
        
        // Update local memory list
        setTransactions(prev => prev.map(t => t.id === draft.id ? updatedTx : t));
      } catch (e) {
        console.warn("Failed syncing local draft sequence:", e);
      }
    }

    // Sync other unsynced changes
    const pendings = transactions.filter(t => t.syncStatus !== 'synced' && !t.voucherNumber.startsWith('DRAFT-LOCAL-'));
    for (const p of pendings) {
      try {
        const txDocRef = doc(db, 'users', user.uid, 'transactions', p.id);
        const syncedTx = { ...p, syncStatus: 'synced' as const, updatedAt: new Date().toISOString() };
        await setDoc(txDocRef, syncedTx, { merge: true });
        setTransactions(prev => prev.map(t => t.id === p.id ? syncedTx : t));
      } catch (e) {
        console.warn("Unsynced queue item upload failed:", e);
      }
    }
  };

  // ==========================================
  // UNIFIED VOUCHER AND SEQUENCE COUNTERS
  // ==========================================
  const extractSequence = (vNum: string): number => {
    const match = String(vNum || '').trim().match(/^[A-Z]{3}-(\d+)$/i);
    return match ? Number(match[1]) : 0;
  };

  const getPrefix = (type: TransactionType, method: PaymentMethod) => {
    if (type === 'expense') return method === 'cash' ? 'CPV' : 'FPV';
    return method === 'cash' ? 'CRV' : 'FRV';
  };

  const getHighestLocalSequence = (prefix: string, txList: Transaction[]) => {
    return txList.reduce((max, t) => {
      const v = String(t.voucherNumber).trim().toUpperCase();
      if (!v.startsWith(`${prefix}-`)) return max;
      return Math.max(max, extractSequence(v));
    }, 0);
  };

  // Cloud serial allocator with full re-entrancy protection
  const allocateVoucherNumberCloud = async (type: TransactionType, method: PaymentMethod) => {
    const prefix = getPrefix(type, method);
    if (!user || !navigator.onLine) {
      // Local fallback allocating temporary draft label
      const localNext = (Number(localStorage.getItem('expenseTracker:draftCounter') || 0)) + 1;
      localStorage.setItem('expenseTracker:draftCounter', String(localNext));
      return {
        voucherNumber: `DRAFT-LOCAL-${String(localNext).padStart(3, '0')}`,
        voucherPrefix: prefix,
        voucherSequence: null
      };
    }

    try {
      // Create path reference for target counter
      const counterRef = doc(db, 'users', user.uid, 'voucherCounters', prefix);
      const snapshot = await getDoc(counterRef);
      const cloudNext = snapshot.exists() ? (snapshot.data()?.nextSequence || 1) : 1;
      
      const localHighest = getHighestLocalSequence(prefix, transactions);
      const finalSequence = Math.max(cloudNext, localHighest + 1);

      // Increment cloud counter doc
      await setDoc(counterRef, {
        prefix,
        nextSequence: finalSequence + 1,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      return {
        voucherNumber: `${prefix}-${finalSequence}`,
        voucherPrefix: prefix,
        voucherSequence: finalSequence
      };
    } catch {
      // Offline / API error fallback
      const localNext = (Number(localStorage.getItem('expenseTracker:draftCounter') || 0)) + 1;
      localStorage.setItem('expenseTracker:draftCounter', String(localNext));
      return {
        voucherNumber: `DRAFT-LOCAL-${String(localNext).padStart(3, '0')}`,
        voucherPrefix: prefix,
        voucherSequence: null
      };
    }
  };

  // ==========================================
  // TRANSACTION MUTATION OPERATIONS
  // ==========================================
  const addTransactionToState = async (txPayload: Partial<Transaction>) => {
    if (!user) return;
    const trackingId = txPayload.id || Date.now().toString();
    const allocated = await allocateVoucherNumberCloud(txPayload.type!, txPayload.paymentMethod!);

    const newTx: Transaction = {
      id: trackingId,
      date: txPayload.date!,
      amount: txPayload.amount!,
      category: txPayload.category!,
      type: txPayload.type!,
      note: txPayload.note || '',
      paymentMethod: txPayload.paymentMethod!,
      status: 'active',
      syncStatus: navigator.onLine ? 'synced' : 'pending_sync',
      voucherNumber: allocated.voucherNumber,
      voucherPrefix: allocated.voucherPrefix,
      voucherSequence: allocated.voucherSequence,
      linkedLentId: txPayload.linkedLentId,
      linkedBorrowedId: txPayload.linkedBorrowedId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update local state list
    setTransactions(prev => [newTx, ...prev]);

    // Push write to background promise
    const runDocRef = doc(db, 'users', user.uid, 'transactions', trackingId);
    setDoc(runDocRef, newTx).catch((e) => {
      console.warn("Deferred syncing cost update:", e);
      newTx.syncStatus = 'sync_failed';
    });
  };

  const handleAddExpense = async (date: string, category: string, method: PaymentMethod, amount: number, note: string) => {
    await addTransactionToState({
      date,
      category,
      paymentMethod: method,
      amount,
      note,
      type: 'expense'
    });
    setCurrentPage('dashboard');
  };

  const handleAddIncome = async (date: string, category: string, method: PaymentMethod, amount: number, note: string) => {
    await addTransactionToState({
      date,
      category,
      paymentMethod: method,
      amount,
      note,
      type: 'income'
    });
    setCurrentPage('dashboard');
  };

  const cancelVoucherCommit = async (id: string, cascadeData?: { refType: 'lent' | 'borrowed'; refId: string }) => {
    if (!user) return;
    const idx = transactions.findIndex(t => t.id === id);
    if (idx === -1) return;

    const payload: Partial<Transaction> = {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: navigator.onLine ? 'synced' : 'pending_sync'
    };
    if (cascadeData) {
      payload.cancelledByRecordType = cascadeData.refType;
      payload.cancelledByRecordId = cascadeData.refId;
    }

    const updatedTx = { ...transactions[idx], ...payload };
    setTransactions(prev => prev.map(t => t.id === id ? updatedTx : t));

    await setDoc(doc(db, 'users', user.uid, 'transactions', id), updatedTx, { merge: true });
  };

  const restoreVoucherCommit = async (id: string) => {
    if (!user) return;
    const idx = transactions.findIndex(t => t.id === id);
    if (idx === -1) return;

    const updatedTx = {
      ...transactions[idx],
      status: 'active' as const,
      restoredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: navigator.onLine ? 'synced' : 'pending_sync'
    };
    // Clean deleted keys
    delete updatedTx.cancelledAt;
    delete updatedTx.cancelledByRecordType;
    delete updatedTx.cancelledByRecordId;

    setTransactions(prev => prev.map(t => t.id === id ? updatedTx : t));
    await setDoc(doc(db, 'users', user.uid, 'transactions', id), updatedTx);
  };

  const saveEditVoucherCommit = async (id: string, date: string, category: string, amount: number, note: string) => {
    if (!user) return;
    const idx = transactions.findIndex(t => t.id === id);
    if (idx === -1) return;

    const updatedTx: Transaction = {
      ...transactions[idx],
      date,
      category,
      amount,
      note,
      updatedAt: new Date().toISOString(),
      syncStatus: navigator.onLine ? 'synced' : 'pending_sync'
    };

    setTransactions(prev => prev.map(t => t.id === id ? updatedTx : t));
    await setDoc(doc(db, 'users', user.uid, 'transactions', id), updatedTx, { merge: true });

    // Sync properties downstream if it is linked to a borrowing or lending contract
    if (updatedTx.linkedLentId) {
      const peerIdx = lentItems.findIndex(i => i.id === updatedTx.linkedLentId);
      if (peerIdx >= 0) {
        const item = lentItems[peerIdx];
        const status = item.repaid === 0 ? 'pending' : (item.repaid === amount ? 'paid' : 'partial');
        const updatedRecord = { ...item, amount, date, status };
        setLentItems(prev => prev.map(i => i.id === item.id ? updatedRecord : i));
        await setDoc(doc(db, 'users', user.uid, 'lent', item.id), updatedRecord, { merge: true });
      }
    } else if (updatedTx.linkedBorrowedId) {
      const peerIdx = borrowedItems.findIndex(i => i.id === updatedTx.linkedBorrowedId);
      if (peerIdx >= 0) {
        const item = borrowedItems[peerIdx];
        const status = item.repaid === 0 ? 'pending' : (item.repaid === amount ? 'paid' : 'partial');
        const updatedRecord = { ...item, amount, date, status };
        setBorrowedItems(prev => prev.map(i => i.id === item.id ? updatedRecord : i));
        await setDoc(doc(db, 'users', user.uid, 'borrowed', item.id), updatedRecord, { merge: true });
      }
    }
  };

  // ==========================================
  // INTERPERSONAL DEBTS MUTATIONS
  // ==========================================
  const handleAddLent = async (name: string, amount: number, date: string, dueDate: string | null, method: PaymentMethod, note: string) => {
    if (!user) return;
    const trackingId = Date.now().toString();

    const record: LentBorrowedRecord = {
      id: trackingId,
      name,
      amount,
      date,
      dueDate,
      note,
      repaid: 0,
      status: 'pending',
      recordStatus: 'active',
      paymentMethod: method
    };

    setLentItems(prev => [record, ...prev]);
    await setDoc(doc(db, 'users', user.uid, 'lent', trackingId), record);

    // Automating transaction voucher mirroring cost outflow
    await addTransactionToState({
      id: `${trackingId}_exp`,
      date,
      amount,
      category: 'Lent to Friend',
      note: `Capital lent out to ${name}: ${note}`.trim(),
      paymentMethod: method,
      linkedLentId: trackingId,
      type: 'expense'
    });
  };

  const handleAddBorrowed = async (name: string, amount: number, date: string, dueDate: string | null, method: PaymentMethod, note: string) => {
    if (!user) return;
    const trackingId = Date.now().toString();

    const record: LentBorrowedRecord = {
      id: trackingId,
      name,
      amount,
      date,
      dueDate,
      note,
      repaid: 0,
      status: 'pending',
      recordStatus: 'active',
      paymentMethod: method
    };

    setBorrowedItems(prev => [record, ...prev]);
    await setDoc(doc(db, 'users', user.uid, 'borrowed', trackingId), record);

    // Automating transaction voucher mirroring inflow
    await addTransactionToState({
      id: `${trackingId}_inc`,
      date,
      amount,
      category: 'Borrowed from Friend',
      note: `Liability borrowing from ${name}: ${note}`.trim(),
      paymentMethod: method,
      linkedBorrowedId: trackingId,
      type: 'income'
    });
  };

  const handleCancelLent = async (id: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to cancel this Lent contract? This marks the ledger entry as Cancelled and deactivates any synced transaction vouchers.")) {
      return;
    }
    const idx = lentItems.findIndex(i => i.id === id);
    if (idx === -1) return;

    const record = lentItems[idx];
    const updated = { 
      ...record, 
      recordStatus: 'cancelled' as const, 
      recordCancelledAt: new Date().toISOString() 
    };
    setLentItems(prev => prev.map(i => i.id === id ? updated : i));

    await setDoc(doc(db, 'users', user.uid, 'lent', id), updated, { merge: true });

    // Cancel matching child expenses
    const matchingTx = transactions.filter(t => t.linkedLentId === id && t.status !== 'cancelled');
    for (const t of matchingTx) {
      await cancelVoucherCommit(t.id, { refType: 'lent', refId: id });
    }
  };

  const handleRestoreLent = async (id: string) => {
    if (!user) return;
    const idx = lentItems.findIndex(i => i.id === id);
    if (idx === -1) return;

    const record = lentItems[idx];
    const updated = { 
      ...record, 
      recordStatus: 'active' as const,
      recordRestoredAt: new Date().toISOString() 
    };
    delete updated.recordCancelledAt;

    setLentItems(prev => prev.map(i => i.id === id ? updated : i));
    await setDoc(doc(db, 'users', user.uid, 'lent', id), updated);

    // Restore children vouchers cancelled by this structure
    const childVouchers = transactions.filter(t => t.linkedLentId === id && t.status === 'cancelled' && t.cancelledByRecordType === 'lent');
    for (const t of childVouchers) {
      await restoreVoucherCommit(t.id);
    }
  };

  const handleCancelBorrowed = async (id: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to cancel this Borrowed contract? This marks the entry as Cancelled and cancels matching children receipt vouchers.")) {
      return;
    }
    const idx = borrowedItems.findIndex(i => i.id === id);
    if (idx === -1) return;

    const record = borrowedItems[idx];
    const updated = { 
      ...record, 
      recordStatus: 'cancelled' as const, 
      recordCancelledAt: new Date().toISOString() 
    };
    setBorrowedItems(prev => prev.map(i => i.id === id ? updated : i));

    await setDoc(doc(db, 'users', user.uid, 'borrowed', id), updated, { merge: true });

    // Cancel children
    const matchingTx = transactions.filter(t => t.linkedBorrowedId === id && t.status !== 'cancelled');
    for (const t of matchingTx) {
      await cancelVoucherCommit(t.id, { refType: 'borrowed', refId: id });
    }
  };

  const handleRestoreBorrowed = async (id: string) => {
    if (!user) return;
    const idx = borrowedItems.findIndex(i => i.id === id);
    if (idx === -1) return;

    const record = borrowedItems[idx];
    const updated = { 
      ...record, 
      recordStatus: 'active' as const,
      recordRestoredAt: new Date().toISOString() 
    };
    delete updated.recordCancelledAt;

    setBorrowedItems(prev => prev.map(i => i.id === id ? updated : i));
    await setDoc(doc(db, 'users', user.uid, 'borrowed', id), updated);

    // Restore child Vouchers
    const childVouchers = transactions.filter(t => t.linkedBorrowedId === id && t.status === 'cancelled' && t.cancelledByRecordType === 'borrowed');
    for (const t of childVouchers) {
      await restoreVoucherCommit(t.id);
    }
  };

  // Repayment overlay saver
  const handleSaveRepaymentCommit = async (
    type: 'lent' | 'borrowed',
    id: string,
    amount: number,
    date: string,
    method: PaymentMethod
  ) => {
    if (!user) return;
    const list = type === 'lent' ? lentItems : borrowedItems;
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return;

    const item = list[idx];
    const finalRepaid = Number(item.repaid || 0) + amount;
    const finalStatus = finalRepaid >= item.amount ? 'paid' as const : 'partial' as const;

    const updatedRecord = { ...item, repaid: finalRepaid, status: finalStatus };

    if (type === 'lent') {
      setLentItems(prev => prev.map(i => i.id === id ? updatedRecord : i));
      await setDoc(doc(db, 'users', user.uid, 'lent', id), updatedRecord, { merge: true });

      // Lodge reflecting cash inflow voucher
      await addTransactionToState({
        date,
        amount,
        category: 'Repayment from Lent',
        note: `Payback installment from Ahmed/Friend: ${item.name}`.trim(),
        paymentMethod: method,
        linkedLentId: id,
        type: 'income'
      });
    } else {
      setBorrowedItems(prev => prev.map(i => i.id === id ? updatedRecord : i));
      await setDoc(doc(db, 'users', user.uid, 'borrowed', id), updatedRecord, { merge: true });

      // Lodge reflecting cash outflow voucher
      await addTransactionToState({
        date,
        amount,
        category: 'Repayment of Borrowed',
        note: `Lodge payback settlement to ${item.name}`.trim(),
        paymentMethod: method,
        linkedBorrowedId: id,
        type: 'expense'
      });
    }
  };

  const handleSavePeerRecordCommit = async (
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
  ) => {
    if (!user) return;
    const list = type === 'lent' ? lentItems : borrowedItems;
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return;

    const origRecord = list[idx];
    const status = updates.repaid === 0 ? 'pending' : (updates.repaid === updates.amount ? 'paid' : 'partial');
    const updatedRecord: LentBorrowedRecord = {
      ...origRecord,
      ...updates,
      status
    };

    if (type === 'lent') {
      setLentItems(prev => prev.map(i => i.id === id ? updatedRecord : i));
      await setDoc(doc(db, 'users', user.uid, 'lent', id), updatedRecord, { merge: true });
    } else {
      setBorrowedItems(prev => prev.map(i => i.id === id ? updatedRecord : i));
      await setDoc(doc(db, 'users', user.uid, 'borrowed', id), updatedRecord, { merge: true });
    }

    // Adapt parent base transaction records if present
    const childVouchers = transactions.filter(t => (type === 'lent' ? t.linkedLentId === id : t.linkedBorrowedId === id) && t.status !== 'cancelled');
    for (const t of childVouchers) {
      // Modify parent parameters
      if (t.category.includes('Lent to') || t.category.includes('Borrowed from')) {
        await saveEditVoucherCommit(t.id, updates.date, t.category, updates.amount, updates.note || t.note);
      }
    }
  };

  // ==========================================
  // CONFIGURATION PROPERTIES OPERATIONS
  // ==========================================
  const handleUpdateUserId = async (newId: string) => {
    if (!user) return;
    const normalized = normalizeUserId(newId);
    if (!isValidUserId(normalized)) {
      throw new Error("Target handle violates sequence pattern constraints (4-30 standard characters).");
    }

    // Check alias availability
    const checkDoc = await getDoc(doc(db, 'loginAliases', normalized));
    if (checkDoc.exists() && checkDoc.data()?.uid !== user.uid) {
      throw new Error("This User ID alias is taken by another account.");
    }

    const payload = {
      uid: user.uid,
      email: user.email,
      userId: normalized,
      updatedAt: new Date().toISOString()
    };

    // Erase old alias first if present
    const oldId = userId;
    if (oldId && oldId !== user.uid && oldId !== normalized) {
      try {
        await deleteDoc(doc(db, 'loginAliases', oldId));
      } catch {
        console.warn("Erase old alias failed");
      }
    }

    await setDoc(doc(db, 'loginAliases', user.uid), payload);
    await setDoc(doc(db, 'loginAliases', normalized), payload);

    setUserId(normalized);
    localStorage.setItem(`userId:${user.uid}`, normalized);
    localStorage.setItem(`loginAlias:${normalized}`, user.email);
  };

  const handleUpdateEmail = async (newEmail: string) => {
    if (!user) return;
    if (!newEmail.includes('@')) {
      throw new Error("Invalid email formatting.");
    }
    // Simple email updates inside Auth profile
    await setDoc(doc(db, 'loginAliases', user.uid), { email: newEmail, updatedAt: new Date().toISOString() }, { merge: true });
    if (userId) {
      await setDoc(doc(db, 'loginAliases', userId), { email: newEmail, updatedAt: new Date().toISOString() }, { merge: true });
    }
  };

  const handleFixVoucherNumbers = async () => {
    if (!user) return;
    // Sort transactions chronologically
    const sorted = [...transactions].sort((a, b) => {
      const dateCompare = String(a.date).localeCompare(String(b.date));
      if (dateCompare !== 0) return dateCompare;
      const idA = Number(String(a.id).replace(/\D/g, '')) || 0;
      const idB = Number(String(b.id).replace(/\D/g, '')) || 0;
      return idA - idB;
    });

    const prefixCounters: { [prefix: string]: number } = {};
    const adjustedTx = sorted.map(t => {
      const prefix = getPrefix(t.type, t.paymentMethod);
      prefixCounters[prefix] = (prefixCounters[prefix] || 0) + 1;
      const seq = prefixCounters[prefix];
      return {
        ...t,
        voucherNumber: `${prefix}-${seq}`,
        voucherPrefix: prefix,
        voucherSequence: seq,
        syncStatus: 'pending_sync' as const,
        updatedAt: new Date().toISOString()
      };
    });

    // Write to local first to speed up rendering
    setTransactions(adjustedTx);

    // Commits to cloud in batches (Max 450 per batch)
    if (navigator.onLine) {
      for (let i = 0; i < adjustedTx.length; i += 450) {
        const batch = writeBatch(db);
        const chunk = adjustedTx.slice(i, i + 450);
        chunk.forEach(tx => {
          batch.set(doc(db, 'users', user.uid, 'transactions', tx.id), {
            ...tx,
            syncStatus: 'synced'
          }, { merge: true });
        });
        await batch.commit();
      }

      // Sync cloud indices
      for (const [prefix, count] of Object.entries(prefixCounters)) {
        await setDoc(doc(db, 'users', user.uid, 'voucherCounters', prefix), {
          prefix,
          nextSequence: count + 1,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // Re-hydrate
      const syncedTx = adjustedTx.map(t => ({ ...t, syncStatus: 'synced' as const }));
      setTransactions(syncedTx);
    }
  };

  const handleAddCategory = async (name: string, type: 'expense' | 'income') => {
    if (!user) return;
    const catName = sanitizeInput(name).trim();
    if (!catName) return;

    if (type === 'expense') {
      if (expenseCategories.includes(catName)) throw new Error("Category already exists.");
      setExpenseCategories(prev => [...prev, catName].sort());
    } else {
      if (incomeCategories.includes(catName)) throw new Error("Category already exists.");
      setIncomeCategories(prev => [...prev, catName].sort());
    }

    await setDoc(doc(db, 'users', user.uid, 'categories', catName), { name: catName, type });
  };

  const handleDeleteCategory = async (name: string) => {
    if (!user) return;
    setExpenseCategories(prev => prev.filter(c => c !== name));
    setIncomeCategories(prev => prev.filter(c => c !== name));

    await deleteDoc(doc(db, 'users', user.uid, 'categories', name));
  };

  const handleSaveBudgets = async (newBudgets: Budget) => {
    if (!user) return;
    setBudgets(newBudgets);
    await setDoc(doc(db, 'users', user.uid, 'metadata', 'budgets'), newBudgets);
  };

  // EXPORT EXCEL-COMPATIBLE CSV LEDGER RECORDINGS
  const handleExportToExcel = () => {
    const csvRows: string[] = [];

    // Header Column details
    csvRows.push('Voucher No,Date,Type,Category,Amount (AED),Account Account,Status,Sync status,Note');

    // 1. Transactions Vouchers rows
    transactions.forEach(t => {
      const cells = [
        `"${t.voucherNumber}"`,
        `"${t.date}"`,
        `"${t.type.toUpperCase()}"`,
        `"${t.category.replace(/"/g, '""')}"`,
        t.amount.toFixed(2),
        `"${t.paymentMethod.toUpperCase()}"`,
        `"${t.status.toUpperCase()}"`,
        `"${(t.syncStatus || 'synced').toUpperCase()}"`,
        `"${(t.note || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(cells.join(','));
    });

    csvRows.push('\n\nLent Contracts Registry\nName,Amount (AED),Settled Repaid,Remaining,Maturity Date,Contract Status,Note');
    // 2. Lent records rows
    lentItems.forEach(i => {
      const cells = [
        `"${i.name.replace(/"/g, '""')}"`,
        i.amount.toFixed(2),
        i.repaid.toFixed(2),
        (i.amount - i.repaid).toFixed(2),
        `"${i.dueDate || '-'}"`,
        `"${i.recordStatus.toUpperCase()}-${i.status.toUpperCase()}"`,
        `"${(i.note || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(cells.join(','));
    });

    csvRows.push('\n\nBorrowed Contract Liabilities\nName,Amount (AED),Settled Repaid,Remaining,Payback Date,Status,Note');
    // 3. Borrowed records rows
    borrowedItems.forEach(i => {
      const cells = [
        `"${i.name.replace(/"/g, '""')}"`,
        i.amount.toFixed(2),
        i.repaid.toFixed(2),
        (i.amount - i.repaid).toFixed(2),
        `"${i.dueDate || '-'}"`,
        `"${i.recordStatus.toUpperCase()}-${i.status.toUpperCase()}"`,
        `"${(i.note || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(cells.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = async () => {
    if (confirm("Sign out of the current financial profile?")) {
      await auth.signOut();
    }
  };

  // Safe checks if user is logged out
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-300 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 font-mono">Initializing ledger variables...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onSuccess={(id) => setUserId(id)} />;
  }

  return (
    <div className={`min-h-[100dvh] flex flex-col lg:flex-row relative transition-colors duration-150 overflow-x-hidden lg:overflow-hidden ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50/50 text-slate-800'}`}>
      
      {/* Dynamic fluorescent organic underlay glow elements for deep optical glass refraction */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-15%] w-[65%] h-[65%] rounded-full bg-gradient-to-tr from-indigo-500/20 to-teal-400/10 dark:from-indigo-600/35 dark:to-teal-500/15 blur-[130px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute bottom-[-15%] right-[-15%] w-[75%] h-[75%] rounded-full bg-gradient-to-br from-purple-500/25 to-pink-500/15 dark:from-purple-600/35 dark:to-pink-500/20 blur-[140px] animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute top-[35%] right-[15%] w-[45%] h-[45%] rounded-full bg-gradient-to-tl from-cyan-400/10 to-purple-400/15 dark:from-cyan-500/20 dark:to-purple-500/15 blur-[110px] animate-pulse" style={{ animationDuration: '14s' }} />
      </div>

      
      {/* Network connectivity bar banner element */}
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 bg-amber-500 text-slate-950 py-1.5 px-4 text-center text-[10px] font-bold tracking-wider uppercase inline-flex items-center justify-center space-x-1 z-50 shadow-sm animate-pulse">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline state mode — modifications stored in browser cache and will sync as soon as you reconnect</span>
        </div>
      )}

      {/* DESKTOP INTEGRATED SIDEBAR ROUTER */}
      <aside className="hidden lg:flex flex-col w-72 bg-gradient-to-b from-slate-900 to-slate-950 text-white fixed inset-y-0 left-0 p-6 border-r border-slate-800">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">FinTech Ledger</h1>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Expense Pro Suite</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer text-xs font-semibold transition ${
              currentPage === 'dashboard' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5" />
            <span>Overview Dashboard</span>
          </button>

          <div className="text-[9px] uppercase font-bold text-slate-500 px-4 pt-4 pb-1.5 tracking-wider font-mono">Operations</div>
          
          <button
            onClick={() => setCurrentPage('expense')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer text-xs font-semibold transition ${
              currentPage === 'expense' ? 'bg-slate-800 text-rose-400 font-bold' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
            }`}
          >
            <PiggyBank className="w-4.5 h-4.5" />
            <span>Record Expense</span>
          </button>
          
          <button
            onClick={() => setCurrentPage('income')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer text-xs font-semibold transition ${
              currentPage === 'income' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
            }`}
          >
            <Landmark className="w-4.5 h-4.5" />
            <span>Record Income</span>
          </button>
          
          <button
            onClick={() => setCurrentPage('lent')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer text-xs font-semibold transition ${
              currentPage === 'lent' ? 'bg-slate-800 text-violet-400 font-bold' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
            }`}
          >
            <HandHelping className="w-4.5 h-4.5" />
            <span>Lent Money (Assets)</span>
          </button>
          
          <button
            onClick={() => setCurrentPage('borrowed')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer text-xs font-semibold transition ${
              currentPage === 'borrowed' ? 'bg-slate-800 text-rose-500 font-bold' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-4.5 h-4.5" />
            <span>Borrowed Debt</span>
          </button>

          <div className="text-[9px] uppercase font-bold text-slate-500 px-4 pt-4 pb-1.5 tracking-wider font-mono">Reports & Configs</div>

          <button
            onClick={() => setCurrentPage('summary')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer text-xs font-semibold transition ${
              currentPage === 'summary' ? 'bg-slate-800 text-sky-400 font-bold' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span>Friends Balance</span>
          </button>

          <button
            onClick={() => setCurrentPage('transactions')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer text-xs font-semibold transition ${
              currentPage === 'transactions' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
            }`}
          >
            <History className="w-4.5 h-4.5" />
            <span>Audit Vouchers</span>
          </button>

          <button
            onClick={() => setCurrentPage('monthly')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer text-xs font-semibold transition ${
              currentPage === 'monthly' ? 'bg-slate-800 text-indigo-400 font-bold' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
            }`}
          >
            <CalendarRange className="w-4.5 h-4.5" />
            <span>Monthly Notebook</span>
          </button>

          <button
            onClick={() => setCurrentPage('budgets')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer text-xs font-semibold transition ${
              currentPage === 'budgets' ? 'bg-slate-800 text-violet-400 font-bold' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
            }`}
          >
            <PieChart className="w-4.5 h-4.5" />
            <span>Monthly Budgets</span>
          </button>

          <button
            onClick={() => setCurrentPage('categories')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer text-xs font-semibold transition ${
              currentPage === 'categories' ? 'bg-slate-800 text-sky-450 font-bold' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
            }`}
          >
            <Tags className="w-4.5 h-4.5" />
            <span>Manage Categories</span>
          </button>

          <button
            onClick={() => setCurrentPage('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer text-xs font-semibold transition ${
              currentPage === 'settings' ? 'bg-slate-800 text-amber-500 font-bold' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
            <span>Platform Settings</span>
          </button>
        </nav>

        {/* Desktop Profile Status card */}
        <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="truncate pr-2">
            <span className="block text-[11px] font-bold text-slate-200 truncate">{userId || user.uid}</span>
            <span className="block text-[8px] font-mono text-slate-500 truncate">{user.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-xl cursor-pointer hover:bg-slate-800 transition"
            title="Sign Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </aside>

      {/* MOBILE BAR HEADER AND ACTION CONTROL */}
      <header className="lg:hidden bg-slate-950 text-white py-3.5 px-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40 select-none">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1 text-slate-400 hover:text-white cursor-pointer transition mr-1"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="p-1 px-2 bg-slate-900 border border-slate-800 text-emerald-400 rounded-lg text-[10px] uppercase font-bold tracking-widest ">
            FinTech
          </div>
          <span className="text-xs font-bold leading-none uppercase shrink">Expense Tracker</span>
        </div>
        
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 text-slate-400 hover:text-white cursor-pointer rounded-lg hover:bg-slate-900 transition-colors"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={handleExportToExcel}
            className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
            title="Excel csv export"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MOBILE BACKDROP SIDEBAR OVERLAY */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 bg-slate-950 text-white z-50 p-6 flex flex-col border-r border-slate-850"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">Navigation</span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1.5 overflow-y-auto">
                <button
                  onClick={() => { setCurrentPage('dashboard'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl cursor-pointer text-xs font-semibold ${
                    currentPage === 'dashboard' ? 'bg-slate-900 text-emerald-400' : 'text-slate-400 hover:bg-slate-900/40'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard Overview</span>
                </button>
                
                <button
                  onClick={() => { setCurrentPage('expense'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl cursor-pointer text-xs font-semibold ${
                    currentPage === 'expense' ? 'bg-slate-900 text-rose-400' : 'text-slate-400 hover:bg-slate-900/40'
                  }`}
                >
                  <PiggyBank className="w-4 h-4" />
                  <span>Record Expense</span>
                </button>

                <button
                  onClick={() => { setCurrentPage('income'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl cursor-pointer text-xs font-semibold ${
                    currentPage === 'income' ? 'bg-slate-900 text-emerald-400' : 'text-slate-400 hover:bg-slate-900/40'
                  }`}
                >
                  <Landmark className="w-4 h-4" />
                  <span>Record Income</span>
                </button>

                <button
                  onClick={() => { setCurrentPage('lent'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl cursor-pointer text-xs font-semibold ${
                    currentPage === 'lent' ? 'bg-slate-900 text-violet-400' : 'text-slate-400 hover:bg-slate-900/40'
                  }`}
                >
                  <HandHelping className="w-4 h-4" />
                  <span>Lent Money</span>
                </button>

                <button
                  onClick={() => { setCurrentPage('borrowed'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl cursor-pointer text-xs font-semibold ${
                    currentPage === 'borrowed' ? 'bg-slate-900 text-rose-500' : 'text-slate-400 hover:bg-slate-900/40'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Borrowed Money</span>
                </button>

                <button
                  onClick={() => { setCurrentPage('summary'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl cursor-pointer text-xs font-semibold ${
                    currentPage === 'summary' ? 'bg-slate-900 text-sky-400 font-bold' : 'text-slate-400 hover:bg-slate-900/40'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Friends Balance</span>
                </button>

                <button
                  onClick={() => { setCurrentPage('transactions'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl cursor-pointer text-xs font-semibold ${
                    currentPage === 'transactions' ? 'bg-slate-900 text-emerald-400' : 'text-slate-400 hover:bg-slate-900/40'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Audit Vouchers</span>
                </button>

                <button
                  onClick={() => { setCurrentPage('monthly'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl cursor-pointer text-xs font-semibold ${
                    currentPage === 'monthly' ? 'bg-slate-900 text-indigo-400' : 'text-slate-400 hover:bg-slate-900/40'
                  }`}
                >
                  <CalendarRange className="w-4 h-4" />
                  <span>Monthly Notebook</span>
                </button>

                <button
                  onClick={() => { setCurrentPage('budgets'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl cursor-pointer text-xs font-semibold ${
                    currentPage === 'budgets' ? 'bg-slate-900 text-violet-400' : 'text-slate-400 hover:bg-slate-900/40'
                  }`}
                >
                  <PieChart className="w-4 h-4" />
                  <span>Monthly Budgets</span>
                </button>

                <button
                  onClick={() => { setCurrentPage('categories'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl cursor-pointer text-xs font-semibold ${
                    currentPage === 'categories' ? 'bg-slate-900 text-sky-450' : 'text-slate-400 hover:bg-slate-900/40'
                  }`}
                >
                  <Tags className="w-4 h-4" />
                  <span>Categories Setup</span>
                </button>

                <button
                  onClick={() => { setCurrentPage('settings'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl cursor-pointer text-xs font-semibold ${
                    currentPage === 'settings' ? 'bg-slate-900 text-amber-500' : 'text-slate-400 hover:bg-slate-900/40'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings panel</span>
                </button>
              </nav>

              <div className="pt-4 border-t border-slate-900 text-xs">
                <span className="block font-bold text-slate-350 truncate">{userId || user.uid}</span>
                <span className="block text-[9 px] text-slate-500 truncate">{user.email}</span>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* CENTRAL RENDERED CONTEXT CANVAS */}
      <main className="flex-1 lg:ml-72 p-4 md:p-8 overflow-y-auto">
        
        {/* Desktop control utility top header */}
        <div className="hidden lg:flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Welcome, <span className="text-emerald-500">{userId || user.uid}</span></h2>
          </div>
          <div className="flex items-center space-x-3">
            <motion.button
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setDarkMode(!darkMode)}
              className="inline-flex items-center justify-center p-2.5 glass-btn-premium text-slate-755 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-550" />}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleExportToExcel}
              className="inline-flex items-center space-x-2 px-4 py-2 glass-btn-premium text-slate-705 dark:text-slate-300 cursor-pointer rounded-xl text-xs font-semibold"
            >
              <Download className="w-4 h-4 text-indigo-500" />
              <span>Export CSV</span>
            </motion.button>
            <div className={`p-1.5 px-3 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 shadow-xs border ${
              isOnline 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400' 
                : 'bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400 animate-pulse'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{isOnline ? 'Online Synced' : 'Offline Mode'}</span>
            </div>
          </div>
        </div>

        {/* TRANSITION ROUTE CONTAINER */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:pb-0"
          >
            {currentPage === 'dashboard' && (
              <Dashboard 
                transactions={transactions} 
                lentItems={lentItems} 
                borrowedItems={borrowedItems}
                budgets={budgets}
                darkMode={darkMode}
              />
            )}
            {currentPage === 'expense' && (
              <ExpensesPage 
                categories={expenseCategories} 
                onAddExpense={handleAddExpense} 
              />
            )}
            {currentPage === 'income' && (
              <IncomePage 
                categories={incomeCategories} 
                onAddIncome={handleAddIncome} 
              />
            )}
            {currentPage === 'lent' && (
              <LentPage 
                lentItems={lentItems} 
                onAddLent={handleAddLent} 
                onCancelLent={handleCancelLent}
                onRestoreLent={handleRestoreLent}
                onOpenRepayModal={(id) => {
                  setRepaymentRecordType('lent');
                  setRepaymentRecordId(id);
                  setRepayModalOpen(true);
                }}
                onOpenEditModal={(id) => {
                  setEditPeerRecordType('lent');
                  setEditPeerRecord(lentItems.find(i=>i.id===id) || null);
                  setEditPeerRecordModalOpen(true);
                }}
              />
            )}
            {currentPage === 'borrowed' && (
              <BorrowedPage 
                borrowedItems={borrowedItems} 
                onAddBorrowed={handleAddBorrowed}
                onCancelBorrowed={handleCancelBorrowed}
                onRestoreBorrowed={handleRestoreBorrowed}
                onOpenRepayModal={(id) => {
                  setRepaymentRecordType('borrowed');
                  setRepaymentRecordId(id);
                  setRepayModalOpen(true);
                }}
                onOpenEditModal={(id) => {
                  setEditPeerRecordType('borrowed');
                  setEditPeerRecord(borrowedItems.find(i=>i.id===id) || null);
                  setEditPeerRecordModalOpen(true);
                }}
              />
            )}
            {currentPage === 'summary' && (
              <SummaryPage 
                lentItems={lentItems} 
                borrowedItems={borrowedItems} 
              />
            )}
            {currentPage === 'transactions' && (
              <TransactionsPage 
                transactions={transactions} 
                onOpenEditModal={(id) => {
                  setSelectedEditTx(transactions.find(t=>t.id===id) || null);
                  setEditTxModalOpen(true);
                }}
                onCancelVoucher={(id) => cancelVoucherCommit(id)}
                onRestoreVoucher={(id) => restoreVoucherCommit(id)}
              />
            )}
            {currentPage === 'monthly' && (
              <MonthlyReportPage 
                transactions={transactions} 
              />
            )}
            {currentPage === 'budgets' && (
              <BudgetsPage 
                expenseCategories={expenseCategories} 
                initialBudgets={budgets} 
                onSaveBudgets={handleSaveBudgets} 
              />
            )}
            {currentPage === 'categories' && (
              <CategoriesPage 
                expenseCategories={expenseCategories} 
                incomeCategories={incomeCategories} 
                onAddCategory={handleAddCategory} 
                onDeleteCategory={handleDeleteCategory}
              />
            )}
            {currentPage === 'settings' && (
              <SettingsPage 
                userId={userId} 
                email={user.email || ''} 
                onUpdateUserId={handleUpdateUserId}
                onUpdateEmail={handleUpdateEmail}
                onFixVoucherNumbers={handleFixVoucherNumbers}
                transactions={transactions}
                onRestoreVoucher={(id) => restoreVoucherCommit(id)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* OVERLAY ACTIONS PORTAL MODALS */}
      <EditTransactionModal 
        isOpen={editTxModalOpen} 
        transaction={selectedEditTx} 
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        onClose={() => { setEditTxModalOpen(false); setSelectedEditTx(null); }}
        onSave={saveEditVoucherCommit}
      />

      <RecordRepaymentModal 
        isOpen={repayModalOpen} 
        recordType={repayRecordType} 
        recordId={repayRecordId} 
        lentItems={lentItems} 
        borrowedItems={borrowedItems}
        onClose={() => { setRepayModalOpen(false); setRepaymentRecordType(null); setRepaymentRecordId(null); }}
        onSaveRepayment={handleSaveRepaymentCommit}
      />

      <EditPeerRecordModal 
        isOpen={editPeerRecordModalOpen} 
        recordType={editPeerRecordType} 
        record={editPeerRecord} 
        onClose={() => { setEditPeerRecordModalOpen(false); setEditPeerRecordType(null); setEditPeerRecord(null); }}
        onSaveRecord={handleSavePeerRecordCommit}
      />

      <QuickAddModal
        isOpen={quickAddModalOpen}
        onClose={() => setQuickAddModalOpen(false)}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        onAddExpense={handleAddExpense}
        onAddIncome={handleAddIncome}
        onAddLent={handleAddLent}
        onAddBorrowed={handleAddBorrowed}
        darkMode={darkMode}
      />

      {/* Floating Global Quick Add Button - Desktop Only */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-40 select-none">
        <button
          id="global-quick-add-btn"
          onClick={() => setQuickAddModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-3 bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-50 text-white dark:text-slate-950 rounded-full shadow-lg hover:shadow-xl transition-all duration-155 cursor-pointer transform hover:scale-105 active:scale-95 border border-slate-800 dark:border-slate-200/10"
          title="Quick Add Entry"
          aria-label="Quick Add Entry"
        >
          <Plus className="w-4 h-4 font-extrabold" />
          <span className="text-xs uppercase font-extrabold tracking-wider font-sans">Quick Add</span>
        </button>
      </div>

      {/* High-Fidelity Mobile Floating Pill Tab Bar with iOS 26 liquid glass material */}
      <div className="lg:hidden fixed bottom-5 left-4 right-4 liquid-glass-tab-bar h-16 z-40 flex items-center justify-around px-2 rounded-2xl select-none overflow-visible max-w-lg mx-auto">
        {/* Home Tab */}
        <button
          id="mobile-nav-home"
          onClick={() => setCurrentPage('dashboard')}
          className="relative flex flex-col items-center justify-center flex-1 py-1 cursor-pointer select-none"
        >
          <motion.div
            animate={currentPage === 'dashboard' ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 420, damping: 14 }}
            className={`flex flex-col items-center justify-center ${
              currentPage === 'dashboard'
                ? 'text-indigo-600 dark:text-indigo-300 font-extrabold drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]'
                : 'text-slate-400 dark:text-slate-400/80 hover:text-slate-605 dark:hover:text-white'
            }`}
          >
            <Home className="w-5 h-5 transition-colors" />
            <span className="text-[9px] mt-0.5 font-bold tracking-tight">Home</span>
            {currentPage === 'dashboard' && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute -bottom-1.5 w-5 h-0.5 bg-indigo-500 dark:bg-indigo-305 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.95)]"
                transition={{ type: 'spring', stiffness: 380, damping: 25 }}
              />
            )}
          </motion.div>
        </button>

        {/* Report Tab */}
        <button
          id="mobile-nav-report"
          onClick={() => setCurrentPage('monthly')}
          className="relative flex flex-col items-center justify-center flex-1 py-1 cursor-pointer select-none"
        >
          <motion.div
            animate={currentPage === 'monthly' ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 420, damping: 14 }}
            className={`flex flex-col items-center justify-center ${
              currentPage === 'monthly'
                ? 'text-indigo-600 dark:text-indigo-300 font-extrabold drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]'
                : 'text-slate-400 dark:text-slate-400/80 hover:text-slate-605 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-5 h-5 transition-colors" />
            <span className="text-[9px] mt-0.5 font-bold tracking-tight">Report</span>
            {currentPage === 'monthly' && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute -bottom-1.5 w-5 h-0.5 bg-indigo-500 dark:bg-indigo-305 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.95)]"
                transition={{ type: 'spring', stiffness: 380, damping: 25 }}
              />
            )}
          </motion.div>
        </button>

        {/* Center floating button overlap with vibrant Fusion glow */}
        <div className="w-14 h-12 flex items-center justify-center relative -top-3.5 select-none animate-bounce-slow">
          <div className="absolute inset-0 bg-indigo-500/30 dark:bg-purple-500/35 rounded-full blur-xl animate-pulse" />
          <motion.button
            id="mobile-nav-quickadd"
            whileTap={{ scale: 0.85, rotate: 90 }}
            whileHover={{ scale: 1.12 }}
            onClick={() => setQuickAddModalOpen(true)}
            className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 dark:from-indigo-500 dark:to-purple-500 text-white rounded-full shadow-[0_6px_20px_rgba(99,102,241,0.48)] hover:shadow-xl transition-all duration-150 cursor-pointer border-2 border-white dark:border-slate-900"
            title="Quick Add"
            aria-label="Quick Add"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </motion.button>
        </div>

        {/* Plan Tab */}
        <button
          id="mobile-nav-plan"
          onClick={() => setCurrentPage('budgets')}
          className="relative flex flex-col items-center justify-center flex-1 py-1 cursor-pointer select-none"
        >
          <motion.div
            animate={currentPage === 'budgets' ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 420, damping: 14 }}
            className={`flex flex-col items-center justify-center ${
              currentPage === 'budgets'
                ? 'text-indigo-600 dark:text-indigo-300 font-extrabold drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]'
                : 'text-slate-400 dark:text-slate-400/80 hover:text-slate-605 dark:hover:text-white'
            }`}
          >
            <PieChart className="w-5 h-5 transition-colors" />
            <span className="text-[9px] mt-0.5 font-bold tracking-tight">Plan</span>
            {currentPage === 'budgets' && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute -bottom-1.5 w-5 h-0.5 bg-indigo-500 dark:bg-indigo-305 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.95)]"
                transition={{ type: 'spring', stiffness: 380, damping: 25 }}
              />
            )}
          </motion.div>
        </button>

        {/* Settings Tab */}
        <button
          id="mobile-nav-settings"
          onClick={() => setCurrentPage('settings')}
          className="relative flex flex-col items-center justify-center flex-1 py-1 cursor-pointer select-none"
        >
          <motion.div
            animate={currentPage === 'settings' ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 420, damping: 14 }}
            className={`flex flex-col items-center justify-center ${
              currentPage === 'settings'
                ? 'text-indigo-600 dark:text-indigo-300 font-extrabold drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]'
                : 'text-slate-400 dark:text-slate-400/80 hover:text-slate-605 dark:hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5 transition-colors" />
            <span className="text-[9px] mt-0.5 font-bold tracking-tight">Settings</span>
            {currentPage === 'settings' && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute -bottom-1.5 w-5 h-0.5 bg-indigo-500 dark:bg-indigo-305 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.95)]"
                transition={{ type: 'spring', stiffness: 380, damping: 25 }}
              />
            )}
          </motion.div>
        </button>
      </div>

    </div>
  );
}
