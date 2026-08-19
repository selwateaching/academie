import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  avatarColor: string;
};

export async function getSession() {
  const session = await getServerSession(authOptions);
  return session;
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  return session.user as unknown as SessionUser;
}
