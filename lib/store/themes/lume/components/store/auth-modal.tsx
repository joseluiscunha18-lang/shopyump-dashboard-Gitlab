'use client';

import { useState, type AnimationEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { useAuth } from "./auth-context";

export function AuthModal() {
  const { authOpen, setAuthOpen, pendingEmail, requestCode, verifyCode, resetFlow } = useAuth();
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const close = (open: boolean) => {
    setAuthOpen(open);
  };

  const finishClose = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !authOpen) {
      resetFlow();
      setCode("");
      setError(null);
    }
  };

  const sendCode = (value: string) => {
    const generated = requestCode(value, optIn);
    setCode("");
    setError(null);
    toast.success(`Código enviado para ${value}`, { description: `Código de demonstração: ${generated}` });
  };

  const handleEmail = (event: React.FormEvent) => {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Introduza um e-mail válido.");
      return;
    }
    sendCode(value);
  };

  const handleVerify = (completedCode: string) => {
    if (!verifyCode(completedCode)) {
      setError("Código inválido. Tente novamente.");
      return;
    }
    toast.success("Sessão iniciada com sucesso.");
    setCode("");
    setEmail("");
    setError(null);
  };

  return (
    <Dialog open={authOpen} onOpenChange={close}>
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        onAnimationEnd={finishClose}
        className="bottom-0 left-0 top-auto max-h-[calc(100dvh-1rem)] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-t-2xl border-x-0 border-b-0 p-6 shadow-md data-[state=open]:zoom-in-100 data-[state=open]:slide-in-from-bottom-full data-[state=closed]:zoom-out-100 data-[state=closed]:slide-out-to-bottom-full sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=closed]:zoom-out-95"
      >
        {!pendingEmail ? (
          <form onSubmit={handleEmail} className="grid gap-5">
            <div className="pr-8">
              <DialogTitle className="text-xl font-bold leading-tight">Entrar ou criar conta</DialogTitle>
              <DialogDescription className="mt-2 leading-6">Digite seu e-mail para acessar sua conta ou criar uma nova.</DialogDescription>
            </div>
            <div className="grid gap-2">
              <label htmlFor="auth-email" className="text-xs font-semibold uppercase text-muted-foreground">E-mail</label>
              <Input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@email.com" className="h-12" />
            </div>
            <label className="flex items-start gap-3 text-xs leading-5 text-muted-foreground">
              <Checkbox checked={optIn} onCheckedChange={(checked) => setOptIn(checked === true)} className="mt-0.5 rounded" />
              Quero receber novidades e ofertas
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="h-12 w-full text-base">Continuar com e-mail</Button>
          </form>
        ) : (
          <div className="grid gap-5">
            <div>
              <DialogTitle className="text-xl font-bold leading-tight">Verifique o seu e-mail</DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-6">
                Enviámos um código de 6 dígitos para <span className="font-semibold text-foreground">{pendingEmail}</span>.
              </DialogDescription>
            </div>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => {
                  setCode(value);
                  if (error) setError(null);
                }}
                onComplete={handleVerify}
                autoFocus
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot key={index} index={index} className="size-12 rounded-xl border text-lg font-semibold" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => { resetFlow(); setError(null); }} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" /> Alterar e-mail
              </button>
              <button type="button" onClick={() => sendCode(pendingEmail)} className="font-semibold underline underline-offset-4">Reenviar código</button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
