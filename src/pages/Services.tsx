import { useState, useEffect } from 'react';
import { Scissors, Plus, Edit, Trash, Search } from 'lucide-react';
import { serviceApi } from '../api'; // Імпортуємо serviceApi
import { Service } from '../api/types'; // Імпортуємо тип Service

const Services = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState<Service[]>([]); // Створюємо стан для послуг
  const [loading, setLoading] = useState(true); // Стан завантаження
  const [error, setError] = useState<string | null>(null); // Стан помилки

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await serviceApi.getAll(); // Отримуємо послуги з API
        setServices(data);
      } catch (err) {
        setError('Failed to fetch services.'); // Обробка помилок
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false); // Завершуємо завантаження
      }
    };

    fetchServices();
  }, []); // Пустий масив залежностей означає, що ефект запускається один раз після першого рендеру

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Loading services...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Scissors size={24} className="mr-2 text-indigo-600" />
          Services
        </h1>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus size={16} className="mr-2" />
          Add New Service
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            id="search"
            name="search"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search services..."
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <div key={service._id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <img
                className="h-48 w-full object-cover"
                src={`https://via.placeholder.com/400x200?text=${service.name.replace(/ /g, '+')}`} // Placeholder image
                alt={service.name}
              />
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-sm text-indigo-600">{service.category}</p>
                  </div>
                  <div className="text-xl font-bold text-gray-900">${service.price.toFixed(2)}</div>
                </div>

                <p className="mt-2 text-sm text-gray-600">{service.description}</p>

                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <svg className="mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {service.duration} minutes
                </div>
              </div>

              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                >
                  <Edit size={16} className="mr-1" />
                  Edit
                </button>
                <button
                  type="button"
                  className="inline-flex items-center text-sm text-red-600 hover:text-red-900"
                >
                  <Trash size={16} className="mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">No services found.</div>
        )}
      </div>
    </div>
  );
};

export default Services;