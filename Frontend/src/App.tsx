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
  Moon,
  Bookmark,
  ChevronDown
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
  manually_changed?: boolean;
}

export interface OutfitComponent {
  category: Category;
  matchedClosetItemId: string | null;
  missingItemQuery: string | null;
}

// Initial Closet Data (Starts Empty per user request)
const initialCloset: ClothingItem[] = [];

const categories: Category[] = ["Outerwear", "Tops", "Bottoms", "Shoes", "Accessories"];

type Tab = "My Closet" | "Concept Stylist" | "Smart Commerce" | "Saved Ensembles";

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result?.toString().split(',')[1] || '');
    reader.onerror = (error) => reject(error);
  });
};

function AuthScreen({ addNotification }: { addNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void }) {
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
        addNotification('success', "Kayıt başarılı! Lütfen giriş yapın.");
        setMode('login');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        addNotification('success', "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!");
        setMode('login');
      }
    } catch (err: any) {
      addNotification('error', err.error_description || err.message);
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

function UpdatePasswordScreen({ onComplete, addNotification }: { onComplete: () => void, addNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        addNotification('warning', "Şifre en az 6 karakter olmalıdır.");
        return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      addNotification('success', "Şifreniz başarıyla güncellendi!");
      onComplete();
    } catch (err: any) {
      addNotification('error', err.error_description || err.message);
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
  const [toastNotif, setToastNotif] = useState<AppNotification | null>(null);

  const addNotification = (type: AppNotification['type'], message: string) => {
    setToastNotif({ id: Math.random().toString(), type, message, timestamp: new Date(), read: false });
    setTimeout(() => setToastNotif(null), 3000);
  };

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
  
  return (
    <>
      {view === 'update_password' ? (
        <UpdatePasswordScreen onComplete={() => setView('app')} addNotification={addNotification} />
      ) : !session ? (
        <AuthScreen addNotification={addNotification} />
      ) : (
        <VogueVaultDashboard session={session} />
      )}
      
      <AnimatePresence>
        {toastNotif && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-white text-sm font-bold uppercase tracking-wider ${
              toastNotif.type === 'success' ? 'bg-emerald-500' :
              toastNotif.type === 'error' ? 'bg-red-600' :
              toastNotif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
            }`}
          >
            <span>{toastNotif.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function VogueVaultDashboard({ session }: { session: Session }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<Tab>("My Closet");
  const [closet, setCloset] = useState<ClothingItem[]>(initialCloset);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inspirationImage, setInspirationImage] = useState<string | null>(null);
  const [inspirationBase64, setInspirationBase64] = useState<string | null>(null);
  const [generatedOutfits, setGeneratedOutfits] = useState<OutfitComponent[][] | null>(null);
  const [missingQueries, setMissingQueries] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<Category | "All">("All");
  const [selectedDressCode, setSelectedDressCode] = useState("Avant-Garde");
  const [pendingCorrectionFile, setPendingCorrectionFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSavingOutfit, setIsSavingOutfit] = useState(false);
  const [outfitSaved, setOutfitSaved] = useState(false);
  
  const [savedOutfits, setSavedOutfits] = useState<any[]>([]);
  const [savedOutfitsLoading, setSavedOutfitsLoading] = useState(true);

  useEffect(() => {
    const fetchSavedOutfits = async () => {
      try {
        const { data, error } = await supabase
          .from('saved_outfits')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setSavedOutfits(data);
        }
      } catch (err) {
        console.error("Fetch saved outfits failed", err);
      } finally {
        setSavedOutfitsLoading(false);
      }
    };
    fetchSavedOutfits();
  }, [session.user.id]);

  // NOTIFICATION SYSTEM
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [toastNotif, setToastNotif] = useState<AppNotification | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [favoriteBrands, setFavoriteBrands] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('onboarding_completed, favorite_brands').eq('id', session.user.id).single();
        if (data) {
          if (data.favorite_brands) setFavoriteBrands(data.favorite_brands);
          if (data.onboarding_completed === false || data.onboarding_completed === null) {
            setShowOnboarding(true);
          }
        } else {
            setShowOnboarding(true);
        }
      } catch (err) {}
    };
    fetchProfile();
  }, [session.user.id]);

  // CUSTOM MODALS
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm });
  };

  useEffect(() => {
    console.log(`[Dashboard] Tab switched to: ${activeTab}`);
  }, [activeTab]);

  const addNotification = (type: AppNotification['type'], message: string) => {
    console.log(`[Notification] ${type.toUpperCase()}: ${message}`);
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    setToastNotif(newNotif);
    setTimeout(() => setToastNotif(null), 3000);
  };

  const saveEnsemble = async (outfit: OutfitComponent[], outfitIndex: number) => {
    setIsSavingOutfit(true);
    try {
      const payload = {
        components: outfit,
        inspiration_image: inspirationBase64 || null,
      };
      const { error } = await supabase.from('saved_outfits').insert({
        user_id: session.user.id,
        outfit_data: payload,
        dress_code: selectedDressCode,
      });
      if (error) throw error;
      setOutfitSaved(true);
      addNotification('success', `✓ Ensemble saved to your vault!`);
      setTimeout(() => setOutfitSaved(false), 2500);
    } catch (err: any) {
      addNotification('error', 'Could not save ensemble. Check DB permissions.');
    } finally {
      setIsSavingOutfit(false);
    }
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
    console.log(`[Upload] Starting upload process for new image file`);
    setIsUploading(true);
    setUploadProgress(10);
    try {
      const base64Image = await fileToBase64(file);
      
      console.log(`[Upload] Image sent to backend. Waiting for classification...`);
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
          setShowPaywall(true);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[Upload] Backend response received:`, data);

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
          if (uploadError) {
             addNotification('error', `Storage Hatası: ${uploadError.message} (bucket: closet-images)`);
             return;
          }
          const { data: urlData } = supabase.storage.from('closet-images').getPublicUrl(fileName);
          publicUrl = urlData.publicUrl;
        } catch(storageErr: any) { addNotification('error', `Hata: ${storageErr.message}`); }

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
            addNotification('warning', 'Could not save to database. Showing temporarily.');
            setCloset(prev => [{...dbItem, id: Math.random().toString(36).substring(2, 9), image: publicUrl} as any, ...prev]);
        } else {
            setCloset(prev => [{...insertedData, id: insertedData.id.toString(), image: insertedData.image_url}, ...prev]);
        }
        addNotification('success', `✓ Classified as ${data.item_data.category}`);
      } else if (response.status === 200 && data.needsManualCorrection) {
        // Needs manual correction due to low confidence/unknown
        setPendingCorrectionFile(file);
      }
    } catch (error) {
      console.error("Network error during upload:", error);
      addNotification('error', 'Network error: Could not connect to backend.');
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
        if (uploadError) {
           addNotification('error', `Storage Hatası: ${uploadError.message}`);
           return;
        }
        const { data: urlData } = supabase.storage.from('closet-images').getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      } catch(storageErr: any) { addNotification('error', `Hata: ${storageErr.message}`); }

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
          addNotification('warning', "Lütfen Supabase SQL Editor üzerinden 'closet_items' tablosunu oluşturun.");
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
      if (!file.type.startsWith('image/')) return;
      console.log(`[Inspiration] Analyzing new inspiration image`);
      try {
        const base64 = await fileToBase64(file);
        setInspirationBase64(base64);
        setInspirationImage(`data:${file.type};base64,${base64}`);
      } catch (err) {
        console.error("Failed to read image", err);
      }
    }
  };

  const generateOutfits = async () => {
      setGeneratedOutfits(null);
      setMissingQueries([]);
      setIsGenerating(true);
      
      try {
        const closetData = closet.map(i => ({ id: i.id, name: i.name, category: i.category }));
        const response = await fetch(`${API_BASE_URL}/api/inspiration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: inspirationBase64 || "", dressCode: selectedDressCode, closet: closetData })
        });
        
        if (!response.ok) {
          if (response.status === 429) {
            setIsRateLimited(true);
            setShowPaywall(true);
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
          const missing = outfits[0]
            .filter((c: any) => c.missingItemQuery && c.missingItemQuery !== "null")
            .map((c: any) => c.missingItemQuery as string);
          console.log(`[Stylist] Identified ${missing.length} valid missing items:`, missing);
          setMissingQueries(missing);
        } else {
          setMissingQueries([]);
        }
      } catch (error) {
        console.error("AI Outfit Generation failed:", error);
      } finally {
        setIsGenerating(false);
      }
  };

  return (
    <div className={`flex h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans overflow-hidden relative transition-colors duration-500`}>
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-900/10 dark:bg-red-900/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/5 dark:bg-red-900/10 blur-[100px] rounded-full pointer-events-none"></div>
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
      <OnboardingModal 
        isOpen={showOnboarding} 
        session={session} 
        onComplete={(brands) => {
          setFavoriteBrands(brands);
          setShowOnboarding(false);
        }} 
      />
      {/* Toast Notification */}
      <AnimatePresence>
        {toastNotif && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-white text-sm font-bold uppercase tracking-wider ${
              toastNotif.type === 'success' ? 'bg-emerald-500' :
              toastNotif.type === 'error' ? 'bg-red-600' :
              toastNotif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
            }`}
          >
            <span>{toastNotif.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
          <SidebarItem 
            icon={<Bookmark size={18} />} 
            label="Saved Ensembles" 
            active={activeTab === "Saved Ensembles"} 
            onClick={() => setActiveTab("Saved Ensembles")} 
          />
        </nav>

        <div className="pt-8 border-t border-black/5 dark:border-white/5">
          <div 
             onClick={() => setIsSettingsOpen(true)}
             className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group"
             title="Settings & Profile"
          >
            <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-black dark:text-white group-hover:bg-red-600 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all shrink-0">
              <User size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate" title={session.user.email}>{session.user.email?.split('@')[0]}</p>
              <p className="text-[10px] text-black/40 dark:text-white/40 uppercase tracking-widest group-hover:text-red-500 transition-colors">Settings & Profile</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-20 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5 px-10 flex items-center justify-between sticky top-0 z-[60] transition-colors duration-500">
          <div className="relative w-96">
            <div className={`flex items-center gap-4 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-full w-full border transition-all relative z-20 ${isSearchFocused && searchQuery ? 'border-red-600/50 bg-white dark:bg-[#111] shadow-2xl shadow-red-600/10' : 'border-black/5 dark:border-white/5 focus-within:border-red-600/50'}`}>
              <Search size={16} className={isSearchFocused && searchQuery ? 'text-red-600' : 'text-black/40 dark:text-white/40'} />
              <input 
                type="text" 
                placeholder="Search your digital twin, vault, or stores..." 
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-black/30 dark:placeholder:text-white/30 text-black dark:text-white"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setIsSearchFocused(false); }} className="text-black/40 hover:text-red-600 transition-colors"><X size={14} /></button>
              )}
            </div>

            <AnimatePresence>
              {(isSearchFocused && searchQuery.length > 0) && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-10"
                    onClick={() => setIsSearchFocused(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    className="absolute top-14 left-0 w-[500px] bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl z-20 overflow-hidden flex flex-col max-h-[600px]"
                  >
                    <div className="overflow-y-auto custom-scrollbar p-2">
                      {(() => {
                        const q = searchQuery.toLowerCase();
                        const matchedItems = closet.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
                        const matchedOutfits = savedOutfits.filter(o => {
                          const dressCodeMatch = o.dress_code?.toLowerCase().includes(q);
                          const compMatch = (Array.isArray(o.outfit_data) ? o.outfit_data : o.outfit_data?.components || []).some((c:any) => c.category?.toLowerCase().includes(q) || c.missingItemQuery?.toLowerCase().includes(q));
                          return dressCodeMatch || compMatch;
                        });

                        return (
                          <>
                            {matchedItems.length > 0 && (
                              <div className="mb-4">
                                <h4 className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">Digital Twin ({matchedItems.length})</h4>
                                {matchedItems.slice(0, 3).map(item => (
                                  <button 
                                    key={item.id}
                                    onClick={() => { setActiveTab("My Closet"); setSearchQuery(item.name); setIsSearchFocused(false); }}
                                    className="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl flex items-center gap-4 group transition-colors"
                                  >
                                    <img src={item.image} className="w-10 h-12 rounded-lg object-cover bg-gray-200 dark:bg-[#111]" />
                                    <div className="overflow-hidden flex-1">
                                      <p className="text-sm font-bold truncate group-hover:text-red-600 transition-colors text-black dark:text-white">{item.name}</p>
                                      <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40">{item.category}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {matchedOutfits.length > 0 && (
                              <div className="mb-4">
                                <h4 className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">Saved Ensembles ({matchedOutfits.length})</h4>
                                {matchedOutfits.slice(0, 3).map(outfit => (
                                  <button 
                                    key={outfit.id}
                                    onClick={() => { setActiveTab("Saved Ensembles"); setSearchQuery(outfit.dress_code || ""); setIsSearchFocused(false); }}
                                    className="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl flex items-center gap-4 group transition-colors"
                                  >
                                    <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center text-red-600 shrink-0"><Bookmark size={16} /></div>
                                    <div className="overflow-hidden flex-1">
                                      <p className="text-sm font-bold truncate group-hover:text-red-600 transition-colors text-black dark:text-white">{outfit.dress_code || "Concept Look"}</p>
                                      <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40">
                                        {new Date(outfit.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className="pt-2 border-t border-black/5 dark:border-white/5">
                              <button 
                                onClick={() => { setActiveTab("Smart Commerce"); setIsSearchFocused(false); }}
                                className="w-full text-left px-4 py-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl flex items-center gap-4 group transition-colors"
                              >
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0"><ShoppingBag size={16} /></div>
                                <div className="overflow-hidden flex-1">
                                  <p className="text-sm font-bold group-hover:text-blue-500 transition-colors text-black dark:text-white">Search Store Partners</p>
                                  <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 truncate">Find "{searchQuery}" in Commerce</p>
                                </div>
                                <ArrowRight size={14} className="text-black/20 dark:text-white/20 group-hover:text-blue-500 transition-colors" />
                              </button>
                            </div>

                            {matchedItems.length === 0 && matchedOutfits.length === 0 && (
                              <div className="p-8 text-center text-black/40 dark:text-white/40">
                                <Search className="mx-auto mb-2 opacity-50" size={24} />
                                <p className="text-xs font-bold uppercase tracking-widest">No local matches</p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
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
                  requestConfirm={requestConfirm}
                />
              )}
              {activeTab === "Concept Stylist" && (
                <StylistView 
                  inspirationImage={inspirationImage}
                  setInspirationImage={setInspirationImage}
                  handleInspirationUpload={handleInspirationUpload}
                  generateOutfits={generateOutfits}
                  outfits={generatedOutfits}
                  missingQueries={missingQueries}
                  setMissingQueries={setMissingQueries}
                  closet={closet}
                  isGenerating={isGenerating}
                  selectedDressCode={selectedDressCode}
                  setSelectedDressCode={setSelectedDressCode}
                  setActiveTab={setActiveTab}
                  onSaveEnsemble={saveEnsemble}
                  isSavingOutfit={isSavingOutfit}
                  outfitSaved={outfitSaved}
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
                  searchQuery={searchQuery}
                  favoriteBrands={favoriteBrands}
                />
              )}
              {activeTab === "Saved Ensembles" && (
                <SavedEnsemblesView 
                  session={session}
                  closet={closet}
                  searchQuery={searchQuery}
                  requestConfirm={requestConfirm}
                  savedOutfits={savedOutfits}
                  setSavedOutfits={setSavedOutfits}
                  loading={savedOutfitsLoading}
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

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        session={session} 
        addNotification={addNotification} 
      />

      {/* Confirm Modal */}
      <ConfirmModal 
        isOpen={confirmDialog.isOpen} 
        title={confirmDialog.title} 
        message={confirmDialog.message} 
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }} 
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} 
      />
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

function ClosetView({ closet, setCloset, selectedFilter, setSelectedFilter, searchQuery, requestConfirm }: { 
  closet: ClothingItem[], 
  setCloset: React.Dispatch<React.SetStateAction<ClothingItem[]>>,
  selectedFilter: Category | "All", 
  setSelectedFilter: (v: Category | "All") => void,
  searchQuery: string,
  requestConfirm: (title: string, message: string, onConfirm: () => void) => void
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
        <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 w-fit">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                 setSelectedFilter(cat as Category | "All");
                 console.log(`[Closet] Filter changed to: ${cat}`);
              }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                selectedFilter === cat 
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-xl shadow-black/10' 
                  : 'text-black/40 dark:text-white/40 hover:text-red-500'
              }`}
            >
              {cat}
            </button>
          ))}
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
                         setCloset(prev => prev.map(i => i.id === item.id ? { ...i, category: newCat, manually_changed: true } : i));
                         await supabase.from('closet_items').update({ category: newCat, manually_changed: true }).eq('id', item.id);
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
                      <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-1">
                        {item.manually_changed ? 'Changed Manually' : 'AI Verified'}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        requestConfirm("Delete Item", "Bu kıyafeti gardırobunuzdan silmek istediğinize emin misiniz?", async () => {
                          await supabase.from('closet_items').delete().eq('id', item.id);
                          setCloset(prev => prev.filter(i => i.id !== item.id));
                        });
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
  generateOutfits,
  outfits, 
  missingQueries,
  setMissingQueries,
  closet,
  isGenerating,
  selectedDressCode,
  setSelectedDressCode,
  setActiveTab,
  onSaveEnsemble,
  isSavingOutfit,
  outfitSaved
}: {
  inspirationImage: string | null;
  setInspirationImage: (v: string | null) => void;
  handleInspirationUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  generateOutfits: () => void;
  outfits: OutfitComponent[][] | null;
  missingQueries: string[];
  setMissingQueries: React.Dispatch<React.SetStateAction<string[]>>;
  closet: ClothingItem[];
  isGenerating: boolean;
  selectedDressCode: string;
  setSelectedDressCode: (v: string) => void;
  setActiveTab: (v: Tab) => void;
  onSaveEnsemble: (outfit: OutfitComponent[], index: number) => void;
  isSavingOutfit: boolean;
  outfitSaved: boolean;
}) {
  const inspoRef = useRef<HTMLInputElement>(null);
  const dressCodes = ["Avant-Garde", "Minimalist", "Streetwear", "Formal", "Casual", "Business Casual", "Old Money", "Y2K", "Bohemian", "Cyberpunk", "Athleisure", "Vintage", "Preppy"];
  const [activeOutfitIndex, setActiveOutfitIndex] = useState(0);

  useEffect(() => {
    setActiveOutfitIndex(0);
  }, [outfits]);

  useEffect(() => {
    if (outfits && outfits.length > activeOutfitIndex) {
      const missing = outfits[activeOutfitIndex]
        .filter((c: any) => c.missingItemQuery && c.missingItemQuery !== "null")
        .map((c: any) => c.missingItemQuery as string);
      setMissingQueries(missing);
    }
  }, [outfits, activeOutfitIndex, setMissingQueries]);

  return (
    <div className="max-w-5xl mx-auto space-y-16">
      <div className="text-center space-y-4">
        <h2 className="text-6xl font-black tracking-tighter uppercase italic">Style Matcher</h2>
        <p className="text-black/40 dark:text-white/40 max-w-md mx-auto font-medium uppercase tracking-widest text-xs">Generate intelligent combinations purely from your chosen style, or upload an optional inspiration photo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Style Selection & Generation Controls */}
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black italic">01</div>
              <h3 className="text-xl font-black uppercase italic">Choose Style Code</h3>
            </div>
            <div className="w-full">
              <div className="relative">
                <select
                  value={selectedDressCode}
                  onChange={(e) => setSelectedDressCode(e.target.value)}
                  className="w-full appearance-none bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-6 py-4 font-black uppercase tracking-widest text-sm focus:outline-none focus:border-red-600 transition-colors cursor-pointer text-black dark:text-white"
                >
                  {dressCodes.map(code => (
                    <option key={code} value={code} className="bg-white dark:bg-[#111] text-black dark:text-white">
                      {code}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-red-600">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Inspiration Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black italic">02</div>
              <h3 className="text-xl font-black uppercase italic">Inspiration Source <span className="text-[10px] text-black/30 dark:text-white/30 tracking-widest">(Optional)</span></h3>
            </div>
            
            <div 
              onClick={() => inspoRef.current?.click()}
              className={`h-80 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 group overflow-hidden relative ${
                inspirationImage ? 'border-red-600/50 bg-black/5 dark:bg-white/5' : 'border-black/10 dark:border-white/10 hover:border-red-600/50 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <input type="file" ref={inspoRef} className="hidden" accept="image/*" onChange={handleInspirationUpload} />
              
              {inspirationImage ? (
                <>
                  <img src={inspirationImage ? encodeURI(inspirationImage) : ''} className="absolute inset-0 w-full h-full object-contain p-2" alt="Inspiration" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="relative z-10 text-center">
                    <Camera size={32} className="mx-auto mb-2 text-red-600" />
                    <p className="font-black uppercase tracking-widest text-[10px] text-white">Change Inspiration</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setInspirationImage(null); }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center hover:bg-red-600 transition-colors text-white"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/20 dark:text-white/20 group-hover:bg-red-600 group-hover:text-white transition-all mb-4">
                    <Upload size={24} />
                  </div>
                  <p className="font-black uppercase tracking-widest text-xs mb-1">Upload Photo</p>
                  <p className="text-black/30 dark:text-white/30 text-[10px] font-medium text-center">Give the AI a visual target (Optional)</p>
                </>
              )}
            </div>
          </div>

          <button
            onClick={generateOutfits}
            disabled={isGenerating || closet.length === 0}
            className="w-full bg-red-600 text-white p-5 rounded-2xl text-lg font-black uppercase tracking-[0.2em] shadow-2xl shadow-red-600/20 hover:bg-red-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-red-600 flex items-center justify-center gap-3"
          >
            {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
            {isGenerating ? "Synthesizing..." : "Generate Ensembles"}
          </button>
          
          {closet.length === 0 && (
             <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center">Upload items to your closet first</p>
          )}
        </div>

        {/* AI Generation Result */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black italic">03</div>
            <h3 className="text-xl font-black uppercase italic">Twin Matching Results</h3>
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
              <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-[2.5rem] border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center p-10 space-y-4 min-h-[400px]">
                <Sparkles size={48} className="text-black/10 dark:text-white/10" />
                <p className="text-black/40 dark:text-white/40 font-bold uppercase tracking-widest text-xs">Awaiting generation command...</p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {/* Outfit Selector */}
                {outfits.length > 1 && (
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
                )}

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
                    {!inspirationImage && (
                      <button 
                        onClick={generateOutfits}
                        disabled={isGenerating}
                        className="bg-black/5 dark:bg-white/5 text-black dark:text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black/10 dark:hover:bg-white/10 transition-all border border-black/10 dark:border-white/10 flex items-center gap-2"
                      >
                        <Sparkles size={14} /> Shuffle
                      </button>
                    )}
                    <button
                      onClick={() => onSaveEnsemble(outfits![activeOutfitIndex], activeOutfitIndex)}
                      disabled={isSavingOutfit}
                      className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-60 ${
                        outfitSaved
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {isSavingOutfit ? 'Saving...' : outfitSaved ? 'Saved ✓' : 'Save Ensemble'}
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
  incrementRequestCount,
  searchQuery,
  favoriteBrands
}: { 
  missingQueries: string[]; 
  selectedDressCode: string;
  addNotification: (type: AppNotification['type'], message: string) => void;
  isRateLimited: boolean;
  setIsRateLimited: (v: boolean) => void;
  incrementRequestCount: () => void;
  searchQuery: string;
  favoriteBrands: string[];
}) {
  const [recommendations, setRecommendations] = useState<(ProductRecommendation & { originalQuery?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 4;

  const fetchAllRecommendations = async (queries: string[]) => {
    if (!queries || queries.length === 0) {
      setRecommendations([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    setCurrentPage(0);
    try {
      let combinedRecs: any[] = [];
      for (const query of queries) {
        const response = await fetch(`${API_BASE_URL}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchQuery: query, preferredBrands: favoriteBrands })
        });
        
        if (!response.ok) {
          if (response.status === 429) {
            setIsRateLimited(true);
            const data = await response.json();
            let retryMsg = 'Tokens exhausted! Smart Commerce search limit reached.';
            if (data.error && data.error.includes('retry in')) {
              const match = data.error.match(/retry in ([\d\.]+s)/);
              if (match) retryMsg = `Quota Hit! Please retry in ${match[1]}.`;
            }
            addNotification('error', retryMsg);
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
           console.log(`[Commerce] Received ${data.recommendations.length} recommendations for query: ${query}`);
           const tagged = data.recommendations.map((r: any) => ({...r, originalQuery: query}));
           combinedRecs = [...combinedRecs, ...tagged];
        }
      }
      setRecommendations(combinedRecs);
    } catch (err: any) {
      console.error("[Commerce] Fetch Error:", err);
      setError(err.message || 'Failed fetching.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      fetchAllRecommendations([searchQuery]);
    } else if (missingQueries.length > 0) {
      fetchAllRecommendations(missingQueries);
    } else {
      setRecommendations([]);
    }
  }, [missingQueries, searchQuery]);

  const activeQueries = searchQuery ? [searchQuery] : missingQueries;

  const groupedRecs = activeQueries.map(q => ({
    query: q,
    items: recommendations.filter(r => r.originalQuery === q)
  })).filter(g => g.items.length > 0);

  const maxPage = groupedRecs.length > 0 
    ? Math.max(0, Math.max(...groupedRecs.map(g => Math.ceil(g.items.length / ITEMS_PER_PAGE))) - 1)
    : 0;

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
          <p className="text-black/40 dark:text-white/40 max-w-sm mx-auto font-medium">
            {searchQuery 
              ? `Manually searching for "${searchQuery}"...`
              : missingQueries.length > 0 
                ? `Searching for your missing ${missingQueries.join(', ')}...` 
                : `Synthesizing ${selectedDressCode} matches via Custom Search...`}
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-600/10 border border-red-600/20 p-20 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-6">
          <AlertCircle size={64} className="mx-auto text-red-600" />
          <h3 className="text-2xl font-black uppercase italic text-red-600">
            {error.includes('403') ? 'Search API Access Denied' : 'Sync Error'}
          </h3>
          <p className="text-red-500 max-w-md mx-auto font-medium">
            {error.includes('403') 
              ? 'The Custom Search API is not enabled in your Google Cloud Project. Please go to the Google Cloud Console and enable it to see retail matches.' 
              : error}
          </p>
          {error.includes('403') ? (
            <a 
              href="https://console.cloud.google.com/apis/library/customsearch.googleapis.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-red-600 text-white px-8 py-4 rounded-xl uppercase font-black tracking-widest text-xs hover:bg-red-700 transition shadow-lg shadow-red-600/20 flex items-center gap-2"
            >
              Enable API in Console <ArrowUpRight size={16} />
            </a>
          ) : (
            <button 
               onClick={() => fetchAllRecommendations(missingQueries.length > 0 ? missingQueries : [`${selectedDressCode} trendy outfit pieces`])}
               className="bg-red-600 text-white px-6 py-3 rounded-xl uppercase font-black tracking-widest text-xs hover:bg-red-700 transition shadow-lg shadow-red-600/20"
            >
               Retry Fetch
            </button>
          )}
        </div>
      ) : groupedRecs.length > 0 ? (
        <div className="space-y-8">
           <div className="flex gap-8 overflow-x-auto pb-4 custom-scrollbar">
             {groupedRecs.map((group, colIdx) => (
               <div key={colIdx} className="min-w-[300px] flex-1 space-y-6">
                 {/* Sticky Column Header */}
                 <div className="sticky top-0 z-10 bg-white/90 dark:bg-[#050505]/90 backdrop-blur-md p-4 rounded-2xl border border-black/5 dark:border-white/5 flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center text-red-600 shrink-0">
                     <Filter size={14} />
                   </div>
                   <div className="overflow-hidden">
                     <p className="text-[9px] font-black uppercase tracking-widest text-red-500">Missing Item</p>
                     <p className="font-bold text-xs uppercase truncate" title={group.query}>{group.query}</p>
                   </div>
                 </div>

                 {/* Cards for Current Page */}
                 <div className="space-y-6">
                   {group.items.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE).map((rec, idx) => (
                     <a 
                       key={idx} 
                       href={rec.purchase_url}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="block bg-gray-50 dark:bg-[#0A0A0A] p-4 rounded-3xl border border-black/5 dark:border-white/5 group hover:-translate-y-1 hover:border-red-600/50 transition-all duration-300 shadow-xl shadow-transparent hover:shadow-red-600/5"
                     >
                       <div className="flex gap-4">
                         <div className="w-24 h-32 rounded-2xl overflow-hidden bg-gray-200 dark:bg-[#111] relative shrink-0">
                           <img 
                             src={rec.image_url} 
                             alt={rec.title} 
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                             referrerPolicy="no-referrer"
                             onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500';
                             }}
                           />
                           <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur px-2 py-0.5 rounded-full text-[9px] font-black italic text-white shadow">
                             {rec.price}
                           </div>
                         </div>
                         <div className="flex flex-col justify-center flex-1 overflow-hidden">
                           <h4 className="font-bold text-xs uppercase leading-snug line-clamp-2 mb-1 group-hover:text-red-600 transition-colors" title={rec.title}>{rec.title}</h4>
                           <p className="text-[9px] font-black uppercase tracking-widest text-red-500 truncate mb-2">Via {rec.source}</p>
                           <div className="w-fit text-[10px] uppercase font-black tracking-widest flex items-center gap-1 text-black/40 dark:text-white/40 group-hover:text-black dark:group-hover:text-white transition-colors">
                             View <ArrowUpRight size={12} />
                           </div>
                         </div>
                       </div>
                     </a>
                   ))}
                   {/* Empty placeholders if page doesn't have enough items */}
                   {Array.from({ length: Math.max(0, ITEMS_PER_PAGE - group.items.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE).length) }).map((_, i) => (
                     <div key={`empty-${i}`} className="h-[160px] rounded-3xl border border-dashed border-black/10 dark:border-white/10 flex items-center justify-center opacity-50">
                       <p className="text-[9px] uppercase tracking-widest text-black/30 dark:text-white/30 font-bold">End of Results</p>
                     </div>
                   ))}
                 </div>
               </div>
             ))}
           </div>
           
           {/* Pagination */}
           {maxPage > 0 && (
             <div className="flex items-center justify-center gap-4 mt-8 pt-8 border-t border-black/5 dark:border-white/5">
               <button 
                 onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                 disabled={currentPage === 0}
                 className="px-6 py-2 rounded-full border border-black/10 dark:border-white/10 text-xs font-black uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
               >
                 Prev
               </button>
               <div className="flex items-center gap-2">
                 {Array.from({ length: maxPage + 1 }).map((_, i) => (
                   <button
                     key={i}
                     onClick={() => setCurrentPage(i)}
                     className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                       currentPage === i ? 'bg-red-600 text-white' : 'text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5'
                     }`}
                   >
                     {i + 1}
                   </button>
                 ))}
               </div>
               <button 
                 onClick={() => setCurrentPage(p => Math.min(maxPage, p + 1))}
                 disabled={currentPage === maxPage}
                 className="px-6 py-2 rounded-full border border-black/10 dark:border-white/10 text-xs font-black uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
               >
                 Next
               </button>
             </div>
           )}
        </div>
      ) : (
        <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 p-20 rounded-[2.5rem] text-center space-y-6">
          <AlertCircle size={64} className="mx-auto text-black/10 dark:text-white/10" />
          <h3 className="text-2xl font-black uppercase italic">
            {searchQuery ? "No Results Found" : missingQueries.length > 0 ? "No Direct Matches Found" : "Wardrobe Complete"}
          </h3>
          <p className="text-black/40 dark:text-white/40 max-w-sm mx-auto font-medium">
            {searchQuery
              ? `No retail matches found for "${searchQuery}". Try a different keyword.`
              : missingQueries.length > 0 
                ? `We couldn't find exact retail matches for ${missingQueries.join(' or ')} at our primary partners right now. Try a different dress code or check back later.`
                : "Your digital twin currently satisfies all generated style compositions. No external recommendations found."}
          </p>
        </div>
      )}
    </div>
  );
}

function SavedEnsemblesView({ session, closet, searchQuery, requestConfirm, savedOutfits, setSavedOutfits, loading }: { session: Session; closet: ClothingItem[]; searchQuery: string; requestConfirm: (title: string, message: string, onConfirm: () => void) => void; savedOutfits: any[]; setSavedOutfits: React.Dispatch<React.SetStateAction<any[]>>; loading: boolean; }) {
  const [selectedOutfit, setSelectedOutfit] = useState<any | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"Concept Creations" | "Inspired Matches">("Concept Creations");

  const conceptOutfits = savedOutfits.filter(o => !o.outfit_data?.inspiration_image);
  const inspiredOutfits = savedOutfits.filter(o => o.outfit_data?.inspiration_image);

  let displayOutfits = activeSubTab === "Concept Creations" ? conceptOutfits : inspiredOutfits;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    displayOutfits = displayOutfits.filter(o => {
      const matchesDressCode = o.dress_code?.toLowerCase().includes(q);
      const components = Array.isArray(o.outfit_data) ? o.outfit_data : o.outfit_data?.components || [];
      const matchesCategory = components.some((c: any) => 
        c.category?.toLowerCase().includes(q) || 
        c.missingItemQuery?.toLowerCase().includes(q)
      );
      return matchesDressCode || matchesCategory;
    });
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black tracking-tighter uppercase italic">Saved Ensembles</h2>
          <p className="text-black/40 dark:text-white/40 mt-2 font-medium uppercase tracking-widest text-xs">Your personal style vault of generated combinations.</p>
        </div>
        
        <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveSubTab("Concept Creations")}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === "Concept Creations" 
                ? 'bg-white dark:bg-[#111] shadow-lg text-black dark:text-white' 
                : 'text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white'
            }`}
          >
            Concept Creations
          </button>
          <button 
            onClick={() => setActiveSubTab("Inspired Matches")}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === "Inspired Matches" 
                ? 'bg-white dark:bg-[#111] shadow-lg text-black dark:text-white' 
                : 'text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white'
            }`}
          >
            Inspired Matches
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 size={48} className="animate-spin text-red-600" />
        </div>
      ) : displayOutfits.length === 0 ? (
        <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 p-20 rounded-[2.5rem] text-center space-y-6">
          <Bookmark size={64} className="mx-auto text-black/10 dark:text-white/10" />
          <h3 className="text-2xl font-black uppercase italic">No Ensembles Found</h3>
          <p className="text-black/40 dark:text-white/40 max-w-sm mx-auto font-medium">
            Generate and save outfits in the Concept Stylist to see them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayOutfits.map((saved) => {
            const components = Array.isArray(saved.outfit_data) ? saved.outfit_data : saved.outfit_data?.components || [];
            const inspirationImage = saved.outfit_data?.inspiration_image;

            return (
            <div 
              key={saved.id}
              onClick={() => setSelectedOutfit(saved)}
              className="bg-gray-50 dark:bg-[#0A0A0A] p-6 rounded-3xl border border-black/5 dark:border-white/5 cursor-pointer group hover:-translate-y-2 hover:border-red-600/50 transition-all duration-300 shadow-xl shadow-transparent hover:shadow-red-600/5 relative overflow-hidden flex flex-col"
            >
              {activeSubTab === "Inspired Matches" && inspirationImage ? (
                <div className="aspect-[4/5] w-full rounded-2xl overflow-hidden mb-6 relative">
                  <img src={encodeURI(`data:image/jpeg;base64,${inspirationImage}`)} alt="Inspiration" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4 text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Inspired By</p>
                    <h3 className="text-lg font-black uppercase italic truncate">{saved.dress_code || "Generated Look"}</h3>
                  </div>
                </div>
              ) : (
                <>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black uppercase italic tracking-tight group-hover:text-red-600 transition-colors">{saved.dress_code || "Generated Look"}</h3>
                      <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mt-1">
                        {new Date(saved.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-[#111] shadow-lg flex items-center justify-center text-red-600">
                      <Bookmark size={18} fill="currentColor" />
                    </div>
                  </div>
                </>
              )}

              <div className="flex -space-x-4 mb-4 mt-auto">
                {components.slice(0, 3).map((comp: any, idx: number) => {
                   const matchedItem = comp.matchedClosetItemId ? closet.find(i => i.id === comp.matchedClosetItemId) : null;
                   return (
                     <div key={idx} className="w-16 h-16 rounded-full border-4 border-gray-50 dark:border-[#0A0A0A] bg-gray-200 dark:bg-[#111] overflow-hidden shrink-0 shadow-md">
                       {matchedItem ? (
                         <img src={matchedItem.image} alt={matchedItem.name} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-[8px] font-black uppercase text-red-500 bg-red-500/10">Missing</div>
                       )}
                     </div>
                   );
                })}
                {components.length > 3 && (
                  <div className="w-16 h-16 rounded-full border-4 border-gray-50 dark:border-[#0A0A0A] bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-black shadow-md z-10">
                    +{components.length - 3}
                  </div>
                )}
              </div>
              
              <p className="text-[10px] uppercase font-black tracking-widest text-black/40 dark:text-white/40 group-hover:text-black dark:group-hover:text-white transition-colors flex items-center gap-1 mt-2">
                View Details <ArrowRight size={12} />
              </p>
            </div>
            );
          })}
        </div>
      )}

      {/* Outfit Detail Modal */}
      <AnimatePresence>
        {selectedOutfit && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#111] p-8 rounded-[2.5rem] w-full max-w-3xl border border-black/10 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative"
            >
              <button 
                onClick={() => setSelectedOutfit(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors text-black/60 dark:text-white/60"
              >
                <X size={20} />
              </button>

              <div className="mb-10 pr-12 flex gap-8">
                {selectedOutfit.outfit_data?.inspiration_image && (
                   <div className="w-32 h-40 rounded-2xl overflow-hidden shrink-0 shadow-xl">
                      <img src={encodeURI(`data:image/jpeg;base64,${selectedOutfit.outfit_data.inspiration_image}`)} className="w-full h-full object-cover" alt="Inspiration" />
                   </div>
                )}
                <div>
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2">Ensemble Details</p>
                  <h3 className="text-4xl font-black uppercase italic tracking-tighter">{selectedOutfit.dress_code || "Generated Look"}</h3>
                  <p className="text-xs font-medium text-black/40 dark:text-white/40 uppercase tracking-widest mt-2">
                    Created on {new Date(selectedOutfit.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {(Array.isArray(selectedOutfit.outfit_data) ? selectedOutfit.outfit_data : selectedOutfit.outfit_data?.components || []).map((comp: any, idx: number) => {
                  const matchedItem = comp.matchedClosetItemId ? closet.find(i => i.id === comp.matchedClosetItemId) : null;
                  return (
                    <div key={idx} className={`bg-gray-50 dark:bg-[#0A0A0A] p-4 rounded-3xl border ${matchedItem ? 'border-black/5 dark:border-white/5' : 'border-red-500/30 bg-red-500/5'} flex flex-col h-full`}>
                      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-200 dark:bg-[#111] mb-4 relative">
                        {matchedItem ? (
                          <img src={matchedItem.image} className="w-full h-full object-cover" alt={matchedItem.name} />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                             <ShoppingBag size={32} className="text-red-500 mb-2 opacity-50" />
                             <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Missing Piece</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-auto">
                        <p className={`text-[9px] uppercase font-black tracking-widest mb-1 ${matchedItem ? 'text-black/50 dark:text-white/50' : 'text-red-500'}`}>{comp.category}</p>
                        <h4 className="font-bold text-xs uppercase leading-tight line-clamp-2" title={matchedItem ? matchedItem.name : comp.missingItemQuery || "Missing"}>
                          {matchedItem ? matchedItem.name : comp.missingItemQuery || "Requires Purchase"}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-10 pt-8 border-t border-black/5 dark:border-white/5 flex justify-end gap-4">
                 <button 
                   onClick={() => {
                     requestConfirm("Delete Ensemble", "Bu kombini silmek istediğinize emin misiniz?", async () => {
                        await supabase.from('saved_outfits').delete().eq('id', selectedOutfit.id);
                        setSavedOutfits(prev => prev.filter(o => o.id !== selectedOutfit.id));
                        setSelectedOutfit(null);
                     });
                   }}
                   className="px-6 py-3 rounded-xl border border-red-600/30 text-red-600 font-black uppercase tracking-widest text-xs hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                 >
                   <Trash2 size={16} /> Delete Ensemble
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Modals

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void }) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-[#111] p-8 rounded-[2rem] w-full max-w-sm border border-black/10 dark:border-white/10 shadow-2xl"
        >
          <div className="w-12 h-12 rounded-full bg-red-600/10 flex items-center justify-center text-red-600 mb-6">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-xl font-black uppercase italic mb-2 tracking-tighter">{title}</h3>
          <p className="text-black/60 dark:text-white/60 mb-8 text-sm font-medium">{message}</p>
          <div className="flex gap-3">
            <button 
              onClick={onCancel}
              className="flex-1 p-3 bg-black/5 dark:bg-white/5 rounded-xl uppercase font-black tracking-widest text-xs hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black dark:text-white"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 p-3 bg-red-600 text-white rounded-xl uppercase font-black tracking-widest text-xs hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SettingsModal({ isOpen, onClose, session, addNotification }: { isOpen: boolean, onClose: () => void, session: Session, addNotification: (t: any, m: string) => void }) {
  const [activeTab, setActiveTab] = useState<'Account' | 'Preferences'>('Account');
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      supabase.from('profiles').select('full_name').eq('id', session.user.id).single()
        .then(({data, error}) => {
          if (data && data.full_name) setFullName(data.full_name);
        });
    }
  }, [isOpen, session.user.id]);

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        full_name: fullName,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      addNotification('success', 'Preferences saved!');
    } catch (err: any) {
      addNotification('error', 'Could not save preferences (do you have the profiles table?)');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }} 
          animate={{ scale: 1, y: 0 }} 
          exit={{ scale: 0.95, y: 20 }}
          className="bg-white dark:bg-[#111] rounded-[2rem] w-full max-w-2xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[400px]"
        >
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-gray-50 dark:bg-[#0A0A0A] p-6 border-r border-black/5 dark:border-white/5 flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/40 dark:text-white/40 mb-6">Settings</h3>
            <div className="space-y-2 flex-1">
              <button 
                onClick={() => setActiveTab('Account')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'Account' ? 'bg-black/5 dark:bg-white/5 text-black dark:text-white' : 'text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white'}`}
              >
                <User size={16} /> Account
              </button>
              <button 
                onClick={() => setActiveTab('Preferences')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'Preferences' ? 'bg-black/5 dark:bg-white/5 text-black dark:text-white' : 'text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white'}`}
              >
                <Sun size={16} /> Preferences
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-8 relative flex flex-col">
            <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors text-black dark:text-white">
              <X size={16} />
            </button>
            <h2 className="text-3xl font-black uppercase italic mb-8 tracking-tighter text-black dark:text-white">{activeTab}</h2>
            
            <div className="flex-1">
              {activeTab === 'Account' && (
                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 block mb-2">Email Address</label>
                    <div className="bg-black/5 dark:bg-white/5 px-4 py-3 rounded-xl border border-black/5 dark:border-white/5 font-medium text-sm text-black dark:text-white">
                      {session.user.email}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 block mb-2">Danger Zone</label>
                    <div className="p-4 rounded-2xl border border-red-600/20 bg-red-600/5 flex items-center justify-between">
                      <div className="mr-4">
                        <p className="text-sm font-bold text-red-600">Sign Out</p>
                        <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 mt-1">End your current session</p>
                      </div>
                      <button 
                        onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                        className="px-6 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition shadow-lg shrink-0"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Preferences' && (
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 block mb-2">Display Name</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-transparent border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none transition text-black dark:text-white"
                    />
                    <p className="text-[10px] text-black/40 dark:text-white/40 uppercase tracking-widest mt-2">This is how we'll refer to you.</p>
                  </div>
                  <div className="pt-6 border-t border-black/5 dark:border-white/5">
                    <button 
                      onClick={savePreferences}
                      disabled={saving}
                      className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black/80 dark:hover:bg-white/80 transition disabled:opacity-50 shadow-xl"
                    >
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PaywallModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white dark:bg-[#111] p-10 rounded-[2.5rem] w-full max-w-md border border-red-600/30 shadow-[0_0_50px_rgba(220,38,38,0.2)] text-center relative overflow-hidden"
        >
          {/* Background Elements */}
          <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-red-600/10 blur-[60px] rounded-full pointer-events-none"></div>
          
          <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors text-black dark:text-white z-10">
            <X size={16} />
          </button>

          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-red-600 to-red-400 flex items-center justify-center text-white mb-6 shadow-xl shadow-red-600/30 rotate-3">
            <Sparkles size={36} />
          </div>

          <h3 className="text-3xl font-black uppercase italic mb-2 tracking-tighter">VogueVault <span className="text-red-600">Pro</span></h3>
          <p className="text-black/50 dark:text-white/50 mb-8 text-sm font-medium tracking-wide">
            You've reached your AI Stylist limits. Upgrade to unlock unlimited AI outfit generation, faster responses, and exclusive styling algorithms.
          </p>

          <div className="space-y-3 mb-8 text-left">
            <div className="flex items-center gap-3 text-sm font-bold">
              <CheckCircle2 size={16} className="text-red-600" /> <span>Unlimited AI Concept Styling</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-bold">
              <CheckCircle2 size={16} className="text-red-600" /> <span>Priority API Access (No Waiting)</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-bold">
              <CheckCircle2 size={16} className="text-red-600" /> <span>Advanced Smart Commerce Matches</span>
            </div>
          </div>

          <a 
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="block w-full p-4 bg-red-600 text-white rounded-2xl uppercase font-black tracking-widest text-sm hover:bg-red-700 hover:-translate-y-1 transition-all shadow-xl shadow-red-600/20"
          >
            Upgrade Now
          </a>
          
          <button 
            onClick={onClose}
            className="mt-4 text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
          >
            Maybe Later
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
function OnboardingModal({ isOpen, session, onComplete }: { isOpen: boolean, session: Session, onComplete: (brands: string[]) => void }) {
  const [step, setStep] = useState(1);
  const [discoverySource, setDiscoverySource] = useState("");
  const [stylePreference, setStylePreference] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const availableBrands = ["Bershka", "Zara", "H&M", "Mango", "Pull & Bear", "Stradivarius", "ASOS", "Farfetch"];

  const toggleBrand = (brand: string) => {
    setBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        onboarding_completed: true,
        favorite_brands: brands,
        discovery_source: discoverySource,
        preferred_style: stylePreference,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      onComplete(brands);
    } catch (err: any) {
      alert("Profil güncellenirken bir hata oluştu: " + err.message);
      onComplete(brands); // Hata olsa bile devam et, test edebilsinler
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white dark:bg-[#111] p-10 rounded-[3rem] w-full max-w-2xl border border-red-600/20 shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-black/5 dark:bg-white/5">
          <motion.div 
            className="h-full bg-red-600" 
            animate={{ width: `${(step / 3) * 100}%` }} 
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="mb-10 text-center mt-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-600/10 flex items-center justify-center text-red-600 mb-4">
            <Sparkles size={28} />
          </div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-black dark:text-white">Welcome to VogueVault</h2>
          <p className="text-black/50 dark:text-white/50 text-xs font-bold uppercase tracking-widest mt-2">Let's tailor the AI to your style</p>
        </div>

        <div className="min-h-[200px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h3 className="text-xl font-bold mb-4 text-black dark:text-white">How did you hear about us?</h3>
                <div className="grid grid-cols-2 gap-4">
                  {["TikTok", "Instagram", "Friend", "Search Engine", "Other"].map(source => (
                    <button 
                      key={source}
                      onClick={() => setDiscoverySource(source)}
                      className={`p-4 rounded-2xl border transition-all text-sm font-bold ${discoverySource === source ? 'border-red-600 bg-red-600/10 text-red-600' : 'border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h3 className="text-xl font-bold mb-4 text-black dark:text-white">What is your primary aesthetic?</h3>
                <div className="grid grid-cols-2 gap-4">
                  {["Streetwear", "Minimalist", "Y2K", "Avant-Garde", "Casual", "Vintage"].map(style => (
                    <button 
                      key={style}
                      onClick={() => setStylePreference(style)}
                      className={`p-4 rounded-2xl border transition-all text-sm font-bold ${stylePreference === style ? 'border-red-600 bg-red-600/10 text-red-600' : 'border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h3 className="text-xl font-bold mb-1 text-black dark:text-white">Where do you usually shop?</h3>
                <p className="text-[10px] text-black/40 dark:text-white/40 uppercase tracking-widest font-bold mb-4">Select multiple. We'll prioritize these in Smart Commerce.</p>
                <div className="flex flex-wrap gap-3">
                  {availableBrands.map(brand => (
                    <button 
                      key={brand}
                      onClick={() => toggleBrand(brand)}
                      className={`px-6 py-3 rounded-full border transition-all text-xs font-black uppercase tracking-widest ${brands.includes(brand) ? 'border-red-600 bg-red-600 text-white shadow-lg shadow-red-600/20' : 'border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-between mt-10 pt-6 border-t border-black/5 dark:border-white/5">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors">
              Back
            </button>
          ) : <div></div>}

          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !discoverySource || step === 2 && !stylePreference} className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100">
              Continue
            </button>
          ) : (
            <button onClick={handleComplete} disabled={saving} className="px-8 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50">
              {saving ? 'Saving...' : 'Finish Setup'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
