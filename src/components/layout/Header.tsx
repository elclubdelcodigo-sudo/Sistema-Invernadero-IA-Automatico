import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useFarm } from '../../context/FarmContext';
import { UserRole } from '../../types';
import { TakiiLogo } from '../common/TakiiLogo';
import {
  Sun,
  Moon,
  Search,
  RefreshCw,
  Shield,
  Menu,
  Droplets,
  Radio,
  Sliders
} from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const { currentUser, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { searchTerm, setSearchTerm, refreshData, isLoading } = useFarm();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    switchRole(e.target.value as UserRole);
  };

  return (
    <header id="main-header" className="sticky top-0 z-30 bg-slate-900/90 dark:bg-slate-900/90 light:bg-white/90 backdrop-blur border-b border-slate-800 light:border-slate-200 transition-colors">
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        {/* Left side: Hamburger + Logo */}
        <div className="flex items-center gap-3">
          <button
            id="btn-toggle-sidebar"
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 light:hover:bg-slate-100 light:hover:text-slate-900 transition-colors"
            title="Abrir/Cerrar Menú"
            aria-label="Abrir Menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <TakiiLogo size="md" showWordmark={true} showSubtitle={true} subtitle="Since 1835" />
            
            <div className="h-7 w-px bg-slate-700/60 light:bg-slate-300 hidden sm:block" />

            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs tracking-wider text-slate-300 light:text-slate-700">VEGALINK</span>
                <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-[#E52421]/20 text-[#E52421] border border-[#E52421]/30">
                  125 Naves
                </span>
              </div>
              <p className="text-[10px] text-slate-400 light:text-slate-500">
                Campo Experimental • LoRaWAN 915 MHz
              </p>
            </div>
          </div>
        </div>

        {/* Center: Global Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Buscar por Nave (ej. NAVE_001, Sector Norte)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 light:text-slate-800 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Right Controls: Role Selector, Refresh, Dark/Light Mode, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live sync trigger */}
          <button
            id="btn-refresh-telemetry"
            onClick={() => refreshData()}
            disabled={isLoading}
            title="Sincronizar telemetría LoRaWAN"
            className="p-2 rounded-lg bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:text-emerald-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Theme switcher */}
          <button
            id="btn-toggle-theme"
            onClick={toggleTheme}
            type="button"
            aria-label={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            className="p-2 rounded-lg bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-slate-700 light:hover:bg-slate-200 hover:text-amber-400 light:hover:text-amber-600 border border-slate-700/60 light:border-slate-300 transition-all shadow-sm flex items-center justify-center cursor-pointer active:scale-95"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Role selector dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 light:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-700/60 light:border-slate-200 text-xs">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <select
              id="role-selector"
              value={currentUser.role}
              onChange={handleRoleChange}
              className="bg-transparent text-slate-200 light:text-slate-800 text-xs font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="Administrador" className="bg-slate-900 text-slate-200">Administrador</option>
              <option value="Operador" className="bg-slate-900 text-slate-200">Operador</option>
              <option value="Visualización" className="bg-slate-900 text-slate-200">Visualización</option>
            </select>
          </div>

          {/* User Avatar badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800 light:border-slate-200">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow">
              {currentUser.avatar || currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-200 light:text-slate-800 leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-400 light:text-slate-500 leading-none">
                {currentUser.role}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
