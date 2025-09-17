-- Drop the problematic polymorphic foreign key constraints from Comment table
-- These constraints were causing 500 errors when creating comments

-- Drop the foreign key constraints that enforce polymorphic relationships
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "comment_client_fk";
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "comment_property_fk"; 
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "comment_lead_fk";
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "comment_opportunity_fk";
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "comment_transaction_fk";

-- The Comment table will still have entityType and entityId columns for polymorphic relationships
-- but without the problematic foreign key constraints that were causing database violations
