/**
 * Fixture rows served when DEMO_MODE=true, so the app can be opened and
 * reviewed before any Google credentials exist. Never used otherwise —
 * SheetTable checks the flag before touching the Sheets API.
 */
const YEAR = new Date().getFullYear();

export const DEMO_ROWS: Record<string, Record<string, unknown>[]> = {
  Donations: [
    ['Aravind and Family', 'Ellsworth Pl', 100, 'Cash', '', 3],
    ['Sainath & Mamatha Family', 'Ellsworth Pl', 152, 'Zelle', 'Mamatha', 3],
    ['Sreekanth & Sushmitha', 'Ellsworth Pl', 101, 'Zelle', 'Rama S', 4],
    ['Divya & Rajesh Family', 'Ellsworth Pl', 50, 'Zelle', 'Mamatha', 4],
    ['Archana & Family', 'Kinsey Point', 100, 'Cash', '', 5],
    ['Gangadhar & Mounika', 'Kinsey Point', 50, 'Cash', '', 5],
    ['Lepakshi & Mouni Family', 'Sunflower Hill Dr', 150, 'Zelle', 'Rama S', 6],
    ['Ram Reddy & Soumya', 'Gardiner Lane', 101, 'Cash', '', 7],
    ['Rakesh & Family', 'Widewater Way', 108, 'Zelle', 'Sainath', 8],
    ['Kaushal Patel and Family', 'Kinsey Point', 100, 'Zelle', 'Rama S', 9],
    ['Vinay Madichetty Family', 'Birney Run', 100, 'Cash', '', 9],
    ['Vivek & Likhita Family', 'Widewater Way', 100, 'Cash', '', 10],
    ['Rajashekar & Family', 'Birney Run', 101, 'Cash', '', 10],
    ['Abbu Sriraman & Family', 'Sunflower Hill Dr', 50, 'Zelle', 'Rama S', 11],
    ['Veer & Saritha Family', 'Ellsworth Pl', 51, 'Zelle', 'Sainath', 11],
    ['Neha & Anil Family', 'Kinsey Point', 41, 'Cash', '', 12],
    ['Subhrajothi Paul & Family', 'Ellsworth Pl', 75, 'Zelle', 'Mamatha', 12],
    ['Satish & Swapna Family', 'Ellsworth Pl', 108, 'Zelle', 'Sainath', 13],
    ['Suresh Kurapati & Family', 'Gardiner Lane', 100, 'Zelle', 'Rama S', 13],
    ['Mounika & Abhinav', 'Gardiner Lane', 111, 'Zelle', 'Mamatha', 14],
    ['Yeshwanth Krishna', 'Widewater Way', 25, 'Zelle', 'Mamatha', 14],
    ['Deepthi & Yogesh', 'Ellsworth Pl', 51, 'Zelle', 'Mamatha', 15],
  ].map(([name, lane, amount, method, collectedBy, day], index) => ({
    ID: `demo_don_${index}`,
    Year: YEAR,
    'Receipt No': `GC-${YEAR}-${String(index + 1).padStart(4, '0')}`,
    Date: `${YEAR}-08-${String(day).padStart(2, '0')}`,
    Name: name,
    Lane: lane,
    Amount: amount,
    Method: method,
    'Collected By': collectedBy,
    Status: 'Paid',
    Notes: '',
    'Recorded By': 'demo@example.com',
    'Recorded At': `${YEAR}-08-10T10:00:00.000Z`,
  })),

  Expenses: [
    ['Eco-friendly Ganesha idol', 'Idol', '', 'Mamatha Sainath', 385, 'Cleared', 2],
    ['Big laddoo 5kg', 'Prasad & Sweets', 'Hindu Temple', 'Mamatha Sainath', 50, 'Cleared', 2],
    ['Pooja items and coconut', 'Pooja Items', 'Taaza Mart', 'Mamatha Sainath', 101.81, 'Cleared', 3],
    ['Fruits for naivedyam', 'Pooja Items', 'Sprouts', 'Mamatha Sainath', 20.98, 'Cleared', 3],
    ['Flowers and garlands', 'Flowers & Decoration', 'Publix', 'Mamatha Sainath', 12.9, 'Pending', 4],
    ['Clay for idol making', 'Event Activities', 'Michaels', 'Rama S', 29.22, 'Pending', 4],
    ['Pinata and chocolates', 'Event Activities', 'Walmart', 'Rama S', 64.09, 'Pending', 5],
    ['Paper plates and cups', 'Cutlery & Supplies', 'Costco', 'Rama S', 28.93, 'Pending', 5],
    ['Chairs and table rental', 'Chairs & Canopy', 'Ranjith Canopy', 'Rama S', 40, 'Cleared', 6],
    ['Pickup truck for visarjan', 'Transport & Rental', 'Enterprise', 'Mamatha Sainath', 71.7, 'Cleared', 8],
    ['Post-visarjan catering', 'Post-Visarjan Food', 'Bhavani', 'Anirudh', 860, 'Pending', 9],
    ['Priest pooja service', 'Priest', '', 'Host family', 250, 'Paid directly', 6],
  ].map(([description, category, store, paidBy, amount, settlement, day], index) => ({
    ID: `demo_exp_${index}`,
    Year: YEAR,
    Date: `${YEAR}-08-${String(day).padStart(2, '0')}`,
    Category: category,
    Description: description,
    Store: store,
    'Paid By': paidBy,
    Amount: amount,
    Settlement: settlement,
    Notes: '',
    'Recorded By': 'demo@example.com',
    'Recorded At': `${YEAR}-08-10T10:00:00.000Z`,
  })),

  Receipts: [],
};
