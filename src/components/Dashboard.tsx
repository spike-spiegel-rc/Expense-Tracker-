import React, { useMemo, useState } from 'react';
import { Transaction, Budget, LentBorrowedRecord } from '../types';
import { formatAED, formatDateUAE, escapeHtml } from '../utils';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Building2, 
  ShieldAlert, 
  UserCheck, 
  Clock, 
  Activity,
  Award,
  Bell
} from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  lentItems: LentBorrowedRecord[];
  borrowedItems: LentBorrowedRecord[];
  budgets: Budget;
  darkMode: boolean;
}

export default function Dashboard({ transactions, lentItems, borrowedItems, budgets, darkMode }: DashboardProps) {
  // Local state for Month & Year filters
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Dynamically extract all available years from transactions
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    transactions.forEach(t => {
      if (t.date) {
        const yr = t.date.split('-')[0];
        if (yr && yr.length === 4) {
          yearsSet.add(yr);
        }
      }
    });
    // Fallback/Default to current year if no transactions exist yet
    yearsSet.add(new Date().getFullYear().toString());
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const months = [
    { value: 'all', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Filter active transactions (not cancelled)
  const activeTx = useMemo(() => {
    return transactions.filter(t => t.status !== 'cancelled');
  }, [transactions]);

  // Current scope filtered transactions for high-level numbers
  const filteredActiveTx = useMemo(() => {
    return activeTx.filter(t => {
      if (!t.date) return false;
      const [yr, mo] = t.date.split('-');
      if (selectedYear !== 'all' && yr !== selectedYear) return false;
      if (selectedMonth !== 'all' && mo !== selectedMonth) return false;
      return true;
    });
  }, [activeTx, selectedMonth, selectedYear]);

  // Aggregate high-level parameters based on filtered active transactions
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let cash = 0;
    let bank = 0;

    filteredActiveTx.forEach(t => {
      const amt = Number(t.amount || 0);
      if (t.type === 'income') {
        income += amt;
        if (t.paymentMethod === 'cash') cash += amt;
        else bank += amt;
      } else {
        expense += amt;
        if (t.paymentMethod === 'cash') cash -= amt;
        else bank -= amt;
      }
    });

    // Active Lent and Borrowed balances
    const lentAsset = lentItems
      .filter(i => {
        if (i.recordStatus === 'cancelled') return false;
        if (!i.date) return true;
        const [yr, mo] = i.date.split('-');
        if (selectedYear !== 'all' && yr !== selectedYear) return false;
        if (selectedMonth !== 'all' && mo !== selectedMonth) return false;
        return true;
      })
      .reduce((s, i) => s + (Number(i.amount || 0) * 100 - Number(i.repaid || 0) * 100), 0) / 100;

    const borrowedLiability = borrowedItems
      .filter(i => {
        if (i.recordStatus === 'cancelled') return false;
        if (!i.date) return true;
        const [yr, mo] = i.date.split('-');
        if (selectedYear !== 'all' && yr !== selectedYear) return false;
        if (selectedMonth !== 'all' && mo !== selectedMonth) return false;
        return true;
      })
      .reduce((s, i) => s + (Number(i.amount || 0) * 100 - Number(i.repaid || 0) * 100), 0) / 100;

    const friendsPosition = lentAsset - borrowedLiability;

    return {
      income,
      expense,
      balance: income - expense,
      cash,
      bank,
      lent: lentAsset,
      borrowed: borrowedLiability,
      friendsPosition
    };
  }, [filteredActiveTx, lentItems, borrowedItems, selectedYear, selectedMonth]);

  // Percentage change (MoM or YoY depending on the selected scope)
  const percentChange = useMemo(() => {
    let currentNet = 0;
    let prevNet = 0;
    const now = new Date();

    if (selectedYear !== 'all' && selectedMonth !== 'all') {
      // Month-over-month for specific month/year
      const currYear = parseInt(selectedYear);
      const currMonth = parseInt(selectedMonth) - 1; // 0-indexed
      const prevYear = currMonth === 0 ? currYear - 1 : currYear;
      const prevMonth = currMonth === 0 ? 11 : currMonth - 1;

      activeTx.forEach(t => {
        if (!t.date) return;
        const d = new Date(`${t.date}T00:00:00`);
        const amt = Number(t.amount || 0);
        const isIncome = t.type === 'income';

        if (d.getFullYear() === currYear && d.getMonth() === currMonth) {
          currentNet += isIncome ? amt : -amt;
        }
        if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
          prevNet += isIncome ? amt : -amt;
        }
      });
    } else if (selectedYear !== 'all') {
      // Year-over-year for chosen year
      const currYear = parseInt(selectedYear);
      const prevYear = currYear - 1;

      activeTx.forEach(t => {
        if (!t.date) return;
        const d = new Date(`${t.date}T00:00:00`);
        const amt = Number(t.amount || 0);
        const isIncome = t.type === 'income';

        if (d.getFullYear() === currYear) {
          currentNet += isIncome ? amt : -amt;
        }
        if (d.getFullYear() === prevYear) {
          prevNet += isIncome ? amt : -amt;
        }
      });
    } else {
      // Default: current month vs prev month
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;

      activeTx.forEach(t => {
        if (!t.date) return;
        const d = new Date(`${t.date}T00:00:00`);
        const amt = Number(t.amount || 0);
        const isIncome = t.type === 'income';

        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          currentNet += isIncome ? amt : -amt;
        }
        if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
          prevNet += isIncome ? amt : -amt;
        }
      });
    }

    const isAnnual = selectedYear !== 'all' && selectedMonth === 'all';
    const labelLabel = isAnnual ? 'Compared to last year' : 'Compared to last month';

    if (prevNet === 0) return { percent: '0.0', isPositive: true, label: labelLabel };
    const change = ((currentNet - prevNet) / Math.abs(prevNet)) * 100;
    return {
      percent: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
      label: labelLabel
    };
  }, [activeTx, selectedMonth, selectedYear]);

  // Pie Chart category calculations (based on filtered active transactions)
  const pieData = useMemo(() => {
    const map: { [cat: string]: number } = {};
    filteredActiveTx.forEach(t => {
      if (t.type === 'expense') {
        map[t.category] = (map[t.category] || 0) + Number(t.amount || 0);
      }
    });
    const result = Object.entries(map).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    }));
    return result.length ? result : [{ name: 'No Expenses Recorded', value: 0 }];
  }, [filteredActiveTx]);

  const PIE_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec489a', '#14b8a6', '#06b6d4', '#64748b'];

  // Trend calculations (Shows either full selections of the year, or relative past 6 months)
  const trendData = useMemo(() => {
    const monthsList: { year: number; month: number; label: string }[] = [];
    if (selectedYear !== 'all') {
      // All 12 months of that year
      for (let m = 0; m < 12; m++) {
        const d = new Date(parseInt(selectedYear), m, 1);
        monthsList.push({
          year: parseInt(selectedYear),
          month: m,
          label: d.toLocaleString('en-US', { month: 'short' })
        });
      }
    } else {
      // Past 6 calendar months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const label = d.toLocaleString('en-US', { month: 'short' });
        monthsList.push({ year: d.getFullYear(), month: d.getMonth(), label: `${label} '${String(d.getFullYear()).slice(-2)}` });
      }
    }

    const incArr = Array(monthsList.length).fill(0);
    const expArr = Array(monthsList.length).fill(0);

    activeTx.forEach(t => {
      const txDate = new Date(`${t.date}T00:00:00`);
      monthsList.forEach((m, idx) => {
        if (txDate.getFullYear() === m.year && txDate.getMonth() === m.month) {
          if (t.type === 'income') {
            incArr[idx] += Number(t.amount || 0);
          } else {
            expArr[idx] += Number(t.amount || 0);
          }
        }
      });
    });

    return monthsList.map((m, idx) => ({
      month: m.label,
      Income: parseFloat(incArr[idx].toFixed(2)),
      Expense: parseFloat(expArr[idx].toFixed(2))
    }));
  }, [activeTx, selectedYear]);

  // Comprehensive financial growth tracking
  const growthData = useMemo(() => {
    const monthsList: { year: number; month: number; label: string }[] = [];
    if (selectedYear !== 'all') {
      // All 12 months of that year
      for (let m = 0; m < 12; m++) {
        const d = new Date(parseInt(selectedYear), m, 1);
        monthsList.push({
          year: parseInt(selectedYear),
          month: m,
          label: d.toLocaleString('en-US', { month: 'short' })
        });
      }
    } else {
      // Past 6 calendar months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const label = d.toLocaleString('en-US', { month: 'short' });
        monthsList.push({ year: d.getFullYear(), month: d.getMonth(), label: `${label} '${String(d.getFullYear()).slice(-2)}` });
      }
    }

    const incArr = Array(monthsList.length).fill(0);
    const expArr = Array(monthsList.length).fill(0);

    activeTx.forEach(t => {
      const txDate = new Date(`${t.date}T00:00:00`);
      monthsList.forEach((m, idx) => {
        if (txDate.getFullYear() === m.year && txDate.getMonth() === m.month) {
          if (t.type === 'income') {
            incArr[idx] += Number(t.amount || 0);
          } else {
            expArr[idx] += Number(t.amount || 0);
          }
        }
      });
    });

    let totalIncome = 0;
    let totalExpense = 0;

    const dataPoints = monthsList.map((m, idx) => {
      const income = incArr[idx];
      const expense = expArr[idx];
      const growth = income - expense;
      totalIncome += income;
      totalExpense += expense;
      
      return {
        month: m.label,
        Income: parseFloat(income.toFixed(2)),
        Expense: parseFloat(expense.toFixed(2)),
        Growth: parseFloat(growth.toFixed(2))
      };
    });

    const netGrowth = totalIncome - totalExpense;
    const actualSavingsRate = totalIncome > 0 ? (netGrowth / totalIncome) * 100 : 0;

    return {
      dataPoints,
      totalIncome,
      totalExpense,
      netGrowth,
      savingsRate: parseFloat(actualSavingsRate.toFixed(1))
    };
  }, [activeTx, selectedYear]);

  // Current month's custom budget warnings
  const progressBudgets = useMemo(() => {
    const now = new Date();
    const currYear = selectedYear !== 'all' ? parseInt(selectedYear) : now.getFullYear();
    const currMonth = selectedMonth !== 'all' ? parseInt(selectedMonth) - 1 : now.getMonth();
    const spentMap: { [cat: string]: number } = {};

    activeTx.forEach(t => {
      if (t.type === 'expense') {
        const d = new Date(`${t.date}T00:00:00`);
        if (d.getFullYear() === currYear && d.getMonth() === currMonth) {
          spentMap[t.category] = (spentMap[t.category] || 0) + Number(t.amount || 0);
        }
      }
    });

    return Object.entries(budgets).map(([cat, budget]) => {
      const spent = spentMap[cat] || 0;
      const percent = budget ? (spent / budget) * 100 : 0;
      let colorClass = 'bg-emerald-500';
      if (percent >= 100) colorClass = 'bg-rose-500';
      else if (percent >= 85) colorClass = 'bg-amber-500';

      return {
        category: cat,
        budget,
        spent,
        percent: parseFloat(percent.toFixed(1)),
        colorClass
      };
    });
  }, [activeTx, budgets, selectedYear, selectedMonth]);

  // Latest 5 vouchers based on filtering scope
  const recentTx = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return true;
      const [yr, mo] = t.date.split('-');
      if (selectedYear !== 'all' && yr !== selectedYear) return false;
      if (selectedMonth !== 'all' && mo !== selectedMonth) return false;
      return true;
    }).slice(0, 5);
  }, [transactions, selectedYear, selectedMonth]);

  return (
    <div className="space-y-6">
      {/* Month & Year Filter Scope Selector */}
      <div className="flex items-center justify-between glass-card-premium p-3 px-4 rounded-2xl border border-white/20 dark:border-slate-800/40">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-xs font-bold text-slate-705 dark:text-slate-200 uppercase tracking-wider">Period</span>
        </div>
        <div className="flex items-center space-x-2">
          <select
            id="dashboard-year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200/50 dark:border-slate-800/70 text-slate-700 dark:text-slate-250 py-1.5 px-3 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer transition shadow-xs"
          >
            <option value="all">All Years</option>
            {availableYears.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          <select
            id="dashboard-month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200/50 dark:border-slate-800/70 text-slate-700 dark:text-slate-250 py-1.5 px-3 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer transition shadow-xs"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.value === 'all' ? 'All Months' : m.label}</option>
            ))}
          </select>

          {(selectedMonth !== 'all' || selectedYear !== 'all') && (
            <button
              onClick={() => {
                setSelectedMonth('all');
                setSelectedYear('all');
              }}
              className="py-1 px-2.5 rounded-xl text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Prime Balance Card - Styled with gradient purple identical to mockup */}
        <div className="col-span-2 bg-gradient-to-br from-indigo-650 via-purple-650 to-indigo-750 text-white p-6 rounded-3xl border border-indigo-500/30 shadow-[0_15px_35px_-5px_rgba(99,102,241,0.35)] flex flex-col justify-between relative overflow-hidden h-full">
          {/* Mockup Accessories */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-purple-500/15 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-2.5">
              {/* Mockup Yellow Avatar */}
              <div className="w-10 h-10 rounded-full bg-amber-400 border border-amber-300 flex items-center justify-center font-bold text-slate-900 text-sm shadow-inner shrink-0 select-none">
                <span className="relative -top-0.5">👤</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-extrabold tracking-widest text-indigo-200">Current Balance</span>
                <span className="block text-xs font-semibold text-white/90">Main Net Portfolio</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-white/10 backdrop-blur-xs rounded-full text-[9px] font-bold text-white uppercase tracking-wider">
                {selectedMonth === 'all' ? 'Active' : selectedMonth} {selectedYear === 'all' ? '' : selectedYear}
              </span>
              <div className="relative p-1.5 bg-white/10 rounded-full text-white cursor-pointer hover:bg-white/20 transition">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-purple-600 animate-ping" style={{ animationDuration: '3s' }} />
              </div>
            </div>
          </div>

          <div className="my-1">
            <div className="text-3xl font-extrabold tracking-tight truncate filter drop-shadow-xs">
              {formatAED(totals.balance)}
            </div>
            <p className="text-[10px] text-indigo-100 flex items-center mt-1.5 space-x-1.5">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${percentChange.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                {percentChange.isPositive ? '+' : ''}{percentChange.percent}%
              </span>
              <span>than previous period</span>
            </p>
          </div>

          <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-[10px] text-indigo-200 uppercase tracking-wider font-bold">
            <span>{percentChange.label}</span>
            <span className="font-semibold text-white">Active</span>
          </div>
        </div>

        {/* Total Income */}
        <div className="glass-card-premium prism-border p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Aggregate Income</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg"><ArrowUpRight className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-slate-800 dark:text-white truncate">{formatAED(totals.income)}</div>
            <p className="text-[10px] text-zinc-500 dark:text-slate-400 mt-1">Cumulated earnings</p>
          </div>
        </div>

        {/* Total Expense */}
        <div className="glass-card-premium prism-border p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Aggregate Expense</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 rounded-lg"><ArrowDownRight className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-slate-800 dark:text-white truncate">{formatAED(totals.expense)}</div>
            <p className="text-[10px] text-zinc-500 dark:text-slate-400 mt-1">Total recorded spendings</p>
          </div>
        </div>

        {/* Cash Balance */}
        <div className="glass-card-premium prism-border p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cash Liquidity</span>
            <span className="p-1.5 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-lg"><Coins className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <div className="text-lg font-bold text-slate-800 dark:text-white truncate">{formatAED(totals.cash)}</div>
            <p className="text-[10px] text-zinc-500 dark:text-slate-400 mt-1">Physical wallet float</p>
          </div>
        </div>

        {/* Bank Balance */}
        <div className="glass-card-premium prism-border p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Bank Holdings</span>
            <span className="p-1.5 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-lg"><Building2 className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <div className="text-lg font-bold text-slate-800 dark:text-white truncate">{formatAED(totals.bank)}</div>
            <p className="text-[10px] text-zinc-500 dark:text-slate-400 mt-1">Checking / credit stores</p>
          </div>
        </div>

        {/* Lent Money */}
        <div className="glass-card-premium prism-border p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Lent to Friends</span>
            <span className="p-1.5 bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 rounded-lg"><UserCheck className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <div className="text-lg font-bold text-slate-800 dark:text-white truncate">{formatAED(totals.lent)}</div>
            <p className="text-[10px] text-violet-500 dark:text-violet-400 tracking-tight mt-1">Receivables (Asset)</p>
          </div>
        </div>

        {/* Borrowed Obligations */}
        <div className="glass-card-premium prism-border p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Borrowed Money</span>
            <span className="p-1.5 bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg"><ShieldAlert className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <div className="text-lg font-bold text-slate-800 dark:text-white truncate">{formatAED(totals.borrowed)}</div>
            <p className="text-[10px] text-rose-500 dark:text-rose-400 tracking-tight mt-1">Obligations (Liability)</p>
          </div>
        </div>
      </div>

      {/* 6-Month Financial Growth Analysis */}
      <div className="hidden lg:block glass-card-premium prism-border p-6 rounded-3xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-500 animate-pulse" />
              <span>6-Month Financial Growth Insight</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Comparing monthly recurring income streams vs spending speed to visualize actual growth</p>
          </div>
          <span className="mt-2 sm:mt-0 px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-350 text-[10px] font-bold rounded-full uppercase tracking-wider">
            6-Month Trajectory
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Growth stats sidebar */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-50 dark:border-slate-800 rounded-2xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Cumulative Periodic Influx</span>
              <span className="text-lg font-bold text-slate-800 dark:text-white block mt-1">{formatAED(growthData.totalIncome)}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center space-x-1 mt-1">
                <ArrowUpRight className="subpixel-antialiased w-3 h-3" />
                <span>Salary / business inflows</span>
              </span>
            </div>
            
            <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-50 dark:border-slate-800 rounded-2xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Cumulative Periodic Spent</span>
              <span className="text-lg font-bold text-slate-800 dark:text-white block mt-1">{formatAED(growthData.totalExpense)}</span>
              <span className="text-[10px] text-rose-500 dark:text-rose-400 font-medium flex items-center space-x-1 mt-1">
                <ArrowDownRight className="subpixel-antialiased w-3 h-3" />
                <span>Voucher expenditures</span>
              </span>
            </div>

            <div className="p-4 bg-indigo-50/40 dark:bg-indigo-955/10 border border-indigo-50 dark:border-indigo-950/40 rounded-2xl col-span-2 lg:col-span-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Net Wealth Appreciation</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${growthData.netGrowth >= 0 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'}`}>
                  Savings: {growthData.savingsRate}%
                </span>
              </div>
              <span className={`text-xl font-extrabold block mt-2 ${growthData.netGrowth >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-450'}`}>
                {formatAED(growthData.netGrowth)}
              </span>
              <p className="text-[10px] text-indigo-500 dark:text-indigo-350 font-medium mt-1">Aggregate saved capital this half year</p>
            </div>
          </div>

          {/* Line Chart comparing Income vs Expenses and Growth */}
          <div className="lg:col-span-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData.dataPoints} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                <Tooltip 
                  formatter={(value, name) => [`${formatAED(Number(value))}`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, border: 'none', color: '#fff', fontSize: 11 }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" style={{ fontSize: 11 }} />
                <Line type="monotone" name="Income Flow" dataKey="Income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Expense Flow" dataKey="Expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Net Growth" dataKey="Growth" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Visual Analytics Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend chart */}
        <div className="hidden lg:block glass-card-premium prism-border p-6 rounded-3xl">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Monthly Cash Trends</span>
          </h3>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, border: 'none', color: '#fff', fontSize: 11 }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" style={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card-premium prism-border p-6 rounded-3xl flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Award className="w-4 h-4 text-indigo-500" />
            <span>Expense Category Density</span>
          </h3>
          <div className="h-64 w-full relative flex items-center justify-center">
            {pieData[0]?.value === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium col-span-2">
                No active expenses recorded on this scope.
              </div>
            ) : (
              <>
                {/* Absolute Centered KPI Label mirroring mockup, perfectly placed using top/left percentage */}
                <div className="absolute top-[41%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center pointer-events-none select-none z-10">
                  <span className="text-[9px] uppercase font-extrabold tracking-widest text-slate-400 dark:text-slate-500">Total Expenses</span>
                  <span className="text-base font-extrabold text-slate-800 dark:text-white mt-0.5 filter drop-shadow-xs">{formatAED(totals.expense)}</span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      label={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `${formatAED(Number(value))}`}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, border: 'none', color: '#fff', fontSize: 11 }} 
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      iconSize={8}
                      iconType="circle"
                      formatter={(value) => <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Budgets Progress Overview */}
      <div className="glass-card-premium prism-border p-6 rounded-3xl">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span>Active Monthly Budget Thresholds</span>
        </h3>
        
        {progressBudgets.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">No active budgets formulated. Configure limits under the Budgets tab.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {progressBudgets.map((pt, i) => {
              // Category icon/emoji and background mapping
              const getCategoryEmojiAndBg = (cat: string) => {
                const norm = cat.toLowerCase();
                if (norm.includes('food') || norm.includes('grocer') || norm.includes('cafe') || norm.includes('restaur') || norm.includes('eat')) {
                  return { emoji: '🍹', bg: 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400' };
                }
                if (norm.includes('trans') || norm.includes('car') || norm.includes('taxi') || norm.includes('fuel') || norm.includes('travel')) {
                  return { emoji: '🚗', bg: 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-450' };
                }
                if (norm.includes('rent') || norm.includes('util') || norm.includes('house') || norm.includes('bill') || norm.includes('stay')) {
                  return { emoji: '🏠', bg: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' };
                }
                if (norm.includes('enter') || norm.includes('movi') || norm.includes('show') || norm.includes('play') || norm.includes('game')) {
                  return { emoji: '🎬', bg: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400' };
                }
                if (norm.includes('health') || norm.includes('medic') || norm.includes('doctor') || norm.includes('pharm') || norm.includes('fit')) {
                  return { emoji: '🩺', bg: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' };
                }
                if (norm.includes('shop') || norm.includes('clothe') || norm.includes('mall') || norm.includes('gift') || norm.includes('buy')) {
                  return { emoji: '🛍️', bg: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450' };
                }
                return { emoji: '📦', bg: 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400' };
              };

              const categoryStyle = getCategoryEmojiAndBg(pt.category);
              const percentClapped = Math.min(pt.percent, 100);
              const radius = 17;
              const strokeWidth = 3;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (percentClapped / 100) * circumference;
              const isOver = pt.percent >= 100;
              const circleColor = isOver ? '#f43f5e' : (pt.percent >= 80 ? '#f59e0b' : '#6366f1');

              return (
                <div key={i} className="p-4 rounded-2xl border border-slate-50 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950 flex items-center justify-between gap-3 transition">
                  <div className="flex items-center space-x-3 truncate">
                    {/* Icon container */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shadow-xs shrink-0 select-none ${categoryStyle.bg}`}>
                      {categoryStyle.emoji}
                    </div>
                    {/* Information */}
                    <div className="truncate">
                      <span className="block text-xs font-bold text-slate-800 dark:text-white truncate">{pt.category}</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                        {formatAED(pt.spent)} / {formatAED(pt.budget)}
                      </span>
                    </div>
                  </div>

                  {/* High-Fidelity SVG Progress Ring */}
                  <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                    <svg className="w-11 h-11 transform -rotate-90">
                      <circle
                        cx="22"
                        cy="22"
                        r={radius}
                        className="stroke-slate-100 dark:stroke-slate-800/50"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                      />
                      <circle
                        cx="22"
                        cy="22"
                        r={radius}
                        stroke={circleColor}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[8px] font-extrabold text-slate-800 dark:text-slate-205">{pt.percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Ledger Vouchers */}
      <div className="glass-card-premium prism-border p-6 rounded-3xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <Coins className="w-4 h-4 text-emerald-500" />
            <span>Recent Vouchers</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[9px] tracking-widest font-semibold">
                <th className="py-3 px-2">Vch No</th>
                <th className="py-3 px-2">Date</th>
                <th className="py-3 px-2">Type</th>
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2 text-right">Amount</th>
                <th className="py-3 px-2 text-center">Payment</th>
                <th className="py-3 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {recentTx.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 dark:text-slate-500">
                    No transactions recorded in current profile.
                  </td>
                </tr>
              ) : (
                recentTx.map((t, idx) => {
                  const isExpense = t.type === 'expense';
                  const isCancelled = t.status === 'cancelled';
                  return (
                    <tr key={t.id || idx} className={`${isCancelled ? 'line-through text-slate-400 opacity-60' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'} transition`}>
                      <td className="py-3.5 px-2 font-mono font-medium text-slate-900 dark:text-slate-100">{t.voucherNumber}</td>
                      <td className="py-3.5 px-2 font-mono-data">{formatDateUAE(t.date)}</td>
                      <td className="py-3.5 px-2">
                        <span className={`inline-flex items-center space-x-1 font-semibold text-[10px] uppercase.`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isExpense ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          <span className={isExpense ? 'text-rose-600 dark:text-rose-450' : 'text-emerald-600 dark:text-emerald-450'}>
                            {t.type}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 px-2 font-medium">{t.category}</td>
                      <td className={`py-3.5 px-2 text-right font-mono-data font-bold ${isExpense ? 'text-rose-600 dark:text-rose-450' : 'text-emerald-600 dark:text-emerald-450'}`}>
                        {formatAED(t.amount)}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] uppercase font-semibold">
                          {t.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          isCancelled 
                            ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-400' 
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
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
    </div>
  );
}
