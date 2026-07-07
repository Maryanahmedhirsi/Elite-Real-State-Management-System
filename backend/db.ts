import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const DB_FILE = path.join(process.cwd(), 'backend', 'db.json');

// --- Types conforming to frontend/types.ts ---
export interface Property {
  id: string;
  name: string;
  address: string;
  type: 'Apartment' | 'House' | 'Hotel' | 'Commercial';
  status: 'Occupied' | 'Vacant' | 'Under Maintenance';
  price: number;
  rooms: number;
  kitchens: number;
  bathrooms: number;
  image: string;
}

export interface Tenant {
  id: string;
  name: string;
  propertyId: string;
  unit: string;
  email: string;
  phone: string;
  leaseStart: string;
  leaseEnd: string;
  status: 'Active' | 'Ending Soon' | 'Past Due';
}

export interface Sale {
  id: string;
  propertyId: string;
  clientName: string;
  amount: number;
  date: string;
  transactionType: 'Sale' | 'Rent';
  status: 'Completed' | 'Pending' | 'Cancelled';
}

export interface RentRecord {
  id: string;
  propertyId: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  tenantName: string;
}

export interface MaintenanceRequest {
  id: string;
  propertyName: string;
  tenantName: string;
  issue: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'New' | 'In Progress' | 'Completed';
  date: string;
}

export interface FinancialRecord {
  id: string;
  date: string;
  clientName: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  category: 'Income' | 'Expense';
  status: 'Paid' | 'Debt' | 'Partial';
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: 'admin' | 'user';
  approved: boolean;
  createdAt: string;
}

export interface TrashRecord {
  id: string;
  type: 'properties' | 'tenants' | 'rents' | 'sales' | 'financials' | 'maintenance' | 'users';
  deletedAt: string;
  displayName: string;
  originalData: any;
}

export interface ActivityLog {
  id: string;
  action: string;
  module: string;
  description: string;
  timestamp: string;
  userEmail?: string;
}

export interface DBStructure {
  properties: Property[];
  tenants: Tenant[];
  rents: RentRecord[];
  sales: Sale[];
  financials: FinancialRecord[];
  maintenance: MaintenanceRequest[];
  users: AppUser[];
  trash?: TrashRecord[];
  activityLogs?: ActivityLog[];
}

const defaultData: DBStructure = {
  properties: [
    { id: '1', name: 'Hilaac Apartment', address: 'Waberi, Mogadishu', type: 'Apartment', status: 'Occupied', price: 450, rooms: 3, kitchens: 1, bathrooms: 2, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80' },
    { id: '2', name: 'Somali Golden House', address: 'Hodan, Mogadishu', type: 'House', status: 'Vacant', price: 1200, rooms: 5, kitchens: 2, bathrooms: 4, image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80' },
    { id: '3', name: 'City Center Plaza', address: 'Boondheere, Mogadishu', type: 'Commercial', status: 'Occupied', price: 3500, rooms: 12, kitchens: 1, bathrooms: 6, image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80' }
  ],
  tenants: [
    { id: 't1', name: 'Abdi Rahman', propertyId: '1', unit: '4B', email: 'abdi@email.com', phone: '25261-555-0101', leaseStart: '2023-01-01', leaseEnd: '2024-01-01', status: 'Ending Soon' },
    { id: 't2', name: 'Maryan Ali', propertyId: '1', unit: '2A', email: 'maryan@email.com', phone: '25261-555-0102', leaseStart: '2023-06-15', leaseEnd: '2024-06-15', status: 'Active' }
  ],
  rents: [],
  sales: [],
  financials: [],
  maintenance: [
    { id: 'm1', propertyName: 'Hilaac Apartment', tenantName: 'Abdi Rahman', issue: 'Tubada biyo ayaa ka deynaya', priority: 'High', status: 'In Progress', date: '2024-05-10' }
  ],
  users: [
    { id: 'u_admin', name: 'Admin', email: 'admin@eliteestate.com', phone: '+25261000000', password: 'admin123', role: 'admin', approved: true, createdAt: '2026-06-23T11:00:00Z' },
    { id: 'u_user', name: 'User Agent', email: 'user@eliteestate.com', phone: '+25261111111', password: 'user123', role: 'user', approved: true, createdAt: '2026-06-23T11:00:00Z' },
    { id: 'u_pending', name: 'Jaamac Cali', email: 'jaamac@eliteestate.com', phone: '+252615123456', password: 'user123', role: 'user', approved: false, createdAt: '2026-06-24T12:00:00Z' }
  ],
  trash: [],
  activityLogs: [
    { id: 'act_1', action: 'Kudaray', module: 'Nidaamka', description: 'Nidaamka Elite Estate si guul leh ayaa loo kiciyay.', timestamp: '2026-06-23T11:00:00Z', userEmail: 'admin@eliteestate.com' }
  ]
};

// --- FILE-BACKED DB FUNCTIONS ---
export function readDBSync(): DBStructure {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const dbDir = path.dirname(DB_FILE);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    let updated = false;
    if (!parsed.users) {
      parsed.users = defaultData.users;
      updated = true;
    }
    if (!parsed.trash) {
      parsed.trash = [];
      updated = true;
    }
    if (!parsed.activityLogs) {
      parsed.activityLogs = defaultData.activityLogs;
      updated = true;
    }
    if (updated) {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      } catch (err) {
        console.error('Failed to backfill database structures:', err);
      }
    }
    return parsed;
  } catch (error) {
    console.error('Error reading JSON DB, returning defaults:', error);
    return defaultData;
  }
}

export function writeDBSync(data: DBStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing JSON DB:', error);
  }
}

