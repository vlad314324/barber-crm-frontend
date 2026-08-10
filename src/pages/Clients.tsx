import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Plus, Search, Pencil, Trash2, Download, Upload } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { clientApi } from '../api';
import { Client, ImportResult } from '../api/types';
import Modal from '../components/Modal';
import { useLocale } from '../i18n/LocaleContext';
import { getErrorMessage } from '../utils/errors';
import { downloadBlob } from '../utils/download';

const Clients = () => {
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  // Import/export
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await clientApi.getAll();
      setClients(data);
    } catch {
      setError(t('clients.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({ name: '', phone: '', email: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({ name: client.name, phone: client.phone, email: client.email });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone || !formData.email) {
      alert(t('clients.fillAll'));
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
      setClients(prev => prev.filter(c => c._id !== id));
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-ink tracking-tight flex items-center">
          <Users size={24} className="mr-2 text-brand" />
          {t('clients.title')}
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn btn-secondary">
            <Download size={16} /> {t('common.export')}
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary" disabled={importing}>
            <Upload size={16} /> {importing ? t('common.importing') : t('common.import')}
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFileChange} />
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={18} />
            {t('clients.addNew')}
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

        <div className="border-t border-line overflow-x-auto">
          <table className="min-w-full divide-y divide-line">
            <thead className="table-head">
              <tr>
                <th className="px-6 py-3 text-left">{t('clients.tableClient')}</th>
                <th className="px-6 py-3 text-left">{t('clients.tablePhone')}</th>
                <th className="px-6 py-3 text-left">{t('clients.tableVisits')}</th>
                <th className="px-6 py-3 text-left">{t('clients.tableLastVisit')}</th>
                <th className="px-6 py-3 text-right">{t('clients.tableActions')}</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-line">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-ink-muted">{t('common.loading')}</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-red-600">{error}</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-ink-muted">{t('clients.notFound')}</td></tr>
              ) : filteredClients.map((client) => (
                <tr key={client._id} className="hover:bg-canvas-soft transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full ring-1 ring-line"
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=random`}
                        alt={client.name}
                      />
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
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? t('clients.editModalTitle') : t('clients.addModalTitle')}
      >
        <div className="space-y-4">
          <div>
            <label className="field-label">{t('common.name')}</label>
            <input
              type="text"
              className="field-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('clients.namePlaceholder')}
            />
          </div>
          <div>
            <label className="field-label">{t('common.phone')}</label>
            <input
              type="tel"
              className="field-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+380..."
            />
          </div>
          <div>
            <label className="field-label">{t('common.email')}</label>
            <input
              type="email"
              className="field-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('clients.emailPlaceholder')}
            />
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