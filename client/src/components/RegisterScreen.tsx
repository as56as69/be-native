import { useState } from "react";

import { useGame } from "../state/GameContext";

/**
 * Simple name + phone registration screen (NO OTP, NO SMS).
 * Shown when there is no saved session yet.
 * If the phone already exists → logs into that account.
 */
export function RegisterScreen() {
  const { register } = useGame();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await register({ name: name.trim(), phone: phone.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="notebook-paper relative flex min-h-dvh flex-col items-center justify-center px-6 py-10 text-center">
      <div className="paper-hole fixed inset-x-0 top-0 flex justify-center gap-4 pt-4">
        <span className="paper-hole" />
        <span className="paper-hole" />
        <span className="paper-hole" />
      </div>

      <span className="stamp mb-8 rotate-2">Be Native • دليل بغداد الورقي</span>

      <h1 className="font-display text-3xl font-bold text-ink-700">
        Yo, my zone!
      </h1>
      <p className="mt-2 max-w-md text-sm text-ink-700/70">
        Let’s roll — ready to start the ride?
      </p>

      <form
        onSubmit={submit}
        className="notebook-card paper-edge mt-8 flex w-full max-w-sm -rotate-1 flex-col gap-3 bg-kraft-100 px-6 py-6 shadow-lg"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name, homie"
          className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2.5 text-right text-sm text-ink-700 outline-none placeholder:text-ink-700/40 focus:border-amber-900/60"
          dir="rtl"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0770xxxxxxx"
          className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2.5 text-left text-sm text-ink-700 outline-none placeholder:text-ink-700/40 focus:border-amber-900/60"
          dir="ltr"
          inputMode="tel"
        />
        {error && (
          <p className="text-xs text-red-700" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !name.trim() || !phone.trim()}
          className="mt-1 rounded-sm bg-amber-900 px-4 py-2.5 text-sm font-bold text-kraft-100 transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Hold up…" : "Sign up quick, homie"}
        </button>
      </form>
    </div>
  );
}
