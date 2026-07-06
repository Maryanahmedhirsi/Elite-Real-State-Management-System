import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../apiService';
import { Property, Tenant, MaintenanceRequest, UserRole } from '../types';

interface DashboardProps {
  role: string | null;
}

const data = [
  { name: 'Jan', revenue: 4000, expenses: 2400 },
  { name: 'Feb', revenue: 3000, expenses: 1398 },
  { name: 'Mar', revenue: 6000, expenses: 9800 },
  { name: 'Apr', revenue: 8000, expenses: 3908 },
  { name: 'May', revenue: 10890, expenses: 4800 },
  { name: 'Jun', revenue: 12390, expenses: 3800 },
  { name: 'Jul', revenue: 15490, expenses: 4300 },
];

const StatCard: React.FC<{ title: string; value: string; icon: string; color: string; desc: string }> = ({ title, value, icon, color, desc }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 hover:border-teal-500/30 transition-all flex items-center justify-between">
    <div>
      <h3 className="text-slate-500 text-xs font-black uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
      <p className="text-[10px] text-slate-400 mt-2 font-semibold uppercase">{desc}</p>
    </div>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} text-white shadow-lg`}>
      <i className={`fa-solid ${icon} text-xl`}></i>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ role }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    useSupabase: boolean;
    useFirebase: boolean;
    hasSupabaseEnv: boolean;
    hasFirebaseEnv: boolean;
  } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const fetchData = async () => {
      try {
        const [props, tnts, maint, statusRes] = await Promise.all([
          api.getProperties(),
          api.getTenants(),
          api.getMaintenance(),
          api.getDbStatus()
        ]);
        setProperties(props);
        setTenants(tnts);
        setMaintenance(maint);
        setDbStatus(statusRes);
      } catch (err) {
        console.error('Errors fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Loading dashboard data...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 font-medium">Monitor company management status and properties here.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Properties" value={properties.length.toString()} icon="fa-building" color="bg-indigo-600 shadow-indigo-500/10" desc="Properties registered in the system" />
        <StatCard title="Active Tenants" value={tenants.length.toString()} icon="fa-users" color="bg-teal-500 shadow-teal-500/10" desc="Tenants currently active" />
        <StatCard title="Maintenance Requests" value={maintenance.length.toString()} icon="fa-wrench" color="bg-amber-500 shadow-amber-500/10" desc="Open maintenance requests" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200/80 hover:border-teal-500/10 transition-all">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-900 tracking-tight text-lg">Revenue & Expenses (This Year)</h3>
          </div>
          <div className="h-80 w-full relative min-h-[320px]">
            {isMounted && (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(13, 148, 136, 0.2)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200/80 hover:border-teal-500/10 transition-all">
          <h3 className="font-black text-slate-900 mb-6 text-lg tracking-tight">Recent Activities</h3>
          <div className="space-y-6">
            <div className="flex space-x-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-check text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 leading-tight">New Property Leased</p>
                <p className="text-xs text-slate-400 mt-1">Hilaac Apartment, Mogadishu</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-wrench text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 leading-tight">Water Pipe Maintenance Request</p>
                <p className="text-xs text-slate-400 mt-1">In progress status</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-file-invoice text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 leading-tight">This Month's Rental Invoices</p>
                <p className="text-xs text-slate-400 mt-1">Automatically generated</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supabase PostgreSQL Database Integration Board */}
      {role === UserRole.ADMIN && dbStatus && (
        <div id="supabase-status-board" className="bg-slate-50 border border-slate-250 p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden mt-8">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${dbStatus.useSupabase ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-700'} shadow-md`}>
                <i className="fa-solid fa-database text-xl text-indigo-650"></i>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-slate-900 tracking-tight text-lg">Real Supabase Database Connection</h3>
                  {dbStatus.useSupabase ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1.5 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      🟢 Connected & Active
                    </span>
                  ) : dbStatus.hasSupabaseEnv ? (
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      ⚠️ Configured (Tables Missing)
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      🔴 Not Connected (Fallback Local JSON)
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {dbStatus.useSupabase
                    ? "Congratulations! Your Elite Real Estate Management System is directly connected to Supabase PostgreSQL. Any data you add or delete is securely saved in the cloud."
                    : "Elite Real Estate Management System supports cloud storage using Supabase PostgreSQL. Currently, the system is in Local Cache/Fallback mode."
                  }
                </p>
              </div>
            </div>

            <div>
              {!dbStatus.useSupabase && (
                <button
                  onClick={() => setShowSqlGuide(!showSqlGuide)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-indigo-600/15 flex items-center gap-2"
                >
                  <i className="fa-solid fa-code"></i>
                  <span>{showSqlGuide ? "Hide Guide" : "How to Configure Tables"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick instructions when not fully active */}
          {!dbStatus.useSupabase && (
            <div className="mt-5 space-y-4">
              {!dbStatus.hasSupabaseEnv ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 font-medium leading-relaxed">
                  <h4 className="font-extrabold text-amber-900 text-sm mb-1">
                    <i className="fa-solid fa-circle-exclamation mr-1.5 text-amber-600 animate-bounce"></i>
                    Step 1: Enter Supabase Secrets
                  </h4>
                  <p className="mb-2">
                    To connect this system to a real Supabase database, please click the <strong>Settings</strong> button at the top or the Secrets API section and add these variables:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-amber-900">
                    <li><strong className="text-teal-900">SUPABASE_URL</strong> = <span>(Example: https://yourproject.supabase.co)</span></li>
                    <li><strong className="text-teal-900">SUPABASE_ANON_KEY</strong> = <span>(Enter your public anonymous key)</span></li>
                  </ul>
                </div>
              ) : (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-950 font-medium leading-relaxed">
                  <h4 className="font-extrabold text-indigo-900 text-sm mb-1">
                    <i className="fa-solid fa-circle-check mr-1.5 text-indigo-600"></i>
                    Configuration is ready!
                  </h4>
                  <p>
                    Your connection URL and API Key are valid and have been read successfully! <br/>
                    The next step is to create the database tables inside your Supabase SQL Editor to store real data. Click the <strong>"How to Configure Tables"</strong> button above to copy the SQL schema.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Advanced SQL creation guide accordion */}
          {showSqlGuide && (
            <div className="mt-6 p-5 bg-white border border-slate-200 rounded-3xl space-y-5 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Step 2: Create Tables (Supabase SQL Schema)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Copy the SQL schema below and paste it into your Supabase SQL Editor to make the system fully functional.</p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const sqlText = `
-- Properties Table
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  type TEXT,
  status TEXT,
  price NUMERIC,
  rooms INTEGER,
  kitchens INTEGER,
  bathrooms INTEGER,
  image TEXT
);

-- Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "propertyId" TEXT,
  unit TEXT,
  email TEXT,
  phone TEXT,
  "leaseStart" TEXT,
  "leaseEnd" TEXT,
  status TEXT
);

-- Rents Table
CREATE TABLE IF NOT EXISTS rents (
  id TEXT PRIMARY KEY,
  "propertyId" TEXT,
  amount NUMERIC,
  "dueDate" TEXT,
  status TEXT,
  "tenantName" TEXT
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  "propertyId" TEXT,
  "clientName" TEXT,
  amount NUMERIC,
  date TEXT,
  "transactionType" TEXT,
  status TEXT
);

-- Financials Table
CREATE TABLE IF NOT EXISTS financials (
  id TEXT PRIMARY KEY,
  date TEXT,
  "clientName" TEXT,
  description TEXT,
  "totalAmount" NUMERIC,
  "paidAmount" NUMERIC,
  category TEXT,
  status TEXT
);

-- Maintenance Table
CREATE TABLE IF NOT EXISTS maintenance (
  id TEXT PRIMARY KEY,
  "propertyName" TEXT,
  "tenantName" TEXT,
  issue TEXT,
  priority TEXT,
  status TEXT,
  date TEXT
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  password TEXT,
  role TEXT,
  approved BOOLEAN DEFAULT FALSE,
  "createdAt" TEXT
);

-- Trash Table
CREATE TABLE IF NOT EXISTS trash (
  id TEXT PRIMARY KEY,
  type TEXT,
  "deletedAt" TEXT,
  "displayName" TEXT,
  "originalData" JSONB
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  action TEXT,
  module TEXT,
  description TEXT,
  timestamp TEXT,
  "userEmail" TEXT
);

-- Row Level Security (RLS) configuration
-- Disable RLS on all tables so you can read and write data immediately with your anon key.
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE rents DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE financials DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE trash DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
`;
                      navigator.clipboard.writeText(sqlText.trim());
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 3000);
                    }}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${copiedSql ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
                  >
                    <i className={`fa-solid ${copiedSql ? 'fa-check' : 'fa-copy'}`}></i>
                    <span>{copiedSql ? "Copied! ✅" : "Copy SQL Schema"}</span>
                  </button>

                  <a
                    href="/api/download-db"
                    download="db.json"
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <i className="fa-solid fa-cloud-arrow-down"></i>
                    <span>Soo Degso db.json Backup</span>
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-705">
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black flex-shrink-0">1</span>
                    <p>Log in to your Supabase Dashboard and open your project.</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black flex-shrink-0">2</span>
                    <p>Click on <strong>SQL Editor</strong> on the left side, then click <strong>New Query</strong>.</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black flex-shrink-0">3</span>
                    <p>Paste the copied SQL code and click the <strong>Run</strong> button at the bottom.</p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute top-2 right-2 bg-slate-900 text-[10px] text-slate-300 px-2 py-1 rounded font-mono select-none">postgres/schema</div>
                  <pre className="max-h-60 overflow-y-auto bg-slate-950 text-slate-200 text-[10.5px] p-5 rounded-2xl font-mono leading-relaxed shadow-inner">
{`-- Properties Table
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL, address TEXT, type TEXT, status TEXT, price NUMERIC, rooms INTEGER, kitchens INTEGER, bathrooms INTEGER, image TEXT
);

-- Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL, "propertyId" TEXT, unit TEXT, email TEXT, phone TEXT, "leaseStart" TEXT, "leaseEnd" TEXT, status TEXT
);

-- Rents Table
CREATE TABLE IF NOT EXISTS rents (
  id TEXT PRIMARY KEY, "propertyId" TEXT, amount NUMERIC, "dueDate" TEXT, status TEXT, "tenantName" TEXT
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY, "propertyId" TEXT, "clientName" TEXT, amount NUMERIC, date TEXT, "transactionType" TEXT, status TEXT
);

-- Financials Table
CREATE TABLE IF NOT EXISTS financials (
  id TEXT PRIMARY KEY, date TEXT, "clientName" TEXT, description TEXT, "totalAmount" NUMERIC, "paidAmount" NUMERIC, category TEXT, status TEXT
);

-- Maintenance Table
CREATE TABLE IF NOT EXISTS maintenance (
  id TEXT PRIMARY KEY, "propertyName" TEXT, "tenantName" TEXT, issue TEXT, priority TEXT, status TEXT, date TEXT
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, password TEXT, role TEXT, approved BOOLEAN DEFAULT FALSE, "createdAt" TEXT
);

-- Trash Table
CREATE TABLE IF NOT EXISTS trash (
  id TEXT PRIMARY KEY, type TEXT, "deletedAt" TEXT, "displayName" TEXT, "originalData" JSONB
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY, action TEXT, module TEXT, description TEXT, timestamp TEXT, "userEmail" TEXT
);

-- Row Level Security (RLS) configuration
-- Disable RLS on all tables to allow immediate read/write access:
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE rents DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE financials DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE trash DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
