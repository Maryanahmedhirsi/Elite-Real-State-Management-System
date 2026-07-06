import React, { useState, useEffect } from 'react';
import { api } from '../apiService';
import { ActivityLog } from '../types';

const Activity: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getActivityLogs();
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs based on search query, module, and action
  const filteredLogs = logs.filter(log => {
    const matchesModule = filterModule === 'all' || log.module === filterModule;
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      log.description.toLowerCase().includes(query) ||
      log.module.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(query));

    return matchesModule && matchesAction && matchesSearch;
  });

  const getModuleBadge = (moduleName: string) => {
    switch (moduleName) {
      case 'Guryaha':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Kiraystayaasha':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Kirada':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'Iibka & Qandaraasyada':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Maaliyadda':
        return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
      case 'Dayactirka':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'Isticmaalayaasha':
        return 'bg-violet-50 text-violet-700 border border-violet-200';
      case 'Dib-u-soo-celinta':
        return 'bg-teal-50 text-teal-700 border border-teal-200';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const getActionIconAndColor = (action: string) => {
    switch (action) {
      case 'Kudaray':
        return {
          icon: 'fa-solid fa-circle-plus',
          bg: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
          badge: 'bg-emerald-50 text-emerald-700 border border-emerald-100'
        };
      case 'Wax ka bedelay':
        return {
          icon: 'fa-solid fa-pen-to-square',
          bg: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20',
          badge: 'bg-indigo-50 text-indigo-700 border border-indigo-100'
        };
      case 'Tirtiray':
        return {
          icon: 'fa-solid fa-trash-can',
          bg: 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
          badge: 'bg-rose-50 text-rose-700 border border-rose-100'
        };
      case 'Soo celiyay':
        return {
          icon: 'fa-solid fa-trash-arrow-up',
          bg: 'bg-teal-500/10 text-teal-600 border border-teal-500/20',
          badge: 'bg-teal-50 text-teal-700 border border-teal-100'
        };
      case 'Saxeexay/Ansixiyay':
        return {
          icon: 'fa-solid fa-user-check',
          bg: 'bg-purple-500/10 text-purple-600 border border-purple-500/20',
          badge: 'bg-purple-50 text-purple-700 border border-purple-100'
        };
      default:
        return {
          icon: 'fa-solid fa-bolt',
          bg: 'bg-slate-500/10 text-slate-600 border border-slate-500/20',
          badge: 'bg-slate-50 text-slate-700 border border-slate-100'
        };
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 6000);
      
      if (diffMins < 1) return 'Hadda';
      if (diffMins < 60) return `${diffMins} daqiiqo ka hor`;
      if (diffHours < 24) {
        const hrs = Math.floor(diffMins / 60);
        return `${hrs} saac ka hor`;
      }
      
      return date.toLocaleDateString('so-SO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const uniqueModules = Array.from(new Set(logs.map(l => l.module)));
  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <i className="fa-solid fa-clock-rotate-left text-indigo-600"></i>
            Dhaqdhaqaaqa Nidaamka (Activity Logs)
          </h1>
          <p className="text-slate-500 font-medium">
            Halkan ka hubi dhammaan waxyaabaha laga beddelay, lagu daray, ama laga tirtiray nidaamka oo dhan.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          <i className={`fa-solid fa-rotate ${loading ? 'animate-spin' : ''}`}></i>
          Cusboonaysii
        </button>
      </div>

      {/* Control Panel: Filters and Search */}
      <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <i className="fa-solid fa-magnifying-glass text-xs"></i>
            </span>
            <input
              type="text"
              placeholder="Raadi hawl, sharraxaad ama isticmaale..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-xs border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold text-slate-700 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <i className="fa-solid fa-circle-xmark text-xs"></i>
              </button>
            )}
          </div>

          {/* Module Filter */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <i className="fa-solid fa-layer-group text-xs"></i>
            </span>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-xs border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-600 cursor-pointer appearance-none"
            >
              <option value="all">Qaybta (Dhammaan Module-lada)</option>
              {uniqueModules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
              <i className="fa-solid fa-chevron-down text-[10px]"></i>
            </span>
          </div>

          {/* Action Filter */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <i className="fa-solid fa-gears text-xs"></i>
            </span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-xs border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-600 cursor-pointer appearance-none"
            >
              <option value="all">Nooca Hawsha (Dhammaan)</option>
              {uniqueActions.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
              <i className="fa-solid fa-chevron-down text-[10px]"></i>
            </span>
          </div>
        </div>

        {/* Quick Filter Info Bar */}
        {(filterModule !== 'all' || filterAction !== 'all' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-bold">Miirayaasha firfircoon:</span>
            {filterModule !== 'all' && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 font-black rounded-lg text-[10px] uppercase border border-indigo-100">
                Qaybta: {filterModule}
                <button onClick={() => setFilterModule('all')} className="hover:text-indigo-900 cursor-pointer">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </span>
            )}
            {filterAction !== 'all' && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-black rounded-lg text-[10px] uppercase border border-emerald-100">
                Hawsha: {filterAction}
                <button onClick={() => setFilterAction('all')} className="hover:text-emerald-900 cursor-pointer">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 font-black rounded-lg text-[10px] uppercase border border-slate-200">
                Erayga: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-slate-900 cursor-pointer">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setFilterModule('all');
                setFilterAction('all');
                setSearchQuery('');
              }}
              className="text-indigo-600 hover:text-indigo-800 hover:underline font-black uppercase text-[10px] ml-auto cursor-pointer"
            >
              Nadiifi Dhammaan
            </button>
          </div>
        )}
      </div>

      {/* Activity Timeline Section */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <i className="fa-solid fa-circle-notch text-4xl text-indigo-600 animate-spin"></i>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">La soo rorayo Dhaqdhaqaaqa Nidaamka...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 border border-slate-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <i className="fa-solid fa-clock-rotate-left text-2xl"></i>
            </div>
            <h3 className="text-lg font-black text-slate-900">Wax dhaqdhaqaaq ah lama helin</h3>
            <p className="text-slate-400 text-xs font-semibold">
              Ma jiraan wax dhacdooyin ah oo waafaqsan miirayaasha ama raadinta aad hadda isticmaashay.
            </p>
            {(filterModule !== 'all' || filterAction !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setFilterModule('all');
                  setFilterAction('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
              >
                Eeg Dhammaan Dhaqdhaqaaqyada
              </button>
            )}
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 ml-4 md:ml-6 pl-6 md:pl-10 space-y-8 py-2">
            {filteredLogs.map((log, index) => {
              const actionStyle = getActionIconAndColor(log.action);
              
              // Extract first letter or name for avatar
              const emailPrefix = log.userEmail ? log.userEmail.split('@')[0] : 'S';
              const avatarLetter = emailPrefix.charAt(0).toUpperCase();
              
              return (
                <div key={log.id} className="relative group" id={`activity-log-${log.id}`}>
                  {/* Timeline Node Point Icon */}
                  <span className={`absolute -left-[3.1rem] md:-left-[4.1rem] top-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${actionStyle.bg}`}>
                    <i className={`${actionStyle.icon} text-xs`}></i>
                  </span>

                  {/* Log Content Card */}
                  <div className="bg-slate-50/40 group-hover:bg-slate-50 border border-transparent group-hover:border-slate-100 p-5 rounded-2xl transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Action, Module, Description */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Action Badge */}
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest ${actionStyle.badge}`}>
                            {log.action}
                          </span>
                          
                          {/* Module Badge */}
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest ${getModuleBadge(log.module)}`}>
                            {log.module}
                          </span>

                          {/* Date/Time stamp */}
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 ml-1">
                            <i className="fa-regular fa-clock"></i>
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-slate-800 text-sm font-semibold tracking-tight leading-relaxed">
                          {log.description}
                        </p>
                      </div>

                      {/* Right: User Avatar / Initiator */}
                      <div className="flex items-center gap-2.5 self-start md:self-center bg-white border border-slate-100/80 px-3 py-1.5 rounded-xl shadow-sm">
                        <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
                          {avatarLetter}
                        </div>
                        <div className="text-left">
                          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Qabtay</p>
                          <p className="text-[11px] font-black text-slate-700 leading-tight mt-0.5 max-w-[120px] truncate" title={log.userEmail}>
                            {emailPrefix}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Activity;
