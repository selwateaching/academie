import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { computeTotals } from '../src/lib/calc';

const prisma = new PrismaClient();

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  console.log('Seeding database…');

  const company = await prisma.company.create({
    data: {
      name: 'Bâti Pro Rénovation',
      address: '14 rue des Artisans',
      zip: '69003',
      city: 'Lyon',
      phone: '04 78 12 34 56',
      email: 'contact@batipro-renovation.fr',
      siret: '812 345 678 00023',
      vatNumber: 'FR40812345678',
      iban: 'FR76 3000 4000 0312 3456 7890 143',
      bic: 'BNPAFRPPXXX',
      defaultVatRate: 20,
      paymentTerms: 'Paiement à 30 jours fin de mois',
      quoteValidityDays: 30,
      legalMentions: "TVA non applicable, art. 293 B du CGI si auto-entrepreneur. Pénalités de retard : 3 fois le taux d'intérêt légal. Indemnité forfaitaire de recouvrement : 40 €.",
    },
  });

  const pwd = await bcrypt.hash('demo1234', 10);

  const admin = await prisma.user.create({
    data: { companyId: company.id, name: 'Marc Dubreuil', email: 'patron@btpmanager.fr', passwordHash: pwd, role: 'ADMIN', phone: '06 12 34 56 78', position: 'Gérant', avatarColor: '#1d4ed8' },
  });
  const conducteur = await prisma.user.create({
    data: { companyId: company.id, name: 'Sophie Ravel', email: 'conducteur@btpmanager.fr', passwordHash: pwd, role: 'CONDUCTEUR', phone: '06 22 33 44 55', position: 'Conductrice de travaux', avatarColor: '#7c3aed' },
  });
  const chef = await prisma.user.create({
    data: { companyId: company.id, name: 'Karim Belhadj', email: 'chef@btpmanager.fr', passwordHash: pwd, role: 'CHEF_CHANTIER', phone: '06 33 44 55 66', position: 'Chef de chantier', team: 'Équipe Maçonnerie', avatarColor: '#d97706' },
  });
  const salarie1 = await prisma.user.create({
    data: { companyId: company.id, name: 'Julien Faure', email: 'julien@btpmanager.fr', passwordHash: pwd, role: 'SALARIE', phone: '06 44 55 66 77', position: 'Maçon', skills: 'Maçonnerie, carrelage', team: 'Équipe Maçonnerie', avatarColor: '#059669' },
  });
  const salarie2 = await prisma.user.create({
    data: { companyId: company.id, name: 'Nadia Cherif', email: 'nadia@btpmanager.fr', passwordHash: pwd, role: 'SALARIE', phone: '06 55 66 77 88', position: 'Électricienne', skills: 'Électricité, domotique', team: 'Équipe Second œuvre', avatarColor: '#dc2626' },
  });
  const compta = await prisma.user.create({
    data: { companyId: company.id, name: 'Élise Mercier', email: 'compta@btpmanager.fr', passwordHash: pwd, role: 'COMPTABILITE', phone: '06 66 77 88 99', position: 'Comptable', avatarColor: '#0891b2' },
  });

  const clientsData = [
    { type: 'PARTICULIER', firstName: 'Pierre', lastName: 'Lambert', email: 'pierre.lambert@gmail.com', phone: '06 01 02 03 04', address: '5 rue Victor Hugo, 69002 Lyon', siteAddress: '5 rue Victor Hugo, 69002 Lyon' },
    { type: 'PARTICULIER', firstName: 'Claire', lastName: 'Petit', email: 'claire.petit@outlook.fr', phone: '06 11 22 33 44', address: '22 avenue Berthelot, 69007 Lyon', siteAddress: '22 avenue Berthelot, 69007 Lyon' },
    { type: 'ENTREPRISE', firstName: 'Antoine', lastName: 'Roux', companyName: 'SCI Les Tilleuls', email: 'a.roux@lestilleuls.fr', phone: '06 21 22 23 24', address: '8 place Bellecour, 69002 Lyon', siteAddress: '3 impasse des Tilleuls, 69008 Lyon' },
    { type: 'PARTICULIER', firstName: 'Marie', lastName: 'Girard', email: 'marie.girard@yahoo.fr', phone: '06 31 32 33 34', address: '17 rue de la République, 69001 Lyon', siteAddress: '17 rue de la République, 69001 Lyon' },
    { type: 'ENTREPRISE', firstName: 'Thomas', lastName: 'Bertin', companyName: 'Cabinet Médical Bertin', email: 'contact@cabinet-bertin.fr', phone: '06 41 42 43 44', address: '45 cours Gambetta, 69003 Lyon', siteAddress: '45 cours Gambetta, 69003 Lyon' },
    { type: 'PARTICULIER', firstName: 'Sylvie', lastName: 'Moreau', email: 'sylvie.moreau@gmail.com', phone: '06 51 52 53 54', address: '9 rue Garibaldi, 69006 Lyon', siteAddress: '9 rue Garibaldi, 69006 Lyon' },
  ];
  const clients = [];
  for (const c of clientsData) {
    clients.push(await prisma.client.create({ data: { companyId: company.id, ...c, portalEnabled: true, passwordHash: pwd } as any }));
  }
  const [cLambert, cPetit, cTilleuls, cGirard, cBertin, cMoreau] = clients;

  await prisma.prospect.createMany({
    data: [
      { companyId: company.id, firstName: 'Yves', lastName: 'Blanchard', email: 'yves.blanchard@free.fr', phone: '06 70 71 72 73', origin: 'Site web', request: 'Rénovation salle de bain', estimatedAmount: 8500, status: 'NOUVEAU', nextAction: 'Appeler pour RDV', nextActionDate: daysFromNow(2) },
      { companyId: company.id, firstName: 'Isabelle', lastName: 'Faure', email: 'isabelle.faure@laposte.net', phone: '06 80 81 82 83', origin: 'Recommandation', request: 'Extension maison 30m²', estimatedAmount: 45000, status: 'CONTACTE', nextAction: 'Envoyer le devis', nextActionDate: daysFromNow(1) },
      { companyId: company.id, firstName: 'Marc', lastName: 'Legrand', email: 'marc.legrand@gmail.com', phone: '06 90 91 92 93', origin: 'LeBonCoin', request: 'Réfection toiture', estimatedAmount: 12000, status: 'DEVIS_ENVOYE', nextAction: 'Relancer', nextActionDate: daysFromNow(3) },
      { companyId: company.id, firstName: 'Nathalie', lastName: 'Simon', email: 'nathalie.simon@gmail.com', phone: '06 15 16 17 18', origin: 'Bouche à oreille', request: 'Peinture 4 pièces', estimatedAmount: 3200, status: 'RELANCE', nextAction: 'Relance téléphonique', nextActionDate: daysFromNow(-1) },
    ],
  });

  // ─── Chantiers ───
  const chantier1 = await prisma.chantier.create({
    data: {
      companyId: company.id, name: 'Rénovation appartement Lambert', clientId: cLambert.id,
      address: '5 rue Victor Hugo, 69002 Lyon', lat: 45.7508, lng: 4.8324,
      startDate: daysFromNow(-20), endDatePlanned: daysFromNow(10), managerId: conducteur.id,
      budgetPlanned: 24000, costActual: 15200, revenuePlanned: 28000, status: 'EN_COURS', progress: 65,
      description: 'Rénovation complète appartement 70m² : cuisine, salle de bain, peinture.',
    },
  });
  const chantier2 = await prisma.chantier.create({
    data: {
      companyId: company.id, name: 'Extension SCI Les Tilleuls', clientId: cTilleuls.id,
      address: '3 impasse des Tilleuls, 69008 Lyon', lat: 45.7370, lng: 4.8790,
      startDate: daysFromNow(5), endDatePlanned: daysFromNow(65), managerId: conducteur.id,
      budgetPlanned: 62000, costActual: 0, revenuePlanned: 71000, status: 'PLANIFIE', progress: 0,
      description: 'Extension de 30m² avec véranda et terrasse bois.',
    },
  });
  const chantier3 = await prisma.chantier.create({
    data: {
      companyId: company.id, name: 'Toiture Cabinet Bertin', clientId: cBertin.id,
      address: '45 cours Gambetta, 69003 Lyon', lat: 45.7530, lng: 4.8460,
      startDate: daysFromNow(-60), endDatePlanned: daysFromNow(-10), endDateActual: daysFromNow(-8), managerId: chef.id,
      budgetPlanned: 14000, costActual: 13100, revenuePlanned: 15800, status: 'TERMINE', progress: 100,
      description: 'Réfection complète de la toiture et isolation combles.',
    },
  });
  const chantier4 = await prisma.chantier.create({
    data: {
      companyId: company.id, name: 'Peinture & sols Moreau', clientId: cMoreau.id,
      address: '9 rue Garibaldi, 69006 Lyon', lat: 45.7680, lng: 4.8530,
      startDate: daysFromNow(-3), endDatePlanned: daysFromNow(4), managerId: chef.id,
      budgetPlanned: 5200, costActual: 1800, revenuePlanned: 6100, status: 'EN_COURS', progress: 30,
      description: 'Peinture 3 pièces + pose parquet stratifié.',
    },
  });

  for (const [chantierId, userIds] of [
    [chantier1.id, [chef.id, salarie1.id]],
    [chantier2.id, [conducteur.id]],
    [chantier3.id, [chef.id, salarie2.id]],
    [chantier4.id, [chef.id, salarie1.id, salarie2.id]],
  ] as [string, string[]][]) {
    for (const userId of userIds) {
      await prisma.chantierMember.create({ data: { chantierId, userId, roleOnSite: 'Intervenant' } });
    }
  }

  // ─── Devis ───
  async function createDevis(opts: {
    number: string; clientId: string; chantierId?: string; status: string;
    lines: { type: string; description: string; quantity: number; unit: string; unitPrice: number; vatRate: number }[];
    daysAgo: number;
  }) {
    const totals = computeTotals(opts.lines, 0);
    return prisma.devis.create({
      data: {
        companyId: company.id, number: opts.number, clientId: opts.clientId, chantierId: opts.chantierId,
        status: opts.status, date: daysFromNow(-opts.daysAgo), validUntil: daysFromNow(30 - opts.daysAgo),
        depositPct: 30, paymentTerms: 'Acompte de 30% à la commande, solde à la fin des travaux.',
        totalHT: totals.netHT, totalTTC: totals.totalTTC,
        createdById: admin.id,
        lines: { create: opts.lines.map((l, i) => ({ ...l, order: i })) },
      },
    });
  }

  await createDevis({
    number: 'DEV2026-0001', clientId: cLambert.id, chantierId: chantier1.id, status: 'ACCEPTE', daysAgo: 25,
    lines: [
      { type: 'MAIN_OEUVRE', description: 'Dépose cuisine existante', quantity: 1, unit: 'forfait', unitPrice: 800, vatRate: 20 },
      { type: 'MATERIAU', description: 'Cuisine équipée sur mesure', quantity: 1, unit: 'u', unitPrice: 9500, vatRate: 20 },
      { type: 'PRESTATION', description: 'Pose carrelage salle de bain 15m²', quantity: 15, unit: 'm²', unitPrice: 65, vatRate: 10 },
      { type: 'MAIN_OEUVRE', description: 'Peinture 4 pièces', quantity: 4, unit: 'pièce', unitPrice: 450, vatRate: 10 },
    ],
  });

  await createDevis({
    number: 'DEV2026-0002', clientId: cTilleuls.id, chantierId: chantier2.id, status: 'ACCEPTE', daysAgo: 10,
    lines: [
      { type: 'PRESTATION', description: 'Extension 30m² gros œuvre', quantity: 30, unit: 'm²', unitPrice: 1200, vatRate: 20 },
      { type: 'MATERIAU', description: 'Véranda aluminium sur mesure', quantity: 1, unit: 'u', unitPrice: 18000, vatRate: 20 },
      { type: 'PRESTATION', description: 'Terrasse bois composite 25m²', quantity: 25, unit: 'm²', unitPrice: 180, vatRate: 20 },
    ],
  });

  await createDevis({
    number: 'DEV2026-0003', clientId: cPetit.id, status: 'ENVOYE', daysAgo: 3,
    lines: [
      { type: 'PRESTATION', description: 'Rénovation salle de bain complète', quantity: 1, unit: 'forfait', unitPrice: 7200, vatRate: 10 },
      { type: 'MATERIAU', description: 'Sanitaires et robinetterie', quantity: 1, unit: 'lot', unitPrice: 1800, vatRate: 20 },
    ],
  });

  await createDevis({
    number: 'DEV2026-0004', clientId: cGirard.id, status: 'CONSULTE', daysAgo: 7,
    lines: [{ type: 'PRESTATION', description: 'Ravalement de façade 80m²', quantity: 80, unit: 'm²', unitPrice: 95, vatRate: 20 }],
  });

  await createDevis({
    number: 'DEV2026-0005', clientId: cMoreau.id, chantierId: chantier4.id, status: 'ACCEPTE', daysAgo: 12,
    lines: [
      { type: 'MAIN_OEUVRE', description: 'Peinture 3 pièces', quantity: 3, unit: 'pièce', unitPrice: 380, vatRate: 10 },
      { type: 'PRESTATION', description: 'Pose parquet stratifié 45m²', quantity: 45, unit: 'm²', unitPrice: 42, vatRate: 10 },
    ],
  });

  await createDevis({
    number: 'DEV2026-0006', clientId: cBertin.id, status: 'REFUSE', daysAgo: 40,
    lines: [{ type: 'PRESTATION', description: "Installation climatisation 3 unités", quantity: 3, unit: 'u', unitPrice: 2100, vatRate: 20 }],
  });

  await createDevis({
    number: 'DEV2026-0007', clientId: cLambert.id, status: 'BROUILLON', daysAgo: 0,
    lines: [{ type: 'PRESTATION', description: 'Aménagement combles 20m²', quantity: 20, unit: 'm²', unitPrice: 850, vatRate: 20 }],
  });

  // ─── Factures ───
  async function createFacture(opts: {
    number: string; clientId: string; chantierId?: string; type: string; status: string;
    lines: { type: string; description: string; quantity: number; unit: string; unitPrice: number; vatRate: number }[];
    daysAgo: number; dueInDays: number; payments?: { amount: number; method: string; daysAgo: number }[];
  }) {
    const totals = computeTotals(opts.lines, 0);
    const paidAmount = (opts.payments ?? []).reduce((s, p) => s + p.amount, 0);
    return prisma.facture.create({
      data: {
        companyId: company.id, number: opts.number, clientId: opts.clientId, chantierId: opts.chantierId,
        type: opts.type, status: opts.status, date: daysFromNow(-opts.daysAgo), dueDate: daysFromNow(opts.dueInDays - opts.daysAgo),
        totalHT: totals.netHT, totalTTC: totals.totalTTC, paidAmount,
        paymentTerms: 'Paiement à 30 jours fin de mois', createdById: compta.id,
        lines: { create: opts.lines.map((l, i) => ({ ...l, order: i })) },
        payments: opts.payments ? { create: opts.payments.map((p) => ({ amount: p.amount, method: p.method, date: daysFromNow(-p.daysAgo) })) } : undefined,
      },
    });
  }

  await createFacture({
    number: 'FAC2026-0001', clientId: cLambert.id, chantierId: chantier1.id, type: 'ACOMPTE', status: 'PAYEE', daysAgo: 24, dueInDays: 15,
    lines: [{ type: 'PRESTATION', description: 'Acompte 30% - Rénovation appartement', quantity: 1, unit: 'forfait', unitPrice: 8400, vatRate: 20 }],
    payments: [{ amount: 10080, method: 'VIREMENT', daysAgo: 20 }],
  });

  await createFacture({
    number: 'FAC2026-0002', clientId: cTilleuls.id, chantierId: chantier2.id, type: 'ACOMPTE', status: 'PAYEE', daysAgo: 9, dueInDays: 15,
    lines: [{ type: 'PRESTATION', description: 'Acompte 30% - Extension', quantity: 1, unit: 'forfait', unitPrice: 21300, vatRate: 20 }],
    payments: [{ amount: 25560, method: 'VIREMENT', daysAgo: 5 }],
  });

  await createFacture({
    number: 'FAC2026-0003', clientId: cBertin.id, chantierId: chantier3.id, type: 'FINALE', status: 'EN_RETARD', daysAgo: 45, dueInDays: 30,
    lines: [{ type: 'PRESTATION', description: 'Solde travaux toiture', quantity: 1, unit: 'forfait', unitPrice: 11060, vatRate: 20 }],
  });

  await createFacture({
    number: 'FAC2026-0004', clientId: cMoreau.id, chantierId: chantier4.id, type: 'SITUATION', status: 'PARTIELLEMENT_PAYEE', daysAgo: 15, dueInDays: 30,
    lines: [{ type: 'PRESTATION', description: 'Situation travaux 50%', quantity: 1, unit: 'forfait', unitPrice: 3050, vatRate: 10 }],
    payments: [{ amount: 1500, method: 'CHEQUE', daysAgo: 10 }],
  });

  await createFacture({
    number: 'FAC2026-0005', clientId: cLambert.id, chantierId: chantier1.id, type: 'STANDARD', status: 'ENVOYEE', daysAgo: 2, dueInDays: 30,
    lines: [{ type: 'MATERIAU', description: 'Fournitures complémentaires cuisine', quantity: 1, unit: 'lot', unitPrice: 620, vatRate: 20 }],
  });

  await createFacture({
    number: 'FAC2026-0006', clientId: cGirard.id, type: 'STANDARD', status: 'IMPAYEE', daysAgo: 60, dueInDays: 30,
    lines: [{ type: 'PRESTATION', description: 'Devis de diagnostic technique', quantity: 1, unit: 'forfait', unitPrice: 350, vatRate: 20 }],
  });

  // ─── Fournisseurs & matériaux ───
  const fourn1 = await prisma.supplier.create({ data: { companyId: company.id, name: 'Point P Lyon', contactName: 'Bruno Sanchez', email: 'contact@pointp-lyon.fr', phone: '04 72 00 00 01', address: 'ZI Lyon Sud, 69800 Saint-Priest' } });
  const fourn2 = await prisma.supplier.create({ data: { companyId: company.id, name: 'Sanitaire Plus', contactName: 'Aline Roy', email: 'contact@sanitaireplus.fr', phone: '04 72 00 00 02', address: '12 rue de l\'Industrie, 69100 Villeurbanne' } });
  const fourn3 = await prisma.supplier.create({ data: { companyId: company.id, name: 'Électro Distribution', contactName: 'Fabrice Lenoir', email: 'contact@electrodist.fr', phone: '04 72 00 00 03', address: '5 avenue des Frères Lumière, 69008 Lyon' } });

  const materials = await Promise.all([
    prisma.material.create({ data: { companyId: company.id, reference: 'CIM-001', name: 'Ciment 25kg', supplierId: fourn1.id, purchasePrice: 8.5, unit: 'sac', quantityAvailable: 120, stockMin: 30, location: 'Dépôt A - Étagère 1' } }),
    prisma.material.create({ data: { companyId: company.id, reference: 'CAR-014', name: 'Carrelage grès cérame 60x60', supplierId: fourn1.id, purchasePrice: 22, unit: 'm²', quantityAvailable: 18, stockMin: 20, location: 'Dépôt A - Étagère 3' } }),
    prisma.material.create({ data: { companyId: company.id, reference: 'SAN-022', name: 'Robinetterie mitigeur thermostatique', supplierId: fourn2.id, purchasePrice: 145, unit: 'u', quantityAvailable: 6, stockMin: 5, location: 'Dépôt B' } }),
    prisma.material.create({ data: { companyId: company.id, reference: 'ELE-005', name: 'Câble électrique 3G2.5mm² (100m)', supplierId: fourn3.id, purchasePrice: 68, unit: 'rouleau', quantityAvailable: 4, stockMin: 6, location: 'Dépôt B - Casier 2' } }),
    prisma.material.create({ data: { companyId: company.id, reference: 'PEI-011', name: 'Peinture acrylique blanc mat 10L', supplierId: fourn1.id, purchasePrice: 42, unit: 'bidon', quantityAvailable: 25, stockMin: 10, location: 'Dépôt A - Étagère 5' } }),
    prisma.material.create({ data: { companyId: company.id, reference: 'BOI-009', name: 'Parquet stratifié chêne (m²)', supplierId: fourn1.id, purchasePrice: 18, unit: 'm²', quantityAvailable: 12, stockMin: 20, location: 'Dépôt A - Étagère 4' } }),
  ]);

  await prisma.stockMovement.createMany({
    data: [
      { materialId: materials[0].id, chantierId: chantier1.id, quantity: 40, type: 'SORTIE', date: daysFromNow(-15), note: 'Fondations cuisine' },
      { materialId: materials[1].id, chantierId: chantier1.id, quantity: 15, type: 'SORTIE', date: daysFromNow(-8), note: 'Salle de bain' },
      { materialId: materials[4].id, chantierId: chantier4.id, quantity: 8, type: 'SORTIE', date: daysFromNow(-2), note: 'Peinture pièces' },
    ],
  });

  // ─── Tâches ───
  await prisma.task.createMany({
    data: [
      { companyId: company.id, title: 'Commander carrelage salle de bain', status: 'A_FAIRE', priority: 'URGENTE', dueDate: daysFromNow(1), chantierId: chantier1.id, assignedToId: chef.id, createdById: admin.id },
      { companyId: company.id, title: 'Relancer facture FAC2026-0003', status: 'A_FAIRE', priority: 'URGENTE', dueDate: daysFromNow(0), clientId: cBertin.id, assignedToId: compta.id, createdById: admin.id },
      { companyId: company.id, title: "Planifier réunion de chantier extension", status: 'A_FAIRE', priority: 'NORMALE', dueDate: daysFromNow(3), chantierId: chantier2.id, assignedToId: conducteur.id, createdById: admin.id },
      { companyId: company.id, title: 'Valider devis toiture Legrand', status: 'EN_COURS', priority: 'NORMALE', dueDate: daysFromNow(2), assignedToId: admin.id, createdById: admin.id },
      { companyId: company.id, title: 'Photos avant travaux Moreau', status: 'TERMINEE', priority: 'BASSE', dueDate: daysFromNow(-2), chantierId: chantier4.id, assignedToId: chef.id, createdById: conducteur.id },
      { companyId: company.id, title: 'Vérifier stock câble électrique', status: 'A_FAIRE', priority: 'NORMALE', dueDate: daysFromNow(4), assignedToId: salarie2.id, createdById: conducteur.id },
    ],
  });

  // ─── Calendrier ───
  const today = new Date();
  today.setHours(8, 0, 0, 0);
  await prisma.calendarEvent.createMany({
    data: [
      { companyId: company.id, title: 'Chantier Lambert - Pose carrelage', type: 'CHANTIER', start: new Date(today), end: new Date(new Date(today).setHours(17, 0, 0, 0)), chantierId: chantier1.id, clientId: cLambert.id, location: '5 rue Victor Hugo, Lyon' },
      { companyId: company.id, title: 'RDV client - Devis Petit', type: 'RDV', start: new Date(new Date(today).setHours(14, 0, 0, 0)), end: new Date(new Date(today).setHours(15, 0, 0, 0)), clientId: cPetit.id, location: 'Agence' },
      { companyId: company.id, title: 'Livraison véranda aluminium', type: 'LIVRAISON', start: daysFromNow(2), end: daysFromNow(2), chantierId: chantier2.id, location: 'Chantier Tilleuls' },
      { companyId: company.id, title: 'Réunion équipe hebdomadaire', type: 'REUNION', start: daysFromNow(1), end: daysFromNow(1), location: 'Agence' },
      { companyId: company.id, title: 'Intervention électricité', type: 'INTERVENTION', start: daysFromNow(3), end: daysFromNow(3), chantierId: chantier4.id, clientId: cMoreau.id },
    ],
  });

  // ─── Heures ───
  for (let i = 1; i <= 5; i++) {
    await prisma.timeEntry.create({ data: { userId: salarie1.id, chantierId: chantier1.id, date: daysFromNow(-i), hours: 7.5, note: 'Journée complète' } });
    await prisma.timeEntry.create({ data: { userId: salarie2.id, chantierId: chantier4.id, date: daysFromNow(-i), hours: 6, note: 'Câblage électrique' } });
  }

  // ─── Messagerie ───
  const conv = await prisma.conversation.create({
    data: {
      companyId: company.id, type: 'INTERNAL', name: 'Équipe Chantier Lambert', chantierId: chantier1.id,
      participants: { create: [{ userId: admin.id }, { userId: conducteur.id }, { userId: chef.id }] },
    },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: conv.id, senderUserId: admin.id, body: 'Bonjour à tous, où en est-on sur le chantier Lambert ?' },
      { conversationId: conv.id, senderUserId: chef.id, body: 'La pose du carrelage démarre demain, il manque 15m² de carrelage.' },
      { conversationId: conv.id, senderUserId: conducteur.id, body: 'Je commande le complément aujourd\'hui, livraison prévue vendredi.' },
    ],
  });

  const convClient = await prisma.conversation.create({
    data: { companyId: company.id, type: 'CLIENT', clientId: cLambert.id, participants: { create: [{ userId: admin.id }] } },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: convClient.id, senderClientId: cLambert.id, body: 'Bonjour, où en sont les travaux de la salle de bain ?' },
      { conversationId: convClient.id, senderUserId: admin.id, body: 'Bonjour M. Lambert, le carrelage sera posé cette semaine, nous vous enverrons des photos.' },
    ],
  });

  // ─── Notifications ───
  await prisma.notification.createMany({
    data: [
      { companyId: company.id, userId: admin.id, type: 'facture_retard', title: 'Facture en retard', body: 'FAC2026-0003 (Cabinet Bertin) est en retard de paiement.', link: '/factures', read: false },
      { companyId: company.id, userId: admin.id, type: 'devis_accepte', title: 'Devis accepté', body: 'DEV2026-0005 accepté par Sylvie Moreau.', link: '/devis', read: false },
      { companyId: company.id, userId: admin.id, type: 'stock_faible', title: 'Stock faible', body: 'Câble électrique 3G2.5mm² sous le seuil minimum.', link: '/materiaux', read: true },
    ],
  });

  console.log('Seed terminé.');
  console.log('Connexion : patron@btpmanager.fr / demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
