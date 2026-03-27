'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Target, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  userId: string;
  completed: boolean;
}

export default function GoalTracker({ user, compact = false }: { user: User, compact?: boolean }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null);
  const [updateAmount, setUpdateAmount] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'goals'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Goal[];
      setGoals(goalData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'goals');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;

    try {
      const goalData: any = {
        title,
        targetAmount: parseFloat(targetAmount),
        currentAmount: 0,
        userId: user.uid,
        completed: false,
        createdAt: serverTimestamp()
      };
      
      if (deadline) {
        goalData.deadline = deadline;
      }

      await addDoc(collection(db, 'goals'), goalData);
      setTitle('');
      setTargetAmount('');
      setDeadline('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'goals');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'goals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `goals/${id}`);
    }
  };

  const handleUpdateProgress = async (id: string, current: number, target: number) => {
    if (!updateAmount || isNaN(parseFloat(updateAmount))) return;
    
    const amountToAdd = parseFloat(updateAmount);
    const newAmount = current + amountToAdd;
    try {
      await updateDoc(doc(db, 'goals', id), {
        currentAmount: newAmount,
        completed: newAmount >= target
      });
      setUpdatingGoalId(null);
      setUpdateAmount('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `goals/${id}`);
    }
  };

  if (compact) {
    return (
      <div className="space-y-4">
        {goals.slice(0, 3).map((goal) => (
          <div key={goal.id} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium dark:text-white">{goal.title}</span>
              <span className="text-gray-500 dark:text-zinc-400">
                {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                className="h-full bg-orange-500"
              />
            </div>
          </div>
        ))}
        {goals.length === 0 && <p className="text-sm text-gray-500 dark:text-zinc-500">No active goals.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Target className="text-orange-500" />
        Financial Goals
      </h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">Goal Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., New MacBook Pro"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">Target Amount (₹)</label>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">Deadline (Optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
            />
          </div>
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors font-medium flex items-center gap-2"
        >
          <Plus size={18} />
          Set Goal
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {goals.map((goal) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {goal.title}
                    {goal.completed && <CheckCircle2 size={18} className="text-green-500" />}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">Deadline: {goal.deadline || 'No deadline'}</p>
                </div>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-zinc-400">Progress</span>
                  <span className="font-bold dark:text-white">₹{goal.currentAmount.toLocaleString('en-IN')} / ₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                    className={`h-full ${goal.completed ? 'bg-green-500' : 'bg-orange-500'}`}
                  />
                </div>
              </div>

              {!goal.completed && (
                <div className="pt-2">
                  {updatingGoalId === goal.id ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={updateAmount}
                        onChange={(e) => setUpdateAmount(e.target.value)}
                        placeholder="Amount to add"
                        className="flex-1 px-3 py-1 text-sm bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateProgress(goal.id, goal.currentAmount, goal.targetAmount)}
                        className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setUpdatingGoalId(null);
                          setUpdateAmount('');
                        }}
                        className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setUpdatingGoalId(goal.id)}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Update Progress
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
