import type { Metadata } from 'next';
import { VerifyNotice } from '@/components/auth/VerifyNotice';

export const metadata: Metadata = { title: 'Confirma o teu e-mail | Shopyump' };

export default function VerifyPage() {
  return <VerifyNotice />;
}
