'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CodeStep } from './AuthFlow';

/** Confirmação do registo com código de 6 dígitos. */
export function VerifyNotice() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  useEffect(() => { setEmail(sessionStorage.getItem('shopyump-auth-email') || ''); }, []);
  return <CodeStep email={email || 'o seu e-mail'} onBack={() => router.push('/registar')} onDone={() => { router.push('/onboarding'); router.refresh(); }} />;
}
