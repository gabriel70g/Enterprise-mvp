import React from 'react';

interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  color: string;
}

interface AdvancedMetricsProps {
  totalOrders: number;
  completedOrders: number;
  averageProcessingTime: number;
  successRate: number;
  activeCorrelations: number;
}

const AdvancedMetrics: React.FC<AdvancedMetricsProps> = ({
  totalOrders,
  completedOrders,
  averageProcessingTime,
  successRate,
  activeCorrelations
}) => {
  const metrics: MetricCard[] = [
    {
      title: 'Total Órdenes',
      value: totalOrders,
      icon: '📊',
      color: 'bg-blue-500'
    },
    {
      title: 'Órdenes Completadas',
      value: completedOrders,
      change: `${((completedOrders / totalOrders) * 100).toFixed(1)}%`,
      changeType: 'positive',
      icon: '✅',
      color: 'bg-green-500'
    },
    {
      title: 'Tiempo Promedio',
      value: `${averageProcessingTime}ms`,
      icon: '⏱️',
      color: 'bg-purple-500'
    },
    {
      title: 'Tasa de Éxito',
      value: `${successRate.toFixed(1)}%`,
      change: successRate > 95 ? 'Excelente' : 'Bueno',
      changeType: successRate > 95 ? 'positive' : 'neutral',
      icon: '🎯',
      color: 'bg-emerald-500'
    },
    {
      title: 'Correlaciones Activas',
      value: activeCorrelations,
      icon: '🔗',
      color: 'bg-orange-500'
    }
  ];

  const getChangeColor = (changeType?: 'positive' | 'negative' | 'neutral') => {
    switch (changeType) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      case 'neutral': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-5 gap-3 mb-2 mt-2">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-small text-gray-400">{metric.title}</p>
              <p className="text-xs font-bold text-white mt-1">{metric.value}</p>
              {metric.change && (
                <p className={`text-xs font-small ${getChangeColor(metric.changeType)}`}>
                  {metric.change}
                </p>
              )}
            </div>
            <div className={`${metric.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
              <span className="text-sm">{metric.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdvancedMetrics;
