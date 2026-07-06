import React, { useState, useEffect } from 'react';
import { api } from '../apiService';
import { MaintenanceRequest, Property, Tenant, UserRole } from '../types';

interface MaintenanceProps {
  role?: UserRole | null;
}

const Maintenance: React.FC<MaintenanceProps> = ({ role }) => {
  const isAdmin = role === UserRole.ADMIN;
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New/Edit request states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [propertyName, setPropertyName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [status, setStatus] = useState<'New' | 'In Progress' | 'Completed'>('New');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [maintData, propsData, tenantsData] = await Promise.all([
        api.getMaintenance(),
        api.getProperties(),
        api.getTenants()
      ]);
      setRequests(maintData);
      setProperties(propsData);
      setTenants(tenantsData);
    } catch (err) {
      console.error('Error fetching maintenance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    setEditingRequest(null);
    setPropertyName(properties[0]?.name || '');
    setTenantName(tenants[0]?.name || '');
    setIssue('');
    setPriority('Medium');
    setStatus('New');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r: MaintenanceRequest) => {
    setEditingRequest(r);
    setPropertyName(r.propertyName);
    setTenantName(r.tenantName);
    setIssue(r.issue);
    setPriority(r.priority);
    setStatus(r.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRequest) {
      const payload: MaintenanceRequest = {
        ...editingRequest,
        propertyName,
        tenantName,
        issue,
        priority,
        status
      };

      try {
        await api.updateMaintenance(editingRequest.id, payload);
        setRequests(prev => prev.map(item => item.id === editingRequest.id ? payload : item));
        setIsModalOpen(false);
      } catch (err) {
        console.error('Error updating maintenance ticket:', err);
      }
    } else {
      const payload: MaintenanceRequest = {
        id: Math.random().toString(36).substring(2, 9),
        propertyName,
        tenantName,
        issue,
        priority,
        status: 'New',
        date: new Date().toISOString().split('T')[0]
      };

      try {
        await api.createMaintenance(payload);
        setRequests(prev => [payload, ...prev]);
        setIsModalOpen(false);
      } catch (err) {
        console.error('Error creating maintenance ticket:', err);
      }
    }
  };

  const handleUpdateStatus = async (request: MaintenanceRequest, newStatus: 'New' | 'In Progress' | 'Completed') => {
    const updated: MaintenanceRequest = { ...request, status: newStatus };
    try {
      await api.updateMaintenance(request.id, updated);
      setRequests(prev => prev.map(item => item.id === request.id ? updated : item));
    } catch (err) {
      console.error('Error updating maintenance status:', err);
    }
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteId(id);
  };

  const confirmAndExecuteDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteMaintenance(deleteId);
      setRequests(prev => prev.filter(r => r.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting maintenance request:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Waa lagu guda-jiraa soo ridaadda codsiyada...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Maintenance Requests</h1>
          <p className="text-slate-500 font-medium">Manage and track repair or maintenance requests submitted by tenants.</p>
        </div>
        {(role === UserRole.ADMIN || role === UserRole.USER) && (
          <button
            onClick={handleOpenModal}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i> Add Request
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['New', 'In Progress', 'Completed'].map(statusGroup => {
          const groupRequests = requests.filter(r => r.status === statusGroup);
          return (
            <div key={statusGroup} className="bg-slate-100/50 p-5 rounded-3xl border border-slate-200 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-950 text-base">{
                  statusGroup === 'New' ? 'New' : statusGroup === 'In Progress' ? 'In Progress' : 'Completed'
                }</h3>
                <span className="bg-white px-3 py-1.5 rounded-xl text-xs font-black text-indigo-600 shadow-sm border border-slate-100">
                  {groupRequests.length}
                </span>
              </div>
              
              <div className="space-y-4 flex-1">
                {groupRequests.map(request => (
                  <div key={request.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 hover:border-indigo-300 transition-all group space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        request.priority === 'Urgent' ? 'bg-rose-100 text-rose-600' :
                        request.priority === 'High' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {request.priority} Priority
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">{request.date}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 leading-snug">{request.issue}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{request.propertyName} • {request.tenantName}</p>
                    
                    {role === UserRole.ADMIN || role === UserRole.USER ? (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(request)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[9px] font-bold uppercase transition-colors"
                            title="Edit"
                          >
                            <i className="fa-solid fa-pen"></i> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(request.id)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[9px] font-bold uppercase transition-colors"
                            title="Delete"
                          >
                            <i className="fa-solid fa-trash-can"></i> Delete
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          {request.status === 'New' && (
                            <button
                              onClick={() => handleUpdateStatus(request, 'In Progress')}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors flex items-center gap-1"
                            >
                              Start <i className="fa-solid fa-arrow-right"></i>
                            </button>
                          )}
                          {request.status === 'In Progress' && (
                            <button
                              onClick={() => handleUpdateStatus(request, 'Completed')}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors flex items-center gap-1"
                            >
                              Complete <i className="fa-solid fa-check"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status: {request.status}</span>
                      </div>
                    )}
                  </div>
                ))}
                {groupRequests.length === 0 && (
                  <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center">
                    <p className="text-xs text-slate-400 font-medium italic">No requests in this section.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {editingRequest ? 'Edit Request' : 'Add Maintenance Request'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-slate-400 transition-colors shadow-sm">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Property</label>
                <select
                  required
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>-- Select Property --</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                  {properties.length === 0 && (
                    <option value="">No registered properties found</option>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Tenant</label>
                <select
                  required
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>-- Select Tenant --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                  {tenants.length === 0 && (
                    <option value="">No registered tenants found</option>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Issue Details</label>
                <textarea
                  required value={issue} onChange={(e) => setIssue(e.target.value)}
                  rows={3}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Describe the issue (e.g. plumbing, electrical, heating, water, etc.)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Priority</label>
                  <select
                    value={priority} onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Status</label>
                  <select
                    value={status} onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-[0.98] mt-4"
              >
                {editingRequest ? 'Update Request' : 'Submit Request'}
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
              <p className="text-xs text-slate-500 mt-2 font-medium">This action cannot be undone. Are you sure you want to delete this maintenance request?</p>
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

export default Maintenance;
