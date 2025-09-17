-- Add ownerAgentId field to Opportunity table to track agent ownership
ALTER TABLE "Opportunity" ADD COLUMN "ownerAgentId" TEXT;

-- Add index for the new field
CREATE INDEX "Opportunity_ownerAgentId_idx" ON "Opportunity"("ownerAgentId");

-- Add foreign key constraint
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_ownerAgentId_fkey" FOREIGN KEY ("ownerAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Populate existing opportunities with agent from their client's ownerAgentId
UPDATE "Opportunity" 
SET "ownerAgentId" = "Client"."ownerAgentId"
FROM "Client" 
WHERE "Opportunity"."clientId" = "Client"."id" 
AND "Client"."ownerAgentId" IS NOT NULL;
