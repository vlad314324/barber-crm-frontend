import { useState, useEffect } from 'react';
import { User, Plus, Star, Scissors, Pencil, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { employeeApi, reviewApi } from '../api';
import { Employee } from '../api/types';
import Modal from '../components/Modal';

const DAYS = [
  { key: 'mon', label: 'Пн' },
  { key: 'tue', label: 'Вт' },
  { key: 'wed', label: 'Ср' },
  { key: 'thu', label: 'Чт' },
  { key: 'fri', label: 'Пт' },
  { key: 'sat', label: 'Сб' },
  { key: 'sun', label: 'Нд' },
] as const;

const OFF = 'Вихідний';

const defaultSchedule = {
  mon: '09:00-18:00', tue: '09:00-18:00', wed: '09:00-18:00',
  thu: '09:00-18:00', fri: '09:00-18:00', sat: '10:00-16:00', sun: OFF,
};

const defaultForm = {
  name: '', phone: '', email: '',
  role: 'Barber' as Employee['role'],
  hourlyRate: 0, isAvailable: true,
  specialties: '', bio: '',
  schedule: { ...defaultSchedule },
};

interface Review {
  _id: string;
  client: { name: string } | string;
  rating: number;
  text: string;
  createdAt: string;
}

const Stars = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size}
        className={i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}/>
    ))}
  </div>
);

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string|null>(null);

  // add/edit modal
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [editingEmployee,setEditingEmployee]= useState<Employee|null>(null);
  const [formData,       setFormData]       = useState(defaultForm);
  const [saving,         setSaving]         = useState(false);

  // reviews modal
  const [reviewsEmp,    setReviewsEmp]    = useState<Employee|null>(null);
  const [reviews,       setReviews]       = useState<Review[]>([]);
  const [reviewsLoading,setReviewsLoading]= useState(false);
  const [newReview,     setNewReview]     = useState({ rating: 5, text: '' });
  const [addingReview,  setAddingReview]  = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setEmployees(await employeeApi.getAll());
    } catch { setError('Не вдалося завантажити.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchEmployees(); }, []);

  // ── open add/edit ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingEmployee(null);
    setFormData(defaultForm);
    setIsModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name, phone: emp.phone, email: emp.email,
      role: emp.role, hourlyRate: emp.hourlyRate,
      isAvailable: emp.isAvailable,
      specialties: emp.specialties?.join(', ') || '',
      bio: emp.bio || '',
      schedule: emp.schedule
        ? { ...defaultSchedule, ...emp.schedule }
        : { ...defaultSchedule },
    });
    setIsModalOpen(true);
  };

  // ── schedule helpers ───────────────────────────────────────────────────────
  const toggleDay = (day: string) => {
    const cur = (formData.schedule as any)[day];
    setFormData(p => ({
      ...p,
      schedule: {
        ...p.schedule,
        [day]: cur === OFF ? '09:00-18:00' : OFF,
      },
    }));
  };

  const setDayHours = (day: string, value: string) => {
    setFormData(p => ({
      ...p,
      schedule: { ...p.schedule, [day]: value },
    }));
  };

  // ── save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      alert("Заповніть обов'язкові поля"); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (editingEmployee) {
        await employeeApi.update(editingEmployee._id, payload);
      } else {
        await employeeApi.create(payload);
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Помилка збереження');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Видалити майстра?')) return;
    try {
      await employeeApi.delete(id);
      setEmployees(p => p.filter(e => e._id !== id));
    } catch { alert('Помилка видалення'); }
  };

  // ── reviews ────────────────────────────────────────────────────────────────
  const openReviews = async (emp: Employee) => {
    setReviewsEmp(emp);
    setReviewsLoading(true);
    try {
      const data = await reviewApi.getAll();
      setReviews((data as any[]).filter((r: any) => {
        const eid = typeof r.employee === 'object' ? r.employee._id : r.employee;
        return eid === emp._id;
      }));
    } catch { setReviews([]); }
    finally { setReviewsLoading(false); }
  };

  const submitReview = async () => {
    if (!reviewsEmp) return;
    setAddingReview(true);
    try {
      await reviewApi.create({
        employee: reviewsEmp._id,
        client: '000000000000000000000000', // placeholder — в реальній системі брати з auth
        rating: newReview.rating,
        comment: newReview.text,
      } as any);
      setNewReview({ rating: 5, text: '' });
      openReviews(reviewsEmp);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Помилка');
    } finally { setAddingReview(false); }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <User size={24} className="mr-2 text-indigo-600"/> Employees
        </h1>
        <button onClick={openAdd}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
          <Plus size={20} className="mr-2 -ml-1"/> Add New Employee
        </button>
      </div>

      {loading ? <div className="text-center py-8 text-gray-500">Завантаження...</div>
      : error   ? <div className="text-center py-8 text-red-500">{error}</div>
      : employees.length === 0 ? <div className="text-center py-8 text-gray-500">Майстрів не знайдено</div>
      : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map(emp => (
            <div key={emp._id} className="bg-white shadow rounded-lg overflow-hidden flex flex-col">

              {/* Header */}
              <div className="p-5 flex items-start gap-4">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random&size=128`}
                  alt={emp.name} className="h-14 w-14 rounded-full flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{emp.name}</h3>
                  <p className="text-sm text-indigo-600">{emp.role}</p>
                  <p className="text-xs text-gray-500 truncate">{emp.email}</p>
                  {(emp.rating || 0) > 0 ? (
                    <button onClick={() => openReviews(emp)}
                      className="flex items-center gap-1 mt-1 hover:opacity-80">
                      <Stars rating={emp.rating || 0}/>
                      <span className="text-xs text-gray-500">
                        {(emp.rating || 0).toFixed(1)} ({emp.reviewCount || 0})
                      </span>
                    </button>
                  ) : (
                    <button onClick={() => openReviews(emp)}
                      className="text-xs text-gray-400 mt-1 hover:text-indigo-600">
                      Немає відгуків
                    </button>
                  )}
                </div>
              </div>

              {/* Bio */}
              {emp.bio && (
                <div className="px-5 pb-2">
                  <p className="text-xs text-gray-500 italic">{emp.bio}</p>
                </div>
              )}

              {/* Specialties */}
              {(emp.specialties?.length || 0) > 0 && (
                <div className="px-5 pb-3 flex flex-wrap gap-1">
                  {emp.specialties.map((s, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                      <Scissors size={10} className="mr-1"/>{s}
                    </span>
                  ))}
                </div>
              )}

              {/* Schedule */}
              <div className="px-5 pb-4">
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {DAYS.map(({ key, label }) => {
                    const val = emp.schedule?.[key as keyof typeof emp.schedule] || '';
                    const isOff = val === OFF || val === 'Off' || val === '';
                    return (
                      <div key={key}>
                        <p className="text-xs font-medium text-gray-500">{label}</p>
                        <div className={`mt-0.5 py-0.5 rounded text-xs ${isOff ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                          {isOff ? '×' : '✓'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center mt-auto">
                <span className={`text-xs px-2 py-1 rounded-full ${emp.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {emp.isAvailable ? 'Available' : 'Unavailable'}
                </span>
                <div className="flex gap-3">
                  <button onClick={() => openEdit(emp)} className="text-gray-500 hover:text-gray-700">
                    <Pencil size={15}/>
                  </button>
                  <button onClick={() => handleDelete(emp._id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={15}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD/EDIT MODAL ── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">

          {[
            { label: 'Name *',         key: 'name',       type: 'text',   placeholder: 'Employee name' },
            { label: 'Phone *',        key: 'phone',      type: 'tel',    placeholder: '+380...' },
            { label: 'Email *',        key: 'email',      type: 'email',  placeholder: 'email@example.com' },
            { label: 'Hourly Rate ($)',key: 'hourlyRate', type: 'number', placeholder: '0' },
            { label: 'Specialties (через кому)', key: 'specialties', type: 'text', placeholder: 'Haircut, Beard Trim' },
            { label: 'Bio',            key: 'bio',        type: 'text',   placeholder: 'Short bio...' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type={type}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={String((formData as any)[key])}
                placeholder={placeholder}
                onChange={e => setFormData({ ...formData, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}/>
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as Employee['role'] })}>
              <option value="Barber">Barber</option>
              <option value="Receptionist">Receptionist</option>
              <option value="Manager">Manager</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isAvailable" checked={formData.isAvailable}
              onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600"/>
            <label htmlFor="isAvailable" className="text-sm text-gray-700">Available for appointments</label>
          </div>

          {/* Schedule editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Розклад</label>
            <div className="space-y-2">
              {DAYS.map(({ key, label }) => {
                const val = (formData.schedule as any)[key] || OFF;
                const isOff = val === OFF;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-6">{label}</span>
                    <button type="button"
                      onClick={() => toggleDay(key)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors
                        ${isOff ? 'bg-gray-200' : 'bg-indigo-600'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                        ${isOff ? 'translate-x-0' : 'translate-x-4'}`}/>
                    </button>
                    {isOff ? (
                      <span className="text-xs text-red-500">Вихідний</span>
                    ) : (
                      <input type="text"
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={val}
                        placeholder="09:00-18:00"
                        onChange={e => setDayHours(key, e.target.value)}/>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : editingEmployee ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── REVIEWS MODAL ── */}
      <Modal isOpen={!!reviewsEmp} onClose={() => setReviewsEmp(null)}
        title={`Відгуки — ${reviewsEmp?.name || ''}`}>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">

          {/* Rating summary */}
          {reviewsEmp && (
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <span className="text-3xl font-bold text-gray-900">
                {(reviewsEmp.rating || 0).toFixed(1)}
              </span>
              <div>
                <Stars rating={reviewsEmp.rating || 0} size={16}/>
                <p className="text-xs text-gray-500 mt-0.5">{reviewsEmp.reviewCount || 0} відгуків</p>
              </div>
            </div>
          )}

          {/* Reviews list */}
          {reviewsLoading ? (
            <p className="text-sm text-center text-gray-500 py-4">Завантаження...</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-center text-gray-500 py-4">Відгуків поки немає</p>
          ) : reviews.map(r => (
            <div key={r._id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {typeof r.client === 'object' ? r.client.name : 'Клієнт'}
                  </span>
                  <Stars rating={r.rating} size={12}/>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString('uk-UA')}
                </span>
              </div>
              {r.text && <p className="text-sm text-gray-600">{r.text}</p>}
            </div>
          ))}

          {/* Add review */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <p className="text-sm font-medium text-gray-700">Додати відгук</p>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => setNewReview(p => ({ ...p, rating: i }))}>
                  <Star size={20}
                    className={i <= newReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}/>
                </button>
              ))}
            </div>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              rows={2} placeholder="Текст відгуку..."
              value={newReview.text}
              onChange={e => setNewReview(p => ({ ...p, text: e.target.value }))}/>
            <button onClick={submitReview} disabled={addingReview}
              className="w-full px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
              {addingReview ? 'Збереження...' : 'Залишити відгук'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Employees;