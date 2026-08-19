import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { fmtEUR, fmtDate } from '@/lib/enums';

export function isAiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'list_chantiers',
    description: "Liste les chantiers de l'entreprise, avec statut, dates, avancement. Utile pour 'quels chantiers commencent cette semaine', 'chantiers en cours', etc.",
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filtrer par statut : A_PREPARER, PLANIFIE, EN_COURS, EN_PAUSE, TERMINE, ARCHIVE (optionnel)' },
      },
    },
  },
  {
    name: 'list_factures_impayees',
    description: 'Liste les factures impayées ou en retard, avec montant restant dû et échéance.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_chantier_rentabilite',
    description: "Donne le détail financier (CA encaissé, coûts, marge) d'un chantier recherché par son nom ou le nom du client.",
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Nom du chantier ou du client à rechercher' } },
      required: ['query'],
    },
  },
  {
    name: 'list_devis',
    description: 'Liste les devis, avec possibilité de filtrer par statut (BROUILLON, ENVOYE, CONSULTE, ACCEPTE, REFUSE, EXPIRE).',
    input_schema: {
      type: 'object',
      properties: { status: { type: 'string' } },
    },
  },
  {
    name: 'search_documents',
    description: 'Recherche des documents par nom, éventuellement liés à un chantier ou un client.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'list_taches_urgentes',
    description: 'Liste les tâches urgentes ou en retard.',
    input_schema: { type: 'object', properties: {} },
  },
];

export async function executeTool(companyId: string, name: string, input: any): Promise<string> {
  switch (name) {
    case 'list_chantiers': {
      const chantiers = await prisma.chantier.findMany({
        where: { companyId, ...(input.status ? { status: input.status } : {}) },
        include: { client: true },
        orderBy: { startDate: 'asc' },
      });
      return JSON.stringify(chantiers.map((c) => ({
        nom: c.name, client: `${c.client.firstName} ${c.client.lastName}`, statut: c.status,
        avancement: `${c.progress}%`, debut: fmtDate(c.startDate), finPrevue: fmtDate(c.endDatePlanned),
      })));
    }
    case 'list_factures_impayees': {
      const factures = await prisma.facture.findMany({
        where: { companyId, status: { in: ['IMPAYEE', 'EN_RETARD', 'PARTIELLEMENT_PAYEE'] } },
        include: { client: true },
      });
      return JSON.stringify(factures.map((f) => ({
        numero: f.number, client: `${f.client.firstName} ${f.client.lastName}`, statut: f.status,
        montantRestant: fmtEUR(f.totalTTC - f.paidAmount), echeance: fmtDate(f.dueDate),
      })));
    }
    case 'get_chantier_rentabilite': {
      const chantiers = await prisma.chantier.findMany({
        where: { companyId, OR: [{ name: { contains: input.query } }, { client: { firstName: { contains: input.query } } }, { client: { lastName: { contains: input.query } } }] },
        include: { client: true, factures: true },
      });
      if (chantiers.length === 0) return 'Aucun chantier trouvé pour cette recherche.';
      return JSON.stringify(chantiers.map((c) => {
        const revenueActual = c.factures.filter((f) => f.status === 'PAYEE').reduce((s, f) => s + f.totalTTC, 0);
        return {
          nom: c.name, client: `${c.client.firstName} ${c.client.lastName}`, budgetPrevu: fmtEUR(c.budgetPlanned),
          coutReel: fmtEUR(c.costActual), caEncaisse: fmtEUR(revenueActual), marge: fmtEUR(revenueActual - c.costActual),
        };
      }));
    }
    case 'list_devis': {
      const devis = await prisma.devis.findMany({
        where: { companyId, ...(input.status ? { status: input.status } : {}) },
        include: { client: true },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
      return JSON.stringify(devis.map((d) => ({ numero: d.number, client: `${d.client.firstName} ${d.client.lastName}`, statut: d.status, montant: fmtEUR(d.totalTTC), date: fmtDate(d.date) })));
    }
    case 'search_documents': {
      const docs = await prisma.document.findMany({ where: { companyId, name: { contains: input.query } }, include: { chantier: true, client: true }, take: 20 });
      return JSON.stringify(docs.map((d) => ({ nom: d.name, dossier: d.folder, chantier: d.chantier?.name, client: d.client ? `${d.client.firstName} ${d.client.lastName}` : null })));
    }
    case 'list_taches_urgentes': {
      const tasks = await prisma.task.findMany({ where: { companyId, priority: 'URGENTE', status: { not: 'TERMINEE' } }, include: { chantier: true, client: true } });
      return JSON.stringify(tasks.map((t) => ({ titre: t.title, echeance: fmtDate(t.dueDate), chantier: t.chantier?.name, client: t.client ? `${t.client.firstName} ${t.client.lastName}` : null })));
    }
    default:
      return 'Outil inconnu.';
  }
}

const SYSTEM_PROMPT = `Tu es l'assistant IA intégré à BTP Manager, un logiciel de gestion pour une entreprise du bâtiment. Tu aides le patron à piloter son entreprise : créer des devis, rédiger des emails et relances, résumer des chantiers, analyser la rentabilité, retrouver des documents, préparer des listes de tâches et répondre à des questions sur les données de l'entreprise.

Utilise les outils disponibles pour consulter les données réelles avant de répondre. Réponds toujours en français, de façon claire, concise et actionnable, avec des listes ou tableaux si utile. Les montants sont en euros. Si on te demande de rédiger un email, rédige-le directement et intégralement, prêt à être envoyé, avec un ton professionnel et courtois.`;

export async function runAssistant(companyId: string, history: { role: 'user' | 'assistant'; content: string }[]) {
  if (!isAiConfigured()) {
    return "L'assistant IA n'est pas configuré. Ajoutez une clé ANTHROPIC_API_KEY dans les variables d'environnement pour l'activer.";
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const messages: Anthropic.MessageParam[] = history.map((h) => ({ role: h.role, content: h.content }));

  for (let iteration = 0; iteration < 5; iteration++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    });

    if (response.stop_reason !== 'tool_use') {
      const textBlock = response.content.find((b) => b.type === 'text');
      return textBlock && textBlock.type === 'text' ? textBlock.text : 'Désolé, je n\'ai pas pu générer de réponse.';
    }

    messages.push({ role: 'assistant', content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const result = await executeTool(companyId, block.name, block.input);
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
      }
    }
    messages.push({ role: 'user', content: toolResults });
  }

  return "Je n'ai pas pu terminer cette demande, pouvez-vous préciser votre question ?";
}
