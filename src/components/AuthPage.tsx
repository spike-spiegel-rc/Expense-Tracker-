import React, { useState } from 'react';
import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  doc,
  getDoc,
  setDoc
} from '../firebase';
import { normalizeUserId, isValidUserId } from '../utils';
import { Sparkles, Mail, Lock, User, LogIn, ArrowRight, UserPlus, HelpCircle } from 'lucide-react';

interface AuthPageProps {
  onSuccess: (userId: string) => void;
}

export default function AuthPage({ onSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [signupUserId, setSignupUserId] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resolveLoginEmail = async (val: string): Promise<string> => {
    const trimmed = val.trim();
    if (!trimmed) throw new Error("Enter user ID or email");
    if (trimmed.includes('@')) return trimmed;

    const normalized = normalizeUserId(trimmed);
    
    // Check locally saved alias first
    const localAlias = localStorage.getItem(`loginAlias:${normalized}`);
    if (localAlias) return localAlias;

    // Check directory in Firestore
    try {
      const aliasDocRef = doc(db, 'loginAliases', normalized);
      const docSnap = await getDoc(aliasDocRef);
      if (docSnap.exists() && docSnap.data()?.email) {
        const foundEmail = docSnap.data().email;
        localStorage.setItem(`loginAlias:${normalized}`, foundEmail);
        return foundEmail;
      }
    } catch (e) {
      console.warn("User ID lookup on server failed, fallback to direct entry:", e);
    }

    throw new Error("User ID not found. Check the ID spelling or log in with your email.");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!loginId || !password) {
      setError('Please provide your login credentials.');
      return;
    }
    
    setLoading(true);
    try {
      const email = await resolveLoginEmail(loginId);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Save local memory
      const uid = userCredential.user.uid;
      const finalId = loginId.includes('@') ? '' : normalizeUserId(loginId);
      
      // Store in standard places
      localStorage.setItem(`loginAlias:${uid}`, email);
      if (finalId) {
        localStorage.setItem(`loginAlias:${finalId}`, email);
        localStorage.setItem(`userId:${uid}`, finalId);
      }
      
      onSuccess(finalId || uid);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const cleanUserId = normalizeUserId(signupUserId);
    if (!isValidUserId(cleanUserId)) {
      setError('User ID must be 4–30 chars with letters, numbers, dots, underscores, or hyphens.');
      return;
    }
    if (!signupEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (signupPassword.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // Check alias availability first
      const aliasDocRef = doc(db, 'loginAliases', cleanUserId);
      const checkSnap = await getDoc(aliasDocRef);
      if (checkSnap.exists()) {
        throw new Error('This User ID is already taken. Please choose another one.');
      }

      // Create Cognito / Firebase credentials
      const credential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      const uid = credential.user.uid;

      // Register alias pairs on server-side
      const aliasPayload = {
        uid,
        email: signupEmail,
        userId: cleanUserId,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'loginAliases', uid), aliasPayload);
      await setDoc(doc(db, 'loginAliases', cleanUserId), aliasPayload);

      // Cache locally
      localStorage.setItem(`loginAlias:${uid}`, signupEmail);
      localStorage.setItem(`loginAlias:${cleanUserId}`, signupEmail);
      localStorage.setItem(`userId:${uid}`, cleanUserId);

      setSuccess(`Account registered successfully for ${cleanUserId}! Navigating to login...`);
      setTimeout(() => {
        setIsLogin(true);
        setLoginId(cleanUserId);
        setPassword('');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setSuccess('');
    let targetEmail = loginId.trim();
    
    if (!targetEmail || !targetEmail.includes('@')) {
      if (loginId) {
        try {
          targetEmail = await resolveLoginEmail(loginId);
        } catch {
          targetEmail = '';
        }
      }
    }
    
    if (!targetEmail) {
      const input = prompt('Enter your registered email address to recover your password:');
      if (input) targetEmail = input.trim();
    }

    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Please specify a valid email address for recovery.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setSuccess(`A password reset link has been dispatched to ${targetEmail}`);
    } catch (err: any) {
      setError('Could not initiate password recovery: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 selection:bg-slate-700 selection:text-white px-4 py-8 relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))]"></div>
      
      <div className="w-full max-w-md bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 font-medium px-4 py-1.5 rounded-full ring-1 ring-emerald-500/30 text-xs tracking-wide uppercase mb-3 select-none">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Fintech Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5 font-sans">
            Expense Tracker Pro
          </h1>
          <p className="text-sm text-slate-400">
            {isLogin ? 'Access your financial ledger overview' : 'Instantly deploy your custom cloud notebook'}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-2xl mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-2xl mb-6">
            {success}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                User ID or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g., ahmed123 or name@mail.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl focus:outline-none focus:border-slate-700 placeholder:text-slate-600 text-sm transition font-sans"
                  disabled={loading}
                  autoComplete="username"
                />
                <User className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-600" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl focus:outline-none focus:border-slate-700 placeholder:text-slate-600 text-sm transition"
                  disabled={loading}
                />
                <Lock className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-600" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center space-x-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-950 font-semibold rounded-2xl cursor-pointer disabled:opacity-50 text-sm transition-all focus:ring-2 focus:ring-slate-400 shadow-lg"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn className="w-4.5 h-4.5" />
                </>
              )}
            </button>

            <div className="flex flex-col items-center space-y-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
              >
                Create New Dedicated Account
              </button>
              <div className="flex space-x-3 text-slate-500">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="hover:text-slate-400 transition cursor-pointer"
                >
                  Forgot Password?
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => alert("To recover your user identity, please sign in with your registered email and view your ID within panel settings.")}
                  className="hover:text-slate-400 transition cursor-pointer"
                >
                  Forgot User ID?
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Desired User ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={signupUserId}
                  onChange={(e) => setSignupUserId(e.target.value)}
                  placeholder="e.g., ahmed123"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl focus:outline-none focus:border-slate-700 placeholder:text-slate-600 text-sm transition font-sans"
                  disabled={loading}
                  autoComplete="username"
                />
                <User className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-600" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="e.g., ahmed@mail.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl focus:outline-none focus:border-slate-700 placeholder:text-slate-600 text-sm transition font-sans"
                  disabled={loading}
                />
                <Mail className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-600" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Secret Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl focus:outline-none focus:border-slate-700 placeholder:text-slate-600 text-sm transition"
                  disabled={loading}
                />
                <Lock className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-600" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center space-x-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl cursor-pointer disabled:opacity-50 text-sm transition-all shadow-lg"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create Account</span>
                  <UserPlus className="w-4.5 h-4.5" />
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="text-slate-400 hover:text-slate-300 font-medium cursor-pointer"
              >
                Have an account? <span className="text-emerald-400">Back to Login</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
