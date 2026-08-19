import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9.5, fontFamily: 'Helvetica', color: '#1e293b' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  companyName: { fontSize: 15, fontWeight: 700, color: '#1d4ed8', marginBottom: 4 },
  small: { fontSize: 8.5, color: '#64748b', lineHeight: 1.5 },
  docTitleBox: { alignItems: 'flex-end' },
  docTitle: { fontSize: 20, fontWeight: 700, color: '#0f172a' },
  docNumber: { fontSize: 10, color: '#475569', marginTop: 2 },
  badge: { marginTop: 6, paddingVertical: 3, paddingHorizontal: 8, backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: 10, fontSize: 8.5, fontWeight: 700 },
  section: { marginBottom: 18, flexDirection: 'row', justifyContent: 'space-between' },
  box: { width: '48%', padding: 10, backgroundColor: '#f8fafc', borderRadius: 6 },
  boxLabel: { fontSize: 7.5, fontWeight: 700, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' },
  boxText: { fontSize: 9.5, color: '#1e293b', lineHeight: 1.4 },
  table: { marginTop: 6, borderTop: '1px solid #e2e8f0' },
  tHeadRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 6 },
  tRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 6, borderBottom: '1px solid #f1f5f9' },
  th: { fontSize: 7.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' },
  td: { fontSize: 9, color: '#1e293b' },
  colDesc: { width: '42%' }, colQty: { width: '10%', textAlign: 'right' }, colUnit: { width: '10%', textAlign: 'right' },
  colPrice: { width: '14%', textAlign: 'right' }, colVat: { width: '10%', textAlign: 'right' }, colTotal: { width: '14%', textAlign: 'right' },
  totalsBox: { marginTop: 16, alignSelf: 'flex-end', width: 220 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalsFinal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTop: '1px solid #cbd5e1', marginTop: 4 },
  footer: { position: 'absolute', bottom: 30, left: 36, right: 36, fontSize: 7.5, color: '#94a3b8', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 8 },
  notesBox: { marginTop: 20, padding: 10, backgroundColor: '#fffbeb', borderRadius: 6 },
});

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);
const fmtD = (d: Date | string | null | undefined) => (d ? new Intl.DateTimeFormat('fr-FR').format(new Date(d)) : '—');

export type PdfLine = { type: string; description: string; quantity: number; unit: string; unitPrice: number; vatRate: number };

