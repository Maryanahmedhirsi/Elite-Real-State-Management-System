import React from 'react';
import { UserRole } from '../types';

interface NavbarProps {
  onLogout: () => void;
  userRole: UserRole | null;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout, userRole }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
      <div className="flex-1 flex items-center">
        <span className="text-xl font-black text-slate-850 tracking-tight">Elite Real Estate Management System - Portal</span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-slate-900">User Account</p>
          <p className="text-[10px] text-emerald-550 font-bold uppercase tracking-widest">{userRole || 'USER'}</p>
        </div>
        <button 
          onClick={onLogout}
          className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors text-xs font-bold"
        >
          Ka Bax (Logout)
        </button>
      </div>
    </header>
  );
};

export default Navbar;
