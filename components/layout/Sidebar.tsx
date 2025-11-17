'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Table2,
  TrendingUp,
  Menu,
  X,
  Database,
  Receipt,
  Building2,
  Users
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Balance Totals', href: '/dashboard/totals', icon: TrendingUp },
  { name: 'Balance Standard', href: '/dashboard/standard', icon: FileText },
  { name: 'Balance 8 Columns', href: '/dashboard/8columns', icon: Table2 },
  { name: 'Facturas Mensuales', href: '/dashboard/invoices', icon: Receipt },
  { name: 'Facturas por Sucursal', href: '/dashboard/invoices/branch', icon: Building2 },
  { name: 'Facturas por Vendedor', href: '/dashboard/invoices/salesman', icon: Users },
  {
    name: 'Indicadores Financieros',
    href: '/dashboard/indicadores-financieros',
    icon: TrendingUp,
    children: [
      { name: 'Ratio de Liquidez', href: '/dashboard/indicadores-financieros/ratio-circulante' },
      { name: 'Capital de Trabajo', href: '/dashboard/indicadores-financieros/capital-trabajo' },
      { name: 'Estructura Financiera', href: '/dashboard/indicadores-financieros/estructura-financiera' },
      { name: 'Días de Cobro y Pago', href: '/dashboard/indicadores-financieros/dias-cobro-pago' },
      { name: 'Margen de Rentabilidad', href: '/dashboard/indicadores-financieros/margen-rentabilidad' },
      { name: 'EBITDA', href: '/dashboard/indicadores-financieros/ebitda' },
    ]
  },
  { name: 'Cargar Datos', href: '/dashboard/admin/load-data', icon: Database },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 text-white shadow-lg hover:bg-gray-800 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col bg-gray-900 transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-gray-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold text-white">Laudus</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;

            // If item has children render expandable section
            if (item.children && item.children.length > 0) {
              const parentActive = pathname?.startsWith(item.href) ?? false;
              return (
                <div key={item.name}>
                  <button
                    onClick={() => setExpanded(prev => !prev)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      parentActive || expanded
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                    <span className="ml-auto text-xs opacity-80">{expanded || parentActive ? '▾' : '▸'}</span>
                  </button>

                  {(expanded || parentActive) && (
                    <div className="mt-1 ml-8 space-y-1">
                      {item.children.map((child: any) => {
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={closeSidebar}
                            className={cn(
                              'block rounded-md px-3 py-2 text-sm transition-colors',
                              childActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            )}
                          >
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4">
          <div className="text-xs text-gray-500">
            <p className="font-medium">Laudus Balance Sheet</p>
            <p className="mt-1">Automated Dashboard</p>
          </div>
        </div>
      </div>
    </>
  );
}