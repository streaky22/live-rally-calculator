import React, { useState, useEffect } from 'react';
import { db, secondaryAuth, createUserWithEmailAndPassword } from '../../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Trash2, UserPlus, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [emails, setEmails] = useState<string[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'admins'), (docSnap) => {
      if (docSnap.exists()) {
        setEmails(docSnap.data().allowedEmails || []);
      } else {
        // Initialize if not exists
        setDoc(doc(db, 'settings', 'admins'), { allowedEmails: [] }).catch(err => {
          console.error("Error initializing admins:", err);
        });
      }
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error fetching admins:", err);
      setError("No tienes permisos para ver o modificar los administradores.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    if (!newUsername || !newPassword) return;
    
    // We append @rally.local to make it a valid email for Firebase Auth
    const emailToAdd = `${newUsername.toLowerCase().trim()}@rally.local`;
    
    if (emails.includes(emailToAdd)) {
      setFormMessage({ type: 'error', text: 'Este usuario ya tiene permisos de administrador.' });
      return;
    }

    try {
      // Create the user in Firebase Auth using the secondary app (so we don't log out the current admin)
      await createUserWithEmailAndPassword(secondaryAuth, emailToAdd, newPassword);
      await secondaryAuth.signOut(); // Clean up secondary auth state

      // Add to allowed admins list
      const updated = [...emails, emailToAdd];
      await setDoc(doc(db, 'settings', 'admins'), { allowedEmails: updated });
      
      setNewUsername('');
      setNewPassword('');
      setFormMessage({ type: 'success', text: `Usuario "${newUsername}" creado con éxito.` });
    } catch (err: any) {
      console.error("Error adding admin:", err);
      if (err.code === 'auth/email-already-in-use') {
        setFormMessage({ type: 'error', text: 'El usuario ya existe en el sistema.' });
      } else if (err.code === 'auth/weak-password') {
        setFormMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      } else if (err.code === 'auth/operation-not-allowed') {
        setFormMessage({ type: 'error', text: 'ATENCIÓN: Debes ir a la consola de Firebase -> Authentication -> Sign-in method y habilitar "Correo electrónico/Contraseña".' });
      } else {
        setFormMessage({ type: 'error', text: `Error al crear el usuario: ${err.message}` });
      }
    }
  };

  const confirmRemove = async () => {
    if (!userToDelete) return;
    try {
      const updated = emails.filter(e => e !== userToDelete);
      await setDoc(doc(db, 'settings', 'admins'), { allowedEmails: updated });
      setUserToDelete(null);
      setFormMessage({ type: 'success', text: 'Usuario eliminado correctamente.' });
    } catch (err) {
      console.error("Error removing admin:", err);
      setFormMessage({ type: 'error', text: 'Error al eliminar administrador.' });
      setUserToDelete(null);
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Cargando administradores...</div>;

  if (error) return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
      <ShieldAlert className="text-red-500 mt-0.5" size={20} />
      <div>
        <h3 className="text-red-800 font-medium">Acceso Denegado</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Gestión de Administradores</h3>
        <p className="text-sm text-gray-500">
          Crea usuarios y contraseñas para que otras personas puedan editar los tiempos del rally.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 max-w-2xl items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Nombre de Usuario</label>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="ej. crono1"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Contraseña (mín. 6 caracteres)</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 h-[38px]"
        >
          <UserPlus size={16} />
          Crear Usuario
        </button>
      </form>

      {formMessage && (
        <div className={`p-3 rounded-md flex items-start gap-2 max-w-2xl ${formMessage.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
          {formMessage.type === 'error' ? <AlertCircle size={18} className="mt-0.5 flex-shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />}
          <span className="text-sm">{formMessage.text}</span>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200 max-w-2xl">
        <ul className="divide-y divide-gray-200">
          <li className="px-4 py-4 flex items-center justify-between bg-gray-50">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900">AntonioJoseAliagaMolina@gmail.com</span>
              <span className="ml-3 px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                Propietario
              </span>
            </div>
          </li>
          {emails.map((email) => {
            const isCustomUser = email.endsWith('@rally.local');
            const displayEmail = isCustomUser ? email.replace('@rally.local', '') : email;
            
            return (
              <li key={email} className="px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900 font-medium">{displayEmail}</span>
                  {isCustomUser && (
                    <span className="px-2 py-0.5 inline-flex text-[10px] leading-4 font-semibold rounded-full bg-blue-100 text-blue-800">
                      Usuario Local
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setUserToDelete(email)}
                  className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-100 transition-colors"
                  title="Eliminar acceso"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            );
          })}
          {emails.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-gray-500">
              No hay administradores adicionales configurados.
            </li>
          )}
        </ul>
      </div>

      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar Usuario</h3>
            <p className="text-gray-600 mb-6">
              ¿Seguro que quieres quitar el acceso a <strong>{userToDelete.replace('@rally.local', '')}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmRemove}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
