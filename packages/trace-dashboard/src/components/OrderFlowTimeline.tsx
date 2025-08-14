import React from 'react';
import OrderStatusBadge from './OrderStatusBadge';

interface OrderFlowStep {
  status: string;
  timestamp: string;
  service: string;
  completed: boolean;
}

interface OrderFlowTimelineProps {
  steps: OrderFlowStep[];
  currentStatus: string;
}

const OrderFlowTimeline: React.FC<OrderFlowTimelineProps> = ({ steps, currentStatus }) => {
  const getStepStatus = (step: OrderFlowStep, currentStatus: string) => {
    if (step.completed) return 'completed';
    if (step.status === currentStatus) return 'current';
    return 'pending';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'current': return '⏳';
      case 'pending': return '⭕';
      default: return '⭕';
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'current': return 'text-yellow-500';
      case 'pending': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-200 mb-3">Flujo de la Orden</h4>
      <div className="space-y-3">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step, currentStatus);
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.status} className="flex items-start space-x-3">
              {/* Icono del paso */}
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${getStepColor(stepStatus)}`}>
                <span className="text-sm">{getStepIcon(stepStatus)}</span>
              </div>
              
              {/* Contenido del paso */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <OrderStatusBadge status={step.status} size="sm" showIcon={false} />
                  <span className="text-xs text-gray-400">via {step.service}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(step.timestamp).toLocaleTimeString()}
                </p>
              </div>
              
              {/* Línea conectora */}
              {!isLast && (
                <div className="absolute left-3 top-6 w-0.5 h-8 bg-gray-600 ml-2.5"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderFlowTimeline;
