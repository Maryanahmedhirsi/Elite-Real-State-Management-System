import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { api } from '../apiService';

interface LoginProps {
  onLogin: (role: UserRole, userDetails?: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setEmail('');
    setPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [role, isRegister]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isRegister) {
        const res = await api.registerUser({
          name,
          email,
          phone,
          password,
          role: 'user'
        });
        setSuccessMsg(res.message || 'Registration successful! Please wait for Admin approval.');
        setName('');
        setPhone('');
        setEmail('');
        setPassword('');
      } else {
        const res = await api.loginUser({ email, password });
        if (res.success) {
          onLogin(res.user.role as UserRole, res.user);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative font-sans overflow-hidden bg-slate-950">
      {/* Premium Cinematic Background Layer */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-105 animate-[pulse_8s_ease-in-out_infinite]"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1920&q=80")',
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/40 to-teal-900/20"></div>
        <div className="absolute inset-0 bg-black/40 backdrop-grayscale-[0.2]"></div>
      </div>

      <div className="w-full max-w-[430px] z-10 p-4 animate-in fade-in zoom-in duration-500">
        <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] p-8 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border border-white/40 ring-1 ring-black/5">
          
          {/* Brand Identity Section */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center shadow-xl shadow-teal-600/40 transform -rotate-3 mb-3">
              <i className="fa-solid fa-hotel text-white text-xl"></i>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tighter leading-tight mb-1">
              Elite Real Estate Management
            </h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {isRegister ? 'Staff & Agent Registration' : 'Property & Tenant Management'}
            </p>
          </div>

          {/* Feedback Alert Cards */}
          {errorMsg && (
            <div className="mb-4 p-4 bg-rose-50 border-l-4 border-rose-500 rounded-xl text-xs text-rose-700 font-bold animate-in slide-in-from-top-2">
              <div className="flex gap-2">
                <i className="fa-solid fa-triangle-exclamation text-rose-500 mt-0.5"></i>
                <div>
                  <p className="font-extrabold text-rose-900">Login Error</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed font-semibold">{errorMsg}</p>
                </div>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-xl text-xs text-emerald-700 font-bold animate-in slide-in-from-top-2">
              <div className="flex gap-2">
                <i className="fa-solid fa-circle-check text-emerald-500 mt-0.5"></i>
                <div>
                  <p className="font-extrabold text-emerald-900">Success</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed font-semibold">{successMsg}</p>
                </div>
              </div>
            </div>
          )}

          {/* Mode Switcher for Login Only */}
          {!isRegister && (
            <div className="mb-6 p-1 bg-slate-100/80 rounded-xl flex relative h-10">
              <div 
                className={`absolute top-1 bottom-1 transition-all duration-300 ease-out bg-white rounded-lg shadow-sm w-[calc(50%-4px)] ${role === UserRole.USER ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`}
              ></div>
              <button
                type="button"
                onClick={() => setRole(UserRole.ADMIN)}
                className={`relative z-10 flex-1 flex items-center justify-center text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${role === UserRole.ADMIN ? 'text-teal-600' : 'text-slate-400'}`}
              >
                ADMIN
              </button>
              <button
                type="button"
                onClick={() => setRole(UserRole.USER)}
                className={`relative z-10 flex-1 flex items-center justify-center text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${role === UserRole.USER ? 'text-teal-600' : 'text-slate-400'}`}
              >
                AGENT / USER
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                      <i className="fa-solid fa-user text-xs"></i>
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all text-slate-800"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                      <i className="fa-solid fa-phone text-xs"></i>
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all text-slate-800"
                      placeholder="+252 61xxxxxxx"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Identity (Email)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <i className="fa-solid fa-envelope text-xs"></i>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all text-slate-800"
                  placeholder="yourname@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Key (Password)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <i className="fa-solid fa-shield-halved text-xs"></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all text-slate-800"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-teal-600"
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-[10px]`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-teal-600 transition-all flex items-center justify-center gap-3 mt-2 active:scale-95 group cursor-pointer"
            >
              {isLoading ? (
                <i className="fa-solid fa-circle-notch fa-spin"></i>
              ) : (
                <>
                  <span>{isRegister ? 'REQUEST ACCESS (SIGN UP)' : 'LOGIN TO SYSTEM (SIGN IN)'}</span>
                  <i className="fa-solid fa-chevron-right text-[8px] group-hover:translate-x-1 transition-transform"></i>
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register Mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-teal-600 hover:text-teal-800 font-extrabold uppercase tracking-wider hover:underline cursor-pointer"
            >
              {isRegister 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Register"}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
             <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Encrypted Access Portal</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
