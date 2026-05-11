// src/pages/Clients.tsx
// src/pages/Clients.tsx
import { useState, useEffect } from 'react';
import { Users, Plus, Search } from 'lucide-react'; // Видалено Filter та ChevronRight
import { Link } from 'react-router-dom';
import { clientApi } from '../api';
import { Client } from '../api/types';

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]); // Стан для реальних даних клієнтів
  const [loading, setLoading] = useState<boolean>(true); // Стан завантаження даних
  const [error, setError] = useState<string | null>(null); // Стан для помилок

  // Використовуємо useEffect для завантаження даних при монтуванні компонента
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true); // Встановлюємо стан завантаження
        const data = await clientApi.getAll(); // Викликаємо функцію для отримання всіх клієнтів
        setClients(data); // Оновлюємо стан клієнтів отриманими даними
      } catch (err) {
        console.error("Помилка завантаження клієнтів:", err);
        setError("Не вдалося завантажити дані клієнтів."); // Встановлюємо стан помилки
      } finally {
        setLoading(false); // Завершуємо стан завантаження незалежно від результату
      }
    };

    fetchClients();
  }, []); // Пустий масив залежностей означає, що ефект буде викликаний лише один раз при монтуванні

  // Фільтруємо клієнтів на основі пошукового запиту
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  // --- Починаємо рендеринг компонента ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Users size={24} className="mr-2 text-indigo-600" />
          Clients
        </h1>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus size={20} className="mr-2 -ml-1" />
          Add New Client
        </button>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Client List</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            View and manage your barbershop clients.
          </p>

          <div className="mt-5 flex justify-between items-center space-x-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="search"
                name="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search clients..."
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* You can add a filter button here if needed */}
            {/*
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Filter size={20} className="mr-2 -ml-1" />
              Filter
            </button>
            */}
          </div>
        </div>

        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Client
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Contact
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Visits
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Last Visit
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      Завантаження клієнтів...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-500">
                      Помилка: {error}
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      Клієнтів не знайдено.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {/* Використовуємо mock-зображення або додамо реальне пізніше */}
                            <img
                              className="h-10 w-10 rounded-full"
                              src={client.image || `https://ui-avatars.com/api/?name=${client.name}&background=random`}
                              alt={client.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{client.name}</div>
                            <div className="text-sm text-gray-500">{client.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.phone}</div>
                        <div className="text-sm text-gray-500">{client.email}</div> {/* Дублюємо email, якщо потрібно */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* Припускаємо, що visits буде числом, якщо додано до моделі Client */}
                        {client.visits || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* Припускаємо, що lastVisit буде датою, якщо додано до моделі Client */}
                        {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/clients/${client._id}`} className="text-indigo-600 hover:text-indigo-900">
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination (залишаємо як є, для реалізації потрібна додаткова логіка) */}
      <nav
        className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow"
        aria-label="Pagination"
      >
        <div className="hidden sm:block">
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{' '}
            <span className="font-medium">99</span> results
          </p>
        </div>
        <div className="flex-1 flex justify-between sm:justify-end">
          <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Previous
          </button>
          <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Next
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Clients;