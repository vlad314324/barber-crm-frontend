import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`${color} rounded-full p-3 text-white`}>
            {icon}
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
      <div className={`h-1 ${color}`}></div>
    </div>
  );
};

export default MetricCard;