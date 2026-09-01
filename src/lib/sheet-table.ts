import { z } from 'zod';
import { sheetsClient } from './google';
import { env } from './env';

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

  /** Creates the tab with its header row if it does not exist yet. */
  async ensure(): Promise<void> {
    const sheets = sheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: env.spreadsheetId });
    const exists = meta.data.sheets?.some((s) => s.properties?.title === this.tab);

    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: env.spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: this.tab } } }] },
      });
    }

    const headerRow = await sheets.spreadsheets.values.get({
      spreadsheetId: env.spreadsheetId,
      range: `${this.tab}!1:1`,
    });

    if (!headerRow.data.values?.[0]?.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: env.spreadsheetId,
        range: `${this.tab}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [this.headers] },
      });
    }
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

  async append(record: z.infer<S>): Promise<void> {
    const sheets = sheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: env.spreadsheetId,
      range: `${this.tab}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [this.fields.map((field) => (record as Record<string, unknown>)[field] ?? '')],
      },
    });
  }

  /** Overwrites the row whose ID column matches. Returns false if not found. */
  async update(id: string, record: z.infer<S>): Promise<boolean> {
    const { header, rows } = await this.rawRows();
    const idColumn = header.findIndex(
      (name) => name.trim().toLowerCase() === this.columns.id.trim().toLowerCase(),
    );
    if (idColumn === -1) return false;

    const offset = rows.findIndex((row) => String(row[idColumn] ?? '').trim() === id);
    if (offset === -1) return false;

    const rowNumber = offset + 2; // +1 for the header row, +1 for 1-based indexing
    await sheetsClient().spreadsheets.values.update({
      spreadsheetId: env.spreadsheetId,
      range: `${this.tab}!A${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [this.fields.map((field) => (record as Record<string, unknown>)[field] ?? '')],
      },
    });
    return true;
  }

  async delete(id: string): Promise<boolean> {
    const { header, rows } = await this.rawRows();
    const idColumn = header.findIndex(
      (name) => name.trim().toLowerCase() === this.columns.id.trim().toLowerCase(),
    );
    if (idColumn === -1) return false;

    const offset = rows.findIndex((row) => String(row[idColumn] ?? '').trim() === id);
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
