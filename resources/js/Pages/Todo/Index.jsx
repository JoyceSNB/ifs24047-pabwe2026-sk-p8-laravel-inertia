import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import MarkdownEditor from '../../Components/MarkdownEditor';

export default function TodoIndex({ todos, filters = {}, statuses = [], groups = [], activeGroup = null, stats = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const currentGroupId = filters.group_id || '';
    const [activeMenuId, setActiveMenuId] = useState(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.todo-menu-container')) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Todo Form Modal (Create / Edit)
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingTodo, setEditingTodo] = useState(null);
    const form = useForm({
        title: '',
        description: '',
        status: 'pending',
        due_date: '',
        todo_group_id: currentGroupId || '',
    });

    // Todo Delete Modal
    const [deletingTodo, setDeletingTodo] = useState(null);

    // Group Modal (Create / Edit)
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const groupForm = useForm({
        name: '',
        description: '',
        is_public: false,
    });
    const [deletingGroup, setDeletingGroup] = useState(null);

    // Import Modal
    const [showImportModal, setShowImportModal] = useState(false);
    const importForm = useForm({
        importFile: null,
    });

    // Action Processing States for Visual Loading Feedback
    const [togglingTodoId, setTogglingTodoId] = useState(null);
    const [isDeletingTodo, setIsDeletingTodo] = useState(false);
    const [isDeletingGroup, setIsDeletingGroup] = useState(false);
    const [isSavingAi, setIsSavingAi] = useState(false);

    // AI Modal
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiCount, setAiCount] = useState(3);
    const [aiIsGenerating, setAiIsGenerating] = useState(false);
    const [aiGeneratedItems, setAiGeneratedItems] = useState([]);
    const [aiSelectedIndices, setAiSelectedIndices] = useState([]);
    const [aiErrorMessage, setAiErrorMessage] = useState('');

    const handleFilterChange = (newSearch, newStatus, newGroupId = currentGroupId) => {
        router.get('/todos', {
            search: newSearch,
            status: newStatus,
            group_id: newGroupId,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const selectGroup = (groupId) => {
        handleFilterChange(search, statusFilter, groupId);
    };

    const openCreateModal = () => {
        setEditingTodo(null);
        form.setData({
            title: '',
            description: '',
            status: 'pending',
            due_date: '',
            todo_group_id: currentGroupId || '',
        });
        form.clearErrors();
        setShowFormModal(true);
    };

    const openEditModal = (todo) => {
        setEditingTodo(todo);
        form.setData({
            title: todo.title,
            description: todo.description || '',
            status: todo.status,
            due_date: todo.due_date ? todo.due_date.substring(0, 10) : '',
            todo_group_id: todo.todo_group_id || '',
        });
        form.clearErrors();
        setShowFormModal(true);
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (editingTodo) {
            form.put(`/todos/${editingTodo.id}`, {
                onSuccess: () => setShowFormModal(false),
            });
        } else {
            form.post('/todos', {
                onSuccess: () => setShowFormModal(false),
            });
        }
    };

    const toggleComplete = (todo) => {
        setTogglingTodoId(todo.id);
        router.patch(`/todos/${todo.id}/toggle`, {}, {
            preserveScroll: true,
            onFinish: () => setTogglingTodoId(null),
        });
    };

    const confirmDelete = (todo) => {
        setDeletingTodo(todo);
    };

    const executeDelete = () => {
        if (!deletingTodo) return;
        setIsDeletingTodo(true);
        router.delete(`/todos/${deletingTodo.id}`, {
            onSuccess: () => setDeletingTodo(null),
            onFinish: () => setIsDeletingTodo(false),
        });
    };

    // Group Actions
    const openCreateGroupModal = () => {
        setEditingGroup(null);
        groupForm.setData({
            name: '',
            description: '',
            is_public: false,
        });
        groupForm.clearErrors();
        setShowGroupModal(true);
    };

    const openEditGroupModal = (grp) => {
        setEditingGroup(grp);
        groupForm.setData({
            name: grp.name,
            description: grp.description || '',
            is_public: Boolean(grp.is_public),
        });
        groupForm.clearErrors();
        setShowGroupModal(true);
    };

    const submitGroupForm = (e) => {
        e.preventDefault();
        if (editingGroup) {
            groupForm.put(`/todo-groups/${editingGroup.id}`, {
                onSuccess: () => setShowGroupModal(false),
            });
        } else {
            groupForm.post('/todo-groups', {
                onSuccess: () => setShowGroupModal(false),
            });
        }
    };

    const toggleGroupPublic = (grp) => {
        router.patch(`/todo-groups/${grp.id}/toggle-public`, {}, {
            preserveScroll: true,
        });
    };

    const executeDeleteGroup = () => {
        if (!deletingGroup) return;
        setIsDeletingGroup(true);
        router.delete(`/todo-groups/${deletingGroup.id}`, {
            onSuccess: () => {
                setDeletingGroup(null);
                if (currentGroupId === String(deletingGroup.id)) {
                    router.get('/todos');
                }
            },
            onFinish: () => setIsDeletingGroup(false),
        });
    };

    // Import Excel
    const submitImport = (e) => {
        e.preventDefault();
        importForm.post('/todos/import', {
            forceFormData: true,
            onSuccess: () => {
                setShowImportModal(false);
                importForm.reset();
            },
        });
    };

    // AI Generator
    const generateAi = async () => {
        if (!aiPrompt.trim()) return;
        setAiIsGenerating(true);
        setAiErrorMessage('');

        try {
            const res = await fetch('/todos/ai-generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    aiPrompt: aiPrompt,
                    count: Number(aiCount),
                    aiCount: Number(aiCount),
                }),
            });

            const data = await res.json();
            if (!res.ok || data.success === false) {
                let msg = data.message || 'Gagal menghasilkan todo dengan AI.';
                if (data.errors) {
                    const errorList = Object.values(data.errors).flat().join('. ');
                    if (errorList) msg = errorList;
                }
                setAiErrorMessage(msg);
            } else {
                const list = data.todos || data.items || [];
                setAiGeneratedItems(list);
                setAiSelectedIndices(list.map((_, i) => i));
            }
        } catch (err) {
            setAiErrorMessage(err.message || 'Terjadi kesalahan jaringan atau server tidak merespon.');
        } finally {
            setAiIsGenerating(false);
        }
    };

    const toggleAiSelect = (index) => {
        if (aiSelectedIndices.includes(index)) {
            setAiSelectedIndices(aiSelectedIndices.filter((i) => i !== index));
        } else {
            setAiSelectedIndices([...aiSelectedIndices, index]);
        }
    };

    const saveAiGenerated = () => {
        const selected = aiSelectedIndices.map((i) => ({
            ...aiGeneratedItems[i],
            todo_group_id: currentGroupId || null,
        }));
        if (selected.length === 0) return;

        setIsSavingAi(true);
        router.post('/todos/ai-save', { items: selected, todos: selected }, {
            onSuccess: () => {
                setShowAiModal(false);
                setAiGeneratedItems([]);
                setAiSelectedIndices([]);
                setAiPrompt('');
            },
            onFinish: () => setIsSavingAi(false),
        });
    };

    return (
        <AppLayout>
            <Head title="My Todolist" />

            <div className="w-full space-y-6">
                {/* Header Title (Full Width) */}
                <div className="w-full">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daftar Tugas & Kelompok</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Kelola aktivitas harian, kelompokkan ke dalam proyek, dan publikasikan sebagai template siap pakai.
                    </p>
                </div>

                {/* Actions Toolbar (Baris Baru Full Width) */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Tambah Todo</span>
                    </button>

                    <button
                        onClick={openCreateGroupModal}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-xl transition"
                    >
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span>Kelompok</span>
                    </button>

                    <button
                        onClick={() => setShowAiModal(true)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold rounded-xl transition"
                    >
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>AI Generator</span>
                    </button>

                    <a
                        href="/todos/export"
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl transition"
                    >
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Export Excel</span>
                    </a>

                    <button
                        onClick={() => setShowImportModal(true)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition"
                    >
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>Import</span>
                    </button>
                </div>

                {/* Statistics Summary Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Total Todo */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center space-x-3.5">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Todo</span>
                            <div className="flex items-baseline space-x-1.5 mt-0.5">
                                <span className="text-2xl font-black text-slate-900">{stats?.total ?? todos?.total ?? 0}</span>
                                <span className="text-xs text-slate-500 font-medium">tugas</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Selesai */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center space-x-3.5">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Selesai</span>
                            <div className="flex items-baseline space-x-1.5 mt-0.5">
                                <span className="text-2xl font-black text-emerald-600">{stats?.completed ?? 0}</span>
                                <span className="text-xs text-emerald-600 font-medium">selesai</span>
                            </div>
                        </div>
                    </div>

                    {/* Belum Selesai */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center space-x-3.5">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Belum Selesai</span>
                            <div className="flex items-baseline space-x-1.5 mt-0.5">
                                <span className="text-2xl font-black text-amber-600">{stats?.pending ?? 0}</span>
                                <span className="text-xs text-amber-600 font-medium">tugas aktif</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Groups Navigation Tabs */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Kelompok Todo:
                        </span>
                        <Link
                            href="/templates"
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center space-x-1"
                        >
                            <span>Lihat Galeri Template Publik</span>
                            <span>&rarr;</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        <button
                            onClick={() => selectGroup('')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${!currentGroupId
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                        >
                            Semua Todo
                        </button>
                        {groups.map((grp) => (
                            <button
                                key={grp.id}
                                onClick={() => selectGroup(String(grp.id))}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center space-x-1.5 ${currentGroupId === String(grp.id)
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                <span>{grp.name}</span>
                                {grp.is_public && (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${currentGroupId === String(grp.id) ? 'bg-blue-800 text-blue-100' : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                        Template
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Active Group Details Banner (if a group is selected) */}
                {activeGroup && (
                    <div className="bg-linear-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                                <h2 className="text-lg font-bold truncate">{activeGroup.name}</h2>
                                {activeGroup.is_public ? (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                                        Template Publik
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-700 text-slate-300 rounded-full">
                                        Pribadi
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                                {activeGroup.description || 'Tidak ada deskripsi kelompok.'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => toggleGroupPublic(activeGroup)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${activeGroup.is_public
                                        ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    }`}
                            >
                                {activeGroup.is_public ? 'Batalkan Template Publik' : 'Jadikan Template Publik'}
                            </button>
                            <button
                                onClick={() => openEditGroupModal(activeGroup)}
                                className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
                            >
                                Edit Kelompok
                            </button>
                            <button
                                onClick={() => setDeletingGroup(activeGroup)}
                                className="px-3 py-1.5 text-xs font-semibold bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/30 rounded-xl transition"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Cari judul..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                handleFilterChange(e.target.value, statusFilter);
                            }}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <div className="sm:w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                handleFilterChange(search, e.target.value);
                            }}
                            className="w-full py-2 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Semua Status</option>
                            {statuses?.map((st) => (
                                <option key={st.value} value={st.value}>{st.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Todo List View (User Constraint: List bukan Card, tanpa deskripsi) */}
                {todos?.data?.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-slate-800">Belum Ada Todolist</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Mulai tambahkan tugas baru, pilih template publik, atau gunakan AI Generator.
                        </p>
                        <button
                            onClick={openCreateModal}
                            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                        >
                            + Tambah Todo
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100">
                        {todos.data.map((todo) => {
                            const isCompleted = todo.status === 'completed';
                            return (
                                <div
                                    key={todo.id}
                                    className={`p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${isCompleted ? 'bg-slate-50/60' : 'hover:bg-slate-50/80'
                                        }`}
                                >
                                    {/* Left section: Checkbox, Title (Tanpa Deskripsi per user requirement), Badges */}
                                    <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                                        <button
                                            type="button"
                                            onClick={() => toggleComplete(todo)}
                                            disabled={togglingTodoId === todo.id}
                                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${isCompleted
                                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                                    : 'border-slate-300 hover:border-slate-400 bg-white'
                                                } ${togglingTodoId === todo.id ? 'opacity-70 cursor-wait' : ''}`}
                                            title={isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}
                                        >
                                            {togglingTodoId === todo.id ? (
                                                <svg className="animate-spin w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : isCompleted ? (
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : null}
                                        </button>

                                        <div className="min-w-0 flex-1 flex flex-wrap items-center gap-2">
                                            <Link
                                                href={`/todos/${todo.id}`}
                                                className={`font-semibold text-sm hover:text-blue-600 transition truncate max-w-md ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                                                    }`}
                                            >
                                                {todo.title}
                                            </Link>

                                            {/* Group Tag */}
                                            {todo.group && (
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                                                    📁 {todo.group.name}
                                                </span>
                                            )}

                                            {/* Status Badge */}
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${todo.status === 'completed'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : todo.status === 'in_progress'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                {todo.status === 'completed' ? 'Selesai' : todo.status === 'in_progress' ? 'Proses' : 'Pending'}
                                            </span>

                                            {/* Due Date */}
                                            {todo.due_date && (
                                                <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span>{todo.due_date.substring(0, 10)}</span>
                                                </span>
                                            )}

                                            {/* Cover indicator */}
                                            {todo.cover_image_path && (
                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                    📷 Cover
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action dropdown (Vertical Dots Kebab Menu) */}
                                    <div className="relative todo-menu-container shrink-0 pl-8 sm:pl-0">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(activeMenuId === todo.id ? null : todo.id);
                                            }}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                                            title="Menu Tindakan"
                                            aria-label="Menu Tindakan"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                            </svg>
                                        </button>

                                        {activeMenuId === todo.id && (
                                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 animate-fadeIn">
                                                {/* Detail (Primary / Blue) */}
                                                <Link
                                                    href={`/todos/${todo.id}`}
                                                    onClick={() => setActiveMenuId(null)}
                                                    className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 flex items-center space-x-2 transition"
                                                >
                                                    <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    <span>Detail</span>
                                                </Link>

                                                {/* Ubah Edit (Primary / Blue) */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveMenuId(null);
                                                        openEditModal(todo);
                                                    }}
                                                    className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 flex items-center space-x-2 transition text-left"
                                                >
                                                    <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    <span>Ubah Edit</span>
                                                </button>

                                                <div className="border-t border-slate-100 my-1"></div>

                                                {/* Hapus (Merah / Rose) */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveMenuId(null);
                                                        confirmDelete(todo);
                                                    }}
                                                    className="w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition text-left"
                                                >
                                                    <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    <span>Hapus</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {todos?.links?.length > 3 && (
                    <div className="flex items-center justify-center space-x-1 pt-4">
                        {todos.links.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${link.active
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : link.url
                                            ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                            : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create / Edit Todo Modal (Full Screen dengan tombol di sebelah kanan) */}
            {showFormModal && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white">
                    {/* Distinct Header Color */}
                    <div className="px-6 md:px-8 py-4 bg-blue-600 text-white flex items-center justify-between shrink-0 shadow-xs">
                        <div className="flex items-center space-x-3">
                            <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
                                ✓
                            </span>
                            <div>
                                <h3 className="text-base font-bold leading-tight">
                                    {editingTodo ? 'Edit Todo' : 'Tambah Todo Baru'}
                                </h3>
                                <p className="text-xs text-blue-100">Lengkapi judul, kelompok, dan catatan markdown tugas Anda</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowFormModal(false)}
                            className="text-blue-100 hover:text-white p-1.5 rounded-xl hover:bg-blue-700 transition"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={submitForm} className="flex-1 flex flex-col justify-between overflow-hidden">
                        <div className="flex-1 p-6 md:p-8 space-y-5 overflow-y-auto w-full">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Judul Todo *
                                </label>
                                <input
                                    type="text"
                                    value={form.data.title}
                                    onChange={(e) => form.setData('title', e.target.value)}
                                    required
                                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                                    placeholder="Contoh: Belajar Laravel Inertia"
                                />
                                {form.errors.title && <p className="mt-1 text-xs text-rose-600">{form.errors.title}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Kelompok Todo
                                    </label>
                                    <select
                                        value={form.data.todo_group_id}
                                        onChange={(e) => form.setData('todo_group_id', e.target.value)}
                                        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">-- Tanpa Kelompok (Mandiri) --</option>
                                        {groups.map((grp) => (
                                            <option key={grp.id} value={grp.id}>
                                                {grp.name} {grp.is_public ? '(Template Publik)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Status
                                    </label>
                                    <select
                                        value={form.data.status}
                                        onChange={(e) => form.setData('status', e.target.value)}
                                        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">Sedang Dikerjakan</option>
                                        <option value="completed">Selesai</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Tenggat Waktu
                                    </label>
                                    <input
                                        type="date"
                                        value={form.data.due_date}
                                        onChange={(e) => form.setData('due_date', e.target.value)}
                                        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Deskripsi Todo (Toast UI Markdown Editor)
                                </label>
                                <MarkdownEditor
                                    key={editingTodo ? `edit-${editingTodo.id}` : 'create-todo'}
                                    value={form.data.description}
                                    onChange={(val) => form.setData('description', val)}
                                    height="480px"
                                    placeholder="Tuliskan catatan atau rencana detail tugas dalam format Markdown..."
                                />
                                {form.errors.description && <p className="mt-1 text-xs text-rose-600">{form.errors.description}</p>}
                            </div>
                        </div>

                        {/* Distinct Footer Color with Buttons on the Right */}
                        <div className="px-6 md:px-8 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowFormModal(false)}
                                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 flex items-center space-x-2 transition"
                            >
                                {form.processing && (
                                    <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                <span>{form.processing ? 'Menyimpan...' : (editingTodo ? 'Simpan Perubahan' : 'Simpan Todo')}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Kelompok Todo Modal (Create / Edit Group) */}
            {showGroupModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-indigo-100 overflow-hidden">
                        {/* Distinct Header Color */}
                        <div className="px-6 py-4 bg-indigo-700 text-white flex items-center justify-between">
                            <h3 className="text-base font-bold">
                                {editingGroup ? 'Edit Kelompok Todo' : 'Buat Kelompok Todo Baru'}
                            </h3>
                            <button
                                onClick={() => setShowGroupModal(false)}
                                className="text-indigo-200 hover:text-white p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submitGroupForm}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Nama Kelompok / Template *
                                    </label>
                                    <input
                                        type="text"
                                        value={groupForm.data.name}
                                        onChange={(e) => groupForm.setData('name', e.target.value)}
                                        required
                                        className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Contoh: Persiapan Ujian Akhir, Proyek Skripsi, dsb."
                                    />
                                    {groupForm.errors.name && <p className="mt-1 text-xs text-rose-600">{groupForm.errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={groupForm.data.description}
                                        onChange={(e) => groupForm.setData('description', e.target.value)}
                                        className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Jelaskan tujuan atau cakupan tugas dalam kelompok ini..."
                                    />
                                    {groupForm.errors.description && <p className="mt-1 text-xs text-rose-600">{groupForm.errors.description}</p>}
                                </div>

                                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start space-x-3">
                                    <input
                                        type="checkbox"
                                        id="group_is_public"
                                        checked={groupForm.data.is_public}
                                        onChange={(e) => groupForm.setData('is_public', e.target.checked)}
                                        className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                    />
                                    <label htmlFor="group_is_public" className="text-xs text-indigo-950 cursor-pointer">
                                        <span className="font-bold block">Jadikan Template Publik</span>
                                        Template ini dapat dilihat oleh siapapun tanpa perlu login dan dapat digunakan kembali oleh pengguna lain.
                                    </label>
                                </div>
                            </div>

                            {/* Distinct Footer Color */}
                            <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowGroupModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={groupForm.processing}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
                                >
                                    {groupForm.processing && (
                                        <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    <span>{groupForm.processing ? 'Menyimpan...' : (editingGroup ? 'Simpan Perubahan' : 'Buat Kelompok')}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Todo Modal */}
            {deletingTodo && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden">
                        {/* Distinct Header Color */}
                        <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h3 className="text-sm font-bold">Konfirmasi Hapus Todo</h3>
                            </div>
                            <button
                                onClick={() => setDeletingTodo(null)}
                                className="text-rose-200 hover:text-white p-1"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 text-center">
                            <h3 className="text-base font-bold text-slate-900">Hapus Todo Ini?</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Todo "{deletingTodo.title}" beserta lampiran covernya akan dihapus secara permanen.
                            </p>
                        </div>
                        {/* Distinct Footer Color */}
                        <div className="px-6 py-3.5 bg-rose-50 border-t border-rose-100 flex items-center justify-center space-x-2">
                            <button
                                onClick={() => setDeletingTodo(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executeDelete}
                                disabled={isDeletingTodo}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
                            >
                                {isDeletingTodo && (
                                    <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                <span>{isDeletingTodo ? 'Menghapus...' : 'Ya, Hapus Todo'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Group Modal */}
            {deletingGroup && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden">
                        {/* Distinct Header Color */}
                        <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
                            <h3 className="text-sm font-bold">Konfirmasi Hapus Kelompok</h3>
                            <button onClick={() => setDeletingGroup(null)} className="text-rose-200 hover:text-white">✕</button>
                        </div>
                        <div className="p-6 text-center">
                            <h3 className="text-base font-bold text-slate-900">Hapus Kelompok "{deletingGroup.name}"?</h3>
                            <p className="text-xs text-slate-500 mt-2">
                                Kelompok ini akan dihapus. Todo di dalamnya tidak akan terhapus, melainkan diubah menjadi mandiri (tanpa kelompok).
                            </p>
                        </div>
                        {/* Distinct Footer Color */}
                        <div className="px-6 py-3.5 bg-rose-50 border-t border-rose-100 flex items-center justify-center space-x-2">
                            <button
                                onClick={() => setDeletingGroup(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executeDeleteGroup}
                                disabled={isDeletingGroup}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
                            >
                                {isDeletingGroup ? (
                                    <>
                                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Menghapus...</span>
                                    </>
                                ) : (
                                    <span>Ya, Hapus Kelompok</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Excel Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
                        {/* Distinct Header Color */}
                        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
                            <h3 className="text-base font-bold">Import Todolist dari Excel</h3>
                            <button onClick={() => setShowImportModal(false)} className="text-slate-300 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={submitImport}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Pilih File Excel (.xlsx, .xls, .csv)
                                    </label>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(e) => importForm.setData('importFile', e.target.files[0])}
                                        required
                                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {importForm.errors.importFile && (
                                        <p className="mt-1 text-xs text-rose-600">{importForm.errors.importFile}</p>
                                    )}
                                </div>

                                <p className="text-[11px] text-slate-400">
                                    Pastikan file memiliki kolom: Title/Judul, Description/Deskripsi, Status, Due Date.
                                </p>
                            </div>

                            {/* Distinct Footer Color */}
                            <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowImportModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={importForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 flex items-center space-x-1.5"
                                >
                                    {importForm.processing ? (
                                        <>
                                            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Mengimpor...</span>
                                        </>
                                    ) : (
                                        <span>Import Data</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Generator Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-purple-100 overflow-hidden">
                        {/* Distinct Header Color */}
                        <div className="px-6 py-4 bg-purple-700 text-white flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="w-7 h-7 rounded-lg bg-white text-purple-700 flex items-center justify-center font-bold text-xs shadow-xs">
                                    AI
                                </div>
                                <h3 className="text-base font-bold">Rancang Todo dengan OpenAI</h3>
                            </div>
                            <button onClick={() => setShowAiModal(false)} className="text-purple-200 hover:text-white">✕</button>
                        </div>

                        <div className="p-6 space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Instruksi / Rencana Pekerjaan Anda
                                </label>
                                <textarea
                                    rows={3}
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="Contoh: Saya ingin merilis proyek skripsi minggu depan, buatkan jadwal dan tahapan persiapannya..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="flex items-center space-x-3">
                                <label className="text-xs font-semibold text-slate-700">Jumlah Todo:</label>
                                <div className="w-24">
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={aiCount}
                                        onChange={(e) => setAiCount(e.target.value === '' ? '' : Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
                                        onBlur={() => { if (!aiCount || Number(aiCount) < 1) setAiCount(3); }}
                                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-center font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                        placeholder="3"
                                    />
                                </div>
                                <span className="text-xs text-slate-500">tugas</span>

                                <button
                                    type="button"
                                    onClick={generateAi}
                                    disabled={aiIsGenerating || !aiPrompt.trim()}
                                    className="ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 flex items-center space-x-1.5"
                                >
                                    {aiIsGenerating ? (
                                        <>
                                            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Sedang Merancang...</span>
                                        </>
                                    ) : (
                                        <span>Generate Tugas</span>
                                    )}
                                </button>
                            </div>

                            {aiErrorMessage && (
                                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start space-x-2.5 animate-fadeIn">
                                    <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="font-semibold text-rose-800">Gagal Memproses Permintaan AI:</p>
                                        <p className="mt-0.5 leading-relaxed text-rose-700">{aiErrorMessage}</p>
                                    </div>
                                </div>
                            )}

                            {/* Generated Items Preview */}
                            {aiGeneratedItems.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700">
                                            Pilih tugas yang ingin disimpan ({aiSelectedIndices.length}/{aiGeneratedItems.length}):
                                        </span>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                        {aiGeneratedItems.map((item, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => toggleAiSelect(idx)}
                                                className={`p-3 rounded-xl border cursor-pointer transition text-xs flex items-start space-x-2.5 ${aiSelectedIndices.includes(idx)
                                                        ? 'border-purple-500 bg-purple-50/50'
                                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={aiSelectedIndices.includes(idx)}
                                                    onChange={() => { }}
                                                    className="mt-0.5 rounded text-purple-600"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-slate-800">{item.title}</p>
                                                    {item.due_date && (
                                                        <span className="inline-block mt-1 text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded">
                                                            Tenggat: {item.due_date}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Distinct Footer Color */}
                        <div className="px-6 py-3.5 bg-purple-50 border-t border-purple-100 flex items-center justify-end space-x-2">
                            <button
                                type="button"
                                onClick={() => setShowAiModal(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl"
                            >
                                Tutup
                            </button>
                            {aiGeneratedItems.length > 0 && (
                                <button
                                    type="button"
                                    onClick={saveAiGenerated}
                                    disabled={isSavingAi}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
                                >
                                    {isSavingAi ? (
                                        <>
                                            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <span>Simpan Tugas Terpilih ({aiSelectedIndices.length})</span>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
