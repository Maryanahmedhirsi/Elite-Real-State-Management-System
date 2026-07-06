import React, { useState, useEffect } from 'react';
import { api } from '../apiService';
import { Tenant, Property, AppUser, UserRole } from '../types';

interface TenantsProps {
  role?: UserRole | null;
}

const Tenants: React.FC<TenantsProps> = ({ role }) => {
  const isAdmin = role === UserRole.ADMIN;
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [activeTab, setActiveTab] = useState<'tenants' | 'users'>('tenants');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [unit, setUnit] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [leaseStart, setLeaseStart] = useState('');
  const [leaseEnd, setLeaseEnd] = useState('');
  const [status, setStatus] = useState<'Active' | 'Ending Soon' | 'Past Due'>('Active');

  const fetchData = async () => {
    try {
      const [tList, pList, uList] = await Promise.all([
        api.getTenants(),
        api.getProperties(),
        api.getUsers()
      ]);
      setTenants(tList);
      setProperties(pList);
      setUsers(uList);
    } catch (err) {
      console.error('Error fetching tenant view:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveUser = async (id: string) => {
    try {
      await api.approveUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, approved: true } : u));
    } catch (err) {
      console.error('Error approving user:', err);
    }
  };

  const handleRejectUser = async (id: string) => {
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error('Error rejecting user:', err);
    }
  };

  const handleOpenModal = (t?: Tenant) => {
    if (t) {
      setEditingTenant(t);
      setName(t.name);
      setPropertyId(t.propertyId || '');
      setUnit(t.unit);
      setEmail(t.email);
      setPhone(t.phone);
      setLeaseStart(t.leaseStart);
      setLeaseEnd(t.leaseEnd);
      setStatus(t.status);
    } else {
      setEditingTenant(null);
      setName('');
      setPropertyId(properties[0]?.id || '');
      setUnit('');
      setEmail('');
      setPhone('');
      setLeaseStart('2024-01-01');
      setLeaseEnd('2025-01-01');
      setStatus('Active');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTenant(null);
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
  };

  const confirmAndExecuteDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteTenant(deleteId);
      setTenants(prev => prev.filter(t => t.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting tenant:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Tenant = {
      id: editingTenant ? editingTenant.id : Math.random().toString(36).substring(2, 9),
      name,
      propertyId,
      unit,
      email,
      phone,
      leaseStart,
      leaseEnd,
      status
    };

    try {
      if (editingTenant) {
        await api.updateTenant(editingTenant.id, payload);
        setTenants(prev => prev.map(t => t.id === editingTenant.id ? payload : t));
      } else {
        await api.createTenant(payload);
        setTenants(prev => [payload, ...prev]);
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving tenant:', err);
    }
  };

  const getPropertyName = (pId: string) => {
    return properties.find(p => p.id === pId)?.name || 'Unknown Property';
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Loading tenant directory...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tenants & Access Management</h1>
          <p className="text-slate-500 font-medium">Manage tenant leases and system user approvals.</p>
        </div>
        {activeTab === 'tenants' && (
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-user-plus"></i> Add Tenant
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`pb-4 px-2 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'tenants' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <i className="fa-solid fa-users"></i>
          <span>Tenants (Tenants Directory)</span>
          <span className="px-2 py-0.5 text-[9px] bg-slate-100 text-slate-600 rounded-full font-bold">
            {tenants.length}
          </span>
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'users' 
                ? 'border-indigo-600 text-indigo-600 font-extrabold' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <i className="fa-solid fa-user-shield"></i>
            <span>User Approvals</span>
            {users.filter(u => !u.approved).length > 0 && (
              <span className="px-2 py-0.5 text-[9px] bg-rose-500 text-white rounded-full font-black animate-pulse">
                {users.filter(u => !u.approved).length}
              </span>
            )}
          </button>
        )}
      </div>

      {activeTab === 'tenants' ? (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Tenant</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Property & Unit</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Lease Duration</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {tenants.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                          {tenant.name.charAt(0)}
                        </div>
                        <span className="font-extrabold text-slate-900 tracking-tight">{tenant.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs">
                        <p className="font-bold text-slate-900">{getPropertyName(tenant.propertyId)}</p>
                        <p className="text-slate-400 mt-1 uppercase font-semibold">Unit: {tenant.unit}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs space-y-0.5">
                        <p className="text-slate-700 font-bold">{tenant.email}</p>
                        <p className="text-slate-400">{tenant.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-slate-700">{tenant.leaseStart} - {tenant.leaseEnd}</p>
                    </td>
                    <td className="px-6 py-5">
                      <small className={`inline-flex px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        tenant.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                        tenant.status === 'Past Due' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {tenant.status}
                      </small>
                    </td>
                    <td className="px-6 py-5 text-right flex justify-end gap-2 items-center">
                      <button
                        onClick={() => handleOpenModal(tenant)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all text-xs font-extrabold active:scale-95 cursor-pointer"
                        title="Edit"
                      >
                        <i className="fa-solid fa-pen-to-square text-indigo-600"></i>
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(tenant.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all text-xs font-extrabold active:scale-95 cursor-pointer"
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash-can text-rose-500"></i>
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tenants.length === 0 && (
              <div className="p-12 text-center text-slate-400 font-bold italic">
                No tenants recorded.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">User</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Registration Date</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-black uppercase text-sm">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 tracking-tight">{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{u.role === 'admin' ? 'SYSTEM ADMIN' : 'AGENT / USER'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs space-y-0.5">
                        <p className="text-slate-700 font-bold">{u.email}</p>
                        <p className="text-slate-400">{u.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                        u.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs text-slate-500 font-bold">
                      {new Date(u.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-5">
                      <small className={`inline-flex px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        u.approved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'
                      }`}>
                        {u.approved ? 'APPROVED' : 'PENDING APPROVAL'}
                      </small>
                    </td>
                    <td className="px-6 py-5 text-right flex justify-end gap-2 items-center">
                      {!u.approved && (
                        <button
                          onClick={() => handleApproveUser(u.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all text-xs font-black uppercase tracking-wider active:scale-95 cursor-pointer shadow-md shadow-emerald-500/10"
                        >
                          <i className="fa-solid fa-circle-check"></i>
                          <span>Approve</span>
                        </button>
                      )}
                      {u.email !== 'admin@eliteestate.com' && (
                        <button
                          onClick={() => handleRejectUser(u.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all text-xs font-black uppercase tracking-wider active:scale-95 cursor-pointer"
                        >
                          <i className="fa-solid fa-user-xmark"></i>
                          <span>{u.approved ? 'Delete' : 'Reject'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-12 text-center text-slate-400 font-bold italic">
                No users found.
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {editingTenant ? 'Edit Tenant' : 'Add Tenant'}
              </h2>
              <button onClick={handleCloseModal} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-slate-400 transition-colors shadow-sm">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tenant Name</label>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Abdi Rahman, Maryan Ali, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-semibold">Property</label>
                  <select
                    value={propertyId} onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Unit / Room No</label>
                  <input
                    type="text" required value={unit} onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="4B, Flat 2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email</label>
                  <input
                    type="type" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Mobile No</label>
                  <input
                    type="text" required value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                    placeholder="25261-555-0101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Lease Start Date</label>
                  <input
                    type="date" required value={leaseStart} onChange={(e) => setLeaseStart(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Lease End Date</label>
                  <input
                    type="date" required value={leaseEnd} onChange={(e) => setLeaseEnd(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Status</label>
                <select
                  value={status} onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Ending Soon">Ending Soon</option>
                  <option value="Past Due">Past Due</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-[0.98] mt-4"
              >
                Save Tenant
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
              <p className="text-xs text-slate-500 mt-2 font-medium">This action cannot be undone. Are you sure you want to delete this tenant?</p>
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

export default Tenants;