// Global active database settings
export const useFirebase = false; // Firestore disabled by user request
export let useSupabase = false;
export let supabase: any = null;

// Initialize Supabase Configuration
export async function connectSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      });
      
      // Connection verification with error handling
      const { error } = await supabase.from('properties').select('id').limit(1);
      
      if (error) {
        if (error.code === '42P01') {
          console.log('⚡ Supabase is connected! However, tables are missing/not yet created in your PostgreSQL schema.');
          console.log('💡 Please run the Supabase SQL seeding queries in your Supabase SQL Editor. Fallback to local storage.');
          useSupabase = true;
        } else {
          console.error('Supabase connection verification failed:', error.message);
          useSupabase = false;
        }
      } else {
        console.log('💚 Supabase initialized and connected successfully! Active database persistence: SUPABASE.');
        useSupabase = true;
      }

      // Automatically seed if Supabase is connected and tables exist but are empty
      if (useSupabase) {
        try {
          const { data: props, error: propsErr } = await supabase.from('properties').select('id').limit(1);
          if (!propsErr && (!props || props.length === 0)) {
            console.log('🌱 Performing initial seeding into empty Supabase tables...');
            const currentData = readDBSync();
            
            if (currentData.properties?.length > 0) await supabase.from('properties').upsert(currentData.properties);
            if (currentData.tenants?.length > 0) await supabase.from('tenants').upsert(currentData.tenants);
            if (currentData.rents?.length > 0) await supabase.from('rents').upsert(currentData.rents);
            if (currentData.sales?.length > 0) await supabase.from('sales').upsert(currentData.sales);
            if (currentData.financials?.length > 0) await supabase.from('financials').upsert(currentData.financials);
            if (currentData.maintenance?.length > 0) await supabase.from('maintenance').upsert(currentData.maintenance);
            
            console.log('✅ Supabase database populated successfully!');
          }
        } catch (err: any) {
          console.error('Could not complete Supabase auto-seeding:', err.message);
        }
      }
    } catch (err: any) {
      console.error('Failed to initialize Supabase connection:', err);
      useSupabase = false;
    }
  } else {
    console.log('Supabase environment variables (SUPABASE_URL & SUPABASE_ANON_KEY) are not set. Supabase is disabled.');
    useSupabase = false;
  }
}

// Initialize main db orchestrator
export async function connectMongoDB() {
  // First, initialize Supabase if there are credentials
  await connectSupabase();
  console.log('ℹ️ Database initialization complete. Active database persistence: ' + (useSupabase ? 'SUPABASE' : 'Local JSON Fallback') + '.');
}

// --- UNIFIED RESILIENT CRUD DATA PROVIDERS FOR SUPABASE ---

