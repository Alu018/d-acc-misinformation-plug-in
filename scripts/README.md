# Database Seeding Scripts

This directory contains scripts for seeding the Supabase database with synthetic misinformation data.

## Overview

The seeding script (`seed-database.js`) performs the following operations:

1. **Clears** all existing data from `flagged_links` and `flagged_content` tables
2. **Loads** synthetic data from `seed-data/synthetic-data.csv`
3. **Uploads** the data to your Supabase database

## Synthetic Data

The `seed-data/synthetic-data.csv` file contains 100 rows of realistic misinformation examples including:

- **Scam links**: Phishing sites, fake login pages, gift card scams
- **Misinformation**: Vaccine myths, conspiracy theories, health misinformation
- **Fake profiles**: Celebrity impersonations, fake experts
- **Other**: Pseudoscience products, unrealistic claims

All data is synthetic and created for demonstration purposes only.

## Usage

### Prerequisites

1. Node.js installed (v14 or higher)
2. Valid Supabase credentials in `docs/config.json`
3. Proper RLS policies set up (DELETE permissions for anon role)

### Installation

```bash
# From the project root directory
npm install
```

### Running the Seeding Script

⚠️ **WARNING**: This script will **DELETE ALL EXISTING DATA** from your database!

```bash
# Run the seeding script
npm run seed-db
```

Or directly with node:

```bash
node scripts/seed-database.js
```

### Expected Output

```
🛡️  AI Threat Detector - Database Seeding Script

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗑️  Clearing existing data from database...

   ✓ Deleted all records from flagged_links
   ✓ Deleted all records from flagged_content

📖 Loading synthetic data from CSV...

   ✓ Loaded 100 records from CSV

🌱 Seeding database with synthetic data...

   Inserting X flagged links...
   ✓ Inserted X flagged links
   Inserting X flagged content items...
   ✓ Inserted X flagged content items

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary:
   ✓ Successfully inserted: 100 records

✅ Database seeding complete!
```

## Customizing the Data

To modify or add synthetic data:

1. Edit `seed-data/synthetic-data.csv`
2. Follow the CSV format:
   - `type`: "link" or "content"
   - `flag_type`: "scam", "misinformation", "fake_profile", or "other"
   - `url`: For link type only
   - `content`: For content type only
   - `content_type`: For content type only ("text", "image", "video")
   - `page_url`: URL where the content was found
   - `note`: Optional explanation
   - `confidence`: 0-100 integer
   - `flagged_by_url`: Optional source URL

## Troubleshooting

### Error: Missing Supabase configuration

Make sure `docs/config.json` exists and contains:
```json
{
  "supabaseUrl": "https://your-project.supabase.co",
  "supabaseKey": "your-anon-key"
}
```

### Error: Delete operation failed

Ensure your Supabase RLS policies allow DELETE operations for the `anon` role:

```sql
CREATE POLICY "Enable delete for all users on flagged_links"
ON public.flagged_links
FOR DELETE
TO anon
USING (true);

CREATE POLICY "Enable delete for all users on flagged_content"
ON public.flagged_content
FOR DELETE
TO anon
USING (true);
```

### Error: Insert operation failed

Check that your RLS policies also allow INSERT operations for the `anon` role.

## Safety Notes

- This script is designed for development and testing
- **DO NOT** run this on a production database with real user data
- Always backup your database before running bulk delete operations
- The script uses the `anon` key, so it respects RLS policies