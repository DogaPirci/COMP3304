import React, { useState, useRef, useEffect } from 'react';
import { 
  Trash2,
  LayoutGrid, 
  Sparkles, 
  ShoppingBag, 
  Plus, 
  ChevronRight, 
  Search, 
  Bell, 
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Upload,
  Camera,
  Filter,
  X,
  ArrowUpRight,
  Loader2,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

// Types
type Category = "Outerwear" | "Tops" | "Bottoms" | "Shoes" | "Accessories";

interface AppNotification {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  timestamp: Date;
  read: boolean;
}

// Configure your base API URL here. 
// Uses environment variable if available, otherwise defaults to local Express server.
const API_BASE_URL = ''; // Same-origin relative path for Docker deployment

interface ClothingItem {
  id: string;
  name: string;
  category: Category;
  image: string;
  confidence: string;
}

export interface OutfitComponent {
  category: Category;
  matchedClosetItemId: string | null;
  missingItemQuery: string | null;
}

// Initial Closet Data (Starts Empty per user request)
const initialCloset: ClothingItem[] = [];

const categories: Category[] = ["Outerwear", "Tops", "Bottoms", "Shoes", "Accessories"];

type Tab = "My Closet" | "Concept Stylist" | "Smart Commerce";

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result?.toString().split(',')[1] || '');
    reader.onerror = (error) => reject(error);
  });
};

