import { Trace } from '../hooks/useTraces';

export const STATUS_CONFIG: Record<Trace['status'], { color: string; icon: string; label: string }> = {
  completed: { color: 'text-green-500', icon: '✅', label: 'Completado' },
  pending: { color: 'text-yellow-500', icon: '⏳', label: 'Pendiente' },
  failed: { color: 'text-red-500', icon: '❌', label: 'Fallido' }
};

export const getStatusInfo = (status: Trace['status']) => {
  return STATUS_CONFIG[status] || { color: 'text-gray-300', icon: '❓', label: 'Desconocido' };
};
