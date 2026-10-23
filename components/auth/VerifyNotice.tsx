'use client';

import { useEffect, useState } from 'react';
import { CodeStep } from './AuthFlow';

/** Confirmação do registo com código de 6 dígitos. */
export function VerifyNotice() {
  const [email, setEmail] = useState('');
  useEffect(() => { setEmail(sessionStorage.getItem('shopyump-auth-email') || ''); }, []);
  return <CodeStep email={email || 'o seu e-mail'} onBack={() => window.location.assign('/register')} onDone={() => window.location.assign('/onboarding')} />;
}
