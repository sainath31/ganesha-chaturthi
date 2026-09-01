# Setup

The app runs free on Vercel, stores its records in one Google Sheet, and keeps
receipt files in one Google Drive folder. Everything below is a one-time setup;
after it, each new festival year needs no configuration at all.

Budget about 30 minutes.

---

## 1. Try it first, without any of this

```bash
npm install
echo "DEMO_MODE=true"  > .env.local
echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
npm run dev
```

Open <http://localhost:3000>. The app runs on fixture data so you can see every
screen before wiring up Google. Demo mode is read-only.

By default you see it as the public would. To preview what a committee member
sees — the entry forms, the edit and delete controls, the unredacted names —
add `DEMO_ROLE=admin` (or `editor`, or `viewer`) to `.env.local` and restart.

---

## 2. Create the spreadsheet and the receipts folder

1. Create a new Google Sheet. Name it something like `Ganesha Chaturthi — Accounts`.
   You do **not** need to add any tabs or headers; the app creates
   `Donations`, `Expenses` and `Receipts` with the right columns on first use.
2. Copy its **spreadsheet ID** — the long string in the URL between `/d/` and `/edit`.
3. Create a Drive folder named e.g. `Ganesha Chaturthi Receipts`.
   Copy its **folder ID** — the string at the end of the folder URL.

Keep both IDs handy.

---

## 3. Set up Google Cloud credentials

### 3a. Create the project and enable the APIs

1. Go to <https://console.cloud.google.com/> and create a project.
2. Under **APIs & Services → Library**, enable both:
   - Google Sheets API
   - Google Drive API

### 3b. Configure the consent screen

1. **APIs & Services → OAuth consent screen**.
2. Choose **External**, fill in an app name and your email, and save.
3. Under **Audience**, add your own Google account as a **Test user**.
   You can leave the app in "Testing" — it never needs verification, because
   only committee members ever sign in.

### 3c. Create the OAuth client

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Add these **Authorised redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-APP.vercel.app/api/auth/callback/google` (add after step 5)
   - `https://developers.google.com/oauthplayground`
4. Save the **Client ID** and **Client secret**.

### 3d. Mint a refresh token

This token lets the app read and write *your* sheet and Drive folder. A service
account will not work here: service accounts have no Drive storage quota of
their own, so uploads into a personal My Drive folder fail even when the folder
is shared with them.

1. Open <https://developers.google.com/oauthplayground>.
2. Click the gear icon (top right) → tick **Use your own OAuth credentials**,
   and paste your Client ID and secret.
3. In the left panel, paste these two scopes into "Input your own scopes":
   ```
   https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file
   ```
4. Click **Authorise APIs**, sign in with the account that owns the sheet and
   folder, and allow access.
5. Click **Exchange authorization code for tokens**.
6. Copy the **Refresh token**.

> `drive.file` scope means the app can only touch files it creates itself —
> it cannot read the rest of your Drive.

---

## 4. Fill in the environment

Copy `.env.example` to `.env.local` and fill it in:

```bash
cp .env.example .env.local
```

| Variable | What goes in it |
| --- | --- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From step 3c |
| `GOOGLE_REFRESH_TOKEN` | From step 3d |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `http://localhost:3000` locally; your Vercel URL in production |
| `SHEET_ID` | From step 2 |
| `DRIVE_RECEIPTS_FOLDER_ID` | From step 2 |
| `ADMIN_EMAILS` | Your Google address, comma separated |
| `EDITOR_EMAILS` | Anyone who may record entries and upload receipts |
| `RECEIPT_VIEWER_EMAILS` | Optional; narrows who can open receipt images |
| `NEXT_PUBLIC_CURRENCY` | `USD` |
| `NEXT_PUBLIC_LOCALE` | `en-US` |

Then:

```bash
npm run dev
```

---

## 5. Deploy to Vercel

1. Push this repository to GitHub.
2. At <https://vercel.com/new>, import the repository. Framework detection
   picks Next.js automatically; no build settings need changing.
3. Under **Settings → Environment Variables**, add every variable from your
   `.env.local` — but set `AUTH_URL` to the deployed URL, and leave
   `DEMO_MODE` out entirely.
4. Deploy.
5. Go back to step 3c and add your real Vercel URL as an authorised redirect URI.

The Hobby plan is free and covers this comfortably. Note it is licensed for
non-commercial use, which a community festival fits.

---

## Who can do what

| | View figures | Add / edit | Delete | See receipt images |
| --- | :---: | :---: | :---: | :---: |
| Anyone with the link | ✅ | — | — | — |
| `EDITOR_EMAILS` | ✅ | ✅ | — | ✅ * |
| `ADMIN_EMAILS` | ✅ | ✅ | ✅ | ✅ |

\* Unless `RECEIPT_VIEWER_EMAILS` is set, which narrows this to those addresses
plus admins.

**Public viewers see redacted data.** Household names are shortened to a first
name and last initial, lanes and notes are hidden, contact details are stripped,
and receipt images are withheld entirely. This happens on the server, so the
hidden values are never sent to the browser at all.

If you would rather nobody outside the committee sees even the summary, set
`REQUIRE_SIGN_IN=true`. Only listed admins and editors will then be able to open
the app at all.

---

## Each new year

Nothing to do. Records carry the year they were dated in, and the year picker in
the header switches between them. The first entry you date in a new year brings
that year into existence, starting from zero, with past years left untouched.

Receipts land in a per-year subfolder of the Drive folder automatically.

---

## Notes and limits

- **Concurrency.** New rows are appended through the Sheets API, which
  serialises them server-side, so two people adding entries at once is safe.
  Two people *editing the same row* at the same moment is not — the second
  write wins. Every row records who last touched it.
- **Scale.** Sheets is comfortable into the low thousands of rows. Well beyond
  a festival's needs; not a general-purpose database.
- **Receipt size.** Images are downscaled to 2000px and re-encoded in the
  browser before upload. The hard cap is 10 MB per file.
- **Editing the sheet by hand** is fine. Columns are matched by header name, so
  reordering them does not corrupt anything. Don't rename the headers without
  also updating the `*_COLUMNS` maps in `src/lib/schema.ts`.
