
import React, { useState } from 'react';
import { View, UserRole } from './types';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Tenants from './pages/Tenants';
import Financials from './pages/Financials';
import Maintenance from './pages/Maintenance';
import Communications from './pages/Communications';
import Sales from './pages/Sales';
import Locations from './pages/Locations';
import Rents from './pages/Rents';
import Login from './pages/Login';
import Restore from './pages/Restore';
import Activity from './pages/Activity';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.LOGIN);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const handleLogin = (role: UserRole, userDetails?: any) => {
    setUserRole(role);
    setIsAuthenticated(true);
    setCurrentView(View.DASHBOARD);
    if (userDetails) {
      localStorage.setItem('eliteestate_currentUserEmail', userDetails.email || '');
      localStorage.setItem('eliteestate_currentUserName', userDetails.name || '');
    } else {
      localStorage.setItem('eliteestate_currentUserEmail', role === 'admin' ? 'admin@eliteestate.com' : 'user@eliteestate.com');
      localStorage.setItem('eliteestate_currentUserName', role === 'admin' ? 'Admin' : 'User Agent');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentView(View.LOGIN);
    localStorage.removeItem('eliteestate_currentUserEmail');
    localStorage.removeItem('eliteestate_currentUserName');
  };

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD: return <Dashboard role={userRole} />;
      case View.PROPERTIES: return <Properties role={userRole} />;
      case View.TENANTS: return <Tenants role={userRole} />;
      case View.FINANCIALS: return <Financials role={userRole} />;
      case View.MAINTENANCE: return <Maintenance role={userRole} />;
      case View.COMMUNICATIONS: return <Communications role={userRole} />;
      case View.SALES: return <Sales role={userRole} />;
      case View.LOCATIONS: return <Locations />;
      case View.RENTS: return <Rents role={userRole} />;
      case View.TRASH: return <Restore role={userRole} />;
      case View.ACTIVITY: return <Activity />;
      default: return <Dashboard role={userRole} />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <Sidebar currentView={currentView} setView={setCurrentView} userRole={userRole} />
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <Navbar onLogout={handleLogout} userRole={userRole} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_4px_30px_rgba(13,148,136,0.03)] min-h-full">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
