'use server';

import { prisma } from '@/lib/prisma';
import { createResetToken } from '@/lib/passwordReset';
import { sendMail, isMailConfigured } from '@/lib/mail';
import bcrypt from 'bcryptjs';

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '').toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return a generic success message to avoid leaking which emails exist.
  if (!user || !user.active) {
    return { ok: true, devLink: null as string | null };
  }

  const token = await createResetToken(user.id);
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  await sendMail({
    to: user.email,
    subject: 'Réinitialisation de votre mot de passe — BTP Manager',
    html: `<p>Bonjour ${user.name},</p><p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe (valable 30 minutes) :</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
  });

  return { ok: true, devLink: isMailConfigured() ? null : resetUrl };
}

export async function resetPassword(token: string, newPassword: string) {
  const { verifyResetToken } = await import('@/lib/passwordReset');
  const userId = await verifyResetToken(token);
  if (!userId) return { error: 'Ce lien de réinitialisation est invalide ou a expiré.' };
  if (newPassword.length < 6) return { error: 'Le mot de passe doit contenir au moins 6 caractères.' };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { ok: true };
}
