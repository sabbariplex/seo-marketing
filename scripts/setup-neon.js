#!/usr/bin/env node

/**
 * Neon Database Setup Script
 * This script helps you set up your Neon database connection
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log('\n🚀 Neon Database Setup\n');
  console.log('To get your Neon connection string:');
  console.log('1. Go to https://console.neon.tech');
  console.log('2. Select your project');
  console.log('3. Click "Connection Details"');
  console.log('4. Copy the connection string\n');

  const connectionString = await question('Paste your Neon DATABASE_URL here: ');

  if (!connectionString || !connectionString.startsWith('postgresql://')) {
    console.error('\n❌ Invalid connection string. It should start with "postgresql://"');
    process.exit(1);
  }

  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';

  // Read existing .env.local if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add DATABASE_URL
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(
      /DATABASE_URL=.*/g,
      `DATABASE_URL="${connectionString}"`
    );
  } else {
    envContent += `\n# Neon Database Connection\nDATABASE_URL="${connectionString}"\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ DATABASE_URL has been added to .env.local');
  console.log('\nNext steps:');
  console.log('1. Run: npx prisma migrate deploy');
  console.log('2. Run: npx prisma generate');
  console.log('3. Add the same DATABASE_URL to Vercel environment variables');
  console.log('\n');

  rl.close();
}

setup().catch(console.error);
