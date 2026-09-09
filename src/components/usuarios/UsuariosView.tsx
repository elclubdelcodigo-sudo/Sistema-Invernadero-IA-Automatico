import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AuditLogEntry, UserRole } from '../../types';
import {
  Users,
  Shield,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Search,
  Filter
} from 'lucide-react';

export const UsuariosView: React.FC = () => {
  const { currentUser, switchRole } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    api.getAuditLogs().then(data => setLogs(data.logs)).catch(console.error);
  }, []);

  const usersList = [
    {
      id: 'USR_01',
      name: 'Ing. Laura Valenzuela',
      email: 'laura.v@vegalink-agri.com',
      role: 'Administrador' as UserRole,
      lastLogin: 'Hace 10 minutos',
      status: 'Activo'
    },
    {
      id: 'USR_02',
      name: 'Cristian Reyes',
      email: 'cristian.reyes@vegalink-agri.com',
      role: 'Operador' as UserRole,
      lastLogin: 'Hace 2 minutos',
      status: 'Activo'
    },
    {
      id: 'USR_03',
      name: 'Auditor Agronómico',
      email: 'auditor@agritech-chile.cl',
      role: 'Visualización' as UserRole,
      lastLogin: 'Hace 1 hora',
      status: 'Activo'
    }
  ];

  const filteredLogs = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.userName.toLowerCase().includes(search.toLowerCase()) ||
    l.greenhouseId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id="usuarios-view" className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-slate-100 light:text-slate-900 tracking-tight">
          Control de Acceso (RBAC) & Registro de Auditoría
        </h1>
        <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
          Trazabilidad completa de operaciones hidráulicas y gobierno de roles por sesión
        </p>
      </div>

      {/* Users & Roles Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Users List */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-100 light:text-slate-900 font-bold text-sm">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Usuarios del Sistema VEGALINK</span>
            </div>
            <span className="text-xs text-slate-400">3 Cuentas Registradas</span>
          </div>

          <div className="divide-y divide-slate-800 light:divide-slate-200">
            {usersList.map(u => (
              <div key={u.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center font-mono">
                    {u.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 light:text-slate-900">{u.name}</div>
                    <div className="text-slate-400 text-[11px]">{u.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    u.role === 'Administrador'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                      : u.role === 'Operador'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {u.role}
                  </span>

                  <button
                    onClick={() => switchRole(u.role)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      currentUser.role === u.role
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-800 light:bg-slate-100 text-slate-400 hover:text-white'
                    }`}
                  >
                    {currentUser.role === u.role ? 'Sesión Actual' : 'Cambiar a este Rol'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 col: RBAC Matrix */}
        <div className="p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-100 light:text-slate-900 font-bold text-sm">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Matriz de Permisos</span>
          </div>

          <div className="space-y-3 text-xs text-slate-300 light:text-slate-600">
            <div className="p-3 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-1">
              <span className="font-bold text-purple-400 block">Administrador</span>
              <p className="text-[11px] text-slate-400">
                Acceso total: apertura de válvulas, edición de reglas NVS, reinicio de dispositivos, creación de naves piloto.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-1">
              <span className="font-bold text-blue-400 block">Operador</span>
              <p className="text-[11px] text-slate-400">
                Operación en terreno: apertura de riego manual con límite seguro, reconocimiento y resolución de alarmas.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-1">
              <span className="font-bold text-slate-400 block">Visualización</span>
              <p className="text-[11px] text-slate-400">
                Solo lectura: consulta de telemetría, gráficos y descarga de informes CSV sin control de actuadores.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200 light:text-slate-800">
              Bitácora de Auditoría de Operaciones ({logs.length})
            </h2>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en bitácora..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 light:text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 light:bg-slate-100 text-slate-400 light:text-slate-600 uppercase text-[10px] border-b border-slate-800 light:border-slate-200">
                <tr>
                  <th className="p-3.5">ID Log</th>
                  <th className="p-3.5">Fecha / Hora</th>
                  <th className="p-3.5">Usuario</th>
                  <th className="p-3.5">Nave Afectada</th>
                  <th className="p-3.5">Acción Realizada</th>
                  <th className="p-3.5">IP Origen</th>
                  <th className="p-3.5 text-right">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 light:divide-slate-200 text-slate-200 light:text-slate-800 text-[11px]">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 light:hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 text-slate-500">{log.id}</td>
                    <td className="p-3.5 text-slate-400">{log.timestamp}</td>
                    <td className="p-3.5 font-bold text-slate-200 light:text-slate-800">{log.userName}</td>
                    <td className="p-3.5 text-emerald-400 font-bold">{log.greenhouseId || '—'}</td>
                    <td className="p-3.5">{log.action}</td>
                    <td className="p-3.5 text-slate-500">{log.ipAddress}</td>
                    <td className="p-3.5 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.result === 'Éxito'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
