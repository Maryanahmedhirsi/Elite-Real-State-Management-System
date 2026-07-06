import React, { useState, useEffect } from 'react';
import { api } from '../apiService';
import { Property } from '../types';

const Locations: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [mapType, setMapType] = useState<'google' | 'stylized'>('google');

  useEffect(() => {
    const fetchProps = async () => {
      try {
        const data = await api.getProperties();
        setProperties(data);
        if (data.length > 0) setSelectedProperty(data[0]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProps();
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Khariidadda Guryaha (Locations Map)</h1>
          <p className="text-slate-500 font-medium">Halkan ka daawo goobaha ay ku yaallaan dhismayaasha kala duwan ee magaalada.</p>
        </div>
        
        {/* Map Type Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setMapType('google')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              mapType === 'google' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-map"></i> Real Google Map
          </button>
          <button
            onClick={() => setMapType('stylized')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              mapType === 'stylized' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-compass"></i> Stylized Pin Map
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] h-[550px] overflow-hidden relative shadow-2xl flex items-center justify-center">
          {mapType === 'google' ? (
            selectedProperty ? (
              <div className="w-full h-full relative">
                <iframe
                  width="100%"
                  height="100%"
                  className="w-full h-full border-0 absolute inset-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer"
                  title={selectedProperty.name}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedProperty.address + ", Mogadishu, Somalia")}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                ></iframe>
                <div className="absolute top-6 left-6 bg-slate-900/90 backdrop-blur-md text-white border border-slate-700 px-4 py-2 rounded-2xl z-10 shadow-lg pointer-events-none">
                  <p className="text-[9px] font-extrabold text-teal-400 uppercase tracking-widest">Google Map Active</p>
                  <p className="text-xs font-black mt-0.5">{selectedProperty.name}</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 p-8 space-y-3">
                <i className="fa-solid fa-map-location-dot text-4xl text-indigo-500 animate-pulse"></i>
                <p className="font-bold text-sm">Fadhlan dooro guri si aad u aragto khariidadiisa rasmiga ah.</p>
              </div>
            )
          ) : (
            <>
              {/* Custom Stylized Minimalist Interactive Canvas Map */}
              <div className="absolute inset-0 bg-slate-800/40 overflow-hidden flex items-center justify-center">
                <div className="relative w-full h-full opacity-60 bg-[radial-gradient(#0d9488_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
                
                {/* Visual Grid Roads & Landmarks of Mogadishu */}
                <div className="absolute top-1/2 left-0 w-full h-[6px] bg-slate-700/60 rotate-6"></div>
                <div className="absolute top-[30%] left-0 w-full h-[6px] bg-slate-700/60 -rotate-3"></div>
                <div className="absolute top-0 left-1/3 w-[6px] h-full bg-slate-700/60 rotate-12"></div>
                
                {/* Indian Ocean Backdrop Water for Mogadishu Coastline */}
                <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-teal-900/40 rounded-tl-full blur-xl"></div>
              </div>

              <p className="absolute top-6 left-6 text-[10px] font-black tracking-widest uppercase bg-slate-900 text-indigo-400 border border-slate-800 px-3 py-1.5 rounded-xl z-10">
                Interactive Mogadishu Map
              </p>

              <div className="absolute inset-0 p-8 flex items-center justify-center pointer-events-none">
                {properties.map((p, idx) => {
                  const offsets = [
                    { top: '40%', left: '30%' },
                    { top: '55%', left: '48%' },
                    { top: '32%', left: '65%' },
                    { top: '65%', left: '20%' },
                    { top: '25%', left: '45%' },
                    { top: '70%', left: '70%' },
                  ];
                  const style = offsets[idx % offsets.length];
                  const isSelected = selectedProperty?.id === p.id;
                  
                  return (
                    <button
                      key={p.id}
                      style={style}
                      onClick={() => setSelectedProperty(p)}
                      className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 group transition-all duration-300 ${
                        isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-indigo-600 text-white shadow-xl ring-4 ring-indigo-50/20' 
                          : 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-md ring-2 ring-slate-100'
                      }`}>
                        <i className="fa-solid fa-hotel text-xs"></i>
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 -top-10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-905 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-lg">
                        {p.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-6">
          <h3 className="font-extrabold text-slate-900 text-lg tracking-tight border-b border-indigo-50 pb-4">Guryaha & Goobaha</h3>
          <div className="space-y-4 max-h-[350px] overflow-y-auto">
            {properties.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProperty(p)}
                className={`w-full p-4 rounded-2xl border text-left flex items-start space-x-3 transition-all ${
                  selectedProperty?.id === p.id 
                    ? 'bg-indigo-50/80 border-indigo-200' 
                    : 'border-slate-100 hover:bg-slate-55'
                }`}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-900 leading-tight truncate">{p.name}</h4>
                  <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-tight truncate">{p.address}</p>
                </div>
              </button>
            ))}
          </div>

          {selectedProperty && (
            <div className="p-4 bg-slate-55 rounded-2xl border border-slate-100 space-y-3">
              <h4 className="font-black text-slate-900 text-sm">{selectedProperty.name}</h4>
              <p className="text-xs text-slate-550 font-medium">{selectedProperty.address}</p>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] uppercase font-black text-indigo-600">Price per Month:</span>
                <span className="text-sm font-black text-slate-905">${selectedProperty.price}</span>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedProperty.address + ", Mogadishu, Somalia")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/10 active:scale-95 cursor-pointer decoration-none block"
                id={`google-maps-btn-${selectedProperty.id}`}
              >
                <i className="fa-solid fa-map-location-dot"></i>
                <span>Fura Google Map Rasmiga ah</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Locations;
