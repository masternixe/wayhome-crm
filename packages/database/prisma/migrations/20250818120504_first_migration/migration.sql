-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'OFFICE_ADMIN', 'MANAGER', 'AGENT', 'PUBLIC_USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('EUR', 'ALL');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'VILLA', 'LAND', 'COMMERCIAL', 'OFFICE');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('LISTED', 'UNDER_OFFER', 'SOLD', 'RENTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED');

-- CreateEnum
CREATE TYPE "OpportunityStage" AS ENUM ('PROSPECT', 'NEGOTIATION', 'OFFER', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SALE', 'RENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('OPEN', 'PENDING', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('CLIENT', 'PROPERTY', 'LEAD', 'OPPORTUNITY', 'TRANSACTION');

-- CreateEnum
CREATE TYPE "PointActionType" AS ENUM ('LEAD_CREATED', 'PROPERTY_LISTED', 'NEGOTIATION_DISCOUNT', 'COLLABORATION_SALE', 'SALE_CLOSED', 'RENT_CLOSED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Office" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "officeId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "targetSales" INTEGER NOT NULL DEFAULT 0,
    "targetRentals" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isAgentOfMonth" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "preferredCurrency" "Currency" NOT NULL DEFAULT 'EUR',
    "notes" TEXT,
    "ownerAgentId" TEXT,
    "officeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "agentOwnerId" TEXT NOT NULL,
    "collaboratingAgentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL,
    "city" TEXT NOT NULL,
    "zona" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "siperfaqeMin" DOUBLE PRECISION NOT NULL,
    "siperfaqeMax" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'EUR',
    "ashensor" BOOLEAN NOT NULL DEFAULT false,
    "status" "PropertyStatus" NOT NULL DEFAULT 'LISTED',
    "badges" TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "gallery" TEXT[],
    "virtualTourUrl" TEXT,
    "yearBuilt" INTEGER,
    "parkingSpaces" INTEGER,
    "balcony" BOOLEAN NOT NULL DEFAULT false,
    "garden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyPriceHistory" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "oldPrice" DOUBLE PRECISION NOT NULL,
    "newPrice" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyView" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "viewedBy" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "leadNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "rikontakt" TIMESTAMP(3),
    "assignedToId" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "industry" TEXT,
    "leadSource" TEXT,
    "description" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "leadId" TEXT,
    "interestedPropertyId" TEXT,
    "notes" TEXT,
    "stage" "OpportunityStage" NOT NULL DEFAULT 'PROSPECT',
    "estimatedValue" DOUBLE PRECISION,
    "probability" INTEGER,
    "expectedCloseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'OPEN',
    "propertyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "primaryAgentId" TEXT NOT NULL,
    "collaboratingAgentId" TEXT,
    "splitRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "closeDate" TIMESTAMP(3),
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "commissionAmount" DOUBLE PRECISION NOT NULL,
    "agentSharePrimary" DOUBLE PRECISION NOT NULL,
    "agentShareCollaborator" DOUBLE PRECISION,
    "currency" "Currency" NOT NULL DEFAULT 'EUR',
    "contractNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "relatedToType" "EntityType" NOT NULL,
    "relatedToId" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "recurrence" TEXT,
    "reminder" BOOLEAN NOT NULL DEFAULT true,
    "reminderSentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsLedger" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "actionType" "PointActionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VacancyApplication" (
    "id" TEXT NOT NULL,
    "officeId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "cvUrl" TEXT NOT NULL,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VacancyApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicUser" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifyToken" TEXT,
    "resetToken" TEXT,
    "resetExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserListing" (
    "id" TEXT NOT NULL,
    "publicUserId" TEXT NOT NULL,
    "officeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zona" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "siperfaqe" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'EUR',
    "status" "ListingStatus" NOT NULL DEFAULT 'PENDING',
    "gallery" TEXT[],
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "convertedToPropertyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiddingSlot" (
    "id" TEXT NOT NULL,
    "userListingId" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL,
    "stripePaymentId" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "slotPosition" INTEGER NOT NULL,
    "activeUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BiddingSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "variables" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "publicUserId" TEXT,
    "name" TEXT,
    "criteria" JSONB NOT NULL,
    "frequency" TEXT,
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearchProperty" (
    "id" TEXT NOT NULL,
    "savedSearchId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "SavedSearchProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "lastUpdatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Office_brandId_idx" ON "Office"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_officeId_idx" ON "User"("officeId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_managerId_idx" ON "User"("managerId");

-- CreateIndex
CREATE INDEX "Client_ownerAgentId_idx" ON "Client"("ownerAgentId");

-- CreateIndex
CREATE INDEX "Client_officeId_idx" ON "Client"("officeId");

-- CreateIndex
CREATE INDEX "Client_mobile_idx" ON "Client"("mobile");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Property_officeId_idx" ON "Property"("officeId");

-- CreateIndex
CREATE INDEX "Property_agentOwnerId_idx" ON "Property"("agentOwnerId");

-- CreateIndex
CREATE INDEX "Property_collaboratingAgentId_idx" ON "Property"("collaboratingAgentId");

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "Property"("city");

-- CreateIndex
CREATE INDEX "Property_zona_idx" ON "Property"("zona");

-- CreateIndex
CREATE INDEX "Property_type_idx" ON "Property"("type");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Property_price_idx" ON "Property"("price");

-- CreateIndex
CREATE INDEX "Property_featured_idx" ON "Property"("featured");

-- CreateIndex
CREATE INDEX "Property_title_description_idx" ON "Property"("title", "description");

-- CreateIndex
CREATE INDEX "PropertyPriceHistory_propertyId_idx" ON "PropertyPriceHistory"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyView_propertyId_idx" ON "PropertyView"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyView_viewedBy_idx" ON "PropertyView"("viewedBy");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_leadNumber_key" ON "Lead"("leadNumber");

-- CreateIndex
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");

-- CreateIndex
CREATE INDEX "Lead_officeId_idx" ON "Lead"("officeId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_leadNumber_idx" ON "Lead"("leadNumber");

-- CreateIndex
CREATE INDEX "Lead_mobile_idx" ON "Lead"("mobile");

-- CreateIndex
CREATE INDEX "Opportunity_officeId_idx" ON "Opportunity"("officeId");

-- CreateIndex
CREATE INDEX "Opportunity_clientId_idx" ON "Opportunity"("clientId");

-- CreateIndex
CREATE INDEX "Opportunity_interestedPropertyId_idx" ON "Opportunity"("interestedPropertyId");

-- CreateIndex
CREATE INDEX "Opportunity_stage_idx" ON "Opportunity"("stage");

-- CreateIndex
CREATE INDEX "Opportunity_leadId_idx" ON "Opportunity"("leadId");

-- CreateIndex
CREATE INDEX "Transaction_officeId_idx" ON "Transaction"("officeId");

-- CreateIndex
CREATE INDEX "Transaction_propertyId_idx" ON "Transaction"("propertyId");

-- CreateIndex
CREATE INDEX "Transaction_clientId_idx" ON "Transaction"("clientId");

-- CreateIndex
CREATE INDEX "Transaction_primaryAgentId_idx" ON "Transaction"("primaryAgentId");

-- CreateIndex
CREATE INDEX "Transaction_collaboratingAgentId_idx" ON "Transaction"("collaboratingAgentId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_closeDate_idx" ON "Transaction"("closeDate");

-- CreateIndex
CREATE INDEX "Task_officeId_idx" ON "Task"("officeId");

-- CreateIndex
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "Task_relatedToType_relatedToId_idx" ON "Task"("relatedToType", "relatedToId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "Comment_officeId_idx" ON "Comment"("officeId");

-- CreateIndex
CREATE INDEX "Comment_entityType_entityId_idx" ON "Comment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");

-- CreateIndex
CREATE INDEX "PointsLedger_agentId_idx" ON "PointsLedger"("agentId");

-- CreateIndex
CREATE INDEX "PointsLedger_actionType_idx" ON "PointsLedger"("actionType");

-- CreateIndex
CREATE INDEX "PointsLedger_createdAt_idx" ON "PointsLedger"("createdAt");

-- CreateIndex
CREATE INDEX "VacancyApplication_officeId_idx" ON "VacancyApplication"("officeId");

-- CreateIndex
CREATE INDEX "VacancyApplication_email_idx" ON "VacancyApplication"("email");

-- CreateIndex
CREATE INDEX "VacancyApplication_createdAt_idx" ON "VacancyApplication"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicUser_email_key" ON "PublicUser"("email");

-- CreateIndex
CREATE INDEX "PublicUser_email_idx" ON "PublicUser"("email");

-- CreateIndex
CREATE INDEX "UserListing_publicUserId_idx" ON "UserListing"("publicUserId");

-- CreateIndex
CREATE INDEX "UserListing_officeId_idx" ON "UserListing"("officeId");

-- CreateIndex
CREATE INDEX "UserListing_status_idx" ON "UserListing"("status");

-- CreateIndex
CREATE INDEX "UserListing_city_idx" ON "UserListing"("city");

-- CreateIndex
CREATE INDEX "UserListing_zona_idx" ON "UserListing"("zona");

-- CreateIndex
CREATE UNIQUE INDEX "BiddingSlot_userListingId_key" ON "BiddingSlot"("userListingId");

-- CreateIndex
CREATE INDEX "BiddingSlot_slotPosition_idx" ON "BiddingSlot"("slotPosition");

-- CreateIndex
CREATE INDEX "BiddingSlot_activeUntil_idx" ON "BiddingSlot"("activeUntil");

-- CreateIndex
CREATE INDEX "BiddingSlot_amountPaid_idx" ON "BiddingSlot"("amountPaid");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_name_key" ON "EmailTemplate"("name");

-- CreateIndex
CREATE INDEX "EmailTemplate_name_idx" ON "EmailTemplate"("name");

-- CreateIndex
CREATE INDEX "SavedSearch_userId_idx" ON "SavedSearch"("userId");

-- CreateIndex
CREATE INDEX "SavedSearch_publicUserId_idx" ON "SavedSearch"("publicUserId");

-- CreateIndex
CREATE INDEX "SavedSearchProperty_savedSearchId_idx" ON "SavedSearchProperty"("savedSearchId");

-- CreateIndex
CREATE INDEX "SavedSearchProperty_propertyId_idx" ON "SavedSearchProperty"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedSearchProperty_savedSearchId_propertyId_key" ON "SavedSearchProperty"("savedSearchId", "propertyId");

-- CreateIndex
CREATE INDEX "Document_transactionId_idx" ON "Document"("transactionId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "SystemSettings_key_idx" ON "SystemSettings"("key");

-- AddForeignKey
ALTER TABLE "Office" ADD CONSTRAINT "Office_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_ownerAgentId_fkey" FOREIGN KEY ("ownerAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_agentOwnerId_fkey" FOREIGN KEY ("agentOwnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_collaboratingAgentId_fkey" FOREIGN KEY ("collaboratingAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyPriceHistory" ADD CONSTRAINT "PropertyPriceHistory_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyView" ADD CONSTRAINT "PropertyView_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_interestedPropertyId_fkey" FOREIGN KEY ("interestedPropertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_primaryAgentId_fkey" FOREIGN KEY ("primaryAgentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_collaboratingAgentId_fkey" FOREIGN KEY ("collaboratingAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "task_client_fk" FOREIGN KEY ("relatedToId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "task_property_fk" FOREIGN KEY ("relatedToId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "task_lead_fk" FOREIGN KEY ("relatedToId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "task_opportunity_fk" FOREIGN KEY ("relatedToId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "task_transaction_fk" FOREIGN KEY ("relatedToId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "comment_client_fk" FOREIGN KEY ("entityId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "comment_property_fk" FOREIGN KEY ("entityId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "comment_lead_fk" FOREIGN KEY ("entityId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "comment_opportunity_fk" FOREIGN KEY ("entityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "comment_transaction_fk" FOREIGN KEY ("entityId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLedger" ADD CONSTRAINT "PointsLedger_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacancyApplication" ADD CONSTRAINT "VacancyApplication_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserListing" ADD CONSTRAINT "UserListing_publicUserId_fkey" FOREIGN KEY ("publicUserId") REFERENCES "PublicUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserListing" ADD CONSTRAINT "UserListing_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingSlot" ADD CONSTRAINT "BiddingSlot_userListingId_fkey" FOREIGN KEY ("userListingId") REFERENCES "UserListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearchProperty" ADD CONSTRAINT "SavedSearchProperty_savedSearchId_fkey" FOREIGN KEY ("savedSearchId") REFERENCES "SavedSearch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearchProperty" ADD CONSTRAINT "SavedSearchProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
