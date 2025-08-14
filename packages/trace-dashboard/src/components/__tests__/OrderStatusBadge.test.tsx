import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderStatusBadge from '../OrderStatusBadge';

describe('OrderStatusBadge', () => {
  const mockProps = {
    status: 'order_confirmed',
    showIcon: true,
    size: 'md' as const,
  };

  it('renders with correct status label', () => {
    render(<OrderStatusBadge {...mockProps} />);
    expect(screen.getByText('Orden Confirmada')).toBeInTheDocument();
  });

  it('renders with icon when showIcon is true', () => {
    render(<OrderStatusBadge {...mockProps} showIcon={true} />);
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('renders without icon when showIcon is false', () => {
    render(<OrderStatusBadge {...mockProps} showIcon={false} />);
    expect(screen.queryByText('✅')).not.toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    render(<OrderStatusBadge {...mockProps} size="lg" />);
    const badge = screen.getByTestId('order-status-badge');
    expect(badge).toHaveClass('px-4', 'py-2', 'text-base');
  });

  it('applies correct color classes for different statuses', () => {
    const { rerender } = render(<OrderStatusBadge {...mockProps} status="created" />);
    expect(screen.getByTestId('order-status-badge')).toHaveClass('bg-blue-500');

    rerender(<OrderStatusBadge {...mockProps} status="stock_reserved" />);
    expect(screen.getByTestId('order-status-badge')).toHaveClass('bg-yellow-500');

    rerender(<OrderStatusBadge {...mockProps} status="payment_pending" />);
    expect(screen.getByTestId('order-status-badge')).toHaveClass('bg-orange-500');

    rerender(<OrderStatusBadge {...mockProps} status="payment_confirmed" />);
    expect(screen.getByTestId('order-status-badge')).toHaveClass('bg-purple-500');

    rerender(<OrderStatusBadge {...mockProps} status="order_confirmed" />);
    expect(screen.getByTestId('order-status-badge')).toHaveClass('bg-green-500');

    rerender(<OrderStatusBadge {...mockProps} status="ready_for_delivery" />);
    expect(screen.getByTestId('order-status-badge')).toHaveClass('bg-emerald-500');

    rerender(<OrderStatusBadge {...mockProps} status="cancelled" />);
    expect(screen.getByTestId('order-status-badge')).toHaveClass('bg-red-500');
  });

  it('handles unknown status gracefully', () => {
    render(<OrderStatusBadge {...mockProps} status="unknown_status" />);
    expect(screen.getByText('Estado Desconocido')).toBeInTheDocument();
    expect(screen.getByTestId('order-status-badge')).toHaveClass('bg-gray-500');
  });

  it('applies hover and transition effects', () => {
    render(<OrderStatusBadge {...mockProps} />);
    const badge = screen.getByTestId('order-status-badge');
    expect(badge).toHaveClass('hover:scale-105', 'transition-all', 'duration-200');
  });
});
