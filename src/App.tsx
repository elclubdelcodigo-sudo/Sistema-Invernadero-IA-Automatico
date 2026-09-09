import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { FarmProvider, useFarm } from './context/FarmContext';
import { Header } from './components/layout/Header';
import { QuickStatsBar } from './components/layout/QuickStatsBar';
import { Sidebar, NavSection } from './components/layout/Sidebar';
import { NaveDetailModal } from './components/naves/NaveDetailModal';
import { ManualIrrigationModal } from './components/riego/ManualIrrigationModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { NavesView } from './components/naves/NavesView';
import { FieldMapView } from './components/mapa/FieldMapView';
import { RiegoView } from './components/riego/RiegoView';
import { SensoresView } from './components/sensores/SensoresView';
import { AlertasView } from './components/alertas/AlertasView';
import { HistoricosView } from './components/historicos/HistoricosView';
import { AutomatizacionesView } from './components/automatizaciones/AutomatizacionesView';
import { DispositivosView } from './components/dispositivos/DispositivosView';
import { VegalinkAiView } from './components/ai/VegalinkAiView';
import { UsuariosView } from './components/usuarios/UsuariosView';
import { SistemaView } from './components/sistema/SistemaView';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    selectedNave,
    setSelectedNaveId,
    irrigationModalTarget,
    setIrrigationModalTarget,
    notification
  } = useFarm();

  return (
    <div className="min-h-screen bg-slate-950 light:bg-slate-50 text-slate-100 light:text-slate-900 flex flex-col font-sans transition-colors duration-150">
      {/* 5-second Quick Status Bar */}
      <QuickStatsBar />

      {/* Main Global Header */}
      <Header
        toggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Layout Area: Sidebar + Active Section */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentSection={currentSection}
          onSelectSection={(sec) => setCurrentSection(sec)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentSection === 'dashboard' && (
            <DashboardView
              onNavigateToNaves={() => setCurrentSection('naves')}
              onNavigateToRiego={() => setCurrentSection('riego')}
              onNavigateToAlertas={() => setCurrentSection('alertas')}
              onNavigateToAi={() => setCurrentSection('ai')}
            />
          )}
          {currentSection === 'naves' && <NavesView />}
          {currentSection === 'mapa' && <FieldMapView />}
          {currentSection === 'riego' && <RiegoView />}
          {currentSection === 'sensores' && <SensoresView />}
          {currentSection === 'alertas' && <AlertasView />}
          {currentSection === 'historicos' && <HistoricosView />}
          {currentSection === 'automatizaciones' && <AutomatizacionesView />}
          {currentSection === 'dispositivos' && <DispositivosView />}
          {currentSection === 'ai' && <VegalinkAiView />}
          {currentSection === 'usuarios' && <UsuariosView />}
          {currentSection === 'sistema' && <SistemaView />}
        </main>
      </div>

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`p-4 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-3 backdrop-blur-md ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-500 text-rose-200'
              : 'bg-blue-950/90 border-blue-500 text-blue-200'
          }`}>
            {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {notification.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Full Nave Detail Modal */}
      {selectedNave && (
        <NaveDetailModal
          nave={selectedNave}
          onClose={() => setSelectedNaveId(null)}
        />
      )}

      {/* Manual Irrigation Safe Confirmation Modal */}
      {irrigationModalTarget && (
        <ManualIrrigationModal
          nave={irrigationModalTarget}
          onClose={() => setIrrigationModalTarget(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FarmProvider>
          <MainAppContent />
        </FarmProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