function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Kayıt başarılı! Lütfen giriş yapın.");
        setMode('login');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        alert("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!");
        setMode('login');
      }
    } catch (err: any) {
      alert(err.error_description || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-900/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="w-full max-w-md p-10 bg-[#111] rounded-3xl border border-white/5 relative z-10 shadow-2xl">
        <h1 className="text-4xl font-black tracking-tighter uppercase italic text-center mb-2">VogueVault</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-red-600 font-black text-center mb-10">
          {mode === 'forgot' ? 'Password Recovery' : 'Digital Twin Access'}
        </p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-white/50 block mb-2">Email Address</label>
            <input 
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-red-600 outline-none transition"
            />
          </div>
          {mode !== 'forgot' && (
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-white/50 block mb-2">Password</label>
              <input 
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-red-600 outline-none transition"
              />
            </div>
          )}
          <button 
            type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl p-4 text-sm font-black uppercase tracking-widest transition mt-4"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Enter Vault' : mode === 'register' ? 'Create Vault Account' : 'Send Reset Link'}
          </button>
        </form>

        <div className="flex flex-col gap-3 mt-6 text-center">
          {mode === 'login' ? (
            <>
              <button onClick={() => setMode('forgot')} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition">
                Forgot Password?
              </button>
              <button onClick={() => setMode('register')} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition">
                Need an account? Create one
              </button>
            </>
          ) : (
            <button onClick={() => setMode('login')} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition">
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UpdatePasswordScreen({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        alert("Şifre en az 6 karakter olmalıdır.");
        return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      alert("Şifreniz başarıyla güncellendi!");
      onComplete();
    } catch (err: any) {
      alert(err.error_description || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-900/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="w-full max-w-md p-10 bg-[#111] rounded-3xl border border-white/5 relative z-10 shadow-2xl">
        <h1 className="text-4xl font-black tracking-tighter uppercase italic text-center mb-2">VogueVault</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-red-600 font-black text-center mb-10">Update Your Password</p>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-white/50 block mb-2">New Password</label>
            <input 
              type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-red-600 outline-none transition"
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl p-4 text-sm font-black uppercase tracking-widest transition mt-4"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<'auth' | 'app' | 'update_password'>('auth');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setView(session ? 'app' : 'auth');
      setLoading(false);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setView('update_password');
      } else if (session && view !== 'update_password') {
        setView('app');
      } else if (!session) {
        setView('auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [view]);

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center text-red-600"><Loader2 className="animate-spin" size={40} /></div>;
  
  if (view === 'update_password') return <UpdatePasswordScreen onComplete={() => setView('app')} />;
  return !session ? <AuthScreen /> : <VogueVaultDashboard session={session} />;
}

function VogueVaultDashboard({ session }: { session: Session }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<Tab>("My Closet");
  const [closet, setCloset] = useState<ClothingItem[]>(initialCloset);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inspirationImage, setInspirationImage] = useState<string | null>(null);
  const [generatedOutfits, setGeneratedOutfits] = useState<OutfitComponent[][] | null>(null);
  const [missingQueries, setMissingQueries] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<Category | "All">("All");
  const [selectedDressCode, setSelectedDressCode] = useState("Avant-Garde");
  const [pendingCorrectionFile, setPendingCorrectionFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // NOTIFICATION SYSTEM
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const addNotification = (type: AppNotification['type'], message: string) => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const incrementRequestCount = () => {
    setRequestCount(prev => {
      const newCount = prev + 1;
      if (newCount === 10) {
        addNotification('warning', 'Token usage is high. You are approaching the free tier limit.');
      }
      return newCount;
    });
    // Reset count every minute
    setTimeout(() => {
      setRequestCount(prev => Math.max(0, prev - 1));
    }, 60000);
  };

  const uploadImageToBackend = async (file: File) => {
    try {
      setIsUploading(true);
      const base64Image = await fileToBase64(file);
      
      const response = await fetch(`${API_BASE_URL}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageBase64: base64Image })
      });

      if (!response.ok) {
        if (response.status === 429) {
          setIsRateLimited(true);
          addNotification('error', 'Tokens exhausted! You have reached the Gemini API free tier limit. Please wait a minute.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (response.status === 201) {
        if (isRateLimited) {
          setIsRateLimited(false);
          addNotification('success', 'Tokens renewed! The AI is back online.');
        }
        incrementRequestCount();
        // Successfully classified
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        let publicUrl = URL.createObjectURL(file);

        try {
          const { error: uploadError } = await supabase.storage.from('closet-images').upload(fileName, file);
          if (!uploadError) {
             const { data: urlData } = supabase.storage.from('closet-images').getPublicUrl(fileName);
             publicUrl = urlData.publicUrl;
          } else {
             alert(`Storage Hatası: ${uploadError.message} (bucket: closet-images)`);
          }
        } catch(storageErr: any) { alert(`Hata: ${storageErr.message}`); }

        const confidenceValue = data.item_data.confidence ? `${(data.item_data.confidence * 100).toFixed(0)}%` : "100%";
        const dbItem = {
          user_id: session.user.id,
          name: data.item_data.name || "Curated Box Item",
          category: data.item_data.category as Category,
          image_url: publicUrl,
          confidence: confidenceValue
        };

        const { data: insertedData, error: dbError } = await supabase.from('closet_items').insert(dbItem).select().single();
        
        if (dbError || !insertedData) {
            console.error("Supabase Insert Error:", dbError);
            alert("Veritabanına kaydedilemedi! Geçici olarak ekranda görünecektir.");
            setCloset(prev => [{...dbItem, id: Math.random().toString(36).substring(2, 9), image: publicUrl} as any, ...prev]);
        } else {
            setCloset(prev => [{...insertedData, id: insertedData.id.toString(), image: insertedData.image_url}, ...prev]);
        }
        alert(`Success! Classified as ${data.item_data.category}`);
      } else if (response.status === 200 && data.needsManualCorrection) {
        // Needs manual correction due to low confidence/unknown
        setPendingCorrectionFile(file);
      }
    } catch (error) {
      console.error("Network error during upload:", error);
      alert("Network error: Could not connect to the backend server.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualCorrection = async (category: Category) => {
    if (pendingCorrectionFile) {
      setIsUploading(true);
      const fileExt = pendingCorrectionFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      let publicUrl = URL.createObjectURL(pendingCorrectionFile);

      try {
        const { error: uploadError } = await supabase.storage.from('closet-images').upload(fileName, pendingCorrectionFile);
        if (!uploadError) {
           const { data: urlData } = supabase.storage.from('closet-images').getPublicUrl(fileName);
           publicUrl = urlData.publicUrl;
        } else {
           alert(`Storage Hatası: ${uploadError.message}`);
        }
      } catch(storageErr: any) { alert(`Hata: ${storageErr.message}`); }

      const dbItem = {
        user_id: session.user.id,
        name: "Manually Categorized",
        category,
        image_url: publicUrl,
        confidence: "Manual"
      };

      const { data: insertedData, error: dbError } = await supabase.from('closet_items').insert(dbItem).select().single();
      
      if (!dbError && insertedData) {
         setCloset(prev => [{...insertedData, id: insertedData.id.toString(), image: insertedData.image_url}, ...prev]);
      } else {
         setCloset(prev => [{...dbItem, id: Math.random().toString(36).substring(2, 9), image: publicUrl} as any, ...prev]);
      }
      
      setPendingCorrectionFile(null);
      setIsUploading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // SUPABASE INITIAL FETCH
  useEffect(() => {
    const fetchCloset = async () => {
      try {
        const { data, error } = await supabase.from('closet_items').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (error) {
          console.error("Supabase Fetch Error:", error.message);
          alert("Lütfen Supabase SQL Editor üzerinden 'closet_items' tablosunu oluşturun.");
        } else if (data) {
          setCloset(data.map(item => ({
            ...item,
            id: item.id.toString(),
            image: item.image_url || item.image
          })));
        }
      } catch (err) { }
    };
    fetchCloset();
  }, []);

  const handleUploadItem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadImageToBackend(file);
    }
  };

  const handleInspirationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setInspirationImage(imageUrl);
      setGeneratedOutfits(null);
      setMissingQueries([]);
      setIsGenerating(true);
      
      try {
        const base64 = await fileToBase64(file);
        const closetData = closet.map(i => ({ id: i.id, name: i.name, category: i.category }));
        const response = await fetch(`${API_BASE_URL}/api/inspiration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, dressCode: selectedDressCode, closet: closetData })
        });
        
        if (!response.ok) {
          if (response.status === 429) {
            setIsRateLimited(true);
            addNotification('error', 'Tokens exhausted! AI Outfit generation reached the limit. Please wait.');
          }
          throw new Error("Failed to analyze inspiration via API");
        }
        
        const result = await response.json();
        if (isRateLimited) {
          setIsRateLimited(false);
          addNotification('success', 'Tokens renewed! Style Matcher is back online.');
        }
        incrementRequestCount();
        
        const outfits = result.outfits || [];
        setGeneratedOutfits(outfits.length > 0 ? outfits : null);
        
        if (outfits.length > 0) {
          const missing = outfits[0].filter((c: any) => c.missingItemQuery).map((c: any) => c.missingItemQuery as string);
          setMissingQueries(missing);
        } else {
          setMissingQueries([]);
        }
      } catch (error) {
        console.error("AI Outfit Generation failed:", error);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  return (
    <div className={`flex h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans overflow-hidden relative transition-colors duration-500`}>
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-900/10 dark:bg-red-900/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/5 dark:bg-red-900/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Sidebar */}
      <aside className="w-72 bg-gray-50 dark:bg-[#0A0A0A] border-r border-black/5 dark:border-white/5 flex flex-col p-8 z-20 transition-colors duration-500">
        <div className="mb-12">
          <h1 className="text-2xl font-bold tracking-tighter uppercase italic text-black dark:text-white">VogueVault</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-red-600 font-black mt-1">Digital Twin Intelligence</p>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem 
            icon={<LayoutGrid size={18} />} 
            label="My Closet" 
            active={activeTab === "My Closet"} 
            onClick={() => setActiveTab("My Closet")} 
          />
          <SidebarItem 
            icon={<Sparkles size={18} />} 
            label="Concept Stylist" 
            active={activeTab === "Concept Stylist"} 
            onClick={() => setActiveTab("Concept Stylist")} 
          />
          <SidebarItem 
            icon={<ShoppingBag size={18} />} 
            label="Smart Commerce" 
            active={activeTab === "Smart Commerce"} 
            onClick={() => setActiveTab("Smart Commerce")} 
          />
        </nav>

        <div className="pt-8 border-t border-black/5 dark:border-white/5">
          <div 
             onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
             className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-600/10 transition-colors cursor-pointer group"
             title="Sign Out"
          >
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] shrink-0">
              <User size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate" title={session.user.email}>{session.user.email?.split('@')[0]}</p>
              <p className="text-[10px] text-black/40 dark:text-white/40 uppercase tracking-widest group-hover:text-red-500 transition-colors">Sign Out Vault</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-20 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5 px-10 flex items-center justify-between sticky top-0 z-10 transition-colors duration-500">
          <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-full w-96 border border-black/5 dark:border-white/5 focus-within:border-red-600/50 transition-all">
            <Search size={16} className="text-black/40 dark:text-white/40" />
            <input 
              type="text" 
              placeholder="Search your digital twin (e.g. 'black', 'denim')..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-black/30 dark:placeholder:text-white/30 text-black dark:text-white"
            />
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/60 dark:text-white/60 hover:text-red-500 transition-colors"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setNotifications(prev => prev.map(n => ({...n, read: true})));
                }}
                className={`w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center transition-colors ${showNotifications ? 'text-red-500' : 'text-black/60 dark:text-white/60 hover:text-red-500'}`}
              >
                <Bell size={20} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full border-2 border-white dark:border-[#050505] animate-pulse"></span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-12 right-0 w-80 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/5 dark:bg-white/5">
                      <h4 className="text-xs font-black uppercase tracking-widest italic">Notifications</h4>
                      <button onClick={() => { setNotifications([]); setShowNotifications(false); }} className="text-[10px] font-bold uppercase text-red-500 hover:underline">Clear All</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center space-y-2">
                          <Bell size={24} className="mx-auto text-black/10 dark:text-white/10" />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-black/20 dark:text-white/20">No new alerts</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-4 border-b border-black/5 dark:border-white/5 flex gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              n.type === 'error' ? 'bg-red-600' : 
                              n.type === 'warning' ? 'bg-amber-500' : 
                              n.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                            }`} />
                            <div className="space-y-1">
                              <p className="text-xs font-bold leading-tight uppercase tracking-tight">{n.message}</p>
                              <p className="text-[9px] text-black/40 dark:text-white/40 font-medium">{new Date(n.timestamp).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleUploadItem} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-red-600 text-white px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-700 transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50"
            >
              {isUploading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Sparkles size={18} />
                </motion.div>
              ) : <Plus size={18} />}
              {isUploading ? "Categorizing..." : "Upload Item"}
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === "My Closet" && (
                <ClosetView 
                  closet={closet} 
                  setCloset={setCloset}
                  selectedFilter={selectedFilter} 
                  setSelectedFilter={setSelectedFilter} 
                  searchQuery={searchQuery}
                />
              )}
              {activeTab === "Concept Stylist" && (
                <StylistView 
                  inspirationImage={inspirationImage}
                  setInspirationImage={setInspirationImage}
                  handleInspirationUpload={handleInspirationUpload}
                  outfits={generatedOutfits}
                  missingQueries={missingQueries}
                  setMissingQueries={setMissingQueries}
                  closet={closet}
                  isGenerating={isGenerating}
                  selectedDressCode={selectedDressCode}
                  setSelectedDressCode={setSelectedDressCode}
                  setActiveTab={setActiveTab}
                />
              )}
              {activeTab === "Smart Commerce" && (
                <CommerceView 
                  missingQueries={missingQueries} 
                  selectedDressCode={selectedDressCode} 
                  addNotification={addNotification}
                  isRateLimited={isRateLimited}
                  setIsRateLimited={setIsRateLimited}
                  incrementRequestCount={incrementRequestCount}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Manual Correction Modal */}
      <AnimatePresence>
        {pendingCorrectionFile && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-[#111] p-8 rounded-3xl w-full max-w-md border border-black/10 dark:border-white/10 shadow-2xl relative"
            >
              <h3 className="text-2xl font-black uppercase italic mb-2">Unknown Item</h3>
              <p className="text-black/60 dark:text-white/60 mb-6 text-sm">We couldn't confidently classify this item. Please select a category manually to add it to your digital twin.</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => handleManualCorrection(cat)}
                    className="p-3 border border-black/10 dark:border-white/10 rounded-xl hover:border-red-600 hover:text-red-500 transition-colors uppercase font-bold tracking-wider text-xs"
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setPendingCorrectionFile(null)}
                className="w-full p-3 bg-black/5 dark:bg-white/5 rounded-xl uppercase font-bold tracking-wider text-xs hover:bg-red-600 hover:text-white transition-colors border border-transparent hover:border-red-600/50"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
        active ? 'text-white' : 'text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
      }`}
    >
      {active && (
        <motion.div 
          layoutId="sidebar-active-bg"
          className="absolute inset-0 bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
        />
      )}
      <span className={`relative z-10 ${active ? 'text-white' : 'group-hover:text-red-500'}`}>
        {icon}
      </span>
      <span className="relative z-10 text-sm font-black uppercase tracking-wider">{label}</span>
      {active && (
        <motion.div layoutId="active-arrow" className="ml-auto relative z-10">
          <ChevronRight size={14} />
        </motion.div>
      )}
    </button>
  );
}

function ClosetView({ closet, setCloset, selectedFilter, setSelectedFilter, searchQuery }: { 
  closet: ClothingItem[], 
  setCloset: React.Dispatch<React.SetStateAction<ClothingItem[]>>,
  selectedFilter: Category | "All", 
  setSelectedFilter: (v: Category | "All") => void,
  searchQuery: string
}) {
  const filteredCloset = closet.filter(item => {
    const matchesCategory = selectedFilter === "All" || item.category === selectedFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <h2 className="text-6xl font-black tracking-tighter uppercase italic">Digital Twin</h2>
          <p className="text-black/40 dark:text-white/40 mt-2 font-medium uppercase tracking-widest text-xs">
            Synchronized Wardrobe: <span className="text-red-500">{filteredCloset.length}</span> Items Categorized
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["All", ...categories].map((cat) => (
            <button 
              key={cat}
              onClick={() => setSelectedFilter(cat as any)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                selectedFilter === cat 
                  ? 'bg-red-600 border-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]' 
                  : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-black/40 dark:text-white/40 hover:border-black/20 dark:hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* AI Insights Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center text-red-500">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">Style Versatility</p>
            <p className="text-xl font-black italic">84% High</p>
          </div>
        </div>
        <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center text-red-500">
            <LayoutGrid size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">Color Palette</p>
            <p className="text-xl font-black italic">Monochrome</p>
          </div>
        </div>
        <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center text-red-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">Twin Health</p>
            <p className="text-xl font-black italic">Optimized</p>
          </div>
        </div>
      </div>

      {filteredCloset.length === 0 && (
        <div className="p-20 text-center space-y-4 bg-black/5 dark:bg-white/5 rounded-3xl border border-dashed border-black/10 dark:border-white/10">
          <Search size={48} className="mx-auto text-black/10 dark:text-white/10" />
          <p className="font-bold uppercase tracking-widest text-xs text-black/40 dark:text-white/40">No items match your search "{searchQuery}"</p>
        </div>
      )}

      {categories.filter(cat => selectedFilter === "All" || selectedFilter === cat).map((cat) => {
        const items = filteredCloset.filter(i => i.category === cat);
        if (items.length === 0) return null;

        return (
          <section key={cat} className="space-y-8">
            <div className="flex items-center gap-6">
              <h3 className="text-2xl font-black uppercase italic tracking-tight">{cat}</h3>
              <div className="h-px flex-1 bg-black/5 dark:bg-white/5"></div>
              <span className="text-xs font-bold text-black/20 dark:text-white/20 uppercase tracking-[0.3em]">{items.length} Pieces</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {items.map((item) => (
                <motion.div 
                  key={item.id}
                  whileHover={{ y: -10 }}
                  className="bg-gray-50 dark:bg-[#0A0A0A] p-4 rounded-2xl border border-black/5 dark:border-white/5 group cursor-pointer relative"
                >
                  <div className="aspect-[3/4] overflow-hidden rounded-xl bg-gray-200 dark:bg-[#111] relative">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded-md flex items-center gap-1 shadow-lg">
                      <CheckCircle2 size={10} />
                      <span className="text-[9px] font-black">{item.confidence}</span>
                    </div>
                    <select 
                      value={item.category} 
                      onChange={async (e) => {
                         const newCat = e.target.value as Category;
                         setCloset(prev => prev.map(i => i.id === item.id ? { ...i, category: newCat } : i));
                         await supabase.from('closet_items').update({ category: newCat }).eq('id', item.id);
                      }}
                      onClick={e => e.stopPropagation()}
                      className="absolute bottom-3 left-3 bg-white/90 dark:bg-black/90 text-black dark:text-white px-2 py-1 shadow-lg text-[10px] uppercase font-black tracking-widest outline-none border border-black/10 dark:border-white/10 rounded-md cursor-pointer hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                      title="Değiştirmek için tıkla"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="mt-4 flex items-start justify-between">
                    <div className="flex-1 overflow-hidden pr-2">
                      <h4 className="font-bold text-sm uppercase tracking-tight truncate">{item.name}</h4>
                      <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-1">AI Verified</p>
                    </div>
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm("Bu kıyafeti gardırobunuzdan silmek istediğinize emin misiniz?")) {
                          await supabase.from('closet_items').delete().eq('id', item.id);
                          setCloset(prev => prev.filter(i => i.id !== item.id));
                        }
                      }}
                      className="text-black/40 dark:text-white/40 hover:text-red-600 transition-colors p-1 shrink-0"
                      title="Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function StylistView({ 
  inspirationImage, 
  setInspirationImage, 
  handleInspirationUpload, 
  outfits, 
  missingQueries,
  setMissingQueries,
  closet,
  isGenerating,
  selectedDressCode,
  setSelectedDressCode,
  setActiveTab
}: {
  inspirationImage: string | null;
  setInspirationImage: (v: string | null) => void;
  handleInspirationUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  outfits: OutfitComponent[][] | null;
  missingQueries: string[];
  setMissingQueries: React.Dispatch<React.SetStateAction<string[]>>;
  closet: ClothingItem[];
  isGenerating: boolean;
  selectedDressCode: string;
  setSelectedDressCode: (v: string) => void;
  setActiveTab: (v: Tab) => void;
}) {
  const inspoRef = useRef<HTMLInputElement>(null);
  const dressCodes = ["Avant-Garde", "Minimalist", "Streetwear", "Formal", "Casual"];
  const [activeOutfitIndex, setActiveOutfitIndex] = useState(0);

  useEffect(() => {
    setActiveOutfitIndex(0);
    if (outfits && outfits.length > 0) {
      const missing = outfits[0].filter((c: any) => c.missingItemQuery).map((c: any) => c.missingItemQuery as string);
      setMissingQueries(missing);
    }
  }, [outfits, setMissingQueries]);

  return (
    <div className="max-w-5xl mx-auto space-y-16">
      <div className="text-center space-y-4">
        <h2 className="text-6xl font-black tracking-tighter uppercase italic">Style Matcher</h2>
        <p className="text-black/40 dark:text-white/40 max-w-md mx-auto font-medium uppercase tracking-widest text-xs">Upload inspiration to generate outfits from your twin.</p>
      </div>

      <div className="flex justify-center gap-3 flex-wrap">
        {dressCodes.map(code => (
          <button
            key={code}
            onClick={() => setSelectedDressCode(code)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
              selectedDressCode === code
                ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-black/40 dark:text-white/40 hover:border-black/20 dark:hover:border-white/20'
            }`}
          >
            {code}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Inspiration Upload */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black italic">01</div>
            <h3 className="text-xl font-black uppercase italic">Inspiration Source</h3>
          </div>
          
          <div 
            onClick={() => inspoRef.current?.click()}
            className={`aspect-[4/5] rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-8 group overflow-hidden relative ${
              inspirationImage ? 'border-red-600/50 bg-black/5 dark:bg-white/5' : 'border-black/10 dark:border-white/10 hover:border-red-600/50 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <input type="file" ref={inspoRef} className="hidden" accept="image/*" onChange={handleInspirationUpload} />
            
            {inspirationImage ? (
              <>
                <img src={inspirationImage} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Inspiration" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="relative z-10 text-center">
                  <Camera size={48} className="mx-auto mb-4 text-red-600" />
                  <p className="font-black uppercase tracking-widest text-xs text-white">Change Inspiration</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setInspirationImage(null); }}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center hover:bg-red-600 transition-colors text-white"
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/20 dark:text-white/20 group-hover:bg-red-600 group-hover:text-white transition-all mb-6">
                  <Upload size={32} />
                </div>
                <p className="font-black uppercase tracking-widest text-sm mb-2">Upload Inspiration Photo</p>
                <p className="text-black/30 dark:text-white/30 text-xs font-medium">Drag & drop or click to browse</p>
              </>
            )}
          </div>
        </div>

        {/* AI Generation Result */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black italic">02</div>
            <h3 className="text-xl font-black uppercase italic">Twin Matching</h3>
          </div>

          <div className="min-h-[400px] flex flex-col">
            {isGenerating ? (
              <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-[2.5rem] border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center p-10 space-y-6 overflow-hidden relative">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                  }} 
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <Sparkles size={64} className="text-red-600" />
                </motion.div>
                <div className="space-y-2 relative z-10">
                  <p className="text-black dark:text-white font-black uppercase italic text-xl tracking-tighter">Analyzing Twin Data</p>
                  <p className="text-black/40 dark:text-white/40 font-bold uppercase tracking-widest text-[10px]">Cross-referencing with {selectedDressCode} aesthetics...</p>
                </div>
                {/* Scanning Line */}
                <motion.div 
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-red-600/30 shadow-[0_0_15px_rgba(220,38,38,0.5)] z-0"
                />
              </div>
            ) : !outfits ? (
              <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-[2.5rem] border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center p-10 space-y-4">
                <Sparkles size={48} className="text-black/10 dark:text-white/10" />
                <p className="text-black/40 dark:text-white/40 font-bold uppercase tracking-widest text-xs">Waiting for inspiration...</p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {/* Outfit Selector */}
                <div className="flex gap-2">
                  {outfits.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveOutfitIndex(idx)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        activeOutfitIndex === idx
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-black/40 dark:text-white/40 hover:border-black/20 dark:hover:border-white/20'
                      }`}
                    >
                      Ensemble {idx + 1}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {outfits[activeOutfitIndex].map((comp, idx) => {
                    const matchedItem = comp.matchedClosetItemId ? closet.find(i => i.id === comp.matchedClosetItemId) : null;
                    return (
                      <div key={idx} className={`bg-gray-50 dark:bg-[#0A0A0A] p-3 rounded-2xl border ${matchedItem ? 'border-black/5 dark:border-white/5' : 'border-red-500/30 bg-red-500/5'} flex gap-4 items-center`}>
                        <div className="w-16 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#111] shrink-0 flex items-center justify-center">
                          {matchedItem ? (
                            <img src={matchedItem.image} className="w-full h-full object-cover" alt={matchedItem.name} />
                          ) : (
                            <span className="text-[9px] text-red-500 font-bold uppercase rotate-[-45deg] tracking-widest opacity-50">Missing</span>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className={`text-[9px] uppercase font-black tracking-widest ${matchedItem ? 'text-black/50 dark:text-white/50' : 'text-red-500/80'}`}>{comp.category}</p>
                          <h4 className="font-bold text-xs uppercase truncate" title={matchedItem ? matchedItem.name : comp.missingItemQuery || "Missing"}>
                            {matchedItem ? matchedItem.name : comp.missingItemQuery || "Missing Piece"}
                          </h4>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {missingQueries.length > 0 && (
                  <div className="bg-red-600/10 border border-red-600/20 p-6 rounded-2xl flex items-center gap-4">
                    <AlertCircle className="text-red-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] uppercase font-black text-red-500 tracking-widest mb-1">Gap Analysis</p>
                      <p className="text-sm font-bold">Missing <span className="italic">{missingQueries.length}</span> items to complete this look.</p>
                      <p className="text-[10px] text-black/40 dark:text-white/40 mt-1 uppercase tracking-widest">We found exact visual matches in Smart Commerce</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab("Smart Commerce")}
                      className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-all shadow-lg"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                )}

                <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-2xl shadow-red-600/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-black dark:text-white font-black uppercase italic text-lg leading-none">Outfit Ready</p>
                      <p className="text-black/40 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Twin Match Found</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="bg-black/5 dark:bg-white/5 text-black dark:text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black/10 dark:hover:bg-white/10 transition-all border border-black/10 dark:border-white/10">
                      AR Try-On
                    </button>
                    <button className="bg-red-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all">
                      Save Ensemble
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface ProductRecommendation {
    title: string;
    image_url: string;
    purchase_url: string;
    price: string | number;
    source: string;
}

function CommerceView({ 
  missingQueries, 
  selectedDressCode, 
  addNotification, 
  isRateLimited, 
  setIsRateLimited, 
  incrementRequestCount 
}: { 
  missingQueries: string[]; 
  selectedDressCode: string;
  addNotification: (type: AppNotification['type'], message: string) => void;
  isRateLimited: boolean;
  setIsRateLimited: (v: boolean) => void;
  incrementRequestCount: () => void;
}) {
  const [recommendations, setRecommendations] = useState<(ProductRecommendation & { originalQuery?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllRecommendations = async (queries: string[]) => {
    if (!queries || queries.length === 0) {
      setRecommendations([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      let combinedRecs: any[] = [];
      for (const query of queries) {
        const response = await fetch(`${API_BASE_URL}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchQuery: query })
        });
        
        if (!response.ok) {
          if (response.status === 429) {
            setIsRateLimited(true);
            addNotification('error', 'Tokens exhausted! Smart Commerce search limit reached.');
          }
          if (response.status === 503) throw new Error('Service Unavailable: API offline.');
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (isRateLimited) {
          setIsRateLimited(false);
          addNotification('success', 'Tokens renewed! Smart Commerce is back.');
        }
        incrementRequestCount();

        if (data.recommendations) {
           const tagged = data.recommendations.map((r: any) => ({...r, originalQuery: query}));
           combinedRecs = [...combinedRecs, ...tagged];
        }
      }
      setRecommendations(combinedRecs);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed fetching.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRecommendations(missingQueries.length > 0 ? missingQueries : [`${selectedDressCode} trendy outfit pieces`]);
  }, [missingQueries, selectedDressCode]);

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black tracking-tighter uppercase italic">Smart Commerce</h2>
          <p className="text-black/40 dark:text-white/40 mt-2 font-medium uppercase tracking-widest text-xs">Bridging the gap between your twin and your goals.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 p-20 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-6">
          <Loader2 size={64} className="mx-auto text-red-600 animate-spin" />
          <h3 className="text-2xl font-black uppercase italic">Curating Selections</h3>
          <p className="text-black/40 dark:text-white/40 max-w-sm mx-auto font-medium">Please wait while we synthesize {selectedDressCode} matches via Custom Search...</p>
        </div>
      ) : error ? (
        <div className="bg-red-600/10 border border-red-600/20 p-20 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-6">
          <AlertCircle size={64} className="mx-auto text-red-600" />
          <h3 className="text-2xl font-black uppercase italic text-red-600">Network Error</h3>
          <p className="text-red-500 max-w-sm mx-auto font-medium">{error}</p>
          <button 
             onClick={() => fetchAllRecommendations(missingQueries.length > 0 ? missingQueries : [`${selectedDressCode} trendy outfit pieces`])}
             className="bg-red-600 text-white px-6 py-3 rounded-xl uppercase font-black tracking-widest text-xs hover:bg-red-700 transition shadow-lg shadow-red-600/20"
          >
             Retry Fetch
          </button>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="space-y-8">
           {missingQueries.length > 0 && (
             <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/5">
                <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center text-red-600">
                  <Filter size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Active Gap Analysis</p>
                  <p className="font-bold text-xs uppercase truncate max-w-sm">Target Queries: {missingQueries.join(' • ')}</p>
                </div>
             </div>
           )}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
             {recommendations.map((rec, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-[#0A0A0A] p-6 rounded-3xl border border-black/5 dark:border-white/5 flex flex-col justify-between group h-full hover:-translate-y-2 transition-transform duration-300">
                   <div>
                     <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-200 dark:bg-[#111] relative mb-4">
                       <img 
                         src={rec.image_url} 
                         alt={rec.title} 
                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                         referrerPolicy="no-referrer"
                         onError={(e) => {
                            // Fallback to placeholder if external image fails
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500';
                         }}
                       />
                       <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black italic text-white shadow">
                         {rec.price}
                       </div>
                     </div>
                     <h4 className="font-bold text-sm uppercase leading-snug line-clamp-2 mb-2" title={rec.title}>{rec.title}</h4>
                     <p className="text-[10px] font-black uppercase tracking-widest text-red-500 truncate mb-1">Via {rec.source}</p>
                   </div>
                   <a 
                     href={rec.purchase_url}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="mt-6 w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white py-3 rounded-xl font-black uppercase tracking-[0.1em] text-xs flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors shadow-lg shadow-black/5 dark:shadow-white/5"
                   >
                     Buy Item <ArrowUpRight size={14} />
                   </a>
                </div>
             ))}
           </div>
        </div>
      ) : (
        <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 p-20 rounded-[2.5rem] text-center space-y-6">
          <CheckCircle2 size={64} className="mx-auto text-black/10 dark:text-white/10" />
          <h3 className="text-2xl font-black uppercase italic">Wardrobe Complete</h3>
          <p className="text-black/40 dark:text-white/40 max-w-sm mx-auto font-medium">Your digital twin currently satisfies all generated style compositions. No external recommendations found.</p>
        </div>
      )}
    </div>
  );
}
