import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User;
  switchRole: (role: UserRole) => void;
  canPerformIrrigation: boolean;
  canConfigureDevices: boolean;
  canManageUsers: boolean;
}

const DEFAULT_USERS: Record<UserRole, User> = {
  Administrador: {
    id: 'USR_01',
    name: 'Ing. Laura Valenzuela',
    email: 'laura.v@vegalink-agri.com',
    role: 'Administrador',
    avatar: 'LV',
    lastLogin: 'Hace 10 minutos'
  },
  Operador: {
    id: 'USR_02',
    name: 'Cristian Reyes',
    email: 'cristian.reyes@vegalink-agri.com',
    role: 'Operador',
    avatar: 'CR',
    lastLogin: 'Hace 2 minutos'
  },
  Visualización: {
    id: 'USR_03',
    name: 'Auditor Agronómico',
    email: 'auditor@agritech-chile.cl',
    role: 'Visualización',
    avatar: 'AA',
    lastLogin: 'Hace 1 hora'
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedRole = localStorage.getItem('vegalink_role') as UserRole;
    return DEFAULT_USERS[savedRole] || DEFAULT_USERS['Operador'];
  });

  const switchRole = (role: UserRole) => {
    localStorage.setItem('vegalink_role', role);
    setCurrentUser(DEFAULT_USERS[role]);
  };

  const canPerformIrrigation = currentUser.role === 'Administrador' || currentUser.role === 'Operador';
  const canConfigureDevices = currentUser.role === 'Administrador';
  const canManageUsers = currentUser.role === 'Administrador';

  return (
    <AuthContext.Provider value={{
      currentUser,
      switchRole,
      canPerformIrrigation,
      canConfigureDevices,
      canManageUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
