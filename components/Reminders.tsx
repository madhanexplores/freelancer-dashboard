'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp, orderBy, updateDoc } from 'firebase/firestore';
import { Bell, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Reminder {
  id: string;
  text: string;
  date: string;
  time: string;
  userId: string;
  completed: boolean;
  createdAt: any;
}

export default function Reminders({ user, compact = false }: { user: User, compact?: boolean }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [text, setText] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('12:00');

  useEffect(() => {
    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reminderData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reminder[];
      setReminders(reminderData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reminders');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return;

    try {
      await addDoc(collection(db, 'reminders'), {
        text,
        date,
        time,
        userId: user.uid,
        completed: false,
        createdAt: serverTimestamp()
      });
      setText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reminders');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reminders', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reminders/${id}`);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'reminders', id), {
        completed: !current
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reminders/${id}`);
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {reminders.slice(0, 5).map((reminder) => (
          <div key={reminder.id} className="flex items-center gap-3">
            <button onClick={() => handleToggle(reminder.id, reminder.completed)}>
              {reminder.completed ? (
                <CheckCircle2 size={18} className="text-green-500" />
              ) : (
                <Circle size={18} className="text-gray-300 dark:text-zinc-700" />
              )}
            </button>
            <span className={`text-sm flex-1 ${reminder.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-zinc-300'}`}>
              {reminder.text}
            </span>
            <span className="text-xs text-gray-400">{reminder.date}</span>
          </div>
        ))}
        {reminders.length === 0 && <p className="text-sm text-gray-500 dark:text-zinc-500">No upcoming reminders.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Bell className="text-red-500" />
        Reminders
      </h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">Reminder</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g., Follow up with John Doe"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">Date & Time</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-24 px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors font-medium flex items-center gap-2"
        >
          <Plus size={18} />
          Add Reminder
        </button>
      </form>

      <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm divide-y divide-gray-100 dark:divide-zinc-800">
        <AnimatePresence>
          {reminders.map((reminder) => (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors"
            >
              <button 
                onClick={() => handleToggle(reminder.id, reminder.completed)}
                className="transition-transform active:scale-90"
              >
                {reminder.completed ? (
                  <CheckCircle2 size={24} className="text-green-500" />
                ) : (
                  <Circle size={24} className="text-gray-300 dark:text-zinc-700 hover:text-gray-400" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-base font-medium ${reminder.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                  {reminder.text}
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-500">
                  {reminder.date} at {reminder.time}
                </p>
              </div>
              <button
                onClick={() => handleDelete(reminder.id)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {reminders.length === 0 && (
          <div className="p-12 text-center text-gray-500 dark:text-zinc-500">
            <Bell size={48} className="mx-auto mb-4 opacity-20" />
            <p>No reminders set.</p>
          </div>
        )}
      </div>
    </div>
  );
}
