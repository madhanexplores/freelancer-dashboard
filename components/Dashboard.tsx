'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import ExpenseTracker from './ExpenseTracker';
import IncomeTracker from './IncomeTracker';
import GoalTracker from './GoalTracker';
import DailyNotes from './DailyNotes';
import Reminders from './Reminders';
import ProjectTracker from './ProjectTracker';
import ClientManager from './ClientManager';
import TaxEstimator from './TaxEstimator';
import FinancialReports from './FinancialReports';
import TimeTracker from './TimeTracker';
import { useTheme, Theme } from './ThemeProvider';
import { LogOut, LayoutDashboard, Receipt, Target, FileText, Bell, Sun, Moon, TrendingUp, TrendingDown, Wallet, FolderKanban, Users, Calculator, BarChart3, Clock, Palette, Download, Menu, X, PieChart as PieChartIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type Tab = 'dashboard' | 'income' | 'expenses' | 'goals' | 'notes' | 'reminders' | 'projects' | 'clients' | 'tax' | 'reports' | 'time';

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [goalProgress, setGoalProgress] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  useEffect(() => {
    if (activeTab !== 'dashboard') return;

    // Fetch total income for overview
    const incomeQuery = query(collection(db, 'incomes'), where('userId', '==', user.uid));
    const unsubscribeIncome = onSnapshot(incomeQuery, (snapshot) => {
      const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
      setTotalIncome(total);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'incomes');
    });

    // Fetch total expenses for overview
    const expenseQuery = query(collection(db, 'expenses'), where('userId', '==', user.uid));
    const unsubscribeExpense = onSnapshot(expenseQuery, (snapshot) => {
      const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
      setTotalExpenses(total);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'expenses');
    });

    // Fetch goals for progress calculation
    const goalsQuery = query(collection(db, 'goals'), where('userId', '==', user.uid));
    const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
      if (snapshot.empty) {
        setGoalProgress(0);
        return;
      }
      const totalProgress = snapshot.docs.reduce((sum, doc) => {
        const data = doc.data();
        const progress = (data.currentAmount / data.targetAmount) * 100;
        return sum + Math.min(progress, 100);
      }, 0);
      setGoalProgress(Math.round(totalProgress / snapshot.size));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'goals');
    });

    return () => {
      unsubscribeIncome();
      unsubscribeExpense();
      unsubscribeGoals();
    };
  }, [user.uid, activeTab]);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'income', label: 'Income', icon: Wallet },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'tax', label: 'Tax', icon: Calculator },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const themes: { id: Theme; label: string; color: string }[] = [
    { id: 'light', label: 'Light', color: 'bg-white' },
    { id: 'dark', label: 'Dark', color: 'bg-zinc-900' },
    { id: 'midnight', label: 'Midnight', color: 'bg-slate-950' },
    { id: 'forest', label: 'Forest', color: 'bg-emerald-950' },
    { id: 'sunset', label: 'Sunset', color: 'bg-red-950' },
  ];

  const netProfit = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#0A0A0A] transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 -ml-2 text-gray-500 dark:text-zinc-400"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black text-sm font-bold">FH</div>
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">Freelancer Hub</span>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              {deferredPrompt && (
                <button
                  onClick={handleInstall}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-full hover:bg-blue-600 transition-colors"
                >
                  <Download size={14} />
                  Install
                </button>
              )}

              <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-colors"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>

              <div className="relative group">
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-colors">
                  <Palette size={20} />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#111111] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest px-2 mb-2">Select Theme</p>
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        theme === t.id ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border border-gray-200 dark:border-zinc-700 ${t.color}`} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-gray-200 dark:border-zinc-800">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{user.displayName}</p>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-500">Freelancer</p>
                </div>
                {user.photoURL ? (
                  <Image src={user.photoURL} alt="" width={32} height={32} className="rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center text-gray-500 text-xs">{user.displayName?.charAt(0)}</div>
                )}
                <button onClick={onLogout} className="text-gray-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/50 z-30 md:hidden"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#111111] z-40 md:hidden p-4 shadow-2xl"
              >
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black text-sm font-bold">FH</div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">Freelancer Hub</span>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as Tab);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                        activeTab === item.id
                          ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
                          : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <item.icon size={20} />
                      {item.label}
                    </button>
                  ))}
                </nav>
                <div className="absolute bottom-4 left-4 right-4">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                  >
                    <LogOut size={20} />
                    Logout
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hi, {user.displayName?.split(' ')[0]}</h1>
                    <p className="text-gray-500 dark:text-zinc-400 mt-1">Here&apos;s your business at a glance.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">Active</span>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full">Pro Plan</span>
                  </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                        <TrendingUp size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">+12%</span>
                    </div>
                    <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Total Income</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{totalIncome.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                        <TrendingDown size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">-5%</span>
                    </div>
                    <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{totalExpenses.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                        <Wallet size={20} />
                      </div>
                    </div>
                    <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Net Profit</p>
                    <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{netProfit.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                        <Target size={20} />
                      </div>
                    </div>
                    <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Goal Progress</p>
                    <div className="flex items-end justify-between mt-1">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{goalProgress}%</p>
                    </div>
                    <div className="mt-3 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${goalProgress}%` }}
                        className="h-full bg-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Charts and Widgets Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Charts and Projects */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                      <h3 className="text-lg font-bold mb-6 dark:text-white flex items-center gap-2">
                        <PieChartIcon className="text-indigo-500" size={20} />
                        Financial Overview
                      </h3>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Income', value: totalIncome || 0.1 }, // Avoid 0 for pie chart rendering
                                { name: 'Expenses', value: totalExpenses || 0.1 }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              <Cell fill="#10b981" />
                              <Cell fill="#ef4444" />
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: theme === 'light' ? '#fff' : '#111',
                                borderColor: theme === 'light' ? '#e5e7eb' : '#27272a',
                                color: theme === 'light' ? '#000' : '#fff'
                              }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                          <FolderKanban className="text-blue-500" size={20} />
                          Active Projects
                        </h3>
                        <button onClick={() => setActiveTab('projects')} className="text-xs font-bold text-blue-500 hover:underline">View All</button>
                      </div>
                      <ProjectTracker user={user} compact />
                    </div>
                  </div>
                  
                  {/* Right Column: Goals, Reminders, Clients */}
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                          <Target className="text-orange-500" size={20} />
                          Goal Progress
                        </h3>
                        <button onClick={() => setActiveTab('goals')} className="text-xs font-bold text-orange-500 hover:underline">View All</button>
                      </div>
                      <GoalTracker user={user} compact />
                    </div>

                    <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                      <h3 className="text-lg font-bold mb-6 dark:text-white flex items-center gap-2">
                        <Bell className="text-red-500" size={20} />
                        Reminders
                      </h3>
                      <Reminders user={user} compact />
                    </div>

                    <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                      <h3 className="text-lg font-bold mb-6 dark:text-white flex items-center gap-2">
                        <Users className="text-purple-500" size={20} />
                        Top Clients
                      </h3>
                      <ClientManager user={user} compact />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'income' && <IncomeTracker user={user} />}
            {activeTab === 'expenses' && <ExpenseTracker user={user} />}
            {activeTab === 'time' && <TimeTracker user={user} />}
            {activeTab === 'projects' && <ProjectTracker user={user} />}
            {activeTab === 'clients' && <ClientManager user={user} />}
            {activeTab === 'goals' && <GoalTracker user={user} />}
            {activeTab === 'notes' && <DailyNotes user={user} />}
            {activeTab === 'reminders' && <Reminders user={user} />}
            {activeTab === 'tax' && <TaxEstimator user={user} />}
            {activeTab === 'reports' && <FinancialReports user={user} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
