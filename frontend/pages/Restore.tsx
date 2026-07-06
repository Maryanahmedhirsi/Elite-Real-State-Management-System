import React, { useState, useEffect } from 'react';
import { api } from '../apiService';
import { TrashRecord, UserRole } from '../types';

interface RestoreProps {
  role?: UserRole | null;
}

const Restore: React.FC<RestoreProps> = ({ role }) => {
  const isAdmin = role === UserRole.ADMIN;
  const [trashItems, setTrashItems] = useState<TrashRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Confirmation Modals State
  const [itemToPurge, setItemToPurge] = useState<TrashRecord | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTrashData = async () => {
    try {
      setLoading(true);
      const data = await api.getTrash();
      setTrashItems(data || []);
    } catch (err) {
      console.error('Error fetching trash data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashData();
  }, []);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleRestore = async (id: string, name: string) => {
    if (!isAdmin) {
      showFeedback('Falka soo celinta xogta waa laga xiray isticmaalayaasha caadiga ah! Kaliya Maamulayaasha (Admins) ayaa ogol.', 'error');
      return;
    }
    try {
      const res = await api.restoreTrash(id);
      if (res.success) {
        showFeedback(`Si guul leh ayaa loo soo celiyay xogta: "${name}"`, 'success');
        setTrashItems(prev => prev.filter(item => item.id !== id));
      } else {
        showFeedback('Waa uu fashilmay soo celinta xogta.', 'error');
      }
    } catch (err) {
      console.error('Error restoring item:', err);
      showFeedback('Kala xiriiridda backend-ka waa ay fashilantay.', 'error');
    }
  };

  const handlePurge = async () => {
    if (!isAdmin) {
      showFeedback('Falka tirtirista rasmiga ah waa laga xiray isticmaalayaasha caadiga ah! Kaliya Maamulayaasha (Admins) ayaa ogol.', 'error');
      return;
    }
    if (!itemToPurge) return;
    try {
      const res = await api.deleteTrash(itemToPurge.id);
      if (res.success) {
        showFeedback(`Si rasmi ah ayaa loo tirtiray xogta: "${itemToPurge.displayName}"`, 'success');
        setTrashItems(prev => prev.filter(item => item.id !== itemToPurge.id));
      } else {
        showFeedback('Waa uu fashilmay tirtirista xogta.', 'error');
      }
    } catch (err) {
      console.error('Error purging item:', err);
      showFeedback('Kala xiriiridda backend-ka waa ay fashilantay.', 'error');
    } finally {
      setItemToPurge(null);
    }
  };

  const handleEmptyTrash = async () => {
    if (!isAdmin) {
      showFeedback('Falka faorxinta qashinka waa laga xiray isticmaalayaasha caadiga ah! Kaliya Maamulayaasha (Admins) ayaa ogol.', 'error');
      return;
    }
    try {
      const res = await api.emptyTrash();
      if (res.success) {
        showFeedback('Weelkii qashinka si guul leh ayaa loo faorxiyay!', 'success');
        setTrashItems([]);
      } else {
        showFeedback('Waa uu fashilmay faorxinta weelka qashinka.', 'error');
      }
    } catch (err) {
      console.error('Error emptying trash:', err);
      showFeedback('Kala xiriiridda backend-ka waa ay fashilantay.', 'error');
    } finally {
      setShowEmptyConfirm(false);
    }
  };

  // Filter and search
  const filteredItems = trashItems.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = item.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'properties':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'tenants':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rents':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'sales':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'financials':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'maintenance':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'users':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'properties': return 'Guri / Hanti';
      case 'tenants': return 'Kirayste';
      case 'rents': return 'Kiro / Bixin';
      case 'sales': return 'Iib / Qandaraas';
      case 'financials': return 'Lacag / Dhaqdhaqaaq';
      case 'maintenance': return 'Dayactir';
      case 'users': return 'Isticmaale';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'properties': return 'fa-building';
      case 'tenants': return 'fa-users';
      case 'rents': return 'fa-file-invoice-dollar';
      case 'sales': return 'fa-handshake';
      case 'financials': return 'fa-money-bill-trend-up';
      case 'maintenance': return 'fa-wrench';
      case 'users': return 'fa-user-lock';
      default: return 'fa-database';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('so-SO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-black tracking-wide text-xs uppercase">Raadinaya xogaha la tirtiray...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Alerts / Feedback Banner */}
      {actionMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce border ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <i className={`fa-solid ${actionMessage.type === 'success' ? 'fa-circle-check text-emerald-600' : 'fa-circle-exclamation text-rose-600'} text-lg`}></i>
          <span className="text-sm font-bold">{actionMessage.text}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <i className="fa-solid fa-trash-arrow-up text-indigo-600"></i>
            Weelka Qashinka & Soo Celinta
          </h1>
          <p className="text-slate-500 font-medium">Ka hel, soo celi ama si rasmi ah u tirtir xogaha la tuuray.</p>
        </div>
        {trashItems.length > 0 && (
          <button
            disabled={!isAdmin}
            onClick={() => setShowEmptyConfirm(true)}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${
              isAdmin 
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 active:scale-95 cursor-pointer shadow-sm' 
                : 'bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
            }`}
            title={isAdmin ? "Faorxi dhammaan qashinka ku jira weelka" : "Kaliya maamulayaasha ayaa faorxin kara qashinka"}
          >
            <i className={`fa-solid ${isAdmin ? 'fa-dumpster-fire' : 'fa-lock'}`}></i> 
            <span>Faorxi Qashinka {isAdmin ? "" : "(Kaliya Admin)"}</span>
          </button>
        )}
      </div>

      {/* Dynamic Authorization Banner */}
      {isAdmin ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <i className="fa-solid fa-shield-halved text-emerald-600 text-xl shrink-0"></i>
          <div className="text-xs font-bold leading-relaxed">
            <span className="font-extrabold uppercase tracking-wider block mb-0.5 text-emerald-900">MUUQAALKA MAAMULAHA: FURAN (ADMIN ACCESS GRANTED)</span>
            Waxaad ku dhex jirtaa koontada Maamulaha (Admin). Waxaad leedahay xuquuq buuxda oo aad dib ugu soo celiso xogaha la tirtiray ama aad si rasmi ah u baabi'iso.
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <i className="fa-solid fa-circle-exclamation text-amber-600 text-xl shrink-0"></i>
          <div className="text-xs font-bold leading-relaxed">
            <span className="font-extrabold uppercase tracking-wider block mb-0.5 text-amber-900">SOO CELINTA WAA KA XIRAN TAHAY ISTICMAALAYAASHA (RESTORE LOCKED FOR AGENTS)</span>
            Fursada dib u soo celinta ama tirtirista rasmiga ah ee xogaha waxaa loo ogol yahay oo keliya **Maamulaha Sare (System Admin)**. Dhammaan isticmaalayaasha kale (Agents) badamada waa laga curyaamiyay si loo ilaaliyo badbaadada xogta nidaamka.
          </div>
        </div>
      )}

      {/* Filters & Search Row */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search bar */}
          <div className="relative w-full md:w-96">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Raadi xogta magaceeda ama nooca..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium text-slate-800"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-circle-xmark"></i>
              </button>
            )}
          </div>

          {/* Counts */}
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Wadarta qashinka: <span className="text-slate-800 font-black">{trashItems.length} items</span>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
          {[
            { id: 'all', label: 'Dhammaan', icon: 'fa-cubes', count: trashItems.length },
            { id: 'properties', label: 'Hanti / Guryaha', icon: 'fa-building', count: trashItems.filter(t => t.type === 'properties').length },
            { id: 'tenants', label: 'Kiraystayaasha', icon: 'fa-users', count: trashItems.filter(t => t.type === 'tenants').length },
            { id: 'rents', label: 'Kirooyinka', icon: 'fa-file-invoice-dollar', count: trashItems.filter(t => t.type === 'rents').length },
            { id: 'sales', label: 'Iibka', icon: 'fa-handshake', count: trashItems.filter(t => t.type === 'sales').length },
            { id: 'financials', label: 'Maaliyadda', icon: 'fa-money-bill-trend-up', count: trashItems.filter(t => t.type === 'financials').length },
            { id: 'maintenance', label: 'Dayactirka', icon: 'fa-wrench', count: trashItems.filter(t => t.type === 'maintenance').length },
            { id: 'users', label: 'Isticmaalayaasha', icon: 'fa-user-lock', count: trashItems.filter(t => t.type === 'users').length },
          ].map(pill => (
            <button
              key={pill.id}
              onClick={() => setFilterType(pill.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                filterType === pill.id
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <i className={`fa-solid ${pill.icon}`}></i>
              <span>{pill.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filterType === pill.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
              } font-black`}>
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main List Table Card */}
      {filteredItems.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-sm text-center max-w-2xl mx-auto flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl shadow-inner border border-emerald-100">
            <i className="fa-solid fa-leaf"></i>
          </div>
          <h3 className="text-xl font-black text-slate-800">Weelkii qashinka waa maran yahay!</h3>
          <p className="text-slate-500 max-w-sm font-medium">
            Ma jiraan xogyo la tirtiray oo ku dhex jira qaybtaan. Markaad wax ka tirtirto systemka, halkan ayaad ka heli doontaa si aad u soo celiso.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Xogta La Tirtiray</th>
                  <th className="px-6 py-4">Nooca (Category)</th>
                  <th className="px-6 py-4">Goorta La Tirtiray</th>
                  <th className="px-6 py-4 text-right">Falka (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm border ${getBadgeStyle(item.type)}`}>
                          <i className={`fa-solid ${getTypeIcon(item.type)}`}></i>
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block">{item.displayName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">ID: {item.originalData?.id || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold border uppercase tracking-wider ${getBadgeStyle(item.type)}`}>
                        {getTypeLabel(item.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-semibold">
                      <i className="fa-regular fa-clock mr-1 text-slate-400"></i>
                      {formatDate(item.deletedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => handleRestore(item.id, item.displayName)}
                              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-100 active:scale-95 shadow-sm"
                              title="Soo Celi"
                            >
                              <i className="fa-solid fa-trash-can-arrow-up text-[11px]"></i>
                              <span>Soo Celi</span>
                            </button>
                            <button
                              onClick={() => setItemToPurge(item)}
                              className="px-4 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border border-rose-100 active:scale-95 shadow-sm"
                              title="Tirtir Weligaa"
                            >
                              <i className="fa-solid fa-trash-can text-[11px]"></i>
                              <span>Tirtir Weligaa</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              disabled={true}
                              className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 opacity-60 cursor-not-allowed"
                              title="Soo celinta waa laga xiray dhammaan isticmaalayaasha caadiga ah"
                            >
                              <i className="fa-solid fa-lock text-[10px]"></i>
                              <span>Waa la xiray</span>
                            </button>
                            <button
                              disabled={true}
                              className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 opacity-60 cursor-not-allowed"
                              title="Tirtirista waa laga xiray dhammaan isticmaalayaasha caadiga ah"
                            >
                              <i className="fa-solid fa-lock text-[10px]"></i>
                              <span>Tirtir (Locked)</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Purge Single Item */}
      {itemToPurge && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-xl shrink-0 border border-rose-100">
                <i className="fa-solid fa-circle-exclamation"></i>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900">Ma hubtaa in aad si rasmi ah u tirtirto?</h3>
                <p className="text-sm text-slate-500 font-medium">
                  Tilaabadani waa mid aan dib loo soo celin karin. Xogtani si rasmi ah ayay uga bixi doontaa kaydka weelka qashinka.
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-700 mt-2">
                  <span className="font-bold text-slate-900 block mb-0.5">Xogta la tirtirayo:</span>
                  {itemToPurge.displayName} ({getTypeLabel(itemToPurge.type)})
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setItemToPurge(null)}
                className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
              >
                Iska daa
              </button>
              <button
                onClick={handlePurge}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Hubaal, Tirtir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Empty All Trash */}
      {showEmptyConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-xl shrink-0 border border-rose-100">
                <i className="fa-solid fa-dumpster-fire"></i>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900">Ma hubtaa in aad faorxiso qashinka oo dhan?</h3>
                <p className="text-sm text-slate-500 font-medium">
                  Tilaabadani waxay si rasmi ah u baabi'in doontaa dhammaan <span className="text-rose-600 font-black">{trashItems.length}</span> walxood ee ku jira weelka qashinka. Dib looma soo celin karo!
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowEmptyConfirm(false)}
                className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
              >
                Iska daa
              </button>
              <button
                onClick={handleEmptyTrash}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Hubaal, Faorxi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Restore;
