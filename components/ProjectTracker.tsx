'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp, orderBy, updateDoc } from 'firebase/firestore';
import { FolderKanban, Plus, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Project {
  id: string;
  name: string;
  client: string;
  status: 'active' | 'completed' | 'on-hold';
  deadline: string;
  userId: string;
  createdAt: any;
}

export default function ProjectTracker({ user, compact = false }: { user: User, compact?: boolean }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'on-hold'>('active');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !client) return;

    try {
      await addDoc(collection(db, 'projects'), {
        name,
        client,
        status,
        deadline,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setName('');
      setClient('');
      setDeadline('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'active' | 'completed' | 'on-hold') => {
    try {
      await updateDoc(doc(db, 'projects', id), {
        status: newStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${id}`);
    }
  };

  if (compact) {
    return (
      <div className="space-y-4">
        {projects.slice(0, 5).map((project) => (
          <div key={project.id} className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              project.status === 'completed' ? 'bg-green-500' : 
              project.status === 'on-hold' ? 'bg-yellow-500' : 'bg-blue-500'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{project.name}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">{project.client}</p>
            </div>
          </div>
        ))}
        {projects.length === 0 && <p className="text-sm text-gray-500 dark:text-zinc-500">No projects tracked yet.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <FolderKanban className="text-blue-500" />
        Project Tracker
      </h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Website Redesign"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">Client</label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="e.g., Acme Corp"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase">Deadline</label>
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
          Add Project
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{project.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">{project.client}</p>
                </div>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Status</label>
                  <select
                    value={project.status}
                    onChange={(e) => handleStatusChange(project.id, e.target.value as any)}
                    className={`w-full text-xs font-bold px-2 py-1 rounded-md outline-none transition-colors ${
                      project.status === 'completed' ? 'bg-green-50 dark:bg-green-900/10 text-green-600' : 
                      project.status === 'on-hold' ? 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-600' : 
                      'bg-blue-50 dark:bg-blue-900/10 text-blue-600'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Deadline</label>
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-zinc-400">
                    <Clock size={12} />
                    {project.deadline || 'None'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
