import React, { useState, useEffect } from 'react';
import { api } from '../apiService';
import { Sale, Property, UserRole } from '../types';

interface SalesProps {
  role?: UserRole | null;
}

const Sales: React.FC<SalesProps> = ({ role }) => {
  const isAdmin = role === UserRole.ADMIN;
  const [sales, setSales] = useState<Sale[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [propertyId, setPropertyId] = useState('');
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState(0);
  const [transactionType, setTransactionType] = useState<'Sale' | 'Rent'>('Sale');
  const [status, setStatus] = useState<'Completed' | 'Pending' | 'Cancelled'>('Completed');

  const fetchData = async () => {
    try {
      const [sData, pData] = await Promise.all([
        api.getSales(),
        api.getProperties()
      ]);
      setSales(sData);
      setProperties(pData);
    } catch (err) {
      console.error('Error fetching sales portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    setEditingSale(null);
    setPropertyId(properties[0]?.id || '');
    setClientName('');
    setAmount(10000);
    setTransactionType('Sale');
    setStatus('Completed');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (s: Sale) => {
    setEditingSale(s);
    setPropertyId(s.propertyId);
    setClientName(s.clientName);
    setAmount(s.amount);
    setTransactionType(s.transactionType);
    setStatus(s.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSale) {
      const payload: Sale = {
        ...editingSale,
        propertyId,
        clientName,
        amount,
        transactionType,
        status
      };

      try {
        await api.updateSale(editingSale.id, payload);
        setSales(prev => prev.map(item => item.id === editingSale.id ? payload : item));
        setIsModalOpen(false);
      } catch (err) {
        console.error('Error updating sale deal:', err);
      }
    } else {
      const payload: Sale = {
        id: Math.random().toString(36).substring(2, 9),
        propertyId,
        clientName,
        amount,
        date: new Date().toISOString().split('T')[0],
        transactionType,
        status
      };

      try {
        await api.createSale(payload);
        setSales(prev => [payload, ...prev]);
        setIsModalOpen(false);
      } catch (err) {
        console.error('Error logging sale deal:', err);
      }
    }
  };

  const confirmAndExecuteDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteSale(deleteId);
      setSales(prev => prev.filter(s => s.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting sale:', err);
    }
  };

  const getPropertyName = (pId: string) => {
    return properties.find(p => p.id === pId)?.name || 'Unknown Property';
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Loading contracts directory...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sales & Leases</h1>
          <p className="text-slate-500 font-medium">Create and manage property sale agreements and lease contracts between properties and clients.</p>
        </div>
        {(role === UserRole.ADMIN || role === UserRole.USER) && (
          <button
            onClick={handleOpenModal}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i> Add Deal
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Property</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Client</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Contract Amount</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Deal Type</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                 <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {sales.map(deal => (
                <tr key={deal.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <p className="font-extrabold text-slate-900 leading-tight">{getPropertyName(deal.propertyId)}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-800">{deal.clientName}</p>
                  </td>
                  <td className="px-6 py-5 text-indigo-600 font-black">
                    ${deal.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-5">
                    <small className={`inline-flex px-2 py-1 rounded bg-slate-100 text-slate-700 font-bold uppercase tracking-wide`}>
                      {deal.transactionType}
                    </small>
                  </td>
                  <td className="px-6 py-5 text-xs text-slate-500 font-bold">
                    {deal.date}
                  </td>
                  <td className="px-6 py-5">
                    <small className={`inline-flex px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      deal.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                      deal.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {deal.status === 'Completed' ? 'PAID' : deal.status === 'Pending' ? 'PENDING' : 'CANCELLED'}
                    </small>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {role === UserRole.ADMIN || role === UserRole.USER ? (
                        <>
                          {deal.status === 'Pending' && (
                            <button
                              onClick={async () => {
                                try {
                                  const updated: Sale = { ...deal, status: 'Completed' };
                                  await api.updateSale(deal.id, updated);
                                  setSales(prev => prev.map(s => s.id === deal.id ? updated : s));
                                } catch (e) { console.error(e); }
                              }}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 active:scale-95 shadow-md shadow-emerald-500/10 cursor-pointer animate-pulse"
                              title="Mark Completed"
                            >
                              <i className="fa-solid fa-check"></i> Approve
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(deal)}
                            className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg cursor-pointer"
                            title="Edit"
                          >
                            <i className="fa-solid fa-pen-to-square text-indigo-600"></i>
                          </button>
                          <button
                            onClick={() => setDeleteId(deal.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Delete"
                          >
                            <i className="fa-solid fa-trash-can text-rose-500"></i>
                          </button>
                        </>
                      ) : (
                        deal.status === 'Pending' ? (
                          <button
                            onClick={async () => {
                              try {
                                const updated: Sale = { ...deal, status: 'Completed' };
                                  await api.updateSale(deal.id, updated);
                                  setSales(prev => prev.map(s => s.id === deal.id ? updated : s));
                              } catch (e) { console.error(e); }
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 shadow-md shadow-indigo-600/15 active:scale-95 cursor-pointer"
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
          {sales.length === 0 && (
            <p className="p-12 text-center text-slate-400 font-bold italic">No deals or lease contracts found in the directory.</p>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {editingSale ? 'Edit Sale Deal' : 'Add Sale Deal'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-slate-400 transition-colors shadow-sm">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Property</label>
                <select
                  value={propertyId} onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Client Name (Buyer / Lessee)</label>
                <input
                  type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  placeholder="Faisal Omar, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Deal Type</label>
                  <select
                    value={transactionType} onChange={(e) => setTransactionType(e.target.value as any)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Sale">Sale</option>
                    <option value="Rent">Lease / Rent</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Contract Price ($)</label>
                  <input
                    type="number" required value={amount} onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Xaaladda (Status)</label>
                <select
                  value={status} onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold"
                >
                  <option value="Completed">Completed (La dhameeyay)</option>
                  <option value="Pending">Pending (Weligiis taagan)</option>
                  <option value="Cancelled">Cancelled (La laalay)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-[0.98] mt-4"
              >
                {editingSale ? 'Update Deal' : 'Save Deal'}
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
              <p className="text-xs text-slate-500 mt-2 font-medium">This action cannot be undone. Are you sure you want to delete this deal?</p>
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
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
