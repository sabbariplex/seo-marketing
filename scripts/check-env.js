// Check if DATABASE_URL is set before running database operations
if (!process.env.DATABASE_URL) {
  console.error('\n❌ ERROR: DATABASE_URL environment variable is not set!');
  console.error('\nPlease add DATABASE_URL to Vercel:');
  console.error('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  console.error('2. Add DATABASE_URL with your Supabase connection string');
  console.error('3. Redeploy your application\n');
  process.exit(1);
}

console.log('✓ DATABASE_URL is set');
