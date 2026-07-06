import React from 'react';
import { View, UserRole } from '../types';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  userRole: UserRole | null;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, userRole }) => {
  const navItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: View.PROPERTIES, label: 'Properties', icon: 'fa-building' },
    { id: View.LOCATIONS, label: 'Locations', icon: 'fa-map-location-dot' },
    { id: View.RENTS, label: 'Rents', icon: 'fa-file-invoice-dollar' },
    { id: View.TENANTS, label: 'Tenants', icon: 'fa-users' },
    { id: View.SALES, label: 'Sales', icon: 'fa-handshake' },
    { id: View.FINANCIALS, label: 'Financials & Reports', icon: 'fa-file-contract' },
    { id: View.MAINTENANCE, label: 'Maintenance', icon: 'fa-wrench' },
    { id: View.COMMUNICATIONS, label: 'Communications', icon: 'fa-comment-dots' },
    { id: View.TRASH, label: 'Data Restore', icon: 'fa-trash-arrow-up' },
    { id: View.ACTIVITY, label: 'System Activity', icon: 'fa-clock-rotate-left' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20 hidden md:flex">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
          <i className="fa-solid fa-home text-white"></i>
        </div>
        <span className="text-xl font-bold text-white tracking-tight">Elite Real Estate</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
              currentView === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className={`fa-solid ${item.icon} w-5 ${currentView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}></i>
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">Role Status</p>
          <p className="text-sm font-black text-emerald-400 uppercase tracking-widest">{userRole || 'USER'}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
