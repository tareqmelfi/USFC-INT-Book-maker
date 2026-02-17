
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";

// --- Types ---
type View = 'landing' | 'login' | 'signup' | 'dashboard' | 'creation-options' | 'generate-path' | 'paste-text-path' | 'studio' | 'about' | 'pricing' | 'legal' | 'settings';
type ContentType = 'presentation' | 'document' | 'other';

interface Project {
  id: string;
  title: string;
  thumbnail: string;
  type: string;
  timestamp: number;
}

// --- Icons ---
const LogoIcon = ({ className = "" }) => <div className={`w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm ${className}`}>S</div>;
const HomeIcon = ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>;
const SharedIcon = ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>;
const SitesIcon = ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>;
const SparklesIcon = ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.143-7.714L1 12l6.857-2.143L11 3z"/></svg>;
const PlusIcon = ({ className = "" }) => <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>;
const ArrowLeftIcon = ({ className = "" }) => (
  <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
  </svg>
);
const UserIcon = ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
const SettingsIcon = ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
const LogoutIcon = ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>;
const InfoIcon = ({ className = "" }) => <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;

// --- Helper Functions ---
const adjustHeight = (el: HTMLTextAreaElement | null) => {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight) + 'px';
};

// --- Sub-components (outside App to prevent re-creation and focus loss) ---

