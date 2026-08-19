import nodemailer from 'nodemailer';

export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMail(opts: { to: string; subject: string; html: string; attachments?: { filename: string; content: Buffer }[] }) {
  if (!isMailConfigured()) {
    console.log(`[mail:simulé] À: ${opts.to} — Sujet: ${opts.subject}`);
    return { simulated: true };
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments,
  });
  return { simulated: false };
}

export const EMAIL_TEMPLATES = {
  devisEnvoi: (companyName: string, clientName: string, number: string) => ({
    subject: `Votre devis ${number} — ${companyName}`,
    html: `<p>Bonjour ${clientName},</p><p>Veuillez trouver ci-joint notre devis <strong>${number}</strong>.</p><p>N'hésitez pas à nous contacter pour toute question.</p><p>Cordialement,<br/>${companyName}</p>`,
  }),
  devisRelance: (companyName: string, clientName: string, number: string) => ({
    subject: `Relance — Devis ${number}`,
    html: `<p>Bonjour ${clientName},</p><p>Nous revenons vers vous concernant le devis <strong>${number}</strong> que nous vous avons envoyé. Restons à votre disposition pour en discuter.</p><p>Cordialement,<br/>${companyName}</p>`,
  }),
  factureEnvoi: (companyName: string, clientName: string, number: string) => ({
    subject: `Votre facture ${number} — ${companyName}`,
    html: `<p>Bonjour ${clientName},</p><p>Veuillez trouver ci-joint notre facture <strong>${number}</strong>.</p><p>Cordialement,<br/>${companyName}</p>`,
  }),
  factureRelance: (companyName: string, clientName: string, number: string, dueDate: string) => ({
    subject: `Rappel — Facture ${number} impayée`,
    html: `<p>Bonjour ${clientName},</p><p>Nous n'avons pas encore reçu le paiement de la facture <strong>${number}</strong>, échue le ${dueDate}. Merci de bien vouloir régulariser dans les meilleurs délais.</p><p>Cordialement,<br/>${companyName}</p>`,
  }),
  confirmationRdv: (companyName: string, clientName: string, date: string) => ({
    subject: `Confirmation de rendez-vous — ${companyName}`,
    html: `<p>Bonjour ${clientName},</p><p>Nous vous confirmons notre rendez-vous le <strong>${date}</strong>.</p><p>Cordialement,<br/>${companyName}</p>`,
  }),
  finChantier: (companyName: string, clientName: string, chantierName: string) => ({
    subject: `Fin de chantier — ${chantierName}`,
    html: `<p>Bonjour ${clientName},</p><p>Nous avons le plaisir de vous informer que le chantier <strong>${chantierName}</strong> est terminé. N'hésitez pas à nous contacter pour toute remarque.</p><p>Cordialement,<br/>${companyName}</p>`,
  }),
};
