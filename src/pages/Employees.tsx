// src/pages/Employees.tsx
import { useState, useEffect } from 'react'; // Додано useEffect
import { User, Plus, Star, Scissors } from 'lucide-react';
import { employeeApi } from '../api'; // Імпортуємо employeeApi
import { Employee } from '../api/types'; // Імпортуємо тип Employee

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]); // Стан для реальних даних працівників
  const [loading, setLoading] = useState<boolean>(true); // Стан завантаження даних
  const [error, setError] = useState<string | null>(null); // Стан для помилок

  // Використовуємо useEffect для завантаження даних при монтуванні компонента
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true); // Встановлюємо стан завантаження
        const data = await employeeApi.getAll(); // Викликаємо функцію для отримання всіх працівників
        setEmployees(data); // Оновлюємо стан працівників отриманими даними
      } catch (err) {
        console.error("Помилка завантаження працівників:", err);
        setError("Не вдалося завантажити дані працівників."); // Встановлюємо стан помилки
      } finally {
        setLoading(false); // Завершуємо стан завантаження незалежно від результату
      }
    };

    fetchEmployees();
  }, []); // Пустий масив залежностей означає, що ефект буде викликаний лише один раз при монтуванні

  // Mock data for employees (видалимо, якщо використовуємо реальні дані)
  // const employees = [ ... ]; // Цей блок буде замінено на реальні дані зі стану

  // Schedule keys for mapping (для відображення розкладу)
  const scheduleKeys: Array<keyof Employee['schedule']> = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  // --- Починаємо рендеринг компонента ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <User size={24} className="mr-2 text-indigo-600" />
          Employees
        </h1>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus size={20} className="mr-2 -ml-1" />
          Add New Employee
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-600">Завантаження працівників...</div>
      ) : error ? (
        <div className="text-center text-red-600">Помилка: {error}</div>
      ) : employees.length === 0 ? (
        <div className="text-center text-gray-600">Працівників не знайдено.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <div key={employee._id} className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:p-6 flex items-center space-x-4">
                <img
                  className="h-20 w-20 rounded-full object-cover"
                  src={employee.image || `https://ui-avatars.com/api/?name=${employee.name}&background=random`}
                  alt={employee.name}
                />
                <div className="flex-1">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{employee.name}</h3>
                  <p className="text-sm text-indigo-600">{employee.role}</p> {/* Використовуємо employee.role */}
                  <p className="mt-1 text-sm text-gray-500">{employee.email}</p>
                  <p className="text-sm text-gray-500">{employee.phone}</p>
                </div>
              </div>

              <div className="px-4 py-5 sm:px-6">
                {/* Припускаємо, що rating та reviewCount будуть додані до моделі Employee на бекенді */}
                {employee.rating && (
                  <div className="flex items-center text-sm mb-3">
                    <Star size={16} className="text-yellow-400 mr-1" fill="currentColor" />
                    <span className="font-medium text-gray-900">{employee.rating.toFixed(1)}</span>
                    <span className="text-gray-500 ml-1">({employee.reviewCount} reviews)</span>
                  </div>
                )}

                {/* Припускаємо, що specialties буде масивом рядків на бекенді */}
                {employee.specialties && employee.specialties.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {employee.specialties.map((specialty, i) => (
                        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Scissors size={12} className="mr-1" />
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Schedule - це складніше, оскільки ти маєш схему типу { mon: string, tue: string, ... } */}
                {/* Поки що це відображає лише наявність, якщо ти не додав поле 'schedule' до моделі Employee на бекенді */}
                {employee.schedule && ( // Перевіряємо, чи існує поле schedule
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Schedule</h4>
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {scheduleKeys.map((day, i) => {
                        // Перевіряємо, чи існує employee.schedule і чи є в ньому властивість day
                        const daySchedule = employee.schedule?.[day];
                        const isOff = daySchedule === 'Off';

                        return (
                          <div key={i} className="text-center">
                            <p className="font-medium">{day.charAt(0).toUpperCase() + day.slice(1)}</p> {/* Mon, Tue... */}
                            <div
                              className={`mt-1 py-1 px-0.5 rounded ${isOff ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                            >
                              {isOff ? 'Off' : (daySchedule || 'N/A')} {/* Відображаємо час або N/A */}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-4 py-3 border-t border-gray-200 flex justify-between">
                <button
                  type="button"
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  View Profile
                </button>
                <button
                  type="button"
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Employees;