export function DocumentPdf(props: {
  docTitle: string;
  number: string;
  statusLabel?: string;
  date: Date | string;
  secondaryDate?: { label: string; value: Date | string | null };
  company: { name: string; address?: string | null; zip?: string | null; city?: string | null; phone?: string | null; email?: string | null; siret?: string | null; vatNumber?: string | null; iban?: string | null; bic?: string | null; legalMentions?: string | null };
  client: { firstName: string; lastName: string; companyName?: string | null; address?: string | null; siteAddress?: string | null; email?: string | null; phone?: string | null };
  chantierName?: string | null;
  lines: PdfLine[];
  discountPct: number;
  totals: { subtotalHT: number; discountAmount: number; netHT: number; vatAmount: number; totalTTC: number };
  depositPct?: number;
  paidAmount?: number;
  paymentTerms?: string | null;
  notes?: string | null;
}) {
  const { company, client } = props;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={{ maxWidth: '55%' }}>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.small}>{company.address}</Text>
            <Text style={styles.small}>{[company.zip, company.city].filter(Boolean).join(' ')}</Text>
            <Text style={styles.small}>{company.phone} {company.email ? `· ${company.email}` : ''}</Text>
            <Text style={styles.small}>{company.siret ? `SIRET : ${company.siret}` : ''}{company.vatNumber ? `  TVA : ${company.vatNumber}` : ''}</Text>
          </View>
          <View style={styles.docTitleBox}>
            <Text style={styles.docTitle}>{props.docTitle}</Text>
            <Text style={styles.docNumber}>{props.number}</Text>
            {props.statusLabel && <Text style={styles.badge}>{props.statusLabel}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>Client</Text>
            <Text style={styles.boxText}>{client.companyName || `${client.firstName} ${client.lastName}`}</Text>
            {client.companyName && <Text style={styles.boxText}>{client.firstName} {client.lastName}</Text>}
            <Text style={styles.boxText}>{client.address}</Text>
            {client.email && <Text style={styles.boxText}>{client.email}</Text>}
            {client.phone && <Text style={styles.boxText}>{client.phone}</Text>}
          </View>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>Détails</Text>
            <Text style={styles.boxText}>Date : {fmtD(props.date)}</Text>
            {props.secondaryDate && <Text style={styles.boxText}>{props.secondaryDate.label} : {fmtD(props.secondaryDate.value)}</Text>}
            {props.chantierName && <Text style={styles.boxText}>Chantier : {props.chantierName}</Text>}
            {(client.siteAddress && client.siteAddress !== client.address) && <Text style={styles.boxText}>Adresse chantier : {client.siteAddress}</Text>}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tHeadRow}>
            <Text style={[styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.th, styles.colQty]}>Qté</Text>
            <Text style={[styles.th, styles.colUnit]}>Unité</Text>
            <Text style={[styles.th, styles.colPrice]}>P.U. HT</Text>
            <Text style={[styles.th, styles.colVat]}>TVA</Text>
            <Text style={[styles.th, styles.colTotal]}>Total HT</Text>
          </View>
          {props.lines.map((l, i) => (
            <View style={styles.tRow} key={i}>
              <Text style={[styles.td, styles.colDesc]}>{l.description}</Text>
              <Text style={[styles.td, styles.colQty]}>{l.quantity}</Text>
              <Text style={[styles.td, styles.colUnit]}>{l.unit}</Text>
              <Text style={[styles.td, styles.colPrice]}>{fmt(l.unitPrice)}</Text>
              <Text style={[styles.td, styles.colVat]}>{l.vatRate}%</Text>
              <Text style={[styles.td, styles.colTotal]}>{fmt(l.quantity * l.unitPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}><Text style={styles.td}>Total HT</Text><Text style={styles.td}>{fmt(props.totals.subtotalHT)}</Text></View>
          {props.discountPct > 0 && (
            <View style={styles.totalsRow}><Text style={styles.td}>Remise ({props.discountPct}%)</Text><Text style={styles.td}>-{fmt(props.totals.discountAmount)}</Text></View>
          )}
          <View style={styles.totalsRow}><Text style={styles.td}>TVA</Text><Text style={styles.td}>{fmt(props.totals.vatAmount)}</Text></View>
          <View style={styles.totalsFinal}><Text style={{ fontSize: 11, fontWeight: 700 }}>Total TTC</Text><Text style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8' }}>{fmt(props.totals.totalTTC)}</Text></View>
          {props.depositPct ? (
            <View style={styles.totalsRow}><Text style={styles.td}>Acompte demandé ({props.depositPct}%)</Text><Text style={styles.td}>{fmt((props.totals.totalTTC * props.depositPct) / 100)}</Text></View>
          ) : null}
          {typeof props.paidAmount === 'number' && (
            <>
              <View style={styles.totalsRow}><Text style={styles.td}>Déjà réglé</Text><Text style={styles.td}>{fmt(props.paidAmount)}</Text></View>
              <View style={styles.totalsRow}><Text style={{ ...styles.td, fontWeight: 700 }}>Reste dû</Text><Text style={{ ...styles.td, fontWeight: 700 }}>{fmt(props.totals.totalTTC - props.paidAmount)}</Text></View>
            </>
          )}
        </View>

        {props.paymentTerms && (
          <Text style={{ marginTop: 16, fontSize: 9, color: '#475569' }}>Conditions de paiement : {props.paymentTerms}</Text>
        )}
        {props.notes && (
          <View style={styles.notesBox}>
            <Text style={{ fontSize: 8, fontWeight: 700, color: '#92400e', marginBottom: 2 }}>NOTES</Text>
            <Text style={{ fontSize: 9, color: '#78350f' }}>{props.notes}</Text>
          </View>
        )}

        {(company.iban || company.legalMentions) && (
          <View style={styles.footer}>
            {company.iban && <Text>IBAN : {company.iban} {company.bic ? `· BIC : ${company.bic}` : ''}</Text>}
            {company.legalMentions && <Text style={{ marginTop: 3 }}>{company.legalMentions}</Text>}
          </View>
        )}
      </Page>
    </Document>
  );
}
