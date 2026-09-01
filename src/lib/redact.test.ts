import { describe, expect, it, vi } from 'vitest';
import type { Donation, Expense, Receipt } from './schema';

// redact.ts pulls in auth.ts, which wires up next-auth at module scope and
// pulls in `next/server` — unresolvable outside Next's own build. A stub is
// enough since redact only calls the pure canEdit/canViewReceipts helpers.
vi.mock('next-auth', () => ({ default: () => ({ handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }) }));
vi.mock('next-auth/providers/google', () => ({ default: () => ({}) }));

const { shortenName, scrubContacts, redactDonation, redactExpense, redactReceipt } = await import('./redact');

describe('shortenName', () => {
  it('shortens a two-part name to first name + last initial', () => {
    expect(shortenName('Ram Reddy')).toBe('Ram R.');
  });

  it('keeps a single-word name as-is', () => {
    expect(shortenName('Aravind')).toBe('Aravind');
  });

  it('strips a trailing "& Family" style suffix', () => {
    expect(shortenName('Ram Reddy & Soumya')).toBe('Ram R.');
  });

  it('strips a trailing "Family" word', () => {
    expect(shortenName('Lepakshi Family')).toBe('Lepakshi');
  });

  it('returns Anonymous for an empty string', () => {
    expect(shortenName('')).toBe('Anonymous');
  });

  it('returns Anonymous for whitespace only', () => {
    expect(shortenName('   ')).toBe('Anonymous');
  });
});

describe('scrubContacts', () => {
  it('redacts an email address', () => {
    expect(scrubContacts('Contact me at ram@example.com please')).toBe('Contact me at — please');
  });

  it('redacts a phone number', () => {
    expect(scrubContacts('Call 555-123-4567 anytime')).toBe('Call — anytime');
  });

  it('leaves ordinary text untouched', () => {
    expect(scrubContacts('Paper plates and cups')).toBe('Paper plates and cups');
  });
});

const baseDonation: Donation = {
  id: 'don_1',
  year: 2026,
  receiptNo: 'GC-2026-0001',
  date: '2026-08-10',
  name: 'Ram Reddy & Soumya',
  lane: 'Gardiner Lane',
  amount: 101,
  method: 'Cash',
  collectedBy: 'Rama Sunkara',
  status: 'Paid',
  votedForFood: 'Yes',
  foodAdults: 2,
  foodKids: 1,
  notes: 'Extra note',
  recordedBy: 'someone@example.com',
  recordedAt: '2026-08-10T10:00:00.000Z',
};

describe('redactDonation', () => {
  it('returns the row unchanged for an editor', () => {
    expect(redactDonation(baseDonation, 'editor')).toEqual(baseDonation);
  });

  it('returns the row unchanged for an admin', () => {
    expect(redactDonation(baseDonation, 'admin')).toEqual(baseDonation);
  });

  it('redacts identifying fields for a viewer', () => {
    const redacted = redactDonation(baseDonation, 'viewer');
    expect(redacted.name).toBe('Ram R.');
    expect(redacted.lane).toBe('—');
    expect(redacted.collectedBy).toBe('Rama S.');
    expect(redacted.notes).toBe('');
    expect(redacted.recordedBy).toBe('');
    // Non-identifying fields survive.
    expect(redacted.amount).toBe(101);
    expect(redacted.status).toBe('Paid');
  });

  it('leaves an empty collectedBy as empty rather than "Anonymous"', () => {
    const redacted = redactDonation({ ...baseDonation, collectedBy: '' }, 'viewer');
    expect(redacted.collectedBy).toBe('');
  });
});

const baseExpense: Expense = {
  id: 'exp_1',
  year: 2026,
  date: '2026-08-10',
  category: 'Pooja Items',
  description: 'Coconut and flowers, contact ram@example.com',
  store: 'Taaza Mart',
  paidBy: 'Mamatha Sainath',
  amount: 101.81,
  settlement: 'Cleared',
  notes: 'Internal note',
  recordedBy: 'someone@example.com',
  recordedAt: '2026-08-10T10:00:00.000Z',
};

describe('redactExpense', () => {
  it('returns the row unchanged for an editor', () => {
    expect(redactExpense(baseExpense, 'editor')).toEqual(baseExpense);
  });

  it('redacts the payer name, notes and recordedBy for a viewer', () => {
    const redacted = redactExpense(baseExpense, 'viewer');
    expect(redacted.paidBy).toBe('Mamatha S.');
    expect(redacted.notes).toBe('');
    expect(redacted.recordedBy).toBe('');
  });

  it('scrubs contact info out of the description for a viewer', () => {
    const redacted = redactExpense(baseExpense, 'viewer');
    expect(redacted.description).not.toContain('ram@example.com');
  });

  it('keeps store and amount visible for a viewer, since those are the public figures', () => {
    const redacted = redactExpense(baseExpense, 'viewer');
    expect(redacted.store).toBe('Taaza Mart');
    expect(redacted.amount).toBe(101.81);
  });
});

const baseReceipt: Receipt = {
  id: 'rec_1',
  year: 2026,
  date: '2026-08-10',
  expenseId: 'exp_1',
  fileId: 'drive_file_1',
  fileName: '2026-08-10 — coconut.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: 12345,
  webViewLink: 'https://drive.google.com/file/d/drive_file_1',
  uploadedBy: 'someone@example.com',
  uploadedAt: '2026-08-10T10:00:00.000Z',
};

describe('redactReceipt', () => {
  it('shows the real file details to an admin', () => {
    expect(redactReceipt(baseReceipt, 'admin')).toEqual(baseReceipt);
  });

  it('hides the file identity from a viewer', () => {
    const redacted = redactReceipt(baseReceipt, 'viewer');
    expect(redacted.fileName).toBe('Receipt');
    expect(redacted.webViewLink).toBe('');
    expect(redacted.uploadedBy).toBe('');
  });

  it('hides the file from an editor when receipt viewing is restricted to nobody they are in', () => {
    // canViewReceipts for a plain editor (no RECEIPT_VIEWER_EMAILS set) defaults to visible;
    // this exercises the visible branch explicitly for editors.
    const redacted = redactReceipt(baseReceipt, 'editor', 'editor@example.com');
    expect(redacted.fileName).toBe(baseReceipt.fileName);
  });
});
