import { z } from 'zod';

/**
 * Domain model, derived from the committee's 2025 workbooks.
 *
 * The `*_COLUMNS` maps below are the single place tying these fields to header
 * names in the Google Sheet — rename a header in the sheet, change it here, and
 * nothing else moves.
 */

/** How money arrived. The 2025 sheet encoded this as free text ("Zelle to Rama S"), */
/** which is split here into method + collector so per-collector totals are computable. */
export const PAYMENT_METHODS = ['Cash', 'Zelle', 'Venmo', 'Check', 'Other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const DONATION_STATUSES = ['Paid', 'Pledged', 'Pending'] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const FOOD_RSVP = ['Yes', 'No', 'Not available', 'No response'] as const;
export type FoodRsvp = (typeof FOOD_RSVP)[number];

export const EXPENSE_CATEGORIES = [
  'Idol',
  'Pooja Items',
  'Prasad & Sweets',
  'Flowers & Decoration',
  'Priest',
  'Chairs & Canopy',
  'Event Activities',
  'Cutlery & Supplies',
  'Drinks & Water',
  'Transport & Rental',
  'Post-Visarjan Food',
  'Miscellaneous',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const SETTLEMENT_STATUSES = ['Cleared', 'Pending', 'Paid directly'] as const;
export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

/**
 * First Day Pooja is the one big sit-down event; Daily Pooja covers every
 * other day of the celebration, each with its own smaller headcount and its
 * own prasadam sign-up. Kept as one sheet with an occasion column rather than
 * two tabs, so a family's RSVPs across the festival are easy to scan together.
 */
export const RSVP_OCCASIONS = ['First Day Pooja', 'Daily Pooja'] as const;
export type RsvpOccasion = (typeof RSVP_OCCASIONS)[number];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const money = z.coerce.number().finite();
const text = z.coerce.string().trim().default('');

const headcount = z.coerce.number().int().nonnegative().default(0);

export const donationSchema = z.object({
  id: z.string(),
  /** Festival year this record belongs to. Every view is scoped to one year. */
  year: z.coerce.number().int().min(2000).max(2100),
  receiptNo: text,
  date: isoDate,
  name: z.string().min(1, 'Name is required'),
  lane: text,
  amount: money.nonnegative(),
  method: z.enum(PAYMENT_METHODS).default('Cash'),
  /** Committee member who received the money — drives the per-collector reconciliation. */
  collectedBy: text,
  status: z.enum(DONATION_STATUSES).default('Paid'),
  votedForFood: z.enum(FOOD_RSVP).default('No response'),
  /** How many from this family are coming for food, split by age — drives catering counts. */
  foodAdults: headcount,
  foodKids: headcount,
  notes: text,
  recordedBy: text,
  recordedAt: text,
});
export type Donation = z.infer<typeof donationSchema>;

export const donationInputSchema = donationSchema.omit({
  id: true,
  year: true,
  receiptNo: true,
  recordedBy: true,
  recordedAt: true,
});
export type DonationInput = z.infer<typeof donationInputSchema>;

export const expenseSchema = z.object({
  id: z.string(),
  year: z.coerce.number().int().min(2000).max(2100),
  date: isoDate,
  category: z.enum(EXPENSE_CATEGORIES).default('Miscellaneous'),
  description: z.string().min(1, 'Description is required'),
  store: text,
  /** Who fronted the money and is owed a reimbursement. */
  paidBy: z.string().min(1, 'Paid by is required'),
  amount: money,
  /**
   * "Paid directly" covers costs a family absorbed without claiming it back —
   * the 2025 priest fee worked this way. Such rows are shown but excluded from
   * committee spend and from reimbursement totals.
   */
  settlement: z.enum(SETTLEMENT_STATUSES).default('Pending'),
  notes: text,
  recordedBy: text,
  recordedAt: text,
});
export type Expense = z.infer<typeof expenseSchema>;

export const expenseInputSchema = expenseSchema.omit({
  id: true,
  year: true,
  recordedBy: true,
  recordedAt: true,
});
export type ExpenseInput = z.infer<typeof expenseInputSchema>;

export const receiptSchema = z.object({
  id: z.string(),
  year: z.coerce.number().int().min(2000).max(2100),
  /** The date on the bill itself — separate from uploadedAt, so a receipt for
   *  an earlier day can be uploaded later without misdating the expense. */
  date: isoDate,
  expenseId: text,
  fileId: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.coerce.number().nonnegative().default(0),
  webViewLink: text,
  uploadedBy: text,
  uploadedAt: text,
});
export type Receipt = z.infer<typeof receiptSchema>;

/** Pooja RSVP: who is coming, how many, and what prasadam they signed up for — for either the First Day Pooja or a Daily Pooja. */
export const rsvpSchema = z.object({
  id: z.string(),
  year: z.coerce.number().int().min(2000).max(2100),
  occasion: z.enum(RSVP_OCCASIONS).default('First Day Pooja'),
  date: isoDate,
  name: z.string().min(1, 'Name is required'),
  adults: headcount,
  kids: headcount,
  prasadam: text,
  notes: text,
  recordedBy: text,
  recordedAt: text,
});
export type Rsvp = z.infer<typeof rsvpSchema>;

export const rsvpInputSchema = rsvpSchema.omit({
  id: true,
  year: true,
  recordedBy: true,
  recordedAt: true,
});
export type RsvpInput = z.infer<typeof rsvpInputSchema>;

export const DONATION_COLUMNS: Record<keyof Donation, string> = {
  id: 'ID',
  year: 'Year',
  receiptNo: 'Receipt No',
  date: 'Date',
  name: 'Name',
  lane: 'Lane',
  amount: 'Amount',
  method: 'Method',
  collectedBy: 'Collected By',
  status: 'Status',
  votedForFood: 'Voted For Food',
  foodAdults: 'Food Adults',
  foodKids: 'Food Kids',
  notes: 'Notes',
  recordedBy: 'Recorded By',
  recordedAt: 'Recorded At',
};

export const EXPENSE_COLUMNS: Record<keyof Expense, string> = {
  id: 'ID',
  year: 'Year',
  date: 'Date',
  category: 'Category',
  description: 'Description',
  store: 'Store',
  paidBy: 'Paid By',
  amount: 'Amount',
  settlement: 'Settlement',
  notes: 'Notes',
  recordedBy: 'Recorded By',
  recordedAt: 'Recorded At',
};

export const RECEIPT_COLUMNS: Record<keyof Receipt, string> = {
  id: 'ID',
  year: 'Year',
  date: 'Date',
  expenseId: 'Expense ID',
  fileId: 'Drive File ID',
  fileName: 'File Name',
  mimeType: 'Mime Type',
  sizeBytes: 'Size Bytes',
  webViewLink: 'Drive Link',
  uploadedBy: 'Uploaded By',
  uploadedAt: 'Uploaded At',
};

export const RSVP_COLUMNS: Record<keyof Rsvp, string> = {
  id: 'ID',
  year: 'Year',
  occasion: 'Occasion',
  date: 'Date',
  name: 'Name',
  adults: 'Adults',
  kids: 'Kids',
  prasadam: 'Prasadam Details',
  notes: 'Notes',
  recordedBy: 'Recorded By',
  recordedAt: 'Recorded At',
};

/** Logged when someone without access asks to be added as a committee member. */
export const accessRequestSchema = z.object({
  id: z.string(),
  email: z.string().email('Enter a valid email address'),
  name: text,
  message: text,
  requestedAt: text,
});
export type AccessRequest = z.infer<typeof accessRequestSchema>;

export const accessRequestInputSchema = accessRequestSchema.omit({ id: true, requestedAt: true });
export type AccessRequestInput = z.infer<typeof accessRequestInputSchema>;

export const ACCESS_REQUEST_COLUMNS: Record<keyof AccessRequest, string> = {
  id: 'ID',
  email: 'Email',
  name: 'Name',
  message: 'Message',
  requestedAt: 'Requested At',
};
