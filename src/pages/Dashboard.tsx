import React from 'react';
import { Calendar, Users, Clock, DollarSign, TrendingUp, Scissors } from 'lucide-react';
import MetricCard from '../components/dashboard/MetricCard';
import AppointmentList from '../components/dashboard/AppointmentList';
import RecentClients from '../components/dashboard/RecentClients';
import DailyRevenue from '../components/dashboard/DailyRevenue';

const Dashboard = () => {
  // Mock data for dashboard metrics
  const metrics = [
    { title: "Today's Appointments", value: "12", icon: <Calendar size={24} />, color: "bg-blue-500" },
    { title: "Total Clients", value: "248", icon: <Users size={24} />, color: "bg-green-500" },
    { title: "Avg. Service Time", value: "45m", icon: <Clock size={24} />, color: "bg-purple-500" },
    { title: "Today's Revenue", value: "$1,240", icon: <DollarSign size={24} />, color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your barbershop today.</p>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard 
            key={index}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            color={metric.color}
          />
        ))}
      </div>
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming appointments */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                <Calendar size={20} className="mr-2 text-indigo-600" />
                Today's Appointments
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Upcoming appointments for today
              </p>
            </div>
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              View All
            </button>
          </div>
          <AppointmentList />
        </div>
        
        {/* Recent clients */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                <Users size={20} className="mr-2 text-indigo-600" />
                Recent Clients
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Latest client visits
              </p>
            </div>
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              View All
            </button>
          </div>
          <RecentClients />
        </div>
      </div>
      
      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
              <TrendingUp size={20} className="mr-2 text-indigo-600" />
              Daily Revenue
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Last 7 days performance
            </p>
          </div>
          <DailyRevenue />
        </div>
        
        {/* Popular services */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
              <Scissors size={20} className="mr-2 text-indigo-600" />
              Popular Services
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Most requested services this month
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { name: "Classic Haircut", count: 78, percentage: 30 },
                { name: "Beard Trim", count: 54, percentage: 22 },
                { name: "Full Service", count: 42, percentage: 18 },
                { name: "Hot Towel Shave", count: 36, percentage: 15 },
                { name: "Hair Coloring", count: 24, percentage: 10 }
              ].map((service, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{service.name}</span>
                    <span className="text-sm text-gray-500">{service.count} appointments</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full" 
                      style={{ width: `${service.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;