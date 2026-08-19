import { SignJWT, jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'dev-secret-change-me-in-production-please');

export async function createResetToken(userId: string) {
  return new SignJWT({ userId, purpose: 'password-reset' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(secretKey);
}

export async function verifyResetToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (payload.purpose !== 'password-reset') return null;
    return payload.userId as string;
  } catch {
    return null;
  }
}
