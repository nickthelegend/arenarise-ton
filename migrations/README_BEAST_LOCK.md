# Beast Lock Columns Migration

## Overview

This migration adds `beast1_locked` and `beast2_locked` columns to the `battles` table to support the new PVP battle flow where players select beasts after entering a room.

## Files

- `add_beast_lock_columns.sql` - The migration SQL script
- `verify_beast_lock_migration.test.ts` - Automated verification tests

## How to Apply the Migration

### Step 1: Run the SQL Migration

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open the file `migrations/add_beast_lock_columns.sql`
4. Copy the entire contents
5. Paste into the Supabase SQL Editor
6. Click "Run" to execute the migration

### Step 2: Verify the Migration

After running the SQL migration, verify it was successful by running the test suite:

```bash
npm test migrations/verify_beast_lock_migration.test.ts
```

All tests should pass if the migration was applied correctly.

## What This Migration Does

1. **Adds two new columns:**
   - `beast1_locked` (BOOLEAN, default FALSE)
   - `beast2_locked` (BOOLEAN, default FALSE)

2. **Creates a performance index:**
   - Composite index on `(status, battle_type)` for faster queries

3. **Updates existing data:**
   - Sets `beast1_locked = TRUE` for battles where `beast1_id` is not null
   - Sets `beast2_locked = TRUE` for battles where `beast2_id` is not null

4. **Adds documentation:**
   - Column comments explaining the purpose of each field

## Expected Test Results

### Before Migration
```
✗ should have beast1_locked and beast2_locked columns in battles table
  Error: column battles.beast1_locked does not exist
```

### After Migration
```
✓ should have beast1_locked and beast2_locked columns in battles table
✓ should have boolean type for lock columns
✓ should have default value of false for new battles
✓ should not affect existing battles count
✓ should have locked=true for battles with existing beast selections
✓ should be able to query battles with status and battle_type (index test)
```

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove the columns
ALTER TABLE battles DROP COLUMN IF EXISTS beast1_locked;
ALTER TABLE battles DROP COLUMN IF EXISTS beast2_locked;

-- Remove the index
DROP INDEX IF EXISTS idx_battles_status_type;
```

## Requirements Validated

This migration satisfies:
- Requirement 9.1: Battle room initialization with proper state tracking
- Requirement 9.2: Beast selection recording in database
