/**
 * Script to apply beast lock columns migration programmatically
 * 
 * This script reads the SQL migration file and executes it against the database.
 * 
 * Run with: npx tsx migrations/apply_beast_lock_migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function applyMigration() {
  console.log('🚀 Applying beast lock columns migration...\n')

  try {
    // Read the migration SQL file
    const migrationPath = join(__dirname, 'add_beast_lock_columns.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration SQL loaded from:', migrationPath)
    console.log('📝 Executing migration...\n')

    // Split the SQL into individual statements (excluding comments and empty lines)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement) continue

      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message)
        console.error('Statement:', statement.substring(0, 100) + '...')
        
        // Check if it's a "column already exists" error - this is okay
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('⚠️  Column or index already exists, continuing...\n')
          continue
        }
        
        return false
      }
      
      console.log(`✅ Statement ${i + 1} executed successfully\n`)
    }

    console.log('✅ Migration applied successfully!')
    return true

  } catch (error: any) {
    console.error('❌ Unexpected error during migration:', error.message)
    
    // If the RPC function doesn't exist, provide instructions
    if (error.message?.includes('exec_sql')) {
      console.log('\n⚠️  The exec_sql RPC function is not available.')
      console.log('   Please apply the migration manually using the Supabase SQL Editor:')
      console.log('   1. Open Supabase Dashboard → SQL Editor')
      console.log('   2. Copy contents of migrations/add_beast_lock_columns.sql')
      console.log('   3. Paste and execute in SQL Editor')
      console.log('   4. Run verification: npx tsx migrations/verify_beast_lock_migration.ts\n')
    }
    
    return false
  }
}

// Run migration
applyMigration().then(success => {
  process.exit(success ? 0 : 1)
})
