import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate({ to: "/" });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Login realizado com sucesso");
      navigate({ to: "/" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-[#D4AF37]/30 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#D4AF37]/10 p-3 rounded-full mb-4 ring-1 ring-[#D4AF37]/50">
            <ShieldCheck className="w-10 h-10 text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">
            AL Finanças & Negócios
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Gestão de Risco FPD (B2B2C)
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">
              E-mail corporativo
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-black/50 border-white/10 focus:border-[#D4AF37] text-white"
              placeholder="seu.nome@alfinancas.com.br"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/80">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-black/50 border-white/10 focus:border-[#D4AF37] text-white"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 font-semibold"
          >
            {loading ? "Entrando..." : "Entrar no Sistema"}
          </Button>
        </form>
      </div>
    </div>
  );
}
