import React, { useState } from 'react';
import { BarChart2, Calendar, Download, Filter } from 'lucide-react';

const Reports = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  // Mock data for reports
  const revenueData = [
    { month: 'Jan', amount: 4200 },
    { month: 'Feb', amount: 4800 },
    { month: 'Mar', amount: 5300 },
    { month: 'Apr', amount: 6100 },
    { month: 'May', amount: 5700 },
    { month: 'Jun', amount: 6500 },
    { month: 'Jul', amount: 7200 },
    { month: 'Aug', amount: 7800 },
    { month: 'Sep', amount: 7100 },
    { month: 'Oct', amount: 6700 },
    { month: 'Nov', amount: 6200 },
    { month: 'Dec', amount: 5900 }
  ];
  
  const servicePerformanceData = [
    { name: 'Classic Haircut', count: 782, revenue: 23460 },
    { name: 'Beard Trim', count: 548, revenue: 10960 },
    { name: 'Hot Towel Shave', count: 312, revenue: 10920 },
    { name: 'Full Service', count: 285, revenue: 21375 },
    { name: 'Hair Coloring', count: 164, revenue: 9840 }
  ];
  
  const employeePerformanceData = [
    { name: 'Mike Johnson', appointments: 423, revenue: 25380, rating: 4.9 },
    { name: 'Robert Taylor', appointments: 387, revenue: 23220, rating: 4.8 },
    { name: 'David Wilson', appointments: 286, revenue: 17160, rating: 4.6 }
  ];
  
  const maxRevenue = Math.max(...revenueData.map(item => item.amount));
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart2 size={24} className="mr-2 text-indigo-600" />
            Reports & Analytics
          </h1>
          <p className="text-gray-600">Business performance insights</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Calendar size={16} className="mr-2 text-gray-500" />
            Custom Range
          </button>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download size={16} className="mr-2 text-gray-500" />
            Export
          </button>
        </div>
      </div>
      
      {/* Period selector */}
      <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setPeriod('day')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              period === 'day' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              period === 'week' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              period === 'month' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              period === 'year' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Year
          </button>
        </div>
        <button
          type="button"
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Filter size={16} className="mr-1.5 text-gray-500" />
          Filter
        </button>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Revenue', value: '$78,950', change: '+12.5%', trend: 'up' },
          { title: 'Appointments', value: '1,245', change: '+8.2%', trend: 'up' },
          { title: 'New Clients', value: '156', change: '+5.3%', trend: 'up' },
          { title: 'Avg. Service Value', value: '$63.40', change: '-2.1%', trend: 'down' }
        ].map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-3xl font-semibold text-gray-900">{card.value}</p>
              <p className={`ml-2 text-sm font-medium ${
                card.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {card.change}
              </p>
            </div>
            <div className="mt-4">
              <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${card.trend === 'up' ? 'bg-green-500' : 'bg-red-500'}`} 
                  style={{ width: '70%' }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Revenue chart */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <BarChart2 size={20} className="mr-2 text-indigo-600" />
            Revenue Trend
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Monthly revenue for the current year
          </p>
        </div>
        
        <div className="p-6">
          <div className="h-80 flex items-end space-x-2">
            {revenueData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-indigo-500 hover:bg-indigo-600 transition-colors rounded-t-md cursor-pointer relative group"
                  style={{ 
                    height: `${(item.amount / maxRevenue) * 100}%`,
                  }}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${item.amount.toLocaleString()}
                  </div>
                </div>
                <div className="mt-2 text-xs font-medium">{item.month}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Service performance */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Scissors size={20} className="mr-2 text-indigo-600" />
            Service Performance
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Most popular services by appointments and revenue
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appointments
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {servicePerformanceData.map((service, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{service.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{service.count}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${service.revenue.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-32 bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full" 
                        style={{ width: `${(service.count / servicePerformanceData[0].count) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Employee performance */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <User size={20} className="mr-2 text-indigo-600" />
            Employee Performance
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Barber productivity and revenue generation
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appointments
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Rating
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employeePerformanceData.map((employee, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.appointments}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${employee.revenue.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900 mr-1">{employee.rating}</div>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`h-4 w-4 ${i < Math.floor(employee.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-32 bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-500 h-2.5 rounded-full" 
                        style={{ width: `${(employee.revenue / employeePerformanceData[0].revenue) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Fix missing import
import { User } from 'lucide-react';

export default Reports;