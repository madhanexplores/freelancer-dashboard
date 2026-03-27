'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { FileText, Plus, Trash2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Note {
  id: string;
  content: string;
  date: string;
  userId: string;
  createdAt: any;
}

export default function DailyNotes({ user }: { user: User }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'notes'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const noteData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      setNotes(noteData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notes');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    try {
      await addDoc(collection(db, 'notes'), {
        content,
        date: new Date().toISOString().split('T')[0],
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setContent('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'notes');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notes/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <FileText className="text-blue-500" />
        Daily Notes
      </h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write down your thoughts, ideas, or meeting notes..."
          className="w-full h-32 px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white resize-none"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors font-medium flex items-center gap-2"
        >
          <Plus size={18} />
          Save Note
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">
                  <Calendar size={14} />
                  {note.date}
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-gray-800 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{note.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
