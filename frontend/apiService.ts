
import { Property, Tenant, MaintenanceRequest, Sale, RentRecord, FinancialRecord, AppUser, TrashRecord, ActivityLog } from './types';
import * as mock from './mockData';

const BASE_URL = '/api';

class ApiService {
  private getLocal<T>(key: string, fallback: T[]): T[] {
    try {
      const data = localStorage.getItem(`eliteestate_${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch (e) { return fallback; }
  }

  private setLocal<T>(key: string, data: T[]): void {
    try { localStorage.setItem(`eliteestate_${key}`, JSON.stringify(data)); } catch (e) {}
  }

  private async safeRequest<T>(endpoint: string, method: string, localKey: string, fallback: any, body?: any): Promise<T> {
    try {
      const userEmail = localStorage.getItem('eliteestate_currentUserEmail') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userEmail) {
        headers['X-User-Email'] = userEmail;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(3000) 
      });

      if (response.ok) {
        const data = await response.json();
        if (method === 'GET') this.setLocal(localKey, data);
        return data;
      }
      throw new Error('Connection error');
    } catch (e) {
      console.warn(`Backend unreachable for ${endpoint}, using fallback.`);
      const current = this.getLocal(localKey, fallback);
      
      if (method === 'POST' && body) {
        const updated = [body, ...current];
        this.setLocal(localKey, updated);
        return body;
      }

      if (method === 'PUT' && body) {
        const updated = current.map((item: any) => (item as any).id === body.id ? body : item);
        this.setLocal(localKey, updated);
        return body;
      }

      if (method === 'DELETE') {
        const id = endpoint.split('/').pop();
        const updated = current.filter((item: any) => (item as any).id !== id);
        this.setLocal(localKey, updated);
        return {} as T;
      }

      return current as unknown as T;
    }
  }

  // Properties
  async getProperties() { return this.safeRequest<Property[]>('/properties', 'GET', 'properties', mock.properties); }
  async createProperty(p: Property) { return this.safeRequest<Property>('/properties', 'POST', 'properties', mock.properties, p); }
  async updateProperty(id: string, p: Property) { return this.safeRequest<Property>(`/properties/${id}`, 'PUT', 'properties', mock.properties, p); }
  async deleteProperty(id: string) { return this.safeRequest<void>(`/properties/${id}`, 'DELETE', 'properties', []); }

  // Tenants
  async getTenants() { return this.safeRequest<Tenant[]>('/tenants', 'GET', 'tenants', mock.tenants); }
  async createTenant(t: Tenant) { return this.safeRequest<Tenant>('/tenants', 'POST', 'tenants', mock.tenants, t); }
  async updateTenant(id: string, t: Tenant) { return this.safeRequest<Tenant>(`/tenants/${id}`, 'PUT', 'tenants', mock.tenants, t); }
  async deleteTenant(id: string) { return this.safeRequest<void>(`/tenants/${id}`, 'DELETE', 'tenants', mock.tenants); }

  // Sales
  async getSales() { return this.safeRequest<Sale[]>('/sales', 'GET', 'sales', mock.sales); }
  async createSale(s: Sale) { return this.safeRequest<Sale>('/sales', 'POST', 'sales', mock.sales, s); }
  async updateSale(id: string, s: Sale) { return this.safeRequest<Sale>('/sales', 'POST', 'sales', mock.sales, s); }
  async deleteSale(id: string) { return this.safeRequest<void>(`/sales/${id}`, 'DELETE', 'sales', mock.sales); }

  // Financials
  async getFinancials() { return this.safeRequest<FinancialRecord[]>('/financials', 'GET', 'financials', []); }
  async createFinancial(f: FinancialRecord) { return this.safeRequest<FinancialRecord>('/financials', 'POST', 'financials', [], f); }
  async updateFinancial(id: string, f: FinancialRecord) { return this.safeRequest<FinancialRecord>('/financials', 'POST', 'financials', [], f); }
  async deleteFinancial(id: string) { return this.safeRequest<void>(`/financials/${id}`, 'DELETE', 'financials', []); }

  // Maintenance
  async getMaintenance() { return this.safeRequest<MaintenanceRequest[]>('/maintenance', 'GET', 'maintenance', mock.maintenanceRequests); }
  async createMaintenance(m: MaintenanceRequest) { return this.safeRequest<MaintenanceRequest>('/maintenance', 'POST', 'maintenance', [], m); }
  async updateMaintenance(id: string, m: MaintenanceRequest) { return this.safeRequest<MaintenanceRequest>('/maintenance', 'POST', 'maintenance', [], m); }
  async deleteMaintenance(id: string) { return this.safeRequest<void>(`/maintenance/${id}`, 'DELETE', 'maintenance', []); }

  // Rents
  async getRents() { return this.safeRequest<RentRecord[]>('/rents', 'GET', 'rents', []); }
  async createRent(r: RentRecord) { return this.safeRequest<RentRecord>('/rents', 'POST', 'rents', [], r); }
  async updateRent(id: string, r: RentRecord) { return this.safeRequest<RentRecord>(`/rents/${id}`, 'PUT', 'rents', [], r); }
  async deleteRent(id: string) { return this.safeRequest<void>(`/rents/${id}`, 'DELETE', 'rents', []); }

  // Send real email via backend SMTP
  async sendEmail(to: string, subject: string, body: string) {
    const response = await fetch(`${BASE_URL}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body })
    });
    if (!response.ok) {
      const errorData = await response.json();
      const errMsg = errorData.error || errorData.details || 'Email sending failed.';
      const errTip = errorData.tip ? `\n\nTip: ${errorData.tip}` : '';
      throw new Error(`${errMsg}${errTip}`);
    }
    return await response.json();
  }

  // Database Connection Status Checker
  async getDbStatus() {
    try {
      const response = await fetch(`${BASE_URL}/db-status`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('Backend db-status endpoint unreachable. Local fallback in use.');
    }
    return { useSupabase: false, useFirebase: false, hasSupabaseEnv: false, hasFirebaseEnv: false };
  }

  // Get SMTP Config
  async getSmtpConfig() {
    const response = await fetch(`${BASE_URL}/smtp-config`);
    if (!response.ok) {
      throw new Error('Could not fetch SMTP configuration.');
    }
    return await response.json();
  }

  // Save SMTP Config
  async saveSmtpConfig(config: { smtpHost: string; smtpPort: string; smtpUser: string; smtpPass: string; smtpFrom: string }) {
    const response = await fetch(`${BASE_URL}/smtp-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Could not save SMTP configuration.');
    }
    return await response.json();
  }

  // Test SMTP connection configuration
  async testSmtpConnection(config: { smtpHost: string; smtpPort: string; smtpUser: string; smtpPass: string }) {
    const response = await fetch(`${BASE_URL}/test-smtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.details || 'SMTP validation check failed.');
    }
    return data;
  }

  // Fetch users
  async getUsers() {
    return this.safeRequest<AppUser[]>('/users', 'GET', 'users', [
      { id: 'u_admin', name: 'Admin', email: 'admin@eliteestate.com', phone: '+25261000000', role: 'admin', approved: true, createdAt: '2026-06-23T11:00:00Z' },
      { id: 'u_user', name: 'User Agent', email: 'user@eliteestate.com', phone: '+25261111111', role: 'user', approved: true, createdAt: '2026-06-23T11:00:00Z' },
      { id: 'u_pending', name: 'Jaamac Cali', email: 'jaamac@eliteestate.com', phone: '+252615123456', role: 'user', approved: false, createdAt: '2026-06-24T12:00:00Z' }
    ]);
  }

  // Register user
  async registerUser(userData: any) {
    try {
      const response = await fetch(`${BASE_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }
      return data;
    } catch (e: any) {
      if (e.message && e.message.includes('already registered')) {
        throw e;
      }
      // Local fallback
      console.warn('Backend offline for registration, utilizing local storage simulation...');
      const localUsers = this.getLocal<AppUser>('users', [
        { id: 'u_admin', name: 'Admin', email: 'admin@eliteestate.com', phone: '+25261000000', role: 'admin', approved: true, createdAt: '2026-06-23T11:00:00Z' },
        { id: 'u_user', name: 'User Agent', email: 'user@eliteestate.com', phone: '+25261111111', role: 'user', approved: true, createdAt: '2026-06-23T11:00:00Z' },
        { id: 'u_pending', name: 'Jaamac Cali', email: 'jaamac@eliteestate.com', phone: '+252615123456', role: 'user', approved: false, createdAt: '2026-06-24T12:00:00Z' }
      ]);
      const exists = localUsers.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
      if (exists) {
        throw new Error('This email has already been registered!');
      }
      const newUser: AppUser = {
        id: 'u_' + Date.now(),
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role || 'user',
        approved: userData.email.toLowerCase() === 'admin@eliteestate.com' || userData.email.toLowerCase() === 'user@eliteestate.com',
        createdAt: new Date().toISOString()
      };
      this.setLocal('users', [newUser, ...localUsers]);
      return {
        success: true,
        message: newUser.approved 
          ? 'Registration successful!' 
          : 'Your request has been saved successfully! Please wait for Admin approval.',
        user: newUser
      };
    }
  }

  // Login user
  async loginUser(credentials: any) {
    try {
      const response = await fetch(`${BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Login failed.');
      }
      return data;
    } catch (e: any) {
      if (e.message && (e.message.includes('approval') || e.message.includes('incorrect') || e.message.includes('registered'))) {
        throw e; // throw known backend/validation errors
      }
      // Local fallback login simulation
      console.warn('Backend offline for login, utilizing local storage simulation...');
      const localUsers = this.getLocal<AppUser>('users', [
        { id: 'u_admin', name: 'Admin', email: 'admin@eliteestate.com', phone: '+25261000000', role: 'admin', approved: true, createdAt: '2026-06-23T11:00:00Z' },
        { id: 'u_user', name: 'User Agent', email: 'user@eliteestate.com', phone: '+25261111111', role: 'user', approved: true, createdAt: '2026-06-23T11:00:00Z' },
        { id: 'u_pending', name: 'Jaamac Cali', email: 'jaamac@eliteestate.com', phone: '+252615123456', role: 'user', approved: false, createdAt: '2026-06-24T12:00:00Z' }
      ]);
      const user = localUsers.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());
      if (!user) {
        throw new Error('This email is not registered in the system!');
      }
      const expectedPass = credentials.email.toLowerCase() === 'admin@eliteestate.com' ? 'admin123' : 'user123';
      if (credentials.password !== expectedPass && credentials.password !== 'user123') {
        throw new Error('Password is incorrect!');
      }
      if (!user.approved) {
        throw new Error('Access pending approval! Your request is currently being reviewed by the Administrator.');
      }
      return {
        success: true,
        user
      };
    }
  }

  // Approve user
  async approveUser(id: string) {
    try {
      const response = await fetch(`${BASE_URL}/users/approve/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    } catch (e: any) {
      console.warn('Backend offline for user approval, using local storage.');
      const localUsers = this.getLocal<AppUser>('users', []);
      const updated = localUsers.map(u => u.id === id ? { ...u, approved: true } : u);
      this.setLocal('users', updated);
      return { success: true, message: 'User approved locally!' };
    }
  }

  // Reject / Delete user
  async deleteUser(id: string) {
    try {
      const response = await fetch(`${BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    } catch (e: any) {
      console.warn('Backend offline for user deletion, using local storage.');
      const localUsers = this.getLocal<AppUser>('users', []);
      const updated = localUsers.filter(u => u.id !== id);
      this.setLocal('users', updated);
      return { success: true, message: 'User deleted locally!' };
    }
  }

  // Trash / Data Restore
  async getTrash() {
    return this.safeRequest<TrashRecord[]>('/trash', 'GET', 'trash', []);
  }

  async restoreTrash(id: string) {
    try {
      const response = await fetch(`${BASE_URL}/trash/restore/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const currentTrash = this.getLocal<TrashRecord>('trash', []);
        const restoredItem = currentTrash.find(t => t.id === id);
        if (restoredItem) {
          const localKey = restoredItem.type;
          const localCollection = this.getLocal<any>(localKey, []);
          this.setLocal(localKey, [restoredItem.originalData, ...localCollection]);
        }
        this.setLocal('trash', currentTrash.filter(t => t.id !== id));
        return await response.json();
      }
      throw new Error('Could not restore');
    } catch (e) {
      console.warn('Backend offline for trash restore, using local fallback.');
      const currentTrash = this.getLocal<TrashRecord>('trash', []);
      const restoredItem = currentTrash.find(t => t.id === id);
      if (restoredItem) {
        const localKey = restoredItem.type;
        const localCollection = this.getLocal<any>(localKey, []);
        this.setLocal(localKey, [restoredItem.originalData, ...localCollection]);
      }
      const updatedTrash = currentTrash.filter(t => t.id !== id);
      this.setLocal('trash', updatedTrash);
      return { success: true, message: 'Restored locally!' };
    }
  }

  async deleteTrash(id: string) {
    try {
      const response = await fetch(`${BASE_URL}/trash/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const currentTrash = this.getLocal<TrashRecord>('trash', []);
        this.setLocal('trash', currentTrash.filter(t => t.id !== id));
        return await response.json();
      }
      throw new Error('Could not delete from trash');
    } catch (e) {
      console.warn('Backend offline for permanent delete, using local fallback.');
      const currentTrash = this.getLocal<TrashRecord>('trash', []);
      this.setLocal('trash', currentTrash.filter(t => t.id !== id));
      return { success: true, message: 'Deleted locally!' };
    }
  }

  async emptyTrash() {
    try {
      const response = await fetch(`${BASE_URL}/trash/empty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        this.setLocal('trash', []);
        return await response.json();
      }
      throw new Error('Could not empty trash');
    } catch (e) {
      console.warn('Backend offline for empty trash, using local fallback.');
      this.setLocal('trash', []);
      return { success: true, message: 'Trash emptied locally!' };
    }
  }

  // Activity Logs
  async getActivityLogs() {
    return this.safeRequest<ActivityLog[]>('/activity', 'GET', 'activityLogs', []);
  }
}

export const api = new ApiService();
