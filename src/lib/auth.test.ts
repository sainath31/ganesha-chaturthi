import { describe, expect, it, beforeEach, vi } from 'vitest';

// auth.ts wires up next-auth at module scope, which pulls in `next/server` —
// unresolvable outside Next's own build. These pure role-check functions
// don't touch that wiring, so a stub is enough to load the module in isolation.
vi.mock('next-auth', () => ({ default: () => ({ handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }) }));
vi.mock('next-auth/providers/google', () => ({ default: () => ({}) }));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.ADMIN_EMAILS;
  delete process.env.EDITOR_EMAILS;
  delete process.env.RECEIPT_VIEWER_EMAILS;
});

describe('roleFor', () => {
  it('returns viewer for null/undefined email', async () => {
    const { roleFor } = await import('./auth');
    expect(roleFor(null)).toBe('viewer');
    expect(roleFor(undefined)).toBe('viewer');
  });

  it('returns admin for a listed admin email, case-insensitively', async () => {
    process.env.ADMIN_EMAILS = 'boss@example.com';
    const { roleFor } = await import('./auth');
    expect(roleFor('BOSS@Example.com')).toBe('admin');
  });

  it('returns editor for a listed editor email', async () => {
    process.env.EDITOR_EMAILS = 'helper@example.com';
    const { roleFor } = await import('./auth');
    expect(roleFor('helper@example.com')).toBe('editor');
  });

  it('returns viewer for an unlisted email', async () => {
    process.env.ADMIN_EMAILS = 'boss@example.com';
    const { roleFor } = await import('./auth');
    expect(roleFor('stranger@example.com')).toBe('viewer');
  });

  it('prefers admin when an email is listed in both admin and editor', async () => {
    process.env.ADMIN_EMAILS = 'both@example.com';
    process.env.EDITOR_EMAILS = 'both@example.com';
    const { roleFor } = await import('./auth');
    expect(roleFor('both@example.com')).toBe('admin');
  });
});

describe('canEdit', () => {
  it('is true for admin and editor, false for viewer', async () => {
    const { canEdit } = await import('./auth');
    expect(canEdit('admin')).toBe(true);
    expect(canEdit('editor')).toBe(true);
    expect(canEdit('viewer')).toBe(false);
  });
});

describe('canViewReceipts', () => {
  it('is always true for admin', async () => {
    const { canViewReceipts } = await import('./auth');
    expect(canViewReceipts('admin', 'anyone@example.com')).toBe(true);
  });

  it('is false for a viewer', async () => {
    const { canViewReceipts } = await import('./auth');
    expect(canViewReceipts('viewer', 'viewer@example.com')).toBe(false);
  });

  it('is true for any editor when RECEIPT_VIEWER_EMAILS is unset', async () => {
    const { canViewReceipts } = await import('./auth');
    expect(canViewReceipts('editor', 'editor@example.com')).toBe(true);
  });

  it('narrows to only listed editors when RECEIPT_VIEWER_EMAILS is set', async () => {
    process.env.RECEIPT_VIEWER_EMAILS = 'allowed@example.com';
    const { canViewReceipts } = await import('./auth');
    expect(canViewReceipts('editor', 'allowed@example.com')).toBe(true);
    expect(canViewReceipts('editor', 'other-editor@example.com')).toBe(false);
  });
});
