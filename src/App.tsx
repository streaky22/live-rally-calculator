/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { PublicView } from './components/PublicView';
import { Rally, PenaltyConfig } from './types';
import { Download, Upload, Trash2, LogIn, LogOut } from 'lucide-react';
import { db, auth, signInWithGoogle, logOut, signInWithEmailAndPassword } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

const DEFAULT_PENALTIES: PenaltyConfig[] = [
  { id: 'p1', name: 'CH Tarde', type: 'TC_LATE', timeValueMs: 10000, calculationMethod: 'PER_MINUTE' },
  { id: 'p2', name: 'CH Pronto', type: 'TC_EARLY', timeValueMs: 60000, calculationMethod: 'PER_MINUTE' },
  { id: 'p3', name: 'Salida Falsa', type: 'TIME', timeValueMs: 10000 },
  { id: 'p4', name: 'Saltarse Chicane', type: 'TIME', timeValueMs: 30000 },
  { id: 'p5', name: 'Asistencia Tarde', type: 'TC_LATE', timeValueMs: 10000, calculationMethod: 'PER_MINUTE' },
  { id: 'p6', name: 'Super Rally', type: 'SUPER_RALLY', timeValueMs: 600000 }
];

const INITIAL_RALLY: Rally = {
  id: 'r1',
  name: 'New Rally',
  participants: [],
  stages: [],
  timeControls: [],
  penaltyConfigs: DEFAULT_PENALTIES,
  stageTimes: [],
  tcPenalties: []
};

