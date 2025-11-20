-- Remove unique constraint from request_id in beasts table
ALTER TABLE beasts DROP CONSTRAINT IF EXISTS beasts_request_id_key;