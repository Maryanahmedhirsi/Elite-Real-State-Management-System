import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import fs from 'fs';

// Import our MongoDB interface
import {
  connectMongoDB,
  useSupabase,
  useFirebase,
  fetchProperties, upsertProperty, removeProperty,
  fetchTenants, upsertTenant, removeTenant,
  fetchRents, upsertRent, removeRent,
  fetchSales, upsertSale, removeSale,
  fetchFinancials, upsertFinancial, removeFinancial,
  fetchMaintenance, upsertMaintenance, removeMaintenance,
  fetchUsers, upsertUser, removeUser,
  fetchTrash, upsertTrash, removeTrash,
  fetchActivityLogs, logActivity
} from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000; // Hardcoded to 3000 for strict preview proxy compatibility

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize MongoDB connection on server startup (non-blocking)
connectMongoDB()
  .then(() => console.log('Database initialized successfully.'))
  .catch((err) => console.error('Database initialization failed:', err));

// Helper to get user email from header
const getUserEmail = (req: express.Request): string => {
  return (req.headers['x-user-email'] || req.headers['X-User-Email'] || 'system@eliteestate.com') as string;
};

// --- API ROUTES CONNECTED TO MONGODB ---

// 9. SYSTEM ACTIVITY LOGS API
app.get('/api/activity', async (req, res) => {
  try {
    const list = await fetchActivityLogs();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 1. PROPERTIES
app.get('/api/properties', async (req, res) => {
  try {
    const list = await fetchProperties();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/properties', async (req, res) => {
  try {
    const saved = await upsertProperty(req.body);
    await logActivity('Kudaray', 'Guryaha', `Waxaa lagu daray guri cusub oo magaciisu yahay "${saved.name}" oo ku yaalla "${saved.address}".`, getUserEmail(req));
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/properties/:id', async (req, res) => {
  try {
    const saved = await upsertProperty(req.body);
    await logActivity('Wax ka bedelay', 'Guryaha', `Waxaa isbeddel lagu sameeyay xogta guriga "${saved.name}".`, getUserEmail(req));
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/properties/:id', async (req, res) => {
  try {
    const list = await fetchProperties();
    const item = list.find(p => p.id === req.params.id);
    if (item) {
      await upsertTrash({
        id: 'trash_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        type: 'properties',
        deletedAt: new Date().toISOString(),
        displayName: item.name || item.address || 'Hanti aan la aqoon',
        originalData: item
      });
      await logActivity('Tirtiray', 'Guryaha', `Waxaa la tirtiray guriga "${item.name || item.address}" (loo diray weelka dib-u-soo-celinta).`, getUserEmail(req));
    }
    await removeProperty(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. TENANTS
app.get('/api/tenants', async (req, res) => {
  try {
    const list = await fetchTenants();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tenants', async (req, res) => {
  try {
    const saved = await upsertTenant(req.body);
    await logActivity('Kudaray', 'Kiraystayaasha', `Waxaa la diiwaangeliyay kirayste cusub oo magaciisu yahay "${saved.name}" (Unit: ${saved.unit}).`, getUserEmail(req));
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/tenants/:id', async (req, res) => {
  try {
    const saved = await upsertTenant(req.body);
    await logActivity('Wax ka bedelay', 'Kiraystayaasha', `Waxaa la cusboonaysiiyay xogta kiraystaha "${saved.name}".`, getUserEmail(req));
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/tenants/:id', async (req, res) => {
  try {
    const list = await fetchTenants();
    const item = list.find(t => t.id === req.params.id);
    if (item) {
      await upsertTrash({
        id: 'trash_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        type: 'tenants',
        deletedAt: new Date().toISOString(),
        displayName: item.name || item.email || 'Kirayste aan la aqoon',
        originalData: item
      });
      await logActivity('Tirtiray', 'Kiraystayaasha', `Waxaa la tirtiray xogta kiraystaha "${item.name}" (loo diray weelka dib-u-soo-celinta).`, getUserEmail(req));
    }
    await removeTenant(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. RENTS
app.get('/api/rents', async (req, res) => {
  try {
    const list = await fetchRents();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rents', async (req, res) => {
  try {
    const saved = await upsertRent(req.body);
    await logActivity('Kudaray', 'Kirada', `Waxaa la abuuray diiwaan kiro oo cusub: "${saved.tenantName}" - $${saved.amount} (Due: ${saved.dueDate}).`, getUserEmail(req));
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/rents/:id', async (req, res) => {
  try {
    const saved = await upsertRent(req.body);
    await logActivity('Wax ka bedelay', 'Kirada', `Waxaa isbeddel lagu sameeyay diiwaanka kirada ee "${saved.tenantName}".`, getUserEmail(req));
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/rents/:id', async (req, res) => {
  try {
    const list = await fetchRents();
    const item = list.find(r => r.id === req.params.id);
    if (item) {
      await upsertTrash({
        id: 'trash_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        type: 'rents',
        deletedAt: new Date().toISOString(),
        displayName: `Kiro: ${item.tenantName || 'Macmiil'} - $${item.amount}`,
        originalData: item
      });
      await logActivity('Tirtiray', 'Kirada', `Waxaa la tirtiray diiwaanka kirada ee "${item.tenantName}" - $${item.amount} (loo diray weelka dib-u-soo-celinta).`, getUserEmail(req));
    }
    await removeRent(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. SALES
app.get('/api/sales', async (req, res) => {
  try {
    const list = await fetchSales();
    // Sort contracts by date descending
    const sorted = [...list].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    res.json(sorted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sales', async (req, res) => {
  try {
    const saved = await upsertSale(req.body);
    await logActivity('Kudaray', 'Iibka & Qandaraasyada', `Waxaa la duubay heshiis cusub oo noociisu yahay ${saved.transactionType}: "${saved.clientName}" - $${saved.amount}.`, getUserEmail(req));
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/sales/:id', async (req, res) => {
  try {
    const list = await fetchSales();
    const item = list.find(s => s.id === req.params.id);
    if (item) {
      await upsertTrash({
        id: 'trash_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        type: 'sales',
        deletedAt: new Date().toISOString(),
        displayName: `Iib: ${item.clientName || 'Macmiil'} - $${item.amount}`,
        originalData: item
      });
      await logActivity('Tirtiray', 'Iibka & Qandaraasyada', `Waxaa la tirtiray heshiiska macmiilka "${item.clientName}" - $${item.amount} (loo diray weelka dib-u-soo-celinta).`, getUserEmail(req));
    }
    await removeSale(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. FINANCIALS
app.get('/api/financials', async (req, res) => {
  try {
    const list = await fetchFinancials();
    const sorted = [...list].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    res.json(sorted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/financials', async (req, res) => {
  try {
    const saved = await upsertFinancial(req.body);
    await logActivity('Kudaray', 'Maaliyadda', `Waxaa la duubay xog maaliyadeed: "${saved.description || saved.clientName}" (${saved.category}) - $${saved.totalAmount}.`, getUserEmail(req));
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/financials/:id', async (req, res) => {
  try {
    const list = await fetchFinancials();
    const item = list.find(f => f.id === req.params.id);
    if (item) {
      await upsertTrash({
        id: 'trash_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        type: 'financials',
        deletedAt: new Date().toISOString(),
        displayName: `${item.category}: ${item.description || item.clientName} - $${item.totalAmount}`,
        originalData: item
      });
      await logActivity('Tirtiray', 'Maaliyadda', `Waxaa la tirtiray xogta maaliyadda ee "${item.description || item.clientName}" - $${item.totalAmount} (loo diray weelka dib-u-soo-celinta).`, getUserEmail(req));
    }
    await removeFinancial(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. MAINTENANCE
app.get('/api/maintenance', async (req, res) => {
  try {
    const list = await fetchMaintenance();
    const sorted = [...list].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    res.json(sorted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/maintenance', async (req, res) => {
  try {
    const saved = await upsertMaintenance(req.body);
    await logActivity('Kudaray', 'Dayactirka', `Waxaa la abuuray codsi dayactir: "${saved.issue}" ee dhismaha "${saved.propertyName}" (Priority: ${saved.priority}).`, getUserEmail(req));
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/maintenance/:id', async (req, res) => {
  try {
    const list = await fetchMaintenance();
    const item = list.find(m => m.id === req.params.id);
    if (item) {
      await upsertTrash({
        id: 'trash_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        type: 'maintenance',
        deletedAt: new Date().toISOString(),
        displayName: `Dayactir: ${item.propertyName} - ${item.issue}`,
        originalData: item
      });
      await logActivity('Tirtiray', 'Dayactirka', `Waxaa la tirtiray codsigii dayactirka ee dhismaha "${item.propertyName}" - "${item.issue}" (loo diray weelka dib-u-soo-celinta).`, getUserEmail(req));
    }
    await removeMaintenance(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6d. USER MANAGEMENT, REGISTRATION, LOGIN AND APPROVALS
app.get('/api/users', async (req, res) => {
  try {
    const list = await fetchUsers();
    // Strip passwords before returning
    const stripped = list.map(({ password, ...u }) => u);
    res.json(stripped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Please enter all required information (Name, Email, Phone, Password).' });
    }

    const list = await fetchUsers();
    const exists = list.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'This email has already been registered!' });
    }

    // Auto-approve certain standard accounts, otherwise false
    const isStandard = email.toLowerCase() === 'admin@eliteestate.com' || email.toLowerCase() === 'user@eliteestate.com';
    const newUser = {
      id: 'u_' + Date.now(),
      name,
      email,
      phone,
      password,
      role: role || 'user',
      approved: isStandard,
      createdAt: new Date().toISOString()
    };

    await upsertUser(newUser);
    res.status(201).json({
      success: true,
      message: isStandard 
        ? 'Registration successful! You can log in directly.' 
        : 'Your request has been saved successfully! Please wait for Admin approval to access the system.',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, approved: newUser.approved }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter Email and Password.' });
    }

    const list = await fetchUsers();
    const user = list.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'This email is not registered in the system!' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Password is incorrect!' });
    }

    if (!user.approved) {
      return res.status(403).json({ 
        error: 'Access pending approval!',
        details: 'Your request to access the system is currently being reviewed by the Administrator. Please wait for approval!' 
      });
    }

    res.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        approved: user.approved
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/approve/:id', async (req, res) => {
  try {
    const list = await fetchUsers();
    const user = list.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found!' });
    }

    user.approved = true;
    await upsertUser(user);
    await logActivity('Saxeexay/Ansixiyay', 'Isticmaalayaasha', `Waxaa la ansixiyay isticmaalaha cusub: "${user.name}" (${user.email}).`, getUserEmail(req));
    res.json({ success: true, message: `User ${user.name} approved successfully!` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const list = await fetchUsers();
    const item = list.find(u => u.id === req.params.id);
    if (item) {
      await upsertTrash({
        id: 'trash_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        type: 'users',
        deletedAt: new Date().toISOString(),
        displayName: `Isticmaale: ${item.name} (${item.email})`,
        originalData: item
      });
    }
    await removeUser(req.params.id);
    res.json({ success: true, message: 'User rejected/deleted successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. TRASH & DATA RESTORE
app.get('/api/trash', async (req, res) => {
  try {
    const list = await fetchTrash();
    // Sort by deletedAt descending
    const sorted = [...list].sort((a, b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime());
    res.json(sorted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trash/restore/:id', async (req, res) => {
  try {
    const list = await fetchTrash();
    const item = list.find(t => t.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Xogtaan lagama helin weelka qashinka!' });
    }

    const { type, originalData } = item;
    switch (type) {
      case 'properties':
        await upsertProperty(originalData);
        break;
      case 'tenants':
        await upsertTenant(originalData);
        break;
      case 'rents':
        await upsertRent(originalData);
        break;
      case 'sales':
        await upsertSale(originalData);
        break;
      case 'financials':
        await upsertFinancial(originalData);
        break;
      case 'maintenance':
        await upsertMaintenance(originalData);
        break;
      case 'users':
        await upsertUser(originalData);
        break;
      default:
        return res.status(400).json({ error: 'Nooca xogtaan la aqoonsan waayay!' });
    }

    await removeTrash(req.params.id);
    await logActivity('Soo celiyay', 'Dib-u-soo-celinta', `Waxaa weelka qashinka laga soo celiyay xogtii "${item.displayName}" ee nooceedu ahaa "${item.type}".`, getUserEmail(req));
    res.json({ success: true, message: 'Xogtii si guul leh ayaa loo soo celiyay!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/trash/:id', async (req, res) => {
  try {
    await removeTrash(req.params.id);
    res.json({ success: true, message: 'Xogtaas si rasmi ah ayaa loo tirtiray!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trash/empty', async (req, res) => {
  try {
    const list = await fetchTrash();
    for (const item of list) {
      await removeTrash(item.id);
    }
    res.json({ success: true, message: 'Weelkii qashinka si guul leh ayaa loo faorxiyay!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DB Connection Status Endpoint
app.get('/api/db-status', (req, res) => {
  const hasUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.PROJECT_URL;
  const hasKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.PROJECT_ANON_KEY;
  res.json({
    useSupabase,
    useFirebase: false,
    hasSupabaseEnv: !!(hasUrl && hasKey)
  });
});

// Endpoint to download the db.json backup file directly from the browser
app.get('/api/download-db', (req, res) => {
  const dbJsonPath = path.join(process.cwd(), 'backend', 'db.json');
  if (fs.existsSync(dbJsonPath)) {
    res.download(dbJsonPath, 'db.json', (err) => {
      if (err) {
        console.error('Error downloading db.json:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download backup file db.json.' });
        }
      }
    });
  } else {
    res.status(404).json({ error: 'db.json file not found in backend directory.' });
  }
});

// 6a. GET SMTP CONFIG (Read SMTP settings securely)
app.get('/api/smtp-config', (req, res) => {
  res.json({
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT || '587',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS ? '••••••••••••••••' : '',
    smtpFrom: process.env.SMTP_FROM || ''
  });
});

// 6b. POST SMTP CONFIG (Save to .env and load dynamic process.env variables)
app.post('/api/smtp-config', (req, res) => {
  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom } = req.body;

  if (!smtpHost || !smtpUser) {
    return res.status(400).json({ error: 'Fadlan geli ugu yiraan SMTP Host iyo SMTP User.' });
  }

  // Update process.env values immediately
  process.env.SMTP_HOST = smtpHost;
  process.env.SMTP_PORT = smtpPort || '587';
  process.env.SMTP_USER = smtpUser;
  if (smtpPass && smtpPass !== '••••••••••••••••') {
    process.env.SMTP_PASS = smtpPass;
  }
  process.env.SMTP_FROM = smtpFrom || smtpUser;

  // Persist to .env file format
  try {
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const envLines = envContent.split('\n');
    const envVars: Record<string, string> = {};
    envLines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const index = trimmed.indexOf('=');
      if (index > 0) {
        const key = trimmed.substring(0, index).trim();
        const value = trimmed.substring(index + 1).trim();
        if (key) {
          envVars[key] = value;
        }
      }
    });

    // Merge new SMTP values
    envVars['SMTP_HOST'] = smtpHost;
    envVars['SMTP_PORT'] = smtpPort || '587';
    envVars['SMTP_USER'] = smtpUser;
    if (smtpPass && smtpPass !== '••••••••••••••••') {
      envVars['SMTP_PASS'] = smtpPass;
    }
    envVars['SMTP_FROM'] = smtpFrom || smtpUser;

    const updatedLines = Object.entries(envVars)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    fs.writeFileSync(envPath, updatedLines, 'utf8');

    res.json({
      success: true,
      message: 'SMTP settings successfully saved and activated!'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to write env file', details: err.message });
  }
});

// 6c. TEST SMTP CONNECTION
app.post('/api/test-smtp', async (req, res) => {
  const { smtpHost, smtpPort, smtpUser, smtpPass } = req.body;

  // Force-reload latest environment variables to pick up any saved changes
  dotenv.config();

  const host = smtpHost || process.env.SMTP_HOST;
  const portStr = smtpPort || process.env.SMTP_PORT;
  const port = portStr ? parseInt(portStr) : 587;
  const user = smtpUser || process.env.SMTP_USER;
  let pass = smtpPass;
  if (!pass || pass === '••••••••••••••••') {
    pass = process.env.SMTP_PASS;
  }

  if (!host || !user || !pass) {
    return res.status(400).json({ error: 'Fadlan geli dhamaan xogta SMTP si loo tijaabiyo.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 8000 // 8s timeout to avoid hanging
    });

    await transporter.verify();
    res.json({ success: true, message: 'Isku-xirka SMTP waa guul! (SMTP connection verified successfully!)' });
  } catch (err: any) {
    res.status(500).json({ error: 'Isku-xirka SMTP wuu fashilmay', details: err.message });
  }
});

// 7. REAL EMAIL SENDING ENDPOINT USING SMTP (Nodemailer)
app.post('/api/send-email', async (req, res) => {
  const { to, subject, body } = req.body;

  if (!to || !to.trim() || !subject || !subject.trim() || !body || !body.trim()) {
    return res.status(400).json({ error: 'Fadlan geli dhamaan macluumaadka loo baahan yahay (To, Subject, Body).' });
  }

  // Robust email address format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to.trim())) {
    return res.status(400).json({ 
      error: 'Cinwaanka Email-ka ee aad gelisay ma ahan mid sax ah (Invalid email address format).',
      details: 'Fadlan hubi inuu jiro calamada "@" iyo "." sidoo kale uusan ku jirin wax oogu dambeya oo xaraf qaldan ah (tusaale: macmiil@gmail.com).'
    });
  }

  // Force-reload environmental configuration dynamically to pick up any manual or saved changes instantly!
  dotenv.config();

  // Retrieve SMTP variables from environment
  let smtpHost = process.env.SMTP_HOST;
  let smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  let smtpUser = process.env.SMTP_USER;
  let smtpPass = process.env.SMTP_PASS;
  let smtpFrom = process.env.SMTP_FROM || smtpUser || 'noreply@eliteestate.pro';

  let isDemoMsg = false;
  let demoPreviewUrl = '';
  let transporter;

  if (!smtpHost || !smtpUser || !smtpPass) {
    // No SMTP details provided. Fall back to secure local developer sandbox Ethereal Email so it succeeds anyway with a preview link!
    console.log('No SMTP config found. Generating a secure Ethereal temporary developer SMTP account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      smtpHost = testAccount.smtp.host;
      smtpPort = testAccount.smtp.port;
      smtpUser = testAccount.user;
      smtpPass = testAccount.pass;
      smtpFrom = `EliteEstate Pro Sandbox <${testAccount.user}>`;
      isDemoMsg = true;

      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: testAccount.smtp.secure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
    } catch (createAccErr: any) {
      console.error('Failed to create Ethereal SMTP fallback:', createAccErr);
      return res.status(500).json({
        error: 'SMTP-ga lama habayn, mana awoodin in nidaamka ku-meel-gaadhka ah la hawlgeliyo.',
        details: 'Fadlan ku dar macluumaadka SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) settings-ka si aad u dirto email.'
      });
    }
  } else {
    // Use configured SMTP
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for 587 / other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  try {
    const mailOptions = {
      from: smtpFrom,
      to: to.trim(),
      subject: subject.trim(),
      text: body,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
          <div style="display: flex; align-items: center; margin-bottom: 24px;">
            <div style="font-size: 20px; font-weight: 900; color: #4f46e5; letter-spacing: -0.5px;">EliteEstate Pro</div>
          </div>
          <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
            ${subject.trim()}
          </h2>
          <div style="font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; margin-bottom: 24px;">
            ${body}
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px;">
            <p style="font-size: 11px; color: #64748b; margin: 0; line-height: 1.4;">
              Farriintan waxaa laguu soo diray adoo isticmaalaya nidaamka maamulka hantida ma guurtada ah ee <strong>EliteEstate Pro</strong>.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email successfully dispatched: ${info.messageId}`);
    
    if (isDemoMsg) {
      demoPreviewUrl = nodemailer.getTestMessageUrl(info) || '';
      console.log(`Ethereal email preview available at: ${demoPreviewUrl}`);
    }

    return res.json({
      success: true,
      messageId: info.messageId,
      isDemo: isDemoMsg,
      demoUrl: demoPreviewUrl,
      message: isDemoMsg 
        ? 'Email-ka waxaa lagu guul-diray Sandbox ku-meel-gaadh ah! (Sent via secure temporary developer sandbox!)'
        : 'Email-ka rasmiga ah ee SMTP si sax ah ayaa loo diray qofka! (Email successfully delivered via SMTP!)'
    });
  } catch (err: any) {
    console.error('SMTP email delivery failed:', err);
    
    let userFriendlyError = 'Wuu ku fashilmay dirista email-ka rasmiga ah ee SMTP.';
    let actionTip = 'Fadlan hubi SMTP Settings-kaaga ku jira goobta Settings ee nidaamka.';

    const errMsgLower = (err.message || '').toLowerCase();
    const errCode = (err.code || '').toUpperCase();

    if (errCode === 'EAUTH' || errMsgLower.includes('auth') || errMsgLower.includes('login') || errMsgLower.includes('credentials')) {
      userFriendlyError = 'Cillad Dhanka Saxeexa ah (SMTP Authentication Failed)!';
      actionTip = 'Fadlan hubi in SMTP_USER (User-kaaga) iyo SMTP_PASS (Password-kaaga) ay sax yihiin. HADDII aad isticmaalayso GMAIL, waa inaad isticmaashaa "App Password" (oo laga sameeyo 2-Step Verification) ee ha isticmaalin password-kaaga caadiga ah ee Gmail-ka.';
    } else if (errCode === 'ENOTFOUND' || errMsgLower.includes('enotfound') || errMsgLower.includes('getaddrinfo')) {
      userFriendlyError = 'Lama heli karo Server-ka SMTP (SMTP Host Not Found)!';
      actionTip = 'Fadlan hubi in SMTP_HOST uu yahay mid sax ah (tusaale: smtp.gmail.com ama smtp.mailtrap.io).';
    } else if (errCode === 'ETIMEDOUT' || errMsgLower.includes('timeout') || errMsgLower.includes('timedout') || errMsgLower.includes('connect')) {
      userFriendlyError = 'Waqtigii xiriirku wuu dhammaaday (Connection Timeout)!';
      actionTip = 'Hubi in SMTP_PORT uu sax yahay (caadiyan waa 587 ama 465) iyo in server-kaagu uu oggol yahay isku-xirka dibadda.';
    } else if (errMsgLower.includes('sender') || errMsgLower.includes('from') || errMsgLower.includes('allowed')) {
      userFriendlyError = 'Cinwaanka diroygu ma ogola (Sender Email Denied)!';
      actionTip = 'Hubi in "SMTP_USER" iyo "SMTP_FROM" ay isku mid yihiin ama uu server-kaagu kuu oggol yahay cinwaanka aad ka dirayso.';
    }

    return res.status(500).json({
      error: userFriendlyError,
      details: err.message,
      tip: actionTip
    });
  }
});

// --- VITE MIDDLEWARE ---
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 EliteEstate Backend & Frontend live on http://localhost:${PORT}`);
});

export default app;
