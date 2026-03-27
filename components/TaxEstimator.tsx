'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Calculator, Info, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { motion } from 'motion/react';

export default function TaxEstimator({ user }: { user: User }) {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [taxRate, setTaxRate] = useState(20); // Default 20%

  useEffect(() => {
    const incomeQuery = query(collection(db, 'incomes'), where('userId', '==', user.uid));
    const unsubscribeIncome = onSnapshot(incomeQuery, (snapshot) => {
      const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
      setTotalIncome(total);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'incomes');
    });

    const expenseQuery = query(collection(db, 'expenses'), where('userId', '==', user.uid));
    const unsubscribeExpense = onSnapshot(expenseQuery, (snapshot) => {
      const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
      setTotalExpenses(total);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'expenses');
    });

    return () => {
      unsubscribeIncome();
      unsubscribeExpense();
    };
  }, [user.uid]);

  const taxableIncome = Math.max(0, totalIncome - totalExpenses);
  const estimatedTax = (taxableIncome * taxRate) / 100;
  const netAfterTax = taxableIncome - estimatedTax;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Calculator className="text-indigo-500" />
        Tax Estimator
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 dark:bg-green-900/10 text-green-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Taxable Income</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{taxableIncome.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-1">(Income - Expenses)</p>
        </div>

        <div className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-lg">
              <TrendingDown size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Estimated Tax</span>
          </div>
          <p className="text-2xl font-bold text-red-600">₹{estimatedTax.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-1">Based on {taxRate}% rate</p>
        </div>

        <div className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 rounded-lg">
              <Wallet size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Net After Tax</span>
          </div>
          <p className="text-2xl font-bold text-green-600">₹{netAfterTax.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-1">Take-home estimate</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tax Settings</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-500">
              <Info size={16} />
              Consult a tax professional for exact figures
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-700 dark:text-zinc-300">Estimated Tax Rate</span>
              <span className="text-indigo-600 dark:text-indigo-400">{taxRate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={taxRate}
              onChange={(e) => setTaxRate(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold tracking-wider">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-900/20">
          <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
            <strong>Tip:</strong> As a freelancer, you can often deduct business expenses like software subscriptions, hardware, and home office costs from your total income to reduce your taxable amount.
          </p>
        </div>
      </div>
    </div>
  );
}
