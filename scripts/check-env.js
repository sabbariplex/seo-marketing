// Load environment variables from .env.local if it exists
try {
  const path = require('path');
  const fs = require('fs');
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    // Simple env file parser
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        const value = values.join('=').replace(/^["']|["']$/g, '');
        if (key && value) {
          process.env[key.trim()] = value;
        }
      }
    });
  }
} catch (e) {
  // Silently ignore if .env.local can't be loaded
}

// Check if DATABASE_URL is set before running database operations
// For Vercel builds, allow the build to proceed as DATABASE_URL is usually set as an environment variable
const isVercelBuild = process.env.VERCEL === '1' || process.env.CI === 'true';

if (!process.env.DATABASE_URL) {
  // In Vercel builds, DATABASE_URL should be set as an environment variable
  // If it's missing, we still allow the build to proceed to avoid blocking deployment preview
  if (isVercelBuild) {
    console.warn('⚠ WARNING: DATABASE_URL is not set in this build environment');
    console.warn('   Make sure DATABASE_URL is configured in Vercel Environment Variables');
    console.log('✓ Proceeding with build (DATABASE_URL will be needed at runtime)');
    process.exit(0);
  } else {
    // Local development - require DATABASE_URL
    console.error('\n❌ ERROR: DATABASE_URL environment variable is not set!');
    console.error('\nPlease add DATABASE_URL to your .env.local file or Vercel:');
    console.error('1. Create/update .env.local with DATABASE_URL=your_connection_string');
    console.error('2. Or go to Vercel Dashboard → Your Project → Settings → Environment Variables');
    console.error('3. Add DATABASE_URL with your Neon/PostgreSQL connection string\n');
    process.exit(1);
  }
}

console.log('✓ DATABASE_URL is set');
