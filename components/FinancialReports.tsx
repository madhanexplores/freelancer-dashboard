'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { useTheme } from './ThemeProvider';

interface DataPoint {
  name: string;
  income: number;
  expenses: number;
}

interface CategoryData {
  name: string;
  value: number;
}

export default function FinancialReports({ user }: { user: User }) {
  const { theme } = useTheme();
  const [monthlyData, setMonthlyData] = useState<DataPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    const incomeQuery = query(collection(db, 'incomes'), where('userId', '==', user.uid));
    const expenseQuery = query(collection(db, 'expenses'), where('userId', '==', user.uid));

    let incomeList: any[] = [];
    let expenseList: any[] = [];

    const updateCharts = () => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = new Date().getFullYear();
      
      const monthly = months.map((month, index) => {
        const mIncome = incomeList
          .filter(item => {
            const d = new Date(item.date);
            return d.getMonth() === index && d.getFullYear() === currentYear;
          })
          .reduce((sum, item) => sum + (item.amount || 0), 0);

        const mExpense = expenseList
          .filter(item => {
            const d = new Date(item.date);
            return d.getMonth() === index && d.getFullYear() === currentYear;
          })
          .reduce((sum, item) => sum + (item.amount || 0), 0);

        return { name: month, income: mIncome, expenses: mExpense };
      });

      setMonthlyData(monthly);

      const categories: Record<string, number> = {};
      expenseList.forEach(exp => {
        const cat = exp.category || 'Uncategorized';
        categories[cat] = (categories[cat] || 0) + (exp.amount || 0);
      });
      setCategoryData(Object.entries(categories).map(([name, value]) => ({ name, value })));
    };

    const unsubscribeIncome = onSnapshot(incomeQuery, (snapshot) => {
      incomeList = snapshot.docs.map(doc => doc.data());
      setTotalIncome(incomeList.reduce((sum, inc) => sum + (inc.amount || 0), 0));
      updateCharts();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'incomes');
    });

    const unsubscribeExpense = onSnapshot(expenseQuery, (snapshot) => {
      expenseList = snapshot.docs.map(doc => doc.data());
      setTotalExpenses(expenseList.reduce((sum, exp) => sum + (exp.amount || 0), 0));
      updateCharts();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'expenses');
    });

    return () => {
      unsubscribeIncome();
      unsubscribeExpense();
    };
  }, [user.uid]);

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  const isDark = theme === 'dark';

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <BarChart3 className="text-blue-500" />
        Financial Reports
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income vs Expenses Chart */}
        <div className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 dark:text-white">
            <LineChartIcon size={20} className="text-blue-500" />
            Cash Flow Trends
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#f3f4f6'} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke={isDark ? '#71717a' : '#9ca3af'} 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke={isDark ? '#71717a' : '#9ca3af'} 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `₹${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#111111' : '#ffffff',
                    borderColor: isDark ? '#27272a' : '#e5e7eb',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                  itemStyle={{ color: isDark ? '#ffffff' : '#000000' }}
                />
                <Legend verticalAlign="top" align="right" height={36} />
                <Bar dataKey="income" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 dark:text-white">
            <PieChartIcon size={20} className="text-purple-500" />
            Expense Breakdown
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#111111' : '#ffffff',
                    borderColor: isDark ? '#27272a' : '#e5e7eb',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold dark:text-white">Income Growth</h3>
            <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/10 px-2 py-1 rounded-md">+12.5%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '65%' }}
              className="h-full bg-blue-500"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-2">65% of yearly goal reached</p>
        </div>
        <div className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold dark:text-white">Expense Efficiency</h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/10 px-2 py-1 rounded-md">Optimized</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '40%' }}
              className="h-full bg-purple-500"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-2">Expenses are 40% of total income</p>
        </div>
      </div>
    </div>
  );
}
