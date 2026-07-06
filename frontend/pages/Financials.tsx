import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { api } from '../apiService';
import { FinancialRecord, UserRole } from '../types';

const COLORS = ['#0d9488', '#10b981', '#f59e0b', '#ef4444'];

interface FinancialsProps {
  role?: UserRole | null;
}

const Financials: React.FC<FinancialsProps> = ({ role }) => {
  const isAdmin = role === UserRole.ADMIN;
  const [financials, setFinancials] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFinancial, setEditingFinancial] = useState<FinancialRecord | null>(null);
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [category, setCategory] = useState<'Income' | 'Expense'>('Income');
  const [status, setStatus] = useState<'Paid' | 'Debt' | 'Partial'>('Paid');

  const fetchFinancials = async () => {
    try {
      const data = await api.getFinancials();
      setFinancials(data);
    } catch (err) {
      console.error('Error fetching financials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchFinancials();
  }, []);

  const handleOpenModal = () => {
    setEditingFinancial(null);
    setClientName('');
    setDescription('');
    setTotalAmount(100);
    setPaidAmount(100);
    setCategory('Income');
    setStatus('Paid');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (f: FinancialRecord) => {
    setEditingFinancial(f);
    setClientName(f.clientName);
    setDescription(f.description);
    setTotalAmount(f.totalAmount);
    setPaidAmount(f.paidAmount);
    setCategory(f.category);
    setStatus(f.status);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
  };

  const confirmAndExecuteDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteFinancial(deleteId);
      setFinancials(prev => prev.filter(f => f.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting financial record:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFinancial) {
      const payload: FinancialRecord = {
        ...editingFinancial,
        clientName,
        description,
        totalAmount,
        paidAmount,
        category,
        status
      };

      try {
        await api.updateFinancial(editingFinancial.id, payload);
        setFinancials(prev => prev.map(item => item.id === editingFinancial.id ? payload : item));
        setIsModalOpen(false);
      } catch (err) {
        console.error('Error updating transaction:', err);
      }
    } else {
      const payload: FinancialRecord = {
        id: Math.random().toString(36).substring(2, 9),
        date: new Date().toISOString().split('T')[0],
        clientName,
        description,
        totalAmount,
        paidAmount,
        category,
        status
      };

      try {
        await api.createFinancial(payload);
        setFinancials(prev => [payload, ...prev]);
        setIsModalOpen(false);
      } catch (err) {
        console.error('Error adding transaction:', err);
      }
    }
  };

  const totalIncome = financials
    .filter(f => f.category === 'Income')
    .reduce((sum, f) => sum + f.paidAmount, 0);

  const totalExpense = financials
    .filter(f => f.category === 'Expense')
    .reduce((sum, f) => sum + f.paidAmount, 0);

  // Advanced financial breakdowns for Paid, Unpaid, and Partial
  const incomeRecords = financials.filter(f => f.category === 'Income');
  const totalIncomeExpected = incomeRecords.reduce((sum, f) => sum + f.totalAmount, 0);
  const totalIncomePaid = incomeRecords.reduce((sum, f) => sum + f.paidAmount, 0);
  const totalIncomeUnpaid = incomeRecords.reduce((sum, f) => sum + Math.max(0, f.totalAmount - f.paidAmount), 0);

  const expenseRecords = financials.filter(f => f.category === 'Expense');
  const totalExpenseExpected = expenseRecords.reduce((sum, f) => sum + f.totalAmount, 0);
  const totalExpensePaid = expenseRecords.reduce((sum, f) => sum + f.paidAmount, 0);
  const totalExpenseUnpaid = expenseRecords.reduce((sum, f) => sum + Math.max(0, f.totalAmount - f.paidAmount), 0);

  const totalExpectedAll = financials.reduce((sum, f) => sum + f.totalAmount, 0);
  const totalPaidAll = financials.reduce((sum, f) => sum + f.paidAmount, 0);
  const totalUnpaidAll = financials.reduce((sum, f) => sum + Math.max(0, f.totalAmount - f.paidAmount), 0);

  const expenseData = [
    { name: 'Rental Income', value: totalIncome || 1 },
    { name: 'Maintenance & Repairs', value: totalExpense || 1 },
  ];

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Loading financial transactions and records...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financials & Bills</h1>
          <p className="text-slate-500 font-medium">Track all income, expenses, and transaction records for the properties.</p>
        </div>
        {(role === UserRole.ADMIN || role === UserRole.USER) && (
          <button
            onClick={handleOpenModal}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i> Add Transaction
          </button>
        )}
      </div>

      {/* Summary Cards of Paid, Unpaid, and Partial states */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Paid Amount */}
        <div className="bg-emerald-50 border border-emerald-100/60 p-6 rounded-3xl space-y-2 relative overflow-hidden shadow-sm">
          <div className="absolute right-4 top-4 w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-xl">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">Total Paid</span>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">${totalPaidAll.toLocaleString()}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold pt-2 border-t border-emerald-200/40">
            <span className="text-emerald-700 font-bold">Income (+${totalIncomePaid.toLocaleString()})</span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-600 font-bold">Expense (-${totalExpensePaid.toLocaleString()})</span>
          </div>
        </div>

        {/* Card 2: Unpaid Amount */}
        <div className="bg-rose-50 border border-rose-100/40 p-6 rounded-3xl space-y-2 relative overflow-hidden shadow-sm">
          <div className="absolute right-4 top-4 w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 text-xl">
            <i className="fa-solid fa-hourglass-half"></i>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">Total Unpaid (Debt)</span>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">${totalUnpaidAll.toLocaleString()}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold pt-2 border-t border-rose-200/40">
            <span className="text-rose-700 font-bold">Remaining Income (${totalIncomeUnpaid.toLocaleString()})</span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-600 font-bold">Remaining Expense (${totalExpenseUnpaid.toLocaleString()})</span>
          </div>
        </div>

        {/* Card 3: Invoiced/Expected Total Amount */}
        <div className="bg-indigo-50/60 border border-indigo-100/60 p-6 rounded-3xl space-y-2 relative overflow-hidden shadow-sm">
          <div className="absolute right-4 top-4 w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 text-xl">
            <i className="fa-solid fa-file-invoice-dollar"></i>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">Total Invoiced</span>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">${totalExpectedAll.toLocaleString()}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold pt-2 border-t border-indigo-200/40">
            <span className="text-indigo-700 font-bold">Expected Income (${totalIncomeExpected.toLocaleString()})</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-bold">Expected Expense (${totalExpenseExpected.toLocaleString()})</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-6 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg mb-6">Latest Transactions</h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {financials.map(f => (
              <div key={f.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50/50 transition-colors group">
                <div className="flex items-start space-x-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    f.category === 'Income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    <i className={`fa-solid ${f.category === 'Income' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-950 leading-tight block">{f.description}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold uppercase">{f.date} • {f.clientName}</p>
                    
                    {/* Visual status breakdown showing paid, unpaid, and partial quantities */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="bg-slate-200/60 text-slate-700 px-2.5 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider">
                        Total: ${f.totalAmount}
                      </span>
                      <span className="bg-emerald-100/50 text-emerald-700 px-2.5 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider">
                        Paid: ${f.paidAmount}
                      </span>
                      {f.totalAmount - f.paidAmount > 0 && (
                        <span className="bg-rose-100/50 text-rose-700 px-2.5 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider animate-pulse">
                          Due: ${f.totalAmount - f.paidAmount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4 shrink-0">
                  <div>
                    <p className={`font-black ${f.category === 'Income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {f.category === 'Income' ? '+' : '-'}${f.paidAmount}
                    </p>
                    <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 ${
                      f.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/60' :
                      f.status === 'Partial' ? 'bg-amber-50 text-amber-600 border border-amber-100/60' :
                      'bg-rose-50 text-rose-600 border border-rose-100/60'
                    }`}>
                      {f.status === 'Paid' ? 'Paid' : f.status === 'Partial' ? 'Partial' : 'Unpaid'}
                    </span>
                  </div>
                  {(role === UserRole.ADMIN || role === UserRole.USER) && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(f)}
                        className="p-1 px-2 text-indigo-500 hover:bg-indigo-100 rounded-lg text-xs"
                        title="Edit"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="p-1 px-2 text-rose-500 hover:bg-rose-100 rounded-lg text-xs"
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {financials.length === 0 && (
              <p className="text-center py-12 text-slate-400 font-bold italic">No recent financial transactions found.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-black text-slate-900 mb-6 text-lg tracking-tight">Financial Breakdown</h3>
            <div className="h-64 w-full relative min-h-[256px]">
              {isMounted && (
                <ResponsiveContainer width="100%" height={256}>
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="p-5 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-600/10">
              <p className="text-xs font-semibold opacity-75">Dakhliga guud ee soo xarooday</p>
              <h4 className="text-3xl font-black mt-2 tracking-tight">${totalIncome}</h4>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {editingFinancial ? 'Edit Financial Record' : 'Add Cash / Bill'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-slate-400 transition-colors shadow-sm">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Client / Contractor Name</label>
                <input
                  type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Abdi Rahman, Company, or Client Name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Transaction Description</label>
                <input
                  type="text" required value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="May Rent, water and utilities bill"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Transaction Type</label>
                  <select
                    value={category} onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Payment Status</label>
                  <select
                    value={status} onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Debt">Unpaid / Debt</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Total Amount ($)</label>
                  <input
                    type="number" required value={totalAmount} onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Paid Amount ($)</label>
                  <input
                    type="number" required value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-[0.98] mt-4"
              >
                {editingFinancial ? 'Update Record' : 'Add Record'}
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
              <p className="text-xs text-slate-500 mt-2 font-medium">This action cannot be undone. Are you sure you want to delete this record?</p>
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

export default Financials;
