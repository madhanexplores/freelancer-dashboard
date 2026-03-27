'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Briefcase, Calendar, Tag, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Income {
  id: string;
  source: string;
  amount: number;
  category: string;
  date: string;
  userId: string;
  createdAt: any;
}

export default function IncomeTracker({ user }: { user: User }) {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Project');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const q = query(
      collection(db, 'incomes'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const incomeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Income[];
      setIncomes(incomeData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'incomes');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || !amount) return;

    try {
      await addDoc(collection(db, 'incomes'), {
        source,
        amount: parseFloat(amount),
        category,
        date,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setSource('');
      setAmount('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'incomes');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'incomes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `incomes/${id}`);
    }
  };

  const categories = ['Project', 'Retainer', 'Consulting', 'Passive', 'Other'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Briefcase className="text-green-500" />
          Income Tracker
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">Source</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g., Website Redesign"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full md:w-auto px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Income
        </button>
      </form>

      <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-800">
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">Source</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">Category</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">Date</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase text-right">Amount</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
            <AnimatePresence>
              {incomes.map((income) => (
                <motion.tr
                  key={income.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{income.source}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-md text-xs font-medium">
                      {income.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-zinc-500">{income.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-bold text-right">₹{income.amount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(income.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {incomes.length === 0 && (
          <div className="p-12 text-center text-gray-500 dark:text-zinc-500">
            <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
            <p>No incomes recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
