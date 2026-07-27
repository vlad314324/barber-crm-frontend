import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon }) => {
  return (
    <div className="ds-card p-5">
      <div className="flex items-center">
        <div className="w-11 h-11 rounded-sm bg-brand-soft text-brand flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-ink-secondary">{title}</p>
          <p className="text-2xl font-bold text-ink tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;