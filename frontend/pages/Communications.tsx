import React, { useState, useEffect } from 'react';
import { api } from '../apiService';
import { Tenant, UserRole } from '../types';

interface Message {
  sender: 'admin' | 'tenant';
  text: string;
  time: string;
  type?: 'chat' | 'call' | 'email';
  subject?: string;
}

interface CommunicationsProps {
  role?: UserRole | null;
}

const Communications: React.FC<CommunicationsProps> = ({ role }) => {
  const isAdmin = role === UserRole.ADMIN;
  const [contacts, setContacts] = useState<Tenant[]>([]);
  const [selectedContact, setSelectedContact] = useState<Tenant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [chatHistories, setChatHistories] = useState<{ [contactId: string]: Message[] }>({});
  const [loading, setLoading] = useState(true);

  // Modal State for Registering custom contact
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for Editing existing custom contact/tenant
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editContactName, setEditContactName] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editSubmitError, setEditSubmitError] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Call Modal States
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callStatus, setCallStatus] = useState<'Completed' | 'Busy' | 'No Answer' | 'Scheduled'>('Completed');
  const [callNotes, setCallNotes] = useState('');
  const [isCallSubmitting, setIsCallSubmitting] = useState(false);

  // Email Modal States
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccessMessage, setEmailSuccessMessage] = useState('');
  const [demoEmailUrl, setDemoEmailUrl] = useState('');

  // Sync recipientEmail when selectedContact or isEmailModalOpen changes
  useEffect(() => {
    if (selectedContact) {
      setRecipientEmail(selectedContact.email && selectedContact.email !== 'N/A' ? selectedContact.email : '');
    }
  }, [selectedContact, isEmailModalOpen]);

  // SMTP Configuration Modal States
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);
  const [smtpConfHost, setSmtpConfHost] = useState('');
  const [smtpConfPort, setSmtpConfPort] = useState('587');
  const [smtpConfUser, setSmtpConfUser] = useState('');
  const [smtpConfPass, setSmtpConfPass] = useState('');
  const [smtpConfFrom, setSmtpConfFrom] = useState('');
  const [smtpConfigError, setSmtpConfigError] = useState('');
  const [smtpConfigSuccess, setSmtpConfigSuccess] = useState('');
  const [isSmtpConfigSaving, setIsSmtpConfigSaving] = useState(false);
  const [isSmtpTesting, setIsSmtpTesting] = useState(false);

  // Load SMTP config from server
  useEffect(() => {
    const fetchSmtpConfig = async () => {
      try {
        const conf = await api.getSmtpConfig();
        if (conf) {
          setSmtpConfHost(conf.smtpHost || '');
          setSmtpConfPort(conf.smtpPort || '587');
          setSmtpConfUser(conf.smtpUser || '');
          setSmtpConfPass(conf.smtpPass || '');
          setSmtpConfFrom(conf.smtpFrom || '');
        }
      } catch (e) {
        console.error('Failed to load SMTP configuration from server:', e);
      }
    };
    fetchSmtpConfig();
  }, []);

  // Clipboard Copied Feedbacks
  const [copiedPhoneStatus, setCopiedPhoneStatus] = useState(false);
  const [copiedEmailStatus, setCopiedEmailStatus] = useState(false);

  // Load chat histories from localStorage
  useEffect(() => {
    try {
      const savedChats = localStorage.getItem('eliteestate_chat_histories_v3');
      if (savedChats) {
        setChatHistories(JSON.parse(savedChats));
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
  }, []);

  // Fetch contacts from dynamic backend
  const fetchContactsData = async () => {
    setLoading(true);
    try {
      const tenantList = await api.getTenants();
      setContacts(tenantList);
      if (tenantList.length > 0) {
        setSelectedContact(tenantList[0]);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactsData();
  }, []);

  // Filter contacts by name, email or phone
  const filteredContacts = contacts.filter((c) => {
    const term = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.phone || '').toLowerCase().includes(term)
    );
  });

  // Save new contact
  const handleRegisterContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) {
      setSubmitError('Please enter the contact\'s full name.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    if (newContactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newContactEmail.trim())) {
        setSubmitError('Please enter a valid email address (e.g. client@gmail.com).');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const generatedId = 'c_' + Math.random().toString(36).substr(2, 9);
      const newTenant: Tenant = {
        id: generatedId,
        name: newContactName,
        phone: newContactPhone || 'N/A',
        email: newContactEmail || 'N/A',
        propertyId: '', // Standalone contact
        unit: 'General Contact',
        leaseStart: new Date().toISOString().split('T')[0],
        leaseEnd: '',
        status: 'Active',
      };

      const saved = await api.createTenant(newTenant);
      
      // Update local React list
      setContacts((prev) => [saved, ...prev]);
      setSelectedContact(saved);
      
      // Success reset
      setNewContactName('');
      setNewContactPhone('');
      setNewContactEmail('');
      setIsRegisterModalOpen(false);
    } catch (err) {
      setSubmitError('Failed to save the contact. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditContactModal = () => {
    if (!selectedContact) return;
    setEditContactName(selectedContact.name || '');
    setEditContactPhone(selectedContact.phone === 'N/A' ? '' : selectedContact.phone || '');
    setEditContactEmail(selectedContact.email === 'N/A' ? '' : selectedContact.email || '');
    setEditSubmitError('');
    setIsEditModalOpen(true);
  };

  const handleEditContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return;
    if (!editContactName.trim()) {
      setEditSubmitError('Please enter the contact\'s full name.');
      return;
    }

    setIsEditSubmitting(true);
    setEditSubmitError('');

    if (editContactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editContactEmail.trim())) {
        setEditSubmitError('Please enter a valid email address (e.g. client@gmail.com).');
        setIsEditSubmitting(false);
        return;
      }
    }

    try {
      const updatedTenant: Tenant = {
        ...selectedContact,
        name: editContactName,
        phone: editContactPhone || 'N/A',
        email: editContactEmail || 'N/A',
      };

      const saved = await api.updateTenant(selectedContact.id, updatedTenant);

      // Update contacts list in state
      setContacts((prev) => prev.map((c) => (c.id === selectedContact.id ? saved : c)));
      setSelectedContact(saved);

      setIsEditModalOpen(false);
    } catch (err: any) {
      setEditSubmitError(err.message || 'Failed to edit contact. Please try again.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Helper inside local histories
  const saveChatToStorage = (updatedChats: { [contactId: string]: Message[] }) => {
    setChatHistories(updatedChats);
    try {
      localStorage.setItem('eliteestate_chat_histories_v3', JSON.stringify(updatedChats));
    } catch (e) {
      console.error(e);
    }
  };

  // Handle message sending locally
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !messageText.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage: Message = {
      sender: 'admin',
      text: messageText,
      time: timestamp,
      type: 'chat'
    };

    const currentHistory = chatHistories[selectedContact.id] || [];
    const updatedHistory = [...currentHistory, newMessage];

    const updatedChats = {
      ...chatHistories,
      [selectedContact.id]: updatedHistory,
    };

    saveChatToStorage(updatedChats);
    setMessageText('');

    // Simulated tenant auto-reply after a short delay
    setTimeout(() => {
      const autoReply: Message = {
        sender: 'tenant',
        text: `Mahadsanid! Farriintaadii waan helnay. Waxaan kugu soo jawaabi doonaa dhowaan. (Automatic Reply to: "${messageText.substring(0, 20)}...")`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'chat'
      };
      
      const refreshedHistory = [...updatedHistory, autoReply];
      const finalChats = {
        ...updatedChats,
        [selectedContact.id]: refreshedHistory,
      };
      saveChatToStorage(finalChats);
    }, 1500);
  };

  // Log voice call history
  const handleLogCallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return;

    setIsCallSubmitting(true);
    
    setTimeout(() => {
      const timestamp = new Date().toLocaleDateString('so-SO') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const statusTranslate: Record<string, string> = {
        Completed: 'Dhacay (Completed)',
        Busy: 'Mashquul (Busy)',
        'No Answer': 'Ma Labayn (No Answer)',
        Scheduled: 'Waa Ballansan Yahay (Scheduled)'
      };

      const logText = `Wicitaan: ${statusTranslate[callStatus]}
Mowduuca/Notes: ${callNotes || 'Qoraal laguma darin'}`;

      const newMessage: Message = {
        sender: 'admin',
        text: logText,
        time: timestamp,
        type: 'call'
      };

      const currentHistory = chatHistories[selectedContact.id] || [];
      const updatedHistory = [...currentHistory, newMessage];
      const updatedChats = {
        ...chatHistories,
        [selectedContact.id]: updatedHistory
      };

      saveChatToStorage(updatedChats);
      
      // Reset
      setCallNotes('');
      setIsCallSubmitting(false);
      setIsCallModalOpen(false);
    }, 800);
  };

  const closeEmailModal = () => {
    setIsEmailModalOpen(false);
    setEmailSubject('');
    setEmailBody('');
    setIsEmailSubmitting(false);
    setEmailSuccessMessage('');
    setEmailError('');
    setDemoEmailUrl('');
  };

  const handleDirectSendOpen = (method: 'gmail' | 'mailto') => {
    if (!selectedContact) return;

    const emailValue = recipientEmail.trim();
    if (!emailValue) {
      setEmailError('Please enter a valid recipient email address to send the message.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      setEmailError('The email address provided is invalid (e.g. client@gmail.com). Please check for typos.');
      return;
    }

    // 1. Log the chat message locally in history
    const timestamp = new Date().toLocaleDateString('en-US') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const methodLabel = method === 'gmail' ? 'Direct Gmail 🔴' : 'Direct Mail App ✉️';
    
    const logText = `Email sent (${methodLabel})
To: ${emailValue}
Subject: ${emailSubject || 'No Subject'}

Message:
${emailBody}`;

    const newMessage: Message = {
      sender: 'admin',
      text: logText,
      time: timestamp,
      type: 'email',
      subject: emailSubject
    };

    const currentHistory = chatHistories[selectedContact.id] || [];
    const updatedHistory = [...currentHistory, newMessage];
    const updatedChats = {
      ...chatHistories,
      [selectedContact.id]: updatedHistory
    };

    saveChatToStorage(updatedChats);

    // 2. Open Gmail web or native mailto
    if (method === 'gmail') {
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailValue)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(gmailUrl, '_blank');
      setEmailSuccessMessage('Message generated successfully! Gmail has been prepared (click the button to send, and the message history has been logged).');
    } else {
      const mailtoUrl = `mailto:${emailValue}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoUrl, '_self');
      setEmailSuccessMessage('Message generated successfully! Your local Mail App has been opened to send the message, and the history has been logged.');
    }
  };

  // Log email dispatch simulation
  const handleLogEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return;

    const emailValue = recipientEmail.trim();
    if (!emailValue) {
      setEmailError('Please enter a valid recipient email address to send the message.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      setEmailError('The email address provided is invalid (e.g. client@gmail.com). Please check for typos or spaces.');
      return;
    }

    setIsEmailSubmitting(true);
    setEmailError('');
    setEmailSuccessMessage('');
    setDemoEmailUrl('');

    try {
      // Send real email via SMTP
      const result = await api.sendEmail(recipientEmail.trim(), emailSubject, emailBody);

      const timestamp = new Date().toLocaleDateString('en-US') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const logText = result.isDemo
        ? `Email sent via Sandbox test environment! 🧪
To: ${recipientEmail.trim()}
Subject: ${emailSubject || 'No Subject'}
View actual email: ${result.demoUrl || 'Not available'}`
        : `Email sent successfully! ✅
To: ${recipientEmail.trim()}
Subject: ${emailSubject || 'No Subject'}
Message: ${emailBody}`;

      const newMessage: Message = {
        sender: 'admin',
        text: logText,
        time: timestamp,
        type: 'email',
        subject: emailSubject
      };

      const currentHistory = chatHistories[selectedContact.id] || [];
      const updatedHistory = [...currentHistory, newMessage];
      const updatedChats = {
        ...chatHistories,
        [selectedContact.id]: updatedHistory
      };

      saveChatToStorage(updatedChats);

      if (result && result.isDemo && result.demoUrl) {
        setDemoEmailUrl(result.demoUrl);
        setEmailSuccessMessage('Sandbox test email sent successfully! Click the green button below to preview how the message appears to the recipient.');
      } else {
        setEmailSuccessMessage('Real live email sent successfully via SMTP! (Real email sent completely via live SMTP!)');
      }

      setIsEmailSubmitting(false);
    } catch (err: any) {
      console.error(err);
      setEmailError(err.message || 'Failed to send email. Please verify your SMTP Settings.');
      setIsEmailSubmitting(false);
    }
  };

  // Copy phone helper
  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneStatus(true);
    setTimeout(() => setCopiedPhoneStatus(false), 2000);
  };

  // Copy email helper
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmailStatus(true);
    setTimeout(() => setCopiedEmailStatus(false), 2000);
  };

  // Get active selected contact's messages
  const currentChatHistory = selectedContact ? chatHistories[selectedContact.id] || [
    {
      sender: 'tenant',
      text: `Hello, I hope you are doing well. This is ${selectedContact.name}. Please send any info here or contact me using the buttons below.`,
      time: 'Just now',
      type: 'chat'
    }
  ] : [];

  // Helper for actual WhatsApp redirect
  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}`;
  };

  // Save SMTP settings to backend
  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpConfigError('');
    setSmtpConfigSuccess('');
    setIsSmtpConfigSaving(true);
    try {
      await api.saveSmtpConfig({
        smtpHost: smtpConfHost,
        smtpPort: smtpConfPort,
        smtpUser: smtpConfUser,
        smtpPass: smtpConfPass,
        smtpFrom: smtpConfFrom
      });
      setSmtpConfigSuccess('SMTP Settings saved successfully! ✅ (Saved successfully!)');
      setTimeout(() => {
        setIsSmtpModalOpen(false);
        setSmtpConfigSuccess('');
      }, 2000);
    } catch (err: any) {
      setSmtpConfigError(err.message || 'Failed to save SMTP settings.');
    } finally {
      setIsSmtpConfigSaving(false);
    }
  };

  // Test SMTP Connection live of active state values
  const handleTestSmtp = async () => {
    setSmtpConfigError('');
    setSmtpConfigSuccess('');
    setIsSmtpTesting(true);
    try {
      const res = await api.testSmtpConnection({
        smtpHost: smtpConfHost,
        smtpPort: smtpConfPort,
        smtpUser: smtpConfUser,
        smtpPass: smtpConfPass
      });
      if (res.success) {
        setSmtpConfigSuccess('SMTP Connection successful and verified! ✅ Connection Verified!');
      }
    } catch (err: any) {
      setSmtpConfigError(err.message || 'SMTP Connection failed. Please check your SMTP configuration.');
    } finally {
      setIsSmtpTesting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden bg-slate-100 font-sans relative">
      {/* LEFT SIDEBAR: Contact List */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col flex-shrink-0 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Kala Xiriirka</h2>
            <div className="flex items-center gap-1.5">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsSmtpModalOpen(true)}
                  className="flex items-center justify-center w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all shadow-xs border border-slate-200 cursor-pointer"
                  title="Habeey SMTP Settings (Configure SMTP)"
                >
                  <i className="fa-solid fa-gears text-teal-600"></i>
                </button>
              )}
              {(role === UserRole.ADMIN || role === UserRole.USER) && (
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="flex items-center justify-center gap-1 px-2.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Macaamiil xaree"
                >
                  <i className="fa-solid fa-user-plus"></i>
                  <span>Ku Dar</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Raadi magac, tel ama email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400 text-xs"></i>
          </div>
        </div>

        {/* Contacts Grid */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <i className="fa-solid fa-circle-notch animate-spin text-2xl text-teal-600"></i>
              <span className="text-xs font-bold">Loading contacts...</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center px-4">
              <i className="fa-regular fa-user-circle text-4xl mb-3 text-slate-300"></i>
              <p className="text-xs font-bold text-slate-700">No contacts found</p>
              <p className="text-[11px] text-slate-400 mt-1">Please add a new contact by clicking the button above.</p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full flex items-center space-x-3 p-4 text-left transition-colors ${
                  selectedContact?.id === contact.id ? 'bg-teal-50/60 border-r-4 border-teal-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 text-teal-700 flex items-center justify-center font-black text-sm flex-shrink-0">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-800 text-sm truncate">{contact.name}</h4>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5"><i className="fa-solid fa-phone text-[10px] text-slate-400 mr-1"></i>{contact.phone}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5"><i className="fa-solid fa-envelope text-[10px] text-slate-400 mr-1"></i>{contact.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Communication Panel */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {selectedContact ? (
          <>
            {/* Contact Header Panel */}
            <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-10">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-lg">
                  {selectedContact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-800 text-base leading-none">{selectedContact.name}</h3>
                    {(role === UserRole.ADMIN || role === UserRole.USER) && (
                      <button
                        onClick={openEditContactModal}
                        className="text-teal-600 hover:text-teal-800 p-1 rounded-md hover:bg-slate-100 transition-all text-xs cursor-pointer inline-flex items-center gap-1"
                        title="Ku samee Wax-ka-beddel (Edit Client)"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                        <span className="text-[10px] font-bold">Wax ka beddel</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                      <i className="fa-solid fa-phone text-slate-400"></i> {selectedContact.phone}
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                      <i className="fa-solid fa-envelope text-slate-400"></i> {selectedContact.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Communication Channels */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsEmailModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                  title="Send Email"
                >
                  <i className="fa-solid fa-envelope text-cyan-600"></i>
                  <span>Email</span>
                </button>
                <a
                  href={getWhatsAppLink(selectedContact.phone)}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-sm"
                  title="Contact via WhatsApp"
                >
                  <i className="fa-brands fa-whatsapp text-sm"></i>
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Simulated Live Messaging UI */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="mx-auto max-w-2xl bg-teal-50 border border-teal-100 text-teal-950 rounded-2xl p-4 text-xs font-semibold leading-relaxed mb-4 flex items-start gap-2.5 shadow-sm">
                <i className="fa-solid fa-circle-info text-teal-700 mt-0.5 text-sm"></i>
                <div>
                  <h4 className="font-extrabold text-teal-900 mb-0.5">Direct & Integrated Communication!</h4>
                  Now you have dedicated buttons above for: <strong>WhatsApp</strong> and <strong>Email</strong> to quickly connect with clients!
                </div>
              </div>

              {currentChatHistory.map((chat, idx) => {
                const isCall = chat.type === 'call';
                const isEmail = chat.type === 'email';

                return (
                  <div key={idx} className={`flex ${chat.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-2xl max-w-lg shadow-sm border ${
                      isCall 
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-slate-800 rounded-bl-sm'
                        : isEmail
                        ? 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-250 text-slate-800 rounded-bl-sm'
                        : chat.sender === 'admin'
                        ? 'bg-teal-600 text-white rounded-br-none border-teal-700'
                        : 'bg-white text-slate-800 rounded-bl-none border-slate-200'
                    }`}>
                      {isCall && (
                        <div className="flex items-center gap-2 mb-2 text-emerald-800 font-black text-xs pb-1.5 border-b border-emerald-100 uppercase tracking-wider">
                          <i className="fa-solid fa-phone"></i>
                          <span>Wicitaan Diiwaangashan / Call Log</span>
                        </div>
                      )}
                      {isEmail && (
                        <div className="flex items-center gap-2 mb-2 text-teal-800 font-black text-xs pb-1.5 border-b border-teal-100 uppercase tracking-wider">
                          <i className="fa-solid fa-envelope"></i>
                          <span>Email la diray / Email Record</span>
                        </div>
                      )}

                      <p className="text-sm font-semibold leading-relaxed whitespace-pre-line">{chat.text}</p>
                      <small className={`block text-[9px] mt-2 ${
                        chat.sender === 'admin' && !isCall && !isEmail
                          ? 'text-teal-200 text-right' 
                          : 'text-slate-400'
                      }`}>
                        {chat.time}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Message Form */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex items-center space-x-2 shadow-inner">
              <input
                type="text"
                required
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
                placeholder="Type your message or notes here..."
              />
              <button
                type="submit"
                className="px-5 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors shadow-sm font-bold text-sm cursor-pointer"
              >
                <i className="fa-solid fa-paper-plane"></i>
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-center">
            <i className="fa-regular fa-comments text-6xl mb-4 text-slate-300"></i>
            <h3 className="font-extrabold text-slate-700 text-lg">No Contact Selected</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Please select a contact from the left pane to view history or send a message.
            </p>
          </div>
        )}
      </div>

      {/* CALL MODAL OVERLAY */}
      {isCallModalOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">Direct Phone Call</h3>
                <p className="text-[10px] text-emerald-100 font-semibold uppercase tracking-wider mt-0.5">Call {selectedContact.name}</p>
              </div>
              <button
                onClick={() => setIsCallModalOpen(false)}
                className="w-8 h-8 rounded-full bg-emerald-700/50 text-white hover:bg-emerald-800 flex items-center justify-center transition-colors focus:outline-none cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Custom Interactive Elements */}
            <form onSubmit={handleLogCallSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Telefoonka Macaamiilka</span>
                  <span className="text-lg font-bold text-slate-800">{selectedContact.phone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyPhone(selectedContact.phone)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    copiedPhoneStatus 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-750'
                  }`}
                >
                  <i className={copiedPhoneStatus ? "fa-solid fa-circle-check" : "fa-solid fa-copy"}></i>
                  <span>{copiedPhoneStatus ? 'La reebay!' : 'Copy'}</span>
                </button>
              </div>

              {/* Selection for Call Outcome to keep history accurate */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Xaaladda Wicitaanka / Status</label>
                <select
                  value={callStatus}
                  onChange={(e) => setCallStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                >
                  <option value="Completed">Dhacay (Completed / Connected)</option>
                  <option value="Busy">Mashquul (Busy / User Engaged)</option>
                  <option value="No Answer">Ma Labayn (No Answer / Declined)</option>
                  <option value="Scheduled">Ballansan yahay (Follow-up Scheduled)</option>
                </select>
              </div>

              {/* Call conversation notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Faahfaahinta / Notes of conversation</label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                  rows={3}
                  placeholder="Type notes of what you discussed here..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2.5">
                {/* Real Call button triggering tel protocols */}
                <a
                  href={`tel:${selectedContact.phone}`}
                  onClick={() => setIsCallModalOpen(false)}
                  className="px-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <i className="fa-solid fa-phone"></i>
                  <span>Dial Phone</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCallModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Xir
                  </button>
                  <button
                    type="submit"
                    disabled={isCallSubmitting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    {isCallSubmitting ? (
                      <>
                        <i className="fa-solid fa-circle-notch animate-spin"></i>
                        <span>Kaydinayaa...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk"></i>
                        <span>Diiwaangeli (Log Note)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMAIL MODAL OVERLAY */}
      {isEmailModalOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-teal-600 to-teal-700 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">Qor E-mail Cusub</h3>
                <p className="text-[10px] text-teal-100 font-semibold uppercase tracking-wider mt-0.5">Macaamiilka: {selectedContact.name}</p>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-teal-700/50 text-white hover:bg-teal-850 flex items-center justify-center transition-colors focus:outline-none cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Email Form / Success State */}
            {emailSuccessMessage ? (
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100 shadow-sm animate-pulse">
                  <i className="fa-solid fa-circle-check text-4xl"></i>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-slate-800">Email-ka waa la diray!</h4>
                  <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-sm mx-auto">
                    Si sax ah aya loogu guul-diray cinwaanka: <span className="font-mono text-teal-600 bg-teal-50 px-2 py-1 rounded-md text-xs font-bold">{recipientEmail}</span>
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-120 rounded-2xl p-4.5 text-xs text-slate-650 leading-relaxed text-left space-y-2.5">
                  <span className="font-black text-slate-800 uppercase tracking-wider block text-[10px] flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <i className="fa-solid fa-circle-info text-teal-600"></i>
                    <span>TIIBOOYINKA DIRISTA / STATUS LOG</span>
                  </span>
                  <div className="space-y-1.5 text-slate-700 leading-relaxed">
                    <p className="font-semibold">{emailSuccessMessage}</p>
                    <p className="text-[10px] text-slate-400 italic">This message has also been added to the customer's chat history for future reference.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  {demoEmailUrl && (
                    <a
                      href={demoEmailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl font-black text-xs transition-all shadow-md"
                    >
                      <i className="fa-solid fa-eye text-sm animate-bounce"></i>
                      <span>Preview Mail</span>
                    </a>
                  )}

                  <a
                    href={`mailto:${recipientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                    className="inline-flex items-center justify-center gap-2 w-full py-3 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-2xl font-black text-xs transition-all border border-teal-100"
                  >
                    <i className="fa-solid fa-envelope"></i>
                    <span>Direct backup</span>
                  </a>

                  <button
                    onClick={closeEmailModal}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-2xl font-black text-xs transition-all shadow-md cursor-pointer mt-1"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLogEmailSubmit} className="p-6 space-y-4">
                {emailError && (
                  <div className="p-5 bg-rose-50 border border-rose-250 text-rose-955 rounded-2xl text-xs font-semibold leading-relaxed space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 text-rose-900 font-extrabold text-sm pb-2 border-b border-rose-200">
                      <i className="fa-solid fa-triangle-exclamation text-lg text-rose-600 animate-pulse"></i>
                      <span>Sida Diyaarinta Email-ka Dhabta Ah (SMTP Setup Guide)</span>
                    </div>
                    
                    <div className="text-[11.5px] text-rose-900 space-y-2">
                      <p className="font-bold">
                        Cilad: <span className="text-red-650 italic">"{emailError}"</span>
                      </p>
                      <p>
                        Si aad u dirto <strong>Email dhab ah oo sax ah</strong> oo ku dhaca macaamiilkaaga adigoon isticmaalin barnaamij kale, fadlan raac talaabooyinkan si aad u diyaariso SMTP-gaaga:
                      </p>
                    </div>

                    <div className="bg-white p-4.5 rounded-xl border border-rose-150 space-y-3.5 shadow-inner">
                      <h5 className="font-black text-rose-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <i className="fa-solid fa-gears text-teal-600"></i>
                        <span>Xogta looga baahan yahay faylka .env ama Secrets-ka:</span>
                      </h5>
                      
                      <div className="space-y-2 text-[11px] font-mono select-all">
                        <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                          <span className="text-teal-700 font-bold block">SMTP_HOST=</span>
                          <span className="text-slate-600">smtp.gmail.com (Haddii aad isticmaali Gmail)</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                          <span className="text-teal-700 font-bold block">SMTP_PORT=</span>
                          <span className="text-slate-600">587</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                          <span className="text-teal-700 font-bold block">SMTP_USER=</span>
                          <span className="text-slate-600">emailkaaga@gmail.com</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                          <span className="text-teal-700 font-bold block">SMTP_PASS=</span>
                          <span className="text-emerald-700 font-bold">App-Password-kaaga Google Security</span>
                          <p className="text-[10px] text-slate-500 font-sans font-semibold mt-1 normal-case leading-normal">
                            ⚠️ <strong>Muhiim:</strong> Ha isticmaalin Password-kaaga caadiga ah ee Gmail-ka. Tag <strong>Google Account Settings &rarr; Security &rarr; App Passwords</strong> si aad u hesho password ka kooban 16 xaraf.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-teal-50 border border-teal-150 rounded-xl text-teal-950 text-[11px] leading-relaxed">
                      <i className="fa-solid fa-circle-info text-teal-700 mr-1"></i>
                      Waxaad sidoo kale riixi kartaa badhanka hoose ee <strong>"Furo Mail App"</strong> si aad email-ka dhabta ah ugu diro mashiinkaaga gaarka ah haddii aadan rabin inaad hadda habayso SMTP-ga.
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Gmail / E-mail Macmiilka <span className="text-rose-500">*</span></label>
                    <span className="text-[10px] text-slate-400 font-semibold font-mono">Kaydsan: {selectedContact.email}</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <i className="fa-solid fa-envelope"></i>
                      </span>
                      <input
                        type="email"
                        required
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 font-mono"
                        placeholder="Geli Gmail-ka macmiilka"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyEmail(recipientEmail)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                        copiedEmailStatus 
                          ? 'bg-teal-100 text-teal-800 border border-teal-200' 
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-750'
                      }`}
                    >
                      <i className={copiedEmailStatus ? "fa-solid fa-circle-check" : "fa-solid fa-copy"}></i>
                      <span>{copiedEmailStatus ? 'La reebay!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Mowduuca / Email Subject</label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
                    placeholder="e.g. Property Update / Rental Reminder"
                  />
                </div>

                {/* Body */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Email Body</label>
                  <textarea
                    required
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
                    rows={4}
                    placeholder="Type the email content here..."
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  {/* Direct Google Gmail Button (WhatsApp style!) */}
                  <button
                    type="button"
                    onClick={() => handleDirectSendOpen('gmail')}
                    className="w-full py-3.5 bg-gradient-to-r from-red-650 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer transform active:scale-[0.98] border border-red-200"
                  >
                    <i className="fa-brands fa-google text-base"></i>
                    <span>Send via Gmail Web UI 🔴</span>
                  </button>

                  <div className="flex items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleDirectSendOpen('mailto')}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-755 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <i className="fa-solid fa-envelope"></i>
                      <span>Furo Mail App</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isEmailSubmitting}
                      className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {isEmailSubmitting ? (
                        <>
                          <i className="fa-solid fa-circle-notch animate-spin"></i>
                          <span>Server...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-server"></i>
                          <span>Dir Background (SMTP)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={closeEmailModal}
                      className="py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Xir
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* OVERLAY MODAL: Add New Contact Form */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="px-6 py-5 bg-teal-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">Xaree Qof Cusub</h3>
                <p className="text-[10px] text-teal-100 font-semibold uppercase tracking-wider mt-0.5">Register New Contact</p>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-teal-700 text-white hover:bg-teal-800 flex items-center justify-center transition-colors focus:outline-none cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterContact} className="p-6 space-y-4">
              {submitError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <span>{submitError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  Magaca oo Buuxa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
                  placeholder="Hassan Mahmoud"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  Lambarka Telefoonka (Phone)
                </label>
                <input
                  type="tel"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
                  placeholder="e.g. 25261XXXXXX ama 061XXXXXX"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  E-mail / Gmail Address
                </label>
                <input
                  type="email"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
                  placeholder="hassan@gmail.com"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Baajiyay (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-circle-notch animate-spin"></i>
                      <span>Xaraynayaa...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-circle-check"></i>
                      <span>Save / Xaree</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL: Dynamic SMTP Configuration and Testing Manager */}
      {isSmtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="px-6 py-5 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <i className="fa-solid fa-envelope-open-text text-teal-400"></i>
                  <span>Habeey Email SMTP</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">SMTP Configuration & Testing Utility</p>
              </div>
              <button
                onClick={() => setIsSmtpModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-750 flex items-center justify-center transition-colors focus:outline-none cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSmtp} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {smtpConfigError && (
                <div className="p-4 bg-rose-50 border border-rose-250 text-rose-955 rounded-2xl text-xs font-semibold leading-relaxed flex items-start gap-2 shadow-sm">
                  <i className="fa-solid fa-circle-exclamation text-rose-600 text-sm mt-0.5 flex-shrink-0 animate-bounce"></i>
                  <div>
                    <strong className="text-rose-900 block font-bold">Cilad Baa Dhacday!</strong>
                    {smtpConfigError}
                  </div>
                </div>
              )}

              {smtpConfigSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-955 rounded-2xl text-xs font-semibold leading-relaxed flex items-start gap-2 shadow-sm">
                  <i className="fa-solid fa-circle-check text-emerald-600 text-sm mt-0.5 flex-shrink-0 animate-pulse"></i>
                  <div>
                    <strong className="text-emerald-900 block font-bold">Waa Guul!</strong>
                    {smtpConfigSuccess}
                  </div>
                </div>
              )}

              <p className="text-xs font-medium text-slate-500 leading-relaxed mb-1">
                Connect the <strong>Elite Real Estate Management System</strong> to your own SMTP server (like Gmail, Mailtrap or Outlook) to send actual, reliable emails to all properties and tenants.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                    SMTP Server Host <span className="text-teal-650 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={smtpConfHost}
                    onChange={(e) => setSmtpConfHost(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 font-mono"
                    placeholder="smtp.gmail.com ama smtp.mailtrap.io"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                    Server Port <span className="text-teal-650 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={smtpConfPort}
                    onChange={(e) => setSmtpConfPort(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 font-mono"
                    placeholder="587 / 465"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                  SMTP Username / Email <span className="text-teal-650 font-bold">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={smtpConfUser}
                  onChange={(e) => setSmtpConfUser(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 font-mono"
                  placeholder="example@gmail.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                    SMTP Password / App Password <span className="text-teal-650 font-bold">*</span>
                  </label>
                  <span className="text-[10px] text-teal-600 font-semibold cursor-help" title="Gmail: App Passwords; others: password-ka rasmiga">Maxay tahay App Password?</span>
                </div>
                <input
                  type="password"
                  value={smtpConfPass}
                  onChange={(e) => setSmtpConfPass(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 font-mono"
                  placeholder="••••••••••••••••"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                  Sender From Address (Sender Email Title)
                </label>
                <input
                  type="text"
                  value={smtpConfFrom}
                  onChange={(e) => setSmtpConfFrom(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
                  placeholder="e.g. Elite Real Estate Management System <noreply@eliteestate.pro>"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[11px] leading-relaxed text-slate-600 space-y-2">
                <strong className="text-slate-800 font-bold">💡 Talo ku saabsan Gmail:</strong>
                <p>
                  Haddii aad isticmaalayso Gmail, fadlan ku billow inaad u dhisto <strong>App Password</strong> qaybta amniga ee Google-kaaga (Security section). Ha ku shubin halkan password-kaaga rasmiga ah ee akoonkaaga oo ha ilaawin inaad geliso server port-ka saxda ah (587).
                </p>
              </div>

              <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 font-semibold">
                {/* Connection Test Action */}
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={isSmtpTesting || !smtpConfHost || !smtpConfUser}
                  className={`w-full sm:w-auto px-4 py-2.5 ${(!smtpConfHost || !smtpConfUser) ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white'} rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer`}
                >
                  {isSmtpTesting ? (
                    <>
                      <i className="fa-solid fa-circle-notch animate-spin"></i>
                      <span>Lagu tijaabinayaa...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-signal"></i>
                      <span>Tijaabi Isku-Xirka (Test SMTP)</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsSmtpModalOpen(false)}
                    className="w-1/2 sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Xir
                  </button>
                  <button
                    type="submit"
                    disabled={isSmtpConfigSaving}
                    className="w-1/2 sm:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSmtpConfigSaving ? (
                      <>
                        <i className="fa-solid fa-circle-notch animate-spin"></i>
                        <span>La keydinayaa...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        <span>Badbaadi & Dhaqaaji</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL: Edit Contact Form */}
      {isEditModalOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="px-6 py-5 bg-teal-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <i className="fa-solid fa-user-pen"></i>
                  <span>Wax Ka Beddel Macmiilka</span>
                </h3>
                <p className="text-[10px] text-teal-100 font-semibold uppercase tracking-wider mt-0.5">Edit Client Contact Details</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-teal-700 text-white hover:bg-teal-800 flex items-center justify-center transition-colors focus:outline-none cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditContact} className="p-6 space-y-4">
              {editSubmitError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation text-rose-600"></i>
                  <span>{editSubmitError}</span>
                </div>
              )}

              <p className="text-xs font-medium text-slate-500 leading-relaxed mb-1">
                Halkan ku beddel xogta macmiilka sida <strong>Email-ka (Gmail-ka)</strong>, magaca ama telefoonka si loo cusboonaysiiyo.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  Magaca oo Buuxa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editContactName}
                  onChange={(e) => setEditContactName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
                  placeholder="Hassan Mahmoud"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  Lambarka Telefoonka (Phone)
                </label>
                <input
                  type="tel"
                  value={editContactPhone}
                  onChange={(e) => setEditContactPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
                  placeholder="ej. 25261XXXXXX"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  E-mail / Gmail Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editContactEmail}
                  onChange={(e) => setEditContactEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 font-mono"
                  placeholder="macmiilka@gmail.com"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Baajiyay (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {isEditSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>La keydinayaa...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk"></i>
                      <span>Cusboonaysii (Save)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communications;
