import type { Metadata } from 'next';
import { ResetForm } from '@/components/auth/ResetForm';

export const metadata: Metadata = { title: 'Nova senha | Shopyump' };

export default function ResetPage() {
  return <ResetForm />;
}
