/**
 * Kanban lead search (pages/LeadsPage.tsx). Every word must match somewhere on the lead, in any
 * order: person, company, email, phone, lead number, notes, quotation numbers, assigned person, city.
 * Phone numbers match however they're typed ("98765 43210", "+91 98765-43210", "9876543210").
 */
import {
  Lead, leadDisplayName, leadDisplayCompany, leadDisplayEmail, leadDisplayPhone,
} from './marketing-api';

const digitsOnly = (s: string) => s.replace(/\D/g, '');
/** A word that looks like (part of) a phone number: only digits/phone punctuation, 4+ digits. */
const isPhoneLike = (w: string) => /^[\d+\-().]+$/.test(w) && digitsOnly(w).length >= 4;

function searchableText(lead: Lead): { text: string; phoneDigits: string } {
  const phones = [
    leadDisplayPhone(lead),
    lead.contact?.contact_phone,
    lead.customer?.primary_contact_contact?.contact_phone,
  ].filter(Boolean) as string[];
  const parts = [
    `#${lead.id}`,
    leadDisplayName(lead),
    leadDisplayCompany(lead),
    leadDisplayEmail(lead),
    lead.contact?.contact_person_name,
    lead.customer?.company_name,
    lead.customer?.city,
    lead.series,
    lead.notes,
    lead.assigned_to_username,
    ...(lead.quotation_numbers ?? []),
    ...phones,
  ];
  return {
    text: parts.filter(Boolean).join(' \u0001 ').toLowerCase(),
    phoneDigits: phones.map(digitsOnly).join(' '),
  };
}

export function leadMatchesSearch(lead: Lead, query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const { text, phoneDigits } = searchableText(lead);
  return words.every(w => text.includes(w) || (isPhoneLike(w) && phoneDigits.includes(digitsOnly(w))));
}
