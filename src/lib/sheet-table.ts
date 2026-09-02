import { z } from 'zod';
import { sheetsClient } from './google';
import { env } from './env';
import { DEMO_ROWS } from './demo-data';

/**
 * A typed view over one tab of the spreadsheet.
 *
 * Rows are addressed by the header row, not by fixed column letters, so
 * reordering columns in the sheet by hand does not corrupt the data. Appends go
 * through values.append with INSERT_ROWS, which Google serialises server-side —
 * two volunteers submitting at the same moment get two rows, not one clobbered
 * one. Edits to an existing row are read-then-write and are NOT safe against a
 * simultaneous edit of the same row; that is an accepted trade-off at committee
 * scale, and the reason every row keeps a `Recorded By` audit column.
 */
export class SheetTable<S extends z.ZodType<Record<string, unknown>>> {
  constructor(
    private readonly tab: string,
    private readonly columns: Record<string, string>,
    private readonly schema: S,
  ) {}

  private get headers(): string[] {
    return Object.values(this.columns);
  }

  private get fields(): string[] {
    return Object.keys(this.columns);
  }

  /**
   * Creates the tab with its header row if it does not exist yet. If the tab
   * already exists — from before a column was added to the schema — any
   * headers this table expects but the sheet doesn't have yet are appended to
   * the end of the header row. Existing columns are never reordered or
   * removed, so rows already written stay valid; this only grows the row.
   */
  async ensure(): Promise<void> {
    if (this.demoRows) return;
    const sheets = sheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: env.spreadsheetId });
    const exists = meta.data.sheets?.some((s) => s.properties?.title === this.tab);

    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: env.spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: this.tab } } }] },
      });
    }

    const currentHeaders = await this.headerRow();

    if (currentHeaders.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: env.spreadsheetId,
        range: `${this.tab}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [this.headers] },
      });
      return;
    }

    const known = new Set(currentHeaders.map((h) => h.trim().toLowerCase()));
    const missing = this.headers.filter((header) => !known.has(header.trim().toLowerCase()));
    if (missing.length > 0) {
      const startColumn = columnLetter(currentHeaders.length + 1);
      await sheets.spreadsheets.values.update({
        spreadsheetId: env.spreadsheetId,
        range: `${this.tab}!${startColumn}1`,
        valueInputOption: 'RAW',
        requestBody: { values: [missing] },
      });
    }
  }

  private get demoRows(): Record<string, unknown>[] | null {
    return process.env.DEMO_MODE === 'true' ? (DEMO_ROWS[this.tab] ?? []) : null;
  }

  /** Just the header row — used where the rest of the tab isn't needed, so a
   *  growing table doesn't get downloaded in full just to read one row. */
  private async headerRow(): Promise<string[]> {
    const response = await sheetsClient().spreadsheets.values.get({
      spreadsheetId: env.spreadsheetId,
      range: `${this.tab}!1:1`,
    });
    return (response.data.values?.[0] ?? []).map(String);
  }

  /** Shared by update() and delete(): which row (0-based, data rows only) has
   *  this id, or -1 if the id column is missing or no row matches. */
  private findRowOffset(header: string[], rows: string[][], id: string): number {
    const idColumn = header.findIndex(
      (name) => name.trim().toLowerCase() === this.columns.id.trim().toLowerCase(),
    );
    if (idColumn === -1) return -1;
    return rows.findIndex((row) => String(row[idColumn] ?? '').trim() === id);
  }

  private async rawRows(): Promise<{ header: string[]; rows: string[][] }> {
    const sheets = sheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: env.spreadsheetId,
      range: this.tab,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
    const values = (response.data.values ?? []) as string[][];
    const [header = [], ...rows] = values;
    return { header: header.map(String), rows };
  }

  async list(): Promise<z.infer<S>[]> {
    const demo = this.demoRows;
    if (demo) {
      return demo
        .map((row) => {
          const record: Record<string, unknown> = {};
          for (const field of this.fields) record[field] = row[this.columns[field]] ?? '';
          return this.schema.safeParse(record);
        })
        .filter((result) => result.success)
        .map((result) => result.data as z.infer<S>);
    }

    const { header, rows } = await this.rawRows();
    const indexOf = new Map(header.map((name, i) => [name.trim().toLowerCase(), i]));

    const parsed: z.infer<S>[] = [];
    for (const row of rows) {
      const record: Record<string, unknown> = {};
      for (const field of this.fields) {
        const column = this.columns[field].trim().toLowerCase();
        const index = indexOf.get(column);
        const cell = index === undefined ? '' : (row[index] ?? '');
        record[field] = cell === null ? '' : cell;
      }
      // Skip blank rows and rows the sheet owner has hand-edited into an
      // unparseable state rather than failing the whole page.
      if (!String(record.id ?? '').trim()) continue;
      const result = this.schema.safeParse(record);
      if (result.success) parsed.push(result.data as z.infer<S>);
    }
    return parsed;
  }

  /** Lays a record out in the sheet's actual current column order, not the
   *  schema's declared order — the two can diverge once a column has been
   *  added to the schema after the tab already existed, or the sheet owner
   *  has reordered columns by hand. */
  private rowValues(header: string[], record: z.infer<S>): unknown[] {
    const valueByColumn = new Map<string, unknown>();
    for (const field of this.fields) {
      valueByColumn.set(this.columns[field].trim().toLowerCase(), (record as Record<string, unknown>)[field] ?? '');
    }
    return header.map((name) => valueByColumn.get(name.trim().toLowerCase()) ?? '');
  }

  async append(record: z.infer<S>): Promise<void> {
    if (this.demoRows) throw new Error('Demo mode is read-only. Configure the Google sheet to save records.');
    const sheets = sheetsClient();
    const header = await this.headerRow();
    await sheets.spreadsheets.values.append({
      spreadsheetId: env.spreadsheetId,
      range: `${this.tab}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [this.rowValues(header.length ? header : this.headers, record)],
      },
    });
  }

  /** Overwrites the row whose ID column matches. Returns false if not found. */
  async update(id: string, record: z.infer<S>): Promise<boolean> {
    const { header, rows } = await this.rawRows();
    const offset = this.findRowOffset(header, rows, id);
    if (offset === -1) return false;

    const rowNumber = offset + 2; // +1 for the header row, +1 for 1-based indexing
    await sheetsClient().spreadsheets.values.update({
      spreadsheetId: env.spreadsheetId,
      range: `${this.tab}!A${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [this.rowValues(header, record)],
      },
    });
    return true;
  }

  async delete(id: string): Promise<boolean> {
    const { header, rows } = await this.rawRows();
    const offset = this.findRowOffset(header, rows, id);
    if (offset === -1) return false;

    const sheets = sheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: env.spreadsheetId });
    const sheetId = meta.data.sheets?.find((s) => s.properties?.title === this.tab)?.properties
      ?.sheetId;
    if (sheetId === undefined || sheetId === null) return false;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: env.spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: offset + 1,
                endIndex: offset + 2,
              },
            },
          },
        ],
      },
    });
    return true;
  }
}

/** 1-indexed column number to its spreadsheet letter(s): 1 -> A, 27 -> AA. */
function columnLetter(n: number): string {
  let letters = '';
  let value = n;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    value = Math.floor((value - 1) / 26);
  }
  return letters;
}
