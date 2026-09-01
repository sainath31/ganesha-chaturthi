# Ganesha Chaturthi — Committee Accounts

A small web app for running a community Ganesha Chaturthi's finances:
donations in, expenses out, receipts filed, and a statement to hand round at
the end.

Hosted free on Vercel. Records live in a Google Sheet you own; receipt images
live in a Google Drive folder you own. There is no database to run or pay for,
and the committee can still open the sheet directly whenever it wants.

**[Setup instructions →](./SETUP.md)**

## What it does

- **Dashboard** — collected, spent, remaining, who owes what, where the money came from.
- **Donations** — every contribution with its method, collector and food RSVP; auto-numbered receipts.
- **Expenses** — every cost with its category, store and payer, plus attached receipts.
- **Receipts** — bills uploaded to Drive, downscaled in the browser, filed by year.
- **Reports** — a printable statement of accounts.

## Two ideas worth knowing

**Every year starts empty.** Records carry the year they were dated in, and the
year picker switches between them. A new festival needs no setup: the first
entry dated in the new year brings it into being, with past years left intact
for comparison.

**Reading is public, writing is not.** Anyone with the link sees the figures.
Only listed addresses can add, edit or delete, and public viewers get redacted
data — names shortened, lanes and notes hidden, contact details stripped,
receipt images withheld. The redaction happens on the server, so hidden values
are never sent to the browser.

## Running locally

```bash
npm install
echo "DEMO_MODE=true" > .env.local
echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
npm run dev
```

Demo mode runs on fixture data with no Google credentials, so you can see every
screen before setting anything up. It is read-only.

For the real thing, follow [SETUP.md](./SETUP.md).

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind · Auth.js · Google Sheets &
Drive APIs. Charts are inline SVG rather than a charting library.