export default function App() {
  const [view, setView] = useState<'PUBLIC' | 'ADMIN'>('PUBLIC');
  const [showResetModal, setShowResetModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [rally, setRally] = useState<Rally | null>(null);
  const [isFirebaseReady, setIsFirebaseReady] = useState(!!db);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Authentication listener
  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth is not initialized.");
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore listener
  useEffect(() => {
    if (!db) {
      console.error("Firebase DB is not initialized.");
      setIsFirebaseReady(false);
      setRally(INITIAL_RALLY); // Fallback to local state if no DB
      return;
    }
    setIsFirebaseReady(true);
    const unsubscribe = onSnapshot(doc(db, 'rallies', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRally({
          ...INITIAL_RALLY,
          ...data,
          participants: data.participants || [],
          stages: data.stages || [],
          timeControls: data.timeControls || [],
          penaltyConfigs: data.penaltyConfigs || DEFAULT_PENALTIES,
          stageTimes: data.stageTimes || [],
          tcPenalties: data.tcPenalties || []
        } as Rally);
      } else {
        // If it doesn't exist in Firestore, initialize it
        setRally(INITIAL_RALLY);
        setDoc(doc(db, 'rallies', 'main'), INITIAL_RALLY).catch(console.error);
      }
    }, (error) => {
      console.error("Error fetching rally data:", error);
      setRally(INITIAL_RALLY); // Fallback on error
    });

    return () => unsubscribe();
  }, []);

  // Wrapper for setRally that also updates Firestore
  const handleSetRally = (action: React.SetStateAction<Rally>) => {
    if (typeof action === 'function') {
      setRally((prev) => {
        const next = action(prev);
        // Write to Firestore asynchronously, stripping undefined values
        if (user && db) {
          const cleanNext = JSON.parse(JSON.stringify(next));
          setDoc(doc(db, 'rallies', 'main'), cleanNext).catch(console.error);
        }
        return next;
      });
    } else {
      setRally(action);
      if (user && db) {
        const cleanNext = JSON.parse(JSON.stringify(action));
        setDoc(doc(db, 'rallies', 'main'), cleanNext).catch(console.error);
      }
    }
  };

  const handleExport = () => {
    if (!rally) return;
    const dataStr = JSON.stringify(rally, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${rally.name.replace(/\s+/g, '_').toLowerCase()}_backup.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedRally = JSON.parse(content) as Rally;
        
        // Basic validation
        if (parsedRally && parsedRally.id && Array.isArray(parsedRally.participants)) {
          handleSetRally(parsedRally);
          alert('Rally loaded successfully!');
        } else {
          alert('Invalid file format.');
        }
      } catch (error) {
        alert('Error parsing the file.');
        console.error(error);
      }
    };
    reader.readAsText(file);
    
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const executeReset = () => {
    const freshRally: Rally = {
      id: 'r' + Date.now(),
      name: 'Nuevo Rally',
      participants: [],
      stages: [],
      timeControls: [],
      penaltyConfigs: DEFAULT_PENALTIES,
      stageTimes: [],
      tcPenalties: []
    };
    handleSetRally(freshRally);
    setShowResetModal(false);
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUsername || !loginPassword) return;
    
    try {
      const emailToLogin = loginUsername.includes('@') ? loginUsername : `${loginUsername.toLowerCase().trim()}@rally.local`;
      await signInWithEmailAndPassword(auth, emailToLogin, loginPassword);
      setLoginUsername('');
      setLoginPassword('');
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginError("Usuario o contraseña incorrectos.");
    }
  };

  if (!rally) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del rally...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      {!db && (
        <div className="bg-red-600 text-white px-4 py-3 text-center text-sm font-medium">
          ⚠️ <strong>Atención:</strong> La base de datos no está conectada. Si estás viendo esto en Vercel, necesitas configurar las variables de entorno de Firebase en los ajustes de tu proyecto en Vercel.
        </div>
      )}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">Calculadora de Rally</h1>
            <span className="hidden sm:inline-block text-slate-400 text-sm border-l border-slate-700 pl-3 ml-1">
              {rally?.name || 'Cargando...'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {view === 'ADMIN' && user && (
              <div className="flex items-center gap-2 mr-4 border-r border-slate-700 pr-4">
                <button 
                  onClick={handleExport}
                  className="flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  title="Export Rally Data"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  title="Import Rally Data"
                >
                  <Upload size={16} />
                  <span className="hidden sm:inline">Import</span>
                </button>
                <button 
                  onClick={() => setShowResetModal(true)}
                  className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 transition-colors ml-2 pl-2 border-l border-slate-700"
                  title="Clear All Data"
                >
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">Borrar Todo</span>
                </button>
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  onChange={handleImport} 
                  className="hidden" 
                />
              </div>
            )}
            <nav className="flex gap-2 items-center">
              <button 
                onClick={() => setView('PUBLIC')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'PUBLIC' ? 'bg-white/20 text-white' : 'text-slate-300 hover:bg-white/10'}`}
              >
                Public View
              </button>
              <button 
                onClick={() => setView('ADMIN')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'ADMIN' ? 'bg-white/20 text-white' : 'text-slate-300 hover:bg-white/10'}`}
              >
                Admin
              </button>
              {user && (
                <div className="ml-2 pl-3 border-l border-slate-700 flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 text-slate-300 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700" title="Conectado">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <span className="text-xs font-medium">
                      {user.email?.endsWith('@rally.local') ? user.email.replace('@rally.local', '') : user.email}
                    </span>
                  </div>
                  <button 
                    onClick={logOut}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                    title="Cerrar Sesión"
                  >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Salir</span>
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'ADMIN' ? (
          user ? (
            <AdminPanel rally={rally} setRally={handleSetRally} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md w-full text-left">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Acceso de Administrador</h2>
                
                <form onSubmit={handleCustomLogin} className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                    <input 
                      type="text" 
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border"
                      placeholder="Usuario"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input 
                      type="password" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border"
                      placeholder="••••••"
                      required
                    />
                  </div>
                  
                  {loginError && (
                    <p className="text-red-500 text-sm">{loginError}</p>
                  )}
                  
                  <button 
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-2.5 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    <LogIn size={18} />
                    Entrar
                  </button>
                </form>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">O accede como propietario</span>
                  </div>
                </div>

                <button 
                  onClick={async () => {
                    try {
                      setLoginError('');
                      await signInWithGoogle();
                    } catch (error: any) {
                      setLoginError(error.message || "Error al iniciar sesión con Google.");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continuar con Google
                </button>
              </div>
            </div>
          )
        ) : (
          <PublicView rally={rally} />
        )}
      </main>

      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-100 text-red-600">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Borrar todos los datos</h3>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres borrar todos los datos del rally? Esta acción no se puede deshacer y eliminará todos los participantes, tramos, controles horarios y tiempos.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={executeReset}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors font-medium"
              >
                Sí, borrar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
