
import { Property, Tenant, MaintenanceRequest, Transaction, Sale } from './types';

export const properties: Property[] = [
  { 
    id: '1', 
    name: 'Hilaac Apartment', 
    address: 'Waberi, Mogadishu', 
    type: 'Apartment', 
    status: 'Occupied', 
    price: 450, 
    rooms: 3, 
    kitchens: 1, 
    bathrooms: 2, 
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: '2', 
    name: 'Somali Golden House', 
    address: 'Hodan, Mogadishu', 
    type: 'House', 
    status: 'Vacant', 
    price: 1200, 
    rooms: 5, 
    kitchens: 2, 
    bathrooms: 4, 
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: '3', 
    name: 'City Center Plaza', 
    address: 'Boondheere, Mogadishu', 
    type: 'Commercial', 
    status: 'Occupied', 
    price: 3500, 
    rooms: 12, 
    kitchens: 1, 
    bathrooms: 6, 
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: '4', 
    name: 'Peace Hotel & Suites', 
    address: 'Abdiaziz, Mogadishu', 
    type: 'Hotel', 
    status: 'Vacant', 
    price: 80, 
    rooms: 45, 
    kitchens: 2, 
    bathrooms: 45, 
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: '5', 
    name: 'Balanbaalis Villa', 
    address: 'Deynile, Mogadishu', 
    type: 'House', 
    status: 'Occupied', 
    price: 900, 
    rooms: 4, 
    kitchens: 1, 
    bathrooms: 3, 
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: '6', 
    name: 'Modern Skyline', 
    address: 'Warta Nabada, Mogadishu', 
    type: 'Apartment', 
    status: 'Vacant', 
    price: 600, 
    rooms: 2, 
    kitchens: 1, 
    bathrooms: 1, 
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80' 
  },
];

export const tenants: Tenant[] = [
  { id: 't1', name: 'Abdi Rahman', propertyId: '1', unit: '4B', email: 'abdi@email.com', phone: '25261-555-0101', leaseStart: '2023-01-01', leaseEnd: '2024-01-01', status: 'Ending Soon' },
  { id: 't2', name: 'Maryan Ali', propertyId: '1', unit: '2A', email: 'maryan@email.com', phone: '25261-555-0102', leaseStart: '2023-06-15', leaseEnd: '2024-06-15', status: 'Active' },
  { id: 't3', name: 'Global Tech', propertyId: '3', unit: 'Level 2', email: 'info@globaltech.so', phone: '25261-555-9000', leaseStart: '2022-01-01', leaseEnd: '2027-01-01', status: 'Active' },
];

export const sales: Sale[] = [
  { id: 's1', propertyId: '2', clientName: 'Ahmed Omar', amount: 155000, date: '2024-04-12', transactionType: 'Sale', status: 'Completed' },
  { id: 's2', propertyId: '5', clientName: 'Faisa Jama', amount: 950, date: '2024-05-01', transactionType: 'Rent', status: 'Pending' },
];

export const maintenanceRequests: MaintenanceRequest[] = [
  { id: 'm1', propertyName: 'Hilaac Apartment', tenantName: 'Abdi Rahman', issue: 'Water tap is leaking', priority: 'High', status: 'In Progress', date: '2024-05-10' },
  { id: 'm2', propertyName: 'City Center Plaza', tenantName: 'Global Tech', issue: 'AC is not working', priority: 'Medium', status: 'New', date: '2024-05-12' },
];

export const transactions: Transaction[] = [
  { id: 'tr1', date: '2024-05-01', type: 'Income', category: 'Rent', amount: 450, status: 'Cleared', description: 'April Rent Hilaac Apartment' },
  { id: 'tr2', date: '2024-05-02', type: 'Expense', category: 'Maintenance', amount: 50, status: 'Cleared', description: 'Hilaac Pipe Repair' },
];
