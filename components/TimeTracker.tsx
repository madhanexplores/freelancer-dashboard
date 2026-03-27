'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Play, Square, Trash2, Clock, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TimeEntry {
  id: string;
  task: string;
  duration: number; // in seconds
  date: string;
  userId: string;
  createdAt: any;
}

export default function TimeTracker({ user }: { user: User }) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [task, setTask] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'time_entries'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimeEntry[];
      setEntries(entryData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'time_entries');
    });

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const startTimer = () => {
    if (!task) return;
    setStartTime(Date.now());
    setIsTracking(true);
  };

  const stopTimer = async () => {
    if (!startTime) return;
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    try {
      await addDoc(collection(db, 'time_entries'), {
        task,
        duration,
        date: new Date().toISOString().split('T')[0],
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setIsTracking(false);
      setStartTime(null);
      setElapsedTime(0);
      setTask('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'time_entries');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'time_entries', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `time_entries/${id}`);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Clock className="text-blue-500" />
        Time Tracker
      </h2>

      <div className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            disabled={isTracking}
            placeholder="What are you working on?"
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
          />
          <div className="flex items-center gap-4">
            <div className="text-2xl font-mono font-bold dark:text-white min-w-[120px] text-center">
              {formatTime(elapsedTime)}
            </div>
            {!isTracking ? (
              <button
                onClick={startTimer}
                disabled={!task}
                className="p-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <Play size={24} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={stopTimer}
                className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <Square size={24} fill="currentColor" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 dark:text-white">
          <History size={20} className="text-gray-400" />
          Recent Activity
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white dark:bg-[#111111] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{entry.task}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-500">{entry.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono font-bold text-blue-500">{formatTime(entry.duration)}</span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {entries.length === 0 && (
            <p className="text-center py-8 text-gray-500 dark:text-zinc-500">No time entries yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
