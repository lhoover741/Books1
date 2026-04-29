-- Books and Brews Cloudflare D1 schema
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  form_type TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business_name TEXT,
  project_type TEXT,
  budget_range TEXT,
  message TEXT,
  project_details TEXT,
  source_page TEXT,
  status TEXT NOT NULL DEFAULT 'New',
  priority TEXT NOT NULL DEFAULT 'Normal',
  submitted_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lead_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER,
  booking_name TEXT,
  booking_email TEXT,
  booking_type TEXT,
  booking_date TEXT,
  booking_time TEXT,
  booking_url TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);
