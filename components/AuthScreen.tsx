"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ConfirmationResult,
  GoogleAuthProvider,
  RecaptchaVerifier,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ArrowRight, Eye, EyeOff, Search, ShieldCheck, Sparkles } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { readableError } from "@/lib/errors";
import { Brand } from "./Brand";

type AuthMode = "signin" | "register";
type AuthMethod = "email" | "phone";

async function ensureProfile(user: FirebaseUser, details?: { name?: string; studentId?: string }) {
  const reference = doc(db, "users", user.uid);
  const snapshot = await getDoc(reference);
  if (snapshot.exists() && !details) return;
  const current = snapshot.data() || {};
  await setDoc(reference, {
    name: details?.name?.trim() || current.name || user.displayName || "",
    studentId: details?.studentId?.trim() || current.studentId || "",
    email: current.email || user.email || "",
    programme: current.programme || "",
    yearOfStudy: current.yearOfStudy || "",
    phone: current.phone || user.phoneNumber || "",
    photoUrl: current.photoUrl || user.photoURL || "",
    createdAt: current.createdAt || Date.now(),
  });
}

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("+260");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const recaptcha = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => () => recaptcha.current?.clear(), []);

  async function emailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const email = String(form.get("email") || "").trim();
      const password = String(form.get("password") || "");
      if (mode === "register") {
        const name = String(form.get("name") || "").trim();
        const studentId = String(form.get("studentId") || "").trim();
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await ensureProfile(result.user, { name, studentId });
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await ensureProfile(result.user);
      }
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    setBusy(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      await ensureProfile(result.user);
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusy(false);
    }
  }

  async function sendPhoneCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      recaptcha.current?.clear();
      recaptcha.current = new RecaptchaVerifier(auth, "phone-recaptcha", { size: "invisible" });
      setConfirmation(await signInWithPhoneNumber(auth, phone.trim(), recaptcha.current));
    } catch (caught) {
      recaptcha.current?.clear();
      recaptcha.current = null;
      setError(readableError(caught));
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    if (!confirmation) return;
    setBusy(true);
    setError("");
    try {
      const result = await confirmation.confirm(code.trim());
      await ensureProfile(result.user);
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Brand />
        <div className="auth-story__content">
          <span className="eyebrow"><Sparkles size={15} /> Made for Copperbelt University</span>
          <h1>One campus.<br /><em>Fewer lost things.</em></h1>
          <p>Report something missing, share what you found, and help it get back where it belongs.</p>
          <div className="story-points">
            <span><Search size={20} /><b>Search live reports</b><small>Updates shared with the Android app</small></span>
            <span><ShieldCheck size={20} /><b>Campus-only records</b><small>Protected by Firebase sign-in</small></span>
          </div>
        </div>
        <p className="auth-story__footer">A student-built community service for CBU.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <Brand compact />
          <div className="auth-card__heading">
            <span className="eyebrow">Welcome to CBU FIND</span>
            <h2>{mode === "signin" ? "Good to see you." : "Join the campus network."}</h2>
            <p>{mode === "signin" ? "Sign in to browse and publish reports." : "Create your account in less than a minute."}</p>
          </div>

          <div className="auth-methods" role="tablist" aria-label="Sign-in method">
            <button className={method === "email" ? "active" : ""} onClick={() => setMethod("email")}>Email</button>
            <button className={method === "phone" ? "active" : ""} onClick={() => setMethod("phone")}>Phone</button>
          </div>

          {method === "email" ? (
            <form className="stack" onSubmit={emailSubmit}>
              {mode === "register" && (
                <div className="field-row">
                  <label>Full name<input required name="name" autoComplete="name" placeholder="Your full name" /></label>
                  <label>Student ID<input required name="studentId" placeholder="e.g. 2024-12345" /></label>
                </div>
              )}
              <label>Email address<input required type="email" name="email" autoComplete="email" placeholder="name@student.cbu.ac.zm" /></label>
              <label>Password
                <span className="password-field">
                  <input required minLength={6} type={showPassword ? "text" : "password"} name="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="At least 6 characters" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</button>
                </span>
              </label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="primary-button" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}<ArrowRight size={18} /></button>
            </form>
          ) : confirmation ? (
            <form className="stack" onSubmit={verifyCode}>
              <label>Verification code<input required inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} placeholder="6-digit code" /></label>
              <p className="form-note">Enter the SMS code sent to {phone}.</p>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="primary-button" disabled={busy}>{busy ? "Checking…" : "Verify and sign in"}<ArrowRight size={18} /></button>
              <button className="text-button" type="button" onClick={() => setConfirmation(null)}>Use another number</button>
            </form>
          ) : (
            <form className="stack" onSubmit={sendPhoneCode}>
              <label>Phone number<input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+260 97 000 0000" /></label>
              <p className="form-note">Standard SMS rates may apply. Zambia must be allowed in Firebase&apos;s SMS region policy.</p>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="primary-button" disabled={busy}>{busy ? "Sending…" : "Send verification code"}<ArrowRight size={18} /></button>
              <div id="phone-recaptcha" />
            </form>
          )}

          {method === "email" && (
            <>
              <div className="or"><span>or continue with</span></div>
              <button className="google-button" onClick={googleSignIn} disabled={busy}><span>G</span> Google</button>
            </>
          )}

          <p className="auth-switch">
            {mode === "signin" ? "New to CBU FIND?" : "Already have an account?"}{" "}
            <button onClick={() => { setMode(mode === "signin" ? "register" : "signin"); setError(""); }}>{mode === "signin" ? "Create account" : "Sign in"}</button>
          </p>
        </div>
      </section>
    </main>
  );
}
