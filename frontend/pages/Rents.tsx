import React, { useState, useEffect } from 'react';
import { api } from '../apiService';
import { RentRecord, Property, UserRole } from '../types';

interface RentsProps {
  role?: UserRole | null;
}

const Rents: React.FC<RentsProps> = ({ role }) => {
  const isAdmin = role === UserRole.ADMIN;
  const [rents, setRents] = useState<RentRecord[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRent, setEditingRent] = useState<RentRecord | null>(null);
  const [propertyId, setPropertyId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'Paid' | 'Pending' | 'Overdue'>('Pending');

  const fetchData = async () => {
    try {
      const [rList, pList] = await Promise.all([
        api.getRents(),
        api.getProperties()
      ]);
      setRents(rList);
      setProperties(pList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    setEditingRent(null);
    const vacantProps = properties.filter(p => p.status === 'Vacant');
    const defaultProp = vacantProps[0] || properties[0];
    setPropertyId(defaultProp?.id || '');
    setTenantName('');
    setAmount(450);
    setDueDate('2024-05-30');
    setStatus('Pending');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r: RentRecord) => {
    setEditingRent(r);
    setPropertyId(r.propertyId);
    setTenantName(r.tenantName);
    setAmount(r.amount);
    setDueDate(r.dueDate);
    setStatus(r.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRent) {
      const payload: RentRecord = {
        id: editingRent.id,
        propertyId,
        amount,
        dueDate,
        status,
        tenantName
      };

      try {
        await api.updateRent(editingRent.id, payload);

        // Manage property statuses if property changed
        if (editingRent.propertyId !== propertyId) {
          const oldProp = properties.find(p => p.id === editingRent.propertyId);
          if (oldProp) {
            const updatedOld: Property = { ...oldProp, status: 'Vacant' };
            await api.updateProperty(oldProp.id, updatedOld);
          }
          const newProp = properties.find(p => p.id === propertyId);
          if (newProp) {
            const updatedNew: Property = { ...newProp, status: 'Occupied' };
            await api.updateProperty(newProp.id, updatedNew);
          }
          // Fetch properties again to make sure everything is in sync
          const pList = await api.getProperties();
          setProperties(pList);
          showFeedback('Si guul leh ayaa loo cusubaysiiyay biilka! Hantidii hore hadda waa Bannaan tahay (Vacant), tan cusubna waa Lagu Jiro (Occupied).', 'success');
        } else {
          // If property didn't change, ensure it's set to Occupied
          const prop = properties.find(p => p.id === propertyId);
          if (prop && prop.status !== 'Occupied') {
            const updatedProp: Property = { ...prop, status: 'Occupied' };
            await api.updateProperty(prop.id, updatedProp);
            setProperties(prev => prev.map(p => p.id === prop.id ? updatedProp : p));
          }
          showFeedback('Si guul leh ayaa loo cusubaysiiyay biilka kirada!', 'success');
        }

        setRents(prev => prev.map(item => item.id === editingRent.id ? payload : item));
        setIsModalOpen(false);
      } catch (err) {
        console.error(err);
        showFeedback('Waa uu fashilmay cusubaysiinta biilka.', 'error');
      }
    } else {
      const payload: RentRecord = {
        id: Math.random().toString(36).substring(2, 9),
        propertyId,
        amount,
        dueDate,
        status,
        tenantName
      };

      try {
        await api.createRent(payload);
        
        // Find property and set status to 'Occupied'
        const prop = properties.find(p => p.id === propertyId);
        if (prop) {
          const updatedProp: Property = { ...prop, status: 'Occupied' };
          await api.updateProperty(prop.id, updatedProp);
          setProperties(prev => prev.map(p => p.id === prop.id ? updatedProp : p));
          showFeedback(`Biilka kirada waa la keydiyay! Guriga/Hantida "${prop.name}" waxaa loo bedelay 'Occupied' (Lagu jiro) 🔴.`, 'success');
        } else {
          showFeedback('Biilka kirada si guul leh ayaa loo keydiyay!', 'success');
        }

        setRents(prev => [payload, ...prev]);
        setIsModalOpen(false);
      } catch (err) {
        console.error(err);
        showFeedback('Waa uu fashilmay kaydinta biilka.', 'error');
      }
    }
  };

  const handleDeleteRent = async (id: string) => {
    setDeleteId(id);
  };

  const confirmAndExecuteDelete = async () => {
    if (!deleteId) return;
    try {
      const rentToDelete = rents.find(r => r.id === deleteId);
      await api.deleteRent(deleteId);
      
      if (rentToDelete) {
        const prop = properties.find(p => p.id === rentToDelete.propertyId);
        if (prop) {
          const updatedProp: Property = { ...prop, status: 'Vacant' };
          await api.updateProperty(prop.id, updatedProp);
          setProperties(prev => prev.map(p => p.id === prop.id ? updatedProp : p));
          showFeedback(`Biilka waa la tirtiray! Guriga/Hantida "${prop.name}" waxaa loo bedelay 'Vacant' (Bannaan) 🟢 si markale loo kireeyo.`, 'success');
        } else {
          showFeedback('Biilka kirada waa la tirtiray!', 'success');
        }
      } else {
        showFeedback('Biilka kirada waa la tirtiray!', 'success');
      }

      setRents(prev => prev.filter(r => r.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      showFeedback('Waa uu fashilmay tirtirista biilka.', 'error');
    }
  };

  const getPropertyName = (pId: string) => {
    return properties.find(p => p.id === pId)?.name || 'Unknown Property';
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Loading rent directory...
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Rent Management</h1>
          <p className="text-slate-500 font-medium">Create rent invoices for active tenants and record rent payments.</p>
        </div>
        {(role === UserRole.ADMIN || role === UserRole.USER) && (
          <button
            onClick={handleOpenModal}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i> Create Rent Bill
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Property</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Tenant Name</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Rent Amount</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {rents.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <p className="font-extrabold text-slate-900 leading-tight">{getPropertyName(r.propertyId)}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-800">{r.tenantName}</p>
                  </td>
                  <td className="px-6 py-5 text-indigo-600 font-black">
                    ${r.amount}
                  </td>
                  <td className="px-6 py-5 text-xs text-slate-500 font-bold">
                    {r.dueDate}
                  </td>
                  <td className="px-6 py-5">
                    <small className={`inline-flex px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      r.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' :
                      r.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {r.status}
                    </small>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {role === UserRole.ADMIN || role === UserRole.USER ? (
                        <>
                          {r.status !== 'Paid' && (
                            <button
                              onClick={async () => {
                                try {
                                  const updated: RentRecord = { ...r, status: 'Paid' };
                                  await api.updateRent(r.id, updated);
                                  setRents(prev => prev.map(item => item.id === r.id ? updated : item));
                                } catch (e) { console.error(e); }
                              }}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1"
                              title="Mark as Paid"
                            >
                              <i className="fa-solid fa-check"></i> Paid
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(r)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1"
                          >
                            <i className="fa-solid fa-pen-to-square"></i> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRent(r.id)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1"
                          >
                            <i className="fa-solid fa-trash-can"></i> Delete
                          </button>
                        </>
                      ) : (
                        r.status !== 'Paid' ? (
                          <button
                            onClick={async () => {
                              try {
                                const updated: RentRecord = { ...r, status: 'Paid' };
                                await api.updateRent(r.id, updated);
                                setRents(prev => prev.map(item => item.id === r.id ? updated : item));
                              } catch (e) { console.error(e); }
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 shadow-md shadow-indigo-600/15 active:scale-95"
                          >
                            <i className="fa-solid fa-credit-card"></i> Pay Now
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100/60">
                            Paid
                          </span>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rents.length === 0 && (
            <p className="p-12 text-center text-slate-400 font-bold italic">No rent records found.</p>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {editingRent ? 'Edit Rent Bill' : 'Create Rent Bill'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-slate-400 transition-colors shadow-sm">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Property</label>
                <select
                  value={propertyId} onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.status === 'Vacant' ? 'Bannaan/Vacant 🟢' : p.status === 'Occupied' ? 'Lagu Jiro/Occupied 🔴' : 'Dayactir/Maintenance 🟡'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tenant Name</label>
                <input
                  type="text" required value={tenantName} onChange={(e) => setTenantName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Abdi Rahman, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Amount ($)</label>
                  <input
                    type="number" required value={amount} onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Due Date</label>
                  <input
                    type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Status</label>
                <select
                  value={status} onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-[0.98] mt-4"
              >
                {editingRent ? 'Update Rent Bill' : 'Save Rent Bill'}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
          <div className="bg-white rounded-[2rem] w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in duration-300 p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Are you sure?</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">This action cannot be undone. Are you sure you want to delete this rent bill?</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAndExecuteDelete}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rents;