// 1. Properties
export async function fetchProperties(): Promise<Property[]> {
  if (useSupabase && supabase) {
    try {
      let allData: Property[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;
      let safetyCounter = 0;

      // support retrieving at least 100,000 items (100 steps of 1000)
      while (hasMore && safetyCounter < 150) {
        safetyCounter++;
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .range(from, from + step - 1);

        if (error) {
          console.error('Supabase chunk properties read error:', error.message);
          break;
        }

        if (data && data.length > 0) {
          allData = allData.concat(data as Property[]);
          if (data.length < step) {
            hasMore = false;
          } else {
            from += step;
          }
        } else {
          hasMore = false;
        }
      }

      if (allData.length > 0) {
        return allData;
      }
    } catch (e: any) {
      console.error('Supabase read properties failed:', e.message);
    }
  }
  return readDBSync().properties;
}

export async function upsertProperty(data: Property): Promise<Property> {
  const dbJson = readDBSync();
  const index = dbJson.properties.findIndex(p => p.id === data.id);
  if (index !== -1) {
    dbJson.properties[index] = { ...dbJson.properties[index], ...data };
  } else {
    dbJson.properties.unshift(data);
  }
  writeDBSync(dbJson);

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('properties').upsert(data);
      if (error) {
        console.error('Supabase write property failed:', error.message);
      }
    } catch (e: any) {
      console.error('Supabase write property failed:', e.message);
    }
  }
  return data;
}

export async function removeProperty(id: string): Promise<boolean> {
  const dbJson = readDBSync();
  dbJson.properties = dbJson.properties.filter(p => p.id !== id);
  writeDBSync(dbJson);

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) console.error('Supabase delete property failed:', error.message);
    } catch (e: any) {
      console.error('Supabase delete property failed:', e.message);
    }
  }
  return true;
}

// 2. Tenants
export async function fetchTenants(): Promise<Tenant[]> {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('tenants').select('*');
      if (!error && data && data.length > 0) {
        return data as Tenant[];
      }
    } catch (e: any) {
      console.error('Supabase read tenants failed:', e.message);
    }
  }
  return readDBSync().tenants;
}

export async function upsertTenant(data: Tenant): Promise<Tenant> {
  const dbJson = readDBSync();
  const index = dbJson.tenants.findIndex(t => t.id === data.id);
  if (index !== -1) {
    dbJson.tenants[index] = { ...dbJson.tenants[index], ...data };
  } else {
    dbJson.tenants.unshift(data);
  }
  writeDBSync(dbJson);

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('tenants').upsert(data);
      if (error) console.error('Supabase write tenant failed:', error.message);
    } catch (e: any) {
      console.error('Supabase write tenant failed:', e.message);
    }
  }
  return data;
}

export async function removeTenant(id: string): Promise<boolean> {
  const dbJson = readDBSync();
  dbJson.tenants = dbJson.tenants.filter(t => t.id !== id);
  writeDBSync(dbJson);

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('tenants').delete().eq('id', id);
      if (error) console.error('Supabase delete tenant failed:', error.message);
    } catch (e: any) {
      console.error('Supabase delete tenant failed:', e.message);
    }
  }
  return true;
}

// 3. Rents
export async function fetchRents(): Promise<RentRecord[]> {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('rents').select('*');
      if (!error && data && data.length > 0) {
        return data as RentRecord[];
      }
    } catch (e: any) {
      console.error('Supabase read rents failed:', e.message);
    }
  }
  return readDBSync().rents;
}

export async function upsertRent(data: RentRecord): Promise<RentRecord> {
  const dbJson = readDBSync();
  const index = dbJson.rents.findIndex(r => r.id === data.id);
  if (index !== -1) {
    dbJson.rents[index] = { ...dbJson.rents[index], ...data };
  } else {
    dbJson.rents.unshift(data);
  }
  writeDBSync(dbJson);

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('rents').upsert(data);
      if (error) console.error('Supabase write rent failed:', error.message);
    } catch (e: any) {
      console.error('Supabase write rent failed:', e.message);
    }
  }
  return data;
}

export async function removeRent(id: string): Promise<boolean> {
  const dbJson = readDBSync();
  dbJson.rents = dbJson.rents.filter(r => r.id !== id);
  writeDBSync(dbJson);

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('rents').delete().eq('id', id);
      if (error) console.error('Supabase delete rent failed:', error.message);
    } catch (e: any) {
      console.error('Supabase delete rent failed:', e.message);
    }
  }
  return true;
}

// 4. Sales
export async function fetchSales(): Promise<Sale[]> {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('sales').select('*');
      if (!error && data && data.length > 0) {
        return data as Sale[];
      }
    } catch (e: any) {
      console.error('Supabase read sales failed:', e.message);
    }
  }
  return readDBSync().sales;
}

export async function upsertSale(data: Sale): Promise<Sale> {
  const dbJson = readDBSync();
  const index = dbJson.sales.findIndex(s => s.id === data.id);
  if (index !== -1) {
    dbJson.sales[index] = { ...dbJson.sales[index], ...data };
  } else {
    dbJson.sales.unshift(data);
  }
  writeDBSync(dbJson);

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('sales').upsert(data);
      if (error) console.error('Supabase write sale failed:', error.message);
    } catch (e: any) {
      console.error('Supabase write sale failed:', e.message);
    }
  }
  return data;
}

export async function removeSale(id: string): Promise<boolean> {
  const dbJson = readDBSync();
  dbJson.sales = dbJson.sales.filter(s => s.id !== id);
  writeDBSync(dbJson);

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) console.error('Supabase delete sale failed:', error.message);
    } catch (e: any) {
      console.error('Supabase delete sale failed:', e.message);
    }
  }
  return true;
}

// 5. Financials
export async function fetchFinancials(): Promise<FinancialRecord[]> {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('financials').select('*');
      if (!error && data && data.length > 0) {
        return data as FinancialRecord[];
      }
    } catch (e: any) {
      console.error('Supabase read financials failed:', e.message);
    }
  }
  return readDBSync().financials;
}

export async function upsertFinancial(data: FinancialRecord): Promise<FinancialRecord> {
  const dbJson = readDBSync();
  const index = dbJson.financials.findIndex(f => f.id === data.id);
  if (index !== -1) {
    dbJson.financials[index] = { ...dbJson.financials[index], ...data };
  } else {
    dbJson.financials.unshift(data);
  }
  writeDBSync(dbJson);

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('financials').upsert(data);
      if (error) console.error('Supabase write financial failed:', error.message);
    } catch (e: any) {
      console.error('Supabase write financial failed:', e.message);
    }
  }
  return data;
}

export async function removeFinancial(id: string): Promise<boolean> {
  const dbJson = readDBSync();
  dbJson.financials = dbJson.financials.filter(f => f.id !== id);
  writeDBSync(dbJson);

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('financials').delete().eq('id', id);
      if (error) console.error('Supabase delete financial failed:', error.message);
    } catch (e: any) {
      console.error('Supabase delete financial failed:', e.message);
    }
  }
  return true;
}

// 6. Maintenance
export async function fetchMaintenance(): Promise<MaintenanceRequest[]> {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('maintenance').select('*');
      if (!error && data && data.length > 0) {
        return data as MaintenanceRequest[];
      }
    } catch (e: any) {
      console.error('Supabase read maintenance failed:', e.message);
    }
  }
  return readDBSync().maintenance;
}

export async function upsertMaintenance(data: MaintenanceRequest): Promise<MaintenanceRequest> {
  const dbJson = readDBSync();
  const index = dbJson.maintenance.findIndex(m => m.id === data.id);
  if (index !== -1) {
    dbJson.maintenance[index] = { ...dbJson.maintenance[index], ...data };
  } else {
    dbJson.maintenance.unshift(data);
  }
  writeDBSync(dbJson);

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('maintenance').upsert(data);
      if (error) console.error('Supabase write maintenance failed:', error.message);
    } catch (e: any) {
      console.error('Supabase write maintenance failed:', e.message);
    }
  }
  return data;
}

export async function removeMaintenance(id: string): Promise<boolean> {
  const dbJson = readDBSync();
  dbJson.maintenance = dbJson.maintenance.filter(m => m.id !== id);
  writeDBSync(dbJson);

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('maintenance').delete().eq('id', id);
      if (error) console.error('Supabase delete maintenance failed:', error.message);
    } catch (e: any) {
      console.error('Supabase delete maintenance failed:', e.message);
    }
  }
  return true;
}

// 7. Users
export async function fetchUsers(): Promise<AppUser[]> {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data && data.length > 0) {
        return data as AppUser[];
      }
    } catch (e: any) {
      console.error('Supabase read users failed:', e.message);
    }
  }
  return readDBSync().users || [];
}

export async function upsertUser(data: AppUser): Promise<AppUser> {
  const dbJson = readDBSync();
  if (!dbJson.users) dbJson.users = [];
  const index = dbJson.users.findIndex(u => u.id === data.id);
  if (index !== -1) {
    dbJson.users[index] = { ...dbJson.users[index], ...data };
  } else {
    dbJson.users.unshift(data);
  }
  writeDBSync(dbJson);

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('users').upsert(data);
      if (error) console.error('Supabase write user failed:', error.message);
    } catch (e: any) {
      console.error('Supabase write user failed:', e.message);
    }
  }
  return data;
}

export async function removeUser(id: string): Promise<boolean> {
  const dbJson = readDBSync();
  if (!dbJson.users) dbJson.users = [];
  dbJson.users = dbJson.users.filter(u => u.id !== id);
  writeDBSync(dbJson);

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) console.error('Supabase delete user failed:', error.message);
    } catch (e: any) {
      console.error('Supabase delete user failed:', e.message);
    }
  }
  return true;
}

// 8. Trash / Data Restore
export async function fetchTrash(): Promise<TrashRecord[]> {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('trash').select('*');
      if (!error && data && data.length > 0) {
        return data as TrashRecord[];
      }
    } catch (e: any) {
      console.error('Supabase read trash failed:', e.message);
    }
  }
  return readDBSync().trash || [];
}

export async function upsertTrash(data: TrashRecord): Promise<TrashRecord> {
  const dbJson = readDBSync();
  if (!dbJson.trash) dbJson.trash = [];
  const index = dbJson.trash.findIndex(t => t.id === data.id);
  if (index !== -1) {
    dbJson.trash[index] = { ...dbJson.trash[index], ...data };
  } else {
    dbJson.trash.unshift(data);
  }
  writeDBSync(dbJson);

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('trash').upsert(data);
      if (error) console.error('Supabase write trash failed:', error.message);
    } catch (e: any) {
      console.error('Supabase write trash failed:', e.message);
    }
  }
  return data;
}

export async function removeTrash(id: string): Promise<boolean> {
  const dbJson = readDBSync();
  if (!dbJson.trash) dbJson.trash = [];
  dbJson.trash = dbJson.trash.filter(t => t.id !== id);
  writeDBSync(dbJson);

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('trash').delete().eq('id', id);
      if (error) console.error('Supabase delete trash failed:', error.message);
    } catch (e: any) {
      console.error('Supabase delete trash failed:', e.message);
    }
  }
  return true;
}

// 9. Activity Logs
export async function fetchActivityLogs(): Promise<ActivityLog[]> {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('activity_logs').select('*');
      if (!error && data && data.length > 0) {
        return data as ActivityLog[];
      }
    } catch (e: any) {
      console.error('Supabase read activity failed:', e.message);
    }
  }
  return readDBSync().activityLogs || [];
}

export async function logActivity(action: string, module: string, description: string, userEmail?: string): Promise<ActivityLog> {
  const logItem: ActivityLog = {
    id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    action,
    module,
    description,
    timestamp: new Date().toISOString(),
    userEmail: userEmail || 'system@eliteestate.com'
  };

  const dbJson = readDBSync();
  if (!dbJson.activityLogs) dbJson.activityLogs = [];
  dbJson.activityLogs.unshift(logItem);
  
  if (dbJson.activityLogs.length > 200) {
    dbJson.activityLogs = dbJson.activityLogs.slice(0, 200);
  }
  writeDBSync(dbJson);

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('activity_logs').upsert(logItem);
      if (error) console.error('Supabase write activity failed:', error.message);
    } catch (e: any) {
      console.error('Supabase write activity failed:', e.message);
    }
  }
  return logItem;
}
