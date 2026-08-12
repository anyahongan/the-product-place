import { useState } from "react";
import { Sheet, Tape } from "@/components/paper/Paper";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";
import { useAuth } from "@/components/auth/AuthProvider";

export function AuthModal({ onClose }: { onClose: () => void }) {
  const { signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!configured) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/50 p-4">
        <Sheet tone="paper" shadow="hard" className="relative w-full max-w-md px-5 py-5">
          <Tape className="-top-3 left-8" color="blue" angle={-4} width={100} height={22} />
          <p className="font-display text-[1.4rem] font-black uppercase">Auth not configured</p>
          <p className="mt-3 text-[0.95rem] text-ink-soft">
            Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local, then restart the
            dev server.
          </p>
          <div className="mt-4">
            <PinkHoverButton variant="closeSm" hoverAccent="yellow" onClick={onClose}>
              Close
            </PinkHoverButton>
          </div>
        </Sheet>
      </div>
    );
  }

  const submit = async () => {
    setBusy(true);
    setError(null);
    const result =
      mode === "signin" ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/50 p-4">
      <Sheet tone="paper" shadow="hard" className="relative w-full max-w-md px-5 py-5">
        <Tape className="-top-3 left-8" color="blue" angle={-4} width={100} height={22} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="tag text-blue">The Product Place</p>
            <h2 className="mt-1 font-display text-[1.6rem] font-black uppercase leading-none">
              {mode === "signin" ? "Sign in" : "Create account"}
            </h2>
          </div>
          <PinkHoverButton variant="closeSm" hoverAccent="yellow" onClick={onClose}>
            Close
          </PinkHoverButton>
        </div>
        <p className="mt-3 text-[0.92rem] text-ink-soft">
          Email and password for now. Your applications and network stay private to this account.
        </p>
        <label className="mt-4 block">
          <span className="tag text-ink-faint">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border-2 border-ink bg-paper-2 px-3 py-2 outline-none focus:bg-yellow-wash"
            autoComplete="email"
          />
        </label>
        <label className="mt-3 block">
          <span className="tag text-ink-faint">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border-2 border-ink bg-paper-2 px-3 py-2 outline-none focus:bg-yellow-wash"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
        </label>
        {error && <p className="mt-3 text-[0.9rem] text-pink">{error}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <PinkHoverButton variant="ink" disabled={busy || !email || password.length < 6} onClick={() => void submit()}>
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </PinkHoverButton>
          <PinkHoverButton
            variant="paper"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
          >
            {mode === "signin" ? "Need an account?" : "Have an account?"}
          </PinkHoverButton>
        </div>
      </Sheet>
    </div>
  );
}
