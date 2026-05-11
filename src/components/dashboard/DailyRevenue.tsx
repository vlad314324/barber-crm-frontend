import React from 'react';

const DailyRevenue = () => {
  // Mock data for daily revenue
  const revenueData = [
    { day: 'Mon', amount: 780 },
    { day: 'Tue', amount: 890 },
    { day: 'Wed', amount: 1200 },
    { day: 'Thu', amount: 980 },
    { day: 'Fri', amount: 1500 },
    { day: 'Sat', amount: 2100 },
    { day: 'Sun', amount: 860 }
  ];
  
  const maxAmount = Math.max(...revenueData.map(item => item.amount));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-2xl font-bold text-gray-900">$8,310</p>
          <p className="text-sm text-gray-500">Total Weekly Revenue</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-green-600">+12.5%</p>
          <p className="text-xs text-gray-500">vs last week</p>
        </div>
      </div>
      
      <div className="flex items-end space-x-2 h-64">
        {revenueData.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-indigo-500 rounded-t-md hover:bg-indigo-600 transition-all duration-300"
              style={{ 
                height: `${(item.amount / maxAmount) * 200}px`,
                maxHeight: '200px'
              }}
            ></div>
            <div className="mt-2 text-xs font-medium text-gray-600">{item.day}</div>
            <div className="text-xs text-gray-500">${item.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyRevenue;