
export enum View {
  LOGIN = 'login',
  DASHBOARD = 'dashboard',
  PROPERTIES = 'properties',
  LOCATIONS = 'locations',
  RENTS = 'rents',
  TENANTS = 'tenants',
  SALES = 'sales',
  FINANCIALS = 'financials',
  MAINTENANCE = 'maintenance',
  COMMUNICATIONS = 'communications',
  TRASH = 'trash',
  ACTIVITY = 'activity'
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

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

export interface Transaction {
  id: string;
  date: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  status: 'Cleared' | 'Pending';
  description: string;
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

