import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env.local file.');
  process.exit(1);
}

// Initialize Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile(filePath) {
  try {
    console.log(`Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log('Executing SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return false;
    }
    
    console.log('SQL executed successfully!');
    return true;
  } catch (err) {
    console.error('Error:', err.message);
    return false;
  }
}

async function main() {
  const sqlFilePath = path.resolve('./add-product-discounts.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`SQL file not found: ${sqlFilePath}`);
    process.exit(1);
  }
  
  const success = await executeSQLFile(sqlFilePath);
  
  if (success) {
    console.log('Database updated successfully with product discount fields.');
  } else {
    console.error('Failed to update database. Check logs for details.');
    process.exit(1);
  }
}

main();
