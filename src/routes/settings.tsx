import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp } from "@/context/app-context";
import { Moon, Sun, LogOut, Camera, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
  const { user, theme, toggleTheme, logout, updateAvatar } = useApp();
  const nav = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pinInfo, setPinInfo] = useState<{ hasPin: boolean; locked: boolean }>({ hasPin: false, locked: false });
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [savingPin, setSavingPin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", sess.session.user.id)
          .maybeSingle();
        if (prof?.avatar_url) {
          const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(prof.avatar_url, 3600);
          if (signed?.signedUrl) setAvatarUrl(signed.signedUrl);
        }
      }
      try {
        const pin = localStorage.getItem("crestvest.payment_pin");
        setPinInfo({ hasPin: !!pin, locked: false });
      } catch { /* ignore */ }
    })();
  }, []);

  const onPickAvatar = async (file: File) => {
    setUploading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) throw new Error("Please sign in with the backend to upload.");
      const uid = sess.session.user.id;
      const path = `${uid}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      await supabase.from("profiles").update({ avatar_url: path }).eq("id", uid);
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
      if (signed?.signedUrl) setAvatarUrl(signed.signedUrl);
      await updateAvatar(path);
      toast.success("Profile picture updated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setUploading(false); }
  };

  const saveNewPin = async () => {
    if (!/^\d{4}$|^\d{6}$/.test(newPin)) { toast.error("PIN must be 4 or 6 digits"); return; }
    if (newPin !== confirmPin) { toast.error("PINs don't match"); return; }
    setSavingPin(true);
    try {
      localStorage.setItem("crestvest.payment_pin", newPin);
      toast.success("Payment PIN updated");
      setNewPin(""); setConfirmPin("");
      setPinInfo({ hasPin: true, locked: false });
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSavingPin(false); }
  };

  if (!user) return null;
  return (
    <DashboardShell title="Settings">
      <div className="space-y-4">
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold">Profile</h3>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover shadow-elegant" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-primary text-2xl font-bold text-primary-foreground shadow-elegant">
                  {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow hover:bg-muted"
                aria-label="Change profile picture"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onPickAvatar(e.target.files[0])}
              />
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold">{user.firstName} {user.lastName}</div>
              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-sm">
            <Row k="Name" v={`${user.firstName} ${user.lastName}`} />
            <Row k="Email (account ID)" v={user.email} />
            <Row k="Phone" v={user.phone || "—"} />
            <Row k="Tier" v={user.tier} />
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Payment PIN</h3>
          </div>
          {pinInfo?.locked && (
            <p className="mt-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              Payments are locked. Contact customer service via WhatsApp to unlock.
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {pinInfo?.hasPin ? "Change your Payment PIN below." : "You haven't set a PIN yet. Set one to authorize transfers."}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              type="password"
              inputMode="numeric"
              placeholder="New PIN (4 or 6 digits)"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              type="password"
              inputMode="numeric"
              placeholder="Confirm PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={saveNewPin}
            disabled={savingPin}
            className="mt-3 inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {savingPin && <Loader2 className="h-4 w-4 animate-spin" />}
            {pinInfo?.hasPin ? "Update PIN" : "Set PIN"}
          </button>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold">Appearance</h3>
          <button onClick={toggleTheme} className="mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Switch to {theme === "dark" ? "light" : "dark"} mode
          </button>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold">Language</h3>
          <select defaultValue="en" className="mt-2 rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="en">English</option><option value="es">Español</option><option value="fr">Français</option><option value="ar">العربية</option>
          </select>
        </div>
        <div className="glass rounded-2xl p-5 text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user.email}</span>
          <button onClick={async () => { await supabase.auth.signOut(); logout(); nav({ to: "/" }); }} className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between border-b py-2 last:border-0"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
}