const SidebarItem = ({ icon, label, active = false, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
    <span className={active ? 'text-indigo-600' : 'text-slate-400'}>{icon}</span>
    <span>{label}</span>
  </button>
);

const OptionCard = ({ icon, title, desc, image, tag, disabled = false, onClick }: any) => (
  <div onClick={!disabled ? onClick : undefined} className={`bg-white rounded-3xl p-1 shadow-sm border border-slate-100 flex flex-col group transition-all ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:shadow-xl'}`}>
    <div className="aspect-[4/3] rounded-[1.25rem] overflow-hidden mb-4 relative">
      <img src={image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
      {tag && <span className="absolute bottom-3 left-3 bg-white/90 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">{tag}</span>}
    </div>
    <div className="px-5 pb-6 text-right" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-indigo-600">{icon}</div>
        <h3 className="font-black text-[#0c162c] text-sm">{title}</h3>
      </div>
      <p className="text-[10px] text-slate-400 font-bold">{desc}</p>
    </div>
  </div>
);

const Header = ({ isLoggedIn, userProfile, view, setView, showProfileMenu, setShowProfileMenu, setIsLoggedIn }: any) => (
  <nav className="fixed w-full top-0 bg-white/95 backdrop-blur-md z-[100] border-b border-slate-100 px-6 h-16 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
      <LogoIcon />
      <span className="text-xl font-black tracking-tighter text-indigo-900">SPEC</span>
    </div>
    <div className="hidden md:flex gap-8 text-sm font-bold text-slate-500">
      <button onClick={() => setView('landing')} className="hover:text-indigo-600 transition-colors">المنتجات</button>
      {isLoggedIn && <button onClick={() => setView('dashboard')} className="hover:text-indigo-600 transition-colors">لوحة التحكم</button>}
      <button onClick={() => setView('pricing')} className="hover:text-indigo-600 transition-colors">الأسعار</button>
      <button onClick={() => setView('about')} className="hover:text-indigo-600 transition-colors">عن المنصة</button>
    </div>
    <div className="flex items-center gap-4">
      {!isLoggedIn ? (
        <>
          <button onClick={() => setView('login')} className="text-sm font-bold text-slate-600 hover:text-indigo-600">دخول</button>
          <button onClick={() => setView('signup')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-xs font-bold shadow-lg">ابدأ مجاناً</button>
        </>
      ) : (
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pl-3 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs shadow-inner">
              {userProfile.firstName[0]}{userProfile.lastName[0]}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-black text-slate-900 leading-tight">{userProfile.firstName} {userProfile.lastName}</p>
              <p className="text-[8px] font-bold text-slate-400">Pro Account</p>
            </div>
            <ArrowLeftIcon className="-rotate-90 w-3 h-3 text-slate-300 ml-1" />
          </button>
          
          {showProfileMenu && (
            <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[200] animate-slide-up" dir="rtl">
              <div className="px-4 py-3 border-b border-slate-50 mb-1">
                 <p className="text-xs font-black text-slate-900">{userProfile.email}</p>
              </div>
              <button onClick={() => { setView('dashboard'); setShowProfileMenu(false); }} className="w-full text-right px-4 py-2 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3">
                <SitesIcon className="w-4 h-4" /> لوحة التحكم
              </button>
              <button onClick={() => { setView('settings'); setShowProfileMenu(false); }} className="w-full text-right px-4 py-2 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3">
                <SettingsIcon className="w-4 h-4" /> إعدادات الحساب
              </button>
              <div className="h-px bg-slate-50 my-1"></div>
              <button onClick={() => { setIsLoggedIn(false); setView('landing'); setShowProfileMenu(false); }} className="w-full text-right px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-3">
                <LogoutIcon className="w-4 h-4" /> تسجيل خروج
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  </nav>
);

const Footer = ({ setView }: any) => (
  <footer className="bg-slate-900 text-white py-20 px-6 mt-auto">
    <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-12 text-right" dir="rtl">
      <div className="col-span-2 md:col-span-1">
        <div className="flex items-center gap-3 mb-6">
          <LogoIcon />
          <span className="text-2xl font-black tracking-tighter">SPEC</span>
        </div>
        <p className="text-slate-400 text-xs font-bold leading-relaxed">
          نحن نعيد تعريف الإبداع الرقمي من خلال أدوات مدعومة بالذكاء الاصطناعي تمكنك من تحويل الأفكار إلى واقع في ثوانٍ.
        </p>
      </div>
      <div>
        <h4 className="font-black text-sm mb-6 text-slate-200">المنتجات</h4>
        <ul className="space-y-4 text-xs font-bold text-slate-400">
          <li><button onClick={() => setView('generate-path')} className="hover:text-indigo-400 transition-colors">عروض تقديمية AI</button></li>
          <li><button onClick={() => setView('paste-text-path')} className="hover:text-indigo-400 transition-colors">تحويل النصوص</button></li>
          <li><button className="hover:text-indigo-400 transition-colors">مواقع ويب ذكية</button></li>
          <li><button className="hover:text-indigo-400 transition-colors">تحليل المستندات</button></li>
        </ul>
      </div>
      <div>
        <h4 className="font-black text-sm mb-6 text-slate-200">الشركة</h4>
        <ul className="space-y-4 text-xs font-bold text-slate-400">
          <li><button onClick={() => setView('about')} className="hover:text-indigo-400 transition-colors">عن المنصة</button></li>
          <li><button className="hover:text-indigo-400 transition-colors">الوظائف</button></li>
          <li><button className="hover:text-indigo-400 transition-colors">المدونة</button></li>
          <li><button className="hover:text-indigo-400 transition-colors">تواصل معنا</button></li>
        </ul>
      </div>
      <div>
        <h4 className="font-black text-sm mb-6 text-slate-200">الدعم</h4>
        <ul className="space-y-4 text-xs font-bold text-slate-400">
          <li><button className="hover:text-indigo-400 transition-colors">مركز المساعدة</button></li>
          <li><button onClick={() => setView('pricing')} className="hover:text-indigo-400 transition-colors">خطط الأسعار</button></li>
          <li><button className="hover:text-indigo-400 transition-colors">الأسئلة الشائعة</button></li>
          <li><button className="hover:text-indigo-400 transition-colors">مجتمع المبدعين</button></li>
        </ul>
      </div>
      <div>
        <h4 className="font-black text-sm mb-6 text-slate-200">قانوني</h4>
        <ul className="space-y-4 text-xs font-bold text-slate-400">
          <li><button onClick={() => setView('legal')} className="hover:text-indigo-400 transition-colors">سياسة الخصوصية</button></li>
          <li><button onClick={() => setView('legal')} className="hover:text-indigo-400 transition-colors">شروط الاستخدام</button></li>
          <li><button className="hover:text-indigo-400 transition-colors">ملفات الارتباط</button></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
      <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase">© {new Date().getFullYear()} SPEC STUDIO. ALL RIGHTS RESERVED.</p>
      <div className="flex gap-6 text-slate-500">
        {/* Social Icons Placeholder */}
        <span className="text-xs font-bold">X</span>
        <span className="text-xs font-bold">LinkedIn</span>
        <span className="text-xs font-bold">Instagram</span>
      </div>
    </div>
  </footer>
);

const LandingPage = ({ setView, isLoggedIn }: any) => (
  <div className="animate-slide-up flex flex-col min-h-screen">
    <div className="pt-48 pb-32 px-6 max-w-7xl mx-auto text-center">
      <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase mb-10">
        <SparklesIcon className="w-3 h-3" /> النسخة التجريبية 3.0 متوفرة الآن
      </div>
      <h1 className="text-6xl md:text-9xl font-black mb-10 text-indigo-950 tracking-tighter leading-none">
        صمم بذكاء، <br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">بسرعة تفكيرك</span>
      </h1>
      <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-16 leading-relaxed font-medium">
        حول أفكارك، نصوصك، وبياناتك إلى عروض تقديمية ومستندات احترافية في ثوانٍ معدودة باستخدام أقوى تقنيات الذكاء الاصطناعي.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-6">
        <button onClick={() => setView(isLoggedIn ? 'creation-options' : 'signup')} className="bg-indigo-900 text-white px-12 py-5 rounded-full text-lg font-black shadow-2xl hover:scale-105 transition-transform">ابدأ رحلتك الآن</button>
        <button onClick={() => setView('about')} className="bg-white border-2 border-slate-100 text-slate-600 px-12 py-5 rounded-full text-lg font-black hover:bg-slate-50 transition-colors">تعرف على المزيد</button>
      </div>
    </div>

    {/* Features Section */}
    <div className="bg-slate-50 py-32 px-6">
      <div className="max-w-7xl mx-auto text-right" dir="rtl">
        <h2 className="text-4xl font-black text-indigo-950 mb-16 tracking-tighter">لماذا يختار المبدعون SPEC؟</h2>
        <div className="grid md:grid-cols-3 gap-10">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl shadow-indigo-100">
              <SparklesIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4">ذكاء اصطناعي تفاعلي</h3>
            <p className="text-slate-500 font-bold text-sm leading-relaxed">
              نماذجنا لا تولد المحتوى فحسب، بل تفهم السياق وتطبق قواعد التصميم الاحترافية التي تحددها بنفسك.
            </p>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl shadow-purple-100">
              <LogoutIcon className="w-8 h-8 rotate-180" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4">تحويل فوري للنصوص</h3>
            <p className="text-slate-500 font-bold text-sm leading-relaxed">
              الصق ملاحظاتك، مذكراتك، أو حتى جداول البيانات، وشاهدها وهي تتحول إلى عروض بصرية مذهلة في لحظات.
            </p>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="w-14 h-14 bg-indigo-900 rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl shadow-indigo-900/10">
              <SitesIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4">تحكم كامل في البيانات</h3>
            <p className="text-slate-500 font-bold text-sm leading-relaxed">
              خصوصيتك هي أولويتنا. نحن نوفر لك أدوات كاملة للتحكم في كيفية استخدام بياناتك ومشاركتها مع نماذجنا.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DashboardView = ({ projects, setView, setPastedText }: any) => (
  <div className="flex flex-col h-screen bg-[#fdfdfd] pt-16 animate-slide-up print:hidden overflow-hidden">
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-64 border-l border-slate-100 flex flex-col p-6 shrink-0 bg-slate-50/30">
        <nav className="space-y-1 mt-6 text-right" dir="rtl">
          <SidebarItem icon={<HomeIcon />} label="المشاريع" active onClick={() => setView('dashboard')} />
          <SidebarItem icon={<SparklesIcon />} label="قوالب مميزة" />
          <SidebarItem icon={<SitesIcon />} label="ملفاتي" />
          <div className="pt-6 mt-6 border-t border-slate-100">
            <SidebarItem icon={<SettingsIcon />} label="إعدادات الحساب" onClick={() => setView('settings')} />
          </div>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-12">
        <div className="flex justify-between items-center mb-12 text-right" dir="rtl">
          <h1 className="text-3xl font-black text-slate-900">مشاريعك الأخيرة</h1>
          <button onClick={() => setView('creation-options')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">مشروع جديد</button>
        </div>
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100">
             <LogoIcon className="w-16 h-16 opacity-10 grayscale mb-6" />
             <p className="text-slate-400 font-black">لا توجد مشاريع بعد. ابدأ أول مشروع لك الآن!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {projects.map((p: any) => (
              <div key={p.id} className="group cursor-pointer" onClick={() => { setPastedText(p.title); setView('paste-text-path'); }}>
                <div className="aspect-video rounded-3xl overflow-hidden border-2 border-slate-100 bg-white shadow-sm group-hover:shadow-xl transition-all relative">
                  <img src={p.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all"></div>
                </div>
                <h3 className="mt-4 font-black text-slate-800 text-right px-1">{p.title}</h3>
                <p className="text-[10px] text-slate-400 text-right px-1 font-bold">{new Date(p.timestamp).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  </div>
);

const AuthView = ({ mode, setIsLoggedIn, setView }: any) => (
  <div className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-6 animate-slide-up bg-slate-50/30 min-h-screen">
    <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 text-right" dir="rtl">
      <h2 className="text-3xl font-black text-indigo-950 mb-2">{mode === 'login' ? 'مرحباً بعودتك' : 'انضم إلينا اليوم'}</h2>
      <p className="text-slate-400 font-bold mb-8 text-sm">{mode === 'login' ? 'سجل دخولك لمتابعة مشاريعك الذكية' : 'ابدأ رحلة الإبداع مع SPEC Studio'}</p>
      <div className="space-y-4 mb-8">
        <input type="email" placeholder="البريد الإلكتروني" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500 font-bold" />
        <input type="password" placeholder="كلمة المرور" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500 font-bold" />
      </div>
      <button 
        onClick={() => { setIsLoggedIn(true); setView('dashboard'); }}
        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 mb-6"
      >
        {mode === 'login' ? 'دخول' : 'إنشاء حساب'}
      </button>
      <button className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        الدخول بواسطة Google
      </button>
    </div>
  </div>
);

const CreationOptions = ({ setContentType, setView }: any) => (
  <div className="pt-32 pb-32 px-6 max-w-6xl mx-auto animate-slide-up min-h-screen">
    <div className="text-center mb-16 text-right" dir="rtl">
      <h1 className="text-4xl font-black text-indigo-950 mb-4 tracking-tighter">كيف تود أن تبدأ اليوم؟</h1>
      <p className="text-slate-500 font-bold">اختر الطريقة الأنسب لتحويل أفكارك إلى محتوى</p>
    </div>
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <OptionCard 
        title="توليد ذكي (Pure AI)" 
        desc="صف فكرتك وسنقوم بتوليد المحتوى والتصميم من الصفر"
        image="https://images.unsplash.com/photo-1675271591211-126ad94e495d?w=800"
        tag="NEW"
        onClick={() => { setContentType('presentation'); setView('generate-path'); }}
      />
      <OptionCard 
        title="تحويل النص (Paste Text)" 
        desc="لصق مذكراتك أو ملفاتك وسنقوم بتنظيمها وتصميمها"
        image="https://images.unsplash.com/photo-1542435503-956c469947f6?w=800"
        onClick={() => { setContentType('document'); setView('paste-text-path'); }}
      />
    </div>
  </div>
);

const PromptEditorView = ({ mode, prompt, setPrompt, pastedText, setPastedText, additionalInstructions, setAdditionalInstructions, handleShufflePrompt, setView, transformationMode, setTransformationMode, tone, setTone, writeFor, setWriteFor, cardCount, setCardCount, handleGenerate, loading, theme, setTheme, designMode, setDesignMode }: any) => {
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const instructionsRef = useRef<HTMLTextAreaElement>(null);
  const writeForRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    adjustHeight(contentRef.current);
    adjustHeight(instructionsRef.current);
    adjustHeight(writeForRef.current);
  }, [mode, prompt, pastedText, additionalInstructions, writeFor]);

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden animate-slide-up">
      <nav className="h-14 border-b border-slate-100 px-6 flex items-center justify-between shrink-0 bg-white mt-16 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('creation-options')} className="text-xs font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-2">
            <ArrowLeftIcon /> العودة
          </button>
          <div className="h-4 w-px bg-slate-100"></div>
          <span className="text-sm font-black text-indigo-950 uppercase tracking-tighter">
            {mode === 'generate' ? 'توليد ذكي (Pure AI)' : 'لصق وتحويل النص (Paste & Transform)'}
          </span>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Settings */}
        <aside className="w-[320px] border-r border-slate-100 flex flex-col bg-slate-50/20 overflow-y-auto no-scrollbar p-6 space-y-8" dir="ltr">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><SitesIcon /> Settings</h3>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-bold text-indigo-950 flex items-center gap-2"><HomeIcon /> Text Transformation</label>
              <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                {['generate', 'condense', 'preserve'].map(m => (
                  <button key={m} onClick={() => setTransformationMode(m as any)} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${transformationMode === m ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}>
                    {m === 'generate' ? 'توليد' : m === 'condense' ? 'تلخيص' : 'حفظ'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Write for...</span>
              <textarea 
                ref={writeForRef} 
                value={writeFor} 
                onChange={e => { setWriteFor(e.target.value); }} 
                className="w-full p-3.5 text-xs border border-slate-200 rounded-2xl bg-white outline-none focus:border-indigo-500 resize-none font-medium text-slate-700 leading-relaxed shadow-sm transition-all" 
              />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Tone</span>
              <input 
                type="text" 
                value={tone} 
                onChange={e => setTone(e.target.value)} 
                className="w-full p-3.5 border border-slate-200 rounded-2xl bg-white outline-none focus:border-indigo-500 font-bold text-slate-700 shadow-sm" 
              />
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-indigo-950 flex items-center gap-2"><SharedIcon /> Theme & Visuals</h3>
            <div className="grid grid-cols-2 gap-2">
              {['Falcon', 'Modern', 'Breeze', 'Pure'].map(t => (
                <div key={t} onClick={() => setTheme(t)} className={`p-4 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all ${theme.includes(t) ? 'border-indigo-600 bg-indigo-50 font-black' : 'border-slate-100 bg-white hover:border-slate-300'}`}>
                  <span className="text-[10px] text-slate-600">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-slate-50/5 relative overflow-y-auto no-scrollbar">
          <div className="h-14 border-b border-slate-100 px-10 flex items-center justify-between bg-white/70 backdrop-blur-sm sticky top-0 z-10">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المحتوى الرئيسي</h3>
            <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
              <button onClick={() => setDesignMode('freeform')} className={`px-4 py-1 text-[10px] font-bold rounded-md transition-all ${designMode === 'freeform' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400'}`}>حر (Freeform)</button>
              <button onClick={() => setDesignMode('cardbycard')} className={`px-4 py-1 text-[10px] font-bold rounded-md transition-all ${designMode === 'cardbycard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400'}`}>شريحة بشريحة</button>
            </div>
          </div>

          <div className="flex-1 p-12 flex flex-col items-center">
            <div className="max-w-4xl w-full bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col min-h-[600px] overflow-visible pb-10 relative">
              {mode === 'paste' ? (
                <div className="p-10 pb-6 border-b border-slate-50 text-center space-y-2">
                  <h2 className="text-4xl font-black text-indigo-950 tracking-tighter">لصق المحتوى</h2>
                  <p className="text-sm font-bold text-slate-400">حول مذكراتك وبياناتك إلى مشروع احترافي في ثوانٍ</p>
                </div>
              ) : (
                <div className="p-10 pb-6 border-b border-slate-50 text-center space-y-2">
                  <h2 className="text-4xl font-black text-indigo-950 tracking-tighter">ما هي فكرتك؟</h2>
                  <p className="text-sm font-bold text-slate-400">صف لنا المشروع الذي تريد إنشاءه بالذكاء الاصطناعي</p>
                </div>
              )}
              
              <textarea 
                ref={contentRef}
                value={mode === 'paste' ? pastedText : prompt}
                onChange={e => {
                  if (mode === 'paste') setPastedText(e.target.value);
                  else setPrompt(e.target.value);
                }}
                placeholder={mode === 'paste' ? "اكتب أو الصق مذكراتك، ملفات إكسل، نصوص مطولة، أو أي تفاصيل هنا..." : "أدخل وصفاً دقيقاً للمشروع، مثلاً: خطة تسويق لمنتج جديد في دبي..."}
                className="w-full p-12 text-right outline-none text-lg font-bold resize-none leading-relaxed text-slate-800 bg-white placeholder-slate-200 min-h-[400px] overflow-hidden"
                dir="rtl"
              />
              
              <div className="h-14 px-10 flex items-center justify-between text-slate-300 border-t border-slate-50 bg-slate-50/20 rounded-b-[3rem]">
                {mode === 'generate' && (
                  <button onClick={handleShufflePrompt} className="text-xs font-black text-indigo-600 flex items-center gap-2 hover:bg-indigo-100 px-4 py-2 rounded-2xl transition-all">
                    <SparklesIcon className="w-4 h-4" /> اقتراح أفكار
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm text-slate-500">
                    {(mode === 'paste' ? pastedText : prompt).length} / 100,000
                  </span>
                  <InfoIcon />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="h-24 bg-white/80 backdrop-blur-md border-t border-slate-100 px-12 flex items-center justify-between sticky bottom-0 z-30 shadow-2xl">
            <div className="flex items-center gap-3 text-sm font-black text-slate-500">
              <SparklesIcon className="text-indigo-600 scale-125" />
              <span>20,000 رصيد متبقي</span>
            </div>
            
            <div className="flex items-center gap-10">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1.5 shadow-inner">
                <button onClick={() => setCardCount(Math.max(1, cardCount - 1))} className="w-12 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">－</button>
                <div className="w-28 h-10 bg-white rounded-xl flex items-center justify-center text-xs font-black text-indigo-950 border border-slate-100 shadow-sm">
                  {cardCount} شريحة
                </div>
                <button onClick={() => setCardCount(cardCount + 1)} className="w-12 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">＋</button>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-[1.5rem] font-black text-base shadow-2xl shadow-indigo-200 flex items-center gap-4 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></div> : <SparklesIcon className="w-5 h-5" />}
                توليد المشروع
              </button>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-[360px] border-l border-slate-100 flex flex-col bg-white overflow-y-auto no-scrollbar">
          <div className="h-14 border-b border-slate-100 px-8 flex items-center justify-between bg-white sticky top-0 z-10">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">التعليمات الإضافية</h3>
          </div>
          <div className="p-8">
            <label className="text-[10px] font-black text-slate-300 uppercase block mb-3">قواعد التصميم والبيانات</label>
            <textarea 
              ref={instructionsRef}
              value={additionalInstructions}
              onChange={e => { setAdditionalInstructions(e.target.value); }}
              placeholder="أدخل أي ملاحظات إضافية هنا..."
              className="w-full p-6 text-xs bg-slate-50/50 rounded-3xl border border-slate-100 outline-none font-bold leading-relaxed text-slate-700 focus:border-indigo-200 resize-none transition-all overflow-hidden"
              dir="rtl"
            />
          </div>
        </aside>
      </div>
    </div>
  );
};

const StudioView = ({ loading, generatedContent, pastedText, prompt, exportToDocx, setView }: any) => (
  <div className="min-h-screen bg-white pt-20 animate-slide-up flex flex-col">
    <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50 pb-32">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full py-20">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
             <SparklesIcon className="w-10 h-10 text-indigo-600" />
          </div>
          <p className="text-indigo-950 font-black text-2xl tracking-tighter animate-pulse">جاري إنشاء مشروعك المخصص...</p>
          <p className="text-slate-400 mt-3 font-bold">نطبق الآن القواعد التصميمية والتعليمات المحددة</p>
        </div>
      ) : generatedContent ? (
        <div className="max-w-4xl mx-auto bg-white p-16 rounded-[4rem] shadow-2xl relative text-right border border-slate-100" dir="rtl">
          <h2 className="text-4xl font-black mb-10 border-b pb-6 flex items-center gap-4 text-indigo-950">
            <SparklesIcon className="text-indigo-600 w-8 h-8" /> 
            {(pastedText || prompt).substring(0, 50)}
          </h2>
          <div className="prose prose-slate prose-xl max-w-none whitespace-pre-wrap font-sans text-slate-800 leading-relaxed text-justify">
            {generatedContent}
          </div>
          <div className="mt-16 flex items-center gap-4 border-t pt-10 print:hidden">
            <button onClick={exportToDocx} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">تصدير Word</button>
            <button onClick={() => window.print()} className="bg-slate-100 text-slate-700 px-10 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all">طباعة / PDF</button>
            <button onClick={() => setView('dashboard')} className="mr-auto text-slate-400 font-bold hover:text-indigo-600">العودة للوحة التحكم</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
           <h3 className="text-2xl font-black text-slate-300 mb-6 tracking-tighter">لا يوجد محتوى لعرضه حالياً</h3>
           <button onClick={() => setView('creation-options')} className="bg-indigo-600 text-white px-10 py-4 rounded-3xl font-black shadow-xl">ابدأ بإنشاء مشروعك الأول</button>
        </div>
      )}
    </div>
  </div>
);

const SettingsView = ({ activeTab, setActiveTab, userProfile, setUserProfile }: any) => (
  <div className="pt-24 pb-32 px-6 max-w-5xl mx-auto animate-slide-up min-h-screen">
    <div className="flex flex-col md:flex-row gap-10" dir="rtl">
      <aside className="w-full md:w-64 space-y-2">
        <h1 className="text-2xl font-black mb-6 text-indigo-950 px-3">الإعدادات</h1>
        <button onClick={() => setActiveTab('info')} className={`w-full text-right px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${activeTab === 'info' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
           <UserIcon /> المعلومات الأساسية
        </button>
        <button onClick={() => setActiveTab('security')} className={`w-full text-right px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${activeTab === 'security' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
           <LogoutIcon className="rotate-180" /> الأمان والدخول
        </button>
        <button onClick={() => setActiveTab('data')} className={`w-full text-right px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${activeTab === 'data' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
           <SitesIcon /> التحكم في البيانات
        </button>
      </aside>

      <main className="flex-1 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
        {activeTab === 'info' && (
          <div className="space-y-8 animate-slide-up">
            <div className="flex items-center gap-6 pb-6 border-b border-slate-50">
              <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-slate-300">
                <UserIcon className="w-12 h-12" />
              </div>
              <button className="bg-indigo-50 text-indigo-600 px-5 py-2 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all">تغيير الصورة</button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الاسم الأول</label>
                <input type="text" value={userProfile.firstName} onChange={e => setUserProfile({...userProfile, firstName: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:border-indigo-500 font-bold text-slate-700" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اسم العائلة</label>
                <input type="text" value={userProfile.lastName} onChange={e => setUserProfile({...userProfile, lastName: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:border-indigo-500 font-bold text-slate-700" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">البريد الإلكتروني</label>
              <input type="email" value={userProfile.email} disabled className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-100 outline-none font-bold text-slate-400 cursor-not-allowed" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اللغة الافتراضية</label>
              <select value={userProfile.language} onChange={e => setUserProfile({...userProfile, language: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none font-bold text-slate-700">
                <option>العربية</option>
                <option>English</option>
              </select>
            </div>
            
            <button className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 mt-4">حفظ التعديلات</button>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 animate-slide-up">
            <h3 className="text-lg font-black text-indigo-950 mb-6">تغيير كلمة المرور</h3>
            <div className="space-y-4">
              <input type="password" placeholder="كلمة المرور الحالية" className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500" />
              <input type="password" placeholder="كلمة المرور الجديدة" className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500" />
            </div>
            <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm">تحديث كلمة المرور</button>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-8 animate-slide-up">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
              <div className="max-w-sm">
                <h4 className="font-bold text-indigo-950 mb-1">تحسين خدمات SPEC</h4>
                <p className="text-xs text-slate-500 leading-relaxed">السماح باستخدام محتواي المولد لتطوير ميزات الذكاء الاصطناعي في المنصة بشكل مجهول.</p>
              </div>
              <button 
                onClick={() => setUserProfile({...userProfile, allowImprove: !userProfile.allowImprove})}
                className={`w-14 h-8 rounded-full transition-all relative ${userProfile.allowImprove ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${userProfile.allowImprove ? 'right-7' : 'right-1'}`}></div>
              </button>
            </div>
            <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
              <h4 className="font-bold text-red-900 mb-2">منطقة الخطر</h4>
              <p className="text-xs text-red-600 mb-4">حذف الحساب سيؤدي إلى مسح جميع مشاريعك وبياناتك بشكل نهائي ولا يمكن التراجع عنه.</p>
              <button className="text-xs font-black text-red-600 hover:underline">حذف الحساب نهائياً</button>
            </div>
          </div>
        )}
      </main>
    </div>
  </div>
);

const AboutPage = () => (
  <div className="animate-slide-up flex flex-col min-h-screen pt-48 pb-32">
    <div className="max-w-4xl mx-auto px-6 text-right" dir="rtl">
      <h1 className="text-5xl font-black mb-10 text-indigo-950 tracking-tighter">عن منصة SPEC</h1>
      <p className="text-xl text-slate-600 leading-relaxed mb-8 font-medium">
        SPEC هي منصة إبداعية متطورة تهدف إلى جسر الفجوة بين الفكرة والتنفيذ البصري. نحن نؤمن بأن كل شخص لديه قصة ليرويها، والمهارات التقنية لا ينبغي أن تكون عائقاً أمام التميز.
      </p>
      <div className="grid md:grid-cols-2 gap-10 mt-20">
        <div>
          <h3 className="text-2xl font-black text-indigo-600 mb-4">رؤيتنا</h3>
          <p className="text-slate-500 font-bold leading-relaxed">أن نصبح الاستوديو الرقمي الأول عالمياً الذي يعتمد بالكامل على الذكاء الاصطناعي لتمكين المبدعين والشركات.</p>
        </div>
        <div>
          <h3 className="text-2xl font-black text-indigo-600 mb-4">قيمنا</h3>
          <p className="text-slate-500 font-bold leading-relaxed">الخصوصية، الابتكار المستمر، والبساطة في الاستخدام هي الأعمدة التي نبني عليها كل ميزة جديدة.</p>
        </div>
      </div>
    </div>
  </div>
);

const PricingPage = () => (
  <div className="animate-slide-up flex flex-col min-h-screen pt-48 pb-32">
    <div className="max-w-7xl mx-auto px-6 text-center">
      <h1 className="text-5xl font-black mb-16 tracking-tighter">اختر الخطة التي تناسب إبداعك</h1>
      <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
        <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl text-right flex flex-col" dir="rtl">
          <h2 className="text-2xl font-black mb-2">الخطة المجانية</h2>
          <div className="text-4xl font-black mb-8 text-slate-900 tracking-tighter">$0<span className="text-lg text-slate-400">/للأبد</span></div>
          <ul className="space-y-4 mb-10 flex-1">
            <li className="font-bold text-slate-500">✦ إنشاء حتى 5 مشاريع</li>
            <li className="font-bold text-slate-500">✦ وصول للميزات الأساسية</li>
            <li className="font-bold text-slate-500">✦ تصدير بصيغة PDF فقط</li>
          </ul>
          <button className="w-full py-5 rounded-2xl bg-slate-100 text-slate-600 font-black text-lg hover:bg-slate-200 transition-all">ابدأ الآن</button>
        </div>
        <div className="bg-white p-12 rounded-[3rem] border-4 border-indigo-600 shadow-2xl relative text-right flex flex-col scale-105" dir="rtl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">الأكثر طلباً</div>
          <h2 className="text-3xl font-black mb-2">احترافي (Pro)</h2>
          <div className="text-5xl font-black mb-8 text-indigo-600 tracking-tighter">$25<span className="text-lg text-slate-400">/شهر</span></div>
          <ul className="space-y-4 mb-10 flex-1">
            <li className="font-bold text-slate-600">✦ إنشاء غير محدود للمشاريع</li>
            <li className="font-bold text-slate-600">✦ الوصول لأحدث نماذج SPEC AI</li>
            <li className="font-bold text-slate-600">✦ تصدير بجميع الصيغ (DOCX, PDF)</li>
            <li className="font-bold text-slate-600">✦ دعم فني مخصص ٢٤/٧</li>
          </ul>
          <button className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-xl hover:bg-indigo-700 transition-all">اشترك الآن</button>
        </div>
        <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl text-right flex flex-col" dir="rtl">
          <h2 className="text-2xl font-black mb-2">مؤسسات</h2>
          <div className="text-3xl font-black mb-8 text-slate-900 tracking-tighter">تواصل معنا</div>
          <ul className="space-y-4 mb-10 flex-1">
            <li className="font-bold text-slate-500">✦ أدوات إدارة الفريق</li>
            <li className="font-bold text-slate-500">✦ هوية بصرية مخصصة للشركة</li>
            <li className="font-bold text-slate-500">✦ أمان وحماية بيانات متقدمة</li>
          </ul>
          <button className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-lg hover:bg-black transition-all">تواصل مع المبيعات</button>
        </div>
      </div>
    </div>
  </div>
);

// --- Main App Component ---

const App = () => {
  const [view, setView] = useState<View>('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contentType, setContentType] = useState<ContentType>('presentation');
  const [cardCount, setCardCount] = useState(70);
  const [designMode, setDesignMode] = useState<'freeform' | 'cardbycard'>('freeform');
  const [prompt, setPrompt] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [transformationMode, setTransformationMode] = useState<'generate' | 'summarize' | 'preserve'>('generate');
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'data'>('info');

  // User Profile
  const [userProfile, setUserProfile] = useState({
    firstName: "طارق",
    lastName: "ملفي",
    email: "tareq@example.com",
    company: "Falcon Core",
    language: "العربية",
    allowImprove: true
  });

  // Settings
  const [tone, setTone] = useState("رسمي، محترف، استشاري");
  const [writeFor, setWriteFor] = useState("صانعي قرار تنفيذيين ومدراء تطوير أعمال ومسؤولين تسويق في شركات ومؤسسات ساعية لتوسع رقمي واستراتيجي");
  const [theme, setTheme] = useState("Falcon Core theme");
  const [additionalInstructions, setAdditionalInstructions] = useState(`يمكنك وضع قواعد تصميم خاصة هنا، على سبيل المثال:
- استخدام ألوان العلامة التجارية الخاصة بالشركة.
- تجنب استخدام الصور البشرية والاعتماد على الأشكال التجريدية.`);

  useEffect(() => {
    const saved = localStorage.getItem('spec_projects');
    if (saved) setProjects(JSON.parse(saved));
    // Reset view to top when changing
    window.scrollTo(0, 0);
  }, [view]);

  const handleShufflePrompt = () => {
    const suggestions = [
      "خطة استراتيجية لشركة ناشئة في مجال التكنولوجيا المالية بمناطق الخليج",
      "عرض تقديمي عن مستقبل الذكاء الاصطناعي في التعليم العالي",
      "مقال تحليلي عن تطور التجارة الإلكترونية في السعودية لعام ٢٠٢٤",
      "تقرير مفصل عن الاستدامة البيئية في المشاريع العمرانية الكبرى"
    ];
    const random = suggestions[Math.floor(Math.random() * suggestions.length)];
    if (view === 'generate-path') setPrompt(random);
    else if (view === 'paste-text-path') setPastedText(random);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setView('studio');
    try {
      if (!(await (window as any).aistudio.hasSelectedApiKey())) {
        await (window as any).aistudio.openSelectKey();
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a ${contentType} based on: ${pastedText || prompt}. Mode: ${transformationMode}. Tone: ${tone}. Target: ${writeFor}. Instructions: ${additionalInstructions}`,
        config: { thinkingConfig: { thinkingBudget: 2000 } }
      });
      setGeneratedContent(response.text || "No content generated.");
      
      const newProj = {
        id: Math.random().toString(36).substring(7),
        title: (pastedText || prompt).substring(0, 40) || "مشروع جديد",
        thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
        type: contentType,
        timestamp: Date.now()
      };
      const updated = [newProj, ...projects];
      setProjects(updated);
      localStorage.setItem('spec_projects', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
      alert("Error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const exportToDocx = () => {
    if (!generatedContent) return;
    const doc = new Document({
      sections: [{
        children: generatedContent.split('\n').map(l => new Paragraph({ children: [new TextRun({ text: l })], alignment: AlignmentType.RIGHT, bidirectional: true }))
      }]
    });
    Packer.toBlob(doc).then(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `spec-export-${Date.now()}.docx`;
      link.click();
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <Header 
        isLoggedIn={isLoggedIn} 
        userProfile={userProfile} 
        view={view} 
        setView={setView} 
        showProfileMenu={showProfileMenu} 
        setShowProfileMenu={setShowProfileMenu}
        setIsLoggedIn={setIsLoggedIn}
      />
      
      <main className="flex-1 flex flex-col">
        {view === 'landing' && <LandingPage setView={setView} isLoggedIn={isLoggedIn} />}
        {view === 'login' && <AuthView mode="login" setIsLoggedIn={setIsLoggedIn} setView={setView} />}
        {view === 'signup' && <AuthView mode="signup" setIsLoggedIn={setIsLoggedIn} setView={setView} />}
        {view === 'dashboard' && <DashboardView projects={projects} setView={setView} setPastedText={setPastedText} />}
        {view === 'creation-options' && <CreationOptions setContentType={setContentType} setView={setView} />}
        {view === 'generate-path' && (
          <PromptEditorView 
            mode="generate" prompt={prompt} setPrompt={setPrompt}
            additionalInstructions={additionalInstructions} setAdditionalInstructions={setAdditionalInstructions}
            handleShufflePrompt={handleShufflePrompt} setView={setView}
            transformationMode={transformationMode} setTransformationMode={setTransformationMode}
            tone={tone} setTone={setTone} writeFor={writeFor} setWriteFor={setWriteFor}
            cardCount={cardCount} setCardCount={setCardCount}
            handleGenerate={handleGenerate} loading={loading}
            theme={theme} setTheme={setTheme} designMode={designMode} setDesignMode={setDesignMode}
          />
        )}
        {view === 'paste-text-path' && (
          <PromptEditorView 
            mode="paste" pastedText={pastedText} setPastedText={setPastedText}
            additionalInstructions={additionalInstructions} setAdditionalInstructions={setAdditionalInstructions}
            handleShufflePrompt={handleShufflePrompt} setView={setView}
            transformationMode={transformationMode} setTransformationMode={setTransformationMode}
            tone={tone} setTone={setTone} writeFor={writeFor} setWriteFor={setWriteFor}
            cardCount={cardCount} setCardCount={setCardCount}
            handleGenerate={handleGenerate} loading={loading}
            theme={theme} setTheme={setTheme} designMode={designMode} setDesignMode={setDesignMode}
          />
        )}
        {view === 'studio' && (
          <StudioView 
            loading={loading} generatedContent={generatedContent}
            pastedText={pastedText} prompt={prompt}
            exportToDocx={exportToDocx} setView={setView}
          />
        )}
        {view === 'settings' && <SettingsView activeTab={activeTab} setActiveTab={setActiveTab} userProfile={userProfile} setUserProfile={setUserProfile} />}
        {view === 'about' && <AboutPage />}
        {view === 'pricing' && <PricingPage />}
        {view === 'legal' && <div className="pt-48 pb-32 text-center" dir="rtl"><h1 className="text-4xl font-black mb-10">معلومات قانونية</h1><p className="text-slate-500 font-bold">سياسة الخصوصية وشروط الاستخدام قيد المراجعة.</p></div>}
      </main>

      <Footer setView={setView} />
    </div>
  );
};

const rootElement = document.getElementById("root");
if (rootElement) {
    createRoot(rootElement).render(<App />);
}
