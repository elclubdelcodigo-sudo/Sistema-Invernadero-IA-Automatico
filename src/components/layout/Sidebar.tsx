import React from 'react';
import { useFarm } from '../../context/FarmContext';
import { TakiiLogo } from '../common/TakiiLogo';
import {
  LayoutDashboard,
  Grid,
  MapPin,
  Droplets,
  Activity,
  AlertTriangle,
  History,
  Sliders,
  Cpu,
  Sparkles,
  Users,
  Settings,
  X,
  Award
} from 'lucide-react';

export type NavSection =
  | 'dashboard'
  | 'naves'
  | 'mapa'
  | 'riego'
  | 'sensores'
  | 'alertas'
  | 'historicos'
  | 'automatizaciones'
  | 'dispositivos'
  | 'ai'
  | 'usuarios'
  | 'sistema';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpen,
  onClose
}) => {
  const { alerts, activeIrrigations } = useFarm();
  const activeAlertsCount = alerts.filter(a => a.state === 'ACTIVA').length;

  const menuItems = [
    { id: 'dashboard' as NavSection, label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'naves' as NavSection, label: 'Naves (125)', icon: Grid, badge: null },
    { id: 'mapa' as NavSection, label: 'Mapa', icon: MapPin, badge: null },
    {
      id: 'riego' as NavSection,
      label: 'Riego',
      icon: Droplets,
      badge: activeIrrigations.length > 0 ? `${activeIrrigations.length}` : null,
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
    },
    { id: 'sensores' as NavSection, label: 'Sensores', icon: Activity, badge: null },
    {
      id: 'alertas' as NavSection,
      label: 'Alertas',
      icon: AlertTriangle,
      badge: activeAlertsCount > 0 ? `${activeAlertsCount}` : null,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
    },
    { id: 'historicos' as NavSection, label: 'Históricos', icon: History, badge: null },
    { id: 'automatizaciones' as NavSection, label: 'Automatizaciones', icon: Sliders, badge: null },
    { id: 'dispositivos' as NavSection, label: 'Dispositivos', icon: Cpu, badge: null },
    {
      id: 'ai' as NavSection,
      label: 'VEGALINK AI',
      icon: Sparkles,
      badge: 'IA',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
    },
    { id: 'usuarios' as NavSection, label: 'Usuarios & Auditoría', icon: Users, badge: null },
    { id: 'sistema' as NavSection, label: 'Sistema & LoRaWAN', icon: Settings, badge: null }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 light:bg-white border-r border-slate-800 light:border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header inside drawer */}
        <div className="p-4 border-b border-slate-800 light:border-slate-200 flex items-center justify-between lg:hidden">
          <TakiiLogo size="sm" showWordmark={true} showSubtitle={true} subtitle="VEGALINK IoT" />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white light:hover:text-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand header for desktop */}
        <div className="hidden lg:block px-5 py-4 border-b border-slate-800 light:border-slate-200 bg-slate-950/40 light:bg-slate-50/70">
          <TakiiLogo size="md" showWordmark={true} showSubtitle={true} subtitle="Since 1835 • Estación Agrícola" />
          <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-400 light:text-slate-500 pt-2 border-t border-slate-800/80 light:border-slate-200">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#0082CA]" />
              Red LoRa 915 MHz
            </span>
            <span className="font-bold text-slate-300 light:text-slate-700">125 Naves</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => {
                  onSelectSection(item.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#E52421] to-[#C91816] text-white shadow-md shadow-[#E52421]/30 font-bold'
                    : 'text-slate-400 light:text-slate-600 hover:bg-slate-800/80 light:hover:bg-slate-100 hover:text-slate-100 light:hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 light:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Takii Seed Corporate Seal & Gateways Status Footer */}
        <div className="p-3.5 border-t border-slate-800 light:border-slate-200 text-xs space-y-2.5 bg-slate-950/30 light:bg-slate-50/50">
          {/* Takii 3-colors corporate accent stripe */}
          <div className="h-1 w-full rounded-full flex overflow-hidden">
            <div className="h-full flex-1 bg-[#E52421]" title="Takii Red" />
            <div className="h-full flex-1 bg-[#0082CA]" title="Takii Blue" />
            <div className="h-full flex-1 bg-[#F5A81C]" title="Takii Yellow" />
          </div>

          <div className="text-[10px] text-slate-400 light:text-slate-600 leading-tight">
            <strong className="text-slate-200 light:text-slate-800 block font-serif">TAKII SEED</strong>
            Líder en desarrollo y producción de semillas de hortalizas y flores
          </div>

          <div className="pt-2 border-t border-slate-800/60 light:border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-500 light:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ChirpStack 915 MHz
            </span>
            <span>v4.7.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
