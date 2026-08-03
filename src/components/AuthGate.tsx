import React, { useEffect, useState } from "react";
import { LogIn, LogOut, ShieldCheck } from "lucide-react";
import { User } from "firebase/auth";
import {
  AUTHORIZED_EMAIL,
  firebaseConfigReady,
  observeAuthState,
  signInWithGoogle,
  signOutOfWorkloadHub,
} from "../firebaseAuth";

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => observeAuthState((currentUser) => {
    setUser(currentUser);
    setChecking(false);
  }), []);

  const handleSignIn = async () => {
    try {
      setError("");
      const result = await signInWithGoogle();

      if (result.user.email?.toLowerCase() !== AUTHORIZED_EMAIL) {
        await signOutOfWorkloadHub();
        setError("This Google account is not authorized to access Workload Hub.");
      }
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(err?.message || "Google Sign-In failed.");
      }
    }
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <p className="text-slate-600">Checking secure session…</p>
      </main>
    );
  }

  const authorized = user?.email?.toLowerCase() === AUTHORIZED_EMAIL;

  if (!authorized) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <section className="w-full max-w-md bg-white border border-slate-200 shadow-lg p-8 text-center">
          <ShieldCheck className="w-12 h-12 text-[#006282] mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-2xl font-semibold text-slate-900">Workload Hub</h1>
          <p className="mt-2 text-slate-600">Sign in with the authorized Google account to continue.</p>

          {!firebaseConfigReady && (
            <p className="mt-5 bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
              Firebase browser configuration is not complete.
            </p>
          )}

          {error && (
            <p role="alert" className="mt-5 bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSignIn}
            disabled={!firebaseConfigReady}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-[#006282] px-4 py-3 font-semibold text-white hover:bg-[#004d66] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogIn className="w-5 h-5" aria-hidden="true" />
            Sign in with Google
          </button>
        </section>
      </main>
    );
  }

  return (
    <>
      <div className="fixed right-3 bottom-3 z-50 flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-md">
        <span>{user.email}</span>
        <button
          type="button"
          onClick={signOutOfWorkloadHub}
          className="inline-flex items-center gap-1 font-semibold text-[#006282] hover:underline"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          Sign out
        </button>
      </div>
      {children}
    </>
  );
}

