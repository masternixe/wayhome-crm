-- Drop the problematic polymorphic foreign key constraints from Comment table
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "comment_client_fk";
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "comment_property_fk"; 
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "comment_lead_fk";
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "comment_opportunity_fk";
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "comment_transaction_fk";
