// Verify Prisma Client is generated correctly
const fs = require('fs');
const path = require('path');

console.log('\n=== Verifying Prisma Client Generation ===\n');

// Check if Prisma Client exists
const prismaClientPath = path.join(process.cwd(), 'node_modules', '@prisma', 'client');
const prismaIndexPath = path.join(prismaClientPath, 'index.js');

if (!fs.existsSync(prismaClientPath)) {
  console.error('❌ ERROR: Prisma Client directory not found!');
  console.error('   Expected path:', prismaClientPath);
  console.error('\n   Run: npx prisma generate\n');
  process.exit(1);
}

if (!fs.existsSync(prismaIndexPath)) {
  console.error('❌ ERROR: Prisma Client index.js not found!');
  console.error('   Expected path:', prismaIndexPath);
  console.error('\n   Run: npx prisma generate\n');
  process.exit(1);
}

// Check if schema.prisma exists
const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
if (!fs.existsSync(schemaPath)) {
  console.error('❌ ERROR: Prisma schema not found!');
  console.error('   Expected path:', schemaPath);
  process.exit(1);
}

// Try to verify Prisma Client can be imported
try {
  // Check if file exists and has content
  const stats = fs.statSync(prismaIndexPath);
  if (stats.size === 0) {
    console.error('❌ ERROR: Prisma Client index.js is empty!');
    console.error('\n   Run: npx prisma generate\n');
    process.exit(1);
  }
  
  // Try to require the Prisma Client to verify it's valid
  try {
    const { PrismaClient } = require('@prisma/client');
    if (typeof PrismaClient === 'function') {
      console.log('✓ Prisma Client directory exists');
      console.log('✓ Prisma Client index.js exists');
      console.log('✓ Prisma Client can be imported');
      console.log('✓ PrismaClient is a function (valid)');
      console.log('\n✅ Prisma Client verification passed!\n');
    } else {
      console.error('❌ ERROR: PrismaClient is not a function!');
      console.error('   The Prisma Client may not be generated correctly.');
      console.error('\n   Run: npx prisma generate\n');
      process.exit(1);
    }
  } catch (importError) {
    console.error('❌ ERROR: Failed to import Prisma Client:', importError.message);
    console.error('   The Prisma Client may not be generated correctly.');
    console.error('\n   Run: npx prisma generate\n');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ ERROR: Failed to verify Prisma Client:', error.message);
  process.exit(1);
}
