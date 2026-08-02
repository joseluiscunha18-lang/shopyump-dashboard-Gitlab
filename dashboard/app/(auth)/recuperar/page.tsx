import type { Metadata } from 'next';
import { ForgotForm } from '@/components/auth/ForgotForm';

export const metadata: Metadata = { title: 'Recuperar senha | Shopyump' };

export default function ForgotPage() {
  return <ForgotForm />;
}
