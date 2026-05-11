import React from 'react';

const RecentClients = () => {
  // Mock data for recent clients
  const recentClients = [
    {
      id: 1,
      name: 'John Smith',
      image: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
      lastVisit: '2 hours ago',
      service: 'Haircut & Beard Trim'
    },
    {
      id: 2,
      name: 'David Williams',
      image: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
      lastVisit: 'Yesterday',
      service: 'Classic Haircut'
    },
    {
      id: 3,
      name: 'Michael Brown',
      image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
      lastVisit: '2 days ago',
      service: 'Hot Towel Shave'
    },
    {
      id: 4,
      name: 'James Johnson',
      image: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150',
      lastVisit: '3 days ago',
      service: 'Full Service'
    }
  ];

  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {recentClients.map((client) => (
          <li key={client.id} className="px-6 py-4 flex hover:bg-gray-50 transition-colors duration-150">
            <img className="h-12 w-12 rounded-full object-cover" src={client.image} alt="" />
            <div className="ml-4 flex-1">
              <div className="flex justify-between">
                <p className="text-sm font-medium text-gray-900">{client.name}</p>
                <p className="text-xs text-gray-500">{client.lastVisit}</p>
              </div>
              <p className="text-sm text-gray-500 truncate">{client.service}</p>
            </div>
          </li>
        ))}
      </ul>
      
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <button
          type="button"
          className="w-full flex justify-center items-center px-4 py-2 border border-indigo-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add New Client
        </button>
      </div>
    </div>
  );
};

export default RecentClients;