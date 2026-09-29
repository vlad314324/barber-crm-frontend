import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Plus, Search, Pencil, Trash2, Download, Upload, MoreVertical, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { clientApi } from '../api';
import { Client, ImportResult } from '../api/types';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import { useLocale } from '../i18n/LocaleContext';
import { getErrorMessage } from '../utils/errors';
import { downloadBlob } from '../utils/download';
import { missingFields, errorFieldClass } from '../utils/formValidation';

type SortBy = 'name' | 'visits' | 'lastVisit' | 'createdAt';
type SortDir = 'asc' | 'desc';
const PAGE_LIMIT = 25;
const SEARCH_DEBOUNCE_MS = 300;

const Clients = () => {
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Import/export
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Меню "Ще" — на вузьких екранах ховає Експорт/Імпорт за іконкою.
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Дебаунс пошуку — інакше кожен символ бив би окремим запитом на бекенд;
  // зміна пошукового запиту скидає на першу сторінку.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await clientApi.getPage({ page, limit: PAGE_LIMIT, search: debouncedSearch, sortBy, sortDir });
      setClients(data.clients);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setError(null);
    } catch {
      setError(t('clients.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, sortBy, sortDir, t]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const toggleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortBy }) => {
    if (sortBy !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={13} className="inline ml-0.5" /> : <ChevronDown size={13} className="inline ml-0.5" />;
  };

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({ name: '', phone: '', email: '' });
    setFieldErrors(new Set());
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({ name: client.name, phone: client.phone, email: client.email });
    setFieldErrors(new Set());
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const missing = missingFields(formData, ['name', 'phone', 'email']);
    if (missing.size > 0) {
      setFieldErrors(missing);
      return;
    }
    setSaving(true);
    try {
      if (editingClient) {
        await clientApi.update(editingClient._id, formData);
      } else {
        await clientApi.create(formData);
      }
      setIsModalOpen(false);
      fetchClients();
    } catch (err) {
      alert(getErrorMessage(err) || t('clients.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('clients.deleteConfirm'))) return;
    try {
      await clientApi.delete(id);
      fetchClients();
    } catch {
      alert(t('clients.deleteError'));
    }
  };

  const handleExport = async () => {
    try {
      downloadBlob(await clientApi.export(), `clients-${Date.now()}.xlsx`);
    } catch {
      alert(t('common.exportError'));
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      setImportResult(await clientApi.import(file));
      fetchClients();
    } catch (err) {
      alert(getErrorMessage(err) || t('common.importError'));
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight flex items-center min-w-0">
          <Users size={24} className="mr-2 text-brand flex-shrink-0" />
          <span className="truncate">{t('clients.title')}</span>
        </h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={handleExport} className="btn btn-secondary">
              <Download size={16} /> {t('common.export')}
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary" disabled={importing}>
              <Upload size={16} /> {importing ? t('common.importing') : t('common.import')}
            </button>
          </div>

          <div ref={actionsMenuRef} className="relative sm:hidden">
            <button onClick={() => setShowActionsMenu(v => !v)} className="btn btn-secondary p-2" aria-label={t('common.more')}>
              <MoreVertical size={16}/>
            </button>
            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-line rounded-md shadow-lg z-30 overflow-hidden">
                <button onClick={() => { handleExport(); setShowActionsMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-canvas-soft">
                  <Download size={15}/> {t('common.export')}
                </button>
                <button onClick={() => { fileInputRef.current?.click(); setShowActionsMenu(false); }} disabled={importing}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-canvas-soft">
                  <Upload size={15}/> {importing ? t('common.importing') : t('common.import')}
                </button>
              </div>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFileChange} />
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={18} />
            <span className="hidden sm:inline">{t('clients.addNew')}</span>
          </button>
        </div>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="px-5 py-4">
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-ink-muted" />
            </div>
            <input
              className="field-input pl-10"
              placeholder={t('clients.searchPlaceholder')}
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="border-t border-line overflow-x-auto overflow-y-auto max-h-[65vh]">
          <table className="min-w-full divide-y divide-line">
            <thead className="table-head sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left cursor-pointer select-none hover:text-ink" onClick={() => toggleSort('name')}>
                  {t('clients.tableClient')}<SortIcon field="name" />
                </th>
                <th className="px-6 py-3 text-left">{t('clients.tablePhone')}</th>
                <th className="px-6 py-3 text-left cursor-pointer select-none hover:text-ink" onClick={() => toggleSort('visits')}>
                  {t('clients.tableVisits')}<SortIcon field="visits" />
                </th>
                <th className="px-6 py-3 text-left">{t('clients.tableLastVisit')}</th>
                <th className="px-6 py-3 text-right">{t('clients.tableActions')}</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-line">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-ink-muted">{t('common.loading')}</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-red-600">{error}</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-ink-muted">{t('clients.notFound')}</td></tr>
              ) : clients.map((client) => (
                <tr key={client._id} className="hover:bg-canvas-soft transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar name={client.name} size={40} className="ring-1 ring-line" />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-ink">{client.name}</div>
                        <div className="text-sm text-ink-muted">{client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">{client.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-secondary">{client.visits || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-secondary">
                    {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString() : t('common.na')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      <Link to={`/clients/${client._id}`} className="text-brand hover:text-brand-dark">{t('clients.view')}</Link>
                      <button onClick={() => openEditModal(client)} className="text-ink-secondary hover:text-ink">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(client._id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !error && total > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-line text-sm">
            <span className="text-ink-muted">{t('clients.totalCount', { count: total })}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-secondary p-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={t('clients.prevPage')}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-ink-secondary">{t('clients.pageInfo', { page, totalPages })}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn btn-secondary p-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={t('clients.nextPage')}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? t('clients.editModalTitle') : t('clients.addModalTitle')}
      >
        <div className="space-y-4">
          <div>
            <label className="field-label">{t('common.name')} <span className="text-red-500">*</span></label>
            <input
              type="text"
              className={`field-input ${errorFieldClass(fieldErrors.has('name'))}`}
              value={formData.name}
              onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFieldErrors(prev => { const n = new Set(prev); n.delete('name'); return n; }); }}
              placeholder={t('clients.namePlaceholder')}
            />
            {fieldErrors.has('name') && <p className="text-xs text-red-500 mt-1">{t('common.fieldRequired')}</p>}
          </div>
          <div>
            <label className="field-label">{t('common.phone')} <span className="text-red-500">*</span></label>
            <input
              type="tel"
              className={`field-input ${errorFieldClass(fieldErrors.has('phone'))}`}
              value={formData.phone}
              onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setFieldErrors(prev => { const n = new Set(prev); n.delete('phone'); return n; }); }}
              placeholder="+380..."
            />
            {fieldErrors.has('phone') && <p className="text-xs text-red-500 mt-1">{t('common.fieldRequired')}</p>}
          </div>
          <div>
            <label className="field-label">{t('common.email')} <span className="text-red-500">*</span></label>
            <input
              type="email"
              className={`field-input ${errorFieldClass(fieldErrors.has('email'))}`}
              value={formData.email}
              onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setFieldErrors(prev => { const n = new Set(prev); n.delete('email'); return n; }); }}
              placeholder={t('clients.emailPlaceholder')}
            />
            {fieldErrors.has('email') && <p className="text-xs text-red-500 mt-1">{t('common.fieldRequired')}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? t('common.saving') : editingClient ? t('common.save') : t('clients.addNew')}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!importResult} onClose={() => setImportResult(null)} title={t('common.importResultTitle')}>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-medium">{t('common.importCreated', { count: importResult?.created ?? 0 })}</span>
            <span className="text-brand font-medium">{t('common.importUpdated', { count: importResult?.updated ?? 0 })}</span>
            <span className="text-red-500 font-medium">{t('common.importFailed', { count: importResult?.failed ?? 0 })}</span>
          </div>
          {importResult && importResult.errors.length > 0 && (
            <div className="border-t border-line pt-2 space-y-1">
              {importResult.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-500">
                  {t('common.importRowError', { row: e.row })}: {e.message}
                </p>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button onClick={() => setImportResult(null)} className="btn btn-secondary">{t('common.close')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Clients;
