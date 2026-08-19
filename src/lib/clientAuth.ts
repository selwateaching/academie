import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'btp_client_session';
const secretKey = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'dev-secret-change-me-in-production-please');

export async function createClientSession(clientId: string, companyId: string) {
  const token = await new SignJWT({ clientId, companyId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function getClientSession(): Promise<{ clientId: string; companyId: string } | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return { clientId: payload.clientId as string, companyId: payload.companyId as string };
  } catch {
    return null;
  }
}

export async function requireClientSession() {
  const session = await getClientSession();
  if (!session) redirect('/portail/login');
  return session;
}

export function clearClientSession() {
  cookies().delete(COOKIE_NAME);
}
