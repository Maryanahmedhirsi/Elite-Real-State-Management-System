import React, { useState, useEffect } from 'react';
import { api } from '../apiService';
import { Property, UserRole, Sale } from '../types';

interface PropertiesProps {
  role?: UserRole | null;
}

const Properties: React.FC<PropertiesProps> = ({ role }) => {
  const isAdmin = role === UserRole.ADMIN;
  const [properties, setProperties] = useState<Property[]>([]);
  const [filter, setFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking states for client/user
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingProperty, setBookingProperty] = useState<Property | null>(null);
  const [bookingName, setBookingName] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingType, setBookingType] = useState<'Rent' | 'Sale'>('Rent');
  const [bookingMessage, setBookingMessage] = useState('');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<'Apartment' | 'House' | 'Hotel' | 'Commercial'>('Apartment');
  const [status, setStatus] = useState<'Occupied' | 'Vacant' | 'Under Maintenance'>('Vacant');
  const [price, setPrice] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [kitchens, setKitchens] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [image, setImage] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchProperties = async () => {
    try {
      const data = await api.getProperties();
      setProperties(data);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleOpenModal = (p?: Property) => {
    if (p) {
      setEditingProperty(p);
      setName(p.name);
      setAddress(p.address);
      setType(p.type);
      setStatus(p.status);
      setPrice(p.price);
      setRooms(p.rooms);
      setKitchens(p.kitchens);
      setBathrooms(p.bathrooms);
      setImage(p.image);
    } else {
      setEditingProperty(null);
      setName('');
      setAddress('');
      setType('Apartment');
      setStatus('Vacant');
      setPrice(500);
      setRooms(3);
      setKitchens(1);
      setBathrooms(2);
      setImage('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProperty(null);
  };

  const handleOpenBookingModal = (p: Property) => {
    setBookingProperty(p);
    setBookingName('');
    setBookingEmail('');
    setBookingPhone('');
    setBookingType(p.status === 'Occupied' ? 'Rent' : 'Rent');
    setBookingMessage('');
    setBookingSuccess(false);
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingProperty) return;
    setIsBookingSubmitting(true);

    const bookingPayload: Sale = {
      id: Math.random().toString(36).substring(2, 9),
      propertyId: bookingProperty.id,
      clientName: bookingName,
      amount: bookingProperty.price,
      date: new Date().toISOString().split('T')[0],
      transactionType: bookingType,
      status: 'Pending'
    };

    try {
      await api.createSale(bookingPayload);
      setBookingSuccess(true);
      setTimeout(() => {
        setIsBookingModalOpen(false);
        setBookingSuccess(false);
        setBookingProperty(null);
      }, 3000);
    } catch (err) {
      console.error('Error creating booking/order:', err);
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
  };

  const confirmAndExecuteDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteProperty(deleteId);
      setProperties(prev => prev.filter(p => p.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting property:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Property = {
      id: editingProperty ? editingProperty.id : Math.random().toString(36).substring(2, 9),
      name,
      address,
      type,
      status,
      price,
      rooms,
      kitchens,
      bathrooms,
      image
    };

    try {
      if (editingProperty) {
        await api.updateProperty(editingProperty.id, payload);
        setProperties(prev => prev.map(p => p.id === editingProperty.id ? payload : p));
      } else {
        await api.createProperty(payload);
        setProperties(prev => [payload, ...prev]);
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving property:', err);
    }
  };

  const filteredProperties = properties.filter(p => filter === 'All' || p.status === filter);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Loading properties...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Rent & Sale Properties</h1>
          <p className="text-slate-500 font-medium">
            {role === UserRole.ADMIN || role === UserRole.USER
              ? "Add, edit, delete properties or track their occupancy and status."
              : "Find your dream property, apartment or house and request a booking/lease."
            }
          </p>
        </div>
        {(role === UserRole.ADMIN || role === UserRole.USER) && (
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i> Add New Property
          </button>
        )}
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl self-start w-fit">
        {['All', 'Occupied', 'Vacant', 'Under Maintenance'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === tab 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'All' ? 'All' : tab === 'Occupied' ? 'Occupied' : tab === 'Vacant' ? 'Vacant' : 'Maintenance'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <div key={property.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 group hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="relative h-48 overflow-hidden">
                <img src={property.image} alt={property.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                    property.status === 'Occupied' ? 'bg-emerald-500 text-white' :
                    property.status === 'Vacant' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {property.status}
                  </span>
                </div>
                <div className="absolute bottom-4 right-4 bg-slate-905/70 backdrop-blur-md px-3 py-1 rounded-lg text-white font-bold text-xs uppercase tracking-widest">
                  {property.type}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">{property.name}</h3>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address + ", Mogadishu, Somalia")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center mt-1 font-bold transition-all hover:underline group"
                    title="Ka fura Google Maps saxa ah"
                    id={`google-maps-link-${property.id}`}
                  >
                    <i className="fa-solid fa-location-dot mr-2 text-indigo-500 animate-bounce"></i> 
                    <span>{property.address}</span>
                    <i className="fa-solid fa-arrow-up-right-from-square text-[9px] ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-slate-500 font-semibold text-xs">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-black">Rooms</p>
                    <p className="text-sm font-black text-slate-800 mt-1">{property.rooms}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-black">Kitchens</p>
                    <p className="text-sm font-black text-slate-800 mt-1">{property.kitchens}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-black">Baths</p>
                    <p className="text-sm font-black text-slate-800 mt-1">{property.bathrooms}</p>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/50 rounded-xl flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-indigo-700">Price</span>
                  <span className="text-base font-black text-indigo-600">${property.price}/mo</span>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-2">
              {role === UserRole.ADMIN || role === UserRole.USER ? (
                <>
                  <button
                    onClick={() => handleOpenModal(property)}
                    className="flex-1 py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(property.id)}
                    className="w-11 h-11 flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition-colors"
                    title="Delete"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleOpenBookingModal(property)}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 active:scale-95"
                >
                  <i className="fa-solid fa-cart-shopping"></i>
                  <span>Request Booking</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* USER BOOKING / ORDER MODAL */}
      {isBookingModalOpen && bookingProperty && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isBookingSubmitting && setIsBookingModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in duration-300 overflow-hidden border border-slate-100">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Book Property</h2>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{bookingProperty.name}</p>
              </div>
              <button 
                onClick={() => setIsBookingModalOpen(false)} 
                disabled={isBookingSubmitting}
                className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-slate-400 transition-colors shadow-sm"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-12 text-center space-y-4 animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl shadow-inner animate-bounce">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <h3 className="text-xl font-black text-slate-900">Successfully Ordered!</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Congratulations! Your property booking request has been received. The management team will contact you shortly.
                </p>
                <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full w-fit mx-auto">
                  Status: Pending Approval
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="p-8 space-y-4">
                <div className="flex gap-4 items-center p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/30">
                  <img src={bookingProperty.image} alt={bookingProperty.name} className="w-16 h-16 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{bookingProperty.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{bookingProperty.address}</p>
                    <p className="text-xs font-black text-indigo-600 mt-1">${bookingProperty.price}/mo</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                  <input
                    type="text" required value={bookingName} onChange={(e) => setBookingName(e.target.value)}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-150 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone</label>
                    <input
                      type="tel" required value={bookingPhone} onChange={(e) => setBookingPhone(e.target.value)}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-150 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="+252 61xxxxxxx"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email (Optional)</label>
                    <input
                      type="email" value={bookingEmail} onChange={(e) => setBookingEmail(e.target.value)}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-150 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Contract Type</label>
                  <select
                    value={bookingType} onChange={(e) => setBookingType(e.target.value as any)}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-150 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="Rent">Rent</option>
                    <option value="Sale">Buy / Purchase</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Message/Notes</label>
                  <textarea
                    value={bookingMessage} onChange={(e) => setBookingMessage(e.target.value)}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-150 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-20 resize-none"
                    placeholder="Enter any additional details (e.g. preferred move-in date/month)"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBookingSubmitting}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
                >
                  {isBookingSubmitting ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      <span>Saving booking request...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk"></i>
                      <span>Save & Submit Booking</span>
                    </>
                  )}
                </button>
              </form>
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
                {editingProperty ? 'Edit Property Details' : 'Add New Property'}
              </h2>
              <button onClick={handleCloseModal} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-slate-400 transition-colors shadow-sm">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Property Name</label>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Hilaac Apartment, Somali Golden House"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Address</label>
                <input
                  type="text" required value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Degmada Waberi, Mogadishu"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nooca (Type)</label>
                  <select
                    value={type} onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Qiimaha/Kiira Bishii (Monthly Rent)</label>
                  <input
                    type="number" required value={price} onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="450"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Rooms</label>
                  <input
                    type="number" min={1} required value={rooms} onChange={(e) => setRooms(Number(e.target.value))}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Kitchens</label>
                  <input
                    type="number" min={0} required value={kitchens} onChange={(e) => setKitchens(Number(e.target.value))}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Baths</label>
                  <input
                    type="number" min={1} required value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Property Image</label>
                  <div className="flex items-center gap-3">
                    {image && (
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImage('')}
                          className="absolute inset-0 bg-black/50 hover:bg-black/70 flex items-center justify-center text-white text-[9px] font-black uppercase transition-all"
                          title="Erase image"
                        >
                          Erase
                        </button>
                      </div>
                    )}
                    <label className="flex-1 flex flex-col items-center justify-center h-14 bg-slate-50 border border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl cursor-pointer hover:bg-slate-100/50 transition-all text-center">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-cloud-arrow-up text-slate-400 text-sm"></i>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Choose File</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setImage(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Status</label>
                  <select
                    value={status} onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="Occupied">Occupied</option>
                    <option value="Vacant">Vacant</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-[0.98] mt-4"
              >
                Save Property
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
              <p className="text-xs text-slate-500 mt-2 font-medium">This action cannot be undone. Are you sure you want to delete this property?</p>
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

export default Properties;
