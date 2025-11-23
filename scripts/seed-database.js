/**
 * Database Seeding Script
 *
 * This script:
 * 1. Clears all existing data from flagged_links and flagged_content tables
 * 2. Loads synthetic data from CSV file
 * 3. Uploads the synthetic data to Supabase
 *
 * Usage: node scripts/seed-database.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load config
const configPath = path.join(__dirname, '../docs/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (!config.supabaseUrl || !config.supabaseKey) {
  console.error('❌ Error: Missing Supabase configuration in docs/config.json');
  process.exit(1);
}

const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// Parse CSV file
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    // Handle CSV parsing with potential commas in fields
    const values = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue); // Push the last value

    // Create object from headers and values
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || null;
    });

    return row;
  });
}

// Convert CSV row to database record
function convertToRecord(row) {
  const baseRecord = {
    flag_type: row.flag_type,
    confidence: parseInt(row.confidence),
    created_at: new Date().toISOString(),
  };

  if (row.type === 'link') {
    return {
      table: 'flagged_links',
      data: {
        ...baseRecord,
        url: row.url,
        note: row.note || null,
        flagged_by_url: row.flagged_by_url || null,
      }
    };
  } else {
    return {
      table: 'flagged_content',
      data: {
        ...baseRecord,
        content: row.content,
        content_type: row.content_type,
        page_url: row.page_url,
        note: row.note || null,
      }
    };
  }
}

async function clearDatabase() {
  console.log('🗑️  Clearing existing data from database...\n');

  try {
    // Delete all from flagged_links
    const { error: linksError, count: linksCount } = await supabase
      .from('flagged_links')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (linksError) {
      console.error('❌ Error deleting flagged_links:', linksError);
      throw linksError;
    }

    console.log(`   ✓ Deleted all records from flagged_links`);

    // Delete all from flagged_content
    const { error: contentError, count: contentCount } = await supabase
      .from('flagged_content')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (contentError) {
      console.error('❌ Error deleting flagged_content:', contentError);
      throw contentError;
    }

    console.log(`   ✓ Deleted all records from flagged_content\n`);

  } catch (error) {
    console.error('❌ Failed to clear database:', error.message);
    throw error;
  }
}

async function seedDatabase(records) {
  console.log('🌱 Seeding database with synthetic data...\n');

  const linkRecords = records.filter(r => r.table === 'flagged_links').map(r => r.data);
  const contentRecords = records.filter(r => r.table === 'flagged_content').map(r => r.data);

  let successCount = 0;
  let errorCount = 0;

  // Insert links
  if (linkRecords.length > 0) {
    console.log(`   Inserting ${linkRecords.length} flagged links...`);
    const { data, error } = await supabase
      .from('flagged_links')
      .insert(linkRecords)
      .select();

    if (error) {
      console.error(`   ❌ Error inserting links:`, error.message);
      errorCount += linkRecords.length;
    } else {
      console.log(`   ✓ Inserted ${data.length} flagged links`);
      successCount += data.length;
    }
  }

  // Insert content
  if (contentRecords.length > 0) {
    console.log(`   Inserting ${contentRecords.length} flagged content items...`);
    const { data, error } = await supabase
      .from('flagged_content')
      .insert(contentRecords)
      .select();

    if (error) {
      console.error(`   ❌ Error inserting content:`, error.message);
      errorCount += contentRecords.length;
    } else {
      console.log(`   ✓ Inserted ${data.length} flagged content items`);
      successCount += data.length;
    }
  }

  return { successCount, errorCount };
}

async function main() {
  console.log('\n🛡️  AI Threat Detector - Database Seeding Script\n');
  console.log('━'.repeat(50) + '\n');

  try {
    // Step 1: Clear existing data
    await clearDatabase();

    // Step 2: Load CSV data
    const csvPath = path.join(__dirname, 'seed-data/synthetic-data.csv');
    console.log('📖 Loading synthetic data from CSV...\n');
    const rows = parseCSV(csvPath);
    console.log(`   ✓ Loaded ${rows.length} records from CSV\n`);

    // Step 3: Convert to database records
    const records = rows.map(convertToRecord);

    // Step 4: Seed database
    const { successCount, errorCount } = await seedDatabase(records);

    // Summary
    console.log('\n' + '━'.repeat(50));
    console.log('\n📊 Summary:');
    console.log(`   ✓ Successfully inserted: ${successCount} records`);
    if (errorCount > 0) {
      console.log(`   ❌ Failed to insert: ${errorCount} records`);
    }
    console.log('\n✅ Database seeding complete!\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();