import React from 'react';
import { render, screen } from '@testing-library/react';
import AdvancedMetrics from '../AdvancedMetrics';

describe('AdvancedMetrics', () => {
  const mockProps = {
    totalOrders: 100,
    completedOrders: 75,
    averageProcessingTime: 150,
    successRate: 85.5,
    activeCorrelations: 25,
  };

  it('renders all metric cards', () => {
    render(<AdvancedMetrics {...mockProps} />);
    
    expect(screen.getByText('Total Órdenes')).toBeInTheDocument();
    expect(screen.getByText('Órdenes Completadas')).toBeInTheDocument();
    expect(screen.getByText('Tiempo Promedio')).toBeInTheDocument();
    expect(screen.getByText('Tasa de Éxito')).toBeInTheDocument();
    expect(screen.getByText('Correlaciones Activas')).toBeInTheDocument();
  });

  it('displays correct values', () => {
    render(<AdvancedMetrics {...mockProps} />);
    
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('150ms')).toBeInTheDocument();
    expect(screen.getByText('85.5%')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('calculates and displays completion percentage', () => {
    render(<AdvancedMetrics {...mockProps} />);
    expect(screen.getByText('75.0%')).toBeInTheDocument();
  });

  it('shows "Excelente" for high success rate', () => {
    render(<AdvancedMetrics {...mockProps} successRate={96} />);
    expect(screen.getByText('Excelente')).toBeInTheDocument();
  });

  it('shows "Bueno" for moderate success rate', () => {
    render(<AdvancedMetrics {...mockProps} successRate={85} />);
    expect(screen.getByText('Bueno')).toBeInTheDocument();
  });

  it('applies correct colors to metric cards', () => {
    render(<AdvancedMetrics {...mockProps} />);
    
    // Verificar que cada card tenga la clase bg-gray-800
    const cards = screen.getAllByText(/Total Órdenes|Órdenes Completadas|Tiempo Promedio|Tasa de Éxito|Correlaciones Activas/);
    cards.forEach(card => {
      const cardContainer = card.closest('div')?.parentElement?.parentElement;
      expect(cardContainer).toHaveClass('bg-gray-800');
    });
  });

  it('displays icons for each metric', () => {
    render(<AdvancedMetrics {...mockProps} />);
    
    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByText('⏱️')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText('🔗')).toBeInTheDocument();
  });

  it('handles zero values gracefully', () => {
    render(<AdvancedMetrics 
      totalOrders={0}
      completedOrders={0}
      averageProcessingTime={0}
      successRate={0}
      activeCorrelations={0}
    />);
    
    // Usar getAllByText para manejar múltiples elementos con valor "0"
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThan(0);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('applies responsive grid classes', () => {
    render(<AdvancedMetrics {...mockProps} />);
    const container = screen.getByText('Total Órdenes').closest('div')?.parentElement?.parentElement?.parentElement;
    expect(container).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-1', 'lg:grid-cols-5');
  });
});
