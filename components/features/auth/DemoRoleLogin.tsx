"use client";

import { useState } from "react";
import { User, Briefcase, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";

interface DemoRoleLoginProps {
  className?: string;
}

const ROLES = [
  {
    id: "contractor",
    name: "Contractor",
    tagline: "Browse projects & submit bids",
    icon: Briefcase,
    accent: "text-amber-500",
  },
  {
    id: "homeowner",
    name: "Homeowner",
    tagline: "Post renovations & review quotes",
    icon: User,
    accent: "text-orange-500",
  },
  {
    id: "admin",
    name: "Admin",
    tagline: "Verify contractors & audit",
    icon: ShieldCheck,
    accent: "text-purple-500",
  },
] as const;

export function DemoRoleLogin({ className = "" }: DemoRoleLoginProps) {
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleQuickLogin = async (role: "homeowner" | "contractor" | "admin", label: string) => {
    if (loadingRole) return;
    setLoadingRole(role);

    try {
      const response = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.session) {
        throw new Error(data.error || "Authentication failed");
      }

      // Passwordless session establishment in browser client
      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionError) throw sessionError;

      toast.success(`Connected as ${label}`, { duration: 2000 });

      setTimeout(() => {
        window.location.href = data.redirectUrl || `/${role}/dashboard`;
      }, 150);
    } catch (err: any) {
      console.error("Quick login failed:", err);
      toast.error(err?.message || "Sign-in failed");
      setLoadingRole(null);
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Subtle Pro Header */}
      <div className="flex items-center justify-between text-xs px-0.5">
        <span className="flex items-center gap-2 font-semibold text-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          Live Platform Preview
        </span>
        <span className="text-[11px] text-muted-foreground font-normal">1-click instant access</span>
      </div>

      {/* Role Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {ROLES.map(({ id, name, tagline, icon: Icon, accent }) => {
          const isLoading = loadingRole === id;
          const isDisabled = !!loadingRole && !isLoading;

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleQuickLogin(id, name)}
              disabled={isDisabled || isLoading}
              className="p-3 text-left rounded-xl border border-border/70 dark:border-white/10 bg-background/60 hover:bg-muted/70 hover:border-foreground/20 active:scale-[0.98] transition-all flex flex-col justify-between group shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                    <Icon className={`h-3.5 w-3.5 ${accent}`} />
                    <span>{name}</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-1 leading-snug">
                  {tagline}
                </p>
              </div>

              {isLoading && (
                <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-orange-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Connecting...</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
