/**
 * Export data from Neon PostgreSQL database to SQL file
 * This script exports all data from current database
 * Usage: node export_from_neon.js
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_FILE = path.join(process.cwd(), 'neon_data_export.sql');

// Tables in order of dependency (independent tables first)
const TABLES = [
  'User',
  'Account',
  'Session',
  'VerificationToken',
  'Event',
  'Registration',
  'WaitingList',
  'Payment',
  'RegistrationHistory',
  'NoShow',
  'playing_with_neon'
];

/**
 * Escape SQL values
 */
function escapeValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'string') {
    // Replace backslashes and single quotes
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
  }
  
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  
  if (typeof value === 'number') {
    return String(value);
  }
  
  return `'${value}'`;
}

/**
 * Generate INSERT statement for a record
 */
function generateInsert(tableName, record) {
  const columns = Object.keys(record).map(col => `"${col}"`).join(', ');
  const values = Object.values(record).map(escapeValue).join(', ');
  
  return `INSERT INTO "${tableName}" (${columns}) VALUES (${values});`;
}

/**
 * Export data from a table
 */
async function exportTable(tableName) {
  console.log(`Exporting ${tableName}...`);
  
  let records;
  try {
    // Use Prisma to get all records
    switch (tableName) {
      case 'User':
        records = await prisma.user.findMany();
        break;
      case 'Account':
        records = await prisma.account.findMany();
        break;
      case 'Session':
        records = await prisma.session.findMany();
        break;
      case 'VerificationToken':
        records = await prisma.verificationToken.findMany();
        break;
      case 'Event':
        records = await prisma.event.findMany();
        break;
      case 'Registration':
        records = await prisma.registration.findMany();
        break;
      case 'WaitingList':
        records = await prisma.waitingList.findMany();
        break;
      case 'Payment':
        records = await prisma.payment.findMany();
        break;
      case 'RegistrationHistory':
        records = await prisma.registrationHistory.findMany();
        break;
      case 'NoShow':
        records = await prisma.noShow.findMany();
        break;
      case 'playing_with_neon':
        // Use raw query for this table
        records = await prisma.$queryRaw`SELECT * FROM "playing_with_neon"`;
        break;
      default:
        console.warn(`Unknown table: ${tableName}`);
        return [];
    }
    
    console.log(`  Found ${records.length} records`);
    return records;
  } catch (error) {
    console.error(`  Error exporting ${tableName}:`, error.message);
    return [];
  }
}

/**
 * Main export function
 */
async function main() {
  console.log('Starting data export from Neon...\n');
  
  const statements = [];
  
  // Add header
  statements.push('-- ============================================');
  statements.push('-- Data Export from Neon Database');
  statements.push(`-- Generated: ${new Date().toISOString()}`);
  statements.push('-- ============================================\n');
  
  // Disable foreign key checks for import
  statements.push('-- Disable foreign key checks for import');
  statements.push('SET session_replication_role = replica;\n');
  statements.push('BEGIN;\n');
  
  let totalRecords = 0;
  
  // Export each table
  for (const tableName of TABLES) {
    const records = await exportTable(tableName);
    totalRecords += records.length;
    
    if (records.length > 0) {
      statements.push(`\n-- ${tableName} (${records.length} records)`);
      
      for (const record of records) {
        statements.push(generateInsert(tableName, record));
      }
    }
  }
  
  // Enable foreign key checks
  statements.push('\n-- Re-enable foreign key checks');
  statements.push('COMMIT;');
  statements.push('SET session_replication_role = DEFAULT;\n');
  
  // Write to file
  const sqlContent = statements.join('\n');
  fs.writeFileSync(OUTPUT_FILE, sqlContent, 'utf8');
  
  console.log(`\n✓ Export complete!`);
  console.log(`  Total records: ${totalRecords}`);
  console.log(`  Output file: ${OUTPUT_FILE}`);
  console.log(`  File size: ${(sqlContent.length / 1024).toFixed(2)} KB`);
}

/**
 * Run export
 */
main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
